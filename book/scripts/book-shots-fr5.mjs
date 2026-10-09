// FR-5 screenshots for the study book: the coach in demo mode, and a signed-in account
// (fake Supabase) with a month of records, stand-in AI answers and a stand-in Thai voice.
// Usage: node scripts/book-shots-fr5.mjs <outDir> [answers.json]
import { chromium } from 'playwright';
import fs from 'node:fs';
import { createFakeSupabase, serveDist, SUPA, routeQrDecoder } from '../e2e/fake-backend.mjs';

const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const ANSWERS = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8')) : {};
const { app, close } = await serveDist(new URL('../dist', import.meta.url).pathname, 4205);
const browser = await chromium.launch();
const { state, supabase } = createFakeSupabase();
state.confirmEmail = false;
const SKINS = ['classic', 'thai', 'graduate', 'detective', 'dj', 'saver', 'chill', 'hero', 'sakura', 'pioneer', 'newyear2570', 'pumpkin', 'sheetghost', 'witch', 'mummy', 'vampire', 'frankenstein', 'songkran2569', 'loykrathong2568'];
const BADGES = ['first_step', 'first_slip', 'voice', 'streak_3', 'streak_7', 'streak_30', 'slips_10', 'slips_100', 'all_clear', 'saver_week', 'healthy_tree', 'first_goal', 'goal_reached'];
const bkkDay = (daysAgo) => new Date(Date.now() + 7 * 3600e3 - daysAgo * 86400e3).toISOString().slice(0, 10);
const captured = [];

async function session(tag, { voice = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, locale: 'th-TH', colorScheme: 'light', reducedMotion: 'reduce' });
  await ctx.addInitScript(({ SKINS, BADGES }) => {
    try {
      localStorage.setItem('mindpay.colorTheme', 'forest');
      localStorage.setItem('mindpay.halloweenInvite', 'closed');
      localStorage.setItem('mindpay.whatsNewSeen', '2026-09-30-halloween');
      const who = ['demo', ...[1, 2, 3].map((n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`)];
      for (const id of who) {
        if (!localStorage.getItem(`mindpay.badges.${id}`)) localStorage.setItem(`mindpay.badges.${id}`, JSON.stringify(BADGES));
        if (!localStorage.getItem(`mindpay.kla.${id}`)) localStorage.setItem(`mindpay.kla.${id}`, JSON.stringify({ owned: ['classic'], seen: SKINS, equipped: 'classic', opens: [], ghosts: {} }));
      }
    } catch {}
  }, { SKINS, BADGES });
  if (voice) {
    // A stand-in Thai voice (the test browser has none): each piece takes about as long as saying it.
    await ctx.addInitScript(() => {
      window.__spoken = [];
      const voices = [
        { name: 'Google US English', lang: 'en-US', default: true, localService: false, voiceURI: 'en' },
        { name: 'Microsoft Niwat Online (Natural) - Thai (Thailand)', lang: 'th-TH', default: false, localService: false, voiceURI: 'th2' },
      ];
      class FakeUtterance {
        constructor(text) { this.text = text; this.lang = ''; this.rate = 1; this.pitch = 1; this.voice = null; this.onend = null; this.onerror = null; }
      }
      let timer = null;
      const synth = {
        speaking: false,
        getVoices: () => voices,
        addEventListener() {},
        speak(u) {
          window.__spoken.push({ text: u.text, lang: u.lang, rate: u.rate, pitch: u.pitch, voice: u.voice?.name ?? '' });
          timer = setTimeout(() => u.onend?.(), Math.max(1800, u.text.length * 110));
        },
        cancel() { clearTimeout(timer); },
      };
      Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true, writable: true });
    });
  }
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log(`[${tag}] pageerror`, e.message));
  await page.route(`${SUPA}/**`, async (route) => {
    const req = route.request();
    if (req.method() === 'POST' && req.url().includes('/functions/v1/coach')) captured.push({ tag, body: req.postDataJSON() });
    return supabase(route);
  });
  await routeQrDecoder(page);
  return { ctx, page };
}
const intro = (page) => page.getByLabel('กำลังเปิด MindPay').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
const button = (page, name) => page.getByRole('button', { name, exact: false }).first();
const visible = (page, text, timeout = 8000) => page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout }).then(() => true, () => false);
const shot = async (page, name, wait = 700) => { await page.waitForTimeout(wait); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('shot', name); };
const go = async (page, path) => { await page.goto(app.replace(/\/$/, '') + path); await intro(page); await page.waitForTimeout(1800); };
const scrollTo = (page, text) => page.getByText(text, { exact: true }).first().evaluate((el) => el.scrollIntoView({ block: 'start' }));

// A. Demo mode: greeting, the "สิ่งที่ควรรู้ตอนนี้" cards, a card told aloud, asking in demo mode, the skins.
{
  const { ctx, page } = await session('demo');
  await page.goto(app);
  await page.getByText('ลองใช้ด้วยข้อมูลตัวอย่าง').first().waitFor();
  await intro(page);
  await page.getByText('ลองใช้ด้วยข้อมูลตัวอย่าง').click();
  await visible(page, 'ยอดคงเหลือ');
  await page.waitForTimeout(2000);
  await shot(page, 'fr5-home-buddy');
  await go(page, '/coach');
  await shot(page, 'fr5-coach-greet', 300);
  await scrollTo(page, 'สิ่งที่ควรรู้ตอนนี้');
  await shot(page, 'fr5-coach-insights');
  await page.getByText('แตะให้น้องกล้าเล่า').first().click();
  await shot(page, 'fr5-coach-tell', 900);
  await page.waitForTimeout(5200);
  await shot(page, 'fr5-coach-tell-2', 200);
  await button(page, 'ให้น้องกล้าหยุดพูด').click().catch(() => {});
  await page.getByText('สรุปสัปดาห์นี้ให้หน่อย').first().click();
  await page.waitForTimeout(1500);
  await scrollTo(page, 'คุยกับน้องกล้า');
  await shot(page, 'fr5-coach-demo-ask');
  await go(page, '/coach');
  await button(page, 'เปลี่ยนชุดน้องกล้า').click();
  await shot(page, 'fr5-coach-wardrobe', 1200);
  await go(page, '/skins');
  await shot(page, 'fr5-skins');
  await go(page, '/settings');
  await scrollTo(page, 'เสียงน้องกล้า');
  await page.mouse.wheel(0, -160);
  await shot(page, 'fr5-settings-voice');
  fs.writeFileSync(`${OUT}/fr5-spoken-demo.json`, JSON.stringify(await page.evaluate(() => window.__spoken), null, 1));
  await ctx.close();
}

// B. A signed-in student with a month of records: real insights, AI answers (stand-ins), a purchase question, errors.
{
  const { ctx, page } = await session('real');
  await page.goto(app);
  await page.getByText('ลองใช้ด้วยข้อมูลตัวอย่าง').first().waitFor();
  await intro(page);
  await page.getByText('สมัครสมาชิก', { exact: true }).click();
  await page.fill('#name', 'มายด์');
  await page.fill('#email', 'mind@example.com');
  await page.fill('#password', 'secret123');
  await button(page, 'สร้างบัญชี').click();
  await visible(page, 'สมัครบัญชีสำเร็จ');
  await button(page, 'ไปตั้งค่าเงิน').click();
  await page.fill('#ob-balance', '6000');
  await button(page, 'เริ่มใช้ MindPay').click();
  await visible(page, 'ยอดคงเหลือ');
  const user = state.users.get('mind@example.com');
  state.profiles.get(user.id).monthly_budget_satang = 600_000;
  const rows = [
    // usual weeks (8 to 27 days ago): food ฿300 twice a week
    [26, 'expense', 'food', 'ชาบูกับเพื่อน', 300], [23, 'expense', 'food', 'ข้าวกับของกินเล่น', 300], [19, 'expense', 'food', 'หมูกระทะ', 300],
    [16, 'expense', 'food', 'ข้าวทั้งวัน', 300], [12, 'expense', 'food', 'ข้าวกับขนม', 300], [9, 'expense', 'food', 'ข้าวมันไก่และชานม', 300],
    // this week: food every day
    [6, 'expense', 'food', 'ข้าวกะเพรา', 200], [5, 'expense', 'food', 'ส้มตำไก่ย่าง', 180], [4, 'expense', 'food', 'ชานมไข่มุก', 250], [3, 'expense', 'food', 'ก๋วยเตี๋ยว', 150],
    [2, 'expense', 'food', 'ข้าวผัด', 220], [1, 'expense', 'food', 'ข้าวมันไก่', 160], [0, 'expense', 'food', 'ข้าวเหนียวหมูปิ้ง', 90],
    // bus fares
    ...[1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26].map((d) => [d, 'expense', 'transport', 'รถเมล์ไปเรียน', 40]),
    [2, 'expense', 'convenience', 'เซเว่น', 65], [6, 'expense', 'convenience', 'เซเว่น', 45], [11, 'expense', 'convenience', 'เซเว่น', 80], [18, 'expense', 'convenience', 'เซเว่น', 55], [25, 'expense', 'convenience', 'เซเว่น', 70],
    [13, 'expense', 'shopping', 'เสื้อยืด', 890],
    [8, 'expense', 'bills', 'ค่าหอเดือนตุลา', 2500],
    [7, 'expense', 'fun', 'ดูหนัง', 199],
    [8, 'income', 'allowance', 'ค่าขนมจากแม่', 4000],
  ];
  rows.forEach(([d, kind, cat, title, baht], i) =>
    state.txRows.push({
      id: `seed-${i + 1}`, user_id: user.id, kind, amount_satang: baht * 100, category_key: cat, title, note: null,
      occurred_at: `${bkkDay(d)}T05:00:00.000Z`, source: 'manual', status: 'confirmed', slip_ref: null, slip_image_hash: null,
      ocr_confidence: null, review_flags: [], created_at: `${bkkDay(d)}T05:00:00.000Z`,
    }),
  );
  await page.reload();
  await intro(page);
  await visible(page, 'ยอดคงเหลือ');
  await page.waitForTimeout(1500);
  await shot(page, 'fr5-real-home');
  await go(page, '/coach');
  await page.waitForTimeout(5000);
  await scrollTo(page, 'สิ่งที่ควรรู้ตอนนี้');
  await shot(page, 'fr5-real-insights');
  await page.mouse.wheel(0, 500);
  await shot(page, 'fr5-real-insights-2');
  // The weekly summary question (a stand-in answer from the test server).
  state.coach = { status: 200, body: { text: ANSWERS.week ?? 'คำตอบทดสอบ' } };
  await page.getByText('สรุปสัปดาห์นี้ให้หน่อย').first().click();
  await page.waitForTimeout(1200);
  await shot(page, 'fr5-real-answer-talking', 200);
  await page.waitForTimeout(1800);
  await scrollTo(page, 'คุยกับน้องกล้า');
  await shot(page, 'fr5-real-answer');
  // "Can I buy this?" from the runway screen.
  await go(page, '/runway');
  await page.fill('#runway-price', '1290');
  await page.waitForTimeout(800);
  await page.getByText('เช็กก่อนจ่าย', { exact: false }).first().evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await shot(page, 'fr5-runway-check');
  state.coach = { status: 200, body: { text: ANSWERS.buy ?? 'คำตอบทดสอบ' } };
  await button(page, 'ถามโค้ชเรื่องนี้').click();
  await page.waitForTimeout(1500);
  await shot(page, 'fr5-buy-prefilled');
  await button(page, 'ส่งคำถาม').click();
  await page.waitForTimeout(2500);
  await scrollTo(page, 'คุยกับน้องกล้า');
  await shot(page, 'fr5-buy-answer');
  // A typed question with a price in it.
  state.coach = { status: 200, body: { text: ANSWERS.headphones ?? 'คำตอบทดสอบ' } };
  await page.fill('#coach-input', 'หูฟัง 1,990 คุ้มไหม');
  await button(page, 'ส่งคำถาม').click();
  await page.waitForTimeout(2500);
  // Errors: the key is not set, the AI is busy, the daily limit.
  for (const [code, q] of [['not_configured', 'หมวดไหนควรลดก่อน'], ['busy', 'ทำยังไงให้เงินพอถึงสิ้นเดือน'], ['quota', 'สรุปเดือนนี้ให้หน่อย']]) {
    state.coach = { status: code === 'quota' ? 429 : 503, body: { error: { code, message: 'x' } } };
    await page.fill('#coach-input', q);
    await button(page, 'ส่งคำถาม').click();
    await page.waitForTimeout(1500);
  }
  await page.mouse.move(195, 450);
  await page.mouse.wheel(0, 4000);
  await shot(page, 'fr5-errors', 1200);
  fs.writeFileSync(`${OUT}/fr5-spoken-real.json`, JSON.stringify(await page.evaluate(() => window.__spoken), null, 1));
  await ctx.close();
}

// C. No Thai voice on this device: น้องกล้า talks with subtitles only.
{
  const { ctx, page } = await session('novoice', { voice: false });
  await page.goto(app);
  await page.getByText('ลองใช้ด้วยข้อมูลตัวอย่าง').first().waitFor();
  await intro(page);
  await page.getByText('ลองใช้ด้วยข้อมูลตัวอย่าง').click();
  await visible(page, 'ยอดคงเหลือ');
  await go(page, '/coach');
  await shot(page, 'fr5-coach-novoice', 1500);
  await ctx.close();
}

fs.writeFileSync(`${OUT}/fr5-coach-requests.json`, JSON.stringify(captured, null, 1));
await browser.close();
close();
