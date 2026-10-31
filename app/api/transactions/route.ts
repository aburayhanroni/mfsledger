import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userPhone = searchParams.get('userPhone');
    const partnerPhone = searchParams.get('partnerPhone');
    const mfs = searchParams.get('mfs');
    const status = searchParams.get('status');
    const dateRange = searchParams.get('dateRange'); // 'today' or 'all'

    if (!userPhone) {
      return NextResponse.json({ error: 'userPhone query param is required' }, { status: 400 });
    }

    let rows: any[] = [];

    // Build conditions
    if (partnerPhone) {
      if (dateRange === 'today') {
        if (mfs && mfs !== 'all') {
          rows = await sql`
            SELECT * FROM transactions
            WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
               OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
              AND mfs_type = ${mfs}
              AND created_at >= CURRENT_DATE
            ORDER BY created_at DESC
            LIMIT 200;
          `;
        } else {
          rows = await sql`
            SELECT * FROM transactions
            WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
               OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
              AND created_at >= CURRENT_DATE
            ORDER BY created_at DESC
            LIMIT 200;
          `;
        }
      } else {
        if (mfs && mfs !== 'all') {
          rows = await sql`
            SELECT * FROM transactions
            WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
               OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
              AND mfs_type = ${mfs}
            ORDER BY created_at DESC
            LIMIT 200;
          `;
        } else {
          rows = await sql`
            SELECT * FROM transactions
            WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
               OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
            ORDER BY created_at DESC
            LIMIT 200;
          `;
        }
      }
    } else {
      // All transactions involving userPhone
      if (dateRange === 'today') {
        rows = await sql`
          SELECT * FROM transactions
          WHERE (sender_phone = ${userPhone} OR receiver_phone = ${userPhone})
            AND created_at >= CURRENT_DATE
          ORDER BY created_at DESC
          LIMIT 200;
        `;
      } else {
        rows = await sql`
          SELECT * FROM transactions
          WHERE (sender_phone = ${userPhone} OR receiver_phone = ${userPhone})
          ORDER BY created_at DESC
          LIMIT 200;
        `;
      }
    }

    // Filter by status in memory if specified and not 'all'
    if (status && status !== 'all') {
      rows = rows.filter((r: any) => r.status === status);
    }

    return NextResponse.json({ transactions: rows });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const {
      sender_phone,
      receiver_phone,
      mfs_type,
      customer_phone,
      amount,
      direction,
      trx_id,
      screenshot_url,
      status,
      notes
    } = body;

    if (!sender_phone || !receiver_phone || !mfs_type || !customer_phone || amount === undefined || !direction) {
      return NextResponse.json({ error: 'Missing required transaction fields' }, { status: 400 });
    }

    const validMfs = ['bkash', 'nagad', 'rocket', 'upay'];
    if (!validMfs.includes(mfs_type)) {
      return NextResponse.json({ error: 'Invalid MFS provider' }, { status: 400 });
    }

    const validDirections = ['give', 'take'];
    if (!validDirections.includes(direction)) {
      return NextResponse.json({ error: 'Invalid direction' }, { status: 400 });
    }

    // Amount validation
    const numAmount = parseFloat(String(amount));
    if (isNaN(numAmount) || !isFinite(numAmount) || numAmount <= 0 || numAmount > 1000000) {
      return NextResponse.json({ error: 'Amount must be a valid number between ৳ 1 and ৳ 1,000,000' }, { status: 400 });
    }

    // Customer phone sanitization
    const cleanCustomerPhone = String(customer_phone).trim().replace(/[^\d+]/g, '');
    if (cleanCustomerPhone.length < 6 || cleanCustomerPhone.length > 20) {
      return NextResponse.json({ error: 'Invalid customer phone number length' }, { status: 400 });
    }

    // TrxID sanitization
    const cleanTrxId = trx_id ? String(trx_id).trim().toUpperCase().slice(0, 50) : null;

    // Notes sanitization
    const cleanNotes = notes ? String(notes).trim().slice(0, 255) : null;

    // Screenshot validation: prevent absurdly oversized payloads (> 5MB)
    if (screenshot_url && String(screenshot_url).length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Screenshot image payload too large (max 5MB)' }, { status: 400 });
    }

    const validStatuses = ['pending', 'sent', 'received', 'rejected'];
    const initialStatus = status && validStatuses.includes(status) ? status : 'pending';

    const result = await sql`
      INSERT INTO transactions (
        sender_phone,
        receiver_phone,
        mfs_type,
        customer_phone,
        amount,
        direction,
        trx_id,
        screenshot_url,
        status,
        notes,
        created_at,
        updated_at
      ) VALUES (
        ${String(sender_phone).trim()},
        ${String(receiver_phone).trim()},
        ${mfs_type},
        ${cleanCustomerPhone},
        ${numAmount},
        ${direction},
        ${cleanTrxId},
        ${screenshot_url || null},
        ${initialStatus},
        ${cleanNotes},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *;
    `;

    return NextResponse.json({ transaction: result[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

