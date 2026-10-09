#!/bin/bash
# Fresh demo state: remote with owner + parts 1-4, clean home, clean VS Code data, code-server restarted.
set -e
V=/tmp/claude-0/-home-user--compro-/91a6a49b-6888-5fef-92a8-38563c81afe0/scratchpad/video; SP=/tmp/claude-0/-home-user--compro-/91a6a49b-6888-5fef-92a8-38563c81afe0/scratchpad/split; DEMO=$V/demo
if [ -f "$V/cs.pid" ]; then kill $(cat "$V/cs.pid") 2>/dev/null || true; sleep 1; fi
rm -rf $DEMO /home/you; mkdir -p $DEMO/remote /home/you/Documents /home/you/Downloads $DEMO/data/User $DEMO/ext
cp $V/settings.json $DEMO/data/User/settings.json
git init -q --bare -b main $DEMO/remote/mindpay-team.git
W=$DEMO/work; git clone -q $DEMO/remote/mindpay-team.git $W 2>/dev/null; cd $W
printf '# mindpay-team\n' > README.md; git add README.md
GIT_AUTHOR_DATE="2026-10-10T09:00:00+07:00" GIT_COMMITTER_DATE="2026-10-10T09:00:00+07:00" git -c user.name="เจ้าของ repo" -c user.email=owner@example.com commit -qm 'Initial commit'
python3 - "$SP" "$W" <<'PY'
import sys, subprocess, shutil, os
sp, w = sys.argv[1], sys.argv[2]
sys.path.insert(0, sp); os.chdir(sp)
from docs2 import MSG
slugs = {1: 'part1-FR1-FR2', 2: 'part2-FR3', 3: 'part3-FR4', 4: 'part4-FR5'}
for n in (1, 2, 3, 4):
    shutil.copytree(f'{sp}/out2/{slugs[n]}/files', w, dirs_exist_ok=True)
    subprocess.run(['git', 'add', '-A'], cwd=w, check=True)
    t = f'2026-10-10T{9+n:02d}:30:00+07:00'
    env = {**os.environ, 'GIT_AUTHOR_DATE': t, 'GIT_COMMITTER_DATE': t}
    subprocess.run(['git', '-c', f'user.name=เพื่อนชุด {n}', '-c', f'user.email=part{n}@example.com', 'commit', '-qm', MSG[n]], cwd=w, check=True, env=env)
PY
git push -q origin main 2>/dev/null; cd /; rm -rf $W
cp -a $SP/out2/part5-FR6 /home/you/Downloads/
printf '[url "%s"]\n\tinsteadOf = https://github.com/your-team/mindpay-team.git\n' $DEMO/remote/mindpay-team.git > $DEMO/gitconfig-system
printf "PS1='\\[\\e[1;36m\\]\\W\\[\\e[0m\\] %% '\n" > /home/you/.bashrc
cp /home/you/.bashrc /home/you/.bash_profile
nohup $V/start-cs.sh > $V/cs.log 2>&1 &
echo $! > "$V/cs.pid"
for i in $(seq 1 40); do curl -s -o /dev/null http://127.0.0.1:8099/healthz && break; sleep 0.5; done
echo reset-done
