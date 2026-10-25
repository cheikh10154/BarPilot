import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole } from '@/types/database';

export interface ProductItem {
  id: string;
  category: 'coffee' | 'beer' | 'wine' | 'cocktails' | 'spirits' | 'softDrinks' | 'food';
  name_it: string;
  name_fr: string;
  price_cents: number;
  description_it: string;
  description_fr: string;
  is_available: boolean;
  cost_cents?: number;
  vat_rate?: number;
  image_url?: string;
  station?: 'bar' | 'coffee' | 'kitchen';
  allergens?: string[];
  recipe?: {
    inventory_item_id: string;
    quantity: number; // in unit
  }[];
}

export interface InventoryItem {
  id: string;
  name_it: string;
  name_fr: string;
  category: string;
  base_unit: 'g' | 'kg' | 'ml' | 'l' | 'unit';
  current_quantity: number;
  reorder_level: number;
  average_cost_cents: number;
  supplier?: string;
  notes?: string;
}

export interface StockMovement {
  id: string;
  inventory_item_id: string;
  item_name: string;
  quantity_delta: number;
  base_unit: string;
  reason: 'sale' | 'purchase' | 'waste' | 'correction';
  order_id?: string;
  timestamp: string;
}

export interface DiningTable {
  id: string;
  number: string;
  area: 'indoor' | 'outdoor' | 'bar' | 'vip';
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  active_order_id?: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
}

export interface Order {
  id: string;
  order_number: number;
  table_id: string | null;
  table_number: string; // e.g., "Tavolo 04" or "Bancone"
  server_name: string;
  status: 'draft' | 'sent' | 'preparing' | 'ready' | 'served' | 'closed' | 'cancelled';
  items: OrderItem[];
  total_cents: number;
  created_at: string;
  notes?: string;
  cancel_reason?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  category: string;
  products_supplied: string[];
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'invited' | 'disabled';
  last_active: string;
}

// Initial Mock Data
export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    category: 'coffee',
    name_it: 'Espresso',
    name_fr: 'Espresso',
    price_cents: 130,
    description_it: 'Miscela 100% Arabica artigianale tostata a legna',
    description_fr: 'Mélange 100% Arabica artisanal torréfié au feu de bois',
    is_available: true,
    recipe: [{ inventory_item_id: 'inv-1', quantity: 9 }], // 9g coffee
  },
  {
    id: 'prod-2',
    category: 'coffee',
    name_it: 'Cappuccino',
    name_fr: 'Cappuccino',
    price_cents: 180,
    description_it: 'Espresso con schiuma di latte fresco intero',
    description_fr: 'Espresso avec mousse de lait frais entier',
    is_available: true,
    recipe: [
      { inventory_item_id: 'inv-1', quantity: 9 }, // 9g coffee
      { inventory_item_id: 'inv-2', quantity: 150 }, // 150ml milk
    ],
  },
  {
    id: 'prod-3',
    category: 'cocktails',
    name_it: 'Aperol Spritz',
    name_fr: 'Aperol Spritz',
    price_cents: 600,
    description_it: 'Prosecco DOC, Aperol, spruzzo di soda, fetta d\'arancia',
    description_fr: 'Prosecco DOC, Aperol, trait d\'eau gazeuse, tranche d\'orange',
    is_available: true,
    recipe: [
      { inventory_item_id: 'inv-3', quantity: 90 }, // 90ml Prosecco
      { inventory_item_id: 'inv-4', quantity: 60 }, // 60ml Aperol
    ],
  },
  {
    id: 'prod-4',
    category: 'cocktails',
    name_it: 'Negroni Classico',
    name_fr: 'Negroni Classique',
    price_cents: 800,
    description_it: 'Gin artigianale, Vermouth Rosso, Campari Bitter',
    description_fr: 'Gin artisanal, Vermouth Rouge, Campari Bitter',
    is_available: true,
    recipe: [
      { inventory_item_id: 'inv-5', quantity: 30 }, // 30ml Gin
      { inventory_item_id: 'inv-6', quantity: 30 }, // 30ml Campari
      { inventory_item_id: 'inv-7', quantity: 30 }, // 30ml Vermouth
    ],
  },
  {
    id: 'prod-5',
    category: 'cocktails',
    name_it: 'Mojito Cubano',
    name_fr: 'Mojito Cubain',
    price_cents: 850,
    description_it: 'Rhum bianco, menta fresca, limone verde, zucchero di canna, soda',
    description_fr: 'Rhum blanc, menthe fraîche, citron vert, sucre de canne, soda',
    is_available: true,
    recipe: [
      { inventory_item_id: 'inv-9', quantity: 50 }, // 50ml Rhum
      { inventory_item_id: 'inv-10', quantity: 1 }, // 1 lime
      { inventory_item_id: 'inv-11', quantity: 15 }, // 15g sucre
    ],
  },
  {
    id: 'prod-6',
    category: 'beer',
    name_it: 'Bière Blonde alla Spina',
    name_fr: 'Bière Blonde Pression',
    price_cents: 550,
    description_it: 'Lager bionda fresca 40cl alla spina',
    description_fr: 'Lager blonde fraîche 40cl pression',
    is_available: true,
    recipe: [{ inventory_item_id: 'inv-8', quantity: 400 }], // 400ml
  },
  {
    id: 'prod-7',
    category: 'softDrinks',
    name_it: 'Acqua Tonica Fever-Tree',
    name_fr: 'Eau Tonique Fever-Tree',
    price_cents: 350,
    description_it: 'Tonica premium con chinino naturale',
    description_fr: 'Tonic premium avec quinine naturelle',
    is_available: true,
    recipe: [{ inventory_item_id: 'inv-12', quantity: 1 }],
  },
  {
    id: 'prod-8',
    category: 'food',
    name_it: 'Croissant Artigianale al Burro',
    name_fr: 'Croissant Artisanal au Beurre',
    price_cents: 160,
    description_it: 'Al burro di Normandia, caldo di forno',
    description_fr: 'Au beurre de Normandie, tout chaud',
    is_available: true,
  },
  {
    id: 'prod-9',
    category: 'food',
    name_it: 'Tagliere Salumi & Formaggi',
    name_fr: 'Planchette Charcuterie & Fromages',
    price_cents: 1400,
    description_it: 'Prosciutto crudo di Parma 24 mesi, Pecorino, olive ascolane, focaccia',
    description_fr: 'Jambon de Parme 24 mois, Pecorino, olives, focaccia tiède',
    is_available: true,
  },
  {
    id: 'prod-10',
    category: 'food',
    name_it: 'Panino Rustico Toast',
    name_fr: 'Toast Rustique Jambon Fromage',
    price_cents: 450,
    description_it: 'Pane casereccio con prosciutto cotto alta qualità e formaggio fuso',
    description_fr: 'Pain maison au jambon cuit supérieur et fromage fondu',
    is_available: true,
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', name_it: 'Caffè Arabica in grani', name_fr: 'Café Arabica en grains', category: 'Caffè', base_unit: 'kg', current_quantity: 4.5, reorder_level: 6.0, average_cost_cents: 2200 },
  { id: 'inv-2', name_it: 'Latte Intero Fresco', name_fr: 'Lait Frais Entier', category: 'Latticini', base_unit: 'l', current_quantity: 3.2, reorder_level: 10.0, average_cost_cents: 130 },
  { id: 'inv-3', name_it: 'Prosecco DOC Treviso', name_fr: 'Prosecco DOC Trévise', category: 'Vino & Bollicine', base_unit: 'unit', current_quantity: 14, reorder_level: 6, average_cost_cents: 480 },
  { id: 'inv-4', name_it: 'Aperol 1L', name_fr: 'Aperol 1L', category: 'Liquori', base_unit: 'unit', current_quantity: 5, reorder_level: 3, average_cost_cents: 1150 },
  { id: 'inv-5', name_it: 'Gin London Dry 70cl', name_fr: 'Gin London Dry 70cl', category: 'Spirits', base_unit: 'unit', current_quantity: 4, reorder_level: 2, average_cost_cents: 1850 },
  { id: 'inv-6', name_it: 'Campari Bitter 1L', name_fr: 'Campari Bitter 1L', category: 'Spirits', base_unit: 'unit', current_quantity: 3, reorder_level: 2, average_cost_cents: 1420 },
  { id: 'inv-7', name_it: 'Vermouth Rosso di Torino', name_fr: 'Vermouth Rouge de Turin', category: 'Spirits', base_unit: 'unit', current_quantity: 2, reorder_level: 2, average_cost_cents: 1300 },
  { id: 'inv-8', name_it: 'Bière Blonde (Fusto 30L)', name_fr: 'Bière Blonde (Fût 30L)', category: 'Birra', base_unit: 'unit', current_quantity: 1, reorder_level: 3, average_cost_cents: 8500 },
  { id: 'inv-9', name_it: 'Rhum Bianco Carta Blanca', name_fr: 'Rhum Blanc Carta Blanca', category: 'Spirits', base_unit: 'unit', current_quantity: 2, reorder_level: 3, average_cost_cents: 1490 },
  { id: 'inv-10', name_it: 'Limone Verde (Lime)', name_fr: 'Citron Vert (Lime)', category: 'Freschi', base_unit: 'unit', current_quantity: 8, reorder_level: 25, average_cost_cents: 40 },
  { id: 'inv-11', name_it: 'Sucre de Canne Bianco', name_fr: 'Sucre de Canne Blanc', category: 'Drogheria', base_unit: 'kg', current_quantity: 6.0, reorder_level: 2.0, average_cost_cents: 180 },
  { id: 'inv-12', name_it: 'Acqua Tonica Premium 20cl', name_fr: 'Eau Tonique Premium 20cl', category: 'Soft Drinks', base_unit: 'unit', current_quantity: 48, reorder_level: 24, average_cost_cents: 95 },
];

export const INITIAL_TABLES: DiningTable[] = [
  { id: 'tbl-1', number: '01', area: 'indoor', capacity: 2, status: 'occupied', active_order_id: 'ord-101' },
  { id: 'tbl-2', number: '02', area: 'indoor', capacity: 4, status: 'available' },
  { id: 'tbl-3', number: '03', area: 'indoor', capacity: 4, status: 'available' },
  { id: 'tbl-4', number: '04', area: 'outdoor', capacity: 6, status: 'occupied', active_order_id: 'ord-102' },
  { id: 'tbl-5', number: '05', area: 'outdoor', capacity: 2, status: 'available' },
  { id: 'tbl-6', number: '06', area: 'outdoor', capacity: 4, status: 'reserved' },
  { id: 'tbl-7', number: 'VIP 1', area: 'vip', capacity: 8, status: 'available' },
  { id: 'tbl-8', number: 'Comptoir', area: 'bar', capacity: 10, status: 'available' },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    order_number: 101,
    table_id: 'tbl-1',
    table_number: 'Tavolo 01',
    server_name: 'Marco',
    status: 'preparing',
    total_cents: 360,
    created_at: new Date(Date.now() - 6 * 60000).toISOString(),
    notes: 'Cappuccino ben caldo con tanta schiuma',
    items: [
      { id: 'item-1', product_id: 'prod-2', product_name: 'Cappuccino', unit_price_cents: 180, quantity: 2, status: 'preparing' },
    ],
  },
  {
    id: 'ord-102',
    order_number: 102,
    table_id: 'tbl-4',
    table_number: 'Tavolo 04 (Terrazza)',
    server_name: 'Sofia',
    status: 'sent',
    total_cents: 2800,
    created_at: new Date(Date.now() - 3 * 60000).toISOString(),
    notes: 'Portare arachidi e patatine al tavolo',
    items: [
      { id: 'item-2', product_id: 'prod-3', product_name: 'Aperol Spritz', unit_price_cents: 600, quantity: 2, status: 'pending' },
      { id: 'item-3', product_id: 'prod-4', product_name: 'Negroni Classico', unit_price_cents: 800, quantity: 2, status: 'pending' },
    ],
  },
  {
    id: 'ord-100',
    order_number: 100,
    table_id: null,
    table_number: 'Bancone',
    server_name: 'Gianluca',
    status: 'served',
    total_cents: 550,
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    items: [
      { id: 'item-4', product_id: 'prod-5', product_name: 'Birra alla Spina (Media)', unit_price_cents: 550, quantity: 1, status: 'served' },
    ],
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'Caffè Vergnano SpA', contact_name: 'Roberto Vianello', email: 'ordini@caffevergnano.it', phone: '+39 011 942 0111', category: 'Caffetteria & Macchine', products_supplied: ['Caffè Arabica in grani', 'Tazze & Merchandising', 'Filtri'] },
  { id: 'sup-2', name: 'Coca-Cola HBC Italia', contact_name: 'Elena Conti', email: 'ordini.bar@cchellenic.com', phone: '+39 02 4441 5000', category: 'Soft Drinks & Mixer', products_supplied: ['Acqua Tonica Fever-Tree', 'Coca-Cola', 'Fanta', 'Sprite'] },
  { id: 'sup-3', name: 'Campari Group Italia', contact_name: 'Marco Bellini', email: 'distribuzione@campari.com', phone: '+39 02 62251', category: 'Aperitivi & Spirits', products_supplied: ['Aperol 1L', 'Campari Bitter 1L', 'Gin London Dry', 'Vermouth Rosso'] },
  { id: 'sup-4', name: 'Metro Italia Cash & Carry', contact_name: 'Paolo Rossi', email: 'clienti@metro.it', phone: '+39 02 575 881', category: 'Food & Drogheria', products_supplied: ['Latte Intero Fresco', 'Sucre de Canne', 'Salumi e Formaggi', 'Snack'] },
  { id: 'sup-5', name: 'Surgital & Bakery d\'Asolo', contact_name: 'Claudia Ferri', email: 'ordini@bakeryforno.it', phone: '+39 0423 9321', category: 'Pasticceria & Snack', products_supplied: ['Croissant Artigianali al Burro', 'Focaccia Ligure', 'Panini Rustici'] },
];

export const INITIAL_STAFF: StaffMember[] = [
  { id: 'stf-1', name: 'Marco Rossi', email: 'marco.rossi@barcentrale.it', role: 'owner', status: 'active', last_active: 'Adesso' },
  { id: 'stf-2', name: 'Laura Bianchi', email: 'laura.bianchi@barcentrale.it', role: 'manager', status: 'active', last_active: '15 min fa' },
  { id: 'stf-3', name: 'Giulia Conti', email: 'giulia.conti@barcentrale.it', role: 'server', status: 'active', last_active: '2 min fa' },
  { id: 'stf-4', name: 'Alessandro De Luca', email: 'alessandro@barcentrale.it', role: 'bartender', status: 'active', last_active: '3 min fa' },
  { id: 'stf-5', name: 'Sara Romano', email: 'sara.romano@barcentrale.it', role: 'server', status: 'active', last_active: 'Oggi 08:30' },
  { id: 'stf-6', name: 'Luca Ferrari', email: 'luca.ferrari@barcentrale.it', role: 'bartender', status: 'disabled', last_active: 'Ieri' },
];

interface BarPilotState {
  currentRole: UserRole;
  currentLocale: 'it' | 'fr';
  barName: string;
  barLocation: string;
  products: ProductItem[];
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  tables: DiningTable[];
  orders: Order[];
  suppliers: Supplier[];
  staff: StaffMember[];

  // Actions
  setRole: (role: UserRole) => void;
  setLocale: (locale: 'it' | 'fr') => void;
  
  // Orders
  createOrder: (data: { table_id: string | null; table_number: string; server_name: string; items: { product: ProductItem; quantity: number }[]; notes?: string }) => Order;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updateOrderItemStatus: (orderId: string, itemId: string, status: OrderItem['status']) => void;
  cancelOrder: (orderId: string, reason: string) => void;
  settleOrder: (orderId: string, method: string) => void;

  // Inventory & Recipes
  adjustInventory: (itemId: string, delta: number, reason: StockMovement['reason']) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (itemId: string, data: Partial<InventoryItem>) => void;
  deleteInventoryItem: (itemId: string) => void;

  // Products
  addProduct: (product: Omit<ProductItem, 'id'>) => void;
  updateProduct: (productId: string, data: Partial<ProductItem>) => void;
  deleteProduct: (productId: string) => void;
  toggleProductAvailability: (productId: string) => void;

  // Tables
  updateTableStatus: (tableId: string, status: DiningTable['status'], activeOrderId?: string) => void;

  // Reset to demo
  resetToDemo: () => void;
}

export const useBarPilotStore = create<BarPilotState>()(
  persist(
    (set, get) => ({
      currentRole: 'owner',
      currentLocale: 'it',
      barName: 'Bar Central',
      barLocation: 'Milano · Duomo',
      products: INITIAL_PRODUCTS,
      inventory: INITIAL_INVENTORY,
      stockMovements: [
        {
          id: 'mov-1',
          inventory_item_id: 'inv-1',
          item_name: 'Caffè Arabica in grani',
          quantity_delta: -18,
          base_unit: 'g',
          reason: 'sale',
          order_id: 'ord-101',
          timestamp: new Date(Date.now() - 6 * 60000).toISOString(),
        },
        {
          id: 'mov-2',
          inventory_item_id: 'inv-2',
          item_name: 'Latte Intero Fresco',
          quantity_delta: -300,
          base_unit: 'ml',
          reason: 'sale',
          order_id: 'ord-101',
          timestamp: new Date(Date.now() - 6 * 60000).toISOString(),
        },
      ],
      tables: INITIAL_TABLES,
      orders: INITIAL_ORDERS,
      suppliers: INITIAL_SUPPLIERS,
      staff: INITIAL_STAFF,

      setRole: (role) => {
        document.cookie = `barpilot_role=${role}; path=/; max-age=86400`;
        set({ currentRole: role });
      },

      setLocale: (locale) => set({ currentLocale: locale }),

      createOrder: ({ table_id, table_number, server_name, items, notes }) => {
        const nextNumber = Math.max(...get().orders.map(o => o.order_number), 100) + 1;
        const total_cents = items.reduce((sum, item) => sum + item.product.price_cents * item.quantity, 0);

        const newOrder: Order = {
          id: `ord-${Date.now()}`,
          order_number: nextNumber,
          table_id,
          table_number,
          server_name,
          status: 'sent', // Direct to bar
          total_cents,
          created_at: new Date().toISOString(),
          notes,
          items: items.map((it, idx) => ({
            id: `item-${Date.now()}-${idx}`,
            product_id: it.product.id,
            product_name: get().currentLocale === 'it' ? it.product.name_it : it.product.name_fr,
            unit_price_cents: it.product.price_cents,
            quantity: it.quantity,
            status: 'pending',
          })),
        };

        // If assigned to a table, update table status to occupied
        if (table_id) {
          set(state => ({
            tables: state.tables.map(t =>
              t.id === table_id ? { ...t, status: 'occupied', active_order_id: newOrder.id } : t
            ),
          }));
        }

        // Deduct inventory according to recipes
        const newMovements: StockMovement[] = [];
        const updatedInventory = [...get().inventory];

        items.forEach(orderItem => {
          if (orderItem.product.recipe) {
            orderItem.product.recipe.forEach(ing => {
              const invIdx = updatedInventory.findIndex(i => i.id === ing.inventory_item_id);
              if (invIdx >= 0) {
                const totalConsumption = ing.quantity * orderItem.quantity;
                updatedInventory[invIdx].current_quantity = Math.max(
                  0,
                  updatedInventory[invIdx].current_quantity - totalConsumption
                );

                newMovements.push({
                  id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  inventory_item_id: ing.inventory_item_id,
                  item_name: updatedInventory[invIdx].name_it,
                  quantity_delta: -totalConsumption,
                  base_unit: updatedInventory[invIdx].base_unit,
                  reason: 'sale',
                  order_id: newOrder.id,
                  timestamp: new Date().toISOString(),
                });
              }
            });
          }
        });

        set(state => ({
          orders: [newOrder, ...state.orders],
          inventory: updatedInventory,
          stockMovements: [...newMovements, ...state.stockMovements],
        }));

        return newOrder;
      },

      updateOrderStatus: (orderId, newStatus) => {
        set(state => {
          const updatedOrders = state.orders.map(order => {
            if (order.id !== orderId) return order;
            return {
              ...order,
              status: newStatus,
              items: order.items.map(i => ({
                ...i,
                status:
                  newStatus === 'ready'
                    ? 'ready'
                    : newStatus === 'served'
                    ? 'served'
                    : newStatus === 'preparing'
                    ? 'preparing'
                    : i.status,
              })),
            };
          });

          // If closed, free the table
          const order = state.orders.find(o => o.id === orderId);
          let updatedTables = state.tables;
          if (order && order.table_id && (newStatus === 'closed' || newStatus === 'cancelled')) {
            updatedTables = state.tables.map(t =>
              t.id === order.table_id ? { ...t, status: 'available' as const, active_order_id: undefined } : t
            );
          }

          return { orders: updatedOrders, tables: updatedTables };
        });
      },

      updateOrderItemStatus: (orderId, itemId, itemStatus) => {
        set(state => ({
          orders: state.orders.map(order => {
            if (order.id !== orderId) return order;
            const updatedItems = order.items.map(it =>
              it.id === itemId ? { ...it, status: itemStatus } : it
            );
            // Check if all items are ready
            const allReady = updatedItems.every(i => i.status === 'ready');
            const somePreparing = updatedItems.some(i => i.status === 'preparing');
            const newOrderStatus = allReady ? 'ready' : somePreparing ? 'preparing' : order.status;

            return {
              ...order,
              items: updatedItems,
              status: newOrderStatus,
            };
          }),
        }));
      },

      cancelOrder: (orderId, reason) => {
        set(state => {
          const order = state.orders.find(o => o.id === orderId);
          if (!order) return state;

          const updatedTables: DiningTable[] = order.table_id
            ? state.tables.map(t =>
                t.id === order.table_id ? { ...t, status: 'available' as const, active_order_id: undefined } : t
              )
            : state.tables;

          return {
            tables: updatedTables,
            orders: state.orders.map(o =>
              o.id === orderId
                ? {
                    ...o,
                    status: 'cancelled',
                    cancel_reason: reason,
                  }
                : o
            ),
          };
        });
      },

      settleOrder: (orderId, _method) => {
        get().updateOrderStatus(orderId, 'closed');
      },

      adjustInventory: (itemId, delta, reason) => {
        set(state => {
          const invIdx = state.inventory.findIndex(i => i.id === itemId);
          if (invIdx < 0) return state;

          const item = state.inventory[invIdx];
          const newQty = Math.max(0, item.current_quantity + delta);
          const updatedInv = [...state.inventory];
          updatedInv[invIdx] = { ...item, current_quantity: newQty };

          const newMovement: StockMovement = {
            id: `mov-${Date.now()}`,
            inventory_item_id: itemId,
            item_name: item.name_it,
            quantity_delta: delta,
            base_unit: item.base_unit,
            reason,
            timestamp: new Date().toISOString(),
          };

          return {
            inventory: updatedInv,
            stockMovements: [newMovement, ...state.stockMovements],
          };
        });
      },

      addInventoryItem: (item) => {
        const newItem: InventoryItem = {
          ...item,
          id: `inv-${Date.now()}`,
        };
        set(state => ({ inventory: [...state.inventory, newItem] }));
      },

      updateInventoryItem: (itemId, data) => {
        set(state => ({
          inventory: state.inventory.map(i =>
            i.id === itemId ? { ...i, ...data } : i
          ),
        }));
      },

      deleteInventoryItem: (itemId) => {
        set(state => ({
          inventory: state.inventory.filter(i => i.id !== itemId),
        }));
      },

      addProduct: (prod) => {
        const newProduct: ProductItem = {
          ...prod,
          id: `prod-${Date.now()}`,
        };
        set(state => ({ products: [...state.products, newProduct] }));
      },

      updateProduct: (productId, data) => {
        set(state => ({
          products: state.products.map(p =>
            p.id === productId ? { ...p, ...data } : p
          ),
        }));
      },

      deleteProduct: (productId) => {
        set(state => ({
          products: state.products.filter(p => p.id !== productId),
        }));
      },

      toggleProductAvailability: (productId) => {
        set(state => ({
          products: state.products.map(p =>
            p.id === productId ? { ...p, is_available: !p.is_available } : p
          ),
        }));
      },

      updateTableStatus: (tableId, status, activeOrderId) => {
        set(state => ({
          tables: state.tables.map(t =>
            t.id === tableId ? { ...t, status, active_order_id: activeOrderId } : t
          ),
        }));
      },

      resetToDemo: () => {
        set({
          products: INITIAL_PRODUCTS,
          inventory: INITIAL_INVENTORY,
          tables: INITIAL_TABLES,
          orders: INITIAL_ORDERS,
          suppliers: INITIAL_SUPPLIERS,
          staff: INITIAL_STAFF,
        });
      },
    }),
    {
      name: 'barpilot-storage',
    }
  )
);
