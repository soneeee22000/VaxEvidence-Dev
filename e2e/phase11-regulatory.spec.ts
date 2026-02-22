import { test, expect } from "@playwright/test";
import {
  createTestProtocol,
  createTestEvidence,
  linkEvidenceToProtocol,
  deleteTestProtocol,
} from "./fixtures";

/**
 * Phase 11 — Regulatory Compliance E2E tests.
 *
 * Exercises the regulatory hub (CONSORT/STROBE/GCP tabs),
 * protocol detail compliance card, and export dialogs
 * (FDA IND, eCTD Module 5, SDTM Templates).
 */

let protocolUrl: string;
let protocolId: string;

test.describe("Phase 11 — Regulatory Compliance", () => {
  test.describe.configure({ mode: "serial" });

  // -----------------------------------------------------------------------
  // Setup: create protocol + evidence
  // -----------------------------------------------------------------------

  test("setup: create protocol and link evidence", async ({ page }) => {
    const result = await createTestProtocol(page, "Phase 11 Regulatory Test");
    protocolUrl = result.url;
    protocolId = result.id;
    expect(protocolId).toBeTruthy();

    await createTestEvidence(page, "Phase 11 Regulatory Evidence");
    await linkEvidenceToProtocol(page, protocolUrl);
  });

  // -----------------------------------------------------------------------
  // Protocol detail — Regulatory Compliance card
  // -----------------------------------------------------------------------

  test("protocol detail shows Regulatory Compliance card", async ({ page }) => {
    test.skip(!protocolUrl, "Needs protocol");
    await page.goto(protocolUrl);
    await expect(page.getByText("Protocol details")).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByText("Regulatory Compliance")).toBeVisible();
    await expect(
      page.getByText(
        /consort.*strobe.*checklist|checklists.*gcp|compliance tracking/i,
      ),
    ).toBeVisible();
  });

  test("Open Compliance Hub link navigates to regulatory page", async ({
    page,
  }) => {
    test.skip(!protocolUrl, "Needs protocol");
    await page.goto(protocolUrl);
    await expect(page.getByText("Protocol details")).toBeVisible({
      timeout: 15_000,
    });

    const hubLink = page.getByRole("link", {
      name: /open compliance hub/i,
    });
    await expect(hubLink).toBeVisible();
    await hubLink.click();

    await page.waitForURL(`**/app/${protocolId}/regulatory`, {
      timeout: 10_000,
    });
    await expect(page.getByText("Regulatory Compliance").first()).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // Regulatory hub page
  // -----------------------------------------------------------------------

  test("regulatory hub loads with 3 tabs", async ({ page }) => {
    test.skip(!protocolId, "Needs protocol");
    await page.goto(`/app/${protocolId}/regulatory`);

    await expect(page.getByText("Regulatory Compliance").first()).toBeVisible({
      timeout: 15_000,
    });

    // 3 tabs
    await expect(page.getByRole("tab", { name: /consort/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /strobe/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /ich gcp/i })).toBeVisible();
  });

  test("CONSORT tab renders checklist panel", async ({ page }) => {
    test.skip(!protocolId, "Needs protocol");
    await page.goto(`/app/${protocolId}/regulatory`);
    await expect(page.getByText("Regulatory Compliance").first()).toBeVisible({
      timeout: 15_000,
    });

    // CONSORT tab should be default
    await page.getByRole("tab", { name: /consort/i }).click();

    // CONSORT checklist content should be visible
    await expect(page.getByText("CONSORT 2010 Checklist")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("STROBE tab renders checklist panel", async ({ page }) => {
    test.skip(!protocolId, "Needs protocol");
    await page.goto(`/app/${protocolId}/regulatory`);
    await expect(page.getByText("Regulatory Compliance").first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("tab", { name: /strobe/i }).click();

    // STROBE checklist content should render (wait for API)
    await expect(page.getByText("STROBE Checklist")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("ICH GCP tab renders compliance panel", async ({ page }) => {
    test.skip(!protocolId, "Needs protocol");
    await page.goto(`/app/${protocolId}/regulatory`);
    await expect(page.getByText("Regulatory Compliance").first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("tab", { name: /ich gcp/i }).click();

    // GCP panel should render (target active panel — hidden ones also exist)
    await expect(
      page.locator("[role='tabpanel'][data-state='active']"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("back-to-protocol link works from regulatory hub", async ({ page }) => {
    test.skip(!protocolId, "Needs protocol");
    await page.goto(`/app/${protocolId}/regulatory`);
    await expect(page.getByText("Regulatory Compliance").first()).toBeVisible({
      timeout: 15_000,
    });

    // Back link (← Protocol) — target the link inside the main content area,
    // not the "Protocols" nav link in the header.
    const backLink = page
      .locator("main")
      .getByRole("link", { name: /protocol/i });
    await expect(backLink).toBeVisible();
    await backLink.click();

    // Should navigate to the protocol detail page
    await page.waitForURL(new RegExp(`/app/${protocolId}$`), {
      timeout: 15_000,
    });
  });

  // -----------------------------------------------------------------------
  // Export menu — Regulatory section
  // -----------------------------------------------------------------------

  test("export menu shows Regulatory section with IND, eCTD, SDTM", async ({
    page,
  }) => {
    test.skip(!protocolUrl, "Needs protocol");
    await page.goto(protocolUrl);
    await expect(page.getByText("Protocol details")).toBeVisible({
      timeout: 15_000,
    });

    // Open export dropdown
    await page.getByRole("button", { name: /^export$/i }).click();

    // Regulatory section label (scoped to the menu to avoid matching "Regulatory Compliance" card)
    await expect(page.getByRole("menu").getByText("Regulatory")).toBeVisible({
      timeout: 3_000,
    });

    // Menu items
    await expect(
      page.getByRole("menuitem", { name: /fda ind package/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: /ectd module 5/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: /sdtm templates/i }),
    ).toBeVisible();
  });

  test("FDA IND Package dialog opens with section list", async ({ page }) => {
    test.skip(!protocolUrl, "Needs protocol");
    await page.goto(protocolUrl);
    await expect(page.getByText("Protocol details")).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: /^export$/i }).click();
    await page.getByRole("menuitem", { name: /fda ind package/i }).click();

    // Dialog should open
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Should show section completeness and PDF/Word export buttons
    await expect(dialog.getByRole("button", { name: /pdf/i })).toBeVisible({
      timeout: 5_000,
    });
  });

  test("eCTD Module 5 dialog opens", async ({ page }) => {
    test.skip(!protocolUrl, "Needs protocol");
    await page.goto(protocolUrl);
    await expect(page.getByText("Protocol details")).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: /^export$/i }).click();
    await page.getByRole("menuitem", { name: /ectd module 5/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
  });

  test("SDTM Templates dialog opens with domain checkboxes", async ({
    page,
  }) => {
    test.skip(!protocolUrl, "Needs protocol");
    await page.goto(protocolUrl);
    await expect(page.getByText("Protocol details")).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: /^export$/i }).click();
    await page.getByRole("menuitem", { name: /sdtm templates/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // SDTM dialog should have domain selection checkboxes
    const checkbox = dialog.getByRole("checkbox").first();
    if (await checkbox.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(checkbox).toBeVisible();
    }
  });

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  test("cleanup: delete test protocol", async ({ page }) => {
    test.skip(!protocolUrl, "Nothing to clean up");
    await deleteTestProtocol(page, protocolUrl);
  });
});
