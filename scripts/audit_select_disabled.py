import re
from pathlib import Path

results = []
base = Path(".")
for f in list((base / "components").rglob("*.tsx")) + list((base / "app").rglob("*.tsx")):
    try:
        text = f.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        continue
    # Find <Select ... disabled ...> patterns
    matches = re.findall(r'<Select\b[^>]*disabled[^>]*>', text)
    if matches:
        for m in matches:
            results.append((str(f.relative_to(base)), m[:100]))

print(f"Select with disabled prop ({len(results)} occurrences):")
for path, snippet in results:
    print(f"  {path}")
    print(f"    {snippet.strip()}")
