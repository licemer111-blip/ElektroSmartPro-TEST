"""
Find all usages of Radix Slot-based components (Button, Switch, Toggle, ToggleGroup, Tabs, etc.)
that receive a `disabled` prop which changes dynamically — these can cause setRef loops in React 19.
Focus on components imported from @/components/ui/* that wrap Radix primitives.
"""
import re
from pathlib import Path

# Radix-backed UI components that use Slot/asChild internally
RADIX_COMPONENTS = {
    "Switch", "Toggle", "ToggleGroup", "TabsTrigger",
    "Checkbox", "RadioGroupItem", "Slider",
}

results = []
base = Path(".")
search_dirs = [base / "components" / "project", base / "components" / "project" / "_parts"]

for search_dir in search_dirs:
    if not search_dir.exists():
        continue
    for f in search_dir.rglob("*.tsx"):
        try:
            text = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        
        for comp in RADIX_COMPONENTS:
            # Find <CompName ... disabled ... > patterns
            pattern = rf'<{comp}\b[^>]*\bdisabled\b[^>]*/?>|<{comp}\b[^>]*\bdisabled\b'
            matches = re.findall(pattern, text, re.DOTALL)
            for m in matches:
                snippet = m.replace('\n', ' ').strip()[:120]
                results.append((comp, str(f.relative_to(base)), snippet))

print(f"Radix components with disabled prop ({len(results)} occurrences):")
for comp, path, snippet in results:
    print(f"\n  [{comp}] {path}")
    print(f"    {snippet}")
