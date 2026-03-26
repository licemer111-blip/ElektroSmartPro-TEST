"""
Deep audit: JSON types vs interfaces, unused imports in wrapper files,
region multiplier chain, VAT formula correctness
"""
import re
import json
from pathlib import Path

def r(f):
    try: return Path(f).read_text(encoding="utf-8", errors="ignore")
    except: return ""

# ── 1. JSON keys vs TypeScript interfaces ─────────────────────────────────────
print("=" * 60)
print("JSON INTEGRITY — key presence check")
print("=" * 60)

# quick-estimate-rules.json expected keys from lib/quick-estimate-config.ts usage
qe_json = json.loads(r("lib/data/json/quick-estimate-rules.json"))
qe_ts = r("lib/quick-estimate-config.ts")
# Find all keys accessed like quickEstimateRules.KEY
accessed_keys = re.findall(r'quickEstimateRules\.(\w+)', qe_ts)
accessed_keys += re.findall(r'rules\.(\w+)', qe_ts)
for key in set(accessed_keys):
    if key and key not in qe_json:
        print(f"  MISSING in JSON: {key}")
    elif key:
        print(f"  OK: {key}")

# catalog-matrix.json: check all exports from catalog-matrix.ts are in JSON
cm_json = json.loads(r("lib/data/json/catalog-matrix.json"))
cm_ts = r("lib/data/catalog-matrix.ts")
exported_consts = re.findall(r'export const (\w+)', cm_ts)
imports_from_json = re.findall(r'"(\w+)"', cm_ts)
print(f"\n  catalog-matrix.ts exports: {len(exported_consts)} constants")
print(f"  catalog-matrix.json keys: {len(cm_json)} keys")
missing = [c for c in exported_consts if c not in cm_json]
if missing:
    for m in missing:
        print(f"  MISSING in JSON: {m}")
else:
    print(f"  OK all {len(exported_consts)} exports present in JSON")

# ── 2. Unused imports in wrapper/thin files ───────────────────────────────────
print()
print("=" * 60)
print("UNUSED IMPORTS in thin wrapper files")
print("=" * 60)
wrapper_files = [
    "lib/data/catalog-matrix.ts",
    "lib/data/market-data.ts",
    "lib/data/din-modules-catalog.ts",
    "lib/quick-estimate-config.ts",
]
for path in wrapper_files:
    text = r(path)
    imports = re.findall(r'^import\s+\{([^}]+)\}', text, re.MULTILINE)
    issues = []
    for imp_group in imports:
        for name in re.split(r'[,\s]+', imp_group):
            name = name.strip()
            if not name:
                continue
            # Count usages (excluding the import line itself)
            usages = len(re.findall(r'\b' + re.escape(name) + r'\b', text))
            if usages <= 1:  # Only in import
                issues.append(name)
    if issues:
        print(f"  WARN {Path(path).name}: possibly unused: {', '.join(issues)}")
    else:
        print(f"  OK {Path(path).name}")

# ── 3. VAT formula correctness ────────────────────────────────────────────────
print()
print("=" * 60)
print("VAT FORMULA — correctness audit")
print("=" * 60)
# Check project-summary.tsx (main calculation)
text = r("components/project/project-summary.tsx")
lines = text.splitlines()
vat_lines = [(i+1, l.strip()) for i, l in enumerate(lines) if 'vat' in l.lower() and not l.strip().startswith('//')]
for lineno, line in vat_lines:
    print(f"  L{lineno}: {line[:100]}")

# Check offer/[token] actions
print()
print("  -- offer/[token]/actions.ts VAT --")
text = r("app/offer/[token]/actions.ts")
lines = text.splitlines()
vat_lines = [(i+1, l.strip()) for i, l in enumerate(lines) if 'vat' in l.lower() and not l.strip().startswith('//')]
for lineno, line in vat_lines[:8]:
    print(f"  L{lineno}: {line[:100]}")

# ── 4. Region multiplier chain audit ─────────────────────────────────────────
print()
print("=" * 60)
print("REGION MULTIPLIER CHAIN")
print("=" * 60)
# Check StepRegionSelection passes price_modifier
text = r("components/modals/_parts/StepRegionSelection.tsx")
has_modifier = "price_modifier" in text
has_region_change = "onRegionChange" in text
print(f"  StepRegionSelection: price_modifier shown={has_modifier}, onRegionChange={has_region_change}")

# Check create-project-modal passes region to server
modal_text = r("components/modals/create-project-modal.tsx")
# or _parts thereof
for f in Path("components/modals").rglob("*.tsx"):
    t = r(str(f))
    if "region_id" in t or "regionId" in t:
        print(f"  {f.name}: has region_id")

# Check project-meta.ts applies regionModifier
text = r("app/dashboard/projects/[id]/_actions/project-meta.ts")
lines = text.splitlines()
mod_lines = [(i+1, l.strip()) for i, l in enumerate(lines) if 'modifier' in l.lower() or 'region' in l.lower()]
print(f"  project-meta.ts region lines: {len(mod_lines)}")
for lineno, line in mod_lines[:5]:
    print(f"    L{lineno}: {line[:100]}")

# ── 5. Check _actions/index.ts barrel files ───────────────────────────────────
print()
print("=" * 60)
print("BARREL INDEX.TS FILES")
print("=" * 60)
for f in sorted(Path("app").rglob("_actions/index.ts")):
    text = r(str(f))
    has_server = '"use server"' in text or "'use server'" in text
    exports = re.findall(r'export \* from ["\'](.+)["\']', text)
    print(f"  {f}: use_server={has_server}, exports={exports}")

print()
print("=" * 60)
print("AUDIT COMPLETE")
print("=" * 60)
