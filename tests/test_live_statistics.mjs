// BarPilot Automated Test Suite for Live Statistics & Demo/Live Isolation
// Testing all 20 requirements and the Fundamental Test Scenario

import assert from 'assert';
import fs from 'fs';
import path from 'path';

// Set up simulated browser environment
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.window = global;
global.localStorage = new MockLocalStorage();
global.sessionStorage = new MockLocalStorage();
global.document = {
  cookie: "",
  documentElement: { classList: { add() {}, remove() {} } },
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.window.location = { hash: "", search: "", pathname: "" };
global.window.addEventListener = () => {};

// Load data.js and app.js into global context
const dataJsPath = path.resolve('assets/js/data.js');
const appJsPath = path.resolve('assets/js/app.js');

const dataCode = fs.readFileSync(dataJsPath, 'utf8');
const appCode = fs.readFileSync(appJsPath, 'utf8');

// Evaluate in sandbox
eval(dataCode);
eval(appCode);

console.log('================================================================');
console.log('🧪 BARPILOT AUTOMATED TEST SUITE: LIVE DATA & DYNAMIC STATISTICS');
console.log('================================================================\n');

let testsPassed = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] Test ${totalTests}: ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`❌ [FAIL] Test ${totalTests}: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// --------------------------------------------------------------------------
// TEST 1: New LIVE bar starts with exactly 0.00 € metrics
// --------------------------------------------------------------------------
runTest('Nuovo bar LIVE parte con statistiche a zero', () => {
  localStorage.setItem('barpilot_is_demo', 'false');
  const newBar = {
    id: 'bar_live_test_' + Date.now(),
    name: 'Caffè Moderno',
    city: 'Milano',
    isDemo: false
  };
  window.db.set('activeBar', newBar);

  const stats = window.calculateDashboardStatistics('today');
  assert.strictEqual(stats.revenue, 0, 'Revenue must be 0.00');
  assert.strictEqual(stats.ordersCount, 0, 'Orders count must be 0');
  assert.strictEqual(stats.avgTicket, 0, 'Average ticket must be 0.00');
  assert.strictEqual(stats.recentOrders.length, 0, 'Recent orders must be empty');
  assert.strictEqual(stats.topProducts.length, 0, 'Top products must be empty');
  assert.strictEqual(stats.totalCatAmount, 0, 'Category total must be 0.00');
  assert.strictEqual(stats.peakVal, 0, 'Peak hourly sales must be 0');
});

// --------------------------------------------------------------------------
// TEST 2: Catalogo prodotti conservato
// --------------------------------------------------------------------------
runTest('Catalogo prodotti conservato con prezzi e ricette per il bar LIVE', () => {
  const products = window.db.get('products');
  assert(products.length >= 10, 'Product catalog must have all items');
  const espresso = products.find(p => p.name === 'Espresso');
  assert(espresso, 'Espresso must exist in catalog');
  assert.strictEqual(espresso.price, 1.50, 'Espresso price must be 1.50 €');
  assert(espresso.recipe && espresso.recipe.length > 0, 'Espresso recipe must be preserved');
  assert.strictEqual(espresso.salesCount, 0, 'SalesCount for new live bar must be 0');
});

// --------------------------------------------------------------------------
// TEST 3: Tavoli iniziali tutti liberi (0 occupati) per nuovo bar LIVE
// --------------------------------------------------------------------------
runTest('Piano di sala per nuovo bar LIVE ha tutti i tavoli liberi', () => {
  const tables = window.db.get('tables');
  assert(tables.length > 0, 'Tables must be configured');
  const occupied = tables.filter(t => t.status === 'occupied' || t.status === 'to_pay');
  assert.strictEqual(occupied.length, 0, 'Zero tables occupied on fresh live bar');
});

// --------------------------------------------------------------------------
// TEST 4 & 5 & 6 & 7 & 8 & 9: FUNDAMENTAL TEST SCENARIO
// Vendita: 2 espresso a 1,50 € + 1 cappuccino a 2,80 € = 5,80 €
// --------------------------------------------------------------------------
runTest('SCENARIO FONDAMENTALE: Registrazione prima vendita reale (2 espresso + 1 cappuccino = 5.80 €)', () => {
  const activeBar = window.db.get('activeBar');
  const orders = window.db.get('orders');
  
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, '0') + ':00';

  const order1 = {
    id: 1001,
    barId: activeBar.id,
    isDemo: false,
    table: 'Tavolo 04',
    server: 'Marco Rossi',
    status: 'prep',
    createdAt: now.toISOString(),
    items: [
      { id: 1, name: 'Espresso', qty: 2, price: 1.50, category: 'coffee' },
      { id: 2, name: 'Cappuccino', qty: 1, price: 2.80, category: 'coffee' }
    ],
    total: 5.80
  };

  orders.unshift(order1);
  window.db.set('orders', orders);

  const stats = window.calculateDashboardStatistics('today');

  // Verify KPIs
  assert.strictEqual(stats.revenue, 5.80, 'Fatturato registrato must be exactly 5.80 €');
  assert.strictEqual(stats.ordersCount, 1, 'Numero comande must be exactly 1');
  assert.strictEqual(stats.avgTicket, 5.80, 'Scontrino medio must be exactly 5.80 €');

  // Verify Best Sellers
  assert.strictEqual(stats.topProducts.length, 2, 'Top products must have 2 entries');
  const top1 = stats.topProducts[0];
  const top2 = stats.topProducts[1];
  assert.strictEqual(top1.name, 'Espresso', 'Top 1 product must be Espresso');
  assert.strictEqual(top1.salesCount, 2, 'Espresso qty sold must be 2');
  assert.strictEqual(top1.revenue, 3.00, 'Espresso revenue must be 3.00 €');

  assert.strictEqual(top2.name, 'Cappuccino', 'Top 2 product must be Cappuccino');
  assert.strictEqual(top2.salesCount, 1, 'Cappuccino qty sold must be 1');
  assert.strictEqual(top2.revenue, 2.80, 'Cappuccino revenue must be 2.80 €');

  // Verify Categories
  const coffeeCat = stats.categorySales.find(c => c.label === 'Caffè');
  assert(coffeeCat, 'Coffee category must exist');
  assert.strictEqual(coffeeCat.amount, 5.80, 'Coffee category revenue must be 5.80 €');
  assert.strictEqual(coffeeCat.percent, 100, 'Coffee category must be 100% of sales');

  // Verify Hourly Slot
  const slot = stats.hourlySales.find(h => h.hour === currentHour);
  if (slot) {
    assert.strictEqual(slot.val, 5.80, `Hourly slot ${currentHour} must record 5.80 €`);
  }
  assert.strictEqual(stats.peakVal, 5.80, 'Peak sales value must be 5.80 €');

  // Verify Recent Orders
  assert.strictEqual(stats.recentOrders.length, 1, 'Recent orders must contain 1 order');
  assert.strictEqual(stats.recentOrders[0].id, 1001, 'Recent order #1001 must appear in list');
});

// --------------------------------------------------------------------------
// TEST 10: Seconda comanda con più articoli e categorie diverse
// 3 birre a 5,00 € = 15,00 € -> Totale vendite = 20,80 €, 2 comande, scontrino medio = 10,40 €
// --------------------------------------------------------------------------
runTest('Seconda comanda con birre (bevande) e ricalcolo proporzionale categorie', () => {
  const activeBar = window.db.get('activeBar');
  const orders = window.db.get('orders');

  const order2 = {
    id: 1002,
    barId: activeBar.id,
    isDemo: false,
    table: 'Tavolo 08',
    server: 'Giulia Conti',
    status: 'served',
    createdAt: new Date().toISOString(),
    items: [
      { id: 8, name: 'Bière blonde artisanale', qty: 3, price: 5.00, category: 'drinks' }
    ],
    total: 15.00
  };

  orders.unshift(order2);
  window.db.set('orders', orders);

  const stats = window.calculateDashboardStatistics('today');
  assert.strictEqual(stats.revenue, 20.80, 'Total revenue must be 5.80 + 15.00 = 20.80 €');
  assert.strictEqual(stats.ordersCount, 2, 'Total orders count must be 2');
  assert.strictEqual(stats.avgTicket, 10.40, 'Average ticket must be 20.80 / 2 = 10.40 €');

  const drinksCat = stats.categorySales.find(c => c.label === 'Bevande');
  assert(drinksCat, 'Drinks category must exist');
  assert.strictEqual(drinksCat.amount, 15.00, 'Drinks category must be 15.00 €');
  // 15 / 20.80 = 72%
  assert(drinksCat.percent >= 70 && drinksCat.percent <= 74, 'Drinks category % correct');

  const sumPct = stats.categorySales.reduce((s, c) => s + c.percent, 0);
  assert.strictEqual(sumPct, 100, 'Sum of category percentages must equal 100%');
});

// --------------------------------------------------------------------------
// TEST 11: Annullamento di una comanda
// Se una comanda viene annullata, viene esclusa dal fatturato registrato
// --------------------------------------------------------------------------
runTest('Annullamento comanda: esclusione automatica dai ricavi e dal conteggio comande', () => {
  const orders = window.db.get('orders');
  const ord2 = orders.find(o => o.id === 1002);
  ord2.status = 'cancelled';
  window.db.set('orders', orders);

  const stats = window.calculateDashboardStatistics('today');
  assert.strictEqual(stats.revenue, 5.80, 'Revenue must exclude cancelled order (reverting to 5.80 €)');
  assert.strictEqual(stats.ordersCount, 1, 'Orders count must exclude cancelled order (1)');
  assert.strictEqual(stats.avgTicket, 5.80, 'Average ticket must be 5.80 €');
});

// --------------------------------------------------------------------------
// TEST 12: Rimborso parziale su una comanda
// --------------------------------------------------------------------------
runTest('Rimborso parziale: sottrazione corretta dal totale delle vendite nette', () => {
  const orders = window.db.get('orders');
  const ord1 = orders.find(o => o.id === 1001);
  ord1.refund = 1.80; // Refund for cappuccino
  window.db.set('orders', orders);

  const stats = window.calculateDashboardStatistics('today');
  assert.strictEqual(stats.revenue, 4.00, 'Net revenue after 1.80 € refund must be 4.00 €');
  assert.strictEqual(stats.avgTicket, 4.00, 'Avg ticket after refund must be 4.00 €');

  // Reset refund for subsequent tests
  ord1.refund = 0;
  window.db.set('orders', orders);
});

// --------------------------------------------------------------------------
// TEST 13: Isolamento Multi-Tenant (DEMO vs LIVE)
// I dati DEMO non devono MAI inquinare le statistiche reali di un bar LIVE
// --------------------------------------------------------------------------
runTest('Isolamento Multi-Tenant: DEMO e LIVE non si sovrappongono mai', () => {
  // Switch to DEMO mode
  localStorage.setItem('barpilot_is_demo', 'true');
  const demoOrders = window.db.get('orders');
  assert(demoOrders.length >= 4, 'Demo mode has its simulated orders');
  const demoOrd1042 = demoOrders.find(o => o.id === 1042);
  assert(demoOrd1042, 'Demo order #1042 exists in demo mode');

  const demoStats = window.calculateDashboardStatistics('all');
  assert(demoStats.ordersCount >= 4, 'Demo mode computes from demo orders');

  // Switch back to LIVE mode
  localStorage.setItem('barpilot_is_demo', 'false');
  const liveOrders = window.db.get('orders');
  const leak1042 = liveOrders.find(o => o.id === 1042);
  assert(!leak1042, 'Demo order #1042 MUST NEVER leak into LIVE bar orders');

  const liveStats = window.calculateDashboardStatistics('today');
  assert.strictEqual(liveStats.ordersCount, 1, 'Live bar only counts its own valid order');
  assert.strictEqual(liveStats.revenue, 5.80, 'Live bar revenue is strictly isolated');
});

// --------------------------------------------------------------------------
// TEST 14: Rientro dopo logout e login (persistenza dati reali garantita)
// --------------------------------------------------------------------------
runTest('Persistenza: i dati reali del bar rimangono intatti dopo riconnessione/login', () => {
  // Simulate page reload by re-instantiating storage from localStorage
  const reloadedDb = new BarPilotStorage();
  window.db = reloadedDb;

  const orders = window.db.get('orders');
  assert.strictEqual(orders.length, 2, 'Both live orders (1 active, 1 cancelled) are preserved');

  const stats = window.calculateDashboardStatistics('today');
  assert.strictEqual(stats.revenue, 5.80, 'Revenue preserved after reload');
  assert.strictEqual(stats.ordersCount, 1, 'Orders count preserved after reload');
});

// --------------------------------------------------------------------------
// TEST 15: Filtri Temporali (Oggi, Ieri, Mese, Tutto)
// --------------------------------------------------------------------------
runTest('Filtri Temporali: Oggi vs Ieri', () => {
  const statsToday = window.calculateDashboardStatistics('today');
  assert.strictEqual(statsToday.revenue, 5.80, 'Today revenue is 5.80 €');

  const statsYesterday = window.calculateDashboardStatistics('yesterday');
  assert.strictEqual(statsYesterday.revenue, 0.00, 'Yesterday revenue must be 0.00 €');
  assert.strictEqual(statsYesterday.ordersCount, 0, 'Yesterday orders count must be 0');
});

// --------------------------------------------------------------------------
// TEST 16: Confronto percentuale (Delta) con "Nuova attività"
// --------------------------------------------------------------------------
runTest('Confronto Delta %: periodo precedente a zero mostra Nuova attività, non divisione per zero', () => {
  const stats = window.calculateDashboardStatistics('today');
  assert.strictEqual(stats.revenueDelta.type, 'new', 'Revenue delta type is "new" when yesterday was 0');
  assert.strictEqual(stats.revenueDelta.text, 'Nuova attività', 'Revenue delta text is "Nuova attività"');
});

// --------------------------------------------------------------------------
// TEST 12: Prezzi storici conservati (modifica prezzo non altera vendite passate)
// --------------------------------------------------------------------------
runTest('Prezzi storici: la modifica del prezzo nel catalogo non modifica le vendite già registrate', () => {
  const products = window.db.get('products');
  const espresso = products.find(p => p.name === 'Espresso');
  const originalPrice = espresso.price;
  
  // Update price in catalog to 2.50 €
  espresso.price = 2.50;
  window.db.set('products', products);

  // Revenue of order 1001 must still be 5.80 € (2 * 1.50 + 1 * 2.80), NOT 2 * 2.50 + 2.80
  const stats = window.calculateDashboardStatistics('today');
  assert.strictEqual(stats.revenue, 5.80, 'Past revenue must strictly use historical price from order items');

  // Restore price
  espresso.price = originalPrice;
  window.db.set('products', products);
});

// --------------------------------------------------------------------------
// TEST 13: Categorie storiche conservate al momento della vendita
// --------------------------------------------------------------------------
runTest('Categorie storiche: la comanda conserva la categoria applicata al momento della vendita', () => {
  const orders = window.db.get('orders');
  const ord1 = orders.find(o => o.id === 1001);
  assert(ord1.items.every(it => it.category === 'coffee'), 'Order items retain original historical category');
});

// --------------------------------------------------------------------------
// TEST 14: Cambio del bar selezionato (Multi-bar isolato)
// --------------------------------------------------------------------------
runTest('Cambio bar: il passaggio a un secondo bar mostra esclusivamente i dati di quel bar', () => {
  const bar2 = {
    id: 'bar_secondo_locale_' + Date.now(),
    name: 'Milano Lounge',
    city: 'Milano',
    isDemo: false
  };
  window.db.set('activeBar', bar2);

  // Second bar must start with 0 orders and 0 revenue
  const statsBar2 = window.calculateDashboardStatistics('today');
  assert.strictEqual(statsBar2.revenue, 0.00, 'Second bar must start with 0.00 €');
  assert.strictEqual(statsBar2.ordersCount, 0, 'Second bar must have 0 orders');
  assert.strictEqual(statsBar2.recentOrders.length, 0, 'Second bar must have 0 recent orders');
});

// --------------------------------------------------------------------------
// TEST 15: Allerta magazzino (giacenza <= soglia minima)
// --------------------------------------------------------------------------
runTest('Allerta magazzino: conteggio dinamico prodotti con disponibilità <= soglia', () => {
  const inventory = [
    { id: 1, name: 'Latte intero', qty: 3, reorderLevel: 5 }, // Alert!
    { id: 2, name: 'Birra', qty: 48, reorderLevel: 20 },     // OK
    { id: 3, name: 'Caffè arabica', qty: 2, reorderLevel: 3 } // Alert!
  ];
  window.db.set('inventory', inventory);

  const stats = window.calculateDashboardStatistics('today');
  assert.strictEqual(stats.alertCount, 2, 'Must report exactly 2 alert items');
});

console.log('\n================================================================');
console.log(`🎉 TEST COMPLETED: ${testsPassed} of ${totalTests} passed successfully!`);
console.log('================================================================');
