// FR-3 screenshots for the study book: demo data at a fixed time (19:00, Fri 9 Oct 2569 Bangkok).
import { chromium } from 'playwright';
import fs from 'node:fs';
import { createFakeSupabase, serveDist, SUPA, routeQrDecoder } from '../e2e/fake-backend.mjs';

const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const { app, close } = await serveDist(new URL('../dist', import.meta.url).pathname, 4196);
const browser = await chromium.launch();
const SKINS = ['classic', 'thai', 'graduate', 'detective', 'dj', 'saver', 'chill', 'hero', 'sakura', 'pioneer', 'newyear2570', 'pumpkin', 'sheetghost', 'witch', 'mummy', 'vampire', 'frankenstein', 'songkran2569', 'loykrathong2568'];
const BADGES = ['first_step', 'first_slip', 'voice', 'streak_3', 'streak_7', 'streak_30', 'slips_10', 'slips_100', 'all_clear', 'saver_week', 'healthy_tree', 'first_goal', 'goal_reached'];

async function session({ speech }) {
  const { supabase } = createFakeSupabase();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, locale: 'th-TH', colorScheme: 'light', reducedMotion: 'reduce' });
  await ctx.addInitScript(({ SKINS, BADGES, speech }) => {
    try {
      localStorage.setItem('mindpay.colorTheme', 'forest');
      localStorage.setItem('mindpay.halloweenInvite', 'closed');
      localStorage.setItem('mindpay.whatsNewSeen', '2026-09-30-halloween');
      if (!localStorage.getItem('mindpay.kla.demo')) localStorage.setItem('mindpay.kla.demo', JSON.stringify({ owned: ['classic'], seen: SKINS, equipped: 'classic', opens: [], ghosts: {} }));
      if (!localStorage.getItem('mindpay.badges.demo')) localStorage.setItem('mindpay.badges.demo', JSON.stringify(BADGES));
    } catch {}
    if (speech === 'none') {
      for (const name of ['SpeechRecognition', 'webkitSpeechRecognition']) {
        try { Object.defineProperty(window, name, { value: undefined, configurable: true, writable: true }); } catch {}
      }
    } else {
      class FakeRecognition {
        constructor() { this.lang = ''; this.onresult = null; this.onerror = null; this.onend = null; }
        start() {
          const say = (text, isFinal) => { const result = [{ transcript: text }]; result.isFinal = isFinal; this.onresult?.({ resultIndex: 0, results: [result] }); };
          setTimeout(() => say('ข้าวมันไก่', false), 300);
          setTimeout(() => say('ข้าวมันไก่ 50 บาท', true), 2600);
          setTimeout(() => this.onend?.(), 2700);
        }
        stop() { setTimeout(() => this.onend?.(), 0); }
      }
      for (const name of ['SpeechRecognition', 'webkitSpeechRecognition']) {
        Object.defineProperty(window, name, { value: FakeRecognition, configurable: true, writable: true });
      }
    }
  }, { SKINS, BADGES, speech });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.clock.install({ time: new Date('2026-10-09T12:00:00Z') });
  await page.route(`${SUPA}/**`, supabase);
  await routeQrDecoder(page);
  return { ctx, page };
}

const run = async ({ speech }, body) => {
  const { ctx, page } = await session({ speech });
  const wait = (ms) => page.waitForTimeout(ms);
  const shot = async (name) => { await wait(700); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('shot', name); };
  const intro = () => page.getByLabel('กำลังเปิด MindPay').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
  await page.goto(app);
  await page.getByText('ลองใช้ด้วยข้อมูลตัวอย่าง').first().waitFor();
  await intro();
  await page.getByText('ลองใช้ด้วยข้อมูลตัวอย่าง').click();
  await page.getByText('ยอดคงเหลือ').first().waitFor();
  await wait(2000);
  await body({ page, wait, shot });
  await ctx.close();
};

await run({ speech: 'fake' }, async ({ page, wait, shot }) => {
  await page.getByRole('button', { name: 'จดด้วยเสียง' }).first().click();
  await wait(1500);
  await shot('fr3-open');
  await page.getByRole('button', { name: 'แตะแล้วพูด' }).first().click();
  await wait(700);
  await shot('fr3-listening');
  await wait(2600);
  await shot('fr3-heard');
  const typed = async (t, name) => { await page.fill('#voice-text', t); await wait(900); await shot(name); };
  await typed('เมื่อวานค่ารถ 40 วันนี้ข้าว 50', 'fr3-two-days');
  await typed('ข้าว 2 จาน 100 บาท', 'fr3-quantity');
  await typed('สวัสดีครับ', 'fr3-no-amount');
  await typed('รองเท้า สองพันห้า', 'fr3-number-words');
  await typed('ค่ารถ 25 กาแฟ 65 ได้เงินจากแม่ 500', 'fr3-three');
  await page.getByRole('button', { name: 'รายจ่าย แตะเพื่อสลับ' }).nth(1).click();
  await wait(700);
  await shot('fr3-switched');
  await page.getByRole('button', { name: 'ไม่บันทึก ค่ารถ' }).first().click();
  await wait(700);
  await shot('fr3-removed');
  await page.getByRole('button', { name: /บันทึก \d รายการ/ }).first().click();
  await wait(1200);
  await shot('fr3-saved');
});

await run({ speech: 'none' }, async ({ page, wait, shot }) => {
  await page.goto(app.replace(/\/$/, '') + '/voice');
  await page.getByLabel('กำลังเปิด MindPay').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
  await wait(1800);
  await shot('fr3-no-speech');
});

await browser.close();
close();
