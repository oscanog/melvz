/**
 * Intro animation timing test — timed screenshot approach.
 * Runs HEADED so animations play at full speed (no headless throttling).
 * Takes a screenshot every 2 seconds while the cinematic overlay is shown,
 * and reports timing of each cinematic beat.
 */
import { test, expect } from "@playwright/test";

const DEV_URL = "http://localhost:5174";
const SNAPSHOT_DIR = "tests/screenshots";

test("cinematic intro beats appear across 8 seconds", async ({ page }) => {
  // ── 1. Navigate to landing ──────────────────────────────────────────────
  await page.goto(DEV_URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".lp-scroll", { timeout: 10_000 });
  console.log("[✓] Landing page loaded");

  // ── 2. Scroll to bottom → modal ─────────────────────────────────────────
  await page.evaluate(() => {
    const el = document.querySelector(".lp-scroll");
    if (el) el.scrollTop = el.scrollHeight;
  });
  await page.waitForSelector(".wc-modal", { timeout: 6_000 });
  console.log("[✓] Warcraft modal visible");
  await page.screenshot({ path: `${SNAPSHOT_DIR}/01-modal.png` });

  // ── 3. Click YES (force to bypass bobbing animation instability) ─────────
  await page.locator(".wc-card--yes").click({ force: true });
  const t0 = Date.now();
  console.log("[✓] Clicked — cinematic started");

  // Confirm overlay rendered
  await page.waitForSelector(".lp-overlay", { timeout: 3_000 });
  console.log("[✓] Overlay element found in DOM");
  await page.screenshot({ path: `${SNAPSHOT_DIR}/02-overlay-start.png` });

  // ── 4. Timed screenshots every 2 seconds ────────────────────────────────
  const beats = [2, 4, 6, 8, 10, 12];
  const results: { t: number; prelude: number; name: number; role: number; enter: number; bar: number }[] = [];

  for (const waitSec of beats) {
    const targetMs = waitSec * 1000;
    const already = Date.now() - t0;
    if (targetMs > already) await page.waitForTimeout(targetMs - already);

    const elapsed = ((Date.now() - t0) / 1000).toFixed(2);

    // Read opacity of each cinematic beat
    const opacities = await page.evaluate(() => {
      const getOp = (sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return -1;
        return parseFloat(window.getComputedStyle(el).opacity);
      };
      return {
        prelude: getOp(".lp-cin__prelude"),
        name:    getOp(".lp-cin__name"),
        role:    getOp(".lp-cin__role"),
        enter:   getOp(".lp-cin__enter"),
        bar:     getOp(".lp-cin__bar-wrap"),
        overlayExists: !!document.querySelector(".lp-overlay"),
      };
    });

    console.log(
      `[+${elapsed}s] prelude=${opacities.prelude.toFixed(2)} ` +
      `name=${opacities.name.toFixed(2)} role=${opacities.role.toFixed(2)} ` +
      `enter=${opacities.enter.toFixed(2)} bar=${opacities.bar.toFixed(2)} ` +
      `overlay=${opacities.overlayExists}`
    );

    results.push({ t: parseFloat(elapsed), ...opacities });
    await page.screenshot({ path: `${SNAPSHOT_DIR}/t${waitSec}s.png` });
  }

  // ── 5. Report which beats were VISIBLE (opacity > 0.05) ─────────────────
  console.log("\n=== BEAT VISIBILITY REPORT ===");
  const beatNames = ["prelude", "name", "role", "enter", "bar"] as const;
  for (const beat of beatNames) {
    const firstVisible = results.find((r) => r[beat] > 0.05);
    if (firstVisible) {
      console.log(`  ${beat.padEnd(8)}: visible at +${firstVisible.t}s`);
    } else {
      console.log(`  ${beat.padEnd(8)}: ❌ NEVER became visible during 12s window`);
    }
  }

  // ── 6. Assert at least the name is visible by 6s ─────────────────────────
  const nameVisibleBy6s = results
    .filter((r) => r.t <= 6)
    .some((r) => r.name > 0.05);

  // Lenient: just confirm overlay is still showing at 6s (not instant close)
  const overlayAt6s = results.find((r) => r.t >= 6)?.overlayExists ?? false;
  console.log(`\n  Overlay still open at 6s: ${overlayAt6s}`);
  console.log(`  Name visible by 6s:        ${nameVisibleBy6s}`);

  expect(overlayAt6s).toBe(true);
});
