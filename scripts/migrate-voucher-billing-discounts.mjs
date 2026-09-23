import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  await pool.query(`
    ALTER TABLE subscription_months ADD COLUMN IF NOT EXISTS "discountRandCents" integer NOT NULL DEFAULT 0;
    ALTER TABLE voucher_campaigns ADD COLUMN IF NOT EXISTS "recurrence" text NOT NULL DEFAULT 'once';
    ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS "recurrence" text NOT NULL DEFAULT 'once';
  `)
  console.log("[v0] migration applied")
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
