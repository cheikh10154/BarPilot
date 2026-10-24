// ============================================================================
// BarPilot – Database Types
// Generated from Supabase schema (001_initial_schema.sql)
// ============================================================================

// ============================================================================
// 1. ENUM TYPES
// ============================================================================

export type UserRole = 'owner' | 'manager' | 'server' | 'bartender';
export type MembershipStatus = 'active' | 'invited' | 'disabled';
export type OrderStatus = 'draft' | 'sent' | 'preparing' | 'ready' | 'served' | 'closed' | 'cancelled';
export type OrderItemStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type StockMovementReason = 'purchase' | 'sale' | 'waste' | 'correction' | 'return';
export type PurchaseOrderStatus = 'draft' | 'sent' | 'received' | 'partial' | 'cancelled';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled';
export type BaseUnit = 'g' | 'kg' | 'ml' | 'l' | 'unit';
export type Locale = 'it' | 'fr';

// ============================================================================
// 2. TABLE ROW TYPES
// ============================================================================

// --------------------------------------------------------------------------
// 2.1 ORGANIZATION
// --------------------------------------------------------------------------
export interface Organization {
  id: string;
  name: string;
  legal_name: string | null;
  country: string;
  timezone: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationInsert {
  id?: string;
  name: string;
  legal_name?: string | null;
  country?: string;
  timezone?: string;
  logo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationUpdate {
  id?: string;
  name?: string;
  legal_name?: string | null;
  country?: string;
  timezone?: string;
  logo_url?: string | null;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// 2.2 LOCATION
// --------------------------------------------------------------------------
export interface Location {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  city: string | null;
  currency: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationInsert {
  id?: string;
  organization_id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  currency?: string;
  phone?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LocationUpdate {
  id?: string;
  organization_id?: string;
  name?: string;
  address?: string | null;
  city?: string | null;
  currency?: string;
  phone?: string | null;
  is_active?: boolean;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// 2.3 PROFILE
// --------------------------------------------------------------------------
export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  preferred_locale: Locale;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string; // References auth.users(id), required
  full_name?: string;
  email?: string;
  avatar_url?: string | null;
  preferred_locale?: Locale;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdate {
  full_name?: string;
  email?: string;
  avatar_url?: string | null;
  preferred_locale?: Locale;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// 2.4 MEMBERSHIP
// --------------------------------------------------------------------------
export interface Membership {
  id: string;
  organization_id: string;
  location_id: string | null;
  profile_id: string;
  role: UserRole;
  status: MembershipStatus;
  invited_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface MembershipInsert {
  id?: string;
  organization_id: string;
  location_id?: string | null;
  profile_id: string;
  role?: UserRole;
  status?: MembershipStatus;
  invited_email?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MembershipUpdate {
  id?: string;
  organization_id?: string;
  location_id?: string | null;
  profile_id?: string;
  role?: UserRole;
  status?: MembershipStatus;
  invited_email?: string | null;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// 2.5 AREA
// --------------------------------------------------------------------------
export interface Area {
  id: string;
  location_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AreaInsert {
  id?: string;
  location_id: string;
  name: string;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AreaUpdate {
  id?: string;
  location_id?: string;
  name?: string;
  sort_order?: number;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// 2.6 DINING TABLE
// --------------------------------------------------------------------------
export interface DiningTable {
  id: string;
  location_id: string;
  area_id: string | null;
  number: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiningTableInsert {
  id?: string;
  location_id: string;
  area_id?: string | null;
  number: string;
  capacity?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DiningTableUpdate {
  id?: string;
  location_id?: string;
  area_id?: string | null;
  number?: string;
  capacity?: number;
  is_active?: boolean;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// 2.7 CATEGORY
// --------------------------------------------------------------------------
export interface Category {
  id: string;
  location_id: string;
  name_it: string;
  name_fr: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryInsert {
  id?: string;
  location_id: string;
  name_it: string;
  name_fr?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryUpdate {
  id?: string;
  location_id?: string;
  name_it?: string;
  name_fr?: string;
  sort_order?: number;
  is_active?: boolean;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// 2.8 PRODUCT
// --------------------------------------------------------------------------
export interface Product {
  id: string;
  location_id: string;
  category_id: string;
  name_it: string;
  name_fr: string;
  description_it: string | null;
  description_fr: string | null;
  price_cents: number;
  is_available: boolean;
  is_composed: boolean;
  image_url: string | null;
  allergens: string[];
  created_at: string;
  updated_at: string;
}

export interface ProductInsert {
  id?: string;
  location_id: string;
  category_id: string;
  name_it: string;
  name_fr?: string;
  description_it?: string | null;
  description_fr?: string | null;
  price_cents: number;
  is_available?: boolean;
  is_composed?: boolean;
  image_url?: string | null;
  allergens?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ProductUpdate {
  id?: string;
  location_id?: string;
  category_id?: string;
  name_it?: string;
  name_fr?: string;
  description_it?: string | null;
  description_fr?: string | null;
  price_cents?: number;
  is_available?: boolean;
  is_composed?: boolean;
  image_url?: string | null;
  allergens?: string[];
  updated_at?: string;
}

// --------------------------------------------------------------------------
// 2.9 ORDER
// --------------------------------------------------------------------------
export interface Order {
  id: string;
  location_id: string;
  table_id: string | null;
  created_by: string;
  status: OrderStatus;
  total_cents: number;
  notes: string | null;
  idempotency_key: string | null;
  closed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderInsert {
  id?: string;
  location_id: string;
  table_id?: string | null;
  created_by: string;
  status?: OrderStatus;
  total_cents?: number;
  notes?: string | null;
  idempotency_key?: string | null;
  closed_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrderUpdate {
  id?: string;
  location_id?: string;
  table_id?: string | null;
  created_by?: string;
  status?: OrderStatus;
  total_cents?: number;
  notes?: string | null;
  idempotency_key?: string | null;
  closed_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// 2.10 ORDER ITEM
// --------------------------------------------------------------------------
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
  status: OrderItemStatus;
  notes: string | null;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemInsert {
  id?: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
  status?: OrderItemStatus;
  notes?: string | null;
  cancelled_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItemUpdate {
  id?: string;
  order_id?: string;
  product_id?: string;
  product_name?: string;
  quantity?: number;
  unit_price_cents?: number;
  status?: OrderItemStatus;
  notes?: string | null;
  cancelled_reason?: string | null;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// 2.11 ORDER EVENT (append-only)
// --------------------------------------------------------------------------
export interface OrderEvent {
  id: string;
  order_id: string;
  actor_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface OrderEventInsert {
  id?: string;
  order_id: string;
  actor_id: string;
  event_type: string;
  payload?: Record<string, unknown>;
  created_at?: string;
}

// OrderEvents are append-only – no update type needed

// --------------------------------------------------------------------------
// 2.12 INVENTORY ITEM
// --------------------------------------------------------------------------
export interface InventoryItem {
  id: string;
  location_id: string;
  name_it: string;
  name_fr: string;
  base_unit: BaseUnit;
  current_quantity: number;
  reorder_level: number;
  average_cost_cents: number;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryItemInsert {
  id?: string;
  location_id: string;
  name_it: string;
  name_fr?: string;
  base_unit?: BaseUnit;
  current_quantity?: number;
  reorder_level?: number;
  average_cost_cents?: number;
  category?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryItemUpdate {
  id?: string;
  location_id?: string;
  name_it?: string;
  name_fr?: string;
  base_unit?: BaseUnit;
  current_quantity?: number;
  reorder_level?: number;
  average_cost_cents?: number;
  category?: string | null;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// 2.13 STOCK MOVEMENT (append-only ledger)
// --------------------------------------------------------------------------
export interface StockMovement {
  id: string;
  inventory_item_id: string;
  location_id: string;
  quantity_delta: number;
  reason: StockMovementReason;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface StockMovementInsert {
  id?: string;
  inventory_item_id: string;
  location_id: string;
  quantity_delta: number;
  reason: StockMovementReason;
  reference_type?: string | null;
  reference_id?: string | null;
  notes?: string | null;
  created_by: string;
  created_at?: string;
}

// StockMovements are append-only – no update type needed

// --------------------------------------------------------------------------
// 2.14 RECIPE
// --------------------------------------------------------------------------
export interface Recipe {
  id: string;
  product_id: string;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeInsert {
  id?: string;
  product_id: string;
  version?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RecipeUpdate {
  id?: string;
  product_id?: string;
  version?: number;
  is_active?: boolean;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// 2.15 RECIPE ITEM
// --------------------------------------------------------------------------
export interface RecipeItem {
  id: string;
  recipe_id: string;
  inventory_item_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface RecipeItemInsert {
  id?: string;
  recipe_id: string;
  inventory_item_id: string;
  quantity: number;
  created_at?: string;
  updated_at?: string;
}

export interface RecipeItemUpdate {
  id?: string;
  recipe_id?: string;
  inventory_item_id?: string;
  quantity?: number;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// 2.16 SUPPLIER
// --------------------------------------------------------------------------
export interface Supplier {
  id: string;
  organization_id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierInsert {
  id?: string;
  organization_id: string;
  name: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierUpdate {
  id?: string;
  organization_id?: string;
  name?: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active?: boolean;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// 2.17 PURCHASE ORDER
// --------------------------------------------------------------------------
export interface PurchaseOrder {
  id: string;
  location_id: string;
  supplier_id: string;
  status: PurchaseOrderStatus;
  total_cents: number;
  ordered_at: string | null;
  received_at: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderInsert {
  id?: string;
  location_id: string;
  supplier_id: string;
  status?: PurchaseOrderStatus;
  total_cents?: number;
  ordered_at?: string | null;
  received_at?: string | null;
  notes?: string | null;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseOrderUpdate {
  id?: string;
  location_id?: string;
  supplier_id?: string;
  status?: PurchaseOrderStatus;
  total_cents?: number;
  ordered_at?: string | null;
  received_at?: string | null;
  notes?: string | null;
  created_by?: string;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// 2.18 PURCHASE ORDER ITEM
// --------------------------------------------------------------------------
export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  inventory_item_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost_cents: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItemInsert {
  id?: string;
  purchase_order_id: string;
  inventory_item_id: string;
  quantity_ordered: number;
  quantity_received?: number;
  unit_cost_cents?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseOrderItemUpdate {
  id?: string;
  purchase_order_id?: string;
  inventory_item_id?: string;
  quantity_ordered?: number;
  quantity_received?: number;
  unit_cost_cents?: number;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// 2.19 EXTERNAL SETTLEMENT
// --------------------------------------------------------------------------
export interface ExternalSettlement {
  id: string;
  order_id: string;
  amount_cents: number;
  method: string;
  external_reference: string | null;
  settled_at: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExternalSettlementInsert {
  id?: string;
  order_id: string;
  amount_cents: number;
  method: string;
  external_reference?: string | null;
  settled_at?: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExternalSettlementUpdate {
  id?: string;
  order_id?: string;
  amount_cents?: number;
  method?: string;
  external_reference?: string | null;
  settled_at?: string;
  created_by?: string;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// 2.20 AUDIT LOG (append-only)
// --------------------------------------------------------------------------
export interface AuditLog {
  id: string;
  organization_id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogInsert {
  id?: string;
  organization_id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at?: string;
}

// AuditLogs are append-only – no update type needed

// --------------------------------------------------------------------------
// 2.21 SUBSCRIPTION
// --------------------------------------------------------------------------
export interface Subscription {
  id: string;
  organization_id: string;
  plan: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionInsert {
  id?: string;
  organization_id: string;
  plan?: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  status?: SubscriptionStatus;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionUpdate {
  id?: string;
  organization_id?: string;
  plan?: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  status?: SubscriptionStatus;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  updated_at?: string;
}

// ============================================================================
// 3. COMPOSITE / JOIN TYPES
// ============================================================================

/** Order with its line items expanded */
export interface OrderWithItems extends Order {
  items: OrderItem[];
  table: DiningTable | null;
  created_by_profile: Profile | null;
}

/** Order with items + event history */
export interface OrderWithDetails extends OrderWithItems {
  events: OrderEvent[];
  settlements: ExternalSettlement[];
}

/** Product with its category relation */
export interface ProductWithCategory extends Product {
  category: Category;
}

/** Product with category + active recipe */
export interface ProductWithRecipe extends ProductWithCategory {
  recipe: RecipeWithItems | null;
}

/** Recipe with its ingredient lines expanded */
export interface RecipeWithItems extends Recipe {
  items: (RecipeItem & {
    inventory_item: InventoryItem;
  })[];
}

/** Inventory item with its recent stock movements */
export interface InventoryItemWithMovements extends InventoryItem {
  movements: StockMovement[];
}

/** Inventory item with low-stock flag */
export interface InventoryItemWithStatus extends InventoryItem {
  is_low_stock: boolean;
}

/** Membership with the profile data joined */
export interface MembershipWithProfile extends Membership {
  profile: Profile;
}

/** Location with its parent organization */
export interface LocationWithOrganization extends Location {
  organization: Organization;
}

/** Location with areas and tables */
export interface LocationWithLayout extends Location {
  areas: (Area & {
    tables: DiningTable[];
  })[];
}

/** Supplier with purchase order summaries */
export interface SupplierWithOrders extends Supplier {
  purchase_orders: PurchaseOrder[];
}

/** Purchase order with line items expanded */
export interface PurchaseOrderWithItems extends PurchaseOrder {
  items: (PurchaseOrderItem & {
    inventory_item: InventoryItem;
  })[];
  supplier: Supplier;
}

/** Category with its products */
export interface CategoryWithProducts extends Category {
  products: Product[];
}

/** Area with its dining tables */
export interface AreaWithTables extends Area {
  tables: DiningTable[];
}

/** Dining table with active orders */
export interface DiningTableWithOrders extends DiningTable {
  area: Area | null;
  active_orders: Order[];
}

// ============================================================================
// 4. ROLE-BASED PERMISSIONS
// ============================================================================

export interface RolePermissions {
  canViewDashboard: boolean;
  canViewFullDashboard: boolean;
  canTakeOrders: boolean;
  canPrepareOrders: boolean;
  canModifyPrices: boolean;
  canManageInventory: boolean;
  canViewInventory: boolean;
  canManageSuppliers: boolean;
  canManageStaff: boolean;
  canLimitedManageStaff: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  owner: {
    canViewDashboard: true,
    canViewFullDashboard: true,
    canTakeOrders: true,
    canPrepareOrders: true,
    canModifyPrices: true,
    canManageInventory: true,
    canViewInventory: true,
    canManageSuppliers: true,
    canManageStaff: true,
    canLimitedManageStaff: true,
    canViewReports: true,
    canManageSettings: true,
  },
  manager: {
    canViewDashboard: true,
    canViewFullDashboard: true,
    canTakeOrders: true,
    canPrepareOrders: true,
    canModifyPrices: true,
    canManageInventory: true,
    canViewInventory: true,
    canManageSuppliers: true,
    canManageStaff: false,
    canLimitedManageStaff: true,
    canViewReports: true,
    canManageSettings: false,
  },
  server: {
    canViewDashboard: true,
    canViewFullDashboard: false,
    canTakeOrders: true,
    canPrepareOrders: false,
    canModifyPrices: false,
    canManageInventory: false,
    canViewInventory: false,
    canManageSuppliers: false,
    canManageStaff: false,
    canLimitedManageStaff: false,
    canViewReports: false,
    canManageSettings: false,
  },
  bartender: {
    canViewDashboard: true,
    canViewFullDashboard: false,
    canTakeOrders: true,
    canPrepareOrders: true,
    canModifyPrices: false,
    canManageInventory: false,
    canViewInventory: true,
    canManageSuppliers: false,
    canManageStaff: false,
    canLimitedManageStaff: false,
    canViewReports: false,
    canManageSettings: false,
  },
} as const;

/** Check if a role has a specific permission */
export function hasPermission(
  role: UserRole,
  permission: keyof RolePermissions
): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

// ============================================================================
// 5. SUPABASE DATABASE TYPE HELPERS
// ============================================================================

/**
 * Supabase-compatible Database type definition.
 * Used for type-safe queries with @supabase/supabase-js.
 *
 * Usage:
 *   import { createClient } from '@supabase/supabase-js';
 *   import type { Database } from '@/types/database';
 *   const supabase = createClient<Database>(url, key);
 */
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: OrganizationInsert;
        Update: OrganizationUpdate;
        Relationships: [];
      };
      locations: {
        Row: Location;
        Insert: LocationInsert;
        Update: LocationUpdate;
        Relationships: [
          {
            foreignKeyName: 'locations_organization_id_fkey';
            columns: ['organization_id'];
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      memberships: {
        Row: Membership;
        Insert: MembershipInsert;
        Update: MembershipUpdate;
        Relationships: [
          {
            foreignKeyName: 'memberships_organization_id_fkey';
            columns: ['organization_id'];
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'memberships_location_id_fkey';
            columns: ['location_id'];
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'memberships_profile_id_fkey';
            columns: ['profile_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      areas: {
        Row: Area;
        Insert: AreaInsert;
        Update: AreaUpdate;
        Relationships: [
          {
            foreignKeyName: 'areas_location_id_fkey';
            columns: ['location_id'];
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
        ];
      };
      dining_tables: {
        Row: DiningTable;
        Insert: DiningTableInsert;
        Update: DiningTableUpdate;
        Relationships: [
          {
            foreignKeyName: 'dining_tables_location_id_fkey';
            columns: ['location_id'];
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dining_tables_area_id_fkey';
            columns: ['area_id'];
            referencedRelation: 'areas';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: Category;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
        Relationships: [
          {
            foreignKeyName: 'categories_location_id_fkey';
            columns: ['location_id'];
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
        Relationships: [
          {
            foreignKeyName: 'products_location_id_fkey';
            columns: ['location_id'];
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
        Relationships: [
          {
            foreignKeyName: 'orders_location_id_fkey';
            columns: ['location_id'];
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_table_id_fkey';
            columns: ['table_id'];
            referencedRelation: 'dining_tables';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      order_items: {
        Row: OrderItem;
        Insert: OrderItemInsert;
        Update: OrderItemUpdate;
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      order_events: {
        Row: OrderEvent;
        Insert: OrderEventInsert;
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'order_events_order_id_fkey';
            columns: ['order_id'];
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_events_actor_id_fkey';
            columns: ['actor_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      inventory_items: {
        Row: InventoryItem;
        Insert: InventoryItemInsert;
        Update: InventoryItemUpdate;
        Relationships: [
          {
            foreignKeyName: 'inventory_items_location_id_fkey';
            columns: ['location_id'];
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
        ];
      };
      stock_movements: {
        Row: StockMovement;
        Insert: StockMovementInsert;
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'stock_movements_inventory_item_id_fkey';
            columns: ['inventory_item_id'];
            referencedRelation: 'inventory_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_movements_location_id_fkey';
            columns: ['location_id'];
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_movements_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      recipes: {
        Row: Recipe;
        Insert: RecipeInsert;
        Update: RecipeUpdate;
        Relationships: [
          {
            foreignKeyName: 'recipes_product_id_fkey';
            columns: ['product_id'];
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      recipe_items: {
        Row: RecipeItem;
        Insert: RecipeItemInsert;
        Update: RecipeItemUpdate;
        Relationships: [
          {
            foreignKeyName: 'recipe_items_recipe_id_fkey';
            columns: ['recipe_id'];
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recipe_items_inventory_item_id_fkey';
            columns: ['inventory_item_id'];
            referencedRelation: 'inventory_items';
            referencedColumns: ['id'];
          },
        ];
      };
      suppliers: {
        Row: Supplier;
        Insert: SupplierInsert;
        Update: SupplierUpdate;
        Relationships: [
          {
            foreignKeyName: 'suppliers_organization_id_fkey';
            columns: ['organization_id'];
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      purchase_orders: {
        Row: PurchaseOrder;
        Insert: PurchaseOrderInsert;
        Update: PurchaseOrderUpdate;
        Relationships: [
          {
            foreignKeyName: 'purchase_orders_location_id_fkey';
            columns: ['location_id'];
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_orders_supplier_id_fkey';
            columns: ['supplier_id'];
            referencedRelation: 'suppliers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_orders_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      purchase_order_items: {
        Row: PurchaseOrderItem;
        Insert: PurchaseOrderItemInsert;
        Update: PurchaseOrderItemUpdate;
        Relationships: [
          {
            foreignKeyName: 'purchase_order_items_purchase_order_id_fkey';
            columns: ['purchase_order_id'];
            referencedRelation: 'purchase_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_order_items_inventory_item_id_fkey';
            columns: ['inventory_item_id'];
            referencedRelation: 'inventory_items';
            referencedColumns: ['id'];
          },
        ];
      };
      external_settlements: {
        Row: ExternalSettlement;
        Insert: ExternalSettlementInsert;
        Update: ExternalSettlementUpdate;
        Relationships: [
          {
            foreignKeyName: 'external_settlements_order_id_fkey';
            columns: ['order_id'];
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'external_settlements_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: AuditLogInsert;
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'audit_logs_organization_id_fkey';
            columns: ['organization_id'];
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'audit_logs_actor_id_fkey';
            columns: ['actor_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      subscriptions: {
        Row: Subscription;
        Insert: SubscriptionInsert;
        Update: SubscriptionUpdate;
        Relationships: [
          {
            foreignKeyName: 'subscriptions_organization_id_fkey';
            columns: ['organization_id'];
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      user_org_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      user_location_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
    };
    Enums: {
      membership_role: UserRole;
      membership_status: MembershipStatus;
      order_status: OrderStatus;
      order_item_status: OrderItemStatus;
      stock_reason: StockMovementReason;
      purchase_status: PurchaseOrderStatus;
      subscription_status: SubscriptionStatus;
      preferred_locale: Locale;
    };
    CompositeTypes: Record<string, never>;
  };
}

// ============================================================================
// 6. TYPE-SAFE QUERY HELPERS
// ============================================================================

/** Extract Row type from a table name */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/** Extract Insert type from a table name */
export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/** Extract Update type from a table name */
export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

/** All table names */
export type TableName = keyof Database['public']['Tables'];

/** All enum names */
export type EnumName = keyof Database['public']['Enums'];

// ============================================================================
// 7. UTILITY TYPES
// ============================================================================

/** Format cents as a display string (e.g., 1599 → "15.99") */
export type CentsAmount = number & { readonly __brand: 'cents' };

/** Precise decimal quantity for stock (e.g., 750.5 ml) */
export type StockQuantity = number & { readonly __brand: 'stock_quantity' };

/** ISO 8601 timestamp string (UTC) */
export type ISOTimestamp = string & { readonly __brand: 'iso_timestamp' };

/** UUID string */
export type UUID = string & { readonly __brand: 'uuid' };

/** Pagination params for list queries */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Sort direction */
export type SortDirection = 'asc' | 'desc';

/** Generic filter for list queries */
export interface ListFilter<T> {
  column: keyof T;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';
  value: unknown;
}

/** Supabase realtime payload */
export interface RealtimePayload<T> {
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: 'public';
  table: string;
  new: T;
  old: Partial<T>;
  errors: string[] | null;
}

/** Active order statuses (not terminal) */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'draft',
  'sent',
  'preparing',
  'ready',
  'served',
] as const;

/** Terminal order statuses */
export const TERMINAL_ORDER_STATUSES: OrderStatus[] = [
  'closed',
  'cancelled',
] as const;

/** Active order item statuses (not terminal) */
export const ACTIVE_ORDER_ITEM_STATUSES: OrderItemStatus[] = [
  'pending',
  'preparing',
  'ready',
] as const;

/** Check if an order status is terminal */
export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return status === 'closed' || status === 'cancelled';
}

/** Check if an order item status is terminal */
export function isTerminalOrderItemStatus(status: OrderItemStatus): boolean {
  return status === 'served' || status === 'cancelled';
}
