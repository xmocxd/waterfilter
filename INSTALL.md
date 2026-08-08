# Install

## Node via nvm (development)

nvm keeps Node in your home directory, so nothing here needs root.

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.6/install.sh | bash
```

The installer appends its loader to your shell profile (`~/.bashrc`, `~/.zshrc`).
Open a new shell, or source it in the current one:

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
```

Then install the current LTS and make it your default:

```sh
nvm install --lts
nvm alias default 'lts/*'
node -v
```

On Windows, nvm is Linux/macOS only — use WSL, or [nvm-windows](https://github.com/coreybutler/nvm-windows),
which is a separate project with its own command set.

## Dependencies

```sh
npm ci          # npm install if you are changing dependencies
```

## Configuration

Settings come from a `.env` file next to `bot.js`:

```sh
cp .env.example .env
$EDITOR .env
```

| Variable | Meaning |
| --- | --- |
| `DISCORD_TOKEN` | Bot token. The bot exits at startup without it. |

`.env` is gitignored — never commit a real token. A variable that is already set
in the real environment wins over the file, so a service manager can inject the
token instead.

Channels are not configured. On connect the bot lists every text channel it can
post in, and prints them with their IDs. `!id` prints the ID of the channel you
run it in.

## Message Content Intent

Discord made message content privileged in 2022. Without it every `msg.content`
arrives empty and no command ever matches, so the bot asks for it in the
`intents` option in `bot.js`. You have to grant it too:

1. Open the bot in the [developer portal](https://discord.com/developers/applications).
2. Bot -> Privileged Gateway Intents -> enable **Message Content Intent**.
3. Restart the bot.

Discord refuses the connection outright if the bot requests an intent it has not
been granted, so a bot that will not log in with a `Disallowed intents` error is
usually missing this toggle.

## Running it

```sh
node bot.js      # or: npm start
```

`./run.sh` does the same thing, but drops to the `waterfilter` service user
first when passwordless sudo allows it. Use it on a server, use `node bot.js`
locally.

## Node on a server (for systemd)

`systemd-setup.sh` bakes the path of whatever `node` it finds into the unit
file, and the service runs as the `waterfilter` user. A Node installed by nvm
lives under *your* home directory, which that user usually cannot read, so
install Node system-wide instead:

```sh
# Debian/Ubuntu, current LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Then deploy:

```sh
sudo git clone <this repo> /opt/waterfilter
sudo useradd --system --home /opt/waterfilter waterfilter
sudo chown -R waterfilter:waterfilter /opt/waterfilter
cd /opt/waterfilter
sudo -u waterfilter npm ci --omit=dev
sudo -u waterfilter cp .env.example .env
sudo -u waterfilter $EDITOR .env    # add the token
sudo chmod 600 .env
sudo ./systemd-setup.sh
```

`systemd-setup.sh` writes the unit, enables it, starts it, and then follows the
journal. Ctrl+C stops watching the log, it does not stop the bot.

Afterwards:

```sh
sudo systemctl restart waterfilter
sudo systemctl status waterfilter
journalctl -u waterfilter -f
```
