"""File -> part/commit mapping for splitting MindPay (commit 646b485) into 5 parts."""
import subprocess, sys, json, os
REPO = '/home/user/2550expo-tech/socrates-and-skeletons-'
D, A, S, U, T = 'src/domain/', 'src/app/', 'src/services/', 'src/ui/', 'src/domain/__tests__/'

PARTS = {
 'P1': {'title': 'FR-1 จดรายการ + FR-2 ภาพรวม', 'branch': 'fr1-fr2-transactions-overview', 'commits': [
   ('FR-1: ตรรกะเงินและหมวดหมู่ พร้อมเทสต์', [D+'money.ts', D+'categories.ts', D+'recurring.ts', D+'types.ts', T+'recurring.test.ts']),
   ('FR-2: ตรรกะสรุปยอด วันที่ และสรุปเดือน พร้อมเทสต์', [D+'summary.ts', D+'dates.ts', D+'recap.ts', T+'recap.test.ts']),
   ('FR-1/FR-2: ชั้นข้อมูลและตารางฐานข้อมูล', ['src/data/repo.ts', 'src/data/AppProvider.tsx', 'supabase/migrations/20260927000000_init.sql', 'supabase/migrations/20260927000100_harden.sql']),
   ('FR-1/FR-2: หน้าจอรายการ หน้าหลัก และสรุปเดือน', [A+'(tabs)/transactions.tsx', A+'transaction.tsx', A+'(tabs)/index.tsx', A+'recap.tsx', U+'TxRow.tsx', U+'inputs.tsx', U+'feedback.tsx', U+'charts.tsx', U+'SpendCalendar.tsx']),
 ]},
 'P2': {'title': 'FR-3 พูดจด + ระบบบัญชีผู้ใช้ + Design System', 'branch': 'fr3-voice', 'commits': [
   ('FR-3: ตรรกะแปลงคำพูดเป็นรายการ พร้อมเทสต์', [D+'voice.ts', T+'voice.test.ts', T+'audit.test.ts']),
   ('FR-3: บริการฟังเสียงและหน้าจอพูดจด', [S+'speech.ts', S+'speech.web.ts', A+'voice.tsx']),
   ('ระบบบัญชีผู้ใช้: สมัคร เข้าสู่ระบบ ลิงก์อีเมล', [D+'auth.ts', T+'auth.test.ts', 'src/data/authLinks.ts', 'src/data/supabase.ts', 'src/data/storage.ts', 'src/data/storage.web.ts', 'src/data/sessionStorageSetup.ts', 'src/data/sessionStorageSetup.web.ts', A+'welcome.tsx', A+'onboarding.tsx', U+'AuthNotice.tsx', U+'StepDots.tsx', U+'LaunchIntro.tsx', 'docs/SUPABASE_AUTH_SETUP.md']),
   ('Design System: ธีม สี ปุ่ม และเอฟเฟกต์', [U+'theme.ts', U+'themeMode.ts', U+'components.tsx', U+'effects.tsx', U+'motion.ts', U+'nav.ts', U+'ThemePicker.tsx', U+'__tests__/theme.test.ts', 'docs/DESIGN_SYSTEM.md']),
 ]},
 'P3': {'title': 'FR-4 สแกนสลิป + ทดสอบในเบราว์เซอร์ (E2E)', 'branch': 'fr4-slip', 'commits': [
   ('FR-4: ตรรกะอ่านสลิปและคิวสแกน พร้อมเทสต์', [D+'slip.ts', D+'slipNames.ts', D+'scanQueue.ts', D+'autoScan.ts', T+'autoScan.test.ts', T+'slipAccuracy.test.ts']),
   ('FR-4: Edge Function อ่านสลิปด้วย AI พร้อมเทสต์', ['supabase/functions/parse-slip/index.ts', 'supabase/functions/_shared/helpers.ts', 'supabase/functions/_shared/common.ts', 'supabase/functions/_shared/__tests__/helpers.test.ts']),
   ('FR-4: บริการสแกนแกลเลอรีและหน้าจอสแกน', [S+'AutoScanProvider.tsx', S+'useSlipScanner.ts', S+'slips.ts', S+'processSlip.ts', S+'gallery.ts', S+'gallery.web.ts', S+'myNames.ts', A+'scan.tsx', A+'drafts.tsx', U+'AutoScanBanner.tsx', U+'ScannerStage.tsx', U+'WaitNotice.tsx', U+'PeriodSummary.tsx']),
   ('ทดสอบทั้งแอปในเบราว์เซอร์ (E2E) และภาพสลิปทดสอบ', ['e2e/web-auth.mjs', 'e2e/make-slip-fixture.py'] + ['e2e/fixtures/'+f for f in ['photo-1.jpg','photo-2.jpg','photo-3.jpg','slip-qr.jpg','slip-qr-2.jpg','slip-qr-3.jpg','wallet-qr.jpg']]),
 ]},
 'P4': {'title': 'FR-5 โค้ชน้องกล้า + สกิน ภารกิจ ฮาโลวีน', 'branch': 'fr5-coach', 'commits': [
   ('FR-5: ตรรกะคำแนะนำ อารมณ์ และราคาในคำถาม พร้อมเทสต์', [D+'insights.ts', D+'buddy.ts', D+'klaTalk.ts', D+'price.ts', T+'buddy.test.ts', T+'klaTalk.test.ts']),
   ('FR-5: Edge Function โค้ช โควตา AI และเสียงพูด', ['supabase/functions/coach/index.ts', 'supabase/migrations/20261001000000_atomic_ai_quota.sql', S+'coach.ts', S+'tts.ts', S+'tts.web.ts']),
   ('FR-5: หน้าจอโค้ชและตัวละครน้องกล้า', [A+'(tabs)/coach.tsx', U+'kla/KlaStage.tsx', U+'kla/KlaBackdrop.tsx', U+'kla/KlaPicture.tsx', U+'kla/art.tsx', U+'kla/useKlaTalk.ts', U+'Buddy.tsx']),
   ('FR-5: ตู้สกิน ภารกิจ และธีมฮาโลวีน', [D+'skins.ts', D+'missions.ts', D+'halloween.ts', T+'skins.test.ts', T+'missions.test.ts', T+'halloween.test.ts', S+'kla.ts', A+'skins.tsx', U+'halloween.tsx', 'scripts/kla-icons/finish.py', 'scripts/kla-icons/make.mjs', 'scripts/kla-icons/pictures.tsx', 'scripts/kla-icons/react-dom-server.d.ts', 'scripts/kla-icons/svg-shim.tsx']),
 ]},
 'P5': {'title': 'FR-6 Money Runway + โครงแอป ตั้งค่าโปรเจกต์ CI', 'branch': 'fr6-runway', 'commits': [
   ('FR-6: สูตรเงินพอถึงและเป้าหมายออม พร้อมเทสต์', [D+'runway.ts', D+'goals.ts', T+'goals.test.ts', T+'domain.test.ts']),
   ('FR-6: หน้าจอเงินพอถึง เป้าหมาย และกระปุก', [A+'(tabs)/runway.tsx', A+'goals.tsx', A+'goal.tsx', U+'Slider.tsx', U+'Jar.tsx', U+'art.tsx', 'supabase/migrations/20260929000000_savings_goals.sql']),
   ('โครงแอป: เมนูหลัก ตั้งค่า เหรียญ และมีอะไรใหม่', [A+'_layout.tsx', A+'(tabs)/_layout.tsx', A+'settings.tsx', A+'whatsnew.tsx', A+'achievements.tsx', S+'whatsNew.ts', S+'useAchievements.ts', 'src/data/prefs.ts', D+'sample.ts', D+'achievements.ts', T+'sample.test.ts', T+'achievements.test.ts', U+'UpdateBanner.tsx', U+'Medal.tsx']),
   ('ตั้งค่าโปรเจกต์ CI ไอคอน และเอกสาร', ['package.json', 'package-lock.json', 'tsconfig.json', 'eslint.config.js', 'vitest.config.ts', 'app.json', 'app.config.js', 'eas.json', '.gitignore', '.env.example', '.claude/settings.json', 'AGENTS.md', 'CLAUDE.md', 'README.md', '.github/workflows/web.yml', '.github/workflows/e2e-webkit.yml', '.github/workflows/android-apk.yml', '.github/workflows/eas-update.yml', 'scripts/make_icons.py', 'scripts/theme-shot.mjs', 'scripts/web-home-screen.mjs', 'e2e/demo-video.mjs', 'e2e/fake-backend.mjs', 'docs/AI_USAGE_LOG.md', 'docs/TRACEABILITY.md'] + ['assets/'+f for f in ['android-icon-background.png','android-icon-foreground.png','android-icon-monochrome.png','favicon.png','icon.png','splash-icon.png','web/apple-touch-icon.png','web/icon-192.png','web/icon-512.png']]),
 ]},
}

def tracked():
    out = subprocess.run(['git', '-C', REPO, 'ls-files'], capture_output=True, text=True, check=True).stdout
    return [l for l in out.splitlines() if l]

def lines(path):
    p = os.path.join(REPO, path)
    try:
        with open(p, 'rb') as f: data = f.read()
    except FileNotFoundError: return None
    if b'\0' in data[:8000]: return 0  # binary
    return data.count(b'\n')

if __name__ == '__main__':
    files = tracked()
    seen = {}
    for pid, part in PARTS.items():
        for msg, lst in part['commits']:
            for f in lst:
                if f in seen: print('DUPLICATE', f, seen[f], pid)
                seen[f] = pid
    missing = [f for f in files if f not in seen]
    extra = [f for f in seen if f not in files]
    print('tracked', len(files), 'assigned', len(seen), 'missing', missing, 'extra', extra)
    for pid, part in PARTS.items():
        tot = 0; nfiles = 0
        rows = []
        for msg, lst in part['commits']:
            l = sum((lines(f) or 0) for f in lst if f != 'package-lock.json')
            tot += l; nfiles += len(lst)
            rows.append(f'      {len(lst):3d} files {l:5d} lines  {msg}')
        print(f'{pid} {part["title"]}: {nfiles} files, {tot} lines (excl. package-lock)')
        print('\n'.join(rows))
