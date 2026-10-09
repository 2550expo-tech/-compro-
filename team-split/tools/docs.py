"""Write the Thai instruction pages (HTML) and COMMIT-MESSAGES.txt for each package."""
import html, json, os
from plan import PARTS, lines

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
DOCS = os.path.join(OUT, 'docs')
FONTS = '/home/user/mindpay-books/fonts'
m = json.load(open(os.path.join(OUT, 'manifest.json')))
OLD = m['old_repo']
E = html.escape

SHORT = {1: 'FR-1 + FR-2', 2: 'FR-3 พูดจด', 3: 'FR-4 สแกนสลิป', 4: 'FR-5 โค้ชน้องกล้า', 5: 'FR-6 Money Runway'}
BOOKS = {1: 'MindPay-FR1-Transaction-Management.pdf และ MindPay-FR2-Overview-Dashboard.pdf',
         2: 'MindPay-FR3-Voice-Entry.pdf', 3: 'MindPay-FR4-Slip-Detection.pdf',
         4: 'MindPay-FR5-AI-Coach.pdf', 5: 'MindPay-FR6-Money-Runway.pdf'}

CSS = f"""
@font-face {{ font-family: Anuphan; src: url(file://{FONTS}/Anuphan_400Regular.ttf); font-weight: 400; }}
@font-face {{ font-family: Anuphan; src: url(file://{FONTS}/Anuphan_500Medium.ttf); font-weight: 500; }}
@font-face {{ font-family: Anuphan; src: url(file://{FONTS}/Anuphan_600SemiBold.ttf); font-weight: 600; }}
@font-face {{ font-family: Anuphan; src: url(file://{FONTS}/Anuphan_700Bold.ttf); font-weight: 700; }}
@font-face {{ font-family: Mono; src: url(file://{FONTS}/DejaVuSansMono.ttf); }}
@page {{ size: A4; margin: 15mm 15mm 17mm; }}
* {{ box-sizing: border-box; }}
body {{ font-family: Anuphan, sans-serif; font-size: 11pt; line-height: 1.62; color: #17251f; margin: 0; }}
.band {{ background: #0E3B2C; color: #F3F0E4; border-radius: 14px; padding: 16px 20px 14px; margin-bottom: 14px; }}
.band .kicker {{ color: #E2B64A; font-weight: 600; letter-spacing: 1px; font-size: 9.5pt; }}
.band h1 {{ margin: 2px 0 2px; font-size: 21pt; line-height: 1.3; font-weight: 700; }}
.band .sub {{ color: #C9DCD2; font-size: 10.5pt; }}
h2 {{ font-size: 14.5pt; color: #0E3B2C; margin: 18px 0 6px; padding-bottom: 3px; border-bottom: 2px solid #E2B64A; break-after: avoid; }}
h3 {{ font-size: 12pt; color: #135A40; margin: 12px 0 4px; break-after: avoid; }}
p {{ margin: 4px 0 6px; }}
.box {{ border-radius: 10px; padding: 9px 14px; margin: 8px 0; break-inside: avoid; }}
.sum {{ background: #EEF6F1; border: 1px solid #BFDCCB; }}
.warn {{ background: #FFF5E0; border: 1px solid #E8C77A; }}
.stop {{ background: #FDECEC; border: 1px solid #EDB4B4; }}
.box ul, .box ol {{ margin: 2px 0; padding-left: 20px; }}
ol.steps {{ padding-left: 22px; margin: 4px 0; }}
ol.steps > li {{ margin: 3px 0; padding-left: 2px; }}
.btn {{ display: inline-block; padding: 0 7px; border: 1px solid #B9C6C0; border-bottom-width: 2px; border-radius: 6px; background: #F6F8F7; font-weight: 600; font-size: 9.8pt; line-height: 1.5; white-space: nowrap; }}
code, .mono {{ font-family: Mono, monospace; font-size: 8.9pt; background: #F1F4F2; padding: 0 4px; border-radius: 4px; white-space: nowrap; }}
.msg {{ display: inline-block; max-width: 100%; background: #FFF8E6; border: 1px dashed #C8992A; border-radius: 7px; padding: 2px 8px; font-weight: 500; line-height: 1.5; }}
td.nw {{ white-space: nowrap; }}
.small {{ font-size: 8.6pt; color: #5A6B63; line-height: 1.45; }}
table {{ border-collapse: collapse; width: 100%; margin: 6px 0; font-size: 10pt; }}
th {{ text-align: left; background: #0E3B2C; color: #F3F0E4; font-weight: 600; padding: 5px 8px; }}
td {{ border-bottom: 1px solid #DCE4E0; padding: 5px 8px; vertical-align: top; }}
tr {{ break-inside: avoid; }}
td.num, th.num {{ text-align: right; white-space: nowrap; }}
.files {{ columns: 2; column-gap: 18px; font-family: Mono, monospace; font-size: 7.9pt; line-height: 1.5; margin: 2px 0 8px; }}
.files div {{ break-inside: avoid; }}
.muted {{ color: #5A6B63; font-size: 9.5pt; }}
.pb {{ break-before: page; }}
"""

def page(title, kicker, h1, sub, body):
    return f"""<!doctype html><html lang="th"><head><meta charset="utf-8"><title>{E(title)}</title>
<style>{CSS}</style></head><body>
<div class="band"><div class="kicker">{E(kicker)}</div><h1>{h1}</h1><div class="sub">{sub}</div></div>
{body}</body></html>"""

def btn(t): return f'<span class="btn">{E(t)}</span>'
def c(t): return f'<code>{E(t)}</code>'

def part_lines(pid):
    return sum((lines(f) or 0) for _, lst in PARTS[pid]['commits'] for f in lst if f != 'package-lock.json')

def nfiles(p): return sum(len(cm['files']) for cm in p['commits'])

def pr_body(p):
    n = p['n']
    lines_ = [f"งานชุดที่ {n} ของ MindPay: {p['title']}",
              '',
              f"- commit 1–4: ย้ายโค้ดจาก repo เดิม {OLD} (commit {m['commit']})"]
    if n == 5:
        lines_.append('  ไม่ได้แก้เนื้อโค้ดของแอป ยกเว้น 4 ไฟล์: .github/workflows/web.yml, .github/workflows/e2e-webkit.yml และ e2e/fake-backend.mjs ให้เว็บใช้ชื่อ repo ใหม่อัตโนมัติ และ README.md เพิ่มที่มาของ repo กับตารางงานของแต่ละคน')
        lines_.append('- ชุดนี้มีไฟล์ที่สั่งให้ GitHub build เว็บและแอป จึงต้องรวมหลังชุด 1–4')
    else:
        lines_.append('  ไม่ได้แก้เนื้อโค้ด')
    lines_.append('- commit 5: README ของ FR ที่เขียนเอง')
    lines_.append(f'- ไฟล์ทั้งหมด {nfiles(p)} ไฟล์')
    return '\n'.join(lines_)

def commit_messages_txt(p):
    out = [f"MindPay ชุดที่ {p['n']} · {p['title']}", f"branch: {p['branch']}", '',
           'คัดลอกข้อความจากไฟล์นี้ไปวางในช่อง commit message ของแต่ละรอบ', '']
    for cm in p['commits']:
        where = 'ลากของข้างในโฟลเดอร์ commit-%d' % cm['n']
        if cm.get('write_yourself'):
            where += ' (หลังเขียน README เสร็จ)'
        out += [f"รอบ {cm['n']} · {where} · {len(cm['files'])} ไฟล์", cm['message'], '']
    out += ['ชื่อ Pull Request:', p['pr'], '', 'รายละเอียด Pull Request:', pr_body(p), '']
    return '﻿' + '\r\n'.join(out)

# ---------------------------------------------------------------- TEAM-PLAN
def team_plan():
    rows = ''.join(
        f"<tr><td class='num'>{p['n']}</td><td>{E(p['title'])}</td><td>{c(p['branch'])}</td>"
        f"<td class='num'>{nfiles(p)}</td><td class='num'>{part_lines(p['id']):,}</td><td class='num'>5</td></tr>"
        for p in m['parts'])
    ideas = [
        ('FR-1', 'ล้างข้อความเตือนของช่องเงินทันทีที่พิมพ์ถูก (' + c('src/app/transaction.tsx') + ' บรรทัด 241) · ให้ช่องเงินรับเลขไทย ๐–๙ (' + c('src/ui/inputs.tsx') + ' บรรทัด 189) · การ์ด "ค่าหอ อีก 2 วัน" จากรายการประจำ (ตรรกะกับเทสต์มีแล้วใน ' + c('recurring.ts') + ')'),
        ('FR-2', 'แถบหมวดแสดงแค่ 5 หมวด เพิ่มแถว "อื่น ๆ" · สรุปเดือนขึ้น "เดือนแรกของการจด" ผิดเมื่อเดือนก่อนมีข้อมูลแค่ปลายเดือน'),
        ('FR-3', 'เตือนเมื่อรายการไม่มีราคา เช่น "ขนม ยังไม่มีราคา" · ให้ "7 11 ขนม 45" อ่านเป็นเซเว่น ไม่ใช่ ฿7 กับ ฿11'),
        ('FR-4', 'ใช้ค่า ' + c('crcValid') + ' ของ QR: ถ้า CRC ไม่ถูก ไม่ใช้เลขอ้างอิงจาก QR พร้อมเทสต์ · "ร้านรองเท้า" ไม่ควรได้หมวดอาหาร'),
        ('FR-5', 'บั๊ก 2 จุดที่เจอระหว่างทำหนังสือ: การ์ดงบขึ้นเครื่องหมายถูกสีเขียวทั้งที่เกินงบ (' + c('src/domain/insights.ts') + ' บรรทัด 127) · กรอบ "กำลังพูด" ค้างเมื่อถามใหม่ระหว่างน้องกล้ายังพูด (' + c('src/app/(tabs)/coach.tsx') + ' บรรทัด 118)'),
        ('FR-6', 'หักบิลประจำที่จะครบกำหนดออกจาก Runway · นับรายรับที่คาดว่าจะเข้า เช่น ค่าขนมทุกวันที่ 1'),
    ]
    idea_rows = ''.join(f'<tr><td class="nw"><b>{k}</b></td><td>{v}</td></tr>' for k, v in ideas)
    body = f"""
<div class="box sum"><b>สรุปในย่อหน้าเดียว</b><br>
โค้ดของแอป 174 ไฟล์ (จาก repo เดิม commit {c(m['commit'])}) ถูกแบ่งเป็น 5 ชุดตาม FR ทุกไฟล์อยู่ในชุดเดียว ไม่มีไฟล์ซ้ำ
ทุกคนจึงทำพร้อมกันได้โดยไม่ชนกัน (ไม่เกิด conflict) แต่ละคนอัปโหลดของตัวเอง 5 รอบ ได้ 5 commit เท่ากัน
แล้วเปิด Pull Request คนละ 1 อัน เจ้าของ repo รวมชุด 1–4 ก่อน แล้วรวมชุด 5 เป็นชุดสุดท้าย</div>

<h2>1 · ใครทำชุดไหน</h2>
<table><tr><th class="num">ชุด</th><th>งาน</th><th>branch</th><th class="num">ไฟล์</th><th class="num">บรรทัดโค้ด</th><th class="num">commit</th></tr>{rows}</table>
<p class="muted">โค้ดส่วนกลางที่ไม่ใช่ของ FR ไหน เช่น ระบบสมัครสมาชิก ธีม ชุดทดสอบ และไฟล์ตั้งค่า ถูกกระจายให้ชุดที่โค้ด FR น้อย ทุกคนจึงได้งานใกล้เคียงกัน
· บรรทัดโค้ดไม่นับ {c('package-lock.json')} ที่เครื่องสร้างเอง · จำนวนไฟล์รวม README ที่เขียนเอง</p>

<h2>2 · ตรวจแล้วก่อนส่ง</h2>
<ul>
<li>รวมทั้ง 5 ชุดกลับได้ไฟล์ครบ 174 ไฟล์ ตรงกับ repo เดิม (บวก README ในโฟลเดอร์ {c('fr/')} อีก 6 ไฟล์)</li>
<li>ตรวจชนิดข้อมูล (typecheck) ผ่าน · เทสต์ 157/157 ผ่าน · ทดสอบในเบราว์เซอร์ 145/145 ผ่าน โดยสมมติว่า repo ชื่ออื่น</li>
<li>จำลองให้ 5 คนเปิด Pull Request แล้วรวมแบบ Rebase and merge: ไม่มี conflict และแต่ละคนได้ 5 commit พอดี</li>
</ul>

<h2>3 · กติกาของทีม</h2>
<ol class="steps">
<li>อัปโหลดด้วยบัญชี GitHub <b>ของตัวเอง</b> ห้ามฝากเพื่อนอัปโหลดแทน เพราะ GitHub นับ commit ให้คนที่กด</li>
<li>ทำงานใน branch ของตัวเอง แล้วเปิด Pull Request ห้าม commit เข้า {c('main')} ตรง ๆ</li>
<li>ห้ามแก้ไฟล์ในโฟลเดอร์ {c('commit-1')} ถึง {c('commit-4')} และห้ามแตะไฟล์ของชุดอื่น จนกว่าทุกชุดจะรวมเสร็จ</li>
<li>ห้ามอัปโหลด {c('.env')} และ {c('node_modules')} (ไม่มีใน zip อยู่แล้ว)</li>
<li>รวมชุด 1–4 ก่อน ลำดับไหนก็ได้ แล้วรวมชุด 5 เป็นชุดสุดท้าย</li>
<li>รวมด้วยปุ่ม {btn('Rebase and merge')} เท่านั้น ถ้าใช้ Squash ทั้ง 5 commit จะถูกรวมเหลือ 1</li>
</ol>

<h2 class="pb">4 · สำหรับเจ้าของ repo</h2>
<h3>4.1 ทำก่อนเพื่อนเริ่ม</h3>
<ol class="steps">
<li><b>ตรวจ main:</b> ควรมีแค่ README (หรือ {c('.gitignore')} / LICENSE ที่ GitHub สร้างให้) ถ้า repo ยังว่างเปล่า ให้สร้าง README ก่อน 1 ไฟล์ เพราะถ้ายังไม่มี {c('main')} จะเปิด Pull Request ไม่ได้ ถ้ามีไฟล์อื่นอยู่แล้ว บอกคนที่ส่ง zip ก่อนเริ่ม</li>
<li><b>ให้รวมได้แบบเดียว:</b> {btn('Settings')} → {btn('General')} → หัวข้อ Pull Requests → ติ๊กไว้แค่ {btn('Allow rebase merging')} แล้วเอาติ๊ก {btn('Allow merge commits')} กับ {btn('Allow squash merging')} ออก</li>
<li><b>ล็อก main:</b> {btn('Settings')} → {btn('Branches')} → {btn('Add classic branch protection rule')} → Branch name pattern ใส่ {c('main')} → ติ๊ก {btn('Require a pull request before merging')} และ {btn('Require approvals')} = 1 → {btn('Create')}<br>
<span class="muted">ถ้า repo เป็น private ต้องใช้บัญชี GitHub Pro (นักศึกษาขอฟรีได้ที่ GitHub Education) ถ้ายังไม่มี ให้ทุกคนทำตามกติกาข้อ 2 เอง</span></li>
</ol>
<h3>4.2 ตอนรวมงาน</h3>
<ol class="steps">
<li>เปิด Pull Request ของเพื่อน → ตรวจว่ามีคนกด Approve แล้ว และแท็บ {btn('Commits')} มี 5 commit</li>
<li>กด {btn('Rebase and merge')} → {btn('Confirm rebase and merge')}</li>
<li>รวมชุด 1, 2, 3, 4 ก่อน (ลำดับไหนก็ได้) แล้วค่อยรวมชุด 5</li>
</ol>
<div class="box warn">ระหว่างรวมชุด 1–4 แอปยังไม่ครบ เป็นเรื่องปกติ ไฟล์ที่สั่งให้ GitHub build เว็บและแอปอยู่ในชุด 5 ระบบจึงยังไม่ทำงานจนกว่าชุด 5 จะเข้า</div>
<h3>4.3 หลังรวมชุด 5</h3>
<ol class="steps">
<li>แท็บ {btn('Actions')} จะรัน 4 งาน: Deploy web app, Build Android APK, Browser tests on Safari engine และ Update installed apps
สามงานแรกควรขึ้นถูกสีเขียว (รวมกันราว 20–30 นาที) งานที่ 4 จะข้ามตัวเอง เพราะ repo ใหม่ไม่มีรหัส {c('EXPO_TOKEN')} ซึ่งปกติ</li>
<li><b>เปิดเว็บของ repo ใหม่:</b> {btn('Settings')} → {btn('Pages')} → Source: {btn('Deploy from a branch')} → Branch: {btn('gh-pages')} กับ {btn('/ (root)')} → {btn('Save')} รอ 1–2 นาที เว็บจะอยู่ที่ {c('https://<ชื่อบัญชีเจ้าของ>.github.io/<ชื่อ repo>/')}</li>
<li><b>ไม่บังคับ:</b> ตอนสมัครบัญชีบนเว็บใหม่ ลิงก์ยืนยันในอีเมลจะพาไปเว็บเดิม จนกว่าเจ้าของโปรเจกต์ Supabase จะเพิ่มลิงก์เว็บใหม่ที่ลงท้ายด้วย {c('/**')} ใน Supabase → Authentication → URL Configuration → Redirect URLs</li>
</ol>

<h2>5 · ตรวจว่าเสร็จ</h2>
<ul>
<li>{btn('Insights')} → {btn('Contributors')}: ทุกคนมี 5 commit (เจ้าของ repo มีเพิ่ม 1 จากตอนสร้าง repo) GitHub อาจใช้เวลาสักพักกว่าตัวเลขจะขึ้น</li>
<li>{btn('Actions')}: เครื่องหมายถูกสีเขียว</li>
<li>หน้าแรกของ repo: README มีตารางงานของแต่ละคน และกดลิงก์ไปโฟลเดอร์ {c('fr/')} ได้</li>
</ul>

<h2>6 · ทำไมข้อความ commit มีคำว่า "(ย้ายจาก repo เดิม)"</h2>
<p>repo เดิม <span class="mono">{E(OLD)}</span> ยังเป็น public และประวัติในนั้นบอกว่าโค้ดถูกเขียนจากบัญชีไหน อาจารย์เปิดเทียบได้
การเขียนตรง ๆ ว่าเป็นการย้ายโค้ด และใส่ลิงก์ repo เดิมไว้ใน README ทำให้ไม่ดูเหมือนปิดบัง
งานที่เป็นของแต่ละคนจริง ๆ คือ README ที่เขียนเอง (commit ที่ 5) และงานแก้หรือเพิ่มหลังจากนี้</p>

<h2>7 · งานจริงหลังจากนี้</h2>
<p>ทำแบบเดิม: สร้าง branch ใหม่ แก้ แล้วเปิด Pull Request ไอเดียด้านล่างมาจากบท "ข้อจำกัด" ในหนังสือแต่ละเล่ม</p>
<table><tr><th>FR</th><th>งานที่ทำต่อได้</th></tr>{idea_rows}</table>

<h2>8 · ไฟล์ที่ต่างจาก repo เดิม</h2>
<ul>
<li>{c('.github/workflows/web.yml')}, {c('.github/workflows/e2e-webkit.yml')}, {c('e2e/fake-backend.mjs')}: ให้เว็บใช้ชื่อ repo ใหม่เองอัตโนมัติ (เดิมเขียนชื่อ Socrates-and-Skeletons- ไว้ตายตัว)</li>
<li>{c('README.md')}: เพิ่มที่มาของ repo และตารางงานของแต่ละคน</li>
<li>{c('fr/…/README.md')} 6 ไฟล์: แต่ละคนเขียนเอง</li>
<li>ไฟล์อื่นทั้งหมดเหมือน repo เดิมทุกตัวอักษร</li>
</ul>
"""
    return page('แผนย้าย MindPay', 'MINDPAY · แผนของทีม', 'แผนย้าย MindPay เข้า repo ของกลุ่ม',
                '5 ชุด · คนละ 5 commit · ทุกชุดเข้าทาง Pull Request · อ่านหัวข้อ 4 ถ้าคุณเป็นเจ้าของ repo', body)

# ---------------------------------------------------------------- HOW-TO per part
def how_to(p):
    n, br, slug = p['n'], p['branch'], p['slug']
    total = nfiles(p)
    cms = p['commits']
    last = n == 5
    fr_docs = cms[4]['files']
    rows = ''
    for cm in cms[:4]:
        rows += (f"<tr><td class='num'>{cm['n']}</td><td style='width:38%'>{c('commit-%d' % cm['n'])}"
                 f"<div class='small'>ข้างในมี: {E(', '.join(cm['top']))}</div></td><td class='num'>{len(cm['files'])}</td>"
                 f"<td><span class='msg'>{E(cm['message'])}</span></td></tr>")
    hidden = ''
    if last:
        hidden = (f"<li><b>ชุดนี้มีไฟล์ที่ชื่อขึ้นต้นด้วยจุด</b> ({c('.github')} {c('.gitignore')} {c('.env.example')} {c('.claude')}) "
                  f"ถ้าใช้ Mac ไฟล์พวกนี้ถูกซ่อน ให้กด <b>Cmd + Shift + . (จุด)</b> ใน Finder ให้เห็นก่อนลาก ส่วน Windows เห็นอยู่แล้ว</li>")
    last_box = ''
    if last:
        last_box = ("<div class='box stop'><b>ชุด 5 ต้องรวมเป็นชุดสุดท้าย</b><br>ชุดนี้มีไฟล์ที่สั่งให้ GitHub build เว็บและแอป "
                    "ถ้ารวมก่อนชุดอื่น GitHub จะ build ตอนที่ไฟล์ยังมาไม่ครบ แล้วขึ้นกากบาทสีแดง เปิด Pull Request ได้ตามปกติ "
                    "แต่บอกเจ้าของ repo ให้กดรวมหลังชุด 1–4</div>")
    readme_list = ' และ '.join(c('commit-5/' + f) for f in fr_docs)
    files_html = ''
    for cm in cms:
        items = ''.join(f'<div>{E(f)}</div>' for f in cm['files'])
        files_html += f"<h3>รอบ {cm['n']} · {len(cm['files'])} ไฟล์</h3><div class='files'>{items}</div>"
    body = f"""
<div class="box sum"><b>งานของคุณ</b>
<ul>
<li>branch ของคุณ: {c(br)}</li>
<li>อัปโหลด 5 รอบ ได้ 5 commit (รอบที่ 5 เป็น README ที่คุณเขียนเอง) ไฟล์ทั้งหมด {total} ไฟล์</li>
<li>เปิด Pull Request 1 อัน ชื่อ <span class="msg">{E(p['pr'])}</span></li>
<li>ข้อความทุกรอบอยู่ในไฟล์ {c('COMMIT-MESSAGES.txt')} ใน zip นี้ คัดลอกไปวางได้เลย</li>
</ul></div>
{last_box}

<h2>ก่อนเริ่ม</h2>
<ol class="steps">
<li>ใช้<b>คอมพิวเตอร์</b>กับเบราว์เซอร์ Chrome หรือ Edge (มือถือลากโฟลเดอร์ขึ้นเว็บไม่ได้)</li>
<li>เข้าสู่ระบบ GitHub ด้วย<b>บัญชีของคุณเอง</b> ห้ามให้เพื่อนอัปโหลดแทน เพราะ GitHub นับ commit ให้คนที่กดอัปโหลด</li>
<li>แตกไฟล์ zip (Windows: คลิกขวา → Extract All · Mac: ดับเบิลคลิก) จะได้โฟลเดอร์ {c(slug)} ข้างในมี {c('commit-1')} ถึง {c('commit-5')}</li>
<li>ห้ามแก้ไฟล์ใน {c('commit-1')} ถึง {c('commit-4')} เพราะเป็นโค้ดจริงที่ต้องต่อกับของเพื่อนได้พอดี</li>
{hidden}
</ol>

<h2>ขั้นที่ 1 · สร้าง branch ของคุณ (ทำครั้งเดียว)</h2>
<ol class="steps">
<li>เปิดหน้า repo ของกลุ่ม</li>
<li>กดปุ่ม {btn('main')} ที่อยู่เหนือรายการไฟล์ (มีรูปกิ่งไม้)</li>
<li>พิมพ์ {c(br)} แล้วกด {btn('Create branch ' + br + ' from main')}</li>
<li>ปุ่มจะเปลี่ยนเป็น {c(br)} ทุกขั้นต่อจากนี้ต้องเห็นชื่อนี้ ถ้าเห็น {c('main')} ให้กดเปลี่ยนกลับก่อน</li>
</ol>

<h2>ขั้นที่ 2 · อัปโหลด 4 รอบ (commit 1–4)</h2>
<p>ทำซ้ำ 4 รอบตามตาราง รอบละ 1 โฟลเดอร์</p>
<ol class="steps">
<li>ตรวจว่าปุ่ม branch เป็น {c(br)}</li>
<li>กด {btn('Add file')} → {btn('Upload files')}</li>
<li>เปิดโฟลเดอร์ของรอบนั้นในเครื่อง เลือก<b>ของข้างใน</b>ทั้งหมด แล้วลากมาวางในหน้าเว็บ <b>ห้ามลากโฟลเดอร์ {c('commit-1')} ทั้งก้อน</b> ไม่อย่างนั้นไฟล์จะไปอยู่ผิดที่</li>
<li>รอจนรายชื่อไฟล์ขึ้นครบตามจำนวนในตาราง</li>
<li>ในช่อง commit message (ช่องแรกใต้หัวข้อ Commit changes) วางข้อความของรอบนั้น</li>
<li>เลือก {btn('Commit directly to the ' + br + ' branch')} แล้วกด {btn('Commit changes')}</li>
</ol>
<table style="break-inside: avoid"><tr><th class="num">รอบ</th><th>เปิดโฟลเดอร์ แล้วลากทุกอย่างข้างใน</th><th class="num">ไฟล์</th><th>ข้อความ commit</th></tr>{rows}</table>

<h2>ขั้นที่ 3 · รอบที่ 5: README ที่คุณเขียนเอง</h2>
<ol class="steps">
<li>เปิด {readme_list} ด้วย VS Code (หรือ Notepad บน Windows) ถ้าภาษาไทยเพี้ยน ให้ใช้ VS Code</li>
<li>เขียนแทนช่อง ✏️ ทุกช่องด้วยคำของคุณเอง ใช้หนังสือ {E(BOOKS[n])} ช่วยได้ แล้วบันทึกไฟล์</li>
<li>อัปโหลดเหมือนขั้นที่ 2 โดยลากโฟลเดอร์ {c('fr')} ที่อยู่ใน {c('commit-5')}</li>
<li>ข้อความ commit: <span class="msg">{E(cms[4]['message'])}</span></li>
</ol>

<h2>ขั้นที่ 4 · เปิด Pull Request</h2>
<ol class="steps">
<li>กลับไปหน้าแรกของ repo จะเห็นแถบสีเหลือง "{E(br)} had recent pushes" ให้กด {btn('Compare & pull request')}
(ถ้าไม่เห็น: แท็บ {btn('Pull requests')} → {btn('New pull request')} → base: {c('main')} · compare: {c(br)})</li>
<li>ตั้งชื่อ <span class="msg">{E(p['pr'])}</span> และวางรายละเอียดจาก {c('COMMIT-MESSAGES.txt')}</li>
<li>กด {btn('Create pull request')}</li>
<li><b>ตรวจ:</b> แท็บ {btn('Commits')} ต้องมี 5 · แท็บ {btn('Files changed')} ต้องมี {total} ไฟล์ และชื่อไฟล์ต้องไม่ขึ้นต้นด้วย {c('commit-1/')}</li>
<li>บอกในกลุ่มให้เพื่อน 1 คนรีวิว: เพื่อนเปิด Pull Request → แท็บ {btn('Files changed')} → {btn('Review changes')} → เลือก Approve → {btn('Submit review')}</li>
<li>รอเจ้าของ repo กด {btn('Rebase and merge')}</li>
</ol>

<h2>ถ้าทำพลาด</h2>
<div class="box warn"><ul>
<li><b>ไฟล์ไปอยู่ใน {c('commit-1/…')} หรืออัปโหลดผิดรอบ:</b> เริ่ม branch ใหม่ดีที่สุด commit จะได้เป็น 5 พอดี
ถ้าเปิด Pull Request แล้ว ให้กด {btn('Close pull request')} ก่อน → แท็บ {btn('Code')} → ลิงก์ Branches → กดถังขยะท้าย {c(br)} → กลับไปขั้นที่ 1</li>
<li><b>เผลออยู่ที่ main:</b> ถ้าเจ้าของ repo ตั้งกฎไว้ GitHub จะไม่ให้ commit เข้า main และจะเสนอให้สร้าง branch ใหม่ ให้ยกเลิก แล้วเปลี่ยนไปที่ {c(br)}</li>
<li><b>ไฟล์ขึ้นไม่ครบ:</b> เทียบกับรายชื่อไฟล์ท้ายเอกสารนี้ ถ้าขาด ให้เริ่ม branch ใหม่</li>
</ul></div>
<p class="muted">ถ้าถนัด GitHub Desktop หรือ VS Code: clone repo → สร้าง branch {E(br)} → คัดลอกของข้างใน {E('commit-1')} ไปวางในโฟลเดอร์ repo → commit ด้วยข้อความของรอบนั้น → ทำซ้ำจนครบ 5 รอบ → push → เปิด Pull Request</p>

<h2 class="pb">รายชื่อไฟล์ของคุณ (ไว้ตรวจ)</h2>
{files_html}
"""
    return page(f'ชุดที่ {n}', f'MINDPAY · ชุดที่ {n} · วิธีส่งงานเข้า repo กลุ่ม', f'ชุดที่ {n} · {E(SHORT[n])}',
                f'{E(p["title"])}<br>branch {E(br)} · 5 commit · {total} ไฟล์ · ภาพรวมทั้งทีมอยู่ใน TEAM-PLAN.pdf', body)

def main():
    os.makedirs(DOCS, exist_ok=True)
    with open(os.path.join(DOCS, 'TEAM-PLAN.html'), 'w') as fh:
        fh.write(team_plan())
    for p in m['parts']:
        with open(os.path.join(DOCS, f"HOW-TO-part{p['n']}.html"), 'w') as fh:
            fh.write(how_to(p))
        with open(os.path.join(OUT, p['slug'], 'COMMIT-MESSAGES.txt'), 'w', newline='') as fh:
            fh.write(commit_messages_txt(p))
    print('docs written')

if __name__ == '__main__':
    main()
