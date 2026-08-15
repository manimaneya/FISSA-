import { registerUser, loginUser, logoutUser, voteDuel, createPost, addComment } from './firebase.js';

let likesACount = 0;
let likesBCount = 0;

// Navigation entre les pages
window.showPage = function(pageId) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active-page'));
  const targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.add('active-page');
};

window.goHome = function() {
  window.showPage('homePage');
};

window.goBack = function() {
  window.goHome();
};

window.scrollToComparison = function() {
  window.showPage('homePage');
  document.getElementById('comparison')?.scrollIntoView({ behavior: 'smooth' });
};

// Gestion des Modales
window.openAuth = function(type) {
  document.getElementById('authModal').classList.add('active');
};

window.closeAuth = function() {
  document.getElementById('authModal').classList.remove('active');
};

window.openPublish = function() {
  document.getElementById('publishModal').classList.add('active');
};

window.closePublish = function() {
  document.getElementById('publishModal').classList.remove('active');
};

// Basculer Inscription / Connexion
let isSignUp = false;
window.switchAuth = function() {
  isSignUp = !isSignUp;
  document.getElementById('authName').classList.toggle('hidden', !isSignUp);
  document.getElementById('authTitle').innerText = isSignUp ? "Inscription FISSA" : "Connexion FISSA";
  document.getElementById('authSubmit').innerText = isSignUp ? "S'inscrire" : "Se connecter";
  document.getElementById('switchAuth').innerText = isSignUp ? "J'ai déjà un compte" : "Créer un compte";
};

// Soumission Authentification
window.submitAuth = async function() {
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName').value;

  try {
    if (isSignUp) {
      await registerUser(email, password, name);
      alert("Compte créé avec succès !");
    } else {
      await loginUser(email, password);
      alert("Connecté avec succès !");
    }
    window.closeAuth();
  } catch (err) {
    alert("Erreur : " + err.message);
  }
};

// Charger les médias en local (Preview A/B)
window.loadMedia = function(event, side) {
  const file = event.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  const isVideo = file.type.startsWith('video/');

  const imgEl = document.getElementById(`image${side}`);
  const videoEl = document.getElementById(`video${side}`);
  const placeholder = document.getElementById(`placeholder${side}`);

  if (isVideo) {
    imgEl.classList.add('hidden');
    videoEl.src = url;
    videoEl.classList.remove('hidden');
  } else {
    videoEl.classList.add('hidden');
    imgEl.src = url;
    imgEl.classList.remove('hidden');
  }
  placeholder.classList.add('hidden');
};

// Système de vote A/B
window.vote = function(side, btnEl) {
  if (side === 'A') likesACount++;
  if (side === 'B') likesBCount++;

  document.getElementById('likesA').innerText = likesACount;
  document.getElementById('likesB').innerText = likesBCount;

  const total = likesACount + likesBCount;
  const percentA = total > 0 ? Math.round((likesACount / total) * 100) : 50;
  const percentB = total > 0 ? 100 - percentA : 50;

  document.getElementById('percentA').innerText = `${percentA}%`;
  document.getElementById('percentB').innerText = `${percentB}%`;
  document.getElementById('scoreA').style.width = `${percentA}%`;
  document.getElementById('scoreB').style.width = `${percentB}%`;
};

// Commentaires
window.addComment = function(event) {
  event.preventDefault();
  const input = document.getElementById('commentInput');
  if (!input.value.trim()) return;

  const list = document.getElementById('commentsList');
  const commentItem = document.createElement('div');
  commentItem.className = 'comment-item';
  commentItem.innerHTML = `<p><strong>Membre :</strong> ${input.value}</p>`;
  list.prepend(commentItem);

  input.value = '';
};
