import { db } from '../src/lib/db';
import { events } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function checkDatabase() {
  try {
    // Check if events table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'events'
      );
    `);
    
    const exists = tableExists.rows?.[0]?.exists ?? false;
    console.log('Events table exists:', exists);
    
    if (exists) {
      // Get count of events
      const count = await db.select({ count: sql`count(*)` }).from(events);
      console.log('Total events in database:', count[0].count);
      
      // Get sample events
      const sampleEvents = await db.select().from(events).limit(5);
      console.log('\nSample events:');
      console.log(sampleEvents);
    }
  } catch (error) {
    console.error('Error checking database:', error);
  }
  
  process.exit(0);
}

checkDatabase();