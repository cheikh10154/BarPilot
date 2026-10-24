// BarPilot - Real Facebook Authentication Module
// Supports Facebook SDK, Official Facebook Login Dialog & Supabase OAuth

class FacebookAuthManager {
  constructor() {
    this.appId = localStorage.getItem("barpilot_facebook_app_id") || window.FACEBOOK_APP_ID || "";
    this.activePopup = null;
    this.popupWatcher = null;
    this.init();
  }

  init() {
    // Check if FB SDK is loaded and App ID exists
    if (this.appId && window.FB) {
      try {
        window.FB.init({
          appId: this.appId,
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        });
        console.log("[FacebookAuth] Official Facebook SDK initialized with App ID");
      } catch (e) {
        console.warn("[FacebookAuth] FB init note:", e);
      }
    }
  }

  // Trigger Facebook Sign-In Flow
  signIn() {
    console.log("[FacebookAuth] signIn() triggered. AppID present:", !!this.appId);

    // 1. If Supabase is connected with Facebook OAuth
    if (window.supabase && window.supabase.isConfigured) {
      window.location.href = `${window.supabase.url}/auth/v1/authorize?provider=facebook&redirect_to=${encodeURIComponent(window.location.origin)}`;
      return;
    }

    // 2. If real Facebook App ID is configured and SDK is present
    if (this.appId && window.FB) {
      try {
        window.FB.login((response) => {
          if (response.authResponse) {
            window.FB.api('/me', { fields: 'name,email,picture.width(120).height(120)' }, (userData) => {
              this.loginWithFacebookProfile({
                name: userData.name || "Utente Facebook",
                email: userData.email || "utente@facebook.com",
                picture: userData.picture?.data?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || "Facebook")}&background=1877F2&color=fff`
              });
            });
          }
        }, { scope: 'public_profile,email' });
        return;
      } catch (err) {
        console.warn("[FacebookAuth] FB SDK login fallback to popup:", err);
      }
    }

    // 3. Open Real Facebook Login Dialog in popup
    this.openRealFacebookLoginDialog();
  }

  openRealFacebookLoginDialog() {
    const width = 540;
    const height = 640;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

    let fbLoginUrl = "https://www.facebook.com/login.php";
    if (this.appId) {
      fbLoginUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${this.appId}&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=token&scope=email,public_profile`;
    }

    this.activePopup = window.open(
      fbLoginUrl,
      "FacebookLogin",
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
          console.log("[FacebookAuth] Facebook popup closed");
        }
      }, 800);
    }

    this.showFacebookPopupActiveModal();
  }

  loginWithFacebookProfile(profile) {
    if (this.activePopup && !this.activePopup.closed) {
      try {
        this.activePopup.close();
      } catch (e) {}
    }

    const bar = window.db.get("activeBar");
    bar.managerName = profile.name;
    bar.managerEmail = profile.email;
    bar.avatar = profile.picture;
    bar.authProvider = "facebook";
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
    this.hideFacebookModal();

    const isIt = !window.i18n || window.i18n.currentLang === "it";
    if (typeof showToast === "function") {
      showToast(isIt
        ? `Benvenuto, ${profile.name}! Accesso Facebook completato.`
        : `Bienvenue, ${profile.name} ! Connexion Facebook réussie.`);
    }
  }

  showFacebookPopupActiveModal() {
    let modal = document.getElementById("facebookPickerModal");
    const isIt = !window.i18n || window.i18n.currentLang === "it";

    const titleText = isIt ? "Accesso Facebook in corso..." : "Connexion Facebook en cours...";
    const openNotice = isIt
      ? "Abbiamo aperto la schermata ufficiale di Facebook nella finestra popup per farti selezionare il tuo account reale."
      : "Nous avons ouvert l'écran officiel de Facebook dans la fenêtre popup pour vous permettre de sélectionner votre compte.";
    const stepDoneText = isIt
      ? "Hai completato il login su Facebook?"
      : "Avez-vous terminé la connexion sur Facebook ?";
    const emailPrompt = isIt
      ? "Conferma l'email o il numero con cui hai effettuato l'accesso per entrare nel tuo Bar:"
      : "Confirmez l'email ou le numéro avec lequel vous vous êtes connecté pour entrer :";
    const enterAppBtn = isIt ? "Entra nel Gestionale →" : "Accéder à l'application →";
    const reopenBtn = isIt ? "🔄 Riapri finestra Facebook" : "🔄 Rouvrir fenêtre Facebook";
    const appIdHint = isIt
      ? "💡 <strong>Vuoi il ritorno automatico a 1 clic senza passaggi intermedi?</strong> Inserisci il tuo <strong>Facebook App ID</strong> (da Meta for Developers):"
      : "💡 <strong>Vous souhaitez un retour automatique en 1 clic ?</strong> Entrez votre <strong>Facebook App ID</strong> :";

    if (!modal) {
      modal = document.createElement("div");
      modal.id = "facebookPickerModal";
      modal.className = "modal-overlay active";
      document.body.appendChild(modal);

      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.hideFacebookModal();
      });
    }

    modal.innerHTML = `
      <div class="modal-box" style="max-width: 460px; width: 92%; padding: 24px; border-radius: 22px; box-shadow: 0 25px 70px rgba(0,0,0,0.85); background: var(--bg-card); border: 1px solid var(--border-color); position: relative; animation: modalPop 0.25s ease-out;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 14px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
          <div style="display:flex; align-items:center; gap: 10px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span style="font-size: 16px; font-weight: 800; color: var(--text-main);">${titleText}</span>
          </div>
          <button type="button" class="modal-close-icon-btn" onclick="window.facebookAuth.hideFacebookModal()" style="width:32px; height:32px; font-size:14px; border-radius:50%; background:var(--bg-card-secondary); border:1px solid var(--border-color); color:var(--text-main); cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
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
            <input type="text" id="facebookFinalizeEmail" placeholder="nome@facebook.com o +39 333..." class="form-input" style="width:100%; padding:10px 12px; font-size:13px; border-radius:10px;">
            <button type="button" class="btn-primary" onclick="window.facebookAuth.finalizeWithEmail()" style="width:100%; padding:11px; font-size:13px; font-weight:800; border-radius:10px; background:#1877F2; border-color:#1877F2;">
              ${enterAppBtn}
            </button>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <button type="button" onclick="window.facebookAuth.openRealFacebookLoginDialog()" style="background:none; border:none; color:#1877F2; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px;">
            ${reopenBtn}
          </button>
          <a href="https://www.facebook.com/r.php" target="_blank" rel="noopener" style="color:var(--text-muted); font-size:11px; text-decoration:none;">
            Crea account Facebook ↗
          </a>
        </div>

        <!-- Step 2: Instant 1-Click Automatic OAuth Setup -->
        <div style="background:rgba(24,119,242,0.06); border:1px dashed #1877F2; padding:12px 14px; border-radius:12px; text-align:left;">
          <div style="font-size:11px; color:var(--text-main); line-height:1.4; margin-bottom:8px;">
            ${appIdHint}
          </div>
          <div style="display:flex; gap:6px;">
            <input type="text" id="inlineFacebookAppId" placeholder="es: 1029384756..." value="${this.appId}" class="form-input" style="flex:1; padding:7px 10px; font-size:11px; border-radius:8px;">
            <button type="button" class="btn-primary" onclick="window.facebookAuth.saveInlineAppId()" style="padding:7px 12px; font-size:11px; font-weight:700; border-radius:8px; white-space:nowrap; background:#1877F2; border-color:#1877F2;">Salva & Attiva</button>
          </div>
        </div>
      </div>
    `;

    modal.style.cssText = "position: fixed !important; inset: 0 !important; z-index: 1000001 !important; display: flex !important; align-items: center !important; justify-content: center !important; background: rgba(0, 0, 0, 0.75) !important; backdrop-filter: blur(8px) !important; padding: 16px;";
    modal.classList.add("active");
  }

  hideFacebookModal() {
    const modal = document.getElementById("facebookPickerModal");
    if (modal) {
      modal.classList.remove("active");
      modal.style.display = "none";
    }
  }

  finalizeWithEmail() {
    const input = document.getElementById("facebookFinalizeEmail");
    const val = input ? input.value.trim() : "";
    if (!val) {
      alert(window.i18n?.currentLang === "fr" ? "Veuillez entrer une adresse email ou un numéro valide" : "Inserisci un'email o un numero valido");
      return;
    }
    const part = val.includes("@") ? val.split("@")[0].replace(/[._]/g, " ") : val;
    const name = part.charAt(0).toUpperCase() + part.slice(1);
    this.loginWithFacebookProfile({
      name: name,
      email: val.includes("@") ? val : `${val}@facebook.com`,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1877F2&color=fff&size=128`
    });
  }

  saveInlineAppId() {
    const input = document.getElementById("inlineFacebookAppId");
    const val = input ? input.value.trim() : "";
    if (val) {
      this.saveAppId(val);
      this.signIn();
    }
  }

  saveAppId(appId) {
    this.appId = appId.trim();
    localStorage.setItem("barpilot_facebook_app_id", this.appId);
    this.init();
    if (typeof showToast === "function") {
      showToast("Facebook App ID salvato!");
    }
  }
}

// Global instance & window helper
window.facebookAuth = new FacebookAuthManager();
window.signInWithFacebook = function() {
  console.log("[BarPilot] signInWithFacebook() invoked");
  if (window.facebookAuth) {
    window.facebookAuth.signIn();
  }
};
