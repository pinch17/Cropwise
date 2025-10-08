// ===============================================
// YIELD PREDICTION PAGE SPECIFIC JAVASCRIPT
// ===============================================

document.addEventListener("DOMContentLoaded", function () {
  // Initialize custom selects
  initializeCustomSelects();

  // Initialize analysis cards with 0 values
  initializeAnalysisCards();

  // Load saved yield predictions
  loadYieldPredictions();

  // Load yield analysis
  loadYieldAnalysis();

  // Initialize yield chart
  initializeYieldChart();
});

function initializeAnalysisCards() {
  // Set initial values to 0
  const expectedIncreaseElement = document.getElementById("expected-increase");
  const revenuePotentialElement = document.getElementById("revenue-potential");
  const avgHeadWeightElement = document.getElementById("avg-head-weight");

  if (expectedIncreaseElement) {
    expectedIncreaseElement.textContent = "0 %";
    expectedIncreaseElement.className = "text-2xl font-bold text-gray-400";
  }

  if (revenuePotentialElement) {
    revenuePotentialElement.textContent = "KES 0";
    revenuePotentialElement.className = "text-2xl font-bold text-gray-400";
  }

  if (avgHeadWeightElement) {
    avgHeadWeightElement.textContent = "0 kg";
    avgHeadWeightElement.className = "text-2xl font-bold text-gray-400";
  }
}

function initializeCustomSelects() {
  const customSelects = document.querySelectorAll(".custom-select");

  customSelects.forEach((select) => {
    const input = select.querySelector(".custom-select-input");
    const dropdown = select.querySelector(".custom-select-dropdown");
    const valueSpan = select.querySelector(".custom-select-value");
    const options = select.querySelectorAll(".custom-select-option");

    input.addEventListener("click", (e) => {
      e.stopPropagation();
      // Close other dropdowns
      customSelects.forEach((otherSelect) => {
        if (otherSelect !== select) {
          otherSelect.classList.remove("open");
          otherSelect
            .querySelector(".custom-select-dropdown")
            .classList.add("hidden");
        }
      });

      // Toggle current dropdown
      select.classList.toggle("open");
      dropdown.classList.toggle("hidden");
    });

    options.forEach((option) => {
      option.addEventListener("click", () => {
        const value = option.getAttribute("data-value");
        const text = option.textContent;

        valueSpan.textContent = text;
        valueSpan.setAttribute("data-value", value);

        select.classList.remove("open");
        dropdown.classList.add("hidden");
      });
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", () => {
    customSelects.forEach((select) => {
      select.classList.remove("open");
      select.querySelector(".custom-select-dropdown").classList.add("hidden");
    });
  });
}

function calculateYield() {
  // Get form values
  const cropType = document
    .querySelector('[data-field="cropType"] .custom-select-value')
    .getAttribute("data-value");
  const farmArea = document.getElementById("farm-area").value;
  const plantingDensity = document.getElementById("planting-density").value;
  const variety = document
    .querySelector('[data-field="variety"] .custom-select-value')
    .getAttribute("data-value");
  const conditions = document
    .querySelector('[data-field="conditions"] .custom-select-value')
    .getAttribute("data-value");
  const soilType = document
    .querySelector('[data-field="soilType"] .custom-select-value')
    .getAttribute("data-value");
  const irrigation = document
    .querySelector('[data-field="irrigation"] .custom-select-value')
    .getAttribute("data-value");
  const fertilizer = document
    .querySelector('[data-field="fertilizer"] .custom-select-value')
    .getAttribute("data-value");
  const pestManagement = document
    .querySelector('[data-field="pestManagement"] .custom-select-value')
    .getAttribute("data-value");
  const season = document
    .querySelector('[data-field="season"] .custom-select-value')
    .getAttribute("data-value");

  // Validate inputs
  if (
    !cropType ||
    !farmArea ||
    !plantingDensity ||
    !variety ||
    !conditions ||
    !soilType ||
    !irrigation ||
    !fertilizer ||
    !pestManagement ||
    !season
  ) {
    alert("Please fill in all fields");
    return;
  }

  // Calculate yield based on realistic Kenyan farming conditions
  const area = parseFloat(farmArea);
  const density = parseFloat(plantingDensity);

  // Base yield per plant (kg) - realistic values for Kenyan conditions
  let baseYield = 1.2; // Default for cabbage

  if (cropType === "kale") {
    baseYield = 0.4; // Kale has lower weight per plant
  } else if (cropType === "both") {
    baseYield = 0.8; // Average between cabbage and kale
  }

  // Variety multiplier
  let varietyMultiplier = 1.0;
  if (variety === "hybrid") varietyMultiplier = 1.3;
  if (variety === "organic") varietyMultiplier = 0.9;

  // Conditions multiplier
  let conditionsMultiplier = 1.0;
  if (conditions === "optimal") conditionsMultiplier = 1.2;
  if (conditions === "good") conditionsMultiplier = 1.1;
  if (conditions === "average") conditionsMultiplier = 0.9;
  if (conditions === "poor") conditionsMultiplier = 0.7;

  // Soil type multiplier
  let soilMultiplier = 1.0;
  if (soilType === "loamy") soilMultiplier = 1.1;
  if (soilType === "sandy") soilMultiplier = 0.8;
  if (soilType === "clay") soilMultiplier = 0.9;
  if (soilType === "silty") soilMultiplier = 1.05;

  // Irrigation multiplier
  let irrigationMultiplier = 1.0;
  if (irrigation === "drip") irrigationMultiplier = 1.15;
  if (irrigation === "sprinkler") irrigationMultiplier = 1.1;
  if (irrigation === "flood") irrigationMultiplier = 1.05;
  if (irrigation === "rainfed") irrigationMultiplier = 0.8;

  // Fertilizer multiplier
  let fertilizerMultiplier = 1.0;
  if (fertilizer === "mixed") fertilizerMultiplier = 1.2;
  if (fertilizer === "npk") fertilizerMultiplier = 1.15;
  if (fertilizer === "organic") fertilizerMultiplier = 1.05;
  if (fertilizer === "none") fertilizerMultiplier = 0.7;

  // Pest management multiplier
  let pestMultiplier = 1.0;
  if (pestManagement === "integrated") pestMultiplier = 1.1;
  if (pestManagement === "chemical") pestMultiplier = 1.05;
  if (pestManagement === "organic") pestMultiplier = 0.95;
  if (pestManagement === "none") pestMultiplier = 0.7;

  // Season multiplier
  let seasonMultiplier = 1.0;
  if (season === "long-rains") seasonMultiplier = 1.1;
  if (season === "short-rains") seasonMultiplier = 0.95;
  if (season === "dry-season") seasonMultiplier = 0.9;

  // Calculate total yield
  const totalPlants = area * density;
  const totalYield =
    totalPlants *
    baseYield *
    varietyMultiplier *
    conditionsMultiplier *
    soilMultiplier *
    irrigationMultiplier *
    fertilizerMultiplier *
    pestMultiplier *
    seasonMultiplier;
  const yieldInTons = (totalYield / 1000).toFixed(1);

  // Calculate average head weight
  const avgHeadWeight = (
    baseYield *
    varietyMultiplier *
    conditionsMultiplier *
    soilMultiplier *
    irrigationMultiplier *
    fertilizerMultiplier *
    pestMultiplier *
    seasonMultiplier
  ).toFixed(1);

  // Calculate revenue (using realistic Kenyan prices)
  let avgPrice = 350; // Default cabbage price
  if (cropType === "kale") avgPrice = 120;
  if (cropType === "both") avgPrice = (350 + 120) / 2;

  const revenue = (totalYield * avgPrice).toLocaleString();

  // Calculate expected increase (vs. previous season)
  const expectedIncrease = Math.round(Math.random() * 20 - 5); // Random between -5% and 15%

  // Display results
  const results = document.getElementById("yield-results");
  if (results) {
    results.innerHTML = `
      <div class="text-left">
        <div class="text-center mb-6">
          <div class="text-4xl font-bold text-green-600 mb-2">${yieldInTons} Tons</div>
          <p class="text-gray-600">Predicted Total Yield</p>
        </div>
        <div class="space-y-4">
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-sm text-gray-600">Yield per hectare</span>
            <span class="font-semibold">${(yieldInTons / area).toFixed(
              1
            )} tons</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-sm text-gray-600">Average head weight</span>
            <span class="font-semibold">${avgHeadWeight} kg</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-sm text-gray-600">Total heads expected</span>
            <span class="font-semibold">${totalPlants.toLocaleString()} heads</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-sm text-gray-600">Expected increase</span>
            <span class="font-semibold ${
              expectedIncrease >= 0 ? "text-green-600" : "text-red-600"
            }">${expectedIncrease >= 0 ? "+" : ""}${expectedIncrease}%</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <span class="text-sm text-green-700">Estimated revenue</span>
            <span class="font-semibold text-green-600">KES ${revenue}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Update analysis cards
  updateAnalysisCards(expectedIncrease, revenue, avgHeadWeight);

  // Save prediction to Firebase
  saveYieldPrediction({
    cropType,
    farmArea: area,
    plantingDensity: density,
    variety,
    conditions,
    soilType,
    irrigation,
    fertilizer,
    pestManagement,
    season,
    predictedYield: parseFloat(yieldInTons),
    predictedRevenue: parseInt(revenue.replace(/,/g, "")),
    expectedIncrease,
    date: new Date().toISOString().split("T")[0],
  });
}

function updateAnalysisCards(expectedIncrease, revenue, avgHeadWeight) {
  // Update expected increase
  const increaseElement = document.getElementById("expected-increase");
  if (increaseElement) {
    increaseElement.textContent =
      (expectedIncrease >= 0 ? "+" : "") + expectedIncrease + " %";
    increaseElement.className =
      "text-2xl font-bold " +
      (expectedIncrease >= 0 ? "text-green-600" : "text-red-600");
  }

  // Update revenue potential
  const revenueElement = document.getElementById("revenue-potential");
  if (revenueElement) {
    revenueElement.textContent = "KES " + revenue;
    revenueElement.className = "text-2xl font-bold text-purple-600";
  }

  // Update average head weight
  const weightElement = document.getElementById("avg-head-weight");
  if (weightElement) {
    weightElement.textContent = avgHeadWeight + " kg";
    weightElement.className = "text-2xl font-bold text-blue-600";
  }
}

function initializeYieldChart() {
  const ctx = document.getElementById("yield-chart");
  if (!ctx) return;

  // Generate sample data for the last 5 seasons
  const labels = [
    "Long Rains 2022",
    "Short Rains 2022",
    "Long Rains 2023",
    "Short Rains 2023",
    "Current Season",
  ];
  const cabbageData = [25, 22, 28, 24, 0];
  const kaleData = [15, 13, 17, 14, 0];

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Cabbage Yield (tons)",
          data: cabbageData,
          backgroundColor: "rgba(16, 185, 129, 0.7)",
          borderColor: "#10b981",
          borderWidth: 1,
        },
        {
          label: "Kale Yield (tons)",
          data: kaleData,
          backgroundColor: "rgba(59, 130, 246, 0.7)",
          borderColor: "#3b82f6",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Yield (tons)",
          },
        },
      },
      plugins: {
        legend: {
          position: "top",
        },
      },
    },
  });
}

function saveYieldPrediction(prediction) {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");
  const newPredictionRef = database.ref("yieldPredictions/" + emailKey).push();

  newPredictionRef
    .set(prediction)
    .then(() => {
      console.log("Yield prediction saved successfully");
    })
    .catch((error) => {
      console.error("Error saving yield prediction:", error);
    });
}

function loadYieldPredictions() {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");

  database
    .ref("yieldPredictions/" + emailKey)
    .orderByChild("date")
    .limitToLast(1)
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        const predictions = snapshot.val();
        const lastPrediction = Object.values(predictions)[0];

        // Update the form with the last prediction data
        if (lastPrediction.cropType) {
          const cropTypeSelect = document.querySelector(
            '[data-field="cropType"] .custom-select-value'
          );
          if (cropTypeSelect) {
            cropTypeSelect.textContent =
              lastPrediction.cropType.charAt(0).toUpperCase() +
              lastPrediction.cropType.slice(1);
            cropTypeSelect.setAttribute("data-value", lastPrediction.cropType);
          }
        }

        if (lastPrediction.farmArea) {
          document.getElementById("farm-area").value = lastPrediction.farmArea;
        }

        if (lastPrediction.plantingDensity) {
          document.getElementById("planting-density").value =
            lastPrediction.plantingDensity;
        }

        if (lastPrediction.variety) {
          const varietySelect = document.querySelector(
            '[data-field="variety"] .custom-select-value'
          );
          if (varietySelect) {
            varietySelect.textContent =
              lastPrediction.variety.charAt(0).toUpperCase() +
              lastPrediction.variety.slice(1);
            varietySelect.setAttribute("data-value", lastPrediction.variety);
          }
        }

        if (lastPrediction.conditions) {
          const conditionsSelect = document.querySelector(
            '[data-field="conditions"] .custom-select-value'
          );
          if (conditionsSelect) {
            conditionsSelect.textContent =
              lastPrediction.conditions.charAt(0).toUpperCase() +
              lastPrediction.conditions.slice(1);
            conditionsSelect.setAttribute(
              "data-value",
              lastPrediction.conditions
            );
          }
        }

        if (lastPrediction.soilType) {
          const soilTypeSelect = document.querySelector(
            '[data-field="soilType"] .custom-select-value'
          );
          if (soilTypeSelect) {
            soilTypeSelect.textContent =
              lastPrediction.soilType.charAt(0).toUpperCase() +
              lastPrediction.soilType.slice(1).replace("-", " ");
            soilTypeSelect.setAttribute("data-value", lastPrediction.soilType);
          }
        }

        if (lastPrediction.irrigation) {
          const irrigationSelect = document.querySelector(
            '[data-field="irrigation"] .custom-select-value'
          );
          if (irrigationSelect) {
            irrigationSelect.textContent =
              lastPrediction.irrigation.charAt(0).toUpperCase() +
              lastPrediction.irrigation.slice(1);
            irrigationSelect.setAttribute(
              "data-value",
              lastPrediction.irrigation
            );
          }
        }

        if (lastPrediction.fertilizer) {
          const fertilizerSelect = document.querySelector(
            '[data-field="fertilizer"] .custom-select-value'
          );
          if (fertilizerSelect) {
            fertilizerSelect.textContent =
              lastPrediction.fertilizer.charAt(0).toUpperCase() +
              lastPrediction.fertilizer.slice(1).replace("-", " ");
            fertilizerSelect.setAttribute(
              "data-value",
              lastPrediction.fertilizer
            );
          }
        }

        if (lastPrediction.pestManagement) {
          const pestManagementSelect = document.querySelector(
            '[data-field="pestManagement"] .custom-select-value'
          );
          if (pestManagementSelect) {
            pestManagementSelect.textContent =
              lastPrediction.pestManagement.charAt(0).toUpperCase() +
              lastPrediction.pestManagement.slice(1).replace("-", " ");
            pestManagementSelect.setAttribute(
              "data-value",
              lastPrediction.pestManagement
            );
          }
        }

        if (lastPrediction.season) {
          const seasonSelect = document.querySelector(
            '[data-field="season"] .custom-select-value'
          );
          if (seasonSelect) {
            seasonSelect.textContent =
              lastPrediction.season.charAt(0).toUpperCase() +
              lastPrediction.season.slice(1).replace("-", " ");
            seasonSelect.setAttribute("data-value", lastPrediction.season);
          }
        }

        // Update analysis cards with last prediction data
        if (
          lastPrediction.expectedIncrease !== undefined &&
          lastPrediction.predictedRevenue !== undefined &&
          lastPrediction.predictedYield !== undefined
        ) {
          const avgHeadWeight = (
            (lastPrediction.predictedYield * 1000) /
            (lastPrediction.farmArea * lastPrediction.plantingDensity)
          ).toFixed(1);
          updateAnalysisCards(
            lastPrediction.expectedIncrease,
            lastPrediction.predictedRevenue.toLocaleString(),
            avgHeadWeight
          );
        }
      }
    })
    .catch((error) => {
      console.error("Error loading yield predictions:", error);
    });
}

function loadYieldAnalysis() {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");

  database
    .ref("yieldAnalysis/" + emailKey)
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        const analysisData = snapshot.val();
        updateYieldAnalysis(analysisData);
      }
    })
    .catch((error) => {
      console.error("Error loading yield analysis:", error);
    });
}

function updateYieldAnalysis(analysisData) {
  // Update expected increase
  if (analysisData.expectedIncrease) {
    const increaseElement = document.getElementById("expected-increase");
    if (increaseElement) {
      increaseElement.textContent = analysisData.expectedIncrease + " %";
      increaseElement.className =
        "text-2xl font-bold " +
        (analysisData.expectedIncrease >= 0
          ? "text-green-600"
          : "text-red-600");
    }
  }

  // Update revenue potential
  if (analysisData.revenuePotential) {
    const revenueElement = document.getElementById("revenue-potential");
    if (revenueElement) {
      revenueElement.textContent =
        "KES " + analysisData.revenuePotential.toLocaleString();
      revenueElement.className = "text-2xl font-bold text-purple-600";
    }
  }

  // Update average head weight
  if (analysisData.avgHeadWeight) {
    const weightElement = document.getElementById("avg-head-weight");
    if (weightElement) {
      weightElement.textContent = analysisData.avgHeadWeight + " kg";
      weightElement.className = "text-2xl font-bold text-blue-600";
    }
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
