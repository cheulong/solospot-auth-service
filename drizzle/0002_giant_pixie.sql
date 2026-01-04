CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"otp" varchar(500) NOT NULL,
	"identifier" varchar(100) DEFAULT 'email' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "verification" ADD CONSTRAINT "verification_account_id_auth_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."auth"("id") ON DELETE cascade ON UPDATE no action;