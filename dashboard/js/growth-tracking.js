// ===============================================
// GROWTH TRACKING PAGE SPECIFIC JAVASCRIPT
// ===============================================

// Crop growing periods in days
const CROP_GROWING_PERIODS = {
  cabbage: 70, // 10 weeks
  kale: 60, // 8-9 weeks
  tomato: 80, // 11-12 weeks
  lettuce: 45, // 6-7 weeks
  carrot: 75, // 10-11 weeks
};

document.addEventListener("DOMContentLoaded", function () {
  // Load growth data from Firebase
  loadGrowthData();

  // Set up form submission
  document
    .getElementById("growth-entry-form")
    .addEventListener("submit", handleGrowthEntrySubmit);

  // Set up event listeners for automatic harvest date calculation
  document
    .getElementById("crop-type")
    .addEventListener("change", updateHarvestInfo);
  document
    .getElementById("plant-date")
    .addEventListener("change", updateHarvestInfo);
});

function updateHarvestInfo() {
  const cropType = document.getElementById("crop-type").value;
  const plantDate = document.getElementById("plant-date").value;
  const harvestInfo = document.getElementById("harvest-info");
  const harvestText = document.getElementById("harvest-text");

  if (cropType && plantDate) {
    const growingPeriod = CROP_GROWING_PERIODS[cropType];
    const plantDateObj = new Date(plantDate);
    const harvestDateObj = new Date(plantDateObj);
    harvestDateObj.setDate(harvestDateObj.getDate() + growingPeriod);

    const harvestDateStr = harvestDateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    harvestText.textContent = `Expected harvest date: ${harvestDateStr} (${growingPeriod} days from planting)`;
    harvestInfo.classList.remove("hidden");
  } else {
    harvestInfo.classList.add("hidden");
  }
}

function calculateExpectedHarvestDate(cropType, plantDate) {
  const growingPeriod = CROP_GROWING_PERIODS[cropType];
  const plantDateObj = new Date(plantDate);
  const harvestDateObj = new Date(plantDateObj);
  harvestDateObj.setDate(harvestDateObj.getDate() + growingPeriod);

  return harvestDateObj.toISOString().split("T")[0]; // Return as YYYY-MM-DD
}

function handleGrowthEntrySubmit(event) {
  event.preventDefault();

  const userData = getCurrentUserData();
  if (!userData) {
    showNotification("Please log in to add growth entries", "error");
    return;
  }

  const emailKey = userData.email.replace(/\./g, "_");

  // Get form values
  const cropType = document.getElementById("crop-type").value;
  const plantDate = document.getElementById("plant-date").value;
  const expectedHarvest = calculateExpectedHarvestDate(cropType, plantDate);

  const growthEntry = {
    cropType: cropType,
    growthStage: document.getElementById("growth-stage").value,
    plantDate: plantDate,
    expectedHarvest: expectedHarvest,
    currentHeight: parseFloat(document.getElementById("current-height").value),
    healthStatus: document.getElementById("health-status").value,
    notes: document.getElementById("notes").value,
    createdAt: new Date().toISOString(),
    userId: userData.uid,
  };

  // Save to Firebase
  database
    .ref("growthEntries/" + emailKey)
    .push(growthEntry)
    .then(() => {
      showNotification("Growth entry saved successfully!", "success");
      document.getElementById("growth-entry-form").reset();
      document.getElementById("harvest-info").classList.add("hidden");
      loadGrowthData(); // Reload data to update the UI
    })
    .catch((error) => {
      console.error("Error saving growth entry:", error);
      showNotification("Failed to save growth entry", "error");
    });
}

function loadGrowthData() {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");

  // Load growth entries
  database
    .ref("growthEntries/" + emailKey)
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        const entries = snapshot.val();
        updateGrowthCalendar(entries);
        updateGrowthProgress(entries);
        updateGrowthChart(entries);
      } else {
        // Display default/empty state
        displayEmptyState();
      }
    })
    .catch((error) => {
      console.error("Error loading growth data:", error);
      displayEmptyState();
    });

  // Load next action required
  database
    .ref("nextAction/" + emailKey)
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        const actionData = snapshot.val();
        updateNextAction(actionData);
      } else {
        // Set default next action
        updateNextAction({
          title: "Water Plants",
          description: "Check soil moisture and water if needed",
          id: "watering",
        });
      }
    })
    .catch((error) => {
      console.error("Error loading next action:", error);
    });
}

function updateGrowthCalendar(entries) {
  const calendarContainer = document.getElementById("growth-calendar");
  calendarContainer.innerHTML = "";

  // Convert entries object to array and sort by date
  const entriesArray = Object.entries(entries).map(([key, value]) => ({
    id: key,
    ...value,
  }));
  entriesArray.sort((a, b) => new Date(a.plantDate) - new Date(b.plantDate));

  // Create calendar items for each entry
  entriesArray.forEach((entry) => {
    const stageClasses = {
      seedling: {
        bg: "growth-stage-green",
        icon: "growth-icon-green",
        iconClass: "fa-seedling",
      },
      vegetative: {
        bg: "growth-stage-blue",
        icon: "growth-icon-blue",
        iconClass: "fa-leaf",
      },
      flowering: {
        bg: "growth-stage-purple",
        icon: "growth-icon-purple",
        iconClass: "fa-spa",
      },
      fruiting: {
        bg: "growth-stage-yellow",
        icon: "growth-icon-yellow",
        iconClass: "fa-apple-alt",
      },
      harvest: {
        bg: "growth-stage-red",
        icon: "growth-icon-red",
        iconClass: "fa-cut",
      },
    };

    const stageClass = stageClasses[entry.growthStage] || stageClasses.seedling;

    // Calculate days since planting
    const plantDate = new Date(entry.plantDate);
    const today = new Date();
    const daysSincePlanting = Math.floor(
      (today - plantDate) / (1000 * 60 * 60 * 24)
    );

    // Calculate days until harvest
    const harvestDate = new Date(entry.expectedHarvest);
    const daysUntilHarvest = Math.floor(
      (harvestDate - today) / (1000 * 60 * 60 * 24)
    );

    const calendarItem = document.createElement("div");
    calendarItem.className = `flex items-center p-4 ${stageClass.bg} rounded-lg border-l-4`;

    calendarItem.innerHTML = `
      <div class="w-12 h-12 ${stageClass.icon} rounded-full flex items-center justify-center mr-4">
        <i class="fas ${stageClass.iconClass}"></i>
      </div>
      <div class="flex-1">
        <p class="font-semibold text-primary capitalize">${entry.cropType} - ${entry.growthStage}</p>
        <p class="text-sm text-secondary">Height: ${entry.currentHeight}cm | Health: ${entry.healthStatus}</p>
        <p class="text-xs text-secondary">Planted ${daysSincePlanting} days ago | Harvest in ${daysUntilHarvest} days</p>
      </div>
      <button onclick="deleteGrowthEntry('${entry.id}')" class="text-red-500 hover:text-red-700">
        <i class="fas fa-trash"></i>
      </button>
    `;

    calendarContainer.appendChild(calendarItem);
  });

  // If no entries, show a message
  if (entriesArray.length === 0) {
    calendarContainer.innerHTML =
      "<p class='text-center text-secondary py-4'>No growth entries yet. Add your first entry above!</p>";
  }
}

function updateGrowthProgress(entries) {
  const progressContainer = document.getElementById("growth-progress");
  progressContainer.innerHTML = "";

  // Group entries by crop type
  const crops = {};
  Object.values(entries).forEach((entry) => {
    if (!crops[entry.cropType]) {
      crops[entry.cropType] = [];
    }
    crops[entry.cropType].push(entry);
  });

  // Create progress bars for each crop
  Object.entries(crops).forEach(([cropType, cropEntries]) => {
    // Get the most recent entry for this crop
    const latestEntry = cropEntries.reduce((latest, entry) => {
      return new Date(entry.createdAt) > new Date(latest.createdAt)
        ? entry
        : latest;
    });

    // Calculate progress percentage based on growth stage
    const stageProgress = {
      seedling: 10,
      vegetative: 30,
      flowering: 60,
      fruiting: 80,
      harvest: 100,
    };

    const progress = stageProgress[latestEntry.growthStage] || 0;

    // Calculate days since planting
    const plantDate = new Date(latestEntry.plantDate);
    const today = new Date();
    const daysSincePlanting = Math.floor(
      (today - plantDate) / (1000 * 60 * 60 * 24)
    );

    // Calculate total growing days
    const harvestDate = new Date(latestEntry.expectedHarvest);
    const totalDays = Math.floor(
      (harvestDate - plantDate) / (1000 * 60 * 60 * 24)
    );

    const progressItem = document.createElement("div");
    progressItem.innerHTML = `
      <div>
        <div class="flex justify-between mb-2">
          <span class="text-sm font-medium text-primary capitalize">${cropType} Growth</span>
          <span class="text-sm text-secondary">Day ${daysSincePlanting} of ${totalDays}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-3">
          <div class="bg-green-600 h-3 rounded-full" style="width: ${progress}%"></div>
        </div>
        <p class="text-xs text-secondary mt-1 capitalize">${latestEntry.growthStage} stage - ${latestEntry.currentHeight}cm tall</p>
      </div>
    `;

    progressContainer.appendChild(progressItem);
  });

  // If no entries, show a message
  if (Object.keys(crops).length === 0) {
    progressContainer.innerHTML =
      "<p class='text-center text-secondary py-4'>No growth progress to display yet.</p>";
  }
}

function updateNextAction(actionData) {
  const actionContainer = document.getElementById("next-action");

  actionContainer.innerHTML = `
    <h4 class="font-semibold text-primary mb-2">Next Action Required</h4>
    <p class="text-sm text-secondary">${actionData.description}</p>
    <button class="mt-2 btn-primary px-4 py-2 rounded-lg text-sm transition-colors"
      onclick="markTaskComplete('${actionData.id}')">
      Mark as Complete
    </button>
  `;
}

function getChartColors() {
  const isDarkMode =
    document.documentElement.getAttribute("data-theme") === "dark";

  if (isDarkMode) {
    return {
      textColor: "#f9fafb",
      gridColor: "#374151",
      titleColor: "#f9fafb",
    };
  } else {
    return {
      textColor: "#111827",
      gridColor: "#e5e7eb",
      titleColor: "#111827",
    };
  }
}

function updateGrowthChart(entries) {
  const ctx = document.getElementById("growth-chart");
  if (!ctx) return;

  // Group entries by crop type and sort by date
  const cropsData = {};
  Object.values(entries).forEach((entry) => {
    if (!cropsData[entry.cropType]) {
      cropsData[entry.cropType] = [];
    }
    cropsData[entry.cropType].push(entry);
  });

  // Sort each crop's entries by date
  Object.keys(cropsData).forEach((crop) => {
    cropsData[crop].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  });

  // Prepare datasets for the chart
  const datasets = [];
  const colors = {
    cabbage: { border: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
    kale: { border: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
    tomato: { border: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
    lettuce: { border: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)" },
    carrot: { border: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
  };

  Object.entries(cropsData).forEach(([cropType, cropEntries]) => {
    const color = colors[cropType] || {
      border: "#6b7280",
      bg: "rgba(107, 114, 128, 0.1)",
    };

    datasets.push({
      label: `${
        cropType.charAt(0).toUpperCase() + cropType.slice(1)
      } Height (cm)`,
      data: cropEntries.map((entry) => entry.currentHeight),
      borderColor: color.border,
      backgroundColor: color.bg,
      fill: true,
      tension: 0.4,
    });
  });

  // Generate labels (dates)
  const allDates = new Set();
  Object.values(cropsData).forEach((cropEntries) => {
    cropEntries.forEach((entry) => {
      const date = new Date(entry.createdAt).toLocaleDateString();
      allDates.add(date);
    });
  });
  const labels = Array.from(allDates).sort();

  // Destroy existing chart if it exists
  if (window.growthChartInstance) {
    window.growthChartInstance.destroy();
  }

  // Get chart colors based on current theme
  const chartColors = getChartColors();

  // Create new chart
  window.growthChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Height (cm)",
            color: chartColors.textColor,
          },
          ticks: {
            color: chartColors.textColor,
          },
          grid: {
            color: chartColors.gridColor,
          },
        },
        x: {
          title: {
            display: true,
            text: "Date",
            color: chartColors.textColor,
          },
          ticks: {
            color: chartColors.textColor,
          },
          grid: {
            color: chartColors.gridColor,
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: chartColors.textColor,
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          titleColor: chartColors.textColor,
          bodyColor: chartColors.textColor,
          backgroundColor:
            document.documentElement.getAttribute("data-theme") === "dark"
              ? "#1f2937"
              : "#ffffff",
          borderColor:
            document.documentElement.getAttribute("data-theme") === "dark"
              ? "#374151"
              : "#e5e7eb",
          borderWidth: 1,
        },
      },
    },
  });
}

function markTaskComplete(taskId) {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");

  // Update task status in Firebase
  database
    .ref("tasks/" + emailKey + "/" + taskId)
    .update({
      completed: true,
      completedAt: new Date().toISOString(),
    })
    .then(() => {
      console.log("Task marked as complete");

      // Show success message
      const actionDiv = document.getElementById("next-action");
      if (actionDiv) {
        actionDiv.innerHTML = `
          <h4 class="font-semibold text-green-600 mb-2">Task Completed!</h4>
          <p class="text-sm text-secondary">Great job! Keep up the good work.</p>
        `;

        // Reset after 3 seconds
        setTimeout(() => {
          loadGrowthData();
        }, 3000);
      }
    })
    .catch((error) => {
      console.error("Error marking task as complete:", error);
    });
}

function deleteGrowthEntry(entryId) {
  if (!confirm("Are you sure you want to delete this growth entry?")) {
    return;
  }

  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");

  database
    .ref("growthEntries/" + emailKey + "/" + entryId)
    .remove()
    .then(() => {
      showNotification("Growth entry deleted successfully", "success");
      loadGrowthData(); // Reload data to update the UI
    })
    .catch((error) => {
      console.error("Error deleting growth entry:", error);
      showNotification("Failed to delete growth entry", "error");
    });
}

function displayEmptyState() {
  document.getElementById("growth-calendar").innerHTML =
    "<p class='text-center text-secondary py-4'>No growth entries yet. Add your first entry above!</p>";
  document.getElementById("growth-progress").innerHTML =
    "<p class='text-center text-secondary py-4'>No growth progress to display yet.</p>";

  // Initialize empty chart
  const ctx = document.getElementById("growth-chart");
  if (ctx) {
    if (window.growthChartInstance) {
      window.growthChartInstance.destroy();
    }

    // Get chart colors based on current theme
    const chartColors = getChartColors();

    window.growthChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "No data to display yet. Add growth entries to see the chart.",
            color: chartColors.titleColor,
          },
          legend: {
            labels: {
              color: chartColors.textColor,
            },
          },
        },
        scales: {
          y: {
            ticks: {
              color: chartColors.textColor,
            },
            grid: {
              color: chartColors.gridColor,
            },
          },
          x: {
            ticks: {
              color: chartColors.textColor,
            },
            grid: {
              color: chartColors.gridColor,
            },
          },
        },
      },
    });
  }
}

function showNotification(message, type) {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Add to DOM
  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Listen for theme changes to update chart colors
document.addEventListener("themeChanged", function () {
  if (window.growthChartInstance) {
    loadGrowthData(); // Reload data to update chart with new theme colors
  }
});

// Also listen for storage changes (in case theme is changed in another tab)
window.addEventListener("storage", function (e) {
  if (e.key === "theme") {
    if (window.growthChartInstance) {
      loadGrowthData(); // Reload data to update chart with new theme colors
    }
  }
});
