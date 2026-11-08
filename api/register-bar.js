// api/register-bar.js - Vercel Serverless Function (Node.js)
// Registrazione centralizzata e idempotente di un nuovo Bar su Supabase:
// 1. Inserimento/aggiornamento su public.bars con status = 'trial'
// 2. Associazione membro titolare su public.bar_members
// 3. Creazione abbonamento BarPilot Pro con 14 giorni di prova gratuita su public.subscriptions
// 4. Scrittura audit log amministrativo su public.admin_audit_logs
// 5. Invio email di benvenuto via send-welcome-email

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cprxxxlgaofopmogeuer.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnh4eGxnYW9mb3Btb2dldWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4Mzg1OTQsImV4cCI6MjEwODQxNDU5NH0.wuB9OUgmYo8n1xeJsGl-YpyzVRwg8Sr4k3XAKaYltRI";

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

  // GET: Restituisce l'elenco dei bar direttamente da Supabase Authentication > Users
  if (req.method === 'GET') {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || (SUPABASE_KEY.includes("service_role") ? SUPABASE_KEY : null);
    if (serviceRoleKey) {
      try {
        const adminUsersUrl = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users?page=1&per_page=200`;
        const aRes = await fetch(adminUsersUrl, {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          }
        });
        if (aRes.ok) {
          const aData = await aRes.json();
          const usersList = aData.users || (Array.isArray(aData) ? aData : []);
          return res.status(200).json({
            success: true,
            source: 'auth.users',
            supabaseUrl: SUPABASE_URL,
            hasServiceRoleKey: Boolean(serviceRoleKey),
            serviceKeyPrefix: serviceRoleKey ? serviceRoleKey.substring(0, 15) + '...' : null,
            total: usersList.length,
            debug: aData,
            users: usersList
          });
        }
      } catch (errAuth) {
        console.warn('[Register Bar GET] Errore fetch auth.users:', errAuth.message);
      }
    }

    try {
      const viewRes = await supabaseFetch('auth_users?select=*&order=created_at.desc');
      if (viewRes.ok) {
        const viewUsers = await viewRes.json();
        return res.status(200).json({
          success: true,
          source: 'public.auth_users',
          users: viewUsers
        });
      }
    } catch (_) {}

    try {
      const barsRes = await supabaseFetch('bars?select=*&order=created_at.desc');
      if (barsRes.ok) {
        const barsData = await barsRes.json();
        return res.status(200).json({
          success: true,
          source: 'public.bars',
          users: barsData
        });
      }
    } catch (_) {}

    return res.status(200).json({ success: true, source: 'empty', users: [] });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const {
      userId,
      ownerName,
      barName,
      email,
      phone,
      vatNumber,
      city,
      address
    } = body;

    const normalizedEmail = (email || '').trim().toLowerCase();
    const cleanBarName = (barName || 'Il Mio Bar').trim();
    const cleanCity = (city || 'Italia').trim();
    const cleanOwner = (ownerName || cleanBarName).trim();
    const cleanVat = (vatNumber || '').trim();
    const cleanPhone = (phone || '').trim();
    const cleanAddress = (address || `Via Centrale 1, ${cleanCity}`).trim();
    const cleanInviteCode = (body.inviteCode || body.promoCode || '').trim();

    if (!normalizedEmail || !cleanBarName) {
      return res.status(400).json({ error: 'Email e Nome del Bar sono campi obbligatori.' });
    }

    // Controllo di sicurezza e GDPR: verifica che l'email non corrisponda a un account eliminato definitivamente
    try {
      const crypto = require('crypto');
      const emailHash = crypto.createHash('sha256').update(normalizedEmail).digest('hex');
      const checkDeletedRes = await supabaseFetch(`admin_audit_logs?action=eq.account_deleted_permanently&entity_id=eq.${emailHash}&select=id`);
      if (checkDeletedRes.ok) {
        const deletedRecords = await checkDeletedRes.json();
        if (deletedRecords && deletedRecords.length > 0) {
          return res.status(403).json({
            error: 'Questo indirizzo email appartiene a un account eliminato definitivamente e non può essere utilizzato per una nuova registrazione.'
          });
        }
      }
    } catch (gdprCheckErr) {
      console.warn('[Register Bar] Controllo email eliminata:', gdprCheckErr.message);
    }

    console.log(`[Register Bar] Inizio registrazione per ${cleanBarName} (${normalizedEmail})`);

    // 0. Sincronizzazione diretta su auth.users (phone & Codice invito) tramite Supabase Admin API
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || (SUPABASE_KEY.includes("service_role") ? SUPABASE_KEY : null);
    if (userId && serviceRoleKey) {
      try {
        const adminUrl = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users/${encodeURIComponent(userId)}`;
        const updateBody = {};
        if (cleanPhone) {
          updateBody.phone = cleanPhone;
          updateBody.phone_confirm = true;
        }
        if (cleanInviteCode) {
          updateBody.user_metadata = {
            "Codice invito": cleanInviteCode,
            "Codice Invito": cleanInviteCode,
            codice_invito: cleanInviteCode,
            invite_code: cleanInviteCode,
            promo_code: cleanInviteCode
          };
        }
        if (Object.keys(updateBody).length > 0) {
          await fetch(adminUrl, {
            method: 'PUT',
            headers: {
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateBody)
          });
          console.log(`[Register Bar] ✅ auth.users aggiornato con successo per ${userId}`);
        }
      } catch (adminErr) {
        console.warn('[Register Bar] Nota aggiornamento auth.users:', adminErr.message);
      }
    }

    // 1. Controllo Idempotenza: Cerca se il bar esiste già per questa email
    let existingBar = null;
    const findRes = await supabaseFetch(`bars?email=eq.${encodeURIComponent(normalizedEmail)}&select=*`);
    if (findRes.ok) {
      const rows = await findRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        existingBar = rows[0];
        console.log(`[Register Bar] Bar esistente trovato (ID: ${existingBar.id}). Operazione idempotente.`);
      }
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const barId = existingBar ? existingBar.id : ('bar_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5));
    const subId = existingBar?.subscription_id || ('sub_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5));

    // 2. Inserisci / Aggiorna il record in public.bars
    const barPayload = {
      id: barId,
      owner_id: userId || null,
      name: cleanBarName,
      business_name: cleanBarName,
      vat_number: cleanVat,
      tax_code: cleanVat,
      email: normalizedEmail,
      phone: cleanPhone,
      city: cleanCity,
      address: cleanAddress,
      country: 'IT',
      status: existingBar ? existingBar.status : 'trial',
      subscription_id: subId,
      notes: cleanInviteCode ? `Registrato da ${cleanOwner} - Codice invito: ${cleanInviteCode}` : `Registrato da ${cleanOwner} - Prova 14 giorni`,
      invite_code: cleanInviteCode || null,
      updated_at: now.toISOString()
    };

    if (!existingBar) {
      barPayload.created_at = now.toISOString();
    }

    await supabaseFetch('bars', {
      method: 'POST',
      body: JSON.stringify(barPayload)
    });

    // 3. Inserisci in public.bar_members se abbiamo userId
    if (userId) {
      try {
        await supabaseFetch('bar_members', {
          method: 'POST',
          body: JSON.stringify({
            bar_id: barId,
            user_id: userId,
            role: 'owner',
            updated_at: now.toISOString()
          })
        });
      } catch (e) {
        console.warn('[Register Bar] Bar member insert note:', e.message);
      }
    }

    // 4. Inserisci / Aggiorna l'abbonamento con 14 giorni di prova in public.subscriptions
    const subPayload = {
      id: subId,
      bar_id: barId,
      plan_id: 'plan_barpilot_pro',
      status: existingBar ? existingBar.status === 'active' ? 'active' : 'trialing' : 'trialing',
      trial_start: now.toISOString(),
      trial_end: trialEnd.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: trialEnd.toISOString(),
      payment_method: 'Stripe / Carta (14gg Trial)',
      updated_at: now.toISOString()
    };

    if (!existingBar) {
      subPayload.created_at = now.toISOString();
    }

    await supabaseFetch('subscriptions', {
      method: 'POST',
      body: JSON.stringify(subPayload)
    });

    // 5. Registra l'azione in public.admin_audit_logs
    try {
      await supabaseFetch('admin_audit_logs', {
        method: 'POST',
        body: JSON.stringify({
          id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          admin_id: 'system_registration',
          action: existingBar ? 'bar_profile_updated' : 'bar_registered_trial',
          entity_type: 'bar',
          entity_id: barId,
          new_values: {
            name: cleanBarName,
            email: normalizedEmail,
            phone: cleanPhone,
            city: cleanCity,
            trial_days: 14,
            trial_end: trialEnd.toISOString()
          },
          created_at: now.toISOString()
        })
      });

      // 5b. Registra notifica per il Super Admin in public.admin_notifications
      await supabaseFetch('admin_notifications', {
        method: 'POST',
        body: JSON.stringify({
          id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
          title: 'Nuovo bar registrato',
          message: `${cleanBarName} (${cleanCity}) si è registrato e ha attivato i 14 giorni di prova gratuita.`,
          type: 'success',
          link: '#view-bars',
          created_at: now.toISOString()
        })
      });
    } catch (e) {}

    // 6. Tenta l'invio dell'email di benvenuto
    try {
      const appHost = req.headers.origin || `https://${req.headers.host}` || 'https://www.barpilot.eu';
      await fetch(`${appHost}/api/send-welcome-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: cleanOwner,
          barName: cleanBarName,
          email: normalizedEmail,
          phone: cleanPhone,
          city: cleanCity,
          appUrl: appHost
        })
      });
    } catch (e) {
      console.warn('[Register Bar] Invio welcome email saltato:', e.message);
    }

    console.log(`[Register Bar] ✅ Bar registrato con successo: ${barId} (Trial fino al ${trialEnd.toLocaleDateString('it-IT')})`);

    return res.status(200).json({
      success: true,
      barId,
      subscriptionId: subId,
      trialEnd: trialEnd.toISOString(),
      trialDaysRemaining: 14,
      status: 'trial'
    });
  } catch (err) {
    console.error('[Register Bar] ❌ Errore interno:', err);
    return res.status(500).json({ error: err.message || 'Errore interno del server durante la registrazione del bar.' });
  }
}
