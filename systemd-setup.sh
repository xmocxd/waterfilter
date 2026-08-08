#!/usr/bin/env bash
# Install the bot as a systemd service and follow its log. Run once, as root.
set -euo pipefail

unit=/etc/systemd/system/waterfilter.service
root=/opt/waterfilter

if [ "$(id -u)" -ne 0 ]; then
    echo "Run as root: sudo $0" >&2
    exit 1
fi

# Restart=always turns any of these into a crash loop rather than an error.
if ! id waterfilter >/dev/null 2>&1; then
    echo "No waterfilter user. Create one: useradd --system --home $root waterfilter" >&2
    exit 1
fi
node=$(command -v node || true)
if [ -z "$node" ]; then
    echo "node is not on PATH. Install it system-wide, see INSTALL.md." >&2
    exit 1
fi
if [ ! -d "$root/node_modules" ]; then
    echo "No dependencies at $root/node_modules. Run: npm ci --omit=dev" >&2
    exit 1
fi
if [ ! -f "$root/.env" ]; then
    echo "No $root/.env. Copy .env.example to .env and add the bot token." >&2
    exit 1
fi

# A hand-started bot keeps its gateway session, so starting the service on top
# of one leaves two bots answering every command.
running=$(systemctl show -p MainPID --value waterfilter 2>/dev/null || echo 0)
strays=$(pgrep -f 'node bot.js' | grep -vx "${running:-0}" || true)
if [ -n "$strays" ]; then
    echo "The bot is already running outside systemd:" >&2
    ps -o pid=,user=,args= -p "$(echo "$strays" | tr '\n' ',')" >&2
    echo "Stop it first: kill $(echo "$strays" | tr '\n' ' ')" >&2
    exit 1
fi

cat > "$unit" <<EOF
[Unit]
Description=waterfilter Discord bot
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=waterfilter
Group=waterfilter
WorkingDirectory=$root
ExecStart=$node $root/bot.js
Restart=always
RestartSec=10
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

echo "wrote $unit"

systemctl daemon-reload
# Neither failure should stop the script: a bot that will not start says why in
# the journal below, and status exits non-zero whenever the unit is not active.
systemctl enable --now waterfilter || echo "start failed, see the log below" >&2
systemctl status waterfilter --no-pager || true

echo
echo "Following the log. Ctrl+C stops watching, it does not stop the bot."
exec journalctl -u waterfilter -f
