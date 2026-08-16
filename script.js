import * as firebase from './firebase.js';
import { 
  registerUser, loginUser, logoutUser, 
  createPost, createDuel, voteDuel, 
  addComment, uploadFile, getPublications, 
  getDuels, getActiveStories, createStory,
  getCurrentUser, onAuthChange, updateUserProfile,
  getUserStats
} from './firebase.js';

// ================= ÉTAT GLOBAL =================
const state = {
  user: null,
  currentDuelId: null,
  currentPublicationId: null,
  isSignUp: false,
  userStats: null
};

// ================= AI INTÉGRATION =================
class FISSA_AI {
  constructor() {
    this.apiKey = 'votre-clef-api'; // À remplacer par une vraie clef
    this.endpoint = 'https://api.openai.com/v1/chat/completions';
  }

  async analyze(mediaType, context) {
    const prompt = `Analyse ce ${mediaType} dans le contexte de FISSA (plateforme de comparaison A/B). 
    Contenu: ${context}
    Donne une analyse créative, des points forts et des suggestions d'amélioration.`;
    
    return await this.ask(prompt);
  }

  async compare(mediaA, mediaB) {
    const prompt = `Compare ces deux créations pour FISSA:
    Création A: ${mediaA}
    Création B: ${mediaB}
    Analyse les forces, faiblesses, et suggère des améliorations pour chaque.`;
    
    return await this.ask(prompt);
  }

  async ask(prompt) {
    try {
      // Version simulée (démo)
      return this.generateMockResponse(prompt);
      
      // Version réelle avec API OpenAI
      /*
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        })
      });
      const data = await response.json();
      return data.choices[0].message.content;
      */
    } catch (error) {
      console.error('Erreur AI:', error);
      return "L'IA est temporairement indisponible. Réessaye plus tard.";
    }
  }

  generateMockResponse(prompt) {
    const responses = [
      "🎨 Analyse créative : Cette création a un fort potentiel visuel. Les couleurs sont bien équilibrées et le message est clair. Suggestions : ajouter des éléments interactifs pour plus d'engagement.",
      "💡 Points forts : Originalité du concept, qualité technique. Points d'amélioration : la narration pourrait être plus fluide. Essaye d'ajouter une introduction captivante.",
      "⭐ Analyse: Excellent travail! La composition est maîtrisée. Pour aller plus loin, pense à varier les angles de vue et à jouer avec les contrastes.",
      "🤖 Analyse IA: Cette création se démarque par son authenticité. Les émotions sont bien transmises. Pour améliorer l'impact, travaille sur le rythme et la progression."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

const ai = new FISSA_AI();

// ================= NAVIGATION =================
window.showPage = function(pageId) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active-page'));
  const targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.add('active-page');
  if (pageId === 'profilePage') loadUserProfile();
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

// ================= MODALES =================
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

window.openAI = function() {
  document.getElementById('aiModal').classList.add('active');
};

window.closeAI = function() {
  document.getElementById('aiModal').classList.remove('active');
};

// ================= AUTHENTIFICATION =================
window.switchAuthUI = function() {
  state.isSignUp = !state.isSignUp;
  document.getElementById('authName').classList.toggle('hidden', !state.isSignUp);
  document.getElementById('authTitle').innerText = state.isSignUp ? "Inscription FISSA" : "Connexion FISSA";
  document.getElementById('authSubmit').innerText = state.isSignUp ? "S'inscrire" : "Se connecter";
  document.getElementById('switchAuth').innerText = state.isSignUp ? "J'ai déjà un compte" : "Créer un compte";
};

window.submitAuthUI = async function() {
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName').value;

  if (!email || !password) {
    showToast('Veuillez remplir tous les champs');
    return;
  }

  try {
    let result;
    if (state.isSignUp) {
      if (!name) {
        showToast('Veuillez entrer votre nom');
        return;
      }
      result = await registerUser(email, password, name);
      showToast('✅ Compte créé avec succès !');
    } else {
      result = await loginUser(email, password);
      showToast('✅ Connecté avec succès !');
    }
    
    window.closeAuth();
    updateUI();
  } catch (err) {
    showToast('❌ ' + err.message);
  }
};

window.logoutUI = async function() {
  try {
    await logoutUser();
    showToast('👋 Déconnecté');
    state.user = null;
    window.goHome();
    updateUI();
  } catch (err) {
    showToast('❌ ' + err.message);
  }
};

// ================= MÉDIAS =================
window.loadMedia = function(event, side) {
  const file = event.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  const isVideo = file.type.startsWith('video/');

  const imgEl = document.getElementById(`image${side}`);
  const videoEl = document.getElementById(`video${side}`);
  const placeholder = document.getElementById(`placeholder${side}`);

  // Stocker le fichier pour l'upload
  if (state[`file${side}`]) {
    URL.revokeObjectURL(state[`file${side}`]);
  }
  state[`file${side}`] = file;

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
  
  showToast(`📁 Média ${side} chargé`);
};

window.toggleVideo = function(side) {
  const video = document.getElementById(`video${side}`);
  if (video.paused) {
    video.play();
    document.getElementById(`play${side}`).textContent = '⏸';
  } else {
    video.pause();
    document.getElementById(`play${side}`).textContent = '▶';
  }
};

window.toggleSound = function(side) {
  const video = document.getElementById(`video${side}`);
  video.muted = !video.muted;
  document.getElementById(`sound${side}`).textContent = video.muted ? '🔇' : '🔊';
};

// ================= VOTE DUEL =================
window.voteDuelUI = async function(side, btnEl) {
  if (!state.user) {
    showToast('🔒 Connecte-toi pour voter');
    return;
  }

  if (!state.currentDuelId) {
    showToast('⚠️ Aucun duel actif');
    return;
  }

  try {
    await voteDuel(state.currentDuelId, side);
    
    // Mettre à jour l'interface
    const likesA = document.getElementById('likesA');
    const likesB = document.getElementById('likesB');
    const currentA = parseInt(likesA.textContent) || 0;
    const currentB = parseInt(likesB.textContent) || 0;
    
    if (side === 'A') {
      likesA.textContent = currentA + 1;
    } else {
      likesB.textContent = currentB + 1;
    }
    
    updateScore();
    showToast(`✅ Vote pour ${side} enregistré !`);
  } catch (err) {
    showToast('❌ ' + err.message);
  }
};

function updateScore() {
  const likesA = parseInt(document.getElementById('likesA').textContent) || 0;
  const likesB = parseInt(document.getElementById('likesB').textContent) || 0;
  
  const total = likesA + likesB;
  const percentA = total > 0 ? Math.round((likesA / total) * 100) : 50;
  const percentB = total > 0 ? 100 - percentA : 50;

  document.getElementById('percentA').innerText = `${percentA}%`;
  document.getElementById('percentB').innerText = `${percentB}%`;
  document.getElementById('scoreA').style.width = `${percentA}%`;
  document.getElementById('scoreB').style.width = `${percentB}%`;
}

// ================= COMMENTAIRES =================
window.addCommentUI = async function(event) {
  event.preventDefault();
  const input = document.getElementById('commentInput');
  if (!input.value.trim()) return;

  if (!state.user) {
    showToast('🔒 Connecte-toi pour commenter');
    return;
  }

  if (!state.currentPublicationId && !state.currentDuelId) {
    showToast('⚠️ Aucune publication ou duel sélectionné');
    return;
  }

  try {
    const pubId = state.currentPublicationId || state.currentDuelId;
    const isDuel = !!state.currentDuelId;
    
    await addComment(pubId, input.value, isDuel);
    
    const list = document.getElementById('commentsList');
    const commentItem = document.createElement('div');
    commentItem.className = 'comment-item';
    commentItem.innerHTML = `
      <p><strong>${state.user.displayName || 'Membre'} :</strong> ${input.value}</p>
      <small style="color: var(--text-muted)">À l'instant</small>
    `;
    list.prepend(commentItem);

    input.value = '';
    showToast('💬 Commentaire ajouté !');
  } catch (err) {
    showToast('❌ ' + err.message);
  }
};

// ================= AI FONCTIONS =================
window.askAI = async function() {
  const prompt = document.getElementById('aiPrompt').value;
  if (!prompt.trim()) {
    showToast('📝 Pose une question à l\'IA');
    return;
  }

  document.getElementById('aiResponse').classList.remove('hidden');
  document.getElementById('aiResponseText').textContent = '🤖 Analyse en cours...';

  const response = await ai.ask(prompt);
  document.getElementById('aiResponseText').textContent = response;
  showToast('🤖 Réponse IA générée !');
};

window.analyzeDuel = async function() {
  document.getElementById('aiAnalysis').classList.remove('hidden');
  document.getElementById('aiResult').textContent = '🔍 Analyse en cours...';

  const mediaA = document.getElementById('imageA').src || document.getElementById('videoA').src || 'Création A';
  const mediaB = document.getElementById('imageB').src || document.getElementById('videoB').src || 'Création B';
  
  const response = await ai.compare(mediaA, mediaB);
  document.getElementById('aiResult').textContent = response;
  showToast('🤖 Duel analysé !');
};

window.analyzeMedia = async function(side) {
  const media = document.getElementById(`image${side}`).src || document.getElementById(`video${side}`).src || `Création ${side}`;
  const response = await ai.analyze('média', media);
  showToast(`🤖 Analyse de ${side} : ${response.substring(0, 80)}...`);
};

// ================= PUBLICATION =================
window.previewPublication = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const preview = document.getElementById('publishPreview');
  const url = URL.createObjectURL(file);
  state.publishFile = file;
  
  if (file.type.startsWith('video/')) {
    preview.innerHTML = `<video src="${url}" controls style="max-width:100%; max-height:200px; border-radius:8px;"></video>`;
  } else {
    preview.innerHTML = `<img src="${url}" style="max-width:100%; max-height:200px; border-radius:8px; object-fit:contain;">`;
  }
};

window.publishPostUI = async function() {
  const title = document.getElementById('publishTitle').value;
  const text = document.getElementById('publishText').value;
  const file = state.publishFile;
  
  if (!title || !text) {
    showToast('📝 Remplis le titre et la description');
    return;
  }

  if (!state.user) {
    showToast('🔒 Connecte-toi pour publier');
    return;
  }

  try {
    let mediaData = null;
    if (file) {
      mediaData = await uploadFile(file, 'publications');
    }

    await createPost(title, text, mediaData);
    window.closePublish();
    showToast('🚀 Publication créée avec succès !');
    
    // Réinitialiser le formulaire
    document.getElementById('publishTitle').value = '';
    document.getElementById('publishText').value = '';
    document.getElementById('publishPreview').innerHTML = '';
    state.publishFile = null;
    
    loadNews();
  } catch (err) {
    showToast('❌ ' + err.message);
  }
};

// ================= ACTUALITÉS =================
window.loadNews = async function() {
  const feed = document.getElementById('newsFeed');
  const fullFeed = document.getElementById('fullNewsFeed');
  
  try {
    const publications = await getPublications(20);
    
    if (publications.length === 0) {
      feed.innerHTML = `<div class="news-item"><p>Aucune publication pour le moment. Sois le premier à publier !</p></div>`;
      if (fullFeed) fullFeed.innerHTML = feed.innerHTML;
      return;
    }

    const renderPosts = (container) => {
      container.innerHTML = publications.map(post => {
        const date = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : 'Récent';
        return `
          <div class="news-item" onclick="selectPublication('${post.id}')">
            <h3>${post.title}</h3>
            <p>${post.text}</p>
            <div style="display:flex; gap:12px; margin-top:8px; color:var(--text-muted); font-size:0.85rem;">
              <span>👤 ${post.authorName || 'Anonyme'}</span>
              <span>🕐 ${date}</span>
              <span>❤️ ${post.likes || 0}</span>
              <span>💬 ${post.commentsCount || 0}</span>
            </div>
          </div>
        `;
      }).join('');
    };

    renderPosts(feed);
    if (fullFeed) renderPosts(fullFeed);
  } catch (err) {
    console.error('Erreur chargement news:', err);
    feed.innerHTML = `<div class="news-item"><p>⚠️ Erreur lors du chargement des publications</p></div>`;
  }
};

// ================= STORIES =================
window.loadStories = async function() {
  const preview = document.getElementById('storiesPreview');
  const grid = document.getElementById('storiesGrid');
  
  try {
    const stories = await getActiveStories();
    
    const renderStories = (container, limit) => {
      const storiesToShow = limit ? stories.slice(0, limit) : stories;
      
      // Garder le bouton "+"
      const addBtn = container.querySelector('.story-add')?.outerHTML || 
        `<button class="story-add" onclick="openPublish()"><span>＋</span><small>Ma Story</small></button>`;
      
      const storiesHTML = storiesToShow.map(story => `
        <div class="story-item" style="min-width:80px; height:80px; background:var(--card-bg); border-radius:12px; border:2px solid var(--primary-blue); display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; padding:8px;" onclick="viewStory('${story.id}')">
          <span style="font-size:1.5rem;">📸</span>
          <small style="color:var(--text-muted); font-size:0.7rem;">${story.userName || 'Story'}</small>
        </div>
      `).join('');
      
      container.innerHTML = addBtn + storiesHTML;
    };

    renderStories(preview, 4);
    if (grid) renderStories(grid);
  } catch (err) {
    console.error('Erreur chargement stories:', err);
  }
};

// ================= PROFIL =================
async function loadUserProfile() {
  if (!state.user) {
    showToast('🔒 Connecte-toi pour voir ton profil');
    return;
  }

  try {
    const stats = await getUserStats(state.user.uid);
    state.userStats = stats;
    
    document.getElementById('profileName').textContent = stats.name || 'Utilisateur FISSA';
    document.getElementById('profileEmail').textContent = stats.email || '—';
    document.getElementById('publicationCount').textContent = stats.totalPosts + stats.totalDuels || 0;
    document.getElementById('profileLetter').textContent = (stats.name || 'U')[0].toUpperCase();
  } catch (err) {
    console.error('Erreur chargement profil:', err);
    showToast('❌ Erreur lors du chargement du profil');
  }
}

// ================= SELECTION PUBLICATION =================
window.selectPublication = function(publicationId) {
  state.currentPublicationId = publicationId;
  state.currentDuelId = null;
  showToast(`📄 Publication ${publicationId} sélectionnée`);
  // Vous pouvez charger les commentaires ici
};

// ================= INTERFACE =================
function updateUI() {
  if (state.user) {
    document.getElementById('loginButton').classList.add('hidden');
    document.getElementById('userAvatar').classList.remove('hidden');
    document.getElementById('userAvatar').textContent = (state.user.displayName || 'U')[0].toUpperCase();
  } else {
    document.getElementById('loginButton').classList.remove('hidden');
    document.getElementById('userAvatar').classList.add('hidden');
  }
}

// ================= TOAST =================
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ================= INITIALISATION =================
document.addEventListener('DOMContentLoaded', async function() {
  // Observer l'état d'authentification
  onAuthChange((user) => {
    state.user = user;
    updateUI();
    
    if (user) {
      console.log('👤 Utilisateur connecté:', user.displayName);
      loadUserProfile();
    } else {
      console.log('👤 Utilisateur déconnecté');
    }
  });

  // Charger les données
  await loadNews();
  await loadStories();
  
  // Démarrer le canvas d'arrière-plan
  initCanvas();
  
  console.log('🚀 FISSA AI loaded successfully!');
});

// ================= CANVAS BACKGROUND =================
function initCanvas() {
  const canvas = document.getElementById('mathCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.radius = Math.random() * 2 + 1;
      this.opacity = Math.random() * 0.5 + 0.1;
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
    
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(108, 92, 231, ${this.opacity})`;
      ctx.fill();
    }
  }
  
  for (let i = 0; i < 50; i++) {
    particles.push(new Particle());
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
}

// ================= PARTAGE =================
window.sharePost = function(side) {
  if (navigator.share) {
    navigator.share({
      title: `FISSA - Création ${side}`,
      text: `Découvrez la création ${side} sur FISSA ! Votez pour la meilleure !`,
      url: window.location.href
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    showToast('🔗 Lien copié dans le presse-papiers !');
  }
};

// ================= EXPORTS =================
export { state };
