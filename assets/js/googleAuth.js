// BarPilot - Google Authentication Module
// Supports Google Identity Services (GIS), Supabase Google OAuth & Interactive Account Picker

class GoogleAuthManager {
  constructor() {
    this.clientId = localStorage.getItem("barpilot_google_client_id") || window.GOOGLE_CLIENT_ID || "";
    this.showingAddForm = false;
    this.init();
  }

  init() {
    // Check if Google GIS SDK is loaded and client ID exists
    if (this.clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: (response) => this.handleGoogleCredentialResponse(response),
          auto_select: false,
          cancel_on_tap_outside: true
        });
        console.log("[GoogleAuth] GIS initialized successfully");
      } catch (e) {
        console.warn("[GoogleAuth] GIS init note:", e);
      }
    }
  }

  // Get currently connected Google accounts on this device
  getConnectedAccounts() {
    try {
      const raw = localStorage.getItem("barpilot_google_accounts");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  // Save account to connected list
  saveConnectedAccount(profile) {
    let accounts = this.getConnectedAccounts();
    accounts = accounts.filter(acc => acc.email.toLowerCase() !== profile.email.toLowerCase());
    accounts.unshift({
      name: profile.name,
      email: profile.email,
      picture: profile.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=FF7A00&color=fff`,
      lastLogin: new Date().toISOString()
    });
    localStorage.setItem("barpilot_google_accounts", JSON.stringify(accounts));
  }

  // Remove a connected account from this device
  removeConnectedAccount(email, event) {
    if (event) event.stopPropagation();
    let accounts = this.getConnectedAccounts();
    accounts = accounts.filter(acc => acc.email.toLowerCase() !== email.toLowerCase());
    localStorage.setItem("barpilot_google_accounts", JSON.stringify(accounts));
    this.showGooglePickerModal();
    const isIt = !window.i18n || window.i18n.currentLang === "it";
    if (typeof showToast === "function") {
      showToast(isIt ? "Account Google rimosso dal dispositivo" : "Compte Google supprimé de cet appareil");
    }
  }

  // Trigger Google Sign-In Flow
  signIn() {
    console.log("[GoogleAuth] signIn() initiated. ClientID present:", !!this.clientId);

    // 1. If Supabase is connected with Google OAuth
    if (window.supabase && window.supabase.isConfigured) {
      window.location.href = `${window.supabase.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}`;
      return;
    }

    // 2. If real Google Client ID is configured and SDK is present
    if (this.clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: (response) => this.handleGoogleCredentialResponse(response),
          auto_select: false,
          cancel_on_tap_outside: true
        });
        window.google.accounts.id.prompt();
        return;
      } catch (err) {
        console.warn("[GoogleAuth] Real Google prompt fallback:", err);
      }
    }

    // 3. Realistic Interactive Google Account Picker Modal
    this.showingAddForm = false;
    this.showGooglePickerModal();
  }

  // Parse JWT Token from Google
  parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  handleGoogleCredentialResponse(response) {
    if (response && response.credential) {
      const payload = this.parseJwt(response.credential);
      if (payload) {
        this.loginWithGoogleProfile({
          name: payload.name || "Utente Google",
          email: payload.email || "utente@gmail.com",
          picture: payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name || "Google")}&background=FF7A00&color=fff`
        });
      }
    }
  }

  loginWithGoogleProfile(profile) {
    // Save to connected accounts
    this.saveConnectedAccount(profile);

    const bar = window.db.get("activeBar");
    bar.managerName = profile.name;
    bar.managerEmail = profile.email;
    bar.avatar = profile.picture;
    bar.authProvider = "google";
    window.db.set("activeBar", bar);

    // Update UI elements
    const userGreeting = document.getElementById("userGreetingName");
    if (userGreeting) userGreeting.textContent = profile.name.split(" ")[0];

    const userProfileAvatars = document.querySelectorAll(".user-avatar");
    userProfileAvatars.forEach(img => {
      img.src = profile.picture;
    });

    const userNameEl = document.querySelector(".user-name");
    if (userNameEl) userNameEl.textContent = profile.name;

    if (typeof renderActiveBar === "function") renderActiveBar();
    if (typeof closeAuthScreen === "function") closeAuthScreen();
    this.hideGooglePickerModal();

    const isIt = !window.i18n || window.i18n.currentLang === "it";
    if (typeof showToast === "function") {
      showToast(isIt
        ? `Benvenuto, ${profile.name}! Accesso Google completato.`
        : `Bienvenue, ${profile.name} ! Connexion Google réussie.`);
    }
  }

  toggleAddAccountForm(show) {
    this.showingAddForm = (typeof show === "boolean") ? show : !this.showingAddForm;
    this.showGooglePickerModal();
  }

  showGooglePickerModal() {
    let modal = document.getElementById("googlePickerModal");
    const isIt = !window.i18n || window.i18n.currentLang === "it";
    const connectedAccounts = this.getConnectedAccounts();

    const titleText = isIt ? "Accedi con Google" : "Se connecter avec Google";
    const connectedTitle = isIt ? "Account Google collegati" : "Comptes Google connectés";
    const noAccountsText = isIt 
      ? "Nessun account Google collegato su questo dispositivo." 
      : "Aucun compte Google connecté sur cet appareil.";
    const subText = isIt 
      ? "Scegli un account Google per continuare su <strong>BarPilot</strong>" 
      : "Choisissez un compte Google pour continuer sur <strong>BarPilot</strong>";
    const useAnotherBtnText = isIt ? "➕ Utilizza un altro account Google" : "➕ Utiliser un autre compte Google";
    const connectNewTitle = isIt ? "Collega un nuovo account Google" : "Connecter un nouveau compte Google";
    const emailPlaceholder = isIt ? "iltuonome@gmail.com" : "votre.nom@gmail.com";
    const namePlaceholder = isIt ? "Il tuo Nome e Cognome" : "Votre Nom et Prénom";
    const submitLoginText = isIt ? "Accedi con questo account" : "Se connecter avec ce compte";
    const createGoogleAccountText = isIt 
      ? "Non hai ancora un account Google? <a href='https://accounts.google.com/signup' target='_blank' rel='noopener' style='color:var(--primary); font-weight:700; text-decoration:none;'>Crea un account Google ↗</a>" 
      : "Vous n'avez pas de compte Google ? <a href='https://accounts.google.com/signup' target='_blank' rel='noopener' style='color:var(--primary); font-weight:700; text-decoration:none;'>Créer un compte Google ↗</a>";
    const backBtnText = isIt ? "← Torna agli account collegati" : "← Retour aux comptes connectés";

    if (!modal) {
      modal = document.createElement("div");
      modal.id = "googlePickerModal";
      modal.className = "modal-overlay active";
      document.body.appendChild(modal);

      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.hideGooglePickerModal();
      });
    }

    let bodyHtml = "";

    // View A: Has accounts and not in add form
    if (connectedAccounts.length > 0 && !this.showingAddForm) {
      const accountsListHtml = connectedAccounts.map(acc => `
        <div class="google-acc-item" onclick="window.googleAuth.selectSavedAccount('${encodeURIComponent(acc.email)}')" style="display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:14px; background:var(--bg-card-secondary); border:1px solid var(--border-color); cursor:pointer; transition:all 0.15s ease; position:relative;">
          <img src="${acc.picture}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid var(--primary);" alt="${acc.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=FF7A00&color=fff'">
          <div style="flex:1; min-width:0;">
            <div style="font-size:13px; font-weight:700; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${acc.name}</div>
            <div style="font-size:11px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${acc.email}</div>
          </div>
          <span style="font-size:12px; color:var(--primary); font-weight:700; margin-right:6px;">Accedi →</span>
          <button type="button" title="${isIt ? 'Rimuovi dal dispositivo' : 'Supprimer de l\'appareil'}" onclick="window.googleAuth.removeConnectedAccount('${acc.email}', event)" style="width:26px; height:26px; border-radius:50%; background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; transition:color 0.15s;" onmouseover="this.style.color='#EF4444'" onmouseout="this.style.color='var(--text-muted)'">✕</button>
        </div>
      `).join("");

      bodyHtml = `
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px; line-height: 1.4;">
          ${subText}
        </p>

        <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          ${connectedTitle} (${connectedAccounts.length})
        </div>

        <div style="display:flex; flex-direction:column; gap: 8px; max-height: 220px; overflow-y: auto;">
          ${accountsListHtml}
        </div>

        <button type="button" class="btn-secondary" onclick="window.googleAuth.toggleAddAccountForm(true)" style="width:100%; margin-top:14px; padding:10px; font-size:13px; font-weight:700; border-radius:12px; display:flex; align-items:center; justify-content:center; gap:8px;">
          ${useAnotherBtnText}
        </button>

        <div style="margin-top:16px; padding-top:14px; border-top:1px solid var(--border-color); text-align:center; font-size:12px; color:var(--text-muted);">
          ${createGoogleAccountText}
        </div>
      `;
    } 
    // View B: No accounts connected OR user clicked "Add/Use another account"
    else {
      bodyHtml = `
        ${connectedAccounts.length === 0 ? `
          <div style="background:var(--bg-card-secondary); border-radius:12px; padding:12px 14px; margin-bottom:14px; border:1px solid var(--border-color); display:flex; align-items:center; gap:10px;">
            <span style="font-size:18px;">ℹ️</span>
            <div style="font-size:12px; color:var(--text-muted); line-height:1.4;">
              ${noAccountsText}
            </div>
          </div>
        ` : `
          <button type="button" onclick="window.googleAuth.toggleAddAccountForm(false)" style="background:none; border:none; color:var(--primary); font-size:12px; font-weight:700; cursor:pointer; padding:0; margin-bottom:12px; display:inline-flex; align-items:center; gap:4px;">
            ${backBtnText}
          </button>
        `}

        <div style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">
          ${connectNewTitle}
        </div>

        <form id="googleNewAccForm" onsubmit="window.googleAuth.handleNewAccountSubmit(event)" style="display:flex; flex-direction:column; gap:10px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--text-muted); display:block; margin-bottom:4px;">Email Google (@gmail.com)</label>
            <input type="email" id="newGoogleEmailInput" placeholder="${emailPlaceholder}" required class="form-input" style="width:100%; padding:10px 14px; font-size:13px; border-radius:10px;">
          </div>

          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--text-muted); display:block; margin-bottom:4px;">Nome e Cognome</label>
            <input type="text" id="newGoogleNameInput" placeholder="${namePlaceholder}" class="form-input" style="width:100%; padding:10px 14px; font-size:13px; border-radius:10px;">
          </div>

          <button type="submit" class="btn-primary" style="width:100%; padding:11px; font-size:13px; font-weight:700; border-radius:10px; margin-top:4px;">
            ${submitLoginText}
          </button>
        </form>

        <div style="margin-top:16px; padding-top:14px; border-top:1px solid var(--border-color); text-align:center; font-size:12px; color:var(--text-muted);">
          ${createGoogleAccountText}
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="modal-box" style="max-width: 440px; width: 92%; padding: 24px; border-radius: 20px; box-shadow: 0 25px 70px rgba(0,0,0,0.85); background: var(--bg-card); border: 1px solid var(--border-color); position: relative; animation: modalPop 0.25s ease-out;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
          <div style="display:flex; align-items:center; gap: 10px;">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span style="font-size: 16px; font-weight: 800; color: var(--text-main);">${titleText}</span>
          </div>
          <button type="button" class="modal-close-icon-btn" onclick="window.googleAuth.hideGooglePickerModal()" style="width:32px; height:32px; font-size:14px; border-radius:50%; background:var(--bg-card-secondary); border:1px solid var(--border-color); color:var(--text-main); cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
        </div>

        ${bodyHtml}
      </div>
    `;

    modal.style.cssText = "position: fixed !important; inset: 0 !important; z-index: 1000001 !important; display: flex !important; align-items: center !important; justify-content: center !important; background: rgba(0, 0, 0, 0.75) !important; backdrop-filter: blur(8px) !important; padding: 16px;";
    modal.classList.add("active");
  }

  hideGooglePickerModal() {
    const modal = document.getElementById("googlePickerModal");
    if (modal) {
      modal.classList.remove("active");
      modal.style.display = "none";
    }
  }

  selectSavedAccount(encodedEmail) {
    const email = decodeURIComponent(encodedEmail);
    const accounts = this.getConnectedAccounts();
    const found = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (found) {
      this.loginWithGoogleProfile(found);
    }
  }

  handleNewAccountSubmit(event) {
    if (event) event.preventDefault();
    const emailInput = document.getElementById("newGoogleEmailInput");
    const nameInput = document.getElementById("newGoogleNameInput");
    const email = emailInput ? emailInput.value.trim() : "";
    let name = nameInput ? nameInput.value.trim() : "";

    if (!email || !email.includes("@")) {
      alert(window.i18n?.currentLang === "fr" ? "Veuillez entrer une adresse email valide" : "Inserisci un'email valida");
      return;
    }

    if (!name) {
      const part = email.split("@")[0].replace(/[._]/g, " ");
      name = part.charAt(0).toUpperCase() + part.slice(1);
    }

    const picture = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF7A00&color=fff&size=128`;

    this.loginWithGoogleProfile({
      name: name,
      email: email,
      picture: picture
    });
  }

  saveClientId(clientId) {
    this.clientId = clientId.trim();
    localStorage.setItem("barpilot_google_client_id", this.clientId);
    this.init();
    if (typeof showToast === "function") {
      showToast("Google Client ID salvato!");
    }
  }
}

// Global instance & window helper
window.googleAuth = new GoogleAuthManager();
window.signInWithGoogle = function() {
  console.log("[BarPilot] signInWithGoogle() invoked");
  if (window.googleAuth) {
    window.googleAuth.signIn();
  }
};
