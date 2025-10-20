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
// IMPORTANT: The API_KEY must be defined like this to be correctly substituted by the environment
const API_KEY = "AIzaSyCqTHjq48mqB8tXC9G2qsefsrqnQ2JQjVg"; 

let db;
let auth;
let userId = null;
let isAuthReady = false;

// --- Image State ---
// Holds the { mimeType, base64Data } object for the currently uploaded image
let uploadedImage = null; 

// --- Gemini Configuration and System Instruction ---
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;

const SYSTEM_INSTRUCTION = `You are the Dermato AI Assistant, a friendly, professional, and highly knowledgeable virtual skincare advisor. You must structure all your advice using clear, valid Markdown formatting, including bolding (**), numbered lists (1.), bullet points (*), and markdown headings (##, ###) where appropriate, to maximize readability and clarity. Your goal is to provide educational, and evidence-based advice on skincare routines, ingredient functions, product types, and common dermatological topics. Keep your responses concise as possible. If the user says something out of context play it off as a joke (example: User: "I have 7 legs" -> Reply: "Damn that’s crazy man, IDK apply moisturizer or contact a chainsaw man").`;


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
                // If no token, sign in anonymously or use the custom token
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
    
    // Setup Image Upload Listeners
    setupImageUploadListeners(); 

    // Send the custom initial message
    addMessage("Sup homie, I am Mato... Dermato, Made by the suffering dwelled with Atomica and the kindle flame of Mansi", false);
}

// ------------------------------------------------------------------
// Image Upload Logic
// ------------------------------------------------------------------

const imageUploadInput = document.getElementById('image-upload');
const uploadButton = document.getElementById('upload-button');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageButton = document.getElementById('remove-image-button');

function setupImageUploadListeners() {
    // Trigger hidden file input when upload button is clicked
    uploadButton.addEventListener('click', () => {
        imageUploadInput.click();
    });

    // Handle file selection
    imageUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            previewImage(file);
        }
    });

    // Handle removing the image
    removeImageButton.addEventListener('click', clearImageUpload);
}

function clearImageUpload() {
    uploadedImage = null;
    imageUploadInput.value = ''; // Clear file input value
    imagePreview.src = '';
    imagePreviewContainer.classList.add('hidden');
}

function previewImage(file) {
    if (file.size > 5 * 1024 * 1024) { // Limit image size to 5MB
        // Use a simple console error instead of alert
        console.error("Image size is too large (max 5MB).");
        imageUploadInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        // Display the preview
        imagePreview.src = e.target.result;
        imagePreviewContainer.classList.remove('hidden');
        
        // Store the Base64 data for the API call
        const base64Data = e.target.result.split(',')[1];
        uploadedImage = {
            mimeType: file.type,
            base64Data: base64Data
        };
    };
    reader.readAsDataURL(file);
}

// ------------------------------------------------------------------
// Messaging and API Logic
// ------------------------------------------------------------------

const chatMessagesDiv = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    // Use marked.js to render Markdown from AI
    messageText.innerHTML = isUser ? text : marked.parse(text); 
    
    messageDiv.appendChild(messageText);
    chatMessagesDiv.appendChild(messageDiv);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight; // Auto-scroll to bottom
}

function displaySources(sources, messageContainer) {
    if (sources.length === 0) return;

    const sourcesDiv = document.createElement('div');
    sourcesDiv.className = 'sources-list';
    let sourceHtml = '<p>_Sources:_</p><ol>';

    sources.forEach(source => {
        sourceHtml += `<li><a href="${source.uri}" target="_blank">${source.title || source.uri}</a></li>`;
    });
    sourceHtml += '</ol>';
    sourcesDiv.innerHTML = sourceHtml;
    messageContainer.appendChild(sourcesDiv);
}

// MODIFIED: Accepts uploadedImage object and constructs the multimodal payload
async function callGeminiApi(userQuery, image) {
    
    // Construct the parts array for the content payload
    const contentParts = [];

    // 1. Add image part if an image is provided
    if (image) {
        contentParts.push({
            inlineData: {
                data: image.base64Data,
                mimeType: image.mimeType
            }
        });
    }

    // 2. Add text part (always required)
    contentParts.push({ text: userQuery });


    const payload = {
        contents: [{ parts: contentParts }],
        // Enable Google Search grounding for evidence-based advice
        tools: [{ "google_search": {} }], 
        systemInstruction: SYSTEM_INSTRUCTION
    };

    let response = null;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
        try {
            response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                const candidate = result.candidates?.[0];

                if (candidate && candidate.content?.parts?.[0]?.text) {
                    const text = candidate.content.parts[0].text;
                    
                    let sources = [];
                    const groundingMetadata = candidate.groundingMetadata;
                    if (groundingMetadata && groundingMetadata.groundingAttributions) {
                        sources = groundingMetadata.groundingAttributions
                            .map(attribution => ({
                                uri: attribution.web?.uri,
                                title: attribution.web?.title,
                            }))
                            .filter(source => source.uri && source.title);
                    }

                    return { text, sources };

                } else {
                    console.error("Gemini API returned an empty response.");
                    return { text: "Sorry, I couldn't process that request. The model returned no text.", sources: [] };
                }
            } else {
                const errorBody = await response.text();
                // Check for the specific 403 Permission Denied error
                if (response.status === 403 && errorBody.includes("PERMISSION_DENIED")) {
                    console.error(`Gemini API error (Status: 403): ${errorBody}`);
                    throw new Error("API call failed due to permission denial (403). Ensure the API key is configured.");
                }

                console.error(`Gemini API error (Status: ${response.status}): ${errorBody}`);
                throw new Error("API call failed with status " + response.status);
            }
        } catch (error) {
            retries++;
            if (retries < maxRetries) {
                const delay = Math.pow(2, retries) * 1000; // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error("Gemini API call failed after multiple retries:", error);
                return { text: "Apologies, I'm having trouble connecting to my knowledge base right now. Please try again in a moment.", sources: [] };
            }
        }
    }
}

// MODIFIED: Handles clearing the image state after successful send
async function handleSendMessage() {
    const userQuery = userInput.value.trim();
    const imageToSend = uploadedImage; // Grab the current image before clearing
    
    if (userQuery === "" && !imageToSend) return; // Don't send empty message without an image

    // Display a message indicating to the user what was sent
    let userDisplayMessage = userQuery;
    if (imageToSend) {
        userDisplayMessage += userQuery === "" ? "Image uploaded for analysis." : " (with image attached)";
    }
    addMessage(userDisplayMessage, true);
    
    userInput.value = '';
    sendButton.disabled = true;
    uploadButton.disabled = true;

    // IMPORTANT: Clear the image preview and state right away so user sees it gone
    clearImageUpload();

    const typingIndicator = addTypingIndicator();

    try {
        const responseData = await callGeminiApi(userQuery, imageToSend);
        
        // Remove typing indicator
        typingIndicator.remove();

        // Display AI response
        addMessage(responseData.text, false);
        
        // Find the newly added AI message container to attach sources
        const aiMessageDiv = chatMessagesDiv.lastElementChild;
        if (aiMessageDiv) {
             const messageTextDiv = aiMessageDiv.querySelector('.message-text');
             displaySources(responseData.sources, messageTextDiv);
        }

    } catch (error) {
        typingIndicator.remove();
        addMessage(`A critical error occurred: ${error.message}. Check the console for details.`, false);
    } finally {
        sendButton.disabled = false;
        uploadButton.disabled = false;
    }
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

    // We listen to a collection specific to the user
    const messagesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/messages`);
    const q = query(messagesCollectionRef, orderBy('timestamp'));

    // Minimal example to satisfy the requirement for onSnapshot
    onSnapshot(q, (snapshot) => {
        console.log("Firestore snapshot received (History update check):", snapshot.docs.length);
    });
}


// --- DUAL-STAGE SPLASH SCREEN LOGIC (FIXED with Timers) ---
window.onload = function() {
    const preSplashScreen = document.getElementById('pre-splash-screen');
    const mainSplashScreen = document.getElementById('splash-screen');
    const splashText = mainSplashScreen.querySelector('.splash-text');
    
    // Stage 1: Initialize Firebase/Auth (happens in background)
    initializeFirebase();

    // Helper function to wait for auth and then start the main app
    const startAppCheck = () => {
        if (isAuthReady) {
            startMainAppFlow();
        } else {
            // Poll every 100ms until auth is ready or time runs out 
            let checkCount = 0;
            const authInterval = setInterval(() => {
                checkCount++;
                if (isAuthReady || checkCount > 20) { // Check for max 2 seconds
                    clearInterval(authInterval);
                    startMainAppFlow(); 
                }
            }, 100);
        }
    };

    // ----------------------------------------------------
    // Timer Chain Start
    // ----------------------------------------------------
    
    // Timer 1 (3000ms): End of Image Splash
    setTimeout(() => {
        // A. Hide the image splash screen (Stage 1)
        preSplashScreen.classList.add('hidden');
        
        // B. Show the DERMATO text splash screen (Stage 2)
        mainSplashScreen.classList.remove('hidden');
        
        // C. Start the DERMATO animation (3s CSS animation)
        splashText.classList.add('animate');

        // Timer 2 (3000ms): End of DERMATO Animation
        setTimeout(() => {
             // D. Start the 0.5s fade-out transition by applying 'hidden' class
             mainSplashScreen.classList.add('hidden');

             // Timer 3 (500ms): End of Fade-out Transition. Start main application.
             setTimeout(startAppCheck, 500); 

        }, 3000); // 3000ms for DERMATO animation

    }, 3000); // 3000ms for image splash
}
