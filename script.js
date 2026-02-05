// --- Global Setup ---
const API_KEY = "AIzaSyCqTHjq48mqB8tXC9G2qsefsrqnQ2JQjVg"; 

// --- Gemini Configuration ---
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;

const SYSTEM_INSTRUCTION = `You are the Dermato AI Assistant, a friendly, professional, and highly knowledgeable virtual skincare advisor. You must structure all your advice using clear, valid Markdown formatting. If the user provides an image, analyze the skin condition, product label, or ingredients visible in the image professionally. Keep responses concise.`;

// --- UI Elements ---
const chatMessagesDiv = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const fileInput = document.getElementById('file-input');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image');

// State for the uploaded image
let currentImageBase64 = null;
let currentImageMimeType = null;

// --- Main App Flow ---
function startMainAppFlow() {
    const chatContainer = document.querySelector('.chat-container');
    chatContainer.classList.remove('hidden');

    setupEventListeners();

    addMessage("Sup homie, I am Mato... Dermato. Send me a photo of a product or a skin concern, and I'll do my best to help!", false);
}

function setupEventListeners() {
    // Send Button & Enter Key
    sendButton.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });

    // File Input Change
    fileInput.addEventListener('change', handleFileSelect);

    // Remove Image Button
    removeImageBtn.addEventListener('click', clearImageSelection);
}

// --- Image Handling Logic ---
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
        alert("Please upload an image file (PNG, JPG, WEBP).");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        // 1. Show Preview
        imagePreview.src = reader.result;
        imagePreviewContainer.classList.remove('hidden');

        // 2. Store Base64 (Remove the "data:image/jpeg;base64," prefix for API)
        const base64String = reader.result.split(',')[1];
        currentImageBase64 = base64String;
        currentImageMimeType = file.type;
    };
    reader.readAsDataURL(file);
}

function clearImageSelection() {
    fileInput.value = ''; // Reset input
    currentImageBase64 = null;
    currentImageMimeType = null;
    imagePreview.src = '';
    imagePreviewContainer.classList.add('hidden');
}

// --- Messaging Functions ---
function addMessage(text, isUser = false, imageUrl = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';

    // If there is an image, append it first
    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'message-image';
        messageText.appendChild(img);
    }

    // Append text (parsed markdown)
    const textSpan = document.createElement('div');
    textSpan.innerHTML = isUser ? text : marked.parse(text);
    messageText.appendChild(textSpan);
    
    messageDiv.appendChild(messageText);
    chatMessagesDiv.appendChild(messageDiv);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

async function callGeminiApi(userQuery, imageData) {
    // Construct Parts: Always include text, optionally include image
    const parts = [{ text: userQuery }];
    
    if (imageData) {
        parts.push({
            inlineData: {
                mimeType: imageData.mimeType,
                data: imageData.data
            }
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

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const result = await response.json();
        const candidate = result.candidates?.[0];
        
        if (candidate?.content?.parts?.[0]?.text) {
            return { text: candidate.content.parts[0].text, sources: [] }; // Simplified sources for now
        }
        return { text: "I couldn't analyze that. Please try again.", sources: [] };

    } catch (error) {
        console.error("Gemini API Error:", error);
        return { text: "Sorry, connection error. Please try again.", sources: [] };
    }
}

async function handleSendMessage() {
    const userQuery = userInput.value.trim();
    // Allow sending if there is text OR an image
    if (userQuery === "" && !currentImageBase64) return;

    // Capture current image state to pass to function (in case user clears it while waiting)
    const imageToSend = currentImageBase64 ? { mimeType: currentImageMimeType, data: currentImageBase64 } : null;
    const previewUrl = imagePreview.src; // Save for display

    // Display User Message
    addMessage(userQuery, true, imageToSend ? previewUrl : null);

    // Clear Inputs immediately
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
    const messageText = document.createElement('div');
    messageText.className = 'message-text typing-indicator-container';
    messageText.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    messageDiv.appendChild(messageText);
    chatMessagesDiv.appendChild(messageDiv);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight; 
    return messageDiv;
}

// --- Splash Screen Logic ---
window.onload = function() {
    const mainSplashScreen = document.getElementById('splash-screen');
    const splashText = mainSplashScreen.querySelector('.splash-text');
    
    mainSplashScreen.classList.remove('hidden');
    splashText.classList.add('animate');

    setTimeout(() => {
            mainSplashScreen.classList.add('hidden');
            setTimeout(startMainAppFlow, 500); 
    }, 3000); 
}
