// firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyBBnATkRmwJewIXE2uyEIdXnRgDKk7ZWZo",
    authDomain: "cropwise-a6d60.firebaseapp.com",
    databaseURL: "https://cropwise-a6d60-default-rtdb.firebaseio.com",
    projectId: "cropwise-a6d60",
    storageBucket: "cropwise-a6d60.firebasestorage.app",
    messagingSenderId: "80875044021",
    appId: "1:80875044021:web:357a754606a08d960cd2fc",
    measurementId: "G-4NHH2DDBVV",
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Database
const auth = firebase.auth();
const database = firebase.database();

// Make them available globally
window.auth = auth;
window.database = database;
