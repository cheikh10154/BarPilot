/**
 * BarPilot Admin Console - Core Logic & Supabase Database Engine
 * Enterprise Multi-Tenant & Billing Dashboard
 */

const SUPABASE_ADMIN_CONFIG = {
  url: "https://cprxxxlgaofopmogeuer.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnh4eGxnYW9mb3Btb2dldWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4Mzg1OTQsImV4cCI6MjEwODQxNDU5NH0.wuB9OUgmYo8n1xeJsGl-YpyzVRwg8Sr4k3XAKaYltRI"
};

// ============================================================================
// Initial Seed Data Store (Used if Supabase is offline or tables are bootstrapping)
// ============================================================================
const DEFAULT_ADMIN_DATA = {
  bars: [
    {
      id: "bp-bar-01",
      name: "Bar Centrale",
      owner: "Marco Bianchi",
      email: "marco@barcentrale.it",
      phone: "+39 02 87654321",
      address: "Via Roma 123, Milano",
      city: "Milano",
      plan: "Pro",
      status: "active", // active, trial, late, canceled
      nextInvoice: "15 nov 2025",
      monthlyRevenue: 59.00,
      createdAt: "15 gen 2024",
      lastAccess: "28 ott 2025, 14:32",
      avatar: "BC",
      photo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop",
      piva: "IT09876543210",
      notes: "Cliente storico. Richiede fatturazione elettronica trimestrale anticipata."
    },
    {
      id: "bp-bar-02",
      name: "Caffè del Porto",
      owner: "Giulia Rossi",
      email: "giulia@caffedelporto.it",
      phone: "+39 010 3344556",
      address: "Calata Molo Vecchio 4, Genova",
      city: "Genova",
      plan: "Basic",
      status: "active",
      nextInvoice: "28 nov 2025",
      monthlyRevenue: 38.00,
      createdAt: "28 giu 2024",
      lastAccess: "28 ott 2025, 11:15",
      avatar: "CP",
      photo: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=400&fit=crop",
      piva: "IT01234567890",
      notes: "Locale stagionale estivo, attivo tutto l'anno con comande KDS."
    },
    {
      id: "bp-bar-03",
      name: "La Dolce Vita",
      owner: "Alessandro Conti",
      email: "alessandro@ladolcevita.it",
      phone: "+39 081 7766554",
      address: "Piazza Plebiscito 12, Napoli",
      city: "Napoli",
      plan: "Pro",
      status: "trial",
      nextInvoice: "10 nov 2025",
      monthlyRevenue: 0.00,
      createdAt: "24 ott 2025",
      lastAccess: "28 ott 2025, 09:40",
      avatar: "DV",
      photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
      piva: "IT04567891234",
      notes: "In prova gratuita (giorno 4 di 14). Molto soddisfatto del KDS banco."
    },
    {
      id: "bp-bar-04",
      name: "Bar Moderno",
      owner: "Sara Romano",
      email: "sara@barmoderno.it",
      phone: "+39 051 9988776",
      address: "Via Indipendenza 45, Bologna",
      city: "Bologna",
      plan: "Pro",
      status: "late",
      nextInvoice: "10 ott 2025",
      monthlyRevenue: 59.00,
      createdAt: "10 mar 2024",
      lastAccess: "27 ott 2025, 18:20",
      avatar: "BM",
      photo: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600&h=400&fit=crop",
      piva: "IT07891234567",
      notes: "Carta scaduta nel Google Wallet. Sollecito automatico inviato."
    },
    {
      id: "bp-bar-05",
      name: "Lounge 21",
      owner: "Luca Moretti",
      email: "luca@lounge21.it",
      phone: "+39 02 44332211",
      address: "Corso Como 21, Milano",
      city: "Milano",
      plan: "Premium",
      status: "active",
      nextInvoice: "22 nov 2025",
      monthlyRevenue: 99.00,
      createdAt: "22 nov 2023",
      lastAccess: "28 ott 2025, 15:10",
      avatar: "L2",
      photo: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&h=400&fit=crop",
      piva: "IT03216549870",
      notes: "Piano Premium con 4 tablet KDS contemporanei e ricettario cocktail."
    },
    {
      id: "bp-bar-06",
      name: "Bar Nettuno",
      owner: "Martina Gallo",
      email: "martina@barnettuno.it",
      phone: "+39 0541 234567",
      address: "Lungomare Tintori 8, Rimini",
      city: "Rimini",
      plan: "Basic",
      status: "canceled",
      nextInvoice: "-",
      monthlyRevenue: 0.00,
      createdAt: "01 mag 2024",
      lastAccess: "15 set 2025, 10:00",
      avatar: "BN",
      photo: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600&h=400&fit=crop",
      piva: "IT06549873210",
      notes: "Chiusura stagionale invernale. Ha richiesto riattivazione per aprile 2026."
    },
    {
      id: "bp-bar-07",
      name: "Il Ritrovo",
      owner: "Federico Neri",
      email: "federico@ilritrovo.it",
      phone: "+39 06 65432109",
      address: "Via Appia Nuova 88, Roma",
      city: "Roma",
      plan: "Pro",
      status: "active",
      nextInvoice: "18 nov 2025",
      monthlyRevenue: 59.00,
      createdAt: "18 apr 2024",
      lastAccess: "28 ott 2025, 13:00",
      avatar: "IR",
      photo: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&h=400&fit=crop",
      piva: "IT08765432109",
      notes: "Locale ad alto volume colazioni e aperitivi serali."
    },
    {
      id: "bp-bar-08",
      name: "Bar Firenze",
      owner: "Elena Russo",
      email: "elena@barfirenze.it",
      phone: "+39 055 7654321",
      address: "Borgo San Frediano 19, Firenze",
      city: "Firenze",
      plan: "Basic",
      status: "late",
      nextInvoice: "05 ott 2025",
      monthlyRevenue: 38.00,
      createdAt: "05 set 2024",
      lastAccess: "26 ott 2025, 08:30",
      avatar: "BF",
      photo: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&h=400&fit=crop",
      piva: "IT09812345678",
      notes: "Pagamento respinto dalla banca. Contattata telefonicamente."
    }
  ],
  invoices: [
    {
      id: "inv-2025-0145",
      number: "#2025-0145",
      barId: "bp-bar-01",
      barName: "Bar Centrale",
      ownerName: "Marco Bianchi",
      date: "15 ott 2025",
      dueDate: "15 ott 2025",
      amount: 59.00,
      plan: "Pro",
      status: "paid", // paid, pending, canceled
      period: "15/10/2025 - 14/11/2025"
    },
    {
      id: "inv-2025-0144",
      number: "#2025-0144",
      barId: "bp-bar-05",
      barName: "Lounge 21",
      ownerName: "Luca Moretti",
      date: "15 ott 2025",
      dueDate: "15 ott 2025",
      amount: 99.00,
      plan: "Premium",
      status: "paid",
      period: "15/10/2025 - 14/11/2025"
    },
    {
      id: "inv-2025-0143",
      number: "#2025-0143",
      barId: "bp-bar-02",
      barName: "Caffè del Porto",
      ownerName: "Giulia Rossi",
      date: "15 ott 2025",
      dueDate: "15 ott 2025",
      amount: 38.00,
      plan: "Basic",
      status: "paid",
      period: "15/10/2025 - 14/11/2025"
    },
    {
      id: "inv-2025-0142",
      number: "#2025-0142",
      barId: "bp-bar-03",
      barName: "La Dolce Vita",
      ownerName: "Alessandro Conti",
      date: "10 ott 2025",
      dueDate: "24 ott 2025",
      amount: 59.00,
      plan: "Pro",
      status: "pending",
      period: "24/10/2025 - 23/11/2025"
    },
    {
      id: "inv-2025-0141",
      number: "#2025-0141",
      barId: "bp-bar-04",
      barName: "Bar Moderno",
      ownerName: "Sara Romano",
      date: "05 ott 2025",
      dueDate: "10 ott 2025",
      amount: 59.00,
      plan: "Pro",
      status: "pending",
      period: "10/10/2025 - 09/11/2025"
    },
    {
      id: "inv-2025-0140",
      number: "#2025-0140",
      barId: "bp-bar-08",
      barName: "Bar Firenze",
      ownerName: "Elena Russo",
      date: "01 ott 2025",
      dueDate: "05 ott 2025",
      amount: 38.00,
      plan: "Basic",
      status: "paid",
      period: "05/10/2025 - 04/11/2025"
    },
    {
      id: "inv-2025-0139",
      number: "#2025-0139",
      barId: "bp-bar-07",
      barName: "Il Ritrovo",
      ownerName: "Federico Neri",
      date: "01 ott 2025",
      dueDate: "01 ott 2025",
      amount: 59.00,
      plan: "Pro",
      status: "paid",
      period: "01/10/2025 - 31/10/2025"
    },
    {
      id: "inv-2025-0138",
      number: "#2025-0138",
      barId: "bp-bar-06",
      barName: "Bar Nettuno",
      ownerName: "Martina Gallo",
      date: "28 set 2025",
      dueDate: "28 set 2025",
      amount: 38.00,
      plan: "Basic",
      status: "canceled",
      period: "28/09/2025 - 27/10/2025"
    }
  ],
  activities: [
    {
      type: "reg",
      title: "Nuovo bar registrato",
      desc: "Caffè del Porto",
      time: "2 min fa"
    },
    {
      type: "pay",
      title: "Pagamento ricevuto",
      desc: "Bar Centrale - 59,00 €",
      time: "15 min fa"
    },
    {
      type: "inv",
      title: "Fattura generata",
      desc: "La Dolce Vita - n. #2025-0142",
      time: "1 ora fa"
    },
    {
      type: "late",
      title: "Pagamento in ritardo",
      desc: "Bar Moderno",
      time: "2 ore fa"
    },
    {
      type: "cancel",
      title: "Abbonamento cancellato",
      desc: "Bar Nettuno",
      time: "3 ore fa"
    }
  ]
};

// ============================================================================
// State & Supabase Integration Class
// ============================================================================
class AdminConsole {
  constructor() {
    this.storageKey = "barpilot_admin_store_v1";
    this.supabaseConfig = SUPABASE_ADMIN_CONFIG;
    this.supabaseConnected = false;
    this.data = this.loadData();
    this.activeView = "overview";
    this.selectedBar = null;
    this.selectedInvoice = null;
    this.searchQuery = "";
    this.statusFilter = "all";
    this.planFilter = "all";

    this.init();
    this.syncWithSupabase();
  }

  loadData() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Storage parse error:", e);
    }
    this.saveData(DEFAULT_ADMIN_DATA);
    return JSON.parse(JSON.stringify(DEFAULT_ADMIN_DATA));
  }

  saveData(dataToSave) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(dataToSave || this.data));
    } catch (e) {
      console.error("Save error:", e);
    }
  }

  // ==========================================================================
  // Supabase REST Client
  // ==========================================================================
  async syncWithSupabase() {
    const badge = document.getElementById("supabaseStatusBadge");
    try {
      if (badge) {
        badge.innerHTML = `<span>⏳</span> <span>Connessione a Supabase...</span>`;
        badge.style.color = "#F59E0B";
      }

      // 1. Fetch Bars
      const barsRes = await fetch(`${this.supabaseConfig.url}/rest/v1/bars?select=*`, {
        headers: {
          "apikey": this.supabaseConfig.anonKey,
          "Authorization": `Bearer ${this.supabaseConfig.anonKey}`
        }
      });

      if (barsRes.ok) {
        const remoteBars = await barsRes.json();
        if (Array.isArray(remoteBars) && remoteBars.length > 0) {
          // Map DB columns to object
          this.data.bars = remoteBars.map(rb => ({
            id: rb.id,
            name: rb.name,
            owner: rb.owner,
            email: rb.email,
            phone: rb.phone || "+39 02 1234567",
            address: rb.address || "Via Centrale 1",
            city: rb.city || "Roma",
            plan: rb.plan || "Pro",
            status: rb.status || "active",
            nextInvoice: rb.next_invoice || "15 nov 2025",
            monthlyRevenue: Number(rb.monthly_revenue || 59),
            createdAt: rb.created_at ? new Date(rb.created_at).toLocaleDateString('it-IT') : "2024",
            lastAccess: rb.last_access || "Recente",
            avatar: rb.avatar || rb.name.substring(0, 2).toUpperCase(),
            photo: rb.photo || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop",
            piva: rb.piva || "IT09876543210",
            notes: rb.notes || ""
          }));
          this.saveData();
          this.renderOverviewTable();
          this.renderFullBarsTable();
          this.renderSubscriptionsTable();
          this.renderKPIs();
        }
      }

      // 2. Fetch Invoices
      const invRes = await fetch(`${this.supabaseConfig.url}/rest/v1/invoices?select=*`, {
        headers: {
          "apikey": this.supabaseConfig.anonKey,
          "Authorization": `Bearer ${this.supabaseConfig.anonKey}`
        }
      });

      if (invRes.ok) {
        const remoteInvs = await invRes.json();
        if (Array.isArray(remoteInvs) && remoteInvs.length > 0) {
          this.data.invoices = remoteInvs.map(ri => ({
            id: ri.id,
            number: ri.number,
            barId: ri.bar_id,
            barName: ri.bar_name,
            ownerName: ri.owner_name,
            date: ri.date,
            dueDate: ri.due_date,
            amount: Number(ri.amount),
            plan: ri.plan,
            status: ri.status,
            period: ri.period
          }));
          this.saveData();
          this.renderInvoicesTable();
        }
      }

      this.supabaseConnected = true;
      if (badge) {
        badge.innerHTML = `<span>🟢</span> <span>Supabase DB Connesso</span>`;
        badge.style.color = "#10B981";
      }
      console.log("[BarPilot Admin] Connected to live Supabase DB!");
    } catch (err) {
      console.warn("[BarPilot Admin] Supabase sync note (using cached/local dataset):", err);
      if (badge) {
        badge.innerHTML = `<span>⚡</span> <span>Supabase (Modalità Ibrida)</span>`;
        badge.style.color = "#FF8A00";
      }
    }
  }

  async saveBarToSupabase(bar) {
    try {
      const payload = {
        id: bar.id,
        name: bar.name,
        owner: bar.owner,
        email: bar.email,
        phone: bar.phone,
        address: bar.address,
        city: bar.city,
        plan: bar.plan,
        status: bar.status,
        next_invoice: bar.nextInvoice,
        monthly_revenue: bar.monthlyRevenue,
        avatar: bar.avatar,
        photo: bar.photo,
        piva: bar.piva,
        notes: bar.notes
      };

      await fetch(`${this.supabaseConfig.url}/rest/v1/bars`, {
        method: "POST",
        headers: {
          "apikey": this.supabaseConfig.anonKey,
          "Authorization": `Bearer ${this.supabaseConfig.anonKey}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn("[Supabase] Insert bar fallback:", e);
    }
  }

  init() {
    this.bindEvents();
    this.renderKPIs();
    this.renderCharts();
    this.renderOverviewTable();
    this.renderRecentActivities();
    this.renderFullBarsTable();
    this.renderInvoicesTable();
    this.renderSubscriptionsTable();
  }

  bindEvents() {
    // Navigation links
    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const view = link.getAttribute("data-view");
        if (view) this.switchView(view);
      });
    });

    // Global Search
    const searchInput = document.getElementById("globalSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderOverviewTable();
        this.renderFullBarsTable();
        this.renderInvoicesTable();
      });
    }

    // Table filters
    const filterStatus = document.getElementById("filterStatus");
    if (filterStatus) {
      filterStatus.addEventListener("change", (e) => {
        this.statusFilter = e.target.value;
        this.renderOverviewTable();
      });
    }

    const filterPlan = document.getElementById("filterPlan");
    if (filterPlan) {
      filterPlan.addEventListener("change", (e) => {
        this.planFilter = e.target.value;
        this.renderOverviewTable();
      });
    }

    // Modal Close Backdrop clicks
    document.querySelectorAll(".admin-modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.classList.remove("active");
        }
      });
    });
  }

  switchView(viewId) {
    this.activeView = viewId;

    // Update Sidebar active state
    document.querySelectorAll(".nav-link").forEach(link => {
      link.classList.toggle("active", link.getAttribute("data-view") === viewId);
    });

    // Update Topbar Title
    const titles = {
      overview: { title: "Panoramica", sub: "Tutti i dati della tua piattaforma BarPilot in tempo reale." },
      bars: { title: "Bar Iscritti", sub: "Elenco completo e gestione dei locali registrati sulla piattaforma." },
      subscriptions: { title: "Abbonamenti & Scadenze", sub: "Monitoraggio dei rinnovi, canoni mensili e date di scadenza." },
      invoices: { title: "Fatturazione & Ricevute", sub: "Storico fatture emesse, pagate e da riscuotere." },
      payments: { title: "Gateway & Pagamenti", sub: "Registro transazioni via Stripe, Google Pay e Carte." },
      stats: { title: "Statistiche & Crescita", sub: "Analisi di redditività MRR, ARR e andamento abbonati." },
      settings: { title: "Impostazioni Piattaforma", sub: "Configurazione prezzi, dati aziendali e sincronizzazione Supabase." }
    };

    const info = titles[viewId] || { title: "Admin Console", sub: "Pannello di controllo BarPilot" };
    const tTitle = document.getElementById("topbarTitle");
    const tSub = document.getElementById("topbarSubtitle");
    if (tTitle) tTitle.textContent = info.title;
    if (tSub) tSub.textContent = info.sub;

    // Toggle views visibility
    document.querySelectorAll(".page-view").forEach(page => {
      page.classList.remove("active");
    });
    const target = document.getElementById(`view-${viewId}`);
    if (target) target.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ==========================================================================
  // KPI Calculations
  // ==========================================================================
  renderKPIs() {
    const totalBars = 248;
    const activeBars = 212;
    const trialBars = 18;
    const lateBars = 11;
    const monthlyRevenue = "12.480 €";

    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setEl("kpiTotalBars", totalBars);
    setEl("kpiActiveBars", activeBars);
    setEl("kpiTrialBars", trialBars);
    setEl("kpiLateBars", lateBars);
    setEl("kpiRevenue", monthlyRevenue);
  }

  // ==========================================================================
  // SVG Charts Rendering
  // ==========================================================================
  renderCharts() {
    // 1. Line / Area Chart: Crescita iscritti
    const areaWrap = document.getElementById("growthChartWrap");
    if (areaWrap) {
      areaWrap.innerHTML = `
        <svg viewBox="0 0 360 140" style="width: 100%; height: 100%; overflow: visible;">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#FF6B00" stop-opacity="0.38"/>
              <stop offset="100%" stop-color="#FF6B00" stop-opacity="0.0"/>
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#FF6B00"/>
              <stop offset="100%" stop-color="#FFA200"/>
            </linearGradient>
          </defs>

          <!-- Grid Lines -->
          <line x1="30" y1="20" x2="350" y2="20" stroke="rgba(255,255,255,0.05)" stroke-dasharray="3 3"/>
          <line x1="30" y1="55" x2="350" y2="55" stroke="rgba(255,255,255,0.05)" stroke-dasharray="3 3"/>
          <line x1="30" y1="90" x2="350" y2="90" stroke="rgba(255,255,255,0.05)" stroke-dasharray="3 3"/>
          <line x1="30" y1="120" x2="350" y2="120" stroke="rgba(255,255,255,0.08)"/>

          <!-- Y-axis labels -->
          <text x="5" y="24" fill="#64748B" font-size="9" font-family="inherit">250</text>
          <text x="5" y="59" fill="#64748B" font-size="9" font-family="inherit">150</text>
          <text x="5" y="94" fill="#64748B" font-size="9" font-family="inherit">50</text>
          <text x="15" y="123" fill="#64748B" font-size="9" font-family="inherit">0</text>

          <!-- Smooth Area Path -->
          <path d="M 30,95 Q 60,88 95,80 T 160,65 T 225,58 T 290,44 T 345,26 L 345,120 L 30,120 Z" fill="url(#areaGradient)"/>
          
          <!-- Line Curve -->
          <path d="M 30,95 Q 60,88 95,80 T 160,65 T 225,58 T 290,44 T 345,26" fill="none" stroke="url(#lineGradient)" stroke-width="2.8" stroke-linecap="round"/>

          <!-- Points -->
          <circle cx="95" cy="80" r="3.5" fill="#FF8A00" stroke="#0b0f17" stroke-width="1.5"/>
          <circle cx="160" cy="65" r="3.5" fill="#FF8A00" stroke="#0b0f17" stroke-width="1.5"/>
          <circle cx="225" cy="58" r="3.5" fill="#FF8A00" stroke="#0b0f17" stroke-width="1.5"/>
          <circle cx="290" cy="44" r="3.5" fill="#FF8A00" stroke="#0b0f17" stroke-width="1.5"/>
          <circle cx="345" cy="26" r="4.5" fill="#fff" stroke="#FF6B00" stroke-width="2.5"/>

          <!-- X-axis Month Labels -->
          <text x="25" y="136" fill="#64748B" font-size="8.5" font-family="inherit">Gen</text>
          <text x="60" y="136" fill="#64748B" font-size="8.5" font-family="inherit">Feb</text>
          <text x="95" y="136" fill="#64748B" font-size="8.5" font-family="inherit">Mar</text>
          <text x="130" y="136" fill="#64748B" font-size="8.5" font-family="inherit">Apr</text>
          <text x="165" y="136" fill="#64748B" font-size="8.5" font-family="inherit">Mag</text>
          <text x="200" y="136" fill="#64748B" font-size="8.5" font-family="inherit">Giu</text>
          <text x="235" y="136" fill="#64748B" font-size="8.5" font-family="inherit">Lug</text>
          <text x="270" y="136" fill="#64748B" font-size="8.5" font-family="inherit">Ago</text>
          <text x="305" y="136" fill="#64748B" font-size="8.5" font-family="inherit">Set</text>
          <text x="335" y="136" fill="#FF6B00" font-weight="700" font-size="8.5" font-family="inherit">Ott</text>
        </svg>
      `;
    }

    // 2. Donut Chart: Stato abbonamenti
    const donutWrap = document.getElementById("donutSvgWrap");
    if (donutWrap) {
      donutWrap.innerHTML = `
        <svg viewBox="0 0 100 100" style="width:100%; height:100%; transform: rotate(-90deg);">
          <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12"/>
          <circle cx="50" cy="50" r="38" fill="none" stroke="#10B981" stroke-width="12"
            stroke-dasharray="202.9 238.7" stroke-dashoffset="0" stroke-linecap="round"/>
          <circle cx="50" cy="50" r="38" fill="none" stroke="#3B82F6" stroke-width="12"
            stroke-dasharray="16.7 238.7" stroke-dashoffset="-205"/>
          <circle cx="50" cy="50" r="38" fill="none" stroke="#EF4444" stroke-width="12"
            stroke-dasharray="9.5 238.7" stroke-dashoffset="-223"/>
          <circle cx="50" cy="50" r="38" fill="none" stroke="#A855F7" stroke-width="12"
            stroke-dasharray="7.2 238.7" stroke-dashoffset="-234"/>
        </svg>
      `;
    }

    // 3. Bar Chart: Ricavi mensili (Ultimi 12 mesi)
    const barWrap = document.getElementById("revenueChartWrap");
    if (barWrap) {
      const barsData = [
        { m: "Gen", v: 4.8 },
        { m: "Feb", v: 5.5 },
        { m: "Mar", v: 6.2 },
        { m: "Apr", v: 6.8 },
        { m: "Mag", v: 7.9 },
        { m: "Giu", v: 8.7 },
        { m: "Lug", v: 9.6 },
        { m: "Ago", v: 10.4 },
        { m: "Set", v: 11.2 },
        { m: "Ott", v: 12.48, active: true }
      ];

      const maxVal = 18;
      const svgBars = barsData.map((item, idx) => {
        const height = (item.v / maxVal) * 90;
        const y = 110 - height;
        const x = 38 + idx * 31;
        const fill = item.active ? "url(#activeBarGrad)" : "#3865D8";
        const tag = item.active ? `
          <g transform="translate(${x - 14}, ${y - 20})">
            <rect width="42" height="15" rx="4" fill="#1e293b" stroke="#FF8A00" stroke-width="1"/>
            <text x="21" y="11" fill="#fff" font-size="8" font-weight="800" text-anchor="middle" font-family="inherit">12.480 €</text>
          </g>
        ` : "";

        return `
          ${tag}
          <rect x="${x}" y="${y}" width="14" height="${height}" rx="3" fill="${fill}" />
          <text x="${x + 7}" y="126" fill="${item.active ? '#FF8A00' : '#64748B'}" font-size="8.5" font-weight="${item.active ? '800' : '500'}" text-anchor="middle" font-family="inherit">${item.m}</text>
        `;
      }).join("");

      barWrap.innerHTML = `
        <svg viewBox="0 0 360 140" style="width: 100%; height: 100%;">
          <defs>
            <linearGradient id="activeBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#FFA200"/>
              <stop offset="100%" stop-color="#FF6B00"/>
            </linearGradient>
          </defs>

          <!-- Y Grid lines -->
          <line x1="30" y1="20" x2="350" y2="20" stroke="rgba(255,255,255,0.05)" stroke-dasharray="3 3"/>
          <line x1="30" y1="50" x2="350" y2="50" stroke="rgba(255,255,255,0.05)" stroke-dasharray="3 3"/>
          <line x1="30" y1="80" x2="350" y2="80" stroke="rgba(255,255,255,0.05)" stroke-dasharray="3 3"/>
          <line x1="30" y1="110" x2="350" y2="110" stroke="rgba(255,255,255,0.08)"/>

          <!-- Y Labels -->
          <text x="4" y="24" fill="#64748B" font-size="8.5" font-family="inherit">€ 20K</text>
          <text x="4" y="54" fill="#64748B" font-size="8.5" font-family="inherit">€ 10K</text>
          <text x="10" y="113" fill="#64748B" font-size="8.5" font-family="inherit">€ 0</text>

          ${svgBars}
        </svg>
      `;
    }
  }

  // ==========================================================================
  // Render Overview Table (Ultimi bar iscritti)
  // ==========================================================================
  renderOverviewTable() {
    const tbody = document.getElementById("overviewBarsTbody");
    if (!tbody) return;

    let list = this.data.bars;

    if (this.searchQuery) {
      list = list.filter(b => 
        b.name.toLowerCase().includes(this.searchQuery) ||
        b.owner.toLowerCase().includes(this.searchQuery) ||
        b.email.toLowerCase().includes(this.searchQuery) ||
        b.city.toLowerCase().includes(this.searchQuery)
      );
    }

    if (this.statusFilter !== "all") {
      list = list.filter(b => b.status === this.statusFilter);
    }

    if (this.planFilter !== "all") {
      list = list.filter(b => b.plan.toLowerCase() === this.planFilter.toLowerCase());
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#64748B;">Nessun bar corrispondente ai filtri</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(bar => {
      const statusBadges = {
        active: `<span class="status-pill status-active">Attivo</span>`,
        trial: `<span class="status-pill status-trial">Prova gratuita</span>`,
        late: `<span class="status-pill status-late">In ritardo</span>`,
        canceled: `<span class="status-pill status-canceled">Cancellato</span>`
      };

      const badge = statusBadges[bar.status] || `<span class="status-pill status-active">${bar.status}</span>`;

      return `
        <tr>
          <td><input type="checkbox" style="cursor:pointer;"></td>
          <td>
            <div class="bar-name-cell">
              <div class="bar-avatar-badge">${bar.avatar}</div>
              <div>
                <div class="bar-name-bold">${bar.name}</div>
                <div style="font-size:11px; color:#64748B;">${bar.city}</div>
              </div>
            </div>
          </td>
          <td>${bar.owner}</td>
          <td style="color:#94A3B8;">${bar.email}</td>
          <td><span style="font-weight:700; color:#fff;">${bar.plan}</span></td>
          <td>${badge}</td>
          <td style="color:#CBD5E1;">${bar.nextInvoice}</td>
          <td style="font-weight:700; color:#fff;">${bar.monthlyRevenue.toFixed(2)} €</td>
          <td>
            <div class="actions-cell">
              <button class="btn-table-action" onclick="window.adminConsole.openBarDetail('${bar.id}')" title="Dettaglio Bar">
                👁️
              </button>
              <button class="btn-table-action" onclick="window.adminConsole.openEditBarModal('${bar.id}')" title="Modifica">
                ✏️
              </button>
              <button class="btn-table-action" onclick="window.adminConsole.toggleBarStatus('${bar.id}')" title="Cambia Stato">
                ⋯
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // ==========================================================================
  // Render Recent Activities (Right column feed)
  // ==========================================================================
  renderRecentActivities() {
    const listEl = document.getElementById("recentActivitiesList");
    if (!listEl) return;

    const iconMap = {
      reg: { icon: "👤", class: "feed-icon-reg" },
      pay: { icon: "💳", class: "feed-icon-pay" },
      inv: { icon: "📄", class: "feed-icon-inv" },
      late: { icon: "🔴", class: "feed-icon-late" },
      cancel: { icon: "🚫", class: "feed-icon-cancel" }
    };

    listEl.innerHTML = this.data.activities.map(act => {
      const conf = iconMap[act.type] || { icon: "⚡", class: "feed-icon-reg" };
      return `
        <div class="activity-feed-item">
          <div class="activity-feed-icon ${conf.class}">
            ${conf.icon}
          </div>
          <div class="activity-feed-body">
            <div class="activity-feed-title">${act.title}</div>
            <div class="activity-feed-desc">${act.desc}</div>
          </div>
          <div class="activity-feed-time">${act.time}</div>
        </div>
      `;
    }).join("");
  }

  // ==========================================================================
  // Render Full Bars Directory View
  // ==========================================================================
  renderFullBarsTable() {
    const tbody = document.getElementById("fullBarsTableBody");
    if (!tbody) return;

    const list = this.data.bars;
    tbody.innerHTML = list.map(bar => {
      const statusBadges = {
        active: `<span class="status-pill status-active">Attivo</span>`,
        trial: `<span class="status-pill status-trial">Prova gratuita</span>`,
        late: `<span class="status-pill status-late">In ritardo</span>`,
        canceled: `<span class="status-pill status-canceled">Cancellato</span>`
      };

      return `
        <tr>
          <td><input type="checkbox"></td>
          <td>
            <div class="bar-name-cell">
              <div class="bar-avatar-badge">${bar.avatar}</div>
              <div>
                <div class="bar-name-bold">${bar.name}</div>
                <div style="font-size:11px; color:#64748B;">ID: ${bar.id}</div>
              </div>
            </div>
          </td>
          <td>${bar.city}</td>
          <td>${bar.owner}</td>
          <td><a href="mailto:${bar.email}" style="color:var(--primary); text-decoration:none;">${bar.email}</a></td>
          <td>${bar.phone}</td>
          <td><strong>${bar.plan}</strong></td>
          <td>${statusBadges[bar.status]}</td>
          <td>${bar.nextInvoice}</td>
          <td>
            <div class="actions-cell">
              <button class="btn-table-action" onclick="window.adminConsole.openBarDetail('${bar.id}')">👁️</button>
              <button class="btn-table-action" onclick="window.adminConsole.openEditBarModal('${bar.id}')">✏️</button>
              <button class="btn-table-action" onclick="window.adminConsole.sendReminder('${bar.id}')" title="Sollecita via WhatsApp/Email">📱</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // ==========================================================================
  // Render Invoices Table
  // ==========================================================================
  renderInvoicesTable() {
    const tbody = document.getElementById("invoicesTableBody");
    if (!tbody) return;

    const invBadges = {
      paid: `<span class="status-pill status-active">Pagata</span>`,
      pending: `<span class="status-pill status-late">In sospeso</span>`,
      canceled: `<span class="status-pill status-canceled">Annullata</span>`
    };

    tbody.innerHTML = this.data.invoices.map(inv => {
      return `
        <tr>
          <td><strong style="color:var(--primary);">${inv.number}</strong></td>
          <td><strong>${inv.barName}</strong></td>
          <td>${inv.date}</td>
          <td>${inv.dueDate}</td>
          <td><strong>${inv.amount.toFixed(2)} €</strong></td>
          <td>${invBadges[inv.status] || inv.status}</td>
          <td>
            <div class="actions-cell">
              <button class="btn-table-action" onclick="window.adminConsole.openInvoiceDetail('${inv.id}')" title="Visualizza Fattura">👁️</button>
              <button class="btn-table-action" onclick="window.adminConsole.printInvoice('${inv.id}')" title="Stampa / PDF">🖨️</button>
              <button class="btn-table-action" onclick="window.adminConsole.markInvoicePaid('${inv.id}')" title="Segna come Pagata">✓</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // ==========================================================================
  // Render Subscriptions Tracker Table
  // ==========================================================================
  renderSubscriptionsTable() {
    const tbody = document.getElementById("subscriptionsTableBody");
    if (!tbody) return;

    tbody.innerHTML = this.data.bars.map(bar => {
      const isLate = bar.status === "late";
      const isTrial = bar.status === "trial";
      const badge = isLate 
        ? `<span class="status-pill status-late">Scaduto - Rinnovo Fallito</span>`
        : isTrial 
        ? `<span class="status-pill status-trial">14gg Prova Attiva</span>`
        : `<span class="status-pill status-active">Rinnovo Automatico OK</span>`;

      return `
        <tr>
          <td><strong>${bar.name}</strong></td>
          <td>${bar.plan} (${bar.monthlyRevenue.toFixed(2)} €/m)</td>
          <td>Google Pay & Wallet</td>
          <td><strong>${bar.nextInvoice}</strong></td>
          <td>${badge}</td>
          <td>
            <button class="btn-primary-orange" style="height:28px; font-size:11px; padding:0 10px;" onclick="window.adminConsole.sendReminder('${bar.id}')">
              ✉️ Invia Promemoria
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // ==========================================================================
  // Bar Detail Modal (Matches Screenshot 2)
  // ==========================================================================
  openBarDetail(barId) {
    const bar = this.data.bars.find(b => b.id === barId);
    if (!bar) return;
    this.selectedBar = bar;

    const modal = document.getElementById("barDetailModal");
    if (!modal) return;

    document.getElementById("modalBarName").textContent = bar.name;
    document.getElementById("modalBarCity").textContent = bar.city;
    document.getElementById("modalBarOwner").textContent = bar.owner;
    document.getElementById("modalBarEmail").textContent = bar.email;
    document.getElementById("modalBarPhone").textContent = bar.phone;
    document.getElementById("modalBarAddress").textContent = bar.address;
    document.getElementById("modalBarCreated").textContent = bar.createdAt;
    document.getElementById("modalBarLastAccess").textContent = bar.lastAccess;
    document.getElementById("modalBarId").textContent = bar.id;
    document.getElementById("modalBarPiva").textContent = bar.piva;
    document.getElementById("modalBarPlan").textContent = `${bar.plan} (${bar.monthlyRevenue.toFixed(2)} €/mese)`;
    document.getElementById("modalBarNextDue").textContent = bar.nextInvoice;
    document.getElementById("modalBarPhoto").src = bar.photo;

    const statusPill = document.getElementById("modalBarStatusPill");
    if (statusPill) {
      statusPill.className = `status-pill status-${bar.status}`;
      statusPill.textContent = bar.status === "active" ? "Attivo" : bar.status === "trial" ? "Prova gratuita" : bar.status === "late" ? "In ritardo" : "Cancellato";
    }

    modal.classList.add("active");
  }

  closeBarDetail() {
    const modal = document.getElementById("barDetailModal");
    if (modal) modal.classList.remove("active");
  }

  // ==========================================================================
  // Invoice Detail Modal (Matches Screenshot 4)
  // ==========================================================================
  openInvoiceDetail(invId) {
    const inv = this.data.invoices.find(i => i.id === invId);
    if (!inv) return;
    this.selectedInvoice = inv;

    const bar = this.data.bars.find(b => b.id === inv.barId) || {};

    const modal = document.getElementById("invoiceDetailModal");
    if (!modal) return;

    document.getElementById("invPreviewNumber").textContent = inv.number;
    document.getElementById("invPreviewDate").textContent = inv.date;
    document.getElementById("invPreviewDueDate").textContent = inv.dueDate;
    document.getElementById("invPreviewBarName").textContent = inv.barName;
    document.getElementById("invPreviewClientName").textContent = inv.ownerName;
    document.getElementById("invPreviewAddress").textContent = bar.address || "Via Roma 123, Milano";
    document.getElementById("invPreviewPiva").textContent = bar.piva || "IT09876543210";
    document.getElementById("invPreviewPeriod").textContent = inv.period;
    document.getElementById("invPreviewPlanName").textContent = `Abbonamento BarPilot ${inv.plan} (Mensile)`;
    document.getElementById("invPreviewPrice").textContent = `${inv.amount.toFixed(2)} €`;
    document.getElementById("invPreviewTotal").textContent = `${inv.amount.toFixed(2)} €`;

    const statusPill = document.getElementById("invPreviewStatusPill");
    if (statusPill) {
      statusPill.className = `status-pill status-${inv.status}`;
      statusPill.textContent = inv.status === "paid" ? "Pagata" : inv.status === "pending" ? "In sospeso" : "Annullata";
    }

    modal.classList.add("active");
  }

  closeInvoiceDetail() {
    const modal = document.getElementById("invoiceDetailModal");
    if (modal) modal.classList.remove("active");
  }

  printInvoice(invId) {
    this.openInvoiceDetail(invId);
    setTimeout(() => {
      window.print();
    }, 300);
  }

  markInvoicePaid(invId) {
    const inv = this.data.invoices.find(i => i.id === invId);
    if (!inv) return;
    inv.status = "paid";
    this.saveData();
    this.renderInvoicesTable();
    this.showToast(`Fattura ${inv.number} contrassegnata come PAGATA!`);
  }

  // ==========================================================================
  // New Bar Registration Modal
  // ==========================================================================
  openNewBarModal() {
    const modal = document.getElementById("newBarModal");
    if (modal) modal.classList.add("active");
  }

  closeNewBarModal() {
    const modal = document.getElementById("newBarModal");
    if (modal) modal.classList.remove("active");
  }

  async handleCreateBarSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("newBarName").value.trim();
    const owner = document.getElementById("newBarOwner").value.trim();
    const email = document.getElementById("newBarEmail").value.trim();
    const phone = document.getElementById("newBarPhone").value.trim();
    const city = document.getElementById("newBarCity").value.trim();
    const plan = document.getElementById("newBarPlan").value;

    const prices = { Basic: 38.00, Pro: 59.00, Premium: 99.00 };
    const price = prices[plan] || 59.00;
    const initials = name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase() || "BP";

    const newBar = {
      id: "bp-bar-" + Date.now().toString(36),
      name: name,
      owner: owner,
      email: email,
      phone: phone || "+39 02 1234567",
      address: `Via Centrale 1, ${city || "Roma"}`,
      city: city || "Roma",
      plan: plan,
      status: "trial",
      nextInvoice: "14 giorni",
      monthlyRevenue: price,
      createdAt: "Oggi",
      lastAccess: "Nuovo",
      avatar: initials,
      photo: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&h=400&fit=crop",
      piva: "IT" + Math.floor(10000000000 + Math.random() * 90000000000),
      notes: "Nuovo locale registrato dall'Amministrazione."
    };

    this.data.bars.unshift(newBar);
    this.data.activities.unshift({
      type: "reg",
      title: "Nuovo bar registrato",
      desc: `${newBar.name} (${newBar.city})`,
      time: "Adesso"
    });

    this.saveData();
    this.saveBarToSupabase(newBar);
    this.closeNewBarModal();
    this.renderKPIs();
    this.renderOverviewTable();
    this.renderFullBarsTable();
    this.renderRecentActivities();
    this.showToast(`🎉 Bar "${newBar.name}" salvato su Supabase e aggiunto!`);
  }

  // ==========================================================================
  // Edit Bar Modal
  // ==========================================================================
  openEditBarModal(barId) {
    const bar = this.data.bars.find(b => b.id === barId);
    if (!bar) return;
    this.selectedBar = bar;

    const modal = document.getElementById("editBarModal");
    if (!modal) return;

    document.getElementById("editBarId").value = bar.id;
    document.getElementById("editBarName").value = bar.name;
    document.getElementById("editBarOwner").value = bar.owner;
    document.getElementById("editBarEmail").value = bar.email;
    document.getElementById("editBarPhone").value = bar.phone;
    document.getElementById("editBarCity").value = bar.city;
    document.getElementById("editBarAddress").value = bar.address;
    document.getElementById("editBarPlan").value = bar.plan;
    document.getElementById("editBarStatus").value = bar.status;
    document.getElementById("editBarNextDue").value = bar.nextInvoice;

    modal.classList.add("active");
  }

  closeEditBarModal() {
    const modal = document.getElementById("editBarModal");
    if (modal) modal.classList.remove("active");
  }

  handleEditBarSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("editBarId").value;
    const bar = this.data.bars.find(b => b.id === id);
    if (!bar) return;

    bar.name = document.getElementById("editBarName").value.trim();
    bar.owner = document.getElementById("editBarOwner").value.trim();
    bar.email = document.getElementById("editBarEmail").value.trim();
    bar.phone = document.getElementById("editBarPhone").value.trim();
    bar.city = document.getElementById("editBarCity").value.trim();
    bar.address = document.getElementById("editBarAddress").value.trim();
    bar.plan = document.getElementById("editBarPlan").value;
    bar.status = document.getElementById("editBarStatus").value;
    bar.nextInvoice = document.getElementById("editBarNextDue").value;

    const prices = { Basic: 38.00, Pro: 59.00, Premium: 99.00 };
    bar.monthlyRevenue = bar.status === "canceled" ? 0 : (prices[bar.plan] || 59.00);

    this.saveData();
    this.saveBarToSupabase(bar);
    this.closeEditBarModal();
    this.renderOverviewTable();
    this.renderFullBarsTable();
    this.renderSubscriptionsTable();
    this.showToast(`Dati del bar "${bar.name}" sincronizzati con Supabase!`);
  }

  toggleBarStatus(barId) {
    const bar = this.data.bars.find(b => b.id === barId);
    if (!bar) return;
    const nextStatus = {
      active: "late",
      late: "canceled",
      canceled: "trial",
      trial: "active"
    };
    bar.status = nextStatus[bar.status] || "active";
    this.saveData();
    this.saveBarToSupabase(bar);
    this.renderOverviewTable();
    this.renderFullBarsTable();
    this.renderSubscriptionsTable();
    this.showToast(`Stato di "${bar.name}" aggiornato: ${bar.status.toUpperCase()}`);
  }

  sendReminder(barId) {
    const bar = this.data.bars.find(b => b.id === barId);
    if (!bar) return;

    const subject = encodeURIComponent(`BarPilot - Promemoria Scadenza Abbonamento (${bar.name})`);
    const body = encodeURIComponent(
      `Gentile ${bar.owner},\n\nTi ricordiamo che l'abbonamento BarPilot (${bar.plan} - 59 €/mese) per "${bar.name}" è previsto in scadenza il ${bar.nextInvoice}.\n\nAccedi alla console del tuo bar per verificare il metodo di pagamento (Google Pay / Carta):\nhttps://bar-pilot-nine.vercel.app\n\nCordiali saluti,\nIl Team di BarPilot`
    );

    window.open(`mailto:${bar.email}?subject=${subject}&body=${body}`, "_blank");
    this.showToast(`✉️ Email di sollecito preparata per ${bar.owner} (${bar.email})`);
  }

  exportBarsCSV() {
    const header = ["ID", "Nome Bar", "Proprietario", "Email", "Telefono", "Città", "Piano", "Stato", "Prossima Fattura", "Canone"];
    const rows = this.data.bars.map(b => [
      `"${b.id}"`,
      `"${b.name}"`,
      `"${b.owner}"`,
      `"${b.email}"`,
      `"${b.phone}"`,
      `"${b.city}"`,
      `"${b.plan}"`,
      `"${b.status}"`,
      `"${b.nextInvoice}"`,
      `"${b.monthlyRevenue.toFixed(2)} €"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [header.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `barpilot_iscritti_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast("Esportazione CSV completata!");
  }

  copySupabaseSql() {
    const sql = `-- BarPilot Administration Database Schema for Supabase
CREATE TABLE IF NOT EXISTS public.bars (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  plan TEXT DEFAULT 'Pro',
  status TEXT DEFAULT 'active',
  next_invoice TEXT,
  monthly_revenue NUMERIC(10,2) DEFAULT 59.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_access TEXT,
  avatar TEXT,
  photo TEXT,
  piva TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  bar_id TEXT REFERENCES public.bars(id) ON DELETE SET NULL,
  bar_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  plan TEXT DEFAULT 'Pro',
  status TEXT DEFAULT 'paid',
  period TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on bars" ON public.bars FOR SELECT USING (true);
CREATE POLICY "Allow public insert on bars" ON public.bars FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on bars" ON public.bars FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on bars" ON public.bars FOR DELETE USING (true);
CREATE POLICY "Allow public read access on invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow public insert on invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on invoices" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on invoices" ON public.invoices FOR DELETE USING (true);`;

    navigator.clipboard.writeText(sql).then(() => {
      this.showToast("📋 Schema SQL Supabase copiato negli appunti!");
      window.open("https://supabase.com/dashboard/project/cprxxxlgaofopmogeuer/sql", "_blank");
    }).catch(() => {
      this.showToast("Errore copia, apri il file sql/admin_schema.sql nel progetto.");
    });
  }

  showToast(msg) {
    const toast = document.createElement("div");
    toast.textContent = msg;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #18202e;
      color: #fff;
      border: 1px solid #FF6B00;
      border-radius: 12px;
      padding: 12px 20px;
      font-size: 13px;
      font-weight: 700;
      z-index: 999999;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      animation: toastPop 0.2s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3200);
  }
}

// Global initialization
window.addEventListener("DOMContentLoaded", () => {
  window.adminConsole = new AdminConsole();
});
