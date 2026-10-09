// FR-2 screenshots for the study book: demo data at a fixed time (19:00, Fri 9 Oct 2569 Bangkok).
import { chromium } from 'playwright';
import fs from 'node:fs';
import { createFakeSupabase, serveDist, SUPA, routeQrDecoder } from '../e2e/fake-backend.mjs';

const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const { app, close } = await serveDist(new URL('../dist', import.meta.url).pathname, 4195);
const { supabase } = createFakeSupabase();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, locale: 'th-TH', colorScheme: 'light', reducedMotion: 'reduce' });
const SKINS = ['classic', 'thai', 'graduate', 'detective', 'dj', 'saver', 'chill', 'hero', 'sakura', 'pioneer', 'newyear2570', 'pumpkin', 'sheetghost', 'witch', 'mummy', 'vampire', 'frankenstein', 'songkran2569', 'loykrathong2568'];
const BADGES = ['first_step', 'first_slip', 'voice', 'streak_3', 'streak_7', 'streak_30', 'slips_10', 'slips_100', 'all_clear', 'saver_week', 'healthy_tree', 'first_goal', 'goal_reached', 'budget_keeper', 'night_owl'];
await ctx.addInitScript(({ SKINS, BADGES }) => {
  try {
    localStorage.setItem('mindpay.colorTheme', 'forest');
    localStorage.setItem('mindpay.halloweenInvite', 'closed');
    localStorage.setItem('mindpay.whatsNewSeen', '2026-09-30-halloween');
    if (!localStorage.getItem('mindpay.kla.demo')) localStorage.setItem('mindpay.kla.demo', JSON.stringify({ owned: ['classic'], seen: SKINS, equipped: 'classic', opens: [], ghosts: {} }));
    if (!localStorage.getItem('mindpay.badges.demo')) localStorage.setItem('mindpay.badges.demo', JSON.stringify(BADGES));
  } catch {}
}, { SKINS, BADGES });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.clock.install({ time: new Date('2026-10-09T12:00:00Z') });
await page.route(`${SUPA}/**`, supabase);
await routeQrDecoder(page);

const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name) => { await wait(800); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('shot', name); };
const intro = () => page.getByLabel('กำลังเปิด MindPay').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
const go = async (p) => { await page.goto(app + p); await intro(); await wait(1800); };
const top = async (text, dy = 0) => {
  await page.getByText(text, { exact: true }).first().evaluate((el, dy) => { el.scrollIntoView({ block: 'start' }); let p = el.parentElement; while (p && p.scrollHeight <= p.clientHeight) p = p.parentElement; if (p) p.scrollTop += dy; }, dy);
  await wait(900);
};
const tab = async (name) => {
  const t = page.getByRole('tab', { name, exact: true }).first();
  for (let i = 0; i < 3; i++) { await t.click(); await wait(700); if ((await t.getAttribute('aria-selected').catch(() => null)) === 'true') return; }
  console.log('tab not selected', name);
};

await page.goto(app);
await page.getByText('ลองใช้ด้วยข้อมูลตัวอย่าง').first().waitFor();
await intro();
await page.getByText('ลองใช้ด้วยข้อมูลตัวอย่าง').click();
await page.getByText('ยอดคงเหลือ').first().waitFor();
await wait(2500);
await shot('fr2-home-hero');
await top('ถ้าอยากให้เงินพอถึงสิ้นเดือน วันนี้ใช้ได้ประมาณ', -40);
await shot('fr2-home-middle');
await top('ภาพรวม', -10);
await tab('1 เดือน');
await shot('fr2-overview-1m');
await tab('วันนี้');
await shot('fr2-overview-today');
await tab('7 วัน');
await shot('fr2-overview-7d');
await tab('6 เดือน');
await shot('fr2-overview-6m');
await tab('1 เดือน');
await top('รายจ่าย 7 วันล่าสุด', -10);
await shot('fr2-week-budget');
await top('รายการล่าสุด', -10);
await shot('fr2-recent');

await go('/transactions');
await shot('fr2-calendar-oct');
await page.getByRole('button', { name: 'เดือนก่อน' }).first().click();
await wait(900);
await shot('fr2-calendar-sep');
await page.getByRole('button', { name: /^5 ก\.ย\. 2569/ }).first().click().catch((e) => console.log('miss day', e.message.slice(0, 60)));
await wait(900);
await shot('fr2-calendar-sep-day');

await go('/');
await page.getByRole('button', { name: /^ดูสรุปเดือน/ }).first().click();
await wait(600);
for (let i = 1; i <= 7; i++) {
  await wait(1700);
  await shot(`fr2-recap-${i}`);
  if (i < 7) await page.getByRole('button', { name: 'ถัดไป', exact: true }).first().click();
}
await page.goto(app.replace(/\/$/, '') + '/recap?month=2026-09');
await intro();
await wait(1500);
for (let i = 1; i <= 6; i++) {
  if (i === 2 || i === 6) { await wait(1700); await shot(`fr2-recap-sep-${i}`); }
  await page.getByRole('button', { name: 'ถัดไป', exact: true }).first().click({ timeout: 5000 }).catch((e) => console.log('miss next', e.message.slice(0, 50)));
  await wait(400);
}
await browser.close();
close();
