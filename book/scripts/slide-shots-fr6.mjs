// Clean FR-6 screenshots for the presentation deck (demo mode, no medal/skin cards).
import { chromium } from 'playwright';
import fs from 'node:fs';
import { createFakeSupabase, serveDist, SUPA, routeQrDecoder } from '../e2e/fake-backend.mjs';
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const { app, close } = await serveDist(new URL('../dist', import.meta.url).pathname, 4199);
const { supabase } = createFakeSupabase();
const browser = await chromium.launch();
const SKINS = ['classic', 'thai', 'graduate', 'detective', 'dj', 'saver', 'chill', 'hero', 'sakura', 'pioneer', 'newyear2570', 'pumpkin', 'sheetghost', 'witch', 'mummy', 'vampire', 'frankenstein', 'songkran2569', 'loykrathong2568'];
const BADGES = ['first_step', 'first_slip', 'voice', 'streak_3', 'streak_7', 'streak_30', 'slips_10', 'slips_100', 'all_clear', 'saver_week', 'healthy_tree', 'first_goal', 'goal_reached'];
const ctx = await browser.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, locale: 'th-TH', colorScheme: 'light', reducedMotion: 'reduce' });
await ctx.addInitScript(({ SKINS, BADGES }) => { try {
  localStorage.setItem('mindpay.colorTheme', 'forest'); localStorage.setItem('mindpay.halloweenInvite', 'closed'); localStorage.setItem('mindpay.whatsNewSeen', '2026-09-30-halloween');
  if (!localStorage.getItem('mindpay.badges.demo')) localStorage.setItem('mindpay.badges.demo', JSON.stringify(BADGES));
  if (!localStorage.getItem('mindpay.kla.demo')) localStorage.setItem('mindpay.kla.demo', JSON.stringify({ owned: ['classic'], seen: SKINS, equipped: 'classic', opens: [], ghosts: {} }));
} catch {} }, { SKINS, BADGES });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.route(`${SUPA}/**`, supabase); await routeQrDecoder(page);
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (n) => { await wait(700); await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('shot', n); };
await page.goto(app); await page.getByText('ลองใช้ด้วยข้อมูลตัวอย่าง').first().waitFor();
await page.getByLabel('กำลังเปิด MindPay').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
await page.getByText('ลองใช้ด้วยข้อมูลตัวอย่าง').click(); await page.getByText('ยอดคงเหลือ').first().waitFor(); await wait(2500);
await shot('s-home-top');
await page.mouse.move(195, 450); await page.mouse.wheel(0, 260); await wait(900);
await shot('s-home-scrolled');
await browser.close(); close();
