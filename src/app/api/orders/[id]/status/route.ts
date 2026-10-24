import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const allowedStatuses = ['draft', 'sent', 'preparing', 'ready', 'served', 'closed', 'cancelled'];
    if (!allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: 'Statut de commande non valide' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Statut de la commande ${id} mis à jour vers ${body.status}`,
      order_id: id,
      new_status: body.status,
      updated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
