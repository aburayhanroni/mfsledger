import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function test() {
  console.log("Checking current transactions count in Neon...");
  const count = await sql`SELECT count(*) FROM transactions;`;
  console.log("Current total transactions count:", count[0].count);

  if (Number(count[0].count) === 0) {
    console.log("Inserting initial demo transactions between Shop A and Shop B...");
    await sql`
      INSERT INTO transactions (
        sender_phone, receiver_phone, mfs_type, customer_phone, amount, direction, trx_id, status, notes
      ) VALUES 
      ('01711000001', '01911000002', 'bkash', '01799887766', 2000.00, 'give', 'BK89X123', 'sent', 'Cash out at counter'),
      ('01911000002', '01711000001', 'nagad', '01811223344', 500.00, 'give', 'NG44B789', 'received', 'Customer balance request');
    `;
    console.log("Demo transactions inserted!");
  }

  const latest = await sql`
    SELECT id, sender_phone, receiver_phone, mfs_type, customer_phone, amount, direction, status, created_at 
    FROM transactions 
    ORDER BY created_at DESC 
    LIMIT 5;
  `;
  console.log("Latest transactions in Neon DB:", latest);
}

test().catch(console.error);

