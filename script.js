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
    
    try {
        // Initialize AI using the imported class
        ai = new GoogleGenAI({apiKey: apiKey});
        
        // Define the AI's persona and instruction set (UPDATED FOR SKINCARE AND FORMATTING)
        chat = ai.chats.create({ 
            model: model,
            config: {
                systemInstruction: "You are the Dermato AI Assistant, a friendly, professional, and highly knowledgeable virtual skincare advisor. **You must structure all your advice using clear Markdown formatting**, including bolding (**), numbered lists, bullet points (*), and markdown headings (##) where appropriate, to maximize readability and clarity. Your goal is to provide general, educational, and evidence-based advice on skincare routines, ingredient functions, product types, and common dermatological topics. All advice must be accompanied by the following mandatory safety disclaimer at the very end of your response: 'Disclaimer: I am an AI, not a medical professional. This advice is for educational purposes only and is not a substitute for professional medical consultation. Always consult with a certified dermatologist or doctor before starting any new treatment or routine.' Your tone must be supportive, clear, and focused on scientifically sound information."
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
    loadingElement.querySelector('.message-text').innerHTML = markdownToHtml(aiResponseText);

    // Re-enable input
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus(); 

    // Scroll to the bottom to view the new message
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// -------------------------------------------------------------------
// 5. Helper Functions: Markdown Conversion and Message Appending
// -------------------------------------------------------------------

// Function to convert basic Markdown to HTML
function markdownToHtml(markdownText) {
    // 1. Convert **bold** to <strong>bold</strong>
    let htmlText = markdownText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 2. Convert *italics* or _italics_ to <em>italics</em>
    htmlText = htmlText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    htmlText = htmlText.replace(/_(.*?)_/g, '<em>$1</em>');

    // 3. Simple list and paragraph breaks (convert newlines to <br>)
    // For a simple chat app, converting newlines often gives a good result.
    htmlText = htmlText.replace(/\n/g, '<br>');
    
    return htmlText;
}


function appendMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);

    const textDiv = document.createElement('div');
    textDiv.classList.add('message-text');
    
    // Safely render the text as HTML (after converting Markdown)
    // Note: Since this is a self-contained project, using innerHTML is fine, 
    // but in a production app with user-provided text, this needs stricter sanitization.
    textDiv.innerHTML = markdownToHtml(text);

    messageDiv.appendChild(textDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}
