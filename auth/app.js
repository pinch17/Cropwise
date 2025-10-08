// DOM Elements
const themeToggle = document.getElementById("theme-toggle");
const htmlElement = document.documentElement;
const loginToggle = document.getElementById("login-toggle");
const registerToggle = document.getElementById("register-toggle");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginFormElement = document.getElementById("loginForm");
const registerFormElement = document.getElementById("registerForm");

// Theme Toggle Functionality
const savedTheme = localStorage.getItem("theme") || "light";
htmlElement.setAttribute("data-theme", savedTheme);

themeToggle.addEventListener("click", () => {
  const currentTheme = htmlElement.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";

  htmlElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  // Add a subtle animation to the toggle
  themeToggle.style.transform = "scale(0.9)";
  setTimeout(() => {
    themeToggle.style.transform = "scale(1)";
  }, 150);
});

// Toggle between login and register forms
loginToggle.addEventListener("click", () => {
  loginToggle.classList.remove("toggle-btn-inactive");
  loginToggle.classList.add("toggle-btn-active");
  registerToggle.classList.remove("toggle-btn-active");
  registerToggle.classList.add("toggle-btn-inactive");
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  clearMessages();
});

registerToggle.addEventListener("click", () => {
  registerToggle.classList.remove("toggle-btn-inactive");
  registerToggle.classList.add("toggle-btn-active");
  loginToggle.classList.remove("toggle-btn-active");
  loginToggle.classList.add("toggle-btn-inactive");
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  clearMessages();
});

// Message handling functions
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message;
  errorElement.style.display = "block";
  setTimeout(() => {
    errorElement.style.display = "none";
  }, 5000);
}

function showSuccess(elementId, message) {
  const successElement = document.getElementById(elementId);
  successElement.textContent = message;
  successElement.style.display = "block";
  setTimeout(() => {
    successElement.style.display = "none";
  }, 3000);
}

function clearMessages() {
  document
    .querySelectorAll(".error-message, .success-message")
    .forEach((el) => {
      el.style.display = "none";
    });
}

// Custom Select Dropdown Implementation
const customSelect = {
  init() {
    const trigger = document.getElementById("location-trigger");
    const dropdown = document.getElementById("location-dropdown");
    const hiddenInput = document.getElementById("location");
    const options = dropdown.querySelectorAll(".custom-select-option");

    // Toggle dropdown
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      trigger.classList.toggle("active");
      dropdown.classList.toggle("active");
    });

    // Handle option selection
    options.forEach((option) => {
      option.addEventListener("click", () => {
        const value = option.dataset.value;
        const text = option.textContent;

        // Update hidden input
        hiddenInput.value = value;

        // Update trigger text
        const triggerText = trigger.querySelector(
          ".placeholder, .selected-text"
        );
        if (value === "") {
          triggerText.textContent = "Select Location";
          triggerText.className = "placeholder";
        } else {
          triggerText.textContent = text;
          triggerText.className = "selected-text";
        }

        // Update selected state
        options.forEach((opt) => opt.classList.remove("selected"));
        if (value !== "") {
          option.classList.add("selected");
        }

        // Close dropdown
        trigger.classList.remove("active");
        dropdown.classList.remove("active");
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
        trigger.classList.remove("active");
        dropdown.classList.remove("active");
      }
    });
  },
};

// Initialize custom select
customSelect.init();

// Password visibility toggle
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = input.parentElement.querySelector(".password-toggle");

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

// Email validation function
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password strength validation
function validatePasswordStrength(password) {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasLowerCase) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!hasNumbers) {
    errors.push("Password must contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
}

// Save user data to Firebase Realtime Database
function saveUserData(email, name, phone, location) {
  // Use email as the key (replace dots with underscores since Firebase doesn't allow dots in keys)
  const emailKey = email.replace(/\./g, "_");

  firebase
    .database()
    .ref("users/" + emailKey)
    .set({
      name: name,
      email: email,
      phone: phone,
      location: location,
      registrationDate: new Date().toISOString(),
    })
    .then(() => {
      console.log("User data saved successfully!");
    })
    .catch((error) => {
      console.error("Error saving user data:", error);
    });
}

// Login Form Submission
loginFormElement.addEventListener("submit", function (e) {
  e.preventDefault();
  clearMessages();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  // Basic validation
  if (!email || !password) {
    showError("login-error", "Please fill in all fields.");
    return;
  }

  if (!isValidEmail(email)) {
    showError("login-error", "Please enter a valid email address.");
    return;
  }

  // Firebase Authentication
  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      console.log("User logged in successfully!");

      // Store current user session
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          loginTime: new Date().toISOString(),
        })
      );

      showSuccess("login-success", "Login successful! Redirecting...");

      setTimeout(() => {
        showSuccessScreen();
      }, 1500);
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;

      // Handle specific error codes
      if (errorCode === "auth/user-not-found") {
        showError("login-error", "No account found with this email address.");
      } else if (errorCode === "auth/wrong-password") {
        showError("login-error", "Invalid password. Please try again.");
      } else {
        showError("login-error", errorMessage);
      }
    });
});

// Register Form Submission
// Add this function to clear all storage
function clearAllStorage() {
  // Clear all localStorage
  localStorage.clear();
  
  // Clear all sessionStorage
  sessionStorage.clear();
  
  console.log("All storage cleared");
}

// Modify your registration form submission handler
registerFormElement.addEventListener("submit", function (e) {
  e.preventDefault();
  clearMessages();

  const firstName = document.getElementById("first-name").value.trim();
  const lastName = document.getElementById("last-name").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const location = document.getElementById("location").value;
  const password = document.getElementById("register-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const termsAccepted = document.getElementById("terms").checked;

  // Basic validation
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !location ||
    !password ||
    !confirmPassword
  ) {
    showError("register-error", "Please fill in all fields.");
    return;
  }

  if (!isValidEmail(email)) {
    showError("register-error", "Please enter a valid email address.");
    return;
  }

  // Password validation
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    showError("register-error", passwordValidation.errors.join(". "));
    return;
  }

  if (password !== confirmPassword) {
    showError("register-error", "Passwords do not match.");
    return;
  }

  if (!termsAccepted) {
    showError("register-error", "Please accept the terms and conditions.");
    return;
  }

  // Phone validation (basic)
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
  if (!phoneRegex.test(phone)) {
    showError("register-error", "Please enter a valid phone number.");
    return;
  }

  // Check if user exists first
  firebase.auth().fetchSignInMethodsForEmail(email)
    .then((signInMethods) => {
      if (signInMethods.length > 0) {
        // User already exists, clear storage and proceed with re-registration
        clearAllStorage();
        
        // Show a message to the user
        showSuccess("register-success", "Existing account detected. Creating new session...");
        
        // Sign in the user first to be able to delete their account
        return firebase.auth().signInWithEmailAndPassword(email, password)
          .catch(() => {
            // If sign in fails, we can't proceed with account deletion
            throw new Error("Existing account found but password doesn't match. Please login instead.");
          });
      }
      // User doesn't exist, proceed with normal registration
      return Promise.resolve({ user: null });
    })
    .then((result) => {
      if (result && result.user) {
        // User was signed in, now delete their account
        return result.user.delete()
          .then(() => {
            // Account deleted, now create a new one
            return firebase.auth().createUserWithEmailAndPassword(email, password);
          });
      } else {
        // User didn't exist, create a new account
        return firebase.auth().createUserWithEmailAndPassword(email, password);
      }
    })
    .then((userCredential) => {
      // Signed in or re-registered
      const user = userCredential.user;
      console.log("User registered successfully!");

      // Save user data to Realtime Database
      const fullName = `${firstName} ${lastName}`;
      saveUserData(email, fullName, phone, location);

      // Store current user session
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: fullName,
          loginTime: new Date().toISOString(),
        })
      );

      showSuccess(
        "register-success",
        "Account created successfully! Redirecting..."
      );

      setTimeout(() => {
        showSuccessScreen();
      }, 1500);
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;

      // Handle specific error codes
      if (errorCode === "auth/email-already-in-use") {
        showError(
          "register-error",
          "An account with this email already exists. Please login instead."
        );
      } else if (errorCode === "auth/weak-password") {
        showError(
          "register-error",
          "Password is too weak. Please choose a stronger password."
        );
      } else {
        showError("register-error", errorMessage);
      }
    });
});
// Fixed Success Screen Animation
function showSuccessScreen() {
  const authToggle = document.getElementById("auth-toggle");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const successMessage = document.getElementById("success-message");

  // Hide forms with smooth transition
  authToggle.style.opacity = "0";
  loginForm.style.opacity = "0";
  registerForm.style.opacity = "0";

  setTimeout(() => {
    authToggle.classList.add("hidden");
    loginForm.classList.add("hidden");
    registerForm.classList.add("hidden");

    // Show success message with animation
    successMessage.classList.remove("hidden");
    successMessage.style.opacity = "0";

    setTimeout(() => {
      successMessage.style.opacity = "1";
    }, 100);
  }, 300);

  // Simulate redirect to dashboard
  setTimeout(() => {
    // In a real application: window.location.href = '../dashboard/';
    window.location.href = "../dashboard/";
  }, 3000);
}

// Input validation feedback with theme colors
const inputs = document.querySelectorAll("input[required]");
inputs.forEach((input) => {
  input.addEventListener("blur", function () {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const errorColor =
      currentTheme === "light"
        ? "rgba(239, 68, 68, 0.8)"
        : "rgba(248, 113, 113, 0.8)";
    const successColor =
      currentTheme === "light"
        ? "rgba(16, 185, 129, 0.8)"
        : "rgba(6, 182, 212, 0.8)";

    if (this.value.trim() === "") {
      this.style.borderColor = errorColor;
    } else {
      this.style.borderColor = successColor;
    }
  });

  input.addEventListener("input", function () {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const successColor =
      currentTheme === "light"
        ? "rgba(16, 185, 129, 0.8)"
        : "rgba(6, 182, 212, 0.8)";

    if (this.value.trim() !== "") {
      this.style.borderColor = successColor;
    }
  });
});

// Email validation
const emailInputs = document.querySelectorAll('input[type="email"]');
emailInputs.forEach((input) => {
  input.addEventListener("blur", function () {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const errorColor =
      currentTheme === "light"
        ? "rgba(239, 68, 68, 0.8)"
        : "rgba(248, 113, 113, 0.8)";
    const successColor =
      currentTheme === "light"
        ? "rgba(16, 185, 129, 0.8)"
        : "rgba(6, 182, 212, 0.8)";

    if (!isValidEmail(this.value)) {
      this.style.borderColor = errorColor;
    } else {
      this.style.borderColor = successColor;
    }
  });
});

// Password strength indicator
document
  .getElementById("register-password")
  .addEventListener("input", function () {
    const password = this.value;
    const validation = validatePasswordStrength(password);

    const currentTheme = document.documentElement.getAttribute("data-theme");
    let color =
      currentTheme === "light"
        ? "rgba(239, 68, 68, 0.8)"
        : "rgba(248, 113, 113, 0.8)";

    if (validation.isValid) {
      color =
        currentTheme === "light"
          ? "rgba(16, 185, 129, 0.8)"
          : "rgba(6, 182, 212, 0.8)";
    } else if (password.length >= 4) {
      color =
        currentTheme === "light"
          ? "rgba(251, 191, 36, 0.8)"
          : "rgba(245, 158, 11, 0.8)";
    }

    this.style.borderColor = color;
  });

// Enhanced checkbox functionality with fixed animation
document.querySelectorAll(".custom-checkbox").forEach((checkbox) => {
  checkbox.addEventListener("change", function () {
    // Trigger reflow to ensure animation works
    if (this.checked) {
      this.style.animation = "none";
      this.offsetHeight; // Trigger reflow
      this.style.animation = null;
    }
  });
});

// Add theme transition effect
document.addEventListener("DOMContentLoaded", function () {
  document.body.style.transition = "background 0.5s ease";
});



// When saving user data during registration
function saveUserData(email, name, phone, location) {
  // Use email as the key (replace dots with underscores since Firebase doesn't allow dots in keys)
  const emailKey = email.replace(/\./g, "_");

  firebase
    .database()
    .ref("users/" + emailKey)
    .set({
      name: name,
      email: email,
      phone: phone,
      location: location,
      theme: localStorage.getItem('theme') || 'light', // Save current theme
      registrationDate: new Date().toISOString(),
    })
    .then(() => {
      console.log("User data saved successfully!");
    })
    .catch((error) => {
      console.error("Error saving user data:", error);
    });
}
// Console message for developers
console.log("🌱 CropWise Authentication System Loaded");
console.log("💾 User data is stored in Firebase Realtime Database");
