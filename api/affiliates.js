// api/affiliates.js - Vercel Serverless Function (Node.js)
// Gestione completa Dashboard Affiliazioni BarPilot:
// 1. Profilo affiliato & generazione codice univoco 6 caratteri alfanumerico (es. AB12CD)
// 2. Calcolo saldo disponibile, commissioni in attesa, totale guadagnato
// 3. Calcolo anzianità abbonamento (anni, mesi, giorni - mai azzerato al rinnovo)
// 4. Conteggio affiliati acquisiti (totali e con abbonamento attivo)
// 5. Storico commissioni con stati (In attesa, Disponibile, Pagata, Annullata)
// Sincronizzato con Supabase Database e cache resiliente in /tmp

import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cprxxxlgaofopmogeuer.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnh4eGxnYW9mb3Btb2dldWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4Mzg1OTQsImV4cCI6MjEwODQxNDU5NH0.wuB9OUgmYo8n1xeJsGl-YpyzVRwg8Sr4k3XAKaYltRI";

const AFFILIATES_FILE = path.join('/tmp', 'barpilot_affiliates_store.json');

// Store locale di fallback per resilienza e continuità operativa
function readAffiliatesStore() {
  try {
    if (fs.existsSync(AFFILIATES_FILE)) {
      const data = fs.readFileSync(AFFILIATES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('[Affiliates Store] Read error:', e.message);
  }
  return { affiliates: [], referrals: [], commissions: [], settings: { default_rate: 20.0 } };
}

function writeAffiliatesStore(data) {
  try {
    fs.writeFileSync(AFFILIATES_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Affiliates Store] Write error:', e.message);
  }
}

// Client helper per Supabase REST
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

// Generatore di codice univoco 6 caratteri alfanumerici maiuscoli (es. AB12CD)
function generateUniqueCode(existingCodes = new Set()) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 100; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (!existingCodes.has(code)) {
      return code;
    }
  }
  return 'BP' + Math.floor(1000 + Math.random() * 9000);
}

// Calcolo dell'anzianità di abbonamento in anni, mesi, giorni
function calculateSubscriptionDuration(startDateString) {
  if (!startDateString) {
    return {
      durationText: "Abbonato recentemente",
      startDate: null,
      days: 0,
      months: 0,
      years: 0
    };
  }

  const start = new Date(startDateString);
  const now = new Date();
  if (isNaN(start.getTime()) || start > now) {
    return {
      durationText: "Abbonato recentemente",
      startDate: start.toISOString(),
      days: 0,
      months: 0,
      years: 0
    };
  }

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthDays;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'anno' : 'anni'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'mese' : 'mesi'}`);
  if (days > 0 || (years === 0 && months === 0)) {
    parts.push(`${days} ${days === 1 ? 'giorno' : 'giorni'}`);
  }

  let durationText = "";
  if (parts.length === 1) {
    durationText = `Abbonato da ${parts[0]}`;
  } else if (parts.length === 2) {
    durationText = `Abbonato da ${parts[0]} e ${parts[1]}`;
  } else {
    durationText = `Abbonato da ${parts[0]}, ${parts[1]} e ${parts[2]}`;
  }

  return {
    durationText,
    startDate: start.toISOString(),
    days,
    months,
    years
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const store = readAffiliatesStore();

    // ------------------------------------------------------------------------
    // GET: Restituisce i dati della dashboard affiliazioni per l'utente loggato
    // ------------------------------------------------------------------------
    if (req.method === 'GET') {
      const email = (req.query.email || '').trim().toLowerCase();
      const userId = (req.query.userId || '').trim();
      const barId = (req.query.barId || '').trim();

      if (!email && !userId && !barId) {
        return res.status(400).json({ error: "Email o UserId obbligatori per visualizzare le affiliazioni." });
      }

      // 1. Trova o crea affiliato
      let affiliate = null;

      // Cerca su Supabase
      if (email) {
        try {
          const affRes = await supabaseFetch(`affiliates?email=eq.${encodeURIComponent(email)}&limit=1`);
          if (affRes.ok) {
            const rows = await affRes.json();
            if (rows && rows.length > 0) affiliate = rows[0];
          }
        } catch (_) {}
      }

      // Cerca in store locale se non trovato
      if (!affiliate) {
        affiliate = store.affiliates.find(a => 
          (email && a.email && a.email.toLowerCase() === email) ||
          (userId && a.user_id === userId) ||
          (barId && a.bar_id === barId)
        );
      }

      // Se non esiste ancora l'affiliato per questo account, crealo con codice univoco persistente
      if (!affiliate) {
        const existingCodes = new Set([
          ...store.affiliates.map(a => a.code),
        ]);
        const newCode = generateUniqueCode(existingCodes);
        const nowIso = new Date().toISOString();

        affiliate = {
          id: 'aff_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
          user_id: userId || null,
          bar_id: barId || null,
          name: req.query.name || (email ? email.split('@')[0] : 'Affiliato'),
          email: email || `${userId || barId}@barpilot.user`,
          code: newCode,
          status: 'active',
          commission_rate: 20.0,
          total_earned: 0.00,
          created_at: nowIso,
          updated_at: nowIso
        };

        // Salva su Supabase
        try {
          await supabaseFetch('affiliates', {
            method: 'POST',
            body: JSON.stringify(affiliate)
          });
        } catch (_) {}

        // Salva nello store locale
        store.affiliates.push(affiliate);
        writeAffiliatesStore(store);
      }

      // 2. Recupera data di inizio del primo abbonamento (mai azzerata ai rinnovi)
      let firstSubscriptionDate = affiliate.created_at;

      // Cerca in auth.users o bars o subscriptions su Supabase
      if (email) {
        try {
          const uRes = await supabaseFetch(`users?email=eq.${encodeURIComponent(email)}&select=created_at&limit=1`);
          if (uRes.ok) {
            const uRows = await uRes.json();
            if (uRows && uRows[0]?.created_at) {
              firstSubscriptionDate = uRows[0].created_at;
            }
          }
        } catch (_) {}
      }

      if (barId || email) {
        try {
          const bRes = await supabaseFetch(barId ? `bars?id=eq.${encodeURIComponent(barId)}&select=created_at,trial_start_date&limit=1` : `bars?email=eq.${encodeURIComponent(email)}&select=created_at,trial_start_date&limit=1`);
          if (bRes.ok) {
            const bRows = await bRes.json();
            if (bRows && bRows[0]) {
              firstSubscriptionDate = bRows[0].trial_start_date || bRows[0].created_at || firstSubscriptionDate;
            }
          }
        } catch (_) {}
      }

      const subscriptionInfo = calculateSubscriptionDuration(firstSubscriptionDate);

      // 3. Recupera i referral associati a questo affiliato
      let referrals = [];
      try {
        const refRes = await supabaseFetch(`affiliate_referrals?affiliate_id=eq.${encodeURIComponent(affiliate.id)}&order=registered_at.desc`);
        if (refRes.ok) {
          referrals = await refRes.json();
        }
      } catch (_) {}

      if (!referrals || referrals.length === 0) {
        referrals = store.referrals.filter(r => r.affiliate_id === affiliate.id || r.affiliate_code === affiliate.code);
      }

      const totalReferrals = referrals.length;
      const activeReferrals = referrals.filter(r => r.status === 'active').length;

      // 4. Recupera le commissioni associate a questo affiliato
      let commissions = [];
      try {
        const commRes = await supabaseFetch(`affiliate_commissions?affiliate_id=eq.${encodeURIComponent(affiliate.id)}&order=created_at.desc`);
        if (commRes.ok) {
          commissions = await commRes.json();
        }
      } catch (_) {}

      if (!commissions || commissions.length === 0) {
        commissions = store.commissions.filter(c => c.affiliate_id === affiliate.id);
      }

      // Calcola saldi reali dalle commissioni (nessun valore fittizio o modificabile dal client)
      let availableBalance = 0;
      let pendingCommissions = 0;
      let totalEarned = 0;

      commissions.forEach(c => {
        const amt = parseFloat(c.amount) || 0;
        if (c.status === 'available') {
          availableBalance += amt;
          totalEarned += amt;
        } else if (c.status === 'pending') {
          pendingCommissions += amt;
          totalEarned += amt;
        } else if (c.status === 'paid') {
          totalEarned += amt;
        }
      });

      // Mappatura tabella storico commissioni (solo info necessarie per privacy)
      const formattedCommissions = commissions.map(c => ({
        id: c.id,
        date: c.created_at || new Date().toISOString(),
        bar_name: c.bar_name || 'Bar Affiliato',
        amount: parseFloat(c.amount || 0).toFixed(2),
        currency: c.currency || 'EUR',
        status: c.status || 'pending', // 'pending' = In attesa, 'available' = Disponibile, 'paid' = Pagata, 'cancelled' = Annullata
        status_label: getStatusLabel(c.status)
      }));

      return res.status(200).json({
        success: true,
        affiliate: {
          id: affiliate.id,
          name: affiliate.name,
          email: affiliate.email,
          code: affiliate.code,
          share_url: `https://www.barpilot.eu/app?ref=${affiliate.code}`,
          status: affiliate.status
        },
        cards: {
          balance: {
            available: availableBalance.toFixed(2),
            pending: pendingCommissions.toFixed(2),
            total_earned: totalEarned.toFixed(2),
            currency: 'EUR'
          },
          code: {
            code: affiliate.code,
            share_url: `https://www.barpilot.eu/app?ref=${affiliate.code}`
          },
          subscription_duration: {
            text: subscriptionInfo.durationText,
            start_date: subscriptionInfo.startDate,
            days: subscriptionInfo.days,
            months: subscriptionInfo.months,
            years: subscriptionInfo.years,
            note: "Il conteggio dell'anzianità non si azzera mai in caso di rinnovo."
          },
          referrals_count: {
            total: totalReferrals,
            active: activeReferrals,
            inactive: Math.max(0, totalReferrals - activeReferrals)
          }
        },
        commissions: formattedCommissions,
        referrals: referrals.map(r => ({
          id: r.id,
          bar_name: r.referred_bar_name || 'Bar Affiliato',
          status: r.status,
          date: r.registered_at || r.created_at
        }))
      });
    }

    // ------------------------------------------------------------------------
    // POST: Verifica o genera codice affiliato
    // ------------------------------------------------------------------------
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const action = body.action || 'verify_code';

      // Azione di verifica codice (durante la registrazione di un nuovo bar)
      if (action === 'verify_code') {
        const code = (body.code || '').trim().toUpperCase();
        if (!code) {
          return res.status(400).json({ valid: false, message: "Codice non inserito." });
        }

        // Cerca su Supabase
        try {
          const affRes = await supabaseFetch(`affiliates?code=eq.${encodeURIComponent(code)}&status=eq.active&limit=1`);
          if (affRes.ok) {
            const rows = await affRes.json();
            if (rows && rows.length > 0) {
              return res.status(200).json({
                valid: true,
                code: rows[0].code,
                affiliate_id: rows[0].id,
                message: "Codice affiliazione valido."
              });
            }
          }
        } catch (_) {}

        // Cerca nello store locale
        const found = store.affiliates.find(a => a.code === code && a.status === 'active');
        if (found) {
          return res.status(200).json({
            valid: true,
            code: found.code,
            affiliate_id: found.id,
            message: "Codice affiliazione valido."
          });
        }

        return res.status(200).json({
          valid: false,
          code,
          message: "Codice affiliazione inesistente o non attivo."
        });
      }

      return res.status(400).json({ error: "Azione non riconosciuta." });
    }

    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[Affiliates API] Error:', err);
    return res.status(500).json({ error: err.message || "Errore interno server affiliazioni." });
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'available': return 'Disponibile';
    case 'paid': return 'Pagata';
    case 'cancelled': return 'Annullata';
    case 'pending':
    default: return 'In attesa';
  }
}
