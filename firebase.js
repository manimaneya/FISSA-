// ==========================================
// FISSA — FIREBASE.JS
// Authentification + Firestore
// ==========================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==========================================
// CONFIGURATION FIREBASE
// ==========================================

const firebaseConfig = {

  apiKey:
    "AIzaSyBM65_c3NRrXCRByN8wHIZ60OKLpqSG6m0",

  authDomain:
    "fissa-1c083.firebaseapp.com",

  projectId:
    "fissa-1c083",

  storageBucket:
    "fissa-1c083.firebasestorage.app",

  messagingSenderId:
    "403816254031",

  appId:
    "1:403816254031:web:c601aebf6a3ef56982f83a",

  measurementId:
    "G-V4HZBSWEG1"
};


// ==========================================
// INITIALISATION
// ==========================================

const app =
  initializeApp(firebaseConfig);


// ==========================================
// AUTHENTIFICATION
// ==========================================

const auth =
  getAuth(app);


// ==========================================
// FIRESTORE
// ==========================================

const db =
  getFirestore(app);


// ==========================================
// EXPORTS
// ==========================================

export {

  // Firebase
  app,
  auth,
  db,

  // Auth
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,

  // Firestore
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment

};
