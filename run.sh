#!/usr/bin/env bash
# Loads nvm then starts the game server
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

cd "$(dirname "$0")"

# Install deps if needed
[ -d node_modules ] || npm install

exec node_modules/.bin/tsx server.ts
