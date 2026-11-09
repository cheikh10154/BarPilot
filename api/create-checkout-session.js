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
      productId,
      trialDays = 14,
      successUrl,
      cancelUrl
    } = body;

    const targetProductId = productId || process.env.STRIPE_PRODUCT_ID || 'prod_VWtyfRYXitjFmv';

    const originHeader = req.headers.origin || `https://${req.headers.host}` || 'https://www.barpilot.eu';
    const refererHeader = req.headers.referer || '';
    const hasAppPath = refererHeader.includes('/app') || originHeader.includes('/app');
    const appPrefix = hasAppPath ? '/app' : '';
    const finalSuccessUrl = successUrl || 'https://www.barpilot.eu/app/index.html?checkout_status=success&session_id={CHECKOUT_SESSION_ID}#view-dashboard';
    const finalCancelUrl = cancelUrl || `${originHeader}${appPrefix}/checkout.html?checkout_status=canceled`;

    // 1. Line Items: Usa priceId configurato, o recupera/crea il prezzo per il prodotto Stripe configurato
    let lineItems = [];
    if (priceId && priceId.startsWith('price_')) {
      lineItems = [{ price: priceId, quantity: 1 }];
    } else {
      let existingPriceId = null;
      try {
        const prices = await stripe.prices.list({
          product: targetProductId,
          active: true,
          limit: 10
        });
        if (prices && prices.data && prices.data.length > 0) {
          const recurringPrice = prices.data.find(p => p.recurring && p.recurring.interval === 'month') || prices.data[0];
          if (recurringPrice) {
            existingPriceId = recurringPrice.id;
          }
        }
      } catch (priceErr) {
        console.warn(`[Stripe Checkout] Ricerca prezzi per ${targetProductId}:`, priceErr.message);
      }

      if (existingPriceId) {
        lineItems = [{ price: existingPriceId, quantity: 1 }];
      } else {
        lineItems = [{
          price_data: {
            currency: 'eur',
            product: targetProductId,
            unit_amount: 5900, // 59,00 € in centesimi
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }];
      }
    }

    // 2. Opzioni Sessione Stripe Checkout
    const parsedTrialDays = parseInt(trialDays, 10);
    const isTrialEligible = !isNaN(parsedTrialDays) ? parsedTrialDays > 0 : true;

    const sessionConfig = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      subscription_data: {
        ...(isTrialEligible ? { trial_period_days: parsedTrialDays || 14 } : {}),
        metadata: {
          bar_id: barId || '',
          user_id: userId || '',
          bar_name: barName || '',
          product_id: targetProductId,
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
        product_id: targetProductId,
        platform: 'BarPilot'
      }
    };

    if (email && email.includes('@')) {
      sessionConfig.customer_email = email.trim().toLowerCase();
    }

    let session;
    try {
      session = await stripe.checkout.sessions.create(sessionConfig);
    } catch (sessionErr) {
      if (sessionErr.message && (sessionErr.message.includes('No such product') || sessionErr.message.includes('resource_missing'))) {
        console.warn(`[Stripe Checkout] Prodotto ${targetProductId} non trovato nel corrente account Stripe, fallback a product_data inline:`, sessionErr.message);
        sessionConfig.line_items = [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'BarPilot Pro',
              description: 'Abbonamento mensile gestionale bar & ristoranti con 14 giorni di prova gratuita',
              images: ['https://www.barpilot.eu/assets/icons/icon-192x192.png']
            },
            unit_amount: 5900,
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }];
        session = await stripe.checkout.sessions.create(sessionConfig);
      } else {
        throw sessionErr;
      }
    }
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
