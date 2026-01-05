CREATE TABLE "auth" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"email_verified_at" timestamp,
	"email_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"two_factor_secret" varchar(255),
	"two_factor_enabled" boolean DEFAULT false,
	"two_factor_backup_codes" text[],
	CONSTRAINT "auth_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"token_hash" varchar(500) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"otp" varchar(500) NOT NULL,
	"identifier" varchar(100) DEFAULT 'email' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"attempts" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_account_id_auth_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."auth"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification" ADD CONSTRAINT "verification_account_id_auth_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."auth"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_refresh_token_user_id" ON "refresh_tokens" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_token_hash" ON "refresh_tokens" USING btree ("token_hash");