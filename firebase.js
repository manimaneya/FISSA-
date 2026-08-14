// ==========================================
// FISSA - CONFIGURATION FIREBASE
// ==========================================

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBM65_c3NRrXCRByN8wHIZ60OKLpqSG6m0",
  authDomain: "fissa-1c083.firebaseapp.com",
  projectId: "fissa-1c083",
  storageBucket: "fissa-1c083.firebasestorage.app",
  messagingSenderId: "403816254031",
  appId: "1:403816254031:web:c601aebf6a3ef56982f83a",
  measurementId: "G-V4HZBSWEG1"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export {
  app,
  auth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
};
