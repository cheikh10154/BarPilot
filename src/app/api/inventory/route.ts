import { NextResponse } from 'next/server';
import { INITIAL_INVENTORY } from '@/lib/store';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: INITIAL_INVENTORY,
    total: INITIAL_INVENTORY.length,
  });
}
