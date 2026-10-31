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

    const isToday = dateRange === 'today';
    const hasMfs = mfs && mfs !== 'all';
    const hasStatus = status && status !== 'all';

    let res;
    if (partnerPhone) {
      if (isToday) {
        if (hasMfs && hasStatus) {
          res = await sql`
            WITH summary_data AS (
              SELECT 
                COALESCE(SUM(CASE WHEN ((direction = 'give' AND sender_phone = ${userPhone}) OR (direction = 'take' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS total_given,
                COALESCE(SUM(CASE WHEN ((direction = 'take' AND sender_phone = ${userPhone}) OR (direction = 'give' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS total_taken,
                COALESCE(SUM(CASE WHEN created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka' AND ((direction = 'give' AND sender_phone = ${userPhone}) OR (direction = 'take' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS today_given,
                COALESCE(SUM(CASE WHEN created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka' AND ((direction = 'take' AND sender_phone = ${userPhone}) OR (direction = 'give' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS today_taken
              FROM transactions
              WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
                 OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
                AND status = 'received'
            ),
            tx_list AS (
              SELECT * FROM transactions
              WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
                 OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
                AND mfs_type = ${mfs}
                AND status = ${status}
                AND created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka'
              ORDER BY created_at DESC
              LIMIT 150
            )
            SELECT 
              (SELECT row_to_json(summary_data) FROM summary_data) AS summary,
              (SELECT coalesce(json_agg(tx_list), '[]'::json) FROM tx_list) AS transactions;
          `;
        } else if (hasMfs) {
          res = await sql`
            WITH summary_data AS (
              SELECT 
                COALESCE(SUM(CASE WHEN ((direction = 'give' AND sender_phone = ${userPhone}) OR (direction = 'take' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS total_given,
                COALESCE(SUM(CASE WHEN ((direction = 'take' AND sender_phone = ${userPhone}) OR (direction = 'give' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS total_taken,
                COALESCE(SUM(CASE WHEN created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka' AND ((direction = 'give' AND sender_phone = ${userPhone}) OR (direction = 'take' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS today_given,
                COALESCE(SUM(CASE WHEN created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka' AND ((direction = 'take' AND sender_phone = ${userPhone}) OR (direction = 'give' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS today_taken
              FROM transactions
              WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
                 OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
                AND status = 'received'
            ),
            tx_list AS (
              SELECT * FROM transactions
              WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
                 OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
                AND mfs_type = ${mfs}
                AND created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka'
              ORDER BY created_at DESC
              LIMIT 150
            )
            SELECT 
              (SELECT row_to_json(summary_data) FROM summary_data) AS summary,
              (SELECT coalesce(json_agg(tx_list), '[]'::json) FROM tx_list) AS transactions;
          `;
        } else if (hasStatus) {
          res = await sql`
            WITH summary_data AS (
              SELECT 
                COALESCE(SUM(CASE WHEN ((direction = 'give' AND sender_phone = ${userPhone}) OR (direction = 'take' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS total_given,
                COALESCE(SUM(CASE WHEN ((direction = 'take' AND sender_phone = ${userPhone}) OR (direction = 'give' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS total_taken,
                COALESCE(SUM(CASE WHEN created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka' AND ((direction = 'give' AND sender_phone = ${userPhone}) OR (direction = 'take' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS today_given,
                COALESCE(SUM(CASE WHEN created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka' AND ((direction = 'take' AND sender_phone = ${userPhone}) OR (direction = 'give' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS today_taken
              FROM transactions
              WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
                 OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
                AND status = 'received'
            ),
            tx_list AS (
              SELECT * FROM transactions
              WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
                 OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
                AND status = ${status}
                AND created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka'
              ORDER BY created_at DESC
              LIMIT 150
            )
            SELECT 
              (SELECT row_to_json(summary_data) FROM summary_data) AS summary,
              (SELECT coalesce(json_agg(tx_list), '[]'::json) FROM tx_list) AS transactions;
          `;
        } else {
          res = await sql`
            WITH summary_data AS (
              SELECT 
                COALESCE(SUM(CASE WHEN ((direction = 'give' AND sender_phone = ${userPhone}) OR (direction = 'take' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS total_given,
                COALESCE(SUM(CASE WHEN ((direction = 'take' AND sender_phone = ${userPhone}) OR (direction = 'give' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS total_taken,
                COALESCE(SUM(CASE WHEN created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka' AND ((direction = 'give' AND sender_phone = ${userPhone}) OR (direction = 'take' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS today_given,
                COALESCE(SUM(CASE WHEN created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka' AND ((direction = 'take' AND sender_phone = ${userPhone}) OR (direction = 'give' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS today_taken
              FROM transactions
              WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
                 OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
                AND status = 'received'
            ),
            tx_list AS (
              SELECT * FROM transactions
              WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
                 OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
                AND created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka'
              ORDER BY created_at DESC
              LIMIT 150
            )
            SELECT 
              (SELECT row_to_json(summary_data) FROM summary_data) AS summary,
              (SELECT coalesce(json_agg(tx_list), '[]'::json) FROM tx_list) AS transactions;
          `;
        }
      } else {
        // All time
        if (hasMfs && hasStatus) {
          res = await sql`
            WITH summary_data AS (
              SELECT 
                COALESCE(SUM(CASE WHEN ((direction = 'give' AND sender_phone = ${userPhone}) OR (direction = 'take' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS total_given,
                COALESCE(SUM(CASE WHEN ((direction = 'take' AND sender_phone = ${userPhone}) OR (direction = 'give' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS total_taken,
                COALESCE(SUM(CASE WHEN created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka' AND ((direction = 'give' AND sender_phone = ${userPhone}) OR (direction = 'take' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS today_given,
                COALESCE(SUM(CASE WHEN created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka' AND ((direction = 'take' AND sender_phone = ${userPhone}) OR (direction = 'give' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS today_taken
              FROM transactions
              WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
                 OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
                AND status = 'received'
            ),
            tx_list AS (
              SELECT * FROM transactions
              WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
                 OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
                AND mfs_type = ${mfs}
                AND status = ${status}
              ORDER BY created_at DESC
              LIMIT 150
            )
            SELECT 
              (SELECT row_to_json(summary_data) FROM summary_data) AS summary,
              (SELECT coalesce(json_agg(tx_list), '[]'::json) FROM tx_list) AS transactions;
          `;
        } else if (hasMfs) {
          res = await sql`
            WITH summary_data AS (
              SELECT 
                COALESCE(SUM(CASE WHEN ((direction = 'give' AND sender_phone = ${userPhone}) OR (direction = 'take' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS total_given,
                COALESCE(SUM(CASE WHEN ((direction = 'take' AND sender_phone = ${userPhone}) OR (direction = 'give' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS total_taken,
                COALESCE(SUM(CASE WHEN created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka' AND ((direction = 'give' AND sender_phone = ${userPhone}) OR (direction = 'take' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS today_given,
                COALESCE(SUM(CASE WHEN created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka' AND ((direction = 'take' AND sender_phone = ${userPhone}) OR (direction = 'give' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS today_taken
              FROM transactions
              WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
                 OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
                AND status = 'received'
            ),
            tx_list AS (
              SELECT * FROM transactions
              WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
                 OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
                AND mfs_type = ${mfs}
              ORDER BY created_at DESC
              LIMIT 150
            )
            SELECT 
              (SELECT row_to_json(summary_data) FROM summary_data) AS summary,
              (SELECT coalesce(json_agg(tx_list), '[]'::json) FROM tx_list) AS transactions;
          `;
        } else if (hasStatus) {
          res = await sql`
            WITH summary_data AS (
              SELECT 
                COALESCE(SUM(CASE WHEN ((direction = 'give' AND sender_phone = ${userPhone}) OR (direction = 'take' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS total_given,
                COALESCE(SUM(CASE WHEN ((direction = 'take' AND sender_phone = ${userPhone}) OR (direction = 'give' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS total_taken,
                COALESCE(SUM(CASE WHEN created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka' AND ((direction = 'give' AND sender_phone = ${userPhone}) OR (direction = 'take' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS today_given,
                COALESCE(SUM(CASE WHEN created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka' AND ((direction = 'take' AND sender_phone = ${userPhone}) OR (direction = 'give' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS today_taken
              FROM transactions
              WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
                 OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
                AND status = 'received'
            ),
            tx_list AS (
              SELECT * FROM transactions
              WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
                 OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
                AND status = ${status}
              ORDER BY created_at DESC
              LIMIT 150
            )
            SELECT 
              (SELECT row_to_json(summary_data) FROM summary_data) AS summary,
              (SELECT coalesce(json_agg(tx_list), '[]'::json) FROM tx_list) AS transactions;
          `;
        } else {
          res = await sql`
            WITH summary_data AS (
              SELECT 
                COALESCE(SUM(CASE WHEN ((direction = 'give' AND sender_phone = ${userPhone}) OR (direction = 'take' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS total_given,
                COALESCE(SUM(CASE WHEN ((direction = 'take' AND sender_phone = ${userPhone}) OR (direction = 'give' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS total_taken,
                COALESCE(SUM(CASE WHEN created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka' AND ((direction = 'give' AND sender_phone = ${userPhone}) OR (direction = 'take' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS today_given,
                COALESCE(SUM(CASE WHEN created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date AT TIME ZONE 'Asia/Dhaka' AND ((direction = 'take' AND sender_phone = ${userPhone}) OR (direction = 'give' AND sender_phone = ${partnerPhone})) THEN amount ELSE 0 END), 0)::numeric AS today_taken
              FROM transactions
              WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
                 OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
                AND status = 'received'
            ),
            tx_list AS (
              SELECT * FROM transactions
              WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
                 OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
              ORDER BY created_at DESC
              LIMIT 150
            )
            SELECT 
              (SELECT row_to_json(summary_data) FROM summary_data) AS summary,
              (SELECT coalesce(json_agg(tx_list), '[]'::json) FROM tx_list) AS transactions;
          `;
        }
      }
    } else {
      res = await sql`
        SELECT * FROM transactions
        WHERE (sender_phone = ${userPhone} OR receiver_phone = ${userPhone})
        ORDER BY created_at DESC
        LIMIT 100;
      `;
      return NextResponse.json({ transactions: res, summary: null });
    }

    const rawSummary = res[0]?.summary || { total_given: 0, total_taken: 0, today_given: 0, today_taken: 0 };
    const rawTx = res[0]?.transactions || [];

    const totalGiven = Number(rawSummary.total_given) || 0;
    const totalTaken = Number(rawSummary.total_taken) || 0;
    const todayGiven = Number(rawSummary.today_given) || 0;
    const todayTaken = Number(rawSummary.today_taken) || 0;
    const netBalance = totalGiven - totalTaken;

    const summary = {
      todayGiven,
      todayTaken,
      totalGiven,
      totalTaken,
      netBalance,
      statusText: netBalance > 0 
        ? `Partner owes you ৳ ${netBalance.toLocaleString()}`
        : netBalance < 0
        ? `You owe partner ৳ ${Math.abs(netBalance).toLocaleString()}`
        : `All settled up (৳ 0)`
    };

    return NextResponse.json({ transactions: rawTx, summary });
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

    if (!sender_phone || !receiver_phone || !mfs_type || amount === undefined || !direction) {
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

    // Customer phone sanitization (Optional)
    let cleanCustomerPhone: string | null = null;
    if (customer_phone && String(customer_phone).trim()) {
      const sanitized = String(customer_phone).trim().replace(/[^\d+]/g, '');
      if (sanitized.length >= 3 && sanitized.length <= 20) {
        cleanCustomerPhone = sanitized;
      } else if (sanitized.length > 0) {
        return NextResponse.json({ error: 'Invalid customer phone number' }, { status: 400 });
      }
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

