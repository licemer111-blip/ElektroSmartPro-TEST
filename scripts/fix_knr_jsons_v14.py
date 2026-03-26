#!/usr/bin/env python3
"""
fix_knr_jsons_v14.py
────────────────────
Batch-fixes old KNR JSON files so they pass the v1.4 uploadKnrNormsJson
validator in ElektroSmart PRO.

What it does
────────────
1. Scans every .json in  data/knr/  (or the folder you pass as --src).
2. Normalises each file into a flat array of norm objects.
3. Auto-fills missing required fields:
   • catalog_code   – inferred from filename (see CATALOG_RULES below)
   • table_number   – "9000" + zero-padded file index   (unique per file)
   • column_number  – zero-padded position index inside the file
   • description    – falls back to position_name / nazwa / knr_code
   • unit           – normalised to one of the VALID_UNITS, default "szt"
   • labor_norm     – falls back to norma_rg / labor_hours / 0.35
4. Copies synonyms from existing "synonyms", "keywords", or "tags" field.
5. Writes fixed files to  data/knr/fixed_norms/  (or --dst).
6. Prints a per-file report and a final summary.

Usage
─────
  python scripts/fix_knr_jsons_v14.py
  python scripts/fix_knr_jsons_v14.py --src data/knr --dst data/knr/fixed_norms
  python scripts/fix_knr_jsons_v14.py --dry-run   # only validate, no output
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

# ─── Constants matching actions.ts ───────────────────────────────────────────

VALID_UNITS = {"szt", "mb", "m", "kpl", "m2", "godz", "m-c"}
VALID_CATALOGS = ["KNR 5-08", "KNR 5-10", "KNR 5-12", "KNR 4-03", "KNR 5-06"]

# Unit aliases → canonical form
UNIT_ALIASES: dict[str, str] = {
    "100m":  "m",   # normy for 100-meter runs — keep as "m" (uploader sees the norm, not the multiplier)
    "1m":    "m",
    "1m2":   "m2",
    "1m3":   "m2",  # closest valid unit
    "10m":   "m",
    "szt.":  "szt",
    "piece": "szt",
    "pcs":   "szt",
    "kpl.":  "kpl",
    "komplet": "kpl",
    "godz.": "godz",
    "godzina": "godz",
    "h":     "godz",
    "rbh":   "godz",
    "m-c":   "m-c",
    "mies":  "m-c",
    "miesiąc": "m-c",
    "mb":    "mb",
    "metrb": "mb",
    "spaw":  "szt",        # spawy światlowodowe → szt
    "włókno": "szt",
    "tor (port)": "szt",
    "tor":   "szt",
    "port":  "szt",
    "doba":  "godz",
    "element (ok. 3m)": "m",
    "komplet (punkt)": "kpl",
}

# ─── Catalog inference rules (applied in order, first match wins) ─────────────

CATALOG_RULES: list[tuple[list[str], str]] = [
    # Keywords in filename (lowercase)                    → catalog_code
    # Rules with more specific keywords must come BEFORE generic ones
    (["automation", "bms", "knx", "dali"],               "KNR 5-08"),
    (["hale", "hal_", "przemysl_", "_przemysl",
      "wysokosciowe", "industrial"],                      "KNR 5-10"),
    (["remont", "stare_bud", "wyzwania", "403",
      "pomiary", "termowizja", "dokumentacja",
      "serwis", "awarie", "modernizacje"],                "KNR 4-03"),
    (["teletech", "ppoz", "przeciwpoz", "ssp", "oddymian",
      "swiatlowod", "sieci_magistralne", "fiber"],        "KNR 5-06"),
    (["alarm", "cctv", "security", "monitoringu"],        "KNR 5-06"),
    (["k38", "lanster", "amp"],                           "KNR 5-06"),
    (["rozdziel", "aparatura", "panel", "prefabryk"],     "KNR 5-08"),
    (["trasy", "kable", "rury"],                          "KNR 5-08"),
    (["oswiet", "oświet", "smart_home", "intelig"],       "KNR 5-08"),
    (["oze", "_ev_", "ogrzew", "fotowolt", "ladowania"],  "KNR 5-08"),
    (["zasilanie", "wlz", "szr", "agregat", "ups",
      "placu_budowy", "wynajem", "przylacza"],            "KNR 5-08"),
    (["uziom", "odgrom", "lps"],                          "KNR 5-08"),
    (["prace_ziemne", "ziemne"],                          "KNR 5-08"),
    (["infrastruktura"],                                  "KNR 5-08"),
    (["biur", "sieci_lan", "it_sieci"],                   "KNR 5-12"),
    (["2026"],                                            "KNR 5-08"),  # generic 2026 files
]

DEFAULT_CATALOG = "KNR 5-08"


# ─── Helper functions ─────────────────────────────────────────────────────────

def infer_catalog(filename: str) -> str:
    """Return the best catalog_code based on filename keywords."""
    name_lower = filename.lower().replace("-", "_").replace(" ", "_")
    for keywords, catalog in CATALOG_RULES:
        if any(kw in name_lower for kw in keywords):
            return catalog
    return DEFAULT_CATALOG


def normalise_unit(raw: Any) -> str:
    """Return a valid unit string, defaulting to 'szt'."""
    if not isinstance(raw, str):
        return "szt"
    s = raw.strip().lower()
    if s in VALID_UNITS:
        return s
    if s in UNIT_ALIASES:
        return UNIT_ALIASES[s]
    # partial match
    for alias, canonical in UNIT_ALIASES.items():
        if alias in s:
            return canonical
    return "szt"


def extract_description(obj: dict, fallback_index: int) -> str:
    """Extract description from various field names used by old formats."""
    for key in ("description", "position_name", "nazwa", "name", "title"):
        val = obj.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    # last resort: knr_code + index
    code = obj.get("knr_code") or obj.get("id") or f"norma_{fallback_index}"
    return str(code).strip() or f"Norma {fallback_index}"


def extract_labor_norm(obj: dict) -> float:
    """Extract labor norm (rbh) from various field names."""
    for key in ("labor_norm", "norma_rg", "labor_hours", "rbh", "norm_rbh"):
        val = obj.get(key)
        if isinstance(val, (int, float)) and val > 0:
            # cap at 50 (validator limit)
            return min(float(val), 50.0)
    return 0.35  # sensible default (montaż gniazda)


def extract_synonyms(obj: dict) -> list[str]:
    """Merge synonyms/keywords/tags from various field names."""
    result: list[str] = []
    for key in ("synonyms", "keywords", "tags"):
        val = obj.get(key)
        if isinstance(val, list):
            result.extend(str(s).strip().lower() for s in val if s)
    # deduplicate
    seen: set[str] = set()
    deduped: list[str] = []
    for s in result:
        if s and s not in seen:
            seen.add(s)
            deduped.append(s)
    return deduped


def extract_materials(obj: dict) -> list[dict]:
    """Extract materials list if present, normalising field names."""
    raw = obj.get("materials") or obj.get("zestaw") or []
    if not isinstance(raw, list):
        return []
    out: list[dict] = []
    for m in raw:
        if not isinstance(m, dict):
            continue
        name = (
            m.get("material_name")
            or m.get("name")
            or m.get("nazwa")
            or m.get("opis")
        )
        if not isinstance(name, str) or not name.strip():
            continue
        qty = m.get("quantity_factor") or m.get("amount") or m.get("ilosc") or 1
        try:
            qty = float(qty)
        except (TypeError, ValueError):
            qty = 1.0
        if qty <= 0:
            qty = 1.0
        entry: dict[str, Any] = {
            "material_name":   name.strip(),
            "material_unit":   normalise_unit(m.get("unit") or m.get("material_unit") or "szt"),
            "quantity_factor": qty,
        }
        ctype = m.get("component_type")
        valid_ctypes = {"material", "robocizna", "cable", "box", "device", "chase"}
        if isinstance(ctype, str) and ctype in valid_ctypes:
            entry["component_type"] = ctype
        else:
            entry["component_type"] = "material"
        out.append(entry)
    return out


def flatten_file(raw: Any, filename: str) -> tuple[list[dict], list[str]]:
    """
    Convert any supported old JSON structure into a flat list of norm dicts.
    Returns (norms_list, warnings).
    """
    warnings: list[str] = []
    items: list[Any] = []

    if isinstance(raw, list):
        items = raw

    elif isinstance(raw, dict):
        # { "norms": [...] }
        if "norms" in raw and isinstance(raw["norms"], list):
            items = raw["norms"]
        # { "pozycje": [...] }  — es_knr_* files
        elif "pozycje" in raw and isinstance(raw["pozycje"], list):
            items = raw["pozycje"]
        # { "module_catalog": [...] }  — es_knr_rozdzielnice_aparatura.json
        elif "module_catalog" in raw and isinstance(raw["module_catalog"], list):
            items = raw["module_catalog"]
        # single norm object
        elif "description" in raw or "position_name" in raw or "nazwa" in raw:
            items = [raw]
        else:
            warnings.append(f"  [WARN] Nieznana struktura pliku '{filename}' — pomijam")
            return [], warnings
    else:
        warnings.append(f"  [WARN] Plik '{filename}' nie jest tablicą ani obiektem — pomijam")
        return [], warnings

    if not items:
        warnings.append(f"  [WARN] Plik '{filename}' nie zawiera pozycji")

    return items, warnings


def make_table_number(file_index: int) -> str:
    """Generate a unique table_number based on file index: '9001', '9002', ..."""
    return f"{9000 + file_index:04d}"


def make_column_number(item_index: int) -> str:
    """Generate a unique column_number based on item index: '01', '02', ..."""
    return f"{item_index + 1:02d}"


def fix_norm(
    obj: Any,
    catalog_code: str,
    table_number: str,
    item_index: int,
) -> tuple[dict | None, list[str]]:
    """
    Convert a single raw item into a v1.4-valid norm dict.
    Returns (norm_dict_or_None, error_list).
    """
    errors: list[str] = []

    if not isinstance(obj, dict):
        errors.append(f"    [SKIP] Pozycja {item_index}: nie jest obiektem (got {type(obj).__name__})")
        return None, errors

    # ── catalog_code ─────────────────────────────────────────────────────────
    cc = obj.get("catalog_code") or obj.get("knr_code") or ""
    if isinstance(cc, str) and cc.strip():
        # validate it starts with a recognised catalog prefix
        cc = cc.strip()
        if not any(cc.startswith(c.split()[0] + " " + c.split()[1].split("-")[0]) for c in VALID_CATALOGS):
            # e.g. "5-08 0201" without "KNR " prefix → fix
            if re.match(r"^\d", cc):
                cc = "KNR " + cc
            # still unknown → use inferred
            if not any(cc.startswith(c.split()[0] + " " + c.split()[1].split("-")[0]) for c in VALID_CATALOGS):
                cc = catalog_code
    else:
        cc = catalog_code

    # ── table_number / column_number ─────────────────────────────────────────
    tbl = str(obj.get("table_number") or "").strip()
    col = str(obj.get("column_number") or "").strip()

    if not tbl:
        tbl = table_number
    if not col:
        col = make_column_number(item_index)

    # ── description ──────────────────────────────────────────────────────────
    desc = extract_description(obj, item_index)
    if len(desc) < 3:
        desc = f"Pozycja KNR {cc} {tbl}-{col}"

    # ── unit ─────────────────────────────────────────────────────────────────
    unit = normalise_unit(obj.get("unit") or obj.get("jednostka") or "szt")

    # ── labor_norm ───────────────────────────────────────────────────────────
    labor_norm = extract_labor_norm(obj)

    # ── optional fields ───────────────────────────────────────────────────────
    norm: dict[str, Any] = {
        "catalog_code":  cc,
        "table_number":  tbl,
        "column_number": col,
        "description":   desc,
        "unit":          unit,
        "labor_norm":    labor_norm,
    }

    section = obj.get("section") or obj.get("sekcja") or ""
    if section:
        norm["section"] = str(section).strip()

    mat_cat = obj.get("material_category") or obj.get("kategoria_materialow") or ""
    if mat_cat:
        norm["material_category"] = str(mat_cat).strip()

    knr_cat = obj.get("knr_category") or obj.get("category") or obj.get("kategoria") or ""
    if knr_cat:
        norm["knr_category"] = str(knr_cat).strip()

    is_ind = obj.get("is_industrial") or obj.get("industrial") or False
    norm["is_industrial"] = bool(is_ind)

    src = obj.get("source_edition") or ""
    if src:
        norm["source_edition"] = str(src).strip()

    synonyms = extract_synonyms(obj)
    if synonyms:
        norm["synonyms"] = synonyms

    materials = extract_materials(obj)
    if materials:
        norm["materials"] = materials

    return norm, errors


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Fix old KNR JSONs for v1.4 schema")
    parser.add_argument(
        "--src",
        default=str(Path(__file__).parent.parent / "data" / "knr"),
        help="Source folder with .json files (default: data/knr/)",
    )
    parser.add_argument(
        "--dst",
        default=None,
        help="Output folder (default: <src>/fixed_norms/)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate only, do not write output files",
    )
    parser.add_argument(
        "--skip-already-valid",
        action="store_true",
        help="Skip files that already have catalog_code on every norm",
    )
    args = parser.parse_args()

    src_dir = Path(args.src).resolve()
    dst_dir = Path(args.dst).resolve() if args.dst else src_dir / "fixed_norms"

    if not src_dir.exists():
        print(f"[ERROR] Source folder not found: {src_dir}")
        sys.exit(1)

    if not args.dry_run:
        dst_dir.mkdir(parents=True, exist_ok=True)

    json_files = sorted(
        f for f in src_dir.iterdir()
        if f.is_file() and f.suffix == ".json" and f.parent == src_dir
    )

    if not json_files:
        print(f"[WARN] No .json files found in {src_dir}")
        sys.exit(0)

    total_files = 0
    total_norms = 0
    total_skipped = 0
    total_errors = 0
    fixed_files: list[str] = []
    error_files: list[str] = []

    print(f"\n{'='*66}")
    print(f"  KNR JSON Batch Fixer -- v1.4 Schema")
    print(f"  Source : {src_dir}")
    print(f"  Output : {dst_dir}  {'(DRY RUN)' if args.dry_run else ''}")
    print(f"{'='*66}\n")

    for file_index, json_path in enumerate(json_files, start=1):
        filename = json_path.name
        print(f"[{file_index:02d}] {filename}")

        # Parse
        try:
            with open(json_path, "r", encoding="utf-8") as fh:
                raw = json.load(fh)
        except json.JSONDecodeError as e:
            print(f"     [ERROR] JSON parse error: {e}")
            error_files.append(filename)
            total_errors += 1
            continue
        except Exception as e:
            print(f"     [ERROR] Cannot read file: {e}")
            error_files.append(filename)
            total_errors += 1
            continue

        # Flatten
        items, flat_warnings = flatten_file(raw, filename)
        for w in flat_warnings:
            print(w)

        if not items:
            print(f"     [SKIP] Empty file — 0 items")
            total_skipped += 1
            continue

        # Skip already-valid files if requested
        if args.skip_already_valid and isinstance(items[0], dict) and items[0].get("catalog_code"):
            all_have_cc = all(
                isinstance(it, dict) and it.get("catalog_code") and it.get("table_number") and it.get("column_number")
                for it in items
            )
            if all_have_cc:
                print(f"     [OK] Already valid ({len(items)} norms) — skipping")
                total_skipped += 1
                continue

        # Infer catalog_code for this file
        inferred_catalog = infer_catalog(filename)
        table_number = make_table_number(file_index)

        fixed_norms: list[dict] = []
        file_errors: list[str] = []

        for item_index, item in enumerate(items):
            norm, errs = fix_norm(item, inferred_catalog, table_number, item_index)
            file_errors.extend(errs)
            if norm:
                fixed_norms.append(norm)

        for e in file_errors:
            print(e)

        skipped_count = len(items) - len(fixed_norms)
        print(f"     ✓ {len(fixed_norms)} norms fixed  |  {skipped_count} skipped  |  catalog={inferred_catalog}  |  table={table_number}")

        if not fixed_norms:
            print(f"     [WARN] No valid norms produced — output file skipped")
            total_skipped += 1
            continue

        # Write output
        if not args.dry_run:
            out_path = dst_dir / filename
            try:
                with open(out_path, "w", encoding="utf-8") as fh:
                    json.dump(fixed_norms, fh, ensure_ascii=False, indent=2)
                fixed_files.append(filename)
            except Exception as e:
                print(f"     [ERROR] Cannot write {out_path}: {e}")
                error_files.append(filename)
                total_errors += 1
                continue
        else:
            fixed_files.append(filename)

        total_files += 1
        total_norms += len(fixed_norms)

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f"\n{'='*66}")
    print(f"  SUMMARY")
    print(f"{'-'*66}")
    print(f"  Files processed  : {total_files}")
    print(f"  Files skipped    : {total_skipped}")
    print(f"  Files with errors: {total_errors}")
    print(f"  Total norms fixed: {total_norms}")
    if not args.dry_run:
        print(f"  Output folder    : {dst_dir}")
    print(f"{'='*66}\n")

    if error_files:
        print("Files with errors:")
        for f in error_files:
            print(f"  * {f}")
        print()

    if total_errors > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
