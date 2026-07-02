ALTER TABLE "invitations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "team_members" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "teams" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "invitations" CASCADE;--> statement-breakpoint
DROP TABLE "team_members" CASCADE;--> statement-breakpoint
DROP TABLE "teams" CASCADE;--> statement-breakpoint
ALTER TABLE "download_logs" ADD COLUMN "type" varchar(20);--> statement-breakpoint
ALTER TABLE "download_logs" ADD COLUMN "lang" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "paddle_customer_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "paddle_subscription_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "paddle_price_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan_name" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_status" varchar(20);--> statement-breakpoint
ALTER TABLE "activity_logs" DROP COLUMN "team_id";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_paddle_customer_id_unique" UNIQUE("paddle_customer_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_paddle_subscription_id_unique" UNIQUE("paddle_subscription_id");