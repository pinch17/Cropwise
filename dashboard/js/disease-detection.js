// ===============================================
// DISEASE DETECTION PAGE JAVASCRIPT
// ===============================================

// Google Generative AI for image analysis
let genAI;
let isAILoaded = false;
let currentAnalysisId = null;

// Initialize the page
document.addEventListener("DOMContentLoaded", function () {
  // Initialize AI
  initializeAI();

  // Setup file upload
  setupFileUpload();

  // Load detection history
  loadDetectionHistory();
});

// Function to initialize the AI model
function initializeAI() {
  try {
    // Load the Google Generative AI SDK
    const script = document.createElement("script");
    script.type = "module";
    script.textContent = `
      import { GoogleGenerativeAI } from "https://cdn.skypack.dev/@google/generative-ai";
      
      // Make GoogleGenerativeAI available globally
      window.GoogleGenerativeAI = GoogleGenerativeAI;
      
      // Dispatch a custom event to notify that the library is loaded
      window.dispatchEvent(new Event('google-ai-loaded'));
    `;
    document.head.appendChild(script);

    // Listen for the custom event that indicates the library is loaded
    window.addEventListener("google-ai-loaded", function () {
      try {
        genAI = new GoogleGenerativeAI(
          "AIzaSyBR0U2VVIRUklo27jPeZhxGMTE7axxgRZE"
        );
        isAILoaded = true;
        console.log("Google Generative AI initialized successfully");
      } catch (error) {
        console.error("Error initializing Google Generative AI:", error);
      }
    });
  } catch (error) {
    console.error("Error setting up Google Generative AI:", error);
  }
}

// Setup file upload functionality
function setupFileUpload() {
  const fileUploadArea = document.getElementById("file-upload-area");
  const photoUpload = document.getElementById("photo-upload");
  const photoPreview = document.getElementById("photo-preview");
  const previewImage = document.getElementById("preview-image");
  const analyzeBtn = document.getElementById("analyze-btn");

  if (
    !fileUploadArea ||
    !photoUpload ||
    !photoPreview ||
    !previewImage ||
    !analyzeBtn
  )
    return;

  // Handle file selection
  photoUpload.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = function (e) {
        previewImage.src = e.target.result;
        fileUploadArea.classList.add("hidden");
        photoPreview.classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    }
  });

  // Handle drag and drop
  fileUploadArea.addEventListener("dragover", function (e) {
    e.preventDefault();
    fileUploadArea.classList.add("dragover");
  });

  fileUploadArea.addEventListener("dragleave", function (e) {
    e.preventDefault();
    fileUploadArea.classList.remove("dragover");
  });

  fileUploadArea.addEventListener("drop", function (e) {
    e.preventDefault();
    fileUploadArea.classList.remove("dragover");

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      photoUpload.files = e.dataTransfer.files;
      const event = new Event("change", { bubbles: true });
      photoUpload.dispatchEvent(event);
    }
  });

  // Handle analyze button click
  analyzeBtn.addEventListener("click", analyzeImage);
}

// Analyze the uploaded image
async function analyzeImage() {
  const previewImage = document.getElementById("preview-image");
  const analysisResults = document.getElementById("analysis-results");

  if (!previewImage || !analysisResults) return;

  // Generate a unique ID for this analysis
  currentAnalysisId = Date.now().toString();

  // Show loading state
  analysisResults.innerHTML = `
    <div class="flex flex-col items-center justify-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
      <p class="text-secondary">Analyzing your plant image...</p>
    </div>
  `;

  try {
    // Ensure AI is loaded
    if (!isAILoaded) {
      throw new Error("AI is not loaded yet. Please try again in a moment.");
    }

    // Get the model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Convert image to base64
    const imageBase64 = await getDataUrlFromFile(previewImage.src);

    // Prepare the prompt for disease detection
    const prompt = `You are an expert agricultural scientist specializing in crop diseases in Kenya. Analyze this plant image and provide a detailed assessment.

Please identify:
1. The type of plant (cabbage, kale, etc.)
2. Any visible diseases, pests, or nutritional deficiencies
3. The severity of the issue (mild, moderate, severe)
4. Recommended treatment or management practices specific to Kenyan farming conditions
5. Preventive measures for the future

Format your response as JSON with the following structure:
{
  "plantType": "type of plant",
  "condition": "healthy or name of disease/issue",
  "severity": "mild/moderate/severe",
  "confidence": "high/medium/low",
  "description": "detailed description of the issue",
  "recommendations": ["list of specific recommendations"],
  "prevention": ["list of preventive measures"]
}

If you cannot confidently identify the plant or issue, indicate that in your response.`;

    // Create the content parts with the image
    const imageParts = [
      {
        inlineData: {
          data: imageBase64.split(",")[1], // Remove the data:image/...;base64, prefix
          mimeType: "image/jpeg",
        },
      },
    ];

    // Generate content
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // Try to parse the JSON response
    let analysisData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Fallback to displaying the raw text
      displayRawAnalysisResults(text);
      return;
    }

    // Display the results
    displayAnalysisResults(analysisData);

    // Save to detection history
    saveToDetectionHistory(analysisData, previewImage.src, currentAnalysisId);
  } catch (error) {
    console.error("Error analyzing image:", error);
    analysisResults.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p class="text-red-500 mb-2">Error analyzing image</p>
        <p class="text-sm text-secondary">${error.message}</p>
        <button class="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700" onclick="resetUpload()">
          Try Again
        </button>
      </div>
    `;
  }
}

// Convert image to base64
function getDataUrlFromFile(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Display the analysis results
function displayAnalysisResults(data) {
  const analysisResults = document.getElementById("analysis-results");
  if (!analysisResults) return;

  // Determine status color based on condition
  let statusColor = "text-green-600";
  let statusIcon = "fa-check-circle";

  if (data.condition !== "healthy") {
    if (data.severity === "severe") {
      statusColor = "text-red-600";
      statusIcon = "fa-exclamation-triangle";
    } else if (data.severity === "moderate") {
      statusColor = "text-yellow-600";
      statusIcon = "fa-exclamation-circle";
    } else {
      statusColor = "text-blue-600";
      statusIcon = "fa-info-circle";
    }
  }

  analysisResults.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-semibold text-primary">Diagnosis</h4>
        <span class="${statusColor}">
          <i class="fas ${statusIcon} mr-1"></i>
          ${data.condition === "healthy" ? "Healthy" : data.condition}
        </span>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-secondary">Plant Type</p>
          <p class="font-medium text-primary">${data.plantType || "Unknown"}</p>
        </div>
        <div>
          <p class="text-sm text-secondary">Severity</p>
          <p class="font-medium text-primary">${data.severity || "Unknown"}</p>
        </div>
        <div>
          <p class="text-sm text-secondary">Confidence</p>
          <p class="font-medium text-primary">${
            data.confidence || "Unknown"
          }</p>
        </div>
        <div>
          <p class="text-sm text-secondary">Status</p>
          <p class="font-medium ${statusColor}">${
    data.condition === "healthy" ? "Healthy" : "Needs Attention"
  }</p>
        </div>
      </div>
      
      <div>
        <p class="text-sm text-secondary mb-1">Description</p>
        <p class="text-sm text-primary">${
          data.description || "No description available"
        }</p>
      </div>
      
      ${
        data.recommendations && data.recommendations.length > 0
          ? `
        <div>
          <p class="text-sm text-secondary mb-2">Recommendations</p>
          <ul class="list-disc list-inside text-sm text-primary space-y-1">
            ${data.recommendations.map((rec) => `<li>${rec}</li>`).join("")}
          </ul>
        </div>
      `
          : ""
      }
      
      ${
        data.prevention && data.prevention.length > 0
          ? `
        <div>
          <p class="text-sm text-secondary mb-2">Prevention</p>
          <ul class="list-disc list-inside text-sm text-primary space-y-1">
            ${data.prevention.map((prev) => `<li>${prev}</li>`).join("")}
          </ul>
        </div>
      `
          : ""
      }
      
      <button class="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700" onclick="resetUpload()">
        Analyze Another Image
      </button>
    </div>
  `;
}

// Display raw analysis results if JSON parsing fails
function displayRawAnalysisResults(text) {
  const analysisResults = document.getElementById("analysis-results");
  if (!analysisResults) return;

  analysisResults.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-semibold text-primary">Analysis Results</h4>
        <span class="text-blue-600">
          <i class="fas fa-info-circle mr-1"></i>
          AI Analysis
        </span>
      </div>
      
      <div>
        <p class="text-sm text-secondary mb-2">AI Response</p>
        <div class="bg-secondary p-3 rounded-lg text-sm text-primary whitespace-pre-line">${text}</div>
      </div>
      
      <button class="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700" onclick="resetUpload()">
        Analyze Another Image
      </button>
    </div>
  `;
}

// Reset the upload area
function resetUpload() {
  const fileUploadArea = document.getElementById("file-upload-area");
  const photoUpload = document.getElementById("photo-upload");
  const photoPreview = document.getElementById("photo-preview");
  const analysisResults = document.getElementById("analysis-results");

  if (!fileUploadArea || !photoUpload || !photoPreview || !analysisResults)
    return;

  // Reset file input
  photoUpload.value = "";

  // Show upload area, hide preview
  fileUploadArea.classList.remove("hidden");
  photoPreview.classList.add("hidden");

  // Reset results
  analysisResults.innerHTML = `
    <i class="fas fa-microscope text-4xl mb-4"></i>
    <p>Upload a photo to get started</p>
  `;
}

// Save to detection history
function saveToDetectionHistory(data, imageSrc, analysisId) {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");

  // Create a smaller thumbnail for storage
  createThumbnail(imageSrc, 150, 150)
    .then((thumbnail) => {
      // Save to Firebase with the analysis ID
      database
        .ref("detectionHistory/" + emailKey + "/" + analysisId)
        .set({
          date: new Date().toISOString(),
          plantType: data.plantType || "Unknown",
          condition: data.condition || "Unknown",
          severity: data.severity || "Unknown",
          confidence: data.confidence || "Unknown",
          status: data.condition === "healthy" ? "Healthy" : "Needs Attention",
          thumbnail: thumbnail,
          fullImage: imageSrc, // Save the full image as well
          fullData: data,
        })
        .then(() => {
          console.log("Detection saved to history");
          // Refresh the history table
          loadDetectionHistory();
        })
        .catch((error) => {
          console.error("Error saving detection to history:", error);
        });
    })
    .catch((error) => {
      console.error("Error creating thumbnail:", error);
    });
}

// Create a thumbnail from an image
function createThumbnail(imageSrc, maxWidth, maxHeight) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Calculate the new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL("image/jpeg"));
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}

// Load detection history from Firebase
function loadDetectionHistory() {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");
  const historyBody = document.getElementById("detection-history-body");

  if (!historyBody) return;

  // Clear existing history
  historyBody.innerHTML = "";

  // Load history from Firebase
  database
    .ref("detectionHistory/" + emailKey)
    .orderByChild("date")
    .limitToLast(10)
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        const detections = [];
        snapshot.forEach((childSnapshot) => {
          const detection = childSnapshot.val();
          detection.id = childSnapshot.key;
          detections.push(detection);
        });

        // Sort by date (newest first)
        detections.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Add detections to the table
        detections.forEach((detection) => {
          const row = document.createElement("tr");

          // Format the date
          const date = new Date(detection.date);
          const formattedDate = date.toLocaleDateString();

          // Determine status color
          let statusClass = "text-green-600";
          if (detection.status !== "Healthy") {
            if (detection.severity === "severe") {
              statusClass = "text-red-600";
            } else if (detection.severity === "moderate") {
              statusClass = "text-yellow-600";
            } else {
              statusClass = "text-blue-600";
            }
          }

          // Truncate long text for display
          const truncateText = (text, maxLength = 30) => {
            if (!text || text === "undefined") return "Unknown";
            return text.length > maxLength
              ? text.substring(0, maxLength) + "..."
              : text;
          };

          row.innerHTML = `
            <td class="px-4 py-3 text-primary">${formattedDate}</td>
            <td class="px-4 py-3 text-primary">${truncateText(
              detection.plantType
            )}</td>
            <td class="px-4 py-3 text-primary">${truncateText(
              detection.condition
            )}</td>
            <td class="px-4 py-3 text-primary">${detection.confidence}</td>
            <td class="px-4 py-3"><span class="${statusClass} px-2 py-1 rounded-full text-xs">${
            detection.status
          }</span></td>
          `;

          // Add click event to show details
          row.addEventListener("click", () => showDetectionDetails(detection));
          row.classList.add("cursor-pointer", "table-row-hover");

          historyBody.appendChild(row);
        });
      } else {
        // No history
        const row = document.createElement("tr");
        row.innerHTML = `
          <td colspan="5" class="px-4 py-8 text-center text-secondary">No detection history yet</td>
        `;
        historyBody.appendChild(row);
      }
    })
    .catch((error) => {
      console.error("Error loading detection history:", error);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td colspan="5" class="px-4 py-8 text-center text-red-500">Error loading detection history</td>
      `;
      historyBody.appendChild(row);
    });
}

// Show detection details in a modal
// Show detection details in a modal
function showDetectionDetails(detection) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('detection-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'detection-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
    document.body.appendChild(modal);
    
    // Add click outside to close
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeDetectionModal();
      }
    });
  }
  
  // Determine status color based on condition
  let statusColor = 'text-green-600';
  let statusIcon = 'fa-check-circle';
  let statusBgColor = 'bg-green-100';
  
  if (detection.condition !== 'healthy') {
    if (detection.severity === 'severe') {
      statusColor = 'text-red-600';
      statusIcon = 'fa-exclamation-triangle';
      statusBgColor = 'bg-red-100';
    } else if (detection.severity === 'moderate') {
      statusColor = 'text-yellow-600';
      statusIcon = 'fa-exclamation-circle';
      statusBgColor = 'bg-yellow-100';
    } else {
      statusColor = 'text-blue-600';
      statusIcon = 'fa-info-circle';
      statusBgColor = 'bg-blue-100';
    }
  }
  
  // Format the date
  const date = new Date(detection.date);
  const formattedDate = date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  // Create a scrollable container for the modal content
  const scrollableContainer = document.createElement('div');
  scrollableContainer.className = 'modal-scroll-container';
  scrollableContainer.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 1024px;
    height: 90vh;
    background-color: var(--card-bg);
    border-radius: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    z-index: 60;
    overflow: hidden;
  `;
  
  // Populate modal content
  scrollableContainer.innerHTML = `
    <!-- Modal Header -->
    <div class="flex justify-between items-center p-6" style="flex-shrink: 0; border-bottom: 1px solid var(--border-color);">
      <h3 class="text-lg font-semibold text-primary">Detection Details</h3>
      <button class="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100" onclick="closeDetectionModal()">
        <i class="fas fa-times text-xl"></i>
      </button>
    </div>
    
    <!-- Modal Body with Accordion - This is the scrollable part -->
    <div class="modal-body" style="flex: 1; overflow-y: auto; padding: 1.5rem; scrollbar-width: none; -ms-overflow-style: none;">
      <!-- Image Section -->
      <div class="mb-6">
        <div class="flex flex-col items-center">
          <img src="${detection.fullImage || detection.thumbnail}" alt="Plant image" class="max-w-full max-h-64 object-contain rounded-lg shadow-md cursor-pointer" onclick="viewFullImage('${detection.fullImage || detection.thumbnail}')">
          <p class="text-xs text-secondary mt-2">Click to view full image</p>
          <div class="mt-4">
            <span class="${statusBgColor} ${statusColor} px-3 py-1 rounded-full text-sm font-medium">
              <i class="fas ${statusIcon} mr-1"></i>
              ${detection.condition === 'healthy' ? 'Healthy' : detection.condition}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Basic Info Accordion -->
      <div class="mb-4">
        <button class="accordion-button w-full flex justify-between items-center p-4 rounded-lg transition-colors" style="background-color: var(--bg-secondary);" onclick="toggleAccordion('basic-info')">
          <span class="font-medium text-primary flex items-center">
            <i class="fas fa-info-circle mr-2 text-blue-500"></i>
            Basic Information
          </span>
          <i class="fas fa-chevron-down text-gray-500 transition-transform" id="basic-info-icon"></i>
        </button>
        <div class="accordion-content hidden p-4 rounded-lg mt-2" style="background-color: var(--bg-primary);" id="basic-info">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-secondary">Date & Time</p>
              <p class="font-medium text-primary">${formattedDate}</p>
            </div>
            <div>
              <p class="text-sm text-secondary">Plant Type</p>
              <p class="font-medium text-primary">${detection.plantType || 'Unknown'}</p>
            </div>
            <div>
              <p class="text-sm text-secondary">Condition</p>
              <p class="font-medium text-primary">${detection.condition || 'Unknown'}</p>
            </div>
            <div>
              <p class="text-sm text-secondary">Severity</p>
              <p class="font-medium text-primary">${detection.severity || 'Unknown'}</p>
            </div>
            <div>
              <p class="text-sm text-secondary">Confidence</p>
              <p class="font-medium text-primary">${detection.confidence || 'Unknown'}</p>
            </div>
            <div>
              <p class="text-sm text-secondary">Status</p>
              <p class="font-medium ${statusColor}">${detection.status}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Description Accordion -->
      ${detection.fullData && detection.fullData.description ? `
        <div class="mb-4">
          <button class="accordion-button w-full flex justify-between items-center p-4 rounded-lg transition-colors" style="background-color: var(--bg-secondary);" onclick="toggleAccordion('description')">
            <span class="font-medium text-primary flex items-center">
              <i class="fas fa-file-alt mr-2 text-purple-500"></i>
              Description
            </span>
            <i class="fas fa-chevron-down text-gray-500 transition-transform" id="description-icon"></i>
          </button>
          <div class="accordion-content hidden p-4 rounded-lg mt-2" style="background-color: var(--bg-primary);" id="description">
            <p class="text-sm text-primary">${detection.fullData.description}</p>
          </div>
        </div>
      ` : ''}
      
      <!-- Recommendations Accordion -->
      ${detection.fullData && detection.fullData.recommendations && detection.fullData.recommendations.length > 0 ? `
        <div class="mb-4">
          <button class="accordion-button w-full flex justify-between items-center p-4 rounded-lg transition-colors" style="background-color: var(--bg-secondary);" onclick="toggleAccordion('recommendations')">
            <span class="font-medium text-primary flex items-center">
              <i class="fas fa-lightbulb mr-2 text-yellow-500"></i>
              Recommendations
            </span>
            <i class="fas fa-chevron-down text-gray-500 transition-transform" id="recommendations-icon"></i>
          </button>
          <div class="accordion-content hidden p-4 rounded-lg mt-2" style="background-color: var(--bg-primary);" id="recommendations">
            <ul class="list-disc list-inside text-sm text-primary space-y-2">
              ${detection.fullData.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        </div>
      ` : ''}
      
      <!-- Prevention Accordion -->
      ${detection.fullData && detection.fullData.prevention && detection.fullData.prevention.length > 0 ? `
        <div class="mb-4">
          <button class="accordion-button w-full flex justify-between items-center p-4 rounded-lg transition-colors" style="background-color: var(--bg-secondary);" onclick="toggleAccordion('prevention')">
            <span class="font-medium text-primary flex items-center">
              <i class="fas fa-shield-alt mr-2 text-green-500"></i>
              Prevention
            </span>
            <i class="fas fa-chevron-down text-gray-500 transition-transform" id="prevention-icon"></i>
          </button>
          <div class="accordion-content hidden p-4 rounded-lg mt-2" style="background-color: var(--bg-primary);" id="prevention">
            <ul class="list-disc list-inside text-sm text-primary space-y-2">
              ${detection.fullData.prevention.map(prev => `<li>${prev}</li>`).join('')}
            </ul>
          </div>
        </div>
      ` : ''}
    </div>
    
    <!-- Modal Footer -->
    <div class="flex justify-end p-6" style="flex-shrink: 0; border-top: 1px solid var(--border-color);">
      <button class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700" onclick="closeDetectionModal()">
        Close
      </button>
    </div>
  `;
  
  // Clear any existing content and add the new scrollable container
  modal.innerHTML = '';
  modal.appendChild(scrollableContainer);
  
  // Show modal
  modal.classList.remove('hidden');
}

// Toggle accordion sections
function toggleAccordion(sectionId) {
  const content = document.getElementById(sectionId);
  const icon = document.getElementById(sectionId + '-icon');
  
  if (content && icon) {
    content.classList.toggle('hidden');
    icon.classList.toggle('rotate-180');
  }
}

// View full image in a separate modal
function viewFullImage(imageSrc) {
  // Create image modal if it doesn't exist
  let imageModal = document.getElementById('image-modal');
  if (!imageModal) {
    imageModal = document.createElement('div');
    imageModal.id = 'image-modal';
    imageModal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 hidden';
    document.body.appendChild(imageModal);
    
    // Add click outside to close
    imageModal.addEventListener('click', function(e) {
      if (e.target === imageModal) {
        closeImageModal();
      }
    });
  }
  
  // Create a scrollable container for the image
  const imageContainer = document.createElement('div');
  imageContainer.className = 'relative max-w-4xl max-h-[90vh]';
  imageContainer.style.cssText = 'overflow: auto; scrollbar-width: none; -ms-overflow-style: none;';
  
  // Populate image modal content
  imageContainer.innerHTML = `
    <button class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 z-10" onclick="closeImageModal()">
      <i class="fas fa-times text-xl"></i>
    </button>
    <img src="${imageSrc}" alt="Full size plant image" class="max-w-full max-h-[90vh] object-contain">
  `;
  
  // Clear any existing content and add the new image container
  imageModal.innerHTML = '';
  imageModal.appendChild(imageContainer);
  
  // Show image modal
  imageModal.classList.remove('hidden');
}

// Close the image modal
function closeImageModal() {
  const imageModal = document.getElementById('image-modal');
  if (imageModal) {
    imageModal.classList.add('hidden');
  }
}

// Close the detection modal
function closeDetectionModal() {
  const modal = document.getElementById('detection-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// View full image in a separate modal
function viewFullImage(imageSrc) {
  // Create image modal if it doesn't exist
  let imageModal = document.getElementById("image-modal");
  if (!imageModal) {
    imageModal = document.createElement("div");
    imageModal.id = "image-modal";
    imageModal.className =
      "fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 hidden";
    document.body.appendChild(imageModal);

    // Add click outside to close
    imageModal.addEventListener("click", function (e) {
      if (e.target === imageModal) {
        closeImageModal();
      }
    });
  }

  // Populate image modal content
  imageModal.innerHTML = `
    <div class="relative max-w-4xl max-h-[90vh] overflow-auto">
      <button class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70" onclick="closeImageModal()">
        <i class="fas fa-times text-xl"></i>
      </button>
      <img src="${imageSrc}" alt="Full size plant image" class="max-w-full max-h-[90vh] object-contain">
    </div>
  `;

  // Show image modal
  imageModal.classList.remove("hidden");
}

// Close the image modal
function closeImageModal() {
  const imageModal = document.getElementById("image-modal");
  if (imageModal) {
    imageModal.classList.add("hidden");
  }
}

// Close the detection modal
function closeDetectionModal() {
  const modal = document.getElementById("detection-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

// Get current user data
function getCurrentUserData() {
  try {
    const userData = localStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  } catch (e) {
    return null;
  }
}
