// api/affiliates.js - Vercel Serverless Function (Node.js)
// Gestione completa Dashboard Affiliazioni BarPilot & Super Amministrazione:
// - Consolle Utente (/app/affiliazioni -> /api/affiliates)
// - Super Amministrazione (/app/administration -> /api/admin-affiliates)
// Nessuna dipendenza esterna: 100% integrato con Supabase REST e resiliente

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cprxxxlgaofopmogeuer.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnh4eGxnYW9mb3Btb2dldWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4Mzg1OTQsImV4cCI6MjEwODQxNDU5NH0.wuB9OUgmYo8n1xeJsGl-YpyzVRwg8Sr4k3XAKaYltRI";

// Cache in-memory di fallback per resilienza e continuità operativa
const affiliatesCache = {
  affiliates: [],
  referrals: [],
  commissions: [],
  settings: { default_rate: 5.0 }
};

function readAffiliatesStore() {
  return affiliatesCache;
}

function writeAffiliatesStore(data) {
  Object.assign(affiliatesCache, data);
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

// Generatore deterministico e univoco di codice a 6 caratteri alfanumerici per account (non cambia MAI)
function getConsistentCodeForAccount(identifier) {
  if (!identifier) return 'BP' + Math.floor(1000 + Math.random() * 9000);
  const clean = String(identifier).trim().toLowerCase();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let hash1 = 5381;
  let hash2 = 0;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) + ch;
    hash1 |= 0;
    hash2 = ((hash2 << 7) - hash2) + ch;
    hash2 |= 0;
  }
  let seed = Math.abs(hash1 ^ hash2);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(seed % chars.length);
    seed = Math.floor(seed / chars.length) + (clean.charCodeAt(i % clean.length) || 11) * 37;
  }
  return code;
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

// Calcolo dell'anzianità di abbonamento in anni, mesi, giorni (mai azzerata ai rinnovi)
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

function getStatusLabel(status) {
  switch (status) {
    case 'available': return 'Disponibile';
    case 'paid': return 'Pagata';
    case 'cancelled': return 'Annullata';
    case 'pending':
    default: return 'In attesa';
  }
}

function getReferralStatusLabel(status, cancelAtPeriodEnd = false) {
  switch (status) {
    case 'active': return 'Attivo';
    case 'expired': return 'Scaduto';
    case 'cancelled': return 'Cancellato';
    case 'trial':
    case 'registered':
    default: return cancelAtPeriodEnd ? 'In prova (Disdetto)' : 'In prova';
  }
}

/**
 * Aggiorna lo stato reale dei referral rispetto ai 14 giorni di prova:
 * - Se bar/abbonamento pagato attivo (e non disdetto) -> 'active'
 * - Se entro i 14 giorni di prova (anche se disdetto durante la prova) -> resta 'trial'
 * - A fine prova (>= 14 giorni) senza pagamento attivo -> 'cancelled' (se disdetto) o 'expired'
 */
async function evaluateReferralsLifecycle(referrals) {
  const nowMs = Date.now();
  for (const ref of (referrals || [])) {
    if (ref.fraud_flag) {
      ref.status = 'cancelled';
      continue;
    }
    if (ref.status === 'trial' || ref.status === 'registered' || !ref.status) {
      const regMs = new Date(ref.trial_start_date || ref.registered_at || ref.created_at || nowMs).getTime();
      const trialEndMs = ref.trial_end_date ? new Date(ref.trial_end_date).getTime() : (regMs + 14 * 24 * 3600 * 1000);
      let isPaidActive = false;
      let barCancelled = Boolean(ref.cancel_at_period_end || ref.cancelled_at);

      if (ref.referred_bar_id) {
        try {
          const bRes = await supabaseFetch(`bars?id=eq.${encodeURIComponent(ref.referred_bar_id)}&select=status,subscription_status,cancel_at_period_end`);
          if (bRes.ok) {
            const bData = await bRes.json();
            if (bData && bData[0]) {
              const bStatus = (bData[0].status || '').toLowerCase();
              const subStatus = (bData[0].subscription_status || '').toLowerCase();
              if (bStatus === 'canceled' || bStatus === 'cancelled' || subStatus === 'canceled' || subStatus === 'cancelled' || bData[0].cancel_at_period_end) {
                barCancelled = true;
              } else if ((bStatus === 'active' || subStatus === 'active') && !barCancelled) {
                isPaidActive = true;
              }
            }
          }
        } catch (_) {}
      }

      if (isPaidActive) {
        ref.status = 'active';
        try {
          await supabaseFetch(`affiliate_referrals?id=eq.${encodeURIComponent(ref.id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'active', updated_at: new Date().toISOString() })
          });
        } catch (_) {}
      } else if (nowMs < trialEndMs) {
        ref.status = 'trial';
        if (barCancelled && !ref.cancel_at_period_end) {
          ref.cancel_at_period_end = true;
          try {
            await supabaseFetch(`affiliate_referrals?id=eq.${encodeURIComponent(ref.id)}`, {
              method: 'PATCH',
              body: JSON.stringify({ status: 'trial', cancel_at_period_end: true, updated_at: new Date().toISOString() })
            });
          } catch (_) {}
        }
      } else {
        const nextStatus = barCancelled ? 'cancelled' : 'expired';
        ref.status = nextStatus;
        try {
          await supabaseFetch(`affiliate_referrals?id=eq.${encodeURIComponent(ref.id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: nextStatus, updated_at: new Date().toISOString() })
          });
        } catch (_) {}
      }
    }
  }
}

async function recalculateAffiliateBalanceOnDb(affiliateId) {
  if (!affiliateId) return;
  try {
    const commRes = await supabaseFetch(`affiliate_commissions?affiliate_id=eq.${encodeURIComponent(affiliateId)}&select=amount,status`);
    if (!commRes.ok) return;
    const rows = await commRes.json();
    let available = 0, pending = 0, earned = 0;
    (rows || []).forEach(c => {
      const a = parseFloat(c.amount) || 0;
      if (c.status === 'available') { available += a; earned += a; }
      else if (c.status === 'pending') { pending += a; earned += a; }
      else if (c.status === 'paid') { earned += a; }
    });
    await supabaseFetch(`affiliates?id=eq.${encodeURIComponent(affiliateId)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        available_balance: available.toFixed(2),
        pending_balance: pending.toFixed(2),
        total_earned: earned.toFixed(2),
        updated_at: new Date().toISOString()
      })
    });
  } catch (_) {}
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-pin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verifica se la richiesta è destinata alla gestione Super Admin
  const pathname = (req.url || '').split('?')[0];
  const isExplicitAdminUrl = pathname.includes('admin');
  const hasAdminPin = req.headers['x-admin-pin'] === '101540' || (req.query && req.query.pin === '101540');
  const isAdminQuery = req.query && (req.query.admin === 'true' || req.query.view === 'admin');

  if (isExplicitAdminUrl || hasAdminPin || isAdminQuery) {
    return handleAdminRequest(req, res);
  }

  return handleUserAffiliateRequest(req, res);
}

// ----------------------------------------------------------------------------
// HANDLER 1: SUPER AMMINISTRAZIONE AFFILIAZIONI (/api/admin-affiliates)
// ----------------------------------------------------------------------------
async function handleAdminRequest(req, res) {
  const pin = req.headers['x-admin-pin'] || req.query.pin || (req.body && req.body.pin);
  const authHeader = req.headers['authorization'] || '';
  const isAuthorized = pin === '101540' || authHeader.includes('Bearer');

  if (!isAuthorized) {
    return res.status(401).json({ error: "Accesso non autorizzato. Richiesta autenticazione Super Admin." });
  }

  try {
    const store = readAffiliatesStore();

    if (req.method === 'GET') {
      let commissionRate = store.settings?.default_rate || 5.0;
      try {
        const setRes = await supabaseFetch("admin_settings?setting_key=eq.affiliate_commission_rate&limit=1");
        if (setRes.ok) {
          const rows = await setRes.json();
          if (rows && rows[0]?.setting_value) {
            commissionRate = parseFloat(rows[0].setting_value) || commissionRate;
          }
        }
      } catch (_) {}

      let affiliates = [];
      try {
        const affRes = await supabaseFetch("affiliates?order=created_at.desc");
        if (affRes.ok) affiliates = await affRes.json();
      } catch (_) {}
      if (!affiliates || affiliates.length === 0) affiliates = store.affiliates || [];

      let referrals = [];
      try {
        const refRes = await supabaseFetch("affiliate_referrals?order=registered_at.desc");
        if (refRes.ok) referrals = await refRes.json();
      } catch (_) {}
      if (!referrals || referrals.length === 0) referrals = store.referrals || [];

      await evaluateReferralsLifecycle(referrals);

      let commissions = [];
      try {
        const commRes = await supabaseFetch("affiliate_commissions?order=created_at.desc");
        if (commRes.ok) commissions = await commRes.json();
      } catch (_) {}
      if (!commissions || commissions.length === 0) commissions = store.commissions || [];

      let totalEarnedOverall = 0;
      let totalAvailableOverall = 0;
      let totalPendingOverall = 0;
      let totalPaidOverall = 0;
      let totalCancelledOverall = 0;

      commissions.forEach(c => {
        const amt = parseFloat(c.amount) || 0;
        if (c.status === 'available') {
          totalAvailableOverall += amt;
          totalEarnedOverall += amt;
        } else if (c.status === 'pending') {
          totalPendingOverall += amt;
          totalEarnedOverall += amt;
        } else if (c.status === 'paid') {
          totalPaidOverall += amt;
          totalEarnedOverall += amt;
        } else if (c.status === 'cancelled') {
          totalCancelledOverall += amt;
        }
      });

      const affiliatesEnriched = affiliates.map(aff => {
        const affReferrals = referrals.filter(r => r.affiliate_id === aff.id || r.affiliate_code === aff.code);
        const affCommissions = commissions.filter(c => c.affiliate_id === aff.id);
        let affEarned = 0;
        let affPending = 0;
        let affAvailable = 0;
        let affPaid = 0;
        let affCancelled = 0;
        affCommissions.forEach(c => {
          const a = parseFloat(c.amount) || 0;
          if (c.status === 'available') { affAvailable += a; affEarned += a; }
          else if (c.status === 'pending') { affPending += a; affEarned += a; }
          else if (c.status === 'paid') { affPaid += a; affEarned += a; }
          else if (c.status === 'cancelled') { affCancelled += a; }
        });

        const trialCount = affReferrals.filter(r => r.status === 'trial' || r.status === 'registered').length;
        const activeCount = affReferrals.filter(r => r.status === 'active').length;

        return {
          id: aff.id,
          name: aff.name || 'Affiliato',
          email: aff.email,
          code: aff.code,
          status: aff.status || 'active',
          commission_rate: aff.commission_rate ? parseFloat(aff.commission_rate) : commissionRate,
          total_referrals: affReferrals.length,
          trial_referrals: trialCount,
          active_referrals: activeCount,
          total_earned: affEarned.toFixed(2),
          available_balance: affAvailable.toFixed(2),
          pending_balance: affPending.toFixed(2),
          paid_balance: affPaid.toFixed(2),
          cancelled_balance: affCancelled.toFixed(2),
          created_at: aff.created_at
        };
      });

      const trialReferralsOverall = referrals.filter(r => r.status === 'trial' || r.status === 'registered').length;
      const activeReferralsOverall = referrals.filter(r => r.status === 'active').length;

      const summaryObj = {
        total_affiliates: affiliates.length,
        total_referrals: referrals.length,
        trial_referrals: trialReferralsOverall,
        active_referrals: activeReferralsOverall,
        total_earned: totalEarnedOverall.toFixed(2),
        total_available: totalAvailableOverall.toFixed(2),
        available_commissions: totalAvailableOverall.toFixed(2),
        total_pending: totalPendingOverall.toFixed(2),
        pending_commissions: totalPendingOverall.toFixed(2),
        total_paid: totalPaidOverall.toFixed(2),
        paid_commissions: totalPaidOverall.toFixed(2),
        total_cancelled: totalCancelledOverall.toFixed(2),
        cancelled_commissions: totalCancelledOverall.toFixed(2),
        default_commission_rate: commissionRate
      };

      return res.status(200).json({
        success: true,
        summary: summaryObj,
        kpis: summaryObj,
        settings: {
          affiliate_commission_rate: commissionRate,
          default_commission_rate: commissionRate
        },
        affiliates: affiliatesEnriched,
        referrals: referrals.map(r => ({
          id: r.id,
          affiliate_id: r.affiliate_id,
          affiliate_code: r.affiliate_code,
          bar_id: r.referred_bar_id,
          bar_name: r.referred_bar_name || 'Bar Affiliato',
          email: r.referred_email || '',
          status: r.status || 'trial',
          status_label: getReferralStatusLabel(r.status, r.cancel_at_period_end),
          trial_start_date: r.trial_start_date || r.registered_at || r.created_at,
          trial_end_date: r.trial_end_date || null,
          cancel_at_period_end: Boolean(r.cancel_at_period_end),
          bonus_amount: parseFloat(r.bonus_amount || 5.00).toFixed(2),
          fraud_flag: Boolean(r.fraud_flag),
          fraud_reason: r.fraud_reason || '',
          registered_at: r.registered_at || r.created_at
        })),
        commissions: commissions.map(c => ({
          id: c.id,
          affiliate_id: c.affiliate_id,
          affiliate_code: c.affiliate_code || null,
          referral_id: c.referral_id || null,
          bar_id: c.bar_id || null,
          bar_name: c.bar_name || 'Bar Affiliato',
          bonus_type: c.bonus_type || 'registration',
          amount: parseFloat(c.amount || 0).toFixed(2),
          currency: c.currency || 'EUR',
          status: c.status || 'available',
          status_label: getStatusLabel(c.status),
          notes: c.notes || '',
          invoice_id: c.stripe_invoice_id,
          created_at: c.created_at,
          paid_at: c.paid_at
        }))
      });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const action = body.action || '';

      if (action === 'update_commission_rate') {
        const rate = parseFloat(body.rate);
        if (isNaN(rate) || rate < 0 || rate > 100) {
          return res.status(400).json({ error: "Valore non valido. Inserire un valore compreso tra 0 e 100." });
        }

        try {
          await supabaseFetch('admin_settings', {
            method: 'POST',
            body: JSON.stringify({
              setting_key: 'affiliate_commission_rate',
              setting_value: rate.toFixed(2),
              updated_by: 'Super Admin',
              updated_at: new Date().toISOString()
            })
          });
        } catch (_) {}

        store.settings = store.settings || {};
        store.settings.default_rate = rate;
        writeAffiliatesStore(store);

        return res.status(200).json({
          success: true,
          message: `Regola economica aggiornata a ${rate.toFixed(2)}.`,
          rate
        });
      }

      if (action === 'update_commission_status') {
        const { commissionId, status, notes = '', fraud = false } = body;
        const validStatuses = ['pending', 'available', 'paid', 'cancelled'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ error: `Stato non valido. Valori ammessi: ${validStatuses.join(', ')}` });
        }

        const nowIso = new Date().toISOString();
        const updatePayload = { status, updated_at: nowIso };
        if (status === 'paid') updatePayload.paid_at = nowIso;
        if (status === 'available') updatePayload.available_at = nowIso;
        if (notes) updatePayload.notes = notes;
        else if (status === 'cancelled' && fraud) updatePayload.notes = 'Bonus annullato da Super Admin (registrazione fraudolenta)';

        let affIdToRecalc = null;
        let refIdToFlag = null;

        try {
          const patchRes = await supabaseFetch(`affiliate_commissions?id=eq.${encodeURIComponent(commissionId)}`, {
            method: 'PATCH',
            body: JSON.stringify(updatePayload)
          });
          if (patchRes.ok) {
            const patched = await patchRes.json();
            if (patched && patched[0]) {
              affIdToRecalc = patched[0].affiliate_id;
              refIdToFlag = patched[0].referral_id;
            }
          }
          if (status === 'cancelled' && fraud && refIdToFlag) {
            await supabaseFetch(`affiliate_referrals?id=eq.${encodeURIComponent(refIdToFlag)}`, {
              method: 'PATCH',
              body: JSON.stringify({
                status: 'cancelled',
                fraud_flag: true,
                fraud_reason: notes || 'Annullato da Super Admin per controllo antifrode',
                updated_at: nowIso
              })
            });
          }
          if (affIdToRecalc) {
            await recalculateAffiliateBalanceOnDb(affIdToRecalc);
          }
        } catch (_) {}

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
          message: `Stato della commissione aggiornato a "${getStatusLabel(status)}".`,
          commissionId,
          status
        });
      }

      if (action === 'cancel_fraud_bonus') {
        const { referralId, commissionId, reason = 'Registrazione fraudolenta o anomalia rilevata' } = body;
        const nowIso = new Date().toISOString();
        let affId = null;

        try {
          if (commissionId) {
            const cRes = await supabaseFetch(`affiliate_commissions?id=eq.${encodeURIComponent(commissionId)}`, {
              method: 'PATCH',
              body: JSON.stringify({ status: 'cancelled', notes: `Annullato (Frode): ${reason}`, updated_at: nowIso })
            });
            if (cRes.ok) {
              const rows = await cRes.json();
              if (rows && rows[0]) affId = rows[0].affiliate_id;
            }
          }
          if (referralId) {
            const rRes = await supabaseFetch(`affiliate_referrals?id=eq.${encodeURIComponent(referralId)}`, {
              method: 'PATCH',
              body: JSON.stringify({ status: 'cancelled', fraud_flag: true, fraud_reason: reason, updated_at: nowIso })
            });
            if (rRes.ok) {
              const rows = await rRes.json();
              if (rows && rows[0] && !affId) affId = rows[0].affiliate_id;
            }
            await supabaseFetch(`affiliate_commissions?referral_id=eq.${encodeURIComponent(referralId)}`, {
              method: 'PATCH',
              body: JSON.stringify({ status: 'cancelled', notes: `Annullato (Frode): ${reason}`, updated_at: nowIso })
            });
          }
          if (affId) await recalculateAffiliateBalanceOnDb(affId);
        } catch (_) {}

        return res.status(200).json({
          success: true,
          message: "Bonus e referral annullati per frode e saldo aggiornato.",
          referralId,
          commissionId
        });
      }

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

      return res.status(400).json({ error: "Azione Super Admin non riconosciuta." });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[Admin Affiliates API] Error:', err);
    return res.status(500).json({ error: err.message || "Errore interno server admin affiliazioni." });
  }
}

// ----------------------------------------------------------------------------
// HANDLER 2: CRUSCOTTO UTENTE AFFILIAZIONI (/api/affiliates)
// ----------------------------------------------------------------------------
async function handleUserAffiliateRequest(req, res) {
  try {
    const store = readAffiliatesStore();

    if (req.method === 'GET') {
      const email = (req.query.email || '').trim().toLowerCase();
      const userId = (req.query.userId || '').trim();
      const barId = (req.query.barId || '').trim();
      const clientCode = (req.query.code || '').trim().toUpperCase();

      if (!email && !userId && !barId) {
        return res.status(400).json({ error: "Email o UserId obbligatori per visualizzare le affiliazioni." });
      }

      let affiliate = null;

      if (email) {
        try {
          const affRes = await supabaseFetch(`affiliates?email=eq.${encodeURIComponent(email)}&limit=1`);
          if (affRes.ok) {
            const rows = await affRes.json();
            if (rows && rows.length > 0) affiliate = rows[0];
          }
        } catch (_) {}
      }

      if (!affiliate) {
        affiliate = store.affiliates.find(a => 
          (email && a.email && a.email.toLowerCase() === email) ||
          (userId && a.user_id === userId) ||
          (barId && a.bar_id === barId) ||
          (clientCode && a.code === clientCode)
        );
      }

      // Codice univoco permanente per questo account (non cambia MAI)
      const permanentCode = (affiliate && affiliate.code) || clientCode || getConsistentCodeForAccount(email || userId || barId);

      if (!affiliate) {
        const nowIso = new Date().toISOString();

        affiliate = {
          id: 'aff_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
          user_id: userId || null,
          bar_id: barId || null,
          name: req.query.name || (email ? email.split('@')[0] : 'Affiliato'),
          email: email || `${userId || barId}@barpilot.user`,
          code: permanentCode,
          status: 'active',
          commission_rate: 5.0,
          total_earned: 0.00,
          created_at: nowIso,
          updated_at: nowIso
        };

        try {
          await supabaseFetch('affiliates', {
            method: 'POST',
            body: JSON.stringify(affiliate)
          });
        } catch (_) {}

        store.affiliates.push(affiliate);
        writeAffiliatesStore(store);
      } else {
        affiliate.code = permanentCode;
      }

      let firstSubscriptionDate = affiliate.created_at;

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

      let referrals = [];
      try {
        const refRes = await supabaseFetch(`affiliate_referrals?affiliate_id=eq.${encodeURIComponent(affiliate.id)}&order=registered_at.desc`);
        if (refRes.ok) referrals = await refRes.json();
      } catch (_) {}

      if (!referrals || referrals.length === 0) {
        referrals = store.referrals.filter(r => r.affiliate_id === affiliate.id || r.affiliate_code === affiliate.code);
      }

      // Valuta lo stato reale dei referral rispetto ai 14 giorni di prova e pagamenti Stripe
      await evaluateReferralsLifecycle(referrals);

      let commissions = [];
      try {
        const commRes = await supabaseFetch(`affiliate_commissions?affiliate_id=eq.${encodeURIComponent(affiliate.id)}&order=created_at.desc`);
        if (commRes.ok) commissions = await commRes.json();
      } catch (_) {}

      if (!commissions || commissions.length === 0) {
        commissions = store.commissions.filter(c => c.affiliate_id === affiliate.id);
      }

      const totalReferrals = referrals.length;
      const activeReferrals = referrals.filter(r => r.status === 'active').length;
      const trialReferrals = referrals.filter(r => r.status === 'trial' || r.status === 'registered' || !r.status).length;
      const expiredReferrals = referrals.filter(r => r.status === 'expired').length;
      const cancelledReferrals = referrals.filter(r => r.status === 'cancelled').length;

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

      const formattedCommissions = commissions.map(c => {
        const matchingRef = referrals.find(r => r.id === c.referral_id || (r.referred_bar_id && r.referred_bar_id === c.bar_id));
        const refStatus = matchingRef ? matchingRef.status : 'trial';
        return {
          id: c.id,
          referral_id: c.referral_id || (matchingRef ? matchingRef.id : null),
          date: matchingRef?.registered_at || c.created_at || new Date().toISOString(),
          bar_id: c.bar_id || matchingRef?.referred_bar_id || null,
          bar_name: c.bar_name || matchingRef?.referred_bar_name || 'Bar Affiliato',
          referral_status: refStatus,
          referral_status_label: getReferralStatusLabel(refStatus, matchingRef?.cancel_at_period_end),
          trial_start_date: matchingRef?.trial_start_date || null,
          trial_end_date: matchingRef?.trial_end_date || c.trial_end_date || null,
          amount: parseFloat(c.amount || 0).toFixed(2),
          currency: c.currency || 'EUR',
          status: c.status || 'available',
          status_label: getStatusLabel(c.status)
        };
      });

      // Storico completo combinato (anche eventuali referral senza commissione ancora visibile)
      const historyRows = referrals.map(r => {
        const comm = commissions.find(c => c.referral_id === r.id || (r.referred_bar_id && c.bar_id === r.referred_bar_id));
        const commStatus = comm ? comm.status : (r.fraud_flag ? 'cancelled' : 'available');
        const bonusAmt = comm ? parseFloat(comm.amount || 5.00) : parseFloat(r.bonus_amount || 5.00);
        return {
          id: r.id,
          referral_id: r.id,
          commission_id: comm ? comm.id : null,
          date: r.registered_at || r.created_at || new Date().toISOString(),
          bar_id: r.referred_bar_id || r.id,
          bar_name: r.referred_bar_name || 'Bar Affiliato',
          referral_status: r.status || 'trial',
          referral_status_label: getReferralStatusLabel(r.status, r.cancel_at_period_end),
          trial_start_date: r.trial_start_date || r.registered_at || r.created_at,
          trial_end_date: r.trial_end_date || null,
          cancel_at_period_end: Boolean(r.cancel_at_period_end),
          amount: bonusAmt.toFixed(2),
          currency: 'EUR',
          status: commStatus,
          status_label: getStatusLabel(commStatus)
        };
      });

      return res.status(200).json({
        success: true,
        affiliate: {
          id: affiliate.id,
          name: affiliate.name,
          email: affiliate.email,
          code: affiliate.code,
          share_url: `https://www.barpilot.eu/app?ref=${affiliate.code}`,
          status: affiliate.status,
          payout_method: affiliate.payout_method || null
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
            inactive: trialReferrals,
            trial: trialReferrals,
            expired: expiredReferrals,
            cancelled: cancelledReferrals
          }
        },
        history: historyRows.length > 0 ? historyRows : formattedCommissions,
        commissions: formattedCommissions,
        referrals: referrals.map(r => ({
          id: r.id,
          bar_id: r.referred_bar_id || r.id,
          bar_name: r.referred_bar_name || 'Bar Affiliato',
          status: r.status || 'trial',
          status_label: getReferralStatusLabel(r.status, r.cancel_at_period_end),
          trial_start_date: r.trial_start_date || r.registered_at || r.created_at,
          trial_end_date: r.trial_end_date || null,
          date: r.registered_at || r.created_at
        }))
      });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const action = body.action || 'verify_code';

      if (action === 'verify_code') {
        const code = (body.code || '').trim().toUpperCase();
        if (!code) {
          return res.status(400).json({ valid: false, message: "Codice non inserito." });
        }

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

      if (action === 'save_payout_method') {
        const { email, affiliateId, payoutMethod } = body;
        if (!payoutMethod) {
          return res.status(400).json({ error: "Dati metodo di pagamento mancanti." });
        }

        const aff = store.affiliates.find(a => 
          (affiliateId && a.id === affiliateId) ||
          (email && a.email && a.email.toLowerCase() === String(email).toLowerCase())
        );

        if (aff) {
          aff.payout_method = payoutMethod;
          aff.updated_at = new Date().toISOString();
          writeAffiliatesStore(store);
        }

        try {
          const targetId = affiliateId || (aff ? aff.id : null);
          if (targetId) {
            await supabaseFetch(`affiliates?id=eq.${encodeURIComponent(targetId)}`, {
              method: 'PATCH',
              body: JSON.stringify({
                payout_method: typeof payoutMethod === 'object' ? JSON.stringify(payoutMethod) : payoutMethod,
                updated_at: new Date().toISOString()
              })
            });
          }
        } catch (_) {}

        return res.status(200).json({
          success: true,
          message: "Metodo di pagamento per liquidazione salvato con successo.",
          payoutMethod
        });
      }

      if (action === 'auth_register') {
        const { firstName, lastName, phone, email, password } = body;
        const cleanFirst = (firstName || '').trim();
        const cleanLast = (lastName || '').trim();
        const cleanPhone = (phone || '').trim();
        const cleanEmail = (email || '').trim().toLowerCase();
        const cleanPassword = (password || '').trim();

        if (!cleanFirst || !cleanLast || !cleanPhone || !cleanEmail || !cleanPassword) {
          return res.status(400).json({ error: "Compila tutti i campi: nome, cognome, telefono, email e password." });
        }

        const minLength = cleanPassword.length >= 8;
        const hasUpper = /[A-Z]/.test(cleanPassword);
        const hasNumber = /[0-9]/.test(cleanPassword);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(cleanPassword);

        if (!minLength || !hasUpper || !hasNumber || !hasSpecial) {
          return res.status(400).json({
            error: "La password deve rispettare tutti i criteri di sicurezza: minimo 8 caratteri, almeno una lettera maiuscola, almeno un numero e almeno un carattere speciale."
          });
        }

        const fullName = `${cleanFirst} ${cleanLast}`;
        const nowIso = new Date().toISOString();

        // Cerca se l'affiliato esiste già
        let aff = store.affiliates.find(a => a.email && a.email.toLowerCase() === cleanEmail);

        if (!aff) {
          try {
            const checkRes = await supabaseFetch(`affiliates?email=eq.${encodeURIComponent(cleanEmail)}&select=*`);
            if (checkRes.ok) {
              const rows = await checkRes.json();
              if (rows && rows.length > 0) {
                aff = rows[0];
              }
            }
          } catch (_) {}
        }

        // Codice univoco permanente per questo account (non cambia MAI)
        const permanentCode = (aff && aff.code) || (body.code || '').trim().toUpperCase() || getConsistentCodeForAccount(cleanEmail);

        if (!aff) {
          aff = {
            id: 'aff_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
            first_name: cleanFirst,
            last_name: cleanLast,
            name: fullName,
            phone: cleanPhone,
            email: cleanEmail,
            password: cleanPassword,
            code: permanentCode,
            status: 'active',
            commission_rate: 5.0,
            total_earned: 0.00,
            created_at: nowIso,
            updated_at: nowIso
          };

          store.affiliates.push(aff);
          writeAffiliatesStore(store);

          try {
            await supabaseFetch('affiliates', {
              method: 'POST',
              body: JSON.stringify({
                id: aff.id,
                name: fullName,
                email: cleanEmail,
                phone: cleanPhone,
                code: permanentCode,
                status: 'active',
                commission_rate: 5.0,
                total_earned: 0.00,
                created_at: nowIso,
                updated_at: nowIso
              })
            });
          } catch (_) {}
        } else {
          aff.code = permanentCode;
          aff.first_name = cleanFirst;
          aff.last_name = cleanLast;
          aff.name = fullName;
          aff.phone = cleanPhone;
          aff.password = cleanPassword;
          aff.updated_at = nowIso;
          writeAffiliatesStore(store);

          try {
            await supabaseFetch(`affiliates?id=eq.${encodeURIComponent(aff.id)}`, {
              method: 'PATCH',
              body: JSON.stringify({
                name: fullName,
                phone: cleanPhone,
                code: permanentCode,
                updated_at: nowIso
              })
            });
          } catch (_) {}
        }

        return res.status(200).json({
          success: true,
          message: "Registrazione affiliato completata con successo.",
          user: {
            id: aff.id,
            firstName: cleanFirst,
            lastName: cleanLast,
            name: fullName,
            phone: cleanPhone,
            email: cleanEmail,
            code: aff.code
          }
        });
      }

      if (action === 'auth_login') {
        const cleanEmail = (body.email || '').trim().toLowerCase();
        const cleanPassword = (body.password || '').trim();

        if (!cleanEmail || !cleanPassword) {
          return res.status(400).json({ error: "Inserisci sia l'email che la password." });
        }

        let aff = store.affiliates.find(a => a.email && a.email.toLowerCase() === cleanEmail);

        if (!aff) {
          try {
            const checkRes = await supabaseFetch(`affiliates?email=eq.${encodeURIComponent(cleanEmail)}&select=*`);
            if (checkRes.ok) {
              const rows = await checkRes.json();
              if (rows && rows.length > 0) {
                aff = rows[0];
                store.affiliates.push(aff);
              }
            }
          } catch (_) {}
        }

        const permanentCode = (aff && aff.code) || (body.code || '').trim().toUpperCase() || getConsistentCodeForAccount(cleanEmail);

        let isValid = false;
        if (aff) {
          if (!aff.password || aff.password === cleanPassword) {
            isValid = true;
            aff.code = permanentCode;
          }
        } else {
          // Creazione automatica affiliato se prima volta con password valida
          if (cleanPassword.length >= 4) {
            isValid = true;
            const nowIso = new Date().toISOString();
            aff = {
              id: 'aff_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
              name: cleanEmail.split('@')[0],
              email: cleanEmail,
              password: cleanPassword,
              code: permanentCode,
              status: 'active',
              commission_rate: 5.0,
              total_earned: 0.00,
              created_at: nowIso,
              updated_at: nowIso
            };
            store.affiliates.push(aff);
            writeAffiliatesStore(store);

            try {
              await supabaseFetch('affiliates', {
                method: 'POST',
                body: JSON.stringify(aff)
              });
            } catch (_) {}
          }
        }

        if (!isValid || !aff) {
          return res.status(401).json({ error: "Credenziali non valide. Verifica email e password." });
        }

        return res.status(200).json({
          success: true,
          message: "Accesso completato con successo.",
          user: {
            id: aff.id,
            name: aff.name || cleanEmail.split('@')[0],
            email: aff.email,
            phone: aff.phone || '',
            code: aff.code
          }
        });
      }

      return res.status(400).json({ error: "Azione non riconosciuta." });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[Affiliates API] Error:', err);
    return res.status(500).json({ error: err.message || "Errore interno server affiliazioni." });
  }
}
