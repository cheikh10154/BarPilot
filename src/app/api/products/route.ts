import { NextResponse } from 'next/server';
import { INITIAL_PRODUCTS } from '@/lib/store';

// GET /api/products — Récupère le catalogue de produits
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  let filtered = INITIAL_PRODUCTS;
  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }

  return NextResponse.json({
    success: true,
    data: filtered,
    total: filtered.length,
  });
}

// POST /api/products — Créer un produit
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name_it || !body.price_cents) {
      return NextResponse.json(
        { success: false, error: 'Champs obligatoires manquants (name_it, price_cents)' },
        { status: 400 }
      );
    }

    const newProduct = {
      id: `prod-${Date.now()}`,
      category: body.category || 'cocktails',
      name_it: body.name_it,
      name_fr: body.name_fr || body.name_it,
      price_cents: Math.round(Number(body.price_cents)),
      description_it: body.description_it || '',
      description_fr: body.description_fr || '',
      is_available: true,
      recipe: body.recipe || undefined,
    };

    return NextResponse.json({
      success: true,
      data: newProduct,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
