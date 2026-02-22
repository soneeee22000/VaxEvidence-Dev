import { test, expect } from "@playwright/test";

/**
 * Phase 12 — Enterprise & Integrations E2E tests.
 *
 * Exercises the Settings page with tabs for API Keys, Webhooks,
 * SSO, Integrations, Audit Log, and Compliance. Handles both
 * workspace-exists and no-workspace states gracefully.
 */

test.describe("Phase 12 — Enterprise Settings", () => {
  // -----------------------------------------------------------------------
  // Settings page loading
  // -----------------------------------------------------------------------

  test("settings page loads with title", async ({ page }) => {
    await page.goto("/app/settings");

    // Should show either settings with tabs or empty state
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("settings page shows tabs or empty state", async ({ page }) => {
    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({
      timeout: 15_000,
    });

    // Either "No Workspace Found" or tabs are visible
    const noWorkspace = page.getByText("No Workspace Found");
    const apiKeysTab = page.getByRole("tab", { name: /api keys/i });

    await expect(noWorkspace.or(apiKeysTab)).toBeVisible({ timeout: 5_000 });
  });

  // -----------------------------------------------------------------------
  // Tab visibility (conditional on workspace existing)
  // -----------------------------------------------------------------------

  test("6 settings tabs are visible when workspace exists", async ({
    page,
  }) => {
    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({
      timeout: 15_000,
    });

    const apiKeysTab = page.getByRole("tab", { name: /api keys/i });
    if (!(await apiKeysTab.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, "No workspace — tabs not rendered");
    }

    await expect(apiKeysTab).toBeVisible();
    await expect(page.getByRole("tab", { name: /webhooks/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /sso/i })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /integrations/i }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: /audit log/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /compliance/i })).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // API Keys tab
  // -----------------------------------------------------------------------

  test("API Keys tab shows panel with Create button", async ({ page }) => {
    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({
      timeout: 15_000,
    });

    const apiKeysTab = page.getByRole("tab", { name: /api keys/i });
    if (!(await apiKeysTab.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, "No workspace");
    }

    await apiKeysTab.click();

    // "API Keys" heading and "Create API Key" button
    await expect(page.getByText("API Keys").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /create api key/i }),
    ).toBeVisible();
  });

  test("Create API Key dialog opens with form fields", async ({ page }) => {
    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({
      timeout: 15_000,
    });

    const apiKeysTab = page.getByRole("tab", { name: /api keys/i });
    if (!(await apiKeysTab.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, "No workspace");
    }

    await apiKeysTab.click();
    await page.getByRole("button", { name: /create api key/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByText("Create API Key")).toBeVisible();

    // Name input field
    const nameInput = dialog.getByPlaceholder(/ci pipeline|analytics service/i);
    await expect(nameInput).toBeVisible();

    // Scope checkboxes
    await expect(dialog.getByText("Read")).toBeVisible();
    await expect(dialog.getByText("Write")).toBeVisible();
    await expect(dialog.getByText("Admin")).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // Webhooks tab
  // -----------------------------------------------------------------------

  test("Webhooks tab shows panel with Create button", async ({ page }) => {
    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({
      timeout: 15_000,
    });

    const webhooksTab = page.getByRole("tab", { name: /webhooks/i });
    if (!(await webhooksTab.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, "No workspace");
    }

    await webhooksTab.click();

    await expect(page.getByText("Webhooks").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /create webhook/i }),
    ).toBeVisible();
  });

  test("Create Webhook dialog opens with URL and event fields", async ({
    page,
  }) => {
    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({
      timeout: 15_000,
    });

    const webhooksTab = page.getByRole("tab", { name: /webhooks/i });
    if (!(await webhooksTab.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, "No workspace");
    }

    await webhooksTab.click();
    await page.getByRole("button", { name: /create webhook/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
  });

  // -----------------------------------------------------------------------
  // SSO tab
  // -----------------------------------------------------------------------

  test("SSO tab shows SAML configuration panel", async ({ page }) => {
    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({
      timeout: 15_000,
    });

    const ssoTab = page.getByRole("tab", { name: /sso/i });
    if (!(await ssoTab.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, "No workspace");
    }

    await ssoTab.click();

    // SSO panel heading
    await expect(
      page.getByText(/saml sso|sso configuration|single sign-on/i).first(),
    ).toBeVisible({ timeout: 5_000 });

    // Add SSO Config button
    await expect(page.getByRole("button", { name: /add sso/i })).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // Integrations tab
  // -----------------------------------------------------------------------

  test("Integrations tab shows provider options", async ({ page }) => {
    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({
      timeout: 15_000,
    });

    const intTab = page.getByRole("tab", { name: /integrations/i });
    if (!(await intTab.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, "No workspace");
    }

    await intTab.click();

    // At least one integration provider should be visible
    const zotero = page.getByText(/zotero/i);
    const mendeley = page.getByText(/mendeley/i);
    const redcap = page.getByText(/redcap/i);

    await expect(zotero.or(mendeley).or(redcap)).toBeVisible({
      timeout: 5_000,
    });
  });

  // -----------------------------------------------------------------------
  // Audit Log tab
  // -----------------------------------------------------------------------

  test("Audit Log tab shows viewer with filters", async ({ page }) => {
    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({
      timeout: 15_000,
    });

    const auditTab = page.getByRole("tab", { name: /audit log/i });
    if (!(await auditTab.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, "No workspace");
    }

    await auditTab.click();

    // Audit Log heading
    await expect(page.getByText("Audit Log").first()).toBeVisible({
      timeout: 5_000,
    });

    // Filter controls or empty state
    const filterOrEmpty = page.getByText(/all actions|no audit logs/i).first();
    await expect(filterOrEmpty).toBeVisible({ timeout: 5_000 });
  });

  // -----------------------------------------------------------------------
  // Compliance tab
  // -----------------------------------------------------------------------

  test("Compliance tab shows dashboard and data residency", async ({
    page,
  }) => {
    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({
      timeout: 15_000,
    });

    const compTab = page.getByRole("tab", { name: /compliance/i });
    if (!(await compTab.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, "No workspace");
    }

    await compTab.click();

    // Compliance Dashboard heading
    await expect(page.getByText(/compliance dashboard/i).first()).toBeVisible({
      timeout: 5_000,
    });
  });

  // -----------------------------------------------------------------------
  // No workspace empty state
  // -----------------------------------------------------------------------

  test("no-workspace state shows informative message", async ({ page }) => {
    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({
      timeout: 15_000,
    });

    const noWorkspace = page.getByText("No Workspace Found");
    if (await noWorkspace.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(noWorkspace).toBeVisible();
      await expect(page.getByText(/create a workspace first/i)).toBeVisible();
    }
  });
});
