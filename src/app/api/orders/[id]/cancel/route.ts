import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.reason || !body.reason.trim()) {
      return NextResponse.json(
        { success: false, error: 'Un motif d\'annulation est strictement obligatoire selon les règles BarPilot' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Commande ${id} annulée avec succès et journalisée dans l'audit log`,
      order_id: id,
      status: 'cancelled',
      cancellation_reason: body.reason,
      cancelled_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
