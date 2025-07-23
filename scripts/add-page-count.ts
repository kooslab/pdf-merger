import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function addPageCountColumn() {
  try {
    console.log('Adding page_count column to events table...');
    
    await db.execute(sql`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS page_count INTEGER DEFAULT 0
    `);
    
    console.log('Successfully added page_count column!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding page_count column:', error);
    process.exit(1);
  }
}

addPageCountColumn();