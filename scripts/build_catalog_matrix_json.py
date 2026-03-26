"""Extract catalog-matrix.ts data arrays into catalog-matrix.json."""
import json, re, os

src = open("lib/data/catalog-matrix.ts", encoding="utf-8").read()

# Parse each export const NAME = [...] or = [num, ...]
# We'll use a manual eval-like approach: extract JSON-compatible arrays

def extract_array(name: str, text: str):
    """Extract a TypeScript array constant as Python value."""
    # Match: export const NAME = [...];
    pattern = rf"export const {name}\s*[^=]*=\s*(\[[\s\S]*?\]);"
    m = re.search(pattern, text)
    if not m:
        return None
    raw = m.group(1)
    # Convert TS to valid JSON:
    # Remove trailing commas before ] or }
    raw = re.sub(r',\s*([}\]])', r'\1', raw)
    # Replace single quotes with double quotes (not inside already-double-quoted)
    # Simple approach: replace unescaped single quotes
    raw = re.sub(r"'([^']*)'", r'"\1"', raw)
    try:
        return json.loads(raw)
    except Exception as e:
        print(f"  WARN {name}: {e} — raw[:80]={raw[:80]}")
        return None

exports = re.findall(r"export const (\w+)", src)
print(f"Found {len(exports)} exports")

data = {}
for name in exports:
    val = extract_array(name, src)
    if val is not None:
        data[name] = val
        print(f"  OK  {name}: {len(val) if isinstance(val, list) else val} items")
    else:
        print(f"  MISS {name}")

target = os.path.join("lib", "data", "json", "catalog-matrix.json")
with open(target, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

size = os.path.getsize(target)
print(f"\nDone. {len(data)}/{len(exports)} exports. File: {target}, size: {size} bytes")
