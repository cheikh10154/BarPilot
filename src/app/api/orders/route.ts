import { NextResponse } from 'next/server';
import { INITIAL_ORDERS, INITIAL_PRODUCTS } from '@/lib/store';

// GET /api/orders — Liste des commandes
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let orders = INITIAL_ORDERS;
  if (status) {
    orders = orders.filter(o => o.status === status);
  }

  return NextResponse.json({
    success: true,
    data: orders,
  });
}

// POST /api/orders — Créer et envoyer une commande
// Comme prescrit dans la spec Section 9: "Le client ne doit pas pouvoir imposer librement les prix.
// Le serveur récupère les prix autorisés dans la base de données, calcule le total et fige les valeurs."
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Une commande doit comporter au moins un article' },
        { status: 400 }
      );
    }

    // Server-side calculation of authorized prices
    let total_cents = 0;
    const computedItems = body.items.map((it: any, idx: number) => {
      const authorizedProduct = INITIAL_PRODUCTS.find(p => p.id === it.product_id);
      const unit_price_cents = authorizedProduct ? authorizedProduct.price_cents : 500;
      const quantity = Math.max(1, Math.round(Number(it.quantity) || 1));

      total_cents += unit_price_cents * quantity;

      return {
        id: `item-${Date.now()}-${idx}`,
        product_id: it.product_id,
        product_name: authorizedProduct ? authorizedProduct.name_it : 'Articolo',
        unit_price_cents,
        quantity,
        status: 'pending',
      };
    });

    const newOrder = {
      id: `ord-${Date.now()}`,
      order_number: 104,
      table_id: body.table_id || null,
      table_number: body.table_number || 'Bancone',
      server_name: body.server_name || 'Cameriere',
      status: 'sent',
      items: computedItems,
      total_cents,
      created_at: new Date().toISOString(),
      notes: body.notes || undefined,
      idempotency_key: body.idempotency_key || `key-${Date.now()}`,
    };

    return NextResponse.json({
      success: true,
      data: newOrder,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
