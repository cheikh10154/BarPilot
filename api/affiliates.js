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
  withdrawals: [],
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

function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || (SUPABASE_KEY.includes('service_role') ? SUPABASE_KEY : null);
}

const MEDIA_BUCKET = 'barpilot-media';
const mediaManifestCache = {};
let mediaBucketReady = false;

function sanitizeMediaToken(str) {
  return String(str || 'default').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'default';
}

async function ensureMediaBucket(srKey) {
  if (mediaBucketReady || !srKey) return mediaBucketReady;
  try {
    const base = SUPABASE_URL.replace(/\/$/, '');
    const getRes = await fetch(`${base}/storage/v1/bucket/${MEDIA_BUCKET}`, {
      headers: { 'apikey': srKey, 'Authorization': `Bearer ${srKey}` }
    });
    if (getRes.ok) {
      mediaBucketReady = true;
      return true;
    }
    const createRes = await fetch(`${base}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'apikey': srKey,
        'Authorization': `Bearer ${srKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: MEDIA_BUCKET, name: MEDIA_BUCKET, public: true })
    });
    if (createRes.ok || createRes.status === 409) {
      mediaBucketReady = true;
      return true;
    }
  } catch (_) {}
  return false;
}

async function readMediaManifest(scope, srKey) {
  const safeScope = sanitizeMediaToken(scope);
  if (srKey) {
    try {
      const base = SUPABASE_URL.replace(/\/$/, '');
      const res = await fetch(`${base}/storage/v1/object/${MEDIA_BUCKET}/manifests/${safeScope}.json?t=${Date.now()}`, {
        headers: { 'apikey': srKey, 'Authorization': `Bearer ${srKey}` }
      });
      if (res.ok) {
        const parsed = await res.json();
        if (parsed && typeof parsed === 'object') {
          mediaManifestCache[safeScope] = parsed;
          return parsed;
        }
      }
    } catch (_) {}
  }
  return mediaManifestCache[safeScope] || {};
}

async function writeMediaManifest(scope, manifest, srKey) {
  const safeScope = sanitizeMediaToken(scope);
  mediaManifestCache[safeScope] = manifest;
  if (!srKey) return false;
  try {
    await ensureMediaBucket(srKey);
    const base = SUPABASE_URL.replace(/\/$/, '');
    const res = await fetch(`${base}/storage/v1/object/${MEDIA_BUCKET}/manifests/${safeScope}.json`, {
      method: 'POST',
      headers: {
        'apikey': srKey,
        'Authorization': `Bearer ${srKey}`,
        'Content-Type': 'application/json',
        'x-upsert': 'true'
      },
      body: JSON.stringify(manifest)
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}

async function uploadImageToSupabaseStorage(scope, key, value, srKey) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed.startsWith('data:image/')) {
    return trimmed;
  }
  if (!srKey) return trimmed;

  const match = trimmed.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return trimmed;

  const mime = match[1];
  const extRaw = mime.split('/')[1] || 'png';
  const ext = extRaw.replace(/[^a-zA-Z0-9]/g, '').replace('jpeg', 'jpg') || 'png';
  const buffer = Buffer.from(match[2], 'base64');

  const safeScope = sanitizeMediaToken(scope);
  const safeKey = sanitizeMediaToken(key);
  const objectPath = `uploads/${safeScope}/${safeKey}_${Date.now()}.${ext}`;

  try {
    await ensureMediaBucket(srKey);
    const base = SUPABASE_URL.replace(/\/$/, '');
    const upRes = await fetch(`${base}/storage/v1/object/${MEDIA_BUCKET}/${objectPath}`, {
      method: 'POST',
      headers: {
        'apikey': srKey,
        'Authorization': `Bearer ${srKey}`,
        'Content-Type': mime,
        'x-upsert': 'true',
        'cache-control': '31536000'
      },
      body: buffer
    });
    if (upRes.ok) {
      return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${objectPath}`;
    }
  } catch (err) {
    console.warn('[Media Storage] Upload error:', err.message);
  }
  return trimmed;
}

async function fetchAllAuthUsers() {
  const srKey = getServiceRoleKey();
  if (!srKey) return [];
  try {
    const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users?page=1&per_page=500`, {
      headers: {
        'apikey': srKey,
        'Authorization': `Bearer ${srKey}`
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.users || (Array.isArray(data) ? data : []);
  } catch (_) {
    return [];
  }
}

async function syncAffiliateInAuthUsers(affObj, password = null) {
  const srKey = getServiceRoleKey();
  if (!srKey || !affObj || !affObj.email) return null;
  const normalizedEmail = affObj.email.trim().toLowerCase();
  try {
    const users = await fetchAllAuthUsers();
    const existing = users.find(u => (u.email || '').toLowerCase() === normalizedEmail);
    const baseMeta = (existing && existing.user_metadata) ? { ...existing.user_metadata } : {};
    const mergedMeta = {
      ...baseMeta,
      affiliate_id: affObj.id || baseMeta.affiliate_id,
      affiliate_code: affObj.code || baseMeta.affiliate_code || getConsistentCodeForAccount(normalizedEmail),
      affiliate_name: affObj.name || baseMeta.affiliate_name || normalizedEmail.split('@')[0],
      affiliate_phone: affObj.phone || baseMeta.affiliate_phone || '',
      affiliate_status: affObj.status || baseMeta.affiliate_status || 'active',
      affiliate_created_at: affObj.created_at || baseMeta.affiliate_created_at || new Date().toISOString()
    };

    if (existing) {
      await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users/${encodeURIComponent(existing.id)}`, {
        method: 'PUT',
        headers: {
          'apikey': srKey,
          'Authorization': `Bearer ${srKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_metadata: mergedMeta })
      });
      return existing;
    } else {
      const createRes = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'apikey': srKey,
          'Authorization': `Bearer ${srKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password: password || ('BpAff_' + Math.random().toString(36).slice(2, 12) + '!1A'),
          email_confirm: true,
          user_metadata: mergedMeta
        })
      });
      if (createRes.ok) {
        const created = await createRes.json();
        return created.user || created;
      }
    }
  } catch (e) {
    console.warn('[Affiliates AuthSync] Nota:', e.message);
  }
  return null;
}

function hydrateAffiliateFromAuthUser(u) {
  if (!u || !u.email) return null;
  const meta = u.user_metadata || {};
  const email = u.email.trim().toLowerCase();
  const code = (meta.affiliate_code || getConsistentCodeForAccount(email)).toUpperCase();
  return {
    id: meta.affiliate_id || ('aff_' + u.id.replace(/-/g, '').slice(0, 12)),
    user_id: u.id,
    bar_id: meta.bar_id || null,
    name: meta.affiliate_name || meta.full_name || meta.display_name || email.split('@')[0],
    email,
    phone: meta.affiliate_phone || u.phone || meta.phone || '',
    code,
    status: meta.affiliate_status || 'active',
    commission_rate: 5.0,
    total_earned: 0.00,
    payout_method: meta.affiliate_payout_method || null,
    created_at: meta.affiliate_created_at || u.created_at,
    _authUser: u
  };
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

function getWithdrawalStatusLabel(status) {
  switch (status) {
    case 'approved': return 'Approvato';
    case 'processing': return 'In elaborazione';
    case 'paid': return 'Pagato';
    case 'rejected': return 'Rifiutato';
    case 'pending':
    default: return 'In attesa';
  }
}

function maskPaymentMethodReference(payout) {
  if (!payout) return '';
  let obj = payout;
  if (typeof payout === 'string') {
    try { obj = JSON.parse(payout); } catch (_) { return String(payout).slice(0, 64); }
  }
  if (!obj || typeof obj !== 'object') return '';
  if (obj.type === 'paypal' && obj.email) {
    return `PayPal (${String(obj.email).trim()})`;
  }
  if (obj.type === 'iban' && obj.iban) {
    const cleanIban = String(obj.iban).replace(/\s+/g, '').toUpperCase();
    const masked = cleanIban.length > 8
      ? `${cleanIban.slice(0, 4)}****${cleanIban.slice(-4)}`
      : cleanIban;
    const holder = obj.holder ? ` · ${String(obj.holder).trim()}` : '';
    return `IBAN ${masked}${holder}`;
  }
  if (obj.last4) {
    return `Carta ****${String(obj.last4).slice(-4)}`;
  }
  return 'Metodo configurato';
}

async function sendAdminWithdrawalEmail({ firstName, lastName, email, amount, requestedAt, requestId, paymentMethodRef }) {
  const adminEmail = 'admin@barpilot.eu';
  const subject = '💰 BarPilot — Nuova richiesta di prelievo';
  const formattedAmt = Number(amount || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const dateStr = new Date(requestedAt || Date.now()).toLocaleString('it-IT', { timeZone: 'Europe/Rome' });

  const textBody = `È stata ricevuta una nuova richiesta di prelievo dal programma affiliazioni BarPilot.

Nome: ${firstName || '-'}
Cognome: ${lastName || '-'}
Email: ${email || '-'}
Importo richiesto: ${formattedAmt}
Metodo pagamento: ${paymentMethodRef || '-'}
Data richiesta: ${dateStr}
ID richiesta: ${requestId}
Stato: In attesa di approvazione

Accedi al pannello Super Admin per verificare e gestire la richiesta:
https://www.barpilot.eu/app/administration`;

  const htmlBody = `
  <div style="font-family:Inter,Arial,sans-serif;background:#0B1220;color:#F1F5F9;padding:28px;border-radius:14px;max-width:580px;margin:0 auto;border:1px solid rgba(255,138,36,0.35);">
    <h2 style="margin:0 0 12px;color:#FF8A24;">💰 BarPilot — Nuova richiesta di prelievo</h2>
    <p style="color:#CBD5E1;line-height:1.55;">È stata ricevuta una nuova richiesta di prelievo dal programma affiliazioni BarPilot.</p>
    <div style="background:#131E36;padding:16px 18px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);margin:18px 0;">
      <p style="margin:6px 0;"><strong>Nome:</strong> ${firstName || '-'}</p>
      <p style="margin:6px 0;"><strong>Cognome:</strong> ${lastName || '-'}</p>
      <p style="margin:6px 0;"><strong>Email:</strong> ${email || '-'}</p>
      <p style="margin:6px 0;"><strong>Importo richiesto:</strong> <span style="color:#10B981;font-weight:800;">${formattedAmt}</span></p>
      <p style="margin:6px 0;"><strong>Metodo:</strong> ${paymentMethodRef || '-'}</p>
      <p style="margin:6px 0;"><strong>Data richiesta:</strong> ${dateStr}</p>
      <p style="margin:6px 0;"><strong>ID richiesta:</strong> <code>${requestId}</code></p>
      <p style="margin:6px 0;"><strong>Stato:</strong> <span style="color:#F59E0B;font-weight:700;">In attesa di approvazione</span></p>
    </div>
    <p style="margin:18px 0 0;">
      <a href="https://www.barpilot.eu/app/administration" style="display:inline-block;background:#FF8A24;color:#FFFFFF;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px;">
        Accedi al pannello Super Admin
      </a>
    </p>
  </div>`;

  let sent = false;
  let provider = 'admin_notification_only';

  if (process.env.RESEND_API_KEY) {
    try {
      const rRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'BarPilot <benvenuto@barpilot.eu>',
          to: [adminEmail],
          subject,
          text: textBody,
          html: htmlBody
        })
      });
      if (rRes.ok) {
        sent = true;
        provider = 'resend';
      }
    } catch (_) {}
  }

  if (!sent && process.env.BREVO_API_KEY) {
    try {
      const bRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'BarPilot', email: process.env.EMAIL_FROM_ADDRESS || 'benvenuto@barpilot.eu' },
          to: [{ email: adminEmail, name: 'Super Admin BarPilot' }],
          subject,
          textContent: textBody,
          htmlContent: htmlBody
        })
      });
      if (bRes.ok) {
        sent = true;
        provider = 'brevo';
      }
    } catch (_) {}
  }

  if (!sent && process.env.SENDGRID_API_KEY) {
    try {
      const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: adminEmail, name: 'Super Admin BarPilot' }] }],
          from: { email: process.env.EMAIL_FROM_ADDRESS || 'benvenuto@barpilot.eu', name: 'BarPilot' },
          subject,
          content: [
            { type: 'text/plain', value: textBody },
            { type: 'text/html', value: htmlBody }
          ]
        })
      });
      if (sgRes.ok || sgRes.status === 202) {
        sent = true;
        provider = 'sendgrid';
      }
    } catch (_) {}
  }

  // Registra anche notifica in-app per il Super Admin su Supabase
  try {
    await supabaseFetch('admin_notifications', {
      method: 'POST',
      body: JSON.stringify({
        id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
        title: 'Nuova richiesta di prelievo',
        message: `${firstName || ''} ${lastName || ''} (${email}) ha richiesto il prelievo di ${formattedAmt} [${requestId}].`,
        type: 'warning',
        link: '#view-affiliates',
        created_at: new Date().toISOString()
      })
    });
  } catch (_) {}

  console.log(`[Affiliate Withdrawal Email] To: ${adminEmail} | Provider: ${provider} | Sent: ${sent} | ID: ${requestId}`);
  return { sent, provider };
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
      let sqlAffiliatesAvailable = false;
      try {
        const affRes = await supabaseFetch("affiliates?order=created_at.desc");
        if (affRes.ok) {
          affiliates = await affRes.json();
          sqlAffiliatesAvailable = true;
        }
      } catch (_) {}

      let referrals = [];
      let sqlReferralsAvailable = false;
      try {
        const refRes = await supabaseFetch("affiliate_referrals?order=registered_at.desc");
        if (refRes.ok) {
          referrals = await refRes.json();
          sqlReferralsAvailable = true;
        }
      } catch (_) {}

      let commissions = [];
      let sqlCommissionsAvailable = false;
      try {
        const commRes = await supabaseFetch("affiliate_commissions?order=created_at.desc");
        if (commRes.ok) {
          commissions = await commRes.json();
          sqlCommissionsAvailable = true;
        }
      } catch (_) {}

      // Fallback persistente tramite Supabase auth.users se tabelle SQL non ancora create
      let withdrawals = [];
      let sqlWithdrawalsAvailable = false;
      try {
        const wdRes = await supabaseFetch("affiliate_withdrawals?order=requested_at.desc");
        if (wdRes.ok) {
          withdrawals = await wdRes.json();
          sqlWithdrawalsAvailable = true;
        }
      } catch (_) {}

      if (!sqlAffiliatesAvailable || affiliates.length === 0 || !sqlWithdrawalsAvailable) {
        const authUsers = await fetchAllAuthUsers();
        const affMap = new Map();
        (affiliates || []).forEach(a => affMap.set((a.email || '').toLowerCase(), a));
        (store.affiliates || []).forEach(a => {
          if (!affMap.has((a.email || '').toLowerCase())) affMap.set((a.email || '').toLowerCase(), a);
        });
        authUsers.forEach(u => {
          const hydrated = hydrateAffiliateFromAuthUser(u);
          if (hydrated) {
            if (!affMap.has(hydrated.email)) affMap.set(hydrated.email, hydrated);
            const meta = u.user_metadata || {};
            if (!sqlReferralsAvailable && Array.isArray(meta.affiliate_referrals)) {
              meta.affiliate_referrals.forEach(r => {
                if (!referrals.some(ex => ex.id === r.id || (ex.referred_email && ex.referred_email === r.referred_email))) {
                  referrals.push(r);
                }
              });
            }
            if (!sqlCommissionsAvailable && Array.isArray(meta.affiliate_commissions)) {
              meta.affiliate_commissions.forEach(c => {
                if (!commissions.some(ex => ex.id === c.id)) {
                  commissions.push(c);
                }
              });
            }
            if (!sqlWithdrawalsAvailable && Array.isArray(meta.affiliate_withdrawals)) {
              meta.affiliate_withdrawals.forEach(w => {
                if (!withdrawals.some(ex => ex.id === w.id)) {
                  withdrawals.push(w);
                }
              });
            }
          }
        });
        affiliates = Array.from(affMap.values());
      }
      if (!sqlReferralsAvailable && referrals.length === 0) referrals = store.referrals || [];
      if (!sqlCommissionsAvailable && commissions.length === 0) commissions = store.commissions || [];
      if (!sqlWithdrawalsAvailable) {
        (store.withdrawals || []).forEach(w => {
          if (!withdrawals.some(ex => ex.id === w.id)) withdrawals.push(w);
        });
      }

      await evaluateReferralsLifecycle(referrals);

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

      const reservedWithdrawalsOverall = withdrawals
        .filter(w => ['pending', 'approved', 'processing', 'paid'].includes(w.status))
        .reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
      totalAvailableOverall = Math.max(0, totalAvailableOverall - reservedWithdrawalsOverall);

      const totalWithdrawalsPaid = withdrawals
        .filter(w => w.status === 'paid')
        .reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);

      const affiliatesEnriched = affiliates.map(aff => {
        const affReferrals = referrals.filter(r => r.affiliate_id === aff.id || r.affiliate_code === aff.code);
        const affCommissions = commissions.filter(c => c.affiliate_id === aff.id);
        const affWithdrawals = withdrawals.filter(w => w.affiliate_id === aff.id || (w.affiliate_email && w.affiliate_email.toLowerCase() === (aff.email || '').toLowerCase()));
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
        const affReservedWd = affWithdrawals
          .filter(w => ['pending', 'approved', 'processing', 'paid'].includes(w.status))
          .reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
        affAvailable = Math.max(0, affAvailable - affReservedWd);

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
      const pendingWithdrawalsCount = withdrawals.filter(w => ['pending', 'approved', 'processing'].includes(w.status)).length;

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
        total_paid: (totalPaidOverall + totalWithdrawalsPaid).toFixed(2),
        paid_commissions: (totalPaidOverall + totalWithdrawalsPaid).toFixed(2),
        total_cancelled: totalCancelledOverall.toFixed(2),
        cancelled_commissions: totalCancelledOverall.toFixed(2),
        pending_withdrawals_count: pendingWithdrawalsCount,
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
        })),
        withdrawals: withdrawals.map(w => ({
          id: w.id,
          affiliate_id: w.affiliate_id,
          user_id: w.user_id || null,
          first_name: w.affiliate_first_name || '',
          last_name: w.affiliate_last_name || '',
          email: w.affiliate_email || '',
          amount: parseFloat(w.amount || 0).toFixed(2),
          currency: w.currency || 'EUR',
          status: w.status || 'pending',
          status_label: getWithdrawalStatusLabel(w.status),
          payment_method_reference: w.payment_method_reference || '',
          notes: w.notes || '',
          requested_at: w.requested_at || w.created_at,
          approved_at: w.approved_at || null,
          paid_at: w.paid_at || null,
          rejected_at: w.rejected_at || null
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

      if (action === 'update_withdrawal_status') {
        const { withdrawalId, status, notes = '' } = body;
        const validStatuses = ['pending', 'approved', 'processing', 'paid', 'rejected'];
        if (!withdrawalId || !validStatuses.includes(status)) {
          return res.status(400).json({ error: `Stato prelievo non valido. Valori ammessi: ${validStatuses.join(', ')}` });
        }

        const nowIso = new Date().toISOString();
        let rpcOk = false;

        try {
          const rpcRes = await supabaseFetch('rpc/update_affiliate_withdrawal_status', {
            method: 'POST',
            body: JSON.stringify({
              p_withdrawal_id: withdrawalId,
              p_new_status: status,
              p_notes: notes || null
            })
          });
          if (rpcRes.ok) {
            const rpcData = await rpcRes.json();
            if (rpcData && rpcData.success) rpcOk = true;
          }
        } catch (_) {}

        if (!rpcOk) {
          const patchPayload = { status, updated_at: nowIso };
          if (notes) patchPayload.notes = notes;
          if (status === 'approved') patchPayload.approved_at = nowIso;
          if (status === 'paid') patchPayload.paid_at = nowIso;
          if (status === 'rejected') patchPayload.rejected_at = nowIso;

          try {
            const pRes = await supabaseFetch(`affiliate_withdrawals?id=eq.${encodeURIComponent(withdrawalId)}`, {
              method: 'PATCH',
              body: JSON.stringify(patchPayload)
            });
            if (pRes.ok) {
              const pRows = await pRes.json();
              if (pRows && pRows[0]?.affiliate_id) {
                await recalculateAffiliateBalanceOnDb(pRows[0].affiliate_id);
              }
            }
          } catch (_) {}
        }

        // Aggiorna anche store in-memory e auth.users metadata (fallback persistente)
        const wdInStore = (store.withdrawals || []).find(w => w.id === withdrawalId);
        if (wdInStore) {
          wdInStore.status = status;
          wdInStore.updated_at = nowIso;
          if (notes) wdInStore.notes = notes;
          if (status === 'approved') wdInStore.approved_at = nowIso;
          if (status === 'paid') wdInStore.paid_at = nowIso;
          if (status === 'rejected') wdInStore.rejected_at = nowIso;
          writeAffiliatesStore(store);
        }

        const srKey = getServiceRoleKey();
        if (srKey) {
          try {
            const users = await fetchAllAuthUsers();
            for (const u of users) {
              const wds = u.user_metadata?.affiliate_withdrawals;
              if (Array.isArray(wds)) {
                const idx = wds.findIndex(w => w.id === withdrawalId);
                if (idx !== -1) {
                  wds[idx].status = status;
                  wds[idx].updated_at = nowIso;
                  if (notes) wds[idx].notes = notes;
                  if (status === 'approved') wds[idx].approved_at = nowIso;
                  if (status === 'paid') wds[idx].paid_at = nowIso;
                  if (status === 'rejected') wds[idx].rejected_at = nowIso;
                  const meta = { ...u.user_metadata, affiliate_withdrawals: wds };
                  await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users/${encodeURIComponent(u.id)}`, {
                    method: 'PUT',
                    headers: {
                      'apikey': srKey,
                      'Authorization': `Bearer ${srKey}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ user_metadata: meta })
                  });
                  break;
                }
              }
            }
          } catch (_) {}
        }

        return res.status(200).json({
          success: true,
          message: `Prelievo aggiornato a "${getWithdrawalStatusLabel(status)}".`,
          withdrawalId,
          status
        });
      }

      if (action === 'record_referral_bonus') {
        const { affiliateEmail, affiliateCode, referral, commission } = body;
        if (!referral || !commission) {
          return res.status(400).json({ error: "Dati referral/commissione mancanti." });
        }

        const dupInStore = (store.referrals || []).some(r =>
          (referral.referred_bar_id && r.referred_bar_id === referral.referred_bar_id) ||
          (referral.referred_email && r.referred_email && r.referred_email.toLowerCase() === referral.referred_email.toLowerCase())
        );

        if (!dupInStore) {
          store.referrals.unshift(referral);
          store.commissions.unshift(commission);
          writeAffiliatesStore(store);
        }

        // Persistenza su Supabase auth.users user_metadata per l'affiliato
        const srKey = getServiceRoleKey();
        if (srKey) {
          try {
            const users = await fetchAllAuthUsers();
            const codeUpper = (affiliateCode || referral.affiliate_code || '').toUpperCase();
            const affEmailLower = (affiliateEmail || '').toLowerCase();
            let targetUser = users.find(u =>
              (affEmailLower && (u.email || '').toLowerCase() === affEmailLower) ||
              (codeUpper && ((u.user_metadata?.affiliate_code || '').toUpperCase() === codeUpper || getConsistentCodeForAccount(u.email) === codeUpper))
            );
            if (!targetUser && affEmailLower) {
              targetUser = await syncAffiliateInAuthUsers({
                id: referral.affiliate_id,
                email: affEmailLower,
                code: codeUpper,
                status: 'active'
              });
            }
            if (targetUser) {
              const meta = { ...(targetUser.user_metadata || {}) };
              const refs = Array.isArray(meta.affiliate_referrals) ? [...meta.affiliate_referrals] : [];
              const comms = Array.isArray(meta.affiliate_commissions) ? [...meta.affiliate_commissions] : [];
              const alreadyInAuth = refs.some(r =>
                (referral.referred_bar_id && r.referred_bar_id === referral.referred_bar_id) ||
                (referral.referred_email && r.referred_email && r.referred_email.toLowerCase() === referral.referred_email.toLowerCase())
              );
              if (alreadyInAuth) {
                return res.status(200).json({ success: true, already_credited: true, bonus_credited: 0 });
              }
              refs.unshift(referral);
              comms.unshift(commission);
              meta.affiliate_referrals = refs;
              meta.affiliate_commissions = comms;
              await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users/${encodeURIComponent(targetUser.id)}`, {
                method: 'PUT',
                headers: {
                  'apikey': srKey,
                  'Authorization': `Bearer ${srKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_metadata: meta })
              });
            }
          } catch (syncErr) {
            console.warn('[record_referral_bonus AuthSync]', syncErr.message);
          }
        }

        return res.status(200).json({
          success: true,
          already_credited: dupInStore,
          bonus_credited: dupInStore ? 0 : (parseFloat(commission.amount) || 5.00)
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
      const mediaScope = (req.query.media_scope || '').trim();
      if (mediaScope) {
        const srKey = getServiceRoleKey();
        const media = await readMediaManifest(mediaScope, srKey);
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({ success: true, scope: mediaScope, media });
      }

      const email = (req.query.email || '').trim().toLowerCase();
      const userId = (req.query.userId || '').trim();
      const barId = (req.query.barId || '').trim();
      const clientCode = (req.query.code || '').trim().toUpperCase();

      if (!email && !userId && !barId) {
        return res.status(400).json({ error: "Email o UserId obbligatori per visualizzare le affiliazioni." });
      }

      let affiliate = null;
      let authUserMatched = null;

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

      // Cerca sempre anche in Supabase auth.users per garantire persistenza cross-container
      const authUsers = await fetchAllAuthUsers();
      authUserMatched = authUsers.find(u =>
        (email && (u.email || '').toLowerCase() === email) ||
        (userId && u.id === userId) ||
        (clientCode && (u.user_metadata?.affiliate_code || '').toUpperCase() === clientCode)
      );

      if (!affiliate && authUserMatched) {
        affiliate = hydrateAffiliateFromAuthUser(authUserMatched);
        if (affiliate) {
          store.affiliates.push(affiliate);
          writeAffiliatesStore(store);
        }
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

        await syncAffiliateInAuthUsers(affiliate);
        store.affiliates.push(affiliate);
        writeAffiliatesStore(store);
      } else {
        affiliate.code = permanentCode;
        if (!authUserMatched || !authUserMatched.user_metadata?.affiliate_code) {
          await syncAffiliateInAuthUsers(affiliate);
        }
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
      let sqlRefOk = false;
      try {
        const refRes = await supabaseFetch(`affiliate_referrals?affiliate_id=eq.${encodeURIComponent(affiliate.id)}&order=registered_at.desc`);
        if (refRes.ok) {
          referrals = await refRes.json();
          sqlRefOk = true;
        }
      } catch (_) {}

      if (!sqlRefOk || referrals.length === 0) {
        const authRefs = authUserMatched?.user_metadata?.affiliate_referrals;
        if (Array.isArray(authRefs) && authRefs.length > 0) {
          referrals = [...authRefs];
        } else {
          referrals = store.referrals.filter(r => r.affiliate_id === affiliate.id || r.affiliate_code === affiliate.code);
        }
      }

      // Valuta lo stato reale dei referral rispetto ai 14 giorni di prova e pagamenti Stripe
      await evaluateReferralsLifecycle(referrals);

      let commissions = [];
      let sqlCommOk = false;
      try {
        const commRes = await supabaseFetch(`affiliate_commissions?affiliate_id=eq.${encodeURIComponent(affiliate.id)}&order=created_at.desc`);
        if (commRes.ok) {
          commissions = await commRes.json();
          sqlCommOk = true;
        }
      } catch (_) {}

      if (!sqlCommOk || commissions.length === 0) {
        const authComms = authUserMatched?.user_metadata?.affiliate_commissions;
        if (Array.isArray(authComms) && authComms.length > 0) {
          commissions = [...authComms];
        } else {
          commissions = store.commissions.filter(c => c.affiliate_id === affiliate.id);
        }
      }

      let withdrawals = [];
      let sqlWdOk = false;
      try {
        const wdRes = await supabaseFetch(`affiliate_withdrawals?affiliate_id=eq.${encodeURIComponent(affiliate.id)}&order=requested_at.desc`);
        if (wdRes.ok) {
          withdrawals = await wdRes.json();
          sqlWdOk = true;
        }
      } catch (_) {}

      if (!sqlWdOk || withdrawals.length === 0) {
        const authWds = authUserMatched?.user_metadata?.affiliate_withdrawals;
        if (Array.isArray(authWds) && authWds.length > 0) {
          withdrawals = [...authWds];
        } else {
          withdrawals = (store.withdrawals || []).filter(w =>
            w.affiliate_id === affiliate.id ||
            (w.affiliate_email && w.affiliate_email.toLowerCase() === (affiliate.email || '').toLowerCase())
          );
        }
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

      const reservedOrPaidWithdrawals = withdrawals
        .filter(w => ['pending', 'approved', 'processing', 'paid'].includes(w.status))
        .reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
      availableBalance = Math.max(0, availableBalance - reservedOrPaidWithdrawals);

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
        })),
        withdrawals: withdrawals.map(w => ({
          id: w.id,
          affiliate_id: w.affiliate_id,
          amount: parseFloat(w.amount || 0).toFixed(2),
          currency: w.currency || 'EUR',
          status: w.status || 'pending',
          status_label: getWithdrawalStatusLabel(w.status),
          payment_method_reference: w.payment_method_reference || '',
          requested_at: w.requested_at || w.created_at,
          approved_at: w.approved_at || null,
          paid_at: w.paid_at || null,
          rejected_at: w.rejected_at || null
        }))
      });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const action = body.action || 'verify_code';

      if (action === 'save_media') {
        const scope = (body.scope || 'default').trim();
        const key = (body.key || '').trim();
        const rawValue = body.value === null || body.value === undefined ? '' : String(body.value);

        if (!key) {
          return res.status(400).json({ error: 'Chiave immagine obbligatoria.' });
        }
        if (scope === 'superadmin') {
          const pin = req.headers['x-admin-pin'] || body.adminPin || '';
          if (pin !== '101540') {
            return res.status(401).json({ error: 'PIN Super Admin non valido.' });
          }
        }

        const srKey = getServiceRoleKey();
        const manifest = { ...(await readMediaManifest(scope, srKey)) };
        let finalUrl = '';

        if (!rawValue.trim()) {
          delete manifest[key];
        } else {
          finalUrl = await uploadImageToSupabaseStorage(scope, key, rawValue, srKey);
          manifest[key] = finalUrl;
        }

        const persisted = await writeMediaManifest(scope, manifest, srKey);
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({
          success: true,
          persisted_cloud: persisted,
          scope,
          key,
          url: finalUrl,
          media: manifest
        });
      }

      if (action === 'verify_code') {
        const code = (body.code || '').trim().toUpperCase();
        if (!code) {
          return res.status(400).json({ valid: false, message: "Codice non inserito." });
        }

        try {
          const affRes = await supabaseFetch(`affiliates?code=eq.${encodeURIComponent(code)}&limit=1`);
          if (affRes.ok) {
            const rows = await affRes.json();
            if (rows && rows.length > 0) {
              const row = rows[0];
              if (row.status === 'suspended') {
                return res.status(200).json({ valid: false, code, status: 'suspended', message: "Codice partner temporaneamente sospeso." });
              }
              return res.status(200).json({
                valid: true,
                code: row.code,
                affiliate_id: row.id,
                email: row.email,
                user_id: row.user_id || null,
                phone: row.phone || '',
                status: row.status || 'active',
                message: "Codice affiliazione valido."
              });
            }
          }
        } catch (_) {}

        const found = store.affiliates.find(a => a.code === code);
        if (found) {
          if (found.status === 'suspended') {
            return res.status(200).json({ valid: false, code, status: 'suspended', message: "Codice partner temporaneamente sospeso." });
          }
          return res.status(200).json({
            valid: true,
            code: found.code,
            affiliate_id: found.id,
            email: found.email,
            user_id: found.user_id || null,
            phone: found.phone || '',
            status: found.status || 'active',
            message: "Codice affiliazione valido."
          });
        }

        // Controllo su Supabase Authentication > Users (persistente anche prima della creazione tabelle SQL)
        const authUsers = await fetchAllAuthUsers();
        const authMatch = authUsers.find(u => {
          const metaCode = (u.user_metadata?.affiliate_code || '').toUpperCase();
          return metaCode === code || (u.email && getConsistentCodeForAccount(u.email) === code);
        });
        if (authMatch) {
          const hydrated = hydrateAffiliateFromAuthUser(authMatch);
          if (hydrated && hydrated.status !== 'suspended') {
            if (!store.affiliates.some(a => a.email === hydrated.email)) {
              store.affiliates.push(hydrated);
              writeAffiliatesStore(store);
            }
            return res.status(200).json({
              valid: true,
              code: hydrated.code,
              affiliate_id: hydrated.id,
              email: hydrated.email,
              user_id: hydrated.user_id,
              phone: hydrated.phone || '',
              status: hydrated.status || 'active',
              message: "Codice affiliazione valido."
            });
          }
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

        const srKeyPm = getServiceRoleKey();
        if (srKeyPm && email) {
          try {
            const users = await fetchAllAuthUsers();
            const uMatch = users.find(u => (u.email || '').toLowerCase() === String(email).toLowerCase());
            if (uMatch) {
              const meta = { ...(uMatch.user_metadata || {}), affiliate_payout_method: payoutMethod };
              await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users/${encodeURIComponent(uMatch.id)}`, {
                method: 'PUT',
                headers: { 'apikey': srKeyPm, 'Authorization': `Bearer ${srKeyPm}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_metadata: meta })
              });
            }
          } catch (_) {}
        }

        return res.status(200).json({
          success: true,
          message: "Metodo di pagamento per liquidazione salvato con successo.",
          payoutMethod
        });
      }

      if (action === 'request_withdrawal') {
        const cleanEmail = (body.email || '').trim().toLowerCase();
        const requestedAmount = parseFloat(body.amount);
        const firstNameInput = (body.firstName || '').trim();
        const lastNameInput = (body.lastName || '').trim();
        const fullNameInput = (body.name || '').trim();
        const payoutMethodInput = body.payoutMethod || null;

        if (!cleanEmail) {
          return res.status(400).json({ error: "Email affiliato obbligatoria per richiedere un prelievo." });
        }
        if (isNaN(requestedAmount) || requestedAmount < 50.00) {
          return res.status(400).json({ error: "L'importo minimo per richiedere un prelievo è 50,00 €." });
        }

        // Recupera affiliato e verifica saldo reale dal database (mai fidarsi del browser)
        let affiliate = null;
        let authUserMatched = null;
        try {
          const affRes = await supabaseFetch(`affiliates?email=eq.${encodeURIComponent(cleanEmail)}&limit=1`);
          if (affRes.ok) {
            const rows = await affRes.json();
            if (rows && rows.length > 0) affiliate = rows[0];
          }
        } catch (_) {}

        const authUsers = await fetchAllAuthUsers();
        authUserMatched = authUsers.find(u => (u.email || '').toLowerCase() === cleanEmail);
        if (!affiliate) {
          affiliate = store.affiliates.find(a => a.email && a.email.toLowerCase() === cleanEmail) ||
            (authUserMatched ? hydrateAffiliateFromAuthUser(authUserMatched) : null);
        }

        if (!affiliate) {
          return res.status(404).json({ error: "Account affiliato non trovato." });
        }

        const effectivePayout = payoutMethodInput || affiliate.payout_method || authUserMatched?.user_metadata?.affiliate_payout_method;
        const maskedMethodRef = maskPaymentMethodReference(effectivePayout);
        if (!maskedMethodRef) {
          return res.status(400).json({ error: "Configura prima un metodo di pagamento valido per ricevere il prelievo." });
        }

        // Calcola saldo reale disponibile su commissioni - prelievi non rifiutati
        let commissions = [];
        let sqlCommOk = false;
        try {
          const commRes = await supabaseFetch(`affiliate_commissions?affiliate_id=eq.${encodeURIComponent(affiliate.id)}&select=amount,status`);
          if (commRes.ok) {
            commissions = await commRes.json();
            sqlCommOk = true;
          }
        } catch (_) {}
        if (!sqlCommOk || commissions.length === 0) {
          commissions = authUserMatched?.user_metadata?.affiliate_commissions || store.commissions.filter(c => c.affiliate_id === affiliate.id);
        }

        let withdrawals = [];
        let sqlWdOk = false;
        try {
          const wdRes = await supabaseFetch(`affiliate_withdrawals?affiliate_id=eq.${encodeURIComponent(affiliate.id)}&order=requested_at.desc`);
          if (wdRes.ok) {
            withdrawals = await wdRes.json();
            sqlWdOk = true;
          }
        } catch (_) {}
        if (!sqlWdOk || withdrawals.length === 0) {
          withdrawals = authUserMatched?.user_metadata?.affiliate_withdrawals ||
            (store.withdrawals || []).filter(w => w.affiliate_id === affiliate.id || (w.affiliate_email || '').toLowerCase() === cleanEmail);
        }

        const rawAvailable = (commissions || [])
          .filter(c => c.status === 'available')
          .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

        const reservedOrPaid = (withdrawals || [])
          .filter(w => ['pending', 'approved', 'processing', 'paid'].includes(w.status))
          .reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);

        const realAvailable = Math.max(0, parseFloat((rawAvailable - reservedOrPaid).toFixed(2)));
        if (requestedAmount > realAvailable) {
          return res.status(400).json({
            error: `Saldo disponibile insufficiente. Saldo reale disponibile: ${realAvailable.toFixed(2)} €.`
          });
        }

        // Anti-duplicato ravvicinato (entro 30s)
        const now = new Date();
        const nowIso = now.toISOString();
        const hasRecentPending = (withdrawals || []).some(w =>
          ['pending', 'processing'].includes(w.status) &&
          (now.getTime() - new Date(w.requested_at || w.created_at || 0).getTime()) < 30000
        );
        if (hasRecentPending) {
          return res.status(429).json({
            error: "Hai già inviato una richiesta di prelievo pochi secondi fa. Attendi la conferma."
          });
        }

        const resolvedFullName = fullNameInput || affiliate.name || cleanEmail.split('@')[0];
        const nameParts = resolvedFullName.split(/\s+/);
        const finalFirstName = firstNameInput || affiliate.first_name || nameParts[0] || resolvedFullName;
        const finalLastName = lastNameInput || affiliate.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '-');

        let withdrawalRecord = null;
        let savedToSupabase = false;

        // 1) Tenta transazione atomica RPC su Supabase
        try {
          const rpcRes = await supabaseFetch('rpc/request_affiliate_withdrawal', {
            method: 'POST',
            body: JSON.stringify({
              p_affiliate_id: affiliate.id,
              p_user_id: affiliate.user_id || authUserMatched?.id || '',
              p_first_name: finalFirstName,
              p_last_name: finalLastName,
              p_email: cleanEmail,
              p_amount: parseFloat(requestedAmount.toFixed(2)),
              p_payment_method_ref: maskedMethodRef
            })
          });
          if (rpcRes.ok) {
            const rpcData = await rpcRes.json();
            if (rpcData && !rpcData.success) {
              return res.status(400).json({ error: rpcData.error || "Richiesta prelievo rifiutata dal database." });
            }
            if (rpcData && rpcData.success && rpcData.withdrawal_id) {
              savedToSupabase = true;
              withdrawalRecord = {
                id: rpcData.withdrawal_id,
                affiliate_id: affiliate.id,
                user_id: affiliate.user_id || authUserMatched?.id || null,
                affiliate_first_name: finalFirstName,
                affiliate_last_name: finalLastName,
                affiliate_email: cleanEmail,
                amount: parseFloat(requestedAmount.toFixed(2)),
                currency: 'EUR',
                status: 'pending',
                payment_method_reference: maskedMethodRef,
                requested_at: rpcData.requested_at || nowIso
              };
            }
          }
        } catch (_) {}

        // 2) Fallback REST diretto su affiliate_withdrawals
        if (!savedToSupabase) {
          const wdId = 'wd_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
          withdrawalRecord = {
            id: wdId,
            affiliate_id: affiliate.id,
            user_id: affiliate.user_id || authUserMatched?.id || null,
            affiliate_first_name: finalFirstName,
            affiliate_last_name: finalLastName,
            affiliate_email: cleanEmail,
            amount: parseFloat(requestedAmount.toFixed(2)),
            currency: 'EUR',
            status: 'pending',
            payment_method_reference: maskedMethodRef,
            requested_at: nowIso,
            created_at: nowIso,
            updated_at: nowIso
          };

          try {
            const postWd = await supabaseFetch('affiliate_withdrawals', {
              method: 'POST',
              body: JSON.stringify(withdrawalRecord)
            });
            if (postWd.ok) {
              savedToSupabase = true;
              await recalculateAffiliateBalanceOnDb(affiliate.id);
            }
          } catch (_) {}
        }

        // 3) Persistenza su auth.users user_metadata + store (garantisce funzionamento anche prima delle migrazioni SQL)
        store.withdrawals = store.withdrawals || [];
        store.withdrawals.unshift(withdrawalRecord);
        writeAffiliatesStore(store);

        const srKeyWd = getServiceRoleKey();
        if (srKeyWd && authUserMatched) {
          try {
            const meta = { ...(authUserMatched.user_metadata || {}) };
            const existingAuthWds = Array.isArray(meta.affiliate_withdrawals) ? [...meta.affiliate_withdrawals] : [];
            existingAuthWds.unshift(withdrawalRecord);
            meta.affiliate_withdrawals = existingAuthWds;
            await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users/${encodeURIComponent(authUserMatched.id)}`, {
              method: 'PUT',
              headers: {
                'apikey': srKeyWd,
                'Authorization': `Bearer ${srKeyWd}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ user_metadata: meta })
            });
            savedToSupabase = true;
          } catch (_) {}
        }

        if (!savedToSupabase) {
          return res.status(500).json({ error: "Impossibile salvare la richiesta su Supabase. Riprova tra poco." });
        }

        // Registra audit log
        try {
          await supabaseFetch('admin_audit_logs', {
            method: 'POST',
            body: JSON.stringify({
              id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
              admin_id: cleanEmail,
              action: 'affiliate_withdrawal_requested',
              entity_type: 'withdrawal',
              entity_id: withdrawalRecord.id,
              new_values: { amount: withdrawalRecord.amount, method: maskedMethodRef, status: 'pending' },
              created_at: nowIso
            })
          });
        } catch (_) {}

        // Invia email automatica al Super Admin (admin@barpilot.eu)
        const emailResult = await sendAdminWithdrawalEmail({
          firstName: finalFirstName,
          lastName: finalLastName,
          email: cleanEmail,
          amount: withdrawalRecord.amount,
          requestedAt: withdrawalRecord.requested_at,
          requestId: withdrawalRecord.id,
          paymentMethodRef: maskedMethodRef
        });

        const newAvailableBalance = Math.max(0, parseFloat((realAvailable - requestedAmount).toFixed(2)));

        return res.status(200).json({
          success: true,
          message: "Richiesta di prelievo inviata con successo!",
          withdrawal: {
            id: withdrawalRecord.id,
            amount: withdrawalRecord.amount.toFixed(2),
            currency: 'EUR',
            status: 'pending',
            status_label: getWithdrawalStatusLabel('pending'),
            payment_method_reference: maskedMethodRef,
            requested_at: withdrawalRecord.requested_at
          },
          available_balance: newAvailableBalance.toFixed(2),
          email_notified: emailResult
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

        // Cerca se l'affiliato esiste già in store, SQL o auth.users
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

        if (!aff) {
          const authUsers = await fetchAllAuthUsers();
          const existingAuth = authUsers.find(u => (u.email || '').toLowerCase() === cleanEmail);
          if (existingAuth) {
            aff = hydrateAffiliateFromAuthUser(existingAuth);
          }
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

        await syncAffiliateInAuthUsers(aff, cleanPassword);

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

        if (!aff) {
          const authUsers = await fetchAllAuthUsers();
          const existingAuth = authUsers.find(u => (u.email || '').toLowerCase() === cleanEmail);
          if (existingAuth) {
            aff = hydrateAffiliateFromAuthUser(existingAuth);
            if (aff) {
              store.affiliates.push(aff);
              writeAffiliatesStore(store);
            }
          }
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

        await syncAffiliateInAuthUsers(aff, cleanPassword);

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
