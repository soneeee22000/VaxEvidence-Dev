/**
 * Test user lifecycle helpers.
 * Creates and deletes confirmed Supabase auth users for integration tests.
 */
import { getAdminClient } from "./supabase-test-client";

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

// Set via TEST_USER_PASSWORD env var (see .env.test.example)
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? "test-only-pw";

/**
 * Creates a confirmed user via the admin API.
 * Returns the user's id, email, and password for sign-in.
 */
export async function createTestUser(suffix: string): Promise<TestUser> {
  const admin = getAdminClient();
  const email = `test-${suffix}-${Date.now()}@vaxevidence-test.local`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  if (error) {
    throw new Error(`Failed to create test user ${email}: ${error.message}`);
  }

  return { id: data.user.id, email, password: TEST_PASSWORD };
}

/**
 * Deletes a test user via the admin API.
 * Silently ignores errors (user may already be deleted).
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const admin = getAdminClient();
  await admin.auth.admin.deleteUser(userId);
}
