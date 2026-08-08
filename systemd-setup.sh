#!/usr/bin/env bash
# Set the bot up as a systemd service and follow its log. Run as root from a
# checkout in /opt/waterfilter. Creates the service account, installs
# dependencies, fixes ownership, writes the unit and starts it.
set -euo pipefail

unit=/etc/systemd/system/waterfilter.service
root=/opt/waterfilter
user=waterfilter

if [ "$(id -u)" -ne 0 ]; then
    echo "Run as root: sudo $0" >&2
    exit 1
fi
if [ ! -f "$root/bot.js" ]; then
    echo "No $root/bot.js. Clone the repo to $root first." >&2
    exit 1
fi

# Tear down anything left by an earlier attempt. A unit with a stale ExecStart,
# a failed state that blocks starting, a masking symlink or a forgotten drop-in
# would all survive a plain rewrite of the unit file. None of this has to
# succeed: on a first install there is nothing to remove.
echo "clearing any previous install"
systemctl stop waterfilter 2>/dev/null || true
systemctl disable waterfilter 2>/dev/null || true
systemctl reset-failed waterfilter 2>/dev/null || true
rm -f "$unit"
rm -rf "$unit.d"
systemctl daemon-reload

# nvm keeps node under a home directory that other users cannot read, so prefer
# a system-wide one even when root's own PATH points at nvm.
node=
for candidate in /usr/local/bin/node /usr/bin/node "$(command -v node || true)"; do
    if [ -x "$candidate" ]; then
        node=$candidate
        break
    fi
done
if [ -z "$node" ]; then
    echo "No node found. Install it, see INSTALL.md." >&2
    exit 1
fi

if ! id "$user" >/dev/null 2>&1; then
    shell=/usr/sbin/nologin
    [ -x "$shell" ] || shell=/sbin/nologin
    [ -x "$shell" ] || shell=/bin/false
    groupadd --system "$user" 2>/dev/null || true
    useradd --system --gid "$user" --home-dir "$root" --shell "$shell" "$user"
    echo "created the $user account"
fi
# useradd does not always name the group after the user, and a Group= that does
# not exist stops the unit before it starts.
group=$(id -gn "$user")

# An interpreter the service account cannot reach fails as an opaque 203/EXEC,
# which is what a node under /root looks like from another account. The binary
# is self-contained, so a copy somewhere shared is enough.
copy_node=false
case $node in
    /root/*|/home/*) copy_node=true ;;
esac
if command -v runuser >/dev/null 2>&1 && ! runuser -u "$user" -- test -x "$node"; then
    copy_node=true
fi
if [ "$copy_node" = true ] && [ "$node" != /usr/local/bin/node ]; then
    cp "$node" /usr/local/bin/node
    chmod 755 /usr/local/bin/node
    echo "copied $node to /usr/local/bin/node, $user could not reach the original"
    node=/usr/local/bin/node
fi

# Installed as root, because npm may live under nvm too. The chown below hands
# the result over to the service account.
if [ ! -d "$root/node_modules" ]; then
    if ! command -v npm >/dev/null 2>&1; then
        echo "No npm found, cannot install dependencies. See INSTALL.md." >&2
        exit 1
    fi
    echo "installing dependencies"
    (cd "$root" && npm ci --omit=dev)
fi

if [ ! -f "$root/.env" ] && [ -f "$root/.env.example" ]; then
    cp "$root/.env.example" "$root/.env"
    echo "created $root/.env from .env.example"
fi
# Restart=always would turn a missing token into a crash loop rather than an error.
if ! grep -qE '^[[:space:]]*DISCORD_TOKEN=[^[:space:]]' "$root/.env" 2>/dev/null; then
    echo "No token in $root/.env. Add DISCORD_TOKEN=... and run this again." >&2
    exit 1
fi

chown -R "$user":"$group" "$root"
# The token lives in .env, so keep it off limits to everyone else.
chmod 600 "$root/.env"
echo "chowned $root to $user:$group"

# A hand-started bot keeps its gateway session, so starting the service on top
# of one leaves two bots answering every command. The service itself was stopped
# above, so anything still running was started outside systemd.
strays=$(pgrep -f 'node bot.js' || true)
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
User=$user
Group=$group
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
