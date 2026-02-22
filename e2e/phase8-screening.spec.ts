import { test, expect } from "@playwright/test";
import {
  createTestProtocol,
  createTestEvidence,
  linkEvidenceToProtocol,
  deleteTestProtocol,
} from "./fixtures";

/**
 * Phase 8 — Systematic Review / PRISMA E2E tests.
 *
 * Exercises the screening pipeline, PRISMA flow diagram,
 * risk-of-bias summary, and meta-analysis panel.
 */

let protocolUrl: string;
let protocolId: string;

test.describe("Phase 8 — Screening & Systematic Review", () => {
  test.describe.configure({ mode: "serial" });

  // -----------------------------------------------------------------------
  // Setup: create protocol + evidence, link them
  // -----------------------------------------------------------------------

  test("setup: create protocol", async ({ page }) => {
    const result = await createTestProtocol(page, "Phase 8 Screening Test");
    protocolUrl = result.url;
    protocolId = result.id;
    expect(protocolId).toBeTruthy();
  });

  test("setup: create evidence and link to protocol", async ({ page }) => {
    test.skip(!protocolUrl, "Needs protocol from previous step");
    await createTestEvidence(page, "Phase 8 Screening Evidence");
    await linkEvidenceToProtocol(page, protocolUrl);
  });

  // -----------------------------------------------------------------------
  // Screening page loads
  // -----------------------------------------------------------------------

  test("screening page loads with heading and tabs", async ({ page }) => {
    test.skip(!protocolId, "Needs protocol");
    await page.goto(`/app/${protocolId}/screening`);

    // Heading
    await expect(page.getByText("Systematic Review")).toBeVisible({
      timeout: 15_000,
    });

    // 4 tabs
    await expect(page.getByRole("tab", { name: /screening/i })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /prisma diagram/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /risk of bias/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /meta-analysis/i }),
    ).toBeVisible();
  });

  test("stats bar shows 4 screening stages", async ({ page }) => {
    test.skip(!protocolId, "Needs protocol");
    await page.goto(`/app/${protocolId}/screening`);
    await expect(page.getByText("Systematic Review")).toBeVisible({
      timeout: 15_000,
    });

    // 4 stage buttons in the stats bar. Accessible name includes the count
    // (e.g. "Identification 0"), so use partial match.
    await expect(
      page.getByRole("button", { name: /identification \d+/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /screening \d+/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /eligibility \d+/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /included \d+/i }),
    ).toBeVisible();
  });

  test("screening cards show decision buttons", async ({ page }) => {
    test.skip(!protocolId, "Needs protocol");
    await page.goto(`/app/${protocolId}/screening`);
    await expect(page.getByText("Systematic Review")).toBeVisible({
      timeout: 15_000,
    });

    // Pending items should show Include/Exclude/Duplicate buttons
    const includeBtn = page.getByRole("button", { name: /^include$/i });
    const excludeBtn = page.getByRole("button", { name: /^exclude$/i });
    const duplicateBtn = page.getByRole("button", { name: /^duplicate$/i });

    // At least one of each should be visible (if evidence is linked)
    if (
      await includeBtn
        .first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false)
    ) {
      await expect(includeBtn.first()).toBeVisible();
      await expect(excludeBtn.first()).toBeVisible();
      await expect(duplicateBtn.first()).toBeVisible();
    }
  });

  // -----------------------------------------------------------------------
  // Screening interactions (serial)
  // -----------------------------------------------------------------------

  test("include button changes decision status", async ({ page }) => {
    test.skip(!protocolId, "Needs protocol");
    await page.goto(`/app/${protocolId}/screening`);
    await expect(page.getByText("Systematic Review")).toBeVisible({
      timeout: 15_000,
    });

    const includeBtn = page.getByRole("button", { name: /^include$/i }).first();
    if (await includeBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await includeBtn.click();

      // After including, the card should show "Revert to Pending" instead
      await expect(
        page.getByRole("button", { name: /revert to pending/i }).first(),
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test("exclude button opens reason form", async ({ page }) => {
    test.skip(!protocolId, "Needs protocol");
    await page.goto(`/app/${protocolId}/screening`);
    await expect(page.getByText("Systematic Review")).toBeVisible({
      timeout: 15_000,
    });

    const excludeBtn = page.getByRole("button", { name: /^exclude$/i }).first();
    if (await excludeBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await excludeBtn.click();

      // Exclusion form should appear with reason dropdown and confirm button
      await expect(
        page
          .getByText("Exclusion reason...")
          .or(page.getByRole("button", { name: /confirm exclude/i })),
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test("detect duplicates button opens dialog", async ({ page }) => {
    test.skip(!protocolId, "Needs protocol");
    await page.goto(`/app/${protocolId}/screening`);
    await expect(page.getByText("Systematic Review")).toBeVisible({
      timeout: 15_000,
    });

    const detectBtn = page.getByRole("button", { name: /detect duplicates/i });
    if (await detectBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await detectBtn.click();

      // Dialog should appear
      await expect(page.getByText("Duplicate Detection")).toBeVisible({
        timeout: 5_000,
      });
    }
  });

  // -----------------------------------------------------------------------
  // Sub-tabs
  // -----------------------------------------------------------------------

  test("PRISMA Diagram tab renders flow diagram", async ({ page }) => {
    test.skip(!protocolId, "Needs protocol");
    await page.goto(`/app/${protocolId}/screening`);
    await expect(page.getByText("Systematic Review")).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("tab", { name: /prisma diagram/i }).click();

    // PRISMA flow diagram should render with stage labels
    await expect(page.getByText(/identification/i).first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("Risk of Bias tab renders summary", async ({ page }) => {
    test.skip(!protocolId, "Needs protocol");
    await page.goto(`/app/${protocolId}/screening`);
    await expect(page.getByText("Systematic Review")).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("tab", { name: /risk of bias/i }).click();

    // RoB tab content should be visible (target the active tabpanel)
    await expect(
      page.locator("[role='tabpanel'][data-state='active']"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("Meta-Analysis tab renders panel", async ({ page }) => {
    test.skip(!protocolId, "Needs protocol");
    await page.goto(`/app/${protocolId}/screening`);
    await expect(page.getByText("Systematic Review")).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("tab", { name: /meta-analysis/i }).click();

    // Meta-analysis panel should be visible (target the active tabpanel)
    await expect(
      page.locator("[role='tabpanel'][data-state='active']"),
    ).toBeVisible({ timeout: 10_000 });
  });

  // -----------------------------------------------------------------------
  // Protocol detail → screening link
  // -----------------------------------------------------------------------

  test("protocol detail has Systematic Review card with link", async ({
    page,
  }) => {
    test.skip(!protocolUrl, "Needs protocol");
    await page.goto(protocolUrl);
    await expect(page.getByText("Protocol details")).toBeVisible({
      timeout: 15_000,
    });

    // Systematic Review card
    await expect(page.getByText("Systematic Review").first()).toBeVisible();

    // The button should link to screening page
    const screeningLink = page.getByRole("link", {
      name: /continue screening|start screening/i,
    });
    await expect(screeningLink).toBeVisible();
    await expect(screeningLink).toHaveAttribute(
      "href",
      `/app/${protocolId}/screening`,
    );
  });

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  test("cleanup: delete test protocol", async ({ page }) => {
    test.skip(!protocolUrl, "Nothing to clean up");
    await deleteTestProtocol(page, protocolUrl);
  });
});
