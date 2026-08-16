// Import Firebase (si configuré)
// import { registerUser, loginUser, logoutUser, voteDuel, createPost, addComment } from './firebase.js';

// État global
const state = {
  user: null,
  likesA: 0,
  likesB: 0,
  comments: [],
  posts: [],
  stories: [],
  isSignUp: false,
  currentPage: 'homePage'
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
  state.currentPage = pageId;
};

window.goHome = function() {
  window.showPage('homePage');
};

window.goBack = function() {
  window.showPage('homePage');
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
  document.getElementById('authModal').classList.remove
