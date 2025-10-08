// ===============================================
// THEME MANAGEMENT SECTION START
// ===============================================

// Apply theme immediately to prevent flicker
(function () {
  // Get saved theme or default to dark
  const savedTheme = localStorage.getItem("theme") || "dark";

  // Apply theme to document before page renders
  document.documentElement.setAttribute("data-theme", savedTheme);
})();

// Cache DOM elements
let themeToggle, desktopThemeToggle, body;

// Initialize theme elements
function initThemeElements() {
  themeToggle = document.getElementById("theme-toggle");
  desktopThemeToggle = document.getElementById("desktop-theme-toggle");
  body = document.body;
}

// Apply theme to UI
function applyTheme(theme) {
  if (!body) initThemeElements();

  // Apply to document element (highest priority)
  document.documentElement.setAttribute("data-theme", theme);

  // Update toggle buttons
  const updateToggle = (toggle) => {
    if (!toggle) return;
    if (theme === "dark") {
      toggle.classList.add("active");
    } else {
      toggle.classList.remove("active");
    }
  };

  updateToggle(themeToggle);
  updateToggle(desktopThemeToggle);

  // Save to localStorage
  localStorage.setItem("theme", theme);
}

// Toggle theme with improved logic
function toggleTheme() {
  if (!body) initThemeElements();

  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  // Apply theme immediately
  applyTheme(newTheme);

  // Save to Firebase (only if user is logged in and theme changed)
  const userData = getCurrentUserData();
  if (userData && localStorage.getItem("theme") !== newTheme) {
    saveThemeToFirebase(newTheme);
  }
}

// Save theme to Firebase (debounced)
const saveThemeToFirebase = debounce((theme) => {
  const userData = getCurrentUserData();
  if (!userData) return;

  const emailKey = userData.email.replace(/\./g, "_");
  database
    .ref("users/" + emailKey)
    .update({ theme })
    .then(() => console.log("Theme saved to Firebase:", theme))
    .catch((error) => console.error("Error saving theme to Firebase:", error));
}, 500);

// Debounce function to prevent excessive Firebase calls
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Load theme - optimized for speed
function loadTheme() {
  // First check localStorage (fastest)
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    applyTheme(savedTheme);
    return;
  }

  // Only check Firebase as last resort
  const userData = getCurrentUserData();
  if (!userData) {
    applyTheme("dark"); // Default theme
    return;
  }

  // Firebase check (async but cached)
  const emailKey = userData.email.replace(/\./g, "_");
  database
    .ref("users/" + emailKey + "/theme")
    .once("value")
    .then((snapshot) => {
      const firebaseTheme = snapshot.val();
      applyTheme(firebaseTheme || "dark");
    })
    .catch(() => applyTheme("dark")); // Fallback
}

// Setup theme toggles (for dynamically loaded elements)
function setupThemeToggles() {
  const setupToggle = (toggle) => {
    if (!toggle) return;

    // Remove existing event listener to prevent duplicates
    toggle.removeEventListener("click", toggleTheme);

    // Add new event listener
    toggle.addEventListener("click", toggleTheme);
  };

  setupToggle(document.getElementById("theme-toggle"));
  setupToggle(document.getElementById("desktop-theme-toggle"));
}

// Initialize theme when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  // Load theme first (critical for avoiding flash)
  loadTheme();

  // Setup theme toggles
  setupThemeToggles();

  // Setup mobile menu
  setupMobileMenu();

  // Also set up theme toggles after a short delay to ensure they're loaded
  setTimeout(setupThemeToggles, 300);
  
  // Also set up mobile menu after a short delay to ensure elements are loaded
  setTimeout(setupMobileMenu, 300);
});

// Setup event delegation for dynamically loaded theme toggles
document.addEventListener("click", function (e) {
  if (
    e.target.closest("#theme-toggle") ||
    e.target.closest("#desktop-theme-toggle")
  ) {
    toggleTheme();
  }
});

// ===============================================
// THEME MANAGEMENT SECTION END
// ===============================================

// ===============================================
// USER AUTHENTICATION & DATA HANDLING SECTION START
// ===============================================

// Check if user is logged in
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    console.log("User logged in:", user.email);

    // Get user data from localStorage first for speed
    const userData = getCurrentUserData();

    if (userData) {
      // Update UI with user data from localStorage
      updateUserNameInSidebar(userData.name);
    } else {
      // Only get from Firebase if not in localStorage
      const emailKey = user.email.replace(/\./g, "_");
      database
        .ref("users/" + emailKey)
        .once("value")
        .then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();

            // Update UI with user data
            updateUserNameInSidebar(userData.name || "Farmer");

            // Store user data locally for future use
            localStorage.setItem(
              "userData",
              JSON.stringify({
                uid: user.uid,
                email: user.email,
                name: userData.name || "Farmer",
                phone: userData.phone || "",
                location: userData.location || "",
              })
            );
          }
        })
        .catch((error) => {
          console.error("Error getting user data:", error);
          // Use a default name if there's an error
          updateUserNameInSidebar("Farmer");
        });
    }
  } else {
    // User is signed out
    console.log("User not logged in");
    // Redirect to login page if not on login page
    if (
      !window.location.href.includes("../auth/") &&
      !window.location.href.includes("../auth/")
    ) {
      window.location.href = "../auth/";
    }
  }
});

// Function to update user name in sidebar
function updateUserNameInSidebar(name) {
  // Use requestAnimationFrame for better performance
  requestAnimationFrame(() => {
    const userNameElement = document.getElementById("sidebar-user-name");
    if (userNameElement) {
      userNameElement.textContent = name;
    }
  });
}

// Function to get current user data
function getCurrentUserData() {
  try {
    const userData = localStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  } catch (e) {
    return null;
  }
}

// ===============================================
// USER AUTHENTICATION & DATA HANDLING SECTION END
// ===============================================

// ===============================================
// LOGOUT FUNCTIONALITY SECTION START
// ===============================================

// Setup logout button with event delegation
document.addEventListener("click", (e) => {
  if (e.target.closest("#logout-btn")) {
    e.preventDefault();

    if (confirm("Are you sure you want to logout?")) {
      auth
        .signOut()
        .then(() => {
          // Clear local storage
          localStorage.removeItem("userData");
          localStorage.removeItem("currentPage");

          // Redirect to login page
          window.location.href = "login.html";
        })
        .catch((error) => {
          console.error("Error signing out:", error);
          alert("Error signing out. Please try again.");
        });
    }
  }
});

// ===============================================
// LOGOUT FUNCTIONALITY SECTION END
// ===============================================

// ===============================================
// NAVIGATION AND PAGE MANAGEMENT SECTION START
// ===============================================

// ===============================================
// PAGE TITLE MANAGEMENT SECTION - REWRITTEN
// ===============================================

// Page titles and subtitles configuration
const pageInfo = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Welcome back to your smart farming assistant",
    mobileSubtitle: "Track Extensively",
  },
  "disease-detection": {
    title: "Disease Detection",
    subtitle: "AI-powered plant health analysis",
    mobileSubtitle: "Detect Diseases",
  },
  "ai-chat": {
    title: "AI Chat Support",
    subtitle: "Get expert advice for your farming questions",
    mobileSubtitle: "AI Assistant",
  },
  "weather-advice": {
    title: "Weather Advice",
    subtitle: "Smart weather-based farming recommendations",
    mobileSubtitle: "Weather Recommendations",
  },
  "growth-tracking": {
    title: "Growth Tracking",
    subtitle: "Monitor your crop development stages",
    mobileSubtitle: "Track Growth",
  },
  "market-prices": {
    title: "Market Prices",
    subtitle: "Real-time market data for your crops",
    mobileSubtitle: "Market Prices",
  },
  "yield-prediction": {
    title: "Yield Prediction",
    subtitle: "AI-powered harvest forecasting",
    mobileSubtitle: "Predict Yield",
  },
  "farm-records": {
    title: "Farm Records",
    subtitle: "Track expenses, sales, and activities",
    mobileSubtitle: "Farm Records",
  },
};

/**
 * Get current page name using multiple detection methods
 * This works reliably across different hosting environments
 */
function getCurrentPageName() {
  // Method 1: Check document.title tag (most reliable)
  const titleTag = document.title;
  if (titleTag) {
    const lowerTitle = titleTag.toLowerCase();
    // Match against known page names
    for (const pageName in pageInfo) {
      if (lowerTitle.includes(pageName.replace("-", " "))) {
        return pageName;
      }
    }
  }

  // Method 2: Check for unique body classes or data attributes
  const bodyClass = document.body.className;
  if (bodyClass) {
    for (const pageName in pageInfo) {
      if (bodyClass.includes(pageName)) {
        return pageName;
      }
    }
  }

  // Method 3: Check URL hash
  const hash = window.location.hash.replace("#", "");
  if (hash && pageInfo[hash]) {
    return hash;
  }

  // Method 4: Check URL search params
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get("page");
  if (pageParam && pageInfo[pageParam]) {
    return pageParam;
  }

  // Method 5: Parse from window.location (fallback)
  const path = window.location.pathname;
  const filename = path.split("/").filter(Boolean).pop() || "";
  
  // Remove .html extension and query parameters
  const pageName = filename.replace(/\.html$/i, "").split("?")[0];
  
  // Handle common index pages
  if (!pageName || pageName === "index" || pageName === "") {
    return "dashboard";
  }

  // Return if valid page name
  if (pageInfo[pageName]) {
    return pageName;
  }

  // Method 6: Check meta tags
  const metaPage = document.querySelector('meta[name="page-name"]');
  if (metaPage && pageInfo[metaPage.content]) {
    return metaPage.content;
  }

  // Default fallback
  return "dashboard";
}

/**
 * Update page titles with smooth transitions
 */
function updatePageTitles() {
  const pageName = getCurrentPageName();
  const info = pageInfo[pageName];

  if (!info) {
    console.warn(`No page info found for: ${pageName}`);
    return;
  }

  // Update desktop header
  updateElement("page-title", info.title);
  updateElement("page-subtitle", info.subtitle);

  // Update mobile header
  updateElement("mobile-page-title", info.title);
  updateElement("mobile-page-subtitle", info.mobileSubtitle);

  // Update browser title
  document.title = `${info.title} - CropWise`;

  // Store current page for future reference
  sessionStorage.setItem("currentPage", pageName);
}

/**
 * Helper function to update element with fade effect
 */
function updateElement(id, text) {
  requestAnimationFrame(() => {
    const element = document.getElementById(id);
    if (element && element.textContent !== text) {
      element.style.opacity = "0.5";
      element.textContent = text;
      setTimeout(() => {
        element.style.opacity = "1";
      }, 100);
    }
  });
}

/**
 * Update active navigation item
 */
function updateActiveNavigation() {
  const pageName = getCurrentPageName();

  requestAnimationFrame(() => {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
      item.classList.remove("active");
      
      const href = item.getAttribute("href");
      if (href) {
        // Extract page name from href (handles both relative and absolute paths)
        const hrefPageName = href
          .split("/")
          .pop()
          .replace(/\.html$/i, "")
          .split("?")[0];

        // Also check data-page attribute
        const dataPage = item.getAttribute("data-page");

        if (hrefPageName === pageName || dataPage === pageName) {
          item.classList.add("active");
        }
      }
    });
  });
}

/**
 * Initialize page titles when DOM is ready
 */
function initializePageTitles() {
  // Update immediately
  updatePageTitles();
  updateActiveNavigation();

  // Update again after a short delay to ensure all components are loaded
  setTimeout(() => {
    updatePageTitles();
    updateActiveNavigation();
  }, 300);

  // Also update when page becomes visible (for tab switching)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      updatePageTitles();
      updateActiveNavigation();
    }
  });
}

/**
 * Load header components with title updates
 */
function loadHeaderComponents() {
  const loadComponent = (containerId, filename) => {
    const container = document.getElementById(containerId);
    if (!container) return Promise.resolve();

    return fetch(filename)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${filename}`);
        return response.text();
      })
      .then((html) => {
        container.innerHTML = html;
      })
      .catch((error) => {
        console.error(`Error loading ${filename}:`, error);
      });
  };

  // Load all components
  Promise.all([
    loadComponent("navigation-container", "navigation.html"),
    loadComponent("mobile-header-container", "mobile-header.html"),
    loadComponent("desktop-header-container", "desktop-header.html"),
  ]).then(() => {
    // Initialize after all components are loaded
    initializePageTitles();
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadHeaderComponents);
} else {
  // DOM is already ready
  loadHeaderComponents();
}

// Export for external use
window.CropWise = window.CropWise || {};
window.CropWise.updatePageTitles = updatePageTitles;
window.CropWise.getCurrentPageName = getCurrentPageName;

// ===============================================
// PAGE TITLE MANAGEMENT SECTION END
// ===============================================




// ===============================================
// MOBILE MENU FUNCTIONALITY SECTION START
// ===============================================

// Mobile menu toggle functionality
function setupMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  
  if (!mobileMenuBtn || !sidebar || !overlay) {
    console.warn('Mobile menu elements not found');
    return;
  }
  
  // Toggle sidebar when mobile menu button is clicked
  mobileMenuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleMobileMenu();
  });
  
  // Close sidebar when overlay is clicked
  overlay.addEventListener('click', function() {
    closeMobileMenu();
  });
  
  // Close sidebar when escape key is pressed
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && sidebar.classList.contains('translate-x-0')) {
      closeMobileMenu();
    }
  });
}

// Toggle mobile menu
function toggleMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  
  if (!sidebar || !overlay) return;
  
  if (sidebar.classList.contains('translate-x-0')) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
}

// Open mobile menu
function openMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  
  if (!sidebar || !overlay) return;
  
  sidebar.classList.remove('-translate-x-full');
  sidebar.classList.add('translate-x-0');
  overlay.classList.remove('hidden');
  
  // Prevent body scroll when menu is open
  document.body.style.overflow = 'hidden';
}

// Close mobile menu
function closeMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  
  if (!sidebar || !overlay) return;
  
  sidebar.classList.remove('translate-x-0');
  sidebar.classList.add('-translate-x-full');
  overlay.classList.add('hidden');
  
  // Restore body scroll
  document.body.style.overflow = '';
}

// ===============================================
// MOBILE MENU FUNCTIONALITY SECTION END
// ===============================================
// Console message for developers
console.log("🌱 CropWise Dashboard System Loaded");
console.log("💾 User data is stored in Firebase Realtime Database");
