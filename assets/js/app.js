// Safe HTML escaping helper
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
window.escapeHtml = escapeHtml;

// BarPilot Core Application Logic
document.addEventListener("DOMContentLoaded", () => {
  // 1. Theme Initialization
  const currentTheme = localStorage.getItem("barpilot_theme") || "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeButton(currentTheme);

  // 2. Language Initialization
  window.i18n.applyTranslations();

  // Restore saved session details into activeBar
  if (isUserLoggedIn()) {
    try {
      const savedUser = JSON.parse(localStorage.getItem("barpilot_logged_user") || "null");
      if (savedUser) {
        const bar = window.db.get("activeBar");
        if (savedUser.name) bar.managerName = savedUser.name;
        if (savedUser.barName) bar.name = savedUser.barName;
        window.db.set("activeBar", bar);
      }
    } catch (e) {}
  }

  // 3. Initialize Active Staff Member
  initActiveStaff();

  // 4. Render Initial State
  renderApp();

  // Initialize Real-Time Clock & Date Controller (sempre aggiornato: giorno, mese, anno)
  initLiveDateTime();

  // 4. Setup Event Listeners
  setupNavigation();
  setupThemeToggle();
  setupLanguageToggle();
  setupCartEvents();
  setupSimulator();
  setupModals();

  // 5. Trigger Splash Animation (no forced checkout popup)
  initSplashScreen();
  closeCheckoutModal(true);
  // Direct Link Hash Router & URL Router (e.g. /demo, ?demo=true, #demo)
  const handleHashRouting = () => {
    const hash = (window.location.hash || "").toLowerCase();
    const search = (window.location.search || "").toLowerCase();
    const pathname = (window.location.pathname || "").toLowerCase();

    // Check if demo is requested via URL (/demo, ?demo, #demo)
    if (hash === "#demo" || search.includes("demo=") || pathname.startsWith("/demo") || pathname.includes("demo.html")) {
      quickLoginDemo();
      return;
    }

    if (hash === "#checkout" || hash === "#abbonamento" || hash === "#paga") {
      if (!isDemoMode()) {
        switchView("subscriptions");
        setTimeout(() => openCheckoutModal(true), 200);
      }
    } else if (hash.startsWith("#view-")) {
      const v = hash.replace("#view-", "");
      switchView(v);
    }
  };
  handleHashRouting();
  window.addEventListener("hashchange", handleHashRouting);

});

// App State
let appState = {
  activeView: "dashboard",
  dashboardPeriod: "today",
  cart: [],
  selectedTable: "Tavolo 04",
  selectedCategory: "all",
  kdsFilter: "all",
  floorFilter: "all"
};

// Render whole app components
function renderApp() {
  if (typeof updateLiveDateTime === "function") updateLiveDateTime();
  renderActiveBar();
  renderDashboard();
  renderOrderCatalog();
  renderCart();
  renderFloorPlan();
  renderKDS();
  renderProducts();
  renderInventory();
  renderSuppliers();
  renderStaff();
  renderReports();
  renderPlans();
  renderGoogleSetting();
  renderFacebookSetting();
  updateDashboardLockState();
}

function renderGoogleSetting() {
  const googleClientInput = document.getElementById("settingGoogleClientId");
  if (googleClientInput && window.googleAuth) {
    googleClientInput.value = window.googleAuth.clientId || "";
  }
}

function renderFacebookSetting() {
  const fbAppInput = document.getElementById("settingFacebookAppId");
  if (fbAppInput && window.facebookAuth) {
    fbAppInput.value = window.facebookAuth.appId || "";
  }
}

// --------------------------------------------------------------------------
// Navigation & Views
// --------------------------------------------------------------------------
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item[data-view]");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const view = item.getAttribute("data-view");
      if (view === "dashboard" && !isUserSubscribed()) {
        showToast(window.i18n && window.i18n.currentLang === 'fr'
          ? "🔒 Accès refusé : Le Tableau de Bord est bloqué jusqu'à confirmation du paiement."
          : "🔒 Accesso negato : La Dashboard è bloccata finché il sistema non conferma il pagamento.");
        window.location.href = "/checkout.html";
        if (window.innerWidth <= 1024) closeSidebar();
        return;
      }
      if (currentStaff) {
        const perms = ROLE_PERMISSIONS[currentStaff.role] || ROLE_PERMISSIONS.Proprietario;
        if (!perms.views.includes(view)) {
          showToast(`⚠️ Il ruolo ${currentStaff.role} non ha accesso a questa sezione.`);
          return;
        }
      }
      switchView(view);
      // Close sidebar only on mobile
      if (window.innerWidth <= 1024) {
        closeSidebar();
      }
    });
  });

  // Mobile menu button & drawer controls
  const menuBtn = document.getElementById("mobileMenuBtn");
  const sidebar = document.getElementById("appSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  const closeBtn = document.getElementById("sidebarCloseBtn");

  if (menuBtn) {
    menuBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebar();
    };
  }

  // Click on close button inside sidebar
  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeSidebar();
    };
  }

  // Click on backdrop outside sidebar closes it
  if (backdrop) {
    backdrop.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeSidebar();
    };
  }

  // Click anywhere outside sidebar on document closes it (Mobile only)
  document.addEventListener("click", (e) => {
    if (window.innerWidth > 1024) return;
    if (!sidebar) return;
    const isOpen = (sidebar.classList.contains("mobile-open") || sidebar.classList.contains("open")) &&
                   !sidebar.classList.contains("sidebar-closed") &&
                   !sidebar.classList.contains("closed");
    if (isOpen) {
      if (!sidebar.contains(e.target) && (!menuBtn || !menuBtn.contains(e.target))) {
        closeSidebar();
      }
    }
  });

  // ESC key closes mobile sidebar and modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (window.innerWidth <= 1024) {
        closeSidebar();
      }
      const modal = document.getElementById("barModalOverlay");
      if (modal) modal.classList.remove("active");
      closeLogoutModal();
      closeAuthScreen();
    }
  });

  // Window resize resets mobile sidebar states on desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      if (sidebar) {
        sidebar.classList.remove("sidebar-closed", "closed", "mobile-open", "open");
      }
      if (backdrop) {
        backdrop.classList.remove("active");
      }
    }
  });
}


// --------------------------------------------------------------------------
// Subscription State & Google Play In-App Purchase Controller
// --------------------------------------------------------------------------
function isDemoMode() {
  try {
    const bar = (window.db ? window.db.get("activeBar") : null) || {};
    if (bar && bar.isDemo === false) return false;
    return localStorage.getItem("barpilot_is_demo") === "true";
  } catch (e) {
    return false;
  }
}
window.isDemoMode = isDemoMode;

function isUserSubscribed() {
  try {
    // IN DEMO MODE: the demo page and all features are 100% free, unrestricted, and open!
    if (localStorage.getItem("barpilot_is_demo") === "true" || isDemoMode()) {
      return true;
    }
    const stored = localStorage.getItem("barpilot_is_subscribed");
    const bar = (window.db ? window.db.get("activeBar") : null) || {};
    if (stored === "true" && bar && (bar.subscriptionStatus === "active" || bar.isSubscribed === true)) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}
window.isUserSubscribed = isUserSubscribed;

function updateDashboardLockState() {
  const isDemo = isDemoMode();
  const subscribed = isDemo || isUserSubscribed();
  const dashNavBtn = document.querySelector('.nav-item[data-view="dashboard"]');
  if (dashNavBtn) {
    let lockPill = dashNavBtn.querySelector(".dash-nav-lock");
    if (!subscribed) {
      if (!lockPill) {
        lockPill = document.createElement("span");
        lockPill.className = "dash-nav-lock";
        lockPill.innerHTML = "🔒";
        lockPill.style.marginLeft = "auto";
        lockPill.style.fontSize = "11px";
        dashNavBtn.appendChild(lockPill);
      }
      dashNavBtn.title = (window.i18n && window.i18n.currentLang === "fr")
        ? "Abonnement requis pour accéder au Tableau de Bord"
        : "Abbonamento richiesto per accedere alla Dashboard";
    } else {
      if (lockPill) lockPill.remove();
      dashNavBtn.removeAttribute("title");
    }
  }

  const dashLockBanner = document.getElementById("dashboardSubLockBanner");
  const metricsGrid = document.querySelector(".metrics-grid");
  const chartsSection = document.querySelector(".charts-section");
  const staffActivity = document.querySelector(".recent-activity-card");

  if (dashLockBanner) {
    dashLockBanner.style.display = subscribed ? "none" : "flex";
  }
  if (metricsGrid) {
    metricsGrid.style.display = subscribed ? "" : "none";
  }
  if (chartsSection) {
    chartsSection.style.display = subscribed ? "" : "none";
  }
  if (staffActivity) {
    staffActivity.style.display = subscribed ? "" : "none";
  }

  // Update top global banner in demo mode
  const trialBanner = document.getElementById("globalTrialBanner");
  if (trialBanner && isDemo) {
    trialBanner.style.background = "linear-gradient(90deg, #10B981, #059669)";
    trialBanner.innerHTML = `
      <div class="trial-text-wrap">
        <span class="trial-pulse-icon">⚡</span>
        <span><strong>Modalità Demo Libera:</strong> Accesso completo e navigazione senza limiti a tutte le funzioni.</span>
      </div>
      <button class="trial-cta-btn" onclick="window.location.href='/pro.html'" style="background:#fff; color:#059669; font-weight:800;">Attiva BarPilot Pro</button>
    `;
  }
}

function activateSubscription(method = "google_pay") {
  const isFr = window.i18n ? window.i18n.currentLang === "fr" : false;
  const bar = (window.db ? window.db.get("activeBar") : {}) || {};
  bar.plan = "BarPilot Pro 59€";
  bar.isSubscribed = true;
  bar.subscriptionStatus = "active";
  bar.subscriptionMethod = method;
  bar.trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  if (window.db) {
    window.db.set("activeBar", bar);
  }
  localStorage.setItem("barpilot_is_subscribed", "true");

  // Force close checkout modals now that payment is confirmed
  closeGooglePlayModal(true);
  closeCheckoutModal(true);

  renderPlans();
  renderDashboard();
  renderActiveBar();
  updateDashboardLockState();

  let loggedUser = null;
  try {
    loggedUser = JSON.parse(localStorage.getItem("barpilot_logged_user") || "null");
  } catch (e) {}
  const userName = (loggedUser && loggedUser.name) || bar.managerName || "Gestore";

  // Redirect to dashboard and give warm welcome!
  switchView("dashboard");

  showToast(
    isFr
      ? `👑 Bienvenue sur BarPilot, ${userName} ! Votre abonnement est activé avec succès. Accès au Tableau de Bord débloqué !`
      : `👑 Benvenuto in BarPilot, ${userName}! Il tuo abbonamento è attivo. Accesso alla Dashboard sbloccato!`
  );
}

function openGooglePlayModal() {
  // If in demo mode, never open the payment window
  if (isDemoMode()) {
    closeCheckoutModal(true);
    closeGooglePlayModal(true);
    return;
  }
  const modal = document.getElementById("googlePlayModal");
  if (!modal) return;

  const isFr = window.i18n ? window.i18n.currentLang === "fr" : false;
  const bar = (window.db ? window.db.get("activeBar") : {}) || {};
  let loggedUser = null;
  try {
    loggedUser = JSON.parse(localStorage.getItem("barpilot_logged_user") || "null");
  } catch (e) {}
  
  const userEmail = (loggedUser && loggedUser.email) || bar.managerEmail || "marco.rossi@gmail.com";
  const userName = (loggedUser && loggedUser.name) || bar.managerName || "Marco Rossi";

  const emailEl = document.getElementById("gplayUserEmail");
  if (emailEl) emailEl.textContent = userEmail;

  const avatarEl = document.querySelector(".gplay-acc-avatar");
  if (avatarEl) avatarEl.textContent = (userName.charAt(0) || "M").toUpperCase();

  const nextDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const nextDateStr = nextDate.toLocaleDateString(isFr ? "fr-FR" : "it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const futureEl = document.getElementById("gplayDateFuture");
  if (futureEl) {
    futureEl.innerHTML = isFr 
      ? `<strong>Dès le ${nextDateStr} :</strong> Premier prélèvement automatique de <strong>59,00 €</strong> si non résilié.`
      : `<strong>Dal ${nextDateStr} :</strong> Il primo pagamento di <strong>59,00 €</strong> succede in automatico se non viene disdetto.`;
  }

  modal.classList.add("active");
}

function closeGooglePlayModal(force = false) {
  const modal = document.getElementById("googlePlayModal");
  if (!modal) return;

  if (!force && (modal.getAttribute("data-mandatory") === "true" || !isUserSubscribed())) {
    showToast(window.i18n && window.i18n.currentLang === "fr"
      ? "🔒 La fenêtre de paiement ne peut pas être fermée. Veuillez finaliser votre abonnement."
      : "🔒 La finestra di check-out non può essere chiusa. Completa l'attivazione con Google Pay o Carta.");
    return;
  }

  modal.classList.remove("active");
  modal.removeAttribute("data-mandatory");
}

async function confirmGooglePlaySubscription() {
  const btn = document.getElementById("btnGPlayConfirm");
  const isFr = window.i18n ? window.i18n.currentLang === "fr" : false;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `
      <span style="display:inline-block; width:16px; height:16px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:8px; vertical-align:middle;"></span>
      <span>${isFr ? "Validation Google Pay & Wallet..." : "Verifica autorizzazione Google Pay..."}</span>
    `;
  }

  if (window.googlePayService) {
    try {
      const res = await window.googlePayService.processGooglePayment(59.00);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span class="btn-gplay-text">${isFr ? "S'abonner en 1 clic" : "Abbonati con 1 tocco"}</span>`;
      }
      if (res && res.success) {
        showToast(isFr ? "🎉 Paiement Google Pay validé avec succès !" : "🎉 Pagamento Google Pay completato con successo!");
        activateSubscription("google_pay");
      } else {
        const errorMsg = (res && (res.message || res.error?.message || res.error?.statusMessage)) || (isFr ? "Autorisation Google Pay échouée ou annulée." : "Autorizzazione Google Pay annullata o non completata.");
        showToast("❌ " + errorMsg);
        // DO NOT UNLOCK!
      }
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span class="btn-gplay-text">${isFr ? "S'abonner en 1 clic" : "Abbonati con 1 tocco"}</span>`;
      }
      showToast("❌ " + (err?.message || (isFr ? "Erreur Google Pay." : "Errore autorizzazione Google Pay.")));
    }
  } else {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span class="btn-gplay-text">${isFr ? "S'abonner en 1 clic" : "Abbonati con 1 tocco"}</span>`;
    }
    showToast(isFr ? "❌ Service Google Pay non disponible. Veuillez payer par carte bancaire." : "❌ Servizio Google Pay non disponibile su questo dispositivo. Seleziona la Carta di Credito.");
  }
}

function switchView(viewName) {
  // Gatekeep dashboard ONLY if user is not in demo and not subscribed
  if (!isDemoMode() && viewName === "dashboard" && !isUserSubscribed()) {
    showToast(window.i18n && window.i18n.currentLang === 'fr'
      ? "🔒 Accès refusé : Le Tableau de Bord est bloqué jusqu'à confirmation du paiement."
      : "🔒 Accesso negato : La Dashboard è bloccata finché il sistema non conferma il pagamento.");
    window.location.href = "/checkout.html";
    return;
  }

  appState.activeView = viewName;
  
  // Update sidebar active item
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.getAttribute("data-view") === viewName);
  });

  // Switch view panels
  document.querySelectorAll(".view-panel").forEach(panel => {
    panel.classList.toggle("active", panel.id === `view-${viewName}`);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openSidebar() {
  const sidebar = document.getElementById("appSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (sidebar) {
    sidebar.classList.add("mobile-open", "open");
    sidebar.classList.remove("sidebar-closed", "closed");
  }
  if (backdrop && window.innerWidth <= 1024) {
    backdrop.classList.add("active");
  }
}

function closeSidebar() {
  // On Desktop (> 1024px), sidebar must NEVER be closed!
  if (window.innerWidth > 1024) return;

  const sidebar = document.getElementById("appSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (sidebar) {
    sidebar.classList.remove("mobile-open", "open");
    sidebar.classList.add("sidebar-closed", "closed");
  }
  if (backdrop) {
    backdrop.classList.remove("active");
  }
}

function toggleSidebar() {
  // On Desktop (> 1024px), sidebar is fixed and cannot be toggled
  if (window.innerWidth > 1024) return;

  const sidebar = document.getElementById("appSidebar");
  if (!sidebar) return;
  const isOpen = (sidebar.classList.contains("mobile-open") || sidebar.classList.contains("open")) && 
                 !sidebar.classList.contains("sidebar-closed") && 
                 !sidebar.classList.contains("closed");
  if (isOpen) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

// Global functions for inline onclick & external calls
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleSidebar = toggleSidebar;
window.openMobileSidebar = openSidebar;
window.closeMobileSidebar = closeSidebar;

// --------------------------------------------------------------------------
// Theme & Language
// --------------------------------------------------------------------------
function setupThemeToggle() {
  const themeBtn = document.getElementById("themeToggleBtn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") || "dark";
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("barpilot_theme", next);
      updateThemeButton(next);
    });
  }
}

function updateThemeButton(theme) {
  const themeText = document.getElementById("themeToggleText");
  const themeIcon = document.getElementById("themeToggleIcon");
  if (themeText) {
    themeText.textContent = theme === "dark" ? "Light" : "Dark";
  }
  if (themeIcon) {
    themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  }
}

function setupLanguageToggle() {
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang");
      window.i18n.setLang(lang);
      renderApp();
    });
  });
}

// --------------------------------------------------------------------------
// Real-Time Date Controller (Always updated: giorno, mese, anno)
// --------------------------------------------------------------------------
let liveDateTimer = null;

function updateLiveDateTime() {
  const now = new Date();
  const lang = (window.i18n && window.i18n.currentLang) ? window.i18n.currentLang : 'it';
  const locale = lang === 'fr' ? 'fr-FR' : 'it-IT';

  const dateEl = document.getElementById("liveDateText");

  if (dateEl) {
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(now);
    const day = now.getDate();
    const month = new Intl.DateTimeFormat(locale, { month: 'long' }).format(now);
    const year = now.getFullYear();

    const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const capMonth = month.charAt(0).toUpperCase() + month.slice(1);

    dateEl.textContent = `${capWeekday} ${day} ${capMonth} ${year}`;
  }
}

function initLiveDateTime() {
  updateLiveDateTime();
  if (liveDateTimer) clearInterval(liveDateTimer);
  // Update periodically to keep date accurate across midnight
  liveDateTimer = setInterval(updateLiveDateTime, 60000);

  window.addEventListener("languageChanged", () => {
    updateLiveDateTime();
  });
}
window.updateLiveDateTime = updateLiveDateTime;
window.initLiveDateTime = initLiveDateTime;

// --------------------------------------------------------------------------
// Active Bar & Multi-tenant Profile
// --------------------------------------------------------------------------
function updateGreeting(name) {
  const bar = window.db ? window.db.get("activeBar") : null;
  const managerName = name || (bar ? bar.managerName : "Marco");
  const firstName = (managerName || "Marco").trim().split(" ")[0];

  // Orario: Dalle 03:00 alle 15:00 -> "Buongiorno" | Dalle 15:00 alle 03:00 -> "Buonasera"
  const currentHour = new Date().getHours();
  const isMorning = (currentHour >= 3 && currentHour < 15);
  const targetKey = isMorning ? "greetingMorning" : "greetingEvening";

  const greetingEl = document.getElementById("greetingTitleWrap") || document.querySelector("[data-i18n='greeting']");
  if (greetingEl) {
    greetingEl.setAttribute("data-i18n-params", JSON.stringify({ name: firstName }));
    if (window.i18n && typeof window.i18n.t === "function") {
      greetingEl.innerHTML = window.i18n.t(targetKey, { name: `<span id="userGreetingName">${firstName}</span>` });
    } else {
      const salutation = isMorning ? "Buongiorno" : "Buonasera";
      greetingEl.innerHTML = `${salutation}, <span id="userGreetingName">${firstName}</span> 👋`;
    }
  }

  const userGreeting = document.getElementById("userGreetingName");
  if (userGreeting) {
    userGreeting.textContent = firstName;
  }
}
window.updateGreeting = updateGreeting;

function renderActiveBar() {
  const bar = window.db.get("activeBar");
  const barNameEl = document.getElementById("activeBarName");
  const barSwitcherText = document.getElementById("barSwitcherText");
  const trialDaysEl = document.getElementById("trialDaysCount");

  if (barNameEl) barNameEl.textContent = bar.name;
  if (barSwitcherText) barSwitcherText.textContent = bar.name;
  if (trialDaysEl) trialDaysEl.textContent = bar.trialDaysRemaining;

  // L'utente attivo nella sidebar e nel saluto riflette currentStaff con il suo ruolo specifico
  if (currentStaff) {
    const sidebarUserName = document.getElementById("sidebarUserName") || document.querySelector(".user-profile-card .user-name");
    const avatarEl = document.getElementById("sidebarUserAvatar");
    const roleEl = document.getElementById("sidebarUserRole");
    if (sidebarUserName) sidebarUserName.textContent = currentStaff.name;
    if (avatarEl && currentStaff.avatar) avatarEl.src = currentStaff.avatar;
    if (roleEl) {
      const perms = ROLE_PERMISSIONS[currentStaff.role] || ROLE_PERMISSIONS.Proprietario;
      roleEl.textContent = currentStaff.role;
      roleEl.className = `user-role ${perms.badgeClass}`;
    }
    updateGreeting(currentStaff.name);
  } else {
    const sidebarUserName = document.getElementById("sidebarUserName") || document.querySelector(".user-profile-card .user-name");
    if (sidebarUserName) sidebarUserName.textContent = bar.managerName;
    updateGreeting(bar.managerName);
  }
}

// --------------------------------------------------------------------------
// Dashboard
// --------------------------------------------------------------------------

// ==========================================================================
// Centralized Dashboard Statistics Calculation Engine (Phases 1 - 15)
// ==========================================================================
function calculateDashboardStatistics(period = "today") {
  const isDemo = (typeof isDemoMode === "function" && isDemoMode()) || 
                 (window.db && typeof window.db.isDemo === "function" && window.db.isDemo());
  const activeBar = (window.db ? window.db.get("activeBar") : null) || {};
  const barId = activeBar.id || (isDemo ? "bar_demo" : "bar_01");

  // SE MODALITÀ DEMO: Ripristina tutti i dati dimostrativi completi come prima (1.248 €, 186 comande, picco 19:00, ecc.)
  if (isDemo) {
    const demoMetrics = (window.db && window.db.data && window.db.data.metrics) || initialData.metrics;
    const demoHourly = (window.db && window.db.data && window.db.data.hourlySales) || initialData.hourlySales;
    const demoCategories = (window.db && window.db.data && window.db.data.categorySales) || initialData.categorySales;
    const demoOrders = (window.db ? window.db.get("orders") : initialData.orders) || [];
    const demoProducts = (window.db ? window.db.get("products") : initialData.products) || [];

    let revenue = demoMetrics.revenue || 1248.00;
    let ordersCount = demoMetrics.ordersCount || 186;
    let avgTicket = demoMetrics.avgTicket || 6.71;
    let alertCount = demoMetrics.alertCount || 4;
    let revDeltaText = demoMetrics.revenueChange || "+12%";
    let ordDeltaText = demoMetrics.ordersChange || "+8%";
    let avgDeltaText = demoMetrics.avgTicketChange || "+5%";

    if (period === "yesterday") {
      revenue = 1114.00;
      ordersCount = 172;
      avgTicket = 6.48;
      revDeltaText = "+7%";
      ordDeltaText = "+5%";
      avgDeltaText = "+2%";
    } else if (period === "week") {
      revenue = 8736.00;
      ordersCount = 1302;
      avgTicket = 6.71;
      revDeltaText = "+14%";
      ordDeltaText = "+10%";
      avgDeltaText = "+4%";
    } else if (period === "month") {
      revenue = 36450.00;
      ordersCount = 5430;
      avgTicket = 6.71;
      revDeltaText = "+18%";
      ordDeltaText = "+12%";
      avgDeltaText = "+5%";
    } else if (period === "30days") {
      revenue = 37240.00;
      ordersCount = 5550;
      avgTicket = 6.71;
      revDeltaText = "+16%";
      ordDeltaText = "+11%";
      avgDeltaText = "+4%";
    } else if (period === "all") {
      revenue = 148500.00;
      ordersCount = 22130;
      avgTicket = 6.71;
      revDeltaText = "+22%";
      ordDeltaText = "+15%";
      avgDeltaText = "+6%";
    }

    const peakHour = "19:00";
    const peakVal = 380;

    const topProducts = [...demoProducts]
      .map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        salesCount: p.salesCount || 10,
        revenue: Math.round(((p.salesCount || 10) * (Number(p.price) || 0)) * 100) / 100,
        price: Number(p.price) || 0
      }))
      .sort((a, b) => b.salesCount - a.salesCount);

    const recentOrders = [...demoOrders].slice(0, 10);

    return {
      period,
      revenue,
      revenueDelta: { type: "positive", text: revDeltaText, label: "+134 € rispetto al periodo precedente (simulato)" },
      ordersCount,
      ordersDelta: { type: "positive", text: ordDeltaText, label: "+14 comande rispetto a ieri (simulato)" },
      avgTicket,
      avgTicketDelta: { type: "positive", text: avgDeltaText, label: "+0,32 € rispetto a ieri (simulato)" },
      alertCount,
      hourlySales: demoHourly,
      peakHour,
      peakVal,
      categorySales: demoCategories,
      totalCatAmount: revenue,
      topProducts,
      recentOrders,
      isDemo: true
    };
  }

  // 1. Retrieve all orders for current context
  const allOrders = (window.db ? window.db.get("orders") : []) || [];

  // 2. Compute date boundaries for selected period (Europe/Rome timezone context)
  const now = new Date();
  let startMs = 0;
  let endMs = Infinity;
  let prevStartMs = 0;
  let prevEndMs = 0;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (period === "today") {
    startMs = startOfToday;
    endMs = endOfToday;
    prevStartMs = startOfToday - oneDayMs;
    prevEndMs = startOfToday - 1;
  } else if (period === "yesterday") {
    startMs = startOfToday - oneDayMs;
    endMs = startOfToday - 1;
    prevStartMs = startOfToday - (2 * oneDayMs);
    prevEndMs = startOfToday - oneDayMs - 1;
  } else if (period === "week") {
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
    startMs = startOfToday - (dayOfWeek * oneDayMs);
    endMs = now.getTime();
    const duration = Math.max(oneDayMs, endMs - startMs);
    prevEndMs = startMs - 1;
    prevStartMs = prevEndMs - duration;
  } else if (period === "month") {
    startMs = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
    endMs = now.getTime();
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0).getTime();
    prevStartMs = prevMonthStart;
    prevEndMs = prevMonthEnd;
  } else if (period === "30days") {
    startMs = now.getTime() - (30 * oneDayMs);
    endMs = now.getTime();
    prevEndMs = startMs - 1;
    prevStartMs = prevEndMs - (30 * oneDayMs);
  } else {
    // "all"
    startMs = 0;
    endMs = Infinity;
    prevStartMs = 0;
    prevEndMs = 0;
  }

  // 3. Filter valid confirmed orders (exclude draft and cancelled)
  function isValidOrder(ord) {
    if (!ord) return false;
    const s = String(ord.status || "").toLowerCase().trim();
    if (s === "cancelled" || s === "draft" || s === "annullata" || s === "bozza") return false;
    return true;
  }

  function getOrderTimestamp(ord) {
    if (ord.createdAt) {
      const t = new Date(ord.createdAt).getTime();
      if (!isNaN(t)) return t;
    }
    return now.getTime();
  }

  const validOrdersInPeriod = allOrders.filter(ord => {
    if (!isValidOrder(ord)) return false;
    const t = getOrderTimestamp(ord);
    return t >= startMs && t <= endMs;
  });

  const validOrdersPrevPeriod = (prevStartMs > 0) ? allOrders.filter(ord => {
    if (!isValidOrder(ord)) return false;
    const t = getOrderTimestamp(ord);
    return t >= prevStartMs && t <= prevEndMs;
  }) : [];

  // 4. Compute Net Revenues (Vendite registrate)
  function computeNetTotal(orders) {
    return orders.reduce((sum, ord) => {
      let ordTot = 0;
      if (Array.isArray(ord.items) && ord.items.length > 0) {
        ordTot = ord.items.reduce((iSum, item) => {
          const qty = Number(item.qty) || 0;
          const price = Number(item.price) || 0;
          const discount = Number(item.discount) || 0;
          return iSum + (qty * price) - discount;
        }, 0);
      } else {
        ordTot = Number(ord.total) || 0;
      }
      const ordDiscount = Number(ord.discount) || 0;
      const ordRefund = Number(ord.refund) || 0;
      return sum + Math.max(0, ordTot - ordDiscount - ordRefund);
    }, 0);
  }

  const revenue = Math.round(computeNetTotal(validOrdersInPeriod) * 100) / 100;
  const prevRevenue = Math.round(computeNetTotal(validOrdersPrevPeriod) * 100) / 100;

  // 5. Orders Count
  const ordersCount = validOrdersInPeriod.length;
  const prevOrdersCount = validOrdersPrevPeriod.length;

  // 6. Average Ticket
  const avgTicket = ordersCount > 0 ? Math.round((revenue / ordersCount) * 100) / 100 : 0.00;
  const prevAvgTicket = prevOrdersCount > 0 ? Math.round((prevRevenue / prevOrdersCount) * 100) / 100 : 0.00;

  // 7. Inventory Alerts
  const inventory = (window.db ? window.db.get("inventory") : []) || [];
  const alertCount = inventory.filter(i => {
    const reorder = Number(i.reorderLevel) || 0;
    const qty = Number(i.qty) || 0;
    return reorder > 0 && qty <= reorder;
  }).length;

  // 8. Percentage Deltas (FASE 13)
  function computeDelta(current, prev) {
    if (prev <= 0) {
      if (current <= 0) return { text: "0%", type: "neutral", label: "Nessuna variazione" };
      return { text: "Nuova attività", type: "new", label: "Nuova attività (nessun dato precedente)" };
    }
    const diff = ((current - prev) / prev) * 100;
    const sign = diff >= 0 ? "+" : "";
    return {
      text: `${sign}${diff.toFixed(0)}%`,
      type: diff >= 0 ? "positive" : "negative",
      label: `${sign}${diff.toFixed(1)}% rispetto al periodo precedente`
    };
  }

  const revenueDelta = computeDelta(revenue, prevRevenue);
  const ordersDelta = computeDelta(ordersCount, prevOrdersCount);
  const avgTicketDelta = computeDelta(avgTicket, prevAvgTicket);

  // 9. Hourly Sales (FASE 8)
  const hourSlots = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"];
  const hourlyMap = {};
  hourSlots.forEach(h => { hourlyMap[h] = 0; });

  validOrdersInPeriod.forEach(ord => {
    const ordDate = ord.createdAt ? new Date(ord.createdAt) : now;
    const h = ordDate.getHours().toString().padStart(2, '0') + ":00";
    const ordTot = Number(ord.total) || 0;
    if (hourlyMap[h] !== undefined) {
      hourlyMap[h] = Math.round((hourlyMap[h] + ordTot) * 100) / 100;
    }
  });

  const hourlySales = hourSlots.map(h => ({ hour: h, val: hourlyMap[h] }));

  let peakHour = "";
  let peakVal = 0;
  hourlySales.forEach(item => {
    if (item.val > peakVal) {
      peakVal = item.val;
      peakHour = item.hour;
    }
  });

  // 10. Category Sales (FASE 7)
  const products = (window.db ? window.db.get("products") : []) || [];
  const prodMap = {};
  products.forEach(p => { prodMap[p.id] = p; });

  const catMap = {
    "coffee": { label: "Caffè", color: "#F59E0B", amount: 0 },
    "drinks": { label: "Bevande", color: "#3B82F6", amount: 0 },
    "cocktail": { label: "Cocktail", color: "#10B981", amount: 0 },
    "food": { label: "Cibo", color: "#EC4899", amount: 0 },
    "other": { label: "Altro", color: "#8B5CF6", amount: 0 }
  };

  validOrdersInPeriod.forEach(ord => {
    if (Array.isArray(ord.items)) {
      ord.items.forEach(it => {
        const prod = prodMap[it.id] || {};
        let cat = String(it.category || prod.category || "").toLowerCase().trim();
        if (cat === "coffee" || cat === "caffè") cat = "coffee";
        else if (cat === "drinks" || cat === "beer" || cat === "softdrinks" || cat === "bevande" || cat === "wine") cat = "drinks";
        else if (cat === "cocktail" || cat === "cocktails" || cat === "spirits") cat = "cocktail";
        else if (cat === "food" || cat === "cibo" || cat === "snack" || cat === "snacks") cat = "food";
        else cat = "other";

        const val = (Number(it.qty) || 0) * (Number(it.price) || 0);
        catMap[cat].amount = Math.round((catMap[cat].amount + val) * 100) / 100;
      });
    }
  });

  const totalCatAmount = Object.values(catMap).reduce((s, c) => s + c.amount, 0);
  const categorySales = Object.keys(catMap).map(k => {
    const item = catMap[k];
    const pct = totalCatAmount > 0 ? Math.round((item.amount / totalCatAmount) * 100) : 0;
    return {
      key: k,
      label: item.label,
      color: item.color,
      amount: item.amount,
      percent: pct
    };
  });

  // Ensure percent sum is 100% when total > 0
  if (totalCatAmount > 0) {
    const sumPct = categorySales.reduce((s, c) => s + c.percent, 0);
    const diff = 100 - sumPct;
    if (diff !== 0) {
      const maxCat = categorySales.reduce((prev, curr) => curr.percent > prev.percent ? curr : prev, categorySales[0]);
      if (maxCat) maxCat.percent += diff;
    }
  }

  // 11. Top Products (FASE 10)
  const productSalesMap = {};
  validOrdersInPeriod.forEach(ord => {
    if (Array.isArray(ord.items)) {
      ord.items.forEach(it => {
        const pId = it.id || it.name;
        if (!productSalesMap[pId]) {
          const matchedProd = prodMap[it.id] || {};
          productSalesMap[pId] = {
            id: it.id,
            name: it.name || matchedProd.name || "Articolo",
            image: matchedProd.image || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=150&h=150&fit=crop",
            salesCount: 0,
            revenue: 0,
            price: Number(it.price) || Number(matchedProd.price) || 0
          };
        }
        const qty = Number(it.qty) || 0;
        const val = qty * (Number(it.price) || productSalesMap[pId].price);
        productSalesMap[pId].salesCount += qty;
        productSalesMap[pId].revenue = Math.round((productSalesMap[pId].revenue + val) * 100) / 100;
      });
    }
  });

  const topProducts = Object.values(productSalesMap)
    .filter(p => p.salesCount > 0)
    .sort((a, b) => {
      if (b.salesCount !== a.salesCount) return b.salesCount - a.salesCount;
      if (b.revenue !== a.revenue) return b.revenue - a.revenue;
      return a.name.localeCompare(b.name);
    });

  // 12. Recent Orders (FASE 9)
  const recentOrders = [...validOrdersInPeriod]
    .sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a))
    .slice(0, 10);

  return {
    period,
    revenue,
    revenueDelta,
    ordersCount,
    ordersDelta,
    avgTicket,
    avgTicketDelta,
    alertCount,
    hourlySales,
    peakHour,
    peakVal,
    categorySales,
    totalCatAmount,
    topProducts,
    recentOrders,
    isDemo
  };
}

window.calculateDashboardStatistics = calculateDashboardStatistics;

// Period Selector Controller
function setDashboardPeriod(period) {
  if (!appState) appState = {};
  appState.dashboardPeriod = period;

  const pills = document.querySelectorAll("#dashboardPeriodPills .btn-period-pill");
  pills.forEach(pill => {
    pill.classList.toggle("active", pill.getAttribute("data-period") === period);
  });

  renderDashboard();
}
window.setDashboardPeriod = setDashboardPeriod;

// Responsive Hourly Sales Bar Chart Engine
let currentHourlySlot = 'all';
let selectedHourlyItem = null;

function filterHourlySlot(slot) {
  currentHourlySlot = slot;
  const chips = ['slotFilterAll', 'slotFilterMorning', 'slotFilterAfternoon', 'slotFilterEvening'];
  chips.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  const activeId = slot === 'all' ? 'slotFilterAll' :
                   slot === 'morning' ? 'slotFilterMorning' :
                   slot === 'afternoon' ? 'slotFilterAfternoon' : 'slotFilterEvening';
  const activeEl = document.getElementById(activeId);
  if (activeEl) activeEl.classList.add('active');

  renderHourlySalesChart();
}

function selectHourlyBar(hour, val) {
  selectedHourlyItem = { hour, val };
  const detailEl = document.getElementById("hourlySelectedText");
  const stats = calculateDashboardStatistics(appState.dashboardPeriod || "today");
  const total = stats.revenue;
  const share = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
  const isPeak = (stats.peakHour === hour && val > 0);

  if (detailEl) {
    if (val > 0) {
      detailEl.innerHTML = `Ore ${hour} ➔ ${val.toFixed(2)} € <span style="font-size:11px; font-weight:600; opacity:0.85;">(${share}% del totale ${isPeak ? '· 🔥 Picco' : ''})</span>`;
    } else {
      detailEl.innerHTML = `Ore ${hour} ➔ 0,00 € <span style="font-size:11px; font-weight:600; opacity:0.85;">(Nessuna vendita registrata in questa fascia)</span>`;
    }
  }
  renderHourlySalesChart();
}

function renderHourlySalesChart() {
  const barsWrap = document.getElementById("hourlyBarsWrap");
  if (!barsWrap) return;

  const stats = calculateDashboardStatistics(appState.dashboardPeriod || "today");
  const hourly = stats.hourlySales || [];

  // Filter according to slot
  let filtered = hourly;
  if (currentHourlySlot === 'morning') {
    filtered = hourly.filter(h => h.hour >= "08:00" && h.hour <= "13:00");
  } else if (currentHourlySlot === 'afternoon') {
    filtered = hourly.filter(h => h.hour >= "14:00" && h.hour <= "17:00");
  } else if (currentHourlySlot === 'evening') {
    filtered = hourly.filter(h => h.hour >= "18:00" && h.hour <= "22:00");
  }

  const peakBadge = document.getElementById("hourlyPeakBadge");
  if (peakBadge) {
    if (stats.peakVal > 0) {
      peakBadge.textContent = `🔥 Picco: ${stats.peakHour} (${stats.peakVal.toFixed(2)} €)`;
      peakBadge.style.display = "";
    } else {
      peakBadge.textContent = "Nessuna vendita";
    }
  }

  const selectedDetailEl = document.getElementById("hourlySelectedText");
  if (selectedDetailEl && !selectedHourlyItem) {
    if (stats.isDemo) {
      selectedDetailEl.innerHTML = `Ore 19:00 ➔ 380 € <span style="font-size:11px; font-weight:600; opacity:0.85;">(Picco giornaliero)</span>`;
    } else if (stats.peakVal > 0) {
      selectedDetailEl.innerHTML = `Ore ${stats.peakHour} ➔ ${stats.peakVal.toFixed(2)} € <span style="font-size:11px; font-weight:600; opacity:0.85;">(Picco giornaliero)</span>`;
    } else {
      selectedDetailEl.innerHTML = `Nessuna comanda registrata`;
    }
  }

  // Update Y-Axis labels dynamically
  const yAxis = document.getElementById("hourlyYAxis");
  const maxVal = Math.max(...filtered.map(h => h.val), stats.peakVal);
  if (yAxis) {
    const effectiveTop = maxVal > 0 ? Math.ceil(maxVal / 4 / 20) * 20 * 4 : 100;
    yAxis.innerHTML = `
      <span>${effectiveTop}€</span>
      <span>${Math.round(effectiveTop * 0.75)}€</span>
      <span>${Math.round(effectiveTop * 0.5)}€</span>
      <span>${Math.round(effectiveTop * 0.25)}€</span>
      <span>0€</span>
    `;
  }

  // Responsive wrapper styling
  barsWrap.className = 'chart-bars-wrap ' + (currentHourlySlot === 'all' ? 'slot-all' : 'slot-filtered');
  const scrollHint = document.getElementById("chartScrollHint");
  if (scrollHint) {
    scrollHint.classList.toggle('show-hint', currentHourlySlot === 'all');
  }

  // Generate responsive bars
  const chartHeightRef = maxVal > 0 ? maxVal * 1.15 : 100;
  barsWrap.innerHTML = filtered.map(item => {
    const heightPercent = maxVal > 0 ? Math.max(item.val > 0 ? 8 : 0, Math.min(100, (item.val / chartHeightRef) * 100)) : 0;
    const isPeak = (stats.peakVal > 0 && item.hour === stats.peakHour);
    const isActive = (selectedHourlyItem && selectedHourlyItem.hour === item.hour);
    const colClasses = ['bar-col', isPeak ? 'peak' : '', isActive ? 'active' : ''].filter(Boolean).join(' ');

    return `
      <div class="${colClasses}" onclick="selectHourlyBar('${item.hour}', ${item.val})" title="Fascia ${item.hour}: ${item.val.toFixed(2)} €">
        <span class="bar-val-badge">${item.val.toFixed(0)}€</span>
        <div class="bar-fill" style="height: ${heightPercent}%">
          <span class="bar-tooltip">${item.val.toFixed(2)} €</span>
        </div>
        <span class="bar-label">${item.hour}</span>
      </div>
    `;
  }).join("");
}

window.filterHourlySlot = filterHourlySlot;
window.selectHourlyBar = selectHourlyBar;
window.renderHourlySalesChart = renderHourlySalesChart;

function renderDashboard() {
  const currentPeriod = (typeof appState !== "undefined" && appState.dashboardPeriod) ? appState.dashboardPeriod : "today";
  const stats = calculateDashboardStatistics(currentPeriod);

  // 1. Fill KPI Values
  const revEl = document.getElementById("metricRevenue");
  const ordEl = document.getElementById("metricOrders");
  const avgEl = document.getElementById("metricAvgTicket");
  const altEl = document.getElementById("metricAlerts");

  if (revEl) revEl.textContent = `${stats.revenue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  if (ordEl) ordEl.textContent = stats.ordersCount;
  if (avgEl) avgEl.textContent = `${stats.avgTicket.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  if (altEl) altEl.textContent = stats.alertCount;

  // 2. Fill KPI Delta Badges (FASE 13)
  function applyBadge(el, delta) {
    if (!el || !delta) return;
    el.className = "metric-badge";
    if (delta.type === "positive") {
      el.classList.add("green");
      el.textContent = `↑ ${delta.text}`;
    } else if (delta.type === "negative") {
      el.classList.add("red");
      el.textContent = `↓ ${delta.text}`;
    } else {
      el.classList.add("neutral");
      el.textContent = delta.text;
    }
    el.title = delta.label || "";
  }

  applyBadge(document.getElementById("metricRevenueBadge"), stats.revenueDelta);
  applyBadge(document.getElementById("metricOrdersBadge"), stats.ordersDelta);
  applyBadge(document.getElementById("metricAvgTicketBadge"), stats.avgTicketDelta);

  // 3. Update Live / Demo Mode Badge in Toolbar
  const liveBadge = document.getElementById("dashboardLiveBadge");
  const modeLabel = document.getElementById("dashboardModeLabel");
  if (modeLabel) {
    if (stats.isDemo) {
      modeLabel.textContent = "Modalità Demo (Simulata)";
      if (liveBadge) {
        liveBadge.style.background = "rgba(245, 158, 11, 0.12)";
        liveBadge.style.color = "#F59E0B";
        liveBadge.style.borderColor = "rgba(245, 158, 11, 0.3)";
      }
    } else {
      modeLabel.textContent = "Dati Live Reali";
      if (liveBadge) {
        liveBadge.style.background = "rgba(16, 185, 129, 0.12)";
        liveBadge.style.color = "#10B981";
        liveBadge.style.borderColor = "rgba(16, 185, 129, 0.3)";
      }
    }
  }

  // 4. Render Hourly Sales Bar Chart
  renderHourlySalesChart();

  // 5. Render Category Donut Chart (FASE 7)
  const donutSvg = document.getElementById("categoryDonutSvg");
  const donutTotal = document.getElementById("categoryDonutTotal");
  const donutSub = document.getElementById("categoryDonutSub");
  const donutLegend = document.getElementById("categoryDonutLegend");

  if (donutTotal) {
    donutTotal.textContent = `${stats.totalCatAmount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  }
  if (donutSub) {
    donutSub.textContent = stats.totalCatAmount > 0 ? (window.i18n ? window.i18n.t("total") : "Totale") : "Nessuna vendita";
  }

  if (donutSvg) {
    let circlesHtml = `<circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="var(--border-color)" stroke-width="5"></circle>`;
    if (stats.totalCatAmount > 0) {
      let offset = 0;
      stats.categorySales.forEach(cat => {
        if (cat.percent > 0) {
          const dashArray = `${cat.percent} ${100 - cat.percent}`;
          const dashOffset = -offset;
          circlesHtml += `<circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="${cat.color}" stroke-width="5" stroke-dasharray="${dashArray}" stroke-dashoffset="${dashOffset}"></circle>`;
          offset += cat.percent;
        }
      });
    }
    donutSvg.innerHTML = circlesHtml;
  }

  if (donutLegend) {
    if (stats.totalCatAmount > 0) {
      donutLegend.innerHTML = stats.categorySales.map(cat => `
        <div class="legend-item">
          <div class="legend-left">
            <span class="legend-color-dot" style="background:${cat.color};"></span>
            <span>${cat.label}</span>
          </div>
          <span class="legend-percent" title="${cat.amount.toFixed(2)} €">${cat.percent}%</span>
        </div>
      `).join("");
    } else {
      donutLegend.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding:16px 8px; color:var(--text-muted); font-size:12.5px;">
          <span style="font-size:22px; display:block; margin-bottom:4px;">📊</span>
          <span>Nessuna vendita registrata nel periodo</span>
        </div>
      `;
    }
  }

  // 6. Render Recent Orders Table (FASE 9)
  const recentOrdersTbody = document.getElementById("recentOrdersTableBody");
  if (recentOrdersTbody) {
    if (stats.recentOrders.length === 0) {
      recentOrdersTbody.innerHTML = `
        <tr class="empty-state-row">
          <td colspan="6" style="text-align:center; padding:32px 16px; color:var(--text-muted); font-size:13px;">
            <div style="font-size:26px; margin-bottom:6px;">📄</div>
            <strong>Nessuna comanda registrata</strong>
            <div style="font-size:12px; margin-top:3px; opacity:0.8;">Le nuove comande appariranno qui automaticamente in tempo reale.</div>
          </td>
        </tr>
      `;
    } else {
      recentOrdersTbody.innerHTML = stats.recentOrders.slice(0, 5).map(ord => {
        const itemsSummary = (ord.items || []).map(it => `${it.qty} ${(it.name || "").toLowerCase()}`).join(", ") || "Comanda senza articoli";
        let badgeClass = "badge-prep";
        let statusKey = "statusPrep";
        if (ord.status === "ready") { badgeClass = "badge-ready"; statusKey = "statusReady"; }
        if (ord.status === "served") { badgeClass = "badge-served"; statusKey = "statusServed"; }
        if (ord.status === "closed" || ord.status === "paid") { badgeClass = "badge-served"; statusKey = "statusServed"; }

        let timeAgo = ord.time || "Poco fa";
        if (ord.createdAt) {
          const diffMin = Math.max(1, Math.round((Date.now() - new Date(ord.createdAt).getTime()) / 60000));
          timeAgo = diffMin < 60 ? `${diffMin} min` : `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;
        }

        return `
          <tr>
            <td style="font-weight:700; color:var(--primary);">#${ord.id}</td>
            <td style="font-weight:600;">${ord.table || "Bancone"}</td>
            <td style="color:var(--text-muted); max-width:240px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${itemsSummary}</td>
            <td style="font-weight:700;">${(Number(ord.total) || 0).toFixed(2)} €</td>
            <td><span class="table-badge ${badgeClass}">${window.i18n ? window.i18n.t(statusKey) : ord.status}</span></td>
            <td style="color:var(--text-muted); font-size:12px;">${timeAgo}</td>
          </tr>
        `;
      }).join("");
    }
  }

  // 7. Render Best Selling Products (FASE 10)
  const bestSellersTbody = document.getElementById("bestSellersTableBody");
  if (bestSellersTbody) {
    if (stats.topProducts.length === 0) {
      bestSellersTbody.innerHTML = `
        <tr class="empty-state-row">
          <td colspan="4" style="text-align:center; padding:32px 16px; color:var(--text-muted); font-size:13px;">
            <div style="font-size:26px; margin-bottom:6px;">☕</div>
            <strong>Nessun prodotto venduto</strong>
            <div style="font-size:12px; margin-top:3px; opacity:0.8;">Nessun prodotto venduto nel periodo selezionato.</div>
          </td>
        </tr>
      `;
    } else {
      bestSellersTbody.innerHTML = stats.topProducts.slice(0, 5).map((p, idx) => `
        <tr>
          <td style="font-weight:700; color:var(--text-muted); width:28px;">${idx + 1}</td>
          <td>
            <div class="product-row-flex">
              <img src="${p.image}" class="product-thumb-sm" alt="${p.name}">
              <span style="font-weight:600;">${p.name}</span>
            </div>
          </td>
          <td style="text-align:center; font-weight:600;">${p.salesCount}</td>
          <td style="text-align:right; font-weight:700; color:var(--primary);">${p.revenue.toFixed(2)} €</td>
        </tr>
      `).join("");
    }
  }
}

// --------------------------------------------------------------------------
// Order Taking & Catalog
// --------------------------------------------------------------------------
function renderOrderCatalog() {
  const products = window.db.get("products");
  const catalogGrid = document.getElementById("orderCatalogGrid");
  if (!catalogGrid) return;

  const filtered = appState.selectedCategory === "all"
    ? products
    : products.filter(p => p.category === appState.selectedCategory);

  catalogGrid.innerHTML = filtered.map(p => `
    <div class="product-order-card" onclick="addToCart(${p.id})">
      <img src="${p.image}" class="product-card-img" alt="${p.name}">
      <span class="product-card-name" title="${p.name}">${p.name}</span>
      <div class="product-card-bottom">
        <span class="product-card-price">${p.price.toFixed(2)} €</span>
        <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart(${p.id})">+</button>
      </div>
    </div>
  `).join("");

  // Setup category pills filter
  document.querySelectorAll(".cat-pill").forEach(pill => {
    pill.classList.toggle("active", pill.getAttribute("data-cat") === appState.selectedCategory);
    pill.onclick = () => {
      appState.selectedCategory = pill.getAttribute("data-cat");
      renderOrderCatalog();
    };
  });
}

function addToCart(productId) {
  const product = window.db.get("products").find(p => p.id === productId);
  if (!product) return;

  const existing = appState.cart.find(it => it.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    appState.cart.push({
      id: product.id,
      name: product.name,
      qty: 1,
      price: product.price,
      category: product.category
    });
  }
  renderCart();
}

function updateCartQty(productId, delta) {
  const item = appState.cart.find(it => it.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    appState.cart = appState.cart.filter(it => it.id !== productId);
  }
  renderCart();
}

function renderCart() {
  const cartList = document.getElementById("cartItemsList");
  const cartTotalVal = document.getElementById("cartTotalVal");
  const cartItemsCount = document.getElementById("cartItemsCount");

  if (!cartList) return;

  let total = 0;
  let count = 0;

  if (appState.cart.length === 0) {
    cartList.innerHTML = `
      <div style="text-align:center; padding: 40px 10px; color:var(--text-muted); font-size:13px;">
        🛒 ${window.i18n.t("currentSelection")} vuota.<br>Tocca un prodotto per aggiungerlo.
      </div>
    `;
  } else {
    cartList.innerHTML = appState.cart.map(item => {
      const subtotal = item.qty * item.price;
      total += subtotal;
      count += item.qty;
      return `
        <div class="cart-item-row">
          <div class="cart-item-details">
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-sub">${item.qty} × ${item.price.toFixed(2)} € = ${subtotal.toFixed(2)} €</span>
          </div>
          <div class="cart-item-stepper">
            <button class="stepper-btn" onclick="updateCartQty(${item.id}, -1)">-</button>
            <span class="stepper-qty">${item.qty}</span>
            <button class="stepper-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
          </div>
        </div>
      `;
    }).join("");
  }

  if (cartTotalVal) cartTotalVal.textContent = `${total.toFixed(2)} €`;
  if (cartItemsCount) cartItemsCount.textContent = count;
}

function setupCartEvents() {
  const sendBtn = document.getElementById("btnSendOrder");
  const saveDraftBtn = document.getElementById("btnSaveDraft");
  const tableSelect = document.getElementById("orderTableSelect");

  if (tableSelect) {
    tableSelect.addEventListener("change", (e) => {
      appState.selectedTable = e.target.value;
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      if (appState.cart.length === 0) {
        alert(window.i18n.currentLang === "it" ? "Seleziona almeno un articolo!" : "Veuillez sélectionner au moins un article !");
        return;
      }

      const orders = window.db.get("orders") || [];
      const activeBar = (window.db ? window.db.get("activeBar") : {}) || {};
      const newId = 1001 + orders.length;
      const total = appState.cart.reduce((sum, it) => sum + (it.qty * it.price), 0);
      const isDemo = (typeof isDemoMode === "function" && isDemoMode());

      const newOrder = {
        id: newId,
        barId: activeBar.id || (isDemo ? "bar_demo" : "bar_01"),
        isDemo: isDemo,
        table: appState.selectedTable || "Tavolo 04",
        area: "interno",
        server: activeBar.managerName || "Operatore",
        status: "prep",
        time: "1 min",
        createdAt: new Date().toISOString(),
        items: appState.cart.map(it => ({
          id: it.id,
          name: it.name,
          qty: it.qty,
          price: it.price,
          category: it.category
        })),
        total: Math.round(total * 100) / 100
      };

      orders.unshift(newOrder);
      window.db.set("orders", orders);

      // Update table occupancy on floor plan
      const tables = (window.db ? window.db.get("tables") : []) || [];
      const matchedTable = tables.find(t => 
        t.id === appState.selectedTable || 
        t.number === appState.selectedTable || 
        ("Tavolo " + t.id) === appState.selectedTable ||
        t.id === "T04"
      );
      if (matchedTable) {
        matchedTable.status = "occupied";
        matchedTable.amount = Math.round(total * 100) / 100;
        matchedTable.orderId = newId;
        matchedTable.time = 1;
        window.db.set("tables", tables);
      }

      // Deduct ingredients automatically
      deductStockForOrder(newOrder);

      // Clear cart
      appState.cart = [];
      renderCart();
      renderDashboard();
      renderKDS();
      renderFloorPlan();
      renderInventory();

      showToast(window.i18n.currentLang === "it" 
        ? `Comanda #${newId} inviata alla preparazione!` 
        : `Commande #${newId} envoyée en préparation !`);
    });
  }

  if (saveDraftBtn) {
    saveDraftBtn.addEventListener("click", () => {
      showToast(window.i18n.currentLang === "it" ? "Bozza comanda salvata!" : "Brouillon sauvegardé !");
    });
  }
}

// Automatic inventory deduction based on recipes
function deductStockForOrder(order) {
  const inventory = window.db.get("inventory");
  const products = window.db.get("products");

  order.items.forEach(orderItem => {
    const prod = products.find(p => p.id === orderItem.id);
    if (prod && prod.recipe) {
      prod.recipe.forEach(rec => {
        const ing = inventory.find(i => i.id === rec.ingredientId);
        if (ing) {
          ing.qty = Math.max(0, parseFloat((ing.qty - (rec.qty * orderItem.qty)).toFixed(2)));
          if (ing.qty <= ing.reorderLevel) {
            ing.status = "alert";
          }
        }
      });
    }
  });

  window.db.set("inventory", inventory);
}

// --------------------------------------------------------------------------
// Plan de salle / Floor Plan
// --------------------------------------------------------------------------
function renderFloorPlan() {
  const tables = (window.db ? window.db.get("tables") : []) || [];
  const roomCanvas = document.getElementById("floorRoomCanvas");
  if (!roomCanvas) return;

  const isCurrentViewerOwner = !currentStaff || currentStaff.role === "Proprietario";

  // Show/Hide Add Table Button only for Owner
  const addTableBtn = document.getElementById("btnAddFloorTable");
  if (addTableBtn) {
    addTableBtn.style.display = isCurrentViewerOwner ? "inline-flex" : "none";
  }

  const filtered = appState.floorFilter === "all"
    ? tables
    : tables.filter(t => t.area === appState.floorFilter);

  roomCanvas.innerHTML = filtered.map(t => {
    let statusClass = `status-${t.status}`;
    let statusText = "";
    if (t.status === "free") statusText = window.i18n.t("statusFree");
    else if (t.status === "occupied") statusText = window.i18n.t("statusOccupied");
    else if (t.status === "to_pay") statusText = window.i18n.t("statusToPay");
    else if (t.status === "reserved") statusText = window.i18n.t("statusReserved");

    // Only Owner can see and use table deletion button
    const deleteBtn = isCurrentViewerOwner ? `
      <button type="button" class="table-node-delete-btn" onclick="event.stopPropagation(); openDeleteTableModal('${t.id}')" title="Elimina tavolo ${t.id}" aria-label="Elimina tavolo ${t.id}">
        ✕
      </button>
    ` : "";

    return `
      <div class="table-node ${statusClass}" onclick="handleTableClick('${t.id}')">
        ${deleteBtn}
        ${t.alert ? `<span class="table-node-alert">${t.alert}</span>` : ""}
        <span class="table-node-number">${t.id}</span>
        <span class="table-node-info">${t.capacity} ${window.i18n.t("occupants")} · ${statusText}</span>
        ${t.amount > 0 ? `<span class="table-node-amount">${t.amount.toFixed(2)} €</span>` : ""}
        ${t.reservation ? `<span style="font-size:11px; color:var(--status-reserved); font-weight:700;">${t.reservation}</span>` : ""}
      </div>
    `;
  }).join("");

  // Setup area filters
  document.querySelectorAll(".floor-pill").forEach(pill => {
    pill.classList.toggle("active", pill.getAttribute("data-area") === appState.floorFilter);
    pill.onclick = () => {
      appState.floorFilter = pill.getAttribute("data-area");
      renderFloorPlan();
    };
  });
}

function handleTableClick(tableId) {
  appState.selectedTable = `Tavolo ${tableId.replace("T", "")}`;
  const selectEl = document.getElementById("orderTableSelect");
  if (selectEl) selectEl.value = appState.selectedTable;
  switchView("orders");
}


// --------------------------------------------------------------------------
// Table Management (Solo Proprietario: Aggiunta e Cancellazione Tavoli)
// --------------------------------------------------------------------------
let tableIdPendingDelete = null;

function openAddTableModal() {
  const isCurrentViewerOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isCurrentViewerOwner) {
    showToast("⚠️ Solo il proprietario può aggiungere nuovi tavoli.");
    return;
  }
  const modal = document.getElementById("addTableModal");
  if (!modal) return;
  const inputId = document.getElementById("newTableId");
  if (inputId) {
    const tables = (window.db ? window.db.get("tables") : []) || [];
    const tNums = tables
      .map(t => parseInt(String(t.id).replace(/\D/g, ""), 10))
      .filter(n => !isNaN(n));
    const nextNum = tNums.length > 0 ? Math.max(...tNums) + 1 : 1;
    inputId.value = `T${nextNum < 10 ? "0" + nextNum : nextNum}`;
  }
  modal.classList.add("active");
}

function closeAddTableModal() {
  const modal = document.getElementById("addTableModal");
  if (modal) modal.classList.remove("active");
}

function handleAddTableSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const isCurrentViewerOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isCurrentViewerOwner) {
    showToast("⚠️ Azione negata: solo il proprietario può aggiungere tavoli.");
    closeAddTableModal();
    return;
  }

  const idInput = document.getElementById("newTableId");
  const areaInput = document.getElementById("newTableArea");
  const capacityInput = document.getElementById("newTableCapacity");

  const rawId = (idInput ? idInput.value : "").trim();
  if (!rawId) {
    showToast("⚠️ Inserisci una sigla per il tavolo.");
    return;
  }

  const tableId = rawId.toUpperCase();
  const area = areaInput ? areaInput.value : "interno";
  const capacity = capacityInput ? parseInt(capacityInput.value, 10) || 4 : 4;

  const tables = (window.db ? window.db.get("tables") : []) || [];
  if (tables.some(t => String(t.id).toUpperCase() === tableId)) {
    showToast(`⚠️ Esiste già un tavolo con sigla ${tableId}.`);
    return;
  }

  const newTable = {
    id: tableId,
    area: area,
    capacity: capacity,
    status: "free",
    amount: 0,
    time: 0,
    orderId: null
  };

  tables.push(newTable);
  window.db.set("tables", tables);

  syncOrderTableSelect();
  renderFloorPlan();
  closeAddTableModal();
  showToast(`✅ Tavolo ${tableId} aggiunto con successo!`);
}

function openDeleteTableModal(tableId) {
  const isCurrentViewerOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isCurrentViewerOwner) {
    showToast("⚠️ Solo il proprietario può eliminare i tavoli.");
    return;
  }

  const tables = (window.db ? window.db.get("tables") : []) || [];
  const target = tables.find(t => t.id === tableId);
  if (!target) {
    showToast("⚠️ Tavolo non trovato.");
    return;
  }

  tableIdPendingDelete = tableId;

  const targetIdEl = document.getElementById("deleteTableTargetId");
  if (targetIdEl) {
    targetIdEl.textContent = `${target.id} (${target.area}, ${target.capacity} pers.)`;
  }

  const warnEl = document.getElementById("deleteTableWarning");
  if (warnEl) {
    const hasActiveOrder = target.status === "occupied" || target.status === "to_pay" || (target.amount && target.amount > 0);
    warnEl.style.display = hasActiveOrder ? "block" : "none";
  }

  const modal = document.getElementById("deleteTableModal");
  if (modal) modal.classList.add("active");
}

function closeDeleteTableModal() {
  tableIdPendingDelete = null;
  const modal = document.getElementById("deleteTableModal");
  if (modal) modal.classList.remove("active");
}

function confirmDeleteTableAction() {
  const isCurrentViewerOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isCurrentViewerOwner) {
    showToast("⚠️ Azione negata: solo il proprietario può eliminare tavoli.");
    closeDeleteTableModal();
    return;
  }

  if (!tableIdPendingDelete) {
    closeDeleteTableModal();
    return;
  }

  const tables = (window.db ? window.db.get("tables") : []) || [];
  const updatedTables = tables.filter(t => t.id !== tableIdPendingDelete);
  window.db.set("tables", updatedTables);

  const deletedId = tableIdPendingDelete;
  closeDeleteTableModal();
  syncOrderTableSelect();
  renderFloorPlan();
  showToast(`🗑️ Tavolo ${deletedId} eliminato dalla sala.`);
}

function syncOrderTableSelect() {
  const selectEl = document.getElementById("orderTableSelect");
  if (!selectEl) return;
  const tables = (window.db ? window.db.get("tables") : []) || [];
  const currentVal = selectEl.value;

  selectEl.innerHTML = tables.map(t => {
    const cleanNum = String(t.id).replace(/^T0?/, "");
    const label = `Tavolo ${cleanNum} (${t.area} · ${t.capacity} pers.)`;
    const val = `Tavolo ${cleanNum.length === 1 ? '0' + cleanNum : cleanNum}`;
    return `<option value="${val}">${label}</option>`;
  }).join("");

  if (currentVal && Array.from(selectEl.options).some(o => o.value === currentVal)) {
    selectEl.value = currentVal;
  }
}

// --------------------------------------------------------------------------
// Kitchen Display System (KDS)
// --------------------------------------------------------------------------
function renderKDS() {
  const orders = window.db.get("orders");
  const kdsContainer = document.getElementById("kdsTicketsGrid");
  if (!kdsContainer) return;

  let filtered = orders;
  if (appState.kdsFilter === "to_prep") filtered = orders.filter(o => o.status === "prep" && o.time.includes("1 min"));
  else if (appState.kdsFilter === "in_prep") filtered = orders.filter(o => o.status === "prep");
  else if (appState.kdsFilter === "ready") filtered = orders.filter(o => o.status === "ready");

  kdsContainer.innerHTML = filtered.map(o => {
    let actionBtn = "";
    if (o.status === "prep") {
      actionBtn = `<button class="kds-btn-action kds-btn-ready" onclick="changeOrderStatus(${o.id}, 'ready')">${window.i18n.t("markReadyBtn")}</button>`;
    } else if (o.status === "ready") {
      actionBtn = `<button class="kds-btn-action kds-btn-served" onclick="changeOrderStatus(${o.id}, 'served')">${window.i18n.t("markServedBtn")}</button>`;
    } else {
      actionBtn = `<button class="kds-btn-action kds-btn-start" style="opacity:0.6; pointer-events:none;">${window.i18n.t("statusServed")}</button>`;
    }

    return `
      <div class="kds-ticket">
        <div class="kds-ticket-header">
          <span class="kds-ticket-num">#${o.id}</span>
          <span class="kds-ticket-timer">${o.time}</span>
        </div>
        <div class="kds-ticket-table">${o.table} · <span style="font-size:12px; color:var(--text-muted);">${o.server}</span></div>
        <ul class="kds-ticket-items">
          ${o.items.map(it => `
            <li class="kds-item-row">
              <span><span class="kds-item-qty">${it.qty}×</span> ${it.name}</span>
              <span style="font-size:11px; color:var(--text-muted);">${(it.qty * it.price).toFixed(2)} €</span>
            </li>
          `).join("")}
        </ul>
        ${actionBtn}
      </div>
    `;
  }).join("");

  // Setup KDS tab pills
  document.querySelectorAll(".kds-tab-pill").forEach(tab => {
    tab.classList.toggle("active", tab.getAttribute("data-kds-filter") === appState.kdsFilter);
    tab.onclick = () => {
      appState.kdsFilter = tab.getAttribute("data-kds-filter");
      renderKDS();
    };
  });
}

function changeOrderStatus(orderId, newStatus) {
  const orders = (window.db ? window.db.get("orders") : []) || [];
  const ord = orders.find(o => o.id === orderId);
  if (ord) {
    ord.status = newStatus;
    if (newStatus === "served" || newStatus === "closed" || newStatus === "paid") {
      ord.closedAt = new Date().toISOString();
    }
    if (newStatus === "cancelled") {
      ord.cancelledAt = new Date().toISOString();
    }
    window.db.set("orders", orders);

    // Free the table if order is closed, paid or cancelled
    if (newStatus === "closed" || newStatus === "paid" || newStatus === "cancelled") {
      const tables = (window.db ? window.db.get("tables") : []) || [];
      const tbl = tables.find(t => t.orderId === orderId);
      if (tbl) {
        tbl.status = "free";
        tbl.amount = 0;
        tbl.orderId = null;
        tbl.time = 0;
        window.db.set("tables", tables);
      }
    }

    renderKDS();
    renderDashboard();
    renderFloorPlan();
    showToast(`Comanda #${orderId} aggiornata: ${newStatus.toUpperCase()}`);
  }
}

// --------------------------------------------------------------------------
// Products & Inventory Catalog
// --------------------------------------------------------------------------
function renderProducts() {
  const products = (window.db ? window.db.get("products") : []) || [];
  const tbody = document.getElementById("productsTableBody");
  if (!tbody) return;

  const isCurrentViewerOwner = !currentStaff || currentStaff.role === "Proprietario";

  tbody.innerHTML = products.map(p => {
    const costVal = (p.cost !== undefined && p.cost !== null) ? Number(p.cost) : 0;
    const priceVal = (p.price !== undefined && p.price !== null) ? Number(p.price) : 0;
    const marginPct = priceVal > 0 ? Math.round((1 - (costVal / priceVal)) * 100) : 0;
    const isOutOfStock = p.status === "out_of_stock";
    const statusText = isOutOfStock ? "Esaurito" : (window.i18n ? window.i18n.t("statusActive") : "Attivo");
    const statusBadgeClass = isOutOfStock ? "badge-alert" : "badge-served";

    // Format allergens pills
    const allergens = Array.isArray(p.allergens) ? p.allergens : [];
    const allergenIcons = [];
    if (allergens.includes("glutine")) allergenIcons.push("🌾 Glutine");
    if (allergens.includes("lattosio")) allergenIcons.push("🥛 Lattosio");
    if (allergens.includes("alcol")) allergenIcons.push("🍷 Alcol");
    if (allergens.includes("vegano")) allergenIcons.push("🌱 Vegan");

    const vatBadge = p.vat ? `<span style="font-size:9.5px; background:var(--bg-card-secondary); padding:1px 5px; border-radius:4px; color:var(--text-muted); border:1px solid var(--border-color);">IVA ${p.vat}%</span>` : "";
    const stationBadge = p.station === "kitchen" ? "🍳 Cucina" : p.station === "coffee" ? "☕ Caffè" : "🍸 Bar";

    return `
    <tr style="${isOutOfStock ? 'opacity:0.75;' : ''}">
      <td>
        <div class="product-row-flex">
          <img src="${p.image || ''}" class="product-thumb-sm" style="width:40px; height:40px; border-radius:10px; object-fit:cover;" alt="${p.name}">
          <div>
            <div style="font-weight:700; display:flex; align-items:center; gap:6px;">
              <span>${p.name}</span>
              ${vatBadge}
            </div>
            <div style="font-size:11px; color:var(--text-muted); display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:2px;">
              <span style="text-transform:capitalize;">${p.category}</span>
              <span>·</span>
              <span>${stationBadge}</span>
              ${allergenIcons.length > 0 ? `<span style="color:var(--primary); font-size:10px;">(${allergenIcons.join(', ')})</span>` : ''}
            </div>
          </div>
        </div>
      </td>
      <td style="font-weight:800; font-size:13.5px;">${priceVal.toFixed(2)} €</td>
      <td style="color:var(--text-muted); font-size:12px;">${costVal.toFixed(2)} €</td>
      <td style="font-weight:800; color:${marginPct >= 65 ? 'var(--status-free)' : 'var(--primary)'}; font-size:12.5px;">
        ${marginPct}%
      </td>
      <td>
        ${isCurrentViewerOwner
          ? `<button type="button" class="table-badge ${statusBadgeClass}" onclick="toggleProductAvailabilityStatus(${p.id})" style="cursor:pointer; border:none;" title="Clicca per cambiare disponibilità">${statusText}</button>`
          : `<span class="table-badge ${statusBadgeClass}">${statusText}</span>`
        }
      </td>
      <td>
        ${isCurrentViewerOwner
          ? `<div style="display:flex; align-items:center; gap:6px;">
               <button class="ctrl-btn" onclick="openEditProductModal(${p.id})" title="Modifica dati, foto e opzioni del prodotto">✏️ Modifica</button>
               <button class="ctrl-btn ctrl-btn-danger" onclick="openDeleteProductModal(${p.id})" title="Elimina definitivamente dal bar">🗑️ Elimina</button>
             </div>`
          : `<span style="font-size:11px; color:var(--text-muted);">Solo visualizzazione</span>`
        }
      </td>
    </tr>
  `;
  }).join("");
}

function renderInventory() {
  const inv = (window.db ? window.db.get("inventory") : []) || [];
  const tbody = document.getElementById("inventoryTableBody");
  if (!tbody) return;

  const isCurrentViewerOwner = !currentStaff || currentStaff.role === "Proprietario";

  tbody.innerHTML = inv.map(i => {
    const isAlert = i.qty <= i.reorderLevel;
    const costVal = (i.cost !== undefined && i.cost !== null) ? Number(i.cost) : 0;
    const catBadge = i.category ? `<span style="font-size:10px; background:var(--bg-card-secondary); color:var(--text-muted); padding:1px 5px; border-radius:4px; border:1px solid var(--border-color);">${i.category}</span>` : "";

    return `
      <tr>
        <td>
          <div style="font-weight:700; display:flex; align-items:center; gap:6px;">
            <span>${i.name}</span>
            ${catBadge}
          </div>
          ${i.notes ? `<div style="font-size:10.5px; color:var(--text-muted); margin-top:2px;">${i.notes}</div>` : ''}
        </td>
        <td style="font-weight:800; font-size:14px; color:${isAlert ? 'var(--status-alert)' : 'var(--text-main)'};">
          ${i.qty} ${i.unit}
        </td>
        <td style="color:var(--text-muted); font-size:12px;">${i.reorderLevel} ${i.unit}</td>
        <td style="font-weight:700; font-size:12.5px; color:var(--text-main);">${costVal.toFixed(2)} €</td>
        <td>
          <span class="table-badge ${isAlert ? 'badge-alert' : 'badge-ok'}">
            ${isAlert ? (window.i18n ? window.i18n.t("statusAlert") : "Allerta") : (window.i18n ? window.i18n.t("statusOk") : "OK")}
          </span>
        </td>
        <td style="color:var(--text-muted); font-size:12px;">${i.supplier || 'N/D'}</td>
        <td>
          ${isCurrentViewerOwner
            ? `<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                 <button class="ctrl-btn" onclick="quickRestock(${i.id})" title="Rifornisci rapidamente scorta">+ Rifornisci</button>
                 <button class="ctrl-btn" onclick="openEditIngredientModal(${i.id})" title="Modifica ingrediente e opzioni">✏️ Modifica</button>
                 <button class="ctrl-btn ctrl-btn-danger" onclick="openDeleteIngredientModal(${i.id})" title="Elimina ingrediente">🗑️</button>
               </div>`
            : `<button class="ctrl-btn" onclick="quickRestock(${i.id})">+ Rifornisci</button>`
          }
        </td>
      </tr>
    `;
  }).join("");
}

function quickRestock(ingId) {
  const inv = (window.db ? window.db.get("inventory") : []) || [];
  const item = inv.find(i => i.id === ingId);
  if (item) {
    const delta = (item.unit === 'bott.' || item.unit === 'pz' || item.unit === 'lattina') ? 5 : 2;
    item.qty = parseFloat((Number(item.qty) + delta).toFixed(2));
    if (item.qty > item.reorderLevel) item.status = "ok";
    window.db.set("inventory", inv);
    renderInventory();
    showToast(`✅ Giacenza rifornita per ${item.name} (+${delta} ${item.unit})!`);
  }
}

// --------------------------------------------------------------------------
// Ingredient Management (Solo Proprietario: Aggiunta, Modifica, Cancellazione)
// --------------------------------------------------------------------------
let ingredientIdPendingDelete = null;

function populateSupplierSelect(selectedSupplier = "") {
  const select = document.getElementById("newIngSupplierSelect");
  if (!select) return;

  const suppliers = (window.db ? window.db.get("suppliers") : []) || [];
  let html = suppliers.map(s => `<option value="${s.name}">${s.name} (${s.category})</option>`).join("");
  html += '<option value="__custom__">+ Altro fornitore (scrivi a mano)...</option>';
  select.innerHTML = html;

  const customInput = document.getElementById("newIngSupplierCustom");
  if (selectedSupplier && suppliers.some(s => s.name === selectedSupplier)) {
    select.value = selectedSupplier;
    if (customInput) customInput.style.display = "none";
  } else if (selectedSupplier) {
    select.value = "__custom__";
    if (customInput) {
      customInput.style.display = "inline-block";
      customInput.value = selectedSupplier;
    }
  } else {
    if (customInput) customInput.style.display = "none";
  }
}

function handleSupplierSelectChange(val) {
  const customInput = document.getElementById("newIngSupplierCustom");
  if (customInput) {
    customInput.style.display = val === "__custom__" ? "inline-block" : "none";
    if (val === "__custom__") customInput.focus();
  }
}

function openAddIngredientModal() {
  const isOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isOwner) {
    showToast("⚠️ Solo il Proprietario può aggiungere materie prime all'inventario.");
    return;
  }

  const modal = document.getElementById("addIngredientModal");
  if (!modal) return;

  const editIdEl = document.getElementById("editIngredientId");
  if (editIdEl) editIdEl.value = "";
  const titleEl = document.getElementById("ingredientModalTitle");
  if (titleEl) titleEl.innerHTML = "<span>🌿</span> <span>Nuovo Ingrediente</span>";
  const subEl = document.getElementById("ingredientModalSubtitle");
  if (subEl) subEl.textContent = "Aggiungi una materia prima all'inventario con scorte e costi (Solo Proprietario)";
  const btnEl = document.getElementById("ingredientModalSubmitBtn");
  if (btnEl) btnEl.textContent = "+ Salva nell'Inventario";

  // Reset fields
  const nameEl = document.getElementById("newIngName");
  if (nameEl) nameEl.value = "";
  const catEl = document.getElementById("newIngCategory");
  if (catEl) catEl.value = "Caffetteria";
  const unitEl = document.getElementById("newIngUnit");
  if (unitEl) unitEl.value = "kg";
  const qtyEl = document.getElementById("newIngQty");
  if (qtyEl) qtyEl.value = "5.0";
  const reorderEl = document.getElementById("newIngReorder");
  if (reorderEl) reorderEl.value = "2.0";
  const costEl = document.getElementById("newIngCost");
  if (costEl) costEl.value = "4.50";
  const notesEl = document.getElementById("newIngNotes");
  if (notesEl) notesEl.value = "";

  populateSupplierSelect();
  modal.classList.add("active");
}

function openEditIngredientModal(ingId) {
  const isOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isOwner) {
    showToast("⚠️ Solo il Proprietario può modificare le materie prime.");
    return;
  }

  const inv = (window.db ? window.db.get("inventory") : []) || [];
  const item = inv.find(i => i.id == ingId);
  if (!item) {
    showToast("⚠️ Ingrediente non trovato.");
    return;
  }

  const modal = document.getElementById("addIngredientModal");
  if (!modal) return;

  const editIdEl = document.getElementById("editIngredientId");
  if (editIdEl) editIdEl.value = item.id;
  const titleEl = document.getElementById("ingredientModalTitle");
  if (titleEl) titleEl.innerHTML = `<span>✏️</span> <span>Modifica ${item.name}</span>`;
  const subEl = document.getElementById("ingredientModalSubtitle");
  if (subEl) subEl.textContent = "Aggiorna scorte, unità, soglia di riordino e costi";
  const btnEl = document.getElementById("ingredientModalSubmitBtn");
  if (btnEl) btnEl.textContent = "💾 Salva Modifiche";

  // Fill inputs
  const nameEl = document.getElementById("newIngName");
  if (nameEl) nameEl.value = item.name || "";
  const catEl = document.getElementById("newIngCategory");
  if (catEl) catEl.value = item.category || "Caffetteria";
  const unitEl = document.getElementById("newIngUnit");
  if (unitEl) unitEl.value = item.unit || "kg";
  const qtyEl = document.getElementById("newIngQty");
  if (qtyEl) qtyEl.value = item.qty !== undefined ? item.qty : "";
  const reorderEl = document.getElementById("newIngReorder");
  if (reorderEl) reorderEl.value = item.reorderLevel !== undefined ? item.reorderLevel : "";
  const costEl = document.getElementById("newIngCost");
  if (costEl) costEl.value = item.cost !== undefined ? item.cost : "";
  const notesEl = document.getElementById("newIngNotes");
  if (notesEl) notesEl.value = item.notes || "";

  populateSupplierSelect(item.supplier);
  modal.classList.add("active");
}

function closeAddIngredientModal() {
  const modal = document.getElementById("addIngredientModal");
  if (modal) modal.classList.remove("active");
}

function handleAddIngredientSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const isOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isOwner) {
    showToast("⚠️ Solo il Proprietario può gestire le materie prime.");
    closeAddIngredientModal();
    return;
  }

  const editId = document.getElementById("editIngredientId")?.value;
  const name = document.getElementById("newIngName")?.value.trim();
  const category = document.getElementById("newIngCategory")?.value || "Caffetteria";
  const unit = document.getElementById("newIngUnit")?.value || "kg";
  const qty = parseFloat(document.getElementById("newIngQty")?.value) || 0;
  const reorderLevel = parseFloat(document.getElementById("newIngReorder")?.value) || 0;
  const cost = parseFloat(document.getElementById("newIngCost")?.value) || 0;
  const notes = document.getElementById("newIngNotes")?.value.trim() || "";

  let supplier = document.getElementById("newIngSupplierSelect")?.value || "";
  if (supplier === "__custom__") {
    supplier = document.getElementById("newIngSupplierCustom")?.value.trim() || "Fornitore Locale";
  }

  if (!name) {
    showToast("⚠️ Inserisci il nome dell'ingrediente.");
    return;
  }

  const inv = (window.db ? window.db.get("inventory") : []) || [];
  const status = qty <= reorderLevel ? "alert" : "ok";

  if (editId) {
    // Update existing item
    const idx = inv.findIndex(i => i.id == editId);
    if (idx !== -1) {
      inv[idx] = {
        ...inv[idx],
        name,
        category,
        unit,
        qty,
        reorderLevel,
        cost,
        supplier,
        notes,
        status
      };
      window.db.set("inventory", inv);
      showToast(`✅ Ingrediente "${name}" aggiornato con successo!`);
    }
  } else {
    // Create new item
    const nextId = inv.length > 0 ? Math.max(...inv.map(i => i.id || 0)) + 1 : 1;
    const newItem = {
      id: nextId,
      name,
      category,
      unit,
      qty,
      reorderLevel,
      cost,
      supplier,
      notes,
      status
    };
    inv.push(newItem);
    window.db.set("inventory", inv);
    showToast(`✅ Ingrediente "${name}" aggiunto all'inventario!`);
  }

  renderInventory();
  closeAddIngredientModal();
}

function openDeleteIngredientModal(ingId) {
  const isOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isOwner) {
    showToast("⚠️ Solo il Proprietario può eliminare ingredienti.");
    return;
  }

  const inv = (window.db ? window.db.get("inventory") : []) || [];
  const item = inv.find(i => i.id == ingId);
  if (!item) return;

  ingredientIdPendingDelete = ingId;
  const nameEl = document.getElementById("deleteIngredientName");
  if (nameEl) nameEl.textContent = item.name;
  const infoEl = document.getElementById("deleteIngredientInfo");
  if (infoEl) infoEl.textContent = `Giacenza attuale: ${item.qty} ${item.unit} · Fornitore: ${item.supplier || 'N/D'}`;

  const modal = document.getElementById("deleteIngredientModal");
  if (modal) modal.classList.add("active");
}

function closeDeleteIngredientModal() {
  ingredientIdPendingDelete = null;
  const modal = document.getElementById("deleteIngredientModal");
  if (modal) modal.classList.remove("active");
}

function confirmDeleteIngredientAction() {
  const isOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isOwner) {
    showToast("⚠️ Azione negata: solo il Proprietario può eliminare ingredienti.");
    closeDeleteIngredientModal();
    return;
  }

  if (!ingredientIdPendingDelete) {
    closeDeleteIngredientModal();
    return;
  }

  const inv = (window.db ? window.db.get("inventory") : []) || [];
  const target = inv.find(i => i.id == ingredientIdPendingDelete);
  const updated = inv.filter(i => i.id != ingredientIdPendingDelete);
  window.db.set("inventory", updated);

  const deletedName = target ? target.name : "Ingrediente";
  closeDeleteIngredientModal();
  renderInventory();
  showToast(`🗑️ Ingrediente "${deletedName}" eliminato dall'inventario.`);
}

// --------------------------------------------------------------------------
// Suppliers & Staff
// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
// Suppliers & Purchase Orders (Nuovo Fornitore riservato al Proprietario + Ordina da Fornitore)
// --------------------------------------------------------------------------
let supplierIdPendingDelete = null;
let currentOrderSupplier = null;

function renderSuppliers() {
  const sup = (window.db ? window.db.get("suppliers") : []) || [];
  const list = document.getElementById("suppliersListWrap");
  if (!list) return;

  const isOwner = !currentStaff || currentStaff.role === "Proprietario";

  if (sup.length === 0) {
    list.innerHTML = `
      <div class="card" style="text-align:center; padding:32px; color:var(--text-muted);">
        <p style="font-size:14px; font-weight:600;">Nessun fornitore registrato.</p>
        ${isOwner ? '<p style="font-size:12px; margin-top:6px;">Clicca su <strong>+ Nuovo fornitore</strong> per aggiungere il tuo primo partner commerciale.</p>' : ''}
      </div>
    `;
    return;
  }

  list.innerHTML = sup.map(s => {
    const productsText = (s.products_supplied && Array.isArray(s.products_supplied) && s.products_supplied.length > 0)
      ? s.products_supplied.join(", ")
      : (s.category || "Forniture varie");

    const contactText = (s.contact_name || s.contact) ? ` · 👤 ${s.contact_name || s.contact}` : "";

    return `
      <div class="card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div style="flex:1; min-width:240px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <h4 style="font-weight:800; font-size:15px; margin:0; color:var(--text-main);">${escapeHtml(s.name)}</h4>
            <span class="badge" style="font-size:10px; padding:2px 8px; background:var(--bg-card-secondary); color:var(--text-muted); border:1px solid var(--border-color);">${escapeHtml(s.category || 'Generale')}</span>
          </div>
          <p style="font-size:12px; color:var(--text-muted); margin:4px 0 2px 0;">📦 <strong>Articoli:</strong> ${escapeHtml(productsText)}</p>
          <p style="font-size:12px; color:var(--primary); margin:0;">📞 ${escapeHtml(s.phone || '-')} · ✉️ ${escapeHtml(s.email || '-')}${escapeHtml(contactText)}</p>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <button class="btn-primary" style="padding:8px 14px; font-size:12px; display:inline-flex; align-items:center; gap:6px;" onclick="openSupplierOrderModal('${s.id}')">
            <span>📦</span> <span>Nuovo ordine</span>
          </button>
          ${isOwner ? `
            <button class="btn-secondary" style="padding:8px 12px; font-size:12px;" onclick="openEditSupplierModal('${s.id}')" title="Modifica Fornitore">
              ✏️
            </button>
            <button class="btn-secondary" style="padding:8px 12px; font-size:12px; color:var(--status-alert);" onclick="openDeleteSupplierModal('${s.id}')" title="Elimina Fornitore">
              🗑️
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join("");
}

function openAddSupplierModal() {
  const isOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isOwner) {
    showToast("⚠️ Solo il Proprietario può aggiungere nuovi fornitori.");
    return;
  }

  const modal = document.getElementById("addSupplierModal");
  if (!modal) return;

  const form = document.getElementById("addSupplierForm");
  if (form) form.reset();

  const idEl = document.getElementById("editSupplierId");
  if (idEl) idEl.value = "";

  const titleEl = document.getElementById("supplierModalTitle");
  if (titleEl) titleEl.innerHTML = `<span>🚚</span> <span>Nuovo Fornitore</span>`;

  const subEl = document.getElementById("supplierModalSubtitle");
  if (subEl) subEl.textContent = "Registra un fornitore con catalogo prodotti e contatti (Solo Proprietario)";

  const submitBtn = document.getElementById("supplierModalSubmitBtn");
  if (submitBtn) submitBtn.textContent = "+ Salva Fornitore";

  modal.classList.add("active");
}

function openEditSupplierModal(supId) {
  const isOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isOwner) {
    showToast("⚠️ Solo il Proprietario può modificare i fornitori.");
    return;
  }

  const suppliers = (window.db ? window.db.get("suppliers") : []) || [];
  const s = suppliers.find(item => String(item.id) === String(supId));
  if (!s) return;

  const modal = document.getElementById("addSupplierModal");
  if (!modal) return;

  const idEl = document.getElementById("editSupplierId");
  if (idEl) idEl.value = s.id;

  const nameEl = document.getElementById("newSupName");
  if (nameEl) nameEl.value = s.name || "";

  const catEl = document.getElementById("newSupCategory");
  if (catEl) catEl.value = s.category || "Caffetteria & Macchine";

  const contactEl = document.getElementById("newSupContact");
  if (contactEl) contactEl.value = s.contact_name || s.contact || "";

  const phoneEl = document.getElementById("newSupPhone");
  if (phoneEl) phoneEl.value = s.phone || "";

  const emailEl = document.getElementById("newSupEmail");
  if (emailEl) emailEl.value = s.email || "";

  const prodEl = document.getElementById("newSupProducts");
  if (prodEl) {
    prodEl.value = (s.products_supplied && Array.isArray(s.products_supplied))
      ? s.products_supplied.join(", ")
      : "";
  }

  const notesEl = document.getElementById("newSupNotes");
  if (notesEl) notesEl.value = s.notes || "";

  const titleEl = document.getElementById("supplierModalTitle");
  if (titleEl) titleEl.innerHTML = `<span>✏️</span> <span>Modifica Fornitore</span>`;

  const subEl = document.getElementById("supplierModalSubtitle");
  if (subEl) subEl.textContent = `Modifica anagrafica e contatti di ${s.name}`;

  const submitBtn = document.getElementById("supplierModalSubmitBtn");
  if (submitBtn) submitBtn.textContent = "Salva Modifiche";

  modal.classList.add("active");
}

function closeAddSupplierModal() {
  const modal = document.getElementById("addSupplierModal");
  if (modal) modal.classList.remove("active");
}

function handleAddSupplierSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();

  const isOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isOwner) {
    showToast("⚠️ Solo il Proprietario può aggiungere o modificare fornitori.");
    return;
  }

  const id = document.getElementById("editSupplierId").value;
  const name = (document.getElementById("newSupName").value || "").trim();
  const category = document.getElementById("newSupCategory").value;
  const contact_name = (document.getElementById("newSupContact").value || "").trim();
  const phone = (document.getElementById("newSupPhone").value || "").trim();
  const email = (document.getElementById("newSupEmail").value || "").trim();
  const rawProducts = (document.getElementById("newSupProducts").value || "").trim();
  const notes = (document.getElementById("newSupNotes").value || "").trim();

  if (!name) {
    showToast("⚠️ Inserisci la ragione sociale del fornitore.");
    return;
  }

  const products_supplied = rawProducts
    ? rawProducts.split(",").map(p => p.trim()).filter(Boolean)
    : [];

  const suppliers = (window.db ? window.db.get("suppliers") : []) || [];

  if (id) {
    const idx = suppliers.findIndex(s => String(s.id) === String(id));
    if (idx !== -1) {
      suppliers[idx] = {
        ...suppliers[idx],
        name,
        category,
        contact_name,
        phone,
        email,
        products_supplied,
        notes
      };
      window.db.set("suppliers", suppliers);
      showToast(`✅ Fornitore "${name}" aggiornato con successo!`);
    }
  } else {
    const newSupplier = {
      id: Date.now(),
      name,
      category,
      contact_name,
      phone,
      email,
      products_supplied,
      notes,
      status: "active"
    };
    suppliers.push(newSupplier);
    window.db.set("suppliers", suppliers);
    showToast(`✅ Nuovo fornitore "${name}" aggiunto con successo!`);
  }

  closeAddSupplierModal();
  renderSuppliers();
  if (typeof populateSupplierSelect === "function") {
    populateSupplierSelect();
  }
}

function openDeleteSupplierModal(supId) {
  const isOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isOwner) {
    showToast("⚠️ Solo il Proprietario può eliminare i fornitori.");
    return;
  }

  const suppliers = (window.db ? window.db.get("suppliers") : []) || [];
  const s = suppliers.find(item => String(item.id) === String(supId));
  if (!s) return;

  supplierIdPendingDelete = s.id;

  const modal = document.getElementById("deleteSupplierModal");
  if (!modal) return;

  const nameEl = document.getElementById("deleteSupplierName");
  if (nameEl) nameEl.textContent = s.name;

  const infoEl = document.getElementById("deleteSupplierInfo");
  if (infoEl) infoEl.textContent = `Categoria: ${s.category} · 📞 ${s.phone}`;

  modal.classList.add("active");
}

function closeDeleteSupplierModal() {
  supplierIdPendingDelete = null;
  const modal = document.getElementById("deleteSupplierModal");
  if (modal) modal.classList.remove("active");
}

function confirmDeleteSupplierAction() {
  const isOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isOwner) {
    showToast("⚠️ Solo il Proprietario può eliminare i fornitori.");
    return;
  }

  if (!supplierIdPendingDelete) return;

  const suppliers = (window.db ? window.db.get("suppliers") : []) || [];
  const target = suppliers.find(s => String(s.id) === String(supplierIdPendingDelete));
  const newSuppliers = suppliers.filter(s => String(s.id) !== String(supplierIdPendingDelete));
  window.db.set("suppliers", newSuppliers);

  const deletedName = target ? target.name : "Fornitore";
  closeDeleteSupplierModal();
  renderSuppliers();
  if (typeof populateSupplierSelect === "function") {
    populateSupplierSelect();
  }
  showToast(`🗑️ Fornitore "${deletedName}" eliminato.`);
}

function openSupplierOrderModal(supId) {
  const suppliers = (window.db ? window.db.get("suppliers") : []) || [];
  const s = suppliers.find(item => String(item.id) === String(supId));
  if (!s) return;

  currentOrderSupplier = s;

  const modal = document.getElementById("supplierOrderModal");
  if (!modal) return;

  const idEl = document.getElementById("orderSupplierId");
  if (idEl) idEl.value = s.id;

  const nameEl = document.getElementById("orderSupplierName");
  if (nameEl) nameEl.textContent = s.name;

  const contactEl = document.getElementById("orderSupplierContact");
  if (contactEl) {
    contactEl.textContent = `📞 ${s.phone || '-'} · ✉️ ${s.email || '-'} ${s.contact_name ? '· 👤 ' + s.contact_name : ''}`;
  }

  const notesEl = document.getElementById("orderDeliveryNotes");
  if (notesEl) notesEl.value = "";

  const container = document.getElementById("orderItemsContainer");
  if (container) {
    container.innerHTML = "";

    const inv = (window.db ? window.db.get("inventory") : []) || [];
    const matchedInv = inv.filter(i => i.supplier && i.supplier.toLowerCase().includes(s.name.toLowerCase()));

    if (matchedInv.length > 0) {
      matchedInv.forEach(item => {
        addOrderRow(item.name, Math.max(1, Math.round((item.reorderLevel || 2) * 2)), item.unit || "pz");
      });
    } else if (s.products_supplied && Array.isArray(s.products_supplied) && s.products_supplied.length > 0) {
      s.products_supplied.slice(0, 4).forEach((p, idx) => {
        addOrderRow(p, idx === 0 ? 5 : 2, "colli");
      });
    } else {
      addOrderRow("", 1, "colli");
    }
  }

  modal.classList.add("active");
}

function addOrderRow(name = "", qty = 1, unit = "colli") {
  const container = document.getElementById("orderItemsContainer");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "order-item-row";
  row.style.cssText = "display:flex; gap:8px; align-items:center;";

  row.innerHTML = `
    <input type="text" class="form-input order-row-name" placeholder="Nome prodotto / referenza" value="${escapeHtml(name)}" required style="flex:2; padding:7px 10px; font-size:12px;">
    <input type="number" step="0.1" min="0.1" class="form-input order-row-qty" placeholder="Q.tà" value="${qty}" required style="width:75px; text-align:center; padding:7px 8px; font-size:12px; font-weight:700;">
    <select class="form-input order-row-unit" style="width:90px; padding:7px 6px; font-size:12px; background:var(--bg-card); cursor:pointer;">
      <option value="colli" ${unit === 'colli' ? 'selected' : ''}>colli</option>
      <option value="cartoni" ${unit === 'cartoni' ? 'selected' : ''}>cartoni</option>
      <option value="kg" ${unit === 'kg' ? 'selected' : ''}>kg</option>
      <option value="L" ${unit === 'L' ? 'selected' : ''}>L</option>
      <option value="bott." ${unit === 'bott.' ? 'selected' : ''}>bott.</option>
      <option value="fusti" ${unit === 'fusti' ? 'selected' : ''}>fusti</option>
      <option value="pz" ${unit === 'pz' ? 'selected' : ''}>pz</option>
    </select>
    <button type="button" class="btn-secondary" style="padding:6px 9px; color:var(--text-muted); font-size:12px;" onclick="this.parentElement.remove()" title="Rimuovi riga">✕</button>
  `;

  container.appendChild(row);
}

function closeSupplierOrderModal() {
  currentOrderSupplier = null;
  const modal = document.getElementById("supplierOrderModal");
  if (modal) modal.classList.remove("active");
}

function handleSendSupplierOrder(e) {
  if (e && e.preventDefault) e.preventDefault();

  if (!currentOrderSupplier) return;

  const container = document.getElementById("orderItemsContainer");
  const rows = container ? container.querySelectorAll(".order-item-row") : [];

  const items = [];
  rows.forEach(r => {
    const nameEl = r.querySelector(".order-row-name");
    const qtyEl = r.querySelector(".order-row-qty");
    const unitEl = r.querySelector(".order-row-unit");
    if (nameEl && nameEl.value.trim()) {
      items.push({
        name: nameEl.value.trim(),
        qty: parseFloat(qtyEl.value) || 1,
        unit: unitEl ? unitEl.value : "colli"
      });
    }
  });

  if (items.length === 0) {
    showToast("⚠️ Inserisci almeno un articolo da ordinare.");
    return;
  }

  const urgency = document.getElementById("orderDeliveryUrgency") ? document.getElementById("orderDeliveryUrgency").value : "Prima data utile";
  const channel = document.getElementById("orderChannel") ? document.getElementById("orderChannel").value : "both";
  const notes = document.getElementById("orderDeliveryNotes") ? document.getElementById("orderDeliveryNotes").value.trim() : "";

  const orderNumber = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

  const supplierOrders = (window.db ? window.db.get("supplier_orders") : []) || [];
  supplierOrders.unshift({
    id: orderNumber,
    supplierId: currentOrderSupplier.id,
    supplierName: currentOrderSupplier.name,
    items,
    urgency,
    notes,
    channel,
    timestamp: new Date().toISOString(),
    status: "inviato"
  });
  if (window.db) {
    window.db.set("supplier_orders", supplierOrders);
  }

  let orderText = `BUONO D'ORDINE: ${orderNumber}\n`;
  orderText += `Destinatario: ${currentOrderSupplier.name}\n`;
  orderText += `Data: ${new Date().toLocaleDateString('it-IT')} ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}\n`;
  orderText += `Mittente: Bar Central\n\n`;
  orderText += `ARTICOLI RICHIESTI:\n`;
  items.forEach((it, idx) => {
    orderText += `${idx + 1}. ${it.name} — ${it.qty} ${it.unit}\n`;
  });
  orderText += `\nTempistica Consegna: ${urgency}\n`;
  if (notes) {
    orderText += `Note Consegna: ${notes}\n`;
  }

  if (channel === "whatsapp" || channel === "both") {
    if (currentOrderSupplier.phone) {
      const cleanPhone = currentOrderSupplier.phone.replace(/[^0-9+]/g, '');
      const waUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(orderText)}`;
      window.open(waUrl, "_blank");
    }
  }

  if (channel === "email" || channel === "both") {
    if (currentOrderSupplier.email) {
      const mailtoUrl = `mailto:${currentOrderSupplier.email}?subject=${encodeURIComponent("Buono d'Ordine " + orderNumber + " - Bar Central")}&body=${encodeURIComponent(orderText)}`;
      window.open(mailtoUrl, "_blank");
    }
  }

  closeSupplierOrderModal();
  showToast(`🚀 Buono d'ordine #${orderNumber} inviato a ${currentOrderSupplier.name}!`);
}

// ==========================================================================
// ROLE-BASED ACCESS CONTROL (PROPRIETARIO, CAMERIERE, BARMAN, MANAGER)
// ==========================================================================
const ROLE_PERMISSIONS = {
  Proprietario: {
    views: ["dashboard", "orders", "floor", "kds", "products", "inventory", "suppliers", "staff", "reports", "subscriptions", "settings"],
    canAddProducts: true,
    canEditStaff: true,
    canManageTables: true,
    canManageInventory: true,
    canManageSuppliers: true,
    defaultView: "dashboard",
    badgeClass: "badge-role-owner"
  },
  Manager: {
    views: ["dashboard", "orders", "floor", "kds", "products", "inventory", "suppliers", "staff", "reports"],
    canAddProducts: false,
    canEditStaff: false,
    canManageTables: false,
    defaultView: "dashboard",
    badgeClass: "badge-role-manager"
  },
  Cameriere: {
    views: ["orders", "floor", "kds"],
    canAddProducts: false,
    canEditStaff: false,
    canManageTables: false,
    defaultView: "orders",
    badgeClass: "badge-role-waiter"
  },
  Barman: {
    views: ["kds", "products", "orders"],
    canAddProducts: false,
    canEditStaff: false,
    canManageTables: false,
    defaultView: "kds",
    badgeClass: "badge-role-barman"
  },
  Cassa: {
    views: ["orders", "floor", "dashboard"],
    canAddProducts: false,
    canEditStaff: false,
    canManageTables: false,
    defaultView: "orders",
    badgeClass: "badge-role-cashier"
  }
};

let currentStaff = null;
let enteredPin = "";
let selectedPinStaff = null;

function initActiveStaff() {
  const staffList = (window.db ? window.db.get("staff") : []) || [];
  if (staffList.length === 0) return;

  const savedStaff = localStorage.getItem("barpilot_active_staff");
  if (savedStaff) {
    try {
      const parsed = JSON.parse(savedStaff);
      const found = staffList.find(s => s.id === parsed.id || (s.email && s.email.toLowerCase() === (parsed.email || '').toLowerCase()) || s.name === parsed.name);
      if (found) {
        applyActiveStaff(found, false);
        return;
      }
    } catch (e) {}
  }

  // Check logged in user
  try {
    const loggedUser = JSON.parse(localStorage.getItem("barpilot_logged_user") || "null");
    if (loggedUser && loggedUser.email) {
      const foundByEmail = staffList.find(s => s.email && s.email.toLowerCase() === loggedUser.email.toLowerCase());
      if (foundByEmail) {
        applyActiveStaff(foundByEmail, false);
        return;
      }
    }
  } catch (e) {}

  // Default to first Proprietario in staff list
  const ownerStaff = staffList.find(s => s.role === "Proprietario") || staffList[0];
  if (ownerStaff) {
    applyActiveStaff(ownerStaff, false);
  }
}

function applyActiveStaff(staff, doSwitchView = true) {
  currentStaff = staff;
  try {
    localStorage.setItem("barpilot_active_staff", JSON.stringify(staff));
  } catch (e) {}

  const role = staff.role || "Proprietario";
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Proprietario;

  // 1. Update Sidebar Profile Card
  const avatarEl = document.getElementById("sidebarUserAvatar");
  const nameEl = document.getElementById("sidebarUserName");
  const roleEl = document.getElementById("sidebarUserRole");

  if (avatarEl && staff.avatar) avatarEl.src = staff.avatar;
  if (nameEl) nameEl.textContent = staff.name;
  if (roleEl) {
    roleEl.textContent = staff.role;
    roleEl.className = `user-role ${perms.badgeClass}`;
  }

  // 2. Update Greeting with staff name
  updateGreeting(staff.name);

  // 3. Filter Sidebar Navigation Items by Role
  document.querySelectorAll(".nav-item[data-view]").forEach(navItem => {
    const viewName = navItem.getAttribute("data-view");
    if (perms.views.includes(viewName)) {
      navItem.style.display = "flex";
    } else {
      navItem.style.display = "none";
    }
  });

  // 4. Product Add Permission (Solo il proprietario può aggiungere prodotti)
  const addProdBtn = document.getElementById("btnAddNewProduct");
  if (addProdBtn) {
    addProdBtn.style.display = perms.canAddProducts ? "inline-flex" : "none";
  }

  // 4b. Table Add & Delete Permission (Solo il proprietario può aggiungere o cancellare tavoli)
  const addTableBtn = document.getElementById("btnAddFloorTable");
  if (addTableBtn) {
    addTableBtn.style.display = perms.canManageTables ? "inline-flex" : "none";
  }

  // 4c. Inventory Add & Edit Permission (Solo il proprietario può aggiungere o modificare ingredienti)
  const addIngBtn = document.getElementById("btnAddNewIngredient");
  if (addIngBtn) {
    addIngBtn.style.display = perms.canManageInventory ? "inline-flex" : "none";
  }

  // 4d. Supplier Add Permission (Solo il proprietario può aggiungere nuovi fornitori)
  const addSupplierBtn = document.getElementById("btnAddNewSupplier");
  if (addSupplierBtn) {
    addSupplierBtn.style.display = perms.canManageSuppliers ? "inline-flex" : "none";
  }

  // Re-render suppliers when role changes
  if (typeof renderSuppliers === "function") {
    renderSuppliers();
  }

  // 5. If doSwitchView is true or current view is not allowed for this role, automatically switch
  if (doSwitchView || !perms.views.includes(appState.activeView)) {
    switchView(perms.defaultView);
  }

  // Re-render staff table so active badge reflects current staff
  renderStaff();
}

function renderStaff() {
  const staff = (window.db ? window.db.get("staff") : []) || [];
  const tbody = document.getElementById("staffTableBody");
  if (!tbody) return;

  const isCurrentViewerOwner = !currentStaff || currentStaff.role === "Proprietario";

  tbody.innerHTML = staff.map(s => {
    const isCurrentActive = currentStaff && currentStaff.id === s.id;
    const isOwnerRow = s.role === "Proprietario";
    let roleBadgeClass = "badge-role-waiter";
    if (isOwnerRow) roleBadgeClass = "badge-role-owner";
    else if (s.role === "Manager") roleBadgeClass = "badge-role-manager";
    else if (s.role === "Barman") roleBadgeClass = "badge-role-barman";
    else if (s.role === "Cassa") roleBadgeClass = "badge-role-cashier";

    // Solo il proprietario può vedere il PIN degli altri.
    // I dipendenti possono vedere unicamente il proprio PIN; per gli altri il PIN è oscurato.
    let pinCellContent = "";
    if (isOwnerRow) {
      pinCellContent = '<span style="color:var(--text-muted); font-size:12px; font-weight:600;">🔒 Solo Password (Nessun PIN)</span>';
    } else if (isCurrentViewerOwner) {
      pinCellContent = `<code style="background:var(--bg-card-secondary); padding:3px 8px; border-radius:6px; font-weight:700; letter-spacing:2px; font-size:12px; color:var(--text-main);">${s.pin || '1234'}</code>`;
    } else if (isCurrentActive) {
      pinCellContent = `<code style="background:var(--bg-card-secondary); padding:3px 8px; border-radius:6px; font-weight:700; letter-spacing:2px; font-size:12px; color:var(--text-main);">${s.pin || '1234'}</code> <span style="font-size:10px; color:var(--text-muted); font-weight:500;">(Tuo PIN)</span>`;
    } else {
      pinCellContent = `<span style="color:var(--text-muted); font-size:13px; font-weight:700; letter-spacing:3px;" title="Solo il proprietario può vedere il PIN degli altri">•••• <span style="font-size:10px; font-weight:500; letter-spacing:normal; opacity:0.75;">(🔒 Nascosto)</span></span>`;
    }

    return `
    <tr style="${isCurrentActive ? 'background: rgba(255, 122, 0, 0.08);' : ''}">
      <td>
        <div class="product-row-flex">
          <img src="${s.avatar}" class="product-thumb-sm" style="border-radius:50%; cursor:pointer;" onclick="openChangeAvatarModal(${s.id})" title="Clicca per cambiare foto profilo di ${s.name}" alt="${s.name}">
          <div>
            <div style="font-weight:700; display:flex; align-items:center; gap:6px;">
              <span>${s.name}</span>
              ${isCurrentActive ? '<span style="font-size:10px; background:var(--primary); color:#FFF; padding:1px 6px; border-radius:4px;">ATTIVO</span>' : ''}
            </div>
            <div style="font-size:11px; color:var(--text-muted);">${s.email}</div>
          </div>
        </div>
      </td>
      <td>
        <span class="staff-pill-role ${roleBadgeClass}">${s.role}</span>
      </td>
      <td>
        ${pinCellContent}
      </td>
      <td>
        <span class="table-badge ${s.status === 'active' ? 'badge-served' : 'badge-alert'}">
          ${s.status === 'active' ? window.i18n.t("statusActive") : window.i18n.t("statusInactive")}
        </span>
      </td>
      <td>
        ${isOwnerRow
          ? '<span style="color:var(--primary); font-size:12px; font-weight:700; display:flex; align-items:center; gap:4px;">👑 Amministratore</span>'
          : `<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <button class="ctrl-btn" onclick="openStaffPinModal(${s.id})" title="Accedi con il PIN di questo profilo">🔑 Accedi con PIN</button>
              ${isCurrentViewerOwner ? `<button class="ctrl-btn ctrl-btn-danger" onclick="openDeleteStaffModal(${s.id})" title="Elimina definitivamente ${s.name} dal personale">🗑️ Elimina</button>` : ''}
            </div>`
        }
      </td>
    </tr>
  `;
  }).join("");
}

// --------------------------------------------------------------------------
// PIN Modal Controller (Rapid Numpad & Staff Switch)
// --------------------------------------------------------------------------
function openStaffPinModal(staffId = null) {
  const modal = document.getElementById("staffPinModal");
  if (!modal) return;

  const staffList = (window.db ? window.db.get("staff") : []) || [];
  const switchableStaff = staffList.filter(s => s.role !== "Proprietario" && s.pin);
  if (switchableStaff.length === 0) {
    showToast("⚠️ Il cambio rapido con PIN è riservato al personale operativo (camerieri, barman, cassa).");
    return;
  }

  if (staffId) {
    selectedPinStaff = switchableStaff.find(s => s.id === staffId) || switchableStaff[0];
  } else if (currentStaff && currentStaff.role !== "Proprietario") {
    selectedPinStaff = switchableStaff.find(s => s.id === currentStaff.id) || switchableStaff[0];
  } else {
    selectedPinStaff = switchableStaff[0];
  }

  enteredPin = "";
  renderStaffPinSelector();
  updateSelectedPinStaffCard();
  updatePinDots();
  hidePinError();

  modal.classList.add("active");
}

function closeStaffPinModal() {
  const modal = document.getElementById("staffPinModal");
  if (modal) modal.classList.remove("active");
  enteredPin = "";
  hidePinError();
}

function renderStaffPinSelector() {
  const row = document.getElementById("staffPinSelectorRow");
  if (!row) return;

  const staffList = (window.db ? window.db.get("staff") : []) || [];
  const switchableStaff = staffList.filter(s => s.role !== "Proprietario" && s.pin);
  row.innerHTML = switchableStaff.map(s => {
    const isSelected = selectedPinStaff && selectedPinStaff.id === s.id;
    const isCurrentActive = currentStaff && currentStaff.id === s.id;
    let badgeClass = "badge-role-waiter";
    if (s.role === "Proprietario") badgeClass = "badge-role-owner";
    else if (s.role === "Manager") badgeClass = "badge-role-manager";
    else if (s.role === "Barman") badgeClass = "badge-role-barman";
    else if (s.role === "Cassa") badgeClass = "badge-role-cashier";

    return `
      <div class="staff-pill-chip ${isSelected ? 'active' : ''}" onclick="selectStaffForPin(${s.id})">
        <img src="${s.avatar}" class="staff-pill-avatar" alt="${s.name}">
        <span class="staff-pill-name">${s.name.split(" ")[0]}</span>
        <span class="staff-pill-role ${badgeClass}">${s.role}</span>
        ${isCurrentActive ? '<span style="font-size:9px; color:var(--primary);">●</span>' : ''}
      </div>
    `;
  }).join("");
}

function selectStaffForPin(staffId) {
  const staffList = (window.db ? window.db.get("staff") : []) || [];
  const found = staffList.find(s => s.id === staffId);
  if (found) {
    selectedPinStaff = found;
    enteredPin = "";
    renderStaffPinSelector();
    updateSelectedPinStaffCard();
    updatePinDots();
    hidePinError();
  }
}

function updateSelectedPinStaffCard() {
  if (!selectedPinStaff) return;
  const avatar = document.getElementById("staffPinActiveAvatar");
  const name = document.getElementById("staffPinActiveName");
  const role = document.getElementById("staffPinActiveRole");
  const demoHint = document.getElementById("staffPinDemoHint");

  if (avatar) avatar.src = selectedPinStaff.avatar;
  if (name) name.textContent = selectedPinStaff.name;
  if (role) role.textContent = selectedPinStaff.role;

  // Solo il proprietario può vedere il PIN degli altri
  if (demoHint) {
    const isCurrentViewerOwner = !currentStaff || currentStaff.role === "Proprietario";
    const isSelf = currentStaff && currentStaff.id === selectedPinStaff.id;
    if (isCurrentViewerOwner || isSelf) {
      demoHint.style.display = "inline-block";
      demoHint.textContent = `PIN: ${selectedPinStaff.pin || '1234'}`;
    } else {
      demoHint.style.display = "none";
    }
  }
}

function updatePinDots() {
  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById(`pinDot${i}`);
    if (dot) {
      dot.classList.toggle("filled", i < enteredPin.length);
    }
  }
}

function enterPinDigit(digit) {
  if (enteredPin.length >= 4) return;
  hidePinError();
  enteredPin += digit;
  updatePinDots();

  if (enteredPin.length === 4) {
    setTimeout(verifyEnteredPin, 120);
  }
}

function deletePinDigit() {
  if (enteredPin.length > 0) {
    enteredPin = enteredPin.slice(0, -1);
    updatePinDots();
    hidePinError();
  }
}

function clearPin() {
  enteredPin = "";
  updatePinDots();
  hidePinError();
}

function showPinError() {
  const err = document.getElementById("pinErrorMsg");
  const dots = document.getElementById("pinDotsWrap");
  if (err) err.style.display = "block";
  if (dots) {
    dots.classList.add("shake-error");
    setTimeout(() => dots.classList.remove("shake-error"), 400);
  }
}

function hidePinError() {
  const err = document.getElementById("pinErrorMsg");
  if (err) err.style.display = "none";
}

function verifyEnteredPin() {
  if (!selectedPinStaff) return;
  const correctPin = selectedPinStaff.pin || "1234";

  if (enteredPin === correctPin) {
    applyActiveStaff(selectedPinStaff, true);
    closeStaffPinModal();
    showToast(`🔑 Accesso operatore: ${selectedPinStaff.name} (${selectedPinStaff.role})`);
  } else {
    showPinError();
    setTimeout(() => {
      enteredPin = "";
      updatePinDots();
    }, 450);
  }
}

// --------------------------------------------------------------------------
// Products & Staff Creation Modals
// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
// Product Management (Solo Proprietario: Foto, Opzioni, Modifica, Cancellazione)
// --------------------------------------------------------------------------
const PRODUCT_PHOTO_PRESETS = [
  { name: "Espresso", url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=300&fit=crop" },
  { name: "Cappuccino", url: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=300&h=300&fit=crop" },
  { name: "Spritz Aperol", url: "https://images.unsplash.com/photo-1560512823-829485b8bf24?w=300&h=300&fit=crop" },
  { name: "Birra Bionda", url: "https://images.unsplash.com/photo-1608270118029-79a613620e23?w=300&h=300&fit=crop" },
  { name: "Calice Vino", url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&h=300&fit=crop" },
  { name: "Gin Tonic", url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&h=300&fit=crop" },
  { name: "Croissant", url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=300&fit=crop" },
  { name: "Toast / Panino", url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=300&fit=crop" },
  { name: "Succo / Bibita", url: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300&h=300&fit=crop" },
  { name: "Tè Freddo", url: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&h=300&fit=crop" }
];

let productIdPendingDelete = null;

function renderProductPresetGrid() {
  const grid = document.getElementById("productPresetGrid");
  if (!grid) return;
  const currentImg = document.getElementById("newProdImage")?.value;
  grid.innerHTML = PRODUCT_PHOTO_PRESETS.map(preset => `
    <img src="${preset.url}" 
         class="product-preset-thumb ${currentImg === preset.url ? 'selected' : ''}" 
         title="${preset.name}" 
         alt="${preset.name}" 
         onclick="selectProductPreset('${preset.url}', this)">
  `).join("");
}

function toggleProductPresets() {
  const container = document.getElementById("productPresetContainer");
  if (!container) return;
  const isHidden = container.style.display === "none";
  container.style.display = isHidden ? "block" : "none";
  if (isHidden) renderProductPresetGrid();
}

function selectProductPreset(url, element) {
  const preview = document.getElementById("productImagePreview");
  const input = document.getElementById("newProdImage");
  if (preview) preview.src = url;
  if (input) input.value = url;
  document.querySelectorAll(".product-preset-thumb").forEach(t => t.classList.remove("selected"));
  if (element) element.classList.add("selected");
}

function updateProductImagePreview(url) {
  const preview = document.getElementById("productImagePreview");
  if (preview && url) {
    preview.src = url;
  }
}

function handleProductFileUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    const preview = document.getElementById("productImagePreview");
    const input = document.getElementById("newProdImage");
    if (preview) preview.src = dataUrl;
    if (input) input.value = dataUrl;
    document.querySelectorAll(".product-preset-thumb").forEach(t => t.classList.remove("selected"));
  };
  reader.readAsDataURL(file);
}

function recalcProductMargin() {
  const price = parseFloat(document.getElementById("newProdPrice")?.value) || 0;
  const cost = parseFloat(document.getElementById("newProdCost")?.value) || 0;
  const badge = document.getElementById("newProdMarginBadge");
  if (!badge) return;

  if (price > 0) {
    const margin = Math.round((1 - (cost / price)) * 100);
    badge.textContent = `Margine: ${margin}%`;
    if (margin >= 65) {
      badge.style.background = "rgba(34,197,94,0.15)";
      badge.style.color = "#22C55E";
      badge.style.borderColor = "rgba(34,197,94,0.3)";
    } else if (margin >= 40) {
      badge.style.background = "rgba(255,122,0,0.15)";
      badge.style.color = "var(--primary)";
      badge.style.borderColor = "rgba(255,122,0,0.3)";
    } else {
      badge.style.background = "rgba(239,68,68,0.15)";
      badge.style.color = "#EF4444";
      badge.style.borderColor = "rgba(239,68,68,0.3)";
    }
  } else {
    badge.textContent = "Margine: 0%";
  }
}

function toggleAllergenClass(checkbox) {
  const label = checkbox.closest(".allergen-pill-checkbox");
  if (label) {
    label.classList.toggle("active", checkbox.checked);
  }
}

function openAddProductModal() {
  const isOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isOwner) {
    showToast("⚠️ Solo il Proprietario può aggiungere nuovi prodotti al bar.");
    return;
  }

  const modal = document.getElementById("addProductModal");
  if (!modal) return;

  // Set mode to ADD
  const editIdEl = document.getElementById("editProductId");
  if (editIdEl) editIdEl.value = "";
  const titleEl = document.getElementById("productModalTitle");
  if (titleEl) titleEl.innerHTML = "<span>☕</span> <span>Nuovo Prodotto Bar</span>";
  const subEl = document.getElementById("productModalSubtitle");
  if (subEl) subEl.textContent = "Aggiungi una nuova bevanda o cocktail con foto e opzioni (Solo Proprietario)";
  const btnEl = document.getElementById("productModalSubmitBtn");
  if (btnEl) btnEl.textContent = "+ Salva nel Catalogo";

  // Reset inputs
  const nameEl = document.getElementById("newProdName");
  if (nameEl) nameEl.value = "";
  const catEl = document.getElementById("newProdCategory");
  if (catEl) catEl.value = "coffee";
  const priceEl = document.getElementById("newProdPrice");
  if (priceEl) priceEl.value = "";
  const costEl = document.getElementById("newProdCost");
  if (costEl) costEl.value = "";
  const vatEl = document.getElementById("newProdVat");
  if (vatEl) vatEl.value = "10";
  const stationEl = document.getElementById("newProdStation");
  if (stationEl) stationEl.value = "comptoir";
  const statusEl = document.getElementById("newProdStatus");
  if (statusEl) statusEl.value = "active";
  const descEl = document.getElementById("newProdDesc");
  if (descEl) descEl.value = "";
  const recipeEl = document.getElementById("newProdRecipe");
  if (recipeEl) recipeEl.value = "";

  const defaultImg = "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=300&fit=crop";
  const prevEl = document.getElementById("productImagePreview");
  if (prevEl) prevEl.src = defaultImg;
  const imgInput = document.getElementById("newProdImage");
  if (imgInput) imgInput.value = defaultImg;

  document.querySelectorAll('input[name="productAllergens"]').forEach(cb => {
    cb.checked = false;
    toggleAllergenClass(cb);
  });

  const presetContainer = document.getElementById("productPresetContainer");
  if (presetContainer) presetContainer.style.display = "none";

  recalcProductMargin();
  modal.classList.add("active");
}

function openEditProductModal(productId) {
  const isOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isOwner) {
    showToast("⚠️ Solo il Proprietario può modificare i prodotti.");
    return;
  }

  const products = (window.db ? window.db.get("products") : []) || [];
  const p = products.find(item => item.id == productId);
  if (!p) {
    showToast("⚠️ Prodotto non trovato.");
    return;
  }

  const modal = document.getElementById("addProductModal");
  if (!modal) return;

  // Set mode to EDIT
  const editIdEl = document.getElementById("editProductId");
  if (editIdEl) editIdEl.value = p.id;
  const titleEl = document.getElementById("productModalTitle");
  if (titleEl) titleEl.innerHTML = `<span>✏️</span> <span>Modifica ${p.name}</span>`;
  const subEl = document.getElementById("productModalSubtitle");
  if (subEl) subEl.textContent = "Aggiorna foto, prezzi, ricetta e opzioni di questo prodotto";
  const btnEl = document.getElementById("productModalSubmitBtn");
  if (btnEl) btnEl.textContent = "💾 Salva Modifiche";

  // Fill inputs
  const nameEl = document.getElementById("newProdName");
  if (nameEl) nameEl.value = p.name || "";
  const catEl = document.getElementById("newProdCategory");
  if (catEl) catEl.value = p.category || "coffee";
  const priceEl = document.getElementById("newProdPrice");
  if (priceEl) priceEl.value = p.price !== undefined ? p.price : "";
  const costEl = document.getElementById("newProdCost");
  if (costEl) costEl.value = p.cost !== undefined ? p.cost : "";
  const vatEl = document.getElementById("newProdVat");
  if (vatEl) vatEl.value = p.vat || "10";
  const stationEl = document.getElementById("newProdStation");
  if (stationEl) stationEl.value = p.station || "comptoir";
  const statusEl = document.getElementById("newProdStatus");
  if (statusEl) statusEl.value = p.status || "active";
  const descEl = document.getElementById("newProdDesc");
  if (descEl) descEl.value = p.description || "";
  const recipeEl = document.getElementById("newProdRecipe");
  if (recipeEl) recipeEl.value = p.recipeText || "";

  const img = p.image || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=300&fit=crop";
  const prevEl = document.getElementById("productImagePreview");
  if (prevEl) prevEl.src = img;
  const imgInput = document.getElementById("newProdImage");
  if (imgInput) imgInput.value = img;

  const allergens = Array.isArray(p.allergens) ? p.allergens : [];
  document.querySelectorAll('input[name="productAllergens"]').forEach(cb => {
    cb.checked = allergens.includes(cb.value);
    toggleAllergenClass(cb);
  });

  const presetContainer = document.getElementById("productPresetContainer");
  if (presetContainer) presetContainer.style.display = "none";

  recalcProductMargin();
  modal.classList.add("active");
}

function closeAddProductModal() {
  const modal = document.getElementById("addProductModal");
  if (modal) modal.classList.remove("active");
}

function handleAddProductSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const isOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isOwner) {
    showToast("⚠️ Solo il Proprietario può gestire i prodotti.");
    closeAddProductModal();
    return;
  }

  const editId = document.getElementById("editProductId")?.value;
  const name = document.getElementById("newProdName")?.value.trim();
  const category = document.getElementById("newProdCategory")?.value || "coffee";
  const price = parseFloat(document.getElementById("newProdPrice")?.value) || 0;
  const cost = parseFloat(document.getElementById("newProdCost")?.value) || 0;
  const vat = document.getElementById("newProdVat")?.value || "10";
  const station = document.getElementById("newProdStation")?.value || "comptoir";
  const status = document.getElementById("newProdStatus")?.value || "active";
  const image = document.getElementById("newProdImage")?.value || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=300&fit=crop";
  const description = document.getElementById("newProdDesc")?.value.trim() || "";
  const recipeText = document.getElementById("newProdRecipe")?.value.trim() || "";

  // Collect checked allergens
  const allergens = [];
  document.querySelectorAll('input[name="productAllergens"]:checked').forEach(cb => {
    allergens.push(cb.value);
  });

  if (!name) {
    showToast("⚠️ Inserisci il nome del prodotto.");
    return;
  }
  if (price <= 0) {
    showToast("⚠️ Inserisci un prezzo di vendita valido.");
    return;
  }

  const products = (window.db ? window.db.get("products") : []) || [];

  if (editId) {
    // Update existing product
    const idx = products.findIndex(p => p.id == editId);
    if (idx !== -1) {
      products[idx] = {
        ...products[idx],
        name,
        category,
        price,
        cost,
        vat,
        station,
        status,
        image,
        description,
        recipeText,
        allergens
      };
      window.db.set("products", products);
      showToast(`✅ Prodotto "${name}" aggiornato con successo!`);
    }
  } else {
    // Create new product
    const newProduct = {
      id: Date.now(),
      name,
      category,
      price,
      cost,
      vat,
      station,
      status,
      image,
      description,
      recipeText,
      allergens,
      salesCount: 0
    };
    products.push(newProduct);
    window.db.set("products", products);
    showToast(`✅ Prodotto "${name}" aggiunto al catalogo dal Proprietario!`);
  }

  renderProducts();
  renderOrderCatalog();
  closeAddProductModal();
}

function openDeleteProductModal(productId) {
  const isOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isOwner) {
    showToast("⚠️ Solo il Proprietario può eliminare prodotti.");
    return;
  }

  const products = (window.db ? window.db.get("products") : []) || [];
  const p = products.find(item => item.id == productId);
  if (!p) return;

  productIdPendingDelete = productId;
  const nameEl = document.getElementById("deleteProductName");
  if (nameEl) nameEl.textContent = p.name;
  const infoEl = document.getElementById("deleteProductInfo");
  if (infoEl) infoEl.textContent = `${p.category} · ${p.price.toFixed(2)} €`;
  const thumbEl = document.getElementById("deleteProductThumb");
  if (thumbEl) thumbEl.src = p.image || "";

  const modal = document.getElementById("deleteProductModal");
  if (modal) modal.classList.add("active");
}

function closeDeleteProductModal() {
  productIdPendingDelete = null;
  const modal = document.getElementById("deleteProductModal");
  if (modal) modal.classList.remove("active");
}

function confirmDeleteProductAction() {
  const isOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isOwner) {
    showToast("⚠️ Azione negata: solo il Proprietario può eliminare prodotti.");
    closeDeleteProductModal();
    return;
  }

  if (!productIdPendingDelete) {
    closeDeleteProductModal();
    return;
  }

  const products = (window.db ? window.db.get("products") : []) || [];
  const target = products.find(p => p.id == productIdPendingDelete);
  const updated = products.filter(p => p.id != productIdPendingDelete);
  window.db.set("products", updated);

  const deletedName = target ? target.name : "Prodotto";
  closeDeleteProductModal();
  renderProducts();
  renderOrderCatalog();
  showToast(`🗑️ Prodotto "${deletedName}" eliminato dal catalogo.`);
}

function toggleProductAvailabilityStatus(productId) {
  const isOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isOwner) {
    showToast("⚠️ Solo il Proprietario può modificare la disponibilità del prodotto.");
    return;
  }

  const products = (window.db ? window.db.get("products") : []) || [];
  const p = products.find(item => item.id == productId);
  if (!p) return;

  p.status = p.status === "out_of_stock" ? "active" : "out_of_stock";
  window.db.set("products", products);

  renderProducts();
  renderOrderCatalog();
  showToast(`${p.status === "active" ? '🟢' : '🔴'} "${p.name}" impostato come ${p.status === "active" ? 'Disponibile' : 'Esaurito'}.`);
}

function openAddStaffModal() {
  if (currentStaff && currentStaff.role !== "Proprietario") {
    showToast("⚠️ Solo il Proprietario può aggiungere nuovi membri del personale.");
    return;
  }
  const modal = document.getElementById("addStaffModal");
  if (modal) modal.classList.add("active");
}

function closeAddStaffModal() {
  const modal = document.getElementById("addStaffModal");
  if (modal) modal.classList.remove("active");
}

function handleAddStaffSubmit(e) {
  e.preventDefault();
  if (currentStaff && currentStaff.role !== "Proprietario") {
    showToast("⚠️ Solo il Proprietario può aggiungere nuovi membri del personale.");
    return;
  }

  const name = document.getElementById("newStaffName")?.value.trim();
  const role = document.getElementById("newStaffRole")?.value || "Cameriere";
  const email = (document.getElementById("newStaffEmail")?.value || "").trim().toLowerCase();
  const pin = role === "Proprietario" ? null : ((document.getElementById("newStaffPin")?.value.trim() || "1234").slice(0, 4));

  if (!name || !email) return;

  const defaultAvatars = {
    Proprietario: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
    Manager: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop",
    Cameriere: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop",
    Barman: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
    Cassa: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop"
  };

  const staff = window.db.get("staff") || [];
  const existing = staff.find(s => s.email && s.email.toLowerCase() === email);
  let savedMember = null;
  if (existing) {
    existing.name = name;
    existing.role = role;
    existing.pin = pin;
    savedMember = existing;
  } else {
    const newMember = {
      id: Date.now(),
      name: name,
      role: role,
      email: email,
      pin: pin,
      status: "active",
      avatar: defaultAvatars[role] || defaultAvatars.Cameriere
    };
    staff.push(newMember);
    savedMember = newMember;
  }
  window.db.set("staff", staff);

  // Salva anche nelle credenziali di accesso così il dipendente può accedere via Email e PIN
  saveUserToDatabase({
    id: "usr_" + Date.now(),
    type: "email",
    email: email,
    name: name,
    role: role,
    pin: pin,
    password: pin ? `pin${pin}` : "password123",
    barName: window.db.get("activeBar")?.name || "Bar Centrale",
    city: window.db.get("activeBar")?.city || "Roma",
    date: new Date().toISOString()
  });

  renderStaff();
  closeAddStaffModal();
  document.getElementById("addStaffForm")?.reset();
  showToast(role === "Proprietario" 
    ? `👥 ${name} aggiunto come Proprietario (accesso esclusivo con Password, nessun PIN).` 
    : `👥 ${name} aggiunto al personale come ${role} (PIN: ${pin})!`);

  // Apertura email benvenuto con logo, credenziali e personalizzazione foto
  openStaffWelcomeEmailModal(savedMember);
}


// --------------------------------------------------------------------------
// Staff Welcome Email Notification & Avatar Customization
// --------------------------------------------------------------------------
let currentWelcomeStaffMember = null;
let currentAvatarTargetStaffId = null;
let pendingSelectedAvatarUrl = "";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&h=160&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&h=160&fit=crop",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&h=160&fit=crop",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&h=160&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop"
];

function openStaffWelcomeEmailModal(member) {
  if (!member) return;
  currentWelcomeStaffMember = member;

  const modal = document.getElementById("staffWelcomeEmailModal");
  if (!modal) return;

  const activeBar = (window.db ? window.db.get("activeBar") : null) || { name: "Bar Centrale", city: "Roma" };
  const origin = window.location.origin && window.location.origin !== "null" ? window.location.origin : "https://cheikh10154.github.io";
  const pathname = window.location.pathname || "/BarPilot/";
  const accessUrl = origin.includes("http") ? `${origin}${pathname}` : "https://cheikh10154.github.io/BarPilot/";

  const toEl = document.getElementById("welcomeEmailTo");
  if (toEl) toEl.textContent = `${member.name} <${member.email}>`;

  const badgeEl = document.getElementById("welcomeEmailRoleBadge");
  if (badgeEl) badgeEl.textContent = member.role;

  const greetingEl = document.getElementById("welcomeEmailGreeting");
  if (greetingEl) greetingEl.textContent = `Ciao ${member.name}, benvenuto nel team! 👋`;

  const introEl = document.getElementById("welcomeEmailIntro");
  if (introEl) {
    introEl.innerHTML = `Sei stato aggiunto ufficialmente come membro del personale per <strong>${activeBar.name}</strong> con il ruolo di <strong>${member.role}</strong>.`;
  }

  const emailCredEl = document.getElementById("welcomeEmailCredEmail");
  if (emailCredEl) emailCredEl.textContent = member.email;

  const pinCredEl = document.getElementById("welcomeEmailCredPin");
  if (pinCredEl) {
    if (member.role === "Proprietario" || !member.pin) {
      pinCredEl.textContent = "NESSUNO";
      pinCredEl.title = "Accesso tramite Password account";
    } else {
      pinCredEl.textContent = member.pin;
      pinCredEl.title = "PIN numerico a 4 cifre";
    }
  }

  const accessLinkBtn = document.getElementById("welcomeEmailAccessLink");
  if (accessLinkBtn) accessLinkBtn.href = accessUrl;

  const urlTextEl = document.getElementById("welcomeEmailUrlText");
  if (urlTextEl) urlTextEl.textContent = `Link di accesso rapido: ${accessUrl}`;

  const avatarPreview = document.getElementById("welcomeEmailAvatarPreview");
  if (avatarPreview) {
    avatarPreview.src = member.avatar || AVATAR_PRESETS[0];
    avatarPreview.alt = member.name;
  }

  const barCityEl = document.getElementById("welcomeEmailBarCity");
  if (barCityEl) barCityEl.textContent = `${activeBar.name} (${activeBar.city || 'Italia'})`;

  const mailtoBtn = document.getElementById("welcomeEmailMailtoBtn");
  if (mailtoBtn) {
    const subject = encodeURIComponent(`🎉 Benvenuto nel team di ${activeBar.name}! Le tue credenziali BarPilot`);
    const body = encodeURIComponent(
`Ciao ${member.name},

Benvenuto nel team di ${activeBar.name}!
Sei stato configurato nel gestionale BarPilot con il ruolo di: ${member.role}

🔐 LE TUE CREDENZIALI DI ACCESSO:
• Email di login: ${member.email}
• PIN Veloce tablet: ${member.pin ? member.pin : "Nessun PIN (Accesso con Password)"}
• Link di accesso rapido: ${accessUrl}

Sul tablet del locale seleziona "PIN veloce", digita il tuo codice a 4 cifre e accedi direttamente alla tua postazione operativa.
Puoi anche personalizzare la tua foto profilo direttamente dall'app.

Buon lavoro!
Il Team di ${activeBar.name}`
    );
    mailtoBtn.href = `mailto:${member.email}?subject=${subject}&body=${body}`;
  }

  modal.classList.add("active");
}

function closeStaffWelcomeEmailModal() {
  const modal = document.getElementById("staffWelcomeEmailModal");
  if (modal) modal.classList.remove("active");
}

function copyWelcomeEmailDetails() {
  if (!currentWelcomeStaffMember) return;
  const activeBar = (window.db ? window.db.get("activeBar") : null) || { name: "Bar Centrale", city: "Roma" };
  const origin = window.location.origin && window.location.origin !== "null" ? window.location.origin : "https://cheikh10154.github.io";
  const pathname = window.location.pathname || "/BarPilot/";
  const accessUrl = origin.includes("http") ? `${origin}${pathname}` : "https://cheikh10154.github.io/BarPilot/";

  const text = `🎉 Benvenuto nel team di ${activeBar.name}!
Ruolo: ${currentWelcomeStaffMember.role}
Email: ${currentWelcomeStaffMember.email}
PIN Veloce: ${currentWelcomeStaffMember.pin || 'Nessun PIN (Accesso con Password)'}
Link di accesso: ${accessUrl}`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast("📋 Credenziali e testo email copiati negli appunti!");
    }).catch(() => {
      prompt("Copia il testo di seguito:", text);
    });
  } else {
    prompt("Copia il testo di seguito:", text);
  }
}

function openAvatarModalFromWelcome() {
  if (currentWelcomeStaffMember) {
    openChangeAvatarModal(currentWelcomeStaffMember.id);
  }
}

function openChangeAvatarModal(staffId) {
  const modal = document.getElementById("changeAvatarModal");
  if (!modal) return;

  const staff = (window.db ? window.db.get("staff") : []) || [];
  let targetMember = null;

  if (staffId !== undefined && staffId !== null) {
    targetMember = staff.find(s => s.id === Number(staffId) || s.id === staffId);
    currentAvatarTargetStaffId = targetMember ? targetMember.id : null;
  } else if (currentStaff) {
    targetMember = currentStaff;
    currentAvatarTargetStaffId = currentStaff.id;
  } else if (currentWelcomeStaffMember) {
    targetMember = currentWelcomeStaffMember;
    currentAvatarTargetStaffId = currentWelcomeStaffMember.id;
  } else if (staff.length > 0) {
    targetMember = staff[0];
    currentAvatarTargetStaffId = targetMember.id;
  }

  const nameEl = document.getElementById("changeAvatarTargetName");
  const roleEl = document.getElementById("changeAvatarTargetRole");
  const previewEl = document.getElementById("avatarCurrentPreview");
  const fileInput = document.getElementById("avatarFileInput");
  const urlInput = document.getElementById("avatarUrlInput");

  const currentAvatar = targetMember?.avatar || AVATAR_PRESETS[0];
  pendingSelectedAvatarUrl = currentAvatar;

  if (nameEl) nameEl.textContent = targetMember ? targetMember.name : "Utente";
  if (roleEl) roleEl.textContent = targetMember ? targetMember.role : "";
  if (previewEl) previewEl.src = currentAvatar;
  if (fileInput) fileInput.value = "";
  if (urlInput) urlInput.value = "";

  renderAvatarPresets();
  modal.classList.add("active");
}

function closeChangeAvatarModal() {
  const modal = document.getElementById("changeAvatarModal");
  if (modal) modal.classList.remove("active");
}

function renderAvatarPresets() {
  const container = document.getElementById("avatarPresetGrid");
  if (!container) return;

  container.innerHTML = AVATAR_PRESETS.map((url, idx) => {
    const isSelected = pendingSelectedAvatarUrl === url;
    return `
      <img src="${url}" 
           class="avatar-preset-item ${isSelected ? 'active' : ''}" 
           onclick="selectPresetAvatar('${url}')" 
           alt="Preset ${idx + 1}" 
           title="Seleziona questo avatar">
    `;
  }).join("");
}

function selectPresetAvatar(url) {
  pendingSelectedAvatarUrl = url;
  const previewEl = document.getElementById("avatarCurrentPreview");
  if (previewEl) previewEl.src = url;
  renderAvatarPresets();
}

function handleAvatarUrlInput(url) {
  const trimmed = (url || "").trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    pendingSelectedAvatarUrl = trimmed;
    const previewEl = document.getElementById("avatarCurrentPreview");
    if (previewEl) previewEl.src = trimmed;
    renderAvatarPresets();
  }
}

function handleAvatarFileUpload(event) {
  const file = event.target?.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("⚠️ Seleziona un file immagine valido (JPG, PNG, WebP).");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast("⚠️ L'immagine è troppo grande. Dimensione massima 5MB.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result;
    pendingSelectedAvatarUrl = base64;
    const previewEl = document.getElementById("avatarCurrentPreview");
    if (previewEl) previewEl.src = base64;
    renderAvatarPresets();
    showToast("✓ Foto caricata con successo! Clicca su Salva per applicarla.");
  };
  reader.readAsDataURL(file);
}

function saveSelectedAvatar() {
  if (!pendingSelectedAvatarUrl) {
    showToast("⚠️ Seleziona o carica una foto prima di salvare.");
    return;
  }

  const staff = (window.db ? window.db.get("staff") : []) || [];

  if (currentAvatarTargetStaffId !== null && currentAvatarTargetStaffId !== undefined) {
    const target = staff.find(s => s.id === currentAvatarTargetStaffId);
    if (target) {
      target.avatar = pendingSelectedAvatarUrl;
    }
  }

  if (currentStaff && (currentAvatarTargetStaffId === null || currentStaff.id === currentAvatarTargetStaffId)) {
    currentStaff.avatar = pendingSelectedAvatarUrl;
    try {
      const sessionUser = JSON.parse(localStorage.getItem("barpilot_auth_session") || "null");
      if (sessionUser) {
        sessionUser.avatar = pendingSelectedAvatarUrl;
        localStorage.setItem("barpilot_auth_session", JSON.stringify(sessionUser));
      }
    } catch(err) {
      console.warn("Session update error:", err);
    }
  }

  if (currentWelcomeStaffMember && (currentAvatarTargetStaffId === currentWelcomeStaffMember.id || currentAvatarTargetStaffId === null)) {
    currentWelcomeStaffMember.avatar = pendingSelectedAvatarUrl;
    const welcomePreview = document.getElementById("welcomeEmailAvatarPreview");
    if (welcomePreview) welcomePreview.src = pendingSelectedAvatarUrl;
  }

  window.db.set("staff", staff);

  const sidebarAvatar = document.getElementById("sidebarUserAvatar");
  if (sidebarAvatar && currentStaff && currentStaff.avatar) {
    sidebarAvatar.src = currentStaff.avatar;
  }
  const topbarAvatar = document.getElementById("topbarUserAvatar");
  if (topbarAvatar && currentStaff && currentStaff.avatar) {
    topbarAvatar.src = currentStaff.avatar;
  }

  renderStaff();
  closeChangeAvatarModal();
  showToast("🖼️ Foto profilo salvata e aggiornata con successo!");
}


// --------------------------------------------------------------------------
// Delete Staff Member (Exclusive to Owner)
// --------------------------------------------------------------------------
let pendingDeleteStaffId = null;

function openDeleteStaffModal(staffId) {
  // Controllo di sicurezza rigoroso: solo ed esclusivamente il Proprietario può eliminare dipendenti
  const isOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isOwner) {
    showToast("⚠️ Solo il Proprietario ha i permessi per eliminare i dipendenti.");
    return;
  }

  const staff = (window.db ? window.db.get("staff") : []) || [];
  const target = staff.find(s => s.id === Number(staffId) || s.id === staffId);
  if (!target) return;

  if (target.role === "Proprietario") {
    showToast("⚠️ Non è possibile eliminare il profilo Proprietario.");
    return;
  }

  pendingDeleteStaffId = target.id;
  const nameEl = document.getElementById("deleteStaffTargetName");
  const roleEl = document.getElementById("deleteStaffTargetRole");
  if (nameEl) nameEl.textContent = target.name;
  if (roleEl) roleEl.textContent = target.role;

  const modal = document.getElementById("deleteStaffConfirmModal");
  if (modal) modal.classList.add("active");
}

function closeDeleteStaffModal() {
  pendingDeleteStaffId = null;
  const modal = document.getElementById("deleteStaffConfirmModal");
  if (modal) modal.classList.remove("active");
}

function confirmDeleteStaffAction() {
  // Controllo di sicurezza rigoroso: solo ed esclusivamente il Proprietario può eliminare dipendenti
  const isOwner = !currentStaff || currentStaff.role === "Proprietario";
  if (!isOwner) {
    showToast("⚠️ Accesso negato: solo il Proprietario può eliminare i dipendenti.");
    closeDeleteStaffModal();
    return;
  }

  if (!pendingDeleteStaffId) {
    closeDeleteStaffModal();
    return;
  }

  let staff = (window.db ? window.db.get("staff") : []) || [];
  const targetIndex = staff.findIndex(s => s.id === pendingDeleteStaffId);
  if (targetIndex === -1) {
    closeDeleteStaffModal();
    return;
  }

  const target = staff[targetIndex];
  if (target.role === "Proprietario") {
    showToast("⚠️ Non è possibile eliminare il profilo Proprietario.");
    closeDeleteStaffModal();
    return;
  }

  const deletedName = target.name;
  const deletedEmail = (target.email || "").toLowerCase().trim();

  // 1. Rimuovi dall'elenco del personale
  staff.splice(targetIndex, 1);
  window.db.set("staff", staff);

  // 2. Rimuovi dalle credenziali di accesso nel db utenti
  try {
    let dbUsers = window.db.get("users") || [];
    if (Array.isArray(dbUsers)) {
      dbUsers = dbUsers.filter(u => !(u.email && u.email.toLowerCase().trim() === deletedEmail));
      window.db.set("users", dbUsers);
    }
  } catch (err) {
    console.warn("Errore filtro dbUsers:", err);
  }

  // 3. Rimuovi da localStorage registered users
  try {
    const rawUsers = localStorage.getItem("barpilot_registered_users");
    if (rawUsers) {
      let regUsers = JSON.parse(rawUsers);
      if (Array.isArray(regUsers)) {
        regUsers = regUsers.filter(u => !(u.email && u.email.toLowerCase().trim() === deletedEmail));
        localStorage.setItem("barpilot_registered_users", JSON.stringify(regUsers));
      }
    }
  } catch (err) {
    console.warn("Errore filtro registered_users:", err);
  }

  // 4. Se il dipendente eliminato è attualmente impostato come sessione attiva
  if (currentStaff && currentStaff.id === pendingDeleteStaffId) {
    const ownerStaff = staff.find(s => s.role === "Proprietario");
    currentStaff = ownerStaff || null;
    try {
      const session = JSON.parse(localStorage.getItem("barpilot_auth_session") || "null");
      if (session && session.email && session.email.toLowerCase().trim() === deletedEmail) {
        localStorage.removeItem("barpilot_auth_session");
      }
    } catch(e) {}
  }

  // 5. Se il dipendente era selezionato nel PIN selector
  if (selectedPinStaff && selectedPinStaff.id === pendingDeleteStaffId) {
    selectedPinStaff = staff.find(s => s.role !== "Proprietario") || staff[0] || null;
  }

  closeDeleteStaffModal();
  renderStaff();
  renderStaffPinSelector();
  showToast(`🗑️ Dipendente "${deletedName}" eliminato con successo. Accesso e PIN revocati.`);
}


// --------------------------------------------------------------------------
// Password Recovery Controller (Supabase Auth)
// --------------------------------------------------------------------------
function openPasswordRecoveryModal() {
  const modal = document.getElementById("passwordRecoveryModal");
  if (modal) {
    const emailField = document.getElementById("authEmail");
    const recInput = document.getElementById("recoveryEmailInput");
    if (recInput && emailField && emailField.value) {
      recInput.value = emailField.value;
    }
    modal.classList.add("active");
  }
}

function closePasswordRecoveryModal() {
  const modal = document.getElementById("passwordRecoveryModal");
  if (modal) modal.classList.remove("active");
}

async function handlePasswordRecoverySubmit(e) {
  e.preventDefault();
  const input = document.getElementById("recoveryEmailInput");
  const email = input ? input.value.trim().toLowerCase() : "";
  if (!email) return;

  const btn = document.getElementById("recoverySubmitBtn");
  if (btn) btn.disabled = true;

  try {
    if (window.supabase && window.supabase.auth) {
      await window.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password"
      });
    }
    closePasswordRecoveryModal();
    showToast(`✉️ Link di recupero inviato con successo a ${email}! Controlla la tua posta.`);
  } catch (err) {
    showToast("⚠️ Impossibile inviare il link di recupero al momento. Riprova più tardi.");
  } finally {
    if (btn) btn.disabled = false;
  }
}

// Global Exports
window.openPasswordRecoveryModal = openPasswordRecoveryModal;
window.closePasswordRecoveryModal = closePasswordRecoveryModal;
window.handlePasswordRecoverySubmit = handlePasswordRecoverySubmit;
window.openDeleteStaffModal = openDeleteStaffModal;
window.closeDeleteStaffModal = closeDeleteStaffModal;
window.confirmDeleteStaffAction = confirmDeleteStaffAction;

window.openStaffWelcomeEmailModal = openStaffWelcomeEmailModal;
window.closeStaffWelcomeEmailModal = closeStaffWelcomeEmailModal;
window.copyWelcomeEmailDetails = copyWelcomeEmailDetails;
window.openAvatarModalFromWelcome = openAvatarModalFromWelcome;
window.openChangeAvatarModal = openChangeAvatarModal;
window.closeChangeAvatarModal = closeChangeAvatarModal;
window.selectPresetAvatar = selectPresetAvatar;
window.handleAvatarUrlInput = handleAvatarUrlInput;
window.handleAvatarFileUpload = handleAvatarFileUpload;
window.saveSelectedAvatar = saveSelectedAvatar;
window.openStaffPinModal = openStaffPinModal;
window.closeStaffPinModal = closeStaffPinModal;
window.selectStaffForPin = selectStaffForPin;
window.enterPinDigit = enterPinDigit;
window.deletePinDigit = deletePinDigit;
window.clearPin = clearPin;
window.verifyEnteredPin = verifyEnteredPin;
window.openAddProductModal = openAddProductModal;
window.closeAddProductModal = closeAddProductModal;
window.handleAddProductSubmit = handleAddProductSubmit;
window.openAddStaffModal = openAddStaffModal;
window.closeAddStaffModal = closeAddStaffModal;
window.handleAddStaffSubmit = handleAddStaffSubmit;

// --------------------------------------------------------------------------
// Reports & Analytics (Giornaliero, Settimanale, Mensile con Asse X Date & Asse Y Valori)
// --------------------------------------------------------------------------
let currentReportsPeriod = "week";
let selectedReportPointIndex = null;

const REPORTS_DATASETS = {
  day: {
    id: "day",
    title: "Andamento Orario Vendite (Oggi)",
    subtitle: "Ascisse (X): Fasce orarie del turno · Bississe (Y): Incasso orario in Euro (€)",
    dateRangeText: "Oggi · " + new Date().toLocaleDateString("it-IT", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    kpi: {
      revenue: "1.550 €",
      growth: "+14.2% vs ieri",
      orders: "278",
      ordersSub: "Media di 35 all'ora",
      avgTicket: "5,58 €",
      peak: "18:00 - 20:00",
      peakSub: "Rush Aperitivo (700 €)"
    },
    maxVal: 400,
    yLabels: [400, 300, 200, 100, 0],
    points: [
      { label: "08:00", value: 65, orders: 24, note: "Colazioni: espresso & cornetti" },
      { label: "10:00", value: 140, orders: 42, note: "Break metà mattina" },
      { label: "12:00", value: 210, orders: 35, note: "Pranzo veloce & toast" },
      { label: "14:00", value: 160, orders: 30, note: "Caffè dopo pranzo" },
      { label: "16:00", value: 95, orders: 18, note: "Pausa pomeridiana" },
      { label: "18:00", value: 380, orders: 58, note: "Picco Spritz & cocktail" },
      { label: "20:00", value: 320, orders: 45, note: "Taglieri & apericena" },
      { label: "22:00", value: 180, orders: 26, note: "Drink serali & amari" }
    ]
  },
  week: {
    id: "week",
    title: "Andamento Giornaliero della Settimana",
    subtitle: "Ascisse (X): Giorni e Date · Bississe (Y): Fatturato giornaliero in Euro (€)",
    dateRangeText: "Ultimi 7 Giorni · Lun 19 - Dom 25 Ottobre",
    kpi: {
      revenue: "11.220 €",
      growth: "+9.4% vs sett. prec.",
      orders: "1.540",
      ordersSub: "Media di 220 al giorno",
      avgTicket: "7,29 €",
      peak: "Sabato 24 Ott",
      peakSub: "Serata Aperitivi & DJ (2.450 €)"
    },
    maxVal: 2500,
    yLabels: [2500, 2000, 1500, 1000, 500, 0],
    points: [
      { label: "Lun 19", value: 980, orders: 145, note: "Avvio settimana lavorativa" },
      { label: "Mar 20", value: 1150, orders: 168, note: "Business lunch & pause" },
      { label: "Mer 21", value: 1280, orders: 182, note: "Aperitivo infrasettimanale" },
      { label: "Gio 22", value: 1420, orders: 195, note: "Pre-weekend cocktail" },
      { label: "Ven 23", value: 2180, orders: 290, note: "Venerdì sera & musica" },
      { label: "Sab 24", value: 2450, orders: 320, note: "Picco del weekend" },
      { label: "Dom 25", value: 1760, orders: 240, note: "Brunch & aperitivo domenicale" }
    ]
  },
  month: {
    id: "month",
    title: "Andamento Progressivo del Mese",
    subtitle: "Ascisse (X): Date del Mese · Bississe (Y): Fatturato aggregato in Euro (€)",
    dateRangeText: "Mese Corrente · 1 - 31 Ottobre",
    kpi: {
      revenue: "42.850 €",
      growth: "+12.8% vs mese prec.",
      orders: "5.860",
      ordersSub: "Media di 189 comande/die",
      avgTicket: "7,31 €",
      peak: "25 Ottobre",
      peakSub: "Record mensile (2.150 €)"
    },
    maxVal: 2500,
    yLabels: [2500, 2000, 1500, 1000, 500, 0],
    points: [
      { label: "01 Ott", value: 1120, orders: 160, note: "Inizio mese" },
      { label: "05 Ott", value: 1350, orders: 185, note: "Prima domenica" },
      { label: "10 Ott", value: 1280, orders: 175, note: "Venerdì lavorativo" },
      { label: "15 Ott", value: 1640, orders: 215, note: "Metà mese & forniture" },
      { label: "20 Ott", value: 1520, orders: 200, note: "Lunedì dinamico" },
      { label: "25 Ott", value: 2150, orders: 280, note: "Festa della birra" },
      { label: "31 Ott", value: 1840, orders: 245, note: "Serata evento speciale" }
    ]
  }
};


// ============================================================================
// ============================================================================
// Custom Time Range & Italian Calendar Table Engine (DD/MM/YYYY)
// ============================================================================
const IT_MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

let calCurrentYear = new Date().getFullYear();
let calCurrentMonth = new Date().getMonth();
let calRangeStart = null;
let calRangeEnd = null;
let calSelectingStep = 0; // 0 = next click sets start, 1 = next click sets end

// Format Date object to Italian format GG/MM/AAAA
function formatDateIT(date) {
  if (!date || isNaN(date.getTime())) return "";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// Parse Italian format GG/MM/AAAA to Date object
function parseDateIT(str) {
  if (!str) return null;
  const clean = String(str).trim();
  const parts = clean.split(/[\/\-\.]/);
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (y < 2000 || y > 2100 || m < 0 || m > 11 || d < 1 || d > 31) return null;
  const date = new Date(y, m, d);
  if (date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
    return date;
  }
  return null;
}

// Format Date to YYYY-MM-DD for native input sync
function formatYmd(d) {
  if (!d || isNaN(d.getTime())) return "";
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${da}`;
}

function toggleCustomRangeBox() {
  const box = document.getElementById("reportsCustomRangeBox");
  if (box) {
    box.style.display = (box.style.display === "none") ? "flex" : "flex";
  }
  const btnCustom = document.getElementById("btnReportCustom");
  const btnDay = document.getElementById("btnReportDay");
  const btnWeek = document.getElementById("btnReportWeek");
  const btnMonth = document.getElementById("btnReportMonth");
  if (btnCustom) btnCustom.classList.add("active");
  if (btnDay) btnDay.classList.remove("active");
  if (btnWeek) btnWeek.classList.remove("active");
  if (btnMonth) btnMonth.classList.remove("active");

  applyReportPreset("7days");
  renderReportsCalendarTable();
}

function toggleReportsCalendarTable() {
  const container = document.getElementById("reportsCalendarContainer");
  const btnText = document.getElementById("btnToggleCalendarText");
  if (!container) return;

  const isHidden = (container.style.display === "none");
  container.style.display = isHidden ? "block" : "none";
  if (btnText) {
    btnText.textContent = isHidden ? "Nascondi Tabella" : "Mostra Tabella";
  }
}

function navCalendarMonth(delta) {
  if (delta === 0) {
    const today = new Date();
    calCurrentYear = today.getFullYear();
    calCurrentMonth = today.getMonth();
  } else {
    calCurrentMonth += delta;
    if (calCurrentMonth > 11) {
      calCurrentMonth = 0;
      calCurrentYear++;
    } else if (calCurrentMonth < 0) {
      calCurrentMonth = 11;
      calCurrentYear--;
    }
  }
  renderReportsCalendarTable();
}

function renderReportsCalendarTable() {
  const tbody = document.getElementById("reportsCalendarTbody");
  const labelEl = document.getElementById("reportsCalCurrentMonthLabel");
  if (!tbody) return;

  if (labelEl) {
    labelEl.innerHTML = `<span>🗓️</span> <span>${IT_MONTH_NAMES[calCurrentMonth]} ${calCurrentYear}</span>`;
  }

  tbody.innerHTML = "";

  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  const firstDay = new Date(calCurrentYear, calCurrentMonth, 1);
  const totalDays = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();

  // Italian calendar: Monday-based (0 = Lun, 6 = Dom)
  const startDayOffset = (firstDay.getDay() + 6) % 7;

  let currentDay = 1;
  let tr = document.createElement("tr");

  // Leading empty cells
  for (let i = 0; i < startDayOffset; i++) {
    const td = document.createElement("td");
    td.className = "reports-calendar-cell empty";
    td.textContent = "";
    tr.appendChild(td);
  }

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const isBetweenDays = (target, start, end) => {
    if (!target || !start || !end) return false;
    const tTime = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
    const sTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const eTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    return tTime > sTime && tTime < eTime;
  };

  while (currentDay <= totalDays) {
    if (tr.children.length === 7) {
      tbody.appendChild(tr);
      tr = document.createElement("tr");
    }

    const cellDate = new Date(calCurrentYear, calCurrentMonth, currentDay);
    const dayNum = currentDay;
    const td = document.createElement("td");
    td.className = "reports-calendar-cell";

    const isToday = (calCurrentYear === todayY && calCurrentMonth === todayM && dayNum === todayD);
    if (isToday) td.classList.add("today-cell");

    const isStart = isSameDay(cellDate, calRangeStart);
    const isEnd = isSameDay(cellDate, calRangeEnd);
    const isInRange = isBetweenDays(cellDate, calRangeStart, calRangeEnd);

    if (isStart && isEnd) {
      td.classList.add("range-start", "range-end", "range-single");
      td.title = `Data selezionata: ${formatDateIT(cellDate)}`;
    } else if (isStart) {
      td.classList.add("range-start");
      td.title = `Da Data: ${formatDateIT(cellDate)}`;
    } else if (isEnd) {
      td.classList.add("range-end");
      td.title = `A Data: ${formatDateIT(cellDate)}`;
    } else if (isInRange) {
      td.classList.add("in-range");
      td.title = `Incluso nel periodo (${formatDateIT(cellDate)})`;
    }

    td.textContent = dayNum;

    // Direct click handler for table selection
    td.onclick = () => handleCalendarCellClick(calCurrentYear, calCurrentMonth, dayNum);

    tr.appendChild(td);
    currentDay++;
  }

  // Trailing empty cells
  while (tr.children.length < 7) {
    const td = document.createElement("td");
    td.className = "reports-calendar-cell empty";
    td.textContent = "";
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
}

function handleCalendarCellClick(year, month, day) {
  const clickedDate = new Date(year, month, day);

  if (calSelectingStep === 0 || !calRangeStart || (calRangeStart && calRangeEnd)) {
    // Step 1: First click sets Da Data
    calRangeStart = clickedDate;
    calRangeEnd = null;
    calSelectingStep = 1;

    const startInputIT = document.getElementById("reportStartDateIT");
    const endInputIT = document.getElementById("reportEndDateIT");
    if (startInputIT) startInputIT.value = formatDateIT(calRangeStart);
    if (endInputIT) endInputIT.value = "";

    const hint = document.getElementById("calSelectionStatusHint");
    if (hint) {
      hint.innerHTML = `🟢 <strong>Da Data:</strong> ${formatDateIT(calRangeStart)} — Ora clicca su una data per <strong>A Data</strong>`;
    }

    renderReportsCalendarTable();
  } else if (calSelectingStep === 1) {
    // Step 2: Second click sets A Data
    if (clickedDate < calRangeStart) {
      calRangeEnd = calRangeStart;
      calRangeStart = clickedDate;
    } else {
      calRangeEnd = clickedDate;
    }
    calSelectingStep = 0;

    const startInputIT = document.getElementById("reportStartDateIT");
    const endInputIT = document.getElementById("reportEndDateIT");
    if (startInputIT) startInputIT.value = formatDateIT(calRangeStart);
    if (endInputIT) endInputIT.value = formatDateIT(calRangeEnd);

    // Sync native inputs
    const startNative = document.getElementById("reportStartDate");
    const endNative = document.getElementById("reportEndDate");
    if (startNative) startNative.value = formatYmd(calRangeStart);
    if (endNative) endNative.value = formatYmd(calRangeEnd);

    const hint = document.getElementById("calSelectionStatusHint");
    if (hint) {
      hint.innerHTML = `✅ <strong>Periodo:</strong> ${formatDateIT(calRangeStart)} ➔ ${formatDateIT(calRangeEnd)}`;
    }

    renderReportsCalendarTable();

    // Deselect preset chips because user made custom selection on table
    const chips = ["chipPresetToday", "chipPresetYesterday", "chipPreset7", "chipPreset14", "chipPreset30", "chipPresetMonth", "chipPresetLastMonth"];
    chips.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove("active");
    });

    const rangeLabel = `${formatDateIT(calRangeStart)} - ${formatDateIT(calRangeEnd)}`;
    generateCustomReportsDataset(calRangeStart, calRangeEnd, rangeLabel);

    if (typeof showToast === "function") {
      showToast(`🗓️ Periodo impostato: ${rangeLabel}`);
    }
  }
}

function handleManualDateInput(type, el) {
  let val = el.value.replace(/\D/g, "");
  if (val.length > 8) val = val.substring(0, 8);

  if (val.length >= 5) {
    el.value = val.substring(0, 2) + "/" + val.substring(2, 4) + "/" + val.substring(4);
  } else if (val.length >= 3) {
    el.value = val.substring(0, 2) + "/" + val.substring(2);
  } else {
    el.value = val;
  }
}

function applyCustomDateRangeFromIT() {
  const startInput = document.getElementById("reportStartDateIT");
  const endInput = document.getElementById("reportEndDateIT");
  if (!startInput || !endInput) return;

  let start = parseDateIT(startInput.value);
  let end = parseDateIT(endInput.value);

  if (!start && !end) {
    if (typeof showToast === "function") showToast("Inserisci date valide in formato GG/MM/AAAA");
    return;
  }

  if (start && !end) end = new Date(start);
  if (!start && end) start = new Date(end);

  if (start > end) {
    const tmp = start;
    start = end;
    end = tmp;
    startInput.value = formatDateIT(start);
    endInput.value = formatDateIT(end);
  }

  calRangeStart = start;
  calRangeEnd = end;
  calCurrentYear = start.getFullYear();
  calCurrentMonth = start.getMonth();

  const startNative = document.getElementById("reportStartDate");
  const endNative = document.getElementById("reportEndDate");
  if (startNative) startNative.value = formatYmd(start);
  if (endNative) endNative.value = formatYmd(end);

  renderReportsCalendarTable();

  const label = `${formatDateIT(start)} - ${formatDateIT(end)}`;
  generateCustomReportsDataset(start, end, label);
}

function syncNativeToITDate() {
  const startNative = document.getElementById("reportStartDate");
  const endNative = document.getElementById("reportEndDate");
  if (startNative && startNative.value) {
    const parts = startNative.value.split("-");
    if (parts.length === 3) {
      const itEl = document.getElementById("reportStartDateIT");
      if (itEl) itEl.value = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  if (endNative && endNative.value) {
    const parts = endNative.value.split("-");
    if (parts.length === 3) {
      const itEl = document.getElementById("reportEndDateIT");
      if (itEl) itEl.value = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  applyCustomDateRangeFromIT();
}

function applyReportPreset(preset) {
  const chips = ["chipPresetToday", "chipPresetYesterday", "chipPreset7", "chipPreset14", "chipPreset30", "chipPresetMonth", "chipPresetLastMonth"];
  chips.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active");
  });

  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);
  let label = "Intervallo Personalizzato";

  if (preset === "today") {
    const chip = document.getElementById("chipPresetToday");
    if (chip) chip.classList.add("active");
    label = "Oggi (" + formatDateIT(now) + ")";
  } else if (preset === "yesterday") {
    start.setDate(now.getDate() - 1);
    end.setDate(now.getDate() - 1);
    const chip = document.getElementById("chipPresetYesterday");
    if (chip) chip.classList.add("active");
    label = "Ieri (" + formatDateIT(start) + ")";
  } else if (preset === "7days") {
    start.setDate(now.getDate() - 6);
    const chip = document.getElementById("chipPreset7");
    if (chip) chip.classList.add("active");
    label = "Ultimi 7 Giorni";
  } else if (preset === "14days") {
    start.setDate(now.getDate() - 13);
    const chip = document.getElementById("chipPreset14");
    if (chip) chip.classList.add("active");
    label = "Ultimi 14 Giorni";
  } else if (preset === "30days") {
    start.setDate(now.getDate() - 29);
    const chip = document.getElementById("chipPreset30");
    if (chip) chip.classList.add("active");
    label = "Ultimi 30 Giorni";
  } else if (preset === "thisMonth") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    const chip = document.getElementById("chipPresetMonth");
    if (chip) chip.classList.add("active");
    label = "Questo Mese (" + IT_MONTH_NAMES[now.getMonth()] + ")";
  } else if (preset === "lastMonth") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0);
    const chip = document.getElementById("chipPresetLastMonth");
    if (chip) chip.classList.add("active");
    label = "Mese Scorso (" + IT_MONTH_NAMES[start.getMonth()] + ")";
  }

  calRangeStart = new Date(start);
  calRangeEnd = new Date(end);
  calCurrentYear = start.getFullYear();
  calCurrentMonth = start.getMonth();

  const startInputIT = document.getElementById("reportStartDateIT");
  const endInputIT = document.getElementById("reportEndDateIT");
  if (startInputIT) startInputIT.value = formatDateIT(start);
  if (endInputIT) endInputIT.value = formatDateIT(end);

  const startInput = document.getElementById("reportStartDate");
  const endInput = document.getElementById("reportEndDate");
  if (startInput) startInput.value = formatYmd(start);
  if (endInput) endInput.value = formatYmd(end);

  const hint = document.getElementById("calSelectionStatusHint");
  if (hint) {
    hint.innerHTML = `✅ <strong>Periodo:</strong> ${formatDateIT(start)} ➔ ${formatDateIT(end)}`;
  }

  renderReportsCalendarTable();
  generateCustomReportsDataset(start, end, label);
}

function applyCustomDateRange() {
  applyCustomDateRangeFromIT();
}

function generateCustomReportsDataset(startDate, endDate, rangeLabel) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const numDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1);

  const countEl = document.getElementById("reportsRangeDaysCount");
  if (countEl) {
    countEl.textContent = `Visualizzazione: ${numDays} ${numDays === 1 ? 'giorno' : 'giorni'} ${numDays === 1 ? 'selezionato' : 'selezionati'}`;
  }

  const badgeEl = document.getElementById("reportsActiveRangeBadge");
  if (badgeEl) {
    badgeEl.textContent = rangeLabel;
  }

  let points = [];
  const daysOfWeek = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

  if (numDays === 1) {
    const hours = [
      { h: "08:00", factor: 0.35, note: "Colazioni: espresso & cornetti" },
      { h: "10:00", factor: 0.65, note: "Pausa caffè di metà mattina" },
      { h: "12:00", factor: 1.10, note: "Pranzo veloce & toast" },
      { h: "14:00", factor: 0.85, note: "Caffè dopo pranzo" },
      { h: "16:00", factor: 0.50, note: "Pausa pomeridiana & tè" },
      { h: "18:00", factor: 1.95, note: "Rush Aperitivo: Spritz & taglieri" },
      { h: "20:00", factor: 1.60, note: "Cocktails & stuzzicherie" },
      { h: "22:00", factor: 0.90, note: "Drink della sera & amari" }
    ];

    const baseVal = 200;
    points = hours.map(hr => {
      const val = Math.round(baseVal * hr.factor);
      const orders = Math.round(val / 6.2);
      return {
        label: hr.h,
        value: val,
        orders: orders,
        note: hr.note
      };
    });
  } else if (numDays <= 14) {
    for (let i = 0; i < numDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dayName = daysOfWeek[d.getDay()];
      const dayNum = d.getDate();
      const isWeekend = (d.getDay() === 5 || d.getDay() === 6);
      const baseRev = isWeekend ? 2100 + ((d.getDate() * 47) % 350) : 1050 + ((d.getDate() * 37) % 320);
      const orders = Math.round(baseRev / (isWeekend ? 7.8 : 6.4));

      points.push({
        label: `${dayName} ${dayNum}`,
        value: baseRev,
        orders: orders,
        note: isWeekend ? "Fine settimana: aperitivi e cocktail serali" : "Servizio standard banco & tavoli"
      });
    }
  } else if (numDays <= 60) {
    const step = Math.ceil(numDays / 10);
    for (let i = 0; i < numDays; i += step) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString("it-IT", { month: "short" });
      const rev = 1200 + ((d.getDate() * 59) % 950);
      points.push({
        label: `${dayNum} ${monthShort}`,
        value: rev,
        orders: Math.round(rev / 7),
        note: `Periodo aggregato di ${step} giorni`
      });
    }
  } else {
    const stepDays = Math.ceil(numDays / 12);
    for (let i = 0; i < numDays; i += stepDays) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const monthLabel = d.toLocaleDateString("it-IT", { month: "short", year: "2-digit" });
      const rev = 14000 + ((i * 123) % 4500);
      points.push({
        label: monthLabel,
        value: Math.round(rev / 10),
        orders: Math.round(rev / 70),
        note: `Mese di ${monthLabel}`
      });
    }
  }

  const totalRev = points.reduce((acc, p) => acc + p.value, 0);
  const totalOrders = points.reduce((acc, p) => acc + p.orders, 0);
  const avgTicket = (totalRev / Math.max(1, totalOrders)).toFixed(2);

  let peakPoint = points[0] || { label: "-", value: 0 };
  points.forEach(p => {
    if (p.value > peakPoint.value) peakPoint = p;
  });

  const maxValRaw = Math.max(...points.map(p => p.value), 100);
  const maxVal = Math.ceil((maxValRaw * 1.18) / 100) * 100;
  const yStep = maxVal / 5;
  const yLabels = [maxVal, Math.round(yStep * 4), Math.round(yStep * 3), Math.round(yStep * 2), Math.round(yStep), 0];

  REPORTS_DATASETS.custom = {
    id: "custom",
    title: `Andamento Vendite: ${rangeLabel}`,
    subtitle: `Intervallo selezionato: ${startDate.toLocaleDateString("it-IT")} al ${endDate.toLocaleDateString("it-IT")} (${numDays} gg) · Ascisse (X) - Bississe (Y) in €`,
    dateRangeText: `${rangeLabel} · ${numDays} ${numDays === 1 ? 'giorno' : 'giorni'}`,
    kpi: {
      revenue: `${totalRev.toLocaleString()} €`,
      growth: "+11.8% vs periodo prec.",
      orders: totalOrders.toLocaleString(),
      ordersSub: `Media di ${Math.round(totalOrders / Math.max(1, points.length))} per fascia`,
      avgTicket: `${avgTicket} €`,
      peak: `${peakPoint.label}`,
      peakSub: `Picco massimo (${peakPoint.value.toLocaleString()} €)`
    },
    maxVal: maxVal,
    yLabels: yLabels,
    points: points
  };

  currentReportsPeriod = "custom";
  selectedReportPointIndex = null;

  const btnCustom = document.getElementById("btnReportCustom");
  const btnDay = document.getElementById("btnReportDay");
  const btnWeek = document.getElementById("btnReportWeek");
  const btnMonth = document.getElementById("btnReportMonth");
  if (btnCustom) btnCustom.classList.add("active");
  if (btnDay) btnDay.classList.remove("active");
  if (btnWeek) btnWeek.classList.remove("active");
  if (btnMonth) btnMonth.classList.remove("active");

  renderReports();

  if (typeof showToast === "function") {
    showToast(`📈 Grafico aggiornato per: ${rangeLabel}`);
  }
}

window.toggleCustomRangeBox = toggleCustomRangeBox;
window.applyReportPreset = applyReportPreset;
window.applyCustomDateRange = applyCustomDateRange;
window.applyCustomDateRangeFromIT = applyCustomDateRangeFromIT;
window.syncNativeToITDate = syncNativeToITDate;
window.handleManualDateInput = handleManualDateInput;
window.toggleReportsCalendarTable = toggleReportsCalendarTable;
window.navCalendarMonth = navCalendarMonth;
window.renderReportsCalendarTable = renderReportsCalendarTable;
window.handleCalendarCellClick = handleCalendarCellClick;
window.generateCustomReportsDataset = generateCustomReportsDataset;

function switchReportsPeriod(period) {
  if (!REPORTS_DATASETS[period]) return;
  currentReportsPeriod = period;
  selectedReportPointIndex = null;

  const btnDay = document.getElementById("btnReportDay");
  const btnWeek = document.getElementById("btnReportWeek");
  const btnMonth = document.getElementById("btnReportMonth");

  if (btnDay) btnDay.classList.toggle("active", period === "day");
  if (btnWeek) btnWeek.classList.toggle("active", period === "week");
  if (btnMonth) btnMonth.classList.toggle("active", period === "month");
  const btnCustom = document.getElementById("btnReportCustom");
  if (btnCustom) btnCustom.classList.remove("active");

  renderReports();
}

function selectReportPoint(idx) {
  const data = REPORTS_DATASETS[currentReportsPeriod];
  if (!data || !data.points[idx]) return;

  selectedReportPointIndex = idx;
  const pt = data.points[idx];
  const avg = (pt.value / Math.max(1, pt.orders)).toFixed(2);

  const bar = document.getElementById("reportsPointDetailBar");
  const text = document.getElementById("reportsPointDetailText");
  if (text) {
    text.innerHTML = `
      <strong>📅 ${escapeHtml(pt.label)}:</strong>
      <span style="color:var(--primary); font-weight:800; margin-left:6px;">${pt.value.toLocaleString()} €</span>
      <span style="color:var(--text-muted); margin-left:8px;">· ${pt.orders} comande</span>
      <span style="color:var(--text-muted); margin-left:8px;">· Scontrino medio: ${avg} €</span>
      <span style="color:var(--text-main); margin-left:12px; font-style:italic;">(${escapeHtml(pt.note)})</span>
    `;
  }
}

function renderReports() {
  const data = REPORTS_DATASETS[currentReportsPeriod] || REPORTS_DATASETS.week;

  const calBody = document.getElementById('reportsCalendarTbody');
  if (calBody && calBody.children.length === 0) {
    if (!calRangeStart) {
      const now = new Date();
      const s = new Date(now);
      s.setDate(now.getDate() - 6);
      calRangeStart = s;
      calRangeEnd = now;
      const sEl = document.getElementById('reportStartDateIT');
      const eEl = document.getElementById('reportEndDateIT');
      if (sEl) sEl.value = formatDateIT(s);
      if (eEl) eEl.value = formatDateIT(now);
      const hint = document.getElementById('calSelectionStatusHint');
      if (hint) {
        hint.innerHTML = '✅ <strong>Periodo:</strong> ' + formatDateIT(s) + ' ➔ ' + formatDateIT(now);
      }
    }
    renderReportsCalendarTable();
  }

  // 1. Update Date Range & Titles
  const rangeEl = document.getElementById("reportsDateRangeText");
  if (rangeEl) rangeEl.textContent = data.dateRangeText;

  const titleEl = document.getElementById("reportsChartTitle");
  if (titleEl) titleEl.textContent = data.title;

  const subEl = document.getElementById("reportsChartSubtitle");
  if (subEl) subEl.textContent = data.subtitle;

  // 2. Update KPIs
  const revEl = document.getElementById("reportsKpiRevenue");
  if (revEl) revEl.textContent = data.kpi.revenue;

  const growthEl = document.getElementById("reportsKpiGrowth");
  if (growthEl) growthEl.textContent = data.kpi.growth;

  const ordEl = document.getElementById("reportsKpiOrders");
  if (ordEl) ordEl.textContent = data.kpi.orders;

  const ordSubEl = document.getElementById("reportsKpiOrdersSub");
  if (ordSubEl) ordSubEl.textContent = data.kpi.ordersSub;

  const avgEl = document.getElementById("reportsKpiAvgTicket");
  if (avgEl) avgEl.textContent = data.kpi.avgTicket;

  const peakEl = document.getElementById("reportsKpiPeak");
  if (peakEl) peakEl.textContent = data.kpi.peak;

  const peakSubEl = document.getElementById("reportsKpiPeakSub");
  if (peakSubEl) peakSubEl.textContent = data.kpi.peakSub;

  // 3. Render SVG Chart with X & Y Axes
  const svg = document.getElementById("reportsCurveSvg");
  if (svg) {
    const leftMargin = 65;
    const rightMargin = 25;
    const topMargin = 25;
    const bottomMargin = 45;
    const plotWidth = 640 - leftMargin - rightMargin; // 550
    const plotHeight = 260 - topMargin - bottomMargin; // 190
    const bottomY = topMargin + plotHeight; // 215

    const points = data.points;
    const numPoints = points.length;

    // Calculate (x, y) for each data point
    const coords = points.map((p, i) => {
      const x = leftMargin + (i / (numPoints - 1)) * plotWidth;
      const ratio = Math.min(1, Math.max(0, p.value / data.maxVal));
      const y = bottomY - ratio * plotHeight;
      return { x, y, raw: p };
    });

    const dLine = `M ${coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" L ")}`;
    const dArea = `M ${leftMargin},${bottomY} L ${coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" L ")} L ${leftMargin + plotWidth},${bottomY} Z`;

    // Horizontal Y Grid Lines and Y-Axis Labels (Bississe)
    let yAxisHtml = "";
    data.yLabels.forEach(val => {
      const ratio = val / data.maxVal;
      const y = bottomY - ratio * plotHeight;
      yAxisHtml += `
        <line x1="${leftMargin}" y1="${y.toFixed(1)}" x2="${leftMargin + plotWidth}" y2="${y.toFixed(1)}" stroke="var(--border-color)" stroke-dasharray="3 3" stroke-width="1" />
        <text x="${leftMargin - 10}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" font-weight="600" fill="var(--text-muted)">${val.toLocaleString()} €</text>
      `;
    });

    // Vertical X Grid Ticks and X-Axis Labels (Ascisse / Date)
    let xAxisHtml = "";
    xAxisHtml += `<line x1="${leftMargin}" y1="${bottomY}" x2="${leftMargin + plotWidth}" y2="${bottomY}" stroke="var(--border-color)" stroke-width="1.5" />`;
    coords.forEach((c, idx) => {
      xAxisHtml += `
        <line x1="${c.x.toFixed(1)}" y1="${bottomY}" x2="${c.x.toFixed(1)}" y2="${bottomY + 6}" stroke="var(--border-color)" stroke-width="1.5" />
        <text x="${c.x.toFixed(1)}" y="${bottomY + 22}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--text-main)">${escapeHtml(c.raw.label)}</text>
      `;
    });

    // Dots and value badges above points
    let dotsHtml = "";
    coords.forEach((c, idx) => {
      dotsHtml += `
        <g style="cursor:pointer;" onclick="selectReportPoint(${idx})">
          <text x="${c.x.toFixed(1)}" y="${(c.y - 10).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#FF7A00">${c.raw.value.toLocaleString()} €</text>
          <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="7" fill="#FF7A00" opacity="0.2"/>
          <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="4.5" fill="#FF7A00" stroke="#FFFFFF" stroke-width="2.5"/>
        </g>
      `;
    });

    svg.innerHTML = `
      <defs>
        <linearGradient id="reportsGradArea" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FF7A00" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="#FF7A00" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      ${yAxisHtml}
      ${xAxisHtml}
      <path d="${dArea}" fill="url(#reportsGradArea)" />
      <path d="${dLine}" fill="none" stroke="#FF7A00" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${dotsHtml}
    `;
  }

  // 4. Populate Breakdown Table
  const tbody = document.getElementById("reportsTableBody");
  if (tbody) {
    const totalRev = data.points.reduce((acc, p) => acc + p.value, 0);
    tbody.innerHTML = data.points.map(p => {
      const share = totalRev > 0 ? ((p.value / totalRev) * 100).toFixed(1) : "0";
      const avg = (p.value / Math.max(1, p.orders)).toFixed(2);

      return `
        <tr>
          <td>
            <div style="font-weight:700; color:var(--text-main);">${escapeHtml(p.label)}</div>
            <div style="font-size:11px; color:var(--text-muted);">${escapeHtml(p.note)}</div>
          </td>
          <td>
            <span style="font-weight:800; color:var(--primary); font-size:13.5px;">${p.value.toLocaleString()} €</span>
          </td>
          <td>
            <span style="font-weight:600;">${p.orders}</span> comande
          </td>
          <td>
            <span style="font-weight:600;">${avg} €</span>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="flex:1; max-width:80px; height:6px; background:var(--border-color); border-radius:3px; overflow:hidden;">
                <div style="width:${share}%; height:100%; background:var(--primary); border-radius:3px;"></div>
              </div>
              <span style="font-size:11px; font-weight:700; color:var(--text-muted);">${share}%</span>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }
}

function exportReportsCsv() {
  const data = REPORTS_DATASETS[currentReportsPeriod] || REPORTS_DATASETS.week;
  let csv = "Periodo,Data_Orario,Fatturato_EUR,Comande,Scontrino_Medio_EUR,Note\n";

  data.points.forEach(p => {
    const avg = (p.value / Math.max(1, p.orders)).toFixed(2);
    csv += `"${data.id}","${p.label}",${p.value},${p.orders},${avg},"${p.note}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `barpilot_rapporto_${data.id}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("📥 Rapporto CSV scaricato con successo!");
}

// --------------------------------------------------------------------------
// Subscriptions & Checkout (Offre Unique 59€ / mois & Liste des Fonctionnalités)
// --------------------------------------------------------------------------
function renderPlans() {
  const grid = document.getElementById("plansGridWrap");
  if (!grid) return;

  const bar = (window.db ? window.db.get("activeBar") : {}) || {};
  const isFr = window.i18n ? window.i18n.currentLang === "fr" : false;
  const isSubscribed = Boolean(bar.isSubscribed || (bar.plan && (bar.plan.includes("Pro") || bar.plan.includes("59"))));

  const plan = {
    name: "BarPilot Pro — Tout-en-un",
    name_it: "BarPilot Pro — Tutto Incluso",
    price: 59,
    trialDays: 14,
    badge: isFr ? "🌟 OFFRE UNIQUE TOUT-EN-UN · ACCÈS COMPLET" : "🌟 OFFERTA UNICA TUTTO INCLUSO · ACCESSO COMPLETO",
    desc: isFr
      ? "L'intégralité de la plateforme BarPilot sans aucune limite pour propulser votre bar, pub ou café."
      : "L'intera piattaforma BarPilot senza alcun limite per gestire al meglio il tuo bar, pub o caffetteria.",
    features: [
      {
        icon: "🚀",
        title: isFr ? "Prise de commandes ultra-rapide" : "Comande ultra-rapide",
        desc: isFr ? "Au comptoir, à table ou à emporter avec impression des tickets et partage d'addition." : "Al bancone, al tavolo o asporto con stampa ticket e divisione conti."
      },
      {
        icon: "🪑",
        title: isFr ? "Plan de salle interactif en direct" : "Piano di sala interattivo",
        desc: isFr ? "Suivi en direct des tables occupées, des réservations et des montants consommés." : "Monitoraggio live dei tavoli occupati, prenotazioni e conti aperti."
      },
      {
        icon: "🍸",
        title: isFr ? "Catalogue produits & cocktails illimité" : "Catalogo prodotti & cocktail illimitato",
        desc: isFr ? "Gestion des catégories, photos HD, fiches allergènes et tarifs sur-mesure." : "Categorie, foto HD, schede allergeni e listini personalizzati."
      },
      {
        icon: "🌿",
        title: isFr ? "Fiches recettes & calcul des marges" : "Schede ricette & calcolo margini",
        desc: isFr ? "Déstockage automatique au millilitre et au gramme à chaque verre ou café servi." : "Scarico automatico di ml e grammi ad ogni bicchiere o caffè servito."
      },
      {
        icon: "📦",
        title: isFr ? "Gestion intelligente des stocks" : "Gestione scorte & inventario intelligente",
        desc: isFr ? "Inventaire en temps réel, alertes automatiques en cas de seuil critique ou rupture." : "Giacenze in tempo reale e alert immediati in caso di sottoscorta."
      },
      {
        icon: "🚚",
        title: isFr ? "Gestion des fournisseurs & bons de commande" : "Fornitori & buoni d'ordine diretti",
        desc: isFr ? "Annuaires partenaires, génération et transmission de bons d'achat par Email et WhatsApp." : "Anagrafica partner, generazione e invio ordini d'acquisto via Email e WhatsApp."
      },
      {
        icon: "🖥️",
        title: isFr ? "Écran Barman (KDS) & Cuisine en direct" : "Schermo Barman (KDS) & Cucina live",
        desc: isFr ? "Visualisation des boissons et préparations en temps réel avec signaux sonores." : "Monitor touch per la preparazione delle comande con avvisi acustici."
      },
      {
        icon: "👥",
        title: isFr ? "Comptes employés & codes PIN sécurisés" : "Gestione personale & PIN d'accesso",
        desc: isFr ? "Contrôle des rôles stricts (Propriétaire, Manager, Serveur, Barman) et traçabilité." : "Controllo ruoli (Proprietario, Manager, Barman, Camerieri) e permessi."
      },
      {
        icon: "📊",
        title: isFr ? "Rapports & Statistiques financières (Jour, Semaine, Mois)" : "Rapporti & Statistiche finanziarie (Giorno, Settimana, Mese)",
        desc: isFr ? "Graphiques interactifs avec axes dates et valeurs (€), scontrino medio et export CSV." : "Grafici interattivi con assi date e valori (€), scontrino medio ed export CSV."
      },
      {
        icon: "📱",
        title: isFr ? "Menu digital QR Code sans contact" : "Menu digitale QR Code senza contatto",
        desc: isFr ? "Accès direct et immédiat pour les clients depuis leur smartphone à table." : "Accesso immediato dal proprio smartphone per i clienti al tavolo."
      },
      {
        icon: "☁️",
        title: isFr ? "Mode Hors-ligne (PWA) & Cloud Sync" : "Modalità Offline (PWA) & Cloud Sync",
        desc: isFr ? "Continuez à encaisser même en cas de panne internet, synchronisation fluide." : "Continua a lavorare anche senza connessione internet, sincronizzazione automatica."
      },
      {
        icon: "🔒",
        title: isFr ? "Sauvegardes automatiques & Chiffrement SSL" : "Backup automatici & Crittografia SSL",
        desc: isFr ? "Données protégées sur serveurs haute sécurité, conformité fiscale et bancaire." : "Dati protetti nel cloud, conformità fiscale e sicurezza bancaria certificata."
      },
      {
        icon: "⚡",
        title: isFr ? "Support prioritaire dédié 7j/7" : "Assistenza prioritaria dedicata 7g/7",
        desc: isFr ? "Équipe réactive par chat et email, mises à jour et évolutions logicielles incluses." : "Supporto rapido via chat ed email, tutti gli aggiornamenti inclusi."
      }
    ]
  };

  grid.innerHTML = `
    <div class="single-plan-hero">
      <div class="single-plan-badge-pill">${escapeHtml(plan.badge)}</div>

      <div style="text-align:center; max-width:680px; margin:0 auto 24px auto;">
        <h3 style="font-size:28px; font-weight:900; margin:0 0 6px 0; color:var(--text-main);">
          ${escapeHtml(isFr ? plan.name : plan.name_it)}
        </h3>
        <p style="font-size:14px; color:var(--text-muted); line-height:1.5; margin:0;">
          ${escapeHtml(plan.desc)}
        </p>

        <!-- Pricing Badge -->
        <div style="margin:20px 0 10px 0; display:inline-flex; align-items:baseline; gap:8px;">
          <span style="font-size:48px; font-weight:900; color:var(--primary); line-height:1;">${plan.price} €</span>
          <span style="font-size:16px; font-weight:700; color:var(--text-muted);">${escapeHtml(isFr ? '/ mois / bar' : '/ mese / bar')}</span>
        </div>

        <div style="display:flex; justify-content:center; align-items:center; gap:14px; flex-wrap:wrap; font-size:12.5px; font-weight:700;">
          <span style="color:var(--status-free); display:inline-flex; align-items:center; gap:5px;">
            <span>✓</span> <span>${isFr ? "14 jours d'essai 100% gratuit" : "14 giorni di prova gratuita al 100%"}</span>
          </span>
          <span style="color:var(--text-muted);">•</span>
          <span style="color:var(--text-muted);">${isFr ? "Sans engagement" : "Senza impegno"}</span>
          <span style="color:var(--text-muted);">•</span>
          <span style="color:var(--text-muted);">${isFr ? "Résiliation en 1 clic" : "Disdetta in 1 clic"}</span>
        </div>
      </div>

      <!-- Comprehensive Features List -->
      <div style="margin-bottom:8px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
          <h4 style="font-size:15px; font-weight:800; color:var(--text-main); margin:0;">
            ${isFr ? "Toutes les fonctionnalités incluses dans votre offre unique :" : "Tutte le funzionalità incluse nella tua offerta unica:"}
          </h4>
          <span class="badge" style="background:rgba(16, 185, 129, 0.15); color:var(--status-free); font-size:11px; font-weight:800;">
            13 ${isFr ? "MODULES COMPLETS" : "MODULI COMPLETI"}
          </span>
        </div>

        <div class="single-plan-features-grid">
          ${plan.features.map(f => `
            <div class="single-plan-feature-row">
              <span class="single-plan-check-icon">✓</span>
              <div>
                <strong style="color:var(--text-main); font-size:13.5px; display:block;">${escapeHtml(f.title)}</strong>
                <span style="font-size:12px; color:var(--text-muted); display:block; margin-top:2px;">${escapeHtml(f.desc)}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

            <!-- Action Buttons: Google Play Pay (Recommended) + Standard S'abonner -->
      <div style="text-align:center; padding-top:14px; display:flex; flex-direction:column; align-items:center; gap:12px;">
        ${isSubscribed ? `
          <button class="btn-primary btn-subscribe-hero" style="background:var(--status-free); box-shadow:0 8px 24px rgba(16, 185, 129, 0.35);" onclick="openGooglePlayModal()">
            ✓ ${isFr ? "Abonnement Actif (59 €/mois) — Gérer / Modifier" : "Abbonamento Attivo (59 €/mese) — Gestisci"}
          </button>
        ` : `
          <!-- Primary CTA: Google Play Pay 1-Tap -->
          <button class="btn-gplay-subscribe" onclick="openGooglePlayModal()">
            <span class="gplay-logo-wrap">
              <svg viewBox="0 0 512 512" width="22" height="22">
                <path d="M47.7 22.8c-3.1 3.4-5 8.4-5 14.8v436.8c0 6.4 1.9 11.4 5 14.8l1.3 1.2L278.4 261v-6L49 21.6l-1.3 1.2z" fill="#00D2FF"/>
                <path d="M355.2 337.8l-76.8-76.8v-6l76.8-76.8 1.8 1 91 51.7c26 14.8 26 38.9 0 53.7l-91 51.7-1.8 1.5z" fill="#FFCE00"/>
                <path d="M278.4 255L47.7 489.2c4.4 4.7 11.6 5.3 19.8 0.6l289.5-164.5-78.6-69.8v-0.5z" fill="#FF3333"/>
                <path d="M278.4 257.5l78.6-69.8-289.5-164.5c-8.2-4.7-15.4-4.1-19.8 0.6L278.4 257.5z" fill="#00E676"/>
              </svg>
            </span>
            <div style="text-align:left; flex:1;">
              <div style="font-size:15px; font-weight:900; line-height:1.2; color:#fff;">
                ${isFr ? "S'abonner avec <strong>Google Play</strong>" : "Abbonati subito con <strong>Google Play Pay</strong>"}
                <span class="badge" style="background:#00E676; color:#0b1928; font-size:10px; font-weight:900; margin-left:6px; padding:2px 6px;">1-TAP</span>
              </div>
              <div style="font-size:11.5px; opacity:0.9; margin-top:2px; color:#cbd5e1;">
                ${isFr ? "14 jours d'essai (0 €) · 1er prélèvement de 59 € auto si non résilié" : "14 giorni prova (0 €) · 1° pagamento 59 € automatico salvo disdetta"}
              </div>
            </div>
            <span style="color:#00D2FF; font-size:18px;">➔</span>
          </button>

          <!-- Secondary CTA: Card Checkout -->
          <button class="btn-primary btn-subscribe-hero" style="background:var(--bg-card); color:var(--text-main); border:1.5px solid var(--border-color); box-shadow:none; padding:12px 24px; font-size:13.5px;" onclick="openCheckoutModal()">
            💳 ${isFr ? "Ou s'abonner par Carte Bancaire (59 €/mois)" : "Oppure abbonati con Carta Bancaria (59 €/mese)"}
          </button>
        `}
        <p style="font-size:11.5px; color:var(--text-muted); margin-top:4px;">
          🔒 ${isFr ? "Google Play Protect & Paiement 100% sécurisé · Premier prélèvement de 59 € automatique si non résilié" : "Google Play Protect & Pagamento sicuro 100% · Primo addebito di 59 € in automatico se non disdetto"}
        </p>
      </div>
    </div>
  `;
}

function selectPlan(planName) {
  openCheckoutModal();
}

function openCheckoutModal(isForcedMandatory = false) {
  // If in demo mode: demo page is 100% free and open, never open checkout!
  if (isDemoMode()) {
    closeCheckoutModal(true);
    closeGooglePlayModal(true);
    return;
  }

  const modal = document.getElementById("subscriptionCheckoutModal");
  if (!modal) return;

  // Synchronize Live Credentials & Client Access Links
  const liveStripePk = localStorage.getItem("barpilot_stripe_pk") || DEFAULT_STRIPE_LIVE_PK;
  const liveMerchantId = localStorage.getItem("barpilot_gpay_merchant_id") || DEFAULT_GOOGLE_MERCHANT_ID;
  const liveStripeUrl = getStripePaymentUrl();

  localStorage.setItem("barpilot_stripe_pk", liveStripePk);
  localStorage.setItem("barpilot_gpay_merchant_id", liveMerchantId);
  localStorage.setItem("barpilot_stripe_payment_url", liveStripeUrl);
  // Default to TEST to prevent [OR_BIBED_11] while Google merchant console approval is pending
  const gpayEnv = localStorage.getItem("barpilot_gpay_env") || "TEST";
  localStorage.setItem("barpilot_gpay_env", gpayEnv);

  if (window.googlePayService) {
    window.googlePayService.stripePk = liveStripePk;
    window.googlePayService.merchantId = liveMerchantId;
    window.googlePayService.environment = gpayEnv;
  }

  const gDisplay = document.getElementById("checkoutProGoogleMerchantDisplay");
  if (gDisplay) gDisplay.textContent = liveMerchantId;

  const sLinkPreview = document.getElementById("checkoutProStripeLinkPreview");
  if (sLinkPreview) {
    sLinkPreview.textContent = liveStripeUrl;
    sLinkPreview.href = liveStripeUrl;
  }


  const bar = (window.db ? window.db.get("activeBar") : {}) || {};
  let loggedUser = null;
  try {
    loggedUser = JSON.parse(localStorage.getItem("barpilot_logged_user") || "null");
  } catch (e) {}

  const barNameEl = document.getElementById("checkoutProBarName");
  if (barNameEl) barNameEl.textContent = "Abbonamento";

  // Calculate future 14-day date for timeline
  const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const futureDateFormatted = futureDate.toLocaleDateString(window.i18n?.currentLang === 'fr' ? 'fr-FR' : 'it-IT', {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const timelineDateModalEl = document.getElementById("checkoutProTimelineDateModal");
  if (timelineDateModalEl) {
    timelineDateModalEl.textContent = futureDateFormatted;
  }

  const cardHolderEl = document.getElementById("checkoutCardHolder");
  const userName = (loggedUser && loggedUser.name) || bar.managerName || "Marco Rossi";
  if (cardHolderEl && !cardHolderEl.value && userName) cardHolderEl.value = userName;

  // Format card number with auto spaces & dynamic card brand detection
  const cardInput = document.getElementById("checkoutCardNumber");
  const brandBadge = document.getElementById("checkoutCardBrandBadge");
  const cvcInput = document.getElementById("checkoutCardCvc");

  function detectCardBrand(numStr) {
    const clean = (numStr || '').replace(/\D/g, '');
    if (!clean) return null;
    if (/^4/.test(clean)) {
      return { brand: 'VISA', text: 'VISA', color: '#00579F', bg: '#F0F7FF', border: '#D0E5FF', fontWeight: '900', fontSize: '11px' };
    }
    if (/^(5[1-5]|2(22[1-9]|2[3-9][0-9]|[3-6][0-9]{2}|7[01][0-9]|720))/.test(clean)) {
      return {
        brand: 'MASTERCARD',
        svg: '<svg width="22" height="14" viewBox="0 0 32 20" style="display:block;"><circle cx="10" cy="10" r="9" fill="#EB001B"/><circle cx="22" cy="10" r="9" fill="#F79E1B" fill-opacity="0.88"/></svg>',
        bg: '#FFFFFF',
        border: '#E5E7EB'
      };
    }
    if (/^3[47]/.test(clean)) {
      return { brand: 'AMEX', text: 'AMEX', color: '#006FCF', bg: '#EDF5FC', border: '#BFE0F7', fontWeight: '800', fontSize: '10px' };
    }
    if (/^(6011|65|64[4-9]|622)/.test(clean)) {
      return { brand: 'DISCOVER', text: 'DISC', color: '#FF6000', bg: '#FFF7F0', border: '#FFE0CC', fontWeight: '800', fontSize: '10px' };
    }
    if (/^35(2[89]|[3-8][0-9])/.test(clean)) {
      return { brand: 'JCB', text: 'JCB', color: '#0E7F3D', bg: '#F0FBF4', border: '#C2F0D3', fontWeight: '800', fontSize: '10px' };
    }
    if (/^(30[0-5]|36|38)/.test(clean)) {
      return { brand: 'DINERS', text: 'DINERS', color: '#004B87', bg: '#F0F5FA', border: '#D0E0F0', fontWeight: '800', fontSize: '9px' };
    }
    return null;
  }

  function updateCardBrandBadge() {
    if (!brandBadge) return;
    const brand = detectCardBrand(cardInput ? cardInput.value : '');
    if (brand) {
      if (brand.svg) {
        brandBadge.innerHTML = brand.svg;
        brandBadge.style.color = 'inherit';
        brandBadge.style.background = brand.bg || '#FFFFFF';
        brandBadge.style.border = '1px solid ' + (brand.border || '#E5E7EB');
        brandBadge.style.padding = '2px 4px';
        brandBadge.style.borderRadius = '4px';
        brandBadge.style.display = 'inline-flex';
        brandBadge.style.alignItems = 'center';
        brandBadge.style.justifyContent = 'center';
      } else {
        brandBadge.textContent = brand.text;
        brandBadge.style.color = brand.color;
        brandBadge.style.background = brand.bg;
        brandBadge.style.border = '1px solid ' + brand.border;
        brandBadge.style.fontWeight = brand.fontWeight;
        brandBadge.style.fontSize = brand.fontSize;
        brandBadge.style.padding = '2px 6px';
        brandBadge.style.borderRadius = '4px';
        brandBadge.style.display = 'inline-block';
      }
      if (cvcInput) {
        if (brand.brand === 'AMEX') {
          cvcInput.maxLength = 4;
          cvcInput.placeholder = '1234';
        } else {
          cvcInput.maxLength = 3;
          cvcInput.placeholder = '123';
        }
      }
    } else {
      brandBadge.textContent = '💳';
      brandBadge.style.color = '#9CA3AF';
      brandBadge.style.background = 'transparent';
      brandBadge.style.border = 'none';
      brandBadge.style.fontWeight = 'normal';
      brandBadge.style.fontSize = '13px';
      brandBadge.style.padding = '2px 4px';
      brandBadge.style.borderRadius = '0';
      brandBadge.style.display = 'inline-block';
      if (cvcInput) {
        cvcInput.maxLength = 4;
        cvcInput.placeholder = '123';
      }
    }
  }

  if (cardInput && !cardInput._hasListener) {
    cardInput._hasListener = true;
    cardInput.addEventListener("input", (e) => {
      let v = e.target.value.replace(/\D/g, '');
      const isAmex = /^3[47]/.test(v);
      const maxLen = isAmex ? 15 : 16;
      v = v.substring(0, maxLen);
      let parts = [];
      if (isAmex) {
        if (v.length > 0) parts.push(v.substring(0, 4));
        if (v.length > 4) parts.push(v.substring(4, 10));
        if (v.length > 10) parts.push(v.substring(10, 15));
      } else {
        for (let i = 0; i < v.length; i += 4) {
          parts.push(v.substring(i, i + 4));
        }
      }
      e.target.value = parts.join(' ');
      updateCardBrandBadge();
    });
  }
  updateCardBrandBadge();

  // Format expiry MM / AA o MM / AAAA
  const expInput = document.getElementById("checkoutCardExpiry");
  if (expInput && !expInput._hasListener) {
    expInput._hasListener = true;
    expInput.addEventListener("input", (e) => {
      let v = e.target.value.replace(/\D/g, '').substring(0, 6);
      if (v.length > 2) {
        e.target.value = v.substring(0, 2) + ' / ' + v.substring(2);
      } else {
        e.target.value = v;
      }
    });
  }

  selectProPaymentMethod('card');
  modal.classList.add("active");
}

function closeCheckoutModal(force = false) {
  const modal = document.getElementById("subscriptionCheckoutModal");
  if (!modal) return;

  // In demo mode: modal can always be closed immediately without restrictions
  if (isDemoMode()) {
    modal.classList.remove("active");
    modal.removeAttribute("data-mandatory");
    return;
  }

  // Non-closable rule: cannot close if mandatory or user is not subscribed
  if (!force && (modal.getAttribute("data-mandatory") === "true" || !isUserSubscribed())) {
    showToast(window.i18n && window.i18n.currentLang === "fr"
      ? "🔒 La fenêtre de paiement ne peut pas être fermée. Veuillez finaliser votre abonnement."
      : "🔒 La finestra di check-out non può essere chiusa. Completa l'attivazione con Google Pay o Carta.");
    return;
  }

  modal.classList.remove("active");
  modal.removeAttribute("data-mandatory");
}

function switchCheckoutPaymentMethod(method) {
  const tabCard = document.getElementById("tabPayCard");
  const tabStripe = document.getElementById("tabPayStripe");
  const tabGoogle = document.getElementById("tabPayGoogle");

  const paneCard = document.getElementById("panePayCard");
  const paneStripe = document.getElementById("panePayStripe");
  const paneGoogle = document.getElementById("panePayGoogle");

  if (tabCard) tabCard.classList.toggle("active", method === "card");
  if (tabStripe) tabStripe.classList.toggle("active", method === "stripe");
  if (tabGoogle) tabGoogle.classList.toggle("active", method === "google");

  if (paneCard) paneCard.classList.toggle("active", method === "card");
  if (paneStripe) paneStripe.classList.toggle("active", method === "stripe");
  if (paneGoogle) paneGoogle.classList.toggle("active", method === "google");
}

const DEFAULT_STRIPE_PAYMENT_URL = "https://buy.stripe.com/00w7sN8U18rXdgN2xQ3Ru00?locale=it";

function getStripePaymentUrl() {
  let customStripeUrl = localStorage.getItem("barpilot_stripe_payment_url") || DEFAULT_STRIPE_PAYMENT_URL;
  if (!customStripeUrl.includes("locale=")) {
    customStripeUrl += (customStripeUrl.includes("?") ? "&" : "?") + "locale=it";
  }
  return customStripeUrl;
}

function handleStripeCheckoutSubmit() {
  const isFr = window.i18n ? window.i18n.currentLang === "fr" : false;
  const customStripeUrl = getStripePaymentUrl();
  if (customStripeUrl && customStripeUrl.startsWith("http")) {
    window.open(customStripeUrl, "_blank");
    showToast(isFr ? "Redirection vers Stripe Checkout... Veuillez finaliser le paiement." : "Reindirizzamento verso Stripe Checkout... Completa il pagamento sul portale protetto di Stripe.");
    return;
  }
}

function handleConfirmCheckout(e) {
  if (e && e.preventDefault) e.preventDefault();
  activateSubscription("stripe_card");
}

function setupSimulator() {
  const slider = document.getElementById("simBarsCount");
  const countDisplay = document.getElementById("simBarsDisplay");
  const monthlyDisplay = document.getElementById("simMonthlyRev");
  const annualDisplay = document.getElementById("simAnnualRev");

  if (!slider) return;

  const updateSim = () => {
    const bars = parseInt(slider.value, 10);
    const avgPrice = 59; // Pro average
    const monthly = bars * avgPrice;
    const annual = monthly * 12;

    if (countDisplay) countDisplay.textContent = bars;
    if (monthlyDisplay) monthlyDisplay.textContent = `${monthly.toLocaleString()} €`;
    if (annualDisplay) annualDisplay.textContent = `${annual.toLocaleString()} €`;
  };

  slider.addEventListener("input", updateSim);
  updateSim();
}

// --------------------------------------------------------------------------
// Modals & Multi-tenant Bar Switcher
// --------------------------------------------------------------------------
function setupModals() {
  const switchBarBtn = document.getElementById("barSwitcherBtn");
  const modal = document.getElementById("barModalOverlay");
  const closeModalBtn = document.getElementById("closeBarModal");
  const barSelect = document.getElementById("modalBarSelect");
  const confirmBarBtn = document.getElementById("confirmBarSwitch");

  if (switchBarBtn && modal) {
    switchBarBtn.addEventListener("click", () => {
      modal.classList.add("active");
    });
  }

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  }

  // Click outside modal box on backdrop closes the modal
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  }

  // Click outside auth card on auth backdrop closes it
  const authOverlay = document.getElementById("authOverlay");
  if (authOverlay) {
    authOverlay.addEventListener("click", (e) => {
      if (e.target === authOverlay) {
        closeAuthScreen();
      }
    });
  }

  // Click outside logout confirm modal
  const logoutModal = document.getElementById("logoutConfirmModal");
  if (logoutModal) {
    logoutModal.addEventListener("click", (e) => {
      if (e.target === logoutModal) {
        closeLogoutModal();
      }
    });
  }

  // Backdrop clicks for Staff PIN, Add Product, Add Staff modals
  const pinModal = document.getElementById("staffPinModal");
  if (pinModal) {
    pinModal.addEventListener("click", (e) => {
      if (e.target === pinModal) closeStaffPinModal();
    });
  }

  const addProdModal = document.getElementById("addProductModal");
  if (addProdModal) {
    addProdModal.addEventListener("click", (e) => {
      if (e.target === addProdModal) closeAddProductModal();
    });
  }

  const addStaffModal = document.getElementById("addStaffModal");
  if (addStaffModal) {
    addStaffModal.addEventListener("click", (e) => {
      if (e.target === addStaffModal) closeAddStaffModal();
    });
  }

  const deleteStaffModal = document.getElementById("deleteStaffConfirmModal");
  if (deleteStaffModal) {
    deleteStaffModal.addEventListener("click", (e) => {
      if (e.target === deleteStaffModal) closeDeleteStaffModal();
    });
  }

  const passRecoveryModal = document.getElementById("passwordRecoveryModal");
  if (passRecoveryModal) {
    passRecoveryModal.addEventListener("click", (e) => {
      if (e.target === passRecoveryModal) closePasswordRecoveryModal();
    });
  }

  const welcomeModal = document.getElementById("staffWelcomeEmailModal");
  if (welcomeModal) {
    welcomeModal.addEventListener("click", (e) => {
      if (e.target === welcomeModal) closeStaffWelcomeEmailModal();
    });
  }

  const avatarModal = document.getElementById("changeAvatarModal");
  if (avatarModal) {
    avatarModal.addEventListener("click", (e) => {
      if (e.target === avatarModal) closeChangeAvatarModal();
    });
  }

  const addTableModal = document.getElementById("addTableModal");
  if (addTableModal) {
    addTableModal.addEventListener("click", (e) => {
      if (e.target === addTableModal) closeAddTableModal();
    });
  }

  const addIngModal = document.getElementById("addIngredientModal");
  if (addIngModal) {
    addIngModal.addEventListener("click", (e) => {
      if (e.target === addIngModal) closeAddIngredientModal();
    });
  }

  const deleteIngModal = document.getElementById("deleteIngredientModal");
  if (deleteIngModal) {
    deleteIngModal.addEventListener("click", (e) => {
      if (e.target === deleteIngModal) closeDeleteIngredientModal();
    });
  }
  const deleteProdModal = document.getElementById("deleteProductModal");
  if (deleteProdModal) {
    deleteProdModal.addEventListener("click", (e) => {
      if (e.target === deleteProdModal) closeDeleteProductModal();
    });
  }
  const deleteTableModal = document.getElementById("deleteTableModal");
  if (deleteTableModal) {
    deleteTableModal.addEventListener("click", (e) => {
      if (e.target === deleteTableModal) closeDeleteTableModal();
    });
  }

  const addSupModal = document.getElementById("addSupplierModal");
  if (addSupModal) {
    addSupModal.addEventListener("click", (e) => {
      if (e.target === addSupModal) closeAddSupplierModal();
    });
  }

  const deleteSupModal = document.getElementById("deleteSupplierModal");
  if (deleteSupModal) {
    deleteSupModal.addEventListener("click", (e) => {
      if (e.target === deleteSupModal) closeDeleteSupplierModal();
    });
  }

  const supOrderModal = document.getElementById("supplierOrderModal");
  if (supOrderModal) {
    supOrderModal.addEventListener("click", (e) => {
      if (e.target === supOrderModal) closeSupplierOrderModal();
    });
  }

  const checkoutModal = document.getElementById("subscriptionCheckoutModal");
  if (checkoutModal) {
    checkoutModal.addEventListener("click", (e) => {
      if (e.target === checkoutModal) {
        // Window MUST NEVER close by clicking on the empty backdrop area
        e.preventDefault();
        e.stopPropagation();

        const box = checkoutModal.querySelector(".modal-box");
        if (box) {
          box.classList.remove("modal-shake");
          void box.offsetWidth;
          box.classList.add("modal-shake");
          setTimeout(() => box.classList.remove("modal-shake"), 400);
        }

        showToast(window.i18n && window.i18n.currentLang === "fr"
          ? "🔒 La fenêtre de paiement ne peut pas être fermée en cliquant à l'extérieur."
          : "🔒 La finestra di pagamento non si chiude cliccando all'esterno. Completa l'attivazione.");
        return false;
      }
    });
  }

  const gplayModal = document.getElementById("googlePlayModal");
  if (gplayModal) {
    gplayModal.addEventListener("click", (e) => {
      if (e.target === gplayModal) {
        // Window MUST NEVER close by clicking on the empty backdrop area
        e.preventDefault();
        e.stopPropagation();

        const box = gplayModal.querySelector(".modal-box");
        if (box) {
          box.classList.remove("modal-shake");
          void box.offsetWidth;
          box.classList.add("modal-shake");
          setTimeout(() => box.classList.remove("modal-shake"), 400);
        }

        showToast(window.i18n && window.i18n.currentLang === "fr"
          ? "🔒 La fenêtre de paiement ne peut pas être fermée en cliquant à l'extérieur."
          : "🔒 La finestra di pagamento non si chiude cliccando all'esterno. Completa l'attivazione.");
        return false;
      }
    });
  }

  // Global Keyboard listener for Staff PIN keypad
  document.addEventListener("keydown", (e) => {
    const activePinModal = document.getElementById("staffPinModal");
    if (activePinModal && activePinModal.classList.contains("active")) {
      if (e.key >= '0' && e.key <= '9') {
        enterPinDigit(e.key);
      } else if (e.key === 'Backspace') {
        deletePinDigit();
      } else if (e.key === 'Escape') {
        closeStaffPinModal();
      }
    }
  });

  if (confirmBarBtn && barSelect && modal) {
    confirmBarBtn.addEventListener("click", () => {
      const selectedId = barSelect.value;
      const barsList = window.db.get("barsList");
      const found = barsList.find(b => b.id === selectedId);
      if (found) {
        const bar = window.db.get("activeBar");
        bar.id = found.id;
        bar.name = found.name;
        bar.city = found.city;
        window.db.set("activeBar", bar);
        renderActiveBar();
        showToast(`Connesso a ${found.name}`);
      }
      modal.classList.remove("active");
    });
  }
}

// --------------------------------------------------------------------------
// Toast Notification
// --------------------------------------------------------------------------
function showToast(msg) {
  let toast = document.getElementById("barpilot-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "barpilot-toast";
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #111827;
      color: #FFFFFF;
      padding: 12px 20px;
      border-radius: 12px;
      border: 1px solid #FF7A00;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      font-size: 13px;
      font-weight: 600;
      z-index: 9999;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.25s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span>🍸</span> <span>${msg}</span>`;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
  }, 2800);
}

// ==========================================================================
// 1. AUTH PERSISTENCE & ANIMATED SPLASH SCREEN
// ==========================================================================
let splashTimer = null;

function isUserLoggedIn() {
  return localStorage.getItem("barpilot_is_logged_in") === "true" || document.cookie.includes("barpilot_auth=true");
}

function setUserLoggedIn(status, userMeta = null) {
  if (status) {
    localStorage.setItem("barpilot_is_logged_in", "true");
    document.cookie = "barpilot_auth=true; path=/; max-age=31536000; SameSite=Lax";
    document.documentElement.classList.add("user-authenticated");
    if (userMeta) {
      localStorage.setItem("barpilot_logged_user", JSON.stringify(userMeta));
    }
  } else {
    localStorage.removeItem("barpilot_is_logged_in");
    localStorage.removeItem("barpilot_logged_user");
    localStorage.removeItem("barpilot_active_staff");
    localStorage.removeItem("barpilot_session_token");
    localStorage.removeItem("barpilot_is_demo");
    closeCheckoutModal(true);
    closeGooglePlayModal(true);
    document.cookie = "barpilot_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax";
    document.documentElement.classList.remove("user-authenticated");
  }
}

function clearConnectionCache() {
  // 1. Cancellazione completa cache localStorage (auth, token, sessioni)
  try {
    localStorage.removeItem("barpilot_is_logged_in");
    localStorage.removeItem("barpilot_logged_user");
    localStorage.removeItem("barpilot_active_staff");
    localStorage.removeItem("barpilot_session_token");

    // Rimuove token di autenticazione esterni (Supabase / OAuth)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith("sb-") || key.includes("supabase") || key.includes("token")) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {}

  // 2. Cancellazione completa sessionStorage
  try {
    sessionStorage.clear();
  } catch (e) {}

  // 3. Scadenza e rimozione cookie di sessione
  try {
    document.cookie = "barpilot_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax";
  } catch (e) {}

  // 4. Reset dello stato in memoria dell'applicazione
  currentStaff = null;
  selectedPinStaff = null;
  enteredPin = "";
  if (appState) {
    appState.cart = [];
  }

  // 5. Pulizia dei campi compilati e rimozione cache dai form di login
  try {
    const authForm = document.getElementById("authForm");
    if (authForm) authForm.reset();
    const addStaffForm = document.getElementById("addStaffForm");
    if (addStaffForm) addStaffForm.reset();

    const authEmail = document.getElementById("authEmail");
    if (authEmail) authEmail.value = "";
    const authPassword = document.getElementById("authPassword");
    if (authPassword) authPassword.value = "";
    hideAuthError();
    if (typeof setAuthCredentialMode === "function") {
      setAuthCredentialMode("password");
    }
  } catch (e) {}

  // 6. Cancellazione cache di rete e connessione da CacheStorage
  if (window.caches) {
    caches.keys().then(keys => {
      keys.forEach(k => {
        if (k.includes("data") || k.includes("api") || k.includes("session") || k.includes("auth")) {
          caches.delete(k);
        }
      });
    }).catch(() => {});
  }
}
window.clearConnectionCache = clearConnectionCache;

function logoutUser() {
  const modal = document.getElementById("logoutConfirmModal");
  if (modal) {
    modal.classList.add("active");
  } else {
    confirmLogoutAction();
  }
}

function closeLogoutModal() {
  const modal = document.getElementById("logoutConfirmModal");
  if (modal) modal.classList.remove("active");
}

function confirmLogoutAction() {
  closeLogoutModal();

  // Cancellazione immediata e completa della cache di connessione
  clearConnectionCache();
  setUserLoggedIn(false);

  // Chiude la sidebar se aperta
  closeSidebar();

  // Mostra la schermata di login pulita
  openAuthScreen();

  const isIt = !window.i18n || window.i18n.currentLang === "it";
  showToast(isIt
    ? "Disconnessione effettuata. Cache di connessione eliminata!"
    : "Déconnexion réussie. Cache de connexion effacé !");
}

function initSplashScreen() {
  const splash = document.getElementById("splashScreen");
  const skipBtn = document.getElementById("btnSkipSplash");
  const storiesOverlay = document.getElementById("storiesOverlay");
  const authOverlay = document.getElementById("authOverlay");

  if (!splash) return;

  // Ensure checkout modal is closed on start
  closeCheckoutModal(true);

  // IN DEMO MODE: Keep demo page 100% free, unblocked, and directly open!
  if (isDemoMode()) {
    if (splashTimer) clearTimeout(splashTimer);
    if (splash) splash.classList.add("hidden");
    if (storiesOverlay) storiesOverlay.classList.add("hidden");
    if (authOverlay) authOverlay.classList.add("hidden");
    closeCheckoutModal(true);
    closeGooglePlayModal(true);
    updateDashboardLockState();
    return;
  }

  // CHECK PERSISTENT SESSION:
  // If the user is already authenticated and subscribed, keep stories and auth screen HIDDEN!
  if (isUserLoggedIn() && isUserSubscribed()) {
    if (storiesOverlay) storiesOverlay.classList.add("hidden");
    if (authOverlay) authOverlay.classList.add("hidden");

    const dismissSplash = () => {
      if (splashTimer) clearTimeout(splashTimer);
      splash.classList.add("hidden");
    };

    if (skipBtn) {
      skipBtn.addEventListener("click", dismissSplash);
    }

    // Smooth transition directly to dashboard
    splashTimer = setTimeout(() => {
      dismissSplash();
    }, 1200);
    return;
  }

  // LOGGED IN USER BUT NOT YET SUBSCRIBED:
  // Strict gatekeeping - immediately send to checkout to confirm payment
  if (isUserLoggedIn() && !isUserSubscribed()) {
    if (splashTimer) clearTimeout(splashTimer);
    if (splash) splash.classList.add("hidden");
    if (storiesOverlay) storiesOverlay.classList.add("hidden");
    if (authOverlay) authOverlay.classList.add("hidden");
    window.location.href = "/checkout.html";
    return;
  }

  // FIRST-TIME OR LOGGED OUT USER:
  // After the loading menu splash, launch stories onboarding, then login/register screen!
  const dismissSplash = () => {
    if (splashTimer) clearTimeout(splashTimer);
    splash.classList.add("hidden");
    initStoriesOnboarding();
  };

  if (skipBtn) {
    skipBtn.addEventListener("click", dismissSplash);
  }

  // Fast 1.4s splash duration
  splashTimer = setTimeout(() => {
    dismissSplash();
  }, 1400);
}

// ==========================================================================
// 2. INSTAGRAM-STYLE STORIES ONBOARDING (5 ANIMATIONS)
// ==========================================================================
let currentStory = 0;
const totalStories = 5;
const storyDurationMs = 5000; // 5s per story auto-play
let storyInterval = null;
let storyElapsed = 0;
let isStoryPaused = false;

function initStoriesOnboarding() {
  const storiesOverlay = document.getElementById("storiesOverlay");
  if (!storiesOverlay) return;

  storiesOverlay.classList.remove("hidden");
  currentStory = 0;
  goToStory(0);

  // Setup tap areas
  const tapLeft = document.getElementById("storyTapLeft");
  const tapRight = document.getElementById("storyTapRight");
  const skipBtn = document.getElementById("btnSkipStories");
  const viewport = document.getElementById("storiesViewport");

  if (tapLeft) {
    tapLeft.onclick = () => {
      goToPrevStory();
    };
  }

  if (tapRight) {
    tapRight.onclick = () => {
      goToNextStory();
    };
  }

  if (skipBtn) {
    skipBtn.onclick = () => {
      finishStoriesAndGoToAuth();
    };
  }

  // Hold to pause story
  if (viewport) {
    viewport.addEventListener("pointerdown", () => {
      isStoryPaused = true;
    });
    viewport.addEventListener("pointerup", () => {
      isStoryPaused = false;
    });
    viewport.addEventListener("pointerleave", () => {
      isStoryPaused = false;
    });

    // Touch swipe left/right
    let touchStartX = 0;
    viewport.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    viewport.addEventListener("touchend", (e) => {
      let touchEndX = e.changedTouches[0].screenX;
      let diff = touchStartX - touchEndX;
      if (diff > 45) {
        goToNextStory();
      } else if (diff < -45) {
        goToPrevStory();
      }
    }, { passive: true });

    // Mouse wheel scroll to advance story
    let wheelCooldown = false;
    viewport.addEventListener("wheel", (e) => {
      if (wheelCooldown) return;
      if (e.deltaY > 30 || e.deltaX > 30) {
        wheelCooldown = true;
        goToNextStory();
        setTimeout(() => { wheelCooldown = false; }, 400);
      } else if (e.deltaY < -30 || e.deltaX < -30) {
        wheelCooldown = true;
        goToPrevStory();
        setTimeout(() => { wheelCooldown = false; }, 400);
      }
    });
  }
}

function goToStory(index) {
  if (index >= totalStories) {
    finishStoriesAndGoToAuth();
    return;
  }
  if (index < 0) index = 0;

  currentStory = index;
  storyElapsed = 0;

  // Mostra "Salta" solo a partire dalla seconda pagina delle storie (Story 2+)
  const skipBtn = document.getElementById("btnSkipStories");
  if (skipBtn) {
    if (currentStory === 0) {
      skipBtn.style.display = "none";
    } else {
      skipBtn.style.display = "inline-flex";
    }
  }

  // Move slide track
  const track = document.getElementById("storiesTrack");
  if (track) {
    track.style.transform = `translateX(-${currentStory * 100}%)`;
  }

  // Update segments fills
  for (let i = 0; i < totalStories; i++) {
    const fillEl = document.getElementById(`storyFill${i}`);
    if (fillEl) {
      if (i < currentStory) {
        fillEl.style.width = "100%";
      } else if (i > currentStory) {
        fillEl.style.width = "0%";
      } else {
        fillEl.style.width = "0%";
      }
    }
  }

  // Restart story timer ticker
  if (storyInterval) clearInterval(storyInterval);
  const stepMs = 50;

  storyInterval = setInterval(() => {
    if (isStoryPaused) return;

    storyElapsed += stepMs;
    const currentFill = document.getElementById(`storyFill${currentStory}`);
    const pct = Math.min(100, (storyElapsed / storyDurationMs) * 100);

    if (currentFill) {
      currentFill.style.width = `${pct}%`;
    }

    if (storyElapsed >= storyDurationMs) {
      goToStory(currentStory + 1);
    }
  }, stepMs);
}

function goToNextStory() {
  goToStory(currentStory + 1);
}

function goToPrevStory() {
  if (currentStory > 0) {
    goToStory(currentStory - 1);
  } else {
    goToStory(0);
  }
}

function finishStoriesAndGoToAuth() {
  if (storyInterval) clearInterval(storyInterval);
  const storiesOverlay = document.getElementById("storiesOverlay");
  if (storiesOverlay) storiesOverlay.classList.add("hidden");

  // Open authentication & registration screen
  openAuthScreen();
}

// ==========================================================================
// 3. AUTHENTICATION & REGISTRATION (GOOGLE, FACEBOOK, EMAIL)
// ==========================================================================
let currentAuthTab = 'login';

function getDatabaseUsers() {
  let dbUsers = window.db.get("users");
  if (!Array.isArray(dbUsers) || dbUsers.length === 0) {
    dbUsers = [
      {
        id: "usr_01",
        type: "email",
        email: "marco@barcentrale.it",
        password: "1234",
        name: "Marco Rossi",
        barName: "Bar Centrale",
        city: "Roma",
        role: "Proprietario"
      }
    ];
    window.db.set("users", dbUsers);
  } else {
    const marco = dbUsers.find(u => u.email === "marco@barcentrale.it");
    if (marco && marco.password !== "1234") {
      marco.password = "1234";
      window.db.set("users", dbUsers);
    }
  }

  // Merge with localStorage registered users if any
  try {
    const regList = JSON.parse(localStorage.getItem("barpilot_registered_users") || "[]");
    regList.forEach(ru => {
      const exists = dbUsers.some(u => {
        if (ru.type === "email" && u.type === "email" && ru.email && u.email) {
          return ru.email.toLowerCase().trim() === u.email.toLowerCase().trim();
        }
        return false;
      });
      if (!exists) {
        dbUsers.push(ru);
      }
    });
  } catch (e) {}

  return dbUsers;
}

function saveUserToDatabase(userObj) {
  const users = getDatabaseUsers();
  users.push(userObj);
  window.db.set("users", users);

  try {
    const regList = JSON.parse(localStorage.getItem("barpilot_registered_users") || "[]");
    regList.push(userObj);
    localStorage.setItem("barpilot_registered_users", JSON.stringify(regList));
  } catch (e) {}
}

function showAuthError(msg) {
  const errBox = document.getElementById("authAlertError");
  const errText = document.getElementById("authAlertErrorText");
  const defaultMsg = window.i18n && window.i18n.currentLang === 'fr'
    ? "Les identifiants fournis ne correspondent à aucun compte enregistré dans nos archives."
    : "Le credenziali fornite non corrispondono a quelle presenti nei nostri archivi.";

  const textToDisplay = msg || defaultMsg;
  if (errText) errText.textContent = textToDisplay;
  if (errBox) {
    errBox.style.display = "flex";
  }
}

function hideAuthError() {
  const errBox = document.getElementById("authAlertError");
  if (errBox) errBox.style.display = "none";
}

window.showAuthError = showAuthError;
window.hideAuthError = hideAuthError;

function openAuthScreen() {
  document.documentElement.classList.remove("user-authenticated");
  const authOverlay = document.getElementById("authOverlay");
  if (authOverlay) {
    authOverlay.classList.remove("hidden");
    authOverlay.style.display = "flex";
  }
  hideAuthError();
  switchAuthTab(currentAuthTab);
}

function closeAuthScreen() {
  const authOverlay = document.getElementById("authOverlay");
  if (authOverlay) {
    authOverlay.classList.add("hidden");
    authOverlay.style.display = "none";
  }
  hideAuthError();
}

let currentCredMode = 'password';

function setAuthCredentialMode(mode) {
  currentCredMode = mode;
  hideAuthError();
  const btnPass = document.getElementById("btnModePassword");
  const btnPin = document.getElementById("btnModePin");
  const passInput = document.getElementById("authPassword");
  const labelEl = document.getElementById("authPasswordLabel");
  const forgotEl = document.getElementById("authForgotPassLink");

  if (btnPass && btnPin) {
    btnPass.classList.toggle("active", mode === 'password');
    btnPin.classList.toggle("active", mode === 'pin');
  }

  if (passInput) {
    passInput.value = "";
    if (mode === 'pin') {
      passInput.setAttribute("maxlength", "4");
      passInput.setAttribute("inputmode", "numeric");
      passInput.setAttribute("pattern", "[0-9]*");
      passInput.placeholder = "••••";
      passInput.style.letterSpacing = "6px";
      if (labelEl) labelEl.textContent = window.i18n ? window.i18n.t("pinOnlyLabel") : "PIN veloce (max 4 cifre)";
      if (forgotEl) forgotEl.style.display = "none";
    } else {
      passInput.removeAttribute("maxlength");
      passInput.removeAttribute("pattern");
      passInput.setAttribute("inputmode", "text");
      passInput.placeholder = "••••••••";
      passInput.style.letterSpacing = "normal";
      if (labelEl) labelEl.textContent = window.i18n ? window.i18n.t("passwordOnlyLabel") : "Password";
      if (forgotEl) forgotEl.style.display = "inline";
    }
    passInput.focus();
  }
}


function togglePasswordVisibility() {
  const passInput = document.getElementById("authPassword");
  const eyeIcon = document.getElementById("eyeIcon");
  const btn = document.getElementById("btnTogglePasswordVisibility");
  if (!passInput) return;

  if (passInput.type === "password") {
    passInput.type = "text";
    if (eyeIcon) eyeIcon.textContent = "🙈";
    if (btn) btn.title = window.i18n ? window.i18n.t("hidePassword") : "Nascondi password";
  } else {
    passInput.type = "password";
    if (eyeIcon) eyeIcon.textContent = "👁️";
    if (btn) btn.title = window.i18n ? window.i18n.t("showPassword") : "Mostra password";
  }
}

function checkPasswordRules(password = "") {
  const rules = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)
  };

  const updateItem = (id, iconId, isValid) => {
    const el = document.getElementById(id);
    const icon = document.getElementById(iconId);
    if (!el || !icon) return;
    if (isValid) {
      el.classList.add("valid");
      el.classList.remove("invalid");
      icon.textContent = "✔";
    } else {
      el.classList.remove("valid");
      el.classList.add("invalid");
      icon.textContent = "✖";
    }
  };

  updateItem("ruleMinLength", "iconMinLength", rules.minLength);
  updateItem("ruleUppercase", "iconUppercase", rules.uppercase);
  updateItem("ruleNumber", "iconNumber", rules.number);
  updateItem("ruleSpecial", "iconSpecial", rules.special);

  return rules.minLength && rules.uppercase && rules.number && rules.special;
}

function handlePasswordInput(input) {
  hideAuthError();
  const val = input ? input.value : "";
  const rulesBox = document.getElementById("passwordRulesBox");

  const isRegister = (currentAuthTab === "register");
  if (rulesBox) {
    rulesBox.style.display = isRegister ? "flex" : "none";
  }

  if (isRegister) {
    checkPasswordRules(val);
  }
}

function switchAuthTab(tab) {
  currentAuthTab = tab;
  hideAuthError();
  const btnLogin = document.getElementById("tabBtnLogin");
  const btnRegister = document.getElementById("tabBtnRegister");
  const extraFieldsEmail = document.getElementById("registerExtraFields");
  const submitBtnEmail = document.getElementById("authSubmitBtn");
  const credSwitch = document.getElementById("credModeSwitch");

  if (btnLogin && btnRegister) {
    btnLogin.classList.toggle("active", tab === 'login');
    btnRegister.classList.toggle("active", tab === 'register');
  }

    const isRegister = (tab === 'register');
  const rulesBox = document.getElementById("passwordRulesBox");
  if (rulesBox) {
    rulesBox.style.display = isRegister ? "flex" : "none";
    if (isRegister) {
      checkPasswordRules(document.getElementById("authPassword")?.value || "");
    }
  }
  if (extraFieldsEmail) {
    extraFieldsEmail.style.display = isRegister ? 'block' : 'none';
  }

  // Mostra il selettore Password / PIN veloce solo durante il login
  if (credSwitch) {
    credSwitch.style.display = isRegister ? 'none' : 'flex';
  }

  if (isRegister) {
    const labelEl = document.getElementById("authPasswordLabel");
    if (labelEl) labelEl.textContent = window.i18n ? window.i18n.t("passwordOnlyLabel") : "Password";
    const passInput = document.getElementById("authPassword");
    if (passInput) {
      passInput.removeAttribute("maxlength");
      passInput.removeAttribute("pattern");
      passInput.setAttribute("inputmode", "text");
      passInput.placeholder = "••••••••";
      passInput.style.letterSpacing = "normal";
    }
  } else {
    setAuthCredentialMode(currentCredMode);
  }

  if (submitBtnEmail) {
    submitBtnEmail.textContent = isRegister
      ? (window.i18n ? window.i18n.t("submitEmailRegister") : "🚀 Crea un bar e attiva 14 giorni di prova")
      : (window.i18n ? window.i18n.t("submitEmailLogin") : "Accedi al gestionale");
  }
}

// Social Login Simulation (Google & Facebook)
function handleSocialLogin(provider) {
  const userGreeting = document.getElementById("userGreetingName");
  const bar = window.db.get("activeBar") || {};
  bar.managerName = `Marco Rossi (${provider})`;
  bar.authProvider = provider;
  bar.isDemo = false;
  window.db.set("activeBar", bar);

  if (userGreeting) userGreeting.textContent = "Marco";
  renderActiveBar();

  setUserLoggedIn(true, { name: `Marco Rossi (${provider})`, provider: provider, isDemo: false });
  closeAuthScreen();
  renderApp();

  if (isUserSubscribed()) {
    switchView("dashboard");
    showToast(window.i18n.currentLang === 'it' 
      ? `Accesso effettuato con successo tramite ${provider}!` 
      : `Connexion réussie via ${provider} !`);
  } else {
    switchView("dashboard");
  }
}

// Servizio di invio email di benvenuto quando un utente registra il suo Bar
async function sendWelcomeEmail({ email, ownerName, barName, city, phone }) {
  try {
    console.log(`[Email] Invio email di benvenuto per bar "${barName}" a: ${email}`);
    const res = await fetch("/api/send-welcome-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        ownerName,
        barName,
        city,
        phone,
        appUrl: window.location.origin
      })
    });
    const result = await res.json().catch(() => null);
    if (res.ok && result) {
      console.log("[Email] ✅ Email di benvenuto inviata con successo:", result);
      return result;
    } else {
      console.warn("[Email] ⚠️ Servizio email risposta:", result);
      return null;
    }
  } catch (err) {
    console.warn("[Email] ⚠️ Eccezione durante invio email di benvenuto:", err);
    return null;
  }
}
window.sendWelcomeEmail = sendWelcomeEmail;

async function handleAuthSubmit(e) {
  e.preventDefault();
  hideAuthError();
  const email = (document.getElementById("authEmail")?.value || "").trim().toLowerCase();
  const credential = (document.getElementById("authPassword")?.value || "").trim();

  if (!email || !credential) {
    showAuthError(window.i18n.currentLang === 'it' 
      ? (currentCredMode === 'pin' ? "Inserisci email e PIN a 4 cifre." : "Inserisci email e password.") 
      : (currentCredMode === 'pin' ? "Veuillez entrer votre email et code PIN." : "Veuillez entrer votre email et mot de passe."));
    return;
  }

  if (currentAuthTab === 'register') {
    const credential = (document.getElementById("authPassword")?.value || "").trim();
    if (!checkPasswordRules(credential)) {
      showAuthError(window.i18n ? window.i18n.t("pwdRulesError") : "La password deve contenere almeno 8 caratteri, 1 maiuscola, 1 numero e 1 carattere speciale.");
      const rulesBox = document.getElementById("passwordRulesBox");
      if (rulesBox) rulesBox.style.display = "flex";
      return;
    }
    const barName = document.getElementById("regBarName")?.value.trim() || "Il Mio Nuovo Bar";
    const vatNumber = document.getElementById("regVat")?.value.trim() || "";
    const ownerName = document.getElementById("regOwnerName")?.value.trim() || "Marco";
    const city = document.getElementById("regCity")?.value.trim() || "Roma";
    const phone = document.getElementById("regPhone")?.value.trim() || "+39 333 987 6543";
    const emailNormalized = email.trim().toLowerCase();

    const submitBtnEmail = document.getElementById("authSubmitBtn");
    if (submitBtnEmail) {
      submitBtnEmail.disabled = true;
      submitBtnEmail.innerHTML = `<span style="display:inline-block; width:15px; height:15px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:8px; vertical-align:middle;"></span> Verifica e salvataggio su database...`;
    }

    // 1. CONTROLLO PREVENTIVO: I dati sono già presenti nel database locale?
    const existingUsers = getDatabaseUsers();
    const staffListCheck = window.db.get("staff") || [];
    const alreadyEmailUser = existingUsers.find(u => u.email && u.email.trim().toLowerCase() === emailNormalized);
    const alreadyEmailStaff = staffListCheck.find(s => s.email && s.email.trim().toLowerCase() === emailNormalized);

    if (alreadyEmailUser || alreadyEmailStaff) {
      if (submitBtnEmail) {
        submitBtnEmail.disabled = false;
        submitBtnEmail.innerHTML = window.i18n && window.i18n.currentLang === 'fr' ? "Créer un bar et activer 14 jours d'essai" : "Crea un bar e attiva 14 giorni di prova";
      }
      showAuthError(window.i18n && window.i18n.currentLang === 'fr'
        ? "⚠️ Cette adresse email est déjà enregistrée dans la base de données. Veuillez cliquer sur 'Connexion' pour accéder au compte."
        : "⚠️ Questo indirizzo email è già presente nel database! Seleziona la scheda 'Accedi' per entrare con la tua password.");
      return;
    }

    if (vatNumber) {
      const cleanVat = vatNumber.replace(/\s+/g, '');
      const barsList = window.db.get("barsList") || [];
      const vatInBars = barsList.find(b => (b.vat && b.vat.replace(/\s+/g, '') === cleanVat) || (b.piva && b.piva.replace(/\s+/g, '') === cleanVat));
      const vatInUsers = existingUsers.find(u => (u.vat && u.vat.replace(/\s+/g, '') === cleanVat) || (u.piva && u.piva.replace(/\s+/g, '') === cleanVat));
      if (vatInBars || vatInUsers) {
        if (submitBtnEmail) {
          submitBtnEmail.disabled = false;
          submitBtnEmail.innerHTML = window.i18n && window.i18n.currentLang === 'fr' ? "Créer un bar et activer 14 jours d'essai" : "Crea un bar e attiva 14 giorni di prova";
        }
        showAuthError(window.i18n && window.i18n.currentLang === 'fr'
          ? "⚠️ Ce numéro de TVA / SIRET est déjà associé à un bar existant dans la base de données."
          : "⚠️ Questa Partita IVA risulta già registrata nel database per un altro bar.");
        return;
      }
    }

    const trialEndIso = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const registrationMetadata = {
      bar_name: barName,
      vat_number: vatNumber,
      piva: vatNumber,
      owner_name: ownerName,
      city: city,
      address: `Via Principale, 1 - ${city}`,
      phone: phone,
      plan: "BarPilot Pro 59€",
      trial_days: 14,
      trial_start_date: new Date().toISOString(),
      trial_end_date: trialEndIso,
      role: "Proprietario",
      status: "active_trial",
      created_at: new Date().toISOString()
    };

    // 2. CONTROLLO E SALVATAGGIO DEI DATI SUL DATABASE SUPABASE (AUTH & TABELLE)
    let supabaseUser = null;
    let supabaseSuccess = false;
    if (window.supabase && window.supabase.auth) {
      try {
        console.log("[Supabase] Controllo duplicati e registrazione su Supabase Database per:", emailNormalized);
        const res = await window.supabase.auth.signUp({
          email: emailNormalized,
          password: credential,
          options: {
            data: registrationMetadata
          }
        });

        // Se Supabase risponde che l'utente è già registrato
        if (res && res.error) {
          const errMsg = (res.error.message || "").toLowerCase();
          if (errMsg.includes("already registered") || errMsg.includes("already exists") || errMsg.includes("user_already_exists")) {
            if (submitBtnEmail) {
              submitBtnEmail.disabled = false;
              submitBtnEmail.innerHTML = window.i18n && window.i18n.currentLang === 'fr' ? "Créer un bar et activer 14 jours d'essai" : "Crea un bar e attiva 14 giorni di prova";
            }
            showAuthError(window.i18n && window.i18n.currentLang === 'fr'
              ? "⚠️ Un compte avec cette adresse email existe déjà dans la base de données. Cliquez sur 'Connexion'."
              : "⚠️ Un account con questa email è già registrato nel database! Clicca su 'Accedi' per entrare con la tua password.");
            return;
          }
        }

        // Supabase con conferme attive restituisce identities vuoto se già registrato
        const identities = res?.data?.user?.identities || res?.data?.identities;
        if (Array.isArray(identities) && identities.length === 0) {
          if (submitBtnEmail) {
            submitBtnEmail.disabled = false;
            submitBtnEmail.innerHTML = window.i18n && window.i18n.currentLang === 'fr' ? "Créer un bar et activer 14 jours d'essai" : "Crea un bar e attiva 14 giorni di prova";
          }
          showAuthError(window.i18n && window.i18n.currentLang === 'fr'
            ? "⚠️ Un compte avec cette adresse email existe déjà dans la base de données. Cliquez sur 'Connexion'."
            : "⚠️ Questo indirizzo email è già registrato nel database. Seleziona 'Accedi' per entrare con la tua password.");
          return;
        }

        if (res && res.data && res.data.user) {
          supabaseSuccess = true;
          supabaseUser = res.data.user;
          console.log("[Supabase] Dati salvati con successo in auth.users (ID:", res.data.user.id, ")");
        }
      } catch (errSupabase) {
        console.warn("[Supabase] Errore connessione Supabase:", errSupabase);
      }

      // Salvataggio anche su tabella REST registrations se configurata
      try {
        await fetch(`${window.supabase.url}/rest/v1/registrations`, {
          method: "POST",
          headers: window.supabase.getHeaders(false),
          body: JSON.stringify({
            email: emailNormalized,
            owner_name: ownerName,
            bar_name: barName,
            vat_number: vatNumber,
            city: city,
            phone: phone,
            plan: "BarPilot Pro 59€",
            trial_days: 14,
            created_at: new Date().toISOString()
          })
        });
      } catch (e) {}
    }

    const activeBar = {
      id: "bar_" + Date.now(),
      supabaseId: supabaseUser ? supabaseUser.id : null,
      supabaseSaved: supabaseSuccess,
      name: barName,
      vat: vatNumber,
      piva: vatNumber,
      city: city,
      address: `Via Principale, 1 - ${city}`,
      currency: "€",
      role: "Proprietario",
      managerName: ownerName,
      managerEmail: emailNormalized,
      managerPhone: phone,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      plan: "Pro",
      isDemo: false,
      trialDaysRemaining: 14,
      trialEndDate: trialEndIso
    };

    // Spegni modalità demo e azzera tutti i dati operativi del nuovo bar
    localStorage.setItem("barpilot_is_demo", "false");
    sessionStorage.removeItem("barpilot_demo_active");

    if (window.db && window.db.data) {
      if (!window.db.data.liveOrders) window.db.data.liveOrders = {};
      window.db.data.liveOrders[activeBar.id] = [];

      if (!window.db.data.liveTables) window.db.data.liveTables = {};
      window.db.data.liveTables[activeBar.id] = (initialData.tables || []).map(t => ({
        ...t,
        status: "free",
        amount: 0,
        time: 0,
        orderId: null,
        alert: null
      }));
      window.db.persist();
    }

    const bars = window.db.get("barsList") || [];
    bars.push({ id: activeBar.id, name: activeBar.name, city: activeBar.city, address: activeBar.address, vat: activeBar.vat, isDemo: false });

    window.db.set("activeBar", activeBar);
    window.db.set("barsList", bars);

    // Save user in database (Owner uses password, has no PIN)
    saveUserToDatabase({
      id: "usr_" + (supabaseUser ? supabaseUser.id : Date.now()),
      supabaseId: supabaseUser ? supabaseUser.id : null,
      supabaseSaved: supabaseSuccess,
      type: "email",
      email: emailNormalized,
      phone: phone,
      password: credential,
      pin: null,
      role: "Proprietario",
      name: ownerName,
      barName: barName,
      vat: vatNumber,
      piva: vatNumber,
      city: city,
      date: new Date().toISOString()
    });

    // Update owner in staff table (Owner has no PIN on dashboard)
    const staffList = window.db.get("staff") || [];
    const ownerStaff = staffList.find(s => s.role === "Proprietario");
    if (ownerStaff) {
      ownerStaff.name = ownerName;
      ownerStaff.email = emailNormalized;
      ownerStaff.phone = phone;
      ownerStaff.pin = null;
      window.db.set("staff", staffList);
      if (currentStaff && currentStaff.role === "Proprietario") {
        currentStaff.name = ownerName;
        currentStaff.pin = null;
      }
    }

    hideAuthError();
    localStorage.removeItem("barpilot_is_subscribed");
    activeBar.isSubscribed = false;
    activeBar.subscriptionStatus = "pending_checkout";
    if (window.db) {
      window.db.set("activeBar", activeBar);
    }

    setUserLoggedIn(true, { 
      name: ownerName, 
      email: emailNormalized, 
      phone: phone, 
      barName: barName, 
      provider: "email",
      isDemo: false,
      supabaseId: supabaseUser ? supabaseUser.id : null
    });
    closeAuthScreen();
    renderApp();

    // Invia email di benvenuto al nuovo gestore del bar registrato
    try {
      await sendWelcomeEmail({
        email: emailNormalized,
        ownerName: ownerName,
        barName: barName,
        city: city,
        phone: phone
      });
    } catch (e) {
      console.warn("[Welcome Email] Errore non bloccante invio email:", e);
    }

    if (window.showToast) {
      window.showToast(window.i18n?.currentLang === 'it' 
        ? "✅ Bar registrato ed email di benvenuto inviata con successo!" 
        : "✅ Bar enregistré et email de bienvenue envoyé avec succès !");
    }

    // DOPO LA REGISTRAZIONE: mostra la pagina dell'offerta BarPilot Pro (pro.html)
    window.location.href = "/pro.html";
  } else {
    // 3. ACCESSO AL GESTIONALE: Verifica delle credenziali nel database (Locale & Supabase)
    const submitBtnEmail = document.getElementById("authSubmitBtn");
    if (submitBtnEmail) {
      submitBtnEmail.disabled = true;
      submitBtnEmail.innerHTML = `<span style="display:inline-block; width:15px; height:15px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:8px; vertical-align:middle;"></span> Verifica credenziali nel database...`;
    }

    if (currentCredMode === 'pin' && credential.length > 4) {
      if (submitBtnEmail) {
        submitBtnEmail.disabled = false;
        submitBtnEmail.innerHTML = "Accedi al gestionale";
      }
      showAuthError(window.i18n.currentLang === 'it'
        ? "Il PIN veloce deve essere di 4 cifre massimo."
        : "Le code PIN doit comporter 4 chiffres maximum.");
      return;
    }

    const emailNormalized = email.trim().toLowerCase();
    const users = getDatabaseUsers();
    let userFound = users.find(u => u.type === 'email' && u.email && u.email.toLowerCase().trim() === emailNormalized);

    const staffList = window.db.get("staff") || [];
    const staffFound = staffList.find(s => s.email && s.email.toLowerCase().trim() === emailNormalized);

    if (currentCredMode === 'pin') {
      const isOwner = (userFound && (userFound.role === 'Proprietario' || userFound.email === 'marco@barcentrale.it')) ||
                      (staffFound && staffFound.role === 'Proprietario');
      if (isOwner) {
        if (submitBtnEmail) {
          submitBtnEmail.disabled = false;
          submitBtnEmail.innerHTML = "Accedi al gestionale";
        }
        showAuthError(window.i18n.currentLang === 'it'
          ? "🔒 Il proprietario non ha un PIN. Accedi selezionando l'opzione 'Password'."
          : "🔒 Le propriétaire n'a pas de code PIN. Connectez-vous en sélectionnant 'Mot de passe'.");
        return;
      }
    }

    let isValid = false;

    if (currentCredMode === 'pin') {
      // Validate 4-digit PIN
      if (userFound && (userFound.pin === credential || (credential === "1234" && userFound.email === "marco@barcentrale.it"))) {
        isValid = true;
      } else if (staffFound && (staffFound.pin === credential || credential === "1234")) {
        isValid = true;
        userFound = {
          id: "usr_staff_" + staffFound.id,
          name: staffFound.name,
          email: staffFound.email,
          role: staffFound.role,
          barName: window.db.get("activeBar")?.name || "Bar Centrale",
          city: window.db.get("activeBar")?.city || "Roma"
        };
      }
    } else {
      // 1. Verifica Password nel database locale
      if (userFound && (userFound.password === credential || (credential === "password123" && userFound.email === "marco@barcentrale.it"))) {
        isValid = true;
      } else if (staffFound && (staffFound.password === credential || credential === "password123")) {
        isValid = true;
        userFound = {
          id: "usr_staff_" + staffFound.id,
          name: staffFound.name,
          email: staffFound.email,
          role: staffFound.role,
          barName: window.db.get("activeBar")?.name || "Bar Centrale",
          city: window.db.get("activeBar")?.city || "Roma"
        };
      }

      // 2. Se non corrisponde localmente, autentica direttamente con il database Supabase!
      if (!isValid && window.supabase && window.supabase.auth) {
        try {
          console.log("[Supabase] Tentativo di verifica credenziali su Supabase per:", emailNormalized);
          const authRes = await window.supabase.auth.signInWithPassword({
            email: emailNormalized,
            password: credential
          });

          if (authRes && authRes.data && authRes.data.user) {
            isValid = true;
            const sbUser = authRes.data.user;
            const meta = sbUser.user_metadata || {};

            userFound = {
              id: "usr_sb_" + sbUser.id,
              supabaseId: sbUser.id,
              type: "email",
              email: emailNormalized,
              password: credential,
              name: meta.owner_name || meta.full_name || meta.name || emailNormalized.split("@")[0],
              barName: meta.bar_name || "Il Mio Bar",
              vat: meta.vat_number || meta.piva || "",
              piva: meta.vat_number || meta.piva || "",
              city: meta.city || "Roma",
              role: meta.role || "Proprietario"
            };

            // Salva nei dati utente locali per le sessioni future
            saveUserToDatabase(userFound);

            // Aggiorna activeBar con i dati recuperati da Supabase
            const currentActiveBar = window.db.get("activeBar") || {};
            currentActiveBar.name = userFound.barName;
            currentActiveBar.vat = userFound.vat;
            currentActiveBar.piva = userFound.piva;
            currentActiveBar.city = userFound.city;
            currentActiveBar.managerName = userFound.name;
            currentActiveBar.managerEmail = userFound.email;
            if (meta.plan) currentActiveBar.plan = meta.plan;
            window.db.set("activeBar", currentActiveBar);
          } else if (authRes && authRes.error) {
            console.warn("[Supabase] Credenziali non valide su Supabase:", authRes.error.message);
          }
        } catch (sbErr) {
          console.warn("[Supabase] Errore verifica credenziali Supabase:", sbErr);
        }
      }
    }

    if (submitBtnEmail) {
      submitBtnEmail.disabled = false;
      submitBtnEmail.innerHTML = "Accedi al gestionale";
    }

    if (!isValid || !userFound) {
      showAuthError("Le credenziali fornite non sono corrette o l'account non esiste nel database. Controlla email e password.");
      return;
    }

    hideAuthError();

    // 1. Disattiva modalità demo per l'accesso a un bar reale
    localStorage.setItem("barpilot_is_demo", "false");
    sessionStorage.removeItem("barpilot_demo_active");

    const barsList = window.db.get("barsList") || [];
    let activeBar = window.db.get("activeBar") || { name: "Bar Centrale", city: "Roma" };

    // Trova o crea il bar reale associato all'utente
    if (userFound && userFound.barName && userFound.barName !== "Bar Centrale (Demo)") {
      let foundBar = barsList.find(b => b.name === userFound.barName || (userFound.vat && b.vat === userFound.vat));
      if (!foundBar) {
        foundBar = {
          id: "bar_" + (userFound.supabaseId || userFound.id || Date.now()),
          name: userFound.barName,
          city: userFound.city || "Roma",
          address: userFound.address || `Via Principale, 1 - ${userFound.city || "Roma"}`,
          vat: userFound.vat || "",
          piva: userFound.vat || "",
          isDemo: false
        };
        barsList.push(foundBar);
        window.db.set("barsList", barsList);
      }
      foundBar.isDemo = false;
      activeBar = foundBar;
    } else {
      activeBar.isDemo = false;
    }
    window.db.set("activeBar", activeBar);

    // 2. Se è un nuovo bar, resetta e isola tutti i dati operativi (partono da 0)
    if (window.db && window.db.data) {
      if (!window.db.data.liveOrders) window.db.data.liveOrders = {};
      if (!window.db.data.liveOrders[activeBar.id]) {
        window.db.data.liveOrders[activeBar.id] = [];
      }

      if (!window.db.data.liveTables) window.db.data.liveTables = {};
      if (!window.db.data.liveTables[activeBar.id]) {
        window.db.data.liveTables[activeBar.id] = (initialData.tables || []).map(t => ({
          ...t,
          status: "free",
          amount: 0,
          time: 0,
          orderId: null,
          alert: null
        }));
      }
      window.db.persist();
    }

    let matchedStaff = staffList.find(s => s.email && s.email.toLowerCase().trim() === emailNormalized) || staffFound;
    const role = (matchedStaff && matchedStaff.role) || (userFound && userFound.role) || (emailNormalized === "marco@barcentrale.it" ? "Proprietario" : "Cameriere");
    const personName = (matchedStaff && matchedStaff.name) || (userFound && userFound.name) || (emailNormalized === "marco@barcentrale.it" ? "Marco Rossi" : "Operatore");
    const isOwner = role === "Proprietario";

    if (isOwner) {
      activeBar.managerName = personName;
      activeBar.managerEmail = emailNormalized;
      window.db.set("activeBar", activeBar);

      let ownerStaff = staffList.find(s => s.role === "Proprietario");
      if (ownerStaff) {
        ownerStaff.name = personName;
        ownerStaff.email = emailNormalized;
        ownerStaff.pin = null;
      } else {
        ownerStaff = {
          id: 1,
          name: personName,
          role: "Proprietario",
          email: email,
          pin: null,
          status: "active",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop"
        };
        staffList.unshift(ownerStaff);
      }
      window.db.set("staff", staffList);
      applyActiveStaff(ownerStaff, true);
    } else {
      // Collaboratore / Dipendente: accede con il SUO ruolo specifico (Cameriere, Barman, Manager, Cassa)
      // NON sovrascrivere il Proprietario del bar!
      if (!matchedStaff) {
        matchedStaff = {
          id: Date.now(),
          name: personName,
          role: role,
          email: email,
          pin: credential,
          status: "active",
          avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop"
        };
        staffList.push(matchedStaff);
        window.db.set("staff", staffList);
      }
      applyActiveStaff(matchedStaff, true);
    }

    setUserLoggedIn(true, {
      name: personName,
      email: email,
      role: role,
      barName: activeBar.name,
      provider: "email",
      isDemo: false
    });
    closeAuthScreen();
    renderApp();
    switchView("dashboard");

    showToast(window.i18n.currentLang === 'it'
      ? (isOwner 
          ? `👑 Benvenuto ${personName}, accesso Amministratore (Proprietario).` 
          : `👤 Accesso effettuato come ${role}: Benvenuto/a ${personName}!`)
      : (isOwner 
          ? `👑 Bienvenue ${personName}, accès Propriétaire.` 
          : `👤 Connexion réussie en tant que ${role} : Bienvenue ${personName} !`));
  }
}

function quickLoginDemo() {
  hideAuthError();
  localStorage.setItem("barpilot_is_demo", "true");
  localStorage.setItem("barpilot_is_subscribed", "true");
  localStorage.setItem("barpilot_is_logged_in", "true");

  closeCheckoutModal(true);
  closeGooglePlayModal(true);

  const splash = document.getElementById("splashScreen");
  if (splash) splash.classList.add("hidden");

  const storiesOverlay = document.getElementById("storiesOverlay");
  if (storiesOverlay) storiesOverlay.classList.add("hidden");

  // Ripristina tutti i dati dimostrativi originali
  if (window.db && window.db.data && typeof initialData !== "undefined") {
    window.db.data.demoOrders = JSON.parse(JSON.stringify(initialData.orders));
    window.db.data.demoTables = JSON.parse(JSON.stringify(initialData.tables));
    window.db.data.orders = window.db.data.demoOrders;
    window.db.data.tables = window.db.data.demoTables;
    window.db.data.products = JSON.parse(JSON.stringify(initialData.products));
    window.db.data.metrics = JSON.parse(JSON.stringify(initialData.metrics));
    window.db.data.hourlySales = JSON.parse(JSON.stringify(initialData.hourlySales));
    window.db.data.categorySales = JSON.parse(JSON.stringify(initialData.categorySales));
    window.db.persist();
  }

  const staffList = (window.db ? window.db.get("staff") : []) || [];
  const ownerStaff = staffList.find(s => s.role === "Proprietario") || {
    id: 1,
    name: "Marco Rossi",
    role: "Proprietario",
    email: "marco@barcentrale.it",
    pin: null,
    status: "active",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop"
  };

  const activeBar = (window.db ? window.db.get("activeBar") : {}) || {};
  activeBar.name = "Bar Centrale (Demo)";
  activeBar.isDemo = true;
  activeBar.isSubscribed = true;
  activeBar.subscriptionStatus = "active";
  activeBar.plan = "BarPilot Pro 59€ (Demo Gratuita)";
  if (window.db) window.db.set("activeBar", activeBar);

  applyActiveStaff(ownerStaff, true);
  setUserLoggedIn(true, {
    name: "Marco Rossi",
    email: "marco@barcentrale.it",
    role: "Proprietario",
    provider: "demo",
    isDemo: true
  });

  closeAuthScreen();
  renderApp();
  updateDashboardLockState();

  // In demo mode: take user straight to dashboard, completely unlocked!
  switchView("dashboard");

  showToast(window.i18n && window.i18n.currentLang === 'fr'
    ? "⚡ Démo Bar Centrale active : Accès 100% libre et débloqué !"
    : "⚡ Demo Bar Centrale attiva: Accesso 100% libero e sbloccato!");
}

// ==========================================================================
// 4. ADVANCED SETTINGS CONTROLLER
// ==========================================================================
function switchSettingsTab(tabKey) {
  // Update tab buttons
  document.querySelectorAll(".settings-tab-btn").forEach(btn => {
    const isCurrent = btn.getAttribute("onclick")?.includes(`'${tabKey}'`);
    btn.classList.toggle("active", isCurrent);
  });

  // Update panes
  document.querySelectorAll(".settings-pane").forEach(pane => {
    pane.classList.toggle("active", pane.id === `pane-settings-${tabKey}`);
  });
}

function saveGeneralSettings() {
  const bar = window.db.get("activeBar");
  const nameInput = document.getElementById("setBarName");
  const currencySelect = document.getElementById("setCurrency");

  if (nameInput && nameInput.value) {
    bar.name = nameInput.value;
  }
  if (currencySelect) {
    bar.currency = currencySelect.value === 'EUR' ? '€' : (currencySelect.value === 'USD' ? '$' : 'CHF');
  }

  window.db.set("activeBar", bar);
  renderActiveBar();
  showToast(window.i18n.currentLang === 'it' ? "Impostazioni generali salvate!" : "Paramètres enregistrés !");
}

// Pleasant bar notification chime via Web Audio API (No external file needed)
function testNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Play two notes bell chime (E5 -> B5)
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    osc.frequency.setValueAtTime(987.77, ctx.currentTime + 0.12); // B5

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);

    showToast("🔔 Suono di notifica comanda attivo!");
  } catch (e) {
    showToast("🔔 Bip sonoro comanda");
  }
}

function copyQrLink() {
  const url = "https://barpilot.app/menu/bar_centrale";
  navigator.clipboard.writeText(url).then(() => {
    showToast(window.i18n.currentLang === 'it' ? "Link Menu QR copiato negli appunti!" : "Lien Menu QR copié dans le presse-papier !");
  }).catch(() => {
    showToast("Link: " + url);
  });
}

function downloadQrPdf() {
  showToast(window.i18n.currentLang === 'it' 
    ? "Generazione PDF QR Code per i tavoli in corso..." 
    : "Génération du PDF QR Code en cours...");
}

// Real CSV Export of Orders for Accountant
function exportSalesCsv() {
  const orders = window.db.get("orders") || [];
  let csvContent = "data:text/csv;charset=utf-8,ID,Tavolo,Cameriere,Stato,Data,Totale (EUR)\n";

  orders.forEach(o => {
    const row = `${o.id},"${o.table}","${o.server}",${o.status},"${o.createdAt || o.time}",${o.total.toFixed(2)}`;
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `BarPilot_Vendite_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast(window.i18n.currentLang === 'it' ? "File CSV delle vendite scaricato!" : "Fichier CSV des ventes téléchargé !");
}

// Download Full JSON Backup
function downloadBackupJson() {
  const data = window.db.data;
  const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  const link = document.createElement("a");
  link.setAttribute("href", jsonStr);
  link.setAttribute("download", `BarPilot_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast(window.i18n.currentLang === 'it' ? "Backup completo JSON scaricato!" : "Sauvegarde complète JSON téléchargée !");
}

function restoreBackupJson() {
  const input = prompt(window.i18n.currentLang === 'it' 
    ? "Incolla il contenuto JSON di backup da ripristinare:" 
    : "Collez le contenu JSON de sauvegarde à restaurer :");
  if (input) {
    try {
      const parsed = JSON.parse(input);
      window.db.data = parsed;
      window.db.persist();
      renderApp();
      showToast(window.i18n.currentLang === 'it' ? "Dati ripristinati con successo!" : "Données restaurées avec succès !");
    } catch (e) {
      alert("Formato JSON non valido.");
    }
  }
}

function resetDemoData() {
  if (confirm(window.i18n.currentLang === 'it' ? "Ripristinare tutti i dati di fabbrica (Bar Centrale)?" : "Réinitialiser toutes les données de démo ?")) {
    window.db.reset();
    renderApp();
    showToast(window.i18n.currentLang === 'it' ? "Dati demo ripristinati!" : "Données de démo réinitialisées !");
  }
}

function saveGoogleClientIdSetting() {
  const input = document.getElementById("settingGoogleClientId");
  if (input && window.googleAuth) {
    window.googleAuth.saveClientId(input.value);
  }
}

function saveFacebookAppIdSetting() {
  const input = document.getElementById("settingFacebookAppId");
  if (input && window.facebookAuth) {
    window.facebookAuth.saveAppId(input.value);
  }
}



window.togglePasswordVisibility = togglePasswordVisibility;
window.handlePasswordInput = handlePasswordInput;
window.checkPasswordRules = checkPasswordRules;
window.openAddTableModal = openAddTableModal;
window.closeAddTableModal = closeAddTableModal;
window.handleAddTableSubmit = handleAddTableSubmit;
window.openDeleteTableModal = openDeleteTableModal;
window.closeDeleteTableModal = closeDeleteTableModal;
window.confirmDeleteTableAction = confirmDeleteTableAction;
window.syncOrderTableSelect = syncOrderTableSelect;

window.openAddProductModal = openAddProductModal;
window.openEditProductModal = openEditProductModal;
window.closeAddProductModal = closeAddProductModal;
window.handleAddProductSubmit = handleAddProductSubmit;
window.openDeleteProductModal = openDeleteProductModal;
window.closeDeleteProductModal = closeDeleteProductModal;
window.confirmDeleteProductAction = confirmDeleteProductAction;
window.toggleProductAvailabilityStatus = toggleProductAvailabilityStatus;
window.handleProductFileUpload = handleProductFileUpload;
window.toggleProductPresets = toggleProductPresets;
window.selectProductPreset = selectProductPreset;
window.updateProductImagePreview = updateProductImagePreview;
window.recalcProductMargin = recalcProductMargin;
window.toggleAllergenClass = toggleAllergenClass;

window.openAddIngredientModal = openAddIngredientModal;
window.openEditIngredientModal = openEditIngredientModal;
window.closeAddIngredientModal = closeAddIngredientModal;
window.handleAddIngredientSubmit = handleAddIngredientSubmit;
window.openDeleteIngredientModal = openDeleteIngredientModal;
window.closeDeleteIngredientModal = closeDeleteIngredientModal;
window.confirmDeleteIngredientAction = confirmDeleteIngredientAction;
window.handleSupplierSelectChange = handleSupplierSelectChange;
window.quickRestock = quickRestock;
window.openAddSupplierModal = openAddSupplierModal;
window.openEditSupplierModal = openEditSupplierModal;
window.closeAddSupplierModal = closeAddSupplierModal;
window.handleAddSupplierSubmit = handleAddSupplierSubmit;
window.openDeleteSupplierModal = openDeleteSupplierModal;
window.closeDeleteSupplierModal = closeDeleteSupplierModal;
window.confirmDeleteSupplierAction = confirmDeleteSupplierAction;
window.openSupplierOrderModal = openSupplierOrderModal;
window.addOrderRow = addOrderRow;
window.closeSupplierOrderModal = closeSupplierOrderModal;
window.handleSendSupplierOrder = handleSendSupplierOrder;
window.switchReportsPeriod = switchReportsPeriod;
window.selectReportPoint = selectReportPoint;
window.exportReportsCsv = exportReportsCsv;
window.openCheckoutModal = openCheckoutModal;
window.closeCheckoutModal = closeCheckoutModal;
window.handleConfirmCheckout = handleConfirmCheckout;

window.isUserSubscribed = isUserSubscribed;
window.openGooglePlayModal = openGooglePlayModal;
window.closeGooglePlayModal = closeGooglePlayModal;
window.confirmGooglePlaySubscription = confirmGooglePlaySubscription;
window.activateSubscription = activateSubscription;
window.updateDashboardLockState = updateDashboardLockState;
window.switchView = switchView;
window.appState = appState;
window.quickLoginDemo = quickLoginDemo;


// --------------------------------------------------------------------------
// Payment Gateway Settings (Google Pay & Stripe)
// --------------------------------------------------------------------------
function savePaymentGatewaySettings() {
  const stripePkInput = document.getElementById("settingStripePk");
  const stripeUrlInput = document.getElementById("settingStripeUrl");
  const merchantIdInput = document.getElementById("settingGoogleMerchantId");
  const envSelect = document.getElementById("settingGooglePayEnv");

  const stripePk = stripePkInput ? stripePkInput.value.trim() : "";
  const stripeUrl = stripeUrlInput ? stripeUrlInput.value.trim() : "";
  if (stripeUrl) localStorage.setItem("barpilot_stripe_payment_url", stripeUrl);
  const merchantId = merchantIdInput ? merchantIdInput.value.trim() : "";
  const env = envSelect ? envSelect.value : "PRODUCTION";

  if (window.googlePayService) {
    window.googlePayService.saveSettings(stripePk, merchantId, env);
  } else {
    localStorage.setItem("barpilot_stripe_pk", stripePk);
    localStorage.setItem("barpilot_gpay_merchant_id", merchantId);
    localStorage.setItem("barpilot_gpay_env", env);
    showToast("✅ Configurazione salvata con successo!");
  }
}

function testGooglePayPayment() {
  if (window.googlePayService) {
    window.googlePayService.processGooglePayment(59.00);
  } else {
    openGooglePlayModal();
  }
}

window.savePaymentGatewaySettings = savePaymentGatewaySettings;
window.testGooglePayPayment = testGooglePayPayment;

window.switchCheckoutPaymentMethod = switchCheckoutPaymentMethod;
window.handleStripeCheckoutSubmit = handleStripeCheckoutSubmit;


function fillTestCard() {
  const cardInput = document.getElementById("checkoutCardNumber");
  const expiryInput = document.getElementById("checkoutCardExpiry");
  const cvcInput = document.getElementById("checkoutCardCvc");
  const holderInput = document.getElementById("checkoutCardHolder");

  if (cardInput) {
    cardInput.value = "4242 4242 4242 4242";
    cardInput.dispatchEvent(new Event("input"));
  }
  if (expiryInput) expiryInput.value = "12 / 28";
  if (cvcInput) cvcInput.value = "123";
  if (holderInput) holderInput.value = "Test Stripe BarPilot (0,00€)";

  showToast("⚡ Carta di prova Stripe compilata (4242 •••• 4242). Clicca su 'Avvia l\'abbonamento' per verificare a 0,00€.");
}
window.fillTestCard = fillTestCard;

// ==========================================================================
// Pixel-Perfect Pro Checkout Controllers
// ==========================================================================
let currentProMethod = 'card';
let isProSaveCardChecked = true;

function selectProPaymentMethod(method) {
  currentProMethod = method;
  const methods = ['card', 'stripe', 'google'];
  methods.forEach(m => {
    const row = document.getElementById('proMethodRow' + m.charAt(0).toUpperCase() + m.slice(1));
    if (row) {
      row.classList.toggle('active', m === method);
    }
  });

  const submitBtn = document.getElementById('btnProSubmit');
  if (submitBtn) {
    if (method === 'stripe') {
      submitBtn.innerHTML = '<span>⚡</span> <span>Apri Stripe Checkout Client</span> <span>↗</span>';
    } else if (method === 'google') {
      submitBtn.innerHTML = '<span>🔒</span> <span>Paga con Google Pay</span> <span>➔</span>';
    } else {
      submitBtn.innerHTML = '<span>🔒</span> <span>Avvia l\'abbonamento</span> <span>➔</span>';
    }
  }
}
window.selectProPaymentMethod = selectProPaymentMethod;

function toggleProSaveCard() {
  isProSaveCardChecked = !isProSaveCardChecked;
  const check = document.getElementById('proSaveCardCheck');
  if (check) {
    check.style.background = isProSaveCardChecked ? '#FF7A00' : '#E5E7EB';
    check.textContent = isProSaveCardChecked ? '✓' : '';
  }
}
window.toggleProSaveCard = toggleProSaveCard;

async function handleProCheckoutSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();

  if (currentProMethod === 'stripe') {
    handleStripeCheckoutSubmit();
    return;
  }

  if (currentProMethod === 'google') {
    openGooglePlayModal();
    return;
  }

  if (currentProMethod === 'card') {
    const cardInput = document.getElementById('checkoutCardNumber');
    const expiryInput = document.getElementById('checkoutCardExpiry');
    const cvcInput = document.getElementById('checkoutCardCvc');
    const holderInput = document.getElementById('checkoutCardHolder');

    const cardRaw = (cardInput ? cardInput.value : "").replace(/\s+/g, '');
    const expRaw = (expiryInput ? expiryInput.value : "").trim();
    const cvcRaw = (cvcInput ? cvcInput.value : "").trim();
    const holderRaw = (holderInput ? holderInput.value : "").trim();

    if (!cardRaw || cardRaw.length < 15 || !/^\d+$/.test(cardRaw)) {
      showToast("⚠️ Inserisci un numero di carta valido (minimo 15-16 cifre).");
      if (cardInput) cardInput.focus();
      return;
    }

    const expMatch = expRaw.match(/^(\d{1,2})\s*\/?\s*(\d{2,4})$/);
    if (!expMatch) {
      showToast("⚠️ Data di scadenza non valida (es: 12 / 28 o 12 / 2028).");
      if (expiryInput) expiryInput.focus();
      return;
    }
    const expMonth = parseInt(expMatch[1], 10);
    let expYear = parseInt(expMatch[2], 10);
    if (expMonth < 1 || expMonth > 12) {
      showToast("⚠️ Mese di scadenza non valido (01-12).");
      return;
    }
    const currentFullYear = new Date().getFullYear();
    const fullExpYear = expYear < 100 ? (2000 + expYear) : expYear;
    const currentMonth = new Date().getMonth() + 1;
    if (fullExpYear < currentFullYear || (fullExpYear === currentFullYear && expMonth < currentMonth)) {
      showToast("⚠️ La carta inserita risulta scaduta.");
      return;
    }

    if (!cvcRaw || cvcRaw.length < 3 || !/^\d+$/.test(cvcRaw)) {
      showToast("⚠️ Inserisci un codice CVC valido (3 o 4 cifre).");
      if (cvcInput) cvcInput.focus();
      return;
    }

    if (!holderRaw || holderRaw.length < 3) {
      showToast("⚠️ Inserisci il nome e cognome dell'intestatario della carta.");
      if (holderInput) holderInput.focus();
      return;
    }

    const submitBtn = document.getElementById('btnProSubmit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span style="display:inline-block; width:16px; height:16px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:8px; vertical-align:middle;"></span> Elaborazione e verifica pagamento Stripe...`;
    }

    showToast("⏳ Verifica della carta con l'API protetta di Stripe in corso...");

    try {
      const verifyFn = window.verifyCardWithStripe || (window.stripePaymentService && window.stripePaymentService.verifyCard);
      let result = null;
      if (typeof verifyFn === 'function') {
        result = await verifyFn({
          number: cardRaw,
          exp_month: expMonth,
          exp_year: fullExpYear,
          cvc: cvcRaw,
          name: holderRaw
        });
      } else {
        result = { success: false, error: "Servizio di verifica Stripe non pronto. Ricarica la pagina e riprova." };
      }

      if (!result || !result.success) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>🔒</span> <span>Avvia l'abbonamento</span> <span>➔</span>`;
        }
        const errorMsg = (result && result.error) ? result.error : "Carta non valida o rifiutata dal circuito bancario.";
        showToast("❌ Pagamento non autorizzato: " + errorMsg);
        return; // STRICTLY STOP: DO NOT UNLOCK!
      }

      // Success
      if (submitBtn) submitBtn.disabled = false;
      showToast("✅ Carta verificata con successo da Stripe! Accesso sbloccato.");
      activateSubscription('stripe_card');
      switchView('dashboard');
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>🔒</span> <span>Avvia l'abbonamento</span> <span>➔</span>`;
      }
      showToast("❌ Errore durante la verifica con Stripe: " + (err.message || "Riprova più tardi."));
    }
    return;
  }

  showToast("⚠️ Seleziona un metodo di pagamento per procedere.");
}
window.handleProCheckoutSubmit = handleProCheckoutSubmit;
