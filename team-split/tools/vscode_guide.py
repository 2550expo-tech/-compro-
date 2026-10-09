"""Detailed VS Code guide (Thai) for pushing each part straight to main: one HTML page -> VSCODE-GUIDE.pdf."""
import os
from docs import CSS, E, btn, c, page

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out2', 'guide')

EXTRA_CSS = """
pre.cmd { font-family: Mono, Anuphan, monospace; font-size: 8.8pt; line-height: 1.55; background: #0F2A21; color: #E9F2EC;
  border-radius: 8px; padding: 8px 12px; margin: 6px 0 8px; white-space: pre-wrap; word-break: break-all; break-inside: avoid; }
pre.cmd .cm { color: #9FC4B2; }
.os { display: inline-block; font-weight: 700; font-size: 9pt; padding: 0 8px; border-radius: 6px; margin-right: 4px; }
.win { background: #DCEBFA; color: #17406B; }
.mac { background: #EDE3F7; color: #4B2A6E; }
.why { background: #F3F7F5; border-left: 4px solid #1F7A52; padding: 6px 12px; border-radius: 0 8px 8px 0; margin: 6px 0; }
h2 .n { display: inline-block; background: #0E3B2C; color: #E2B64A; border-radius: 8px; padding: 0 9px; margin-right: 6px; }
"""


def pre(*lines):
    out = []
    for ln in lines:
        if '  #' in ln:
            code, cm = ln.split('  #', 1)
            out.append(f'{E(code)}  <span class="cm">#{E(cm)}</span>')
        else:
            out.append(E(ln))
    return '<pre class="cmd">' + '\n'.join(out) + '</pre>'


WIN = '<span class="os win">Windows</span>'
MAC = '<span class="os mac">Mac</span>'

PARTS = [
    (1, 'part1-FR1-FR2', 25, 'fr/FR-1-transactions/README.md และ fr/FR-2-overview/README.md'),
    (2, 'part2-FR3', 30, 'fr/FR-3-voice/README.md'),
    (3, 'part3-FR4', 33, 'fr/FR-4-slip/README.md'),
    (4, 'part4-FR5', 33, 'fr/FR-5-coach/README.md'),
    (5, 'part5-FR6', 59, 'fr/FR-6-runway/README.md'),
]


def body():
    rows = ''.join(f"<tr><td class='num'>{n}</td><td>{c(slug)}</td><td class='num'>{k}</td><td>{E(r)}</td></tr>"
                   for n, slug, k, r in PARTS)
    return f"""
<div class="box sum"><b>ภาพรวม 6 ขั้น</b>
<ol>
<li>ตั้งชื่อและอีเมลใน Git ให้ตรงกับบัญชี GitHub ของตัวเอง</li>
<li>clone repo แล้วกด Sync เพื่อดึงงานล่าสุดของเพื่อน</li>
<li>คัดลอกของข้างในโฟลเดอร์ {c('files')} เข้าโฟลเดอร์ repo</li>
<li>เขียน README ของ FR ตัวเอง</li>
<li>Commit 1 ครั้ง แล้วกด Sync Changes</li>
<li>บอกคนถัดไปให้เริ่ม · ลำดับ 1 → 2 → 3 → 4 → 5 ทีละคน ชุด 5 เป็นคนสุดท้าย</li>
</ol></div>

<p>ตัวอย่างในคู่มือนี้ใช้ชุด 5 ({c('part5-FR6')}) ชุดอื่นทำเหมือนกันทุกขั้น แค่เปลี่ยนค่าตามตารางนี้</p>
<table><tr><th class="num">ชุด</th><th>โฟลเดอร์ใน zip</th><th class="num">จำนวนไฟล์</th><th>README ที่ต้องเขียน</th></tr>{rows}</table>

<h2><span class="n">0</span>ก่อนเริ่ม: ติดตั้งโปรแกรม (ทำครั้งเดียว)</h2>
<ol class="steps">
<li><b>ติดตั้ง Git</b> · {WIN} โหลดจาก git-scm.com/downloads แล้วกด Next จนจบ · {MAC} เปิดแอป Terminal พิมพ์ {c('git --version')} ถ้ายังไม่มี เครื่องจะถามให้ติดตั้ง ให้กด Install</li>
<li><b>ติดตั้ง VS Code</b> จาก code.visualstudio.com</li>
<li><b>เปิด Terminal ใน VS Code:</b> เมนู {btn('Terminal')} → {btn('New Terminal')} (หรือกด {btn('Ctrl+`')}) จะมีช่องพิมพ์คำสั่งขึ้นด้านล่าง</li>
<li><b>เช็กว่า Git พร้อม:</b> พิมพ์คำสั่งนี้ ถ้าขึ้นเลขเวอร์ชัน เช่น {c('git version 2.47.0')} แปลว่าพร้อม</li>
</ol>
{pre('git --version')}

<h2><span class="n">1</span>ตั้งชื่อและอีเมลใน Git</h2>
<div class="why"><b>ทำไมต้องทำ:</b> Git ใส่ชื่อและอีเมลนี้ลงในทุก commit แล้ว GitHub ใช้อีเมลจับคู่ว่า commit เป็นของบัญชีไหน
ถ้าอีเมลไม่ตรง commit จะไม่ขึ้นชื่อคุณ และไม่ถูกนับให้คุณ</div>
<p><b>หาอีเมลที่ถูกต้อง:</b> GitHub → รูปโปรไฟล์มุมขวาบน → {btn('Settings')} → {btn('Emails')} ใช้อีเมลหลักที่แสดง
ถ้าติ๊ก "Keep my email addresses private" ไว้ ให้ใช้อีเมลแบบ {c('12345678+username@users.noreply.github.com')} ที่หน้านั้นแสดงแทน</p>
<p><b>พิมพ์ใน Terminal ทีละบรรทัด</b> แก้ชื่อกับอีเมลเป็นของตัวเอง แต่ยังต้องมีเครื่องหมายคำพูดครอบ</p>
{pre('git config --global user.name "ชื่อ นามสกุล"',
     'git config --global user.email "อีเมลของบัญชี GitHub"',
     'git config --global pull.rebase true  # ถ้า push ชนกัน จะไม่เกิด commit "Merge" เพิ่ม',
     'git config --global init.defaultBranch main  # กันไม่ให้ branch ชื่อ master โผล่มา')}
<p><b>เช็กว่าตั้งถูก:</b> ต้องเห็น {c('user.name=…')} {c('user.email=…')} และ {c('pull.rebase=true')}</p>
{pre('git config --global --list')}

<h2><span class="n">2</span>clone repo แล้วดึงงานล่าสุด</h2>
<h3>2.1 คัดลอกลิงก์ repo</h3>
<p>เปิดหน้า repo ของกลุ่มบน GitHub → ปุ่มสีเขียว {btn('Code')} → แท็บ {btn('HTTPS')} → กดคัดลอก จะได้ลิงก์แบบ {c('https://github.com/ชื่อเจ้าของ/ชื่อrepo.git')}</p>
<h3>2.2 clone ใน VS Code</h3>
<ol class="steps">
<li>กด {btn('Ctrl+Shift+P')} (Mac: {btn('Cmd+Shift+P')}) → พิมพ์ {btn('Git: Clone')} → Enter</li>
<li>วางลิงก์ → Enter</li>
<li>เลือกโฟลเดอร์เก็บ เช่น Documents → {btn('Select as Repository Destination')}</li>
<li>clone เสร็จ กด {btn('Open')} ถ้าถามว่าเชื่อถือผู้เขียนไหม ให้กด {btn('Yes, I trust the authors')}</li>
<li>ถ้า VS Code หรือหน้าต่าง Git ขอให้เข้าสู่ระบบ GitHub ให้เข้าด้วย<b>บัญชีของตัวเอง</b></li>
</ol>
<p>หรือใช้คำสั่ง แล้วเปิดโฟลเดอร์ที่ได้ด้วยเมนู {btn('File')} → {btn('Open Folder')}</p>
{pre('git clone https://github.com/ชื่อเจ้าของ/ชื่อrepo.git')}
<h3>2.3 เช็กว่าอยู่ที่ branch main</h3>
<p>มุมซ้ายล่างของ VS Code ต้องขึ้น {c('main')} หรือพิมพ์คำสั่งแรก ถ้าขึ้นว่า {c('master')} (เกิดได้กับชุด 1 ถ้า repo ยังว่าง) ให้พิมพ์คำสั่งที่สอง</p>
{pre('git branch --show-current', 'git branch -M main  # ใช้เฉพาะเมื่อขึ้นว่า master')}
<h3>2.4 พอถึงตาคุณ ให้ดึงงานล่าสุดก่อนทุกครั้ง</h3>
<p>กดปุ่มลูกศรวนข้างคำว่า {c('main')} ที่มุมซ้ายล่าง หรือพิมพ์คำสั่งด้านล่าง
{c('git log')} ต้องเห็น commit ของเพื่อนทุกชุดที่ push ไปก่อนคุณ (ชุด 5 ต้องเห็นของชุด 1–4 ครบ)</p>
{pre('git pull', 'git log --oneline -5')}

<h2><span class="n">3</span>คัดลอกของข้างใน {c('files')} เข้าโฟลเดอร์ repo</h2>
<h3>3.1 แตก zip</h3>
<ul>
<li>{WIN} คลิกขวาที่ zip → {btn('Extract All…')} → {btn('Extract')} จะได้ {c('Downloads\\MindPay-part5-FR6\\part5-FR6\\files')}</li>
<li>{MAC} ดับเบิลคลิกที่ zip จะได้ {c('Downloads/part5-FR6/files')}</li>
</ul>
<h3>3.2 คัดลอก</h3>
<p>{WIN} <b>ใช้ File Explorer:</b> เปิดโฟลเดอร์ {c('files')} → {btn('Ctrl+A')} → {btn('Ctrl+C')} →
เปิดโฟลเดอร์ repo (คลิกขวาที่แถบ Explorer ซ้ายมือของ VS Code → {btn('Reveal in File Explorer')}) → {btn('Ctrl+V')}
ถ้าถามว่าจะแทนที่ไฟล์ไหม ให้เลือก {btn('Replace the files in the destination')}</p>
<p>{WIN} <b>หรือใช้คำสั่งใน Terminal ของ VS Code:</b></p>
{pre('robocopy "$HOME\\Downloads\\MindPay-part5-FR6\\part5-FR6\\files" . /E')}
<div class="box stop">{MAC} <b>ต้องใช้คำสั่ง ห้ามลากโฟลเดอร์ไปวางใน Finder</b> Finder จะแทนที่โฟลเดอร์ {c('src')} ทั้งก้อน แล้วไฟล์ของเพื่อนจะหาย
พิมพ์ใน Terminal ของ VS Code ซึ่งเปิดอยู่ที่โฟลเดอร์ repo แล้ว (ต้องมี {c('/. .')} ปิดท้ายเสมอ คำสั่งนี้คัดลอกไฟล์ที่ชื่อขึ้นต้นด้วยจุด เช่น {c('.github')} ให้ครบด้วย)</div>
{pre('ls ~/Downloads/part5-FR6/files  # เช็กว่าหาโฟลเดอร์เจอ', 'cp -R ~/Downloads/part5-FR6/files/. .  # คัดลอก')}
<h3>3.3 เช็กจำนวนไฟล์</h3>
<p>คำสั่งแรกแสดงรายชื่อไฟล์ที่เปลี่ยน ({c('??')} คือไฟล์ใหม่ · {c('M')} คือไฟล์ที่ถูกแทนที่ เช่น {c('README.md')} ของชุด 5)
คำสั่งนับจำนวนต้องได้เท่ากับตาราง (ชุด 5 = 59)</p>
{pre('git status --short -uall',
     '(git status --short -uall).Count  # Windows: นับจำนวน',
     'git status --short -uall | wc -l  # Mac: นับจำนวน')}
<div class="box warn">ถ้าเห็นตัว {c('D')} แปลว่ามีไฟล์ถูกลบ <b>ห้าม commit ต่อ</b> ไปที่แท็บ Source Control คลิกขวาไฟล์นั้น → {btn('Discard Changes')} แล้วคัดลอกใหม่</div>

<h2><span class="n">4</span>เขียน README ของ FR ตัวเอง</h2>
<ol class="steps">
<li>กด {btn('Ctrl+P')} (Mac: {btn('Cmd+P')}) → พิมพ์ {c('FR-6-runway/README')} → Enter</li>
<li>เขียนแทนช่อง ✏️ ทุกช่องด้วยคำของคุณเอง ใช้หนังสือ FR ของตัวเองช่วยได้</li>
<li>อยากเห็นหน้าตาตอนอยู่บน GitHub กด {btn('Ctrl+Shift+V')} (Mac: {btn('Cmd+Shift+V')})</li>
<li>กด {btn('Ctrl+F')} ค้นหา ✏️ ต้องขึ้นว่า {btn('No results')} แปลว่าเขียนครบแล้ว</li>
<li>กด {btn('Ctrl+S')} บันทึก</li>
</ol>

<h2><span class="n">5</span>Commit 1 ครั้ง แล้วกด Sync Changes</h2>
<h3>5.1 Commit ด้วยหน้าจอ (แนะนำ ภาษาไทยไม่เพี้ยน)</h3>
<ol class="steps">
<li>กด {btn('Ctrl+Shift+G')} เปิดแท็บ Source Control</li>
<li>ในช่อง {btn('Message')} วางข้อความจาก {c('COMMIT-MESSAGE.txt')} ชุด 5 คือ<br>
<span class="msg">ชุดที่ 5: FR-6 Money Runway + โครงแอป ตั้งค่าโปรเจกต์ CI (ย้ายโค้ดจาก repo เดิม) พร้อม README ของ FR-6</span></li>
<li>กด {btn('✓ Commit')} ถ้าถามว่า "stage all your changes" ให้ตอบ {btn('Yes')}</li>
</ol>
<p>หรือใช้คำสั่ง:</p>
{pre('git add -A', 'git commit -m "วางข้อความจาก COMMIT-MESSAGE.txt"')}
<h3>5.2 เช็กชื่อก่อน push (สำคัญมาก)</h3>
<p>คำสั่งแรกต้องขึ้นชื่อและอีเมล GitHub ของคุณ ถ้าผิด ให้แก้ขั้นที่ 1 แล้วพิมพ์คำสั่งที่สองเพื่อแก้ชื่อใน commit ล่าสุด
<b>ใช้ได้เฉพาะตอนที่ยังไม่ได้ push</b></p>
{pre('git log -1 --format="%an <%ae>"', 'git commit --amend --reset-author --no-edit  # ใช้เฉพาะเมื่อชื่อผิด')}
<h3>5.3 push</h3>
<p>กดปุ่ม {btn('Sync Changes 1↑')} → {btn('OK')} ถ้าปุ่มขึ้นว่า {btn('Publish Branch')} (เกิดได้กับชุด 1 ถ้า repo ยังว่าง) ให้กดปุ่มนั้นแทน ผลเหมือนกัน หรือใช้คำสั่ง:</p>
{pre('git pull', 'git push')}
<h3>5.4 เช็กว่าขึ้นจริง</h3>
<p>{c('git status')} ต้องขึ้นว่า {c("Your branch is up to date with 'origin/main'")}
และบนเว็บ GitHub หน้า repo → {btn('Commits')} ต้องเห็น commit ของคุณอยู่บนสุด พร้อมรูปโปรไฟล์ของคุณ (ถ้าไม่มีรูป แปลว่าอีเมลใน Git ไม่ตรงกับบัญชี)</p>
{pre('git status', 'git log --oneline -3')}

<h2><span class="n">6</span>บอกคนถัดไป</h2>
<ol class="steps">
<li>ส่งข้อความในกลุ่ม เช่น "ชุด 2 push แล้ว ถึงตาชุด 3" (แปะลิงก์ commit ด้วยก็ได้)</li>
<li>คนถัดไปเริ่มที่ขั้น 2.4 คือ {c('git pull')} ก่อนคัดลอกไฟล์ทุกครั้ง</li>
<li>ชุด 5 เป็นคนสุดท้าย push เสร็จแล้วบอกเจ้าของ repo ไปดูแท็บ {btn('Actions')} ว่าขึ้นเครื่องหมายถูกสีเขียว</li>
</ol>

<h2>ถ้าเจอข้อความ error</h2>
<table style="break-inside: avoid"><tr><th>ข้อความ</th><th>แก้ยังไง</th></tr>
<tr><td>{c('Please tell me who you are')}</td><td>ยังไม่ได้ทำขั้นที่ 1</td></tr>
<tr><td>{c('Permission … denied')} หรือ {c('403')}</td><td>ยังไม่ได้กดรับคำเชิญเข้า repo หรือ VS Code ล็อกอินบัญชีอื่น (กดไอคอนรูปคนที่มุมซ้ายล่างเพื่อเปลี่ยนบัญชี)</td></tr>
<tr><td>{c('rejected')} หรือ {c('fetch first')}</td><td>มีเพื่อน push ไปก่อน กด {btn('Sync Changes')} อีกครั้ง หรือพิมพ์ {c('git pull')} แล้ว {c('git push')}</td></tr>
<tr><td>{c('GH006')} หรือ {c('GH013')}</td><td>main ถูกล็อก ให้เจ้าของ repo ปลดกฎ (Settings → Branches และ Settings → Rules)</td></tr>
</table>
<div class="box stop"><b>ห้ามใช้ {c('git push --force')} และห้ามกด Force Push เด็ดขาด</b> เพราะจะลบงานของเพื่อนออกจาก main</div>
"""


def main():
    os.makedirs(OUT, exist_ok=True)
    html_ = page('คู่มือ VS Code', 'MINDPAY · คู่มือส่งงานเข้า repo กลุ่ม', 'คู่มือ VS Code ทีละขั้น',
                 'คนละ 1 commit · push เข้า main · ผลัดกันทีละคน 1 → 2 → 3 → 4 → 5 · ใช้ได้ทั้ง Windows และ Mac', body())
    html_ = html_.replace('</style>', EXTRA_CSS + '</style>', 1)
    with open(os.path.join(OUT, 'VSCODE-GUIDE.html'), 'w') as fh:
        fh.write(html_)
    print('VSCODE-GUIDE.html written')


if __name__ == '__main__':
    main()
