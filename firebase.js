import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  increment, 
  query, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
export const auth = getAuth(app);
export const db = getFirestore(app);

// Authentification
export async function registerUser(email, password, name) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    name: name,
    email: email,
    createdAt: serverTimestamp()
  });
  return user;
}

export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

// Publications & Duels
export async function createPost(title, text, mediaUrl = null) {
  const user = auth.currentUser;
  if (!user) throw new Error("Veuillez vous connecter.");

  return await addDoc(collection(db, "publications"), {
    title,
    text,
    mediaUrl,
    authorId: user.uid,
    likesA: 0,
    likesB: 0,
    createdAt: serverTimestamp()
  });
}

export async function voteDuel(publicationId, side) {
  const postRef = doc(db, "publications", publicationId);
  const field = side === 'A' ? 'likesA' : 'likesB';
  await updateDoc(postRef, { [field]: increment(1) });
}

export async function addComment(publicationId, text) {
  const user = auth.currentUser;
  if (!user) throw new Error("Veuillez vous connecter.");

  return await addDoc(collection(db, "publications", publicationId, "comments"), {
    text,
    userId: user.uid,
    createdAt: serverTimestamp()
  });
}
