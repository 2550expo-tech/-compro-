// Screenshots for the FR study books: demo data, light mode, forest theme, cards dismissed.
import { chromium } from 'playwright';
import fs from 'node:fs';
import { createFakeSupabase, serveDist, SUPA, routeQrDecoder } from '../e2e/fake-backend.mjs';

const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const { app, close } = await serveDist(new URL('../dist', import.meta.url).pathname, 4192);
const { supabase } = createFakeSupabase();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, locale: 'th-TH', colorScheme: 'light', reducedMotion: 'reduce' });
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('mindpay.colorTheme', 'forest');
    localStorage.setItem('mindpay.halloweenInvite', 'closed');
  } catch {}
});
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.route(`${SUPA}/**`, supabase);
await routeQrDecoder(page);

const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name) => { await wait(700); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('shot', name); };
const scroll = async (dy) => { await page.mouse.move(195, 450); await page.mouse.wheel(0, dy); await wait(900); };
const tap = async (role, name) => { await page.getByRole(role, { name }).first().click({ timeout: 4000 }).catch((e) => console.log('miss', name, e.message.slice(0, 80))); await wait(700); };
const go = async (path) => { await page.goto(app + path); await page.getByLabel('กำลังเปิด MindPay').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {}); await wait(1800); };

await page.goto(app);
await page.getByText('ลองใช้ด้วยข้อมูลตัวอย่าง').first().waitFor();
await page.getByLabel('กำลังเปิด MindPay').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
await wait(1200);
await shot('welcome');
await page.getByText('ลองใช้ด้วยข้อมูลตัวอย่าง').click();
await page.getByText('ยอดคงเหลือ').first().waitFor();
await wait(1500);
// Dismiss one-off cards.
for (let i = 0; i < 3; i++) {
  await tap('button', 'ไม่ต้องแสดงอีก');
  await tap('button', 'ไว้ทีหลัง');
  await tap('button', 'ปิดการ์ดฮาโลวีน');
}
// The new-skins card goes away once the wardrobe is seen.
await tap('button', 'ดูตู้สกิน');
await go('/');
await shot('home-1');
await scroll(700); await shot('home-2');
await scroll(700); await shot('home-3');
await scroll(700); await shot('home-4');
await scroll(900); await shot('home-5');

await go('/transactions'); await shot('tx-list');
await scroll(600); await shot('tx-list-2');

await go('/transaction'); await shot('tx-new-expense');
await page.fill('#tx-amount', '85').catch(() => {});
await page.fill('#tx-title', 'ข้าวมันไก่').catch(() => {});
await wait(500); await shot('tx-new-filled');
await go('/transaction?kind=income'); await shot('tx-new-income');

// Edit an existing item: open the first row in the list.
await go('/transactions');
await page.getByRole('button', { name: /ข้าวกลางวัน|ข้าวเย็น|รถไปเรียน/ }).first().click().catch((e) => console.log('row', e.message.slice(0, 80)));
await wait(1500); await shot('tx-edit');
await tap('button', 'ลบรายการ'); await shot('tx-delete-confirm');

await go('/voice'); await shot('voice-start');
await page.fill('#voice-text', 'ข้าวมันไก่ 50 บาท ชานม 45 ได้เงินจากแม่ 500').catch((e) => console.log('voice', e.message.slice(0, 80)));
await wait(1200); await shot('voice-parsed');
await scroll(500); await shot('voice-parsed-2');

await go('/scan'); await shot('scan-web');
await go('/drafts'); await shot('drafts');

await go('/coach'); await wait(1500); await shot('coach-1');
await scroll(700); await shot('coach-2');
await scroll(700); await shot('coach-3');

await go('/runway'); await shot('runway-1');
await scroll(650); await shot('runway-2');
await scroll(650); await shot('runway-3');
await page.fill('#runway-price', '2000').catch(() => {});
await scroll(500); await shot('runway-4');

await go('/settings'); await shot('settings-1');
await scroll(700); await shot('settings-2');
await go('/goals'); await shot('goals');
await go('/achievements'); await shot('achievements');

await browser.close();
close();
