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

  // 5. Trigger 3-Second Splash Animation
  initSplashScreen();
});

// App State
let appState = {
  activeView: "dashboard",
  cart: [
    { id: 2, name: "Cappuccino", qty: 2, price: 2.80 },
    { id: 1, name: "Espresso", qty: 1, price: 1.50 },
    { id: 9, name: "Croissant burro", qty: 1, price: 1.80 }
  ],
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

function switchView(viewName) {
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
function renderDashboard() {
  const metrics = window.db.get("metrics");
  const hourly = window.db.get("hourlySales");
  const orders = window.db.get("orders");
  const products = window.db.get("products");

  // Fill KPI
  document.getElementById("metricRevenue").textContent = `${metrics.revenue.toLocaleString()} €`;
  document.getElementById("metricOrders").textContent = metrics.ordersCount;
  document.getElementById("metricAvgTicket").textContent = `${metrics.avgTicket.toFixed(2)} €`;
  document.getElementById("metricAlerts").textContent = metrics.alertCount;

  // Render Hourly Bar Chart
  const barsWrap = document.getElementById("hourlyBarsWrap");
  if (barsWrap) {
    const maxVal = Math.max(...hourly.map(h => h.val));
    barsWrap.innerHTML = hourly.map(item => {
      const heightPercent = (item.val / maxVal) * 100;
      return `
        <div class="bar-col">
          <div class="bar-fill" style="height: ${heightPercent}%">
            <span class="bar-tooltip">${item.val} €</span>
          </div>
          <span class="bar-label">${item.hour}</span>
        </div>
      `;
    }).join("");
  }

  // Render Recent Orders Table
  const recentOrdersTbody = document.getElementById("recentOrdersTableBody");
  if (recentOrdersTbody) {
    recentOrdersTbody.innerHTML = orders.slice(0, 5).map(ord => {
      const itemsSummary = ord.items.map(it => `${it.qty} ${it.name.toLowerCase()}`).join(", ");
      let badgeClass = "badge-prep";
      let statusKey = "statusPrep";
      if (ord.status === "ready") { badgeClass = "badge-ready"; statusKey = "statusReady"; }
      if (ord.status === "served") { badgeClass = "badge-served"; statusKey = "statusServed"; }

      return `
        <tr>
          <td style="font-weight:700; color:var(--primary);">#${ord.id}</td>
          <td style="font-weight:600;">${ord.table}</td>
          <td style="color:var(--text-muted); max-width:240px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${itemsSummary}</td>
          <td style="font-weight:700;">${ord.total.toFixed(2)} €</td>
          <td><span class="table-badge ${badgeClass}">${window.i18n.t(statusKey)}</span></td>
          <td style="color:var(--text-muted); font-size:12px;">${ord.time}</td>
        </tr>
      `;
    }).join("");
  }

  // Render Best Selling Products
  const bestSellersTbody = document.getElementById("bestSellersTableBody");
  if (bestSellersTbody) {
    const sorted = [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 5);
    bestSellersTbody.innerHTML = sorted.map((p, idx) => {
      const totalRev = (p.price * p.salesCount).toFixed(2);
      return `
        <tr>
          <td style="font-weight:700; color:var(--text-muted); width:28px;">${idx + 1}</td>
          <td>
            <div class="product-row-flex">
              <img src="${p.image}" class="product-thumb-sm" alt="${p.name}">
              <span style="font-weight:600;">${p.name}</span>
            </div>
          </td>
          <td style="text-align:center; font-weight:600;">${p.salesCount}</td>
          <td style="text-align:right; font-weight:700; color:var(--primary);">${totalRev} €</td>
        </tr>
      `;
    }).join("");
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
      price: product.price
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

      const orders = window.db.get("orders");
      const newId = 1045 + Math.floor(Math.random() * 900);
      const total = appState.cart.reduce((sum, it) => sum + (it.qty * it.price), 0);

      const newOrder = {
        id: newId,
        table: appState.selectedTable,
        area: "interno",
        server: window.db.get("activeBar").managerName,
        status: "prep",
        time: "1 min",
        createdAt: new Date().toISOString(),
        items: [...appState.cart],
        total: total
      };

      orders.unshift(newOrder);
      window.db.set("orders", orders);

      // Deduct ingredients automatically
      deductStockForOrder(newOrder);

      // Clear cart
      appState.cart = [];
      renderCart();
      renderDashboard();
      renderKDS();
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
  const orders = window.db.get("orders");
  const ord = orders.find(o => o.id === orderId);
  if (ord) {
    ord.status = newStatus;
    window.db.set("orders", orders);
    renderKDS();
    renderDashboard();
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
// Reports & Analytics
// --------------------------------------------------------------------------
function renderReports() {
  // Dynamic 30-day date range (Current Date - 30 days)
  const reportsDateEl = document.getElementById("reportsDateRangeText");
  if (reportsDateEl) {
    const now = new Date();
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const pad = n => String(n).padStart(2, '0');
    const dNow = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    const dPast = `${pad(past.getDate())}/${pad(past.getMonth() + 1)}/${past.getFullYear()}`;
    const label = window.i18n ? window.i18n.t("last30Days") : "Ultimi 30 giorni";
    reportsDateEl.textContent = `${dPast} - ${dNow} · ${label}`;
  }

  // SVG Area / Line Chart
  const svgCurve = document.getElementById("reportsCurveSvg");
  if (svgCurve) {
    const points = [
      { x: 50, y: 150 },
      { x: 120, y: 110 },
      { x: 190, y: 130 },
      { x: 260, y: 60 },
      { x: 330, y: 90 },
      { x: 400, y: 40 },
      { x: 470, y: 20 }
    ];

    const dPath = `M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`;
    svgCurve.innerHTML = `
      <defs>
        <linearGradient id="gradCurve" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FF7A00" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#FF7A00" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <path d="${dPath} L 470,180 L 50,180 Z" fill="url(#gradCurve)" />
      <path d="${dPath}" fill="none" stroke="#FF7A00" stroke-width="3" stroke-linecap="round"/>
      ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#FF7A00" stroke="#FFFFFF" stroke-width="2"/>`).join("")}
    `;
  }
}

// --------------------------------------------------------------------------
// Subscriptions & Simulator
// --------------------------------------------------------------------------
function renderPlans() {
  const plans = window.db.get("plans");
  const grid = document.getElementById("plansGridWrap");
  if (!grid) return;

  grid.innerHTML = plans.map(p => `
    <div class="plan-card ${p.popular ? 'popular' : ''}">
      ${p.popular ? `<span class="plan-popular-pill">${window.i18n.t("planProBadge")}</span>` : ''}
      <h3 class="plan-name">${p.name}</h3>
      <p class="plan-desc">${p.name === 'Starter' ? window.i18n.t('planStarterDesc') : (p.name === 'Pro' ? window.i18n.t('planProDesc') : window.i18n.t('planPremiumDesc'))}</p>
      <div class="plan-price-wrap">
        <span class="plan-price">${p.price} €</span>
        <span class="plan-period">${window.i18n.t("perMonthBar")}</span>
      </div>
      <ul class="plan-features-list">
        ${p.features.map(f => `
          <li class="plan-feature-item">
            <span class="feature-check-icon">✓</span>
            <span>${f}</span>
          </li>
        `).join("")}
      </ul>
      <button class="${p.popular ? 'btn-primary' : 'btn-secondary'}" onclick="selectPlan('${p.name}')">
        ${p.name === 'Pro' ? window.i18n.t("currentPlan") : window.i18n.t("choosePlanBtn")}
      </button>
    </div>
  `).join("");
}

function selectPlan(planName) {
  const bar = window.db.get("activeBar");
  bar.plan = planName;
  window.db.set("activeBar", bar);
  renderPlans();
  showToast(window.i18n.currentLang === "it" 
    ? `Piano ${planName} selezionato con successo!` 
    : `Forfait ${planName} sélectionné avec succès !`);
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
    const regPin = document.getElementById("regPin");
    if (regPin) regPin.value = "";

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

  // CHECK PERSISTENT SESSION:
  // If the user is already authenticated, keep stories and auth screen HIDDEN!
  if (isUserLoggedIn()) {
    if (storiesOverlay) storiesOverlay.classList.add("hidden");
    if (authOverlay) authOverlay.classList.add("hidden");

    const dismissSplash = () => {
      if (splashTimer) clearTimeout(splashTimer);
      splash.classList.add("hidden");
    };

    if (skipBtn) {
      skipBtn.addEventListener("click", dismissSplash);
    }

    // Smooth 1.2s transition directly to dashboard
    splashTimer = setTimeout(() => {
      dismissSplash();
    }, 1200);
    return;
  }

  // FIRST-TIME OR LOGGED OUT USER:
  // Launch standard onboarding: Splash (3s) -> Stories -> Auth Screen
  const dismissSplash = () => {
    if (splashTimer) clearTimeout(splashTimer);
    splash.classList.add("hidden");
    // Launch stories onboarding
    initStoriesOnboarding();
  };

  if (skipBtn) {
    skipBtn.addEventListener("click", dismissSplash);
  }

  // Exactly 3 seconds splash duration
  splashTimer = setTimeout(() => {
    dismissSplash();
  }, 3000);
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
  const authOverlay = document.getElementById("authOverlay");
  if (authOverlay) authOverlay.classList.remove("hidden");
  hideAuthError();
  switchAuthTab(currentAuthTab);
}

function closeAuthScreen() {
  const authOverlay = document.getElementById("authOverlay");
  if (authOverlay) authOverlay.classList.add("hidden");
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
      ? (window.i18n ? window.i18n.t("submitEmailRegister") : "🚀 Crea Bar e attiva 14 giorni gratis")
      : (window.i18n ? window.i18n.t("submitEmailLogin") : "Accedi al gestionale");
  }
}

// Social Login Simulation (Google & Facebook)
function handleSocialLogin(provider) {
  const userGreeting = document.getElementById("userGreetingName");
  const bar = window.db.get("activeBar");
  bar.managerName = `Marco Rossi (${provider})`;
  window.db.set("activeBar", bar);

  if (userGreeting) userGreeting.textContent = "Marco";
  renderActiveBar();

  setUserLoggedIn(true, { name: "Marco Rossi", provider: provider });
  closeAuthScreen();
  showToast(window.i18n.currentLang === 'it' 
    ? `Accesso effettuato con successo tramite ${provider}!` 
    : `Connexion réussie via ${provider} !`);
}

function handleAuthSubmit(e) {
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
    const barName = document.getElementById("regBarName")?.value.trim() || "Il Mio Nuovo Bar";
    const ownerName = document.getElementById("regOwnerName")?.value.trim() || "Marco";
    const city = document.getElementById("regCity")?.value.trim() || "Roma";
    const phone = document.getElementById("regPhone")?.value.trim() || "+39 333 987 6543";
    const regPin = (document.getElementById("regPin")?.value || "1234").trim().slice(0, 4);

    const activeBar = {
      id: "bar_" + Date.now(),
      name: barName,
      city: city,
      address: `Via Principale, 1 - ${city}`,
      currency: "€",
      role: "Proprietario",
      managerName: ownerName,
      managerEmail: email,
      managerPhone: phone,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      plan: "Pro",
      trialDaysRemaining: 14,
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    };

    const bars = window.db.get("barsList") || [];
    bars.push({ id: activeBar.id, name: activeBar.name, city: activeBar.city, address: activeBar.address });

    window.db.set("activeBar", activeBar);
    window.db.set("barsList", bars);

    // Save user in database (Owner uses password, has no PIN)
    saveUserToDatabase({
      id: "usr_" + Date.now(),
      type: "email",
      email: email,
      phone: phone,
      password: credential,
      pin: null,
      role: "Proprietario",
      name: ownerName,
      barName: barName,
      city: city,
      date: new Date().toISOString()
    });

    // Update owner in staff table (Owner has no PIN on dashboard)
    const staffList = window.db.get("staff") || [];
    const ownerStaff = staffList.find(s => s.role === "Proprietario");
    if (ownerStaff) {
      ownerStaff.name = ownerName;
      ownerStaff.email = email;
      ownerStaff.phone = phone;
      ownerStaff.pin = null;
      window.db.set("staff", staffList);
      if (currentStaff && currentStaff.role === "Proprietario") {
        currentStaff.name = ownerName;
        currentStaff.pin = null;
      }
    }

    hideAuthError();
    setUserLoggedIn(true, { name: ownerName, email: email, phone: phone, barName: barName, provider: "email" });
    closeAuthScreen();
    renderApp();

    showToast(window.i18n.currentLang === 'it'
      ? `🎉 Bar "${barName}" registrato! Benvenuto ${ownerName}, 14 giorni di prova gratuita attivati.`
      : `🎉 Bar "${barName}" enregistré ! Bienvenue ${ownerName}, 14 jours d'essai gratuit activés.`);
  } else {
    // Handle Email Login: Check credentials depending on choice (Password vs PIN)
    if (currentCredMode === 'pin' && credential.length > 4) {
      showAuthError(window.i18n.currentLang === 'it'
        ? "Il PIN veloce deve essere di 4 cifre massimo."
        : "Le code PIN doit comporter 4 chiffres maximum.");
      return;
    }

    const users = getDatabaseUsers();
    let userFound = users.find(u => u.type === 'email' && u.email && u.email.toLowerCase().trim() === email);

    // Also check staff table
    const staffList = window.db.get("staff") || [];
    const staffFound = staffList.find(s => s.email && s.email.toLowerCase().trim() === email);

    if (currentCredMode === 'pin') {
      const isOwner = (userFound && (userFound.role === 'Proprietario' || userFound.email === 'marco@barcentrale.it')) ||
                      (staffFound && staffFound.role === 'Proprietario');
      if (isOwner) {
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
      // Validate Standard Password
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
    }

    if (!isValid || !userFound) {
      showAuthError("Le credenziali fornite non corrispondono a quelle presenti nei nostri archivi.");
      return;
    }

    hideAuthError();

    const activeBar = window.db.get("activeBar") || { name: "Bar Centrale", city: "Roma" };
    let matchedStaff = staffList.find(s => s.email && s.email.toLowerCase().trim() === email) || staffFound;
    const role = (matchedStaff && matchedStaff.role) || (userFound && userFound.role) || (email === "marco@barcentrale.it" ? "Proprietario" : "Cameriere");
    const personName = (matchedStaff && matchedStaff.name) || (userFound && userFound.name) || (email === "marco@barcentrale.it" ? "Marco Rossi" : "Operatore");
    const isOwner = role === "Proprietario";

    if (isOwner) {
      activeBar.managerName = personName;
      activeBar.managerEmail = email;
      window.db.set("activeBar", activeBar);

      let ownerStaff = staffList.find(s => s.role === "Proprietario");
      if (ownerStaff) {
        ownerStaff.name = personName;
        ownerStaff.email = email;
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
      provider: "email"
    });

    closeAuthScreen();
    renderApp();

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
  applyActiveStaff(ownerStaff, true);
  setUserLoggedIn(true, { name: "Marco Rossi", email: "marco@barcentrale.it", role: "Proprietario", provider: "demo" });
  closeAuthScreen();
  renderApp();
  showToast(window.i18n.currentLang === 'it'
    ? "Benvenuto in Bar Centrale (Accesso Proprietario Demo)!"
    : "Bienvenue sur Bar Centrale (Accès Propriétaire Démo) !");
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
