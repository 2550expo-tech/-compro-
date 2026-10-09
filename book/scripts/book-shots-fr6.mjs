import { chromium } from 'playwright';
import fs from 'node:fs';
import { createFakeSupabase, serveDist, SUPA, routeQrDecoder } from '../e2e/fake-backend.mjs';
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const { app, close } = await serveDist(new URL('../dist', import.meta.url).pathname, 4193);
const { supabase } = createFakeSupabase();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, locale: 'th-TH', colorScheme: 'light', reducedMotion: 'reduce' });
await ctx.addInitScript(() => { try { localStorage.setItem('mindpay.colorTheme', 'forest'); localStorage.setItem('mindpay.halloweenInvite', 'closed'); localStorage.setItem('mindpay.whatsNewSeen', '2026-09-30-halloween'); } catch {} });
const page = await ctx.newPage();
await page.route(`${SUPA}/**`, supabase); await routeQrDecoder(page);
const wait = (ms) => page.waitForTimeout(ms);
const go = async (p) => { await page.goto(app + p); await page.getByLabel('กำลังเปิด MindPay').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {}); await wait(1800); };
const shot = async (n) => { await wait(600); await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('shot', n); };
const scroll = async (dy) => { await page.mouse.move(195, 450); await page.mouse.wheel(0, dy); await wait(900); };
await page.goto(app); await page.getByText('ลองใช้ด้วยข้อมูลตัวอย่าง').first().waitFor();
await page.getByLabel('กำลังเปิด MindPay').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
await page.getByText('ลองใช้ด้วยข้อมูลตัวอย่าง').click(); await page.getByText('ยอดคงเหลือ').first().waitFor(); await wait(1500);
// goal: create and deposit 1000
await go('/goal'); await page.fill('#goal-title', 'หูฟังใหม่'); await page.fill('#goal-amount', '2500');
await page.getByRole('button', { name: 'ตั้งกระปุก' }).last().click(); await wait(1200);
await go('/goals'); await page.getByRole('button', { name: 'หยอดกระปุก' }).first().click(); await wait(500);
for (let i = 0; i < 2; i++) { await page.getByText('฿500', { exact: true }).first().click().catch((e) => console.log('chip', e.message.slice(0, 80))); await wait(1500); }
await shot('fr6-goals');
await go('/runway'); await scroll(400); await shot('fr6-runway-jar');
await browser.close(); close();
