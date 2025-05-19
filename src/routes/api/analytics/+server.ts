import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getStats, updateStats } from "$lib/server/analytics";

export const POST: RequestHandler = async ({ request }) => {
  const { type, metadata } = await request.json();
  const stats = await updateStats(type, metadata);
  return json({ success: true, stats });
};

export const GET: RequestHandler = async () => {
  const stats = await getStats();
  return json(stats);
};
