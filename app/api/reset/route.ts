import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

const AUTHORIZED_RESET_PHONE = process.env.AUTHORIZED_RESET_PHONE || '01814558055';
const RESET_SECURITY_CODE = process.env.RESET_SECURITY_CODE || '28562';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { userPhone, securityCode } = body;

    // Only authorized phone can reset
    if (userPhone !== AUTHORIZED_RESET_PHONE) {
      return NextResponse.json(
        { error: 'অনুমতি নেই! শুধুমাত্র অনুমোদিত শপ (Rufaidah Digital Point) লেজার রিসেট করতে পারবে।' },
        { status: 403 }
      );
    }

    // Verify security code
    if (!securityCode || String(securityCode).trim() !== RESET_SECURITY_CODE) {
      return NextResponse.json(
        { error: 'ভুল সিকিউরিটি কোড! সঠিক কোড প্রদান করুন।' },
        { status: 400 }
      );
    }

    // Delete transactions
    await sql`
      DELETE FROM transactions;
    `;

    return NextResponse.json({
      success: true,
      message: 'সমস্ত লেজার লেনদেন সফলভাবে রিসেট ও মুছে ফেলা হয়েছে।'
    });
  } catch (error: any) {
    console.error('Error resetting ledger:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}


