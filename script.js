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
let splashScreen; // NEW: Global reference for splash screen

// The 'marked' library is now available globally due to the CDN tag in index.html

// -------------------------------------------------------------------
// 1. Initialization runs ONLY after the HTML structure is complete
// -------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    
    // NEW: Get the splash screen element
    splashScreen = document.getElementById('splash-screen');

    // NEW: Function to hide the splash screen after the animation finishes (3.5s)
    setTimeout(() => {
        if (splashScreen) {
            splashScreen.classList.add('hidden');
        }
    }, 3500); 

    try {
        // Initialize AI using the imported class
        ai = new GoogleGenAI({apiKey: apiKey});
        
        // Define the AI's persona and instruction set
        chat = ai.chats.create({ 
            model: model,
            config: {
                // Ensure the AI uses Markdown, which 'marked' will render correctly
                systemInstruction: "You are the Dermato AI Assistant, a friendly, professional, and highly knowledgeable virtual skincare advisor. **You must structure all your advice using clear, valid Markdown formatting**, including bolding (**), numbered lists (1.), bullet points (*), and markdown headings (##, ###) where appropriate, to maximize readability and clarity. Your goal is to provide educational, and evidence-based advice on skincare routines, ingredient functions, product types, and common dermatological topics.[Keep your responses concise as possible], {if the user says something out of context play it off as a joke example:[I have 7 legs] reply with something like [Damn that’s crazy man, IDK apply moisturizer or contact a chainsaw man]."
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
        // Delay this message slightly so it doesn't appear on top of the splash screen fade
        setTimeout(() => {
             appendMessage('Hello! I am the Dermato AI Assistant, powered by Gemini. How can I assist you with your skincare questions today?', 'ai');
        }, 3600);


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
    
    // Append the animated typing indicator
    let loadingElement = appendMessage(null, 'ai', true); 
    
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
    
    // Replace the typing indicator with the actual message
    const messageTextElement = loadingElement.querySelector('.message-text');
    messageTextElement.classList.remove('typing-indicator');
    
    // Replace the "loading" message with the actual response using marked.parse()
    if (typeof marked !== 'undefined') {
        messageTextElement.innerHTML = marked.parse(aiResponseText);
    } else {
        messageTextElement.textContent = aiResponseText; // Fallback if marked library isn't available
    }

    // Re-enable input
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus(); 

    // Scroll to the bottom to view the new message
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// -------------------------------------------------------------------
// 5. Helper Functions: Message Appending (Modified for Typing Indicator)
// -------------------------------------------------------------------

/**
 * Appends a message to the chat container.
 * @param {string|null} text - The message content.
 * @param {string} sender - 'user' or 'ai'.
 * @param {boolean} [isTyping=false] - Whether to show the animated typing indicator.
 * @returns {HTMLElement} The created message container div.
 */
function appendMessage(text, sender, isTyping = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);

    const textDiv = document.createElement('div');
    textDiv.classList.add('message-text');
    
    if (isTyping) {
        // Build the HTML for the animated dots
        textDiv.classList.add('typing-indicator');
        textDiv.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
    } else if (typeof marked !== 'undefined') {
        // Use marked.parse() for regular messages
        textDiv.innerHTML = marked.parse(text);
    } else {
        // Fallback
        textDiv.textContent = text;
    }

    messageDiv.appendChild(textDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}
