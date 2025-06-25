import { db } from "$lib/db";
import { events } from "$lib/db/schema";
import { eq, count } from "drizzle-orm";

// Get aggregated stats from events
export async function getStats() {
  try {
    const visitCount = await db
      .select({ count: count() })
      .from(events)
      .where(eq(events.type, "visit"));

    const mergeCount = await db
      .select({ count: count() })
      .from(events)
      .where(eq(events.type, "merge"));

    return {
      totalVisits: visitCount[0]?.count || 0,
      totalMerges: mergeCount[0]?.count || 0,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      totalVisits: 0,
      totalMerges: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Store individual event
export async function updateStats(
  type: "visit" | "merge",
  metadata?: { userAgent?: string; referrer?: string; page?: string }
) {
  try {
    await db.insert(events).values({
      type,
      userAgent: metadata?.userAgent,
      referrer: metadata?.referrer,
      page: metadata?.page,
    });

    // Return updated stats
    return getStats();
  } catch (error) {
    console.error("Error storing event:", error);
    return null;
  }
}
