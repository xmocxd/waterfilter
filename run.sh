#!/usr/bin/env bash

if sudo -n -u waterfilter true 2>/dev/null; then
    exec sudo -u waterfilter node bot.js
fi

exec node bot.js
