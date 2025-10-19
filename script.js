// *******************************************************************
// 🚨 SECURITY WARNING: The API key below is PUBLICLY VISIBLE on GitHub Pages.
// REMOVE THIS KEY IMMEDIATELY after your demonstration is complete.
// *******************************************************************
import { GoogleGenAI } from '@google/genai';

// Initialize the GoogleGenAI instance with the provided API Key
const apiKey = 'AIzaSyCqTHjq48mqB8tXC9G2qsefsrqnQ2JQjVg';
const ai = new GoogleGenAI({apiKey: apiKey});
const model = "gemini-2.5-flash"; 

// Initialize chat session history to maintain context
const chat = ai.chats.create({ 
    model: model,
    // System instruction to give the AI a persona relevant to your project name
    config: {
        systemInstruction: "You are the Dermato AI Assistant, a friendly and helpful large language model. Your responses should be concise, professional, and focus on providing useful information while maintaining a supportive tone. You are here to answer questions about the user's web development projects, the design, and any general inquiries."
    }
});

// -------------------------------------------------------------------
// 1. HTML Element References
// -------------------------------------------------------------------
const sendButton = document.getElementById('send-button');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');

// -------------------------------------------------------------------
// 2. Event Listeners and Initial Setup
// -------------------------------------------------------------------

// Listen for button click and Enter key press
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Initial Welcome Message from the AI on page load
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure the chat box CSS is fully applied before the first message
    setTimeout(() => {
        appendMessage('Hello! I am the Dermato AI Assistant, powered by Gemini. I can help answer questions about your project design or general inquiries. What can I do for you?', 'ai');
    }, 100);
});


// -------------------------------------------------------------------
// 3. Core Logic: Sending Message and Calling API
// -------------------------------------------------------------------

function sendMessage() {
    const userMessage = userInput.value.trim();
    if (userMessage === '') return;

    // Display user's message immediately
    appendMessage(userMessage, 'user');
    
    // Clear input and disable elements while waiting for API
    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;

    // Call the API
    callAIApi(userMessage);
}

async function callAIApi(userMessage) {
    let aiResponseText = "An error occurred while connecting to the AI. Please check your network connection.";
    
    // Display a temporary 'thinking' message
    let loadingElement = appendMessage('AI is thinking...', 'ai');
    
    try {
        // Send the user's message to the chat session
        const response = await chat.sendMessage({ message: userMessage });

        // Get the response text
        aiResponseText = response.text; 

    } catch (error) {
        console.error("Gemini API Call Failed:", error);
        // Provide more helpful error message if the API key is the issue
        if (error.message && error.message.includes('API_KEY_INVALID')) {
            aiResponseText = "Authentication error: The API key might be invalid or restricted. Check your console for details.";
        } else {
             aiResponseText = "An unexpected error occurred. See console for details.";
        }

    }
    
    // Update the 'thinking' message with the final AI response
    loadingElement.querySelector('.message-text').textContent = aiResponseText;

    // Re-enable input and button
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus(); 

    // Scroll to the bottom to see the newest message
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// -------------------------------------------------------------------
// 4. Helper Function: Append Message to Chat Window
// -------------------------------------------------------------------

function appendMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);

    const textDiv = document.createElement('div');
    textDiv.classList.add('message-text');
    textDiv.textContent = text;

    messageDiv.appendChild(textDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Return the element for later modification (e.g., updating 'thinking...')
    return messageDiv;
}
