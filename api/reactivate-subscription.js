// api/reactivate-subscription.js - Vercel Serverless Function (Node.js)
// Riattivazione abbonamento BarPilot collegando Stripe Billing e Supabase

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
      email,
      subscriptionId,
      paymentIntentId
    } = body;

    const now = new Date();
    let updatedSubscription = null;
    let stripeReactivated = false;
    let requiresNewPayment = false;

    // 1. Cerca l'abbonamento su Supabase
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

        // 2. Se Stripe è configurato e c'è uno stripe_subscription_id
        if (process.env.STRIPE_SECRET_KEY && sub.stripe_subscription_id) {
          try {
            const Stripe = require('stripe');
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

            const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
            if (stripeSub && (stripeSub.status === 'active' || stripeSub.status === 'trialing')) {
              // Se la sottoscrizione Stripe è ancora attiva con cancel_at_period_end: annulla la disdetta
              await stripe.subscriptions.update(sub.stripe_subscription_id, {
                cancel_at_period_end: false
              });
              stripeReactivated = true;
            } else if (stripeSub && stripeSub.status === 'canceled') {
              requiresNewPayment = true;
            }
          } catch (stripeErr) {
            console.warn('[Stripe Reactivate Warning]', stripeErr.message);
          }
        }

        // Se è stato passato un paymentIntentId confermato da Stripe
        if (paymentIntentId && process.env.STRIPE_SECRET_KEY) {
          try {
            const Stripe = require('stripe');
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
            const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
            if (pi && pi.status === 'succeeded') {
              stripeReactivated = true;
              requiresNewPayment = false;
            }
          } catch (piErr) {
            console.warn('[Stripe PI Warning]', piErr.message);
          }
        }

        if (!requiresNewPayment) {
          // 3. Aggiorna record su Supabase: ripristina status active e cancel_at_period_end: false
          const patchRes = await supabaseFetch(`subscriptions?id=eq.${encodeURIComponent(sub.id)}`, {
            method: 'PATCH',
            body: JSON.stringify({
              status: 'active',
              cancel_at_period_end: false,
              cancelled_at: null,
              cancellation_reason: null,
              current_period_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
              updated_at: now.toISOString()
            })
          });

          if (patchRes.ok) {
            const patchRows = await patchRes.json();
            updatedSubscription = patchRows && patchRows.length > 0 ? patchRows[0] : sub;
          }

          // 4. Aggiorna tabella public.bars
          const targetBarId = sub.bar_id || barId;
          if (targetBarId) {
            await supabaseFetch(`bars?id=eq.${encodeURIComponent(targetBarId)}`, {
              method: 'PATCH',
              body: JSON.stringify({
                status: 'active',
                cancel_at_period_end: false,
                updated_at: now.toISOString()
              })
            });
          }
        }
      }
    }

    if (requiresNewPayment) {
      return res.status(200).json({
        success: true,
        reactivated: false,
        requiresNewPayment: true,
        message: 'Il periodo precedente è terminato. Aggiungi un metodo di pagamento per riattivare l\'abbonamento.'
      });
    }

    // 5. Registra log di audit
    try {
      await supabaseFetch('admin_audit_logs', {
        method: 'POST',
        body: JSON.stringify({
          id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          admin_id: email || barId || 'utente_gestionale',
          action: 'subscription_reactivated',
          entity_type: 'subscription',
          entity_id: barId || subscriptionId || 'bar_sub',
          details: JSON.stringify({
            email: email || '',
            reactivated_at: now.toISOString()
          }),
          created_at: now.toISOString()
        })
      });

      // 5b. Notifica per il Super Admin in public.admin_notifications
      await supabaseFetch('admin_notifications', {
        method: 'POST',
        body: JSON.stringify({
          id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
          title: `Abbonamento riattivato: ${barId || 'Bar'}`,
          message: `L'abbonamento per ${email || barId} è stato riattivato con successo. Accesso completo ripristinato.`,
          type: 'success',
          link: '#view-subscriptions',
          created_at: now.toISOString()
        })
      });
    } catch (_) {}

    return res.status(200).json({
      success: true,
      reactivated: true,
      isAccessActive: true,
      message: 'Abbonamento riattivato con successo! Accesso completo a tutte le funzionalità ripristinato.',
      subscription: updatedSubscription
    });

  } catch (err) {
    console.error('[Reactivate Subscription Error]', err);
    return res.status(500).json({ error: err.message || 'Errore durante la riattivazione' });
  }
}
