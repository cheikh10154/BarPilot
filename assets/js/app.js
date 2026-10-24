// BarPilot Core Application Logic
document.addEventListener("DOMContentLoaded", () => {
  // 1. Theme Initialization
  const currentTheme = localStorage.getItem("barpilot_theme") || "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeButton(currentTheme);

  // 2. Language Initialization
  window.i18n.applyTranslations();

  // 3. Render Initial State
  renderApp();

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
}

// --------------------------------------------------------------------------
// Navigation & Views
// --------------------------------------------------------------------------
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item[data-view]");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const view = item.getAttribute("data-view");
      switchView(view);
      closeMobileSidebar();
    });
  });

  // Mobile menu button & drawer controls
  const menuBtn = document.getElementById("mobileMenuBtn");
  const sidebar = document.getElementById("appSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  const closeBtn = document.getElementById("sidebarCloseBtn");

  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = sidebar.classList.contains("mobile-open") || !sidebar.classList.contains("sidebar-closed");
      if (sidebar.classList.contains("mobile-open")) {
        closeMobileSidebar();
      } else if (sidebar.classList.contains("sidebar-closed")) {
        openMobileSidebar();
      } else {
        // Toggle mobile-open
        openMobileSidebar();
      }
    });
  }

  // Click on close button inside sidebar
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeMobileSidebar();
    });
  }

  // Click on backdrop outside sidebar closes it
  if (backdrop) {
    backdrop.addEventListener("click", () => {
      closeMobileSidebar();
    });
  }

  // Click anywhere outside sidebar on document closes it
  document.addEventListener("click", (e) => {
    if (sidebar && sidebar.classList.contains("mobile-open")) {
      if (!sidebar.contains(e.target) && (!menuBtn || !menuBtn.contains(e.target))) {
        closeMobileSidebar();
      }
    }
  });

  // ESC key closes mobile sidebar and modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMobileSidebar();
      const modal = document.getElementById("barModalOverlay");
      if (modal) modal.classList.remove("active");
      closeAuthScreen();
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

function openMobileSidebar() {
  const sidebar = document.getElementById("appSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (sidebar) {
    sidebar.classList.add("mobile-open");
    sidebar.classList.remove("sidebar-closed");
  }
  if (backdrop) backdrop.classList.add("active");
}

function closeMobileSidebar() {
  const sidebar = document.getElementById("appSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (sidebar) {
    sidebar.classList.remove("mobile-open");
    sidebar.classList.add("sidebar-closed");
  }
  if (backdrop) backdrop.classList.remove("active");
}

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
function renderActiveBar() {
  const bar = window.db.get("activeBar");
  const barNameEl = document.getElementById("activeBarName");
  const barSwitcherText = document.getElementById("barSwitcherText");
  const userGreeting = document.getElementById("userGreetingName");
  const trialDaysEl = document.getElementById("trialDaysCount");

  if (barNameEl) barNameEl.textContent = bar.name;
  if (barSwitcherText) barSwitcherText.textContent = bar.name;
  if (userGreeting) userGreeting.textContent = bar.managerName.split(" ")[0];
  if (trialDaysEl) trialDaysEl.textContent = bar.trialDaysRemaining;
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

function renderStaff() {
  const staff = window.db.get("staff");
  const tbody = document.getElementById("staffTableBody");
  if (!tbody) return;

  tbody.innerHTML = staff.map(s => `
    <tr>
      <td>
        <div class="product-row-flex">
          <img src="${s.avatar}" class="product-thumb-sm" style="border-radius:50%;" alt="${s.name}">
          <div>
            <div style="font-weight:700;">${s.name}</div>
            <div style="font-size:11px; color:var(--text-muted);">${s.email}</div>
          </div>
        </div>
      </td>
      <td style="font-weight:600;">${s.role}</td>
      <td>
        <span class="table-badge ${s.status === 'active' ? 'badge-served' : 'badge-alert'}">
          ${s.status === 'active' ? window.i18n.t("statusActive") : window.i18n.t("statusInactive")}
        </span>
      </td>
      <td>
        <button class="ctrl-btn" onclick="alert('Modifica permessi di ${s.name}')">${window.i18n.t("edit")}</button>
      </td>
    </tr>
  `).join("");
}

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
// 1. ANIMATED SPLASH SCREEN (3 SECONDS DURATION)
// ==========================================================================
let splashTimer = null;

function initSplashScreen() {
  const splash = document.getElementById("splashScreen");
  const skipBtn = document.getElementById("btnSkipSplash");

  if (!splash) return;

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
// 3. AUTHENTICATION & REGISTRATION (GOOGLE, FACEBOOK, EMAIL, PHONE)
// ==========================================================================
let currentAuthTab = 'login';
let currentAuthMethod = 'email';

function openAuthScreen() {
  const authOverlay = document.getElementById("authOverlay");
  if (authOverlay) authOverlay.classList.remove("hidden");
}

function closeAuthScreen() {
  const authOverlay = document.getElementById("authOverlay");
  if (authOverlay) authOverlay.classList.add("hidden");
}

function switchAuthTab(tab) {
  currentAuthTab = tab;
  const btnLogin = document.getElementById("tabBtnLogin");
  const btnRegister = document.getElementById("tabBtnRegister");
  const extraFields = document.getElementById("registerExtraFields");
  const submitBtn = document.getElementById("authSubmitBtn");

  if (btnLogin && btnRegister) {
    btnLogin.classList.toggle("active", tab === 'login');
    btnRegister.classList.toggle("active", tab === 'register');
  }

  if (extraFields) {
    extraFields.style.display = tab === 'register' ? 'block' : 'none';
  }

  if (submitBtn) {
    if (tab === 'register') {
      submitBtn.textContent = window.i18n.currentLang === 'it' 
        ? "Crea account e inizia 14 giorni gratis" 
        : "Créer mon bar et lancer 14 jours d'essai";
    } else {
      submitBtn.textContent = window.i18n.currentLang === 'it' 
        ? "Accedi al gestionale" 
        : "Accéder à BarPilot";
    }
  }
}

function switchAuthMethod(method) {
  currentAuthMethod = method;
  const emailBtn = document.getElementById("methodEmailBtn");
  const phoneBtn = document.getElementById("methodPhoneBtn");
  const emailForm = document.getElementById("authEmailForm");
  const phoneForm = document.getElementById("authPhoneForm");

  if (emailBtn && phoneBtn) {
    emailBtn.classList.toggle("active", method === 'email');
    phoneBtn.classList.toggle("active", method === 'phone');
  }

  if (emailForm && phoneForm) {
    emailForm.style.display = method === 'email' ? 'block' : 'none';
    phoneForm.style.display = method === 'phone' ? 'block' : 'none';
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

  closeAuthScreen();
  showToast(window.i18n.currentLang === 'it' 
    ? `Accesso effettuato con successo tramite ${provider}!` 
    : `Connexion réussie via ${provider} !`);
}

// Phone SMS code sending simulation
function sendSmsCode() {
  const phoneInput = document.getElementById("authPhoneNumber");
  const countryCode = document.getElementById("phoneCountryCode")?.value || "+39";
  const num = phoneInput ? phoneInput.value.trim() : "";

  if (!num) {
    alert(window.i18n.currentLang === 'it' ? "Inserisci il tuo numero di telefono" : "Veuillez entrer votre numéro de téléphone");
    return;
  }

  const smsGroup = document.getElementById("smsCodeGroup");
  if (smsGroup) smsGroup.style.display = "block";

  showToast(window.i18n.currentLang === 'it' 
    ? `Codice inviato a ${countryCode} ${num}: 123456` 
    : `Code SMS envoyé au ${countryCode} ${num} : 123456`);
}

function handlePhoneAuthSubmit(e) {
  e.preventDefault();
  const smsInput = document.getElementById("authSmsCode");
  const code = smsInput ? smsInput.value.trim() : "";

  if (code === "123456" || code.length >= 4) {
    closeAuthScreen();
    showToast(window.i18n.currentLang === 'it' 
      ? "Numero verificato con successo! Benvenuto in BarPilot." 
      : "Numéro vérifié avec succès ! Bienvenue sur BarPilot.");
  } else {
    alert(window.i18n.currentLang === 'it' ? "Codice SMS errato. Prova con 123456" : "Code SMS incorrect. Essayez 123456");
  }
}

function handleAuthSubmit(e) {
  e.preventDefault();

  if (currentAuthTab === 'register') {
    const barName = document.getElementById("regBarName")?.value || "Il Mio Nuovo Bar";
    const ownerName = document.getElementById("regOwnerName")?.value || "Marco";
    const city = document.getElementById("regCity")?.value || "Roma";

    const activeBar = {
      id: "bar_" + Date.now(),
      name: barName,
      city: city,
      address: `Via Principale, 1 - ${city}`,
      currency: "€",
      role: "Proprietario",
      managerName: ownerName,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      plan: "Pro",
      trialDaysRemaining: 14,
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    };

    const bars = window.db.get("barsList") || [];
    bars.push({ id: activeBar.id, name: activeBar.name, city: activeBar.city, address: activeBar.address });

    window.db.set("activeBar", activeBar);
    window.db.set("barsList", bars);

    renderActiveBar();
    renderApp();

    closeAuthScreen();
    showToast(window.i18n.currentLang === 'it'
      ? `Bar "${barName}" registrato! 14 giorni di prova gratuita attivati.`
      : `Bar "${barName}" enregistré ! 14 jours d'essai gratuit activés.`);
  } else {
    closeAuthScreen();
    showToast(window.i18n.currentLang === 'it'
      ? "Accesso effettuato al tuo bar!"
      : "Connexion réussie à votre bar !");
  }
}

function quickLoginDemo() {
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


