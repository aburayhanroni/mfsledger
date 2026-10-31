import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { status, trx_id, notes, screenshot_url } = body;

    const transactionId = parseInt(id, 10);
    if (isNaN(transactionId) || transactionId <= 0) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 });
    }

    if (status) {
      const validStatuses = ['pending', 'sent', 'received', 'rejected'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
    }

    const cleanTrxId = trx_id !== undefined ? (trx_id ? String(trx_id).trim().toUpperCase().slice(0, 50) : null) : undefined;
    const cleanNotes = notes !== undefined ? (notes ? String(notes).trim().slice(0, 255) : null) : undefined;

    // Build update
    const result = await sql`
      UPDATE transactions
      SET 
        status = COALESCE(${status || null}, status),
        trx_id = COALESCE(${cleanTrxId !== undefined ? cleanTrxId : null}, trx_id),
        notes = COALESCE(${cleanNotes !== undefined ? cleanNotes : null}, notes),
        screenshot_url = COALESCE(${screenshot_url !== undefined ? screenshot_url : null}, screenshot_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${transactionId}
      RETURNING *;
    `;

    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ transaction: result[0] });
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const transactionId = parseInt(id, 10);
    if (isNaN(transactionId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await sql`
      DELETE FROM transactions WHERE id = ${transactionId};
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

