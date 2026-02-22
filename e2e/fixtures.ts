import { type Page, expect } from "@playwright/test";

/**
 * Creates a test protocol via the UI and returns its URL and ID.
 * Navigates to /app/new, fills PICO form, submits, waits for redirect.
 */
export async function createTestProtocol(
  page: Page,
  title = "E2E Phase Test Protocol",
): Promise<{ url: string; id: string }> {
  await page.goto("/app/new");

  // Skip template selector
  await page
    .getByRole("button", { name: /skip templates/i })
    .click({ timeout: 10_000 });

  // Fill PICO form
  await page.getByLabel("Protocol title").fill(title);
  await page
    .getByLabel("Study question")
    .fill("Does mRNA COVID-19 vaccine reduce hospitalisations in adults?");
  await page
    .getByLabel("Population")
    .fill("Adults aged 18–65 in the United States");
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

  // Wait for protocol detail page
  await page.waitForURL(/\/app\/[0-9a-f-]{36}/, { timeout: 20_000 });
  const url = page.url();
  const id = url.match(/\/app\/([0-9a-f-]{36})/)?.[1] ?? "";

  await expect(page.getByText("Protocol details")).toBeVisible({
    timeout: 15_000,
  });

  return { url, id };
}

/**
 * Creates an academic evidence item via the UI and returns its URL.
 */
export async function createTestEvidence(
  page: Page,
  title = "E2E Test Evidence Article",
): Promise<string> {
  await page.goto("/app/evidence/new");

  // Type defaults to "academic" — click it to be safe
  await page.getByLabel("academic").click();

  // Fill basic fields
  await page.getByLabel("Title *").fill(title);
  await page
    .getByLabel("Description *")
    .fill("Retrospective cohort study of mRNA vaccine effectiveness.");
  await page.getByLabel("Authors *").fill("Smith J, Doe A, Johnson B, et al.");

  // Submit
  await page.getByRole("button", { name: /create evidence/i }).click();

  // Wait for redirect to evidence detail or evidence list
  await page.waitForURL(/\/app\/evidence/, { timeout: 15_000 });
  return page.url();
}

/**
 * Links the first available evidence item to a protocol via the "Add Evidence" dialog.
 * Assumes the protocol detail page is already loaded or navigates to it.
 */
export async function linkEvidenceToProtocol(
  page: Page,
  protocolUrl: string,
): Promise<void> {
  await page.goto(protocolUrl);
  await expect(page.getByText("Protocol details")).toBeVisible({
    timeout: 15_000,
  });

  // Open the Add Evidence dialog
  await page.getByRole("button", { name: /add evidence/i }).click();
  await expect(page.getByText("Link Evidence to Protocol")).toBeVisible({
    timeout: 10_000,
  });

  // Select the first available (not-already-linked) evidence item.
  // Items are <div class="rounded-lg border p-3 cursor-pointer ...">
  // Already-linked items have "opacity-50 cursor-not-allowed".
  const dialog = page.getByRole("dialog");
  const availableItem = dialog
    .locator("div.rounded-lg.border.p-3.cursor-pointer")
    .filter({ hasNot: page.getByText("Already linked") })
    .first();
  await availableItem.click({ timeout: 10_000 });

  // Wait for the Link button to become enabled (shows "Link (N)")
  const linkBtn = dialog.getByRole("button", { name: /link\s*\(/i });
  await expect(linkBtn).toBeEnabled({ timeout: 5_000 });
  await linkBtn.click();

  // Wait for dialog to close
  await expect(dialog.getByText("Link Evidence to Protocol")).not.toBeVisible({
    timeout: 10_000,
  });
}

/**
 * Deletes a test protocol via the UI.
 */
export async function deleteTestProtocol(
  page: Page,
  protocolUrl: string,
): Promise<void> {
  await page.goto(protocolUrl);

  // Wait for page load
  const detailText = page.getByText("Protocol details");
  if (!(await detailText.isVisible({ timeout: 5_000 }).catch(() => false))) {
    return; // Protocol may already be deleted
  }

  // Click delete button
  await page.getByRole("button", { name: /^delete$/i }).click();

  // Confirm in AlertDialog
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /delete/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL("**/app", { timeout: 15_000 });
}

/**
 * Extracts protocol ID from a protocol URL.
 */
export function extractProtocolId(url: string): string {
  return url.match(/\/app\/([0-9a-f-]{36})/)?.[1] ?? "";
}
