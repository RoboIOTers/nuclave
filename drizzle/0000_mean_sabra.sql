CREATE TYPE "public"."arena_mode" AS ENUM('live', 'async');--> statement-breakpoint
CREATE TYPE "public"."arena_phase" AS ENUM('ideation', 'debate', 'prioritization', 'decision', 'closed');--> statement-breakpoint
CREATE TYPE "public"."arena_status" AS ENUM('draft', 'active', 'paused', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."arena_type" AS ENUM('software_planning', 'product_critique', 'policy_review', 'strategic_decision', 'retrospective', 'brainstorm', 'custom');--> statement-breakpoint
CREATE TYPE "public"."contribution_type" AS ENUM('benefit', 'risk', 'feature', 'blocker', 'checklist', 'question', 'decision', 'wildcard');--> statement-breakpoint
CREATE TYPE "public"."participant_role" AS ENUM('facilitator', 'expert', 'contributor', 'observer');--> statement-breakpoint
CREATE TYPE "public"."signal_type" AS ENUM('agree', 'critical', 'challenge');--> statement-breakpoint
CREATE TABLE "arena_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"arena_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "participant_role" DEFAULT 'contributor' NOT NULL,
	"display_name" text,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "arena_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"arena_id" uuid NOT NULL,
	"phase" "arena_phase" NOT NULL,
	"consensus_items" jsonb DEFAULT '[]'::jsonb,
	"contested_items" jsonb DEFAULT '[]'::jsonb,
	"unresolved_questions" jsonb DEFAULT '[]'::jsonb,
	"critical_blockers" jsonb DEFAULT '[]'::jsonb,
	"top_ideas_by_type" jsonb DEFAULT '{}'::jsonb,
	"narrative_summary" text,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "arenas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "arena_type" DEFAULT 'brainstorm' NOT NULL,
	"mode" "arena_mode" DEFAULT 'live' NOT NULL,
	"phase" "arena_phase" DEFAULT 'ideation' NOT NULL,
	"status" "arena_status" DEFAULT 'draft' NOT NULL,
	"is_anonymous" boolean DEFAULT true NOT NULL,
	"join_code" varchar(12) NOT NULL,
	"context_document" text,
	"max_contributors" integer DEFAULT 10,
	"phase_timer_minutes" jsonb,
	"created_by_id" uuid NOT NULL,
	"async_deadline" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "arenas_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
CREATE TABLE "clusters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"arena_id" uuid NOT NULL,
	"label" text NOT NULL,
	"summary" text,
	"contribution_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"arena_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"type" "contribution_type" NOT NULL,
	"content" text NOT NULL,
	"is_skeptic_ai" boolean DEFAULT false NOT NULL,
	"parent_contribution_id" uuid,
	"cluster_id" uuid,
	"consensus_score" integer,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contribution_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "signal_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"name" text,
	"avatar_url" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "arena_participants" ADD CONSTRAINT "arena_participants_arena_id_arenas_id_fk" FOREIGN KEY ("arena_id") REFERENCES "public"."arenas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arena_participants" ADD CONSTRAINT "arena_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arena_summaries" ADD CONSTRAINT "arena_summaries_arena_id_arenas_id_fk" FOREIGN KEY ("arena_id") REFERENCES "public"."arenas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arenas" ADD CONSTRAINT "arenas_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clusters" ADD CONSTRAINT "clusters_arena_id_arenas_id_fk" FOREIGN KEY ("arena_id") REFERENCES "public"."arenas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_arena_id_arenas_id_fk" FOREIGN KEY ("arena_id") REFERENCES "public"."arenas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_contribution_id_contributions_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."contributions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "arena_participant_unique" ON "arena_participants" USING btree ("arena_id","user_id");--> statement-breakpoint
CREATE INDEX "arena_participants_arena_idx" ON "arena_participants" USING btree ("arena_id");--> statement-breakpoint
CREATE INDEX "summaries_arena_idx" ON "arena_summaries" USING btree ("arena_id");--> statement-breakpoint
CREATE INDEX "arenas_join_code_idx" ON "arenas" USING btree ("join_code");--> statement-breakpoint
CREATE INDEX "arenas_status_idx" ON "arenas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "arenas_created_by_idx" ON "arenas" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "clusters_arena_idx" ON "clusters" USING btree ("arena_id");--> statement-breakpoint
CREATE INDEX "contributions_arena_idx" ON "contributions" USING btree ("arena_id");--> statement-breakpoint
CREATE INDEX "contributions_cluster_idx" ON "contributions" USING btree ("cluster_id");--> statement-breakpoint
CREATE INDEX "contributions_type_idx" ON "contributions" USING btree ("arena_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "signal_unique" ON "signals" USING btree ("contribution_id","user_id");--> statement-breakpoint
CREATE INDEX "signals_contribution_idx" ON "signals" USING btree ("contribution_id");