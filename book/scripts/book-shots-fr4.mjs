// FR-4 screenshots for the study book: signed-in (fake Supabase), a stand-in photo gallery, fake slip reader.
import { chromium } from 'playwright';
import fs from 'node:fs';
import { join } from 'node:path';
import { createFakeSupabase, installTestGallery, serveDist, SUPA, routeQrDecoder } from '../e2e/fake-backend.mjs';

const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const FIXTURES = new URL('../e2e/fixtures/', import.meta.url).pathname;
const { app, close } = await serveDist(new URL('../dist', import.meta.url).pathname, 4197);
const browser = await chromium.launch();
const { state, supabase } = createFakeSupabase();
state.confirmEmail = false;
const SKINS = ['classic', 'thai', 'graduate', 'detective', 'dj', 'saver', 'chill', 'hero', 'sakura', 'pioneer', 'newyear2570', 'pumpkin', 'sheetghost', 'witch', 'mummy', 'vampire', 'frankenstein', 'songkran2569', 'loykrathong2568'];
const bkkDay = (daysAgo) => new Date(Date.now() + 7 * 3600e3 - daysAgo * 86400e3).toISOString().slice(0, 10);

async function session(tag, gallery) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, locale: 'th-TH', colorScheme: 'light', reducedMotion: 'reduce' });
  await ctx.addInitScript(({ SKINS }) => {
    try {
      localStorage.setItem('mindpay.colorTheme', 'forest');
      localStorage.setItem('mindpay.halloweenInvite', 'closed');
      localStorage.setItem('mindpay.whatsNewSeen', '2026-09-30-halloween');
      const BADGES = ['first_step', 'first_slip', 'voice', 'streak_3', 'streak_7', 'streak_30', 'slips_10', 'slips_100', 'all_clear', 'saver_week', 'healthy_tree', 'first_goal', 'goal_reached'];
      for (let n = 1; n <= 5; n++) {
        const id = `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
        if (!localStorage.getItem(`mindpay.badges.${id}`)) localStorage.setItem(`mindpay.badges.${id}`, JSON.stringify(BADGES));
        if (!localStorage.getItem(`mindpay.kla.${id}`)) localStorage.setItem(`mindpay.kla.${id}`, JSON.stringify({ owned: ['classic'], seen: SKINS, equipped: 'classic', opens: [], ghosts: {} }));
      }
    } catch {}
  }, { SKINS });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log(`[${tag}] pageerror`, e.message));
  await page.route(`${SUPA}/**`, supabase);
  await routeQrDecoder(page);
  if (gallery) await installTestGallery(page, gallery);
  return { ctx, page };
}
const intro = (page) => page.getByLabel('กำลังเปิด MindPay').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
const button = (page, name) => page.getByRole('button', { name, exact: false }).first();
const visible = (page, text, timeout = 8000) => page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout }).then(() => true, () => false);
const shot = async (page, name) => { await page.waitForTimeout(700); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('shot', name); };

async function signUp(page, name, email, balance) {
  await page.goto(app);
  await page.getByText('ลองใช้ด้วยข้อมูลตัวอย่าง').first().waitFor();
  await intro(page);
  await page.getByText('สมัครสมาชิก', { exact: true }).click();
  await page.fill('#name', name);
  await page.fill('#email', email);
  await page.fill('#password', 'secret123');
  await button(page, 'สร้างบัญชี').click();
  await visible(page, 'สมัครบัญชีสำเร็จ');
  await button(page, 'ไปตั้งค่าเงิน').click();
  await page.fill('#ob-balance', String(balance));
}

// A. Phone flow on a stand-in gallery: the automatic scan when the app opens.
{
  state.aiDelayMs = 1600;
  state.slipReadings = [
    { isSlip: true, direction: 'expense', amount: '350.00', dateText: 'x', dateIso: bkkDay(0), time: '11:20', counterparty: 'ร้านข้าวมันไก่', bank: 'SCB', reference: 'AUTO1', confidence: { amount: 0.97, date: 0.96, counterparty: 0.94 } },
    { isSlip: true, direction: 'income', amount: '1200.00', dateText: 'x', dateIso: bkkDay(1), time: '20:00', counterparty: 'พี่ชาย', bank: 'BBL', reference: 'AUTO2', confidence: { amount: 0.99, date: 0.97, counterparty: 0.95 } },
    { isSlip: true, direction: 'expense', amount: '120.00', dateText: 'x', dateIso: bkkDay(0), time: '08:30', counterparty: 'ร้านชานม', bank: 'TrueMoney', reference: 'TMN55501', confidence: { amount: 0.96, date: 0.95, counterparty: 0.92 } },
  ];
  const { ctx, page } = await session('auto', [
    { name: 'slip-qr-2.jpg', minutesAgo: 10 },
    { name: 'photo-1.jpg', minutesAgo: 20, width: 600, height: 1000 },
    { name: 'slip-qr-3.jpg', minutesAgo: 30 },
    { name: 'photo-2.jpg', minutesAgo: 40, width: 600, height: 1000 },
    { name: 'wallet-qr.jpg', minutesAgo: 50 },
    { name: 'camera-qr.jpg', file: 'wallet-qr.jpg', minutesAgo: 60, width: 3000, height: 4000 },
  ]);
  await signUp(page, 'ออโต้', 'auto@example.com', 5000);
  await button(page, 'เริ่มใช้ MindPay').click();
  await visible(page, 'ยอดคงเหลือ');
  await visible(page, 'กำลังอ่านสลิปใหม่', 15000);
  await page.waitForTimeout(900);
  await shot(page, 'fr4-auto-scanning');
  await visible(page, 'จดให้แล้ว 3 รายการ', 25000);
  await page.waitForTimeout(1500);
  await shot(page, 'fr4-auto-done');
  await page.getByRole('button', { name: 'สแกนสลิป' }).last().click();
  await visible(page, 'ทุกรูปเคยตรวจแล้ว', 15000);
  await shot(page, 'fr4-scan-nothing-new');
  await page.goto(app.replace(/\/$/, '') + '/settings');
  await intro(page);
  await page.waitForTimeout(1500);
  await page.getByText('อ่านสลิปอัตโนมัติ', { exact: true }).first().evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await shot(page, 'fr4-settings');
  await ctx.close();
}

// B. Web flow: pick photos once; clear, unclear and two-reads slips; drafts; review.
{
  state.aiDelayMs = 2200;
  state.slipReadings = [
    { isSlip: true, direction: 'expense', amount: '89.00', dateText: 'x', dateIso: bkkDay(0), time: '12:10', counterparty: 'ร้านก๋วยเตี๋ยวเรือ', bank: 'KBank', reference: 'BOOK101', confidence: { amount: 0.98, date: 0.95, counterparty: 0.95 } },
    { isSlip: true, direction: 'expense', amount: '45.00', dateText: 'x', dateIso: bkkDay(0), time: '13:20', counterparty: 'ร้านน้ำปั่น', bank: 'SCB', reference: 'BOOK102', confidence: { amount: 0.5, date: 0.9, counterparty: 0.6 } },
    {
      reading: { isSlip: true, direction: 'expense', amount: '1250.00', dateText: 'x', dateIso: bkkDay(1), time: '10:10', counterparty: 'ร้านรองเท้า', bank: 'Krungthai', reference: 'BOOK103', confidence: { amount: 0.5, date: 0.97, counterparty: 0.95 } },
      check: { verified: false, reads: 2, disagree: { amount: ['1250.00', '1280.00'] } },
    },
    { isSlip: true, direction: 'income', amount: '500.00', dateText: 'x', dateIso: bkkDay(1), time: '18:05', counterparty: 'แม่', bank: 'SCB', reference: 'BOOK104', confidence: { amount: 0.99, date: 0.96, counterparty: 0.9 } },
  ];
  const { ctx, page } = await session('web', null);
  await page.clock.install();
  await signUp(page, 'เว็บ', 'web@example.com', 3000);
  await button(page, 'เริ่มใช้ MindPay').click();
  await visible(page, 'ยอดคงเหลือ');
  await page.goto(app.replace(/\/$/, '') + '/scan');
  await intro(page);
  await visible(page, 'เลือกรูปสลิป แล้ว');
  await shot(page, 'fr4-scan-web-start');
  const chooser = page.waitForEvent('filechooser');
  await button(page, 'เลือกรูปสลิป').click();
  state.slipBusy = 1;
  await (await chooser).setFiles(['photo-1.jpg', 'photo-2.jpg', 'photo-3.jpg', 'slip-qr.jpg'].map((f) => join(FIXTURES, f)));
  await visible(page, 'AI มีคิวเยอะ รออีก', 10000);
  await shot(page, 'fr4-scan-busy');
  await page.clock.fastForward(21_000);
  await visible(page, 'กำลังอ่านสลิป 1/4', 15000);
  await page.clock.fastForward(1000);
  await page.waitForTimeout(400);
  await page.clock.fastForward(1500);
  await page.waitForTimeout(600);
  await shot(page, 'fr4-scan-progress');
  for (let i = 0; i < 12; i++) { await page.clock.fastForward(2500); await page.waitForTimeout(250); }
  await visible(page, 'อ่านเสร็จแล้ว ได้ 4 รายการ', 20000);
  await page.waitForTimeout(800);
  await shot(page, 'fr4-scan-done');
  await page.getByText('สลิปที่อ่านรอบนี้ แยกตามวันที่', { exact: true }).first().evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await shot(page, 'fr4-scan-by-day');
  await button(page, 'ตรวจ 2 รายการที่อ่านไม่ชัด').click();
  await visible(page, 'ต้องตรวจก่อน (2)');
  await shot(page, 'fr4-drafts');
  await page.getByText('ร้านรองเท้า').first().click();
  await visible(page, 'AI อ่านได้ 2 แบบ');
  await shot(page, 'fr4-review-two-reads');
  await page.getByRole('button', { name: 'ปิด' }).first().click();
  await page.waitForTimeout(800);
  await page.getByText('ร้านน้ำปั่น').first().click();
  await visible(page, 'ช่วยตรวจ');
  await shot(page, 'fr4-review-unclear');
  await button(page, 'ยืนยันและรวมในยอดเงิน').click();
  await page.waitForTimeout(1200);
  await shot(page, 'fr4-review-confirmed');
  await ctx.close();
}

// C. Offline while reading: the scan pauses and says why.
{
  state.aiDelayMs = 0;
  state.slipReadings = [
    { isSlip: true, direction: 'expense', amount: '60.00', dateText: 'x', dateIso: bkkDay(0), time: '09:00', counterparty: 'ร้านกาแฟ', bank: 'KBank', reference: 'BOOK201', confidence: { amount: 0.97, date: 0.95, counterparty: 0.93 } },
  ];
  const { ctx, page } = await session('offline', null);
  await signUp(page, 'ออฟไลน์', 'offline@example.com', 2000);
  await button(page, 'เริ่มใช้ MindPay').click();
  await visible(page, 'ยอดคงเหลือ');
  await page.goto(app.replace(/\/$/, '') + '/scan');
  await intro(page);
  const chooser = page.waitForEvent('filechooser');
  await button(page, 'เลือกรูปสลิป').click();
  state.slipOffline = 2;
  await (await chooser).setFiles([join(FIXTURES, 'photo-1.jpg')]);
  await visible(page, 'เชื่อมต่ออินเทอร์เน็ตไม่ได้', 15000);
  await shot(page, 'fr4-scan-offline');
  await ctx.close();
}

await browser.close();
close();
