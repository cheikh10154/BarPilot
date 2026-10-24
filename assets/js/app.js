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

  // 3. Render Initial State
  renderApp();

  // Initialize Active Staff Member
  initActiveStaff();

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
  const sidebarUserName = document.getElementById("sidebarUserName") || document.querySelector(".user-profile-card .user-name");

  if (barNameEl) barNameEl.textContent = bar.name;
  if (barSwitcherText) barSwitcherText.textContent = bar.name;
  if (sidebarUserName) sidebarUserName.textContent = bar.managerName;
  if (trialDaysEl) trialDaysEl.textContent = bar.trialDaysRemaining;

  // Refresh greeting dynamically with manager name
  updateGreeting(bar.managerName);
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
  const tables = window.db.get("tables");
  const roomCanvas = document.getElementById("floorRoomCanvas");
  if (!roomCanvas) return;

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

    return `
      <div class="table-node ${statusClass}" onclick="handleTableClick('${t.id}')">
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
  const products = window.db.get("products");
  const tbody = document.getElementById("productsTableBody");
  if (!tbody) return;

  tbody.innerHTML = products.map(p => `
    <tr>
      <td>
        <div class="product-row-flex">
          <img src="${p.image}" class="product-thumb-sm" alt="${p.name}">
          <div>
            <div style="font-weight:700;">${p.name}</div>
            <div style="font-size:11px; color:var(--text-muted); text-transform:capitalize;">${p.category}</div>
          </div>
        </div>
      </td>
      <td style="font-weight:700;">${p.price.toFixed(2)} €</td>
      <td style="color:var(--text-muted);">${p.cost.toFixed(2)} €</td>
      <td style="font-weight:700; color:var(--status-free);">${((1 - (p.cost / p.price)) * 100).toFixed(0)}%</td>
      <td><span class="table-badge badge-served">${window.i18n.t("statusActive")}</span></td>
      <td>
        <button class="ctrl-btn" onclick="alert('Modifica ${p.name}')">${window.i18n.t("edit")}</button>
      </td>
    </tr>
  `).join("");
}

function renderInventory() {
  const inv = window.db.get("inventory");
  const tbody = document.getElementById("inventoryTableBody");
  if (!tbody) return;

  tbody.innerHTML = inv.map(i => {
    const isAlert = i.qty <= i.reorderLevel;
    return `
      <tr>
        <td style="font-weight:700;">${i.name}</td>
        <td style="font-weight:800; font-size:14px; color:${isAlert ? 'var(--status-alert)' : 'var(--text-main)'};">
          ${i.qty} ${i.unit}
        </td>
        <td style="color:var(--text-muted);">${i.reorderLevel} ${i.unit}</td>
        <td>
          <span class="table-badge ${isAlert ? 'badge-alert' : 'badge-ok'}">
            ${isAlert ? window.i18n.t("statusAlert") : window.i18n.t("statusOk")}
          </span>
        </td>
        <td style="color:var(--text-muted); font-size:12px;">${i.supplier}</td>
        <td>
          <button class="ctrl-btn" onclick="quickRestock(${i.id})">+ Rifornisci</button>
        </td>
      </tr>
    `;
  }).join("");
}

function quickRestock(ingId) {
  const inv = window.db.get("inventory");
  const item = inv.find(i => i.id === ingId);
  if (item) {
    item.qty = parseFloat((item.qty + (item.unit === 'bott.' || item.unit === 'pz' ? 5 : 2)).toFixed(2));
    if (item.qty > item.reorderLevel) item.status = "ok";
    window.db.set("inventory", inv);
    renderInventory();
    showToast(`Giacenza aggiornata per ${item.name}!`);
  }
}

// --------------------------------------------------------------------------
// Suppliers & Staff
// --------------------------------------------------------------------------
function renderSuppliers() {
  const sup = window.db.get("suppliers");
  const list = document.getElementById("suppliersListWrap");
  if (!list) return;

  list.innerHTML = sup.map(s => `
    <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h4 style="font-weight:800; font-size:15px;">${s.name}</h4>
        <p style="font-size:12px; color:var(--text-muted);">${s.category}</p>
        <p style="font-size:12px; color:var(--primary); margin-top:4px;">📞 ${s.phone} · ✉️ ${s.email}</p>
      </div>
      <button class="btn-secondary" style="padding:8px 14px; font-size:12px;" onclick="alert('Ordine inviato a ${s.name}')">Nuovo ordine</button>
    </div>
  `).join("");
}

// ==========================================================================
// ROLE-BASED ACCESS CONTROL (PROPRIETARIO, CAMERIERE, BARMAN, MANAGER)
// ==========================================================================
const ROLE_PERMISSIONS = {
  Proprietario: {
    views: ["dashboard", "orders", "floor", "kds", "products", "inventory", "suppliers", "staff", "reports", "subscriptions", "settings"],
    canAddProducts: true,
    canEditStaff: true,
    defaultView: "dashboard",
    badgeClass: "badge-role-owner"
  },
  Manager: {
    views: ["dashboard", "orders", "floor", "kds", "products", "inventory", "suppliers", "staff", "reports"],
    canAddProducts: true,
    canEditStaff: false,
    defaultView: "dashboard",
    badgeClass: "badge-role-manager"
  },
  Cameriere: {
    views: ["orders", "floor", "kds"],
    canAddProducts: false,
    canEditStaff: false,
    defaultView: "orders",
    badgeClass: "badge-role-waiter"
  },
  Barman: {
    views: ["kds", "products", "orders"],
    canAddProducts: false,
    canEditStaff: false,
    defaultView: "kds",
    badgeClass: "badge-role-barman"
  },
  Cassa: {
    views: ["orders", "floor", "dashboard"],
    canAddProducts: false,
    canEditStaff: false,
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
      const found = staffList.find(s => s.id === parsed.id || s.name === parsed.name);
      if (found) {
        applyActiveStaff(found, false);
        return;
      }
    } catch (e) {}
  }

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

  // 5. If current view is not allowed for this role, automatically switch
  if (doSwitchView && !perms.views.includes(appState.activeView)) {
    switchView(perms.defaultView);
  }

  // Re-render staff table so active badge reflects current staff
  renderStaff();
}

function renderStaff() {
  const staff = (window.db ? window.db.get("staff") : []) || [];
  const tbody = document.getElementById("staffTableBody");
  if (!tbody) return;

  tbody.innerHTML = staff.map(s => {
    const isCurrentActive = currentStaff && currentStaff.id === s.id;
    let roleBadgeClass = "badge-role-waiter";
    if (s.role === "Proprietario") roleBadgeClass = "badge-role-owner";
    else if (s.role === "Manager") roleBadgeClass = "badge-role-manager";
    else if (s.role === "Barman") roleBadgeClass = "badge-role-barman";
    else if (s.role === "Cassa") roleBadgeClass = "badge-role-cashier";

    return `
    <tr style="${isCurrentActive ? 'background: rgba(255, 122, 0, 0.08);' : ''}">
      <td>
        <div class="product-row-flex">
          <img src="${s.avatar}" class="product-thumb-sm" style="border-radius:50%;" alt="${s.name}">
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
        <code style="background:var(--bg-card-secondary); padding:3px 8px; border-radius:6px; font-weight:700; letter-spacing:2px; font-size:12px;">${s.pin || '1234'}</code>
      </td>
      <td>
        <span class="table-badge ${s.status === 'active' ? 'badge-served' : 'badge-alert'}">
          ${s.status === 'active' ? window.i18n.t("statusActive") : window.i18n.t("statusInactive")}
        </span>
      </td>
      <td>
        <button class="ctrl-btn" onclick="openStaffPinModal(${s.id})" title="Accedi con il PIN di questo dipendente">
          🔑 Accedi con PIN
        </button>
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
  if (staffList.length === 0) return;

  if (staffId) {
    selectedPinStaff = staffList.find(s => s.id === staffId) || staffList[0];
  } else if (currentStaff) {
    selectedPinStaff = staffList.find(s => s.id === currentStaff.id) || staffList[0];
  } else {
    selectedPinStaff = staffList[0];
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
  row.innerHTML = staffList.map(s => {
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
  if (demoHint) demoHint.textContent = `PIN: ${selectedPinStaff.pin || '1234'}`;
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
function openAddProductModal() {
  if (currentStaff && currentStaff.role !== "Proprietario" && currentStaff.role !== "Manager") {
    showToast("⚠️ Solo il Proprietario può aggiungere nuovi prodotti al bar.");
    return;
  }
  const modal = document.getElementById("addProductModal");
  if (modal) modal.classList.add("active");
}

function closeAddProductModal() {
  const modal = document.getElementById("addProductModal");
  if (modal) modal.classList.remove("active");
}

function handleAddProductSubmit(e) {
  e.preventDefault();
  if (currentStaff && currentStaff.role !== "Proprietario" && currentStaff.role !== "Manager") {
    showToast("⚠️ Solo il Proprietario può aggiungere nuovi prodotti al bar.");
    return;
  }

  const name = document.getElementById("newProdName")?.value.trim();
  const category = document.getElementById("newProdCategory")?.value || "cocktails";
  const price = parseFloat(document.getElementById("newProdPrice")?.value) || 5.00;
  const cost = parseFloat(document.getElementById("newProdCost")?.value) || 1.20;
  const image = document.getElementById("newProdImage")?.value || "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&h=300&fit=crop";

  if (!name) return;

  const products = window.db.get("products") || [];
  const newProduct = {
    id: Date.now(),
    name: name,
    category: category,
    price: price,
    cost: cost,
    image: image
  };

  products.push(newProduct);
  window.db.set("products", products);

  renderProducts();
  renderOrderCatalog();
  closeAddProductModal();

  document.getElementById("addProductForm")?.reset();
  showToast(`✨ Prodotto "${name}" aggiunto al catalogo dal Proprietario!`);
}

function openAddStaffModal() {
  if (currentStaff && currentStaff.role !== "Proprietario") {
    showToast("⚠️ Solo il Proprietario può invitare nuovi membri del personale.");
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
    showToast("⚠️ Solo il Proprietario può invitare nuovi membri del personale.");
    return;
  }

  const name = document.getElementById("newStaffName")?.value.trim();
  const role = document.getElementById("newStaffRole")?.value || "Cameriere";
  const email = document.getElementById("newStaffEmail")?.value.trim();
  const pin = document.getElementById("newStaffPin")?.value.trim() || "1234";

  if (!name || !email) return;

  const defaultAvatars = {
    Proprietario: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
    Manager: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop",
    Cameriere: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop",
    Barman: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop"
  };

  const staff = window.db.get("staff") || [];
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
  window.db.set("staff", staff);

  renderStaff();
  closeAddStaffModal();
  document.getElementById("addStaffForm")?.reset();
  showToast(`👥 ${name} aggiunto al personale come ${role} (PIN: ${pin})!`);
}

// Global Exports
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
    localStorage.setItem("barpilot_is_logged_in", "false");
    document.cookie = "barpilot_auth=false; path=/; max-age=0; SameSite=Lax";
    document.documentElement.classList.remove("user-authenticated");
    localStorage.removeItem("barpilot_logged_user");
  }
}

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
  setUserLoggedIn(false);
  
  // Close sidebar if open
  closeSidebar();
  
  // Open authentication screen
  openAuthScreen();

  const isIt = !window.i18n || window.i18n.currentLang === "it";
  showToast(isIt
    ? "Disconnessione effettuata. A presto!"
    : "Déconnexion réussie. À bientôt !");
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
        password: "password123",
        name: "Marco Rossi",
        barName: "Bar Centrale",
        city: "Roma",
        role: "Proprietario"
      }
    ];
    window.db.set("users", dbUsers);
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

function switchAuthTab(tab) {
  currentAuthTab = tab;
  hideAuthError();
  const btnLogin = document.getElementById("tabBtnLogin");
  const btnRegister = document.getElementById("tabBtnRegister");
  const extraFieldsEmail = document.getElementById("registerExtraFields");
  const submitBtnEmail = document.getElementById("authSubmitBtn");

  if (btnLogin && btnRegister) {
    btnLogin.classList.toggle("active", tab === 'login');
    btnRegister.classList.toggle("active", tab === 'register');
  }

  const isRegister = (tab === 'register');
  if (extraFieldsEmail) {
    extraFieldsEmail.style.display = 'block';
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
  const email = (document.getElementById("authEmail")?.value || "marco@barcentrale.it").trim().toLowerCase();
  const password = (document.getElementById("authPassword")?.value || "").trim();

  if (currentAuthTab === 'register') {
    const barName = document.getElementById("regBarName")?.value.trim() || "Il Mio Nuovo Bar";
    const ownerName = document.getElementById("regOwnerName")?.value.trim() || "Marco";
    const city = document.getElementById("regCity")?.value.trim() || "Roma";

    const activeBar = {
      id: "bar_" + Date.now(),
      name: barName,
      city: city,
      address: `Via Principale, 1 - ${city}`,
      currency: "€",
      role: "Proprietario",
      managerName: ownerName,
      managerEmail: email,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      plan: "Pro",
      trialDaysRemaining: 14,
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    };

    const bars = window.db.get("barsList") || [];
    bars.push({ id: activeBar.id, name: activeBar.name, city: activeBar.city, address: activeBar.address });

    window.db.set("activeBar", activeBar);
    window.db.set("barsList", bars);

    // Save user in database
    saveUserToDatabase({
      id: "usr_" + Date.now(),
      type: "email",
      email: email,
      password: password,
      name: ownerName,
      barName: barName,
      city: city,
      date: new Date().toISOString()
    });

    // Update owner in staff table
    const staffList = window.db.get("staff") || [];
    const ownerStaff = staffList.find(s => s.role === "Proprietario");
    if (ownerStaff) {
      ownerStaff.name = ownerName;
      ownerStaff.email = email;
      window.db.set("staff", staffList);
      if (currentStaff && currentStaff.role === "Proprietario") {
        currentStaff.name = ownerName;
      }
    }

    hideAuthError();
    setUserLoggedIn(true, { name: ownerName, email: email, barName: barName, provider: "email" });
    closeAuthScreen();
    renderApp();

    showToast(window.i18n.currentLang === 'it'
      ? `🎉 Bar "${barName}" registrato! Benvenuto ${ownerName}, 14 giorni di prova gratuita attivati.`
      : `🎉 Bar "${barName}" enregistré ! Bienvenue ${ownerName}, 14 jours d'essai gratuit activés.`);
  } else {
    // Handle Email Login: Check database credentials!
    const barNameInput = (document.getElementById("regBarName")?.value || "").trim();
    const ownerNameInput = (document.getElementById("regOwnerName")?.value || "").trim();
    const cityInput = (document.getElementById("regCity")?.value || "").trim();

    const users = getDatabaseUsers();
    const userFound = users.find(u => u.type === 'email' && u.email && u.email.toLowerCase().trim() === email);

    if (!userFound || (userFound.password && userFound.password !== password)) {
      showAuthError("Le credenziali fornite non corrispondono a quelle presenti nei nostri archivi.");
      return;
    }

    hideAuthError();
    const ownerName = ownerNameInput || userFound.name || "Marco Rossi";
    const barName = barNameInput || userFound.barName || "Bar Centrale";
    const city = cityInput || userFound.city || "Roma";

    const bar = window.db.get("activeBar");
    bar.name = barName;
    bar.city = city;
    bar.managerName = ownerName;
    bar.managerEmail = email;
    window.db.set("activeBar", bar);

    // Update staff owner profile
    const staffList = window.db.get("staff") || [];
    const ownerStaff = staffList.find(s => s.role === "Proprietario");
    if (ownerStaff) {
      ownerStaff.name = ownerName;
      ownerStaff.email = email;
      window.db.set("staff", staffList);
      if (currentStaff && currentStaff.role === "Proprietario") {
        currentStaff.name = ownerName;
      }
    }

    setUserLoggedIn(true, { name: ownerName, email: email, barName: barName, provider: "email" });
    closeAuthScreen();
    renderApp();

    showToast(window.i18n.currentLang === 'it'
      ? `✅ Accesso effettuato a ${barName}!`
      : `✅ Connexion réussie à ${barName} !`);
  }
}

function quickLoginDemo() {
  hideAuthError();
  setUserLoggedIn(true, { name: "Marco Rossi", email: "marco@barcentrale.it", provider: "demo" });
  closeAuthScreen();
  showToast(window.i18n.currentLang === 'it'
    ? "Benvenuto in Bar Centrale (Demo 14 giorni attiva)!"
    : "Bienvenue sur Bar Centrale (Démo 14 jours active) !");
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


