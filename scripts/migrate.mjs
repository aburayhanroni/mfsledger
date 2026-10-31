import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log("Applying schema to Neon Postgres...");

  await sql`
    DO $$ BEGIN
      CREATE TYPE mfs_provider AS ENUM ('bkash', 'nagad', 'rocket', 'upay');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE transaction_status AS ENUM ('pending', 'sent', 'received', 'rejected');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE transaction_direction AS ENUM ('give', 'take');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      sender_phone VARCHAR(20) NOT NULL,
      receiver_phone VARCHAR(20) NOT NULL,
      mfs_type mfs_provider NOT NULL,
      customer_phone VARCHAR(20),
      amount NUMERIC(12, 2) NOT NULL,
      direction transaction_direction NOT NULL,
      trx_id VARCHAR(100),
      screenshot_url TEXT,
      status transaction_status DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (created_at);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_transactions_phones ON transactions (sender_phone, receiver_phone);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_transactions_composite ON transactions (status, created_at);
  `;

  console.log("Schema applied successfully!");

  // Verify by running a real query
  const testQuery = await sql`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'transactions'
    ORDER BY ordinal_position;
  `;

  console.log("Verified 'transactions' table columns:", testQuery.map(c => `${c.column_name} (${c.data_type})`));
}

run().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});

