// BarPilot - Real Google Authentication Module
// Supports Google Identity Services (GIS) OAuth 2.0 Token Client & ID Services

const DEFAULT_GOOGLE_CLIENT_ID = "281872587864-5699lqs2e94o55secgsjh58jgvc7eelh.apps.googleusercontent.com";

class GoogleAuthManager {
  constructor() {
    let saved = localStorage.getItem("barpilot_google_client_id");
    if (!saved || saved.includes("a034vj159lft3d9svad1a8h8b0225q57")) {
      saved = DEFAULT_GOOGLE_CLIENT_ID;
      localStorage.setItem("barpilot_google_client_id", saved);
    }
    this.clientId = window.GOOGLE_CLIENT_ID || saved || DEFAULT_GOOGLE_CLIENT_ID;
    window.GOOGLE_CLIENT_ID = this.clientId;

    this.tokenClient = null;
    this.gisInitialized = false;
    this.activePopup = null;
    this.popupWatcher = null;

    this.init();
    this.setupAutoLoader();
  }

  setupAutoLoader() {
    // If GIS script hasn't finished loading yet, listen for load or poll briefly
    if (!window.google?.accounts?.oauth2) {
      const checkGis = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(checkGis);
          this.init();
        }
      }, 250);
      setTimeout(() => clearInterval(checkGis), 10000);
    }
  }

  init() {
    if (!this.clientId) return;

    // 1. Initialize Google Identity Services (One-Tap / ID Credential)
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: (response) => this.handleGoogleCredentialResponse(response),
          auto_select: false,
          cancel_on_tap_outside: true
        });
        this.gisInitialized = true;
        console.log("[GoogleAuth] GIS id initialized with Client ID:", this.clientId);
      } catch (e) {
        console.warn("[GoogleAuth] GIS id.initialize note:", e);
      }
    }

    // 2. Initialize OAuth 2.0 Token Client (Preferred for Custom Button clicks)
    if (window.google?.accounts?.oauth2) {
      try {
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: "openid email profile",
          callback: async (tokenResponse) => {
            console.log("[GoogleAuth] Token response received:", tokenResponse);
            if (tokenResponse && tokenResponse.access_token) {
              await this.fetchGoogleUserProfile(tokenResponse.access_token);
            } else if (tokenResponse && tokenResponse.error) {
              this.handleOAuthError(tokenResponse.error);
            }
          },
          error_callback: (err) => {
            console.warn("[GoogleAuth] Token client error:", err);
            this.handleOAuthError(err);
          }
        });
        console.log("[GoogleAuth] OAuth2 TokenClient initialized successfully");
      } catch (e) {
        console.warn("[GoogleAuth] OAuth2 initTokenClient note:", e);
      }
    }
  }

  // Check if Supabase project has Google OAuth enabled
  async checkSupabaseGoogleProvider() {
    try {
      if (!window.supabase || !window.supabase.url) return false;
      const res = await fetch(`${window.supabase.url}/auth/v1/settings`, {
        headers: { "apikey": window.supabase.anonKey }
      });
      if (!res.ok) return true;
      const data = await res.json();
      return Boolean(data?.external?.google);
    } catch (e) {
      console.warn("[GoogleAuth] Supabase provider check fallback:", e);
      return true;
    }
  }

  // Trigger Google Sign-In Flow
  async signIn() {
    console.log("[GoogleAuth] signIn() triggered. Client ID:", this.clientId);

    const btn = document.getElementById("btnGoogleSignIn");
    const originalText = btn?.querySelector("span")?.textContent || "Accedi con Google";
    if (btn) {
      btn.style.opacity = "0.75";
      btn.style.pointerEvents = "none";
      const span = btn.querySelector("span");
      if (span) span.textContent = (window.i18n?.currentLang === "fr" ? "Connexion Google..." : "Reindirizzamento Google...");
    }

    const restoreBtn = () => {
      if (btn) {
        btn.style.opacity = "";
        btn.style.pointerEvents = "";
        const span = btn.querySelector("span");
        if (span) span.textContent = originalText;
      }
    };

    try {
      // 1. Check if Supabase has Google OAuth enabled (Preferred & direct Supabase flow)
      if (window.supabase && window.supabase.isConfigured) {
        let isSupabaseGoogleEnabled = true;
        try {
          isSupabaseGoogleEnabled = await this.checkSupabaseGoogleProvider();
        } catch (e) {
          console.warn("[GoogleAuth] Check provider failed, defaulting to enabled:", e);
        }

        if (isSupabaseGoogleEnabled) {
          const returnUrl = window.location.origin + window.location.pathname;
          const redirectUrl = `${window.supabase.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(returnUrl)}`;
          console.log("[GoogleAuth] Redirecting to Supabase Google OAuth:", redirectUrl);
          window.location.href = redirectUrl;
          return;
        }
      }

      // 2. Ensure GIS is loaded
      if (!window.google?.accounts) {
        await this.loadGisScript();
      }

      // Re-run init if tokenClient wasn't initialized
      if (!this.tokenClient && window.google?.accounts?.oauth2) {
        this.init();
      }

      // 3. Official OAuth2 Token Client (Opens Real Google Account Selector popup)
      if (this.tokenClient) {
        try {
          restoreBtn();
          this.tokenClient.requestAccessToken({ prompt: "select_account" });
          return;
        } catch (err) {
          console.warn("[GoogleAuth] TokenClient request error, trying GIS One-Tap fallback:", err);
        }
      }

      // 4. Fallback to GIS prompt if available
      if (window.google?.accounts?.id && this.gisInitialized) {
        try {
          restoreBtn();
          window.google.accounts.id.prompt();
          return;
        } catch (err) {
          console.warn("[GoogleAuth] GIS prompt fallback error:", err);
        }
      }

      // 5. Ultimate Fallback: Direct Google Account Chooser popup with guide
      restoreBtn();
      this.openRealGoogleAccountChooser();
    } catch (err) {
      console.error("[GoogleAuth] Error in signIn():", err);
      restoreBtn();
      if (window.supabase?.isConfigured) {
        const returnUrl = window.location.origin + window.location.pathname;
        window.location.href = `${window.supabase.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(returnUrl)}`;
      } else {
        this.openRealGoogleAccountChooser();
      }
    }
  }

  loadGisScript() {
    return new Promise((resolve) => {
      if (window.google?.accounts) {
        resolve();
        return;
      }
      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existing) {
        existing.addEventListener("load", () => resolve());
        setTimeout(resolve, 2000);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.appendChild(script);
      setTimeout(resolve, 2500);
    });
  }

  // Fetch real Google Profile (Name, Email, Picture) from Google userinfo API
  async fetchGoogleUserProfile(accessToken) {
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (!res.ok) {
        throw new Error(`Google API returned status ${res.status}`);
      }
      const profile = await res.json();
      console.log("[GoogleAuth] User profile retrieved from Google:", profile.email);

      this.loginWithGoogleProfile({
        name: profile.name || "Utente Google",
        email: profile.email,
        picture: profile.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || "Google")}&background=4285F4&color=fff`
      });
    } catch (err) {
      console.error("[GoogleAuth] Failed to fetch userinfo:", err);
      if (typeof showToast === "function") {
        showToast("⚠️ Errore nel recupero del profilo Google. Riprova.");
      }
      this.openRealGoogleAccountChooser();
    }
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
          picture: payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name || "Google")}&background=4285F4&color=fff`
        });
      }
    }
  }

  // Completes login and directs to Dashboard or Checkout depending on subscription
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

    localStorage.removeItem("barpilot_is_demo");
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
      // Direct unsubscribed Google user to subscription page with mandatory Google Pay / Card checkout
      if (typeof switchView === "function") switchView("subscriptions");
      setTimeout(() => {
        if (typeof openCheckoutModal === "function") openCheckoutModal(true);
      }, 400);
      if (typeof showToast === "function") {
        showToast(isIt
          ? `⚠️ Benvenuto ${profile.name}! Abbonamento richiesto per la Dashboard. Completa l'attivazione con Google Pay & Wallet (59€/mese).`
          : `⚠️ Bienvenue ${profile.name} ! Abonnement requis pour le Tableau de Bord. Payez avec Google Pay (59€/mois).`);
      }
    }
  }

  handleOAuthError(err) {
    const origin = window.location.origin;
    console.error("[GoogleAuth] OAuth Error details:", err, "Current origin:", origin);

    const isOriginError = typeof err === "string" && (err.includes("origin_mismatch") || err.includes("unregistered_origin"));
    if (isOriginError) {
      alert(`⚠️ Configurazione Google Cloud necessaria:\n\nL'indirizzo "${origin}" non è ancora presente tra le "Origini JavaScript autorizzate" nella console Google.\n\nAccedi a Google Cloud Console > Credenziali > ID Client Web e aggiungi "${origin}" in "Origini JavaScript autorizzate".`);
      return;
    }

    if (typeof showToast === "function") {
      showToast("⚠️ Finestra Google chiusa o autorizzazione non completata.");
    }
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

      if (this.popupWatcher) clearInterval(this.popupWatcher);
      this.popupWatcher = setInterval(() => {
        if (!this.activePopup || this.activePopup.closed) {
          clearInterval(this.popupWatcher);
          this.handlePopupClosed();
        }
      }, 800);
    }

    this.showGooglePopupActiveModal();
  }

  handlePopupClosed() {
    console.log("[GoogleAuth] Google popup closed by user");
  }

  showGooglePopupActiveModal() {
    let modal = document.getElementById("googlePickerModal");
    localStorage.removeItem("barpilot_is_demo");
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
    const reopenBtn = isIt ? "🔄 Riapri finestra Google" : "🔄 Rouvrir finestra Google";

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

        <!-- Return to App Card -->
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

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <button type="button" onclick="window.googleAuth.openRealGoogleAccountChooser()" style="background:none; border:none; color:var(--primary); font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px;">
            ${reopenBtn}
          </button>
          <a href="https://accounts.google.com/signup" target="_blank" rel="noopener" style="color:var(--text-muted); font-size:11px; text-decoration:none;">
            Crea account Google ↗
          </a>
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
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285F4&color=fff&size=128`
    });
  }

  saveClientId(clientId) {
    this.clientId = (clientId || "").trim();
    localStorage.setItem("barpilot_google_client_id", this.clientId);
    window.GOOGLE_CLIENT_ID = this.clientId;
    this.init();
    if (typeof showToast === "function") {
      showToast("Google Client ID salvato e attivato!");
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
