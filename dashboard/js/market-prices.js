// ===============================================
// MARKET PRICES PAGE SPECIFIC JAVASCRIPT
// ===============================================

document.addEventListener("DOMContentLoaded", function () {
  // Initialize database with original prices if not already present
  initializeDatabaseWithOriginalPrices();

  // Load market prices from Firebase
  loadMarketPrices();

  // Initialize price chart
  initializePriceChart();

  // Load market insights
  loadMarketInsights();
});

function initializeDatabaseWithOriginalPrices() {
  // Check if prices already exist
  database
    .ref("marketPrices")
    .once("value")
    .then((snapshot) => {
      if (!snapshot.exists()) {
        // Add original prices to database
        const originalPrices = {
          cabbage: {
            green: 350,
            red: 448,
            savoy: 532,
          },
          kale: {
            sukuma: 120,
            curly: 250,
            lacinato: 400,
          },
        };

        database
          .ref("marketPrices")
          .set(originalPrices)
          .then(() => {
            console.log("Original market prices added to database");
          })
          .catch((error) => {
            console.error("Error adding original prices:", error);
          });
      }
    })
    .catch((error) => {
      console.error("Error checking market prices:", error);
    });

  // Check if trends already exist
  database
    .ref("priceTrends")
    .once("value")
    .then((snapshot) => {
      if (!snapshot.exists()) {
        // Add original trends to database
        const originalTrends = {
          week: 5.2,
          month: 12.8,
          season: -3.5,
        };

        database
          .ref("priceTrends")
          .set(originalTrends)
          .then(() => {
            console.log("Original price trends added to database");
          })
          .catch((error) => {
            console.error("Error adding original trends:", error);
          });
      }
    })
    .catch((error) => {
      console.error("Error checking price trends:", error);
    });
}

function loadMarketPrices() {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");

  // Load cabbage prices
  database
    .ref("marketPrices/cabbage")
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        const cabbagePrices = snapshot.val();
        updateCabbagePrices(cabbagePrices);
      }
    })
    .catch((error) => {
      console.error("Error loading cabbage prices:", error);
    });

  // Load kale prices
  database
    .ref("marketPrices/kale")
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        const kalePrices = snapshot.val();
        updateKalePrices(kalePrices);
      }
    })
    .catch((error) => {
      console.error("Error loading kale prices:", error);
    });

  // Load price trends
  database
    .ref("priceTrends")
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        const trendsData = snapshot.val();
        updatePriceTrends(trendsData);
      }
    })
    .catch((error) => {
      console.error("Error loading price trends:", error);
    });
}

function updateCabbagePrices(prices) {
  const greenCabbagePrice = document.querySelector(
    ".space-y-3 .font-semibold.text-green-600"
  );
  const redCabbagePrice = document.querySelectorAll(
    ".space-y-3 .font-semibold"
  )[1];
  const savoyCabbagePrice = document.querySelectorAll(
    ".space-y-3 .font-semibold"
  )[2];

  if (greenCabbagePrice && prices.green) {
    greenCabbagePrice.textContent = "KES " + prices.green + "/kg";
  }

  if (redCabbagePrice && prices.red) {
    redCabbagePrice.textContent = "KES " + prices.red + "/kg";
    redCabbagePrice.className = "font-semibold text-red-600";
  }

  if (savoyCabbagePrice && prices.savoy) {
    savoyCabbagePrice.textContent = "KES " + prices.savoy + "/kg";
    savoyCabbagePrice.className = "font-semibold text-purple-600";
  }
}

function updateKalePrices(prices) {
  // This is for the second price card (kale)
  const kaleCard = document.querySelectorAll(
    ".card-bg.rounded-xl.shadow-sm.p-6.border.border-primary"
  )[1];
  if (!kaleCard) return;

  // Find each kale type by its text content and then update the price
  const kaleItems = kaleCard.querySelectorAll(
    ".flex.justify-between.items-center"
  );

  kaleItems.forEach((item) => {
    const label = item.querySelector(".text-sm.text-secondary");
    const priceElement = item.querySelector(".font-semibold");

    if (label && priceElement) {
      const labelText = label.textContent.trim();

      if (labelText === "Sukuma Wiki" && prices.sukuma) {
        priceElement.textContent = "KES " + prices.sukuma + "/kg";
        priceElement.className = "font-semibold text-green-600";
      } else if (labelText === "Curly Kale" && prices.curly) {
        priceElement.textContent = "KES " + prices.curly + "/kg";
        priceElement.className = "font-semibold text-blue-600";
      } else if (labelText === "Lacinato Kale" && prices.lacinato) {
        priceElement.textContent = "KES " + prices.lacinato + "/kg";
        priceElement.className = "font-semibold text-red-600";
      }
    }
  });
}

function updatePriceTrends(trends) {
  const trendsCard = document.querySelectorAll(
    ".card-bg.rounded-xl.shadow-sm.p-6.border.border-primary"
  )[2];
  if (!trendsCard) return;

  const weekTrend = trendsCard.querySelector(
    ".text-sm.font-semibold.text-green-600"
  );
  const monthTrend = trendsCard.querySelectorAll(".text-sm.font-semibold")[1];
  const seasonTrend = trendsCard.querySelectorAll(".text-sm.font-semibold")[2];

  if (weekTrend && trends.week) {
    const weekValue = parseFloat(trends.week);
    weekTrend.textContent = (weekValue >= 0 ? "+" : "") + trends.week + "%";
    weekTrend.className =
      "text-sm font-semibold " +
      (weekValue >= 0 ? "text-green-600" : "text-red-600");
  }

  if (monthTrend && trends.month) {
    const monthValue = parseFloat(trends.month);
    monthTrend.textContent = (monthValue >= 0 ? "+" : "") + trends.month + "%";
    monthTrend.className =
      "text-sm font-semibold " +
      (monthValue >= 0 ? "text-green-600" : "text-red-600");
  }

  if (seasonTrend && trends.season) {
    const seasonValue = parseFloat(trends.season);
    seasonTrend.textContent =
      (seasonValue >= 0 ? "+" : "") + trends.season + "%";
    seasonTrend.className =
      "text-sm font-semibold " +
      (seasonValue >= 0 ? "text-green-600" : "text-red-600");
  }
}

function initializePriceChart() {
  const ctx = document.getElementById("price-chart");
  if (!ctx) return;

  new Chart(ctx, {
    type: "line",
    data: {
      labels: [
        "Day 1",
        "Day 5",
        "Day 10",
        "Day 15",
        "Day 20",
        "Day 25",
        "Day 30",
      ],
      datasets: [
        {
          label: "Cabbage Price (KES)",
          data: [308, 329, 350, 343, 364, 357, 350],
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
        },
        {
          label: "Kale Price (KES)",
          data: [588, 609, 630, 657, 672, 665, 630],
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: "Price (KES/kg)",
          },
        },
      },
    },
  });
}

function loadMarketInsights() {
  // In a real application, you would fetch insights from Firebase or an API
  // For this example, we'll keep the static insights
}

function saveMarketPrices(prices) {
  database
    .ref("marketPrices")
    .update(prices)
    .then(() => {
      console.log("Market prices saved successfully");
    })
    .catch((error) => {
      console.error("Error saving market prices:", error);
    });
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
