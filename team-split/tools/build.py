"""Build the 5 upload packages for moving MindPay (commit 646b485) into the team's new repo.

out/partN-<slug>/commit-1 .. commit-5/<repo paths>   files to upload, one folder per commit
out/manifest.json                                    data for the instruction PDFs
"""
import json, os, shutil, subprocess
from plan import PARTS, REPO

COMMIT = '646b485'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
OLD_REPO = 'https://github.com/2550expo-tech/Socrates-and-Skeletons-'
SUFFIX = ' (ย้ายจาก repo เดิม)'

META = {
    'P1': dict(n=1, slug='part1-FR1-FR2', branch='fr1-fr2', fr='FR-1 + FR-2',
               title='FR-1 จดรายการ + FR-2 ภาพรวม',
               pr='ชุดที่ 1: FR-1 จดรายการ + FR-2 ภาพรวม',
               msgs=['FR-1: ตรรกะเงิน หมวดหมู่ และรายการประจำ พร้อมเทสต์',
                     'FR-2: ตรรกะสรุปยอด วันที่ และสรุปเดือน พร้อมเทสต์',
                     'FR-1/FR-2: ชั้นข้อมูลและตารางฐานข้อมูล',
                     'FR-1/FR-2: หน้าจอรายการ หน้าหลัก และสรุปเดือน'],
               msg5='FR-1/FR-2: README อธิบายงานของฉัน'),
    'P2': dict(n=2, slug='part2-FR3', branch='fr3-voice', fr='FR-3',
               title='FR-3 พูดจด + ระบบบัญชีผู้ใช้ + Design System',
               pr='ชุดที่ 2: FR-3 พูดจด + ระบบบัญชีผู้ใช้ + Design System',
               msgs=['FR-3: ตรรกะแปลงคำพูดเป็นรายการ พร้อมเทสต์ และชุดเทสต์ตรวจบั๊ก',
                     'FR-3: บริการฟังเสียงและหน้าจอพูดจด',
                     'ระบบบัญชีผู้ใช้: สมัคร เข้าสู่ระบบ ลิงก์อีเมล',
                     'Design System: ธีม สี ปุ่ม และเอฟเฟกต์'],
               msg5='FR-3: README อธิบายงานของฉัน'),
    'P3': dict(n=3, slug='part3-FR4', branch='fr4-slip', fr='FR-4',
               title='FR-4 สแกนสลิป + ชุดทดสอบในเบราว์เซอร์',
               pr='ชุดที่ 3: FR-4 สแกนสลิป + ชุดทดสอบในเบราว์เซอร์',
               msgs=['FR-4: ตรรกะอ่านสลิปและคิวสแกน พร้อมเทสต์',
                     'FR-4: Edge Function อ่านสลิปด้วย AI พร้อมเทสต์',
                     'FR-4: บริการสแกนแกลเลอรีและหน้าจอสแกน',
                     'ชุดทดสอบทั้งแอปในเบราว์เซอร์ (E2E) และภาพสลิปทดสอบ'],
               msg5='FR-4: README อธิบายงานของฉัน'),
    'P4': dict(n=4, slug='part4-FR5', branch='fr5-coach', fr='FR-5',
               title='FR-5 โค้ชน้องกล้า + สกิน ภารกิจ ฮาโลวีน',
               pr='ชุดที่ 4: FR-5 โค้ชน้องกล้า + สกิน ภารกิจ ฮาโลวีน',
               msgs=['FR-5: ตรรกะคำแนะนำ อารมณ์ และราคาในคำถาม พร้อมเทสต์',
                     'FR-5: Edge Function โค้ช โควตา AI และเสียงพูด',
                     'FR-5: หน้าจอโค้ชและตัวละครน้องกล้า',
                     'FR-5: ตู้สกิน ภารกิจ และธีมฮาโลวีน'],
               msg5='FR-5: README อธิบายงานของฉัน'),
    'P5': dict(n=5, slug='part5-FR6', branch='fr6-runway', fr='FR-6',
               title='FR-6 Money Runway + โครงแอป ตั้งค่าโปรเจกต์ CI',
               pr='ชุดที่ 5: FR-6 Money Runway + โครงแอปและตั้งค่าโปรเจกต์ (รวมเป็นชุดสุดท้าย)',
               msgs=['FR-6: สูตรเงินพอถึง เป้าหมายออม และชุดเทสต์รวมของแอป',
                     'FR-6: หน้าจอเงินพอถึง เป้าหมาย และกระปุก',
                     'โครงแอป: เมนูหลัก ตั้งค่า เหรียญ และมีอะไรใหม่',
                     'ตั้งค่าโปรเจกต์ CI ไอคอน และเอกสาร'],
               msg5='FR-6: README อธิบายงานของฉัน'),
}

# The FR README(s) each person writes in commit 5, and which of their files belong to that FR.
D, A, S, U, T = 'src/domain/', 'src/app/', 'src/services/', 'src/ui/', 'src/domain/__tests__/'
FR_DOCS = {
    'P1': [('fr/FR-1-transactions/README.md', 'FR-1 Transaction Management · จดรายการ',
            [D+'money.ts', D+'categories.ts', D+'recurring.ts', D+'types.ts', T+'recurring.test.ts', 'src/data/repo.ts',
             'supabase/migrations/20260927000000_init.sql', 'supabase/migrations/20260927000100_harden.sql',
             A+'(tabs)/transactions.tsx', A+'transaction.tsx', U+'TxRow.tsx', U+'inputs.tsx', U+'feedback.tsx'],
            'MindPay-FR1-Transaction-Management.pdf'),
           ('fr/FR-2-overview/README.md', 'FR-2 Overview Dashboard · ภาพรวม',
            [D+'summary.ts', D+'dates.ts', D+'recap.ts', T+'recap.test.ts', 'src/data/AppProvider.tsx',
             A+'(tabs)/index.tsx', A+'recap.tsx', U+'charts.tsx', U+'SpendCalendar.tsx'],
            'MindPay-FR2-Overview-Dashboard.pdf')],
    'P2': [('fr/FR-3-voice/README.md', 'FR-3 Voice Entry · พูดจด',
            [D+'voice.ts', T+'voice.test.ts', S+'speech.ts', S+'speech.web.ts', A+'voice.tsx'],
            'MindPay-FR3-Voice-Entry.pdf')],
    'P3': [('fr/FR-4-slip/README.md', 'FR-4 Automatic Gallery Slip Detection · สแกนสลิป', None,
            'MindPay-FR4-Slip-Detection.pdf')],
    'P4': [('fr/FR-5-coach/README.md', 'FR-5 AI Coach · โค้ชน้องกล้า', None, 'MindPay-FR5-AI-Coach.pdf')],
    'P5': [('fr/FR-6-runway/README.md', 'FR-6 Money Runway · เงินพอถึง',
            [D+'runway.ts', D+'goals.ts', T+'goals.test.ts', A+'(tabs)/runway.tsx', A+'goals.tsx', A+'goal.tsx',
             U+'Slider.tsx', U+'Jar.tsx', U+'art.tsx', 'supabase/migrations/20260929000000_savings_goals.sql'],
            'MindPay-FR6-Money-Runway.pdf')],
}
# Parts whose first three commits are all the FR itself (the fourth is extra shared work).
FR_COMMITS = {'P3': 3, 'P4': 3}
# Names for the shared files a person holds, by commit number.
EXTRA_LABELS = {
    'P1': {},
    'P2': {1: 'ชุดเทสต์ตรวจบั๊กทั้งแอป (TC-79 ถึง TC-89)', 3: 'ระบบบัญชีผู้ใช้', 4: 'Design System'},
    'P3': {4: 'ชุดทดสอบทั้งแอปในเบราว์เซอร์ (E2E)'},
    'P4': {4: 'ตู้สกิน ภารกิจ และธีมฮาโลวีน'},
    'P5': {1: 'ชุดเทสต์รวมของแอป', 3: 'โครงแอป: เมนูหลัก ตั้งค่า เหรียญ และมีอะไรใหม่', 4: 'ตั้งค่าโปรเจกต์ CI ไอคอน และเอกสาร'},
}


def git_show(path):
    return subprocess.run(['git', '-C', REPO, 'show', f'{COMMIT}:{path}'], capture_output=True, check=True).stdout


def replace_once(text, old, new, path):
    assert text.count(old) == 1, f'{path}: expected exactly one {old!r}, found {text.count(old)}'
    return text.replace(old, new)


BASE_EXPR = '/${{ github.event.repository.name }}'

def patch(path, data):
    """Changes that let CI and the web build work under any repository name and owner."""
    if path == '.github/workflows/web.yml':
        t = data.decode()
        t = replace_once(t, '# Publishes the web version of MindPay to GitHub Pages on every push to main:\n'
                            '#   https://2550expo-tech.github.io/Socrates-and-Skeletons-/\n',
                         '# Publishes the web version of MindPay to GitHub Pages on every push to main:\n'
                         '#   https://<owner>.github.io/<repository name>/\n'
                         '# The path comes from the repository name, so it keeps working if the\n'
                         '# repository is renamed or moved to another owner.\n', path)
        assert t.count('EXPO_WEB_BASE_URL: /Socrates-and-Skeletons-') == 2
        t = t.replace('EXPO_WEB_BASE_URL: /Socrates-and-Skeletons-', 'EXPO_WEB_BASE_URL: ' + BASE_EXPR)
        t = replace_once(t, '      - name: Browser tests (sign-in flows)\n        run: node e2e/web-auth.mjs dist e2e-shots\n',
                         '      - name: Browser tests (sign-in flows)\n        env:\n          EXPO_WEB_BASE_URL: ' + BASE_EXPR +
                         '\n        run: node e2e/web-auth.mjs dist e2e-shots\n', path)
        return t.encode()
    if path == '.github/workflows/e2e-webkit.yml':
        t = data.decode()
        t = replace_once(t, 'EXPO_WEB_BASE_URL: /Socrates-and-Skeletons-', 'EXPO_WEB_BASE_URL: ' + BASE_EXPR, path)
        t = replace_once(t, '        env:\n          E2E_BROWSER: webkit\n          E2E_SCHEME: dark\n',
                         '        env:\n          E2E_BROWSER: webkit\n          E2E_SCHEME: dark\n          EXPO_WEB_BASE_URL: ' + BASE_EXPR + '\n', path)
        return t.encode()
    if path == 'e2e/fake-backend.mjs':
        t = data.decode()
        t = replace_once(t, "export const BASE_PATH = '/Socrates-and-Skeletons-';\n",
                         "// GitHub Pages serves the site under the repository name. CI passes it in\n"
                         "// EXPO_WEB_BASE_URL; local runs use the original name, like package.json.\n"
                         "export const BASE_PATH = (process.env.EXPO_WEB_BASE_URL || '/Socrates-and-Skeletons-').replace(/\\/$/, '');\n", path)
        t = replace_once(t, '/** Serve the exported web app (dist) at http://localhost:<port>/Socrates-and-Skeletons-/ like GitHub Pages does. */',
                         '/** Serve the exported web app (dist) at http://localhost:<port><BASE_PATH>/ like GitHub Pages does. */', path)
        return t.encode()
    if path == 'README.md':
        t = data.decode()
        block = (
            '\n> **ที่มาของ repo นี้**\n'
            f'> โค้ดชุดแรกย้ายมาจาก repo เดิมของกลุ่ม [2550expo-tech/Socrates-and-Skeletons-]({OLD_REPO}) '
            f'(commit [`{COMMIT}`]({OLD_REPO}/commit/{COMMIT}) วันที่ 3 ต.ค. 2569) ซึ่งเก็บประวัติการพัฒนาตั้งแต่ 27 ก.ย. 2569\n'
            '> จากนั้นแบ่งเป็น 5 ชุดตาม FR ให้สมาชิกแต่ละคน commit ส่วนที่ตัวเองรับผิดชอบผ่าน Pull Request\n'
            '> ลิงก์ในหัวข้อ "ลองใช้" เป็นเว็บและ APK ที่สร้างจาก repo เดิม ส่วน repo นี้จะมีเว็บของตัวเองที่ '
            '`https://<เจ้าของ repo>.github.io/<ชื่อ repo>/` หลังเปิด GitHub Pages\n'
            '\n## งานของแต่ละคน (โฟลเดอร์ `fr/`)\n\n'
            '| ชุด | งาน | README ของผู้รับผิดชอบ |\n|---|---|---|\n'
            '| 1 | FR-1 จดรายการ · FR-2 ภาพรวม | [FR-1](fr/FR-1-transactions/README.md) · [FR-2](fr/FR-2-overview/README.md) |\n'
            '| 2 | FR-3 พูดจด + ระบบบัญชีผู้ใช้ + Design System | [FR-3](fr/FR-3-voice/README.md) |\n'
            '| 3 | FR-4 สแกนสลิป + ชุดทดสอบในเบราว์เซอร์ | [FR-4](fr/FR-4-slip/README.md) |\n'
            '| 4 | FR-5 โค้ชน้องกล้า + สกิน ภารกิจ ฮาโลวีน | [FR-5](fr/FR-5-coach/README.md) |\n'
            '| 5 | FR-6 Money Runway + โครงแอป ตั้งค่าโปรเจกต์ CI | [FR-6](fr/FR-6-runway/README.md) |\n'
        )
        anchor = 'รายวิชา Introduction to Software Engineering (15031001) · ทีม 13. Socrates and Skeletons\n'
        t = replace_once(t, anchor, anchor + block, path)
        return t.encode()
    return data


def fr_readme(pid, doc_path, title, own, book, part_files):
    meta = META[pid]
    if own is None:  # all files of the FR commits
        own = [f for msg, lst in PARTS[pid]['commits'][:FR_COMMITS[pid]] for f in lst]
    extra_groups = []
    # P1 holds two FRs and no shared files: the other FR's files are not "extra".
    for i, (msg, lst) in enumerate(PARTS[pid]['commits'] if pid != 'P1' else [], start=1):
        rest = [f for f in lst if f not in own]
        if rest:
            extra_groups.append((EXTRA_LABELS[pid][i], rest))
    depth = doc_path.count('/')  # fr/X/README.md -> ../../
    up = '../' * (depth)
    rows = '\n'.join(f'| [`{f}`]({up}{f.replace("(", "%28").replace(")", "%29")}) | ✏️ |' for f in own)
    extra = ''
    if extra_groups:
        extra = '\n### ส่วนกลางที่ฉันดูแลเพิ่ม (ไม่ใช่ของ FR นี้โดยตรง)\n\n' + '\n'.join(
            f'- **{m}** ({len(lst)} ไฟล์): ' + ', '.join(f'`{f}`' for f in lst) for m, lst in extra_groups) + '\n'
    return f"""# {title}

**ผู้รับผิดชอบ:** ✏️ ชื่อ-นามสกุล (@GitHub-username)
**ชุดงาน:** ชุดที่ {meta['n']} · branch `{meta['branch']}`

> ✏️ = ช่องที่ต้องเขียนเองด้วยคำของตัวเอง ลบเครื่องหมาย ✏️ ออกเมื่อเขียนเสร็จ
> อ่านประกอบ: หนังสือ `{book}`

## FR นี้แก้ปัญหาอะไร

✏️ 3–5 บรรทัด: ผู้ใช้เจอปัญหาอะไร และ FR นี้ช่วยได้ยังไง

## Requirement และเกณฑ์ผ่าน (Acceptance criteria)

✏️ เขียนเป็นข้อ ๆ ว่าต้องทำอะไรได้บ้างจึงถือว่า FR นี้ผ่าน

## ไฟล์ที่ฉันรับผิดชอบ

| ไฟล์ | หน้าที่ (เขียนเอง 1 บรรทัด) |
|---|---|
{rows}
{extra}
## ทำงานยังไง

✏️ เล่าตั้งแต่ผู้ใช้กดปุ่ม จนถึงเห็นผลบนจอ ว่าข้อมูลผ่านไฟล์ไหนบ้าง

## การทดสอบ

✏️ เทสต์ไหนตรวจอะไร และรันยังไง (เช่น `npm test`)

## ข้อจำกัดและงานต่อไป

✏️ สิ่งที่ยังไม่ดี และสิ่งที่อยากทำต่อ (ดูไอเดียได้จากบท "ข้อจำกัด" ในหนังสือ)
"""


def main():
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    manifest = {'commit': COMMIT, 'old_repo': OLD_REPO, 'parts': []}
    for pid, part in PARTS.items():
        meta = META[pid]
        root = os.path.join(OUT, meta['slug'])
        commits = []
        for i, ((_, files), msg) in enumerate(zip(part['commits'], meta['msgs']), start=1):
            for f in files:
                dest = os.path.join(root, f'commit-{i}', f)
                os.makedirs(os.path.dirname(dest), exist_ok=True)
                with open(dest, 'wb') as fh:
                    fh.write(patch(f, git_show(f)))
            top = sorted({f.split('/')[0] for f in files})
            commits.append({'n': i, 'message': msg + SUFFIX, 'files': files, 'top': top})
        docs = []
        for doc_path, title, own, book in FR_DOCS[pid]:
            dest = os.path.join(root, 'commit-5', doc_path)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, 'w') as fh:
                fh.write(fr_readme(pid, doc_path, title, own, book, part))
            docs.append(doc_path)
        commits.append({'n': 5, 'message': meta['msg5'], 'files': docs, 'top': ['fr'], 'write_yourself': True})
        manifest['parts'].append({**{k: v for k, v in meta.items() if k not in ('msgs',)}, 'id': pid, 'commits': commits})
    with open(os.path.join(OUT, 'manifest.json'), 'w') as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=1)
    print('built', OUT)


if __name__ == '__main__':
    main()
