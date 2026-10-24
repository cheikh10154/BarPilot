import { NextResponse } from 'next/server';
import { INITIAL_TABLES } from '@/lib/store';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: INITIAL_TABLES,
    total: INITIAL_TABLES.length,
  });
}
