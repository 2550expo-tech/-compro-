// Renders one 1920x160 caption band PNG per caption entry: band/NNN.png
import { chromium } from 'playwright';
import fs from 'node:fs';
const V = process.argv[2];
const caps = JSON.parse(fs.readFileSync(`${V}/band/caps.json`, 'utf8'));
const F = '/home/user/mindpay-books/fonts';
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: A; src: url(file://${F}/Anuphan_500Medium.ttf); font-weight: 500; }
@font-face { font-family: A; src: url(file://${F}/Anuphan_700Bold.ttf); font-weight: 700; }
html, body { margin: 0; background: #0B2019; }
#band { width: 1920px; height: 160px; box-sizing: border-box; display: flex; align-items: center; gap: 30px; padding: 0 56px;
  background: linear-gradient(180deg, #0F2D22 0%, #0A1D16 100%); border-top: 4px solid #C8992A; font-family: A, sans-serif; }
#head { width: 330px; flex: none; color: #E2B64A; font-weight: 700; font-size: 30px; line-height: 1.25; }
#bar { width: 3px; height: 96px; background: rgba(226,182,74,.45); flex: none; }
#text { flex: 1; color: #F3F0E4; font-weight: 500; font-size: 40px; line-height: 1.32; max-height: 106px; overflow: hidden; }
</style></head><body><div id="band"><div id="head"></div><div id="bar"></div><div id="text"></div></div></body></html>`;
fs.writeFileSync(`${V}/band/band.html`, html);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 160 } });
await page.goto(`file://${V}/band/band.html`);
await page.evaluate(() => document.fonts.ready);
for (const [i, c] of caps.entries()) {
  const size = await page.evaluate(([h, t]) => {
    document.getElementById('head').textContent = h;
    const el = document.getElementById('text'); el.textContent = t;
    let s = 40; el.style.fontSize = s + 'px';
    while (el.scrollHeight > 108 && s > 28) { s -= 1; el.style.fontSize = s + 'px'; }
    return s;
  }, [c.head, c.text]);
  await page.screenshot({ path: `${V}/band/${String(i).padStart(3, '0')}.png`, clip: { x: 0, y: 0, width: 1920, height: 160 } });
  if (size < 40) console.log(`caption ${i} shrunk to ${size}px`);
}
await browser.close();
console.log('bands', caps.length);
