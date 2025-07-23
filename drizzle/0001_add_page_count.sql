-- Add page_count column to existing events table
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "page_count" integer DEFAULT 0;