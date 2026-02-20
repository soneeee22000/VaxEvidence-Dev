-- Add email columns to reviews for display purposes
-- These are denormalized for convenience since we can't join auth.users from client
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS reviewer_email TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS requester_email TEXT;
