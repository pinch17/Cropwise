// ===============================================
// FARM RECORDS PAGE SPECIFIC JAVASCRIPT
// ===============================================

// Global variables
let financialChart = null;
let productionChart = null;
let currentTab = "financial";
let currentFilter = {
  type: "",
  category: "",
  startDate: "",
  endDate: "",
};

document.addEventListener("DOMContentLoaded", function () {
  // Load all data
  loadFarmRecords();
  loadInventoryRecords();
  loadProductionRecords();
  loadFinancialSummary();
  loadFarmActivities();

  // Initialize charts
  initializeFinancialChart();
  initializeProductionChart();

  // Setup form submission
  setupFormSubmission();

  // Setup filter form
  setupFilterForm();

  // Setup chart period selector
  document
    .getElementById("chart-period")
    .addEventListener("change", function () {
      updateFinancialChart(this.value);
    });
});

// Tab switching functionality
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.remove("active");
  });
  event.target.classList.add("active");

  // Update tab content
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });
  document.getElementById(`${tabName}-tab`).classList.add("active");

  currentTab = tabName;
}

// Load farm records
function loadFarmRecords() {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");
  const recordsTableBody = document.getElementById("financial-records-table");

  if (!recordsTableBody) return;

  database
    .ref("farmRecords/" + emailKey)
    .orderByChild("date")
    .once("value")
    .then((snapshot) => {
      recordsTableBody.innerHTML = "";

      if (snapshot.exists()) {
        const records = [];
        snapshot.forEach((childSnapshot) => {
          records.push({
            id: childSnapshot.key,
            ...childSnapshot.val(),
          });
        });

        // Sort records by date (newest first)
        records.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Apply filter if any
        const filteredRecords = filterRecords(records);

        // Display only financial records (expenses and sales)
        const financialRecords = filteredRecords.filter(
          (record) => record.type === "expense" || record.type === "sale"
        );

        if (financialRecords.length === 0) {
          recordsTableBody.innerHTML =
            '<tr><td colspan="6" class="px-4 py-3 text-secondary text-center">No financial records available</td></tr>';
          return;
        }

        financialRecords.forEach((record) => {
          const row = document.createElement("tr");

          let typeBadge = "";
          if (record.type === "expense") {
            typeBadge =
              '<span class="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Expense</span>';
          } else if (record.type === "sale") {
            typeBadge =
              '<span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Sale</span>';
          }

          const amount = record.amount
            ? "KES " + parseInt(record.amount).toLocaleString()
            : "-";

          row.innerHTML = `
            <td class="px-4 py-3 text-secondary">${formatDate(record.date)}</td>
            <td class="px-4 py-3">${typeBadge}</td>
            <td class="px-4 py-3 text-secondary">${record.description}</td>
            <td class="px-4 py-3 text-secondary">${amount}</td>
            <td class="px-4 py-3 text-secondary">${record.category}</td>
            <td class="px-4 py-3">
              <button class="text-blue-600 hover:text-blue-800 mr-2" onclick="editRecord('${
                record.id
              }')"><i class="fas fa-edit"></i></button>
              <button class="text-red-600 hover:text-red-800" onclick="deleteRecord('${
                record.id
              }')"><i class="fas fa-trash"></i></button>
            </td>
          `;

          recordsTableBody.appendChild(row);
        });
      } else {
        recordsTableBody.innerHTML =
          '<tr><td colspan="6" class="px-4 py-3 text-secondary text-center">No financial records available</td></tr>';
      }
    })
    .catch((error) => {
      console.error("Error loading farm records:", error);
      recordsTableBody.innerHTML =
        '<tr><td colspan="6" class="px-4 py-3 text-secondary text-center">Error loading records</td></tr>';
    });
}

// Load farm activities
function loadFarmActivities() {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");
  const activitiesTableBody = document.getElementById(
    "activities-records-table"
  );

  if (!activitiesTableBody) return;

  database
    .ref("farmActivities/" + emailKey)
    .orderByChild("date")
    .once("value")
    .then((snapshot) => {
      activitiesTableBody.innerHTML = "";

      if (snapshot.exists()) {
        const activities = [];
        snapshot.forEach((childSnapshot) => {
          activities.push({
            id: childSnapshot.key,
            ...childSnapshot.val(),
          });
        });

        // Sort activities by date (newest first)
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (activities.length === 0) {
          activitiesTableBody.innerHTML =
            '<tr><td colspan="6" class="px-4 py-3 text-secondary text-center">No activities recorded</td></tr>';
          return;
        }

        activities.forEach((activity) => {
          const row = document.createElement("tr");

          const cost = activity.cost
            ? "KES " + parseInt(activity.cost).toLocaleString()
            : "-";

          row.innerHTML = `
            <td class="px-4 py-3 text-secondary">${formatDate(
              activity.date
            )}</td>
            <td class="px-4 py-3 text-secondary">${activity.activity}</td>
            <td class="px-4 py-3 text-secondary">${activity.field || "-"}</td>
            <td class="px-4 py-3 text-secondary">${activity.details || "-"}</td>
            <td class="px-4 py-3 text-secondary">${cost}</td>
            <td class="px-4 py-3">
              <button class="text-blue-600 hover:text-blue-800 mr-2" onclick="editActivity('${
                activity.id
              }')"><i class="fas fa-edit"></i></button>
              <button class="text-red-600 hover:text-red-800" onclick="deleteActivity('${
                activity.id
              }')"><i class="fas fa-trash"></i></button>
            </td>
          `;

          activitiesTableBody.appendChild(row);
        });
      } else {
        activitiesTableBody.innerHTML =
          '<tr><td colspan="6" class="px-4 py-3 text-secondary text-center">No activities recorded</td></tr>';
      }
    })
    .catch((error) => {
      console.error("Error loading farm activities:", error);
      activitiesTableBody.innerHTML =
        '<tr><td colspan="6" class="px-4 py-3 text-secondary text-center">Error loading activities</td></tr>';
    });
}

// Load inventory records
function loadInventoryRecords() {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");
  const inventoryTableBody = document.getElementById("inventory-records-table");

  if (!inventoryTableBody) return;

  database
    .ref("farmInventory/" + emailKey)
    .once("value")
    .then((snapshot) => {
      inventoryTableBody.innerHTML = "";

      if (snapshot.exists()) {
        const inventory = [];
        snapshot.forEach((childSnapshot) => {
          inventory.push({
            id: childSnapshot.key,
            ...childSnapshot.val(),
          });
        });

        if (inventory.length === 0) {
          inventoryTableBody.innerHTML =
            '<tr><td colspan="8" class="px-4 py-3 text-secondary text-center">No inventory items</td></tr>';
          return;
        }

        inventory.forEach((item) => {
          const row = document.createElement("tr");

          const totalValue = item.quantity * item.unitCost;
          const statusColor =
            item.status === "Good"
              ? "text-green-600"
              : item.status === "Low"
              ? "text-yellow-600"
              : "text-red-600";

          row.innerHTML = `
            <td class="px-4 py-3 text-secondary">${item.name}</td>
            <td class="px-4 py-3 text-secondary">${item.category}</td>
            <td class="px-4 py-3 text-secondary">${item.quantity}</td>
            <td class="px-4 py-3 text-secondary">${item.unit}</td>
            <td class="px-4 py-3 text-secondary">KES ${parseInt(
              item.unitCost
            ).toLocaleString()}</td>
            <td class="px-4 py-3 text-secondary">KES ${parseInt(
              totalValue
            ).toLocaleString()}</td>
            <td class="px-4 py-3 ${statusColor}">${item.status}</td>
            <td class="px-4 py-3">
              <button class="text-blue-600 hover:text-blue-800 mr-2" onclick="editInventory('${
                item.id
              }')"><i class="fas fa-edit"></i></button>
              <button class="text-red-600 hover:text-red-800" onclick="deleteInventory('${
                item.id
              }')"><i class="fas fa-trash"></i></button>
            </td>
          `;

          inventoryTableBody.appendChild(row);
        });
      } else {
        inventoryTableBody.innerHTML =
          '<tr><td colspan="8" class="px-4 py-3 text-secondary text-center">No inventory items</td></tr>';
      }
    })
    .catch((error) => {
      console.error("Error loading inventory:", error);
      inventoryTableBody.innerHTML =
        '<tr><td colspan="8" class="px-4 py-3 text-secondary text-center">Error loading inventory</td></tr>';
    });
}

// Load production records
function loadProductionRecords() {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");
  const productionTableBody = document.getElementById(
    "production-records-table"
  );

  if (!productionTableBody) return;

  database
    .ref("farmProduction/" + emailKey)
    .orderByChild("harvestDate")
    .once("value")
    .then((snapshot) => {
      productionTableBody.innerHTML = "";

      if (snapshot.exists()) {
        const production = [];
        snapshot.forEach((childSnapshot) => {
          production.push({
            id: childSnapshot.key,
            ...childSnapshot.val(),
          });
        });

        // Sort by harvest date (newest first)
        production.sort(
          (a, b) => new Date(b.harvestDate) - new Date(a.harvestDate)
        );

        if (production.length === 0) {
          productionTableBody.innerHTML =
            '<tr><td colspan="10" class="px-4 py-3 text-secondary text-center">No production records</td></tr>';
          return;
        }

        production.forEach((record) => {
          const row = document.createElement("tr");

          const yieldPerHa =
            record.area > 0 ? (record.yield / record.area).toFixed(2) : 0;
          const profit = record.revenue - record.cost;

          row.innerHTML = `
            <td class="px-4 py-3 text-secondary">${record.crop}</td>
            <td class="px-4 py-3 text-secondary">${formatDate(
              record.plantingDate
            )}</td>
            <td class="px-4 py-3 text-secondary">${formatDate(
              record.harvestDate
            )}</td>
            <td class="px-4 py-3 text-secondary">${record.area}</td>
            <td class="px-4 py-3 text-secondary">${record.yield}</td>
            <td class="px-4 py-3 text-secondary">${yieldPerHa}</td>
            <td class="px-4 py-3 text-secondary">KES ${parseInt(
              record.revenue
            ).toLocaleString()}</td>
            <td class="px-4 py-3 text-secondary">KES ${parseInt(
              record.cost
            ).toLocaleString()}</td>
            <td class="px-4 py-3 ${
              profit >= 0 ? "text-green-600" : "text-red-600"
            }">KES ${parseInt(profit).toLocaleString()}</td>
            <td class="px-4 py-3">
              <button class="text-blue-600 hover:text-blue-800 mr-2" onclick="editProduction('${
                record.id
              }')"><i class="fas fa-edit"></i></button>
              <button class="text-red-600 hover:text-red-800" onclick="deleteProduction('${
                record.id
              }')"><i class="fas fa-trash"></i></button>
            </td>
          `;

          productionTableBody.appendChild(row);
        });
      } else {
        productionTableBody.innerHTML =
          '<tr><td colspan="10" class="px-4 py-3 text-secondary text-center">No production records</td></tr>';
      }
    })
    .catch((error) => {
      console.error("Error loading production records:", error);
      productionTableBody.innerHTML =
        '<tr><td colspan="10" class="px-4 py-3 text-secondary text-center">Error loading production records</td></tr>';
    });
}

// Load financial summary
function loadFinancialSummary() {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  // Get current month's records
  database
    .ref("farmRecords/" + emailKey)
    .orderByChild("date")
    .startAt(currentMonth + "-01")
    .endAt(currentMonth + "-31")
    .once("value")
    .then((snapshot) => {
      let totalExpenses = 0;
      let totalSales = 0;

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const record = childSnapshot.val();
          if (record.type === "expense" && record.amount) {
            totalExpenses += parseInt(record.amount);
          } else if (record.type === "sale" && record.amount) {
            totalSales += parseInt(record.amount);
          }
        });
      }

      const netProfit = totalSales - totalExpenses;

      // Update the UI
      document.getElementById("monthly-expenses").textContent =
        "KES " + totalExpenses.toLocaleString();
      document.getElementById("monthly-sales").textContent =
        "KES " + totalSales.toLocaleString();
      document.getElementById("monthly-profit").textContent =
        "KES " + netProfit.toLocaleString();
    })
    .catch((error) => {
      console.error("Error loading financial summary:", error);
    });

  // Load farm activities summary
  database
    .ref("farmActivities/" + emailKey)
    .orderByChild("date")
    .startAt(currentMonth + "-01")
    .endAt(currentMonth + "-31")
    .once("value")
    .then((snapshot) => {
      let totalArea = 0;
      let plantedArea = 0;
      let harvestedArea = 0;

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const activity = childSnapshot.val();
          if (activity.area) {
            totalArea += parseFloat(activity.area);

            if (activity.activity === "Planting") {
              plantedArea += parseFloat(activity.area);
            } else if (activity.activity === "Harvesting") {
              harvestedArea += parseFloat(activity.area);
            }
          }
        });
      }

      // Update the UI
      document.getElementById("total-area").textContent =
        totalArea.toFixed(1) + " ha";
      document.getElementById("planted-area").textContent =
        plantedArea.toFixed(1) + " ha";
      document.getElementById("harvested-area").textContent =
        harvestedArea.toFixed(1) + " ha";
    })
    .catch((error) => {
      console.error("Error loading activities summary:", error);
    });

  // Load inventory status
  database
    .ref("farmInventory/" + emailKey)
    .once("value")
    .then((snapshot) => {
      let seedsStatus = "Good";
      let fertilizerStatus = "Good";
      let pesticidesStatus = "Good";

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const item = childSnapshot.val();

          if (item.category === "Seeds" && item.status === "Low") {
            seedsStatus = "Low";
          } else if (item.category === "Fertilizer" && item.status === "Low") {
            fertilizerStatus = "Low";
          } else if (item.category === "Pesticides" && item.status === "Low") {
            pesticidesStatus = "Low";
          }
        });
      }

      // Update the UI
      document.getElementById("seeds-status").textContent = seedsStatus;
      document.getElementById("fertilizer-status").textContent =
        fertilizerStatus;
      document.getElementById("pesticides-status").textContent =
        pesticidesStatus;
    })
    .catch((error) => {
      console.error("Error loading inventory status:", error);
    });
}

// Initialize financial chart
function initializeFinancialChart() {
  const ctx = document.getElementById("financial-chart");
  if (!ctx) return;

  // Get financial data for the chart
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");

  // Get data for the last 6 months
  const months = [];
  const expensesData = [];
  const revenueData = [];

  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthYear = date.toISOString().slice(0, 7); // YYYY-MM format
    months.push(date.toLocaleDateString("en-US", { month: "short" }));

    // Initialize with zeros
    expensesData.push(0);
    revenueData.push(0);
  }

  // Fetch data for each month
  const promises = months.map((month, index) => {
    const monthYear = new Date();
    monthYear.setMonth(monthYear.getMonth() - (5 - index));
    const monthYearStr = monthYear.toISOString().slice(0, 7);

    return database
      .ref("farmRecords/" + emailKey)
      .orderByChild("date")
      .startAt(monthYearStr + "-01")
      .endAt(monthYearStr + "-31")
      .once("value")
      .then((snapshot) => {
        let monthExpenses = 0;
        let monthRevenue = 0;

        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const record = childSnapshot.val();
            if (record.type === "expense" && record.amount) {
              monthExpenses += parseInt(record.amount);
            } else if (record.type === "sale" && record.amount) {
              monthRevenue += parseInt(record.amount);
            }
          });
        }

        expensesData[index] = monthExpenses;
        revenueData[index] = monthRevenue;
      });
  });

  Promise.all(promises).then(() => {
    // Get current theme
    const isDarkMode =
      document.documentElement.getAttribute("data-theme") === "dark";
    const textColor = isDarkMode ? "#f9fafb" : "#111827";
    const gridColor = isDarkMode ? "#374151" : "#e5e7eb";

    financialChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: months,
        datasets: [
          {
            label: "Expenses (KES)",
            data: expensesData,
            backgroundColor: "rgba(239, 68, 68, 0.8)",
          },
          {
            label: "Revenue (KES)",
            data: revenueData,
            backgroundColor: "rgba(16, 185, 129, 0.8)",
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
              text: "Amount (KES)",
              color: textColor,
            },
            ticks: {
              color: textColor,
            },
            grid: {
              color: gridColor,
            },
          },
          x: {
            ticks: {
              color: textColor,
            },
            grid: {
              color: gridColor,
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: textColor,
            },
          },
        },
      },
    });
  });
}

// Initialize production chart
function initializeProductionChart() {
  const ctx = document.getElementById("production-chart");
  if (!ctx) return;

  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");

  database
    .ref("farmProduction/" + emailKey)
    .once("value")
    .then((snapshot) => {
      const cropData = {};

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const record = childSnapshot.val();
          if (!cropData[record.crop]) {
            cropData[record.crop] = {
              yield: 0,
              area: 0,
              revenue: 0,
              cost: 0,
            };
          }

          cropData[record.crop].yield += record.yield;
          cropData[record.crop].area += record.area;
          cropData[record.crop].revenue += record.revenue;
          cropData[record.crop].cost += record.cost;
        });
      }

      const crops = Object.keys(cropData);
      const yieldData = crops.map((crop) => cropData[crop].yield);
      const profitData = crops.map(
        (crop) => cropData[crop].revenue - cropData[crop].cost
      );

      // Get current theme
      const isDarkMode =
        document.documentElement.getAttribute("data-theme") === "dark";
      const textColor = isDarkMode ? "#f9fafb" : "#111827";
      const gridColor = isDarkMode ? "#374151" : "#e5e7eb";

      productionChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: crops,
          datasets: [
            {
              label: "Yield (kg)",
              data: yieldData,
              backgroundColor: "rgba(59, 130, 246, 0.8)",
              yAxisID: "y",
            },
            {
              label: "Profit (KES)",
              data: profitData,
              backgroundColor: "rgba(16, 185, 129, 0.8)",
              yAxisID: "y1",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              type: "linear",
              display: true,
              position: "left",
              title: {
                display: true,
                text: "Yield (kg)",
                color: textColor,
              },
              ticks: {
                color: textColor,
              },
              grid: {
                color: gridColor,
              },
            },
            y1: {
              type: "linear",
              display: true,
              position: "right",
              title: {
                display: true,
                text: "Profit (KES)",
                color: textColor,
              },
              ticks: {
                color: textColor,
              },
              grid: {
                drawOnChartArea: false,
              },
            },
            x: {
              ticks: {
                color: textColor,
              },
              grid: {
                color: gridColor,
              },
            },
          },
          plugins: {
            legend: {
              labels: {
                color: textColor,
              },
            },
          },
        },
      });
    })
    .catch((error) => {
      console.error("Error loading production data:", error);
    });
}

// Update financial chart based on period
function updateFinancialChart(period) {
  // This would be implemented to fetch data based on the selected period
  // For now, we'll just reload the chart with the default 6 months
  if (financialChart) {
    financialChart.destroy();
  }
  initializeFinancialChart();
}

// Setup form submission
function setupFormSubmission() {
  const form = document.getElementById("add-record-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const recordType = document
      .getElementById("modal-title")
      .textContent.toLowerCase()
      .replace("add ", "");
    const date = document.getElementById("record-date").value;
    const description = document.getElementById("record-description").value;
    const amount = document.getElementById("record-amount").value;
    const category = document.getElementById("record-category").value;

    // Validate inputs
    if (!date || !description || !category) {
      showNotification("Please fill in all fields", "error");
      return;
    }

    if (recordType !== "activity" && !amount) {
      showNotification("Please enter an amount", "error");
      return;
    }

    // Create record object
    const record = {
      type: recordType,
      date: date,
      description: description,
      amount: amount || 0,
      category: category,
    };

    // Add additional fields based on record type
    if (recordType === "expense") {
      record.supplier = document.getElementById("expense-supplier").value;
      record.paymentMethod = document.getElementById("expense-payment").value;
    } else if (recordType === "sale") {
      record.customer = document.getElementById("sale-customer").value;
      record.quantity = document.getElementById("sale-quantity").value;
      record.unitPrice = document.getElementById("sale-unit-price").value;
    } else if (recordType === "activity") {
      record.field = document.getElementById("activity-field").value;
      record.area = document.getElementById("activity-area").value;
      record.laborHours = document.getElementById("activity-labor").value;

      // Save activity to a different path
      saveActivity(record);
      closeAddRecordModal();
      form.reset();
      return;
    }

    // Save record to Firebase
    saveRecord(record);

    // Close modal and reset form
    closeAddRecordModal();
    form.reset();
  });
}

// Setup filter form
function setupFilterForm() {
  const form = document.getElementById("filter-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    currentFilter.type = document.getElementById("filter-type").value;
    currentFilter.category = document.getElementById("filter-category").value;
    currentFilter.startDate =
      document.getElementById("filter-start-date").value;
    currentFilter.endDate = document.getElementById("filter-end-date").value;

    // Reload records with filter
    loadFarmRecords();

    // Close modal
    closeFilterModal();
  });
}

// Show add record modal
function showAddRecordModal(type) {
  const modal = document.getElementById("add-record-modal");
  const modalTitle = document.getElementById("modal-title");
  const amountField = document.getElementById("amount-field");
  const categorySelect = document.getElementById("record-category");
  const expenseFields = document.getElementById("expense-fields");
  const saleFields = document.getElementById("sale-fields");
  const activityFields = document.getElementById("activity-fields");

  if (!modal || !modalTitle || !amountField || !categorySelect) return;

  // Set modal title
  modalTitle.textContent =
    "Add " + type.charAt(0).toUpperCase() + type.slice(1);

  // Show/hide amount field based on type
  if (type === "activity") {
    amountField.style.display = "none";
  } else {
    amountField.style.display = "block";
  }

  // Hide all additional fields
  expenseFields.classList.add("hidden");
  saleFields.classList.add("hidden");
  activityFields.classList.add("hidden");

  // Set category options based on type
  categorySelect.innerHTML = '<option value="">Select Category</option>';

  if (type === "expense") {
    expenseFields.classList.remove("hidden");
    const expenseCategories = [
      "Seeds",
      "Fertilizer",
      "Pesticides",
      "Equipment",
      "Labor",
      "Water",
      "Fuel",
      "Maintenance",
      "Transport",
      "Other",
    ];
    expenseCategories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });
  } else if (type === "sale") {
    saleFields.classList.remove("hidden");
    const saleCategories = [
      "Cabbage",
      "Kale",
      "Tomato",
      "Lettuce",
      "Carrot",
      "Other Crops",
    ];
    saleCategories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });
  } else if (type === "activity") {
    activityFields.classList.remove("hidden");
    const activityCategories = [
      "Planting",
      "Watering",
      "Fertilizing",
      "Harvesting",
      "Treatment",
      "Weeding",
      "Pruning",
      "Land Preparation",
      "Other",
    ];
    activityCategories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });
  }

  // Set today's date as default
  document.getElementById("record-date").valueAsDate = new Date();

  // Show modal
  modal.classList.remove("hidden");
}

// Close add record modal
function closeAddRecordModal() {
  const modal = document.getElementById("add-record-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

// Show filter modal
function showFilterModal() {
  const modal = document.getElementById("filter-modal");
  if (modal) {
    modal.classList.remove("hidden");

    // Set current filter values
    document.getElementById("filter-type").value = currentFilter.type;
    document.getElementById("filter-start-date").value =
      currentFilter.startDate;
    document.getElementById("filter-end-date").value = currentFilter.endDate;

    // Update category options based on type
    updateFilterCategoryOptions(currentFilter.type);
  }
}

// Close filter modal
function closeFilterModal() {
  const modal = document.getElementById("filter-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

// Update filter category options based on type
function updateFilterCategoryOptions(type) {
  const categorySelect = document.getElementById("filter-category");
  categorySelect.innerHTML = '<option value="">All Categories</option>';

  if (!type) return;

  let categories = [];

  if (type === "expense") {
    categories = [
      "Seeds",
      "Fertilizer",
      "Pesticides",
      "Equipment",
      "Labor",
      "Water",
      "Fuel",
      "Maintenance",
      "Transport",
      "Other",
    ];
  } else if (type === "sale") {
    categories = [
      "Cabbage",
      "Kale",
      "Tomato",
      "Lettuce",
      "Carrot",
      "Other Crops",
    ];
  } else if (type === "activity") {
    categories = [
      "Planting",
      "Watering",
      "Fertilizing",
      "Harvesting",
      "Treatment",
      "Weeding",
      "Pruning",
      "Land Preparation",
      "Other",
    ];
  }

  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// Reset filters
function resetFilters() {
  currentFilter = {
    type: "",
    category: "",
    startDate: "",
    endDate: "",
  };

  document.getElementById("filter-type").value = "";
  document.getElementById("filter-category").value = "";
  document.getElementById("filter-start-date").value = "";
  document.getElementById("filter-end-date").value = "";

  // Reload records without filter
  loadFarmRecords();
}

// Filter records based on current filter
function filterRecords(records) {
  return records.filter((record) => {
    // Filter by type
    if (currentFilter.type && record.type !== currentFilter.type) {
      return false;
    }

    // Filter by category
    if (currentFilter.category && record.category !== currentFilter.category) {
      return false;
    }

    // Filter by date range
    if (currentFilter.startDate && record.date < currentFilter.startDate) {
      return false;
    }

    if (currentFilter.endDate && record.date > currentFilter.endDate) {
      return false;
    }

    return true;
  });
}

// Save record to Firebase
function saveRecord(record) {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");
  const newRecordRef = database.ref("farmRecords/" + emailKey).push();

  newRecordRef
    .set(record)
    .then(() => {
      console.log("Record saved successfully");

      // Reload records and financial summary
      loadFarmRecords();
      loadFinancialSummary();
      updateFinancialChart();

      // Show success message
      showNotification("Record saved successfully!", "success");
    })
    .catch((error) => {
      console.error("Error saving record:", error);
      showNotification("Error saving record. Please try again.", "error");
    });
}

// Save activity to Firebase
function saveActivity(activity) {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");
  const newActivityRef = database.ref("farmActivities/" + emailKey).push();

  newActivityRef
    .set(activity)
    .then(() => {
      console.log("Activity saved successfully");

      // Reload activities and summary
      loadFarmActivities();
      loadFinancialSummary();

      // Show success message
      showNotification("Activity saved successfully!", "success");
    })
    .catch((error) => {
      console.error("Error saving activity:", error);
      showNotification("Error saving activity. Please try again.", "error");
    });
}

// Edit record
function editRecord(recordId) {
  // In a real application, you would implement edit functionality
  showNotification("Edit functionality would be implemented here", "info");
}

// Edit activity
function editActivity(activityId) {
  // In a real application, you would implement edit functionality
  showNotification("Edit functionality would be implemented here", "info");
}

// Edit inventory
function editInventory(itemId) {
  // In a real application, you would implement edit functionality
  showNotification("Edit functionality would be implemented here", "info");
}

// Edit production
function editProduction(productionId) {
  // In a real application, you would implement edit functionality
  showNotification("Edit functionality would be implemented here", "info");
}

// Delete record
function deleteRecord(recordId) {
  if (!confirm("Are you sure you want to delete this record?")) return;

  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");

  database
    .ref("farmRecords/" + emailKey + "/" + recordId)
    .remove()
    .then(() => {
      console.log("Record deleted successfully");

      // Reload records and financial summary
      loadFarmRecords();
      loadFinancialSummary();
      updateFinancialChart();

      showNotification("Record deleted successfully!", "success");
    })
    .catch((error) => {
      console.error("Error deleting record:", error);
      showNotification("Error deleting record. Please try again.", "error");
    });
}

// Delete activity
function deleteActivity(activityId) {
  if (!confirm("Are you sure you want to delete this activity?")) return;

  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");

  database
    .ref("farmActivities/" + emailKey + "/" + activityId)
    .remove()
    .then(() => {
      console.log("Activity deleted successfully");

      // Reload activities and summary
      loadFarmActivities();
      loadFinancialSummary();

      showNotification("Activity deleted successfully!", "success");
    })
    .catch((error) => {
      console.error("Error deleting activity:", error);
      showNotification("Error deleting activity. Please try again.", "error");
    });
}

// Delete inventory
function deleteInventory(itemId) {
  if (!confirm("Are you sure you want to delete this inventory item?")) return;

  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");

  database
    .ref("farmInventory/" + emailKey + "/" + itemId)
    .remove()
    .then(() => {
      console.log("Inventory item deleted successfully");

      // Reload inventory
      loadInventoryRecords();

      showNotification("Inventory item deleted successfully!", "success");
    })
    .catch((error) => {
      console.error("Error deleting inventory item:", error);
      showNotification(
        "Error deleting inventory item. Please try again.",
        "error"
      );
    });
}

// Delete production
function deleteProduction(productionId) {
  if (!confirm("Are you sure you want to delete this production record?"))
    return;

  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");

  database
    .ref("farmProduction/" + emailKey + "/" + productionId)
    .remove()
    .then(() => {
      console.log("Production record deleted successfully");

      // Reload production records
      loadProductionRecords();

      showNotification("Production record deleted successfully!", "success");
    })
    .catch((error) => {
      console.error("Error deleting production record:", error);
      showNotification(
        "Error deleting production record. Please try again.",
        "error"
      );
    });
}

// Export records
function exportRecords() {
  // In a real application, you would implement export functionality
  showNotification("Export functionality would be implemented here", "info");
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Show notification
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
  if (financialChart) {
    updateFinancialChart(document.getElementById("chart-period").value);
  }
  if (productionChart) {
    productionChart.destroy();
    initializeProductionChart();
  }
});

// Also listen for storage changes (in case theme is changed in another tab)
window.addEventListener("storage", function (e) {
  if (e.key === "theme") {
    if (financialChart) {
      updateFinancialChart(document.getElementById("chart-period").value);
    }
    if (productionChart) {
      productionChart.destroy();
      initializeProductionChart();
    }
  }
});
