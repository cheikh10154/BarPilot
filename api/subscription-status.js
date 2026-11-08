// api/subscription-status.js - Vercel Serverless Function (Node.js)
// Verifica lato server dello stato abbonamento e prova gratuita da Supabase & Stripe

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cprxxxlgaofopmogeuer.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnh4eGxnYW9mb3Btb2dldWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4Mzg1OTQsImV4cCI6MjEwODQxNDU5NH0.wuB9OUgmYo8n1xeJsGl-YpyzVRwg8Sr4k3XAKaYltRI";

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let email = null;
    let barId = null;

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      email = body.email;
      barId = body.barId;
    } else {
      email = req.query.email;
      barId = req.query.barId;
    }

    const now = Date.now();
    let userCreatedAt = null;
    let trialDaysRemaining = 0;
    let isTrialActive = false;

    // 1. Recupera la data di iscrizione originaria da Supabase Authentication > Users
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      try {
        const uRes = await supabaseFetch(`users?email=eq.${encodeURIComponent(normalizedEmail)}&select=created_at`);
        if (uRes.ok) {
          const uRows = await uRes.json();
          if (uRows && uRows.length > 0 && uRows[0].created_at) {
            userCreatedAt = uRows[0].created_at;
          }
        }
      } catch (_) {}
    }

    // Se non trovato in users, cerca in bars per created_at
    if (!userCreatedAt && (barId || email)) {
      let bQuery = barId ? `bars?id=eq.${encodeURIComponent(barId)}&select=created_at,trial_start_date` : `bars?email=eq.${encodeURIComponent(email)}&select=created_at,trial_start_date`;
      try {
        const bRes = await supabaseFetch(bQuery);
        if (bRes.ok) {
          const bRows = await bRes.json();
          if (bRows && bRows.length > 0) {
            userCreatedAt = bRows[0].trial_start_date || bRows[0].created_at;
          }
        }
      } catch (_) {}
    }

    // 2. Calcolo esatto dei 14 giorni di prova gratuiti (non ricomincia mai dopo una nuova sottoscrizione)
    if (userCreatedAt) {
      const regTime = new Date(userCreatedAt).getTime();
      const elapsedDays = Math.floor(Math.max(0, now - regTime) / (1000 * 60 * 60 * 24));
      trialDaysRemaining = Math.max(0, 14 - elapsedDays);
      isTrialActive = trialDaysRemaining > 0;
    }

    // 3. Controllo sottoscrizione a pagamento su Supabase (public.subscriptions)
    let sub = null;
    let query = 'subscriptions?order=created_at.desc&limit=1';
    if (barId) {
      query = `subscriptions?bar_id=eq.${encodeURIComponent(barId)}&order=created_at.desc&limit=1`;
    }

    try {
      const subRes = await supabaseFetch(query);
      if (subRes.ok) {
        const rows = await subRes.json();
        if (rows && rows.length > 0) {
          sub = rows[0];
        }
      }
    } catch (_) {}

    let isPaidPeriodActive = false;
    let cancelAtPeriodEnd = false;
    let currentPeriodEnd = null;
    let subStatus = 'trialing';

    if (sub) {
      cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
      currentPeriodEnd = sub.current_period_end || null;

      if (currentPeriodEnd) {
        const periodEndTime = new Date(currentPeriodEnd).getTime();
        isPaidPeriodActive = (sub.status === 'active' || sub.status === 'trialing') && (periodEndTime > now);
      } else if (sub.status === 'active' && !cancelAtPeriodEnd) {
        isPaidPeriodActive = true;
      }

      subStatus = sub.status;
    }

    // 4. Regola: Quando un utente disdice l'abbonamento (cancelAtPeriodEnd o status === 'canceled'),
    // tutto il sito gli viene bloccato (isAccessActive = false), e può accedere solo al menu Abbonamenti
    let isAccessActive = false;
    if (cancelAtPeriodEnd || subStatus === 'canceled') {
      isAccessActive = false;
      subStatus = 'canceled';
    } else if (isTrialActive) {
      isAccessActive = true;
      subStatus = 'trialing';
    } else if (isPaidPeriodActive) {
      isAccessActive = true;
      subStatus = 'active';
    } else {
      isAccessActive = false;
      subStatus = 'canceled';
    }

    return res.status(200).json({
      isAccessActive,
      status: subStatus,
      trialDaysRemaining,
      isTrialActive,
      cancelAtPeriodEnd,
      currentPeriodEnd,
      userCreatedAt
    });

  } catch (err) {
    console.error('[Subscription Status Error]', err);
    return res.status(500).json({ error: err.message || 'Errore verifica stato abbonamento' });
  }
}
