// ===============================================
// WEATHER ADVICE PAGE SPECIFIC JAVASCRIPT
// ===============================================

document.addEventListener("DOMContentLoaded", function () {
  // Load weather data for Nakuru, Rongai
  loadWeatherData();

  // Load weather recommendations
  loadWeatherRecommendations();
});

function loadWeatherData() {
  // Fixed location: Nakuru, Rongai
  // Coordinates: -0.2833, 36.0667
  getWeatherByCoordinates(-0.2833, 36.0667);
}

// Function to get weather data by coordinates
function getWeatherByCoordinates(lat, lon) {
  // Using OpenWeatherMap API
  const apiKey = "4d8fb5b93d4af21d66a2948710284366";
  const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

  // Fetch current weather
  fetch(currentWeatherUrl)
    .then((response) => response.json())
    .then((data) => {
      updateCurrentWeather(data);
      saveWeatherData(data);
    })
    .catch((error) => {
      console.error("Error fetching current weather data:", error);
      updateCurrentWeather(null);
    });

  // Fetch forecast data
  fetch(forecastUrl)
    .then((response) => response.json())
    .then((data) => {
      updateWeeklyForecast(data);
      generateCropRecommendations(data);
    })
    .catch((error) => {
      console.error("Error fetching forecast data:", error);
      updateWeeklyForecast(null);
    });
}

function updateCurrentWeather(weatherData) {
  const tempElement = document.querySelector(
    ".text-3xl.font-bold.text-primary"
  );
  const conditionElement = document.querySelector(".text-secondary.mb-4");
  const humidityElement = document.querySelector(
    ".grid.grid-cols-2 .font-semibold.text-primary"
  );
  const windElement = document.querySelectorAll(
    ".grid.grid-cols-2 .font-semibold.text-primary"
  )[1];
  const locationElement = document.querySelector(".location-display");

  if (weatherData) {
    // Update with real weather data
    const { main, weather, wind } = weatherData;
    const temperature = main.temp;
    const condition = weather[0].main;
    const humidity = main.humidity;
    const windSpeed = wind.speed;

    // Update temperature
    if (tempElement) tempElement.textContent = `${temperature.toFixed(1)}°C`;

    // Update condition
    if (conditionElement) conditionElement.textContent = condition;

    // Update humidity
    if (humidityElement) humidityElement.textContent = `${humidity}%`;

    // Update wind speed
    if (windElement) windElement.textContent = `${windSpeed.toFixed(1)} km/h`;

    // Update location - Always show Nakuru, Rongai
    if (locationElement) {
      locationElement.innerHTML = `<i class="fas fa-map-marker-alt mr-2"></i>Nakuru, Rongai`;
    }

    // Update weather icon
    const weatherIcon = document.querySelector(".fas.fa-sun.text-6xl");
    if (weatherIcon) {
      // Remove existing icon classes
      weatherIcon.classList.remove(
        "fa-sun",
        "fa-cloud-sun",
        "fa-cloud-rain",
        "fa-cloud",
        "text-yellow-500",
        "text-gray-500",
        "text-blue-500"
      );

      // Add appropriate icon class based on condition
      switch (condition.toLowerCase()) {
        case "clear":
          weatherIcon.classList.add("fa-sun", "text-yellow-500");
          break;
        case "clouds":
          weatherIcon.classList.add("fa-cloud", "text-gray-500");
          break;
        case "rain":
        case "drizzle":
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
    if (tempElement) tempElement.textContent = "22°C";
    if (conditionElement) conditionElement.textContent = "Sunny";
    if (humidityElement) humidityElement.textContent = "65%";
    if (windElement) windElement.textContent = "12 km/h";
    if (locationElement) {
      locationElement.innerHTML = `<i class="fas fa-map-marker-alt mr-2"></i>Nakuru, Rongai`;
    }

    const weatherIcon = document.querySelector(".fas.fa-sun.text-6xl");
    if (weatherIcon) {
      weatherIcon.className = "fas fa-sun text-6xl text-yellow-500";
    }
  }
}

function updateWeeklyForecast(forecastData) {
  const forecastContainer = document.querySelector(
    ".grid.grid-cols-3.md\\:grid-cols-7"
  );
  if (!forecastContainer) return;

  forecastContainer.innerHTML = "";

  if (forecastData && forecastData.list) {
    // Process forecast data to get one forecast per day
    const dailyForecasts = {};

    // Get current date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    forecastData.list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD format

      // Skip if we already have this day
      if (dailyForecasts[dateStr]) return;

      // Get day name
      let dayName = date.toLocaleDateString("en-US", { weekday: "short" });

      // Check if it's today
      const itemDate = new Date(date);
      itemDate.setHours(0, 0, 0, 0);

      if (itemDate.getTime() === today.getTime()) {
        dayName = "Today";
      }

      // Store the forecast for this day
      dailyForecasts[dateStr] = {
        day: dayName,
        condition: item.weather[0].main,
        temp: Math.round(item.main.temp),
      };
    });

    // Convert to array and limit to 7 days
    const forecastArray = Object.values(dailyForecasts).slice(0, 7);

    forecastArray.forEach((day) => {
      const dayElement = document.createElement("div");
      dayElement.className = "text-center";

      let iconClass = "";
      let iconColor = "";

      switch (day.condition.toLowerCase()) {
        case "clear":
          iconClass = "fa-sun";
          iconColor = "text-yellow-500";
          break;
        case "clouds":
          iconClass = "fa-cloud-sun"; // Changed to match placeholder style
          iconColor = "text-gray-500";
          break;
        case "rain":
        case "drizzle":
          iconClass = "fa-cloud-rain";
          iconColor = "text-blue-500";
          break;
        case "thunderstorm":
          iconClass = "fa-bolt";
          iconColor = "text-purple-500";
          break;
        case "snow":
          iconClass = "fa-snowflake";
          iconColor = "text-blue-300";
          break;
        case "mist":
        case "fog":
        case "haze":
          iconClass = "fa-smog";
          iconColor = "text-gray-400";
          break;
        default:
          iconClass = "fa-sun";
          iconColor = "text-yellow-500";
      }

      // Create the exact structure as in the placeholder
      dayElement.innerHTML = `
        <p class="text-sm text-secondary mb-2">${day.day}</p>
        <i class="fas ${iconClass} ${iconColor} text-2xl mb-2"></i>
        <p class="text-sm font-semibold text-primary">${day.temp}°C</p>
      `;

      forecastContainer.appendChild(dayElement);
    });
  } else {
    // Fallback to default forecast - matching the placeholder structure exactly
    const defaultForecast = [
      { day: "Today", condition: "clear", temp: 22 },
      { day: "Tomorrow", condition: "clouds", temp: 20 },
      { day: "Wed", condition: "rain", temp: 18 },
      { day: "Thu", condition: "clouds", temp: 19 },
      { day: "Fri", condition: "clear", temp: 23 },
      { day: "Sat", condition: "clear", temp: 25 },
      { day: "Sun", condition: "clouds", temp: 21 },
    ];

    defaultForecast.forEach((day) => {
      const dayElement = document.createElement("div");
      dayElement.className = "text-center";

      let iconClass = "";
      let iconColor = "";

      switch (day.condition.toLowerCase()) {
        case "clear":
          iconClass = "fa-sun";
          iconColor = "text-yellow-500";
          break;
        case "clouds":
          iconClass = "fa-cloud-sun"; // Changed to match placeholder style
          iconColor = "text-gray-500";
          break;
        case "rain":
          iconClass = "fa-cloud-rain";
          iconColor = "text-blue-500";
          break;
      }

      // Create the exact structure as in the placeholder
      dayElement.innerHTML = `
        <p class="text-sm text-secondary mb-2">${day.day}</p>
        <i class="fas ${iconClass} ${iconColor} text-2xl mb-2"></i>
        <p class="text-sm font-semibold text-primary">${day.temp}°C</p>
      `;

      forecastContainer.appendChild(dayElement);
    });
  }
}

function generateCropRecommendations(forecastData) {
  if (!forecastData || !forecastData.list || !forecastData.city) {
    console.error("Invalid forecast data");
    return;
  }

  // Get current weather from the first item in the forecast
  const currentWeather = forecastData.list[0];
  const currentTemp = currentWeather.main.temp;
  const currentHumidity = currentWeather.main.humidity;
  const currentWind = currentWeather.wind.speed;
  const currentCondition = currentWeather.weather[0].main;

  // Get forecast for the next 24 hours
  const next24Hours = forecastData.list.slice(0, 8); // 3-hour intervals, 8 = 24 hours
  const hasRain = next24Hours.some(
    (item) =>
      item.weather[0].main.toLowerCase().includes("rain") ||
      item.weather[0].main.toLowerCase().includes("drizzle") ||
      (item.rain && item.rain["3h"] > 0)
  );

  const hasHeavyRain = next24Hours.some(
    (item) =>
      (item.rain && item.rain["3h"] > 10) ||
      item.weather[0].main.toLowerCase().includes("heavy")
  );

  const maxTemp = Math.max(...next24Hours.map((item) => item.main.temp_max));
  const minTemp = Math.min(...next24Hours.map((item) => item.main.temp_min));

  // Generate recommendations based on conditions
  const recommendations = [];

  // Temperature guidelines
  if (currentTemp >= 15 && currentTemp <= 24) {
    recommendations.push({
      type: "optimal",
      icon: "fa-temperature-high",
      title: "Optimal Growing Temperature",
      message: `Current temperature (${currentTemp.toFixed(
        1
      )}°C) is ideal for cabbage and kale growth. Expect excellent photosynthesis and development.`,
      color: "green",
    });
  } else if (currentTemp > 27) {
    recommendations.push({
      type: "warning",
      icon: "fa-temperature-high",
      title: "High Temperature Alert",
      message: `Temperature (${currentTemp.toFixed(
        1
      )}°C) is above optimal range. Cabbage may bolt (flower prematurely). Consider shade cloth if possible.`,
      color: "yellow",
    });
  } else if (currentTemp < 10) {
    recommendations.push({
      type: "warning",
      icon: "fa-temperature-low",
      title: "Low Temperature Alert",
      message: `Temperature (${currentTemp.toFixed(
        1
      )}°C) is below optimal range. Consider protective covers to prevent cold damage to young plants.`,
      color: "blue",
    });
  }

  // Watering recommendations
  if (hasRain) {
    recommendations.push({
      type: "info",
      icon: "fa-tint-slash",
      title: "Skip Watering",
      message: `Rain expected in the next 24 hours. Skip watering to prevent overwatering and root rot in your cabbage and kale.`,
      color: "blue",
    });
  } else if (currentTemp > 25 && currentHumidity < 60) {
    recommendations.push({
      type: "action",
      icon: "fa-tint",
      title: "Water Early Morning",
      message: `Hot and dry conditions detected. Water cabbage (1-1.5") and kale (1-2") early morning (6-8 AM) for best absorption.`,
      color: "green",
    });
  }

  // Pest & disease management
  if (currentHumidity > 80 && currentTemp > 20) {
    recommendations.push({
      type: "warning",
      icon: "fa-virus",
      title: "Disease Risk Alert",
      message: `High humidity (${currentHumidity}%) and warm temperatures increase risk of black rot and downy mildew. Ensure good air circulation.`,
      color: "yellow",
    });
  }

  if (currentWind < 10 && !hasRain) {
    recommendations.push({
      type: "action",
      icon: "fa-spray-can",
      title: "Ideal Spraying Conditions",
      message: `Low wind conditions make this a good time for pest control spraying. Target aphids and cabbage worms with appropriate organic pesticides.`,
      color: "green",
    });
  } else if (currentWind > 20) {
    recommendations.push({
      type: "warning",
      icon: "fa-wind",
      title: "Avoid Spraying",
      message: `High wind speed (${currentWind.toFixed(
        1
      )} km/h) detected. Avoid spraying pesticides due to drift risk and poor coverage.`,
      color: "yellow",
    });
  }

  // Fertilizer timing
  if (hasRain && !hasHeavyRain) {
    recommendations.push({
      type: "action",
      icon: "fa-seedling",
      title: "Apply Nitrogen Fertilizer",
      message: `Light rain expected. Apply nitrogen fertilizer (CAN or urea) to your cabbage and kale before rain for optimal nutrient absorption.`,
      color: "green",
    });
  } else if (hasHeavyRain) {
    recommendations.push({
      type: "warning",
      icon: "fa-cloud-rain",
      title: "Delay Fertilizing",
      message: `Heavy rain expected. Delay fertilizer application to prevent nutrient washout and leaching.`,
      color: "yellow",
    });
  }

  // Harvesting advice
  if (
    currentCondition.toLowerCase() === "clear" &&
    currentTemp >= 18 &&
    currentTemp <= 24
  ) {
    recommendations.push({
      type: "action",
      icon: "fa-hand-holding",
      title: "Good Harvesting Window",
      message: `Dry weather and moderate temperatures create ideal harvesting conditions. Check cabbage head firmness and harvest mature kale leaves.`,
      color: "green",
    });
  }

  // Display up to 4 recommendations
  displayRecommendations(recommendations.slice(0, 4));
}

function displayRecommendations(recommendations) {
  const recommendationsContainer = document.querySelector(".space-y-4");
  if (!recommendationsContainer) return;

  // Clear existing recommendations
  recommendationsContainer.innerHTML = "";

  recommendations.forEach((rec) => {
    const recElement = document.createElement("div");

    // Set background color based on recommendation type
    let bgClass = "";
    let borderClass = "";
    let iconColor = "";

    switch (rec.color) {
      case "green":
        bgClass = "bg-green-50";
        borderClass = "border-green-500";
        iconColor = "text-green-600";
        break;
      case "yellow":
        bgClass = "bg-yellow-50";
        borderClass = "border-yellow-500";
        iconColor = "text-yellow-600";
        break;
      case "blue":
        bgClass = "bg-blue-50";
        borderClass = "border-blue-500";
        iconColor = "text-blue-600";
        break;
      default:
        bgClass = "bg-gray-50";
        borderClass = "border-gray-500";
        iconColor = "text-gray-600";
    }

    recElement.className = `${bgClass} border-l-4 ${borderClass} p-4 rounded`;
    recElement.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${rec.icon} ${iconColor} mr-3"></i>
        <div>
          <p class="font-semibold ${iconColor.replace("text", "text")}">${
      rec.title
    }</p>
          <p class="${iconColor
            .replace("text", "text")
            .replace("600", "700")}">${rec.message}</p>
        </div>
      </div>
    `;

    recommendationsContainer.appendChild(recElement);
  });
}

function saveWeatherData(weatherData) {
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
    .ref("weatherData/" + emailKey)
    .set(weatherInfo)
    .then(() => {
      console.log("Weather data saved successfully");
    })
    .catch((error) => {
      console.error("Error saving weather data:", error);
    });
}

function loadWeatherRecommendations() {
  // This function is now handled by generateCropRecommendations()
  // which is called after fetching the weather data
}
