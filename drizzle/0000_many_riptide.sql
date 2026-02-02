CREATE TABLE "onboarding_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text DEFAULT 'default' NOT NULL,
	"current_step" integer DEFAULT 0 NOT NULL,
	"total_steps" integer DEFAULT 9 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"is_completed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "onboarding_progress_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "personalization_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text DEFAULT 'default' NOT NULL,
	"language" text DEFAULT 'en-GB' NOT NULL,
	"language_name" text DEFAULT 'English (UK)' NOT NULL,
	"primary_color" text DEFAULT '#9333ea' NOT NULL,
	"appearance" text DEFAULT 'dark' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "personalization_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text DEFAULT 'default' NOT NULL,
	"authority" text NOT NULL,
	"authority_name" text NOT NULL,
	"decimal_format" boolean DEFAULT true NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"field_name" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"change_reason" text
);
