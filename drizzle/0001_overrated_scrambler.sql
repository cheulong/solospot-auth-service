ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_user_id_auth_id_fk";
--> statement-breakpoint
DROP INDEX "idx_refresh_token_user_id";--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "account_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_account_id_auth_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."auth"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_refresh_token_user_id" ON "refresh_tokens" USING btree ("account_id");--> statement-breakpoint
ALTER TABLE "refresh_tokens" DROP COLUMN "user_id";