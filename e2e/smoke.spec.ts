import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------

test.describe("Landing page", () => {
  test("loads and shows CTA", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText("Stop Spending 6 Months on Vaccine Effectiveness Studies"),
    ).toBeVisible();

    const cta = page.getByRole("link", { name: /start free trial/i }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/auth");
  });
});

// ---------------------------------------------------------------------------
// Auth redirect
// ---------------------------------------------------------------------------

test.describe("Auth redirect", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated /app redirects to /auth", async ({ page }) => {
    await page.goto("/app");
    await page.waitForURL("**/auth");
    await expect(page.getByText("Sign in to your account")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Dashboard (authenticated — uses saved auth state from setup)
// ---------------------------------------------------------------------------

test.describe("Dashboard", () => {
  test("loads after auth", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByText("Protocol Builder")).toBeVisible({
      timeout: 15_000,
    });
  });
});

// ---------------------------------------------------------------------------
// Protocol CRUD
// ---------------------------------------------------------------------------

test.describe("Protocol lifecycle", () => {
  let protocolUrl: string;

  test("create protocol", async ({ page }) => {
    await page.goto("/app/new");

    // Skip template selector
    await page
      .getByRole("button", { name: /skip templates/i })
      .click({ timeout: 10_000 });

    // Fill PICO form
    await page.getByLabel("Protocol title").fill("E2E Test Protocol");
    await page
      .getByLabel("Study question")
      .fill("Does the mRNA vaccine reduce hospitalisation in adults?");
    await page.getByLabel("Population").fill("Adults aged 18-65 in the US");
    await page
      .getByLabel("Intervention")
      .fill("mRNA COVID-19 vaccine, 2-dose primary series");
    await page.getByLabel("Comparator").fill("Unvaccinated individuals");
    await page
      .getByLabel("Outcomes")
      .fill("Hospitalisation within 14 days of symptom onset");
    await page.getByLabel("Study design").fill("Retrospective cohort study");

    // Submit
    await page.getByRole("button", { name: /create protocol/i }).click();

    // Should navigate to protocol detail page /app/<uuid>
    await page.waitForURL(/\/app\/[0-9a-f-]{36}/, { timeout: 20_000 });
    protocolUrl = page.url();
    await expect(page.getByText("Protocol details")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("edit protocol title", async ({ page }) => {
    test.skip(!protocolUrl, "Needs create step to run first");

    await page.goto(protocolUrl);
    await expect(page.getByText("Protocol details")).toBeVisible({
      timeout: 15_000,
    });

    const titleInput = page.getByLabel("Protocol title");
    await titleInput.clear();
    await titleInput.fill("E2E Updated Protocol");

    await page.getByRole("button", { name: /save changes/i }).click();

    // Wait for save confirmation (button text returns or toast appears)
    await expect(
      page.getByRole("button", { name: /save changes/i }),
    ).toBeEnabled({ timeout: 10_000 });
  });

  test("delete protocol", async ({ page }) => {
    test.skip(!protocolUrl, "Needs create step to run first");

    await page.goto(protocolUrl);
    await expect(page.getByText("Protocol details")).toBeVisible({
      timeout: 15_000,
    });

    // Click delete
    await page.getByRole("button", { name: /^delete$/i }).click();

    // Confirm in AlertDialog
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /delete/i }).click();

    // Should redirect to dashboard
    await page.waitForURL("**/app", { timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// Evidence page
// ---------------------------------------------------------------------------

test.describe("Evidence library", () => {
  test("loads with search controls", async ({ page }) => {
    await page.goto("/app/evidence");
    // Wait for search controls to appear (page fully loaded)
    await expect(page.getByPlaceholder("Search evidence...")).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("link", { name: /add evidence/i }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Datasets page
// ---------------------------------------------------------------------------

test.describe("Datasets", () => {
  test("loads with search controls", async ({ page }) => {
    await page.goto("/app/datasets");
    await expect(page.getByText("Dataset Library")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByPlaceholder("Search datasets...")).toBeVisible();
  });

  test("load sample data", async ({ page }) => {
    await page.goto("/app/datasets");
    await expect(page.getByText("Dataset Library")).toBeVisible({
      timeout: 15_000,
    });

    // Only click if the sample data button is visible (no datasets yet)
    const sampleBtn = page.getByRole("button", {
      name: /load sample/i,
    });

    if (await sampleBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await sampleBtn.click();
      // Wait for success toast or for dataset cards to appear
      await expect(page.getByText(/sample/i).first()).toBeVisible({
        timeout: 15_000,
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Dark mode — no hardcoded bg-white
// ---------------------------------------------------------------------------

test.describe("Dark mode compliance", () => {
  test("no hardcoded bg-white on /app/new", async ({ page }) => {
    await page.goto("/app/new");
    await page.waitForTimeout(2_000);

    const violatingElements = await page.locator("[class*='bg-white']").count();
    expect(violatingElements).toBe(0);
  });
});
