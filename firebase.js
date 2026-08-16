import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  deleteUser
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
  serverTimestamp,
  deleteDoc,
  where,
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBM65_c3NRrXCRByN8wHIZ60OKLpqSG6m0",
  authDomain: "fissa-1c083.firebaseapp.com",
  projectId: "fissa-1c083",
  storageBucket: "fissa-1c083.firebasestorage.app",
  messagingSenderId: "403816254031",
  appId: "1:403816254031:web:c601aebf6a3ef56982f83a",
  measurementId: "G-V4HZBSWEG1"
};

// Initialisation
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ================= AUTHENTIFICATION =================

/**
 * Inscription d'un nouvel utilisateur
 */
export async function registerUser(email, password, name) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Mettre à jour le profil avec le nom
    await updateProfile(user, {
      displayName: name || 'Utilisateur FISSA'
    });

    // Créer le document utilisateur dans Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: name || 'Utilisateur FISSA',
      email: email,
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      totalVotes: 0,
      totalPosts: 0,
      totalComments: 0,
      badges: ['Membre FISSA'],
      isAdmin: false,
      isVerified: false
    });

    console.log('✅ Utilisateur inscrit avec succès:', user.uid);
    return { success: true, user };
  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Connexion utilisateur
 */
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Mettre à jour la date de dernière connexion
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      lastLogin: serverTimestamp()
    });

    console.log('✅ Utilisateur connecté:', user.uid);
    return { success: true, user };
  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Déconnexion
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    console.log('✅ Utilisateur déconnecté');
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur déconnexion:', error);
    throw new Error('Erreur lors de la déconnexion');
  }
}

/**
 * Observateur d'état d'authentification
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Récupérer les données utilisateur depuis Firestore
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          callback({ ...user, ...userData });
        } else {
          callback(user);
        }
      } catch (error) {
        console.error('Erreur récupération utilisateur:', error);
        callback(user);
      }
    } else {
      callback(null);
    }
  });
}

/**
 * Supprimer le compte utilisateur
 */
export async function deleteUserAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error("Aucun utilisateur connecté");

  try {
    // Supprimer les données utilisateur de Firestore
    await deleteDoc(doc(db, "users", user.uid));
    
    // Supprimer toutes les publications de l'utilisateur
    const postsQuery = query(collection(db, "publications"), where("authorId", "==", user.uid));
    const postsSnapshot = await getDocs(postsQuery);
    postsSnapshot.forEach(async (post) => {
      await deleteDoc(doc(db, "publications", post.id));
    });

    // Supprimer le compte d'authentification
    await deleteUser(user);
    
    console.log('✅ Compte supprimé avec succès');
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur suppression compte:', error);
    throw new Error('Erreur lors de la suppression du compte');
  }
}

// ================= STORAGE =================

/**
 * Upload de fichier vers Firebase Storage
 */
export async function uploadFile(file, path = 'uploads') {
  const user = auth.currentUser;
  if (!user) throw new Error("Veuillez vous connecter");

  try {
    const fileName = `${Date.now()}_${file.name}`;
    const storagePath = `${path}/${user.uid}/${fileName}`;
    const storageRef = ref(storage, storagePath);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: storagePath,
      fileName: fileName,
      fileType: file.type,
      fileSize: file.size
    };
  } catch (error) {
    console.error('❌ Erreur upload:', error);
    throw new Error('Erreur lors de l\'upload du fichier');
  }
}

/**
 * Supprimer un fichier du storage
 */
export async function deleteFile(filePath) {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur suppression fichier:', error);
    throw new Error('Erreur lors de la suppression du fichier');
  }
}

// ================= PUBLICATIONS =================

/**
 * Créer une nouvelle publication
 */
export async function createPost(title, text, mediaData = null) {
  const user = auth.currentUser;
  if (!user) throw new Error("Veuillez vous connecter.");

  try {
    const postData = {
      title: title || "Sans titre",
      text: text || "",
      authorId: user.uid,
      authorName: user.displayName || 'Utilisateur FISSA',
      authorPhotoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: 0,
      commentsCount: 0,
      isDuel: false,
      media: mediaData ? {
        url: mediaData.url,
        type: mediaData.fileType,
        fileName: mediaData.fileName,
        size: mediaData.fileSize,
        path: mediaData.path
      } : null,
      tags: [],
      category: 'general',
      visibility: 'public'
    };

    const docRef = await addDoc(collection(db, "publications"), postData);
    
    // Mettre à jour le compteur de publications de l'utilisateur
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      totalPosts: increment(1)
    });

    console.log('✅ Publication créée:', docRef.id);
    return { id: docRef.id, ...postData };
  } catch (error) {
    console.error('❌ Erreur création publication:', error);
    throw new Error('Erreur lors de la création de la publication');
  }
}

/**
 * Créer un duel (A vs B)
 */
export async function createDuel(title, text, mediaA, mediaB) {
  const user = auth.currentUser;
  if (!user) throw new Error("Veuillez vous connecter.");

  try {
    const duelData = {
      title: title || "Duel A vs B",
      text: text || "Quelle création préférez-vous ?",
      authorId: user.uid,
      authorName: user.displayName || 'Utilisateur FISSA',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDuel: true,
      mediaA: {
        url: mediaA.url,
        type: mediaA.fileType,
        fileName: mediaA.fileName
      },
      mediaB: {
        url: mediaB.url,
        type: mediaB.fileType,
        fileName: mediaB.fileName
      },
      likesA: 0,
      likesB: 0,
      votesA: 0,
      votesB: 0,
      totalVotes: 0,
      commentsCount: 0,
      isActive: true,
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
    };

    const docRef = await addDoc(collection(db, "duels"), duelData);
    
    // Mettre à jour le compteur de publications de l'utilisateur
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      totalPosts: increment(1)
    });

    console.log('✅ Duel créé:', docRef.id);
    return { id: docRef.id, ...duelData };
  } catch (error) {
    console.error('❌ Erreur création duel:', error);
    throw new Error('Erreur lors de la création du duel');
  }
}

/**
 * Voter pour un duel
 */
export async function voteDuel(duelId, side) {
  const user = auth.currentUser;
  if (!user) throw new Error("Veuillez vous connecter.");

  try {
    const duelRef = doc(db, "duels", duelId);
    const field = side === 'A' ? 'votesA' : 'votesB';
    const likesField = side === 'A' ? 'likesA' : 'likesB';
    
    // Vérifier si l'utilisateur a déjà voté
    const voteRef = doc(db, "duels", duelId, "votes", user.uid);
    const voteDoc = await getDoc(voteRef);
    
    if (voteDoc.exists()) {
      throw new Error("Vous avez déjà voté pour ce duel");
    }

    // Enregistrer le vote
    await setDoc(voteRef, {
      userId: user.uid,
      side: side,
      timestamp: serverTimestamp()
    });

    // Mettre à jour les scores du duel
    await updateDoc(duelRef, {
      [field]: increment(1),
      [likesField]: increment(1),
      totalVotes: increment(1)
    });

    // Mettre à jour le compteur de votes de l'utilisateur
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      totalVotes: increment(1)
    });

    console.log('✅ Vote enregistré pour le duel:', duelId);
    return { success: true, side };
  } catch (error) {
    console.error('❌ Erreur vote:', error);
    throw new Error(error.message || 'Erreur lors du vote');
  }
}

/**
 * Récupérer les duels
 */
export async function getDuels(limitCount = 10, status = 'active') {
  try {
    let q;
    
    if (status === 'active') {
      q = query(
        collection(db, "duels"),
        where("isActive", "==", true),
        where("endsAt", ">", new Date()),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    } else if (status === 'ended') {
      q = query(
        collection(db, "duels"),
        where("isActive", "==", false),
        orderBy("endsAt", "desc"),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, "duels"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    const duels = [];
    
    snapshot.forEach((doc) => {
      duels.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return duels;
  } catch (error) {
    console.error('❌ Erreur récupération duels:', error);
    throw new Error('Erreur lors de la récupération des duels');
  }
}

/**
 * Récupérer les publications
 */
export async function getPublications(limitCount = 20) {
  try {
    const q = query(
      collection(db, "publications"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const publications = [];
    
    snapshot.forEach((doc) => {
      publications.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return publications;
  } catch (error) {
    console.error('❌ Erreur récupération publications:', error);
    throw new Error('Erreur lors de la récupération des publications');
  }
}

// ================= COMMENTAIRES =================

/**
 * Ajouter un commentaire
 */
export async function addComment(publicationId, text, isDuel = false) {
  const user = auth.currentUser;
  if (!user) throw new Error("Veuillez vous connecter.");

  try {
    const collectionPath = isDuel ? `duels/${publicationId}/comments` : `publications/${publicationId}/comments`;
    
    const commentData = {
      text: text,
      userId: user.uid,
      userName: user.displayName || 'Utilisateur FISSA',
      userPhotoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
      likes: 0
    };

    const docRef = await addDoc(collection(db, collectionPath), commentData);
    
    // Mettre à jour le compteur de commentaires
    const parentRef = doc(db, isDuel ? "duels" : "publications", publicationId);
    await updateDoc(parentRef, {
      commentsCount: increment(1)
    });

    // Mettre à jour le compteur de commentaires de l'utilisateur
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      totalComments: increment(1)
    });

    console.log('✅ Commentaire ajouté:', docRef.id);
    return { id: docRef.id, ...commentData };
  } catch (error) {
    console.error('❌ Erreur ajout commentaire:', error);
    throw new Error('Erreur lors de l\'ajout du commentaire');
  }
}

/**
 * Récupérer les commentaires d'une publication
 */
export async function getComments(publicationId, isDuel = false, limitCount = 50) {
  try {
    const collectionPath = isDuel ? `duels/${publicationId}/comments` : `publications/${publicationId}/comments`;
    
    const q = query(
      collection(db, collectionPath),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const comments = [];
    
    snapshot.forEach((doc) => {
      comments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return comments;
  } catch (error) {
    console.error('❌ Erreur récupération commentaires:', error);
    throw new Error('Erreur lors de la récupération des commentaires');
  }
}

// ================= STORIES =================

/**
 * Créer une story (disparaît après 24h)
 */
export async function createStory(mediaData, text = '') {
  const user = auth.currentUser;
  if (!user) throw new Error("Veuillez vous connecter.");

  try {
    const storyData = {
      userId: user.uid,
      userName: user.displayName || 'Utilisateur FISSA',
      userPhotoURL: user.photoURL || null,
      text: text,
      media: {
        url: mediaData.url,
        type: mediaData.fileType,
        fileName: mediaData.fileName
      },
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      views: 0,
      likes: 0
    };

    const docRef = await addDoc(collection(db, "stories"), storyData);
    console.log('✅ Story créée:', docRef.id);
    return { id: docRef.id, ...storyData };
  } catch (error) {
    console.error('❌ Erreur création story:', error);
    throw new Error('Erreur lors de la création de la story');
  }
}

/**
 * Récupérer les stories actives
 */
export async function getActiveStories() {
  try {
    const now = new Date();
    const q = query(
      collection(db, "stories"),
      where("expiresAt", ">", now),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const stories = [];
    
    snapshot.forEach((doc) => {
      stories.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return stories;
  } catch (error) {
    console.error('❌ Erreur récupération stories:', error);
    throw new Error('Erreur lors de la récupération des stories');
  }
}

// ================= UTILITAIRES =================

/**
 * Gestion des erreurs d'authentification
 */
function getAuthErrorMessage(errorCode) {
  const messages = {
    'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
    'auth/invalid-email': 'Adresse email invalide.',
    'auth/operation-not-allowed': 'Opération non autorisée.',
    'auth/weak-password': 'Le mot de passe est trop faible (6 caractères minimum).',
    'auth/user-disabled': 'Ce compte a été désactivé.',
    'auth/user-not-found': 'Aucun compte trouvé avec cet email.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
    'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
    'auth/requires-recent-login': 'Cette opération nécessite une connexion récente.'
  };
  
  return messages[errorCode] || 'Une erreur est survenue. Veuillez réessayer.';
}

/**
 * Vérifier si l'utilisateur est connecté
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Mettre à jour le profil utilisateur
 */
export async function updateUserProfile(updates) {
  const user = auth.currentUser;
  if (!user) throw new Error("Aucun utilisateur connecté");

  try {
    // Mettre à jour l'authentification
    if (updates.displayName) {
      await updateProfile(user, {
        displayName: updates.displayName
      });
    }

    // Mettre à jour Firestore
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Profil mis à jour');
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur mise à jour profil:', error);
    throw new Error('Erreur lors de la mise à jour du profil');
  }
}

/**
 * Obtenir les statistiques utilisateur
 */
export async function getUserStats(userId = null) {
  const uid = userId || auth.currentUser?.uid;
  if (!uid) throw new Error("Utilisateur non connecté");

  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error("Utilisateur non trouvé");
    }

    const userData = userDoc.data();
    
    // Récupérer les statistiques supplémentaires
    const postsQuery = query(collection(db, "publications"), where("authorId", "==", uid));
    const postsSnapshot = await getDocs(postsQuery);
    const totalPosts = postsSnapshot.size;

    const duelsQuery = query(collection(db, "duels"), where("authorId", "==", uid));
    const duelsSnapshot = await getDocs(duelsQuery);
    const totalDuels = duelsSnapshot.size;

    return {
      ...userData,
      totalPosts,
      totalDuels,
      totalEngagement: totalPosts + totalDuels + (userData.totalComments || 0)
    };
  } catch (error) {
    console.error('❌ Erreur récupération stats:', error);
    throw new Error('Erreur lors de la récupération des statistiques');
  }
}

// ================= ÉCOUTEURS EN TEMPS RÉEL =================

/**
 * Écouter les changements d'un duel en temps réel
 */
export function listenDuel(duelId, callback) {
  const duelRef = doc(db, "duels", duelId);
  return onSnapshot(duelRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  });
}

/**
 * Écouter les changements d'une publication en temps réel
 */
export function listenPublication(publicationId, callback) {
  const pubRef = doc(db, "publications", publicationId);
  return onSnapshot(pubRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  });
}

// Export pour compatibilité
export default {
  auth,
  db,
  storage,
  registerUser,
  loginUser,
  logoutUser,
  onAuthChange,
  deleteUserAccount,
  uploadFile,
  deleteFile,
  createPost,
  createDuel,
  voteDuel,
  getDuels,
  getPublications,
  addComment,
  getComments,
  createStory,
  getActiveStories,
  getCurrentUser,
  updateUserProfile,
  getUserStats,
  listenDuel,
  listenPublication
};
