import { pgTable, integer, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const events = pgTable('events', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  type: varchar('type', { length: 50 }).notNull(),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  page: text('page'),
  pageCount: integer('page_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});