import { test, expect } from "@playwright/test";

/**
 * Console error checks — navigate through main pages and assert
 * no critical console errors appear (GoTrueClient warnings,
 * DialogDescription warnings, unhandled rejections, etc.).
 */

const PAGES_TO_CHECK = [
  { path: "/", name: "Landing" },
  { path: "/app", name: "Dashboard" },
  { path: "/app/new", name: "New protocol" },
  { path: "/app/evidence", name: "Evidence" },
  { path: "/app/datasets", name: "Datasets" },
];

/** Patterns to ignore — known non-critical warnings. */
const IGNORE_PATTERNS = [
  /Download the React DevTools/i,
  /Warning: ReactDOM/i,
  /favicon\.ico/i,
  /Failed to load resource.*404/i,
  /third-party cookie/i,
  /Supabase.*realtime/i,
];

function shouldIgnore(text: string): boolean {
  return IGNORE_PATTERNS.some((pattern) => pattern.test(text));
}

for (const { path, name } of PAGES_TO_CHECK) {
  test(`no critical console errors on ${name} (${path})`, async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (!shouldIgnore(text)) {
          errors.push(text);
        }
      }
    });

    page.on("pageerror", (err) => {
      errors.push(`PAGE ERROR: ${err.message}`);
    });

    await page.goto(path);
    await page
      .waitForLoadState("networkidle", { timeout: 15_000 })
      .catch(() => {
        // networkidle may not be reached if there are active websocket connections
      });
    // Give any async console logs time to flush
    await page.waitForTimeout(2_000);

    if (errors.length > 0) {
      console.log(`Console errors on ${name}:`, errors);
    }

    expect(
      errors,
      `Critical console errors found on ${name}: ${errors.join("\n")}`,
    ).toHaveLength(0);
  });
}
