import re
from pathlib import Path

dirs = ["app", "components", "lib", "hooks", "server", "utils"]
results = {}

for d in dirs:
    for f in Path(d).rglob("*.ts*"):
        if ".d.ts" in f.name:
            continue
        try:
            text = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        hits = []
        for i, line in enumerate(text.splitlines(), 1):
            stripped = line.strip()
            if stripped.startswith("//"):
                continue
            if "console.error(" in line:
                hits.append(i)
        if hits:
            has_logger = (
                "from \"@/lib/logger\"" in text
                or "from '@/lib/logger'" in text
                or "{ logger }" in text
            )
            results[str(f)] = {"count": len(hits), "has_logger": has_logger}

print("=== Files with console.error but NO logger import ===")
no_logger = [(k, v) for k, v in results.items() if not v["has_logger"]]
for path, info in sorted(no_logger, key=lambda x: -x[1]["count"])[:25]:
    print(f"  {info['count']}x  {path}")
print(f"Total files: {len(no_logger)}")

print()
print("=== Files with console.error AND logger (already consistent) ===")
has_log = [(k, v) for k, v in results.items() if v["has_logger"]]
for path, info in sorted(has_log, key=lambda x: -x[1]["count"])[:15]:
    print(f"  {info['count']}x  {path}")
print(f"Total files: {len(has_log)}")
