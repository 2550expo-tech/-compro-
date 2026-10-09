#!/bin/bash
export HOME=/home/you
export SHELL=/bin/bash
export LANG=C.UTF-8
export LC_ALL=C.UTF-8
export GIT_CONFIG_SYSTEM=/tmp/claude-0/-home-user--compro-/91a6a49b-6888-5fef-92a8-38563c81afe0/scratchpad/video/demo/gitconfig-system
cd $HOME
exec /tmp/claude-0/-home-user--compro-/91a6a49b-6888-5fef-92a8-38563c81afe0/scratchpad/video/code-server-4.104.0-linux-amd64/bin/code-server --auth none --bind-addr 127.0.0.1:8099 \
  --user-data-dir /tmp/claude-0/-home-user--compro-/91a6a49b-6888-5fef-92a8-38563c81afe0/scratchpad/video/demo/data --extensions-dir /tmp/claude-0/-home-user--compro-/91a6a49b-6888-5fef-92a8-38563c81afe0/scratchpad/video/demo/ext --disable-telemetry --disable-update-check \
  --disable-getting-started-override --ignore-last-opened
