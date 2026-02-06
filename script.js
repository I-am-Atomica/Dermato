// --- Global Setup ---
const API_KEY = "AIzaSyCqTHjq48mqB8tXC9G2qsefsrqnQ2JQjVg"; 

// --- Gemini Configuration ---
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

// --- 1. SPLASH SCREEN (Anime.js Timeline) ---
window.onload = function() {
    const mainSplashScreen = document.getElementById('splash-screen');
    const splashText = mainSplashScreen.querySelector('.splash-text');
    
    // Split text into letters for individual animation
    splashText.innerHTML = splashText.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
    splashText.style.opacity = 1; 
    
    mainSplashScreen.classList.remove('hidden');

    // Create a timeline
    const tl = anime.timeline({
        easing: 'easeOutExpo',
        duration: 1000
    });

    tl
    // 1. Letters float in and expand
    .add({
        targets: '.splash-text .letter',
        scale: [0, 1],
        opacity: [0, 1],
        translateY: ["1.5em", 0],
        translateZ: 0,
        duration: 1200,
        delay: anime.stagger(100) // 100ms delay between each letter
    })
    // 2. Pause to let user read
    .add({
        duration: 1000 
    })
    // 3. Fade out and scale down
    .add({
        targets: '.splash-text',
        opacity: 0,
        scale: 1.5, // Zooms out while fading
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
    chatContainer.classList.remove('hidden');
    
    // Animate the container popping in
    anime({
        targets: '.chat-container',
        scale: [0.9, 1],
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutElastic(1, .8)'
    });

    setupEventListeners();
    addMessage("Sup homie, I am Mato... Dermato. Send me a photo or ask a question!", false);
}

function setupEventListeners() {
    sendButton.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });
    fileInput.addEventListener('change', handleFileSelect);
    removeImageBtn.addEventListener('click', clearImageSelection);
}

// --- 2. ANIMATION HELPERS ---

// Effect: "Hydro-Elastic" Button Click
function animateButton() {
    anime({
        targets: '#send-button',
        scale: [0.9, 1], // Squish then return
        duration: 600,
        easing: 'easeOutElastic(1, .5)' 
    });
}

// Effect: "Serum Drip" Message Entrance
function animateNewMessage(element) {
    // If it's an image, simple fade
    if (element.querySelector('img')) {
        anime({
            targets: element,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 800,
            easing: 'easeOutCubic'
        });
    } else {
        // If it's text, we can try to stagger paragraphs if any exist, 
        // otherwise just animate the whole bubble
        anime({
            targets: element,
            opacity: [0, 1],
            translateX: [-20, 0], // Slide in from left slightly
            duration: 600,
            easing: 'easeOutQuad'
        });
    }
}

// --- Image Handling ---
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
        
        // Pop in the preview
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

// --- Messaging ---
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
    textSpan.innerHTML = isUser ? text : marked.parse(text);
    messageText.appendChild(textSpan);
    
    messageDiv.appendChild(messageText);
    chatMessagesDiv.appendChild(messageDiv);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;

    // Trigger Animation on the new bubble
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
        tools: [{ "google_search": {} }], 
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    };

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error(response.status);
        const result = await response.json();
        return { text: result.candidates?.[0]?.content?.parts?.[0]?.text || "No response." };

    } catch (error) {
        console.error(error);
        return { text: "Connection error." };
    }
}

async function handleSendMessage() {
    const userQuery = userInput.value.trim();
    if (userQuery === "" && !currentImageBase64) return;

    // 1. Trigger Button Animation
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
    
    // Animate the typing indicator bubbling up
    anime({
        targets: messageDiv,
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutBack'
    });
    
    return messageDiv;
}
