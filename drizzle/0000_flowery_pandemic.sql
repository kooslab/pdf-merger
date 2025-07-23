CREATE TABLE "events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" varchar(50) NOT NULL,
	"user_agent" text,
	"referrer" text,
	"page" text,
	"page_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
