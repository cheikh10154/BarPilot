// api/admin-api.js - Vercel Serverless Function (Node.js)
// Backend Enterprise protetto da PIN Super Admin (101540) e Supabase Service Role
// Gestisce in modo sicuro le operazioni amministrative centrali:
// 1. Iscrizione manuale di un nuovo Bar
// 2. Sospensione e riattivazione Bar
// 3. Risposta e risoluzione Ticket di Assistenza
// 4. Salvataggio Impostazioni di Piattaforma
// 5. Notifiche Amministrative Realtime
// 6. Gestione Codici Promozionali & Affiliazioni
// 7. Audit Logging immutabile

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cprxxxlgaofopmogeuer.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnh4eGxnYW9mb3Btb2dldWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4Mzg1OTQsImV4cCI6MjEwODQxNDU5NH0.wuB9OUgmYo8n1xeJsGl-YpyzVRwg8Sr4k3XAKaYltRI";
const SUPER_ADMIN_PIN = "101540";

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
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-pin, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verifica Autenticazione Super Admin con PIN 101540
  const pinHeader = req.headers['x-admin-pin'] || req.headers['x-super-admin-pin'];
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const pinParam = req.query.adminPin || body.adminPin || pinHeader;

  if (pinParam !== SUPER_ADMIN_PIN) {
    console.warn(`[Admin API] Tentativo di accesso non autorizzato con PIN errato.`);
    return res.status(401).json({
      error: 'Accesso negato. PIN Super Admin non valido o assente.'
    });
  }

  const action = req.query.action || body.action;

  try {
    switch (action) {
      // ----------------------------------------------------------------------
      // 1. CREAZIONE NUOVO BAR (+ INVITO AUTH + ABBONAMENTO PRO)
      // ----------------------------------------------------------------------
      case 'create_bar': {
        const {
          name,
          ownerName,
          email,
          phone,
          city,
          address,
          plan = 'BarPilot Pro',
          trialDays = 14
        } = body;

        const cleanEmail = (email || '').trim().toLowerCase();
        const cleanName = (name || '').trim();
        const cleanOwner = (ownerName || cleanName).trim();
        const cleanCity = (city || 'Roma').trim();
        const cleanPhone = (phone || '').trim();
        const cleanAddress = (address || `Via Centrale 1, ${cleanCity}`).trim();

        if (!cleanEmail || !cleanName) {
          return res.status(400).json({ error: 'Nome del Bar ed Email sono campi obbligatori.' });
        }

        const barId = 'bar_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
        const subId = 'sub_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);

        // 1. Invito Utente via Supabase Auth Admin API (se disponibile service role)
        let createdUserId = null;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || (SUPABASE_KEY.includes('service_role') ? SUPABASE_KEY : null);
        if (serviceRoleKey) {
          try {
            const inviteUrl = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/invite`;
            const invRes = await fetch(inviteUrl, {
              method: 'POST',
              headers: {
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                email: cleanEmail,
                data: {
                  full_name: cleanOwner,
                  bar_id: barId,
                  bar_name: cleanName
                }
              })
            });
            if (invRes.ok) {
              const invData = await invRes.json();
              createdUserId = invData.id;
            }
          } catch (invErr) {
            console.warn('[Admin API] Invito Supabase Auth non completato:', invErr.message);
          }
        }

        // 2. Inserimento record in public.bars
        const barPayload = {
          id: barId,
          owner_id: createdUserId,
          name: cleanName,
          business_name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          city: cleanCity,
          address: cleanAddress,
          status: 'trial',
          subscription_id: subId,
          notes: `Bar registrato dal Super Admin con 14 giorni di prova gratuita inclusa.`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const barRes = await supabaseFetch('bars', {
          method: 'POST',
          body: JSON.stringify(barPayload)
        });

        // 3. Inserimento in public.subscriptions
        const trialEnd = new Date(Date.now() + Number(trialDays) * 24 * 3600 * 1000).toISOString();
        const subPayload = {
          id: subId,
          bar_id: barId,
          plan_id: 'plan_barpilot_pro',
          status: 'trialing',
          trial_start: new Date().toISOString(),
          trial_end: trialEnd,
          current_period_start: new Date().toISOString(),
          current_period_end: trialEnd,
          cancel_at_period_end: false,
          payment_method: 'Stripe Billing (Carta / Google Pay)',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await supabaseFetch('subscriptions', {
          method: 'POST',
          body: JSON.stringify(subPayload)
        });

        // 4. Inserimento membro su public.bar_members se abbiamo userId
        if (createdUserId) {
          await supabaseFetch('bar_members', {
            method: 'POST',
            body: JSON.stringify({
              bar_id: barId,
              user_id: createdUserId,
              role: 'owner',
              created_at: new Date().toISOString()
            })
          });
        }

        // 5. Scrittura Audit Log
        await supabaseFetch('admin_audit_logs', {
          method: 'POST',
          body: JSON.stringify({
            id: 'log_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
            admin_id: 'cheikh_superadmin',
            action: 'superadmin_create_bar',
            entity_type: 'bar',
            entity_id: barId,
            new_values: { name: cleanName, email: cleanEmail, owner: cleanOwner, city: cleanCity }
          })
        });

        // 6. Generazione Notifica Super Admin
        await supabaseFetch('admin_notifications', {
          method: 'POST',
          body: JSON.stringify({
            id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
            title: 'Nuovo bar registrato',
            message: `${cleanName} (${cleanCity}) è stato registrato dal Super Admin con prova gratuita attiva.`,
            type: 'success',
            link: '#view-bars',
            created_at: new Date().toISOString()
          })
        });

        return res.status(200).json({
          success: true,
          bar: barPayload,
          subscription: subPayload,
          message: `Bar "${cleanName}" registrato con successo con piano Pro!`
        });
      }

      // ----------------------------------------------------------------------
      // 2. SOSPENSIONE / RIATTIVAZIONE BAR
      // ----------------------------------------------------------------------
      case 'toggle_bar_status': {
        const { barId, newStatus } = body;
        if (!barId || !newStatus) {
          return res.status(400).json({ error: 'barId e newStatus sono obbligatori.' });
        }

        const validStatuses = ['active', 'trial', 'past_due', 'suspended', 'cancelled'];
        if (!validStatuses.includes(newStatus)) {
          return res.status(400).json({ error: 'Stato non valido.' });
        }

        // Recupera bar attuale per il nome
        let barName = barId;
        const bRes = await supabaseFetch(`bars?id=eq.${barId}&select=name`);
        if (bRes.ok) {
          const bars = await bRes.json();
          if (bars.length > 0) barName = bars[0].name;
        }

        // Aggiorna tabella bars
        await supabaseFetch(`bars?id=eq.${barId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: newStatus,
            updated_at: new Date().toISOString()
          })
        });

        // Registra Audit Log
        await supabaseFetch('admin_audit_logs', {
          method: 'POST',
          body: JSON.stringify({
            id: 'log_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
            admin_id: 'cheikh_superadmin',
            action: 'superadmin_toggle_bar_status',
            entity_type: 'bar',
            entity_id: barId,
            new_values: { status: newStatus }
          })
        });

        // Genera notifica
        const isSuspended = newStatus === 'suspended';
        await supabaseFetch('admin_notifications', {
          method: 'POST',
          body: JSON.stringify({
            id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
            title: isSuspended ? 'Bar sospeso' : 'Bar riattivato',
            message: `Lo stato del bar ${barName} è stato modificato in "${newStatus}".`,
            type: isSuspended ? 'warning' : 'success',
            link: '#view-bars',
            created_at: new Date().toISOString()
          })
        });

        return res.status(200).json({
          success: true,
          message: `Stato del bar aggiornato a "${newStatus}".`
        });
      }

      // ----------------------------------------------------------------------
      // 3. RISPOSTA TICKET DI ASSISTENZA
      // ----------------------------------------------------------------------
      case 'reply_ticket': {
        const { ticketId, replyMessage, newStatus = 'resolved' } = body;
        if (!ticketId || !replyMessage) {
          return res.status(400).json({ error: 'ticketId e replyMessage sono obbligatori.' });
        }

        // 1. Aggiorna lo stato del ticket in support_tickets
        const updatePayload = {
          response: replyMessage,
          response_at: new Date().toISOString(),
          status: newStatus,
          updated_at: new Date().toISOString()
        };
        if (newStatus === 'resolved' || newStatus === 'closed') {
          updatePayload.resolved_at = new Date().toISOString();
        }

        await supabaseFetch(`support_tickets?id=eq.${ticketId}`, {
          method: 'PATCH',
          body: JSON.stringify(updatePayload)
        });

        // 2. Inserisci il messaggio di risposta dell'Admin in support_messages
        await supabaseFetch('support_messages', {
          method: 'POST',
          body: JSON.stringify({
            id: 'msg_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
            ticket_id: ticketId,
            sender_name: 'Assistenza Super Admin BarPilot',
            message: replyMessage,
            is_admin: true,
            created_at: new Date().toISOString()
          })
        });

        // 3. Scrivi Audit Log
        await supabaseFetch('admin_audit_logs', {
          method: 'POST',
          body: JSON.stringify({
            id: 'log_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
            admin_id: 'cheikh_superadmin',
            action: 'superadmin_reply_ticket',
            entity_type: 'support_ticket',
            entity_id: ticketId,
            new_values: { status: newStatus, replyLength: replyMessage.length }
          })
        });

        return res.status(200).json({
          success: true,
          message: 'Risposta inviata con successo e ticket aggiornato.'
        });
      }

      // ----------------------------------------------------------------------
      // 4. NOTIFICHE AMMINISTRATIVE (Fetch & Mark Read)
      // ----------------------------------------------------------------------
      case 'get_notifications': {
        const notifRes = await supabaseFetch('admin_notifications?select=*&order=created_at.desc&limit=30');
        if (!notifRes.ok) {
          return res.status(200).json({ notifications: [] });
        }
        const notifications = await notifRes.json();
        return res.status(200).json({ notifications });
      }

      case 'mark_notifications_read': {
        const { notificationId } = body;
        if (notificationId && notificationId !== 'all') {
          await supabaseFetch(`admin_notifications?id=eq.${notificationId}`, {
            method: 'PATCH',
            body: JSON.stringify({ is_read: true })
          });
        } else {
          await supabaseFetch('admin_notifications?is_read=eq.false', {
            method: 'PATCH',
            body: JSON.stringify({ is_read: true })
          });
        }
        return res.status(200).json({ success: true });
      }

      // ----------------------------------------------------------------------
      // 5. SALVATAGGIO IMPOSTAZIONI PIATTAFORMA
      // ----------------------------------------------------------------------
      case 'save_settings': {
        const { settings } = body;
        if (!settings || typeof settings !== 'object') {
          return res.status(400).json({ error: 'Oggetto settings mancante o non valido.' });
        }

        for (const [key, val] of Object.entries(settings)) {
          await supabaseFetch('admin_settings', {
            method: 'POST',
            body: JSON.stringify({
              setting_key: key,
              setting_value: String(val),
              updated_by: 'Cheikh Gueye',
              updated_at: new Date().toISOString()
            })
          });
        }

        await supabaseFetch('admin_audit_logs', {
          method: 'POST',
          body: JSON.stringify({
            id: 'log_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
            admin_id: 'cheikh_superadmin',
            action: 'superadmin_save_settings',
            entity_type: 'settings',
            entity_id: 'admin_settings',
            new_values: settings
          })
        });

        return res.status(200).json({
          success: true,
          message: 'Impostazioni salvate con successo su Supabase.'
        });
      }

      // ----------------------------------------------------------------------
      // 6. CODICI PROMOZIONALI & AFFILIAZIONI
      // ----------------------------------------------------------------------
      case 'get_promo_codes': {
        const pRes = await supabaseFetch('promo_codes?select=*&order=created_at.desc');
        const rRes = await supabaseFetch('promo_redemptions?select=*&order=redeemed_at.desc&limit=50');
        const aRes = await supabaseFetch('affiliates?select=*&order=created_at.desc');
        
        const promoCodes = pRes.ok ? await pRes.json() : [];
        const redemptions = rRes.ok ? await rRes.json() : [];
        const affiliates = aRes.ok ? await aRes.json() : [];

        return res.status(200).json({
          success: true,
          promoCodes,
          redemptions,
          affiliates
        });
      }

      case 'create_promo_code': {
        const {
          code,
          description,
          discountPercent = 15,
          partnerName = 'Partner BarPilot',
          maxUses = 500
        } = body;

        const cleanCode = (code || '').trim().toUpperCase();
        if (!cleanCode) {
          return res.status(400).json({ error: 'Il codice promozionale è obbligatorio.' });
        }

        const promoPayload = {
          id: 'prm_' + Date.now().toString(36),
          code: cleanCode,
          description: description || `Sconto del ${discountPercent}% BarPilot Pro`,
          discount_percent: Number(discountPercent),
          partner_name: partnerName,
          max_uses: Number(maxUses),
          current_uses: 0,
          active: true,
          created_at: new Date().toISOString()
        };

        await supabaseFetch('promo_codes', {
          method: 'POST',
          body: JSON.stringify(promoPayload)
        });

        await supabaseFetch('admin_audit_logs', {
          method: 'POST',
          body: JSON.stringify({
            id: 'log_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
            admin_id: 'cheikh_superadmin',
            action: 'create_promo_code',
            entity_type: 'promo_code',
            entity_id: cleanCode,
            new_values: promoPayload
          })
        });

        return res.status(200).json({
          success: true,
          promoCode: promoPayload,
          message: `Codice ${cleanCode} creato con successo!`
        });
      }

      default:
        return res.status(400).json({ error: `Azione "${action}" non riconosciuta.` });
    }
  } catch (err) {
    console.error(`[Admin API Error]`, err);
    return res.status(500).json({ error: 'Errore interno del server.', details: err.message });
  }
}
