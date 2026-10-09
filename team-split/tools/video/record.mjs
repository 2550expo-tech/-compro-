// Records the VS Code tutorial (part 5's turn) in code-server and writes rec/timeline.json for the caption band.
import { chromium } from 'playwright';
import fs from 'node:fs';

const V = process.argv[2];
const FONTS = '/home/user/mindpay-books/fonts';
const b64 = (f) => fs.readFileSync(`${FONTS}/${f}`).toString('base64');
const FONT_CSS = `
@font-face { font-family: OvThai; src: url(data:font/ttf;base64,${b64('Anuphan_500Medium.ttf')}); font-weight: 500; }
@font-face { font-family: OvThai; src: url(data:font/ttf;base64,${b64('Anuphan_700Bold.ttf')}); font-weight: 700; }`;

const W = 1200, H = 575; // x1.6 = 1920x920, the caption band (160 px) is added below in post
const URL_REPO = 'https://github.com/your-team/mindpay-team.git';
const MSG5 = 'ชุดที่ 5: FR-6 Money Runway + โครงแอป ตั้งค่าโปรเจกต์ CI (ย้ายโค้ดจาก repo เดิม) พร้อม README ของ FR-6';

// ---------------------------------------------------------------- in-page overlay (cursor, keys, ring, cards)
const OVERLAY = (fontCss) => {
  const boot = () => {
    if (document.getElementById('ov-root')) return;
    const css = document.createElement('style');
    css.textContent = fontCss + `
      #ov-root, #ov-root * { box-sizing: border-box; }
      #ov-root { position: fixed; inset: 0; pointer-events: none; z-index: 2147483647; font-family: OvThai, sans-serif; }
      #ov-cursor { position: fixed; left: 0; top: 0; width: 22px; height: 22px; transform: translate(-3px,-2px); transition: none; filter: drop-shadow(0 1px 2px rgba(0,0,0,.6)); }
      .ov-ripple { position: fixed; width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%; border: 3px solid #E2B64A; animation: ovr .55s ease-out forwards; }
      @keyframes ovr { from { transform: scale(.3); opacity: 1; } to { transform: scale(1.6); opacity: 0; } }
      #ov-keys { position: fixed; right: 26px; top: 70px; background: rgba(14,59,44,.96); color: #F3F0E4; border: 2px solid #E2B64A;
        border-radius: 14px; padding: 8px 20px 9px; text-align: center; opacity: 0; transition: opacity .18s; box-shadow: 0 10px 30px rgba(0,0,0,.45); }
      #ov-keys .k { font-size: 26px; font-weight: 700; letter-spacing: .5px; }
      #ov-keys .s { font-size: 13px; color: #C9DCD2; margin-top: 1px; }
      #ov-keys kbd { font-family: inherit; background: #F3F0E4; color: #0E3B2C; border-radius: 7px; padding: 0 9px; margin: 0 3px; box-shadow: 0 3px 0 #9FBFB0; }
      #ov-ring { position: fixed; border: 3px solid #E2B64A; border-radius: 10px; box-shadow: 0 0 0 4px rgba(226,182,74,.25), 0 0 24px rgba(226,182,74,.55);
        opacity: 0; transition: opacity .2s; }
      #ov-card { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .35s;
        background: radial-gradient(ellipse at 75% 10%, #1D6B4C 0%, #0E3B2C 55%, #082A1F 100%); color: #F3F0E4; }
      #ov-card .inner { width: 900px; }
      #ov-card .kick { color: #E2B64A; font-weight: 700; letter-spacing: 2px; font-size: 16px; }
      #ov-card h1 { font-size: 46px; line-height: 1.25; margin: 6px 0 8px; font-weight: 700; }
      #ov-card .sub { font-size: 22px; color: #C9DCD2; }
      #ov-card ul { margin: 18px 0 0; padding-left: 26px; font-size: 20px; line-height: 1.65; color: #E9F2EC; }
      #ov-card .step { font-size: 120px; font-weight: 700; color: #E2B64A; line-height: 1; }
      #ov-card .warn { margin-top: 16px; display: inline-block; background: #7A1F1F; color: #FFE9E9; border-radius: 10px; padding: 6px 14px; font-size: 19px; font-weight: 700; }
      #ov-card .mock { margin-top: 18px; background: #F6F8FA; color: #1F2328; border-radius: 12px; padding: 16px 18px; width: 640px; font-size: 17px; box-shadow: 0 14px 40px rgba(0,0,0,.4); }
      #ov-card .mock .row { display: flex; align-items: center; gap: 10px; }
      #ov-card .mock .btn { background: #1F883D; color: #fff; border-radius: 7px; padding: 4px 12px; font-weight: 700; }
      #ov-card .mock .tab { border-bottom: 2px solid #FD8C73; font-weight: 700; padding: 2px 4px; }
      #ov-card .mock .url { flex: 1; border: 1px solid #D0D7DE; border-radius: 7px; padding: 6px 10px; font-family: monospace; font-size: 15px; background: #fff; }
      #ov-card .mock .copy { border: 2px solid #E2B64A; border-radius: 7px; padding: 4px 10px; font-weight: 700; color: #7A5A12; background: #FFF6DC; }
    `;
    const root = document.createElement('div');
    root.id = 'ov-root';
    root.innerHTML = `<div id="ov-card"></div><div id="ov-ring"></div><div id="ov-keys"></div>
      <svg id="ov-cursor" viewBox="0 0 24 24"><path d="M3 2 L3 19 L8 14.5 L11.2 21.5 L14 20.3 L10.8 13.4 L17.5 13.4 Z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
    document.documentElement.append(css, root);
    const cur = root.querySelector('#ov-cursor');
    cur.style.left = '-100px';
    addEventListener('mousemove', (e) => { cur.style.left = e.clientX + 'px'; cur.style.top = e.clientY + 'px'; }, true);
    addEventListener('mousedown', (e) => {
      const r = document.createElement('div'); r.className = 'ov-ripple'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
      root.append(r); setTimeout(() => r.remove(), 600);
    }, true);
    let kt, rt;
    window.__ov = {
      keys(k, s) {
        const el = root.querySelector('#ov-keys');
        el.innerHTML = `<div class="k">${k.split('+').map((x) => `<kbd>${x.trim()}</kbd>`).join('+')}</div>` + (s ? `<div class="s">${s}</div>` : '');
        el.style.opacity = 1; clearTimeout(kt); kt = setTimeout(() => { el.style.opacity = 0; }, 1900);
      },
      ring(x, y, w, h, ms = 2600) {
        const el = root.querySelector('#ov-ring');
        Object.assign(el.style, { left: x - 5 + 'px', top: y - 5 + 'px', width: w + 10 + 'px', height: h + 10 + 'px', opacity: 1 });
        clearTimeout(rt); rt = setTimeout(() => { el.style.opacity = 0; }, ms);
      },
      card(html) { const el = root.querySelector('#ov-card'); el.innerHTML = `<div class="inner">${html}</div>`; el.style.opacity = 1; },
      hideCard() { root.querySelector('#ov-card').style.opacity = 0; },
      cardNow(html) { const el = root.querySelector('#ov-card'); el.style.transition = 'none'; el.innerHTML = `<div class="inner">${html}</div>`; el.style.opacity = 1; requestAnimationFrame(() => { el.style.transition = ''; }); },
    };
    if (sessionStorage.getItem('ov-reload')) window.__ov.cardNow(sessionStorage.getItem('ov-reload'));
  };
  if (document.documentElement) boot(); else addEventListener('DOMContentLoaded', boot);
  document.addEventListener('readystatechange', boot);
};

// ---------------------------------------------------------------- helpers
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1.6 });
await ctx.addInitScript(OVERLAY, FONT_CSS);
const page = await ctx.newPage();
const t0 = Date.now();
// Full-resolution frames (1920x920): the built-in recorder and the screencast only give CSS-pixel frames.
const client = await ctx.newCDPSession(page);
fs.rmSync(`${V}/rec/frames`, { recursive: true, force: true }); fs.mkdirSync(`${V}/rec/frames`, { recursive: true });
const frames = []; let capturing = true;
const capLoop = (async () => {
  while (capturing) {
    const start = Date.now();
    try {
      const { data } = await client.send('Page.captureScreenshot', { format: 'jpeg', quality: 82, optimizeForSpeed: true, clip: { x: 0, y: 0, width: W, height: H, scale: 1.6 } });
      const f = `${String(frames.length).padStart(5, '0')}.jpg`;
      fs.writeFileSync(`${V}/rec/frames/${f}`, Buffer.from(data, 'base64'));
      frames.push({ t: (start - t0) / 1000, f });
    } catch { await new Promise((r) => setTimeout(r, 60)); }
    const dt = Date.now() - start; if (dt < 55) await new Promise((r) => setTimeout(r, 55 - dt));
  }
})();
const now = () => +((Date.now() - t0) / 1000).toFixed(2);
const timeline = [];
const sleep = (ms) => page.waitForTimeout(ms);
const cap = async (head, text, hold = 0) => { timeline.push({ t: now(), head, text }); if (hold) await sleep(hold); };
const mark = (name) => timeline.push({ t: now(), mark: name });
const ov = (fn, ...args) => page.evaluate(([f, a]) => window.__ov && window.__ov[f](...a), [fn, args]);
const keys = (k, s) => ov('keys', k, s || '');

async function glide(x, y, steps = 28) { await page.mouse.move(x, y, { steps }); }
async function clickAt(loc, opts = {}) {
  const box = await loc.boundingBox();
  if (!box) throw new Error('no box for ' + loc);
  const x = box.x + (opts.dx ?? box.width / 2), y = box.y + (opts.dy ?? box.height / 2);
  await glide(x, y); await sleep(250);
  await page.mouse.click(x, y);
}
async function ring(loc, ms) { const b = await loc.boundingBox(); if (b) await ov('ring', b.x, b.y, b.width, b.height, ms); }
async function focusWorkbench() { await page.mouse.click(900, 120); await sleep(150); }
async function palette(cmd, { hud = true, typeDelay = 45 } = {}) {
  if (hud) await keys('Ctrl + Shift + P', 'Mac: Cmd + Shift + P');
  await sleep(500);
  await page.keyboard.press('Control+Shift+P');
  await page.waitForSelector('.quick-input-widget:not([style*="display: none"]) input', { timeout: 8000 });
  await sleep(350);
  await page.keyboard.type(cmd, { delay: typeDelay });
  await sleep(900);
  await page.keyboard.press('Enter');
}
const termText = () => page.evaluate(() => [...document.querySelectorAll('.xterm-rows > div')].filter((d) => !d.closest('.terminal-sticky-scroll')).map((d) => d.textContent).join('\n'));
async function waitTerm(fn, timeout = 15000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if (fn(await termText())) return; await sleep(150); }
  throw new Error('terminal wait timed out: ' + (await termText()).slice(-300));
}
async function openTerminal() {
  await palette('Terminal: Create New Terminal');
  await waitTerm((t) => /%$/.test(lastLine(t)));
  await sleep(500);
}
const lastLine = (t) => { const ls = t.split('\n').map((l) => l.replace(/\s+$/, '')).filter(Boolean); return ls[ls.length - 1] || ''; };
async function run(cmd, { delay = 42, after = 1600, until } = {}) {
  await page.keyboard.type(cmd, { delay });
  await sleep(350);
  await page.keyboard.press('Enter');
  await sleep(300);
  const end = Date.now() + 20000;
  for (;;) {
    const t = await termText(); const last = lastLine(t);
    if (/^:$|\(END\)$/.test(last)) { // git opened its pager: show how to leave it
      await sleep(1500); await keys('q', 'ออกจากหน้ารายการที่ขึ้น : ด้านล่าง'); await sleep(900); await page.keyboard.press('q'); await sleep(400); continue;
    }
    if (/%$/.test(last) && (!until || t.includes(until))) break;
    if (Date.now() > end) throw new Error('terminal wait timed out: ' + t.slice(-300));
    await sleep(150);
  }
  await sleep(after);
}
async function growPanel(toY = 150) {
  const b = await page.locator('.part.panel').first().boundingBox();
  if (!b) return;
  await page.mouse.move(820, b.y + 1, { steps: 12 }); await sleep(150);
  await page.mouse.down(); await page.mouse.move(820, toY, { steps: 22 }); await page.mouse.up(); await sleep(500);
}
async function chapter(n, title, sub) {
  await ov('card', `<div class="step">${n}</div><div class="kick">ขั้นที่ ${n} จาก 6</div><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}`);
  await cap(`ขั้นที่ ${n} จาก 6`, title);
  await sleep(3000);
  await ov('hideCard'); await sleep(450);
}

try {
// ---------------------------------------------------------------- 0. load + intro
await page.goto('http://127.0.0.1:8099/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !!window.__ov, null, { timeout: 30000 });
await ov('cardNow', `<div class="kick">MINDPAY · คลิปสอน</div><h1>ส่งงานเข้า repo กลุ่มด้วย VS Code</h1>
  <div class="sub">ตัวอย่าง: ชุด 5 · FR-6 Money Runway · คนละ 1 commit</div>
  <ul><li>ชุด 1–4 push ไปแล้ว ตอนนี้ถึงตาชุด 5</li>
  <li>repo ในคลิปเป็น repo ตัวอย่าง ตอนทำจริงให้ใช้ลิงก์ repo ของกลุ่ม</li>
  <li>ในคลิปใช้ปุ่มลัดแบบ Windows · Mac ให้ใช้ Cmd แทน Ctrl</li></ul>`);
mark('start');
await cap('คลิปสอน', 'ส่งงานเข้า repo กลุ่มด้วย VS Code: 6 ขั้น คนละ 1 commit (ตัวอย่างนี้คือชุด 5)');
await page.waitForSelector('.monaco-workbench', { timeout: 60000 });
await sleep(7500);
await ov('hideCard'); await sleep(500);

// ---------------------------------------------------------------- 1. git identity
await chapter(1, 'ตั้งชื่อและอีเมลใน Git', 'ทำครั้งเดียวต่อเครื่อง');
await focusWorkbench();
await cap('ขั้นที่ 1 · ตั้งชื่อและอีเมล', 'เปิด Terminal: กด Ctrl + Shift + P พิมพ์ Terminal: Create New Terminal แล้วกด Enter (หรือกด Ctrl + `)');
await sleep(800);
await openTerminal();
await cap('ขั้นที่ 1 · ตั้งชื่อและอีเมล', 'เช็กว่าเครื่องมี Git: พิมพ์ git --version แล้วกด Enter ต้องขึ้นเลขเวอร์ชัน', 600);
await run('git --version', { until: 'git version', after: 2200 });
await cap('ขั้นที่ 1 · ตั้งชื่อและอีเมล', 'ตั้งชื่อ: พิมพ์ชื่อของคุณไว้ในเครื่องหมายคำพูด', 600);
await run('git config --global user.name "ชื่อ นามสกุล"', { after: 1200 });
await cap('ขั้นที่ 1 · ตั้งชื่อและอีเมล', 'ตั้งอีเมล: ต้องตรงกับอีเมลในบัญชี GitHub (ดูที่ GitHub → Settings → Emails)', 600);
await run('git config --global user.email "you@example.com"', { after: 1200 });
await cap('ขั้นที่ 1 · ตั้งชื่อและอีเมล', 'อีก 2 บรรทัด: กันไม่ให้เกิด commit "Merge" เกิน และกันไม่ให้ branch ชื่อ master', 600);
await run('git config --global pull.rebase true', { after: 500 });
await run('git config --global init.defaultBranch main', { after: 1000 });
await cap('ขั้นที่ 1 · ตั้งชื่อและอีเมล', 'เช็กว่าตั้งครบ: ต้องเห็น user.name, user.email, pull.rebase และ init.defaultbranch', 500);
await run('git config --global --list', { until: 'defaultbranch', after: 3500 });

// ---------------------------------------------------------------- 2. clone + pull
await chapter(2, 'clone repo แล้วดึงงานล่าสุด', 'ใช้ลิงก์ repo ของกลุ่ม');
await ov('card', `<div class="kick">บนเว็บ GitHub</div><h1>คัดลอกลิงก์ repo</h1>
  <div class="sub">หน้า repo ของกลุ่ม → ปุ่ม Code → แท็บ HTTPS → กดคัดลอก</div>
  <div class="mock"><div class="row"><span class="btn">&lt;&gt; Code ▾</span><span class="tab">HTTPS</span><span style="color:#59636E">SSH</span></div>
  <div class="row" style="margin-top:12px"><span class="url">${URL_REPO}</span><span class="copy">คัดลอก</span></div></div>
  <div class="sub" style="margin-top:14px;font-size:17px">ในคลิปใช้ลิงก์ตัวอย่าง ตอนทำจริงใช้ลิงก์ของ repo กลุ่ม</div>`);
await cap('ขั้นที่ 2 · clone repo', 'บนหน้า repo ใน GitHub กดปุ่ม Code → HTTPS → คัดลอกลิงก์ (ในคลิปใช้ลิงก์ตัวอย่าง)', 5500);
await ov('hideCard'); await sleep(500);
await focusWorkbench();
await cap('ขั้นที่ 2 · clone repo', 'กด Ctrl + Shift + P พิมพ์ Git: Clone แล้วกด Enter');
await sleep(700);
await palette('Git: Clone');
await page.waitForSelector('.quick-input-widget input', { timeout: 8000 });
await sleep(900);
await cap('ขั้นที่ 2 · clone repo', 'วางลิงก์ repo แล้วกด Enter', 500);
await page.keyboard.insertText(URL_REPO);
await sleep(1500);
await page.keyboard.press('Enter');
await page.waitForFunction(() => document.querySelector('.quick-input-widget')?.innerText.includes('Choose a folder'), null, { timeout: 10000 });
await sleep(700);
await cap('ขั้นที่ 2 · clone repo', 'เลือกที่เก็บ เช่น Documents แล้วกด Select as Repository Destination · ห้ามเลือกโฟลเดอร์ที่อยู่ใน repo อื่น เช่น โฟลเดอร์ fr', 600);
await page.keyboard.type('Documents/', { delay: 90 });
await sleep(1600);
const selectBtn = page.getByRole('button', { name: 'Select as Repository Destination' });
await ring(selectBtn, 2200); await sleep(900);
await clickAt(selectBtn);
await page.waitForSelector('.monaco-dialog-box', { timeout: 30000 });
await sleep(900);
await cap('ขั้นที่ 2 · clone repo', 'clone เสร็จแล้ว กด Open เพื่อเปิด repo', 600);
const openBtn = page.locator('.monaco-dialog-box').getByRole('button', { name: 'Open', exact: true });
await ring(openBtn, 1800); await sleep(800);
await page.evaluate(() => sessionStorage.setItem('ov-reload', '<div class="kick">กำลังเปิด repo</div><h1>VS Code กำลังเปิดโฟลเดอร์ mindpay-team…</h1>'));
await clickAt(openBtn);
await page.waitForURL(/folder=/, { timeout: 30000 });
await page.waitForFunction(() => !!window.__ov, null, { timeout: 30000 });
await cap('ขั้นที่ 2 · clone repo', 'VS Code กำลังเปิดโฟลเดอร์ที่ clone มา');
await page.evaluate(() => sessionStorage.removeItem('ov-reload'));
await page.waitForSelector('.monaco-workbench', { timeout: 60000 });
const trust = page.getByRole('button', { name: /Yes, I trust the authors/ });
await trust.first().waitFor({ timeout: 30000 });
await sleep(1200);
await ov('hideCard'); await sleep(700);
await cap('ขั้นที่ 2 · clone repo', 'VS Code ถามว่าเชื่อถือโฟลเดอร์นี้ไหม → กด Yes, I trust the authors', 1200);
await ring(trust.first(), 1800); await sleep(800);
await clickAt(trust.first());
await sleep(1800);
const branchItem = page.locator('.statusbar-item[aria-label*="Checkout Branch"]').first();
await cap('ขั้นที่ 2 · clone repo', 'มุมซ้ายล่างต้องขึ้นคำว่า main', 300);
await ring(branchItem, 3000); await sleep(3200);
await focusWorkbench();
await cap('ขั้นที่ 2 · clone repo', 'เปิด Terminal อีกครั้ง (ลากขอบให้สูงขึ้นได้) แล้วเช็ก branch: ต้องขึ้น main');
await sleep(600);
await openTerminal();
await growPanel();
await clickAt(page.locator('.terminal-wrapper .xterm, .xterm').first()); await sleep(300);
await run('git branch --show-current', { until: 'main', after: 1800 });
await cap('ขั้นที่ 2 · ดึงงานล่าสุด', 'ถึงตาคุณแล้ว: ดึงงานล่าสุดของเพื่อนก่อนทุกครั้งด้วย git pull', 600);
await run('git pull', { after: 2000 });
await cap('ขั้นที่ 2 · ดึงงานล่าสุด', 'ดู commit ล่าสุด 5 อัน: ต้องเห็นของชุด 1–4 ครบ (ถ้าขึ้น : ด้านล่าง ให้กด q เพื่อออก)', 500);
await run('git log --oneline -5', { until: 'Initial commit', after: 4500 });

// ---------------------------------------------------------------- 3. copy files
await chapter(3, 'คัดลอกไฟล์ของคุณเข้า repo', 'ของข้างในโฟลเดอร์ files ใน zip');
await clickAt(page.locator('.terminal-wrapper .xterm, .xterm').first()); await sleep(300);
await cap('ขั้นที่ 3 · คัดลอกไฟล์', 'แตก zip ไว้ในโฟลเดอร์ Downloads แล้ว เช็กว่าหาโฟลเดอร์ files เจอ', 600);
await run('ls ~/Downloads/part5-FR6/files', { until: 'vitest', after: 2600 });
await cap('ขั้นที่ 3 · คัดลอกไฟล์', 'คัดลอกของข้างใน files เข้ามา: Mac ใช้คำสั่ง cp นี้ · Windows คัดลอก-วางใน File Explorer หรือใช้ robocopy (ดูในคู่มือ)', 1200);
await run('cp -R ~/Downloads/part5-FR6/files/. .', { after: 2000 });
await cap('ขั้นที่ 3 · คัดลอกไฟล์', 'นับไฟล์ที่เปลี่ยน: ชุด 5 ต้องได้ 59 (ชุดอื่นดูตัวเลขในคู่มือ)', 600);
await run('git status --short -uall | wc -l', { until: '59', after: 2500 });
const scmIcon = page.locator('.activitybar [aria-label*="Source Control"]').first();
await cap('ขั้นที่ 3 · คัดลอกไฟล์', 'ไอคอน Source Control ก็ขึ้นเลข 59 และไฟล์ใหม่มีตัว U ใน Explorer', 300);
await ring(scmIcon, 3000); await sleep(3400);

// ---------------------------------------------------------------- 4. README
await chapter(4, 'เขียน README ของ FR ตัวเอง', 'เขียนด้วยคำของคุณเอง');
await focusWorkbench();
await page.keyboard.press('Control+J'); await sleep(500); // hide the panel to give the editor room
await cap('ขั้นที่ 4 · เขียน README', 'กด Ctrl + P พิมพ์ FR-6-runway/README แล้วกด Enter');
await keys('Ctrl + P', 'Mac: Cmd + P'); await sleep(500);
await page.keyboard.press('Control+P'); await sleep(500);
await page.keyboard.type('FR-6-runway/README', { delay: 55 }); await sleep(1300);
await page.keyboard.press('Enter');
await page.waitForSelector('.tab.active[aria-label*="README.md"], .tab.active .label-name', { timeout: 10000 });
await sleep(2200);
await cap('ขั้นที่ 4 · เขียน README', 'เขียนแทนช่อง ✏️ ด้วยคำของคุณเอง (ในคลิปเขียนให้ดู 1 ช่อง)', 400);
await page.keyboard.press('Control+F'); await sleep(300);
await page.keyboard.insertText('✏️ 3–5'); await sleep(700);
await page.keyboard.press('Escape'); await sleep(300);
await page.keyboard.press('Home'); await page.keyboard.press('Shift+End'); await sleep(900);
await page.keyboard.type('ผู้ใช้รู้แค่ยอดเงินคงเหลือ แต่ไม่รู้ว่าเงินจะพอใช้ถึงวันไหน FR-6 จึงแปลงยอดเงินเป็นจำนวนวันและวันที่เงินจะหมด', { delay: 28 });
await sleep(1500);
await cap('ขั้นที่ 4 · เขียน README', 'ของจริงต้องเขียนครบทุกช่อง: กด Ctrl + F ค้นหา ✏️ ให้ขึ้นว่า No results', 300);
await keys('Ctrl + F', 'Mac: Cmd + F'); await sleep(400);
await page.keyboard.press('Control+F'); await sleep(300);
await page.keyboard.press('Control+A'); await page.keyboard.insertText('✏️'); await sleep(900);
await ring(page.locator('.find-widget').first(), 2600); await sleep(3000);
await page.keyboard.press('Escape'); await sleep(300);
await cap('ขั้นที่ 4 · เขียน README', 'กด Ctrl + S บันทึกไฟล์', 300);
await keys('Ctrl + S', 'Mac: Cmd + S'); await sleep(500);
await page.keyboard.press('Control+S'); await sleep(1800);

// ---------------------------------------------------------------- 5. commit + sync
await chapter(5, 'Commit 1 ครั้ง แล้วกด Sync Changes', 'ส่งงานขึ้น GitHub');
await cap('ขั้นที่ 5 · commit', 'เปิดแท็บ Source Control (ไอคอนกิ่งไม้ หรือกด Ctrl + Shift + G)', 500);
console.log('dialog before scm:', await page.evaluate(() => document.querySelector('.monaco-dialog-box')?.innerText.replace(/\s+/g, ' ').slice(0, 200) ?? null));
await clickAt(scmIcon);
await sleep(1200);
if (!(await page.locator('.scm-editor').first().isVisible().catch(() => false))) { console.log('scm not visible after click, using Ctrl+Shift+G'); await page.keyboard.press('Control+Shift+G'); }
await page.locator('.scm-editor').first().waitFor({ timeout: 10000 });
await sleep(1200);
await page.keyboard.press('Control+J'); await sleep(400); // bring the terminal back for the checks below
const msgBox = page.locator('.scm-editor').first();
await cap('ขั้นที่ 5 · commit', 'วางข้อความ commit จากไฟล์ COMMIT-MESSAGE.txt ลงในช่อง Message', 400);
await ring(msgBox, 1800); await sleep(900);
await clickAt(msgBox); await sleep(500);
await page.keyboard.insertText(MSG5);
await sleep(2200);
const commitBtn = page.locator('.scm-view').getByRole('button', { name: /^Commit/ }).first();
await cap('ขั้นที่ 5 · commit', 'กด ✓ Commit', 300);
await ring(commitBtn, 1600); await sleep(900);
await clickAt(commitBtn, { dx: 40 });
await page.waitForSelector('.monaco-dialog-box', { timeout: 10000 });
await sleep(800);
await cap('ขั้นที่ 5 · commit', 'VS Code ถามว่าจะรวมทุกไฟล์ใน commit นี้ไหม → กด Yes', 600);
const yesBtn = page.locator('.monaco-dialog-box').getByRole('button', { name: 'Yes', exact: true });
await ring(yesBtn, 1600); await sleep(800);
await clickAt(yesBtn);
await page.locator('.scm-view .monaco-button', { hasText: 'Sync Changes' }).first().waitFor({ timeout: 20000 });
await sleep(1200);
await clickAt(page.locator('.terminal-wrapper .xterm, .xterm').first()); await sleep(300);
await cap('ขั้นที่ 5 · เช็กชื่อ', 'ก่อน push เช็กชื่อใน commit: ต้องเป็นชื่อและอีเมลของคุณ', 600);
await run('git log -1 --format="%an <%ae>"', { until: 'you@example.com', after: 3000 });
const syncBtn = page.locator('.scm-view .monaco-button', { hasText: 'Sync Changes' }).first();
await cap('ขั้นที่ 5 · push', 'กด Sync Changes เพื่อส่งขึ้น GitHub', 300);
await ring(syncBtn, 1800); await sleep(900);
await clickAt(syncBtn, { dx: 50 });
await page.waitForSelector('.monaco-dialog-box', { timeout: 10000 });
await sleep(800);
await cap('ขั้นที่ 5 · push', 'VS Code ยืนยันว่าจะ pull แล้ว push → กด OK', 600);
const okBtn = page.locator('.monaco-dialog-box').getByRole('button', { name: 'OK', exact: true });
await ring(okBtn, 1500); await sleep(800);
await clickAt(okBtn);
await page.waitForFunction(() => ![...document.querySelectorAll('.scm-view .monaco-button')].some((b) => /Sync Changes/.test(b.innerText)), null, { timeout: 30000 });
await sleep(1500);
await clickAt(page.locator('.terminal-wrapper .xterm, .xterm').first()); await sleep(300);
await cap('ขั้นที่ 5 · push', 'เช็กผล: git status ต้องขึ้นว่า up to date กับ origin/main', 500);
await run('git status', { until: 'working tree clean', after: 2800 });
await cap('ขั้นที่ 5 · push', 'commit ของคุณอยู่บนสุด ต่อจากชุด 1–4 แล้ว', 500);
await run('git log --oneline -3', { until: 'ชุดที่ 3', after: 4000 });

// ---------------------------------------------------------------- 6. tell the next person + outro
await chapter(6, 'บอกคนถัดไป', 'ชุด 5 คือคนสุดท้าย');
await ov('card', `<div class="kick">ขั้นที่ 6</div><h1>บอกเพื่อนในกลุ่ม</h1>
  <ul><li>ส่งข้อความว่า push แล้ว เช่น "ชุด 5 push แล้ว"</li>
  <li>คนถัดไปเริ่มที่ git pull ก่อนคัดลอกไฟล์ทุกครั้ง</li>
  <li>ชุด 5 คือคนสุดท้าย: ให้เจ้าของ repo ไปดูแท็บ Actions ว่าขึ้นเครื่องหมายถูกสีเขียว</li></ul>`);
await cap('ขั้นที่ 6 · บอกคนถัดไป', 'ส่งข้อความในกลุ่มว่า push แล้ว · ชุด 5 คือคนสุดท้าย ให้เจ้าของ repo ดูแท็บ Actions', 7000);
await ov('card', `<div class="kick">สรุป</div><h1>6 ขั้น คนละ 1 commit</h1>
  <ul><li>1 · ตั้งชื่อและอีเมลใน Git ให้ตรงกับ GitHub</li><li>2 · clone repo แล้ว git pull</li>
  <li>3 · คัดลอกของข้างใน files แล้วนับไฟล์ให้ครบ</li><li>4 · เขียน README ให้ครบทุกช่อง ✏️</li>
  <li>5 · Commit 1 ครั้ง เช็กชื่อ แล้วกด Sync Changes</li><li>6 · บอกคนถัดไป (ลำดับ 1 → 2 → 3 → 4 → 5)</li></ul>
  <div class="warn">ห้ามกด Force Push เด็ดขาด</div>
  <div class="sub" style="margin-top:12px">คำสั่งทั้งหมดอยู่ในคู่มือ VSCODE-GUIDE.pdf</div>`);
await cap('สรุป', 'ทำตาม 6 ขั้นนี้ทีละคน · ห้ามกด Force Push · ดูคำสั่งทั้งหมดในคู่มือ VSCODE-GUIDE.pdf', 9000);
mark('end');

} catch (e) {
  console.error('FAILED:', e.message.slice(0, 400));
  console.error('dialog:', await page.evaluate(() => document.querySelector('.monaco-dialog-box')?.innerText.replace(/\s+/g, ' ').slice(0, 200) ?? null).catch(() => '?'));
  await page.screenshot({ path: `${V}/fail.png` }).catch(() => {});
  capturing = false; await capLoop;
  fs.writeFileSync(`${V}/rec/timeline.json`, JSON.stringify({ failed: true, timeline, frames }, null, 1));
  await ctx.close(); await browser.close(); process.exit(1);
}
capturing = false; await capLoop;
await ctx.close();
await browser.close();
fs.writeFileSync(`${V}/rec/timeline.json`, JSON.stringify({ timeline, frames }, null, 1));
const span = frames[frames.length - 1].t - frames[0].t;
console.log('frames', frames.length, 'over', span.toFixed(1), 's =', (frames.length / span).toFixed(1), 'fps; script', now(), 's');
