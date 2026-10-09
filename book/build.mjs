// Builds the MindPay FR study books: HTML (cover + TOC + Part A + Part B) -> PDF with Chromium.
// Usage: node build.mjs [fr1 fr2 ...]   (default: all)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const REPO = '/home/user/2550expo-tech/socrates-and-skeletons-';
const require = createRequire(REPO + '/package.json');
const { chromium } = require('playwright');
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'out');
fs.mkdirSync(OUT, { recursive: true });

const BOOKS = {
  fr1: { code: 'FR-1', title: 'Transaction Management', thai: 'จดรายการ เพิ่ม แก้ จัดหมวด ลบ', file: 'MindPay-FR1-Transaction-Management' },
  fr2: { code: 'FR-2', title: 'Overview Dashboard', thai: 'หน้าหลัก ภาพรวมรายรับ รายจ่าย ยอดคงเหลือ', file: 'MindPay-FR2-Overview-Dashboard' },
  fr3: { code: 'FR-3', title: 'Voice Entry', thai: 'พูดจด "ข้าว 50 บาท" แล้วบันทึกให้', file: 'MindPay-FR3-Voice-Entry' },
  fr4: { code: 'FR-4', title: 'Automatic Slip Detection', thai: 'สแกนสลิปในแกลเลอรีอัตโนมัติด้วย AI', file: 'MindPay-FR4-Slip-Detection' },
  fr5: { code: 'FR-5', title: 'AI Coach น้องกล้า', thai: 'โค้ชการเงิน AI ที่พูดได้', file: 'MindPay-FR5-AI-Coach' },
  fr6: { code: 'FR-6', title: 'Money Runway', thai: 'เงินพอถึงวันไหน', file: 'MindPay-FR6-Money-Runway' },
};

// ---------------------------------------------------------------- highlighter
const KW = new Set('import export from default function return const let var if else for of in while do switch case break continue new class extends interface type enum async await try catch finally throw typeof instanceof void null undefined true false this as keyof readonly public private static implements yield'.split(' '));
const SQLKW = new Set('create table if not exists primary key references on delete cascade default null check in and or is alter enable row level security drop policy for select using with update insert into values all index unique where function returns trigger language as begin end return new before after each execute procedure set revoke grant from to declare into perform count now interval boolean integer text bigint uuid timestamptz numeric date boolean security definer replace conflict do nothing bigserial coalesce public'.split(' '));
const YKW = new Set('name on push branches paths-ignore jobs runs-on steps uses with run env if permissions concurrency group cancel-in-progress timeout-minutes working-directory id workflow_dispatch contents'.split(' '));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function tokenize(src, lang) {
  let re;
  if (lang === 'sql') re = /(--[^\n]*)|('(?:''|[^'])*')|(\b\d+\b)|([A-Za-z_][\w]*)/g;
  else if (lang === 'yaml' || lang === 'sh') re = /((?:^|\s)#[^\n]*)|('(?:[^'\n])*'|"(?:\\.|[^"\\\n])*")|(\b\d+\b)|([A-Za-z_][\w-]*)/g;
  else re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|(\b\d[\d_]*(?:\.\d+)?n?\b)|([A-Za-z_$][\w$]*)/g;
  const out = [];
  let last = 0, m;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(['', src.slice(last, m.index)]);
    if (m[1]) out.push(['c-com', m[1]]);
    else if (m[2]) out.push(['c-str', m[2]]);
    else if (m[3]) out.push(['c-num', m[3]]);
    else {
      const w = m[4];
      let cls = '';
      if (lang === 'sql') cls = SQLKW.has(w.toLowerCase()) ? 'c-kw' : '';
      else if (lang === 'yaml') cls = YKW.has(w) ? 'c-kw' : '';
      else if (lang === 'sh') cls = /^(npm|npx|git|node|cp|cd|eas|expo|gh)$/.test(w) ? 'c-kw' : '';
      else if (KW.has(w)) cls = 'c-kw';
      else if (/^[A-Z]/.test(w)) cls = 'c-ty';
      else if (src[re.lastIndex] === '(') cls = 'c-fn';
      out.push([cls, w]);
    }
    last = re.lastIndex;
  }
  if (last < src.length) out.push(['', src.slice(last)]);
  return out;
}

function highlightLines(src, lang) {
  const lines = [''];
  for (const [cls, text] of tokenize(src, lang)) {
    const parts = text.split('\n');
    parts.forEach((p, i) => {
      if (i > 0) lines.push('');
      if (p) lines[lines.length - 1] += cls ? `<span class="${cls}">${esc(p)}</span>` : esc(p);
    });
  }
  return lines;
}

function langOf(file) {
  if (file.endsWith('.sql')) return 'sql';
  if (file.endsWith('.yml') || file.endsWith('.yaml')) return 'yaml';
  if (file.endsWith('.sh') || file.endsWith('.example') || file === '.gitignore') return 'sh';
  return 'ts';
}

/** <x-code src="file" lines="a-b" hl="3,5-6" title="..."></x-code> -> real code with line numbers. */
function codeBlock(attrs) {
  const file = attrs.src;
  const all = fs.readFileSync(path.join(REPO, file), 'utf8').replace(/\r/g, '').split('\n');
  let [a, b] = (attrs.lines ?? `1-${all.length}`).split('-').map(Number);
  if (!b) b = a;
  if (a < 1 || b > all.length || a > b) throw new Error(`bad range ${file} ${attrs.lines} (file has ${all.length})`);
  const hl = new Set();
  for (const part of (attrs.hl ?? '').split(',').filter(Boolean)) {
    const [x, y] = part.split('-').map(Number);
    for (let i = x; i <= (y || x); i++) hl.add(i);
  }
  const html = highlightLines(all.slice(a - 1, b).join('\n'), langOf(file));
  const body = html.map((l, i) => `<span class="l${hl.has(a + i) ? ' hl' : ''}"><span class="ln">${a + i}</span>${l || ' '}</span>`).join('');
  return `<div class="code"><div class="file"><a href="${vscodeUrl(file, a, b)}"><b>${esc(file)}</b></a><span>${attrs.title ? esc(attrs.title) + ' · ' : ''}บรรทัด ${a}–${b}</span></div><pre>${body}</pre><div class="open"><a href="${vscodeUrl(file, a, b)}">▶ เปิดใน VS Code (เว็บ)</a><a href="${githubUrl(file, a, b)}">GitHub</a><span>VS Code ในเครื่อง: Ctrl+P → <b>${esc(file)}:${a}</b></span></div></div>`;
}

// Links pinned to the commit the book was written from, so line numbers always match.
const SHA = '646b485d843ae3d68bdba8c31fce6041993e3ccc';
const encPath = (f) => f.split('/').map(encodeURIComponent).join('/');
function vscodeUrl(file, a, b) {
  return `https://vscode.dev/github/2550expo-tech/Socrates-and-Skeletons-/blob/${SHA}/${encPath(file)}${a ? `#L${a}${b && b !== a ? `-L${b}` : ''}` : ''}`;
}
function githubUrl(file, a, b) {
  return `https://github.com/2550expo-tech/Socrates-and-Skeletons-/blob/${SHA}/${encPath(file)}${a ? `#L${a}${b && b !== a ? `-L${b}` : ''}` : ''}`;
}
/** <code>src/domain/runway.ts</code> or <code>src/domain/runway.ts:72</code> in prose -> link to that file in VS Code. */
function linkPaths(html) {
  return html.replace(/<code>((?:src|supabase|e2e|scripts|docs|\.github|assets)\/[^<\s:]+?\.(?:tsx?|mjs|sql|md|yml|py|json|png))(?::(\d+)(?:-(\d+))?)?<\/code>/g, (m, f, a, b) => {
    if (!fs.existsSync(path.join(REPO, f))) {
      console.warn('  missing file in text:', f);
      return m;
    }
    return `<a class="fl" href="${vscodeUrl(f, a && Number(a), b && Number(b))}"><code>${f}${a ? `:${a}${b ? `-${b}` : ''}` : ''}</code></a>`;
  });
}

/** <x-snip lang="ts" title="...">code</x-snip>: a short example that is not from the repo. */
function snipBlock(attrs, inner) {
  const src = inner.replace(/^\n/, '').replace(/\n\s*$/, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const html = highlightLines(src, attrs.lang ?? 'ts');
  const body = html.map((l, i) => `<span class="l"><span class="ln">${i + 1}</span>${l || ' '}</span>`).join('');
  return `<div class="code"><div class="file"><b>${esc(attrs.title ?? 'ตัวอย่าง')}</b><span>${attrs.note ? esc(attrs.note) : 'ตัวอย่างประกอบ (ไม่ใช่ไฟล์ในโปรเจกต์)'}</span></div><pre>${body}</pre></div>`;
}

const parseAttrs = (s) => Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));

const BOX_ICON = { note: 'ℹ︎', tip: '★', warn: '!', analogy: '≈', say: '“' };
/** Warn when a walk table right after a code block mentions lines outside that block. */
function checkWalks(html, where) {
  const re = /<x-code([^>]*)><\/x-code>\s*(?:<[^t][^>]*>[\s\S]*?)?<table class="walk">([\s\S]*?)<\/table>/g;
  for (const m of html.matchAll(/<x-code([^>]*)><\/x-code>([\s\S]*?)(?=<x-code|$)/g)) {
    const at = parseAttrs(m[1]);
    const walk = m[2].match(/<table class="walk">([\s\S]*?)<\/table>/);
    if (!walk || m[2].indexOf('<table class="walk">') > 400) continue;
    const [a, b] = (at.lines ?? '1-99999').split('-').map(Number);
    for (const c of walk[1].matchAll(/<tr><td>([\d–\-, ]+)<\/td>/g)) {
      for (const n of c[1].split(/[–\-, ]+/).filter(Boolean).map(Number)) {
        if (n < a || n > (b || a)) console.warn(`  walk line ${n} outside ${at.src} ${at.lines} (${where})`);
      }
    }
  }
}

function expand(html, state) {
  checkWalks(html, state.where ?? '');
  html = linkPaths(html);
  html = html.replace(/<x-code([^>]*)><\/x-code>/g, (_, a) => codeBlock(parseAttrs(a)));
  html = html.replace(/<x-snip([^>]*)>([\s\S]*?)<\/x-snip>/g, (_, a, inner) => snipBlock(parseAttrs(a), inner));
  html = html.replace(/<x-box([^>]*)>/g, (_, a) => {
    const at = parseAttrs(a);
    return `<div class="box ${at.kind ?? 'note'}">${at.title ? `<div class="bt"><span>${BOX_ICON[at.kind ?? 'note'] ?? ''}</span>${at.title}</div>` : ''}`;
  }).replace(/<\/x-box>/g, '</div>');
  html = html.replace(/<x-fig([^>]*)><\/x-fig>/g, (_, a) => {
    const at = parseAttrs(a);
    return `<figure><img class="phone" src="${at.src}">${at.cap ? `<figcaption>${at.cap}</figcaption>` : ''}</figure>`;
  });
  html = html.replace(/<x-ch([^>]*)>/g, (_, a) => {
    const at = parseAttrs(a);
    state.n += 1;
    const num = state.prefix ? `${state.prefix}${state.n}` : `${state.n}`;
    return `<section class="ch"><div class="ch-head"><div class="num">บทที่ ${num}</div><h1 class="t">${at.title}</h1>${at.lead ? `<p class="lead">${at.lead}</p>` : ''}</div>`;
  }).replace(/<\/x-ch>/g, '</section>');
  return html;
}

// ---------------------------------------------------------------- assemble
function partPage(no, title, text) {
  return `<div class="part" data-part="${title}"><div class="bar"></div><div class="pno">${no}</div><h1>${title}</h1>${text}</div>`;
}

function readParts(dir) {
  return fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith('.html')).sort().map((f) => fs.readFileSync(path.join(ROOT, dir, f), 'utf8'));
}

function bookHtml(key, pages) {
  const b = BOOKS[key];
  const css = `<link rel="stylesheet" href="style.css">`;
  const stateA = { n: 0, prefix: 'A' };
  const stateB = { n: 0, prefix: '' };
  const partA = readParts('partA').map((h, i) => expand(h, Object.assign(stateA, { where: 'partA#' + (i + 1) }))).join('\n');
  const dirB = path.join(ROOT, 'fr', key);
  const partB = (fs.existsSync(dirB) ? readParts(path.join('fr', key)) : [fs.readFileSync(path.join(ROOT, 'fr', `${key}.html`), 'utf8')])
    .map((h, i) => expand(h, Object.assign(stateB, { where: `${key}#${i + 1}` })))
    .join('\n');
  const howto = expand(fs.readFileSync(path.join(ROOT, 'howto.html'), 'utf8').replaceAll('{{FR}}', `${b.code} ${b.title}`).replaceAll('{{FRCODE}}', b.code), { n: 0 });

  let body = `
${howto}
<div class="toc" id="toc"><h1>สารบัญ</h1>@@TOC@@</div>
${partPage('ภาค ก', 'พื้นฐานทั้งระบบ MindPay', `<p>สอนตั้งแต่ศูนย์ สำหรับคนที่ไม่เคยเขียนโค้ด ภาคนี้เหมือนกันทุกเล่ม เพราะไม่ว่าจะรับผิดชอบ FR ไหน ทุกคนต้องเข้าใจว่าแอปทั้งตัวสร้างด้วยอะไร ทำงานที่ไหน และชิ้นส่วนต่าง ๆ คุยกันยังไง</p><ul><li>เครื่องมือ ภาษา TypeScript และ React ตั้งแต่พื้นฐาน</li><li>โค้ดชุดเดียวกลายเป็นทั้งเว็บและแอป Android ได้ยังไง</li><li>เซิร์ฟเวอร์ Supabase ฐานข้อมูล และความปลอดภัย</li><li>การเชื่อม AI, การออกแบบ UX/UI, การทดสอบ และ GitHub</li></ul>`)}
${partA}
${partPage('ภาค ข', `${b.code} ${b.title}`, `<p>${b.thai} ภาคนี้เขียนในมุมของคนที่สร้าง ${b.code} เอง ตั้งแต่ปัญหาที่อยากแก้ หน้าจอ หลักการคำนวณ โค้ดจริงทีละบรรทัด การทดสอบ ไปจนถึงคำถามที่อาจารย์น่าจะถาม</p>`)}
${partB}
`;
  // Headings: ids + invisible markers for the page-number pass.
  const toc = [];
  let k = 0;
  body = body.replace(/<div class="part" data-part="([^"]*)">/g, (m, t) => {
    const id = `h${++k}`;
    toc.push({ id, level: 0, text: t });
    return `<div class="part" id="${id}"><span class="mk">QQ${id}QQ</span>`;
  });
  // Order matters: parts come in document order, so re-sort by position after collecting h1/h2.
  body = body.replace(/<h1 class="t">([\s\S]*?)<\/h1>|<h2>([\s\S]*?)<\/h2>/g, (m, h1, h2) => {
    const id = `h${++k}`;
    const text = (h1 ?? h2).replace(/<[^>]+>/g, '');
    toc.push({ id, level: h1 ? 1 : 2, text });
    return h1 ? `<h1 class="t" id="${id}"><span class="mk">QQ${id}QQ</span>${h1}</h1>` : `<h2 id="${id}"><span class="mk">QQ${id}QQ</span>${h2}</h2>`;
  });
  toc.sort((x, y) => body.indexOf(`QQ${x.id}QQ`) - body.indexOf(`QQ${y.id}QQ`));
  const tocHtml = toc
    .map((t) => `<div class="row l${t.level}"><span>${t.text}</span><span class="dots"></span><span class="pg">${pages?.[t.id] ?? '00'}</span></div>`)
    .join('');
  body = body.replace('@@TOC@@', tocHtml);
  return { html: `<!doctype html><html lang="th"><head><meta charset="utf-8">${css}</head><body>${body}</body></html>`, toc };
}

function coverHtml(key) {
  const b = BOOKS[key];
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><link rel="stylesheet" href="style.css"></head><body>
<div class="cover">
  <div class="top">MindPay · กลุ่ม 13 Socrates and Skeletons</div>
  <div class="fr">${b.code}</div>
  <h1>${b.title}</h1>
  <div class="sub">${b.thai}<br>เข้าใจระบบทั้งหมดตั้งแต่ศูนย์ จนอธิบายโค้ดและตอบคำถามอาจารย์ได้ เหมือนเป็นคนสร้างระบบนี้เอง</div>
  <div class="badges"><span>ภาค ก · พื้นฐานทั้งระบบ (สำหรับคนไม่เคยเขียนโค้ด)</span><span>ภาค ข · ${b.code} ละเอียดทุกส่วน</span><span>โค้ดจริงพร้อมคำอธิบายทีละบรรทัด</span></div>
  <img class="kla" src="img/kla.png">
  <div class="foot"><span>Introduction to Software Engineering (15031001)</span><span>ฉบับ 9 ตุลาคม 2569</span></div>
</div></body></html>`;
}

const FOOT = (b) => `<div style="font-family:Anuphan,sans-serif;font-size:7.5pt;color:#8A9A91;width:100%;padding:0 15mm;display:flex;justify-content:space-between;-webkit-print-color-adjust:exact"><span>MindPay · ${b.code} ${b.title}</span><span><span class="pageNumber"></span></span></div>`;

async function render(browser, html, file, footer) {
  const tmp = path.join(ROOT, `.tmp-${path.basename(file)}.html`);
  fs.writeFileSync(tmp, html);
  const page = await browser.newPage();
  await page.goto('file://' + tmp, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: file,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: !!footer,
    headerTemplate: '<span></span>',
    footerTemplate: footer ?? '<span></span>',
  });
  await page.close();
  fs.rmSync(tmp);
}

function pageNumbers(pdf, toc) {
  const text = execFileSync('pdftotext', [pdf, '-'], { maxBuffer: 1 << 28 }).toString();
  const pages = text.split('\f');
  const found = {};
  pages.forEach((p, i) => {
    for (const m of p.matchAll(/QQ(h\d+)QQ/g)) if (!(m[1] in found)) found[m[1]] = i + 1;
  });
  const missing = toc.filter((t) => !(t.id in found));
  if (missing.length) console.warn('  markers not found:', missing.map((m) => m.text).slice(0, 5));
  return found;
}

const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(BOOKS);
const browser = await chromium.launch();
for (const key of keys) {
  const b = BOOKS[key];
  console.log('building', key);
  const coverPdf = path.join(OUT, `.cover-${key}.pdf`);
  const bodyPdf = path.join(OUT, `.body-${key}.pdf`);
  await render(browser, coverHtml(key), coverPdf, null);
  const first = bookHtml(key, null);
  await render(browser, first.html, bodyPdf, FOOT(b));
  const pages = pageNumbers(bodyPdf, first.toc);
  // Page numbers in the footer count from the first page after the cover.
  const second = bookHtml(key, pages);
  await render(browser, second.html, bodyPdf, FOOT(b));
  const check = pageNumbers(bodyPdf, second.toc);
  const moved = second.toc.filter((t) => check[t.id] !== pages[t.id]);
  if (moved.length) console.warn('  page numbers moved for', moved.length, 'headings');
  const final = path.join(OUT, `${b.file}.pdf`);
  execFileSync('python3', ['-c', `
import sys
from pypdf import PdfWriter, PdfReader
w = PdfWriter()
for f in sys.argv[1:3]:
    for p in PdfReader(f).pages: w.add_page(p)
w.add_metadata({'/Title': sys.argv[4], '/Author': 'MindPay · Socrates and Skeletons'})
w.write(sys.argv[3])
`, coverPdf, bodyPdf, final, `MindPay ${b.code} ${b.title}`]);
  const n = execFileSync('pdfinfo', [final]).toString().match(/Pages:\s+(\d+)/)[1];
  console.log(`  -> ${final} (${n} pages)`);
}
await browser.close();
