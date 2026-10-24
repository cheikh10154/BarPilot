// BarPilot Supabase Client Configuration
// Allows plug-and-play connection to Supabase PostgreSQL & Realtime
const SUPABASE_URL = window.BARPILOT_SUPABASE_URL || "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = window.BARPILOT_SUPABASE_KEY || "public-anon-key";

class BarPilotSupabase {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.isConfigured = url !== "https://your-project.supabase.co";
  }

  // Headers for Supabase REST API
  getHeaders() {
    return {
      "apikey": this.key,
      "Authorization": `Bearer ${this.key}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    };
  }

  // Fetch orders from Supabase
  async getOrders(barId) {
    if (!this.isConfigured) return window.db.get("orders");
    try {
      const res = await fetch(`${this.url}/rest/v1/orders?location_id=eq.${barId}&select=*,order_items(*)`, {
        headers: this.getHeaders()
      });
      return await res.json();
    } catch (e) {
      console.warn("Supabase fetch failed, falling back to local store", e);
      return window.db.get("orders");
    }
  }

  // Create order
  async createOrder(orderPayload) {
    if (!this.isConfigured) {
      console.log("Local mock order creation:", orderPayload);
      return { success: true, local: true };
    }
    try {
      const res = await fetch(`${this.url}/rest/v1/orders`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(orderPayload)
      });
      return await res.json();
    } catch (e) {
      console.error("Supabase insert error", e);
      return { error: e.message };
    }
  }

  // Update order status (KDS)
  async updateOrderStatus(orderId, status) {
    if (!this.isConfigured) return { success: true };
    try {
      const res = await fetch(`${this.url}/rest/v1/orders?id=eq.${orderId}`, {
        method: "PATCH",
        headers: this.getHeaders(),
        body: JSON.stringify({ status, updated_at: new Date().toISOString() })
      });
      return await res.json();
    } catch (e) {
      console.error("Supabase update error", e);
    }
  }
}

window.supabase = new BarPilotSupabase(SUPABASE_URL, SUPABASE_ANON_KEY);
