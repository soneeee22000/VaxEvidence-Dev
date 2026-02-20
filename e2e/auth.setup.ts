import { test as setup, expect } from "@playwright/test";

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? "test@vaxevidence.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? "TestPass123!";

/**
 * Auth setup — signs in via the /auth page and persists session storage
 * so subsequent tests can skip the login step.
 */
setup("authenticate", async ({ page }) => {
  await page.goto("/auth");
  await expect(page.getByText("Sign in to your account")).toBeVisible();

  // Fill sign-in form
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASSWORD);

  // Submit
  await page.getByRole("button", { name: "Sign In" }).click();

  // Wait for redirect to /app dashboard
  await page.waitForURL("**/app", { timeout: 30_000 });
  await expect(page.getByText("Protocol Builder")).toBeVisible();

  // Persist auth state
  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
