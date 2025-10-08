// ===============================================
// AI CHAT PAGE SPECIFIC JAVASCRIPT
// ===============================================

document.addEventListener("DOMContentLoaded", function () {
  // Load chat history
  loadChatHistory();

  // Setup chat input
  setupChatInput();

  // Setup voice input
  setupVoiceInput();
});

function loadChatHistory() {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");
  const chatMessages = document.getElementById("chat-messages");

  if (!chatMessages) return;

  // Clear existing messages except the welcome message
  const welcomeMessage = chatMessages.querySelector(".chat-bubble");
  chatMessages.innerHTML = "";
  if (welcomeMessage) {
    chatMessages.appendChild(welcomeMessage);
  }

  // Load chat history from Firebase
  database
    .ref("chatHistory/" + emailKey)
    .orderByChild("timestamp")
    .limitToLast(20)
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        const messages = [];
        snapshot.forEach((childSnapshot) => {
          messages.push(childSnapshot.val());
        });

        // Sort messages by timestamp
        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Add messages to chat
        messages.forEach((message) => {
          addMessageToChat(message.text, message.isUser, message.id);
        });

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    })
    .catch((error) => {
      console.error("Error loading chat history:", error);
    });
}

function setupChatInput() {
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

  if (!chatInput || !sendBtn) return;

  // Send message on button click
  sendBtn.addEventListener("click", sendMessage);

  // Send message on Enter key
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
}

function setupVoiceInput() {
  const voiceBtn = document.getElementById("voice-btn");
  if (!voiceBtn) return;

  voiceBtn.addEventListener("click", () => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.start();
      voiceBtn.innerHTML = '<i class="fas fa-microphone text-red-600"></i>';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const chatInput = document.getElementById("chat-input");
        if (chatInput) {
          chatInput.value = transcript;
        }
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      };

      recognition.onerror = () => {
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      };
    } else {
      alert("Speech recognition not supported in this browser");
    }
  });
}

function sendMessage() {
  const chatInput = document.getElementById("chat-input");
  if (!chatInput) return;

  const message = chatInput.value.trim();
  if (!message) return;

  // Add user message to chat
  addMessageToChat(message, true);

  // Clear input
  chatInput.value = "";

  // Save message to Firebase
  saveMessageToChat(message, true);

  // Simulate AI response
  setTimeout(() => {
    const response = generateAIResponse(message);
    addMessageToChat(response, false);
    saveMessageToChat(response, false);
  }, 1000);
}

function sendQuickMessage(message) {
  // Add user message to chat
  addMessageToChat(message, true);

  // Save message to Firebase
  saveMessageToChat(message, true);

  // Simulate AI response
  setTimeout(() => {
    let response = "";
    if (message.includes("yellow")) {
      response =
        "Yellowing leaves in cabbage can indicate nitrogen deficiency, overwatering, or natural aging. Check soil moisture and consider applying a balanced fertilizer. If only lower leaves are yellow, this is normal aging.";
    } else if (message.includes("harvest")) {
      response =
        "Harvest kale when leaves are 6-8 inches long. For cabbage, harvest when heads are firm and solid. Morning harvest is best for quality and shelf life.";
    } else if (message.includes("black rot")) {
      response =
        "To prevent black rot: 1) Rotate crops annually 2) Ensure good air circulation 3) Avoid overhead watering 4) Remove infected plant debris 5) Use resistant varieties when possible.";
    } else {
      response =
        "I'd be happy to help with your farming question. Could you provide more details about the issue you're experiencing with your crops?";
    }

    addMessageToChat(response, false);
    saveMessageToChat(response, false);
  }, 1000);
}

function addMessageToChat(message, isUser, messageId) {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = "chat-bubble mb-4";
  messageDiv.id = messageId || "";

  if (isUser) {
    messageDiv.innerHTML = `
      <div class="flex items-start justify-end">
        <div class="bg-green-600 text-white rounded-lg p-3 max-w-xs">
          <p class="text-sm">${message}</p>
        </div>
        <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center ml-3 mt-1">
          <i class="fas fa-user text-gray-600 text-xs"></i>
        </div>
      </div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="flex items-start">
        <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3 mt-1 boty">
          <i class="fas fa-robot botx text-white text-xs"></i>
        </div>
        <div class="bg-secondary rounded-lg p-0 max-w-xs">
          <p class="text-sm text-primary">${message}</p>
        </div>
      </div>
    `;
  }

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function saveMessageToChat(message, isUser) {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");
  const newMessageRef = database.ref("chatHistory/" + emailKey).push();

  newMessageRef
    .set({
      text: message,
      isUser: isUser,
      timestamp: new Date().toISOString(),
    })
    .then(() => {
      console.log("Message saved to chat history");
    })
    .catch((error) => {
      console.error("Error saving message to chat history:", error);
    });
}

function generateAIResponse(userMessage) {


  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes("yellow") && lowerMessage.includes("leav")) {
    return "Yellowing leaves in cabbage can indicate nitrogen deficiency, overwatering, or natural aging. Check soil moisture and consider applying a balanced fertilizer. If only lower leaves are yellow, this is normal aging.";
  }

  if (lowerMessage.includes("harvest") || lowerMessage.includes("when")) {
    return "Harvest kale when leaves are 6-8 inches long. For cabbage, harvest when heads are firm and solid. Morning harvest is best for quality and shelf life.";
  }

  if (lowerMessage.includes("black rot") || lowerMessage.includes("disease")) {
    return "To prevent black rot: 1) Rotate crops annually 2) Ensure good air circulation 3) Avoid overhead watering 4) Remove infected plant debris 5) Use resistant varieties when possible.";
  }

  if (lowerMessage.includes("fertiliz") || lowerMessage.includes("nutrient")) {
    return "For cabbage and kale, use a balanced fertilizer with equal parts NPK. Apply at planting, then side-dress with nitrogen when plants are half-grown. Organic options include compost and well-rotted manure.";
  }

  if (lowerMessage.includes("pest") || lowerMessage.includes("insect")) {
    return "Common pests for cabbage and kale include aphids, cabbage worms, and flea beetles. Use row covers to prevent infestation, or apply neem oil or insecticidal soap as needed. Encourage beneficial insects like ladybugs.";
  }

  if (lowerMessage.includes("water") || lowerMessage.includes("irrigat")) {
    return "Cabbage and kale need consistent moisture, about 1-1.5 inches per week. Water at the base to keep foliage dry and prevent disease. Mulch helps retain soil moisture and regulate temperature.";
  }

  // Default response
  return "I'd be happy to help with your farming question. Could you provide more details about the issue you're experiencing with your crops?";
}
