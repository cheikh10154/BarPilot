// api/create-portal-session.js - Vercel Serverless Function (Node.js)
// Genera una sessione sicura per lo Stripe Customer Portal

const Stripe = require('stripe');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Stripe non configurato sul server.' });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { customerId, returnUrl } = body;

    if (!customerId) {
      return res.status(400).json({ error: 'ID Cliente Stripe obbligatorio.' });
    }

    const host = req.headers.origin || `https://${req.headers.host}` || 'https://www.barpilot.eu';
    const referer = req.headers.referer || '';
    const hasApp = referer.includes('/app') || host.includes('/app');
    const returnDefault = `${host}${hasApp ? '/app' : ''}/gestisci-abbonamento.html`;
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || returnDefault
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error('[Stripe Portal] Errore:', err);
    return res.status(500).json({ error: err.message });
  }
}
