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
  ],
  subscriptions: [
    { id: "sub-01", barId: "bp-bar-01", barName: "Bar Centrale", plan: "Pro", price: 59.00, billingCycle: "Mensile", status: "active", paymentMethod: "Google Pay", currentPeriodEnd: "15/11/2025" },
    { id: "sub-02", barId: "bp-bar-02", barName: "Caffè del Porto", plan: "Basic", price: 38.00, billingCycle: "Mensile", status: "active", paymentMethod: "Carta (Stripe)", currentPeriodEnd: "28/11/2025" },
    { id: "sub-03", barId: "bp-bar-03", barName: "La Dolce Vita", plan: "Pro", price: 59.00, billingCycle: "Mensile", status: "trial", paymentMethod: "Google Pay (In prova)", currentPeriodEnd: "10/11/2025" },
    { id: "sub-04", barId: "bp-bar-04", barName: "Bar Moderno", plan: "Pro", price: 59.00, billingCycle: "Mensile", status: "late", paymentMethod: "Carta Scaduta (Stripe)", currentPeriodEnd: "10/10/2025" },
    { id: "sub-05", barId: "bp-bar-05", barName: "Lounge 21", plan: "Premium", price: 99.00, billingCycle: "Mensile", status: "active", paymentMethod: "Google Pay", currentPeriodEnd: "22/11/2025" },
    { id: "sub-06", barId: "bp-bar-06", barName: "Bar Nettuno", plan: "Basic", price: 38.00, billingCycle: "Mensile", status: "canceled", paymentMethod: "Nessuno", currentPeriodEnd: "28/10/2025" },
    { id: "sub-07", barId: "bp-bar-07", barName: "Il Ritrovo", plan: "Pro", price: 59.00, billingCycle: "Mensile", status: "active", paymentMethod: "SEPA Direct", currentPeriodEnd: "18/11/2025" },
    { id: "sub-08", barId: "bp-bar-08", barName: "Bar Firenze", plan: "Basic", price: 38.00, billingCycle: "Mensile", status: "late", paymentMethod: "Carta (Stripe)", currentPeriodEnd: "05/10/2025" }
  ],
  payments: [
    { id: "pay-01", transactionId: "txn_gpay_9823412", barId: "bp-bar-01", barName: "Bar Centrale", amount: 59.00, method: "Google Pay", status: "completed", date: "15 ott 2025, 10:14" },
    { id: "pay-02", transactionId: "txn_strp_8849201", barId: "bp-bar-05", barName: "Lounge 21", amount: 99.00, method: "Carta (Stripe)", status: "completed", date: "15 ott 2025, 11:20" },
    { id: "pay-03", transactionId: "txn_strp_7739102", barId: "bp-bar-02", barName: "Caffè del Porto", amount: 38.00, method: "Carta (Stripe)", status: "completed", date: "15 ott 2025, 12:45" },
    { id: "pay-04", transactionId: "txn_sepa_1192840", barId: "bp-bar-07", barName: "Il Ritrovo", amount: 59.00, method: "SEPA Direct", status: "completed", date: "01 ott 2025, 09:00" },
    { id: "pay-05", transactionId: "txn_gpay_3329104", barId: "bp-bar-04", barName: "Bar Moderno", amount: 59.00, method: "Google Pay", status: "failed", date: "05 ott 2025, 14:10" }
  ],
  stats: {
    mrr: 12480.00,
    arr: 149760.00,
    arpu: 58.86,
    clv: 1420.00,
    conversionRate: 78.4,
    retentionRate: 98.2,
    basicCount: 18,
    proCount: 52,
    premiumCount: 26
  },
  tickets: [
    { id: "tkt-01", barId: "bp-bar-01", barName: "Bar Centrale", contactEmail: "marco@barcentrale.it", subject: "Configurazione secondo tablet KDS cucina", category: "KDS Banco", priority: "Media", status: "resolved", message: "Vorremmo affiancare un secondo tablet per le pizze oltre a quello delle bevande.", response: "Configurazione abilitata su multi-schermo KDS.", date: "24 ott 2025" },
    { id: "tkt-02", barId: "bp-bar-04", barName: "Bar Moderno", contactEmail: "sara@barmoderno.it", subject: "Aggiornamento carta di credito aziendale", category: "Pagamenti", priority: "Alta", status: "open", message: "Abbiamo sostituito la carta di credito. Come possiamo aggiornare il Google Wallet per il pagamento automatico?", response: null, date: "27 ott 2025" },
    { id: "tkt-03", barId: "bp-bar-05", barName: "Lounge 21", contactEmail: "luca@lounge21.it", subject: "Integrazione stampante termica Bluetooth", category: "Hardware", priority: "Bassa", status: "in_progress", message: "Avremmo bisogno del supporto per collegare la stampante termica Epson da 80mm.", response: "Guida inviata, in attesa di test del gestore.", date: "28 ott 2025" }
  ],
  overview: {
    mrr: 12480.00,
    arr: 149760.00,
    activeBars: 64,
    trialBars: 18,
    lateBars: 11,
    canceledBars: 3,
    totalBars: 96,
    paidInvoices: 132,
    pendingInvoices: 13,
    successRate: 95.10,
    growthRate: 16.00
  },
  settings: {
    superAdminName: "Cheikh Gueye",
    superAdminEmail: "cheikh@barpilot.it",
    accessPin: "101540",
    companyName: "BarPilot Inc. · Gestione Bar & Ristoranti",
    companyPiva: "IT 12345678901",
    billingEmail: "billing@barpilot.app",
    autoReminders: true
  }
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
  // Supabase REST Client - Complete Live Synchronization for All 8 Sections
  // ==========================================================================
  async syncWithSupabase() {
    const badge = document.getElementById("supabaseStatusBadge");
    try {
      if (badge) {
        badge.innerHTML = `<span>⏳</span> <span>Connessione a Supabase...</span>`;
        badge.style.color = "#F59E0B";
      }

      const headers = {
        "apikey": this.supabaseConfig.anonKey,
        "Authorization": `Bearer ${this.supabaseConfig.anonKey}`
      };

      // 1. Panoramica: Fetch Overview Metrics
      try {
        const ovRes = await fetch(`${this.supabaseConfig.url}/rest/v1/admin_overview_metrics?select=*&limit=1`, { headers });
        if (ovRes.ok) {
          const ovData = await ovRes.json();
          if (Array.isArray(ovData) && ovData.length > 0) {
            const row = ovData[0];
            this.data.overview = {
              mrr: Number(row.mrr || 12480.00),
              arr: Number(row.arr || 149760.00),
              activeBars: Number(row.active_bars || 64),
              trialBars: Number(row.trial_bars || 18),
              lateBars: Number(row.late_bars || 11),
              canceledBars: Number(row.canceled_bars || 3),
              totalBars: Number(row.total_bars || 96),
              paidInvoices: Number(row.paid_invoices || 132),
              pendingInvoices: Number(row.pending_invoices || 13),
              successRate: Number(row.success_rate || 95.10),
              growthRate: Number(row.growth_rate || 16.00)
            };
          }
        }
      } catch (e) {
        console.warn("[Supabase] Overview sync fallback:", e);
      }

      // 2. Bar Iscritti: Fetch Bars
      try {
        const barsRes = await fetch(`${this.supabaseConfig.url}/rest/v1/bars?select=*`, { headers });
        if (barsRes.ok) {
          const remoteBars = await barsRes.json();
          if (Array.isArray(remoteBars) && remoteBars.length > 0) {
            this.data.bars = remoteBars.map(rb => ({
              id: rb.id,
              name: rb.name,
              owner: rb.owner,
              email: rb.email,
              phone: rb.phone || "+39 02 1234567",
              address: rb.address || "Via Centrale 1",
              city: rb.city || rb["Città"] || "Roma",
              plan: rb.plan || "Pro",
              status: rb.status || "active",
              nextInvoice: rb.next_invoice || "15 nov 2025",
              monthlyRevenue: Number(rb.monthly_revenue || 59),
              createdAt: rb.created_at ? new Date(rb.created_at).toLocaleDateString('it-IT') : "2024",
              lastAccess: rb.last_access || "Recente",
              avatar: rb.avatar || rb.name.substring(0, 2).toUpperCase(),
              photo: rb.photo || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop",
              piva: rb.piva || rb["Partita IVA"] || "IT09876543210",
              notes: rb.notes || ""
            }));
          }
        }
      } catch (e) {
        console.warn("[Supabase] Bars sync fallback:", e);
      }

      // 3. Abbonamenti: Fetch Subscriptions
      try {
        const subsRes = await fetch(`${this.supabaseConfig.url}/rest/v1/subscriptions?select=*`, { headers });
        if (subsRes.ok) {
          const remoteSubs = await subsRes.json();
          if (Array.isArray(remoteSubs) && remoteSubs.length > 0) {
            this.data.subscriptions = remoteSubs.map(rs => ({
              id: rs.id,
              barId: rs.bar_id,
              barName: rs.bar_name,
              plan: rs.plan,
              price: Number(rs.price),
              billingCycle: rs.billing_cycle === 'yearly' ? 'Annuale' : 'Mensile',
              status: rs.status,
              paymentMethod: rs.payment_method || 'Google Pay',
              currentPeriodEnd: rs.current_period_end || rs.next_invoice || '15/11/2025'
            }));
          }
        }
      } catch (e) {
        console.warn("[Supabase] Subscriptions sync fallback:", e);
      }

      // 4. Fatture: Fetch Invoices
      try {
        const invRes = await fetch(`${this.supabaseConfig.url}/rest/v1/invoices?select=*`, { headers });
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
          }
        }
      } catch (e) {
        console.warn("[Supabase] Invoices sync fallback:", e);
      }

      // 5. Pagamenti: Fetch Payments Ledger
      try {
        const payRes = await fetch(`${this.supabaseConfig.url}/rest/v1/payments?select=*`, { headers });
        if (payRes.ok) {
          const remotePays = await payRes.json();
          if (Array.isArray(remotePays) && remotePays.length > 0) {
            this.data.payments = remotePays.map(rp => ({
              id: rp.id,
              transactionId: rp.transaction_id || rp.id,
              barId: rp.bar_id,
              barName: rp.bar_name,
              amount: Number(rp.amount),
              method: rp.method,
              status: rp.status,
              date: rp.created_at ? new Date(rp.created_at).toLocaleDateString('it-IT') : "Recente"
            }));
          }
        }
      } catch (e) {
        console.warn("[Supabase] Payments sync fallback:", e);
      }

      // 6. Statistiche: Fetch SaaS Analytics
      try {
        const statsRes = await fetch(`${this.supabaseConfig.url}/rest/v1/admin_stats?select=*&limit=1`, { headers });
        if (statsRes.ok) {
          const remoteStats = await statsRes.json();
          if (Array.isArray(remoteStats) && remoteStats.length > 0) {
            const st = remoteStats[0];
            this.data.stats = {
              mrr: Number(st.mrr || 12480.00),
              arr: Number(st.arr || 149760.00),
              arpu: Number(st.arpu || 58.86),
              clv: Number(st.clv || 1420.00),
              conversionRate: Number(st.conversion_rate || 78.4),
              retentionRate: Number(st.retention_rate || 98.2),
              basicCount: Number(st.basic_count || 18),
              proCount: Number(st.pro_count || 52),
              premiumCount: Number(st.premium_count || 26)
            };
          }
        }
      } catch (e) {
        console.warn("[Supabase] Stats sync fallback:", e);
      }

      // 7. Supporto: Fetch Support Tickets
      try {
        const tktRes = await fetch(`${this.supabaseConfig.url}/rest/v1/support_tickets?select=*`, { headers });
        if (tktRes.ok) {
          const remoteTkts = await tktRes.json();
          if (Array.isArray(remoteTkts) && remoteTkts.length > 0) {
            this.data.tickets = remoteTkts.map(rt => ({
              id: rt.id,
              barId: rt.bar_id,
              barName: rt.bar_name,
              contactEmail: rt.contact_email,
              subject: rt.subject,
              category: rt.category || "KDS Banco",
              priority: rt.priority || "Media",
              status: rt.status || "open",
              message: rt.message,
              response: rt.response,
              date: rt.created_at ? new Date(rt.created_at).toLocaleDateString('it-IT') : "Recente"
            }));
          }
        }
      } catch (e) {
        console.warn("[Supabase] Support tickets sync fallback:", e);
      }

      // 8. Impostazioni: Fetch Platform & Super Admin Config
      try {
        const setRes = await fetch(`${this.supabaseConfig.url}/rest/v1/admin_settings?select=*&limit=1`, { headers });
        if (setRes.ok) {
          const remoteSet = await setRes.json();
          if (Array.isArray(remoteSet) && remoteSet.length > 0) {
            const s = remoteSet[0];
            this.data.settings = {
              superAdminName: s.super_admin_name || "Cheikh Gueye",
              superAdminEmail: s.super_admin_email || "cheikh@barpilot.it",
              accessPin: s.access_pin || "101540",
              companyName: s.company_name || "BarPilot Inc. · Gestione Bar & Ristoranti",
              companyPiva: s.company_piva || "IT 12345678901",
              billingEmail: s.billing_email || "billing@barpilot.app",
              autoReminders: s.auto_reminders !== false
            };
            if (s.super_admin_avatar && !localStorage.getItem("barpilot_admin_avatar")) {
              localStorage.setItem("barpilot_admin_avatar", s.super_admin_avatar);
              this.loadSuperAdminAvatar();
            }
          }
        }
      } catch (e) {
        console.warn("[Supabase] Settings sync fallback:", e);
      }

      // 9. Attività Recenti: Fetch Activities Audit Log
      try {
        const actRes = await fetch(`${this.supabaseConfig.url}/rest/v1/admin_activities?select=*&order=created_at.desc&limit=10`, { headers });
        if (actRes.ok) {
          const remoteActs = await actRes.json();
          if (Array.isArray(remoteActs) && remoteActs.length > 0) {
            this.data.activities = remoteActs.map(ra => ({
              id: ra.id,
              type: ra.type,
              title: ra.title,
              desc: ra.description,
              time: ra.time || "Poco fa"
            }));
          }
        }
      } catch (e) {
        console.warn("[Supabase] Activities sync fallback:", e);
      }

      this.saveData();
      this.supabaseConnected = true;

      // Re-render all views with synced data
      this.renderKPIs();
      this.renderOverviewTable();
      this.renderFullBarsTable();
      this.renderSubscriptionsTable();
      this.renderInvoicesTable();
      this.renderPaymentsTable();
      this.renderStatsView();
      this.renderSupportTable();
      this.renderSettingsView();
      this.renderRecentActivities();

      if (badge) {
        badge.innerHTML = `<span>🟢</span> <span>Supabase DB Connesso</span>`;
        badge.style.color = "#10B981";
      }
      console.log("[BarPilot Admin] All 8 sections synchronized with live Supabase DB!");
    } catch (err) {
      console.warn("[BarPilot Admin] Supabase global sync note:", err);
      if (badge) {
        badge.innerHTML = `<span>⚡</span> <span>Supabase (Modalità Ibrida)</span>`;
        badge.style.color = "#FF8A00";
      }
    }
  }

  // ==========================================================================
  // Push All 8 Sections Data to Supabase (REST Upsert)
  // ==========================================================================
  async pushAllDataToSupabase() {
    const pushBtn = document.querySelector(".btn-supabase-push");
    const origHtml = pushBtn ? pushBtn.innerHTML : "";
    if (pushBtn) {
      pushBtn.innerHTML = `<span>⏳</span> <span>Salvataggio...</span>`;
      pushBtn.disabled = true;
    }

    try {
      this.showToast("☁️ Inizio salvataggio di tutte le 8 sezioni su Supabase...");

      // 1. Panoramica
      const overviewPayload = [{
        id: "current",
        mrr: Number(this.data.overview.mrr || 12480.00),
        arr: Number(this.data.overview.arr || 149760.00),
        active_bars: Number(this.data.overview.activeBars || 64),
        trial_bars: Number(this.data.overview.trialBars || 18),
        late_bars: Number(this.data.overview.lateBars || 11),
        canceled_bars: Number(this.data.overview.canceledBars || 3),
        total_bars: Number(this.data.overview.totalBars || 96),
        paid_invoices: Number(this.data.overview.paidInvoices || 132),
        pending_invoices: Number(this.data.overview.pendingInvoices || 13),
        success_rate: Number(this.data.overview.successRate || 95.10),
        growth_rate: Number(this.data.overview.growthRate || 16.00)
      }];

      // 2. Bar Iscritti
      const barsPayload = this.data.bars.map(b => ({
        id: b.id,
        name: b.name,
        owner: b.owner,
        email: b.email,
        phone: b.phone,
        address: b.address,
        city: b.city,
        plan: b.plan,
        status: b.status,
        next_invoice: b.nextInvoice,
        monthly_revenue: b.monthlyRevenue,
        avatar: b.avatar,
        photo: b.photo,
        piva: b.piva,
        notes: b.notes
      }));

      // 3. Abbonamenti
      const subsPayload = (this.data.subscriptions || []).map(s => ({
        id: s.id,
        bar_id: s.barId,
        bar_name: s.barName,
        plan: s.plan,
        price: Number(s.price),
        billing_cycle: (s.billingCycle || "monthly").toLowerCase(),
        status: s.status,
        payment_method: s.paymentMethod,
        current_period_end: s.currentPeriodEnd
      }));

      // 4. Fatture
      const invsPayload = (this.data.invoices || []).map(i => ({
        id: i.id,
        number: i.number,
        bar_id: i.barId,
        bar_name: i.barName,
        owner_name: i.ownerName,
        date: i.date,
        due_date: i.dueDate,
        amount: Number(i.amount),
        plan: i.plan,
        status: i.status,
        period: i.period
      }));

      // 5. Pagamenti
      const payPayload = (this.data.payments || []).map(p => ({
        id: p.id,
        transaction_id: p.transactionId || p.id,
        bar_id: p.barId,
        bar_name: p.barName,
        amount: Number(p.amount),
        method: p.method,
        status: p.status
      }));

      // 6. Statistiche
      const statsPayload = [{
        id: "stats-current",
        period: "Corrente",
        mrr: Number(this.data.stats.mrr || 12480.00),
        arr: Number(this.data.stats.arr || 149760.00),
        arpu: Number(this.data.stats.arpu || 58.86),
        clv: Number(this.data.stats.clv || 1420.00),
        conversion_rate: Number(this.data.stats.conversionRate || 78.4),
        retention_rate: Number(this.data.stats.retentionRate || 98.2),
        basic_count: Number(this.data.stats.basicCount || 18),
        pro_count: Number(this.data.stats.proCount || 52),
        premium_count: Number(this.data.stats.premiumCount || 26)
      }];

      // 7. Supporto
      const ticketsPayload = (this.data.tickets || []).map(t => ({
        id: t.id,
        bar_id: t.barId,
        bar_name: t.barName,
        contact_email: t.contactEmail,
        subject: t.subject,
        category: t.category,
        priority: (t.priority || "medium").toLowerCase(),
        status: t.status,
        message: t.message,
        response: t.response
      }));

      // 8. Impostazioni
      const settingsPayload = [{
        id: "global_config",
        super_admin_name: this.data.settings.superAdminName || "Cheikh Gueye",
        super_admin_email: this.data.settings.superAdminEmail || "cheikh@barpilot.it",
        super_admin_avatar: localStorage.getItem("barpilot_admin_avatar") || null,
        access_pin: this.data.settings.accessPin || "101540",
        company_name: this.data.settings.companyName || "BarPilot Inc. · Gestione Bar & Ristoranti",
        company_piva: this.data.settings.companyPiva || "IT 12345678901",
        billing_email: this.data.settings.billingEmail || "billing@barpilot.app",
        auto_reminders: this.data.settings.autoReminders !== false
      }];

      // 9. Attività Recenti
      const actPayload = (this.data.activities || []).map(a => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.desc || a.description,
        time: a.time
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

      const results = await Promise.allSettled([
        postTable("admin_overview_metrics", overviewPayload),
        postTable("bars", barsPayload),
        postTable("subscriptions", subsPayload),
        postTable("invoices", invsPayload),
        postTable("payments", payPayload),
        postTable("admin_stats", statsPayload),
        postTable("support_tickets", ticketsPayload),
        postTable("admin_settings", settingsPayload),
        postTable("admin_activities", actPayload)
      ]);

      const failed = results.filter(r => r.status === "rejected" || (r.value && !r.value.ok));
      if (failed.length === 0) {
        this.showToast("✅ Tutte le 8 sezioni salvate con successo su Supabase!");
      } else {
        console.warn("[Supabase push] Some tables returned non-200:", failed);
        this.showToast(`⚠️ Salvataggio completato (${results.length - failed.length}/${results.length} sezioni). Se mancano tabelle, usa 'Crea Tabelle SQL'.`);
      }
      this.syncWithSupabase();
    } catch (e) {
      console.error("Push error:", e);
      this.showToast("Errore durante il salvataggio su Supabase. Verifica la connessione.");
    } finally {
      if (pushBtn) {
        pushBtn.innerHTML = origHtml;
        pushBtn.disabled = false;
      }
    }
  }

  // Helpers to save individual items to Supabase
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

  async saveSubscriptionToSupabase(sub) {
    try {
      const payload = {
        id: sub.id,
        bar_id: sub.barId,
        bar_name: sub.barName,
        plan: sub.plan,
        price: Number(sub.price),
        billing_cycle: (sub.billingCycle || 'monthly').toLowerCase(),
        status: sub.status,
        payment_method: sub.paymentMethod,
        current_period_end: sub.currentPeriodEnd
      };

      await fetch(`${this.supabaseConfig.url}/rest/v1/subscriptions`, {
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
      console.warn("[Supabase] Insert subscription fallback:", e);
    }
  }

  async saveTicketToSupabase(tkt) {
    try {
      const payload = {
        id: tkt.id,
        bar_id: tkt.barId,
        bar_name: tkt.barName,
        contact_email: tkt.contactEmail,
        subject: tkt.subject,
        category: tkt.category,
        priority: (tkt.priority || "medium").toLowerCase(),
        status: tkt.status,
        message: tkt.message,
        response: tkt.response,
        updated_at: new Date().toISOString()
      };

      await fetch(`${this.supabaseConfig.url}/rest/v1/support_tickets`, {
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
      console.warn("[Supabase] Insert ticket fallback:", e);
    }
  }

  async saveSettingsToSupabase(settings) {
    try {
      const payload = {
        id: "global_config",
        super_admin_name: settings.superAdminName || "Cheikh Gueye",
        super_admin_email: settings.superAdminEmail || "cheikh@barpilot.it",
        super_admin_avatar: localStorage.getItem("barpilot_admin_avatar") || null,
        access_pin: settings.accessPin || "101540",
        company_name: settings.companyName,
        company_piva: settings.companyPiva,
        billing_email: settings.billingEmail,
        auto_reminders: settings.autoReminders !== false,
        updated_at: new Date().toISOString()
      };

      await fetch(`${this.supabaseConfig.url}/rest/v1/admin_settings`, {
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
      console.warn("[Supabase] Insert settings fallback:", e);
    }
  }

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
      if (input.animate) {
        input.animate([
          { transform: 'translateX(-8px)' },
          { transform: 'translateX(8px)' },
          { transform: 'translateX(-4px)' },
          { transform: 'translateX(4px)' },
          { transform: 'translateX(0)' }
        ], { duration: 300 });
      }
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
      avatars.forEach(img => {
        img.src = saved;
      });
    }
  }

  handleSuperAdminAvatarChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      this.showToast("⚠️ Seleziona un file immagine valido (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      this.showToast("⚠️ L'immagine è troppo grande (max 6 MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      localStorage.setItem("barpilot_superadmin_avatar", dataUrl);
      const avatars = document.querySelectorAll(".admin-avatar-img");
      avatars.forEach(img => {
        img.src = dataUrl;
      });
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
      avatars.forEach(img => {
        img.src = cleanUrl;
      });
      this.showToast("📷 Foto profilo Super Admin aggiornata con successo!");
    }
  }

  resetSuperAdminAvatar() {
    const defaultUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop";
    localStorage.removeItem("barpilot_superadmin_avatar");
    const avatars = document.querySelectorAll(".admin-avatar-img");
    avatars.forEach(img => {
      img.src = defaultUrl;
    });
    this.showToast("↺ Foto profilo predefinita ripristinata.");
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
      support: { title: "Centro Supporto & Ticket", sub: "Gestione richieste d'assistenza, KDS e configurazioni dai bar." },
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

    if (viewId === "payments") this.renderPaymentsTable();
    if (viewId === "stats") this.renderStatsView();
    if (viewId === "support") this.renderSupportTable();
    if (viewId === "settings") this.renderSettingsView();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ==========================================================================
  // KPI Calculations
  // ==========================================================================
  renderKPIs() {
    const ov = this.data.overview || {};
    const totalBars = ov.totalBars !== undefined ? ov.totalBars : 248;
    const activeBars = ov.activeBars !== undefined ? ov.activeBars : 212;
    const trialBars = ov.trialBars !== undefined ? ov.trialBars : 18;
    const lateBars = ov.lateBars !== undefined ? ov.lateBars : 11;
    const monthlyRevenue = ov.mrr !== undefined ? (Number(ov.mrr).toLocaleString('it-IT') + " €") : "12.480 €";

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

    const list = (this.data.subscriptions && this.data.subscriptions.length > 0)
      ? this.data.subscriptions
      : this.data.bars.map(b => ({
          id: 'sub-' + b.id,
          barId: b.id,
          barName: b.name,
          plan: b.plan,
          price: b.monthlyRevenue,
          paymentMethod: 'Google Pay',
          currentPeriodEnd: b.nextInvoice,
          status: b.status
        }));

    tbody.innerHTML = list.map(sub => {
      const isLate = sub.status === "late";
      const isTrial = sub.status === "trial";
      const isCanceled = sub.status === "canceled";
      const badge = isLate 
        ? `<span class="status-pill status-late">Scaduto - Rinnovo Fallito</span>`
        : isTrial 
        ? `<span class="status-pill status-trial">14gg Prova Attiva</span>`
        : isCanceled
        ? `<span class="status-pill status-canceled">Annullato</span>`
        : `<span class="status-pill status-active">Rinnovo Automatico OK</span>`;

      return `
        <tr>
          <td><strong>${sub.barName}</strong></td>
          <td>${sub.plan} (${Number(sub.price).toFixed(2)} €/m)</td>
          <td>${sub.paymentMethod || 'Google Pay & Wallet'}</td>
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
      completed: `<span class="status-pill status-active">Completato</span>`,
      pending: `<span class="status-pill status-trial">In elaborazione</span>`,
      failed: `<span class="status-pill status-late">Fallito</span>`,
      refunded: `<span class="status-pill status-canceled">Rimborsato</span>`
    };

    tbody.innerHTML = list.map(p => `
      <tr>
        <td><code style="color:var(--primary); font-size:11.5px;">${p.transactionId || p.id}</code></td>
        <td><strong>${p.barName}</strong></td>
        <td><strong>${Number(p.amount).toFixed(2)} €</strong></td>
        <td>${p.method}</td>
        <td>${statusBadges[p.status] || p.status}</td>
        <td>${p.date || 'Recente'}</td>
      </tr>
    `).join("");
  }

  // ==========================================================================
  // Render SaaS Stats View
  // ==========================================================================
  renderStatsView() {
    const s = this.data.stats || {};
    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    if (s.mrr) setEl("statsMrr", Number(s.mrr).toLocaleString('it-IT') + " €");
    if (s.arr) setEl("statsArr", Number(s.arr).toLocaleString('it-IT') + " €");
    if (s.arpu) setEl("statsArpu", Number(s.arpu).toFixed(2).replace('.', ',') + " €");
    if (s.retentionRate) setEl("statsChurn", (100 - Number(s.retentionRate)).toFixed(1) + "%");
    if (s.basicCount !== undefined) setEl("statsBasicCount", s.basicCount + " bar");
    if (s.proCount !== undefined) setEl("statsProCount", s.proCount + " bar");
    if (s.premiumCount !== undefined) setEl("statsPremiumCount", s.premiumCount + " bar");
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
      alta: `<span class="status-pill status-late">Alta</span>`,
      medium: `<span class="status-pill status-trial">Media</span>`,
      media: `<span class="status-pill status-trial">Media</span>`,
      low: `<span class="status-pill status-active">Bassa</span>`,
      bassa: `<span class="status-pill status-active">Bassa</span>`,
      urgent: `<span class="status-pill status-late" style="background:#EF4444; color:#fff;">Urgente</span>`
    };

    const statusBadges = {
      open: `<span class="status-pill status-trial">Aperto</span>`,
      in_progress: `<span class="status-pill status-trial" style="background:#3B82F6; color:#fff;">In corso</span>`,
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
            ${t.response ? `<div style="font-size:11px; color:#10B981; margin-top:2px;">↳ Risposta: ${t.response}</div>` : ''}
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

  toggleTicketStatus(tktId) {
    const tkt = (this.data.tickets || []).find(t => t.id === tktId);
    if (!tkt) return;
    tkt.status = tkt.status === "resolved" ? "open" : "resolved";
    this.saveData();
    this.saveTicketToSupabase(tkt);
    this.renderSupportTable();
    this.showToast(`Ticket ${tkt.id} contrassegnato come: ${tkt.status.toUpperCase()}`);
  }

  replyTicket(tktId) {
    const tkt = (this.data.tickets || []).find(t => t.id === tktId);
    if (!tkt) return;
    const answer = prompt(`Rispondi a ${tkt.barName} (${tkt.contactEmail}):\nOggetto: ${tkt.subject}`, tkt.response || "");
    if (answer !== null) {
      tkt.response = answer.trim();
      tkt.status = "resolved";
      this.saveData();
      this.saveTicketToSupabase(tkt);
      this.renderSupportTable();
      this.showToast(`Risposta inviata e salvata su Supabase per il ticket ${tkt.id}`);
    }
  }

  // ==========================================================================
  // Render & Save Platform Settings
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
  }

  saveSettingsFromForm() {
    if (!this.data.settings) this.data.settings = {};
    const nameEl = document.getElementById("settingsCompanyName");
    const pivaEl = document.getElementById("settingsCompanyPiva");
    const emailEl = document.getElementById("settingsBillingEmail");

    if (nameEl) this.data.settings.companyName = nameEl.value.trim();
    if (pivaEl) this.data.settings.companyPiva = pivaEl.value.trim();
    if (emailEl) this.data.settings.billingEmail = emailEl.value.trim();

    this.saveData();
    this.saveSettingsToSupabase(this.data.settings);
    this.showToast("💾 Impostazioni salvate e sincronizzate con Supabase!");
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
    const sql = `-- ============================================================================
-- BarPilot Super Admin Enterprise Database Schema for Supabase
-- Console: https://www.barpilot.eu/administration.html
-- Esegui questo script completo nell'editor SQL di Supabase:
-- https://supabase.com/dashboard/project/cprxxxlgaofopmogeuer/sql
-- ============================================================================

-- 1. PANORAMICA (KPI & Metriche Live Dashboard)
CREATE TABLE IF NOT EXISTS public.admin_overview_metrics (
  id TEXT PRIMARY KEY DEFAULT 'current',
  mrr NUMERIC(10,2) DEFAULT 12480.00,
  arr NUMERIC(10,2) DEFAULT 149760.00,
  active_bars INT DEFAULT 64,
  trial_bars INT DEFAULT 18,
  late_bars INT DEFAULT 11,
  canceled_bars INT DEFAULT 3,
  total_bars INT DEFAULT 96,
  paid_invoices INT DEFAULT 132,
  pending_invoices INT DEFAULT 13,
  success_rate NUMERIC(5,2) DEFAULT 95.10,
  growth_rate NUMERIC(5,2) DEFAULT 16.00,
  churn_rate NUMERIC(5,2) DEFAULT 1.80,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BAR ISCRITTI (Multi-Tenant Bars Directory)
CREATE TABLE IF NOT EXISTS public.bars (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  "Città" TEXT,
  plan TEXT DEFAULT 'Pro',
  status TEXT DEFAULT 'active',
  next_invoice TEXT,
  monthly_revenue NUMERIC(10,2) DEFAULT 59.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_access TEXT,
  avatar TEXT,
  photo TEXT,
  piva TEXT,
  "Partita IVA" TEXT,
  notes TEXT
);

-- 3. ABBONAMENTI (Subscriptions Lifecycle & Renewals)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  bar_id TEXT REFERENCES public.bars(id) ON DELETE CASCADE,
  bar_name TEXT NOT NULL,
  plan TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly',
  status TEXT NOT NULL,
  payment_method TEXT DEFAULT 'Google Pay / Carta',
  current_period_start TEXT,
  current_period_end TEXT,
  trial_end TEXT,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FATTURE (Invoices & Billing History)
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
  download_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PAGAMENTI (Transactions & Gateway Ledger)
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  bar_id TEXT REFERENCES public.bars(id) ON DELETE SET NULL,
  bar_name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  method TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STATISTICHE (SaaS Analytics & Cohorts)
CREATE TABLE IF NOT EXISTS public.admin_stats (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL,
  mrr NUMERIC(10,2) NOT NULL,
  arr NUMERIC(10,2) NOT NULL,
  arpu NUMERIC(10,2) NOT NULL,
  clv NUMERIC(10,2) NOT NULL,
  conversion_rate NUMERIC(5,2) DEFAULT 78.4,
  retention_rate NUMERIC(5,2) DEFAULT 98.2,
  basic_count INT DEFAULT 18,
  pro_count INT DEFAULT 52,
  premium_count INT DEFAULT 26,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUPPORTO (Helpdesk & Client Tickets)
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT PRIMARY KEY,
  bar_id TEXT REFERENCES public.bars(id) ON DELETE SET NULL,
  bar_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'KDS Banco',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  message TEXT NOT NULL,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. IMPOSTAZIONI (Super Admin Profile & Company Configuration)
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id TEXT PRIMARY KEY DEFAULT 'global_config',
  super_admin_name TEXT DEFAULT 'Cheikh Gueye',
  super_admin_email TEXT DEFAULT 'cheikh@barpilot.it',
  super_admin_avatar TEXT,
  access_pin TEXT DEFAULT '101540',
  company_name TEXT DEFAULT 'BarPilot Inc. · Gestione Bar & Ristoranti',
  company_piva TEXT DEFAULT 'IT 12345678901',
  billing_email TEXT DEFAULT 'billing@barpilot.app',
  auto_reminders BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ATTIVITÀ RECENTI (Audit Log)
CREATE TABLE IF NOT EXISTS public.admin_activities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.admin_overview_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activities ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['admin_overview_metrics', 'bars', 'subscriptions', 'invoices', 'payments', 'admin_stats', 'support_tickets', 'admin_settings', 'admin_activities']
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
END $$;

-- SEED DATA
INSERT INTO public.admin_overview_metrics (id, mrr, arr, active_bars, trial_bars, late_bars, canceled_bars, total_bars, paid_invoices, pending_invoices, success_rate, growth_rate)
VALUES ('current', 12480.00, 149760.00, 64, 18, 11, 3, 96, 132, 13, 95.10, 16.00)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

INSERT INTO public.bars (id, name, owner, email, phone, address, city, plan, status, next_invoice, monthly_revenue, avatar, piva, notes)
VALUES
('bp-bar-01', 'Bar Centrale', 'Marco Bianchi', 'marco@barcentrale.it', '+39 02 87654321', 'Via Roma 123, Milano', 'Milano', 'Pro', 'active', '15 nov 2025', 59.00, 'BC', 'IT09876543210', 'Cliente storico. Richiede fatturazione elettronica.'),
('bp-bar-02', 'Caffè del Porto', 'Giulia Rossi', 'giulia@caffedelporto.it', '+39 010 3344556', 'Calata Molo Vecchio 4, Genova', 'Genova', 'Basic', 'active', '28 nov 2025', 38.00, 'CP', 'IT01234567890', 'Locale stagionale estivo, attivo tutto l''anno.'),
('bp-bar-03', 'La Dolce Vita', 'Alessandro Conti', 'alessandro@ladolcevita.it', '+39 081 7766554', 'Piazza Plebiscito 12, Napoli', 'Napoli', 'Pro', 'trial', '10 nov 2025', 0.00, 'DV', 'IT04567891234', 'In prova gratuita (giorno 4 di 14).'),
('bp-bar-04', 'Bar Moderno', 'Sara Romano', 'sara@barmoderno.it', '+39 051 9988776', 'Via Indipendenza 45, Bologna', 'Bologna', 'Pro', 'late', '10 ott 2025', 59.00, 'BM', 'IT07891234567', 'Carta scaduta nel Google Wallet. Sollecito inviato.'),
('bp-bar-05', 'Lounge 21', 'Luca Moretti', 'luca@lounge21.it', '+39 02 44332211', 'Corso Como 21, Milano', 'Milano', 'Premium', 'active', '22 nov 2025', 99.00, 'L2', 'IT03216549870', 'Piano Premium con 4 tablet KDS contemporanei.'),
('bp-bar-06', 'Bar Nettuno', 'Martina Gallo', 'martina@barnettuno.it', '+39 0541 234567', 'Lungomare Tintori 8, Rimini', 'Rimini', 'Basic', 'canceled', '-', 0.00, 'BN', 'IT06549873210', 'Chiusura stagionale invernale.'),
('bp-bar-07', 'Il Ritrovo', 'Federico Neri', 'federico@ilritrovo.it', '+39 06 65432109', 'Via Appia Nuova 88, Roma', 'Roma', 'Pro', 'active', '18 nov 2025', 59.00, 'IR', 'IT08765432109', 'Locale ad alto volume colazioni e aperitivi.'),
('bp-bar-08', 'Bar Firenze', 'Elena Russo', 'elena@barfirenze.it', '+39 055 7654321', 'Borgo San Frediano 19, Firenze', 'Firenze', 'Basic', 'late', '05 ott 2025', 38.00, 'BF', 'IT09812345678', 'Pagamento respinto dalla banca.')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;

INSERT INTO public.admin_settings (id, super_admin_name, super_admin_email, access_pin, company_name, company_piva, billing_email, auto_reminders)
VALUES ('global_config', 'Cheikh Gueye', 'cheikh@barpilot.it', '101540', 'BarPilot Inc. · Gestione Bar & Ristoranti', 'IT 12345678901', 'billing@barpilot.app', true)
ON CONFLICT (id) DO UPDATE SET super_admin_name = EXCLUDED.super_admin_name, access_pin = EXCLUDED.access_pin;`;

    navigator.clipboard.writeText(sql).then(() => {
      this.showToast("📋 Schema SQL completo Supabase copiato negli appunti!");
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
