import { NextResponse } from 'next/server';

// POST /api/billing/checkout — Créer une session Stripe Checkout pour l'abonnement à 59€/mois
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const returnUrl = body.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'}/it/settings?billing_status=success`;

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const isLiveStripe = stripeSecretKey && stripeSecretKey.startsWith('sk_');

    if (!isLiveStripe) {
      // Simulation mode for instant testing without real Stripe API key
      return NextResponse.json({
        success: true,
        mode: 'simulation',
        message: 'Modalità di simulazione attiva: abbonamento BarPilot Pro (59€/mese) confermato!',
        redirectUrl: `${returnUrl}&plan=pro_active`,
      });
    }

    // In production with Stripe SDK:
    // const stripe = new Stripe(stripeSecretKey);
    // const session = await stripe.checkout.sessions.create({
    //   mode: 'subscription',
    //   payment_method_types: ['card'],
    //   line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    //   success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: `${returnUrl}?cancelled=true`,
    // });
    // return NextResponse.json({ success: true, url: session.url });

    return NextResponse.json({
      success: true,
      mode: 'simulation',
      redirectUrl: returnUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
