// api/stripe-webhook.js - Vercel Serverless Function (Node.js)
// Verifica crittografica con Stripe SDK e aggiornamento automatico su Supabase Database

const Stripe = require('stripe');

// Helper per leggere il raw body su Vercel Serverless Function
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', err => reject(err));
  });
}

// Configurazione Vercel: disabilita il bodyParser automatico per consentire la verifica della firma raw di Stripe
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
    console.error('[Stripe Webhook] Errore: STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET mancanti nelle variabili d\'ambiente.');
    return res.status(500).json({ error: 'Configurazione server Stripe incompleta' });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
  });

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await getRawBody(req);
    // Verifica crittografica rigorosa della firma Stripe
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error(`[Stripe Webhook] ❌ Firma non valida: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Stripe Webhook] ✅ Evento ricevuto e autenticato: ${event.type}`);

  // Gestione degli eventi di pagamento
  switch (event.type) {
    // 1. Pagamento Stripe Checkout completato (abbonamento o una tantum)
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log(`[Stripe Webhook] 💳 Checkout completato per il cliente: ${session.customer_email || session.customer}`);
      
      const email = session.customer_email || session.customer_details?.email;
      const metadata = session.metadata || {};
      const barId = metadata.bar_id;
      const userId = metadata.user_id;

      await sbloccaAbbonamentoNelDatabase({
        email,
        barId,
        userId,
        transactionId: session.id,
        paymentStatus: 'active',
        method: 'stripe_checkout'
      });
      break;
    }

    // 2. Pagamento diretto con carta / PaymentIntent riuscito
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      console.log(`[Stripe Webhook] 💰 PaymentIntent riuscito: ${paymentIntent.id} (${paymentIntent.amount / 100} €)`);
      
      const metadata = paymentIntent.metadata || {};
      const email = metadata.email || paymentIntent.receipt_email;
      const barId = metadata.bar_id;
      const userId = metadata.user_id;

      await sbloccaAbbonamentoNelDatabase({
        email,
        barId,
        userId,
        transactionId: paymentIntent.id,
        paymentStatus: 'active',
        method: 'stripe_card'
      });
      break;
    }

    // 3. Pagamento fallito
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.warn(`[Stripe Webhook] ⚠️ Pagamento fallito per PaymentIntent: ${paymentIntent.id}`, paymentIntent.last_payment_error?.message);
      break;
    }

    // 4. Abbonamento ricorrente rinnovato con successo
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      console.log(`[Stripe Webhook] 🧾 Fattura pagata: ${invoice.id} per cliente: ${invoice.customer_email}`);
      break;
    }

    default:
      console.log(`[Stripe Webhook] Evento non gestito: ${event.type}`);
  }

  // Risposta 200 OK a Stripe per confermare la ricezione
  return res.status(200).json({ received: true });
}

/**
 * Aggiorna il database Supabase confermando l'abbonamento e sbloccando la Dashboard
 */
async function sbloccaAbbonamentoNelDatabase({ email, barId, userId, transactionId, paymentStatus, method }) {
  const supabaseUrl = process.env.SUPABASE_URL || "https://cprxxxlgaofopmogeuer.supabase.co";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!supabaseServiceKey) {
    console.warn('[Stripe Webhook] SUPABASE_SERVICE_ROLE_KEY non presente, aggiornamento database saltato.');
    return;
  }

  try {
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    
    // Aggiorna o inserisci nella tabella subscriptions / bars di Supabase
    const payload = {
      email,
      bar_id: barId || null,
      user_id: userId || null,
      transaction_id: transactionId,
      status: paymentStatus,
      method: method,
      is_subscribed: true,
      trial_ends_at: trialEndsAt,
      confirmed_at: new Date().toISOString()
    };

    const res = await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      console.log(`[Stripe Webhook] 🎉 Abbonamento sbloccato su Supabase per: ${email}`);
    } else {
      console.warn(`[Stripe Webhook] Risposta Supabase: ${res.status}`);
    }
  } catch (err) {
    console.error('[Stripe Webhook] Errore connessione Supabase:', err.message);
  }
}
