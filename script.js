import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Set Firebase log level for debugging
setLogLevel('Debug');

// --- Global Setup (Required by Canvas environment) ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let db;
let auth;
let userId = null;
let isAuthReady = false;

// --- Initialize Firebase and Authentication ---
async function initializeFirebase() {
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        // Handle authentication
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                userId = user.uid;
            } else {
                // If no token, sign in anonymously
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                    userId = auth.currentUser.uid;
                } else {
                    await signInAnonymously(auth);
                    userId = auth.currentUser.uid;
                }
            }
            isAuthReady = true;
            console.log("Firebase Auth Ready. User ID:", userId);
        });
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
}

// --- Main App Flow: Start Chat and Listeners ---
function startMainAppFlow() {
    // 1. Show the main chat interface
    const chatContainer = document.querySelector('.chat-container');
    chatContainer.classList.remove('hidden');

    // 2. Setup message listeners and event handlers
    setupChatListeners();
    document.getElementById('send-button').addEventListener('click', handleSendMessage);
    document.getElementById('user-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });

    // Send an initial message
    addMessage("Sup homie, I am Mato... Dermato, Made by the suffering dwelled with Atomica and the kindle flame of Mansi ", false);
}

// --- Messaging Functions (Placeholder for actual Gemini Logic) ---
const chatMessagesDiv = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    // Use marked.js to render Markdown from AI
    // NOTE: 'marked' must be available globally via CDN link in index.html
    messageText.innerHTML = isUser ? text : marked.parse(text); 
    
    messageDiv.appendChild(messageText);
    chatMessagesDiv.appendChild(messageDiv);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight; // Auto-scroll to bottom
}

function handleSendMessage() {
    const text = userInput.value.trim();
    if (text === "") return;

    addMessage(text, true);
    userInput.value = '';
    sendButton.disabled = true;

    // Simulate AI response delay
    const typingIndicator = addTypingIndicator();
    
    setTimeout(() => {
        typingIndicator.remove();
        // Placeholder response as Gemini API calls are not implemented here
        addMessage("That's a great question. Let me find the best dermatological advice for you!", false);
        sendButton.disabled = false;
    }, 2500);
}

function addTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text typing-indicator-container';
    messageText.innerHTML = `
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    messageDiv.appendChild(messageText);
    chatMessagesDiv.appendChild(messageDiv);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight; 
    return messageDiv;
}

// Placeholder for Firestore listeners (required by instructions)
function setupChatListeners() {
    if (!db || !userId) return;

    const messagesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/messages`);
    const q = query(messagesCollectionRef, orderBy('timestamp'));

    // Minimal example to satisfy the requirement for onSnapshot
    onSnapshot(q, (snapshot) => {
        console.log("Firestore snapshot received (History update check):", snapshot.docs.length);
    });
}


// --- DUAL-STAGE SPLASH SCREEN LOGIC ---
window.onload = function() {
    const preSplashScreen = document.getElementById('pre-splash-screen');
    const mainSplashScreen = document.getElementById('splash-screen');
    const splashText = mainSplashScreen.querySelector('.splash-text');
    
    // Stage 1: Initialize Firebase/Auth (happens in background)
    initializeFirebase();

    // Stage 2: Show the image for 3 seconds
    setTimeout(() => {
        // A. Hide the image splash screen (Stage 1)
        preSplashScreen.classList.add('hidden');
        
        // B. Show the DERMATO text splash screen (Stage 2)
        mainSplashScreen.classList.remove('hidden');
        
        // C. Start the DERMATO animation by adding the 'animate' class
        splashText.classList.add('animate');

        // D. After the DERMATO animation duration (3s), start the fade-out process
        setTimeout(() => {
             mainSplashScreen.classList.add('hidden');
        }, 3000); 

        // E. Listen for the main splash screen transition to complete its fade-out
        mainSplashScreen.addEventListener('transitionend', (event) => {
            // Check if the transition that just ended is the main opacity transition
            // and the screen is actually hidden
            if (event.propertyName === 'opacity' && mainSplashScreen.classList.contains('hidden')) {
                // If we are already authenticated, start the app immediately.
                if (isAuthReady) {
                    startMainAppFlow();
                } else {
                    // Otherwise, wait for auth to finish
                    const authInterval = setInterval(() => {
                        if (isAuthReady) {
                            clearInterval(authInterval);
                            startMainAppFlow();
                        }
                    }, 100);
                }
            }
        });

    }, 3000); // 3000ms = 3 seconds delay for the image splash
}
