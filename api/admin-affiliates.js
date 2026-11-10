// api/admin-affiliates.js - Vercel Serverless Function (Node.js)
// Gestione Amministrazione Affiliazioni per /app/administration
// Permette al Super Admin di:
// 1. Visualizzare tutti gli affiliati, codici e metriche
// 2. Modificare la percentuale di commissione predefinita
// 3. Verificare i referral e stato di attivazione
// 4. Gestire gli stati delle commissioni (In attesa, Disponibile, Pagata, Annullata)
// 5. Consultare lo storico completo dei pagamenti e registrazioni

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cprxxxlgaofopmogeuer.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnh4eGxnYW9mb3Btb2dldWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4Mzg1OTQsImV4cCI6MjEwODQxNDU5NH0.wuB9OUgmYo8n1xeJsGl-YpyzVRwg8Sr4k3XAKaYltRI";

const AFFILIATES_FILE = path.join('/tmp', 'barpilot_affiliates_store.json');

function readAffiliatesStore() {
  try {
    if (fs.existsSync(AFFILIATES_FILE)) {
      const data = fs.readFileSync(AFFILIATES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('[Admin Affiliates Store] Read error:', e.message);
  }
  return { affiliates: [], referrals: [], commissions: [], settings: { default_rate: 20.0 } };
}

function writeAffiliatesStore(data) {
  try {
    fs.writeFileSync(AFFILIATES_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Admin Affiliates Store] Write error:', e.message);
  }
}

async function supabaseFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=representation',
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-pin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verifica credenziali Super Admin (PIN 101540 o sessione autorizzata)
  const pin = req.headers['x-admin-pin'] || req.query.pin || (req.body && req.body.pin);
  const authHeader = req.headers['authorization'] || '';
  const isAuthorized = pin === '101540' || authHeader.includes('Bearer');

  if (!isAuthorized) {
    return res.status(401).json({ error: "Accesso non autorizzato. Richiesta autenticazione Super Admin." });
  }

  try {
    const store = readAffiliatesStore();

    // ------------------------------------------------------------------------
    // GET: Elenco completo affiliati, referral, commissioni e impostazioni
    // ------------------------------------------------------------------------
    if (req.method === 'GET') {
      // 1. Recupera impostazioni
      let commissionRate = store.settings?.default_rate || 20.0;
      try {
        const setRes = await supabaseFetch("admin_settings?setting_key=eq.affiliate_commission_rate&limit=1");
        if (setRes.ok) {
          const rows = await setRes.json();
          if (rows && rows[0]?.setting_value) {
            commissionRate = parseFloat(rows[0].setting_value) || commissionRate;
          }
        }
      } catch (_) {}

      // 2. Recupera tutti gli affiliati
      let affiliates = [];
      try {
        const affRes = await supabaseFetch("affiliates?order=created_at.desc");
        if (affRes.ok) {
          affiliates = await affRes.json();
        }
      } catch (_) {}

      if (!affiliates || affiliates.length === 0) {
        affiliates = store.affiliates || [];
      }

      // 3. Recupera tutti i referral
      let referrals = [];
      try {
        const refRes = await supabaseFetch("affiliate_referrals?order=registered_at.desc");
        if (refRes.ok) {
          referrals = await refRes.json();
        }
      } catch (_) {}

      if (!referrals || referrals.length === 0) {
        referrals = store.referrals || [];
      }

      // 4. Recupera tutte le commissioni
      let commissions = [];
      try {
        const commRes = await supabaseFetch("affiliate_commissions?order=created_at.desc");
        if (commRes.ok) {
          commissions = await commRes.json();
        }
      } catch (_) {}

      if (!commissions || commissions.length === 0) {
        commissions = store.commissions || [];
      }

      // 5. Arricchisci gli affiliati con i conteggi calcolati
      const enrichedAffiliates = affiliates.map(aff => {
        const affRefs = referrals.filter(r => r.affiliate_id === aff.id || r.affiliate_code === aff.code);
        const affComms = commissions.filter(c => c.affiliate_id === aff.id);

        let available = 0;
        let pending = 0;
        let paid = 0;
        let total = 0;

        affComms.forEach(c => {
          const a = parseFloat(c.amount) || 0;
          if (c.status === 'available') available += a;
          else if (c.status === 'pending') pending += a;
          else if (c.status === 'paid') paid += a;
          if (c.status !== 'cancelled') total += a;
        });

        return {
          id: aff.id,
          name: aff.name || aff.email.split('@')[0],
          email: aff.email,
          code: aff.code,
          status: aff.status || 'active',
          commission_rate: aff.commission_rate || commissionRate,
          total_referrals: affRefs.length,
          active_referrals: affRefs.filter(r => r.status === 'active').length,
          available_balance: available.toFixed(2),
          pending_balance: pending.toFixed(2),
          paid_balance: paid.toFixed(2),
          total_earned: total.toFixed(2),
          created_at: aff.created_at
        };
      });

      // Calcola KPI globali
      const totalAffiliates = affiliates.length;
      const totalReferrals = referrals.length;
      const activeReferrals = referrals.filter(r => r.status === 'active').length;
      let totalCommissionsPending = 0;
      let totalCommissionsPaid = 0;
      let totalCommissionsAvailable = 0;

      commissions.forEach(c => {
        const a = parseFloat(c.amount) || 0;
        if (c.status === 'pending') totalCommissionsPending += a;
        else if (c.status === 'available') totalCommissionsAvailable += a;
        else if (c.status === 'paid') totalCommissionsPaid += a;
      });

      return res.status(200).json({
        success: true,
        settings: {
          default_commission_rate: commissionRate,
          currency: 'EUR'
        },
        kpis: {
          total_affiliates: totalAffiliates,
          total_referrals: totalReferrals,
          active_referrals: activeReferrals,
          pending_commissions: totalCommissionsPending.toFixed(2),
          available_commissions: totalCommissionsAvailable.toFixed(2),
          paid_commissions: totalCommissionsPaid.toFixed(2),
          total_paid_out: totalCommissionsPaid.toFixed(2)
        },
        affiliates: enrichedAffiliates,
        referrals: referrals,
        commissions: commissions
      });
    }

    // ------------------------------------------------------------------------
    // POST: Aggiorna regole economiche o stati commissioni
    // ------------------------------------------------------------------------
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const action = body.action;

      // 1. Modifica percentuale di commissione globale
      if (action === 'update_commission_rate') {
        const rate = parseFloat(body.rate);
        if (isNaN(rate) || rate < 0 || rate > 100) {
          return res.status(400).json({ error: "Percentuale non valida (deve essere tra 0 e 100)." });
        }

        // Salva su Supabase
        try {
          await supabaseFetch("admin_settings", {
            method: "POST",
            body: JSON.stringify({
              setting_key: "affiliate_commission_rate",
              setting_value: rate.toFixed(2),
              updated_by: "Super Admin",
              updated_at: new Date().toISOString()
            })
          });
        } catch (_) {}

        // Salva in store locale
        store.settings = store.settings || {};
        store.settings.default_rate = rate;
        writeAffiliatesStore(store);

        return res.status(200).json({
          success: true,
          message: `Percentuale di commissione aggiornata a ${rate.toFixed(2)}%.`,
          rate: rate.toFixed(2)
        });
      }

      // 2. Modifica stato di una commissione (In attesa, Disponibile, Pagata, Annullata)
      if (action === 'update_commission_status') {
        const { commissionId, status, notes } = body;
        const validStatuses = ['pending', 'available', 'paid', 'cancelled'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ error: `Stato non valido. Valori ammessi: ${validStatuses.join(', ')}` });
        }

        const nowIso = new Date().toISOString();
        const updatePayload = {
          status,
          updated_at: nowIso
        };
        if (status === 'paid') updatePayload.paid_at = nowIso;
        if (status === 'available') updatePayload.available_at = nowIso;
        if (notes) updatePayload.notes = notes;

        // Aggiorna su Supabase
        try {
          await supabaseFetch(`affiliate_commissions?id=eq.${encodeURIComponent(commissionId)}`, {
            method: 'PATCH',
            body: JSON.stringify(updatePayload)
          });
        } catch (_) {}

        // Aggiorna in store locale
        const comm = store.commissions.find(c => c.id === commissionId);
        if (comm) {
          comm.status = status;
          comm.updated_at = nowIso;
          if (status === 'paid') comm.paid_at = nowIso;
          if (status === 'available') comm.available_at = nowIso;
          if (notes) comm.notes = notes;
          writeAffiliatesStore(store);
        }

        return res.status(200).json({
          success: true,
          message: `Stato della commissione aggiornato a "${status}".`,
          commissionId,
          status
        });
      }

      // 3. Modifica stato affiliato (active, suspended)
      if (action === 'update_affiliate_status') {
        const { affiliateId, status } = body;
        if (!['active', 'suspended'].includes(status)) {
          return res.status(400).json({ error: "Stato non valido. Valori ammessi: active, suspended" });
        }

        try {
          await supabaseFetch(`affiliates?id=eq.${encodeURIComponent(affiliateId)}`, {
            method: 'PATCH',
            body: JSON.stringify({ status, updated_at: new Date().toISOString() })
          });
        } catch (_) {}

        const aff = store.affiliates.find(a => a.id === affiliateId);
        if (aff) {
          aff.status = status;
          aff.updated_at = new Date().toISOString();
          writeAffiliatesStore(store);
        }

        return res.status(200).json({
          success: true,
          message: `Stato dell'affiliato aggiornato a "${status}".`,
          affiliateId,
          status
        });
      }

      return res.status(400).json({ error: "Azione non riconosciuta." });
    }

    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[Admin Affiliates API] Error:', err);
    return res.status(500).json({ error: err.message || "Errore interno server admin affiliazioni." });
  }
}
