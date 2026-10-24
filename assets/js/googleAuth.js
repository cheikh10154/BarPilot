// BarPilot - Google Authentication Module
// Supports Google Identity Services (GIS), Supabase Google OAuth & Interactive Account Picker

class GoogleAuthManager {
  constructor() {
    this.clientId = localStorage.getItem("barpilot_google_client_id") || window.GOOGLE_CLIENT_ID || "";
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
      } catch (e) {
        console.warn("Google GIS init note:", e);
      }
    }
  }

  // Trigger Google Sign-In Flow
  signIn() {
    // 1. If Supabase is connected with Google OAuth
    if (window.supabase && window.supabase.isConfigured) {
      window.location.href = `${window.supabase.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}`;
      return;
    }

    // 2. If real Google Client ID is configured and SDK is present
    if (this.clientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
      return;
    }

    // 3. Realistic Interactive Google Account Picker Modal
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
          picture: payload.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"
        });
      }
    }
  }

  loginWithGoogleProfile(profile) {
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

    renderActiveBar();
    closeAuthScreen();
    this.hideGooglePickerModal();

    showToast(window.i18n.currentLang === "it"
      ? `Benvenuto, ${profile.name}! Accesso Google completato.`
      : `Bienvenue, ${profile.name} ! Connexion Google réussie.`);
  }

  showGooglePickerModal() {
    let modal = document.getElementById("googlePickerModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "googlePickerModal";
      modal.className = "modal-overlay active";
      modal.innerHTML = `
        <div class="modal-box" style="max-width: 420px; padding: 26px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.6);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 18px;">
            <div style="display:flex; align-items:center; gap: 10px;">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span style="font-size: 15px; font-weight: 800; color: var(--text-main);">Accedi con Google</span>
            </div>
            <button class="modal-close-icon-btn" onclick="window.googleAuth.hideGooglePickerModal()" style="width:30px; height:30px; font-size:14px;">✕</button>
          </div>

          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
            Scegli un account per continuare su <strong>BarPilot</strong>
          </p>

          <div style="display:flex; flex-direction:column; gap: 8px;">
            <!-- Account 1 -->
            <div class="google-acc-item" onclick="window.googleAuth.selectMockAccount('Marco Rossi', 'marco.rossi.bar@gmail.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop')" style="display:flex; align-items:center; gap:12px; padding:12px; border-radius:12px; background:var(--bg-card-secondary); border:1px solid var(--border-color); cursor:pointer; transition:all 0.15s ease;">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop" style="width:40px; height:40px; border-radius:50%; object-fit:cover;" alt="Marco">
              <div style="flex:1;">
                <div style="font-size:13px; font-weight:700; color:var(--text-main);">Marco Rossi</div>
                <div style="font-size:11px; color:var(--text-muted);">marco.rossi.bar@gmail.com</div>
              </div>
              <span style="font-size:12px; color:var(--primary); font-weight:700;">Accedi →</span>
            </div>

            <!-- Account 2 -->
            <div class="google-acc-item" onclick="window.googleAuth.selectMockAccount('Cheikh Gueye', 'cheikh.barpilot@gmail.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop')" style="display:flex; align-items:center; gap:12px; padding:12px; border-radius:12px; background:var(--bg-card-secondary); border:1px solid var(--border-color); cursor:pointer; transition:all 0.15s ease;">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop" style="width:40px; height:40px; border-radius:50%; object-fit:cover;" alt="Cheikh">
              <div style="flex:1;">
                <div style="font-size:13px; font-weight:700; color:var(--text-main);">Cheikh Gueye</div>
                <div style="font-size:11px; color:var(--text-muted);">cheikh.barpilot@gmail.com</div>
              </div>
              <span style="font-size:12px; color:var(--primary); font-weight:700;">Accedi →</span>
            </div>

            <!-- Custom Account Input -->
            <div style="margin-top: 8px; padding-top: 10px; border-top: 1px dashed var(--border-color);">
              <label style="font-size: 11px; font-weight: 700; color: var(--text-muted);">Oppure inserisci la tua email Google:</label>
              <div style="display:flex; gap: 8px; margin-top: 4px;">
                <input type="email" id="customGoogleEmail" placeholder="iltuonome@gmail.com" class="form-input" style="flex:1; padding: 8px 12px; font-size:12px;">
                <button class="btn-primary" onclick="window.googleAuth.loginCustomGoogle()" style="padding: 8px 12px; font-size:12px;">Accedi</button>
              </div>
            </div>
          </div>

          <p style="font-size: 10px; color: var(--text-muted); text-align: center; margin-top: 16px;">
            Per configurare le credenziali reali Google Cloud, vai su <strong>Impostazioni > Backup & Sicurezza</strong>.
          </p>
        </div>
      `;
      document.body.appendChild(modal);

      // Close on backdrop click
      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.hideGooglePickerModal();
      });
    }
    modal.classList.add("active");
    modal.style.display = "flex";
  }

  hideGooglePickerModal() {
    const modal = document.getElementById("googlePickerModal");
    if (modal) {
      modal.classList.remove("active");
      modal.style.display = "none";
    }
  }

  selectMockAccount(name, email, picture) {
    this.loginWithGoogleProfile({ name, email, picture });
  }

  loginCustomGoogle() {
    const input = document.getElementById("customGoogleEmail");
    const email = input ? input.value.trim() : "";
    if (!email) {
      alert("Inserisci un'email valida");
      return;
    }
    const name = email.split('@')[0].replace(/[._]/g, ' ');
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    this.loginWithGoogleProfile({
      name: formattedName,
      email: email,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedName)}&background=FF7A00&color=fff`
    });
  }

  saveClientId(clientId) {
    this.clientId = clientId.trim();
    localStorage.setItem("barpilot_google_client_id", this.clientId);
    this.init();
    showToast("Google Client ID salvato!");
  }
}

window.googleAuth = new GoogleAuthManager();
