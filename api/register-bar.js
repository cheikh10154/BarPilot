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

// Helper: Genera codice unico e permanente di 6 caratteri alfanumerici maiuscoli
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

function generateUniqueCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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
          // Solo le registrazioni fatte su /app sono considerati bar; le iscrizioni su /app/affiliazioni sono semplici utenti
          const barUsersList = usersList.filter(u => {
            const meta = u.user_metadata || u.raw_user_meta_data || {};
            if (meta.account_type === 'affiliate' || meta.registered_from === 'affiliazioni' || meta.is_bar === false || u.is_bar === false) return false;
            if ((meta.affiliate_code || meta.affiliate_id) && !meta.bar_name && !meta.barName && !meta["Nome bar"] && !meta.bar_registered_id && !u.bar_name && !u.business_name) return false;
            return true;
          });
          return res.status(200).json({
            success: true,
            source: 'auth.users',
            total: barUsersList.length,
            users: barUsersList
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
        const filteredView = (viewUsers || []).filter(u => {
          const meta = u.user_metadata || u.raw_user_meta_data || {};
          if (meta.account_type === 'affiliate' || meta.registered_from === 'affiliazioni' || meta.is_bar === false || u.is_bar === false) return false;
          if ((meta.affiliate_code || meta.affiliate_id) && !meta.bar_name && !meta.barName && !meta["Nome bar"] && !meta.bar_registered_id && !u.bar_name && !u.business_name) return false;
          return true;
        });
        return res.status(200).json({
          success: true,
          source: 'public.auth_users',
          users: filteredView
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

    // 1. Controllo Idempotenza e Antifrode: Cerca se il bar esiste già per questa email o Partita IVA
    let existingBar = null;
    let isDuplicateVat = false;
    const findRes = await supabaseFetch(`bars?email=eq.${encodeURIComponent(normalizedEmail)}&select=*`);
    if (findRes.ok) {
      const rows = await findRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        existingBar = rows[0];
        console.log(`[Register Bar] Bar esistente trovato (ID: ${existingBar.id}). Operazione idempotente (nessun doppio bonus).`);
      }
    }

    let cachedAuthUsers = null;
    if (serviceRoleKey) {
      try {
        const authUsersRes = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users?page=1&per_page=500`, {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          }
        });
        if (authUsersRes.ok) {
          const auData = await authUsersRes.json();
          cachedAuthUsers = auData.users || (Array.isArray(auData) ? auData : []);
          if (!existingBar) {
            const authBarUser = cachedAuthUsers.find(u => (u.email || '').toLowerCase() === normalizedEmail && u.user_metadata?.bar_registered_id);
            if (authBarUser) {
              existingBar = {
                id: authBarUser.user_metadata.bar_registered_id,
                status: 'trial',
                subscription_id: authBarUser.user_metadata.bar_subscription_id || null,
                invite_code: authBarUser.user_metadata.invite_code || null
              };
            }
          }
          if (cleanVat) {
            const normVat = cleanVat.replace(/\s+/g, '').toUpperCase();
            const vatAuthDup = cachedAuthUsers.find(u =>
              (u.email || '').toLowerCase() !== normalizedEmail &&
              (u.user_metadata?.vat_number || '').replace(/\s+/g, '').toUpperCase() === normVat
            );
            if (vatAuthDup) isDuplicateVat = true;
          }
        }
      } catch (_) {}
    }

    if (cleanVat && !isDuplicateVat) {
      try {
        const vatRes = await supabaseFetch(`bars?vat_number=eq.${encodeURIComponent(cleanVat)}&select=id,email&limit=1`);
        if (vatRes.ok) {
          const vatRows = await vatRes.json();
          if (Array.isArray(vatRows) && vatRows.length > 0 && vatRows[0].email?.toLowerCase() !== normalizedEmail) {
            isDuplicateVat = true;
          }
        }
      } catch (_) {}
    }

    // 1b. Verifica preliminare codice affiliazione/partner (Supabase SQL, auth.users e /api/affiliates + anti auto-affiliazione)
    const appHost = req.headers.origin || `https://${req.headers.host}` || 'https://www.barpilot.eu';
    let matchedAffiliate = null;
    if (cleanInviteCode && !existingBar) {
      const codeUpper = cleanInviteCode.toUpperCase();
      try {
        const affRes = await supabaseFetch(`affiliates?code=eq.${encodeURIComponent(codeUpper)}&limit=1`);
        if (affRes.ok) {
          const affRows = await affRes.json();
          if (affRows && affRows.length > 0) matchedAffiliate = affRows[0];
        }
      } catch (_) {}

      // Fallback 1: cerca tra gli utenti Supabase Authentication > Users
      if (!matchedAffiliate && Array.isArray(cachedAuthUsers)) {
        const foundUser = cachedAuthUsers.find(u => {
          const metaCode = (u.user_metadata?.affiliate_code || '').toUpperCase();
          return metaCode === codeUpper || (u.email && getConsistentCodeForAccount(u.email) === codeUpper);
        });
        if (foundUser) {
          const meta = foundUser.user_metadata || {};
          matchedAffiliate = {
            id: meta.affiliate_id || ('aff_' + foundUser.id.replace(/-/g, '').slice(0, 12)),
            user_id: foundUser.id,
            email: (foundUser.email || '').toLowerCase(),
            phone: meta.affiliate_phone || foundUser.phone || meta.phone || '',
            code: (meta.affiliate_code || codeUpper).toUpperCase(),
            status: meta.affiliate_status || 'active',
            _authUser: foundUser
          };
        }
      }

      // Fallback 2: verifica via /api/affiliates (verify_code)
      if (!matchedAffiliate) {
        try {
          const verifyRes = await fetch(`${appHost}/api/affiliates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'verify_code', code: codeUpper })
          });
          if (verifyRes.ok) {
            const vData = await verifyRes.json();
            if (vData && vData.valid) {
              matchedAffiliate = {
                id: vData.affiliate_id,
                user_id: vData.user_id || null,
                email: (vData.email || '').toLowerCase(),
                phone: vData.phone || '',
                code: vData.code,
                status: vData.status || 'active'
              };
            } else if (vData && vData.status === 'suspended') {
              matchedAffiliate = { status: 'suspended', code: codeUpper };
            }
          }
        } catch (_) {}
      }

      if (matchedAffiliate) {
        const affEmail = (matchedAffiliate.email || '').trim().toLowerCase();
        const affPhone = (matchedAffiliate.phone || '').replace(/\D/g, '');
        const regPhoneDigits = cleanPhone.replace(/\D/g, '');
        const isSelfReferral = (
          (affEmail && affEmail === normalizedEmail) ||
          (userId && matchedAffiliate.user_id && matchedAffiliate.user_id === userId) ||
          (regPhoneDigits && affPhone && regPhoneDigits === affPhone)
        );
        if (isSelfReferral) {
          return res.status(400).json({
            error: 'Non puoi utilizzare il tuo stesso codice affiliazione per auto-affiliarti.',
            code: 'self_affiliation'
          });
        }
        if (matchedAffiliate.status === 'suspended') {
          return res.status(400).json({
            error: 'Il codice partner inserito è attualmente sospeso e non può essere utilizzato.',
            code: 'suspended_affiliate'
          });
        }
      } else if (/^[A-Z0-9]{6}$/.test(codeUpper)) {
        // Verifica se è un codice promo di marketing (es. INVITO10 / BARPILOT2026); altrimenti segnala codice partner non valido
        let isMarketingPromo = false;
        try {
          const prRes = await supabaseFetch(`promo_codes?code=eq.${encodeURIComponent(codeUpper)}&is_active=eq.true&limit=1`);
          if (prRes.ok) {
            const prRows = await prRes.json();
            if (prRows && prRows.length > 0) isMarketingPromo = true;
          }
        } catch (_) {}
        if (!isMarketingPromo) {
          return res.status(400).json({
            error: 'Codice partner non valido o non trovato. Controlla il codice di 6 caratteri o lascia il campo vuoto.',
            code: 'invalid_affiliate_code'
          });
        }
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
      notes: cleanInviteCode ? `Registrato da ${cleanOwner} - Codice partner/promo: ${cleanInviteCode.toUpperCase()}` : `Registrato da ${cleanOwner} - Prova 14 giorni`,
      invite_code: existingBar ? existingBar.invite_code : (cleanInviteCode ? cleanInviteCode.toUpperCase() : null),
      referred_by_affiliate_id: existingBar ? existingBar.referred_by_affiliate_id : (matchedAffiliate ? matchedAffiliate.id : null),
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
      status: existingBar ? (existingBar.status === 'active' ? 'active' : 'trialing') : 'trialing',
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

    // 4b. Collegamento Programma Affiliazione & Accredito Automatico +5,00 € (solo prima registrazione valida)
    let referralCredited = false;
    let bonusAmount = 0.00;
    let duplicateBlocked = Boolean(existingBar || isDuplicateVat);

    if (matchedAffiliate && !existingBar && !isDuplicateVat) {
      try {
        // Verifica idempotenza su Supabase (nessun referral o bonus preesistente per questo bar o email)
        let alreadyReferred = false;
        try {
          const checkRefRes = await supabaseFetch(`affiliate_referrals?or=(referred_bar_id.eq.${encodeURIComponent(barId)},referred_email.eq.${encodeURIComponent(normalizedEmail)})&limit=1`);
          if (checkRefRes.ok) {
            const refRows = await checkRefRes.json();
            if (Array.isArray(refRows) && refRows.length > 0) alreadyReferred = true;
          }
        } catch (_) {}

        if (alreadyReferred) {
          duplicateBlocked = true;
          console.log(`[Register Bar] Referral già esistente per ${normalizedEmail}. Nessun doppio bonus accreditato.`);
        } else {
          // 1) Tenta transazione atomica RPC su Supabase
          let rpcHandled = false;
          try {
            const rpcRes = await supabaseFetch('rpc/process_affiliate_registration_bonus', {
              method: 'POST',
              body: JSON.stringify({
                p_affiliate_code: matchedAffiliate.code,
                p_bar_id: barId,
                p_bar_name: cleanBarName,
                p_user_id: userId || '',
                p_email: normalizedEmail,
                p_phone: cleanPhone,
                p_vat: cleanVat
              })
            });
            if (rpcRes.ok) {
              const rpcData = await rpcRes.json();
              rpcHandled = true;
              if (rpcData && !rpcData.already_credited && Number(rpcData.bonus_credited) > 0) {
                referralCredited = true;
                bonusAmount = Number(rpcData.bonus_credited);
              } else if (rpcData && rpcData.already_credited) {
                duplicateBlocked = true;
              }
            }
          } catch (_) {}

          // 2) Fallback REST + Sync su auth.users & /api/affiliates se RPC non ancora installato su DB
          if (!rpcHandled) {
            const referralId = 'ref_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
            const referralPayload = {
              id: referralId,
              affiliate_id: matchedAffiliate.id,
              affiliate_code: matchedAffiliate.code,
              referred_bar_id: barId,
              referred_bar_name: cleanBarName,
              referred_user_id: userId || null,
              referred_email: normalizedEmail,
              referred_vat: cleanVat || null,
              status: 'trial', // +1 in periodo di prova (14 giorni)
              trial_start_date: now.toISOString(),
              trial_end_date: trialEnd.toISOString(),
              cancel_at_period_end: false,
              bonus_amount: 5.00,
              registered_at: now.toISOString(),
              created_at: now.toISOString(),
              updated_at: now.toISOString()
            };

            const commId = 'comm_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
            const commissionPayload = {
              id: commId,
              affiliate_id: matchedAffiliate.id,
              affiliate_code: matchedAffiliate.code,
              referral_id: referralId,
              bar_id: barId,
              bar_name: cleanBarName,
              bonus_type: 'registration',
              amount: 5.00,
              currency: 'EUR',
              status: 'pending', // REGOLA: finché in periodo di prova (< 14 giorni), i 5€ restano in attesa (NON accreditati al saldo disponibile)
              notes: 'Bonus 5,00 € in attesa: verrà accreditato al superamento dei 14 giorni di prova con abbonamento attivo',
              trial_end_date: trialEnd.toISOString(),
              available_at: null,
              created_at: now.toISOString(),
              updated_at: now.toISOString()
            };

            const refPost = await supabaseFetch('affiliate_referrals', {
              method: 'POST',
              headers: { 'Prefer': 'resolution=ignore-duplicates,return=representation' },
              body: JSON.stringify(referralPayload)
            });

            if (refPost.ok) {
              const insertedRefs = await refPost.json();
              if (Array.isArray(insertedRefs) && insertedRefs.length > 0) {
                commissionPayload.referral_id = insertedRefs[0].id || referralId;
                const commPost = await supabaseFetch('affiliate_commissions', {
                  method: 'POST',
                  headers: { 'Prefer': 'resolution=ignore-duplicates,return=representation' },
                  body: JSON.stringify(commissionPayload)
                });

                if (commPost.ok) {
                  referralCredited = true;
                  bonusAmount = 5.00;

                  // Aggiorna saldo reale su public.affiliates calcolato dalle commissioni
                  try {
                    const allCommRes = await supabaseFetch(`affiliate_commissions?affiliate_id=eq.${encodeURIComponent(matchedAffiliate.id)}&select=amount,status`);
                    if (allCommRes.ok) {
                      const allComms = await allCommRes.json();
                      let avail = 0, pend = 0, earned = 0;
                      (allComms || []).forEach(c => {
                        const a = parseFloat(c.amount) || 0;
                        if (c.status === 'available') { avail += a; earned += a; }
                        else if (c.status === 'pending') { pend += a; earned += a; }
                        else if (c.status === 'paid') { earned += a; }
                      });
                      await supabaseFetch(`affiliates?id=eq.${encodeURIComponent(matchedAffiliate.id)}`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                          available_balance: avail.toFixed(2),
                          pending_balance: pend.toFixed(2),
                          total_earned: earned.toFixed(2),
                          updated_at: now.toISOString()
                        })
                      });
                    }
                  } catch (_) {}
                }
              }
            } else {
              // Tabelle SQL non ancora create: sincronizza via /api/affiliates & auth.users in modo idempotente
              try {
                const syncRes = await fetch(`${appHost}/api/affiliates`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-admin-pin': '101540'
                  },
                  body: JSON.stringify({
                    action: 'record_referral_bonus',
                    affiliateEmail: matchedAffiliate.email || '',
                    affiliateCode: matchedAffiliate.code,
                    referral: referralPayload,
                    commission: commissionPayload
                  })
                });
                if (syncRes.ok) {
                  const sData = await syncRes.json();
                  if (sData.already_credited) {
                    duplicateBlocked = true;
                  } else if (Number(sData.bonus_credited) > 0) {
                    referralCredited = true;
                    bonusAmount = Number(sData.bonus_credited);
                  }
                }
              } catch (_) {}
            }
          }

          if (referralCredited) {
            console.log(`[Register Bar] ✅ Bar ${cleanBarName} collegato all'affiliato ${matchedAffiliate.code} (+1 in prova, 5,00 € in attesa al superamento dei 14 giorni con abbonamento attivo)`);
          }
        }
      } catch (affErr) {
        console.warn('[Register Bar] Errore collegamento affiliato:', affErr.message);
      }
    }

    // 4c. Attribuzione codice unico e univoco modificabile su Database (Supabase) per l'account registrato
    let accountAffiliateCode = null;
    try {
      const existingAffRes = await supabaseFetch(`affiliates?email=eq.${encodeURIComponent(normalizedEmail)}&limit=1`);
      if (existingAffRes.ok) {
        const rows = await existingAffRes.json();
        if (rows && rows.length > 0) {
          accountAffiliateCode = rows[0].code;
        }
      }

      if (!accountAffiliateCode) {
        let newCode = getConsistentCodeForAccount(normalizedEmail);

        const affPayload = {
          id: 'aff_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
          user_id: userId || null,
          bar_id: barId,
          name: cleanOwner || cleanBarName,
          email: normalizedEmail,
          phone: cleanPhone || '',
          code: newCode, // Salvato in colonna code su public.affiliates (modificabile a Database)
          status: 'active',
          commission_rate: 5.00,
          total_earned: 0.00,
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        };

        await supabaseFetch('affiliates', {
          method: 'POST',
          body: JSON.stringify(affPayload)
        });
        accountAffiliateCode = newCode;
        console.log(`[Register Bar] 🎁 Assegnato codice affiliazione univoco ${newCode} all'account ${normalizedEmail}`);
      }

      // Salva il codice anche nel record del bar e in auth.users metadata
      if (accountAffiliateCode) {
        await supabaseFetch(`bars?id=eq.${encodeURIComponent(barId)}`, {
          method: 'PATCH',
          body: JSON.stringify({ affiliate_code: accountAffiliateCode, updated_at: now.toISOString() })
        });
        if (serviceRoleKey) {
          try {
            const matchedBarUser = Array.isArray(cachedAuthUsers)
              ? cachedAuthUsers.find(u => (userId && u.id === userId) || (u.email || '').toLowerCase() === normalizedEmail)
              : null;
            const targetAuthId = userId || (matchedBarUser && matchedBarUser.id);
            const metaUpdate = {
              ...(matchedBarUser?.user_metadata || {}),
              bar_registered_id: barId,
              bar_name: cleanBarName,
              account_type: 'bar',
              registered_from: 'app',
              is_bar: true,
              bar_subscription_id: subId,
              vat_number: cleanVat || null,
              affiliate_code: accountAffiliateCode,
              affiliate_name: cleanOwner || cleanBarName,
              affiliate_phone: cleanPhone || '',
              affiliate_status: 'active'
            };
            if (targetAuthId) {
              await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users/${encodeURIComponent(targetAuthId)}`, {
                method: 'PUT',
                headers: {
                  'apikey': serviceRoleKey,
                  'Authorization': `Bearer ${serviceRoleKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_metadata: metaUpdate })
              });
            } else {
              await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users`, {
                method: 'POST',
                headers: {
                  'apikey': serviceRoleKey,
                  'Authorization': `Bearer ${serviceRoleKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  email: normalizedEmail,
                  password: 'BpBar_' + Math.random().toString(36).slice(2, 12) + '!1A',
                  email_confirm: true,
                  user_metadata: metaUpdate
                })
              });
            }
          } catch (_) {}
        }
      }
    } catch (codeErr) {
      console.warn('[Register Bar] Assegnazione codice affiliato:', codeErr.message);
    }

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

    // 6. Tenta l'invio dell'email di benvenuto solo alla prima registrazione
    if (!existingBar) {
      try {
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
    }

    console.log(`[Register Bar] ✅ Bar registrato con successo: ${barId} (Trial fino al ${trialEnd.toLocaleDateString('it-IT')})`);

    return res.status(200).json({
      success: true,
      barId,
      subscriptionId: subId,
      affiliateCode: accountAffiliateCode,
      alreadyRegistered: Boolean(existingBar),
      referralCredited,
      bonusAmount,
      duplicateBlocked,
      referrerCode: matchedAffiliate ? matchedAffiliate.code : null,
      trialEnd: trialEnd.toISOString(),
      trialDaysRemaining: 14,
      status: existingBar ? existingBar.status : 'trial'
    });
  } catch (err) {
    console.error('[Register Bar] ❌ Errore interno:', err);
    return res.status(500).json({ error: err.message || 'Errore interno del server durante la registrazione del bar.' });
  }
}
