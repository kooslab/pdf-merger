import { db } from '../src/lib/db';
import { events } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import readline from 'readline';

async function importData() {
  console.log('Starting data import from Supabase backup...');
  
  try {
    // Clear existing data
    await db.delete(events);
    console.log('Cleared existing data');
    
    // Read the events data
    const dataPath = './data/events_data.sql';
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
      console.log(`Importing ${records.length} records...`);
      
      // Insert in batches
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await db.insert(events).values(batch);
        console.log(`Imported ${Math.min(i + batchSize, records.length)}/${records.length} records`);
      }
      
      console.log('Data import completed!');
    } else {
      console.log('No data to import');
    }
    
    // Verify the import
    const count = await db.select({ count: sql`count(*)` }).from(events);
    console.log(`\nTotal events in database: ${count[0].count}`);
    
    // Show some sample data
    const samples = await db.select().from(events).limit(5);
    console.log('\nSample imported data:');
    samples.forEach(sample => {
      console.log(`- ${sample.type} at ${sample.createdAt} from ${sample.page || 'unknown'}`);
    });
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

importData();