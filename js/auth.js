/* ==========================================================================
   PIXEL DEFENDER — FIREBASE & USER AUTHENTICATION SYSTEM
   ========================================================================== */

class AuthManager {
  constructor() {
    this.user = null;
    this.isGuest = true;
    this.guestData = { name: 'Guest Player', email: '' };

    // Firebase fallback config (works out-of-the-box or uses local storage if offline)
    this.firebaseConfig = {
      apiKey: "AIzaSyPixelDefenderMockKeyForLocalStorageFallback",
      authDomain: "pixel-defender-game.firebaseapp.com",
      projectId: "pixel-defender-game",
      storageBucket: "pixel-defender-game.appspot.com",
      messagingSenderId: "109876543210",
      appId: "1:109876543210:web:abcdef123456789"
    };

    this.initFirebase();
  }

  initFirebase() {
    try {
      if (window.firebase && !firebase.apps.length) {
        firebase.initializeApp(this.firebaseConfig);
        this.auth = firebase.auth();
        this.db = firebase.database();

        this.auth.onAuthStateChanged(user => {
          if (user) {
            this.user = user;
            this.isGuest = false;
            this.updateUserUI(user.displayName || user.email.split('@')[0], user.email);
          } else {
            this.user = null;
            this.isGuest = true;
            this.updateUserUI('Guest Player', '');
          }
        });
      } else {
        this.loadLocalUser();
      }
    } catch (e) {
      console.warn("Firebase initialized in LocalStorage Fallback mode.", e);
      this.loadLocalUser();
    }
  }

  loadLocalUser() {
    const savedUser = localStorage.getItem('pixel_defender_user');
    if (savedUser) {
      try {
        const uData = JSON.parse(savedUser);
        this.user = uData;
        this.isGuest = false;
        this.updateUserUI(uData.name, uData.email);
        return;
      } catch (err) {}
    }
    this.isGuest = true;
    this.updateUserUI('Guest Player', '');
  }

  playAsGuest() {
    this.isGuest = true;
    this.user = null;
    this.updateUserUI('Guest Player', '');
    return true;
  }

  async login(email, password) {
    if (this.auth) {
      try {
        const res = await this.auth.signInWithEmailAndPassword(email, password);
        this.user = res.user;
        this.isGuest = false;
        return { success: true, name: this.user.displayName || email };
      } catch (err) {
        return this.localLogin(email, password);
      }
    }
    return this.localLogin(email, password);
  }

  localLogin(email, password) {
    const accounts = JSON.parse(localStorage.getItem('pixel_defender_accounts') || '{}');
    if (accounts[email] && accounts[email].password === password) {
      this.user = accounts[email];
      this.isGuest = false;
      localStorage.setItem('pixel_defender_user', JSON.stringify(this.user));
      this.updateUserUI(this.user.name, this.user.email);
      return { success: true, name: this.user.name };
    }
    return { success: false, message: 'Invalid credentials. Register a new account.' };
  }

  async register(name, email, password) {
    if (this.auth) {
      try {
        const res = await this.auth.createUserWithEmailAndPassword(email, password);
        await res.user.updateProfile({ displayName: name });
        this.user = res.user;
        this.isGuest = false;

        if (this.db) {
          this.db.ref('users/' + res.user.uid).set({
            name: name,
            email: email,
            createdAt: new Date().toISOString()
          });
        }
        return { success: true, name: name };
      } catch (err) {
        return this.localRegister(name, email, password);
      }
    }
    return this.localRegister(name, email, password);
  }

  localRegister(name, email, password) {
    const accounts = JSON.parse(localStorage.getItem('pixel_defender_accounts') || '{}');
    accounts[email] = { name, email, password };
    localStorage.setItem('pixel_defender_accounts', JSON.stringify(accounts));
    this.user = { name, email, password };
    this.isGuest = false;
    localStorage.setItem('pixel_defender_user', JSON.stringify(this.user));
    this.updateUserUI(name, email);
    return { success: true, name: name };
  }

  saveHighScore(score) {
    if (this.user && this.auth && this.db) {
      try {
        this.db.ref('highscores/' + this.user.uid).set({
          name: this.user.displayName || this.user.email,
          score: score,
          timestamp: new Date().toISOString()
        });
      } catch (e) {}
    }
  }

  updateUserUI(name, email) {
    const userBadge = document.getElementById('hudUserBadge');
    if (userBadge) {
      userBadge.textContent = name;
      userBadge.style.color = this.isGuest ? '#aaa' : '#00ffaa';
    }
  }
}

const authManager = new AuthManager();

// DOM Event Bindings for Login, Register & Guest Player Buttons
document.addEventListener('DOMContentLoaded', () => {
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const guestPlayBtn = document.getElementById('guestPlayBtn');
  const guestConvertForm = document.getElementById('guestConvertForm');

  if (tabLoginBtn && tabRegisterBtn && loginForm && registerForm) {
    tabLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      tabLoginBtn.classList.add('active');
      tabRegisterBtn.classList.remove('active');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    });

    tabRegisterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      tabRegisterBtn.classList.add('active');
      tabLoginBtn.classList.remove('active');
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const email = document.getElementById('loginEmail').value;
      const pass = document.getElementById('loginPassword').value;
      const res = await authManager.login(email, pass);
      if (res.success) {
        if (window.startGame) window.startGame();
      } else {
        alert(res.message || 'Invalid credentials.');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const name = document.getElementById('regName').value;
      const email = document.getElementById('regEmail').value;
      const pass = document.getElementById('regPassword').value;
      const res = await authManager.register(name, email, pass);
      if (res.success) {
        if (window.startGame) window.startGame();
      } else {
        alert(res.message || 'Registration failed.');
      }
    });
  }

  if (guestPlayBtn) {
    guestPlayBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      authManager.playAsGuest();
      if (window.startGame) window.startGame();
    });
  }

  if (guestConvertForm) {
    guestConvertForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const name = document.getElementById('guestName').value;
      const email = document.getElementById('guestEmail').value;
      const pass = document.getElementById('guestPassword').value;
      const res = await authManager.register(name, email, pass);
      if (res.success) {
        const guestConvertBox = document.getElementById('guestConvertBox');
        if (guestConvertBox) guestConvertBox.classList.add('hidden');
      } else {
        alert(res.message || 'Registration failed.');
      }
    });
  }
});
