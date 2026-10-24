import { NextResponse } from 'next/server';

// POST /api/billing/webhook — Stripe Webhook Endpoint
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');

    // In a production environment with STRIPE_WEBHOOK_SECRET, verify signature here:
    // const event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
    
    let event: any = {};
    try {
      event = JSON.parse(rawBody);
    } catch {
      event = { type: 'simulation' };
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data?.object;
        console.log(`[BarPilot Stripe] Subscription ${subscription?.id} status updated to: ${subscription?.status}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data?.object;
        console.log(`[BarPilot Stripe] Payment succeeded for subscription: ${invoice?.subscription}, amount: ${invoice?.amount_paid}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data?.object;
        console.log(`[BarPilot Stripe] Subscription cancelled: ${subscription?.id}`);
        break;
      }

      default:
        console.log(`[BarPilot Stripe] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[BarPilot Stripe Webhook Error]:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
