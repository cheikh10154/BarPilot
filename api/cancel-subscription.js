// api/cancel-subscription.js - Vercel Serverless Function (Node.js)
// Gestione cancellazione/disdetta abbonamento BarPilot
// Aggiorna Supabase (subscriptions, bars, admin_audit_logs) e Stripe se configurato

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
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const {
      barId,
      barName,
      email,
      reason = 'Richiesta disdetta da console utente',
      subscriptionId
    } = body;

    const now = new Date();
    let updatedSubscription = null;

    // 1. Cerca l'abbonamento attivo su Supabase
    let query = 'subscriptions?order=created_at.desc&limit=1';
    if (subscriptionId) {
      query = `subscriptions?id=eq.${encodeURIComponent(subscriptionId)}`;
    } else if (barId) {
      query = `subscriptions?bar_id=eq.${encodeURIComponent(barId)}&order=created_at.desc&limit=1`;
    }

    const subRes = await supabaseFetch(query);
    if (subRes.ok) {
      const rows = await subRes.json();
      if (rows && rows.length > 0) {
        const sub = rows[0];
        
        // 2. Se Stripe è configurato e c'è uno stripe_subscription_id, disdici a fine periodo su Stripe
        if (process.env.STRIPE_SECRET_KEY && sub.stripe_subscription_id) {
          try {
            const Stripe = require('stripe');
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
            await stripe.subscriptions.update(sub.stripe_subscription_id, {
              cancel_at_period_end: true,
              cancellation_details: {
                comment: reason.substring(0, 500)
              }
            });
          } catch (stripeErr) {
            console.error('[Stripe Cancel Warning]', stripeErr.message);
          }
        }

        // 3. Disdetta: quando un utente disdice, tutto il sito gli viene bloccato (accesso solo al menu Abbonamenti)
        const patchRes = await supabaseFetch(`subscriptions?id=eq.${encodeURIComponent(sub.id)}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'canceled',
            cancel_at_period_end: true,
            cancel_requested_at: now.toISOString(),
            cancellation_reason: reason,
            updated_at: now.toISOString()
          })
        });

        if (patchRes.ok) {
          const patchRows = await patchRes.json();
          updatedSubscription = patchRows && patchRows.length > 0 ? patchRows[0] : sub;
        }

        // 4. Aggiorna la tabella public.bars senza cancellare alcun dato (stato canceled)
        const targetBarId = sub.bar_id || barId;
        if (targetBarId) {
          await supabaseFetch(`bars?id=eq.${encodeURIComponent(targetBarId)}`, {
            method: 'PATCH',
            body: JSON.stringify({
              cancel_at_period_end: true,
              status: 'canceled',
              updated_at: now.toISOString()
            })
          });
        }
      }
    }

    // 5. Registra log di audit
    try {
      await supabaseFetch('admin_audit_logs', {
        method: 'POST',
        body: JSON.stringify({
          id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          admin_id: email || barId || 'utente_gestionale',
          action: 'subscription_cancelled',
          entity_type: 'subscription',
          entity_id: barId || subscriptionId || 'bar_sub',
          details: JSON.stringify({
            barName: barName || 'Bar Centrale',
            email: email || '',
            reason: reason,
            cancelled_at: now.toISOString()
          }),
          created_at: now.toISOString()
        })
      });

      // 5b. Notifica per il Super Admin in public.admin_notifications
      await supabaseFetch('admin_notifications', {
        method: 'POST',
        body: JSON.stringify({
          id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
          title: `Disdetta abbonamento: ${barName || 'Bar'}`,
          message: `${barName || 'Un bar'} ha richiesto la disdetta dell'abbonamento. Motivo: "${reason || 'Non specificato'}".`,
          type: 'warning',
          link: '#view-subscriptions',
          created_at: now.toISOString()
        })
      });
    } catch (auditErr) {
      console.warn('[Audit Log Warning]', auditErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Abbonamento disdetto con successo. Il tuo account BarPilot non è più attivo; puoi accedere solo alla sezione Abbonamenti per riattivare il tuo abbonamento.',
      cancelled_at: now.toISOString(),
      subscription: updatedSubscription
    });

  } catch (err) {
    console.error('[Cancel Subscription Error]', err);
    return res.status(500).json({ error: err.message || 'Errore interno durante la disdetta' });
  }
}
