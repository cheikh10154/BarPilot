// api/sync-orders.js - Vercel Serverless Function (Node.js)
// Sincronizzazione in tempo reale delle comande tra Cameriere e KDS Barman
// Supporta multi-dispositivo (smartphone cameriere -> schermo KDS barman)

import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cprxxxlgaofopmogeuer.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnh4eGxnYW9mb3Btb2dldWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4Mzg1OTQsImV4cCI6MjEwODQxNDU5NH0.wuB9OUgmYo8n1xeJsGl-YpyzVRwg8Sr4k3XAKaYltRI";

function getStorePath(barId) {
  const safeId = String(barId || 'bar_demo').replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join('/tmp', `barpilot_orders_${safeId}.json`);
}

function getTimePath(barId) {
  const safeId = String(barId || 'bar_demo').replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join('/tmp', `barpilot_orders_${safeId}_time.json`);
}

function readOrders(barId) {
  try {
    const filePath = getStorePath(barId);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('[Sync Orders] Read error:', e.message);
  }
  return [];
}

function writeOrders(barId, orders) {
  try {
    const filePath = getStorePath(barId);
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), 'utf8');
    const timePath = getTimePath(barId);
    fs.writeFileSync(timePath, JSON.stringify({ lastUpdated: Date.now() }), 'utf8');
  } catch (e) {
    console.warn('[Sync Orders] Write error:', e.message);
  }
}

function getLastUpdated(barId) {
  try {
    const timePath = getTimePath(barId);
    if (fs.existsSync(timePath)) {
      const parsed = JSON.parse(fs.readFileSync(timePath, 'utf8'));
      if (parsed && parsed.lastUpdated) return parsed.lastUpdated;
    }
  } catch (_) {}
  return Date.now();
}

async function supabaseFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const queryBarId = req.query.barId || 'bar_demo';

  // GET: Restituisce la lista comande e timestamp di sincronizzazione
  if (req.method === 'GET') {
    const orders = readOrders(queryBarId);
    const lastUpdated = getLastUpdated(queryBarId);

    // Se fornito 'since', restituisce se ci sono aggiornamenti
    const since = parseInt(req.query.since || '0', 10);
    const hasNew = since > 0 ? (lastUpdated > since) : true;

    return res.status(200).json({
      success: true,
      barId: queryBarId,
      hasNew,
      lastUpdated,
      orders
    });
  }

  // POST: Aggiunta nuova comanda inviata dal cameriere
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const barId = body.barId || queryBarId || 'bar_demo';
      const newOrder = body.order;

      if (!newOrder && !body.orders) {
        return res.status(400).json({ error: 'Comanda mancante nel payload' });
      }

      let currentOrders = readOrders(barId);

      if (newOrder) {
        // Controlla se la comanda esiste già (evita duplicati)
        const existingIdx = currentOrders.findIndex(o => String(o.id) === String(newOrder.id));
        if (existingIdx >= 0) {
          currentOrders[existingIdx] = { ...currentOrders[existingIdx], ...newOrder };
        } else {
          currentOrders.unshift(newOrder);
        }
      } else if (Array.isArray(body.orders)) {
        currentOrders = body.orders;
      }

      // Limita a max 100 ordini recenti in memoria
      if (currentOrders.length > 100) {
        currentOrders = currentOrders.slice(0, 100);
      }

      writeOrders(barId, currentOrders);
      const lastUpdated = Date.now();

      // Tentativo persistenza opzionale su Supabase (se tabella orders configurata)
      try {
        if (newOrder) {
          await supabaseFetch('orders', {
            method: 'POST',
            body: JSON.stringify({
              id: newOrder.id,
              bar_id: barId,
              table_name: newOrder.table,
              status: newOrder.status || 'prep',
              total: newOrder.total || 0,
              items: newOrder.items || [],
              created_at: newOrder.createdAt || new Date().toISOString()
            })
          });
        }
      } catch (_) {}

      return res.status(200).json({
        success: true,
        barId,
        order: newOrder,
        lastUpdated,
        ordersCount: currentOrders.length
      });
    } catch (err) {
      console.error('[Sync Orders] POST error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // PATCH: Aggiornamento stato comanda (es. Barman segna Pronta, Servita, Pagata)
  if (req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const barId = body.barId || queryBarId || 'bar_demo';
      const orderId = body.orderId;
      const newStatus = body.status;

      if (!orderId || !newStatus) {
        return res.status(400).json({ error: 'orderId e status richiesti' });
      }

      let currentOrders = readOrders(barId);
      const ord = currentOrders.find(o => String(o.id) === String(orderId));

      if (ord) {
        ord.status = newStatus;
        if (newStatus === 'served' || newStatus === 'closed' || newStatus === 'paid') {
          ord.closedAt = ord.closedAt || new Date().toISOString();
          ord.userServed = true;
        }
        if (newStatus === 'paid') {
          ord.isPaid = true;
          ord.paidAt = new Date().toISOString();
        }
        writeOrders(barId, currentOrders);
      }

      return res.status(200).json({
        success: true,
        barId,
        orderId,
        status: newStatus,
        lastUpdated: Date.now()
      });
    } catch (err) {
      console.error('[Sync Orders] PATCH error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Metodo non consentito' });
}
