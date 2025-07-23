import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkSchema() {
  try {
    console.log('Checking events table schema...\n');
    
    // Check if table exists and get column info
    const result = await db.execute(sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'events'
      ORDER BY ordinal_position
    `);
    
    console.log('Events table columns:');
    if (result && Array.isArray(result)) {
      result.forEach((row: any) => {
        console.log(`- ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
    } else {
      console.log('No results found');
    }
    
    // Test query to verify page_count exists
    console.log('\nTesting page_count column...');
    const test = await db.execute(sql`
      SELECT COUNT(*) as count FROM events WHERE page_count IS NOT NULL
    `);
    console.log('Query successful - page_count column exists!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();