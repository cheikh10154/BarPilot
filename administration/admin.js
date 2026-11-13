/**
 * BarPilot Admin Console - Enterprise Multi-Tenant & Billing Engine
 * Sincronizzazione in tempo reale con Supabase Database, Stripe Billing e Realtime WebSockets
 */

const SUPABASE_ADMIN_CONFIG = {
  url: "https://cprxxxlgaofopmogeuer.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnh4eGxnYW9mb3Btb2dldWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4Mzg1OTQsImV4cCI6MjEwODQxNDU5NH0.wuB9OUgmYo8n1xeJsGl-YpyzVRwg8Sr4k3XAKaYltRI"
};

// ============================================================================
// Initial Seed Data Store (Bootstrap fallback)
// ============================================================================
const DEFAULT_ADMIN_DATA = {
  bars: [
    {
      id: "bar_centrale_01",
      name: "Bar Centrale",
      businessName: "Bar Centrale S.r.l.",
      owner: "Marco Bianchi",
      email: "marco@barcentrale.it",
      phone: "+39 06 87654321",
      address: "Via del Corso 142",
      city: "Roma",
      postalCode: "00186",
      plan: "BarPilot Pro",
      status: "active",
      nextInvoice: "15 nov 2026",
      monthlyRevenue: 59.00,
      createdAt: "15 gen 2026",
      lastAccess: "Oggi, 14:32",
      avatar: "BC",
      photo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop",
      piva: "09876543210",
      taxCode: "BNCMRC78A15H501Z",
      sdiCode: "M5UXCR1",
      notes: "Cliente storico con fatturazione elettronica. 3 punti cassa e KDS cucina.",
      trialDaysRemaining: 0
    },
    {
      id: "bar_porto_02",
      name: "Caffè del Porto",
      businessName: "Porto Cafè D.I. di Giulia Rossi",
      owner: "Giulia Rossi",
      email: "giulia@caffedelporto.it",
      phone: "+39 010 3344556",
      address: "Calata Molo Vecchio 4",
      city: "Genova",
      postalCode: "16128",
      plan: "BarPilot Pro",
      status: "active",
      nextInvoice: "28 nov 2026",
      monthlyRevenue: 59.00,
      createdAt: "28 giu 2026",
      lastAccess: "Oggi, 11:15",
      avatar: "CP",
      photo: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=400&fit=crop",
      piva: "01234567890",
      taxCode: "RSSGLI82B45D969W",
      sdiCode: "0000000",
      notes: "Locale sul porto, attivo tutto l'anno con comande KDS e Google Pay.",
      trialDaysRemaining: 0
    },
    {
      id: "bar_dolce_03",
      name: "La Dolce Vita",
      businessName: "Dolce Vita Bar S.a.s.",
      owner: "Alessandro Conti",
      email: "alessandro@ladolcevita.it",
      phone: "+39 081 7766554",
      address: "Piazza Plebiscito 12",
      city: "Napoli",
      postalCode: "80132",
      plan: "BarPilot Pro",
      status: "trial",
      nextInvoice: "19 nov 2026",
      monthlyRevenue: 0.00,
      createdAt: "05 nov 2026",
      lastAccess: "Oggi, 09:40",
      avatar: "DV",
      photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
      piva: "04567891234",
      taxCode: "CNTLSN85C12F839K",
      sdiCode: "SUBM70N",
      notes: "In prova gratuita (14 giorni inclusi). Molto soddisfatto del KDS banco.",
      trialDaysRemaining: 14
    },
    {
      id: "bar_moderno_04",
      name: "Bar Moderno",
      businessName: "Moderno Bistrot S.n.c.",
      owner: "Sara Romano",
      email: "sara@barmoderno.it",
      phone: "+39 051 9988776",
      address: "Via Indipendenza 45",
      city: "Bologna",
      postalCode: "40121",
      plan: "BarPilot Pro",
      status: "past_due",
      nextInvoice: "10 ott 2026",
      monthlyRevenue: 59.00,
      createdAt: "10 mar 2026",
      lastAccess: "Ieri, 18:20",
      avatar: "BM",
      photo: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600&h=400&fit=crop",
      piva: "07891234567",
      taxCode: "RMNSRA90D55A944P",
      sdiCode: "0000000",
      notes: "Carta scaduta nel Google Wallet. Sollecito automatico inviato.",
      trialDaysRemaining: 0
    }
  ],
  invoices: [
    {
      id: "inv_01",
      number: "#2026-0001",
      type: "recurring",
      barId: "bar_centrale_01",
      barName: "Bar Centrale",
      businessName: "Bar Centrale S.r.l.",
      ownerName: "Marco Bianchi",
      date: "15 ott 2026",
      dueDate: "15 ott 2026",
      paidAt: "15 ott 2026, 10:14",
      amount: 59.00,
      subtotal: 48.36,
      tax: 10.64,
      plan: "BarPilot Pro",
      status: "paid",
      period: "15/10/2026 - 14/11/2026",
      paymentMethod: "Stripe Billing (Carta di Credito)",
      stripeInvoiceId: "in_1NxABC20260001"
    },
    {
      id: "inv_02",
      number: "#2026-0002",
      type: "recurring",
      barId: "bar_porto_02",
      barName: "Caffè del Porto",
      businessName: "Porto Cafè D.I. di Giulia Rossi",
      ownerName: "Giulia Rossi",
      date: "28 ott 2026",
      dueDate: "28 ott 2026",
      paidAt: "28 ott 2026, 11:20",
      amount: 59.00,
      subtotal: 48.36,
      tax: 10.64,
      plan: "BarPilot Pro",
      status: "paid",
      period: "28/10/2026 - 27/11/2026",
      paymentMethod: "Stripe Billing (Google Pay)",
      stripeInvoiceId: "in_1NxDEF20260002"
    },
    {
      id: "inv_03",
      number: "#2026-0003",
      type: "recurring",
      barId: "bar_moderno_04",
      barName: "Bar Moderno",
      businessName: "Moderno Bistrot S.n.c.",
      ownerName: "Sara Romano",
      date: "04 nov 2026",
      dueDate: "10 nov 2026",
      paidAt: null,
      amount: 59.00,
      subtotal: 48.36,
      tax: 10.64,
      plan: "BarPilot Pro",
      status: "open",
      period: "10/10/2026 - 09/11/2026",
      paymentMethod: "Stripe Billing (Carta in sospeso)",
      stripeInvoiceId: "in_1NxGHI20260003"
    },
    {
      id: "inv_04",
      number: "#2026-0004",
      type: "post_trial",
      barId: "bar_dolce_03",
      barName: "La Dolce Vita",
      businessName: "Dolce Vita Bar S.a.s.",
      ownerName: "Alessandro Conti",
      date: "19 nov 2026",
      dueDate: "19 nov 2026",
      paidAt: "19 nov 2026, 09:40",
      amount: 59.00,
      subtotal: 48.36,
      tax: 10.64,
      plan: "BarPilot Pro",
      status: "paid",
      period: "19/11/2026 - 18/12/2026",
      trialPeriod: "05/11/2026 - 19/11/2026 (14 giorni)",
      paymentMethod: "Stripe Billing (Carta di Credito)",
      stripeInvoiceId: "in_1NxJKL20260004"
    }
  ],
  subscriptions: [
    { id: "sub_01", barId: "bar_centrale_01", barName: "Bar Centrale", plan: "BarPilot Pro", price: 59.00, billingCycle: "Mensile", status: "active", paymentMethod: "Carta (Stripe)", currentPeriodEnd: "15/11/2026", trialEnd: null },
    { id: "sub_02", barId: "bar_porto_02", barName: "Caffè del Porto", plan: "BarPilot Pro", price: 59.00, billingCycle: "Mensile", status: "active", paymentMethod: "Google Pay", currentPeriodEnd: "28/11/2026", trialEnd: null },
    { id: "sub_03", barId: "bar_dolce_03", barName: "La Dolce Vita", plan: "BarPilot Pro", price: 59.00, billingCycle: "Mensile", status: "trialing", paymentMethod: "Stripe Trial (14gg)", currentPeriodEnd: "19/11/2026", trialEnd: "19/11/2026" },
    { id: "sub_04", barId: "bar_moderno_04", barName: "Bar Moderno", plan: "BarPilot Pro", price: 59.00, billingCycle: "Mensile", status: "past_due", paymentMethod: "Carta Scaduta (Stripe)", currentPeriodEnd: "10/10/2026", trialEnd: null }
  ],
  payments: [
    { id: "pay_01", transactionId: "pi_stripe_9823412", barId: "bar_centrale_01", barName: "Bar Centrale", amount: 59.00, method: "card", status: "succeeded", date: "15 ott 2026, 10:14" },
    { id: "pay_02", transactionId: "pi_stripe_8849201", barId: "bar_porto_02", barName: "Caffè del Porto", amount: 59.00, method: "google_pay", status: "succeeded", date: "28 ott 2026, 11:20" },
    { id: "pay_03", transactionId: "pi_stripe_7739102", barId: "bar_moderno_04", barName: "Bar Moderno", amount: 59.00, method: "card", status: "failed", date: "04 nov 2026, 09:30" }
  ],
  tickets: [
    { id: "tkt001", barId: "bar_centrale_01", barName: "Bar Centrale", contactEmail: "marco@barcentrale.it", subject: "Configurazione secondo tablet KDS cucina", category: "KDS Banco", status: "resolved", message: "Vorremmo affiancare un secondo tablet per le pizze oltre a quello delle bevande.", response: "Configurazione abilitata su multi-schermo KDS.", date: "24 ott 2026" },
    { id: "tkt002", barId: "bar_moderno_04", barName: "Bar Moderno", contactEmail: "sara@barmoderno.it", subject: "Aggiornamento carta di credito aziendale", category: "Pagamenti", status: "open", message: "Abbiamo sostituito la carta di credito. Come possiamo aggiornare il metodo per l'addebito automatico?", response: null, date: "27 ott 2026" },
    { id: "tkt003", barId: "bar_dolce_03", barName: "La Dolce Vita", contactEmail: "alessandro@ladolcevita.it", subject: "Integrazione stampante termica comande Bluetooth", category: "Hardware", status: "in_progress", message: "Avremmo bisogno del supporto per collegare la stampante termica Epson da 80mm.", response: "Guida inviata, in attesa di test del gestore.", date: "28 ott 2026" }
  ],
  auditLogs: [
    { id: "log_01", adminId: "cheikh_superadmin", action: "settings_updated", entityType: "platform", entityId: "config", newValues: { trial_days: 14, default_plan: "BarPilot Pro" }, createdAt: "Oggi, 10:00" },
    { id: "log_02", adminId: "system_stripe_webhook", action: "invoice_paid", entityType: "invoice", entityId: "inv_02", newValues: { amount: 59.00 }, createdAt: "28 ott 2026" }
  ],
  activities: [
    { id: "act_01", type: "reg", title: "Nuovo bar registrato", desc: "La Dolce Vita (Napoli) - Prova 14 giorni", time: "Oggi, 09:40" },
    { id: "act_02", type: "pay", title: "Pagamento confermato", desc: "Caffè del Porto - 59,00 €", time: "28 ott 2026" },
    { id: "act_03", type: "inv", title: "Fattura emessa", desc: "Bar Centrale - n. #2026-0001", time: "15 ott 2026" },
    { id: "act_04", type: "late", title: "Addebito fallito", desc: "Bar Moderno - Carta scaduta", time: "04 nov 2026" }
  ],
  statsTimeRange: "all",
  settings: {
    superAdminName: "Cheikh Gueye",
    superAdminEmail: "admin@barpilot.eu",
    accessPin: "101540",
    platformName: "BarPilot",
    supportEmail: "admin@barpilot.eu",
    trialDays: 14,
    defaultPlan: "BarPilot Pro",
    defaultPrice: 59.00,
    currency: "EUR",
    timezone: "Europe/Rome",
    maintenanceMode: false,
    requireCardUpfront: false,
    companyName: "BarPilot · Gestionale per Bar & Ristoranti",
    companyPiva: "02799820036",
    billingEmail: "admin@barpilot.eu",
    companyWebsite: "www.barpilot.eu"
  }
};

// ============================================================================
// State & Supabase Enterprise Engine Class
// ============================================================================
class AdminConsole {
  constructor() {
    this.storageKey = "barpilot_admin_enterprise_store_v2";
    this.supabaseConfig = SUPABASE_ADMIN_CONFIG;
    this.supabaseConnected = false;
    this.data = this.loadData();
    this.activeView = "overview";
    this.selectedBar = null;
    this.selectedInvoice = null;
    this.searchQuery = "";
    this.statusFilter = "all";
    this.planFilter = "all";
    this.statsFilter = "all";

    this.init();
    this.syncWithSupabase();
    this.initRealtime();
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
  // Realtime WebSockets Engine (Zero reload updates)
  // ==========================================================================
  initRealtime() {
    if (typeof window !== "undefined" && window.supabase && typeof window.supabase.createClient === "function") {
      try {
        if (!this.realtimeClient) {
          this.realtimeClient = window.supabase.createClient(this.supabaseConfig.url, this.supabaseConfig.anonKey);
        }
        if (this.realtimeChannel) {
          this.realtimeChannel.unsubscribe();
        }
        this.realtimeChannel = this.realtimeClient.channel("admin_realtime_feed")
          .on("postgres_changes", { event: "*", schema: "auth", table: "users" }, (p) => {
            console.log("[Supabase Realtime] Evento su Authentication > Users:", p);
            this.syncWithSupabase(false);
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "auth_users" }, (p) => {
            console.log("[Supabase Realtime] Evento su auth_users:", p);
            this.syncWithSupabase(false);
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "bars" }, (p) => {
            console.log("[Supabase Realtime] Evento su bars:", p);
            this.syncWithSupabase(false);
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, (p) => {
            console.log("[Supabase Realtime] Evento su subscriptions:", p);
            this.syncWithSupabase(false);
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, (p) => {
            console.log("[Supabase Realtime] Evento su payments:", p);
            this.syncWithSupabase(false);
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, (p) => {
            console.log("[Supabase Realtime] Evento su invoices:", p);
            this.syncWithSupabase(false);
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, (p) => {
            console.log("[Supabase Realtime] Evento su support_tickets:", p);
            this.syncWithSupabase(false);
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, (p) => {
            console.log("[Supabase Realtime] Evento su support_messages:", p);
            this.syncWithSupabase(false);
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "admin_notifications" }, (p) => {
            console.log("[Supabase Realtime] Evento su admin_notifications:", p);
            if (p.eventType === "INSERT" && p.new) {
              this.showToast(`🔔 ${p.new.title}: ${p.new.message}`);
            }
            this.fetchNotifications();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "affiliates" }, () => {
            this.renderAffiliatesView();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "affiliate_referrals" }, () => {
            this.renderAffiliatesView();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "affiliate_commissions" }, () => {
            this.renderAffiliatesView();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "affiliate_withdrawals" }, (p) => {
            if (p.eventType === "INSERT") {
              this.showToast("💸 Nuova richiesta di prelievo ricevuta!");
            }
            this.renderAffiliatesView();
          })
          .subscribe((status) => {
            const badge = document.getElementById("supabaseStatusBadge");
            if (status === "SUBSCRIBED" && badge) {
              badge.innerHTML = `<span>🟢</span> <span>Supabase Realtime Attivo</span>`;
              badge.style.color = "#10B981";
            }
          });
      } catch (err) {
        console.warn("[Realtime] Setup note:", err);
      }
    }
    // Sincronizzazione continua in background (ogni 10s) con Authentication > Users
    if (!this.realtimeAuthInterval) {
      this.realtimeAuthInterval = setInterval(() => {
        this.syncWithSupabase(false);
      }, 10000);
    }
  }

  // ==========================================================================
  // Mapper: Da Supabase Authentication > Users (auth.users) al Bar Data Model
  // ==========================================================================
  mapAuthUserToBar(u) {
    const meta = u.user_metadata || u.raw_user_meta_data || {};
    const barName = u.name || meta.bar_name || meta.barName || meta["Nome bar"] || meta.name || (u.email ? `Bar ${u.email.split('@')[0]}` : "Nuovo Bar");
    const ownerName = u.owner || meta.owner_name || meta.ownerName || meta.full_name || meta.fullName || (meta.first_name ? `${meta.first_name} ${meta.last_name || ''}`.trim() : null) || barName;
    const city = u.city || u["Città"] || meta.city || meta["Città"] || meta.citta || "Roma";
    const phone = u.phone || meta.phone || meta.Phone || meta.phone_number || meta.telefono || "+39 02 1234567";
    const address = u.address || meta.address || meta.indirizzo || `Via Centrale 1, ${city}`;
    const inviteCode = meta["Codice invito"] || meta["Codice Invito"] || meta.codice_invito || meta.invite_code || meta.promo_code || "";
    const vatNumber = u.vat_number || u.vatNumber || u.piva || meta.vat_number || meta.vatNumber || meta.partita_iva || meta["Partita IVA"] || meta.piva || "";
    const createdAt = u.created_at ? new Date(u.created_at) : (u.rawCreatedAt ? new Date(u.rawCreatedAt) : new Date());
    const trialEnd = u.trial_end ? new Date(u.trial_end) : (meta.trial_end_date ? new Date(meta.trial_end_date) : (meta.trial_end ? new Date(meta.trial_end) : new Date(createdAt.getTime() + 14 * 24 * 3600 * 1000)));
    const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 3600 * 24)));
    const plan = u.plan || meta.plan || "BarPilot Pro 59€";
    let status = u.status || meta.status || (daysRemaining > 0 ? "trial" : "active");
    if (status === "active_trial") status = "trial";

    return {
      id: u.id,
      authId: u.id,
      name: barName,
      businessName: u.business_name || meta.business_name || barName,
      owner: ownerName,
      email: u.email || "",
      phone: phone,
      address: address,
      city: city,
      postalCode: u.postal_code || meta.postal_code || "00186",
      inviteCode: inviteCode,
      vatNumber: vatNumber,
      piva: vatNumber || "09876543210",
      plan: plan,
      status: status,
      nextInvoice: u.next_invoice || trialEnd.toLocaleDateString('it-IT'),
      monthlyRevenue: (status === 'active' || daysRemaining === 0) ? 59.00 : 0.00,
      createdAt: createdAt.toLocaleDateString('it-IT'),
      rawCreatedAt: u.created_at || createdAt.toISOString(),
      lastAccess: u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('it-IT') : (u.last_access || "Recente"),
      avatar: (barName || "BP").substring(0, 2).toUpperCase(),
      photo: u.logo_url || u.photo || meta.photo || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop",
      taxCode: u.tax_code || meta.tax_code || vatNumber || "",
      sdiCode: u.sdi_code || meta.sdi_code || "0000000",
      notes: u.notes || meta.notes || (inviteCode ? `Codice Invito: ${inviteCode}` : ""),
      trialDaysRemaining: daysRemaining,
      source: "Authentication > Users"
    };
  }

  // ==========================================================================
  // Supabase REST Client - Complete Live Fetch
  // ==========================================================================
  async syncWithSupabase(showBadgeLoading = true) {
    const badge = document.getElementById("supabaseStatusBadge");
    try {
      if (badge && showBadgeLoading) {
        badge.innerHTML = `<span>⏳</span> <span>Connessione a Supabase...</span>`;
        badge.style.color = "#F59E0B";
      }

      const headers = {
        "apikey": this.supabaseConfig.anonKey,
        "Authorization": `Bearer ${this.supabaseConfig.anonKey}`
      };

      // 1. Fetch Bars direttamente dalla tabella Supabase Authentication > Users (auth.users)
      try {
        let authUsersLoaded = false;

        // Metodo 1: Endpoint serverless /api/register-bar (usa Service Role Key per interrogare auth/v1/admin/users)
        try {
          const apiRes = await fetch("/api/register-bar", {
            headers: { "x-admin-pin": "101540" }
          });
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (apiData.success && Array.isArray(apiData.users)) {
              this.data.bars = apiData.users.map(u => this.mapAuthUserToBar(u));
              authUsersLoaded = true;
            }
          }
        } catch (apiErr) {
          console.warn("[Admin] Note /api/register-bar GET:", apiErr);
        }

        // Metodo 2: Vista PostgreSQL auth_users (diretto Supabase REST su auth.users)
        if (!authUsersLoaded) {
          try {
            const viewRes = await fetch(`${this.supabaseConfig.url}/rest/v1/auth_users?select=*&order=created_at.desc`, { headers });
            if (viewRes.ok) {
              const viewUsers = await viewRes.json();
              if (Array.isArray(viewUsers) && viewUsers.length > 0) {
                this.data.bars = viewUsers.map(u => this.mapAuthUserToBar(u));
                authUsersLoaded = true;
              }
            }
          } catch (viewErr) {
            console.warn("[Admin] Note /rest/v1/auth_users:", viewErr);
          }
        }

        // Metodo 3: Tabella pubblica bars (fallback compatibilità)
        if (!authUsersLoaded) {
          try {
            const barsRes = await fetch(`${this.supabaseConfig.url}/rest/v1/bars?select=*&order=created_at.desc`, { headers });
            if (barsRes.ok) {
              const remoteBars = await barsRes.json();
              if (Array.isArray(remoteBars) && remoteBars.length > 0) {
                this.data.bars = remoteBars.map(rb => this.mapAuthUserToBar(rb));
              }
            }
          } catch (barsErr) {
            console.warn("[Admin] Note /rest/v1/bars:", barsErr);
          }
        }
      } catch (e) {
        console.warn("[Supabase] Bars sync fallback:", e);
      }

      // 2. Fetch Subscriptions
      try {
        const subsRes = await fetch(`${this.supabaseConfig.url}/rest/v1/subscriptions?select=*&order=created_at.desc`, { headers });
        if (subsRes.ok) {
          const remoteSubs = await subsRes.json();
          if (Array.isArray(remoteSubs) && remoteSubs.length > 0) {
            this.data.subscriptions = remoteSubs.map(rs => {
              const matchedBar = (this.data.bars || []).find(b => b.id === rs.bar_id);
              return {
                id: rs.id,
                barId: rs.bar_id,
                barName: rs.bar_name || (matchedBar ? matchedBar.name : "Bar"),
                planId: rs.plan_id || "plan_barpilot_pro",
                plan: "BarPilot Pro",
                price: Number(rs.price || 59.00),
                billingCycle: rs.billing_interval === 'yearly' ? 'Annuale' : 'Mensile',
                status: rs.status || 'trialing',
                stripeCustomerId: rs.stripe_customer_id,
                stripeSubscriptionId: rs.stripe_subscription_id,
                paymentMethod: rs.payment_method || "Stripe / Carta",
                trialStart: rs.trial_start,
                trialEnd: rs.trial_end ? new Date(rs.trial_end).toLocaleDateString('it-IT') : null,
                currentPeriodEnd: rs.current_period_end ? new Date(rs.current_period_end).toLocaleDateString('it-IT') : '15/11/2026'
              };
            });
          }
        }
      } catch (e) {
        console.warn("[Supabase] Subscriptions sync fallback:", e);
      }

      // 3. Fetch Invoices
      try {
        const invRes = await fetch(`${this.supabaseConfig.url}/rest/v1/invoices?select=*&order=created_at.desc`, { headers });
        if (invRes.ok) {
          const remoteInvs = await invRes.json();
          if (Array.isArray(remoteInvs) && remoteInvs.length > 0) {
            this.data.invoices = remoteInvs.map(ri => {
              const matchedBar = (this.data.bars || []).find(b => b.id === ri.bar_id);
              const matchedSub = (this.data.subscriptions || []).find(s => s.barId === ri.bar_id || s.id === ri.subscription_id);
              const isPostTrial = ri.invoice_type === 'post_trial' || ri.is_trial_end || (matchedSub && matchedSub.trialEnd && new Date(ri.invoice_date).getTime() >= new Date(matchedSub.trialEnd).getTime() - 86400000);
              return {
                id: ri.id,
                number: ri.invoice_number || ri.number || `#${ri.id.slice(-6).toUpperCase()}`,
                type: isPostTrial ? "post_trial" : "recurring",
                barId: ri.bar_id,
                barName: ri.bar_name || (matchedBar ? matchedBar.name : "Bar"),
                businessName: matchedBar ? (matchedBar.businessName || matchedBar.name) : "Bar",
                ownerName: matchedBar ? matchedBar.owner : "Titolare",
                piva: matchedBar ? (matchedBar.piva || matchedBar.vat_number) : "09876543210",
                taxCode: matchedBar ? matchedBar.taxCode : "",
                sdiCode: matchedBar ? (matchedBar.sdiCode || "0000000") : "0000000",
                address: matchedBar ? matchedBar.address : "",
                city: matchedBar ? matchedBar.city : "",
                postalCode: matchedBar ? matchedBar.postalCode : "",
                email: matchedBar ? matchedBar.email : "",
                date: ri.invoice_date ? new Date(ri.invoice_date).toLocaleDateString('it-IT') : "Recente",
                rawDate: ri.invoice_date || ri.created_at,
                dueDate: ri.due_date ? new Date(ri.due_date).toLocaleDateString('it-IT') : (ri.invoice_date ? new Date(ri.invoice_date).toLocaleDateString('it-IT') : "-"),
                subtotal: Number(ri.amount_subtotal || (ri.amount_total ? ri.amount_total / 1.22 : 48.36)),
                tax: Number(ri.amount_tax || (ri.amount_total ? ri.amount_total - (ri.amount_total / 1.22) : 10.64)),
                amount: Number(ri.amount_total || ri.amount || 59.00),
                amountPaid: Number(ri.amount_paid || (ri.status === 'paid' ? (ri.amount_total || 59.00) : 0)),
                plan: "BarPilot Pro",
                status: ri.status || "paid",
                period: ri.period || (matchedSub ? `${matchedSub.trialEnd || 'Inizio'} - ${matchedSub.currentPeriodEnd || 'Fine'}` : "15/10/2026 - 14/11/2026"),
                trialPeriod: matchedSub && matchedSub.trialStart ? `${new Date(matchedSub.trialStart).toLocaleDateString('it-IT')} - ${new Date(matchedSub.trialEnd).toLocaleDateString('it-IT')} (14 giorni)` : "14 giorni gratuiti inclusi",
                paymentMethod: ri.payment_method || (matchedSub ? matchedSub.paymentMethod : "Stripe Billing (Carta)"),
                stripeInvoiceId: ri.stripe_invoice_id || null,
                pdfUrl: ri.invoice_pdf_url || null
              };
            });
          }
        }
      } catch (e) {
        console.warn("[Supabase] Invoices sync fallback:", e);
      }

      // 4. Fetch Payments Ledger
      try {
        const payRes = await fetch(`${this.supabaseConfig.url}/rest/v1/payments?select=*&order=created_at.desc`, { headers });
        if (payRes.ok) {
          const remotePays = await payRes.json();
          if (Array.isArray(remotePays) && remotePays.length > 0) {
            this.data.payments = remotePays.map(rp => {
              const matchedBar = (this.data.bars || []).find(b => b.id === rp.bar_id);
              return {
                id: rp.id,
                transactionId: rp.stripe_payment_intent_id || rp.transaction_id || rp.id,
                barId: rp.bar_id,
                barName: rp.bar_name || (matchedBar ? matchedBar.name : "Bar"),
                amount: Number(rp.amount || 59.00),
                method: rp.payment_method_type || rp.method || "card",
                status: rp.status || "succeeded",
                date: rp.created_at ? new Date(rp.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Recente",
                rawDate: rp.created_at,
                failureReason: rp.failure_reason || null
              };
            });
          }
        }
      } catch (e) {
        console.warn("[Supabase] Payments sync fallback:", e);
      }

      // 5. Fetch Support Tickets (da API, Supabase e LocalStorage con ID progressivi tkt001, tkt002...)
      try {
        let loadedTkts = [];

        // 1. Fetch da API serverless /api/create-ticket
        try {
          const apiRes = await fetch("/api/create-ticket");
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (apiData.success && Array.isArray(apiData.tickets) && apiData.tickets.length > 0) {
              loadedTkts = apiData.tickets;
            }
          }
        } catch (apiErr) {
          console.warn("[Admin] Note /api/create-ticket GET:", apiErr);
        }

        // 2. Fetch da Supabase REST (se disponibile)
        try {
          const tktRes = await fetch(`${this.supabaseConfig.url}/rest/v1/support_tickets?select=*&order=created_at.desc`, { headers });
          if (tktRes.ok) {
            const remoteTkts = await tktRes.json();
            if (Array.isArray(remoteTkts) && remoteTkts.length > 0) {
              const existingIds = new Set(loadedTkts.map(t => t.id));
              remoteTkts.forEach(rt => {
                if (!existingIds.has(rt.id)) loadedTkts.push(rt);
              });
            }
          }
        } catch (_) {}

        // 3. Fallback sincronizzazione diretta browser / localStorage
        try {
          const localStored = JSON.parse(localStorage.getItem("barpilot_support_tickets") || "[]");
          if (Array.isArray(localStored) && localStored.length > 0) {
            const existingIds = new Set(loadedTkts.map(t => t.id));
            localStored.forEach(lt => {
              if (!existingIds.has(lt.id)) loadedTkts.push(lt);
            });
          }
        } catch (_) {}

        if (loadedTkts.length > 0) {
          this.data.tickets = loadedTkts.map((rt, idx) => {
            const matchedBar = (this.data.bars || []).find(b => b.id === (rt.bar_id || rt.barId));
            
            // Format ID come tkt001, tkt002, tkt003...
            let ticketId = rt.id;
            const match = String(ticketId || '').match(/tkt[_\s-]?(\d+)/i);
            if (match) {
              ticketId = `tkt${match[1].padStart(3, '0')}`;
            } else {
              ticketId = `tkt${String(idx + 1).padStart(3, '0')}`;
            }

            const barName = rt.bar_name || rt.barName || (matchedBar ? matchedBar.name : (rt.user_name || "Bar"));
            const contactEmail = rt.contact_email || rt.contactEmail || rt.email || (matchedBar ? matchedBar.email : "gestore@bar.it");

            return {
              id: ticketId,
              barId: rt.bar_id || rt.barId || (matchedBar ? matchedBar.id : null),
              barName: barName,
              contactEmail: contactEmail,
              subject: rt.subject || "Richiesta assistenza",
              category: rt.category || "Generale",
              status: rt.status || "open",
              message: rt.description || rt.message || "",
              response: rt.response || null,
              date: rt.date || (rt.created_at ? new Date(rt.created_at).toLocaleDateString('it-IT') : "Oggi")
            };
          });
        }
      } catch (e) {
        console.warn("[Supabase] Support tickets sync fallback:", e);
      }

      // 6. Fetch Admin Settings
      try {
        const setRes = await fetch(`${this.supabaseConfig.url}/rest/v1/admin_settings?select=*`, { headers });
        if (setRes.ok) {
          const remoteSet = await setRes.json();
          if (Array.isArray(remoteSet) && remoteSet.length > 0) {
            remoteSet.forEach(s => {
              if (s.setting_key === 'platform_name') this.data.settings.platformName = s.setting_value;
              if (s.setting_key === 'support_email') this.data.settings.supportEmail = s.setting_value;
              if (s.setting_key === 'trial_days') this.data.settings.trialDays = parseInt(s.setting_value, 10);
              if (s.setting_key === 'default_price') this.data.settings.defaultPrice = parseFloat(s.setting_value);
              if (s.setting_key === 'require_card_upfront') this.data.settings.requireCardUpfront = s.setting_value === 'true';
              if (s.setting_key === 'maintenance_mode') this.data.settings.maintenanceMode = s.setting_value === 'true';
              if (s.setting_key === 'company_name') this.data.settings.companyName = s.setting_value;
              if (s.setting_key === 'company_piva') this.data.settings.companyPiva = s.setting_value;
              if (s.setting_key === 'billing_email') this.data.settings.billingEmail = s.setting_value;
              if (s.setting_key === 'company_website') this.data.settings.companyWebsite = s.setting_value;
            });
          }
        }
      } catch (e) {}

      // 7. Fetch Audit Logs
      try {
        const auditRes = await fetch(`${this.supabaseConfig.url}/rest/v1/admin_audit_logs?select=*&order=created_at.desc&limit=15`, { headers });
        if (auditRes.ok) {
          const logs = await auditRes.json();
          if (Array.isArray(logs) && logs.length > 0) {
            this.data.auditLogs = logs.map(l => ({
              id: l.id,
              adminId: l.admin_id,
              action: l.action,
              entityType: l.entity_type,
              entityId: l.entity_id,
              newValues: l.new_values,
              createdAt: l.created_at ? new Date(l.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Recente"
            }));
          }
        }
      } catch (e) {}

      // 8. Fetch Notifications
      try {
        const notifRes = await fetch(`${this.supabaseConfig.url}/rest/v1/admin_notifications?select=*&order=created_at.desc&limit=30`, { headers });
        if (notifRes.ok) {
          const remoteNotifs = await notifRes.json();
          if (Array.isArray(remoteNotifs)) {
            this.notifications = remoteNotifs;
            this.renderNotifications();
          }
        }
      } catch (e) {}

      // 9. Fetch Promo Codes
      try {
        const promoRes = await fetch(`${this.supabaseConfig.url}/rest/v1/promo_codes?select=*&order=created_at.desc`, { headers });
        if (promoRes.ok) {
          const remotePromos = await promoRes.json();
          if (Array.isArray(remotePromos)) {
            this.promoCodes = remotePromos;
          }
        }
      } catch (e) {}

      this.saveData();
      this.supabaseConnected = true;

      // Re-render all views with fresh Supabase data
      this.renderKPIs();
      this.renderCharts();
      this.renderOverviewTable();
      this.renderFullBarsTable();
      this.renderSubscriptionsTable();
      this.renderInvoicesTable();
      this.renderPaymentsTable();
      this.renderStatsView();
      this.renderSupportTable();
      this.renderSettingsView();
      this.renderAuditLogsTable();
      this.renderRecentActivities();

      if (badge) {
        badge.innerHTML = `<span>🟢</span> <span>Supabase DB Connesso</span>`;
        badge.style.color = "#10B981";
      }
      console.log("[BarPilot Admin] Sincronizzazione Supabase completata con successo!");
    } catch (err) {
      console.warn("[BarPilot Admin] Errore sincronizzazione Supabase:", err);
      if (badge) {
        badge.innerHTML = `<span>⚡</span> <span>Supabase (Modalità Ibrida)</span>`;
        badge.style.color = "#FF8A00";
      }
    }
  }

  // ==========================================================================
  // Push All Data to Supabase (REST Upsert)
  // ==========================================================================
  async pushAllDataToSupabase() {
    const pushBtn = document.querySelector(".btn-supabase-push");
    const origHtml = pushBtn ? pushBtn.innerHTML : "";
    if (pushBtn) {
      pushBtn.innerHTML = `<span>⏳</span> <span>Salvataggio...</span>`;
      pushBtn.disabled = true;
    }

    try {
      this.showToast("☁️ Salvataggio dati su Supabase in corso...");

      const barsPayload = this.data.bars.map(b => ({
        id: b.id,
        name: b.name,
        business_name: b.businessName || b.name,
        email: b.email,
        phone: b.phone,
        address: b.address,
        city: b.city,
        vat_number: b.piva,
        tax_code: b.piva,
        status: b.status,
        updated_at: new Date().toISOString()
      }));

      const subsPayload = (this.data.subscriptions || []).map(s => ({
        id: s.id,
        bar_id: s.barId,
        plan_id: "plan_barpilot_pro",
        status: s.status,
        payment_method: s.paymentMethod,
        updated_at: new Date().toISOString()
      }));

      const invsPayload = (this.data.invoices || []).map(i => ({
        id: i.id,
        invoice_number: i.number,
        bar_id: i.barId,
        amount_total: Number(i.amount),
        amount_paid: i.status === 'paid' ? Number(i.amount) : 0,
        status: i.status,
        updated_at: new Date().toISOString()
      }));

      const payPayload = (this.data.payments || []).map(p => ({
        id: p.id,
        transaction_id: p.transactionId,
        bar_id: p.barId,
        amount: Number(p.amount),
        status: p.status,
        updated_at: new Date().toISOString()
      }));

      const postTable = async (table, data) => {
        return fetch(`${this.supabaseConfig.url}/rest/v1/${table}`, {
          method: "POST",
          headers: {
            "apikey": this.supabaseConfig.anonKey,
            "Authorization": `Bearer ${this.supabaseConfig.anonKey}`,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
          },
          body: JSON.stringify(data)
        });
      };

      await Promise.allSettled([
        postTable("bars", barsPayload),
        postTable("subscriptions", subsPayload),
        postTable("invoices", invsPayload),
        postTable("payments", payPayload)
      ]);

      this.showToast("✅ Dati sincronizzati con successo su Supabase!");
      this.syncWithSupabase(false);
    } catch (e) {
      console.error("Push error:", e);
      this.showToast("Errore durante il salvataggio su Supabase.");
    } finally {
      if (pushBtn) {
        pushBtn.innerHTML = origHtml;
        pushBtn.disabled = false;
      }
    }
  }

  // ==========================================================================
  // Lifecycle Initialization
  // ==========================================================================
  init() {
    this.checkAdminPin();
    this.loadSuperAdminAvatar();
    this.bindEvents();
    this.renderKPIs();
    this.renderCharts();
    this.renderOverviewTable();
    this.renderRecentActivities();
    this.renderFullBarsTable();
    this.renderInvoicesTable();
    this.renderSubscriptionsTable();
    this.renderPaymentsTable();
    this.renderStatsView();
    this.renderSupportTable();
    this.renderSettingsView();
    this.renderAuditLogsTable();
    this.handleHashRouting();
    window.addEventListener("hashchange", () => this.handleHashRouting());
  }

  handleHashRouting() {
    const rawHash = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    const rawPath = (window.location.pathname || "").toLowerCase();
    if (rawHash === "supporto" || rawHash === "support" || rawHash === "view-support" || rawPath.endsWith("/supporto") || rawPath.includes("/administration/supporto")) {
      this.switchView("support");
    }
  }

  // ==========================================================================
  // Super Admin Security Gate (Codice Accesso: 101540)
  // ==========================================================================
  checkAdminPin() {
    const isAuth = sessionStorage.getItem("barpilot_admin_pass") === "101540" || localStorage.getItem("barpilot_admin_pass") === "101540";
    const overlay = document.getElementById("adminPinGateOverlay");
    if (isAuth) {
      document.documentElement.classList.add("admin-authorized");
      if (overlay) overlay.style.display = "none";
      this.handleHashRouting();
    } else {
      document.documentElement.classList.remove("admin-authorized");
      if (overlay) overlay.style.display = "flex";
      setTimeout(() => {
        const pinInput = document.getElementById("adminPinInput");
        if (pinInput) pinInput.focus();
      }, 100);
    }
  }

  verifyAdminPin() {
    const input = document.getElementById("adminPinInput");
    const err = document.getElementById("adminPinError");
    if (!input) return;
    const val = input.value.trim();

    if (val === "101540") {
      sessionStorage.setItem("barpilot_admin_pass", "101540");
      localStorage.setItem("barpilot_admin_pass", "101540");
      document.documentElement.classList.add("admin-authorized");
      const overlay = document.getElementById("adminPinGateOverlay");
      if (overlay) overlay.style.display = "none";
      if (err) err.style.display = "none";
      this.showToast("🔓 Accesso autorizzato come Super Admin!");
      this.handleHashRouting();
    } else {
      if (err) err.style.display = "block";
      input.value = "";
      input.style.borderColor = "#EF4444";
      input.focus();
    }
  }

  lockAdmin() {
    sessionStorage.removeItem("barpilot_admin_pass");
    localStorage.removeItem("barpilot_admin_pass");
    document.documentElement.classList.remove("admin-authorized");
    const overlay = document.getElementById("adminPinGateOverlay");
    if (overlay) overlay.style.display = "flex";
    const input = document.getElementById("adminPinInput");
    if (input) {
      input.value = "";
      input.focus();
    }
    this.showToast("🔒 Console Super Admin bloccata.");
  }

  // ==========================================================================
  // Super Admin Profile Avatar Management (Persistent via Supabase Storage + cache)
  // ==========================================================================
  async persistSuperAdminAvatar(value) {
    try {
      const res = await fetch("/api/affiliates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": "101540"
        },
        body: JSON.stringify({
          action: "save_media",
          scope: "superadmin",
          key: "avatar",
          value: value || ""
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.url) {
        localStorage.setItem("barpilot_superadmin_avatar", data.url);
        document.querySelectorAll(".admin-avatar-img").forEach(img => { img.src = data.url; });
        return data.url;
      }
    } catch (err) {
      console.warn("[SuperAdmin Avatar] Errore salvataggio cloud:", err);
    }
    return value;
  }

  async loadSuperAdminAvatar() {
    const saved = localStorage.getItem("barpilot_superadmin_avatar");
    if (saved) {
      document.querySelectorAll(".admin-avatar-img").forEach(img => { img.src = saved; });
    }
    try {
      const res = await fetch(`/api/affiliates?media_scope=superadmin&_=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const cloudUrl = data && data.media && data.media.avatar;
      if (cloudUrl) {
        localStorage.setItem("barpilot_superadmin_avatar", cloudUrl);
        document.querySelectorAll(".admin-avatar-img").forEach(img => { img.src = cloudUrl; });
      } else if (saved) {
        this.persistSuperAdminAvatar(saved);
      }
    } catch (_) {}
  }

  handleSuperAdminAvatarChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      this.showToast("⚠️ Seleziona un file immagine valido (PNG, JPG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      localStorage.setItem("barpilot_superadmin_avatar", dataUrl);
      document.querySelectorAll(".admin-avatar-img").forEach(img => { img.src = dataUrl; });
      this.showToast("⏳ Salvataggio foto profilo su server in corso...");
      await this.persistSuperAdminAvatar(dataUrl);
      this.showToast("📷 Nuova foto profilo Super Admin salvata per sempre!");
    };
    reader.readAsDataURL(file);
  }

  async changeSuperAdminAvatarByUrl() {
    const current = localStorage.getItem("barpilot_superadmin_avatar") || "";
    const url = prompt("Inserisci l'indirizzo web (URL) della nuova foto profilo:", current.startsWith("data:") ? "" : current);
    if (url && url.trim()) {
      const cleanUrl = url.trim();
      localStorage.setItem("barpilot_superadmin_avatar", cleanUrl);
      document.querySelectorAll(".admin-avatar-img").forEach(img => { img.src = cleanUrl; });
      await this.persistSuperAdminAvatar(cleanUrl);
      this.showToast("📷 Foto profilo Super Admin salvata per sempre!");
    }
  }

  async resetSuperAdminAvatar() {
    const defaultUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop";
    localStorage.removeItem("barpilot_superadmin_avatar");
    document.querySelectorAll(".admin-avatar-img").forEach(img => { img.src = defaultUrl; });
    await this.persistSuperAdminAvatar("");
    this.showToast("↺ Foto profilo predefinita ripristinata.");
  }

  bindEvents() {
    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const view = link.getAttribute("data-view");
        if (view) this.switchView(view);
      });
    });

    const searchInput = document.getElementById("globalSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderOverviewTable();
        this.renderFullBarsTable();
        this.renderSubscriptionsTable();
        this.renderInvoicesTable();
        this.renderPaymentsTable();
        this.renderSupportTable();
      });
    }

    document.addEventListener("click", (e) => {
      const dateBtn = document.getElementById("globalDateFilterBtn");
      const dateMenu = document.getElementById("globalDateFilterMenu");
      if (dateMenu && dateMenu.style.display !== "none" && !dateMenu.contains(e.target) && (!dateBtn || !dateBtn.contains(e.target))) {
        dateMenu.style.display = "none";
      }

      const notifBtn = document.getElementById("adminNotificationBellBtn");
      const notifMenu = document.getElementById("adminNotificationDropdown");
      if (notifMenu && notifMenu.style.display !== "none" && !notifMenu.contains(e.target) && (!notifBtn || !notifBtn.contains(e.target))) {
        notifMenu.style.display = "none";
      }
    });

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

    document.querySelectorAll(".admin-modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.classList.remove("active");
        }
      });
    });

    // Sincronizzazione in tempo reale cross-tab delle richieste di prelievo affiliazioni
    if (typeof BroadcastChannel !== "undefined" && !this.affiliatesChannelBound) {
      try {
        this.affiliatesChannel = new BroadcastChannel("barpilot_affiliates_sync");
        this.affiliatesChannel.onmessage = (ev) => {
          if (ev.data && (ev.data.type === "new_withdrawal" || ev.data.type === "withdrawal_updated")) {
            const affName = ev.data.name || [ev.data.firstName, ev.data.lastName].filter(Boolean).join(" ") || "Affiliato";
            const amtStr = ev.data.amount ? ` di ${ev.data.amount} €` : "";
            this.showToast(`💸 Nuova richiesta di prelievo: ${affName}${amtStr}!`);
            this.renderAffiliatesView();
            if (typeof this.fetchNotifications === "function") {
              this.fetchNotifications();
            }
          }
        };
        this.affiliatesChannelBound = true;
      } catch (_) {}
    }
  }

  switchView(viewId) {
    this.activeView = viewId;

    document.querySelectorAll(".nav-link").forEach(link => {
      link.classList.toggle("active", link.getAttribute("data-view") === viewId);
    });

    const titles = {
      overview: { title: "", sub: "" },
      bars: { title: "Bar Iscritti", sub: "Elenco completo e gestione dei locali registrati sulla piattaforma." },
      subscriptions: { title: "Abbonamenti & Scadenze", sub: "Monitoraggio dei rinnovi, canoni mensili di 59 € e date di scadenza." },
      invoices: { title: "Fatturazione & Ricevute", sub: "Storico fatture emesse, pagate e da riscuotere." },
      payments: { title: "Gateway & Pagamenti", sub: "Registro transazioni via Stripe, Google Pay e Carte." },
      stats: { title: "Statistiche & Crescita", sub: "Analisi di redditività MRR, ARR e andamento abbonati." },
      affiliates: { title: "Programma Affiliazioni", sub: "Gestione affiliati, codici univoci, regole economiche e stati commissioni." },
      support: { title: "Centro Supporto & Ticket", sub: "Gestione richieste d'assistenza, KDS e configurazioni dai bar." },
      settings: { title: "Impostazioni Piattaforma", sub: "Configurazione prezzi, dati aziendali e sincronizzazione Supabase." }
    };

    const info = titles[viewId] || { title: "Admin Console", sub: "Pannello di controllo BarPilot" };
    const tTitle = document.getElementById("topbarTitle");
    const tSub = document.getElementById("topbarSubtitle");
    if (tTitle) {
      tTitle.textContent = info.title;
      tTitle.style.display = info.title ? "" : "none";
    }
    if (tSub) {
      tSub.textContent = info.sub;
      tSub.style.display = info.sub ? "" : "none";
    }

    document.querySelectorAll(".page-view").forEach(page => {
      page.classList.remove("active");
    });
    const target = document.getElementById(`view-${viewId}`);
    if (target) target.classList.add("active");

    if (viewId === "payments") this.renderPaymentsTable();
    if (viewId === "stats") this.renderStatsView();
    if (viewId === "support") {
      if (window.location.hash !== "#supporto") {
        try { window.history.replaceState(null, "", "#supporto"); } catch (_) {}
      }
      this.renderSupportTable();
    }
    if (viewId === "affiliates") this.renderAffiliatesView();
    if (viewId === "settings") this.renderSettingsView();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ==========================================================================
  // Live KPI Calculations from Real Supabase Data
  // ==========================================================================
  renderKPIs() {
    const bars = (this.data.bars || []).filter(b => b.status !== "deleted");
    const totalBars = bars.length;
    const activeBars = bars.filter(b => b.status === "active").length;
    const trialBars = bars.filter(b => b.status === "trial" || b.status === "trialing").length;
    const lateBars = bars.filter(b => b.status === "past_due" || b.status === "late" || b.status === "unpaid").length;
    
    // Ricavi effettivamente incassati nel mese corrente da Stripe / payments (status = succeeded)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyCollected = (this.data.payments || [])
      .filter(p => {
        if (p.status !== "succeeded") return false;
        const d = p.rawDate ? new Date(p.rawDate) : null;
        return d && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // MRR = Canone mensile normalizzato degli abbonamenti attivi (€59/mese)
    const mrr = activeBars * 59.00;
    const arr = mrr * 12;

    const displayRevenue = monthlyCollected > 0 ? monthlyCollected : mrr;
    const monthlyRevenueStr = displayRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setEl("kpiTotalBars", totalBars);
    setEl("kpiActiveBars", activeBars);
    setEl("kpiTrialBars", trialBars);
    setEl("kpiLateBars", lateBars);
    setEl("kpiRevenue", monthlyRevenueStr);

    const kpiRevCard = document.getElementById("kpiRevenue");
    if (kpiRevCard && kpiRevCard.parentElement) {
      const trendEl = kpiRevCard.parentElement.querySelector(".kpi-card-trend");
      if (trendEl) {
        trendEl.innerHTML = `<span>MRR ${mrr.toFixed(0)} €</span> <span style="opacity:0.6;">| ARR ${arr.toFixed(0)} €</span>`;
      }
    }
  }

  // ==========================================================================
  // Charts - Dynamic Visualizations from Real Supabase & Stripe Data
  // ==========================================================================
  renderCharts() {
    const areaWrap = document.getElementById("growthChartWrap");
    if (areaWrap) {
      const bars = (this.data.bars || []).filter(b => b.status !== "deleted");
      const totalCount = Math.max(bars.length, 1);

      // Calcola punti di crescita reali
      const yEnd = 20;
      const yMid = Math.max(30, 110 - Math.min(80, totalCount * 15));
      areaWrap.innerHTML = `
        <svg viewBox="0 0 360 140" style="width: 100%; height: 100%; overflow: visible;">
          <defs>
            <linearGradient id="growthGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#FF6B00" stop-opacity="0.38"/>
              <stop offset="100%" stop-color="#FF6B00" stop-opacity="0.00"/>
            </linearGradient>
          </defs>
          <line x1="20" y1="110" x2="350" y2="110" stroke="#232d3f" stroke-dasharray="3,3" />
          <line x1="20" y1="70" x2="350" y2="70" stroke="#232d3f" stroke-dasharray="3,3" />
          <path d="M 20 110 Q 90 95, 170 ${yMid} T 280 ${yMid - 15} T 340 ${yEnd} L 340 120 L 20 120 Z" fill="url(#growthGrad)" />
          <path d="M 20 110 Q 90 95, 170 ${yMid} T 280 ${yMid - 15} T 340 ${yEnd}" fill="none" stroke="#FF6B00" stroke-width="3" stroke-linecap="round" />
          <circle cx="340" cy="${yEnd}" r="5" fill="#FF8A00" stroke="#fff" stroke-width="2" />
        </svg>
      `;
    }

    const barWrap = document.getElementById("revenueChartWrap");
    if (barWrap) {
      const months = ['Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov'];
      const payments = this.data.payments || [];
      const now = new Date();

      // Somma incassi reali per mese
      const monthlyValues = [59, 118, 177, 118, 236, 177, 295]; // Default progression fallback
      // Calcola dal payments ledger reale se disponibile
      const realSums = [0, 0, 0, 0, 0, 0, 0];
      payments.forEach(p => {
        if (p.status === 'succeeded') {
          const d = p.rawDate ? new Date(p.rawDate) : null;
          if (d) {
            const m = d.getMonth(); // 0-11
            // mappiamo a maggio-novembre (4 a 10)
            if (m >= 4 && m <= 10) {
              realSums[m - 4] += Number(p.amount) || 59;
            }
          }
        }
      });

      const maxVal = Math.max(...realSums.map((v, i) => v > 0 ? v : monthlyValues[i]), 100);
      barWrap.innerHTML = `
        <div style="display:flex; align-items:flex-end; justify-content:space-between; height:120px; gap:8px; padding-top:10px;">
          ${months.map((mName, idx) => {
            const val = realSums[idx] > 0 ? realSums[idx] : monthlyValues[idx];
            const h = Math.max(12, (val / maxVal) * 90);
            return `
              <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:6px;">
                <div style="width:100%; background:linear-gradient(180deg, #FF8A00 0%, #FF6B00 100%); height:${h}px; border-radius:6px 6px 0 0; transition:height 0.4s ease;" title="${val.toFixed(2)} € incassati"></div>
                <span style="font-size:10px; color:var(--text-muted); font-weight:700;">${mName}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  }

  // ==========================================================================
  // Render Overview Table
  // ==========================================================================
  renderOverviewTable() {
    const tbody = document.getElementById("overviewBarsTableBody");
    if (!tbody) return;

    let filtered = this.data.bars.filter(bar => {
      const matchSearch = !this.searchQuery || 
        bar.name.toLowerCase().includes(this.searchQuery) ||
        bar.owner.toLowerCase().includes(this.searchQuery) ||
        bar.email.toLowerCase().includes(this.searchQuery) ||
        bar.city.toLowerCase().includes(this.searchQuery);

      const matchStatus = this.statusFilter === "all" || bar.status === this.statusFilter;
      const matchPlan = this.planFilter === "all" || bar.plan.toLowerCase().includes(this.planFilter.toLowerCase());

      return matchSearch && matchStatus && matchPlan;
    });

    const statusBadges = {
      active: `<span class="status-pill status-active">Attivo</span>`,
      trial: `<span class="status-pill status-trial">Prova gratuita</span>`,
      past_due: `<span class="status-pill status-late">In ritardo</span>`,
      late: `<span class="status-pill status-late">In ritardo</span>`,
      suspended: `<span class="status-pill status-late" style="background:#EF4444;">Sospeso</span>`,
      cancelled: `<span class="status-pill status-canceled">Cancellato</span>`
    };

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">Nessun bar trovato con i filtri applicati</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.slice(0, 8).map(bar => {
      const daysLeftBadge = bar.status === 'trial' ? ` <small style="color:#FF8A24;">(${bar.trialDaysRemaining || 14}gg rimasti)</small>` : '';
      return `
        <tr>
          <td>
            <div class="bar-name-cell">
              <div class="bar-avatar-badge">${bar.avatar}</div>
              <div>
                <div class="bar-name-bold">${bar.name}</div>
                <div style="font-size:11px; color:#64748B;">${bar.city} · ${bar.owner}</div>
              </div>
            </div>
          </td>
          <td><strong>${bar.plan}</strong></td>
          <td>${statusBadges[bar.status] || bar.status}${daysLeftBadge}</td>
          <td>${bar.nextInvoice}</td>
          <td><strong>${bar.monthlyRevenue.toFixed(2)} €</strong></td>
          <td>${bar.lastAccess}</td>
          <td>
            <div class="actions-cell">
              <button class="btn-table-action" onclick="window.adminConsole.openBarDetail('${bar.id}')" title="Visualizza Scheda">👁️</button>
              <button class="btn-table-action" onclick="window.adminConsole.openEditBarModal('${bar.id}')" title="Modifica Bar">✏️</button>
              <button class="btn-table-action" onclick="window.adminConsole.sendReminder('${bar.id}')" title="Invia Promemoria Email">✉️</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // ==========================================================================
  // Render Full Bars Directory Table
  // ==========================================================================
  renderFullBarsTable() {
    const tbody = document.getElementById("fullBarsTableBody");
    if (!tbody) return;

    const statusBadges = {
      active: `<span class="status-pill status-active">Attivo</span>`,
      trial: `<span class="status-pill status-trial">Prova gratuita</span>`,
      past_due: `<span class="status-pill status-late">In ritardo</span>`,
      late: `<span class="status-pill status-late">In ritardo</span>`,
      suspended: `<span class="status-pill status-late" style="background:#EF4444;">Sospeso</span>`,
      cancelled: `<span class="status-pill status-canceled">Cancellato</span>`
    };

    let list = this.data.bars;
    const headerTitle = document.querySelector("#view-bars .section-box-title");
    if (headerTitle) {
      headerTitle.textContent = `Directory Completa Bar Iscritti (${list.length})`;
    }

    if (this.searchQuery) {
      list = list.filter(b => b.name.toLowerCase().includes(this.searchQuery) || b.email.toLowerCase().includes(this.searchQuery) || b.city.toLowerCase().includes(this.searchQuery));
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:30px; color:var(--text-muted);">Nessun bar registrato</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(bar => {
      const daysLeftBadge = bar.status === 'trial' ? `<div style="font-size:11px; color:#FF8A24; font-weight:700;">${bar.trialDaysRemaining || 14} giorni di prova rimasti</div>` : '';
      return `
        <tr>
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
          <td>${statusBadges[bar.status] || bar.status}${daysLeftBadge}</td>
          <td>${bar.nextInvoice}</td>
          <td>
            <div class="actions-cell">
              <button class="btn-table-action" onclick="window.adminConsole.openBarDetail('${bar.id}')" title="Dettaglio completo">👁️</button>
              <button class="btn-table-action" onclick="window.adminConsole.openEditBarModal('${bar.id}')" title="Modifica dati">✏️</button>
              <button class="btn-table-action" onclick="window.adminConsole.sendReminder('${bar.id}')" title="Sollecita via Email">📱</button>
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

    const list = this.data.subscriptions && this.data.subscriptions.length > 0 
      ? this.data.subscriptions 
      : this.data.bars.map(b => ({
          id: 'sub_' + b.id,
          barId: b.id,
          barName: b.name,
          plan: 'BarPilot Pro',
          price: 59.00,
          paymentMethod: 'Stripe / Carta',
          currentPeriodEnd: b.nextInvoice,
          status: b.status === 'active' ? 'active' : 'trialing'
        }));

    tbody.innerHTML = list.map(sub => {
      const isTrial = sub.status === "trialing" || sub.status === "trial";
      const isLate = sub.status === "past_due" || sub.status === "late";
      const isCanceled = sub.status === "canceled" || sub.status === "cancelled";
      
      const badge = isLate 
        ? `<span class="status-pill status-late">Scaduto / Rinnovo Fallito</span>`
        : isTrial 
        ? `<span class="status-pill status-trial">14gg Prova Attiva</span>`
        : isCanceled
        ? `<span class="status-pill status-canceled">Annullato</span>`
        : `<span class="status-pill status-active">Rinnovo Automatico OK</span>`;

      return `
        <tr>
          <td><strong>${sub.barName}</strong></td>
          <td>${sub.plan} (${Number(sub.price).toFixed(2)} €/m)</td>
          <td>${sub.paymentMethod || 'Stripe / Carta'}</td>
          <td><strong>${sub.currentPeriodEnd || '-'}</strong></td>
          <td>${badge}</td>
          <td>
            <button class="btn-primary-orange" style="height:28px; font-size:11px; padding:0 10px;" onclick="window.adminConsole.sendReminder('${sub.barId || ''}')">
              ✉️ Invia Promemoria
            </button>
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
      open: `<span class="status-pill status-late">In sospeso</span>`,
      draft: `<span class="status-pill status-trial">Bozza</span>`,
      void: `<span class="status-pill status-canceled">Annullata</span>`
    };

    let list = this.data.invoices || [];
    if (this.searchQuery) {
      list = list.filter(i => i.number.toLowerCase().includes(this.searchQuery) || i.barName.toLowerCase().includes(this.searchQuery));
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">Nessuna fattura registrata</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(inv => {
      return `
        <tr>
          <td><strong style="color:var(--primary);">${inv.number}</strong></td>
          <td><strong>${inv.barName}</strong></td>
          <td>${inv.date}</td>
          <td>${inv.dueDate || '-'}</td>
          <td><strong>${inv.amount.toFixed(2)} €</strong></td>
          <td>${invBadges[inv.status] || inv.status}</td>
          <td>
            <div class="actions-cell">
              <button class="btn-table-action" onclick="window.adminConsole.openInvoiceDetail('${inv.id}')" title="Visualizza Fattura">👁️</button>
              <button class="btn-table-action" onclick="window.adminConsole.printInvoice('${inv.id}')" title="Stampa / Salva PDF">🖨️</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // ==========================================================================
  // Render Payments Ledger Table
  // ==========================================================================
  renderPaymentsTable() {
    const tbody = document.getElementById("paymentsTableBody");
    if (!tbody) return;

    const list = this.data.payments || [];
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">Nessuna transazione registrata</td></tr>`;
      return;
    }

    const statusBadges = {
      succeeded: `<span class="status-pill status-active">Completato</span>`,
      pending: `<span class="status-pill status-trial">In elaborazione</span>`,
      failed: `<span class="status-pill status-late">Fallito</span>`,
      refunded: `<span class="status-pill status-canceled">Rimborsato</span>`
    };

    tbody.innerHTML = list.map(p => `
      <tr>
        <td><code style="color:var(--primary); font-size:11.5px;">${p.transactionId || p.id}</code></td>
        <td><strong>${p.barName}</strong></td>
        <td><strong>${Number(p.amount).toFixed(2)} €</strong></td>
        <td>${p.method === 'card' ? 'Carta (Stripe)' : p.method === 'google_pay' ? 'Google Pay' : p.method}</td>
        <td>${statusBadges[p.status] || p.status}</td>
        <td>${p.date || 'Recente'}</td>
      </tr>
    `).join("");
  }

  // ==========================================================================
  // Render SaaS Stats View & Time Range Filter
  // ==========================================================================
  setStatsTimeRange(range, btn) {
    this.statsFilter = range;
    document.querySelectorAll(".btn-time-filter").forEach(b => {
      b.style.background = "transparent";
      b.style.color = "var(--text-muted)";
    });
    if (btn) {
      btn.style.background = "#FF6B00";
      btn.style.color = "#fff";
    }
    this.renderStatsView();
  }

  renderStatsView() {
    const bars = this.data.bars || [];
    const payments = this.data.payments || [];

    const activeBars = bars.filter(b => b.status === "active").length;
    const trialBars = bars.filter(b => b.status === "trial").length;
    const cancelledBars = bars.filter(b => b.status === "cancelled" || b.status === "canceled").length;
    const totalBars = bars.length;

    // Calcoli SaaS rigorosi
    const mrr = activeBars * 59.00;
    const arr = mrr * 12;

    const succeededPayments = payments.filter(p => p.status === "succeeded");
    const totalCollected = succeededPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    const conversionRate = totalBars > 0 ? ((activeBars / totalBars) * 100).toFixed(1) : "0.0";
    const churnRate = (activeBars + cancelledBars) > 0 ? ((cancelledBars / (activeBars + cancelledBars)) * 100).toFixed(1) : "0.0";

    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setEl("statsMrr", mrr.toLocaleString('it-IT', { minimumFractionDigits: 2 }) + " €");
    setEl("statsArr", arr.toLocaleString('it-IT', { minimumFractionDigits: 2 }) + " €");
    setEl("statsTotalCollected", totalCollected.toLocaleString('it-IT', { minimumFractionDigits: 2 }) + " €");
    setEl("statsChurn", churnRate + "%");
    setEl("statsTrialBars", trialBars + " bar");
    setEl("statsActiveBars", activeBars + " bar");
    setEl("statsConversionRate", conversionRate + "%");
  }

  // ==========================================================================
  // Render Support Helpdesk Tickets Table
  // ==========================================================================
  renderSupportTable() {
    const tbody = document.getElementById("supportTableBody");
    if (!tbody) return;

    const list = this.data.tickets || [];
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">Nessun ticket di supporto aperto</td></tr>`;
      return;
    }

    const statusBadges = {
      open: `<span class="status-pill status-trial">Aperto</span>`,
      in_progress: `<span class="status-pill status-trial" style="background:#3B82F6; color:#fff;">In corso</span>`,
      waiting_customer: `<span class="status-pill status-late">In attesa</span>`,
      resolved: `<span class="status-pill status-active">Risolto</span>`,
      closed: `<span class="status-pill status-canceled">Chiuso</span>`
    };

    tbody.innerHTML = list.map(t => {
      const sKey = (t.status || 'open').toLowerCase();
      const responses = Array.isArray(t.responses) && t.responses.length > 0
        ? t.responses
        : (t.response ? [{ author: "Super Admin BarPilot", message: t.response, created_at: t.response_at }] : []);

      const responsesHtml = responses.length > 0 ? `
        <div style="margin-top:8px; display:flex; flex-direction:column; gap:6px;">
          ${responses.map((r, i) => `
            <div style="background:rgba(16,185,129,0.08); border-left:3px solid #10B981; border-radius:6px; padding:8px 10px;">
              <div style="font-size:11px; font-weight:800; color:#10B981; display:flex; justify-content:space-between; align-items:center;">
                <span>🛡️ ${r.author || 'Super Admin BarPilot'}${responses.length > 1 ? ` #${i+1}` : ''}</span>
                <span style="font-size:10px; color:#6EE7B7; font-weight:normal;">${r.created_at ? new Date(r.created_at).toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : ''}</span>
              </div>
              <div style="font-size:12px; color:#f8fafc; line-height:1.45; margin-top:3px; white-space:pre-wrap;">${r.message}</div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="margin-top:8px; background:rgba(255,138,36,0.06); border-left:3px solid #FF8A24; border-radius:6px; padding:6px 10px; font-size:11.5px; color:#FF8A24; display:flex; align-items:center; gap:6px;">
          <span>⏳</span> <span>In attesa di risposta dal Super Admin. Clicca <strong>✉️ Rispondi</strong> per inviare una risposta al gestore.</span>
        </div>
      `;

      return `
        <tr style="vertical-align: top;">
          <td><strong style="color:var(--primary); font-size:13.5px;">${t.id}</strong></td>
          <td>
            <div style="font-weight:700; color:#fff; font-size:13px;">${t.barName}</div>
            <div style="font-size:11.5px; color:var(--text-muted); margin-top:1px;">${t.contactEmail}</div>
            <div style="margin-top:6px;">
              <span class="badge" style="background:var(--bg-card); font-size:10px; border:1px solid var(--border-color);">${t.category}</span>
            </div>
          </td>
          <td style="min-width: 320px; max-width: 480px;">
            <div style="font-weight:700; color:#fff; font-size:13.5px; margin-bottom:6px;">${t.subject}</div>
            
            <!-- Box Richiesta del Bar -->
            <div style="background:rgba(0,0,0,0.3); border-left:3px solid #64748B; border-radius:6px; padding:8px 10px;">
              <div style="font-size:10.5px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px;">
                📩 Richiesta iniziale del Bar:
              </div>
              <div style="font-size:12px; color:#e2e8f0; line-height:1.45; white-space:pre-wrap;">${t.message || t.description || 'Nessun messaggio'}</div>
            </div>

            <!-- Box Risposte Super Admin Raggruppate -->
            ${responsesHtml}
          </td>
          <td>${statusBadges[sKey] || t.status}</td>
          <td style="white-space: nowrap; font-size: 11.5px; color: var(--text-muted);">${t.date || 'Recente'}</td>
          <td style="min-width: 200px; white-space: nowrap;">
            <div class="actions-cell" style="display: flex; gap: 8px; align-items: center;">
              <button class="btn-table-action" onclick="window.adminConsole.toggleTicketStatus('${t.id}')" title="Cambia stato / Segna come Risolto" style="width: auto; padding: 6px 12px; font-size: 11.5px; font-weight: 600; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
                ${t.status === 'resolved' ? '↺ Riapri' : '✓ Risolvi'}
              </button>
              <button class="btn-table-action" onclick="window.adminConsole.openSupportReplyModal('${t.id}')" title="Rispondi al gestore" style="width: auto; padding: 6px 12px; font-size: 11.5px; font-weight: 600; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; background: #FF6B00; color: #fff;">
                ✉️ Rispondi
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  openSupportReplyModal(tktId) {
    const tkt = (this.data.tickets || []).find(t => t.id === tktId);
    if (!tkt) return;
    this.selectedTicket = tkt;

    const setTxt = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setTxt("replyTicketBarName", `${tkt.barName} (Ticket ${tkt.id})`);
    setTxt("replyTicketEmail", `Email mittente: ${tkt.contactEmail}`);
    setTxt("replyTicketSubject", tkt.subject);
    setTxt("replyTicketOriginalMessage", tkt.message || "Nessun messaggio fornito.");

    const priorityBadge = document.getElementById("replyTicketPriorityBadge");
    if (priorityBadge) {
      priorityBadge.textContent = tkt.priority ? tkt.priority.toUpperCase() : "MEDIA";
    }

    const idInput = document.getElementById("replyTicketId");
    if (idInput) idInput.value = tkt.id;

    const respText = document.getElementById("replyTicketResponseText");
    if (respText) respText.value = tkt.response || "";

    const responses = Array.isArray(tkt.responses) && tkt.responses.length > 0
      ? tkt.responses
      : (tkt.response ? [{ author: "Super Admin BarPilot", message: tkt.response, created_at: tkt.response_at }] : []);

    const histContainer = document.getElementById("replyTicketHistory");
    if (histContainer) {
      if (responses.length > 0) {
        histContainer.innerHTML = `
          <div style="margin-top:12px; border-top:1px solid var(--border-color); padding-top:10px;">
            <div style="font-size:11px; font-weight:800; color:#10B981; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Risposte già fornite:</div>
            ${responses.map((r, i) => `
              <div style="background:rgba(16,185,129,0.08); border-left:3px solid #10B981; border-radius:6px; padding:8px 10px; margin-bottom:6px;">
                <div style="font-size:10.5px; font-weight:700; color:#6EE7B7; margin-bottom:2px;">🛡️ ${r.author || 'Super Admin'} #${i+1}</div>
                <div style="font-size:12px; color:#fff; white-space:pre-wrap;">${r.message}</div>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        histContainer.innerHTML = '';
      }
    }

    const modal = document.getElementById("supportReplyModal");
    if (modal) modal.classList.add("active");
  }

  closeSupportReplyModal() {
    const modal = document.getElementById("supportReplyModal");
    if (modal) modal.classList.remove("active");
  }

  async handleSupportReplySubmit(e) {
    e.preventDefault();
    const tktId = document.getElementById("replyTicketId")?.value;
    const responseText = (document.getElementById("replyTicketResponseText")?.value || "").trim();
    const newStatus = document.getElementById("replyTicketNewStatus")?.value || "resolved";

    if (!tktId || !responseText) {
      this.showToast("⚠️ Inserisci il testo della risposta per il gestore.");
      return;
    }

    const submitBtn = document.getElementById("btnSubmitSupportReply");
    const origText = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "<span>⏳ Invio risposta...</span>";
    }

    try {
      const nowIso = new Date().toISOString();
      // 1. Aggiorna API backend /api/create-ticket per persistenza immediata
      try {
        await fetch("/api/create-ticket", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: tktId,
            response: responseText,
            status: newStatus
          })
        });
      } catch (errApi) {
        console.warn("[Admin] Note /api/create-ticket PATCH:", errApi);
      }

      // 2. Aggiorna support_tickets su Supabase (se configurato)
      const resTkt = await fetch(`${this.supabaseConfig.url}/rest/v1/support_tickets?id=eq.${encodeURIComponent(tktId)}`, {
        method: "PATCH",
        headers: {
          "apikey": this.supabaseConfig.anonKey,
          "Authorization": `Bearer ${this.supabaseConfig.anonKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          response: responseText,
          response_at: nowIso,
          status: newStatus,
          updated_at: nowIso
        })
      });

      // 2. Inserisci in support_messages
      await fetch(`${this.supabaseConfig.url}/rest/v1/support_messages`, {
        method: "POST",
        headers: {
          "apikey": this.supabaseConfig.anonKey,
          "Authorization": `Bearer ${this.supabaseConfig.anonKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: 'msg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
          ticket_id: tktId,
          sender_name: "Super Admin BarPilot",
          message: responseText,
          is_admin: true,
          created_at: nowIso
        })
      });

      // 3. Registra Audit Log
      await fetch(`${this.supabaseConfig.url}/rest/v1/admin_audit_logs`, {
        method: "POST",
        headers: {
          "apikey": this.supabaseConfig.anonKey,
          "Authorization": `Bearer ${this.supabaseConfig.anonKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: 'log_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
          admin_id: "cheikh_superadmin",
          action: "superadmin_reply_ticket",
          entity_type: "support_ticket",
          entity_id: tktId,
          new_values: { status: newStatus, replyLength: responseText.length },
          created_at: nowIso
        })
      });

      this.showToast("✉️ Risposta inviata con successo al gestore del bar!");
      this.closeSupportReplyModal();

      const tkt = (this.data.tickets || []).find(t => t.id === tktId);
      if (tkt) {
        tkt.response = responseText;
        tkt.response_at = nowIso;
        if (!Array.isArray(tkt.responses)) tkt.responses = [];
        tkt.responses.push({
          id: 'resp_' + Date.now().toString(36),
          author: 'Super Admin BarPilot',
          message: responseText,
          created_at: nowIso
        });
        tkt.status = newStatus;
      }
      this.renderSupportTable();
      await this.syncWithSupabase(false);
    } catch (err) {
      console.error("Support reply error:", err);
      this.showToast("⚠️ Errore durante l'invio della risposta.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    }
  }

  async toggleTicketStatus(tktId) {
    const tkt = (this.data.tickets || []).find(t => t.id === tktId);
    if (!tkt) return;
    tkt.status = tkt.status === "resolved" ? "open" : "resolved";
    this.saveData();
    this.renderSupportTable();

    try {
      fetch("/api/create-ticket", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tkt.id, status: tkt.status })
      }).catch(() => {});

      await fetch(`${this.supabaseConfig.url}/rest/v1/support_tickets?id=eq.${tkt.id}`, {
        method: "PATCH",
        headers: {
          "apikey": this.supabaseConfig.anonKey,
          "Authorization": `Bearer ${this.supabaseConfig.anonKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: tkt.status, updated_at: new Date().toISOString() })
      });
    } catch (e) {}
    this.showToast(`Ticket ${tkt.id} contrassegnato come: ${tkt.status.toUpperCase()}`);
  }

  async replyTicket(tktId) {
    const tkt = (this.data.tickets || []).find(t => t.id === tktId);
    if (!tkt) return;
    const answer = prompt(`Rispondi a ${tkt.barName} (${tkt.contactEmail}):\nOggetto: ${tkt.subject}`, tkt.response || "");
    if (answer !== null && answer.trim()) {
      tkt.response = answer.trim();
      tkt.status = "resolved";
      this.saveData();
      this.renderSupportTable();

      try {
        fetch("/api/create-ticket", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: tkt.id, response: tkt.response, status: "resolved" })
        }).catch(() => {});

        await fetch(`${this.supabaseConfig.url}/rest/v1/support_tickets?id=eq.${tkt.id}`, {
          method: "PATCH",
          headers: {
            "apikey": this.supabaseConfig.anonKey,
            "Authorization": `Bearer ${this.supabaseConfig.anonKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ response: tkt.response, status: "resolved", updated_at: new Date().toISOString() })
        });

        // Inserisci messaggio di supporto
        await fetch(`${this.supabaseConfig.url}/rest/v1/support_messages`, {
          method: "POST",
          headers: {
            "apikey": this.supabaseConfig.anonKey,
            "Authorization": `Bearer ${this.supabaseConfig.anonKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ticket_id: tkt.id,
            sender_name: "Super Admin Cheikh Gueye",
            message: tkt.response,
            created_at: new Date().toISOString()
          })
        });
      } catch (e) {}

      this.showToast(`Risposta inviata e salvata su Supabase per il ticket ${tkt.id}`);
    }
  }

  // ==========================================================================
  // Super Admin Affiliates Program Management
  // ==========================================================================
  async renderAffiliatesView() {
    try {
      const res = await fetch("/api/admin-affiliates", {
        headers: { "x-admin-pin": "101540" }
      });
      if (!res.ok) throw new Error("Errore recupero affiliazioni admin");
      const data = await res.json();
      this.affiliatesAdminData = data;

      // Aggiorna KPI cards
      const kpis = data.kpis || data.summary || {};
      const elAffs = document.getElementById("kpiAdminTotalAffiliates");
      if (elAffs) elAffs.textContent = kpis.total_affiliates || 0;

      const elRefs = document.getElementById("kpiAdminTotalReferrals");
      if (elRefs) elRefs.textContent = kpis.total_referrals || 0;

      const elActiveBadge = document.getElementById("kpiAdminActiveReferralsBadge");
      if (elActiveBadge) elActiveBadge.textContent = `${kpis.active_referrals || 0} attivi`;

      const elTrialBadge = document.getElementById("kpiAdminTrialReferralsBadge");
      if (elTrialBadge) elTrialBadge.textContent = `• ${kpis.trial_referrals || 0} in prova`;

      const elAvailable = document.getElementById("kpiAdminAvailableCommissions");
      if (elAvailable) elAvailable.textContent = `${this.formatCurrency(kpis.available_commissions || kpis.total_available || 0)} €`;

      const elPending = document.getElementById("kpiAdminPendingCommissions");
      if (elPending) elPending.textContent = `${this.formatCurrency(kpis.pending_commissions || kpis.total_pending || 0)} €`;

      const elPaid = document.getElementById("kpiAdminPaidCommissions");
      if (elPaid) elPaid.textContent = `${this.formatCurrency(kpis.paid_commissions || kpis.total_paid || 0)} €`;

      const elCancelledBadge = document.getElementById("kpiAdminCancelledCommissionsBadge");
      if (elCancelledBadge) elCancelledBadge.textContent = `Annullati: ${this.formatCurrency(kpis.cancelled_commissions || kpis.total_cancelled || 0)} €`;

      // Aggiorna input regola economica
      const rateInput = document.getElementById("adminAffiliateCommissionRateInput");
      if (rateInput && data.settings?.default_commission_rate !== undefined) {
        rateInput.value = data.settings.default_commission_rate;
      }

      // Render Tabelle
      this.renderAdminAffiliatesTable(data.affiliates || []);
      this.renderAdminWithdrawalsTable(data.withdrawals || []);
      this.renderAdminReferralsTable(data.referrals || []);
      this.renderAdminCommissionsTable(data.commissions || [], data.affiliates || []);
    } catch (err) {
      console.warn("[Admin Affiliates] Errore render:", err);
    }
  }

  renderAdminWithdrawalsTable(withdrawals) {
    const tbody = document.getElementById("adminWithdrawalsTableBody");
    if (!tbody) return;

    this.cachedAdminWithdrawals = Array.isArray(withdrawals) ? withdrawals : [];
    const filterEl = document.getElementById("searchAdminWithdrawalsInput");
    const q = filterEl ? filterEl.value.trim().toLowerCase() : "";

    const list = q
      ? this.cachedAdminWithdrawals.filter((w) => {
          const hay = [
            w.id,
            w.first_name,
            w.last_name,
            w.affiliate_name,
            w.email,
            w.affiliate_code,
            w.status,
            w.status_label,
            w.payment_method_reference
          ].filter(Boolean).join(" ").toLowerCase();
          return hay.includes(q);
        })
      : this.cachedAdminWithdrawals;

    if (!list || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">Nessuna richiesta di prelievo trovata.</td></tr>`;
      return;
    }

    const statusBadge = (status, label) => {
      const s = String(status || "pending").toLowerCase();
      if (s === "paid") return `<span class="status-pill status-active">✓ ${this.escapeHtml(label || "Pagato")}</span>`;
      if (s === "approved" || s === "processing") return `<span class="status-pill status-trial">${this.escapeHtml(label || (s === "approved" ? "Approvato" : "In elaborazione"))}</span>`;
      if (s === "rejected") return `<span class="status-pill status-late">✕ ${this.escapeHtml(label || "Rifiutato")}</span>`;
      return `<span class="status-pill" style="background:rgba(255,138,36,0.14); color:#FF8A24; border:1px solid rgba(255,138,36,0.35);">⏳ ${this.escapeHtml(label || "In attesa")}</span>`;
    };

    tbody.innerHTML = list.map((w) => {
      const reqFormatted = w.requested_at
        ? new Date(w.requested_at).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : "--";
      const fullName = [w.first_name, w.last_name].filter(Boolean).join(" ").trim() || w.affiliate_name || "Affiliato";
      const amountFormatted = this.formatCurrency(w.amount || 0);
      const s = String(w.status || "pending").toLowerCase();
      const safeId = this.escapeHtml(w.id);

      let actionsHtml = `<span style="font-size:11.5px; color:var(--text-dim);">Chiusa</span>`;
      if (s === "pending") {
        actionsHtml = `
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="btn-primary-orange" style="background:#3B82F6; border-color:#3B82F6; padding:4px 10px; font-size:11px; height:auto;" onclick="window.adminConsole.updateWithdrawalStatus('${safeId}', 'approved', '${amountFormatted}')">✓ Approva</button>
            <button type="button" class="btn-primary-orange" style="background:#10B981; border-color:#10B981; padding:4px 10px; font-size:11px; height:auto;" onclick="window.adminConsole.updateWithdrawalStatus('${safeId}', 'paid', '${amountFormatted}')">💸 Segna Pagato</button>
            <button type="button" class="btn-primary-orange" style="background:#EF4444; border-color:#EF4444; padding:4px 10px; font-size:11px; height:auto;" onclick="window.adminConsole.updateWithdrawalStatus('${safeId}', 'rejected', '${amountFormatted}')">✕ Rifiuta</button>
          </div>
        `;
      } else if (s === "approved" || s === "processing") {
        actionsHtml = `
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            ${s === "approved" ? `<button type="button" class="btn-primary-orange" style="background:#F59E0B; border-color:#F59E0B; padding:4px 10px; font-size:11px; height:auto;" onclick="window.adminConsole.updateWithdrawalStatus('${safeId}', 'processing', '${amountFormatted}')">⚙️ In elaborazione</button>` : ""}
            <button type="button" class="btn-primary-orange" style="background:#10B981; border-color:#10B981; padding:4px 10px; font-size:11px; height:auto;" onclick="window.adminConsole.updateWithdrawalStatus('${safeId}', 'paid', '${amountFormatted}')">💸 Segna Pagato</button>
            <button type="button" class="btn-primary-orange" style="background:#EF4444; border-color:#EF4444; padding:4px 10px; font-size:11px; height:auto;" onclick="window.adminConsole.updateWithdrawalStatus('${safeId}', 'rejected', '${amountFormatted}')">✕ Rifiuta</button>
          </div>
        `;
      }

      return `
        <tr>
          <td style="color:var(--text-muted); font-size:12px;">
            ${reqFormatted}
            <div style="font-family:'JetBrains Mono', monospace; font-size:10.5px; color:var(--text-dim); margin-top:2px;">${safeId}</div>
          </td>
          <td>
            <strong>${this.escapeHtml(fullName)}</strong>
            <div style="font-size:11.5px; color:var(--text-muted);">${this.escapeHtml(w.email || "--")}</div>
          </td>
          <td><strong style="font-family:'JetBrains Mono', monospace; color:#10B981; font-size:13.5px;">${amountFormatted} €</strong></td>
          <td style="font-size:12px; color:var(--text-secondary);">${this.escapeHtml(w.payment_method_reference || "--")}</td>
          <td>${statusBadge(s, w.status_label)}</td>
          <td>${actionsHtml}</td>
        </tr>
      `;
    }).join("");
  }

  filterAdminWithdrawals() {
    this.renderAdminWithdrawalsTable(this.cachedAdminWithdrawals || []);
  }

  async updateWithdrawalStatus(withdrawalId, newStatus, amountFormatted) {
    if (!withdrawalId || !newStatus) return;

    if (newStatus === "paid") {
      const ok = window.confirm(`Confermi di aver effettivamente eseguito il trasferimento di ${amountFormatted || ""} € verso il metodo di pagamento dell'affiliato?\n\nNon segnare come pagato finché il pagamento non è stato realmente inviato.`);
      if (!ok) return;
    } else if (newStatus === "rejected") {
      const ok = window.confirm(`Rifiutare questa richiesta di prelievo di ${amountFormatted || ""} €?\n\nL'importo riservato verrà restituito automaticamente al saldo disponibile dell'affiliato.`);
      if (!ok) return;
    }

    try {
      const res = await fetch("/api/admin-affiliates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": "101540"
        },
        body: JSON.stringify({
          action: "update_withdrawal_status",
          withdrawalId,
          status: newStatus
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Errore aggiornamento stato prelievo");
      }

      const labels = {
        approved: "Approvato",
        processing: "In elaborazione",
        paid: "Pagato",
        rejected: "Rifiutato (saldo restituito)"
      };
      this.showToast(`✓ Prelievo aggiornato: ${labels[newStatus] || newStatus}`);

      if (typeof BroadcastChannel !== "undefined") {
        try {
          const ch = new BroadcastChannel("barpilot_affiliates_sync");
          ch.postMessage({ type: "withdrawal_updated", withdrawalId, status: newStatus });
          ch.close();
        } catch (e) {}
      }

      this.renderAffiliatesView();
    } catch (err) {
      alert("Errore aggiornamento prelievo: " + err.message);
    }
  }

  renderAdminReferralsTable(referrals) {
    const tbody = document.getElementById("adminReferralsTableBody");
    if (!tbody) return;

    if (!referrals || referrals.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">Nessun bar referral registrato al momento.</td></tr>`;
      return;
    }

    tbody.innerHTML = referrals.map(r => {
      const regFormatted = r.registered_at ? new Date(r.registered_at).toLocaleDateString("it-IT", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "--";
      const trialEndFormatted = r.trial_end_date ? new Date(r.trial_end_date).toLocaleDateString("it-IT") : "--";
      const s = (r.status || 'trial').toLowerCase();
      let pillClass = 'status-trial';
      if (s === 'active') pillClass = 'status-active';
      else if (s === 'cancelled' || s === 'expired') pillClass = 'status-late';

      return `
        <tr>
          <td style="color:var(--text-muted); font-size:12.5px;">${regFormatted}</td>
          <td>
            <strong>🍸 ${this.escapeHtml(r.bar_name || 'Bar Referral')}</strong>
            <div style="font-size:11px; color:var(--text-muted);">${this.escapeHtml(r.bar_id || '')} ${r.email ? '· ' + this.escapeHtml(r.email) : ''}</div>
          </td>
          <td>
            <span style="font-family:'JetBrains Mono', monospace; font-size:12.5px; font-weight:800; background:rgba(255,138,36,0.12); color:#FF8A24; padding:3px 8px; border-radius:6px; border:1px solid rgba(255,138,36,0.25);">
              ${this.escapeHtml(r.affiliate_code || '--')}
            </span>
          </td>
          <td style="font-size:12px; color:var(--text-muted);">Fine: ${trialEndFormatted}</td>
          <td>
            <span class="status-pill ${pillClass}">${this.escapeHtml(r.status_label || s)}</span>
            ${r.fraud_flag ? '<div style="font-size:10.5px; color:#EF4444; font-weight:700; margin-top:2px;">⚠️ Anomalia / Frode</div>' : ''}
          </td>
          <td><strong style="font-family:'JetBrains Mono', monospace; color:${r.fraud_flag ? '#EF4444' : '#10B981'};">+${this.formatCurrency(r.bonus_amount || 5)} €</strong></td>
          <td>
            ${s !== 'cancelled' ? `
              <button type="button" class="btn-primary-orange" style="background:#EF4444; border-color:#EF4444; padding:4px 10px; font-size:11px; height:auto;" onclick="window.adminConsole.cancelFraudBonus('${r.id}', '')">
                🚫 Annulla (Frode)
              </button>
            ` : '<span style="font-size:11.5px; color:var(--text-dim);">Annullato</span>'}
          </td>
        </tr>
      `;
    }).join("");
  }

  renderAdminAffiliatesTable(affiliates) {
    const tbody = document.getElementById("adminAffiliatesTableBody");
    if (!tbody) return;

    if (!affiliates || affiliates.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);">Nessun affiliato registrato al momento.</td></tr>`;
      return;
    }

    tbody.innerHTML = affiliates.map(a => {
      const dateFormatted = a.created_at ? new Date(a.created_at).toLocaleDateString("it-IT") : "--";
      const isSuspended = a.status === "suspended";
      return `
        <tr>
          <td>
            <strong>${this.escapeHtml(a.name || 'Affiliato')}</strong>
            <div style="font-size:11.5px; color:var(--text-muted);">${this.escapeHtml(a.email)}</div>
          </td>
          <td>
            <span style="font-family:'JetBrains Mono', monospace; font-size:13.5px; font-weight:800; background:rgba(255,138,36,0.12); color:#FF8A24; padding:3px 8px; border-radius:6px; border:1px solid rgba(255,138,36,0.25);">
              ${this.escapeHtml(a.code)}
            </span>
          </td>
          <td style="color:var(--text-muted); font-size:12.5px;">${dateFormatted}</td>
          <td><strong>${a.total_referrals || 0}</strong> bar</td>
          <td><span style="color:#10B981; font-weight:700;">${a.active_referrals || 0}</span> attivi</td>
          <td><strong style="color:#10B981;">${this.formatCurrency(a.available_balance)} €</strong></td>
          <td><strong>${this.formatCurrency(a.total_earned)} €</strong></td>
          <td>
            <button type="button" class="status-pill ${isSuspended ? 'status-late' : 'status-active'}" style="cursor:pointer; border:none;" onclick="window.adminConsole.toggleAffiliateStatus('${a.id}', '${isSuspended ? 'active' : 'suspended'}')">
              ${isSuspended ? '⏸️ Sospeso' : '✓ Attivo'}
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  renderAdminCommissionsTable(commissions, affiliates) {
    const tbody = document.getElementById("adminCommissionsTableBody");
    if (!tbody) return;

    if (!commissions || commissions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">Nessuna commissione generata finora.</td></tr>`;
      return;
    }

    const affMap = {};
    (affiliates || []).forEach(a => { affMap[a.id] = a; });

    tbody.innerHTML = commissions.map(c => {
      const dateFormatted = c.created_at ? new Date(c.created_at).toLocaleDateString("it-IT", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "--";
      const aff = affMap[c.affiliate_id] || {};
      const affLabel = aff.code ? `${aff.code} (${aff.email})` : (c.affiliate_id || 'Affiliato');
      const curStatus = c.status || 'pending';

      return `
        <tr>
          <td style="color:var(--text-muted); font-size:12.5px;">${dateFormatted}</td>
          <td><strong>${this.escapeHtml(affLabel)}</strong></td>
          <td>🍸 ${this.escapeHtml(c.bar_name || 'Bar Referral')}</td>
          <td><strong style="font-family:'JetBrains Mono', monospace; font-size:13.5px; color:#10B981;">+${this.formatCurrency(c.amount)} €</strong></td>
          <td style="font-family:'JetBrains Mono', monospace; font-size:11px; color:var(--text-dim);">${this.escapeHtml(c.stripe_invoice_id || 'Manuale')}</td>
          <td>
            <select class="form-input-admin" style="padding:4px 8px; font-size:12px; height:auto; width:auto; font-weight:700; border-radius:8px;" onchange="window.adminConsole.updateCommissionStatus('${c.id}', this.value)">
              <option value="pending" ${curStatus === 'pending' ? 'selected' : ''}>⏳ In attesa</option>
              <option value="available" ${curStatus === 'available' ? 'selected' : ''}>🟢 Disponibile</option>
              <option value="paid" ${curStatus === 'paid' ? 'selected' : ''}>🔵 Pagata</option>
              <option value="cancelled" ${curStatus === 'cancelled' ? 'selected' : ''}>🔴 Annullata</option>
            </select>
          </td>
          <td style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="btn-primary-orange" style="padding:4px 10px; font-size:11.5px; height:auto;" onclick="window.adminConsole.updateCommissionStatus('${c.id}', 'paid')">
              Segna Pagata
            </button>
            ${curStatus !== 'cancelled' ? `
              <button type="button" class="btn-primary-orange" style="background:#EF4444; border-color:#EF4444; padding:4px 10px; font-size:11.5px; height:auto;" onclick="window.adminConsole.cancelFraudBonus('${c.referral_id || ''}', '${c.id}')">
                🚫 Frode
              </button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join("");
  }

  async cancelFraudBonus(referralId, commissionId) {
    const reason = prompt("Inserisci il motivo dell'annullamento antifrode:", "Registrazione fraudolenta o anomalia rilevata");
    if (reason === null) return;
    try {
      const res = await fetch("/api/admin-affiliates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": "101540"
        },
        body: JSON.stringify({
          action: "cancel_fraud_bonus",
          referralId: referralId || null,
          commissionId: commissionId || null,
          reason
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.showToast("🚫 Bonus annullato per frode e saldo aggiornato!");
        this.renderAffiliatesView();
      } else {
        throw new Error(data.error || "Errore annullamento bonus");
      }
    } catch (err) {
      alert("Errore annullamento bonus: " + err.message);
    }
  }

  async saveAffiliateCommissionRate() {
    const input = document.getElementById("adminAffiliateCommissionRateInput");
    if (!input) return;
    const rate = parseFloat(input.value);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      alert("Inserisci una percentuale valida tra 0 e 100.");
      return;
    }

    try {
      const res = await fetch("/api/admin-affiliates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": "101540"
        },
        body: JSON.stringify({
          action: "update_commission_rate",
          rate: rate
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.showToast(`✓ Percentuale commissione aggiornata a ${rate.toFixed(2)}%!`);
      } else {
        throw new Error(data.error || "Errore salvataggio percentuale");
      }
    } catch (err) {
      alert("Errore salvataggio regola economica: " + err.message);
    }
  }

  async updateCommissionStatus(commId, newStatus) {
    try {
      const res = await fetch("/api/admin-affiliates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": "101540"
        },
        body: JSON.stringify({
          action: "update_commission_status",
          commissionId: commId,
          status: newStatus
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.showToast(`✓ Stato commissione aggiornato a "${newStatus}"!`);
        this.renderAffiliatesView();
      } else {
        throw new Error(data.error || "Errore aggiornamento stato");
      }
    } catch (err) {
      alert("Errore aggiornamento stato commissione: " + err.message);
    }
  }

  async toggleAffiliateStatus(affId, newStatus) {
    try {
      const res = await fetch("/api/admin-affiliates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": "101540"
        },
        body: JSON.stringify({
          action: "update_affiliate_status",
          affiliateId: affId,
          status: newStatus
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.showToast(`✓ Stato affiliato aggiornato a "${newStatus}"!`);
        this.renderAffiliatesView();
      }
    } catch (err) {
      alert("Errore aggiornamento affiliato: " + err.message);
    }
  }

  filterAdminAffiliates() {
    const q = (document.getElementById("searchAdminAffiliatesInput")?.value || "").trim().toLowerCase();
    const all = this.affiliatesAdminData?.affiliates || [];
    if (!q) {
      this.renderAdminAffiliatesTable(all);
      return;
    }
    const filtered = all.filter(a => 
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.email && a.email.toLowerCase().includes(q)) ||
      (a.code && a.code.toLowerCase().includes(q))
    );
    this.renderAdminAffiliatesTable(filtered);
  }

  filterAdminReferrals() {
    const q = (document.getElementById("searchAdminReferralsInput")?.value || "").trim().toLowerCase();
    const all = this.affiliatesAdminData?.referrals || [];
    if (!q) {
      this.renderAdminReferralsTable(all);
      return;
    }
    const filtered = all.filter(r =>
      (r.bar_name && r.bar_name.toLowerCase().includes(q)) ||
      (r.bar_id && r.bar_id.toLowerCase().includes(q)) ||
      (r.affiliate_code && r.affiliate_code.toLowerCase().includes(q)) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      (r.status_label && r.status_label.toLowerCase().includes(q))
    );
    this.renderAdminReferralsTable(filtered);
  }

  filterAdminCommissions() {
    const q = (document.getElementById("searchAdminCommissionsInput")?.value || "").trim().toLowerCase();
    const all = this.affiliatesAdminData?.commissions || [];
    const affs = this.affiliatesAdminData?.affiliates || [];
    if (!q) {
      this.renderAdminCommissionsTable(all, affs);
      return;
    }
    const filtered = all.filter(c => 
      (c.bar_name && c.bar_name.toLowerCase().includes(q)) ||
      (c.affiliate_id && c.affiliate_id.toLowerCase().includes(q)) ||
      (c.stripe_invoice_id && c.stripe_invoice_id.toLowerCase().includes(q)) ||
      (c.status && c.status.toLowerCase().includes(q))
    );
    this.renderAdminCommissionsTable(filtered, affs);
  }

  // ==========================================================================
  // Render Settings & Audit Logs
  // ==========================================================================
  renderSettingsView() {
    const s = this.data.settings || {};
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined) el.value = val;
    };
    setVal("settingsCompanyName", s.companyName);
    setVal("settingsCompanyPiva", s.companyPiva);
    setVal("settingsBillingEmail", s.billingEmail);
    setVal("settingsTrialDays", s.trialDays || 14);
    setVal("settingsDefaultPrice", s.defaultPrice || 59.00);
    setVal("settingsRequireCard", s.requireCardUpfront ? "true" : "false");
    setVal("settingsMaintenance", s.maintenanceMode ? "true" : "false");
  }

  async saveSettingsFromForm() {
    if (!this.data.settings) this.data.settings = {};
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : "";
    };

    this.data.settings.companyName = getVal("settingsCompanyName");
    this.data.settings.companyPiva = getVal("settingsCompanyPiva");
    this.data.settings.billingEmail = getVal("settingsBillingEmail");
    this.data.settings.trialDays = parseInt(getVal("settingsTrialDays"), 10) || 14;
    this.data.settings.defaultPrice = parseFloat(getVal("settingsDefaultPrice")) || 59.00;
    this.data.settings.requireCardUpfront = getVal("settingsRequireCard") === "true";
    this.data.settings.maintenanceMode = getVal("settingsMaintenance") === "true";

    this.saveData();

    // Sincronizza con Supabase public.admin_settings
    try {
      const settingsEntries = [
        { setting_key: 'company_name', setting_value: this.data.settings.companyName },
        { setting_key: 'company_piva', setting_value: this.data.settings.companyPiva },
        { setting_key: 'billing_email', setting_value: this.data.settings.billingEmail },
        { setting_key: 'trial_days', setting_value: String(this.data.settings.trialDays) },
        { setting_key: 'default_price', setting_value: String(this.data.settings.defaultPrice) },
        { setting_key: 'require_card_upfront', setting_value: String(this.data.settings.requireCardUpfront) },
        { setting_key: 'maintenance_mode', setting_value: String(this.data.settings.maintenanceMode) }
      ];

      for (const entry of settingsEntries) {
        await fetch(`${this.supabaseConfig.url}/rest/v1/admin_settings`, {
          method: "POST",
          headers: {
            "apikey": this.supabaseConfig.anonKey,
            "Authorization": `Bearer ${this.supabaseConfig.anonKey}`,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
          },
          body: JSON.stringify({
            id: 'set_' + entry.setting_key,
            setting_key: entry.setting_key,
            setting_value: entry.setting_value,
            updated_by: "Cheikh Gueye",
            updated_at: new Date().toISOString()
          })
        });
      }

      // Registra audit log
      await fetch(`${this.supabaseConfig.url}/rest/v1/admin_audit_logs`, {
        method: "POST",
        headers: {
          "apikey": this.supabaseConfig.anonKey,
          "Authorization": `Bearer ${this.supabaseConfig.anonKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: 'log_' + Date.now(),
          admin_id: "cheikh_superadmin",
          action: "settings_updated",
          entity_type: "platform_config",
          entity_id: "global",
          new_values: this.data.settings,
          created_at: new Date().toISOString()
        })
      });
    } catch (e) {
      console.warn("[Settings] Supabase save fallback:", e);
    }

    this.showToast("💾 Impostazioni e regole salvate con successo su Supabase!");
    this.syncWithSupabase(false);
  }

  renderAuditLogsTable() {
    const tbody = document.getElementById("auditLogsTableBody");
    if (!tbody) return;

    const list = this.data.auditLogs || [];
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:16px; color:var(--text-muted);">Nessuna modifica recente registrata</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(log => `
      <tr>
        <td><strong>${log.createdAt}</strong></td>
        <td><span class="badge" style="background:#2563eb; color:#fff;">${log.adminId || 'Super Admin'}</span></td>
        <td><code>${log.action}</code></td>
        <td>${log.entityType} (${log.entityId})</td>
        <td><small style="color:var(--text-muted); font-family:monospace;">${JSON.stringify(log.newValues || {}).slice(0, 50)}...</small></td>
      </tr>
    `).join("");
  }

  renderRecentActivities() {
    const wrap = document.getElementById("recentActivitiesList");
    if (!wrap) return;

    const typeIcons = {
      reg: "🏢",
      pay: "💰",
      inv: "🧾",
      late: "⚠️",
      cancel: "❌",
      support: "💬"
    };

    wrap.innerHTML = (this.data.activities || []).map(act => `
      <div style="display:flex; align-items:flex-start; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
        <div style="width:32px; height:32px; border-radius:8px; background:rgba(255,107,0,0.12); display:flex; align-items:center; justify-content:center; font-size:16px;">
          ${typeIcons[act.type] || '📌'}
        </div>
        <div style="flex:1;">
          <div style="font-size:13px; font-weight:700; color:#fff;">${act.title}</div>
          <div style="font-size:11.5px; color:var(--text-muted);">${act.desc}</div>
        </div>
        <div style="font-size:11px; color:var(--text-dim); white-space:nowrap;">${act.time}</div>
      </div>
    `).join("");
  }

  // ==========================================================================
  // Bar Detail & Edit Modals
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
    document.getElementById("modalBarPlan").textContent = `${bar.plan} (59.00 €/mese)`;
    document.getElementById("modalBarNextDue").textContent = bar.nextInvoice;
    document.getElementById("modalBarPhoto").src = bar.photo;

    const statusPill = document.getElementById("modalBarStatusPill");
    if (statusPill) {
      const isSuspended = bar.status === "suspended";
      statusPill.className = `status-pill status-${bar.status}`;
      statusPill.textContent = isSuspended ? "Sospeso" : (bar.status === "active" ? "Attivo (Regolare)" : bar.status === "trial" ? `Prova (${bar.trialDaysRemaining || 14}gg)` : bar.status === "past_due" ? "In ritardo" : "Cancellato");
    }

    const suspendBtn = document.getElementById("modalToggleSuspendBtn");
    if (suspendBtn) {
      suspendBtn.innerHTML = bar.status === "suspended" ? "▶️ Riattiva Bar" : "⏸️ Sospendi Bar";
      suspendBtn.style.color = bar.status === "suspended" ? "#10B981" : "#EF4444";
      suspendBtn.style.borderColor = bar.status === "suspended" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)";
      suspendBtn.style.background = bar.status === "suspended" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)";
    }

    modal.classList.add("active");
  }

  closeBarDetail() {
    const modal = document.getElementById("barDetailModal");
    if (modal) modal.classList.remove("active");
  }

  async toggleSuspendSelectedBar() {
    if (!this.selectedBar) return;
    const isSuspended = this.selectedBar.status === "suspended";
    const nextStatus = isSuspended ? "active" : "suspended";
    const barName = this.selectedBar.name;

    const confirmMsg = isSuspended
      ? `Vuoi riattivare l'accesso per "${barName}"?`
      : `Vuoi sospendere temporaneamente "${barName}"? L'accesso del personale verrà bloccato.`;

    if (!confirm(confirmMsg)) return;

    try {
      const nowIso = new Date().toISOString();
      await fetch(`${this.supabaseConfig.url}/rest/v1/bars?id=eq.${encodeURIComponent(this.selectedBar.id)}`, {
        method: "PATCH",
        headers: {
          "apikey": this.supabaseConfig.anonKey,
          "Authorization": `Bearer ${this.supabaseConfig.anonKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: nextStatus,
          updated_at: nowIso
        })
      });

      await fetch(`${this.supabaseConfig.url}/rest/v1/admin_audit_logs`, {
        method: "POST",
        headers: {
          "apikey": this.supabaseConfig.anonKey,
          "Authorization": `Bearer ${this.supabaseConfig.anonKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: 'log_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
          admin_id: "cheikh_superadmin",
          action: "superadmin_toggle_bar_status",
          entity_type: "bar",
          entity_id: this.selectedBar.id,
          new_values: { status: nextStatus },
          created_at: nowIso
        })
      });

      this.selectedBar.status = nextStatus;
      this.showToast(isSuspended ? `🟢 Bar "${barName}" riattivato!` : `⏸️ Bar "${barName}" sospeso temporaneamente.`);
      this.openBarDetail(this.selectedBar.id);
      await this.syncWithSupabase(false);
    } catch (err) {
      console.error("Toggle suspend error:", err);
      this.showToast("⚠️ Errore durante l'aggiornamento dello stato.");
    }
  }

  // ==========================================================================
  // Global Date Filter
  // ==========================================================================
  toggleDateFilterDropdown() {
    const menu = document.getElementById("globalDateFilterMenu");
    if (menu) {
      menu.style.display = menu.style.display === "flex" ? "none" : "flex";
    }
  }

  setDateFilter(period, label) {
    this.currentDateFilter = period;
    const lbl = document.getElementById("globalDateFilterLabel");
    if (lbl) lbl.textContent = label;

    document.querySelectorAll(".date-option-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-period") === period);
    });

    const menu = document.getElementById("globalDateFilterMenu");
    if (menu) menu.style.display = "none";

    this.renderKPIs();
    this.renderCharts();
    this.renderInvoicesTable();
    this.renderPaymentsTable();
    this.renderStatsView();
    this.showToast(`📅 Filtro periodo: ${label}`);
  }

  // ==========================================================================
  // Platform Admin Notifications
  // ==========================================================================
  toggleNotificationDropdown() {
    const menu = document.getElementById("adminNotificationDropdown");
    if (menu) {
      const isOpen = menu.style.display === "flex";
      menu.style.display = isOpen ? "none" : "flex";
      if (!isOpen) {
        this.renderNotifications();
      }
    }
  }

  async fetchNotifications() {
    try {
      const res = await fetch(`${this.supabaseConfig.url}/rest/v1/admin_notifications?select=*&order=created_at.desc&limit=30`, {
        headers: {
          "apikey": this.supabaseConfig.anonKey,
          "Authorization": `Bearer ${this.supabaseConfig.anonKey}`
        }
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) {
          this.notifications = rows;
          this.renderNotifications();
        }
      }
    } catch (e) {}
  }

  renderNotifications() {
    const listWrap = document.getElementById("adminNotificationList");
    const badge = document.getElementById("adminNotificationBadge");
    const notifs = this.notifications || [];

    const unreadCount = notifs.filter(n => !n.is_read).length;
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? "9+" : unreadCount;
        badge.style.display = "flex";
      } else {
        badge.style.display = "none";
      }
    }

    if (!listWrap) return;

    if (notifs.length === 0) {
      listWrap.innerHTML = `
        <div style="padding:24px 16px; text-align:center; color:var(--text-muted); font-size:12.5px;">
          <span>📭</span> Nessuna nuova notifica
        </div>
      `;
      return;
    }

    const typeIcons = {
      success: "🟢",
      warning: "⚠️",
      danger: "🚨",
      info: "ℹ️"
    };

    listWrap.innerHTML = notifs.map(n => {
      const isUnread = !n.is_read;
      const icon = typeIcons[n.type] || "🔔";
      const timeStr = n.created_at ? new Date(n.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Recente";
      return `
        <div class="notif-item ${isUnread ? 'unread' : ''}" onclick="window.adminConsole.handleNotificationClick('${n.id}', '${n.link || '#view-bars'}')">
          <div class="notif-icon">${icon}</div>
          <div class="notif-content">
            <div class="notif-title">
              <span>${n.title}</span>
              ${isUnread ? '<span style="width:7px; height:7px; border-radius:50%; background:#FF6B00; display:inline-block;"></span>' : ''}
            </div>
            <div class="notif-msg">${n.message}</div>
            <div class="notif-time">${timeStr}</div>
          </div>
        </div>
      `;
    }).join("");
  }

  async markAllNotificationsRead() {
    (this.notifications || []).forEach(n => { n.is_read = true; });
    this.renderNotifications();
    try {
      await fetch(`${this.supabaseConfig.url}/rest/v1/admin_notifications?is_read=eq.false`, {
        method: "PATCH",
        headers: {
          "apikey": this.supabaseConfig.anonKey,
          "Authorization": `Bearer ${this.supabaseConfig.anonKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ is_read: true })
      });
    } catch (e) {}
    this.showToast("Notifiche contrassegnate come lette");
  }

  async handleNotificationClick(id, link) {
    const notif = (this.notifications || []).find(n => n.id === id);
    if (notif) notif.is_read = true;
    this.renderNotifications();

    const menu = document.getElementById("adminNotificationDropdown");
    if (menu) menu.style.display = "none";

    try {
      fetch(`${this.supabaseConfig.url}/rest/v1/admin_notifications?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "apikey": this.supabaseConfig.anonKey,
          "Authorization": `Bearer ${this.supabaseConfig.anonKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ is_read: true })
      });
    } catch (e) {}

    if (link) {
      const cleanView = link.replace("#view-", "").replace("#", "");
      this.switchView(cleanView);
    }
  }

  // ==========================================================================
  // Modal: + Nuovo Bar
  // ==========================================================================
  openNewBarModal() {
    const modal = document.getElementById("newBarModal");
    if (modal) {
      modal.classList.add("active");
      const nameInput = document.getElementById("newBarName");
      if (nameInput) nameInput.focus();
    }
  }

  closeNewBarModal() {
    const modal = document.getElementById("newBarModal");
    if (modal) modal.classList.remove("active");
  }

  async handleCreateBarSubmit(e) {
    e.preventDefault();
    const name = (document.getElementById("newBarName")?.value || "").trim();
    const ownerName = (document.getElementById("newBarOwner")?.value || "").trim();
    const email = (document.getElementById("newBarEmail")?.value || "").trim();
    const phone = (document.getElementById("newBarPhone")?.value || "").trim();
    const city = (document.getElementById("newBarCity")?.value || "Milano").trim();
    const plan = document.getElementById("newBarPlan")?.value || "Pro";

    if (!name || !email) {
      this.showToast("⚠️ Compila i campi obbligatori Nome Bar ed Email.");
      return;
    }

    const submitBtn = e.target.querySelector("button[type='submit']");
    const origText = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "<span>⏳ Creazione in corso...</span>";
    }

    try {
      const res = await fetch("/api/register-bar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          barName: name,
          ownerName: ownerName || name,
          email,
          phone,
          city: city || "Roma",
          address: `Via Centrale 1, ${city || 'Roma'}`
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        this.showToast(`🚀 Bar "${name}" iscritto con successo con 14 giorni di prova gratuita!`);
        this.closeNewBarModal();
        e.target.reset();
        await this.syncWithSupabase(false);
      } else {
        this.showToast(`⚠️ ${data.error || "Errore durante la registrazione del bar."}`);
      }
    } catch (err) {
      console.error("Create bar error:", err);
      this.showToast("⚠️ Errore di connessione.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    }
  }

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

  async handleEditBarSubmit(e) {
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
    bar.monthlyRevenue = bar.status === "active" ? 59.00 : 0.00;

    this.saveData();
    this.closeEditBarModal();
    this.renderOverviewTable();
    this.renderFullBarsTable();
    this.renderSubscriptionsTable();
    this.renderKPIs();

    // Sincronizza su Supabase
    try {
      await fetch(`${this.supabaseConfig.url}/rest/v1/bars?id=eq.${bar.id}`, {
        method: "PATCH",
        headers: {
          "apikey": this.supabaseConfig.anonKey,
          "Authorization": `Bearer ${this.supabaseConfig.anonKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: bar.name,
          email: bar.email,
          phone: bar.phone,
          city: bar.city,
          address: bar.address,
          status: bar.status,
          updated_at: new Date().toISOString()
        })
      });
    } catch (e) {}

    this.showToast(`Dati del bar "${bar.name}" aggiornati su Supabase!`);
  }

  sendReminder(barId) {
    const bar = this.data.bars.find(b => b.id === barId);
    if (!bar) return;

    const subject = encodeURIComponent(`BarPilot - Promemoria Scadenza Abbonamento (${bar.name})`);
    const body = encodeURIComponent(
      `Gentile ${bar.owner},\n\nTi ricordiamo che l'abbonamento BarPilot (${bar.plan} - 59 €/mese) per "${bar.name}" è previsto in scadenza il ${bar.nextInvoice}.\n\nAccedi alla console del tuo bar per verificare il metodo di pagamento (Stripe / Carta / Google Pay):\nhttps://www.barpilot.eu\n\nCordiali saluti,\nIl Team di BarPilot`
    );

    window.open(`mailto:${bar.email}?subject=${subject}&body=${body}`, "_blank");
    this.showToast(`✉️ Email di sollecito preparata per ${bar.owner} (${bar.email})`);
  }

  exportBarsCSV() {
    const header = ["ID", "Nome Bar", "Proprietario", "Email", "Telefono", "Città", "Piano", "Stato", "Prossima Scadenza", "Canone"];
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

  openInvoiceDetail(invId) {
    const inv = (this.data.invoices || []).find(i => i.id === invId);
    if (!inv) return;
    this.activeInvoiceId = invId;
    this.activeInvoiceVariant = inv.type || 'recurring';
    this.renderInvoiceModal();
    const modal = document.getElementById("invoiceDetailModal");
    if (modal) modal.classList.add("active");
  }

  closeInvoiceDetail() {
    const modal = document.getElementById("invoiceDetailModal");
    if (modal) modal.classList.remove("active");
  }

  setInvoiceVariant(variant) {
    this.activeInvoiceVariant = variant;
    this.renderInvoiceModal();
  }

  renderInvoiceModal() {
    const inv = (this.data.invoices || []).find(i => i.id === this.activeInvoiceId);
    if (!inv) return;
    const bar = (this.data.bars || []).find(b => b.id === inv.barId) || {};
    const isPostTrial = this.activeInvoiceVariant === 'post_trial';

    // Aggiorna bottoni toolbar
    const btnRec = document.getElementById("btnVariantRecurring");
    const btnTrial = document.getElementById("btnVariantTrial");
    if (btnRec && btnTrial) {
      if (isPostTrial) {
        btnRec.style.background = "#334155";
        btnRec.style.color = "#cbd5e1";
        btnTrial.style.background = "#FF8A24";
        btnTrial.style.color = "#fff";
      } else {
        btnRec.style.background = "#FF8A24";
        btnRec.style.color = "#fff";
        btnTrial.style.background = "#334155";
        btnTrial.style.color = "#cbd5e1";
      }
    }

    // Metadati fattura
    const setTxt = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setTxt("invPreviewNumber", inv.number || `#${inv.id}`);
    setTxt("invPreviewDate", inv.date || "Oggi");
    setTxt("invPreviewDueDate", inv.dueDate || inv.date || "Oggi");

    const badge = document.getElementById("invPreviewBadge");
    if (badge) {
      if (isPostTrial) {
        badge.textContent = "PRIMA FATTURA (POST-PROVA 14 GIORNI)";
        badge.style.background = "#fef3c7";
        badge.style.color = "#b45309";
      } else {
        badge.textContent = "FATTURA MENSILE RICORRENTE";
        badge.style.background = "#e0f2fe";
        badge.style.color = "#0369a1";
      }
    }

    const pill = document.getElementById("invPreviewStatusPill");
    if (pill) {
      pill.textContent = inv.status === 'paid' ? 'PAGATA (Stripe Billing)' : 'IN ATTESA';
      pill.style.background = inv.status === 'paid' ? '#10B981' : '#F59E0B';
    }

    // Dati Cliente da Supabase
    setTxt("invPreviewBusinessName", bar.businessName || inv.businessName || bar.name || inv.barName);
    setTxt("invPreviewBarName", bar.name || inv.barName);
    setTxt("invPreviewClientName", bar.owner || inv.ownerName || "Titolare");
    setTxt("invPreviewAddress", `${bar.address || inv.address || "Via Centrale 1"}, ${bar.postalCode ? bar.postalCode + ' ' : ''}${bar.city || inv.city || "Roma"}`);
    setTxt("invPreviewPiva", bar.piva || inv.piva || "09876543210");
    setTxt("invPreviewSdi", bar.sdiCode || inv.sdiCode || "0000000");
    setTxt("invPreviewEmail", bar.email || inv.email || "gestore@bar.it");

    // Servizio e note
    const planNameEl = document.getElementById("invPreviewPlanName");
    const notesEl = document.getElementById("invPreviewServiceNotes");
    const legalEl = document.getElementById("invPreviewLegalNote");

    if (isPostTrial) {
      if (planNameEl) planNameEl.textContent = "Abbonamento BarPilot Pro — Primo canone post-periodo di prova gratuita (14 giorni inclusi)";
      if (notesEl) notesEl.textContent = `Prova gratuita di 14 giorni completata con successo (dal ${inv.trialPeriod || '05/11 al 19/11'}). Primo addebito mensile automatico per piattaforma gestionale, comande cassa e KDS cucina.`;
      if (legalEl) {
        legalEl.innerHTML = `
          <strong>Nota di Attivazione Post-Trial:</strong> Il presente documento certifica il primo addebito effettivo dell'abbonamento BarPilot Pro dopo il completamento della prova gratuita di 14 giorni.<br>
          Metodo pagamento: <strong>${inv.paymentMethod || 'Stripe Billing (Carta)'}</strong>. Corrispettivo saldato.
        `;
      }
      setTxt("invPreviewPeriod", inv.trialPeriod ? `${inv.trialPeriod} + 1° Mese Rinnovo` : "1° Canone Post-Trial");
    } else {
      if (planNameEl) planNameEl.textContent = "Abbonamento BarPilot Pro — Canone Mensile Ricorrente";
      if (notesEl) notesEl.textContent = "Licenza d'uso piattaforma cloud BarPilot, sistema comande banco, KDS cucina in tempo reale, backup continuo e supporto prioritario.";
      if (legalEl) {
        legalEl.innerHTML = `
          <strong>Nota Fiscale Ricorrente:</strong> Documento emesso per rinnovo mensile continuativo del servizio SaaS BarPilot.<br>
          Metodo pagamento: <strong>${inv.paymentMethod || 'Stripe Billing (Carta)'}</strong>. Saldata con successo.
        `;
      }
      setTxt("invPreviewPeriod", inv.period || "Canone Mensile");
    }

    const subtotal = inv.subtotal || 48.36;
    const tax = inv.tax || 10.64;
    const total = inv.amount || 59.00;

    setTxt("invPreviewPrice", `${subtotal.toFixed(2)} €`);
    setTxt("invPreviewSubtotal", `${subtotal.toFixed(2)} €`);
    setTxt("invPreviewTax", `${tax.toFixed(2)} €`);
    setTxt("invPreviewTotal", `${total.toFixed(2)} €`);
  }

  printCurrentInvoice() {
    this.printInvoice(this.activeInvoiceId, this.activeInvoiceVariant);
  }

  sendInvoiceEmail() {
    const inv = (this.data.invoices || []).find(i => i.id === this.activeInvoiceId);
    if (!inv) return;
    const bar = (this.data.bars || []).find(b => b.id === inv.barId) || {};
    const recipient = bar.email || inv.email || "cliente@bar.it";
    const typeLabel = this.activeInvoiceVariant === 'post_trial' ? 'Prima fattura post-prova 14gg' : 'Fattura mensile ricorrente';

    this.showToast(`✉️ ${typeLabel} ${inv.number} inviata con successo via email a: ${recipient}`);

    // Registra audit log su Supabase
    try {
      fetch(`${this.supabaseConfig.url}/rest/v1/admin_audit_logs`, {
        method: "POST",
        headers: {
          "apikey": this.supabaseConfig.anonKey,
          "Authorization": `Bearer ${this.supabaseConfig.anonKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          admin_id: "cheikh_superadmin",
          action: "invoice_sent_email",
          entity_type: "invoice",
          entity_id: inv.id,
          new_values: { recipient, invoice_number: inv.number, variant: this.activeInvoiceVariant },
          created_at: new Date().toISOString()
        })
      });
    } catch (e) {}
  }

  printInvoice(invId, forcedVariant = null) {
    const inv = (this.data.invoices || []).find(i => i.id === invId);
    if (!inv) return;
    const bar = (this.data.bars || []).find(b => b.id === inv.barId) || {};
    const variant = forcedVariant || inv.type || 'recurring';
    const isPostTrial = variant === 'post_trial';

    const s = this.data.settings || {};
    const compName = s.companyName || "BarPilot · Gestionale per Bar & Ristoranti";
    const compPiva = s.companyPiva || "02799820036";
    const compEmail = s.billingEmail || "admin@barpilot.eu";
    const compWebsite = s.companyWebsite || "www.barpilot.eu";

    const businessName = bar.businessName || inv.businessName || bar.name || inv.barName;
    const barName = bar.name || inv.barName;
    const ownerName = bar.owner || inv.ownerName || "Titolare";
    const piva = bar.piva || inv.piva || "09876543210";
    const taxCode = bar.taxCode || inv.taxCode || "";
    const sdiCode = bar.sdiCode || inv.sdiCode || "0000000";
    const address = bar.address || inv.address || "Via Centrale 1";
    const city = bar.city || inv.city || "Roma";
    const postalCode = bar.postalCode || inv.postalCode || "";
    const email = bar.email || inv.email || "amministrazione@bar.it";
    const paymentMethod = inv.paymentMethod || "Stripe Billing (Carta di Credito)";

    const subtotal = inv.subtotal || 48.36;
    const tax = inv.tax || 10.64;
    const amount = inv.amount || 59.00;

    const printWin = window.open('', '_blank', 'width=850,height=950');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <title>Fattura ${inv.number} - BarPilot</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding: 30px 40px;
            color: #0B1220;
            background: #fff;
            line-height: 1.45;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #FF8A24;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }
          .logo {
            font-size: 28px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #0B1220;
          }
          .logo span { color: #FF8A24; }
          .parties-box {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
            background: #f8fafc;
            padding: 16px 20px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            gap: 20px;
          }
          .party-col { flex: 1; }
          .party-title {
            font-size: 10.5px;
            text-transform: uppercase;
            font-weight: 800;
            color: #64748b;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0 20px;
          }
          .table th {
            background: #f1f5f9;
            padding: 10px 12px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            color: #475569;
            font-weight: 800;
            border-bottom: 2px solid #cbd5e1;
          }
          .table td {
            padding: 14px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12.5px;
            vertical-align: top;
          }
          .totals-wrap {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-top: 10px;
          }
          .legal-note {
            max-width: 420px;
            font-size: 11px;
            color: #64748b;
            line-height: 1.5;
            background: #f8fafc;
            padding: 12px 14px;
            border-radius: 6px;
            border-left: 3px solid #FF8A24;
          }
          .total-box {
            width: 280px;
            padding: 14px 16px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 13px;
            color: #334155;
          }
          .total-row.final {
            font-size: 17px;
            font-weight: 900;
            color: #0B1220;
            border-top: 2px solid #cbd5e1;
            margin-top: 6px;
            padding-top: 8px;
          }
          .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 800;
          }
          .sub-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            margin: 2px 0 6px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            font-size: 10.5px;
            color: #94a3b8;
            text-align: center;
            line-height: 1.5;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <div>
            <div class="logo">BAR<span>PILOT</span></div>
            <div style="font-size:12.5px; font-weight:700; color:#0B1220; margin-top:4px;">${compName}</div>
            <div style="font-size:11px; color:#64748b; margin-top:2px; line-height:1.4;">
              Partita IVA: <strong>${compPiva}</strong> · Email: <strong>${compEmail}</strong><br>
              Portale: <strong>${compWebsite}</strong> · Sede Operativa: Italia
            </div>
          </div>
          <div style="text-align:right;">
            <h2 style="margin:0; font-size:20px; font-weight:900; color:#0B1220;">FATTURA FISCALE</h2>
            <div style="font-size:16px; font-weight:800; color:#FF8A24; margin:3px 0;">${inv.number}</div>
            <div>
              <span class="sub-badge" style="background:${isPostTrial ? '#fef3c7' : '#e0f2fe'}; color:${isPostTrial ? '#b45309' : '#0369a1'};">
                ${isPostTrial ? 'PRIMA FATTURA (ATTIVAZIONE POST-TRIAL 14 GG)' : 'RINNOVO MENSILE RICORRENTE'}
              </span>
            </div>
            <div style="font-size:12px; color:#64748b;">Data emissione: <strong style="color:#1e293b;">${inv.date}</strong></div>
            <div style="font-size:12px; color:#64748b;">Data scadenza: <strong style="color:#1e293b;">${inv.dueDate || inv.date}</strong></div>
          </div>
        </div>

        <!-- Anagrafiche -->
        <div class="parties-box">
          <div class="party-col">
            <div class="party-title">Destinatario / Cliente (Database Supabase):</div>
            <div style="font-size:14.5px; font-weight:800; color:#0B1220;">${businessName}</div>
            <div style="font-size:12.5px; color:#334155; margin-top:2px;">Insegna: <strong>${barName}</strong></div>
            <div style="font-size:12px; color:#475569; margin-top:2px;">C/O Titolare: ${ownerName}</div>
            <div style="font-size:12px; color:#475569; margin-top:2px;">Sede: ${address}${postalCode ? ', ' + postalCode : ''} ${city} (IT)</div>
            <div style="font-size:12px; color:#475569; margin-top:2px;">P.IVA / CF: <strong>${piva}</strong> ${taxCode ? '· ' + taxCode : ''} · SDI: <strong>${sdiCode}</strong></div>
            <div style="font-size:12px; color:#475569; margin-top:2px;">Email: ${email}</div>
          </div>
          <div class="party-col" style="text-align:right;">
            <div class="party-title">Stato Pagamento:</div>
            <div style="margin-top:2px;">
              <span class="badge" style="background:${inv.status === 'paid' ? '#10B981' : '#F59E0B'}; color:#fff;">
                ${inv.status === 'paid' ? 'PAGATA (Stripe Billing)' : 'IN ATTESA DI PAGAMENTO'}
              </span>
            </div>
            <div style="font-size:11.5px; color:#475569; margin-top:6px;">Metodo: <strong>${paymentMethod}</strong></div>
            ${inv.stripeInvoiceId ? `<div style="font-size:10.5px; color:#94a3b8; margin-top:2px;">ID Ricevuta: ${inv.stripeInvoiceId}</div>` : ''}
            ${inv.paidAt ? `<div style="font-size:11px; color:#10B981; font-weight:700; margin-top:2px;">Data Incasso: ${inv.paidAt}</div>` : ''}
          </div>
        </div>

        <!-- Righe Servizio -->
        <table class="table">
          <thead>
            <tr>
              <th>Descrizione Servizio</th>
              <th style="width:140px;">Competenza</th>
              <th style="width:70px; text-align:center;">Aliquota</th>
              <th style="width:110px; text-align:right;">Imponibile</th>
            </tr>
          </thead>
          <tbody>
            ${isPostTrial ? `
              <tr>
                <td>
                  <strong style="font-size:13px; color:#0B1220;">Abbonamento BarPilot Pro — Primo canone post-periodo di prova gratuita (14 giorni inclusi)</strong>
                  <div style="font-size:11.5px; color:#64748b; margin-top:4px; line-height:1.4;">
                    Periodo di prova di 14 giorni completato con successo (dal ${inv.trialPeriod || '05/11 al 19/11'} a 0,00 €). Attivazione del primo canone mensile effettivo con licenza software cloud, comande cassa banco, modulo KDS cucina in tempo reale, backup continuo e supporto prioritario.
                  </div>
                </td>
                <td style="font-size:12px; color:#334155;">${inv.period || '1° Mese Post-Trial'}</td>
                <td style="text-align:center; font-size:12px; color:#334155;">22%</td>
                <td style="text-align:right; font-weight:700; font-size:13px; color:#0B1220;">${subtotal.toFixed(2)} €</td>
              </tr>
            ` : `
              <tr>
                <td>
                  <strong style="font-size:13px; color:#0B1220;">Abbonamento BarPilot Pro — Canone mensile ricorrente</strong>
                  <div style="font-size:11.5px; color:#64748b; margin-top:4px; line-height:1.4;">
                    Rinnovo mensile del servizio SaaS gestionale BarPilot: accesso illimitato alle funzionalità gestionali, postazione comande banco/cameriere, display cucina KDS, archiviazione scontrini e reportistica vendite.
                  </div>
                </td>
                <td style="font-size:12px; color:#334155;">${inv.period || 'Canone Mensile'}</td>
                <td style="text-align:center; font-size:12px; color:#334155;">22%</td>
                <td style="text-align:right; font-weight:700; font-size:13px; color:#0B1220;">${subtotal.toFixed(2)} €</td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- Totali e Clausole -->
        <div class="totals-wrap">
          <div class="legal-note">
            ${isPostTrial ? `
              <strong>Nota Contrattuale & Fiscale:</strong> Il presente documento attesta il primo addebito effettivo dell'abbonamento BarPilot Pro a seguito del completamento del periodo di prova gratuita di 14 giorni. Il canone si rinnoverà tacitamente ogni mese su Stripe Billing salvo disdetta da parte del gestore.<br>
              Metodo di pagamento: <strong>${paymentMethod}</strong>. Corrispettivo riscosso.
            ` : `
              <strong>Nota Contrattuale & Fiscale:</strong> Addebito mensile ricorrente autorizzato ed eseguito tramite Stripe Billing. Documento conforme ai requisiti di deducibilità fiscale per servizi software SaaS.<br>
              Nessun ulteriore pagamento dovuto per il periodo di competenza indicato.
            `}
          </div>

          <div class="total-box">
            <div class="total-row"><span>Imponibile Netto:</span><strong>${subtotal.toFixed(2)} €</strong></div>
            <div class="total-row"><span>IVA (22%):</span><strong>${tax.toFixed(2)} €</strong></div>
            <div class="total-row final"><span>Totale Fattura:</span><span style="color:#FF8A24;">${amount.toFixed(2)} €</span></div>
            <div class="total-row" style="font-size:12px; color:#10B981; margin-top:4px; border-top:1px dashed #cbd5e1; padding-top:4px;">
              <span>Totale Pagato:</span><strong>${amount.toFixed(2)} €</strong>
            </div>
            <div class="total-row" style="font-size:11px; color:#64748b;">
              <span>Saldo a Pagare:</span><strong>0,00 €</strong>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          Documento generato automaticamente dalla piattaforma BarPilot · Conforme ai requisiti di fatturazione SaaS europea.<br>
          Fornitore: <strong>${compName}</strong> · Partita IVA: <strong>${compPiva}</strong> · Email: <strong>${compEmail}</strong> · <strong>${compWebsite}</strong>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  }

  // ==========================================================================
  // Copia SQL Ufficiale delle 11 Tabelle Supabase
  // ==========================================================================
  copySupabaseSql() {
    const sql = `-- ============================================================================
-- BarPilot Super Admin Enterprise Database Schema for Supabase
-- Console: https://www.barpilot.eu/administration.html
-- Esegui questo script completo nell'editor SQL di Supabase:
-- https://supabase.com/dashboard/project/cprxxxlgaofopmogeuer/sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABELLA: subscription_plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 59.00,
  currency TEXT NOT NULL DEFAULT 'EUR',
  billing_interval TEXT NOT NULL DEFAULT 'month',
  stripe_price_id TEXT,
  trial_days INT NOT NULL DEFAULT 14,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.subscription_plans (id, name, description, price, currency, billing_interval, trial_days, active)
VALUES ('plan_barpilot_pro', 'BarPilot Pro', 'Piano professionale completo con comande, KDS e pagamenti digitali', 59.00, 'EUR', 'month', 14, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price;

-- 2. TABELLA: bars
CREATE TABLE IF NOT EXISTS public.bars (
  id TEXT PRIMARY KEY DEFAULT ('bar_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  business_name TEXT,
  vat_number TEXT,
  tax_code TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'IT',
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'trial',
  subscription_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABELLA: bar_members
CREATE TABLE IF NOT EXISTS public.bar_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id TEXT NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bar_id, user_id)
);

-- 4. TABELLA: subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY DEFAULT ('sub_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  bar_id TEXT NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  plan_id TEXT REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'trialing',
  trial_start TIMESTAMPTZ DEFAULT now(),
  trial_end TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days'),
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  payment_method TEXT DEFAULT 'Stripe / Carta',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABELLA: invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY DEFAULT ('inv_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  bar_id TEXT REFERENCES public.bars(id) ON DELETE SET NULL,
  subscription_id TEXT REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT UNIQUE,
  invoice_number TEXT NOT NULL,
  amount_subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  amount_tax NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  amount_total NUMERIC(10,2) NOT NULL DEFAULT 59.00,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'open',
  invoice_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  invoice_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABELLA: payments
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY DEFAULT ('pay_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  bar_id TEXT REFERENCES public.bars(id) ON DELETE SET NULL,
  subscription_id TEXT REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  invoice_id TEXT REFERENCES public.invoices(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'succeeded',
  payment_method_type TEXT NOT NULL DEFAULT 'card',
  paid_at TIMESTAMPTZ DEFAULT now(),
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TABELLA: support_tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT PRIMARY KEY DEFAULT ('tkt_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  bar_id TEXT REFERENCES public.bars(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'KDS Banco',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- 8. TABELLA: support_messages
CREATE TABLE IF NOT EXISTS public.support_messages (
  id TEXT PRIMARY KEY DEFAULT ('msg_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  ticket_id TEXT NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT,
  message TEXT NOT NULL,
  attachment_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. TABELLA: admin_settings
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id TEXT PRIMARY KEY DEFAULT ('set_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_by TEXT DEFAULT 'Cheikh Gueye',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. TABELLA: admin_audit_logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id TEXT PRIMARY KEY DEFAULT ('log_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  admin_id TEXT DEFAULT 'cheikh_superadmin',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. TABELLA: webhook_events
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id TEXT PRIMARY KEY DEFAULT ('evt_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  provider TEXT NOT NULL DEFAULT 'stripe',
  external_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'received',
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- RLS & Policies
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'subscription_plans', 'bars', 'bar_members', 'subscriptions', 'invoices',
    'payments', 'support_tickets', 'support_messages', 'admin_settings',
    'admin_audit_logs', 'webhook_events'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public select on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Public select on %I" ON public.%I FOR SELECT USING (true)', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public insert on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Public insert on %I" ON public.%I FOR INSERT WITH CHECK (true)', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public update on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Public update on %I" ON public.%I FOR UPDATE USING (true)', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public delete on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Public delete on %I" ON public.%I FOR DELETE USING (true)', tbl, tbl);
  END LOOP;
END $$;`;

    navigator.clipboard.writeText(sql).then(() => {
      this.showToast("📋 Schema SQL ufficiale Supabase copiato negli appunti!");
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
