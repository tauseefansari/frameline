#!/bin/sh
set -eu

PIPER_BIN="${PIPER_BIN:-/app/models/piper/piper}"
if [ ! -x "$PIPER_BIN" ]; then
  echo "error: Piper binary not found at $PIPER_BIN — image build should run setup-models --skip-ollama" >&2
  exit 1
fi

exec node server.js
