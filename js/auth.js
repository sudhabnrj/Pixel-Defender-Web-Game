/* ==========================================================================
   PIXEL DEFENDER — FIREBASE & USER AUTHENTICATION SYSTEM
   ========================================================================== */

class AuthManager {
  constructor() {
    this.user = null;
    this.isGuest = true;
    this.guestData = { name: 'Guest Player', email: '' };

    // Firebase config
    this.firebaseConfig = {
      apiKey: "AIzaSyChKOyGqu6BLAtAVIPU-Aq7KBThKkRwklQ",
      authDomain: "pixel-defender-5b6cd.firebaseapp.com",
      databaseURL: "https://pixel-defender-5b6cd-default-rtdb.firebaseio.com",
      projectId: "pixel-defender-5b6cd",
      storageBucket: "pixel-defender-5b6cd.firebasestorage.app",
      messagingSenderId: "643651962897",
      appId: "1:643651962897:web:9f51bf9908d3c22677c9b0",
      measurementId: "G-EE148T44M6"
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
            const uData = { name: user.displayName || user.email.split('@')[0], email: user.email, uid: user.uid };
            localStorage.setItem('pixel_defender_user', JSON.stringify(uData));
            this.updateUserUI(uData.name, uData.email);
          } else {
            this.loadLocalUser();
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
        if (uData && uData.name) {
          this.user = uData;
          this.isGuest = false;
          this.updateUserUI(uData.name, uData.email);
          return;
        }
      } catch (err) { }
    }
    this.isGuest = true;
    this.updateUserUI('Guest Player', '');
  }

  playAsGuest() {
    this.isGuest = true;
    this.user = null;
    localStorage.removeItem('pixel_defender_user');
    this.updateUserUI('Guest Player', '');
    return true;
  }

  async login(email, password) {
    if (this.auth) {
      try {
        const res = await this.auth.signInWithEmailAndPassword(email, password);
        this.user = res.user;
        this.isGuest = false;
        const name = this.user.displayName || email.split('@')[0];
        localStorage.setItem('pixel_defender_user', JSON.stringify({ name, email, uid: this.user.uid }));
        this.updateUserUI(name, email);
        return { success: true, name: name };
      } catch (err) {
        return this.localLogin(email, password, err.message);
      }
    }
    return this.localLogin(email, password);
  }

  localLogin(email, password, firebaseErrMsg = null) {
    const accounts = JSON.parse(localStorage.getItem('pixel_defender_accounts') || '{}');
    if (accounts[email] && accounts[email].password === password) {
      this.user = accounts[email];
      this.isGuest = false;
      localStorage.setItem('pixel_defender_user', JSON.stringify(this.user));
      this.updateUserUI(this.user.name, this.user.email);
      return { success: true, name: this.user.name };
    }
    return {
      success: false,
      message: firebaseErrMsg || 'Invalid email or password. Please check your credentials.'
    };
  }

  async register(name, email, password) {
    if (this.auth) {
      try {
        const res = await this.auth.createUserWithEmailAndPassword(email, password);
        await res.user.updateProfile({ displayName: name });
        this.user = res.user;
        this.isGuest = false;

        if (this.db) {
          try {
            this.db.ref('users/' + res.user.uid).set({
              name: name,
              email: email,
              createdAt: new Date().toISOString()
            });
          } catch (e) { }
        }
        localStorage.setItem('pixel_defender_user', JSON.stringify({ name, email, uid: res.user.uid }));
        this.updateUserUI(name, email);
        return { success: true, name: name };
      } catch (err) {
        return this.localRegister(name, email, password, err.message);
      }
    }
    return this.localRegister(name, email, password);
  }

  localRegister(name, email, password, firebaseErrMsg = null) {
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
    if (this.user) {
      const name = this.user.displayName || this.user.name || this.user.email || 'Player';
      const uid = this.user.uid || (this.user.email ? this.user.email.replace(/[.#$\[\]]/g, '_') : 'guest');
      if (this.db) {
        try {
          this.db.ref('highscores/' + uid).set({
            name: name,
            score: score,
            timestamp: new Date().toISOString()
          });
        } catch (e) { }
      }
    }
  }

  updateUserUI(name, email) {
    const userBadge = document.getElementById('hudUserBadge');
    if (userBadge) {
      userBadge.textContent = name;
      userBadge.style.color = this.isGuest ? '#aaa' : '#00ffaa';
    }
    const guestConvertBox = document.getElementById('guestConvertBox');
    if (guestConvertBox && !this.isGuest) {
      guestConvertBox.classList.add('hidden');
    }
  }

  showNotification(message, isError = true, targetId = 'authNotif') {
    const el = document.getElementById(targetId);
    if (el) {
      el.textContent = message;
      el.className = `auth-notification ${isError ? '' : 'success'}`;
      el.classList.remove('hidden');
      if (this.notifTimeout) clearTimeout(this.notifTimeout);
      this.notifTimeout = setTimeout(() => {
        el.classList.add('hidden');
      }, 4500);
    }
  }
}

const authManager = new AuthManager();

// DOM Event Bindings for Auth Tabs, Forms & Password Toggles
document.addEventListener('DOMContentLoaded', () => {
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const guestPlayBtn = document.getElementById('guestPlayBtn');
  const guestRegForm = document.getElementById('guestRegForm');

  // Password Visibility Toggle Listener
  document.querySelectorAll('.js-toggle-pwd').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const wrapper = btn.closest('.password-wrapper');
      if (!wrapper) return;
      const input = wrapper.querySelector('input');
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      const eyeIcon = btn.querySelector('svg');
      if (eyeIcon) {
        if (isPassword) {
          eyeIcon.innerHTML = `<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.17c0-1.66-1.34-3-3-3l-.17.02z"/>`;
        } else {
          eyeIcon.innerHTML = `<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>`;
        }
      }
    });
  });

  // Auth Tabs Toggle
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

  // Login Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const email = document.getElementById('loginEmail').value.trim();
      const pass = document.getElementById('loginPassword').value;
      const res = await authManager.login(email, pass);
      if (res.success) {
        authManager.showNotification(`Welcome back, ${res.name}!`, false, 'authNotif');
        setTimeout(() => {
          if (window.startGame) window.startGame();
        }, 600);
      } else {
        authManager.showNotification(res.message || 'Invalid email or password.', true, 'authNotif');
      }
    });
  }

  // Register Form Submission
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const pass = document.getElementById('regPassword').value;
      const res = await authManager.register(name, email, pass);
      if (res.success) {
        authManager.showNotification(`Account created! Welcome ${res.name}!`, false, 'authNotif');
        setTimeout(() => {
          if (window.startGame) window.startGame();
        }, 600);
      } else {
        authManager.showNotification(res.message || 'Registration failed.', true, 'authNotif');
      }
    });
  }

  // Guest Play Button
  if (guestPlayBtn) {
    guestPlayBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      authManager.playAsGuest();
      if (window.startGame) window.startGame();
    });
  }

  // Guest Conversion Form Submission
  if (guestRegForm) {
    guestRegForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const name = document.getElementById('guestRegName').value.trim();
      const email = document.getElementById('guestRegEmail').value.trim();
      const pass = document.getElementById('guestRegPassword').value;
      const res = await authManager.register(name, email, pass);
      if (res.success) {
        const guestConvertBox = document.getElementById('guestConvertBox');
        if (guestConvertBox) guestConvertBox.classList.add('hidden');
      } else {
        authManager.showNotification(res.message || 'Registration failed.', true, 'guestAuthNotif');
      }
    });
  }
});
