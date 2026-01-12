// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyATgoPeLoxiThSZ1cSlBIKqUjGTlvL6FXc",
  authDomain: "avesafe-gurukul.firebaseapp.com",
  projectId: "avesafe-gurukul",
  storageBucket: "avesafe-gurukul.firebasestorage.app",
  messagingSenderId: "259654067250",
  appId: "1:259654067250:web:78d256a0d9a2486c1b482b",
  measurementId: "G-KW3S9103BC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

console.log("firebase-init.js loaded");

export { app };