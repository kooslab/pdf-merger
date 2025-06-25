import { db } from '../src/lib/db';
import { events } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import readline from 'readline';

async function migrate() {
  console.log('Starting migration to Neon...');
  
  try {
    // Create table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        user_agent TEXT,
        referrer TEXT,
        page TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    console.log('Table created/verified');
    
    // Read the events data
    const dataPath = './data/events_data.sql';
    if (fs.existsSync(dataPath)) {
      const fileStream = fs.createReadStream(dataPath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });
      
      let isData = false;
      const records = [];
      
      for await (const line of rl) {
        if (line.startsWith('COPY public.events')) {
          isData = true;
          continue;
        }
        if (line === '\\.') {
          break;
        }
        if (isData && line.trim()) {
          const parts = line.split('\t');
          if (parts.length >= 6) {
            records.push({
              type: parts[1],
              userAgent: parts[3] === '\\N' ? null : parts[3],
              referrer: parts[4] === '\\N' ? null : parts[4],
              page: parts[5] === '\\N' ? null : parts[5],
              createdAt: new Date(parts[2])
            });
          }
        }
      }
      
      if (records.length > 0) {
        console.log(`Inserting ${records.length} records...`);
        await db.insert(events).values(records);
        console.log('Data migration completed!');
      } else {
        console.log('No data to migrate');
      }
    } else {
      console.log('No events data file found, creating empty table');
    }
    
    // Verify the migration
    const count = await db.select({ count: sql`count(*)` }).from(events);
    console.log(`Total events in database: ${count[0].count}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();