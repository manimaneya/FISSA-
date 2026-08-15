// ======================================================
// FISSA — SCRIPT.JS
// Réseau social de comparaison A / B
// Firestore + Auth + Fil d'actualité + Stories
// ======================================================

import {
  auth,
  db,

  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,

  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment
} from "./firebase.js";


// ======================================================
// VARIABLES
// ======================================================

let authMode = "login";

let toastTimer = null;

let currentUser = null;

let unsubscribeFeed = null;

let selectedSide = "A";

let likes = {
  A: 0,
  B: 0
};


// ======================================================
// INITIALISATION
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

  createProfessionalInterface();

  initializeMathBackground();

  loadFeed();

  createFissaAI();

});


// ======================================================
// AUTHENTIFICATION
// ======================================================

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

    if (title)
      title.textContent =
        "Créer un compte FISSA";

    if (name)
      name.classList.remove("hidden");

    if (submit)
      submit.textContent =
        "Créer mon compte";

    if (switchButton)
      switchButton.textContent =
        "J'ai déjà un compte — Me connecter";

  } else {

    if (title)
      title.textContent =
        "Connexion FISSA";

    if (name)
      name.classList.add("hidden");

    if (submit)
      submit.textContent =
        "Se connecter";

    if (switchButton)
      switchButton.textContent =
        "Créer un nouveau compte";
  }
};


// ======================================================
// FERMER AUTH
// ======================================================

window.closeAuth = function() {

  const modal =
    document.getElementById("authModal");

  if (modal)
    modal.classList.remove("show");
};


// ======================================================
// CHANGER AUTH
// ======================================================

window.switchAuth = function() {

  if (authMode === "login")
    openAuth("register");
  else
    openAuth("login");

};


// ======================================================
// AUTH SUBMIT
// ======================================================

window.submitAuth = async function() {

  const nameInput =
    document.getElementById("authName");

  const emailInput =
    document.getElementById("authEmail");

  const passwordInput =
    document.getElementById("authPassword");

  const name =
    nameInput?.value.trim() || "";

  const email =
    emailInput?.value.trim() || "";

  const password =
    passwordInput?.value || "";

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

      await createUserDocument(
        result.user,
        name
      );

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

    console.error(
      "Firebase Auth:",
      error
    );

    showFirebaseError(error);
  }
};


// ======================================================
// DOCUMENT UTILISATEUR
// ======================================================

async function createUserDocument(
  user,
  name = ""
) {

  try {

    const userRef =
      doc(
        db,
        "users",
        user.uid
      );

    await setDoc(
      userRef,
      {
        uid: user.uid,

        name:
          name ||
          user.displayName ||
          "Utilisateur FISSA",

        email:
          user.email || "",

        photoURL:
          user.photoURL || "",

        createdAt:
          serverTimestamp(),

        followers: 0,

        following: 0,

        posts: 0
      },
      {
        merge: true
      }
    );

  } catch (error) {

    console.error(
      "Création utilisateur:",
      error
    );
  }
}


// ======================================================
// ÉTAT UTILISATEUR
// ======================================================

onAuthStateChanged(
  auth,
  async (user) => {

    currentUser = user;

    updateInterface(user);

    if (user) {

      await createUserDocument(
        user,
        user.displayName
      );
    }

  }
);


// ======================================================
// INTERFACE COMPTE
// ======================================================

function updateInterface(user) {

  const loginButton =
    document.getElementById(
      "loginButton"
    );

  const userAvatar =
    document.getElementById(
      "userAvatar"
    );

  const profileName =
    document.getElementById(
      "profileName"
    );

  const profileEmail =
    document.getElementById(
      "profileEmail"
    );

  const profileUid =
    document.getElementById(
      "profileUid"
    );

  if (user) {

    loginButton?.classList.add(
      "hidden"
    );

    userAvatar?.classList.remove(
      "hidden"
    );

    const letter =
      (
        user.displayName ||
        user.email ||
        "U"
      )
      .charAt(0)
      .toUpperCase();

    if (userAvatar)
      userAvatar.textContent =
        letter;

    if (profileName)
      profileName.textContent =
        user.displayName ||
        "Utilisateur FISSA";

    if (profileEmail)
      profileEmail.textContent =
        user.email || "";

    if (profileUid)
      profileUid.textContent =
        "ID utilisateur : " +
        user.uid;

  } else {

    loginButton?.classList.remove(
      "hidden"
    );

    userAvatar?.classList.add(
      "hidden"
    );
  }

}


// ======================================================
// PROFIL
// ======================================================

window.openProfile = function() {

  if (!currentUser) {

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


// ======================================================
// DÉCONNEXION
// ======================================================

window.logout = async function() {

  try {

    await signOut(auth);

    showToast(
      "Déconnexion réussie 👋"
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Erreur lors de la déconnexion."
    );
  }

};


// ======================================================
// NETTOYER AUTH
// ======================================================

function clearAuthForm() {

  const fields = [
    "authName",
    "authEmail",
    "authPassword"
  ];

  fields.forEach(id => {

    const element =
      document.getElementById(id);

    if (element)
      element.value = "";

  });

}


// ======================================================
// ERREURS FIREBASE
// ======================================================

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
        message;
  }

  showToast(message);
}


// ======================================================
// PUBLICATION
// ======================================================

window.publishComparison =
async function() {

  const titleInput =
    document.getElementById(
      "titleInput"
    );

  const descriptionInput =
    document.getElementById(
      "descriptionInput"
    );

  const title =
    titleInput?.value.trim() || "";

  const description =
    descriptionInput?.value.trim() || "";

  if (!title) {

    showToast(
      "Ajoute un titre avant de publier."
    );

    return;
  }

  if (!currentUser) {

    closeModal();

    openAuth("login");

    showToast(
      "Connecte-toi pour publier."
    );

    return;
  }

  try {

    const post = {

      title,

      description,

      authorId:
        currentUser.uid,

      authorName:
        currentUser.displayName ||
        currentUser.email ||
        "Utilisateur FISSA",

      authorEmail:
        currentUser.email || "",

      authorPhoto:
        currentUser.photoURL || "",

      sideA: {

        title:
          "Création A",

        likes: 0
      },

      sideB: {

        title:
          "Création B",

        likes: 0
      },

      totalLikes: 0,

      comments: 0,

      shares: 0,

      category:
        "Comparaison",

      createdAt:
        serverTimestamp()
    };


    await addDoc(
      collection(
        db,
        "posts"
      ),
      post
    );


    // Mise à jour du nombre de publications
    try {

      await updateDoc(
        doc(
          db,
          "users",
          currentUser.uid
        ),
        {
          posts:
            increment(1)
        }
      );

    } catch (e) {

      console.log(
        "Compteur utilisateur:",
        e
      );
    }


    if (titleInput)
      titleInput.value = "";

    if (descriptionInput)
      descriptionInput.value = "";

    closeModal();

    showToast(
      "Publication envoyée dans le fil d'actualité 🚀"
    );

    scrollToFeed();

  } catch (error) {

    console.error(
      "Publication:",
      error
    );

    showToast(
      "Impossible de publier. Vérifie Firestore."
    );
  }
};


// ======================================================
// FIL D'ACTUALITÉ
// ======================================================

function loadFeed() {

  const feed =
    document.getElementById(
      "newsFeed"
    );

  if (!feed) return;


  try {

    const postsQuery =
      query(
        collection(
          db,
          "posts"
        ),
        orderBy(
          "createdAt",
          "desc"
        ),
        limit(50)
      );


    unsubscribeFeed =
      onSnapshot(
        postsQuery,

        snapshot => {

          feed.innerHTML = "";

          if (snapshot.empty) {

            feed.innerHTML =
              createEmptyFeed();

            return;
          }


          snapshot.forEach(
            postSnapshot => {

              const post =
                postSnapshot.data();

              const id =
                postSnapshot.id;

              feed.insertAdjacentHTML(
                "beforeend",
                createPostCard(
                  post,
                  id
                )
              );

            }
          );

        },

        error => {

          console.error(
            "Fil:",
            error
          );

          feed.innerHTML =
            `
            <div class="feed-error">
              ⚠️ Impossible de charger
              le fil d'actualité.
            </div>
            `;
        }
      );

  } catch (error) {

    console.error(error);
  }

}


// ======================================================
// CARTE PUBLICATION
// ======================================================

function createPostCard(
  post,
  id
) {

  const author =
    escapeHTML(
      post.authorName ||
      "Utilisateur FISSA"
    );

  const title =
    escapeHTML(
      post.title ||
      "Nouvelle comparaison"
    );

  const description =
    escapeHTML(
      post.description ||
      ""
    );

  const date =
    formatDate(
      post.createdAt
    );

  const likesA =
    post.sideA?.likes || 0;

  const likesB =
    post.sideB?.likes || 0;


  return `

    <article
      class="fissa-post"
      data-post-id="${id}"
    >

      <div class="post-head">

        <div class="post-avatar">

          ${author.charAt(0).toUpperCase()}

        </div>

        <div class="post-user">

          <strong>
            ${author}
          </strong>

          <small>
            ${date}
          </small>

        </div>

        <span class="verified">
          ✓
        </span>

      </div>


      <div class="post-content">

        <h3>
          ${title}
        </h3>

        <p>
          ${description}
        </p>


        <div class="vertical-comparison">


          <!-- A -->

          <div class="vertical-side side-a">

            <div class="side-label">
              <span>A</span>
              CRÉATION A
            </div>

            <div class="post-media">

              <div class="media-empty">

                <span>
                  A
                </span>

                <small>
                  Média A
                </small>

              </div>

            </div>

            <button
              class="play-button"
              type="button"
              onclick="playPostMedia(this,'A')"
            >
              ▶
            </button>

            <button
              class="sound-button"
              type="button"
              onclick="togglePostSound(this)"
            >
              🔊
            </button>

            <button
              class="post-vote vote-a"
              type="button"
              onclick="votePost('${id}','A',this)"
            >
              ❤️ A
              <b>${likesA}</b>
            </button>

          </div>


          <!-- VS -->

          <div class="vertical-vs">
            VS
          </div>


          <!-- B -->

          <div class="vertical-side side-b">

            <div class="side-label">
              <span>B</span>
              CRÉATION B
            </div>

            <div class="post-media">

              <div class="media-empty">

                <span>
                  B
                </span>

                <small>
                  Média B
                </small>

              </div>

            </div>

            <button
              class="play-button"
              type="button"
              onclick="playPostMedia(this,'B')"
            >
              ▶
            </button>

            <button
              class="sound-button"
              type="button"
              onclick="togglePostSound(this)"
            >
              🔊
            </button>

            <button
              class="post-vote vote-b"
              type="button"
              onclick="votePost('${id}','B',this)"
            >
              ❤️ B
              <b>${likesB}</b>
            </button>

          </div>

        </div>


        <!-- SCORE -->

        <div class="post-score">

          <span>
            A
          </span>

          <div class="mini-score">

            <div
              class="mini-score-a"
              style="width:50%"
            ></div>

            <div
              class="mini-score-b"
              style="width:50%"
            ></div>

          </div>

          <span>
            B
          </span>

        </div>


        <!-- ACTIONS -->

        <div class="post-actions">

          <button
            type="button"
            onclick="openPostComments('${id}')"
          >
            💬 Commenter
          </button>

          <button
            type="button"
            onclick="sharePost('${id}')"
          >
            ↗ Partager
          </button>

          <button
            type="button"
            onclick="openPostMenu('${id}')"
          >
            ⋮
          </button>

        </div>


        <div
          id="comments-${id}"
          class="post-comments hidden"
        >

          <input
            id="comment-${id}"
            type="text"
            placeholder="Écrire un commentaire..."
            maxlength="250"
          >

          <button
            type="button"
            onclick="sendPostComment('${id}')"
          >
            Envoyer
          </button>

          <div
            id="comment-list-${id}"
          ></div>

        </div>

      </div>

    </article>

  `;

}


// ======================================================
// VOTE PUBLICATION
// ======================================================

window.votePost =
async function(
  postId,
  side,
  button
) {

  if (!currentUser) {

    openAuth("login");

    showToast(
      "Connecte-toi pour voter."
    );

    return;
  }


  try {

    const postRef =
      doc(
        db,
        "posts",
        postId
      );


    const field =
      side === "A"
        ? "sideA.likes"
        : "sideB.likes";


    await updateDoc(
      postRef,
      {
        [field]:
          increment(1),

        totalLikes:
          increment(1)
      }
    );


    button.classList.add(
      "active"
    );


    showToast(
      "Vote pour " +
      side +
      " enregistré ❤️"
    );

  } catch (error) {

    console.error(
      "Vote:",
      error
    );

    showToast(
      "Erreur lors du vote."
    );
  }

};


// ======================================================
// COMMENTAIRES PUBLICATION
// ======================================================

window.openPostComments =
function(postId) {

  const box =
    document.getElementById(
      "comments-" +
      postId
    );

  if (!box) return;

  box.classList.toggle(
    "hidden"
  );

  if (!box.classList.contains("hidden")) {

    document
      .getElementById(
        "comment-" +
        postId
      )
      ?.focus();
  }

};


// ======================================================
// ENVOYER COMMENTAIRE
// ======================================================

window.sendPostComment =
async function(postId) {

  if (!currentUser) {

    openAuth("login");

    return;
  }


  const input =
    document.getElementById(
      "comment-" +
      postId
    );

  if (!input) return;


  const text =
    input.value.trim();


  if (!text) return;


  try {

    await addDoc(
      collection(
        db,
        "posts",
        postId,
        "comments"
      ),
      {

        text,

        authorId:
          currentUser.uid,

        authorName:
          currentUser.displayName ||
          currentUser.email ||
          "Utilisateur",

        createdAt:
          serverTimestamp()

      }
    );


    await updateDoc(
      doc(
        db,
        "posts",
        postId
      ),
      {
        comments:
          increment(1)
      }
    );


    input.value = "";

    showToast(
      "Commentaire publié 💬"
    );

    loadPostComments(
      postId
    );

  } catch (error) {

    console.error(
      error
    );

    showToast(
      "Impossible de publier le commentaire."
    );
  }

};


// ======================================================
// CHARGER COMMENTAIRES
// ======================================================

async function loadPostComments(
  postId
) {

  const container =
    document.getElementById(
      "comment-list-" +
      postId
    );

  if (!container) return;


  try {

    const commentsQuery =
      query(
        collection(
          db,
          "posts",
          postId,
          "comments"
        ),
        orderBy(
          "createdAt",
          "desc"
        ),
        limit(30)
      );


    const snapshot =
      await getDocs(
        commentsQuery
      );


    container.innerHTML = "";


    snapshot.forEach(
      item => {

        const data =
          item.data();

        const name =
          escapeHTML(
            data.authorName ||
            "Utilisateur"
          );

        const text =
          escapeHTML(
            data.text ||
            ""
          );

        container.insertAdjacentHTML(
          "beforeend",

          `
          <div class="post-comment-item">

            <strong>
              ${name}
            </strong>

            <span>
              ${text}
            </span>

          </div>
          `
        );

      }
    );

  } catch (error) {

    console.error(
      "Commentaires:",
      error
    );
  }

}


// ======================================================
// PARTAGE
// ======================================================

window.sharePost =
async function(postId) {

  const url =
    window.location.origin +
    window.location.pathname +
    "?post=" +
    encodeURIComponent(
      postId
    );


  try {

    if (navigator.share) {

      await navigator.share({

        title:
          "FISSA",

        text:
          "Regarde cette comparaison sur FISSA.",

        url

      });

    } else {

      await navigator.clipboard.writeText(
        url
      );

      showToast(
        "Lien de publication copié 🔗"
      );
    }

  } catch (error) {

    console.log(error);
  }

};


// ======================================================
// MENU PUBLICATION
// ======================================================

window.openPostMenu =
function(postId) {

  showToast(
    "Publication FISSA #" +
    postId.substring(0, 6)
  );

};


// ======================================================
// PLAY
// ======================================================

window.playPostMedia =
function(button, side) {

  const card =
    button.closest(
      ".vertical-side"
    );

  if (!card) return;


  const media =
    card.querySelector(
      ".post-media"
    );


  if (!media) return;


  media.classList.toggle(
    "playing"
  );


  if (
    media.classList.contains(
      "playing"
    )
  ) {

    button.textContent =
      "❚❚";

    showToast(
      "Lecture " +
      side +
      " ▶️"
    );

  } else {

    button.textContent =
      "▶";
  }

};


// ======================================================
// SON
// ======================================================

window.togglePostSound =
function(button) {

  const card =
    button.closest(
      ".vertical-side"
    );

  if (!card) return;


  const media =
    card.querySelector(
      ".post-media"
    );


  const muted =
    media?.classList.toggle(
      "muted"
    );


  button.textContent =
    muted
      ? "🔇"
      : "🔊";

};


// ======================================================
// STORIES
// ======================================================

window.createStory =
async function() {

  if (!currentUser) {

    openAuth("login");

    return;
  }


  const text =
    prompt(
      "Écris ta story FISSA :"
    );


  if (!text) return;


  try {

    await addDoc(
      collection(
        db,
        "stories"
      ),
      {

        text:

          text.trim(),

        authorId:
          currentUser.uid,

        authorName:
          currentUser.displayName ||
          currentUser.email ||
          "Utilisateur",

        createdAt:
          serverTimestamp(),

        expiresAt:
          Date.now() +
          24 * 60 * 60 * 1000
      }
    );


    showToast(
      "Story publiée pour 24h 📖"
    );

    loadStories();

  } catch (error) {

    console.error(
      error
    );

    showToast(
      "Impossible de publier la story."
    );
  }

};


// ======================================================
// CHARGER STORIES
// ======================================================

async function loadStories() {

  const container =
    document.getElementById(
      "storiesContainer"
    );

  if (!container) return;


  try {

    const storiesQuery =
      query(
        collection(
          db,
          "stories"
        ),
        orderBy(
          "createdAt",
          "desc"
        ),
        limit(30)
      );


    const snapshot =
      await getDocs(
        storiesQuery
      );


    container.innerHTML = `

      <button
        class="story-add"
        type="button"
        onclick="createStory()"
      >
        ＋
        <small>
          Ma story
        </small>
      </button>

    `;


    snapshot.forEach(
      item => {

        const story =
          item.data();


        if (
          story.expiresAt &&
          story.expiresAt <
          Date.now()
        ) {
          return;
        }


        const name =
          escapeHTML(
            story.authorName ||
            "FISSA"
          );


        const text =
          escapeHTML(
            story.text ||
            ""
          );


        container.insertAdjacentHTML(
          "beforeend",

          `
          <button
            class="story"
            type="button"
            onclick="viewStory(
              '${item.id}'
            )"
          >

            <span class="story-avatar">
              ${name
                .charAt(0)
                .toUpperCase()}
            </span>

            <strong>
              ${name}
            </strong>

          </button>
          `
        );

      }
    );

  } catch (error) {

    console.error(
      "Stories:",
      error
    );
  }

}


// ======================================================
// VOIR STORY
// ======================================================

window.viewStory =
async function(storyId) {

  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          "stories",
          storyId
        )
      );


    if (!snapshot.exists()) {

      showToast(
        "Story introuvable."
      );

      return;
    }


    const data =
      snapshot.data();


    alert(
      (
        data.authorName ||
        "FISSA"
      ) +
      "\n\n" +
      (
        data.text ||
        ""
      )
    );

  } catch (error) {

    console.error(
      error
    );
  }

};


// ======================================================
// FISSA AI
// ======================================================

async function createFissaAI() {

  const aiId =
    "fissa-ai-official";


  try {

    const aiRef =
      doc(
        db,
        "users",
        aiId
      );


    await setDoc(
      aiRef,
      {

        uid:
          aiId,

        name:
          "FISSA AI",

        email:
          "ai@fissa.app",

        photoURL:
          "",

        verified:
          true,

        type:
          "ai",

        bio:
          "Assistant officiel de la communauté FISSA.",

        updatedAt:
          serverTimestamp()

      },
      {
        merge: true
      }
    );


  } catch (error) {

    console.error(
      "FISSA AI:",
      error
    );
  }

}


// ======================================================
// PUBLICATION FISSA AI
// ======================================================

window.publishFissaAI =
async function(
  title,
  description
) {

  try {

    await addDoc(
      collection(
        db,
        "posts"
      ),
      {

        title,

        description,

        authorId:
          "fissa-ai-official",

        authorName:
          "FISSA AI",

        authorPhoto:
          "",

        verified:
          true,

        type:
          "ai",

        sideA: {
          title:
            "Création A",
          likes: 0
        },

        sideB: {
          title:
            "Création B",
          likes: 0
        },

        totalLikes:
          0,

        comments:
          0,

        shares:
          0,

        category:
          "FISSA AI",

        createdAt:
          serverTimestamp()
      }
    );


    showToast(
      "FISSA AI a publié 🤖🚀"
    );

  } catch (error) {

    console.error(
      error
    );

    showToast(
      "Erreur publication FISSA AI."
    );
  }

};


// ======================================================
// OUVRIR PUBLICATION
// ======================================================

function scrollToFeed() {

  const feed =
    document.getElementById(
      "newsFeed"
    );

  if (!feed) return;

  feed.scrollIntoView({
    behavior:
      "smooth"
  });

}


window.scrollToFeed =
scrollToFeed;


// ======================================================
// NAVIGATION COMPARAISON
// ======================================================

window.scrollToComparison =
function() {

  const element =
    document.getElementById(
      "comparison"
    );

  if (element) {

    element.scrollIntoView({
      behavior:
        "smooth"
    });

  } else {

    scrollToFeed();

  }

};


// ======================================================
// COMMENTAIRES ANCIEN SYSTÈME
// ======================================================

window.addComment =
function(event) {

  event.preventDefault();


  const input =
    document.getElementById(
      "commentInput"
    );


  if (!input) return;


  const text =
    input.value.trim();


  if (!text) return;


  const list =
    document.getElementById(
      "commentsList"
    );


  if (!list) return;


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
    currentUser
      ? (
          currentUser.displayName ||
          currentUser.email
        )
      : "Visiteur";


  comment.appendChild(
    strong
  );


  comment.appendChild(
    document.createTextNode(
      " " + text
    )
  );


  list.prepend(
    comment
  );


  input.value = "";

  showToast(
    "Commentaire publié 💬"
  );

};


// ======================================================
// COMMENTER A / B
// ======================================================

window.commentFor =
function(side) {

  const input =
    document.getElementById(
      "commentInput"
    );

  if (!input) return;


  input.placeholder =
    "Ton avis sur la création " +
    side +
    "...";


  input.focus();


  const comments =
    document.getElementById(
      "comments"
    );

  comments?.scrollIntoView({
    behavior:
      "smooth"
  });

};


// ======================================================
// ANCIEN SYSTÈME VOTE
// ======================================================

window.vote =
function(side, button) {

  likes[side]++;


  const counter =
    document.getElementById(
      "likes" +
      side
    );


  if (counter)
    counter.textContent =
      likes[side];


  button?.classList.add(
    "active"
  );


  updateScore();


  showToast(
    "Ton vote pour " +
    side +
    " ❤️"
  );

};


// ======================================================
// SCORE A/B
// ======================================================

function updateScore() {

  const total =
    likes.A +
    likes.B;


  let percentA =
    50;

  let percentB =
    50;


  if (total > 0) {

    percentA =
      Math.round(
        likes.A /
        total *
        100
      );

    percentB =
      100 -
      percentA;
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


  if (scoreA)
    scoreA.style.width =
      percentA + "%";


  if (scoreB)
    scoreB.style.width =
      percentB + "%";


  if (percentAElement)
    percentAElement.textContent =
      percentA + "%";


  if (percentBElement)
    percentBElement.textContent =
      percentB + "%";

}


// ======================================================
// CHARGER MÉDIA A/B
// ======================================================

window.loadMedia =
function(
  event,
  side
) {

  const file =
    event.target.files?.[0];


  if (!file) return;


  const image =
    document.getElementById(
      "image" +
      side
    );


  const video =
    document.getElementById(
      "video" +
      side
    );


  const placeholder =
    document.getElementById(
      "placeholder" +
      side
    );


  const url =
    URL.createObjectURL(
      file
    );


  if (image)
    image.style.display =
      "none";


  if (video)
    video.style.display =
      "none";


  if (
    file.type.startsWith(
      "image/"
    )
  ) {

    if (image) {

      image.src =
        url;

      image.style.display =
        "block";
    }

  }


  else if (
    file.type.startsWith(
      "video/"
    )
  ) {

    if (video) {

      video.src =
        url;

      video.style.display =
        "block";

      video.controls =
        true;

      video.playsInline =
        true;
    }

  }


  if (placeholder)
    placeholder.style.display =
      "none";


  showToast(
    "Média " +
    side +
    " ajoutée 📁"
  );

};


// ======================================================
// MODAL PUBLICATION
// ======================================================

window.openModal =
function() {

  const modal =
    document.getElementById(
      "modal"
    );


  if (!currentUser) {

    openAuth("login");

    showToast(
      "Connecte-toi pour publier."
    );

    return;
  }


  modal?.classList.add(
    "show"
  );

};


window.closeModal =
function() {

  document
    .getElementById(
      "modal"
    )
    ?.classList.remove(
      "show"
    );

};


// ======================================================
// TOAST
// ======================================================

window.showToast =
function(message) {

  const toast =
    document.getElementById(
      "toast"
    );


  if (!toast) {

    console.log(
      message
    );

    return;
  }


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2800
    );

};


// ======================================================
// FILTRE ACTUALITÉ
// ======================================================

window.filterFeed =
function(category) {

  const posts =
    document.querySelectorAll(
      ".fissa-post"
    );


  posts.forEach(
    post => {

      if (
        category === "all"
      ) {

        post.style.display =
          "";

      }

    }
  );


  showToast(
    "Filtre : " +
    category
  );

};


// ======================================================
// INTERFACE PROFESSIONNELLE
// ======================================================

function createProfessionalInterface() {

  const main =
    document.querySelector(
      "main"
    );


  if (!main) return;


  // STORIES

  if (
    !document.getElementById(
      "storiesContainer"
    )
  ) {

    const stories =
      document.createElement(
        "section"
      );

    stories.className =
      "stories-section";


    stories.innerHTML = `

      <div class="section-title">

        <h2>
          🔥 Stories FISSA
        </h2>

        <button
          type="button"
          onclick="createStory()"
        >
          ＋ Ajouter
        </button>

      </div>

      <div
        id="storiesContainer"
        class="stories-container"
      ></div>

    `;


    main.prepend(
      stories
    );

  }


  // FIL ACTUALITÉ

  if (
    !document.getElementById(
      "newsFeed"
    )
  ) {

    const feed =
      document.createElement(
        "section"
      );

    feed.className =
      "news-section";

    feed.id =
      "newsFeedSection";


    feed.innerHTML = `

      <div class="section-title">

        <div>

          <span class="section-badge">
            ● LIVE
          </span>

          <h2>
            📰 Fil d'actualité
          </h2>

        </div>

        <button
          type="button"
          onclick="scrollToFeed()"
        >
          Actualiser
        </button>

      </div>


      <div
        class="feed-filters"
      >

        <button
          class="active"
          onclick="filterFeed('all')"
        >
          🌍 Tout
        </button>

        <button
          onclick="filterFeed('video')"
        >
          🎬 Vidéos
        </button>

        <button
          onclick="filterFeed('music')"
        >
          🎵 Musique
        </button>

        <button
          onclick="filterFeed('comedy')"
        >
          😂 Comedy
        </button>

        <button
          onclick="filterFeed('science')"
        >
          🧪 Science
        </button>

      </div>


      <div
        id="newsFeed"
        class="news-feed"
      >

        <div class="feed-loading">
          Chargement du fil...
        </div>

      </div>

    `;


    main.insertBefore(
      feed,
      main.querySelector(
        ".comparison"
      ) ||
      main.firstChild
    );

  }


  loadStories();

}


// ======================================================
// DATE
// ======================================================

function formatDate(
  timestamp
) {

  if (
    !timestamp ||
    !timestamp.toDate
  ) {

    return "À l'instant";
  }


  const date =
    timestamp.toDate();


  const now =
    new Date();


  const diff =
    Math.floor(
      (
        now -
        date
      ) /
      1000
    );


  if (diff < 60)
    return "À l'instant";


  if (diff < 3600)
    return (
      Math.floor(
        diff / 60
      ) +
      " min"
    );


  if (diff < 86400)
    return (
      Math.floor(
        diff / 3600
      ) +
      " h"
    );


  return date.toLocaleDateString(
    "fr-FR",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric"
    }
  );

}


// ======================================================
// PROTECTION HTML
// ======================================================

function escapeHTML(
  value
) {

  return String(
    value
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


// ======================================================
// FIL VIDE
// ======================================================

function createEmptyFeed() {

  return `

    <div class="empty-feed">

      <div>
        📰
      </div>

      <h3>
        Le fil FISSA est prêt
      </h3>

      <p>
        Sois le premier à publier
        une comparaison.
      </p>

      <button
        type="button"
        onclick="openModal()"
      >
        ＋ Publier
      </button>

    </div>

  `;

}


// ======================================================
// CANVAS MATHÉMATIQUE
// ======================================================

function initializeMathBackground() {

  const canvas =
    document.getElementById(
      "mathCanvas"
    );


  if (!canvas) return;


  const ctx =
    canvas.getContext(
      "2d"
    );


  let particles =
    [];


  function resize() {

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
          (
            Math.random() -
            .5
          ) * .35,

        vy:
          (
            Math.random() -
            .5
          ) * .35,

        r:
          Math.random() *
          2 +
          1
      });

    }

  }


  function animate() {

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    particles.forEach(
      (p, i) => {

        p.x +=
          p.vx;

        p.y +=
          p.vy;


        if (
          p.x < 0 ||
          p.x >
          canvas.width
        ) {

          p.vx *=
            -1;

        }


        if (
          p.y < 0 ||
          p.y >
          canvas.height
        ) {

          p.vy *=
            -1;

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
          let j =
            i + 1;

          j <
            particles.length;

          j++
        ) {

          const q =
            particles[j];


          const dx =
            p.x -
            q.x;


          const dy =
            p.y -
            q.y;


          const distance =
            Math.sqrt(
              dx * dx +
              dy * dy
            );


          if (
            distance <
            130
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
                distance /
                1300
              ) +
              ")";

            ctx.stroke();

          }

        }

      }
    );


    requestAnimationFrame(
      animate
    );

  }


  resize();

  window.addEventListener(
    "resize",
    resize
  );

  animate();

}


// ======================================================
// FERMETURE MODALS
// ======================================================

document.addEventListener(
  "click",
  event => {

    const modal =
      document.getElementById(
        "modal"
      );

    const authModal =
      document.getElementById(
        "authModal"
      );


    if (
      modal &&
      event.target === modal
    ) {

      closeModal();

    }


    if (
      authModal &&
      event.target === authModal
    ) {

      closeAuth();

    }

  }
);


// ======================================================
// ESC POUR FERMER
// ======================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      closeModal();

      closeAuth();

    }

  }
);
