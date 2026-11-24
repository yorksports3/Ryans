#!/usr/bin/env bash
# Writes the App Store Connect API key from $ASC_KEY_P8 to the path given as $1,
# tidying common paste problems (Windows line endings, quotes, a base64-encoded
# file, missing or reflowed BEGIN/END lines), then checks it's a valid key.
set -euo pipefail
out="$1"
raw="${ASC_KEY_P8//$'\r'/}"
raw="$(printf '%s' "$raw" | sed -e "s/^[[:space:]\"']*//" -e "s/[[:space:]\"']*\$//")"
had_header=yes
if ! grep -q "BEGIN PRIVATE KEY" <<<"$raw"; then
  decoded="$(printf '%s' "$raw" | base64 --decode 2>/dev/null || true)"
  if grep -q "BEGIN PRIVATE KEY" <<<"$decoded"; then raw="$decoded"; else had_header=no; fi
fi
body="$(printf '%s' "$raw" | sed -e 's/-----BEGIN PRIVATE KEY-----//' -e 's/-----END PRIVATE KEY-----//' | tr -d ' \t\n\r"'"'")"
umask 077
{ echo "-----BEGIN PRIVATE KEY-----"; printf '%s' "$body" | fold -w 64; echo; echo "-----END PRIVATE KEY-----"; } > "$out"
if ! openssl pkey -in "$out" -noout >/dev/null 2>&1; then
  echo "::error::The ASC_KEY_P8 secret isn't a readable private key (header found: $had_header, key text length: ${#body}; an Apple .p8 key is usually about 184 characters long without its BEGIN/END lines). Paste the whole AuthKey_XXXX.p8 file, including the BEGIN and END lines."
  exit 1
fi
echo "API key looks valid."
