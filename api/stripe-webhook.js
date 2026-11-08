// api/stripe-webhook.js - Vercel Serverless Function (Node.js)
// Verifica crittografica con Stripe SDK, deduplicazione su webhook_events
// e sincronizzazione automatica bidirezionale su Supabase Database

const Stripe = require('stripe');

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', err => reject(err));
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    console.error('[Stripe Webhook] ❌ STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET mancanti.');
    return res.status(500).json({ error: 'Configurazione Stripe incompleta sul server' });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
  });

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error(`[Stripe Webhook] ❌ Firma non valida: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Stripe Webhook] 🔔 Ricevuto evento: ${event.type} (${event.id})`);

  // 1. Idempotency Check tramite public.webhook_events
  const isDuplicate = await checkAndRecordWebhookEvent(event);
  if (isDuplicate) {
    console.log(`[Stripe Webhook] ⏭️ Evento ${event.id} già elaborato in precedenza. Skip idempotente.`);
    return res.status(200).json({ received: true, already_processed: true });
  }

  try {
    switch (event.type) {
      // ----------------------------------------------------------------------
      // 1. CHECKOUT SESSION COMPLETED (Attivazione o trial con carta)
      // ----------------------------------------------------------------------
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email = session.customer_email || session.customer_details?.email;
        const metadata = session.metadata || {};
        const barId = metadata.bar_id;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        console.log(`[Stripe Webhook] 💳 Checkout session completata per ${email} (Bar: ${barId})`);

        // Sincronizza stato su Supabase
        await handleCheckoutCompleted({
          barId,
          email,
          customerId,
          subscriptionId,
          sessionId: session.id,
          amountTotal: (session.amount_total || 0) / 100
        });
        break;
      }

      // ----------------------------------------------------------------------
      // 2. SUBSCRIPTION CREATED / UPDATED
      // ----------------------------------------------------------------------
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        console.log(`[Stripe Webhook] 🔄 Abbonamento ${sub.id}: status=${sub.status}`);
        await syncSubscriptionFromStripe(sub);
        break;
      }

      // ----------------------------------------------------------------------
      // 3. SUBSCRIPTION DELETED (Cancellazione)
      // ----------------------------------------------------------------------
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        console.log(`[Stripe Webhook] ❌ Abbonamento cancellato: ${sub.id}`);
        await handleSubscriptionCancelled(sub);
        break;
      }

      // ----------------------------------------------------------------------
      // 4. TRIAL WILL END (Avviso 3 giorni prima del primo addebito)
      // ----------------------------------------------------------------------
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object;
        console.log(`[Stripe Webhook] ⏳ Prova gratuita in scadenza per sub: ${sub.id}`);
        await recordAuditLog({
          action: 'subscription_trial_will_end',
          entityType: 'subscription',
          entityId: sub.id,
          newValues: { trial_end: new Date(sub.trial_end * 1000).toISOString() }
        });
        break;
      }

      // ----------------------------------------------------------------------
      // 5. INVOICE PAID (Fattura saldata con successo)
      // ----------------------------------------------------------------------
      case 'invoice.paid': {
        const invoice = event.data.object;
        console.log(`[Stripe Webhook] 🧾 Fattura pagata: ${invoice.number || invoice.id}`);
        await syncInvoicePaid(invoice);
        break;
      }

      // ----------------------------------------------------------------------
      // 6. INVOICE PAYMENT FAILED (Tentativo addebito fallito -> past_due)
      // ----------------------------------------------------------------------
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.warn(`[Stripe Webhook] ⚠️ Pagamento fattura fallito: ${invoice.id}`);
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      // ----------------------------------------------------------------------
      // 7. PAYMENT INTENT SUCCEEDED
      // ----------------------------------------------------------------------
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        console.log(`[Stripe Webhook] 💰 Incasso confermato: ${pi.id} (${pi.amount / 100} €)`);
        await syncPaymentIntent(pi, 'succeeded');
        break;
      }

      // ----------------------------------------------------------------------
      // 8. PAYMENT INTENT FAILED
      // ----------------------------------------------------------------------
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        console.warn(`[Stripe Webhook] ⚠️ Incasso fallito: ${pi.id}`);
        await syncPaymentIntent(pi, 'failed');
        break;
      }

      default:
        console.log(`[Stripe Webhook] Evento ignorato: ${event.type}`);
    }

    // Segna l'evento come elaborato con successo in webhook_events
    await markWebhookProcessed(event.id, 'processed');
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(`[Stripe Webhook] ❌ Errore durante l'elaborazione:`, err);
    await markWebhookProcessed(event.id, 'failed', err.message);
    return res.status(500).json({ error: 'Errore interno elaborazione webhook' });
  }
}

// ============================================================================
// SUPABASE CLIENT HELPERS (Zero dipendenze esterne, funziona ovunque su Vercel)
// ============================================================================

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

// ----------------------------------------------------------------------------
// Idempotency: webhook_events
// ----------------------------------------------------------------------------
async function checkAndRecordWebhookEvent(event) {
  try {
    // Verifica se esiste già
    const checkRes = await supabaseFetch(`webhook_events?external_event_id=eq.${event.id}&select=id,processing_status`);
    if (checkRes.ok) {
      const rows = await checkRes.json();
      if (Array.isArray(rows) && rows.length > 0 && rows[0].processing_status === 'processed') {
        return true; // Già processato
      }
    }

    // Registra come 'received'
    await supabaseFetch('webhook_events', {
      method: 'POST',
      body: JSON.stringify({
        id: 'evt_' + event.id.replace(/[^a-zA-Z0-9_]/g, '_'),
        provider: 'stripe',
        external_event_id: event.id,
        event_type: event.type,
        processing_status: 'received',
        received_at: new Date().toISOString()
      })
    });
    return false;
  } catch (e) {
    console.warn('[Stripe Webhook] Idempotency record error:', e.message);
    return false;
  }
}

async function markWebhookProcessed(eventId, status, errorMsg = null) {
  try {
    await supabaseFetch(`webhook_events?external_event_id=eq.${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        processing_status: status,
        processed_at: new Date().toISOString(),
        error_message: errorMsg
      })
    });
  } catch (e) {}
}

// ----------------------------------------------------------------------------
// 1. Gestione Checkout Completato
// ----------------------------------------------------------------------------
async function handleCheckoutCompleted({ barId, email, customerId, subscriptionId, sessionId, amountTotal }) {
  try {
    // 1. Trova il bar da barId o email
    let targetBarId = barId;
    if (!targetBarId && email) {
      const bRes = await supabaseFetch(`bars?email=eq.${encodeURIComponent(email)}&select=id,name`);
      if (bRes.ok) {
        const bars = await bRes.json();
        if (bars.length > 0) targetBarId = bars[0].id;
      }
    }

    if (targetBarId) {
      // Aggiorna stato bar in 'active' o 'trial' se c'è trial
      await supabaseFetch(`bars?id=eq.${targetBarId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'active',
          updated_at: new Date().toISOString()
        })
      });

      // Aggiorna o inserisci sottoscrizione
      await supabaseFetch('subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          id: 'sub_' + (subscriptionId || targetBarId),
          bar_id: targetBarId,
          plan_id: 'plan_barpilot_pro',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          payment_method: 'Stripe Checkout',
          updated_at: new Date().toISOString()
        })
      });
    }

    await recordAuditLog({
      action: 'stripe_checkout_completed',
      entityType: 'bar',
      entityId: targetBarId || sessionId,
      newValues: { customerId, subscriptionId, amountTotal }
    });

    try {
      await supabaseFetch('admin_notifications', {
        method: 'POST',
        body: JSON.stringify({
          id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
          title: 'Abbonamento Pro attivato',
          message: `Pagamento Stripe completato (${amountTotal} €) per ${email || targetBarId || 'Bar'}.`,
          type: 'success',
          link: '#view-subscriptions',
          created_at: new Date().toISOString()
        })
      });
    } catch (_) {}
  } catch (e) {
    console.error('[Stripe Webhook] handleCheckoutCompleted error:', e);
  }
}

// ----------------------------------------------------------------------------
// 2. Sincronizzazione Abbonamento da Stripe
// ----------------------------------------------------------------------------
async function syncSubscriptionFromStripe(sub) {
  try {
    const customerId = sub.customer;
    const subId = sub.id;
    const status = sub.status; // trialing, active, past_due, unpaid, canceled
    const currentPeriodStart = new Date(sub.current_period_start * 1000).toISOString();
    const currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
    const trialStart = sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null;
    const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;

    // Mappa stato Stripe a stato operativo Bar
    let barStatus = 'active';
    if (status === 'trialing') barStatus = 'trial';
    else if (status === 'past_due' || status === 'unpaid') barStatus = 'past_due';
    else if (status === 'canceled') barStatus = 'cancelled';

    // Cerca abbonamento esistente
    const subRes = await supabaseFetch(`subscriptions?stripe_subscription_id=eq.${subId}&select=id,bar_id`);
    let barId = null;
    if (subRes.ok) {
      const rows = await subRes.json();
      if (rows.length > 0) {
        barId = rows[0].bar_id;
      }
    }

    if (!barId) {
      // Cerca per stripe_customer_id
      const custRes = await supabaseFetch(`subscriptions?stripe_customer_id=eq.${customerId}&select=id,bar_id`);
      if (custRes.ok) {
        const rows = await custRes.json();
        if (rows.length > 0) barId = rows[0].bar_id;
      }
    }

    if (barId) {
      await supabaseFetch(`bars?id=eq.${barId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: barStatus,
          updated_at: new Date().toISOString()
        })
      });

      await supabaseFetch('subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          id: 'sub_' + subId,
          bar_id: barId,
          plan_id: 'plan_barpilot_pro',
          stripe_customer_id: customerId,
          stripe_subscription_id: subId,
          status: status,
          trial_start: trialStart,
          trial_end: trialEnd,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: sub.cancel_at_period_end || false,
          updated_at: new Date().toISOString()
        })
      });
    }

    await recordAuditLog({
      action: 'stripe_subscription_sync',
      entityType: 'subscription',
      entityId: subId,
      newValues: { status, barStatus, barId }
    });
  } catch (e) {
    console.error('[Stripe Webhook] syncSubscriptionFromStripe error:', e);
  }
}

// ----------------------------------------------------------------------------
// 3. Cancellazione Abbonamento
// ----------------------------------------------------------------------------
async function handleSubscriptionCancelled(sub) {
  try {
    const subRes = await supabaseFetch(`subscriptions?stripe_subscription_id=eq.${sub.id}&select=id,bar_id`);
    if (subRes.ok) {
      const rows = await subRes.json();
      if (rows.length > 0) {
        const barId = rows[0].bar_id;
        await supabaseFetch(`bars?id=eq.${barId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
        });

        await supabaseFetch(`subscriptions?id=eq.${rows[0].id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'canceled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        });

        try {
          await supabaseFetch('admin_notifications', {
            method: 'POST',
            body: JSON.stringify({
              id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
              title: 'Abbonamento cancellato',
              message: `L'abbonamento Stripe per il bar ${barId} è stato cancellato.`,
              type: 'warning',
              link: '#view-subscriptions',
              created_at: new Date().toISOString()
            })
          });
        } catch (_) {}
      }
    }
  } catch (e) {
    console.error('[Stripe Webhook] handleSubscriptionCancelled error:', e);
  }
}

// ----------------------------------------------------------------------------
// 4. Fattura Pagata
// ----------------------------------------------------------------------------
async function syncInvoicePaid(invoice) {
  try {
    const amountTotal = (invoice.amount_paid || invoice.total || 5900) / 100;
    const invNumber = invoice.number || `#${invoice.id.slice(-8).toUpperCase()}`;

    // Trova il bar da subscription o customer
    let barId = null;
    if (invoice.subscription) {
      const sRes = await supabaseFetch(`subscriptions?stripe_subscription_id=eq.${invoice.subscription}&select=bar_id`);
      if (sRes.ok) {
        const rows = await sRes.json();
        if (rows.length > 0) barId = rows[0].bar_id;
      }
    }

    const invPayload = {
      id: 'inv_' + invoice.id.replace(/[^a-zA-Z0-9_]/g, '_'),
      bar_id: barId,
      stripe_invoice_id: invoice.id,
      invoice_number: invNumber,
      amount_subtotal: ((invoice.subtotal || invoice.total) / 100),
      amount_tax: ((invoice.tax || 0) / 100),
      amount_total: amountTotal,
      amount_paid: amountTotal,
      currency: (invoice.currency || 'eur').toUpperCase(),
      status: 'paid',
      invoice_date: new Date((invoice.created || Date.now() / 1000) * 1000).toISOString(),
      paid_at: new Date().toISOString(),
      invoice_pdf_url: invoice.invoice_pdf || invoice.hosted_invoice_url,
      updated_at: new Date().toISOString()
    };

    await supabaseFetch('invoices', {
      method: 'POST',
      body: JSON.stringify(invPayload)
    });

    try {
      await supabaseFetch('admin_notifications', {
        method: 'POST',
        body: JSON.stringify({
          id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
          title: `Pagamento fallito per fattura ${invPayload.invoice_number}`,
          message: `Tentativo di addebito Stripe fallito. Bar ${barId || 'registrato'} impostato in past_due.`,
          type: 'danger',
          link: '#view-invoices',
          created_at: new Date().toISOString()
        })
      });
    } catch (_) {}

    // Se il bar era past_due, riattivalo!
    if (barId) {
      await supabaseFetch(`bars?id=eq.${barId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'active', updated_at: new Date().toISOString() })
      });
    }

    try {
      await supabaseFetch('admin_notifications', {
        method: 'POST',
        body: JSON.stringify({
          id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
          title: `Fattura ${invNumber} saldata`,
          message: `Incasso di ${amountTotal.toFixed(2)} € registrato con successo via Stripe.`,
          type: 'info',
          link: '#view-invoices',
          created_at: new Date().toISOString()
        })
      });
    } catch (_) {}
  } catch (e) {
    console.error('[Stripe Webhook] syncInvoicePaid error:', e);
  }
}

// ----------------------------------------------------------------------------
// 5. Fattura Fallita
// ----------------------------------------------------------------------------
async function handleInvoicePaymentFailed(invoice) {
  try {
    let barId = null;
    if (invoice.subscription) {
      const sRes = await supabaseFetch(`subscriptions?stripe_subscription_id=eq.${invoice.subscription}&select=bar_id`);
      if (sRes.ok) {
        const rows = await sRes.json();
        if (rows.length > 0) barId = rows[0].bar_id;
      }
    }

    if (barId) {
      await supabaseFetch(`bars?id=eq.${barId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'past_due', updated_at: new Date().toISOString() })
      });
    }

    const invPayload = {
      id: 'inv_' + invoice.id.replace(/[^a-zA-Z0-9_]/g, '_'),
      bar_id: barId,
      stripe_invoice_id: invoice.id,
      invoice_number: invoice.number || `#${invoice.id.slice(-8).toUpperCase()}`,
      amount_total: (invoice.total || 5900) / 100,
      amount_paid: 0.00,
      status: 'open',
      updated_at: new Date().toISOString()
    };

    await supabaseFetch('invoices', {
      method: 'POST',
      body: JSON.stringify(invPayload)
    });

    try {
      await supabaseFetch('admin_notifications', {
        method: 'POST',
        body: JSON.stringify({
          id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
          title: `Pagamento fallito per fattura ${invPayload.invoice_number}`,
          message: `Tentativo di addebito Stripe fallito. Bar ${barId || 'registrato'} impostato in past_due.`,
          type: 'danger',
          link: '#view-invoices',
          created_at: new Date().toISOString()
        })
      });
    } catch (_) {}
  } catch (e) {
    console.error('[Stripe Webhook] handleInvoicePaymentFailed error:', e);
  }
}

// ----------------------------------------------------------------------------
// 6. Sincronizzazione PaymentIntent (Registro Pagamenti)
// ----------------------------------------------------------------------------
async function syncPaymentIntent(pi, status) {
  try {
    const amount = (pi.amount || 0) / 100;
    const metadata = pi.metadata || {};
    const barId = metadata.bar_id || null;

    const payPayload = {
      id: 'pay_' + pi.id.replace(/[^a-zA-Z0-9_]/g, '_'),
      bar_id: barId,
      stripe_payment_intent_id: pi.id,
      stripe_charge_id: pi.latest_charge || null,
      amount: amount,
      currency: (pi.currency || 'eur').toUpperCase(),
      status: status,
      payment_method_type: (pi.payment_method_types && pi.payment_method_types[0]) || 'card',
      paid_at: status === 'succeeded' ? new Date().toISOString() : null,
      failure_reason: pi.last_payment_error?.message || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await supabaseFetch('payments', {
      method: 'POST',
      body: JSON.stringify(payPayload)
    });
  } catch (e) {
    console.error('[Stripe Webhook] syncPaymentIntent error:', e);
  }
}

// ----------------------------------------------------------------------------
// Audit Log
// ----------------------------------------------------------------------------
async function recordAuditLog({ action, entityType, entityId, oldValues = null, newValues = null }) {
  try {
    await supabaseFetch('admin_audit_logs', {
      method: 'POST',
      body: JSON.stringify({
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        admin_id: 'system_stripe_webhook',
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_values: oldValues,
        new_values: newValues,
        created_at: new Date().toISOString()
      })
    });
  } catch (e) {}
}
