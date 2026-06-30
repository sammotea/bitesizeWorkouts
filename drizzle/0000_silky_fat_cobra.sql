CREATE TABLE "set_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_id" uuid NOT NULL,
	"exercise_id" text NOT NULL,
	"set_number" integer NOT NULL,
	"weight" numeric,
	"reps" integer,
	"duration_sec" integer,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"performed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"type" text NOT NULL,
	"biases" jsonb NOT NULL,
	"composition" jsonb NOT NULL,
	"finished" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "set_logs" ADD CONSTRAINT "set_logs_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE cascade ON UPDATE no action;