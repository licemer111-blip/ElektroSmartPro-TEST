import re
from pathlib import Path

results = []
base = Path(".")
for f in list((base / "components").rglob("*.tsx")) + list((base / "app").rglob("*.tsx")):
    try:
        text = f.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        continue
    if "TooltipTrigger" not in text or "asChild" not in text:
        continue
    blocks = re.findall(r"<TooltipTrigger asChild>(.*?)</TooltipTrigger>", text, re.DOTALL)
    for block in blocks:
        has_disabled = "disabled" in block
        has_dialog = "<Dialog" in text or "DialogTrigger" in text
        preview = block[:80].replace("\n", " ").strip()
        flags = []
        if has_disabled:
            flags.append("DISABLED")
        if has_dialog:
            flags.append("DIALOG")
        results.append((flags, f.name, str(f), preview))

print(f"Files with TooltipTrigger asChild ({len(results)} blocks):")
for flags, name, path, preview in results:
    tag = "|".join(flags) if flags else "OK"
    print(f"  [{tag}] {name}: {preview[:60]}")
