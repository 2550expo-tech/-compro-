"""One commit per person, pushed straight to main from VS Code.

out2/partN-<slug>/files/        everything that person copies into the repo folder
out2/partN-<slug>/COMMIT-MESSAGE.txt
out2/docs/*.html                guides (printed to PDF by render.mjs)
"""
import json, os, re, shutil
from docs import CSS, E, BOOKS, OLD, SHORT, btn, c, m, page, part_lines

HERE = os.path.dirname(os.path.abspath(__file__))
OUT, OUT2 = os.path.join(HERE, 'out'), os.path.join(HERE, 'out2')
DOCS = os.path.join(OUT2, 'docs')

MSG = {
    1: 'ชุดที่ 1: FR-1 จดรายการ + FR-2 ภาพรวม (ย้ายโค้ดจาก repo เดิม) พร้อม README ของ FR-1 และ FR-2',
    2: 'ชุดที่ 2: FR-3 พูดจด + ระบบบัญชีผู้ใช้ + Design System (ย้ายโค้ดจาก repo เดิม) พร้อม README ของ FR-3',
    3: 'ชุดที่ 3: FR-4 สแกนสลิป + ชุดทดสอบในเบราว์เซอร์ (ย้ายโค้ดจาก repo เดิม) พร้อม README ของ FR-4',
    4: 'ชุดที่ 4: FR-5 โค้ชน้องกล้า + สกิน ภารกิจ ฮาโลวีน (ย้ายโค้ดจาก repo เดิม) พร้อม README ของ FR-5',
    5: 'ชุดที่ 5: FR-6 Money Runway + โครงแอป ตั้งค่าโปรเจกต์ CI (ย้ายโค้ดจาก repo เดิม) พร้อม README ของ FR-6',
}


def files_of(p):
    return sorted(f for cm in p['commits'] for f in cm['files'])


def pack():
    shutil.rmtree(OUT2, ignore_errors=True)
    for p in m['parts']:
        dest = os.path.join(OUT2, p['slug'], 'files')
        for cm in p['commits']:
            shutil.copytree(os.path.join(OUT, p['slug'], f"commit-{cm['n']}"), dest, dirs_exist_ok=True)
        for doc in p['commits'][4]['files']:  # README templates: there are no branches in this flow
            path = os.path.join(dest, doc)
            t = open(path).read()
            t2 = re.sub(r' · branch `[^`]+`', '', t)
            assert t2 != t, path
            open(path, 'w').write(t2)
        n = p['n']
        txt = [f"MindPay ชุดที่ {n} · {p['title']}", '',
               'ข้อความ commit (คัดลอกทั้งบรรทัดไปวางในช่อง Message ของ VS Code):', '', MSG[n], '',
               f"ไฟล์ทั้งหมด {len(files_of(p))} ไฟล์ · ที่มาของโค้ด: {OLD} (commit {m['commit']})", '']
        with open(os.path.join(OUT2, p['slug'], 'COMMIT-MESSAGE.txt'), 'w', newline='') as fh:
            fh.write('﻿' + '\r\n'.join(txt))


ORDER_NOTE = 'ลำดับ: ชุด 1 → 2 → 3 → 4 → 5 ทีละคน ชุด 5 ต้องเป็นคนสุดท้าย'

SETUP = f"""
<ol class="steps">
<li>ติดตั้ง <b>Git</b> (git-scm.com) และ <b>VS Code</b> ถ้ายังไม่มี</li>
<li>เปิด VS Code → เมนู {btn('Terminal')} → {btn('New Terminal')} แล้วพิมพ์ทีละบรรทัด (แก้ชื่อกับอีเมลเป็นของตัวเอง)
<div class="msg mono" style="white-space:pre;font-size:8.6pt">git config --global user.name "ชื่อของคุณ"
git config --global user.email "อีเมลของบัญชี GitHub"
git config --global pull.rebase true</div></li>
<li><b>อีเมลต้องตรงกับบัญชี GitHub</b> ดูได้ที่ GitHub → {btn('Settings')} → {btn('Emails')} ใช้อีเมลหลัก หรืออีเมลแบบ {c('…@users.noreply.github.com')} ที่หน้านั้นแสดง
ถ้าอีเมลไม่ตรง commit จะไม่ขึ้นชื่อคุณ และไม่ถูกนับให้คุณ</li>
</ol>
"""


def team_plan():
    rows = ''.join(
        f"<tr><td class='num'>{p['n']}</td><td>{E(p['title'])}</td>"
        f"<td class='num'>{len(files_of(p))}</td><td class='num'>{part_lines(p['id']):,}</td><td class='num'>1</td></tr>"
        for p in m['parts'])
    ideas = [
        ('FR-1', 'ล้างข้อความเตือนของช่องเงินทันทีที่พิมพ์ถูก (' + c('src/app/transaction.tsx') + ' บรรทัด 241) · ให้ช่องเงินรับเลขไทย ๐–๙ (' + c('src/ui/inputs.tsx') + ' บรรทัด 189)'),
        ('FR-2', 'แถบหมวดแสดงแค่ 5 หมวด เพิ่มแถว "อื่น ๆ" · สรุปเดือนขึ้น "เดือนแรกของการจด" ผิดเมื่อเดือนก่อนมีข้อมูลแค่ปลายเดือน'),
        ('FR-3', 'เตือนเมื่อรายการไม่มีราคา เช่น "ขนม ยังไม่มีราคา" · ให้ "7 11 ขนม 45" อ่านเป็นเซเว่น'),
        ('FR-4', 'ถ้า CRC ของ QR ไม่ถูก ไม่ใช้เลขอ้างอิงจาก QR (ค่า ' + c('crcValid') + ') พร้อมเทสต์ · "ร้านรองเท้า" ไม่ควรได้หมวดอาหาร'),
        ('FR-5', 'การ์ดงบขึ้นเครื่องหมายถูกสีเขียวทั้งที่เกินงบ (' + c('src/domain/insights.ts') + ' บรรทัด 127) · กรอบ "กำลังพูด" ค้างเมื่อถามใหม่ระหว่างน้องกล้ายังพูด (' + c('src/app/(tabs)/coach.tsx') + ' บรรทัด 118)'),
        ('FR-6', 'หักบิลประจำที่จะครบกำหนดออกจาก Runway · นับรายรับที่คาดว่าจะเข้า เช่น ค่าขนมทุกวันที่ 1'),
    ]
    idea_rows = ''.join(f'<tr><td class="nw"><b>{k}</b></td><td>{v}</td></tr>' for k, v in ideas)
    body = f"""
<div class="box sum"><b>สรุปในย่อหน้าเดียว</b><br>
โค้ดของแอป 174 ไฟล์ (จาก repo เดิม commit {c(m['commit'])}) ถูกแบ่งเป็น 5 ชุดตาม FR ทุกไฟล์อยู่ในชุดเดียว ไม่มีไฟล์ซ้ำ
แต่ละคนคัดลอกโฟลเดอร์ {c('files')} ของตัวเองเข้า repo เขียน README ของ FR แล้ว commit ครั้งเดียวและ push เข้า {c('main')} จาก VS Code
<b>ผลัดกันทีละคนตามลำดับ 1 → 2 → 3 → 4 → 5</b></div>

<h2>1 · ใครทำชุดไหน</h2>
<table><tr><th class="num">ชุด</th><th>งาน</th><th class="num">ไฟล์</th><th class="num">บรรทัดโค้ด</th><th class="num">commit</th></tr>{rows}</table>
<p class="muted">โค้ดส่วนกลางที่ไม่ใช่ของ FR ไหน เช่น ระบบสมัครสมาชิก ธีม ชุดทดสอบ และไฟล์ตั้งค่า ถูกกระจายให้ชุดที่โค้ด FR น้อย
· บรรทัดโค้ดไม่นับ {c('package-lock.json')} · จำนวนไฟล์รวม README ที่เขียนเอง</p>

<h2>2 · ตรวจแล้วก่อนส่ง</h2>
<ul>
<li>รวมทั้ง 5 ชุดได้ไฟล์ครบ 174 ไฟล์ ตรงกับ repo เดิม (บวก README ในโฟลเดอร์ {c('fr/')} อีก 6 ไฟล์) · typecheck ผ่าน · เทสต์ 157/157 ผ่าน · ทดสอบในเบราว์เซอร์ 145/145 ผ่าน โดยสมมติว่า repo ชื่ออื่น</li>
<li>จำลองให้ 5 คน push เข้า main ทีละคน: ไม่มี conflict ไม่มี merge commit และได้คนละ 1 commit
และกรณีมีสองคน push ชนกัน: คนหลังกด Sync อีกครั้งก็ push ได้ โดยไม่มี commit เกิน</li>
</ul>

<h2>3 · กติกาของทีม</h2>
<ol class="steps">
<li>ใช้ Git ที่ตั้งชื่อกับอีเมลเป็นของ<b>ตัวเอง</b> ห้ามให้เพื่อน push แทน เพราะ commit จะนับให้เจ้าของชื่อในเครื่องที่ commit</li>
<li><b>ผลัดกันทีละคน</b> {E(ORDER_NOTE)} คนก่อน push เสร็จแล้วค่อยบอกคนถัดไป</li>
<li>ก่อนคัดลอกไฟล์ กด Sync ให้ได้งานล่าสุดของเพื่อนก่อนทุกครั้ง</li>
<li>ห้ามแก้ไฟล์ในโฟลเดอร์ {c('files')} ยกเว้น README ของ FR ตัวเอง และห้ามแตะไฟล์ของชุดอื่น</li>
<li>ห้ามอัปโหลด {c('.env')} และ {c('node_modules')} (ไม่มีใน zip อยู่แล้ว)</li>
<li><b>ห้ามกด Force Push เด็ดขาด</b> จะลบงานของคนอื่นออกจาก main</li>
</ol>

<h2 class="pb">4 · สำหรับเจ้าของ repo</h2>
<h3>4.1 ทำก่อนเพื่อนเริ่ม</h3>
<ol class="steps">
<li><b>ตรวจ main:</b> ควรมีแค่ README (หรือ {c('.gitignore')} / LICENSE ที่ GitHub สร้างให้) หรือว่างเปล่า ถ้ามีไฟล์อื่นอยู่แล้ว บอกคนที่ส่ง zip ก่อนเริ่ม</li>
<li><b>อย่าล็อก main:</b> ถ้าเคยตั้งกฎ {btn('Require a pull request before merging')} ไว้ ต้องลบออกก่อน ({btn('Settings')} → {btn('Branches')} หรือ {btn('Rules')}) ไม่อย่างนั้นทุกคน push เข้า main ไม่ได้</li>
<li>ถ้าตอนสร้าง repo ติ๊ก "Add a README" ไว้ เจ้าของ repo จะมี commit มากกว่าคนอื่น 1 อัน (เป็นงานสร้าง repo จริง ไม่ต้องลบ)</li>
</ol>
<h3>4.2 หลังชุด 5 push เสร็จ</h3>
<ol class="steps">
<li>แท็บ {btn('Actions')} จะรัน 4 งาน: Deploy web app, Build Android APK, Browser tests on Safari engine และ Update installed apps
สามงานแรกควรขึ้นถูกสีเขียว (รวมราว 20–30 นาที) งานที่ 4 จะข้ามตัวเอง เพราะ repo ใหม่ไม่มีรหัส {c('EXPO_TOKEN')} ซึ่งปกติ</li>
<li><b>เปิดเว็บของ repo ใหม่:</b> {btn('Settings')} → {btn('Pages')} → Source: {btn('Deploy from a branch')} → Branch: {btn('gh-pages')} กับ {btn('/ (root)')} → {btn('Save')} รอ 1–2 นาที เว็บจะอยู่ที่ {c('https://<ชื่อบัญชีเจ้าของ>.github.io/<ชื่อ repo>/')}</li>
<li><b>ไม่บังคับ:</b> ตอนสมัครบัญชีบนเว็บใหม่ ลิงก์ยืนยันในอีเมลจะพาไปเว็บเดิม จนกว่าเจ้าของโปรเจกต์ Supabase จะเพิ่มลิงก์เว็บใหม่ที่ลงท้ายด้วย {c('/**')} ใน Supabase → Authentication → URL Configuration → Redirect URLs</li>
</ol>
<div class="box warn">ระหว่างชุด 1–4 push แอปใน main ยังไม่ครบ เป็นเรื่องปกติ ไฟล์ที่สั่งให้ GitHub build เว็บและแอปอยู่ในชุด 5 ระบบจึงยังไม่ทำงานจนกว่าชุด 5 จะเข้า</div>

<h2>5 · ตรวจว่าเสร็จ</h2>
<ul>
<li>หน้า repo → {btn('Commits')}: เห็น commit ของทุกคน มีชื่อและรูปของแต่ละคน (ถ้าไม่มีรูป แปลว่าอีเมลใน Git ไม่ตรงกับบัญชี GitHub)</li>
<li>{btn('Insights')} → {btn('Contributors')}: ทุกคนมี 1 commit (เจ้าของ repo อาจมีเพิ่ม 1) GitHub อาจใช้เวลาสักพักกว่าตัวเลขจะขึ้น</li>
<li>{btn('Actions')}: เครื่องหมายถูกสีเขียว</li>
</ul>

<h2>6 · ทำไมข้อความ commit มีคำว่า "(ย้ายโค้ดจาก repo เดิม)"</h2>
<p>repo เดิม <span class="mono">{E(OLD)}</span> ยังเป็น public และประวัติในนั้นบอกว่าโค้ดถูกเขียนจากบัญชีไหน อาจารย์เปิดเทียบได้
การเขียนตรง ๆ ว่าเป็นการย้ายโค้ด และใส่ลิงก์ repo เดิมไว้ใน README ทำให้ไม่ดูเหมือนปิดบัง
งานที่เป็นของแต่ละคนจริง ๆ คือ README ที่เขียนเอง และงานแก้หรือเพิ่มหลังจากนี้</p>

<h2>7 · งานจริงหลังจากนี้</h2>
<p>ทำแบบเดียวกัน: Sync → แก้ → Commit → Sync Changes โดยผลัดกันทีละคน ไอเดียด้านล่างมาจากบท "ข้อจำกัด" ในหนังสือแต่ละเล่ม</p>
<table><tr><th>FR</th><th>งานที่ทำต่อได้</th></tr>{idea_rows}</table>

<h2>8 · ไฟล์ที่ต่างจาก repo เดิม</h2>
<ul>
<li>{c('.github/workflows/web.yml')}, {c('.github/workflows/e2e-webkit.yml')}, {c('e2e/fake-backend.mjs')}: ให้เว็บใช้ชื่อ repo ใหม่เองอัตโนมัติ (เดิมเขียนชื่อ Socrates-and-Skeletons- ไว้ตายตัว)</li>
<li>{c('README.md')}: เพิ่มที่มาของ repo และตารางงานของแต่ละคน</li>
<li>{c('fr/…/README.md')} 6 ไฟล์: แต่ละคนเขียนเอง · ไฟล์อื่นทั้งหมดเหมือน repo เดิมทุกตัวอักษร</li>
</ul>
"""
    return page('แผนย้าย MindPay', 'MINDPAY · แผนของทีม', 'แผนย้าย MindPay เข้า repo ของกลุ่ม',
                '5 ชุด · คนละ 1 commit · push เข้า main จาก VS Code ทีละคน · อ่านหัวข้อ 4 ถ้าคุณเป็นเจ้าของ repo', body)


def how_to(p):
    n, slug = p['n'], p['slug']
    files = files_of(p)
    total = len(files)
    docs = p['commits'][4]['files']
    first, last = n == 1, n == 5
    tops = sorted({f.split('/')[0] for f in files})
    turn = ('คุณเป็น<b>คนแรก</b> เริ่มได้เลยเมื่อเจ้าของ repo พร้อม' if first else
            ('คุณเป็น<b>คนสุดท้าย</b> รอให้ชุด 1–4 push ครบก่อน' if last else f'รอชุดที่ {n - 1} push เสร็จก่อน แล้วค่อยเริ่ม'))
    dots = sorted({f.split('/')[0] for f in files if f.startswith('.')})
    hidden_mac = ''
    if dots:
        hidden_mac = (f"<li>ชุดนี้มีไฟล์ที่ชื่อขึ้นต้นด้วยจุด ({' '.join(c(x) for x in dots)}) Finder ของ Mac ซ่อนไว้ "
                      f"แต่คำสั่ง {c('cp')} ด้านบนคัดลอกให้ครบอยู่แล้ว ส่วน Windows เห็นตามปกติ</li>")
    empty_repo = ''
    if first:
        empty_repo = (f"<li>ถ้า repo ยังว่างเปล่า มุมซ้ายล่างอาจขึ้นเป็น {c('master')} ให้พิมพ์ใน Terminal: {c('git branch -M main')}</li>")
    readmes = ' และ '.join(c(d) for d in docs)
    file_items = ''.join(f'<div>{E(f)}</div>' for f in files)
    body = f"""
<div class="box sum"><b>งานของคุณ</b>
<ul>
<li>คัดลอกโฟลเดอร์ {c('files')} เข้า repo · เขียน README ของ FR · commit <b>1 ครั้ง</b> · push เข้า {c('main')}</li>
<li>ไฟล์ทั้งหมด {total} ไฟล์ · ข้อความ commit อยู่ใน {c('COMMIT-MESSAGE.txt')}</li>
<li><b>ตาของคุณ:</b> {turn} ({E(ORDER_NOTE)})</li>
</ul></div>

<h2>ขั้นที่ 1 · เตรียมเครื่อง (ทำครั้งเดียว)</h2>
{SETUP}

<h2>ขั้นที่ 2 · เอา repo ลงเครื่อง</h2>
<ol class="steps">
<li>ใน VS Code กด {btn('Ctrl+Shift+P')} (Mac: {btn('Cmd+Shift+P')}) → พิมพ์ {btn('Git: Clone')} → วางลิงก์ repo ของกลุ่ม → เลือกโฟลเดอร์เก็บ → {btn('Open')}
(ถ้า VS Code ขอให้เข้าสู่ระบบ GitHub ให้เข้าด้วยบัญชีของคุณ)</li>
<li>ดูมุมซ้ายล่างของ VS Code ต้องขึ้น {c('main')}</li>
{empty_repo}
<li>ถึงตาคุณแล้ว: กดปุ่มลูกศรวนที่มุมซ้ายล่าง (Sync) เพื่อดึงงานล่าสุดของเพื่อนลงมาก่อน</li>
</ol>

<h2>ขั้นที่ 3 · คัดลอกไฟล์ของคุณเข้า repo</h2>
<p>แตก zip ก่อน (Windows: คลิกขวา → Extract All · Mac: ดับเบิลคลิก) จะได้โฟลเดอร์ {c(slug)} ข้างในมี {c('files')}</p>
<ul>
<li><b>Windows:</b> เปิดโฟลเดอร์ {c('files')} → {btn('Ctrl+A')} → {btn('Ctrl+C')} → เปิดโฟลเดอร์ repo → {btn('Ctrl+V')}
ถ้าถามว่าจะแทนที่ไฟล์ไหม ให้เลือก {btn('Replace the files in the destination')}</li>
<li><b>Mac:</b> <b>ห้ามลากโฟลเดอร์ไปวางทับใน Finder</b> Finder จะแทนที่โฟลเดอร์ทั้งก้อน แล้วไฟล์ของเพื่อนจะหาย
ให้ใช้ Terminal ใน VS Code (ซึ่งเปิดอยู่ที่โฟลเดอร์ repo) พิมพ์คำสั่งนี้ ถ้าแตก zip ไว้ในโฟลเดอร์ Downloads<br>
<span class="msg mono">cp -R ~/Downloads/{E(slug)}/files/. .</span><br>
ถ้าแตกไว้ที่อื่น ให้เปลี่ยน {c('~/Downloads')} เป็นที่อยู่นั้น (ต้องมี {c('/. .')} ปิดท้ายเสมอ)</li>
{hidden_mac}
</ul>
<p>คัดลอกแล้ว แท็บ Source Control ({btn('Ctrl+Shift+G')}) ต้องขึ้นจำนวนไฟล์ที่เปลี่ยน {total} ไฟล์ และในโฟลเดอร์ repo ต้องมี {', '.join(c(t) for t in tops)}</p>

<h2>ขั้นที่ 4 · เขียน README ของคุณ</h2>
<ol class="steps">
<li>ใน VS Code เปิด {readmes}</li>
<li>เขียนแทนช่อง ✏️ ทุกช่องด้วยคำของคุณเอง ใช้หนังสือ {E(BOOKS[n])} ช่วยได้ แล้วกด {btn('Ctrl+S')} บันทึก</li>
</ol>

<h2>ขั้นที่ 5 · Commit 1 ครั้ง แล้ว push</h2>
<ol class="steps">
<li>แท็บ Source Control → ช่อง Message วางข้อความนี้ (มีใน {c('COMMIT-MESSAGE.txt')})<br><span class="msg">{E(MSG[n])}</span></li>
<li>กด {btn('✓ Commit')} ถ้าถามว่าจะ stage ทุกไฟล์ไหม ให้ตอบ {btn('Yes')}</li>
<li>กด {btn('Sync Changes')} (ปุ่มจะขึ้น 1↑) → {btn('OK')}</li>
<li>เปิดหน้า repo บน GitHub → {btn('Commits')} ต้องเห็น commit ของคุณ มีชื่อและรูปของคุณ</li>
<li>บอกเพื่อนชุดถัดไปในกลุ่มว่าถึงตาแล้ว{'' if not last else ' (ชุด 5 คือคนสุดท้าย บอกเจ้าของ repo ให้ดูแท็บ Actions)'}</li>
</ol>

<h2>ถ้ามีปัญหา</h2>
<div class="box warn"><ul>
<li><b>push ไม่ผ่าน ขึ้นว่า rejected / remote contains work:</b> มีเพื่อน push ก่อนคุณ ให้กด {btn('Sync Changes')} อีกครั้ง Git จะดึงงานของเพื่อนแล้วต่อ commit ของคุณไว้ข้างบนเอง (เพราะตั้ง {c('pull.rebase true')} ไว้)</li>
<li><b>ขึ้นว่า protected branch:</b> main ถูกล็อก ให้เจ้าของ repo ลบกฎ Require a pull request ก่อน</li>
<li><b>commit ไม่มีรูปหรือชื่อคุณบน GitHub:</b> อีเมลใน Git ไม่ตรงกับบัญชี กลับไปทำขั้นที่ 1 ข้อ 2–3 แล้วบอกในกลุ่มก่อนทำอะไรต่อ</li>
<li><b>Source Control ขึ้นว่ามีไฟล์ถูกลบ (D สีแดง):</b> ห้าม commit ไฟล์ถูกลบจากการคัดลอกผิด ให้กด {btn('Discard Changes')} เฉพาะไฟล์ที่ขึ้น D แล้วคัดลอกใหม่</li>
<li><b>ห้ามกด Force Push เด็ดขาด</b></li>
</ul></div>

<h2 class="pb">รายชื่อไฟล์ของคุณ (ไว้ตรวจ) · {total} ไฟล์</h2>
<div class='files'>{file_items}</div>
"""
    return page(f'ชุดที่ {n}', f'MINDPAY · ชุดที่ {n} · วิธีส่งงานด้วย VS Code', f'ชุดที่ {n} · {E(SHORT[n])}',
                f'{E(p["title"])}<br>1 commit · push เข้า main · {total} ไฟล์ · ภาพรวมทั้งทีมอยู่ใน TEAM-PLAN.pdf', body)


def main():
    pack()
    os.makedirs(DOCS, exist_ok=True)
    with open(os.path.join(DOCS, 'TEAM-PLAN.html'), 'w') as fh:
        fh.write(team_plan())
    for p in m['parts']:
        with open(os.path.join(DOCS, f"HOW-TO-part{p['n']}.html"), 'w') as fh:
            fh.write(how_to(p))
    print('out2 ready')


if __name__ == '__main__':
    main()
