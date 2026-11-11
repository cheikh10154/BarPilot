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
    const isReactivate = (req.url && req.url.includes('reactivate')) || body.action === 'reactivate';
    if (isReactivate) {
      return await handleReactivation(body, res);
    }

    const {
      barId,
      barName,
      email,
      subscriptionMethod,
      stripeSubscriptionId,
      stripeCustomerId,
      reason = 'Richiesta disdetta da console utente',
      subscriptionId
    } = body;

    const now = new Date();
    let updatedSubscription = null;
    let stripeCancelled = false;
    let stripeCancelDetails = null;

    // 1. Cerca l'abbonamento attivo su Supabase
    let query = 'subscriptions?order=created_at.desc&limit=1';
    if (subscriptionId) {
      query = `subscriptions?id=eq.${encodeURIComponent(subscriptionId)}`;
    } else if (barId) {
      query = `subscriptions?bar_id=eq.${encodeURIComponent(barId)}&order=created_at.desc&limit=1`;
    }

    let sub = null;
    const subRes = await supabaseFetch(query);
    if (subRes.ok) {
      const rows = await subRes.json();
      if (rows && rows.length > 0) {
        sub = rows[0];
      }
    }

    // 2. DISDETTA A LIVELLO DI STRIPE (Carta / Google Pay tokenizzato)
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = require('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

        const directSubId = subscriptionId || stripeSubscriptionId || (sub && sub.stripe_subscription_id);
        if (directSubId && String(directSubId).startsWith('sub_')) {
          try {
            const cancelRes = await stripe.subscriptions.cancel(directSubId, {
              cancellation_details: { comment: reason.substring(0, 500) }
            });
            stripeCancelled = true;
            stripeCancelDetails = { id: cancelRes.id, status: cancelRes.status };
            console.log(`[Stripe Cancel] ✅ Sottoscrizione ${directSubId} disdetta su Stripe: ${cancelRes.status}`);
          } catch (delErr) {
            console.warn(`[Stripe Cancel direct] Errore cancellazione diretta, tento update:`, delErr.message);
            try {
              const updRes = await stripe.subscriptions.update(directSubId, {
                cancel_at_period_end: true,
                cancellation_details: { comment: reason.substring(0, 500) }
              });
              stripeCancelled = true;
              stripeCancelDetails = { id: updRes.id, status: updRes.status };
            } catch (updErr) {
              console.warn(`[Stripe Update Error]`, updErr.message);
            }
          }
        }

        // Se non ancora cancellato o non avevamo sub_ id diretto, cerca clienti su Stripe per email o customerId
        if (!stripeCancelled) {
          let customerIds = [];
          if (stripeCustomerId) customerIds.push(stripeCustomerId);
          if (sub && sub.stripe_customer_id) customerIds.push(sub.stripe_customer_id);

          if (email && email.includes('@')) {
            try {
              const custs = await stripe.customers.list({ email: email.trim().toLowerCase(), limit: 5 });
              if (custs && custs.data) {
                custs.data.forEach(c => {
                  if (!customerIds.includes(c.id)) customerIds.push(c.id);
                });
              }
            } catch (custErr) {
              console.warn(`[Stripe Customer List Warning]`, custErr.message);
            }
          }

          for (const cId of customerIds) {
            try {
              const custSubs = await stripe.subscriptions.list({
                customer: cId,
                status: 'all',
                limit: 10
              });
              for (const s of (custSubs.data || [])) {
                if (['active', 'trialing', 'past_due', 'incomplete'].includes(s.status)) {
                  console.log(`[Stripe Cancel] Disdetta sottoscrizione ${s.id} per cliente Stripe ${cId}`);
                  const cancelRes = await stripe.subscriptions.cancel(s.id, {
                    cancellation_details: { comment: reason.substring(0, 500) }
                  });
                  stripeCancelled = true;
                  stripeCancelDetails = { id: cancelRes.id, status: cancelRes.status };
                }
              }
            } catch (csErr) {
              console.warn(`[Stripe CustSubs Error]`, csErr.message);
            }
          }
        }
      } catch (stripeInitErr) {
        console.error('[Stripe Cancel Init Error]', stripeInitErr.message);
      }
    }

    // 3. DISDETTA A LIVELLO DI GOOGLE PAY / PLAY
    // Google Pay elabora le transazioni su Stripe Gateway (quindi disdetto su Stripe),
    // mentre per gli acquisti Google Play In-App forniamo il link ufficiale per la gestione abbonamenti Google.
    const isGooglePay = subscriptionMethod === 'google_pay' || 
                        (sub && sub.payment_method && sub.payment_method.toLowerCase().includes('google')) ||
                        Boolean(req.headers['x-google-payment']);

    // 4. Aggiorna Supabase subscriptions
    if (sub && sub.id) {
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
    }

    // 5. Aggiorna tabella public.bars (stato canceled)
    const targetBarId = (sub && sub.bar_id) || barId;
    if (targetBarId) {
      await supabaseFetch(`bars?id=eq.${encodeURIComponent(targetBarId)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          cancel_at_period_end: true,
          status: 'canceled',
          subscription_status: 'canceled',
          updated_at: now.toISOString()
        })
      });
    }

    // 5b. Aggiorna referral affiliato rispettando i 14 giorni di prova:
    // Se disdice durante la prova, rimane in "In periodo di prova" fino alla scadenza effettiva dei 14 giorni.
    try {
      const affBarId = targetBarId || barId;
      const filter = affBarId
        ? `referred_bar_id=eq.${encodeURIComponent(affBarId)}`
        : (email ? `referred_email=eq.${encodeURIComponent(email.toLowerCase().trim())}` : null);

      if (filter) {
        const refRes = await supabaseFetch(`affiliate_referrals?${filter}&select=id,status,trial_end_date`);
        if (refRes.ok) {
          const refRows = await refRes.json();
          for (const ref of (refRows || [])) {
            const trialEndMs = ref.trial_end_date ? new Date(ref.trial_end_date).getTime() : 0;
            const isWithinTrial = trialEndMs > now.getTime();
            await supabaseFetch(`affiliate_referrals?id=eq.${encodeURIComponent(ref.id)}`, {
              method: 'PATCH',
              body: JSON.stringify({
                status: isWithinTrial ? 'trial' : 'cancelled',
                cancel_at_period_end: true,
                cancelled_at: now.toISOString(),
                updated_at: now.toISOString()
              })
            });
          }
        }
      }
    } catch (affCancelErr) {
      console.warn('[Affiliate Referral Cancel Warning]', affCancelErr.message);
    }

    // 6. Registra log di audit
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
            barName: barName || 'Bar',
            email: email || '',
            reason: reason,
            stripe_cancelled: stripeCancelled,
            google_pay_cancelled: isGooglePay,
            cancelled_at: now.toISOString()
          }),
          created_at: now.toISOString()
        })
      });

      // Notifica per il Super Admin in public.admin_notifications
      await supabaseFetch('admin_notifications', {
        method: 'POST',
        body: JSON.stringify({
          id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
          title: `Disdetta abbonamento (${stripeCancelled ? 'Stripe' : ''}${isGooglePay ? ' / Google Pay' : ''}): ${barName || 'Bar'}`,
          message: `${barName || 'Un bar'} ha disdetto l'abbonamento. Motivo: "${reason || 'Non specificato'}". Stripe disdetto: ${stripeCancelled ? 'Sì' : 'N/D'}. Google Pay: ${isGooglePay ? 'Sì' : 'N/D'}.`,
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
      message: 'Abbonamento disdetto con successo a livello di Stripe e Google Pay.',
      stripe_cancelled: stripeCancelled,
      google_pay_cancelled: isGooglePay,
      stripe_details: stripeCancelDetails,
      google_play_manage_url: 'https://play.google.com/store/account/subscriptions',
      cancelled_at: now.toISOString(),
      subscription: updatedSubscription
    });

  } catch (err) {
    console.error('[Cancel Subscription Error]', err);
    return res.status(500).json({ error: err.message || 'Errore interno durante la disdetta' });
  }
}

async function handleReactivation(body, res) {
  try {
    const { barId, email, subscriptionId, paymentIntentId } = body;
    const now = new Date();
    let updatedSubscription = null;
    let stripeReactivated = false;
    let requiresNewPayment = false;

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

        if (process.env.STRIPE_SECRET_KEY && sub.stripe_subscription_id) {
          try {
            const Stripe = require('stripe');
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

            const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
            if (stripeSub && (stripeSub.status === 'active' || stripeSub.status === 'trialing')) {
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

    try {
      await supabaseFetch('admin_audit_logs', {
        method: 'POST',
        body: JSON.stringify({
          id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          admin_id: email || barId || 'utente_gestionale',
          action: 'subscription_reactivated',
          entity_type: 'subscription',
          entity_id: barId || subscriptionId || 'bar_sub',
          details: JSON.stringify({ email: email || '', reactivated_at: now.toISOString() }),
          created_at: now.toISOString()
        })
      });

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
