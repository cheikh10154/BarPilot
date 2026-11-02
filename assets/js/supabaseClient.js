// BarPilot - Supabase Enterprise Client & Auth Engine
// Complete integration with Supabase Auth (OAuth 2.0 PKCE, Email/Password, Recover, Multi-Tenant REST)

const DEFAULT_SUPABASE_URL = "https://cprxxxlgaofopmogeuer.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnh4eGxnYW9mb3Btb2dldWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4Mzg1OTQsImV4cCI6MjEwODQxNDU5NH0.wuB9OUgmYo8n1xeJsGl-YpyzVRwg8Sr4k3XAKaYltRI";

const SUPABASE_CONFIG = {
  url: window.BARPILOT_SUPABASE_URL || localStorage.getItem("barpilot_supabase_url") || DEFAULT_SUPABASE_URL,
  anonKey: window.BARPILOT_SUPABASE_KEY || localStorage.getItem("barpilot_supabase_key") || DEFAULT_SUPABASE_KEY,
};

// Traduttore universale dei messaggi Supabase Auth in italiano corrente
function translateSupabaseMessage(rawDesc, rawCode, context = "") {
  const desc = (rawDesc || "").toLowerCase().trim();
  const code = (rawCode || "").toLowerCase().trim();

  if (desc.includes("invalid login credentials") || desc.includes("invalid_grant") || code === "invalid_grant") {
    return "Le credenziali fornite non sono corrette o l'account non è ancora confermato.";
  }
  if (desc.includes("email not confirmed") || code === "email_not_confirmed") {
    return "L'indirizzo email non è ancora stato confermato. Controlla la posta (incluso Spam) o reimposta la password per accedere.";
  }
  if (desc.includes("user already registered") || desc.includes("already exists") || desc.includes("user_already_exists") || code === "user_already_exists") {
    return "Questo indirizzo email è già registrato nel database.";
  }
  if (desc.includes("password should be at least") || desc.includes("password is too short")) {
    return "La password deve contenere almeno 8 caratteri con maiuscola, numero e simbolo.";
  }
  if (desc.includes("rate limit") || desc.includes("over_email_send_rate_limit") || desc.includes("for security purposes") || code === "over_email_send_rate_limit") {
    return "Limite temporaneo invio email raggiunto da Supabase. Attendi un momento prima di richiedere un altro link.";
  }
  if (desc.includes("user not found")) {
    return "Nessun account trovato con questo indirizzo email.";
  }
  if (desc.includes("token has expired") || desc.includes("invalid or has expired") || desc.includes("otp expired")) {
    return "Il link o il codice di verifica è scaduto o non è più valido. Richiedine uno nuovo.";
  }
  if (desc.includes("invalid format") || desc.includes("unable to validate email")) {
    return "L'indirizzo email specificato non ha un formato valido.";
  }
  if (desc.includes("auth session missing") || desc.includes("nessuna sessione attiva")) {
    return "Nessuna sessione di autenticazione attiva.";
  }
  if (desc.includes("signup requires a valid password")) {
    return "La registrazione richiede una password valida.";
  }
  if (desc.includes("email provider is disabled")) {
    return "Il servizio di autenticazione email è temporaneamente non disponibile.";
  }

  if (context === "login") return rawDesc ? rawDesc : "Errore durante l'accesso. Verifica le credenziali.";
  if (context === "signup") return rawDesc ? rawDesc : "Errore durante la registrazione.";
  if (context === "recovery") return rawDesc ? rawDesc : "Errore durante la richiesta di recupero password.";
  if (context === "resend") return rawDesc ? rawDesc : "Errore durante l'invio dell'email di conferma.";
  if (context === "update") return rawDesc ? rawDesc : "Errore durante l'aggiornamento dell'account.";

  return rawDesc || "Operazione con il database non riuscita.";
}
window.translateSupabaseMessage = translateSupabaseMessage;

class BarPilotSupabaseClient {
  constructor(url, anonKey) {
    this.url = (url || DEFAULT_SUPABASE_URL).replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
    this.anonKey = (anonKey || DEFAULT_SUPABASE_KEY).trim();
    this.isConfigured = Boolean(
      this.url && 
      this.url.startsWith("https://") && 
      !this.url.includes("your-project") && 
      this.anonKey && 
      this.anonKey !== "your-anon-key"
    );
    this.session = null;
    this.initSession();
    this.checkUrlHashForSession();
  }

  initSession() {
    try {
      const stored = localStorage.getItem("barpilot_supabase_session");
      if (stored) {
        this.session = JSON.parse(stored);
      }
    } catch (e) {}
  }

  async checkUrlHashForSession() {
    if (typeof window === "undefined" || !window.location) return;
    const hash = window.location.hash || "";
    if (!hash.includes("access_token")) return;

    try {
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const expiresIn = params.get("expires_in");
      const tokenType = params.get("token_type") || "bearer";
      const authType = params.get("type"); // "signup", "recovery", "email_change", etc.

      if (accessToken) {
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, null, window.location.pathname + window.location.search);
        }

        const res = await fetch(`${this.url}/auth/v1/user`, {
          headers: {
            "apikey": this.anonKey,
            "Authorization": `Bearer ${accessToken}`
          }
        });

        if (res.ok) {
          const user = await res.json();
          this.session = {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: expiresIn,
            token_type: tokenType,
            user
          };
          localStorage.setItem("barpilot_supabase_session", JSON.stringify(this.session));
          console.log("[SupabaseAuth] Session established for:", user.email, "type:", authType);

          const fullName = user.user_metadata?.owner_name || user.user_metadata?.full_name || user.user_metadata?.name || (user.email ? user.email.split("@")[0] : "Utente");
          const barName = user.user_metadata?.bar_name || "Il Mio Bar";
          const city = user.user_metadata?.city || "Roma";
          const vat = user.user_metadata?.vat_number || user.user_metadata?.piva || "";
          const phone = user.user_metadata?.phone || "";

          // Se è recovery (reimpostazione password da link email)
          if (authType === "recovery") {
            if (typeof window.openNewPasswordModal === "function") {
              window.openNewPasswordModal(user.email);
            }
            return;
          }

          // Se è signup / conferma email completata da link email
          const userObj = {
            id: "usr_sb_" + user.id,
            supabaseId: user.id,
            type: "email",
            email: user.email.toLowerCase().trim(),
            name: fullName,
            barName: barName,
            vat: vat,
            piva: vat,
            city: city,
            phone: phone,
            role: "Proprietario"
          };

          if (typeof window.saveUserToDatabase === "function") {
            window.saveUserToDatabase(userObj);
          }

          if (typeof window.setUserLoggedIn === "function") {
            window.setUserLoggedIn(true, userObj);
          }

          if (window.db) {
            const bar = window.db.get("activeBar") || {};
            bar.name = barName;
            bar.city = city;
            bar.vat = vat;
            bar.managerName = fullName;
            bar.managerEmail = user.email.toLowerCase().trim();
            bar.isDemo = false;
            window.db.set("activeBar", bar);
          }

          if (typeof window.closeAuthScreen === "function") window.closeAuthScreen();
          if (typeof window.renderApp === "function") window.renderApp();
          if (typeof window.switchView === "function") window.switchView("dashboard");
          if (typeof window.showToast === "function") {
            window.showToast("🎉 Email confermata con successo! Accesso completato.");
          }
        }
      }
    } catch (err) {
      console.warn("[SupabaseAuth] Hash session note:", err);
    }
  }

  getHeaders(withAuth = true) {
    const headers = {
      "apikey": this.anonKey,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    };

    if (withAuth && this.session?.access_token) {
      headers["Authorization"] = `Bearer ${this.session.access_token}`;
    } else {
      headers["Authorization"] = `Bearer ${this.anonKey}`;
    }

    return headers;
  }

  // =========================================================================
  // SUPABASE AUTHENTICATION API
  // =========================================================================

  // 1. Social OAuth 2.0 (Google & Facebook)
  async signInWithOAuth(options) {
    const { provider, redirectTo } = options;
    const finalRedirect = redirectTo || `${window.location.origin}/auth/callback`;

    if (!this.isConfigured) {
      console.warn(`[SupabaseAuth] Remote Supabase not configured yet for ${provider}. Simulating flow.`);
      return {
        data: {
          provider,
          url: `${this.url}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(finalRedirect)}`
        },
        error: null
      };
    }

    const authUrl = `${this.url}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(finalRedirect)}`;
    window.location.href = authUrl;
    return { data: { url: authUrl }, error: null };
  }

  // 2. Email & Password Sign In
  async signInWithPassword(credentials) {
    const { email, password } = credentials;

    if (!this.isConfigured) {
      // Local fallback / mock validation
      return {
        data: {
          user: { id: "usr_mock", email, user_metadata: { full_name: email.split("@")[0] } },
          session: { access_token: "mock_jwt_token", user: { id: "usr_mock", email } }
        },
        error: null
      };
    }

    try {
      const res = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: this.getHeaders(false),
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      const data = await res.json();
      if (!res.ok) {
        const errorDesc = data.error_description || data.msg || data.message || "Errore di accesso";
        const errorCode = data.error_code || data.code || data.error || "";
        const itDesc = translateSupabaseMessage(errorDesc, errorCode, "login");
        const err = new Error(itDesc);
        err.code = errorCode;
        err.rawMessage = errorDesc;
        err.status = res.status;
        err.raw = data;
        return { data: null, error: err };
      }

      this.session = data;
      localStorage.setItem("barpilot_supabase_session", JSON.stringify(data));
      return { data: { user: data.user, session: data }, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // 3. Email & Password Sign Up (Registration)
  async signUp(credentials) {
    const { email, password, options } = credentials;

    if (!this.isConfigured) {
      return {
        data: {
          user: { id: "usr_" + Date.now(), email, user_metadata: options?.data || {} },
          session: null
        },
        error: null
      };
    }

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password,
        data: {
          locale: "it",
          lang: "it",
          language: "it",
          ...(options?.data || {})
        }
      };

      const res = await fetch(`${this.url}/auth/v1/signup`, {
        method: "POST",
        headers: this.getHeaders(false),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        const errorDesc = data.error_description || data.msg || data.message || "Errore di registrazione";
        const errorCode = data.error_code || data.code || data.error || "";
        const itDesc = translateSupabaseMessage(errorDesc, errorCode, "signup");
        const err = new Error(itDesc);
        err.code = errorCode;
        err.rawMessage = errorDesc;
        err.status = res.status;
        err.raw = data;
        return { data: null, error: err };
      }

      // Supabase restituisce un array 'identities' vuoto se l'utente risulta già registrato
      const userIdentities = data?.user?.identities || data?.identities;
      if (Array.isArray(userIdentities) && userIdentities.length === 0) {
        const itDesc = translateSupabaseMessage("User already registered", "user_already_exists", "signup");
        const err = new Error(itDesc);
        err.code = "user_already_exists";
        err.rawMessage = "User already registered";
        err.status = 400;
        return { data: null, error: err };
      }

      if (data.access_token) {
        this.session = data;
        localStorage.setItem("barpilot_supabase_session", JSON.stringify(data));
      }

      return { data: { user: data.user || data, session: data.access_token ? data : null }, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // 4. Resend Confirmation Email
  async resendConfirmationEmail(email) {
    if (!this.isConfigured) return { data: {}, error: null };
    try {
      const res = await fetch(`${this.url}/auth/v1/resend`, {
        method: "POST",
        headers: this.getHeaders(false),
        body: JSON.stringify({
          type: "signup",
          email: email.trim().toLowerCase(),
          options: {
            email_redirect_to: `${window.location.origin}/index.html`
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        const errorDesc = data.error_description || data.msg || data.message || "Errore invio email di conferma";
        const errorCode = data.error_code || data.code || "";
        const itDesc = translateSupabaseMessage(errorDesc, errorCode, "resend");
        const err = new Error(itDesc);
        err.code = errorCode;
        err.rawMessage = errorDesc;
        err.status = res.status;
        return { data: null, error: err };
      }
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // 5. Verify OTP Code
  async verifyOtp(email, token, type = "signup") {
    if (!this.isConfigured) return { data: {}, error: null };
    try {
      const res = await fetch(`${this.url}/auth/v1/verify`, {
        method: "POST",
        headers: this.getHeaders(false),
        body: JSON.stringify({
          type,
          token: token.trim(),
          email: email.trim().toLowerCase()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        const errorDesc = data.error_description || data.msg || data.message || "Codice di verifica non valido";
        const errorCode = data.error_code || data.code || "";
        const itDesc = translateSupabaseMessage(errorDesc, errorCode, "verify");
        const err = new Error(itDesc);
        err.code = errorCode;
        err.rawMessage = errorDesc;
        return { data: null, error: err };
      }
      if (data.access_token) {
        this.session = data;
        localStorage.setItem("barpilot_supabase_session", JSON.stringify(data));
      }
      return { data: { user: data.user, session: data }, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // 6. Password Recovery Request
  async resetPasswordForEmail(email, options = {}) {
    if (!this.isConfigured) {
      return { data: {}, error: null };
    }

    try {
      const res = await fetch(`${this.url}/auth/v1/recover`, {
        method: "POST",
        headers: this.getHeaders(false),
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          redirect_to: options.redirectTo || `${window.location.origin}/index.html`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        const rawMsg = data.message || data.msg || data.error_description || "Errore invio email di recupero";
        const itDesc = translateSupabaseMessage(rawMsg, data.code || data.error_code || "", "recovery");
        const err = new Error(itDesc);
        err.rawMessage = rawMsg;
        return { data: null, error: err };
      }
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // 7. Update Password
  async updateUser(updates) {
    if (!this.session?.access_token) {
      return { data: null, error: new Error("Nessuna sessione attiva") };
    }

    try {
      const res = await fetch(`${this.url}/auth/v1/user`, {
        method: "PUT",
        headers: this.getHeaders(true),
        body: JSON.stringify(updates)
      });

      const data = await res.json();
      if (!res.ok) {
        const rawMsg = data.message || data.msg || data.error_description || "Errore aggiornamento utente";
        const itDesc = translateSupabaseMessage(rawMsg, data.code || "", "update");
        const err = new Error(itDesc);
        err.rawMessage = rawMsg;
        return { data: null, error: err };
      }
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // 6. Sign Out
  async signOut() {
    if (this.isConfigured && this.session?.access_token) {
      try {
        await fetch(`${this.url}/auth/v1/logout`, {
          method: "POST",
          headers: this.getHeaders(true)
        });
      } catch (e) {}
    }

    this.session = null;
    localStorage.removeItem("barpilot_supabase_session");
    localStorage.removeItem("barpilot_is_logged_in");
    localStorage.removeItem("barpilot_logged_user");
    localStorage.removeItem("barpilot_active_staff");
    return { error: null };
  }

  // 7. Get Current User & Session
  async getUser() {
    if (!this.session?.access_token) {
      return { data: { user: null }, error: null };
    }

    try {
      const res = await fetch(`${this.url}/auth/v1/user`, {
        headers: this.getHeaders(true)
      });
      const user = await res.json();
      if (!res.ok) return { data: { user: null }, error: new Error("Token scaduto") };
      return { data: { user }, error: null };
    } catch (err) {
      return { data: { user: null }, error: err };
    }
  }

  getSession() {
    return { data: { session: this.session }, error: null };
  }

  // =========================================================================
  // MULTI-TENANT DATABASE API (ORGANIZATIONS, LOCATIONS, MEMBERSHIPS, ORDERS)
  // =========================================================================

  // Fetch orders
  async getOrders(locationId) {
    if (!this.isConfigured) return window.db.get("orders") || [];
    try {
      const res = await fetch(`${this.url}/rest/v1/orders?location_id=eq.${locationId}&select=*,order_items(*)`, {
        headers: this.getHeaders(true)
      });
      if (!res.ok) throw new Error("HTTP error " + res.status);
      return await res.json();
    } catch (e) {
      return window.db.get("orders") || [];
    }
  }

  // Create order
  async createOrder(orderPayload) {
    if (!this.isConfigured) return { success: true, local: true };
    try {
      const res = await fetch(`${this.url}/rest/v1/orders`, {
        method: "POST",
        headers: this.getHeaders(true),
        body: JSON.stringify(orderPayload)
      });
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  }

  // Update order status (KDS)
  async updateOrderStatus(orderId, status) {
    if (!this.isConfigured) return { success: true };
    try {
      const res = await fetch(`${this.url}/rest/v1/orders?id=eq.${orderId}`, {
        method: "PATCH",
        headers: this.getHeaders(true),
        body: JSON.stringify({ status, updated_at: new Date().toISOString() })
      });
      return await res.json();
    } catch (e) {}
  }
}

// Global instance
window.supabase = new BarPilotSupabaseClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
window.supabase.auth = {
  signInWithOAuth: (opts) => window.supabase.signInWithOAuth(opts),
  signInWithPassword: (creds) => window.supabase.signInWithPassword(creds),
  signUp: (creds) => window.supabase.signUp(creds),
  resendConfirmationEmail: (email) => window.supabase.resendConfirmationEmail(email),
  verifyOtp: (opts) => window.supabase.verifyOtp(opts?.email, opts?.token, opts?.type),
  resetPasswordForEmail: (email, opts) => window.supabase.resetPasswordForEmail(email, opts),
  updateUser: (updates) => window.supabase.updateUser(updates),
  signOut: () => window.supabase.signOut(),
  getUser: () => window.supabase.getUser(),
  getSession: () => window.supabase.getSession()
};
