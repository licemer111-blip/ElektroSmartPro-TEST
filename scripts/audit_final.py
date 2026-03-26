import re
from pathlib import Path

root = Path(".")
dirs = ["app", "components", "lib", "hooks", "server", "utils"]

console_log_warn = []
console_error_debug = []
todo_fixme = []
use_server_in_barrel = []
duplicate_exports = {}
all_exports = {}

for d in dirs:
    for f in Path(d).rglob("*.ts*"):
        if ".d.ts" in f.name:
            continue
        try:
            text = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        lines = text.splitlines()
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            if stripped.startswith("//"):
                continue
            if re.search(r"console\.(log|warn)\(", line):
                console_log_warn.append(f"  {f}:{i}: {stripped[:90]}")
            if re.search(r'console\.error\(.*["\`](❌|⚠️|🔥|Debug)', stripped):
                console_error_debug.append(f"  {f}:{i}: {stripped[:90]}")
            if re.search(r"\b(TODO|FIXME|HACK|XXX)\b", stripped) and "/*" not in stripped[:3]:
                todo_fixme.append(f"  {f}:{i}: {stripped[:80]}")
        # Check use server in barrel/index files
        if f.name == "index.ts" and ('"use server"' in text or "'use server'" in text):
            use_server_in_barrel.append(f"  {f}")

# Check duplicate exports in _actions
actions_dir = Path("app/dashboard/projects/[id]/_actions")
for f in sorted(actions_dir.glob("*.ts")):
    if f.name == "index.ts":
        continue
    try:
        text = f.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        continue
    fns = re.findall(r"^export (?:async )?function (\w+)", text, re.MULTILINE)
    for fn in fns:
        if fn in all_exports:
            duplicate_exports[fn] = (all_exports[fn], f.name)
        else:
            all_exports[fn] = f.name

print("=" * 60)
print("ФИНАЛЬНЫЙ АУДИТ ElektroSmart PRO")
print("=" * 60)

print(f"\n[1] console.log/warn в production коде: {len(console_log_warn)}")
for h in console_log_warn:
    print(h)

print(f"\n[2] console.error с emoji/Debug (возможный debug-мусор): {len(console_error_debug)}")
for h in console_error_debug[:20]:
    print(h)

print(f"\n[3] TODO / FIXME / HACK: {len(todo_fixme)}")
for h in todo_fixme[:20]:
    print(h)

print(f"\n[4] 'use server' в barrel/index файлах: {len(use_server_in_barrel)}")
for h in use_server_in_barrel:
    print(h)

print(f"\n[5] Дублирующиеся экспорты в _actions/: {len(duplicate_exports)}")
for fn, (a, b) in duplicate_exports.items():
    print(f"  {fn}: {a} + {b}")

print(f"\n[6] Большие файлы (>500 строк) — кандидаты на разбивку:")
big = []
for d in dirs:
    for f in Path(d).rglob("*.ts*"):
        if ".d.ts" in f.name:
            continue
        try:
            lines = len(f.read_text(encoding="utf-8", errors="ignore").splitlines())
        except Exception:
            continue
        if lines > 500:
            big.append((lines, str(f)))
for lines, path in sorted(big, reverse=True)[:20]:
    note = ""
    if "polityka" in path or "regulamin" in path or "blog" in path or "o-nas" in path:
        note = " [static page — OK]"
    elif "page.tsx" in path and "tools" in path:
        note = " [calculator page — OK]"
    print(f"  {lines}L  {path}{note}")

print("\n" + "=" * 60)
print("ИТОГ:")
issues = len(console_log_warn) + len(console_error_debug) + len(use_server_in_barrel) + len(duplicate_exports)
print(f"  Критических проблем: {issues}")
print(f"  TODO/FIXME: {len(todo_fixme)}")
print("=" * 60)
