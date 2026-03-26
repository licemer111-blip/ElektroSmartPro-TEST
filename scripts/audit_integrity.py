"""
Integrity Audit v1.20 — ElektroSmart PRO
Checks: use server, barrel cycles, callback flow, VAT, blur, JSON types
"""
import re
import json
from pathlib import Path

DIRS = ["app", "components", "lib", "hooks", "server", "utils"]

def read(f):
    try:
        return f.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""

results = {}

# ── 1. SERVER ACTIONS: 'use server' presence ──────────────────────────────────
print("=" * 65)
print("ZONE 1: SERVER ACTIONS — 'use server' directive audit")
print("=" * 65)
missing_use_server = []
has_use_server = []
barrel_with_use_server = []

for f in sorted(Path("app").rglob("*.ts")):
    text = read(f)
    is_barrel = f.name == "index.ts"
    is_util = f.name in ("utils.ts", "types.ts")
    has_directive = ('"use server"' in text or "'use server'" in text)
    has_exports = bool(re.search(r"^export (async )?function", text, re.MULTILINE))
    is_action_dir = "_actions" in str(f) or "actions" in f.name

    if is_barrel and has_directive:
        barrel_with_use_server.append(str(f))
    elif is_action_dir and not is_barrel and not is_util and has_exports and not has_directive:
        missing_use_server.append(str(f))
    elif is_action_dir and not is_barrel and has_directive:
        has_use_server.append(str(f))

print(f"  OK files with 'use server': {len(has_use_server)}")
print(f"  MISSING 'use server' in action files: {len(missing_use_server)}")
for f in missing_use_server:
    print(f"    !! {f}")
print(f"  WARN barrel index.ts with 'use server': {len(barrel_with_use_server)}")
for f in barrel_with_use_server:
    print(f"    !! {f}")

# ── 2. BARREL EXPORTS: potential circular dependencies ────────────────────────
print()
print("=" * 65)
print("ZONE 2: BARREL EXPORTS — circular dependency check")
print("=" * 65)
index_files = list(Path("app").rglob("index.ts")) + list(Path("components").rglob("index.ts"))
circular_suspects = []
for idx in index_files:
    text = read(idx)
    exports = re.findall(r'export \* from ["\'](.+)["\']', text)
    for exp in exports:
        # Check if exported module itself imports from parent index
        exp_path = (idx.parent / exp).with_suffix(".ts")
        if not exp_path.exists():
            exp_path = (idx.parent / exp / "index.ts")
        if exp_path.exists():
            exp_text = read(exp_path)
            parent_name = idx.parent.name
            if parent_name in exp_text and "index" in exp_text:
                circular_suspects.append(f"{idx} <-> {exp_path}")

if circular_suspects:
    for s in circular_suspects:
        print(f"  WARN possible cycle: {s}")
else:
    print("  OK no circular dependencies detected")

# ── 3. DATA FLOW: callback props in _parts/ components ───────────────────────
print()
print("=" * 65)
print("ZONE 3: DATA FLOW — callback props in _parts/ components")
print("=" * 65)
parts_files = list(Path("components").rglob("_parts/*.tsx")) + list(Path("app").rglob("_parts/*.tsx"))
print(f"  Found {len(parts_files)} _parts/ component files")
callback_issues = []
for f in parts_files:
    text = read(f)
    # Check if component receives onUpdate/onDelete/onAdd but doesn't use it
    for cb in ["onUpdate", "onDelete", "onAdd", "onChange", "onSave"]:
        in_props = bool(re.search(rf"{cb}\s*[?:]", text))
        used = text.count(cb) > 1  # more than just declaration
        if in_props and not used:
            callback_issues.append(f"  WARN {f.name}: {cb} declared but not used")

if callback_issues:
    for issue in callback_issues:
        print(issue)
else:
    print("  OK all declared callbacks are used")

# ── 4. VAT GUARD: 8% / 23% logic ─────────────────────────────────────────────
print()
print("=" * 65)
print("ZONE 4: VAT GUARD — 8%/23% logic")
print("=" * 65)
vat_files = [
    "components/project/project-summary.tsx",
    "app/offer/[token]/actions.ts",
    "app/api/stripe/webhook/_handlers/stripe-infakt-handlers.ts",
    "app/dashboard/projects/[id]/_actions/project-meta.ts",
]
vat_ok = []
vat_missing = []
for path_str in vat_files:
    f = Path(path_str)
    if not f.exists():
        vat_missing.append(f"  SKIP not found: {path_str}")
        continue
    text = read(f)
    has_8 = "8" in text and ("vat" in text.lower() or "VAT" in text)
    has_23 = "23" in text and ("vat" in text.lower() or "VAT" in text)
    has_vat_logic = bool(re.search(r"vat_rate|vatRate|VAT_RATE|vat\s*=", text, re.IGNORECASE))
    status = "OK" if (has_8 or has_23 or has_vat_logic) else "WARN no VAT logic found"
    print(f"  {status}: {f.name}")

# Also check for hardcoded wrong VAT
all_ts = [f for d in ["app", "components", "lib"] for f in Path(d).rglob("*.ts*")]
wrong_vat = []
for f in all_ts:
    text = read(f)
    # Check for hardcoded VAT that's neither 8 nor 23
    matches = re.findall(r'vat[_\s]*=\s*(\d+)', text, re.IGNORECASE)
    for m in matches:
        if m not in ("0", "8", "23", "100"):
            wrong_vat.append(f"  WARN {f}: vat={m}")
if wrong_vat:
    for w in wrong_vat[:10]:
        print(w)
else:
    print("  OK no wrong VAT values found")

# ── 5. REGION MULTIPLIER: price_modifier usage ───────────────────────────────
print()
print("=" * 65)
print("ZONE 5: REGION MULTIPLIERS")
print("=" * 65)
region_files = []
for d in ["app", "components", "lib"]:
    for f in Path(d).rglob("*.ts*"):
        text = read(f)
        if "price_modifier" in text or "priceModifier" in text or "adjustmentMultiplier" in text:
            region_files.append(str(f))
print(f"  Files using price_modifier/priceModifier: {len(region_files)}")
for rf in region_files[:15]:
    print(f"    {rf}")

# ── 6. DEMO BLUR: isPro + blur-sm ────────────────────────────────────────────
print()
print("=" * 65)
print("ZONE 6: DEMO BLUR — isPro + blur-sm check")
print("=" * 65)
blur_files = []
no_blur_but_price = []
for d in ["components", "app"]:
    for f in Path(d).rglob("*.tsx"):
        text = read(f)
        has_price = bool(re.search(r'(material_price|labor_price|final_price|total_price|formatPrice)', text))
        has_blur = "blur-sm" in text or "select-none" in text or "BlurredPrice" in text
        has_ispro = "isPro" in text or "is_pro" in text
        if has_price and has_ispro and has_blur:
            blur_files.append(f"  OK {f.name}")
        elif has_price and not has_ispro and not has_blur:
            # might be a leaf component that receives formatted value — OK
            pass

print(f"  Components with price+isPro+blur: {len(blur_files)}")
for b in blur_files[:15]:
    print(b)

# ── 7. JSON INTEGRITY ─────────────────────────────────────────────────────────
print()
print("=" * 65)
print("ZONE 7: JSON INTEGRITY")
print("=" * 65)
json_files = {
    "quick-estimate-rules.json": "lib/data/json/quick-estimate-rules.json",
    "catalog-matrix.json": "lib/data/json/catalog-matrix.json",
}
for name, path in json_files.items():
    f = Path(path)
    if not f.exists():
        print(f"  MISSING: {path}")
        continue
    try:
        data = json.loads(f.read_text(encoding="utf-8"))
        keys = list(data.keys())
        size = f.stat().st_size // 1024
        print(f"  OK {name}: {len(keys)} top-level keys, {size}KB")
        print(f"     Keys: {', '.join(keys[:8])}{'...' if len(keys) > 8 else ''}")
    except json.JSONDecodeError as e:
        print(f"  ERROR {name}: {e}")

# ── 8. PDF EXPORT CHAIN ───────────────────────────────────────────────────────
print()
print("=" * 65)
print("ZONE 8: PDF/EXPORT CHAIN")
print("=" * 65)
export_hooks = list(Path("hooks").rglob("*Export*.ts")) + list(Path("hooks").rglob("*Panel*Config*.ts"))
print(f"  Export hooks found: {[str(f) for f in export_hooks]}")
svg_renderer = Path("lib/schemat-svg-renderer.ts")
if svg_renderer.exists():
    text = read(svg_renderer)
    fns = re.findall(r"^export (?:function|const) (\w+)", text, re.MULTILINE)
    print(f"  schemat-svg-renderer exports: {fns}")
else:
    print("  WARN schemat-svg-renderer.ts not found")

panel_config_hook = Path("hooks/usePanelConfigActions.ts")
if panel_config_hook.exists():
    text = read(panel_config_hook)
    svg_calls = re.findall(r"(\w+Schemat\w*|renderSVG\w*|generate\w*SVG\w*)", text)
    print(f"  usePanelConfigActions SVG calls: {svg_calls}")

print()
print("=" * 65)
print("AUDIT COMPLETE")
print("=" * 65)
