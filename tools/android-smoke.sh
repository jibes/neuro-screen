#!/usr/bin/env bash
# Emulator smoke test of the Android app (CI: .github/workflows/android.yml).
# Starts the app, waits for the home page, opens "Methods" and checks that
#   - the page rendered (text found in the accessibility tree),
#   - the process is still alive,
#   - the web app wrote no error to the console (logcat tag Capacitor/Console).
# Usage: tools/android-smoke.sh <apk>; expects a running device (adb).
set -euo pipefail

APK=$1
PKG=ch.brunodev.neuroscreen
OUT=${SMOKE_OUT:-smoke-out}
mkdir -p "$OUT"

fail() {
  echo "::error::$*"
  adb exec-out screencap -p > "$OUT/screen.png" || true
  adb logcat -d > "$OUT/logcat.txt" || true
  echo "--- Texts in the accessibility tree"
  grep -o -E '(text|content-desc)="[^"]+"' "$OUT/ui.xml" 2>/dev/null | sort | uniq -c | head -40 || true
  echo "--- logcat (app)"
  grep -E "Capacitor|chromium|FATAL" "$OUT/logcat.txt" | tail -40 || true
  exit 1
}

# Centre ("x y") of the node whose text or content-desc equals $1 (case-insensitive)
center_of() {
  adb shell uiautomator dump /sdcard/ui.xml > /dev/null
  adb exec-out cat /sdcard/ui.xml > "$OUT/ui.xml"
  python3 - "$OUT/ui.xml" "$1" <<'PY'
import re, sys, xml.etree.ElementTree as ET
for n in ET.parse(sys.argv[1]).iter("node"):
    if sys.argv[2].lower() in ((n.get("text") or "").strip().lower(), (n.get("content-desc") or "").strip().lower()):
        x1, y1, x2, y2 = map(int, re.findall(r"\d+", n.get("bounds")))
        print((x1 + x2) // 2, (y1 + y2) // 2)
        break
PY
}

wait_for() {
  local xy=""
  for _ in $(seq 30); do
    xy=$(center_of "$1" || true)
    [ -n "$xy" ] && { echo "$xy"; return 0; }
    sleep 2
  done
  return 1
}

adb logcat -c
adb install -r "$APK"
adb shell am start -W -n "$PKG/.MainActivity"

xy=$(wait_for Methods) || fail "Home page did not render (no \"Methods\" link)"
pid=$(adb shell pidof "$PKG")
adb shell input tap $xy
wait_for "Validation status: experimental" > /dev/null || fail "Methods page did not render"

sleep 3
[ "$(adb shell pidof "$PKG")" = "$pid" ] || fail "App process died"

adb logcat -d > "$OUT/logcat.txt"
if grep -E "Capacitor/Console.*(Uncaught|Error|error)" "$OUT/logcat.txt"; then
  fail "Web app error in logcat"
fi
echo "Smoke test ok"
