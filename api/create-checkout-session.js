// api/create-checkout-session.js - Vercel Serverless Function (Node.js)
// Crea una sessione Stripe Checkout per sottoscrivere l'abbonamento BarPilot Pro
// con 14 giorni di prova gratuita autorizzata (€0 dovuti oggi, €59/mese al 14° giorno)

const Stripe = require('stripe');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error('[Stripe Checkout] STRIPE_SECRET_KEY mancante nelle variabili ambiente.');
    return res.status(500).json({ error: 'Configurazione Stripe mancante sul server.' });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
  });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const {
      barId,
      userId,
      email,
      barName,
      priceId,
      trialDays = 14,
      successUrl,
      cancelUrl
    } = body;

    const originHeader = req.headers.origin || `https://${req.headers.host}` || 'https://www.barpilot.eu';
    const refererHeader = req.headers.referer || '';
    const hasAppPath = refererHeader.includes('/app') || originHeader.includes('/app');
    const appPrefix = hasAppPath ? '/app' : '';
    const finalSuccessUrl = successUrl || `${originHeader}${appPrefix}/?checkout_status=success&session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancelUrl || `${originHeader}${appPrefix}/checkout.html?checkout_status=canceled`;

    // 1. Line Items: Usa priceId configurato o genera price_data al volo per BarPilot Pro (€59.00 / mese)
    let lineItems = [];
    if (priceId && priceId.startsWith('price_')) {
      lineItems = [{ price: priceId, quantity: 1 }];
    } else {
      lineItems = [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'BarPilot Pro',
            description: 'Abbonamento mensile gestionale bar & ristoranti con 14 giorni di prova gratuita',
            images: ['https://www.barpilot.eu/assets/icons/icon-192x192.png']
          },
          unit_amount: 5900, // 59,00 € in centesimi
          recurring: {
            interval: 'month'
          }
        },
        quantity: 1
      }];
    }

    // 2. Opzioni Sessione Stripe Checkout
    const sessionConfig = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      subscription_data: {
        trial_period_days: Math.max(1, parseInt(trialDays, 10) || 14),
        metadata: {
          bar_id: barId || '',
          user_id: userId || '',
          bar_name: barName || '',
          platform: 'BarPilot'
        }
      },
      payment_method_collection: 'always',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        bar_id: barId || '',
        user_id: userId || '',
        bar_name: barName || '',
        platform: 'BarPilot'
      }
    };

    if (email && email.includes('@')) {
      sessionConfig.customer_email = email.trim().toLowerCase();
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log(`[Stripe Checkout] ✅ Sessione creata: ${session.id} (Trial: ${trialDays} gg, Bar: ${barId})`);

    return res.status(200).json({
      sessionId: session.id,
      url: session.url
    });
  } catch (err) {
    console.error('[Stripe Checkout] ❌ Errore creazione sessione:', err);
    return res.status(500).json({
      error: err.message || 'Errore durante la creazione della sessione di pagamento Stripe.'
    });
  }
}
