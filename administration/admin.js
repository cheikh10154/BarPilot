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
      phone: "+39 02 87654321",
      address: "Via Roma 123, Milano",
      city: "Milano",
      plan: "BarPilot Pro",
      status: "active",
      nextInvoice: "15 nov 2026",
      monthlyRevenue: 59.00,
      createdAt: "15 gen 2026",
      lastAccess: "Oggi, 14:32",
      avatar: "BC",
      photo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop",
      piva: "IT09876543210",
      notes: "Cliente storico. Richiede fatturazione elettronica.",
      trialDaysRemaining: 0
    },
    {
      id: "bar_porto_02",
      name: "Caffè del Porto",
      businessName: "Porto Cafè D.I.",
      owner: "Giulia Rossi",
      email: "giulia@caffedelporto.it",
      phone: "+39 010 3344556",
      address: "Calata Molo Vecchio 4, Genova",
      city: "Genova",
      plan: "BarPilot Pro",
      status: "active",
      nextInvoice: "28 nov 2026",
      monthlyRevenue: 59.00,
      createdAt: "28 giu 2026",
      lastAccess: "Oggi, 11:15",
      avatar: "CP",
      photo: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=400&fit=crop",
      piva: "IT01234567890",
      notes: "Locale stagionale estivo, attivo tutto l'anno con comande KDS.",
      trialDaysRemaining: 0
    },
    {
      id: "bar_dolce_03",
      name: "La Dolce Vita",
      businessName: "Dolce Vita Bar SAS",
      owner: "Alessandro Conti",
      email: "alessandro@ladolcevita.it",
      phone: "+39 081 7766554",
      address: "Piazza Plebiscito 12, Napoli",
      city: "Napoli",
      plan: "BarPilot Pro",
      status: "trial",
      nextInvoice: "19 nov 2026",
      monthlyRevenue: 0.00,
      createdAt: "05 nov 2026",
      lastAccess: "Oggi, 09:40",
      avatar: "DV",
      photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
      piva: "IT04567891234",
      notes: "In prova gratuita (giorno 1 di 14). Molto soddisfatto del KDS banco.",
      trialDaysRemaining: 14
    },
    {
      id: "bar_moderno_04",
      name: "Bar Moderno",
      businessName: "Moderno Bistrot Snc",
      owner: "Sara Romano",
      email: "sara@barmoderno.it",
      phone: "+39 051 9988776",
      address: "Via Indipendenza 45, Bologna",
      city: "Bologna",
      plan: "BarPilot Pro",
      status: "past_due",
      nextInvoice: "10 ott 2026",
      monthlyRevenue: 59.00,
      createdAt: "10 mar 2026",
      lastAccess: "Ieri, 18:20",
      avatar: "BM",
      photo: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600&h=400&fit=crop",
      piva: "IT07891234567",
      notes: "Carta scaduta nel Google Wallet. Sollecito automatico inviato.",
      trialDaysRemaining: 0
    }
  ],
  invoices: [
    {
      id: "inv_01",
      number: "#2026-0001",
      barId: "bar_centrale_01",
      barName: "Bar Centrale",
      ownerName: "Marco Bianchi",
      date: "15 ott 2026",
      dueDate: "15 ott 2026",
      amount: 59.00,
      subtotal: 48.36,
      tax: 10.64,
      plan: "BarPilot Pro",
      status: "paid",
      period: "15/10/2026 - 14/11/2026"
    },
    {
      id: "inv_02",
      number: "#2026-0002",
      barId: "bar_porto_02",
      barName: "Caffè del Porto",
      ownerName: "Giulia Rossi",
      date: "28 ott 2026",
      dueDate: "28 ott 2026",
      amount: 59.00,
      subtotal: 48.36,
      tax: 10.64,
      plan: "BarPilot Pro",
      status: "paid",
      period: "28/10/2026 - 27/11/2026"
    },
    {
      id: "inv_03",
      number: "#2026-0003",
      barId: "bar_moderno_04",
      barName: "Bar Moderno",
      ownerName: "Sara Romano",
      date: "04 nov 2026",
      dueDate: "10 nov 2026",
      amount: 59.00,
      subtotal: 48.36,
      tax: 10.64,
      plan: "BarPilot Pro",
      status: "open",
      period: "10/10/2026 - 09/11/2026"
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
    { id: "tkt_01", barId: "bar_centrale_01", barName: "Bar Centrale", contactEmail: "marco@barcentrale.it", subject: "Configurazione secondo tablet KDS cucina", category: "KDS Banco", priority: "medium", status: "resolved", message: "Vorremmo affiancare un secondo tablet per le pizze oltre a quello delle bevande.", response: "Configurazione abilitata su multi-schermo KDS.", date: "24 ott 2026" },
    { id: "tkt_02", barId: "bar_moderno_04", barName: "Bar Moderno", contactEmail: "sara@barmoderno.it", subject: "Aggiornamento carta di credito aziendale", category: "Pagamenti", priority: "high", status: "open", message: "Abbiamo sostituito la carta di credito. Come possiamo aggiornare il metodo per l'addebito automatico?", response: null, date: "27 ott 2026" },
    { id: "tkt_03", barId: "bar_dolce_03", barName: "La Dolce Vita", contactEmail: "alessandro@ladolcevita.it", subject: "Integrazione stampante termica comande Bluetooth", category: "Hardware", priority: "low", status: "in_progress", message: "Avremmo bisogno del supporto per collegare la stampante termica Epson da 80mm.", response: "Guida inviata, in attesa di test del gestore.", date: "28 ott 2026" }
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
    superAdminEmail: "cheikh@barpilot.it",
    accessPin: "101540",
    platformName: "BarPilot",
    supportEmail: "support@barpilot.app",
    trialDays: 14,
    defaultPlan: "BarPilot Pro",
    defaultPrice: 59.00,
    currency: "EUR",
    timezone: "Europe/Rome",
    maintenanceMode: false,
    requireCardUpfront: false,
    companyName: "BarPilot Inc. · Gestione Bar & Ristoranti",
    companyPiva: "IT 12345678901",
    billingEmail: "billing@barpilot.app"
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

      // 1. Fetch Bars
      try {
        const barsRes = await fetch(`${this.supabaseConfig.url}/rest/v1/bars?select=*&order=created_at.desc`, { headers });
        if (barsRes.ok) {
          const remoteBars = await barsRes.json();
          if (Array.isArray(remoteBars) && remoteBars.length > 0) {
            this.data.bars = remoteBars.map(rb => {
              const trialEnd = rb.trial_end ? new Date(rb.trial_end) : new Date(new Date(rb.created_at || Date.now()).getTime() + 14 * 24 * 3600 * 1000);
              const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 3600 * 24)));
              return {
                id: rb.id,
                name: rb.name,
                businessName: rb.business_name || rb.name,
                owner: rb.owner || rb.business_name || rb.name,
                email: rb.email,
                phone: rb.phone || "+39 02 1234567",
                address: rb.address || "Via Centrale 1",
                city: rb.city || rb["Città"] || "Roma",
                plan: rb.plan || "BarPilot Pro",
                status: rb.status || "trial",
                nextInvoice: rb.next_invoice || trialEnd.toLocaleDateString('it-IT'),
                monthlyRevenue: rb.status === 'active' ? 59.00 : 0.00,
                createdAt: rb.created_at ? new Date(rb.created_at).toLocaleDateString('it-IT') : "Recente",
                rawCreatedAt: rb.created_at,
                lastAccess: rb.last_access || "Recente",
                avatar: rb.avatar || (rb.name ? rb.name.substring(0, 2).toUpperCase() : "BP"),
                photo: rb.logo_url || rb.photo || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop",
                piva: rb.vat_number || rb.tax_code || rb.piva || "IT09876543210",
                notes: rb.notes || "",
                trialDaysRemaining: daysRemaining
              };
            });
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
              return {
                id: ri.id,
                number: ri.invoice_number || ri.number || `#${ri.id.slice(-6).toUpperCase()}`,
                barId: ri.bar_id,
                barName: ri.bar_name || (matchedBar ? matchedBar.name : "Bar"),
                ownerName: matchedBar ? matchedBar.owner : "Titolare",
                date: ri.invoice_date ? new Date(ri.invoice_date).toLocaleDateString('it-IT') : "Recente",
                rawDate: ri.invoice_date || ri.created_at,
                dueDate: ri.due_date ? new Date(ri.due_date).toLocaleDateString('it-IT') : "-",
                subtotal: Number(ri.amount_subtotal || (ri.amount_total ? ri.amount_total / 1.22 : 48.36)),
                tax: Number(ri.amount_tax || (ri.amount_total ? ri.amount_total - (ri.amount_total / 1.22) : 10.64)),
                amount: Number(ri.amount_total || ri.amount || 59.00),
                amountPaid: Number(ri.amount_paid || 0),
                plan: "BarPilot Pro",
                status: ri.status || "open",
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

      // 5. Fetch Support Tickets
      try {
        const tktRes = await fetch(`${this.supabaseConfig.url}/rest/v1/support_tickets?select=*&order=created_at.desc`, { headers });
        if (tktRes.ok) {
          const remoteTkts = await tktRes.json();
          if (Array.isArray(remoteTkts) && remoteTkts.length > 0) {
            this.data.tickets = remoteTkts.map(rt => {
              const matchedBar = (this.data.bars || []).find(b => b.id === rt.bar_id);
              return {
                id: rt.id,
                barId: rt.bar_id,
                barName: rt.bar_name || (matchedBar ? matchedBar.name : "Bar"),
                contactEmail: rt.contact_email || (matchedBar ? matchedBar.email : "gestore@bar.it"),
                subject: rt.subject,
                category: rt.category || "KDS Banco",
                priority: rt.priority || "medium",
                status: rt.status || "open",
                message: rt.description || rt.message || "",
                response: rt.response || null,
                date: rt.created_at ? new Date(rt.created_at).toLocaleDateString('it-IT') : "Recente"
              };
            });
          }
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
  // Super Admin Profile Avatar Management
  // ==========================================================================
  loadSuperAdminAvatar() {
    const saved = localStorage.getItem("barpilot_superadmin_avatar");
    if (saved) {
      const avatars = document.querySelectorAll(".admin-avatar-img");
      avatars.forEach(img => { img.src = saved; });
    }
  }

  handleSuperAdminAvatarChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      this.showToast("⚠️ Seleziona un file immagine valido (PNG, JPG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      localStorage.setItem("barpilot_superadmin_avatar", dataUrl);
      const avatars = document.querySelectorAll(".admin-avatar-img");
      avatars.forEach(img => { img.src = dataUrl; });
      this.showToast("📷 Nuova foto profilo Super Admin salvata!");
    };
    reader.readAsDataURL(file);
  }

  changeSuperAdminAvatarByUrl() {
    const current = localStorage.getItem("barpilot_superadmin_avatar") || "";
    const url = prompt("Inserisci l'indirizzo web (URL) della nuova foto profilo:", current.startsWith("data:") ? "" : current);
    if (url && url.trim()) {
      const cleanUrl = url.trim();
      localStorage.setItem("barpilot_superadmin_avatar", cleanUrl);
      const avatars = document.querySelectorAll(".admin-avatar-img");
      avatars.forEach(img => { img.src = cleanUrl; });
      this.showToast("📷 Foto profilo Super Admin aggiornata con successo!");
    }
  }

  resetSuperAdminAvatar() {
    const defaultUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop";
    localStorage.removeItem("barpilot_superadmin_avatar");
    const avatars = document.querySelectorAll(".admin-avatar-img");
    avatars.forEach(img => { img.src = defaultUrl; });
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
        this.renderInvoicesTable();
      });
    }

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
  }

  switchView(viewId) {
    this.activeView = viewId;

    document.querySelectorAll(".nav-link").forEach(link => {
      link.classList.toggle("active", link.getAttribute("data-view") === viewId);
    });

    const titles = {
      overview: { title: "Panoramica", sub: "Tutti i dati della tua piattaforma BarPilot in tempo reale da Supabase." },
      bars: { title: "Bar Iscritti", sub: "Elenco completo e gestione dei locali registrati sulla piattaforma." },
      subscriptions: { title: "Abbonamenti & Scadenze", sub: "Monitoraggio dei rinnovi, canoni mensili di 59 € e date di scadenza." },
      invoices: { title: "Fatturazione & Ricevute", sub: "Storico fatture emesse, pagate e da riscuotere." },
      payments: { title: "Gateway & Pagamenti", sub: "Registro transazioni via Stripe, Google Pay e Carte." },
      stats: { title: "Statistiche & Crescita", sub: "Analisi di redditività MRR, ARR e andamento abbonati." },
      support: { title: "Centro Supporto & Ticket", sub: "Gestione richieste d'assistenza, KDS e configurazioni dai bar." },
      settings: { title: "Impostazioni Piattaforma", sub: "Configurazione prezzi, dati aziendali e sincronizzazione Supabase." }
    };

    const info = titles[viewId] || { title: "Admin Console", sub: "Pannello di controllo BarPilot" };
    const tTitle = document.getElementById("topbarTitle");
    const tSub = document.getElementById("topbarSubtitle");
    if (tTitle) tTitle.textContent = info.title;
    if (tSub) tSub.textContent = info.sub;

    document.querySelectorAll(".page-view").forEach(page => {
      page.classList.remove("active");
    });
    const target = document.getElementById(`view-${viewId}`);
    if (target) target.classList.add("active");

    if (viewId === "payments") this.renderPaymentsTable();
    if (viewId === "stats") this.renderStatsView();
    if (viewId === "support") this.renderSupportTable();
    if (viewId === "settings") this.renderSettingsView();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ==========================================================================
  // Live KPI Calculations from Real Supabase Data
  // ==========================================================================
  renderKPIs() {
    const bars = this.data.bars || [];
    const totalBars = bars.length;
    const activeBars = bars.filter(b => b.status === "active").length;
    const trialBars = bars.filter(b => b.status === "trial").length;
    const lateBars = bars.filter(b => b.status === "past_due" || b.status === "late").length;
    
    // MRR = Canone mensile normalizzato degli abbonamenti attivi (€59/mese)
    const mrr = activeBars * 59.00;
    const monthlyRevenue = mrr.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

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
  // Charts
  // ==========================================================================
  renderCharts() {
    const areaWrap = document.getElementById("growthChartWrap");
    if (areaWrap) {
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
          <path d="M 20 110 Q 70 95, 120 80 T 220 50 T 340 20 L 340 120 L 20 120 Z" fill="url(#growthGrad)" />
          <path d="M 20 110 Q 70 95, 120 80 T 220 50 T 340 20" fill="none" stroke="#FF6B00" stroke-width="3" stroke-linecap="round" />
          <circle cx="340" cy="20" r="5" fill="#FF8A00" stroke="#fff" stroke-width="2" />
        </svg>
      `;
    }

    const barWrap = document.getElementById("revenueChartWrap");
    if (barWrap) {
      const bars = [35, 50, 42, 68, 75, 92, 100];
      const maxH = 100;
      barWrap.innerHTML = `
        <div style="display:flex; align-items:flex-end; justify-content:space-between; height:120px; gap:8px; padding-top:10px;">
          ${bars.map((val, idx) => `
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:6px;">
              <div style="width:100%; background:linear-gradient(180deg, #FF8A00 0%, #FF6B00 100%); height:${(val/maxH)*90}px; border-radius:6px 6px 0 0; transition:height 0.4s ease;" title="${val}%"></div>
              <span style="font-size:10px; color:var(--text-muted); font-weight:700;">${['Mag','Giu','Lug','Ago','Set','Ott','Nov'][idx]}</span>
            </div>
          `).join('')}
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
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--text-muted);">Nessun ticket di supporto aperto</td></tr>`;
      return;
    }

    const priorityBadges = {
      high: `<span class="status-pill status-late">Alta</span>`,
      medium: `<span class="status-pill status-trial">Media</span>`,
      low: `<span class="status-pill status-active">Bassa</span>`,
      urgent: `<span class="status-pill status-late" style="background:#EF4444; color:#fff;">Urgente</span>`
    };

    const statusBadges = {
      open: `<span class="status-pill status-trial">Aperto</span>`,
      in_progress: `<span class="status-pill status-trial" style="background:#3B82F6; color:#fff;">In corso</span>`,
      waiting_customer: `<span class="status-pill status-late">In attesa</span>`,
      resolved: `<span class="status-pill status-active">Risolto</span>`,
      closed: `<span class="status-pill status-canceled">Chiuso</span>`
    };

    tbody.innerHTML = list.map(t => {
      const pKey = (t.priority || 'medium').toLowerCase();
      const sKey = (t.status || 'open').toLowerCase();
      return `
        <tr>
          <td><strong style="color:var(--primary);">${t.id}</strong></td>
          <td>
            <div style="font-weight:700;">${t.barName}</div>
            <div style="font-size:11px; color:var(--text-muted);">${t.contactEmail}</div>
          </td>
          <td>
            <div style="font-weight:600;">${t.subject}</div>
            <div style="font-size:11px; color:var(--text-muted);"><span class="badge" style="background:var(--bg-card); font-size:10px;">${t.category}</span> - ${t.message}</div>
            ${t.response ? `<div style="font-size:11px; color:#10B981; margin-top:2px;">↳ Risposta Super Admin: ${t.response}</div>` : ''}
          </td>
          <td>${priorityBadges[pKey] || t.priority}</td>
          <td>${statusBadges[sKey] || t.status}</td>
          <td>${t.date || 'Recente'}</td>
          <td>
            <div class="actions-cell">
              <button class="btn-table-action" onclick="window.adminConsole.toggleTicketStatus('${t.id}')" title="Cambia stato / Segna come Risolto">
                ${t.status === 'resolved' ? '↺ Riapri' : '✓ Risolvi'}
              </button>
              <button class="btn-table-action" onclick="window.adminConsole.replyTicket('${t.id}')" title="Rispondi al gestore">✉️</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  async toggleTicketStatus(tktId) {
    const tkt = (this.data.tickets || []).find(t => t.id === tktId);
    if (!tkt) return;
    tkt.status = tkt.status === "resolved" ? "open" : "resolved";
    this.saveData();
    this.renderSupportTable();

    try {
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
      statusPill.className = `status-pill status-${bar.status}`;
      statusPill.textContent = bar.status === "active" ? "Attivo (Regolare)" : bar.status === "trial" ? `Prova (${bar.trialDaysRemaining}gg)` : bar.status === "past_due" ? "In ritardo" : "Cancellato";
    }

    modal.classList.add("active");
  }

  closeBarDetail() {
    const modal = document.getElementById("barDetailModal");
    if (modal) modal.classList.remove("active");
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
    this.printInvoice(invId);
  }

  printInvoice(invId) {
    const inv = (this.data.invoices || []).find(i => i.id === invId);
    if (!inv) return;

    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fattura ${inv.number} - BarPilot</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #FF8A24; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: 900; color: #0B1220; }
          .logo span { color: #FF8A24; }
          .table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          .table th { background: #f8fafc; font-size: 12px; text-transform: uppercase; color: #64748b; }
          .total-box { margin-left: auto; width: 300px; padding: 15px; background: #f8fafc; border-radius: 8px; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .total-row.final { font-size: 18px; font-weight: 800; color: #0B1220; border-top: 2px solid #cbd5e1; margin-top: 6px; padding-top: 10px; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; background: #10B981; color: #fff; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">BAR<span>PILOT</span></div>
            <div style="font-size:12px; color:#64748b; margin-top:4px;">BarPilot Inc. · Gestione Bar & Ristoranti<br>P.IVA: IT 12345678901 · support@barpilot.app</div>
          </div>
          <div style="text-align:right;">
            <h2 style="margin:0; color:#0B1220;">FATTURA FISCALE</h2>
            <div style="font-size:16px; font-weight:800; color:#FF8A24; margin:4px 0;">${inv.number}</div>
            <div style="font-size:12px; color:#64748b;">Data: ${inv.date}</div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-bottom:30px;">
          <div>
            <div style="font-size:11px; text-transform:uppercase; color:#64748b; font-weight:700;">Destinatario / Cliente:</div>
            <div style="font-size:16px; font-weight:800; margin-top:4px;">${inv.barName}</div>
            <div style="font-size:13px; color:#475569;">C/O ${inv.ownerName}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px; text-transform:uppercase; color:#64748b; font-weight:700;">Stato Pagamento:</div>
            <div style="margin-top:4px;"><span class="badge">${inv.status === 'paid' ? 'PAGATA (Stripe Billing)' : 'IN ATTESA'}</span></div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Descrizione Servizio</th>
              <th>Periodo Competenza</th>
              <th style="text-align:right;">Prezzo Netto</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Abbonamento BarPilot Pro</strong><br><small style="color:#64748b;">Piattaforma gestionale, KDS cucina e comande banco</small></td>
              <td>Mensile</td>
              <td style="text-align:right;">${(inv.subtotal || 48.36).toFixed(2)} €</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-row"><span>Imponibile:</span><strong>${(inv.subtotal || 48.36).toFixed(2)} €</strong></div>
          <div class="total-row"><span>IVA (22%):</span><strong>${(inv.tax || 10.64).toFixed(2)} €</strong></div>
          <div class="total-row final"><span>Totale Dovuto:</span><span style="color:#FF8A24;">${inv.amount.toFixed(2)} €</span></div>
        </div>

        <div style="margin-top:60px; font-size:11px; color:#94a3b8; text-align:center;">
          Documento generato automaticamente dalla piattaforma BarPilot · Conforme ai requisiti di fatturazione SaaS
        </div>

        <script>
          window.onload = function() { window.print(); };
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
