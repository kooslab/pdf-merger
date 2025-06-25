import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function setupDatabase() {
  try {
    console.log('Creating events table...');
    
    // Create the events table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        user_agent TEXT,
        referrer TEXT,
        page TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    
    console.log('Events table created successfully!');
    
    // Verify table creation
    const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'events'
      ORDER BY ordinal_position
    `);
    
    console.log('\nTable schema:');
    console.log(result);
    
  } catch (error) {
    console.error('Error setting up database:', error);
  }
  
  process.exit(0);
}

setupDatabase();