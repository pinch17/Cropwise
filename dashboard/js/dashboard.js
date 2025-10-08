// ===============================================
// DASHBOARD PAGE SPECIFIC JAVASCRIPT
// ===============================================

document.addEventListener("DOMContentLoaded", function () {
  // Load user-specific dashboard data
  loadDashboardData();

  // Initialize any dashboard-specific charts or widgets
  initializeDashboardWidgets();

  // Fetch real weather data for Nakuru, Rongai
  fetchWeatherData();

  // Set fixed market prices
  setFixedMarketPrices();
});

function loadDashboardData() {
  const userData = getCurrentUserData();
  if (!userData) return;

  // Get user's farm data from Firebase
  const emailKey = userData.email.replace(/\./g, "_");
  database
    .ref("farms/" + emailKey)
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        const farmData = snapshot.val();

        // Update dashboard with user's farm data
        updateDashboardWithFarmData(farmData);
      } else {
        console.log("No farm data available, creating default data");
        createDefaultFarmData();
      }
    })
    .catch((error) => {
      console.error("Error loading farm data:", error);
    });
}

function createDefaultFarmData() {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");

  // Current date for realistic calculations
  const now = new Date();

  // Cabbage: planted 5 weeks ago, harvest in 7 weeks (3 month cycle)
  const cabbagePlanted = new Date(now);
  cabbagePlanted.setDate(cabbagePlanted.getDate() - 35); // 5 weeks ago
  const cabbageHarvest = new Date(now);
  cabbageHarvest.setDate(cabbageHarvest.getDate() + 49); // 7 weeks from now

  // Kale: planted 3 weeks ago, harvest in 9 weeks (3 month cycle)
  const kalePlanted = new Date(now);
  kalePlanted.setDate(kalePlanted.getDate() - 21); // 3 weeks ago
  const kaleHarvest = new Date(now);
  kaleHarvest.setDate(kaleHarvest.getDate() + 63); // 9 weeks from now

  const defaultFarmData = {
    healthyPlantsPercentage: 87.5, // Realistic: mix of healthy and some pest/disease affected
    expectedYield: 8.2, // Realistic for small-scale mixed farming
    cropPrices: {
      cabbage: 350,
      kale: 120,
    },
    growthProgress: {
      cabbage: 42,
      kale: 25, // 3 weeks into 12 week cycle = 25%
    },
    crops: [
      {
        name: "Cabbage",
        plantedDate: cabbagePlanted.toISOString().split("T")[0],
        expectedHarvestDate: cabbageHarvest.toISOString().split("T")[0],
        area: "0.4 acres", // Realistic small farm size
        health: 85, // Some pest pressure but generally healthy
      },
      {
        name: "Kale",
        plantedDate: kalePlanted.toISOString().split("T")[0],
        expectedHarvestDate: kaleHarvest.toISOString().split("T")[0],
        area: "0.25 acres", // Smaller plot for kale
        health: 90, // Kale is hardy and disease-resistant
      },
    ],
    lastUpdated: new Date().toISOString(),
  };

  database
    .ref("farms/" + emailKey)
    .set(defaultFarmData)
    .then(() => {
      console.log("Default farm data created");
      updateDashboardWithFarmData(defaultFarmData);
    })
    .catch((error) => {
      console.error("Error creating default farm data:", error);
    });
}

function updateDashboardWithFarmData(farmData) {
  // Update healthy plants percentage
  if (farmData.healthyPlantsPercentage !== undefined) {
    const healthyPlantsElement = document.querySelector(
      ".card-hover .text-2xl"
    );
    if (healthyPlantsElement) {
      healthyPlantsElement.textContent =
        farmData.healthyPlantsPercentage.toFixed(1) + " %";
    }
  }

  // Update expected yield
  if (farmData.expectedYield !== undefined) {
    const yieldElements = document.querySelectorAll(".card-hover .text-2xl");
    if (yieldElements.length > 1) {
      yieldElements[1].textContent =
        farmData.expectedYield.toFixed(1) + " tonnes";
    }
  }

  // Update crop prices
  if (farmData.cropPrices) {
    const priceElements = document.querySelectorAll(".card-hover .text-2xl");
    if (farmData.cropPrices.cabbage !== undefined && priceElements.length > 2) {
      priceElements[2].textContent =
        "Ksh " + farmData.cropPrices.cabbage.toFixed(0) + " / kg";
    }
    if (farmData.cropPrices.kale !== undefined && priceElements.length > 3) {
      priceElements[3].textContent =
        "Ksh " + farmData.cropPrices.kale.toFixed(0) + " / kg";
    }
  }

  // Update growth progress
  if (farmData.growthProgress) {
    const progressBars = document.querySelectorAll(".bg-green-600.h-2");
    if (
      farmData.growthProgress.cabbage !== undefined &&
      progressBars.length > 0
    ) {
      progressBars[0].style.width = farmData.growthProgress.cabbage + "%";
      const progressText = document.querySelectorAll(
        ".text-sm.font-semibold.text-green-600"
      );
      if (progressText.length > 0) {
        progressText[0].textContent = farmData.growthProgress.cabbage + "%";
      }
    }
    if (farmData.growthProgress.kale !== undefined && progressBars.length > 1) {
      progressBars[1].style.width = farmData.growthProgress.kale + "%";
      const progressText = document.querySelectorAll(
        ".text-sm.font-semibold.text-green-600"
      );
      if (progressText.length > 1) {
        progressText[1].textContent = farmData.growthProgress.kale + "%";
      }
    }
  }
}

function initializeDashboardWidgets() {
  // Initialize weather widget
  // This will be handled by fetchWeatherData()
  // Initialize any other dashboard-specific widgets
}

// Function to save dashboard data to Firebase
function saveDashboardData(data) {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");
  database
    .ref("farms/" + emailKey)
    .update(data)
    .then(() => {
      console.log("Dashboard data saved successfully");
    })
    .catch((error) => {
      console.error("Error saving dashboard data:", error);
    });
}

// Function to fetch real weather data for Nakuru, Rongai
function fetchWeatherData() {
  // Fixed location: Nakuru, Rongai
  // Coordinates: -0.2833, 36.0667
  const nakuruLat = -0.2833;
  const nakuruLon = 36.0667;

  // Update location display
  updateLocationDisplay(nakuruLat, nakuruLon, "Nakuru, Rongai");

  // Get weather data for Nakuru
  getWeatherByCoordinates(nakuruLat, nakuruLon);
}

// Function to update location display in the UI
function updateLocationDisplay(lat, lon, locationName = null) {
  const locationElement = document.querySelector(".location-display");

  if (locationElement) {
    if (locationName) {
      locationElement.innerHTML = `<i class="fas fa-map-marker-alt mr-2"></i>${locationName}`;
    } else {
      // If we don't have a location name, use coordinates
      locationElement.innerHTML = `<i class="fas fa-map-marker-alt mr-2"></i>${lat.toFixed(
        4
      )}, ${lon.toFixed(4)}`;
    }
  }
}

// Function to get weather data by coordinates
function getWeatherByCoordinates(lat, lon) {
  // Using OpenWeatherMap API (you'll need to sign up for a free API key)
  // For demonstration, I'm using a public key, but in production, you should use your own
  const apiKey = "4d8fb5b93d4af21d66a2948710284366";
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      updateWeatherWidget(data);
      saveWeatherDataToFirebase(data);
      // Don't update location display with the city name from weather data
      // Keep showing "Nakuru, Rongai" regardless of API response
    })
    .catch((error) => {
      console.error("Error fetching weather data:", error);
      // Fallback to default weather data
      updateWeatherWidget(null);
    });
}

// Function to update the weather widget
function updateWeatherWidget(weatherData) {
  const weatherIcon = document.querySelector(".weather-icon");
  const temperatureElement = document.querySelector(
    ".text-3xl.font-bold.text-primary"
  );
  const conditionElement = document.querySelector(".text-secondary.mb-4");
  const humidityElement = document.querySelector(
    ".grid.grid-cols-2.gap-4 .font-semibold.text-primary"
  );
  const windElement = document.querySelectorAll(
    ".grid.grid-cols-2.gap-4 .font-semibold.text-primary"
  )[1];

  if (weatherData) {
    // Update with real weather data
    const { main, weather, wind } = weatherData;
    const temperature = main.temp;
    const condition = weather[0].main;
    const humidity = main.humidity;
    const windSpeed = wind.speed;

    // Update temperature
    if (temperatureElement) {
      temperatureElement.textContent = `${temperature.toFixed(1)}°C`;
    }

    // Update condition
    if (conditionElement) {
      conditionElement.textContent = condition;
    }

    // Update humidity
    if (humidityElement) {
      humidityElement.textContent = `${humidity}%`;
    }

    // Update wind speed
    if (windElement) {
      windElement.textContent = `${windSpeed.toFixed(1)} km/h`;
    }

    // Update weather icon based on condition
    if (weatherIcon) {
      weatherIcon.className = "fas weather-icon mb-4";

      switch (condition.toLowerCase()) {
        case "clear":
          weatherIcon.classList.add("fa-sun", "text-yellow-500");
          break;
        case "clouds":
          weatherIcon.classList.add("fa-cloud", "text-gray-500");
          break;
        case "rain":
          weatherIcon.classList.add("fa-cloud-rain", "text-blue-500");
          break;
        case "thunderstorm":
          weatherIcon.classList.add("fa-bolt", "text-purple-500");
          break;
        case "snow":
          weatherIcon.classList.add("fa-snowflake", "text-blue-300");
          break;
        case "mist":
        case "fog":
          weatherIcon.classList.add("fa-smog", "text-gray-400");
          break;
        default:
          weatherIcon.classList.add("fa-sun", "text-yellow-500");
      }
    }
  } else {
    // Fallback to default weather data
    if (temperatureElement) {
      temperatureElement.textContent = "22°C";
    }
    if (conditionElement) {
      conditionElement.textContent = "Sunny";
    }
    if (humidityElement) {
      humidityElement.textContent = "65%";
    }
    if (windElement) {
      windElement.textContent = "12 km/h";
    }
    if (weatherIcon) {
      weatherIcon.className = "fas fa-sun weather-icon mb-4 text-yellow-500";
    }
  }
}

// Function to save weather data to Firebase
function saveWeatherDataToFirebase(weatherData) {
  const userData = getCurrentUserData();
  if (!userData || !weatherData) return;

  const emailKey = userData.email.replace(/\./g, "_");
  const weatherInfo = {
    temperature: weatherData.main.temp,
    condition: weatherData.weather[0].main,
    humidity: weatherData.main.humidity,
    windSpeed: weatherData.wind.speed,
    location: "Nakuru, Rongai", // Always save as Nakuru, Rongai
    timestamp: new Date().toISOString(),
  };

  database
    .ref("weather/" + emailKey)
    .set(weatherInfo)
    .then(() => {
      console.log("Weather data saved to Firebase");
    })
    .catch((error) => {
      console.error("Error saving weather data to Firebase:", error);
    });
}

// Function to set fixed market prices
function setFixedMarketPrices() {
  // Fixed prices for cabbage and kale
  const fixedPrices = {
    cabbage: 350,
    kale: 120,
  };

  // Update UI with fixed prices
  updateMarketPrices(fixedPrices);

  // Also update the farm data
  const userData = getCurrentUserData();
  if (userData) {
    const emailKey = userData.email.replace(/\./g, "_");
    database
      .ref("farms/" + emailKey + "/cropPrices")
      .update(fixedPrices)
      .then(() => {
        console.log("Fixed market prices saved to Firebase");
      })
      .catch((error) => {
        console.error("Error saving fixed market prices:", error);
      });
  }
}

// Function to update market prices in the UI
function updateMarketPrices(prices) {
  const priceElements = document.querySelectorAll(".card-hover .text-2xl");

  if (prices.cabbage !== undefined && priceElements.length > 2) {
    priceElements[2].textContent = `Ksh ${prices.cabbage.toFixed(0)} / kg`;
  }

  if (prices.kale !== undefined && priceElements.length > 3) {
    priceElements[3].textContent = `Ksh ${prices.kale.toFixed(0)} / kg`;
  }
}

// Function to calculate expected yield based on crop data
function calculateExpectedYield() {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");

  database
    .ref("farms/" + emailKey + "/crops")
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        const crops = snapshot.val();
        let totalYield = 0;

        // Calculate expected yield for each crop
        crops.forEach((crop) => {
          // This is a simplified calculation
          // In a real application, you would use more complex formulas
          // based on crop type, area, growth stage, health, etc.

          const areaInAcres = parseFloat(crop.area) || 0;
          const healthFactor = (crop.health || 100) / 100;

          // Realistic average yield per acre for different crops in Kenya (tonnes)
          // These are conservative estimates for small-scale farming
          const yieldPerAcre = {
            Cabbage: 12, // 10-15 tonnes per acre is realistic
            Kale: 8, // 6-10 tonnes per acre
            Tomatoes: 15, // 12-20 tonnes per acre (greenhouse can be higher)
            Onions: 10, // 8-12 tonnes per acre
            Spinach: 6, // 5-8 tonnes per acre
          };

          const cropYield =
            (yieldPerAcre[crop.name] || 8) * areaInAcres * healthFactor;
          totalYield += cropYield;
        });

        // Update the expected yield in the UI
        const yieldElement = document.querySelectorAll(
          ".card-hover .text-2xl"
        )[1];
        if (yieldElement) {
          yieldElement.textContent = `${totalYield.toFixed(2)} tonnes`; // Changed from toFixed(1) to toFixed(2)
        }

        // Save to Firebase
        database
          .ref("farms/" + emailKey)
          .update({ expectedYield: totalYield })
          .then(() => {
            console.log("Expected yield calculated and saved");
          })
          .catch((error) => {
            console.error("Error saving expected yield:", error);
          });
      }
    })
    .catch((error) => {
      console.error("Error calculating expected yield:", error);
    });
}

// Function to calculate healthy plants percentage
function calculateHealthyPlantsPercentage() {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");

  database
    .ref("farms/" + emailKey + "/crops")
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        const crops = snapshot.val();
        let totalHealth = 0;

        // Calculate average health across all crops
        crops.forEach((crop) => {
          totalHealth += crop.health || 100;
        });

        const averageHealth = totalHealth / crops.length;

        // Update the healthy plants percentage in the UI
        const healthElement = document.querySelector(".card-hover .text-2xl");
        if (healthElement) {
          healthElement.textContent = `${averageHealth.toFixed(1)} %`;
        }

        // Save to Firebase
        database
          .ref("farms/" + emailKey)
          .update({ healthyPlantsPercentage: averageHealth })
          .then(() => {
            console.log("Healthy plants percentage calculated and saved");
          })
          .catch((error) => {
            console.error("Error saving healthy plants percentage:", error);
          });
      }
    })
    .catch((error) => {
      console.error("Error calculating healthy plants percentage:", error);
    });
}

// Function to calculate growth progress
function calculateGrowthProgress() {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");

  database
    .ref("farms/" + emailKey + "/crops")
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        const crops = snapshot.val();
        const growthProgress = {};

        // Calculate growth progress for each crop
        crops.forEach((crop) => {
          const plantedDate = new Date(crop.plantedDate);
          const expectedHarvestDate = new Date(crop.expectedHarvestDate);
          const now = new Date();

          // Calculate percentage of time elapsed
          const totalTime = expectedHarvestDate - plantedDate;
          const elapsedTime = now - plantedDate;

          let progress = (elapsedTime / totalTime) * 100;

          // Cap at 100%
          if (progress > 100) progress = 100;

          // Don't go below 0%
          if (progress < 0) progress = 0;

          growthProgress[crop.name.toLowerCase()] = Math.round(progress);
        });

        // Update the growth progress in the UI
        const progressBars = document.querySelectorAll(".bg-green-600.h-2");
        const progressTexts = document.querySelectorAll(
          ".text-sm.font-semibold.text-green-600"
        );

        if (growthProgress.cabbage !== undefined && progressBars.length > 0) {
          progressBars[0].style.width = growthProgress.cabbage + "%";
          if (progressTexts.length > 0) {
            progressTexts[0].textContent = growthProgress.cabbage + "%";
          }
        }

        if (growthProgress.kale !== undefined && progressBars.length > 1) {
          progressBars[1].style.width = growthProgress.kale + "%";
          if (progressTexts.length > 1) {
            progressTexts[1].textContent = growthProgress.kale + "%";
          }
        }

        // Save to Firebase
        database
          .ref("farms/" + emailKey)
          .update({ growthProgress })
          .then(() => {
            console.log("Growth progress calculated and saved");
          })
          .catch((error) => {
            console.error("Error saving growth progress:", error);
          });
      }
    })
    .catch((error) => {
      console.error("Error calculating growth progress:", error);
    });
}

// Function to update existing growth progress in database
function updateExistingGrowthProgress() {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");

  database
    .ref("farms/" + emailKey)
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        const farmData = snapshot.val();

        // Check if growth progress exists and is 100%
        if (farmData.growthProgress) {
          let needsUpdate = false;
          const updatedProgress = { ...farmData.growthProgress };

          // Update cabbage progress if it's 100%
          if (farmData.growthProgress.cabbage === 100) {
            updatedProgress.cabbage = 42; // Set to realistic value
            needsUpdate = true;
          }

          // Update kale progress if it's 100%
          if (farmData.growthProgress.kale === 100) {
            updatedProgress.kale = 25; // Set to realistic value
            needsUpdate = true;
          }

          // Save updated progress if needed
          if (needsUpdate) {
            database
              .ref("farms/" + emailKey)
              .update({ growthProgress: updatedProgress })
              .then(() => {
                console.log("Growth progress updated in database");
                // Update UI with new values
                updateDashboardWithFarmData({
                  ...farmData,
                  growthProgress: updatedProgress,
                });
              })
              .catch((error) => {
                console.error("Error updating growth progress:", error);
              });
          }
        }
      }
    })
    .catch((error) => {
      console.error("Error checking growth progress:", error);
    });
}

// Call calculation functions when dashboard loads
document.addEventListener("DOMContentLoaded", function () {
  // Wait a bit for the data to load
  setTimeout(() => {
    calculateExpectedYield();
    calculateHealthyPlantsPercentage();
    calculateGrowthProgress();

    // Check and update existing growth progress
    updateExistingGrowthProgress();
  }, 2000);
});
