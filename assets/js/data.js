// BarPilot Initial Mock Data & Persistence
const initialData = {
  activeBar: {
    id: "bar_01",
    name: "Bar Centrale",
    city: "Roma",
    address: "Via del Corso, 142",
    currency: "€",
    role: "Proprietario",
    managerName: "Marco Rossi",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
    plan: "Pro",
    isDemo: true,
    isSubscribed: true,
    trialDaysRemaining: 14,
    trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  barsList: [
    { id: "bar_01", name: "Bar Centrale", city: "Roma", address: "Via del Corso, 142" },
    { id: "bar_02", name: "Milano Lounge & Cocktail", city: "Milano", address: "Corso Como, 8" },
    { id: "bar_03", name: "Café de Paris", city: "Nice", address: "Promenade des Anglais, 22" }
  ],
  users: [
    {
      id: "usr_01",
      type: "email",
      email: "marco@barcentrale.it",
      password: "password123",
      name: "Marco Rossi",
      barName: "Bar Centrale",
      city: "Roma",
      role: "Proprietario"
    },
    {
      id: "usr_02",
      type: "phone",
      phone: "+39 333 987 6543",
      rawPhone: "3339876543",
      countryCode: "+39",
      name: "Marco Rossi",
      barName: "Bar Centrale",
      city: "Roma",
      role: "Proprietario"
    }
  ],
  metrics: {
    revenue: 1248.00,
    revenueChange: "+12%",
    ordersCount: 186,
    ordersChange: "+8%",
    avgTicket: 6.71,
    avgTicketChange: "+5%",
    alertCount: 4
  },
  hourlySales: [
    { hour: "08:00", val: 85 },
    { hour: "09:00", val: 140 },
    { hour: "10:00", val: 210 },
    { hour: "11:00", val: 160 },
    { hour: "12:00", val: 245 },
    { hour: "13:00", val: 290 },
    { hour: "14:00", val: 195 },
    { hour: "15:00", val: 110 },
    { hour: "16:00", val: 175 },
    { hour: "17:00", val: 230 },
    { hour: "18:00", val: 340 },
    { hour: "19:00", val: 380 },
    { hour: "20:00", val: 310 },
    { hour: "21:00", val: 220 },
    { hour: "22:00", val: 150 }
  ],
  categorySales: [
    { label: "Bevande", percent: 42, color: "#3B82F6", amount: 524.16 },
    { label: "Caffè", percent: 28, color: "#F59E0B", amount: 349.44 },
    { label: "Cocktail", percent: 15, color: "#10B981", amount: 187.20 },
    { label: "Cibo", percent: 10, color: "#EC4899", amount: 124.80 },
    { label: "Altro", percent: 5, color: "#8B5CF6", amount: 62.40 }
  ],
  products: [
    {
      id: 1,
      name: "Espresso",
      category: "coffee",
      price: 1.50,
      cost: 0.18,
      status: "active",
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=150&h=150&fit=crop",
      salesCount: 48,
      recipe: [{ ingredientId: 2, qty: 0.009, unit: "kg" }]
    },
    {
      id: 2,
      name: "Cappuccino",
      category: "coffee",
      price: 2.80,
      cost: 0.42,
      status: "active",
      image: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=150&h=150&fit=crop",
      salesCount: 35,
      recipe: [
        { ingredientId: 2, qty: 0.009, unit: "kg" },
        { ingredientId: 1, qty: 0.15, unit: "L" }
      ]
    },
    {
      id: 3,
      name: "Caffè latte",
      category: "coffee",
      price: 3.20,
      cost: 0.48,
      status: "active",
      image: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=150&h=150&fit=crop",
      salesCount: 22,
      recipe: [
        { ingredientId: 2, qty: 0.009, unit: "kg" },
        { ingredientId: 1, qty: 0.22, unit: "L" }
      ]
    },
    {
      id: 4,
      name: "Macchiato",
      category: "coffee",
      price: 1.70,
      cost: 0.22,
      status: "active",
      image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=150&h=150&fit=crop",
      salesCount: 18,
      recipe: [
        { ingredientId: 2, qty: 0.009, unit: "kg" },
        { ingredientId: 1, qty: 0.04, unit: "L" }
      ]
    },
    {
      id: 5,
      name: "Americano",
      category: "coffee",
      price: 2.50,
      cost: 0.20,
      status: "active",
      image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=150&h=150&fit=crop",
      salesCount: 12,
      recipe: [{ ingredientId: 2, qty: 0.014, unit: "kg" }]
    },
    {
      id: 6,
      name: "Caffè shakerato",
      category: "coffee",
      price: 3.50,
      cost: 0.40,
      status: "active",
      image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=150&h=150&fit=crop",
      salesCount: 14,
      recipe: [{ ingredientId: 2, qty: 0.018, unit: "kg" }, { ingredientId: 6, qty: 0.015, unit: "kg" }]
    },
    {
      id: 7,
      name: "Spritz Aperol",
      category: "cocktail",
      price: 7.00,
      cost: 1.85,
      status: "active",
      image: "https://images.unsplash.com/photo-1560512823-829485b8bf24?w=150&h=150&fit=crop",
      salesCount: 24,
      recipe: [
        { ingredientId: 4, qty: 0.06, unit: "L" },
        { ingredientId: 7, qty: 0.05, unit: "L" }
      ]
    },
    {
      id: 8,
      name: "Bière blonde artisanale",
      category: "drinks",
      price: 5.00,
      cost: 1.50,
      status: "active",
      image: "https://images.unsplash.com/photo-1608270110360-e4b2d385310b?w=150&h=150&fit=crop",
      salesCount: 28,
      recipe: [{ ingredientId: 3, qty: 1, unit: "bott." }]
    },
    {
      id: 9,
      name: "Croissant burro",
      category: "snacks",
      price: 1.80,
      cost: 0.45,
      status: "active",
      image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=150&h=150&fit=crop",
      salesCount: 19,
      recipe: []
    },
    {
      id: 10,
      name: "Panino prosciutto e mozzarella",
      category: "food",
      price: 5.50,
      cost: 1.80,
      status: "active",
      image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=150&h=150&fit=crop",
      salesCount: 11,
      recipe: []
    },
    {
      id: 11,
      name: "Acqua minerale 50cl",
      category: "drinks",
      price: 1.50,
      cost: 0.25,
      status: "active",
      image: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=150&h=150&fit=crop",
      salesCount: 30,
      recipe: []
    },
    {
      id: 12,
      name: "Tagliere aperitivo misto",
      category: "food",
      price: 10.00,
      cost: 3.50,
      status: "active",
      image: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=150&h=150&fit=crop",
      salesCount: 9,
      recipe: []
    }
  ],
  tables: [
    { id: "T01", area: "interno", capacity: 2, status: "free", amount: 0, time: 0, orderId: null },
    { id: "T02", area: "interno", capacity: 2, status: "occupied", amount: 12.50, time: 35, orderId: 1039 },
    { id: "T03", area: "interno", capacity: 4, status: "free", amount: 0, time: 0, orderId: null },
    { id: "T04", area: "interno", capacity: 4, status: "to_pay", amount: 25.00, time: 55, orderId: 1042 },
    { id: "T05", area: "terrazza", capacity: 2, status: "occupied", amount: 15.00, time: 23, orderId: 1037, alert: "23 min" },
    { id: "T06", area: "terrazza", capacity: 4, status: "free", amount: 0, time: 0, orderId: null },
    { id: "T07", area: "vip", capacity: 6, status: "reserved", amount: 0, time: 0, reservation: "20:00" },
    { id: "T08", area: "terrazza", capacity: 3, status: "occupied", amount: 18.50, time: 14, orderId: 1041 },
    { id: "T09", area: "comptoir", capacity: 2, status: "free", amount: 0, time: 0, orderId: null }
  ],
  orders: [
    {
      id: 1042,
      table: "Tavolo 04",
      area: "interno",
      server: "Giulia Conti",
      status: "prep", // draft, prep, ready, served, paid
      time: "2 min",
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      items: [
        { id: 2, name: "Cappuccino", qty: 2, price: 2.80 },
        { id: 1, name: "Espresso", qty: 1, price: 1.50 },
        { id: 9, name: "Croissant burro", qty: 1, price: 1.80 }
      ],
      total: 8.90
    },
    {
      id: 1041,
      table: "Tavolo 08",
      area: "terrazza",
      server: "Sara Romano",
      status: "ready",
      time: "5 min",
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      items: [
        { id: 8, name: "Bière blonde artisanale", qty: 3, price: 5.00 },
        { id: 11, name: "Acqua minerale 50cl", qty: 1, price: 1.50 }
      ],
      total: 16.50
    },
    {
      id: 1040,
      table: "Comptoir",
      area: "comptoir",
      server: "Alessandro De Luca",
      status: "served",
      time: "8 min",
      createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      items: [
        { id: 3, name: "Caffè latte", qty: 1, price: 3.20 }
      ],
      total: 3.20
    },
    {
      id: 1039,
      table: "Tavolo 02",
      area: "interno",
      server: "Giulia Conti",
      status: "prep",
      time: "6 min",
      createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      items: [
        { id: 7, name: "Spritz Aperol", qty: 2, price: 7.00 },
        { id: 12, name: "Tagliere aperitivo misto", qty: 1, price: 10.00 }
      ],
      total: 24.00
    },
    {
      id: 1038,
      table: "Tavolo 06",
      area: "terrazza",
      server: "Laura Bianchi",
      status: "served",
      time: "12 min",
      createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      items: [
        { id: 8, name: "Bière blonde artisanale", qty: 1, price: 5.00 },
        { id: 10, name: "Panino prosciutto e mozzarella", qty: 1, price: 5.50 }
      ],
      total: 10.50
    }
  ],
  inventory: [
    { id: 1, name: "Latte intero fresco", qty: 3.0, unit: "L", reorderLevel: 5.0, status: "alert", cost: 1.10, supplier: "Metro Italia" },
    { id: 2, name: "Caffè in grani 100% Arabica", qty: 4.0, unit: "kg", reorderLevel: 2.0, status: "ok", cost: 18.00, supplier: "Caffè Vergnano" },
    { id: 3, name: "Bière blonde bottiglia", qty: 8, unit: "bott.", reorderLevel: 15, status: "alert", cost: 1.50, supplier: "Coca-Cola HBC" },
    { id: 4, name: "Rhum Añejo", qty: 1.2, unit: "L", reorderLevel: 0.7, status: "ok", cost: 22.00, supplier: "Campari" },
    { id: 5, name: "Limone verde fresco", qty: 6, unit: "pz", reorderLevel: 5, status: "ok", cost: 0.30, supplier: "Metro Italia" },
    { id: 6, name: "Zucchero di canna", qty: 2.0, unit: "kg", reorderLevel: 1.0, status: "ok", cost: 2.20, supplier: "Metro Italia" },
    { id: 7, name: "Acqua tonica premium", qty: 2, unit: "bott.", reorderLevel: 10, status: "alert", cost: 0.85, supplier: "Campari" },
    { id: 8, name: "Aperol", qty: 2.5, unit: "L", reorderLevel: 1.0, status: "ok", cost: 14.50, supplier: "Campari" },
    { id: 9, name: "Prosecco DOC", qty: 4, unit: "bott.", reorderLevel: 6, status: "alert", cost: 4.80, supplier: "Campari" }
  ],
  suppliers: [
    { id: 1, name: "Caffè Vergnano", category: "Caffè, capsule, macchine", phone: "+39 011 942 0111", email: "ordini@caffevergnano.it", status: "preferred" },
    { id: 2, name: "Coca-Cola HBC", category: "Bevande, bibite, soft drinks", phone: "+39 02 494 800", email: "clienti@cchellenic.com", status: "active" },
    { id: 3, name: "Campari", category: "Alcolici, spiriti, aperitivi", phone: "+39 02 62251", email: "distribuzione@campari.com", status: "active" },
    { id: 4, name: "Metro Italia", category: "Alimentari, snack, latticini", phone: "+39 02 51711", email: "servizioclienti@metro.it", status: "active" },
    { id: 5, name: "Surgital", category: "Prodotti surgelati e panificati", phone: "+39 0545 80328", email: "horeca@surgital.it", status: "active" }
  ],
  staff: [
    { id: 1, name: "Marco Rossi", role: "Proprietario", email: "marco@barcentrale.it", pin: null, status: "active", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop" },
    { id: 2, name: "Laura Bianchi", role: "Manager", email: "laura@barcentrale.it", pin: "0000", status: "active", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop" },
    { id: 3, name: "Giulia Conti", role: "Cameriere", email: "giulia@barcentrale.it", pin: "1111", status: "active", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop" },
    { id: 4, name: "Alessandro De Luca", role: "Barman", email: "ale@barcentrale.it", pin: "3333", status: "active", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop" },
    { id: 5, name: "Sara Romano", role: "Cameriere", email: "sara@barcentrale.it", pin: "2222", status: "active", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop" },
    { id: 6, name: "Luca Ferrari", role: "Cassa", email: "luca@barcentrale.it", pin: "4444", status: "inactive", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop" }
  ],
  plans: [
    {
      id: "pro_unique",
      name: "BarPilot Pro Tout-en-un",
      price: 59,
      period: "/mois/bar",
      popular: true,
      trialDays: 14,
      tagline: "L'ensemble de la plateforme BarPilot sans aucune restriction pour votre bar",
      features: [
        { cat: "Service & Caisse", title: "Prise de commandes ultra-rapide", desc: "Comande al tavolo, al banco e asporto con scontrino digitale e pagamenti frazionati" },
        { cat: "Service & Caisse", title: "Plan de salle interactif en direct", desc: "Gestione dinamica dei tavoli, capienza, sale e stato dell'occupazione in tempo reale" },
        { cat: "Boissons & Recettes", title: "Catalogue produits & cocktails illimité", desc: "Foto HD, allergeni, varianti, prezzi calcolati e schede tecniche complete" },
        { cat: "Boissons & Recettes", title: "Fiches recettes & calcul des marges", desc: "Scarico automatico di millilitri e grammi da ogni cocktail o caffè servito" },
        { cat: "Stocks & Achats", title: "Gestion intelligente des stocks", desc: "Inventario in tempo reale, soglie di sicurezza e alert automatici sotto scorta" },
        { cat: "Stocks & Achats", title: "Gestion des fournisseurs & bons de commande", desc: "Generazione buoni d'ordine e trasmissione diretta con un clic via Email e WhatsApp" },
        { cat: "Cuisine & Équipe", title: "Écran Barman (KDS) & Cuisine en direct", desc: "Monitor touch per la preparazione delle comande con avvisi sonori e stati sincronizzati" },
        { cat: "Cuisine & Équipe", title: "Gestion multi-utilisateurs & codes PIN", desc: "Accesso profilato per Proprietario, Manager, Barman e Camerieri con PIN a 4 cifre" },
        { cat: "Gestion & Chiffres", title: "Rapports & Statistiques financières complètes", desc: "Analisi vendite giorno/settimana/mese con grafici X/Y, scontrino medio ed export CSV" },
        { cat: "Digital & Clients", title: "Menu digital QR Code sans contact", desc: "Menu interattivo visualizzabile istantaneamente dallo smartphone dei clienti al tavolo" },
        { cat: "Technologie & Sécurité", title: "Mode Hors-ligne (PWA) & Cloud Sync", desc: "Funzionamento garantito al 100% anche senza connessione internet, sincronizzazione automatica" },
        { cat: "Technologie & Sécurité", title: "Sauvegardes automatiques & Chiffrement SSL", desc: "Dati protetti nel cloud su server europei conformi a sicurezza bancaria e RT" },
        { cat: "Accompagnement", title: "Support prioritaire dédié 7j/7", desc: "Assistenza clienti rapida via chat ed email, aggiornamenti e nuove funzioni inclusi" }
      ]
    }
  ]
};

// Storage helper with persistence
class BarPilotStorage {
  constructor() {
    const saved = localStorage.getItem("barpilot_store");
    if (saved) {
      try {
        this.data = JSON.parse(saved);
        if (!Array.isArray(this.data.users)) {
          this.data.users = initialData.users;
        }
        if (Array.isArray(this.data.staff)) {
          this.data.staff.forEach(s => {
            if (s.role === "Proprietario") {
              s.pin = null;
            } else if (!s.pin) {
              const init = initialData.staff.find(i => i.id === s.id || i.name === s.name);
              s.pin = init ? init.pin : "1234";
            }
          });
        }
        this.persist();
      } catch (e) {
        this.data = initialData;
      }
    } else {
      this.data = initialData;
      this.persist();
    }
  }

  persist() {
    localStorage.setItem("barpilot_store", JSON.stringify(this.data));
  }

  get(key) {
    return this.data[key];
  }

  set(key, val) {
    this.data[key] = val;
    this.persist();
  }

  reset() {
    this.data = initialData;
    this.persist();
  }
}

window.db = new BarPilotStorage();

// Ensure active session is kept in cache on load
if (localStorage.getItem("barpilot_is_logged_in") === "true" || document.cookie.includes("barpilot_auth=true")) {
  document.documentElement.classList.add("user-authenticated");
}
