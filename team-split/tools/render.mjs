import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';
const dir = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage();
for (const f of readdirSync(dir).filter((f) => f.endsWith('.html'))) {
  await page.goto('file://' + dir + '/' + f, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const label = f.replace('.html', '');
  await page.pdf({
    path: dir + '/' + label + '.pdf', format: 'A4', printBackground: true,
    displayHeaderFooter: true, headerTemplate: '<div></div>',
    footerTemplate: `<div style="width:100%;font-size:8px;color:#7a8a83;text-align:center;font-family:sans-serif">MindPay · ${label} · <span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
    margin: { top: '15mm', bottom: '17mm', left: '15mm', right: '15mm' },
  });
  console.log('pdf', label);
}
await browser.close();
