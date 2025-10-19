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

// The 'marked' library is now available globally due to the CDN tag in index.html

// -------------------------------------------------------------------
// 1. Initialization runs ONLY after the HTML structure is complete
// -------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    
    try {
        // Initialize AI using the imported class
        ai = new GoogleGenAI({apiKey: apiKey});
        
        // Define the AI's persona and instruction set
        chat = ai.chats.create({ 
            model: model,
            config: {
                // Ensure the AI uses Markdown, which 'marked' will render correctly
                systemInstruction: "You are the Dermato AI Assistant, a friendly, professional, and highly knowledgeable virtual skincare advisor. **You must structure all your advice using clear, valid Markdown formatting**, including bolding (**), numbered lists (1.), bullet points (*), and markdown headings (##, ###) where appropriate, to maximize readability and clarity. Your goal is to provide general, educational, and evidence-based advice on skincare routines, ingredient functions, product types, and common dermatological topics. All advice must be accompanied by the following mandatory safety disclaimer at the very end of your response: 'Disclaimer: I am an AI, not a medical professional. This advice is for educational purposes only and is not a substitute for professional medical consultation. Always consult with a certified dermatologist or doctor before starting any new treatment or routine.' Your tone must be supportive, clear, and focused on scientifically sound information."
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
        appendMessage('Hello! I am the Dermato AI Assistant, powered by Gemini. How can I assist you with your skincare questions today?', 'ai');

    } catch (e) {
        console.error("Initialization Failed:", e);
        document.getElementById('chat-messages').innerHTML = 
            '<div class="message ai-message"><div class="message-text">FATAL ERROR: AI failed to initialize. Check console for details.</div></div>';
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
    userInput.disabled = true;
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
        
        if (error.message && error.message.includes('API_KEY_INVALID')) {
            aiResponseText = "Authentication error: The API key might be invalid or restricted. Check your console for details.";
        } else {
             aiResponseText = "An unexpected error occurred. See console for details.";
        }
    }
    
    // Replace the "loading" message with the actual response using HTML rendering
    // *** CRITICAL CHANGE: Using marked.parse() for full Markdown support ***
    loadingElement.querySelector('.message-text').innerHTML = marked.parse(aiResponseText);

    // Re-enable input
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus(); 

    // Scroll to the bottom to view the new message
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// -------------------------------------------------------------------
// 5. Helper Functions: Message Appending (simplified by using 'marked')
// -------------------------------------------------------------------

// *** THE OLD 'markdownToHtml' FUNCTION HAS BEEN REMOVED ***
// The new logic relies entirely on the global marked.parse() function.

function appendMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);

    const textDiv = document.createElement('div');
    textDiv.classList.add('message-text');
    
    // Use marked.parse() to convert the Markdown text to fully formatted HTML
    if (typeof marked !== 'undefined') {
        textDiv.innerHTML = marked.parse(text);
    } else {
        // Fallback if the marked library didn't load
        textDiv.textContent = text;
    }

    messageDiv.appendChild(textDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}
