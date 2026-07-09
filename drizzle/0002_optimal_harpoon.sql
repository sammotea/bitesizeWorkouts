CREATE TABLE "rehab_days" (
	"date" text PRIMARY KEY NOT NULL,
	"exercise_ids" jsonb NOT NULL,
	"progress" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
