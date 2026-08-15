// ============================================================
// FISSA — SCRIPT.JS COMPLET
// Fil actualité + publication + A/B + vidéos + stories
// Profil + likes + commentaires + partage + FISSA AI
// ============================================================

import {
  auth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "./firebase.js";


// ============================================================
// VARIABLES
// ============================================================

let authMode = "login";
let toastTimer = null;

let likes = {
  A: 0,
  B: 0
};

let currentCommentSide = "A";

let publications =
  JSON.parse(
    localStorage.getItem("fissa_publications") || "[]"
  );

let stories =
  JSON.parse(
    localStorage.getItem("fissa_stories") || "[]"
  );


// ============================================================
// UTILITAIRES
// ============================================================

function savePublications() {

  localStorage.setItem(
    "fissa_publications",
    JSON.stringify(publications)
  );
}


function saveStories() {

  localStorage.setItem(
    "fissa_stories",
    JSON.stringify(stories)
  );
}


function escapeHTML(text) {

  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function getCurrentUserName() {

  const user = auth.currentUser;

  if (!user) {
    return "Visiteur";
  }

  return (
    user.displayName ||
    user.email ||
    "Utilisateur FISSA"
  );
}


// ============================================================
// TOAST
// ============================================================

window.showToast = function(message) {

  const toast =
    document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {

    toast.classList.remove("show");

  }, 2500);
};


// ============================================================
// AUTHENTIFICATION
// ============================================================

window.openAuth = function(mode = "login") {

  authMode = mode;

  const modal =
    document.getElementById("authModal");

  const title =
    document.getElementById("authTitle");

  const name =
    document.getElementById("authName");

  const submit =
    document.getElementById("authSubmit");

  const switchButton =
    document.getElementById("switchAuth");

  if (!modal) return;

  modal.classList.add("show");

  if (mode === "register") {

    title.textContent =
      "Créer un compte FISSA";

    name.classList.remove("hidden");

    submit.textContent =
      "Créer mon compte";

    switchButton.textContent =
      "J'ai déjà un compte — Me connecter";

  } else {

    title.textContent =
      "Connexion FISSA";

    name.classList.add("hidden");

    submit.textContent =
      "Se connecter";

    switchButton.textContent =
      "Créer un nouveau compte";
  }
};


window.closeAuth = function() {

  const modal =
    document.getElementById("authModal");

  if (modal) {
    modal.classList.remove("show");
  }
};


window.switchAuth = function() {

  if (authMode === "login") {

    openAuth("register");

  } else {

    openAuth("login");
  }
};


// ============================================================
// CONNEXION / INSCRIPTION
// ============================================================

window.submitAuth = async function() {

  const nameInput =
    document.getElementById("authName");

  const emailInput =
    document.getElementById("authEmail");

  const passwordInput =
    document.getElementById("authPassword");

  const name =
    nameInput.value.trim();

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;

  if (!email) {

    showToast("Entre ton adresse e-mail.");

    return;
  }

  if (!password) {

    showToast("Entre ton mot de passe.");

    return;
  }

  if (password.length < 6) {

    showToast(
      "Le mot de passe doit avoir au moins 6 caractères."
    );

    return;
  }

  try {

    if (authMode === "register") {

      const result =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      if (name) {

        await updateProfile(
          result.user,
          {
            displayName: name
          }
        );
      }

      showToast(
        "Compte FISSA créé avec succès 🎉"
      );

    } else {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      showToast(
        "Connexion réussie ✅"
      );
    }

    closeAuth();

    clearAuthForm();

  } catch (error) {

    console.error(error);

    showFirebaseError(error);
  }
};


window.logout = async function() {

  try {

    await signOut(auth);

    showToast(
      "Déconnexion réussie."
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Erreur de déconnexion."
    );
  }
};


function clearAuthForm() {

  const name =
    document.getElementById("authName");

  const email =
    document.getElementById("authEmail");

  const password =
    document.getElementById("authPassword");

  if (name) name.value = "";

  if (email) email.value = "";

  if (password) password.value = "";
}


// ============================================================
// FIREBASE ÉTAT UTILISATEUR
// ============================================================

onAuthStateChanged(
  auth,
  user => {

    updateInterface(user);

    renderNewsFeed();

  }
);


function updateInterface(user) {

  const loginButton =
    document.getElementById("loginButton");

  const userAvatar =
    document.getElementById("userAvatar");

  const profilePage =
    document.getElementById("profilePage");

  const profileName =
    document.getElementById("profileName");

  const profileEmail =
    document.getElementById("profileEmail");

  const profileUid =
    document.getElementById("profileUid");

  if (!loginButton || !userAvatar) {
    return;
  }

  if (user) {

    loginButton.classList.add("hidden");

    userAvatar.classList.remove("hidden");

    const letter = (
      user.displayName ||
      user.email ||
      "U"
    )
      .charAt(0)
      .toUpperCase();

    userAvatar.textContent =
      letter;

    if (profileName) {

      profileName.textContent =
        user.displayName ||
        "Utilisateur FISSA";
    }

    if (profileEmail) {

      profileEmail.textContent =
        user.email || "";
    }

    if (profileUid) {

      profileUid.textContent =
        "ID utilisateur : " +
        user.uid;
    }

  } else {

    loginButton.classList.remove("hidden");

    userAvatar.classList.add("hidden");

    if (profilePage) {

      profilePage.classList.add(
        "hidden"
      );
    }
  }
}


// ============================================================
// PROFIL
// ============================================================

window.openProfile = function() {

  const user =
    auth.currentUser;

  if (!user) {

    openAuth("login");

    return;
  }

  const profile =
    document.getElementById(
      "profilePage"
    );

  if (!profile) return;

  profile.classList.remove(
    "hidden"
  );

  profile.scrollIntoView({
    behavior: "smooth"
  });
};


window.backHome = function() {

  const profile =
    document.getElementById(
      "profilePage"
    );

  if (profile) {

    profile.classList.add(
      "hidden"
    );
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};


// ============================================================
// ERREURS FIREBASE
// ============================================================

function showFirebaseError(error) {

  let message =
    "Une erreur Firebase est survenue.";

  switch (error.code) {

    case "auth/email-already-in-use":

      message =
        "Cet e-mail possède déjà un compte.";

      break;

    case "auth/invalid-email":

      message =
        "Adresse e-mail invalide.";

      break;

    case "auth/weak-password":

      message =
        "Mot de passe trop faible.";

      break;

    case "auth/invalid-credential":

      message =
        "E-mail ou mot de passe incorrect.";

      break;

    case "auth/user-not-found":

      message =
        "Aucun compte avec cet e-mail.";

      break;

    case "auth/wrong-password":

      message =
        "Mot de passe incorrect.";

      break;

    case "auth/too-many-requests":

      message =
        "Trop de tentatives. Réessaie plus tard.";

      break;

    case "auth/network-request-failed":

      message =
        "Vérifie ta connexion Internet.";

      break;

    default:

      message =
        error.message ||
        "Erreur Firebase.";
  }

  showToast(message);
}


// ============================================================
// VOTE A / B
// ============================================================

window.vote = function(side, button) {

  likes[side]++;

  const count =
    document.getElementById(
      "likes" + side
    );

  if (count) {

    count.textContent =
      likes[side];
  }

  if (button) {

    button.classList.add(
      "active"
    );
  }

  updateScore();

  showToast(
    "Ton vote pour " +
    side +
    " a été enregistré ❤️"
  );
};


function updateScore() {

  const total =
    likes.A + likes.B;

  let percentA = 50;
  let percentB = 50;

  if (total > 0) {

    percentA =
      Math.round(
        likes.A / total * 100
      );

    percentB =
      100 - percentA;
  }

  const scoreA =
    document.getElementById(
      "scoreA"
    );

  const scoreB =
    document.getElementById(
      "scoreB"
    );

  const percentAElement =
    document.getElementById(
      "percentA"
    );

  const percentBElement =
    document.getElementById(
      "percentB"
    );

  if (scoreA) {

    scoreA.style.width =
      percentA + "%";
  }

  if (scoreB) {

    scoreB.style.width =
      percentB + "%";
  }

  if (percentAElement) {

    percentAElement.textContent =
      percentA + "%";
  }

  if (percentBElement) {

    percentBElement.textContent =
      percentB + "%";
  }
}


// ============================================================
// MÉDIA A / B
// ============================================================

window.loadMedia = function(
  event,
  side
) {

  const file =
    event.target.files[0];

  if (!file) return;

  const image =
    document.getElementById(
      "image" + side
    );

  const video =
    document.getElementById(
      "video" + side
    );

  const placeholder =
    document.getElementById(
      "placeholder" + side
    );

  const url =
    URL.createObjectURL(file);

  if (image) {

    image.style.display =
      "none";
  }

  if (video) {

    video.style.display =
      "none";

    video.pause();
  }

  if (
    file.type.startsWith("image/")
  ) {

    image.src =
      url;

    image.style.display =
      "block";

  } else if (
    file.type.startsWith("video/")
  ) {

    video.src =
      url;

    video.style.display =
      "block";

    createVideoControls(
      video,
      side
    );
  }

  if (placeholder) {

    placeholder.style.display =
      "none";
  }

  showToast(
    "Média " +
    side +
    " ajouté 🎬"
  );
};


// ============================================================
// CONTRÔLES VIDÉO PLAY / PAUSE / SON
// ============================================================

function createVideoControls(
  video,
  side
) {

  const parent =
    video.parentElement;

  if (!parent) return;

  let controls =
    parent.querySelector(
      ".fissa-video-controls"
    );

  if (controls) {

    controls.remove();
  }

  controls =
    document.createElement("div");

  controls.className =
    "fissa-video-controls";

  controls.innerHTML = `

    <button
      type="button"
      onclick="toggleVideo('${side}')"
    >
      ▶️
    </button>

    <button
      type="button"
      onclick="toggleMute('${side}')"
    >
      🔊
    </button>

  `;

  parent.appendChild(
    controls
  );
}


window.toggleVideo = function(side) {

  const video =
    document.getElementById(
      "video" + side
    );

  if (!video) return;

  if (video.paused) {

    video.play();

  } else {

    video.pause();
  }
};


window.toggleMute = function(side) {

  const video =
    document.getElementById(
      "video" + side
    );

  if (!video) return;

  video.muted =
    !video.muted;

  showToast(
    video.muted
      ? "Son coupé 🔇"
      : "Son activé 🔊"
  );
};


// ============================================================
// COMMENTAIRES
// ============================================================

window.commentFor = function(side) {

  currentCommentSide =
    side;

  const input =
    document.getElementById(
      "commentInput"
    );

  if (input) {

    input.placeholder =
      "Ton avis sur la création " +
      side +
      "...";

    input.focus();
  }

  scrollToComments();
};


window.addComment = function(event) {

  event.preventDefault();

  const input =
    document.getElementById(
      "commentInput"
    );

  if (!input) return;

  const text =
    input.value.trim();

  if (!text) return;

  const comment =
    document.createElement(
      "div"
    );

  comment.className =
    "comment";

  const strong =
    document.createElement(
      "strong"
    );

  strong.textContent =
    getCurrentUserName();

  comment.appendChild(
    strong
  );

  comment.appendChild(
    document.createTextNode(
      " [" +
      currentCommentSide +
      "] " +
      text
    )
  );

  const list =
    document.getElementById(
      "commentsList"
    );

  if (list) {

    list.prepend(
      comment
    );
  }

  input.value = "";

  showToast(
    "Commentaire publié 💬"
  );
};


// ============================================================
// PARTAGE
// ============================================================

window.sharePost = async function(
  side
) {

  const data = {

    title:
      "FISSA — Création " +
      side,

    text:
      "Regarde cette comparaison sur FISSA !",

    url:
      window.location.href
  };

  try {

    if (
      navigator.share
    ) {

      await navigator.share(
        data
      );

    } else if (
      navigator.clipboard
    ) {

      await navigator.clipboard.writeText(
        window.location.href
      );

      showToast(
        "Lien copié ! 🔗"
      );
    }

  } catch (error) {

    console.log(error);
  }
};


// ============================================================
// NAVIGATION
// ============================================================

window.scrollToComparison =
function() {

  const element =
    document.getElementById(
      "comparison"
    );

  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth"
  });
};


window.scrollToComments =
function() {

  const element =
    document.getElementById(
      "comments"
    );

  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth"
  });
};


window.scrollToNews =
function() {

  const element =
    document.getElementById(
      "newsFeed"
    );

  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth"
  });
};


// ============================================================
// MODAL PUBLICATION
// ============================================================

window.openModal =
function() {

  const modal =
    document.getElementById(
      "modal"
    );

  if (modal) {

    modal.classList.add(
      "show"
    );
  }
};


window.closeModal =
function() {

  const modal =
    document.getElementById(
      "modal"
    );

  if (modal) {

    modal.classList.remove(
      "show"
    );
  }
};


// ============================================================
// VRAIE PUBLICATION DANS LE FIL
// ============================================================

window.publishComparison =
function() {

  const title =
    document.getElementById(
      "titleInput"
    );

  const description =
    document.getElementById(
      "descriptionInput"
    );

  const titleValue =
    title
      ? title.value.trim()
      : "";

  const descriptionValue =
    description
      ? description.value.trim()
      : "";

  if (!titleValue) {

    showToast(
      "Ajoute un titre avant de publier."
    );

    return;
  }

  const user =
    auth.currentUser;

  const publication = {

    id:
      Date.now(),

    title:
      titleValue,

    description:
      descriptionValue,

    author:
      user
        ? (
            user.displayName ||
            user.email
          )
        : "Visiteur",

    avatar:
      user
        ? (
            user.displayName ||
            "U"
          ).charAt(0).toUpperCase()
        : "V",

    createdAt:
      new Date().toISOString(),

    likes: 0,

    comments: []
  };

  publications.unshift(
    publication
  );

  savePublications();

  renderNewsFeed();

  closeModal();

  if (title) {

    title.value = "";
  }

  if (description) {

    description.value = "";
  }

  showToast(
    "Publication ajoutée au fil d'actualité 🚀"
  );

  setTimeout(
    scrollToNews,
    300
  );
};


// ============================================================
// FIL D'ACTUALITÉ
// ============================================================

function renderNewsFeed() {

  const feed =
    document.getElementById(
      "newsFeed"
    );

  if (!feed) return;

  feed.innerHTML = "";

  // Publication FISSA AI toujours présente

  const aiPost = {

    id: "fissa-ai",

    title:
      "Bienvenue sur FISSA 🌍",

    description:
      "Je suis FISSA AI 🤖. Je participe à la communauté et je publie aussi des contenus, des découvertes et des comparaisons.",

    author:
      "FISSA AI",

    avatar:
      "AI",

    ai:
      true,

    likes:
      125
  };

  feed.appendChild(
    createPostCard(aiPost)
  );


  publications.forEach(
    post => {

      feed.appendChild(
        createPostCard(post)
      );

    }
  );
}


function createPostCard(post) {

  const article =
    document.createElement(
      "article"
    );

  article.className =
    "news-card";

  if (post.ai) {

    article.classList.add(
      "ai-post"
    );
  }

  article.innerHTML = `

    <div class="news-user">

      <div class="news-avatar">
        ${escapeHTML(post.avatar)}
      </div>

      <div>

        <strong>
          ${escapeHTML(post.author)}
        </strong>

        <small>
          ${post.ai
            ? "🤖 Membre FISSA AI"
            : formatDate(post.createdAt)}
        </small>

      </div>

    </div>

    <h3>
      ${escapeHTML(post.title)}
    </h3>

    <p>
      ${escapeHTML(post.description)}
    </p>

    <div class="news-actions">

      <button
        type="button"
        onclick="likeNews('${post.id}')"
      >
        ❤️
        <span>
          ${post.likes || 0}
        </span>
      </button>

      <button
        type="button"
        onclick="shareNews('${post.id}')"
      >
        ↗ Partager
      </button>

    </div>

  `;

  return article;
}


function formatDate(date) {

  if (!date) {

    return "Maintenant";
  }

  try {

    return new Date(
      date
    ).toLocaleString(
      "fr-FR",
      {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  } catch {

    return "Maintenant";
  }
}


// ============================================================
// LIKE FIL D'ACTUALITÉ
// ============================================================

window.likeNews = function(id) {

  if (id === "fissa-ai") {

    showToast(
      "Tu as aimé la publication de FISSA AI 🤖❤️"
    );

    return;
  }

  const post =
    publications.find(
      p => String(p.id) === String(id)
    );

  if (!post) return;

  post.likes =
    (post.likes || 0) + 1;

  savePublications();

  renderNewsFeed();

  showToast(
    "J'aime enregistré ❤️"
  );
};


// ============================================================
// PARTAGE PUBLICATION
// ============================================================

window.shareNews = async function(id) {

  const post =
    publications.find(
      p => String(p.id) === String(id)
    );

  const title =
    post
      ? post.title
      : "FISSA";

  const data = {

    title:
      "FISSA — " + title,

    text:
      "Découvre cette publication sur FISSA.",

    url:
      window.location.href
  };

  try {

    if (
      navigator.share
    ) {

      await navigator.share(
        data
      );

    } else {

      await navigator.clipboard.writeText(
        window.location.href
      );

      showToast(
        "Lien copié 🔗"
      );
    }

  } catch (error) {

    console.log(error);
  }
};


// ============================================================
// STORIES
// ============================================================

window.createStory =
function() {

  const user =
    auth.currentUser;

  if (!user) {

    openAuth("login");

    return;
  }

  const text =
    prompt(
      "Écris ta story FISSA :"
    );

  if (!text) return;

  const story = {

    id:
      Date.now(),

    author:
      user.displayName ||
      user.email ||
      "Utilisateur FISSA",

    text:
      text,

    createdAt:
      new Date().toISOString()
  };

  stories.unshift(
    story
  );

  saveStories();

  renderStories();

  showToast(
    "Story publiée 📖"
  );
};


function renderStories() {

  const container =
    document.getElementById(
      "stories"
    );

  if (!container) return;

  container.innerHTML = "";

  stories.forEach(
    story => {

      const item =
        document.createElement(
          "button"
        );

      item.type =
        "button";

      item.className =
        "story-item";

      item.innerHTML = `

        <div class="story-avatar">
          ${escapeHTML(
            story.author
              .charAt(0)
              .toUpperCase()
          )}
        </div>

        <span>
          ${escapeHTML(
            story.author
          )}
        </span>

      `;

      item.onclick =
        function() {

          alert(
            story.author +
            "\\n\\n" +
            story.text
          );
        };

      container.appendChild(
        item
      );
    }
  );
}


// ============================================================
// FERMETURE DES MODALS
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    renderNewsFeed();

    renderStories();

    updateScore();

    const modal =
      document.getElementById(
        "modal"
      );

    const authModal =
      document.getElementById(
        "authModal"
      );

    if (modal) {

      modal.addEventListener(
        "click",
        event => {

          if (
            event.target === modal
          ) {

            closeModal();
          }
        }
      );
    }

    if (authModal) {

      authModal.addEventListener(
        "click",
        event => {

          if (
            event.target === authModal
          ) {

            closeAuth();
          }
        }
      );
    }

    initMathCanvas();
  }
);


// ============================================================
// CANVAS MATHÉMATIQUE
// ============================================================

function initMathCanvas() {

  const canvas =
    document.getElementById(
      "mathCanvas"
    );

  if (!canvas) return;

  const ctx =
    canvas.getContext("2d");

  let particles = [];

  function resizeCanvas() {

    canvas.width =
      window.innerWidth;

    canvas.height =
      window.innerHeight;

    particles = [];

    for (
      let i = 0;
      i < 70;
      i++
    ) {

      particles.push({

        x:
          Math.random() *
          canvas.width,

        y:
          Math.random() *
          canvas.height,

        vx:
          (Math.random() - .5)
          * .35,

        vy:
          (Math.random() - .5)
          * .35,

        r:
          Math.random() * 2 + 1
      });
    }
  }


  function drawMath() {

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    particles.forEach(
      (p, i) => {

        p.x += p.vx;

        p.y += p.vy;

        if (
          p.x < 0 ||
          p.x > canvas.width
        ) {

          p.vx *= -1;
        }

        if (
          p.y < 0 ||
          p.y > canvas.height
        ) {

          p.vy *= -1;
        }

        ctx.beginPath();

        ctx.arc(
          p.x,
          p.y,
          p.r,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          "rgba(69,199,255,.65)";

        ctx.fill();

        for (
          let j = i + 1;
          j < particles.length;
          j++
        ) {

          const q =
            particles[j];

          const dx =
            p.x - q.x;

          const dy =
            p.y - q.y;

          const distance =
            Math.sqrt(
              dx * dx +
              dy * dy
            );

          if (
            distance < 130
          ) {

            ctx.beginPath();

            ctx.moveTo(
              p.x,
              p.y
            );

            ctx.lineTo(
              q.x,
              q.y
            );

            ctx.strokeStyle =
              "rgba(69,199,255," +
              (
                .12 -
                distance / 1300
              ) +
              ")";

            ctx.stroke();
          }
        }
      }
    );

    requestAnimationFrame(
      drawMath
    );
  }

  window.addEventListener(
    "resize",
    resizeCanvas
  );

  resizeCanvas();

  drawMath();
}
