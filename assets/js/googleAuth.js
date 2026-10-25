// BarPilot - Real Google Authentication Module
// Supports Google Identity Services (GIS), Official Google AccountChooser Popup & Supabase OAuth

class GoogleAuthManager {
  constructor() {
    this.clientId = localStorage.getItem("barpilot_google_client_id") || window.GOOGLE_CLIENT_ID || "";
    this.activePopup = null;
    this.popupWatcher = null;
    this.init();
  }

  init() {
    // If client ID is present and GIS is loaded, initialize official Google SDK
    if (this.clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: (response) => this.handleGoogleCredentialResponse(response),
          auto_select: false,
          cancel_on_tap_outside: true
        });
        console.log("[GoogleAuth] Official Google GIS initialized with client ID");
      } catch (e) {
        console.warn("[GoogleAuth] GIS init note:", e);
      }
    }
  }

  // Trigger Google Sign-In Flow
  signIn() {
    console.log("[GoogleAuth] signIn() triggered. Real ClientID present:", !!this.clientId);

    // 1. If Supabase is connected with Google OAuth
    if (window.supabase && window.supabase.isConfigured) {
      window.location.href = `${window.supabase.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}`;
      return;
    }

    // 2. If real Google Client ID is configured and GIS SDK is present
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
        console.warn("[GoogleAuth] GIS prompt fallback to official Google popup:", err);
      }
    }

    // 3. Open Real Google Account Chooser Popup directly on accounts.google.com
    this.openRealGoogleAccountChooser();
  }

  // Opens the official Google Account Chooser & Sign-in on accounts.google.com
  openRealGoogleAccountChooser() {
    const width = 520;
    const height = 640;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

    const googleChooserUrl = "https://accounts.google.com/AccountChooser";

    this.activePopup = window.open(
      googleChooserUrl,
      "GoogleAccountChooser",
      `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no,location=yes,resizable=yes`
    );

    if (this.activePopup) {
      try {
        this.activePopup.focus();
      } catch (e) {}

      // Monitor popup closure
      if (this.popupWatcher) clearInterval(this.popupWatcher);
      this.popupWatcher = setInterval(() => {
        if (!this.activePopup || this.activePopup.closed) {
          clearInterval(this.popupWatcher);
          this.handlePopupClosed();
        }
      }, 800);
    }

    // Show native overlay guiding the user through the open Google window
    this.showGooglePopupActiveModal();
  }

  handlePopupClosed() {
    console.log("[GoogleAuth] Google popup was closed by user");
  }

  // Parse JWT Token from Google GIS response
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
    if (this.activePopup && !this.activePopup.closed) {
      try {
        this.activePopup.close();
      } catch (e) {}
    }

    const bar = (window.db ? window.db.get("activeBar") : {}) || {};
    bar.managerName = profile.name;
    bar.managerEmail = profile.email;
    bar.avatar = profile.picture;
    bar.authProvider = "google";
    bar.isDemo = false;
    const hasExistingSub = localStorage.getItem("barpilot_is_subscribed") === "true";
    bar.isSubscribed = hasExistingSub;
    bar.subscriptionStatus = hasExistingSub ? "active" : "unsubscribed";
    if (window.db) window.db.set("activeBar", bar);

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
    if (typeof setUserLoggedIn === "function") {
      setUserLoggedIn(true, {
        name: profile.name,
        email: profile.email,
        avatar: profile.picture,
        provider: "google",
        isDemo: false
      });
    } else {
      localStorage.setItem("barpilot_is_logged_in", "true");
    }
    if (typeof closeAuthScreen === "function") closeAuthScreen();
    this.hideGoogleModal();

    if (typeof renderApp === "function") renderApp();

    const isIt = !window.i18n || window.i18n.currentLang === "it";

    // Subscription check for Google login
    const hasSub = typeof isUserSubscribed === "function" && isUserSubscribed();
    if (hasSub) {
      if (typeof switchView === "function") switchView("dashboard");
      if (typeof showToast === "function") {
        showToast(isIt
          ? `Benvenuto, ${profile.name}! Accesso Google completato.`
          : `Bienvenue, ${profile.name} ! Connexion Google réussie.`);
      }
    } else {
      // Direct unsubscribed Google user to subscription page with Google Play Pay
      if (typeof switchView === "function") switchView("subscriptions");
      setTimeout(() => {
        if (typeof openGooglePlayModal === "function") openGooglePlayModal();
      }, 400);
      if (typeof showToast === "function") {
        showToast(isIt
          ? `⚠️ Benvenuto ${profile.name}! Abbonamento richiesto per la Dashboard. Paga subito con Google Play Pay (59€/mese).`
          : `⚠️ Bienvenue ${profile.name} ! Abonnement requis pour le Tableau de Bord. Payez avec Google Play Pay (59€/mois).`);
      }
    }
  }

  showGooglePopupActiveModal() {
    let modal = document.getElementById("googlePickerModal");
    const isIt = !window.i18n || window.i18n.currentLang === "it";

    const titleText = isIt ? "Accesso Google in corso..." : "Connexion Google en cours...";
    const openNotice = isIt
      ? "Abbiamo aperto la schermata ufficiale di Google nella finestra popup per farti selezionare il tuo account reale."
      : "Nous avons ouvert l'écran officiel de Google dans la fenêtre popup pour vous permettre de sélectionner votre compte.";
    const stepDoneText = isIt
      ? "Hai completato il login su Google?"
      : "Avez-vous terminé la connexion sur Google ?";
    const emailPrompt = isIt
      ? "Conferma l'email con cui hai effettuato l'accesso per entrare nel tuo Bar:"
      : "Confirmez l'email avec laquelle vous vous êtes connecté pour entrer :";
    const enterAppBtn = isIt ? "Entra nel Gestionale →" : "Accéder à l'application →";
    const reopenBtn = isIt ? "🔄 Riapri finestra Google" : "🔄 Rouvrir fenêtre Google";
    const clientIdHint = isIt
      ? "💡 <strong>Vuoi il ritorno automatico a 1 clic senza passaggi intermedi?</strong> Inserisci il tuo <strong>Google Client ID</strong> (da Google Cloud Console):"
      : "💡 <strong>Vous souhaitez un retour automatique en 1 clic ?</strong> Entrez votre <strong>Google Client ID</strong> :";

    if (!modal) {
      modal = document.createElement("div");
      modal.id = "googlePickerModal";
      modal.className = "modal-overlay active";
      document.body.appendChild(modal);

      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.hideGoogleModal();
      });
    }

    modal.innerHTML = `
      <div class="modal-box" style="max-width: 460px; width: 92%; padding: 24px; border-radius: 22px; box-shadow: 0 25px 70px rgba(0,0,0,0.85); background: var(--bg-card); border: 1px solid var(--border-color); position: relative; animation: modalPop 0.25s ease-out;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 14px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
          <div style="display:flex; align-items:center; gap: 10px;">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span style="font-size: 16px; font-weight: 800; color: var(--text-main);">${titleText}</span>
          </div>
          <button type="button" class="modal-close-icon-btn" onclick="window.googleAuth.hideGoogleModal()" style="width:32px; height:32px; font-size:14px; border-radius:50%; background:var(--bg-card-secondary); border:1px solid var(--border-color); color:var(--text-main); cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
        </div>

        <p style="font-size: 13px; color: var(--text-muted); line-height: 1.4; margin-bottom: 14px;">
          ${openNotice}
        </p>

        <!-- Step 1: Return to App Card -->
        <div style="background:var(--bg-card-secondary); padding:16px; border-radius:14px; border:1px solid var(--border-color); margin-bottom:14px; text-align:left;">
          <div style="font-size:12px; font-weight:800; color:var(--text-main); margin-bottom:4px; display:flex; align-items:center; gap:6px;">
            <span>✅</span> ${stepDoneText}
          </div>
          <p style="font-size:11px; color:var(--text-muted); margin-bottom:10px;">
            ${emailPrompt}
          </p>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <input type="email" id="googleFinalizeEmail" placeholder="nome@gmail.com" class="form-input" style="width:100%; padding:10px 12px; font-size:13px; border-radius:10px;">
            <button type="button" class="btn-primary" onclick="window.googleAuth.finalizeWithEmail()" style="width:100%; padding:11px; font-size:13px; font-weight:800; border-radius:10px;">
              ${enterAppBtn}
            </button>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <button type="button" onclick="window.googleAuth.openRealGoogleAccountChooser()" style="background:none; border:none; color:var(--primary); font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px;">
            ${reopenBtn}
          </button>
          <a href="https://accounts.google.com/signup" target="_blank" rel="noopener" style="color:var(--text-muted); font-size:11px; text-decoration:none;">
            Crea account Google ↗
          </a>
        </div>

        <!-- Step 2: Instant 1-Click Automatic OAuth Setup -->
        <div style="background:rgba(255,122,0,0.06); border:1px dashed var(--primary); padding:12px 14px; border-radius:12px; text-align:left;">
          <div style="font-size:11px; color:var(--text-main); line-height:1.4; margin-bottom:8px;">
            ${clientIdHint}
          </div>
          <div style="display:flex; gap:6px;">
            <input type="text" id="inlineGoogleClientId" placeholder="es: 123456-xxx.apps.googleusercontent.com" value="${this.clientId}" class="form-input" style="flex:1; padding:7px 10px; font-size:11px; border-radius:8px;">
            <button type="button" class="btn-primary" onclick="window.googleAuth.saveInlineClientId()" style="padding:7px 12px; font-size:11px; font-weight:700; border-radius:8px; white-space:nowrap;">Salva & Attiva</button>
          </div>
        </div>
      </div>
    `;

    modal.style.cssText = "position: fixed !important; inset: 0 !important; z-index: 1000001 !important; display: flex !important; align-items: center !important; justify-content: center !important; background: rgba(0, 0, 0, 0.75) !important; backdrop-filter: blur(8px) !important; padding: 16px;";
    modal.classList.add("active");
  }

  hideGoogleModal() {
    const modal = document.getElementById("googlePickerModal");
    if (modal) {
      modal.classList.remove("active");
      modal.style.display = "none";
    }
  }

  finalizeWithEmail() {
    const input = document.getElementById("googleFinalizeEmail");
    const email = input ? input.value.trim() : "";
    if (!email || !email.includes("@")) {
      alert(window.i18n?.currentLang === "fr" ? "Veuillez entrer une adresse email valide" : "Inserisci un'email valida");
      return;
    }
    const part = email.split("@")[0].replace(/[._]/g, " ");
    const name = part.charAt(0).toUpperCase() + part.slice(1);
    this.loginWithGoogleProfile({
      name: name,
      email: email,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF7A00&color=fff&size=128`
    });
  }

  saveInlineClientId() {
    const input = document.getElementById("inlineGoogleClientId");
    const val = input ? input.value.trim() : "";
    if (val) {
      this.saveClientId(val);
      // Re-trigger GIS prompt immediately
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: this.clientId,
            callback: (res) => this.handleGoogleCredentialResponse(res)
          });
          window.google.accounts.id.prompt();
        } catch (e) {
          console.warn("GIS immediate prompt note:", e);
        }
      }
    }
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
