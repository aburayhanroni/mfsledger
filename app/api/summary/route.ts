import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userPhone = searchParams.get('userPhone');
    const partnerPhone = searchParams.get('partnerPhone');

    if (!userPhone) {
      return NextResponse.json({ error: 'userPhone query param is required' }, { status: 400 });
    }

    // Strictly count ONLY fully settled and confirmed transactions ('received')
    // Any transaction in waiting state ('sent' waiting confirm, 'pending' waiting payment, or 'rejected') MUST NOT be counted
    let rows;
    if (partnerPhone) {
      rows = await sql`
        SELECT 
          id, sender_phone, receiver_phone, amount, direction, status, created_at
        FROM transactions
        WHERE ((sender_phone = ${userPhone} AND receiver_phone = ${partnerPhone})
           OR (sender_phone = ${partnerPhone} AND receiver_phone = ${userPhone}))
          AND status = 'received'
        ORDER BY created_at ASC;
      `;
    } else {
      rows = await sql`
        SELECT 
          id, sender_phone, receiver_phone, amount, direction, status, created_at
        FROM transactions
        WHERE (sender_phone = ${userPhone} OR receiver_phone = ${userPhone})
          AND status = 'received'
        ORDER BY created_at ASC;
      `;
    }

    // Use Asia/Dhaka date for accurate day boundary
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());

    let todayGiven = 0;
    let todayTaken = 0;
    let totalGiven = 0;
    let totalTaken = 0;

    for (const tx of rows) {
      // Safety check: skip if not fully confirmed/received
      if (tx.status !== 'received') {
        continue;
      }

      const amt = Number(tx.amount) || 0;
      const txDateStr = tx.created_at 
        ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date(tx.created_at))
        : '';
      const isToday = txDateStr === todayStr;

      const isSender = tx.sender_phone === userPhone;
      // Current user is the payer if:
      // 1. Current user directly gave/sent money: direction === 'give' && isSender
      // 2. Partner requested money and current user fulfilled it: direction === 'take' && !isSender
      const isPayer = (tx.direction === 'give' && isSender) || (tx.direction === 'take' && !isSender);

      if (isPayer) {
        totalGiven += amt;
        if (isToday) todayGiven += amt;
      } else {
        totalTaken += amt;
        if (isToday) todayTaken += amt;
      }
    }

    // Net calculation:
    // (Total amount current user paid/gave) - (Total amount current user received/took)
    // If netBalance > 0: current user paid more than received => Partner owes user (Receivable)
    // If netBalance < 0: current user received more than paid => User owes partner (Payable)
    const netBalance = totalGiven - totalTaken;

    return NextResponse.json({
      summary: {
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
      }
    });
  } catch (error: any) {
    console.error('Error calculating summary:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

