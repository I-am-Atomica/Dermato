// --- Global Setup ---
const API_KEY = "AIzaSyDgjL0IZ1PuBAHAu2Y42BVJGmSGVj37dqI"; 

const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;

const SYSTEM_INSTRUCTION = `You are the Dermato AI Assistant. Structure advice using clear Markdown. If an image is provided, analyze the skin condition or product professionally. Keep responses concise.`;

// --- UI Elements ---
const chatMessagesDiv = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const fileInput = document.getElementById('file-input');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image');

// State
let currentImageBase64 = null;
let currentImageMimeType = null;

// --- 1. STARTUP SEQUENCE ---
window.onload = function() {
    if (typeof anime === 'undefined') {
        console.error("Anime.js is not loaded!");
        startMainAppFlow();
        return;
    }

    const mainSplashScreen = document.getElementById('splash-screen');
    const splashText = mainSplashScreen.querySelector('.splash-text');
    
    // Prepare Letters
    splashText.innerHTML = splashText.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
    splashText.style.opacity = '1';
    mainSplashScreen.classList.remove('hidden');

    // Splash Timeline
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
    .add({ duration: 1000 }) // Wait
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
        
        // Pop In Animation
        anime({
            targets: '.chat-container',
            scale: [0.9, 1],
            opacity: [0, 1],
            duration: 800,
            easing: 'easeOutElastic(1, .8)'
        });
    }

    // Start Ambient Effects
    startAmbientParticles();
    animateTitle();

    setupEventListeners();
    addMessage("Sup homie, I am Mato... Dermato. Send me a photo or ask a question!", false);
}

// --- 2. AMBIENT EFFECTS ---

// A. Floating "Serum" Bubbles
function startAmbientParticles() {
    const container = document.getElementById('particles-container');
    if(!container) return;
    
    const particleCount = 15; // Number of bubbles

    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        container.appendChild(p);

        // Random Initial State
        anime.set(p, {
            x: anime.random(0, window.innerWidth),
            y: anime.random(0, window.innerHeight),
            scale: anime.random(0.2, 1.5),
            opacity: anime.random(0.1, 0.4)
        });

        animateParticle(p);
    }
}

function animateParticle(el) {
    anime({
        targets: el,
        y: [{ value: '-=100', duration: anime.random(3000, 8000) }],
        x: [
             { value: '+=50', duration: anime.random(2000, 5000), easing: 'easeInOutSine' },
             { value: '-=50', duration: anime.random(2000, 5000), easing: 'easeInOutSine' }
        ],
        opacity: [
            { value: 0, duration: 1000, easing: 'linear' },
            { value: anime.random(0.1, 0.4), duration: 1000, easing: 'linear' }
        ],
        scale: [
             { value: 0, duration: 1000, easing: 'easeOutSine' },
             { value: anime.random(0.2, 1.5), duration: 1000, easing: 'easeInSine' }
        ],
        delay: anime.random(0, 5000),
        duration: anime.random(5000, 10000),
        loop: true,
        direction: 'alternate',
        easing: 'linear'
    });
}

// B. Decoding Title Effect
function animateTitle() {
    const title = document.querySelector('h1');
    const originalText = "Dermato";
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    let iterations = 0;
    
    anime({
        targets: { val: 0 },
        val: 100,
        round: 1,
        duration: 1500,
        easing: 'easeOutExpo',
        update: function() {
            title.innerText = originalText.split("")
                .map((letter, index) => {
                    if (index < iterations) return originalText[index];
                    return letters[Math.floor(Math.random() * letters.length)];
                })
                .join("");
            iterations += 1 / 2; 
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
    if (element.querySelector('img')) {
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

// --- 4. IMAGE & API LOGIC ---

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

function addMessage(text, isUser = false, imageUrl = null) {
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

    const textSpan = document.createElement('div');
    if (typeof marked !== 'undefined') {
        textSpan.innerHTML = isUser ? text : marked.parse(text);
    } else {
        textSpan.innerText = text;
    }
    
    messageText.appendChild(textSpan);
    messageDiv.appendChild(messageText);
    chatMessagesDiv.appendChild(messageDiv);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;

    animateNewMessage(messageDiv);
}

async function callGeminiApi(userQuery, imageData) {
    const parts = [{ text: userQuery }];
    if (imageData) {
        parts.push({
            inlineData: { mimeType: imageData.mimeType, data: imageData.data }
        });
    }

    const payload = {
        contents: [{ parts: parts }],
        // tools: [{ "google_search": {} }], 
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
    if (userQuery === "" && !currentImageBase64) return;

    animateButton();

    const imageToSend = currentImageBase64 ? { mimeType: currentImageMimeType, data: currentImageBase64 } : null;
    const previewUrl = imagePreview.src;

    addMessage(userQuery, true, imageToSend ? previewUrl : null);

    userInput.value = '';
    clearImageSelection();
    sendButton.disabled = true;

    const typingIndicator = addTypingIndicator();

    try {
        const responseData = await callGeminiApi(userQuery || "Analyze this image", imageToSend);
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
