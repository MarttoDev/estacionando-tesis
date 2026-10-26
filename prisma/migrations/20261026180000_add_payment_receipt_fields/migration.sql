-- AlterTable: capture Webpay's authorization code, card last digits, and confirmation time for the receipt
ALTER TABLE "payments" ADD COLUMN "authorization_code" TEXT;
ALTER TABLE "payments" ADD COLUMN "card_last_digits" TEXT;
ALTER TABLE "payments" ADD COLUMN "paid_at" TIMESTAMP(3);
