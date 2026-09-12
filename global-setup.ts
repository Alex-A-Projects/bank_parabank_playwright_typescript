/**
 * global-setup.ts — runs ONCE before the entire suite.
 *
 * ParaBank's public demo is fronted by Cloudflare, which rate-limits any
 * IP that bursts too many requests. We poll the host until it returns
 * 200 before the suite starts so test fixtures (which already retry) have
 * a healthy bank to talk to.
 */
import { request } from '@playwright/test';
import { BasePage } from './pages/BasePage';

export default async function () {
  const MAX_ATTEMPTS = 8;
  const WAIT_MS = 15_000;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const ctx = await request.newContext();
      const res = await ctx.get(`${BasePage.BASE_URL}/index.htm`, {
        timeout: 10_000,
      });
      await ctx.dispose();
      if (res.status() === 200) {
        console.log(`[global-setup] Demo bank is healthy (attempt ${i + 1}/${MAX_ATTEMPTS}).`);
        return;
      }
      console.warn(`[global-setup] Demo bank returned ${res.status()}, attempt ${i + 1}/${MAX_ATTEMPTS}.`);
    } catch (err) {
      console.warn(`[global-setup] Probe failed: ${(err as Error).message}.`);
    }
    if (i < MAX_ATTEMPTS - 1) {
      console.log(`[global-setup] Waiting ${WAIT_MS / 1000}s before next probe…`);
      await new Promise((r) => setTimeout(r, WAIT_MS));
    }
  }
  console.warn(`[global-setup] Demo bank still appears unhealthy after ${MAX_ATTEMPTS} probes. Proceeding anyway — tests will self-skip.`);
}
