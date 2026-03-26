"""
Full project scan for all Radix-backed components with `disabled` prop.
"""
import re
from pathlib import Path

RADIX_COMPONENTS = [
    "Switch", "Checkbox", "RadioGroupItem", "Slider",
    "Toggle", "ToggleGroupItem", "TabsTrigger",
    "AccordionTrigger", "CollapsibleTrigger",
    "NavigationMenuTrigger", "ContextMenuTrigger",
    "DropdownMenuTrigger", "MenubarTrigger",
]

results = []
base = Path(".")
for f in list((base / "components").rglob("*.tsx")) + list((base / "app").rglob("*.tsx")):
    try:
        text = f.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        continue
    for comp in RADIX_COMPONENTS:
        # Match opening tag that contains disabled
        for m in re.finditer(rf'<{comp}\b([^>]{{0,400}}?)>', text, re.DOTALL):
            tag = m.group(0)
            if 'disabled' in tag:
                snippet = tag.replace('\n', ' ').strip()[:120]
                results.append((comp, str(f.relative_to(base)), snippet))

print(f"Radix components with disabled prop ({len(results)} occurrences):\n")
for comp, path, snippet in results:
    print(f"  [{comp}] {path}")
    print(f"    {snippet}\n")
