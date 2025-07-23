import { db } from "$lib/db";
import { events } from "$lib/db/schema";
import { eq, sum, count } from "drizzle-orm";

// Get aggregated stats from events
export async function getStats() {
  try {
    const visitCount = await db
      .select({ count: count() })
      .from(events)
      .where(eq(events.type, "visit"));

    const mergeStats = await db
      .select({ 
        totalPages: sum(events.pageCount)
      })
      .from(events)
      .where(eq(events.type, "merge"));

    const splitStats = await db
      .select({ 
        totalPages: sum(events.pageCount)
      })
      .from(events)
      .where(eq(events.type, "split"));

    return {
      totalVisits: visitCount[0]?.count || 0,
      totalPagesMerged: Number(mergeStats[0]?.totalPages || 0),
      totalPagesSplit: Number(splitStats[0]?.totalPages || 0),
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      totalVisits: 0,
      totalPagesMerged: 0,
      totalPagesSplit: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Store individual event
export async function updateStats(
  type: "visit" | "merge" | "split" | "visit_split",
  metadata?: { 
    userAgent?: string; 
    referrer?: string; 
    page?: string;
    pageCount?: number;
  }
) {
  try {
    await db.insert(events).values({
      type,
      userAgent: metadata?.userAgent,
      referrer: metadata?.referrer,
      page: metadata?.page,
      pageCount: metadata?.pageCount || 0,
    });

    // Return updated stats
    return getStats();
  } catch (error) {
    console.error("Error storing event:", error);
    return null;
  }
}