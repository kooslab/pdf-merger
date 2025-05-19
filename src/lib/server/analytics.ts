import { supabase } from "$lib/supabase";

// Get aggregated stats from events
export async function getStats() {
  const { data: visitCount, error: visitError } = await supabase
    .from("events")
    .select("type", { count: "exact" })
    .eq("type", "visit");

  const { data: mergeCount, error: mergeError } = await supabase
    .from("events")
    .select("type", { count: "exact" })
    .eq("type", "merge");

  if (visitError || mergeError) {
    console.error("Error fetching stats:", visitError || mergeError);
    return {
      totalVisits: 0,
      totalMerges: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  return {
    totalVisits: visitCount?.length || 0,
    totalMerges: mergeCount?.length || 0,
    lastUpdated: new Date().toISOString(),
  };
}

// Store individual event
export async function updateStats(
  type: "visit" | "merge",
  metadata?: { userAgent?: string; referrer?: string; page?: string }
) {
  const { data, error } = await supabase
    .from("events")
    .insert({
      type,
      user_agent: metadata?.userAgent,
      referrer: metadata?.referrer,
      page: metadata?.page,
    })
    .select()
    .single();

  if (error) {
    console.error("Error storing event:", error);
    return null;
  }

  // Return updated stats
  return getStats();
}
