// Ensure you have installed the correct SDK dependency if running locally, 
// but for a simple GitHub Pages demo, we use a script tag in index.html.

// *******************************************************************
// 🚨 SECURITY WARNING: REPLACE 'YOUR_API_KEY_HERE' WITH YOUR ACTUAL KEY.
// DO NOT LEAVE A LIVE KEY HERE AFTER YOUR DEMO IS COMPLETE!
// *******************************************************************
import { GoogleGenAI } from '@google/genai';

// Initialize the GoogleGenAI instance with your API Key
const ai = new GoogleGenAI({apiKey: 'AIzaSyCqTHjq48mqB8tXC9G2qsefsrqnQ2JQjVg'});
const model = "gemini-2.5-flash"; // A fast and capable model for chat

// Initialize chat session history
const chat = ai.chats.create({ model });

// -------------------------------------------------------------------
// 1. HTML Element References
// -------------------------------------------------------------------
const sendButton = document.getElementById('send-button');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');

// -------------------------------------------------------------------
// 2. Event Listeners
// -------------------------------------------------------------------

// Listen for button click and Enter key press
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Initial Welcome Message from the AI
document.addEventListener('DOMContentLoaded', () => {
    // A small delay to ensure the DOM is fully rendered before inserting the message
    setTimeout(() => {
        appendMessage('Hello! I am the Dermato AI Assistant, powered by Gemini. Ask me anything!', 'ai');
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
    let aiResponseText = "An error occurred while connecting to the AI.";
    let loadingElement = appendMessage('AI is thinking...', 'ai');
    
    try {
        // Send the user's message to the chat session
        const response = await chat.sendMessage({ message: userMessage });

        // Get the response text
        aiResponseText = response.text; 

    } catch (error) {
        console.error("Gemini API Call Failed:", error);
        aiResponseText = "An error occurred while connecting to the AI. Check the console for details.";
    }
    
    // Update the loading message with the final AI response
    loadingElement.querySelector('.message-text').textContent = aiResponseText;

    // Re-enable input and button
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus(); // Set focus back to input for quick typing

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
    
    // Return the element so we can modify the loading state later
    return messageDiv;
}
