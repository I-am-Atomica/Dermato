// --- Global Setup ---
const KEY_PART_A = "AQ.Ab8RN6JPnq4zuZIv2igTcpn";
const KEY_PART_B = "t47PfvqgNNfsx5tQPYZMI8NHXsQ";
const API_KEY = KEY_PART_A + KEY_PART_B; 

const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;

const SYSTEM_INSTRUCTION = `You are the Dermato AI Assistant. Structure advice using clear Markdown. If an image or audio is provided, analyze the condition or prompt professionally. Keep responses concise.`;

// --- UI Elements ---
const chatMessagesDiv = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const fileInput = document.getElementById('file-input');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image');
const micButton = document.getElementById('mic-button');
const audioPreviewContainer = document.getElementById('audio-preview-container');
const audioPreview = document.getElementById('audio-preview');
const removeAudioBtn = document.getElementById('remove-audio');
const recordingIndicator = document.getElementById('recording-indicator');
const recordingTimeDisplay = document.getElementById('recording-time');

// --- State ---
let currentImageBase64 = null;
let currentImageMimeType = null;
let isInitializing = false;
let currentAudioBase64 = null;
let currentAudioMimeType = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingTimer = null;
let recordingSeconds = 0;
const particleAnimations = []; // Tracks particles for the warp effect

// --- 1. STARTUP SEQUENCE ---
window.onload = function() {
    if (typeof anime === 'undefined') {
        console.error("Anime.js is not loaded!");
        startMainAppFlow();
        return;
    }

    const mainSplashScreen = document.getElementById('splash-screen');
    const splashText = mainSplashScreen.querySelector('.splash-text');
    
    splashText.innerHTML = splashText.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
    splashText.style.opacity = '1';
    mainSplashScreen.classList.remove('hidden');

    const tl = anime.timeline({ easing: 'easeOutExpo', duration: 1000 });

    tl.add({
        targets: '.splash-text .letter',
        scale: [0, 1],
        opacity: [0, 1],
        translateY: ["1.5em", 0],
        translateZ: 0,
        duration: 1200,
        delay: anime.stagger(100)
    })
    .add({ duration: 1000 })
    .add({
        targets: '.splash-text',
        opacity: 0,
        scale: 1.5,
        duration: 800,
        easing: 'easeInQuad',
        complete: function() {
            mainSplashScreen.classList.add('hidden');
            startMainAppFlow();
        }
    });
}

function startMainAppFlow() {
    const chatContainer = document.querySelector('.chat-container');
    if(chatContainer) {
        chatContainer.classList.remove('hidden');
        
        anime({
            targets: '.chat-container',
            scale: [0.9, 1],
            opacity: [0, 1],
            duration: 800,
            easing: 'easeOutElastic(1, .8)'
        });
    }

    startAmbientParticles();
    animateTitle();
    setupEventListeners();
    addMessage("Sup homie, I am Mato... Dermato. Send me a photo, record a voice note, or ask a question!", false);
}

// --- 2. AMBIENT EFFECTS (VFX) ---
function startAmbientParticles() {
    const container = document.getElementById('particles-container');
    if(!container) return;
    
    const particleCount = 80;

    for (let i = 0; i < particleCount; i++) {
        spawnParticle(true);
    }
}

function spawnParticle(isInitial = false) {
    const container = document.getElementById('particles-container');
    if (!container) return;

    const p = document.createElement('div');
    p.classList.add('particle');
    
    // RNG "Loot Drop" Roll (0 to 100)
    const roll = Math.random() * 100;
    let type = 'base';
    
    if (roll > 65 && roll <= 77) type = 'green';        // 12% Green
    else if (roll > 77 && roll <= 84) type = 'fat';     // 7% Fat
    else if (roll > 84 && roll <= 90) type = 'flare';   // 6% Flare
    else if (roll > 90) type = 'zoomer';                // 10% Zoomer
    
    // Default Properties
    let size = anime.random(2, 4) + 'px';
    let baseDuration = anime.random(15000, 30000);
    let opacityKeyframes = [];
    
    // Apply Class Modifications
    if (type === 'green') {
        p.classList.add('particle-green');
    } else if (type === 'fat') {
        size = anime.random(6, 12) + 'px';
        baseDuration = anime.random(40000, 60000); // Sluggish
        p.style.zIndex = '0'; // Push to back
        p.style.filter = 'blur(3px)'; // Out of focus
    } else if (type === 'zoomer') {
        p.classList.add('particle-zoomer');
        baseDuration = anime.random(1000, 3000); // Mach 5
    } else if (type === 'flare') {
        p.classList.add('particle-flare');
        size = anime.random(3, 6) + 'px';
    }

    // Apply dimensions (Skipped for zoomers to preserve CSS pill shape)
    if (type !== 'zoomer') {
        p.style.width = size;
        p.style.height = size;
    }
    
    container.appendChild(p);

    // FIX: Only base particles scatter on initial load. All specials start at the bottom.
    const startY = (isInitial && type === 'base') 
        ? anime.random(-50, window.innerHeight) 
        : window.innerHeight + 100;
        
    const endY = -150;
    
    const totalDistance = window.innerHeight + 250;
    const distanceToTravel = startY - endY;
    const duration = (distanceToTravel / totalDistance) * baseDuration;

    // Custom Opacity Keyframes
   if (type === 'flare') {
        // Strict mapping to vertical percentage via timeline duration
        opacityKeyframes = [
            { value: 0, duration: duration * 0.10 }, // 0% - 10%: Spawn invisible
            { value: 1, duration: duration * 0.25 }, // 10% - 35%: Peak intensity 
            { value: 0.6, duration: duration * 0.05 }, // 35% - 40%: Begin fade
            { value: 0, duration: duration * 0.30 }, // 40% - 70%: Fade to zero
            { value: 0, duration: duration * 0.30 }  // 70% - 100%: Stay dead
        ];
    } else {
        // Dynamic peak opacity based on particle class
        let peakOpacity;
        if (type === 'fat') {
            peakOpacity = anime.random(0.2, 0.4); // Stays dim
        } else if (type === 'zoomer') {
            peakOpacity = anime.random(0.8, 1.0); // Forces near-max opacity for visibility
        } else {
            peakOpacity = anime.random(0.4, 0.9); // Standard random fade
        }
        
        opacityKeyframes = [
            { value: 0, duration: 1000 },
            { value: peakOpacity, duration: 2000 }, 
            { value: 0, duration: 2000, delay: Math.max(0, duration - 5000) } 
        ];
    }

    p.style.top = '0px'; 
    p.style.left = anime.random(0, 100) + 'vw';
    
    anime({
        targets: p,
        translateY: [startY, endY],
        opacity: opacityKeyframes,
        duration: duration,
        easing: 'linear',
        complete: function() {
            p.remove();
            spawnParticle(false);
        }
    });
}


function animateTitle() {
    const title = document.querySelector('h1');
    const originalText = "Dermato";
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    
    anime({
        targets: { val: 0 },
        val: 100,
        round: 1,
        duration: 4000,
        easing: 'easeOutExpo',
        update: function(anim) {
            const iterations = (anim.progress / 100) * originalText.length;
            title.innerText = originalText.split("")
                .map((letter, index) => {
                    if (index < iterations) return originalText[index];
                    return letters[Math.floor(Math.random() * letters.length)];
                })
                .join("");
        }
    });
}

// --- 3. INTERACTION LOGIC ---
function setupEventListeners() {
    if(sendButton) sendButton.addEventListener('click', handleSendMessage);
    if(userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSendMessage();
        });
    }
    if(fileInput) fileInput.addEventListener('change', handleFileSelect);
    if(removeImageBtn) removeImageBtn.addEventListener('click', clearImageSelection);
    
    // Audio Listeners
    if(micButton) micButton.addEventListener('click', toggleRecording);
    if(removeAudioBtn) removeAudioBtn.addEventListener('click', clearAudioSelection);
}

function animateButton() {
    anime({
        targets: '#send-button',
        scale: [0.9, 1], 
        duration: 600,
        easing: 'easeOutElastic(1, .5)' 
    });
}

function animateNewMessage(element) {
    if (element.querySelector('img') || element.querySelector('audio')) {
        anime({
            targets: element,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 800,
            easing: 'easeOutCubic'
        });
    } else {
        anime({
            targets: element,
            opacity: [0, 1],
            translateX: [-20, 0], 
            duration: 600,
            easing: 'easeOutQuad'
        });
    }
}

// --- 4. MEDIA RECORDING & SELECTION LOGIC ---
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert("Please upload an image file.");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        imagePreview.src = reader.result;
        imagePreviewContainer.classList.remove('hidden');
        
        anime({
            targets: '#image-preview-container',
            translateY: [10, 0],
            opacity: [0, 1],
            duration: 400,
            easing: 'easeOutQuad'
        });

        currentImageBase64 = reader.result.split(',')[1];
        currentImageMimeType = file.type;
    };
    reader.readAsDataURL(file);
}

function clearImageSelection() {
    fileInput.value = '';
    currentImageBase64 = null;
    currentImageMimeType = null;
    imagePreviewContainer.classList.add('hidden');
}

async function toggleRecording() {
    if (isInitializing) return;
    
    if (isRecording) {
        stopRecording();
    } else {
        isInitializing = true;
        await startRecording();
        isInitializing = false;
    }
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunks.push(event.data);
        };

        mediaRecorder.onstop = processAudio;
        mediaRecorder.start();
        isRecording = true;

        micButton.classList.add('recording');
        audioPreviewContainer.classList.remove('hidden');
        recordingIndicator.classList.remove('hidden');
        audioPreview.classList.add('hidden');
        removeAudioBtn.classList.add('hidden');
        
        recordingSeconds = 0;
        recordingTimeDisplay.innerText = "0:00";
        
        // Clear any rogue intervals before starting a new one
        clearInterval(recordingTimer);
        recordingTimer = setInterval(() => {
            recordingSeconds++;
            const mins = Math.floor(recordingSeconds / 60);
            const secs = (recordingSeconds % 60).toString().padStart(2, '0');
            recordingTimeDisplay.innerText = `${mins}:${secs}`;
        }, 1000);

    } catch (err) {
        console.error("Microphone access denied:", err);
        alert("Please allow microphone access to record voice notes.");
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    
    isRecording = false;
    clearInterval(recordingTimer);
    micButton.classList.remove('recording');
    recordingIndicator.classList.add('hidden');
}

function processAudio() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    audioPreview.src = audioUrl;
    audioPreview.classList.remove('hidden');
    removeAudioBtn.classList.remove('hidden');

    const reader = new FileReader();
    reader.onloadend = () => {
        currentAudioBase64 = reader.result.split(',')[1];
        currentAudioMimeType = 'audio/webm';
    };
    reader.readAsDataURL(audioBlob);
}

function clearAudioSelection() {
    currentAudioBase64 = null;
    currentAudioMimeType = null;
    audioPreview.src = "";
    audioPreviewContainer.classList.add('hidden');
}

// --- 5. CHAT & API LOGIC ---
function addMessage(text, isUser = false, imageUrl = null, audioUrl = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'message-image';
        messageText.appendChild(img);
    }
    
    if (audioUrl) {
        const audio = document.createElement('audio');
        audio.src = audioUrl;
        audio.controls = true;
        audio.className = 'message-audio';
        messageText.appendChild(audio);
    }

    const textSpan = document.createElement('div');
    if (typeof marked !== 'undefined' && text) {
        textSpan.innerHTML = isUser ? text : marked.parse(text);
    } else if (text) {
        textSpan.innerText = text;
    }
    
    messageText.appendChild(textSpan);
    messageDiv.appendChild(messageText);
    chatMessagesDiv.appendChild(messageDiv);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;

    animateNewMessage(messageDiv);
}

async function callGeminiApi(userQuery, imageData, audioData) {
    const parts = [];
    if (userQuery) parts.push({ text: userQuery });
    
    if (imageData) {
        parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.data } });
    }
    if (audioData) {
        parts.push({ inlineData: { mimeType: audioData.mimeType, data: audioData.data } });
    }

    // Context-specific fallback prompts
    if (!userQuery) {
        if (imageData && audioData) {
            parts.push({ text: "Listen to the voice note regarding this skin condition image." });
        } else if (imageData) {
            parts.push({ text: "Analyze this image." });
        } else if (audioData) {
            parts.push({ text: "Listen to this voice note and respond accordingly." });
        }
    }

    const payload = {
        contents: [{ parts: parts }],
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    };

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || response.statusText;
            return { text: `API Connection Failed (${response.status}): ${errorMessage}` };
        }

        const result = await response.json();
        return { text: result.candidates?.[0]?.content?.parts?.[0]?.text || "No response." };

    } catch (error) {
        console.error("Gemini API Error details:", error);
        return { text: `Critical Error: ${error.message}` };
    }
}

async function handleSendMessage() {
    const userQuery = userInput.value.trim();
    if (userQuery === "" && !currentImageBase64 && !currentAudioBase64) return;

    animateButton();
    triggerParticleWarp(); // Triggers the particle speed boost

    const imageToSend = currentImageBase64 ? { mimeType: currentImageMimeType, data: currentImageBase64 } : null;
    const audioToSend = currentAudioBase64 ? { mimeType: currentAudioMimeType, data: currentAudioBase64 } : null;
    
    const imagePreviewUrl = imageToSend ? imagePreview.src : null;
    const audioPreviewUrl = audioToSend ? audioPreview.src : null;

    addMessage(userQuery, true, imagePreviewUrl, audioPreviewUrl);

    userInput.value = '';
    clearImageSelection();
    clearAudioSelection();
    sendButton.disabled = true;

    const typingIndicator = addTypingIndicator();

    try {
        const responseData = await callGeminiApi(userQuery, imageToSend, audioToSend);
        typingIndicator.remove();
        addMessage(responseData.text, false);
    } catch (error) {
        typingIndicator.remove();
        addMessage(`Error: ${error.message}`, false);
    } finally {
        sendButton.disabled = false;
    }
}

function addTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    messageDiv.innerHTML = `<div class="message-text typing-indicator-container"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
    chatMessagesDiv.appendChild(messageDiv);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight; 
    
    anime({
        targets: messageDiv,
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutBack'
    });
    return messageDiv;
}
