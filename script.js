// *** CRITICAL FIX: Import GoogleGenAI as it's an ES Module ***
import { GoogleGenAI } from 'https://esm.run/@google/genai';

// *******************************************************************
// SECURITY WARNING: The API key below is PUBLICLY VISIBLE on GitHub Pages.
// REMOVE THIS KEY IMMEDIATELY after your demonstration is complete.
// *******************************************************************

const apiKey = 'AIzaSyCqTHjq48mqB8tXC9G2qsefsrqnQ2JQjVg';
const model = "gemini-2.5-flash"; 

// Declare variables globally
let ai;
let chat;
let sendButton;
let userInput;
let chatMessages;

// -------------------------------------------------------------------
// 1. Initialization runs ONLY after the HTML structure is complete
// -------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    
    // GoogleGenAI is now imported and available here.
    try {
        // Initialize AI using the imported class
        ai = new GoogleGenAI({apiKey: apiKey});
        
        // Define the AI's persona and instruction set
        chat = ai.chats.create({ 
            model: model,
            config: {
                systemInstruction: "You are the Dermato AI Assistant, a friendly and helpful large language model. Your responses should be concise, professional, and focus on providing useful information about skincare, dermatology, and cosmetic science while maintaining a supportive tone. If a question is outside the scope of skincare or web development, politely redirect the user to the core topics."
            }
        });

        // 2. HTML Element References
        sendButton = document.getElementById('send-button');
        userInput = document.getElementById('user-input');
        chatMessages = document.getElementById('chat-messages');

        // 3. Event Listeners
        sendButton.addEventListener('click', sendMessage);
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Initial Welcome Message
        appendMessage('Hello! I am the Dermato AI Assistant, powered by Gemini. How can I assist you with your skincare questions or project design today?', 'ai');

    } catch (e) {
        // Fallback for initialization failure
        console.error("Initialization Failed:", e);
        document.getElementById('chat-messages').innerHTML = 
            '<div class="message ai-message"><div class="message-text">FATAL ERROR: AI failed to initialize. Ensure the Gemini SDK script tag uses type="module" and GoogleGenAI is imported in script.js.</div></div>';
    }
});


// -------------------------------------------------------------------
// 4. Core Logic: Sending Message and Calling API
// -------------------------------------------------------------------

function sendMessage() {
    const userMessage = userInput.value.trim(); 
    if (userMessage === '') return;

    appendMessage(userMessage, 'user');
    
    userInput.value = '';
    userInput.disabled = true; // Disable input while waiting for AI
    sendButton.disabled = true;

    callAIApi(userMessage);
}

async function callAIApi(userMessage) {
    let aiResponseText = "An error occurred while connecting to the AI. Please check your network connection.";
    
    // Add a temporary "loading" message
    let loadingElement = appendMessage('AI is thinking...', 'ai');
    
    try {
        const response = await chat.sendMessage({ message: userMessage });
        aiResponseText = response.text; 

    } catch (error) {
        console.error("Gemini API Call Failed:", error);
        
        // Provide more helpful error messages
        if (error.message && error.message.includes('API_KEY_INVALID')) {
            aiResponseText = "Authentication error: The API key might be invalid or restricted. Check your console for details.";
        } else {
             aiResponseText = "An unexpected error occurred. See console for details.";
        }
    }
    
    // Replace the "loading" message with the actual response
    loadingElement.querySelector('.message-text').textContent = aiResponseText;

    // Re-enable input
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus(); 

    // Scroll to the bottom to view the new message
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// -------------------------------------------------------------------
// 5. Helper Function: Append Message to Chat Window
// -------------------------------------------------------------------

function appendMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);

    const textDiv = document.createElement('div');
    textDiv.classList.add('message-text');
    
    // Safely replace text content
    textDiv.textContent = text;

    messageDiv.appendChild(textDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}
