"""
Replace console.error(...) with logger.error(...) in server-side TS files.
- Adds logger import if missing
- Skips: UI components (.tsx with useState/useEffect), lib/logger.ts itself
- Only processes: .ts files (actions, services, routes, lib utils)
"""
import re
from pathlib import Path

# Files to skip
SKIP_FILES = {
    "lib/logger.ts",
    "lib/logger.test.ts",
}

# Process only .ts server-side files (not .tsx components)
TARGET_DIRS = [
    "app",
    "lib",
    "server",
    "utils",
]

LOGGER_IMPORT = 'import { logger } from "@/lib/logger";\n'

def is_client_component(text: str) -> bool:
    return '"use client"' in text or "'use client'" in text

def has_logger_import(text: str) -> bool:
    return (
        'from "@/lib/logger"' in text
        or "from '@/lib/logger'" in text
    )

def add_logger_import(text: str) -> str:
    """Add logger import after 'use server' directive or at top."""
    lines = text.splitlines(keepends=True)
    insert_at = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped in ('"use server";', "'use server';"):
            insert_at = i + 1
            # skip blank line after use server
            if insert_at < len(lines) and lines[insert_at].strip() == "":
                insert_at += 1
            break
        elif stripped.startswith("import "):
            insert_at = i
            break
    lines.insert(insert_at, LOGGER_IMPORT)
    return "".join(lines)

def convert_console_error(text: str) -> tuple[str, int]:
    """
    Replace console.error("❌ ...", err) with logger.error("...", {}, err)
    Replace console.error("msg", data) with logger.error("msg", {}, data)
    Returns (new_text, count_replaced)
    """
    count = 0

    def replacer(m: re.Match) -> str:
        nonlocal count
        args_str = m.group(1).strip()
        count += 1

        # Try to parse: first arg is string, rest are data
        # console.error("❌ msg", errObj) -> logger.error("msg", {}, errObj)
        # console.error("msg") -> logger.error("msg", {})
        
        # Remove emoji from start of string
        first_arg_match = re.match(r'^(["\`])(.*?)(["\`])(.*)', args_str, re.DOTALL)
        if first_arg_match:
            q1, content, q3, rest = first_arg_match.groups()
            # Remove leading emoji
            content = re.sub(r'^[❌⚠️🔥🚀✅📊📋⚡🔴🟡🟢]+\s*', '', content)
            rest = rest.strip().lstrip(',').strip()
            if rest:
                return f'logger.error({q1}{content}{q3}, {{}}, {rest})'
            else:
                return f'logger.error({q1}{content}{q3}, {{}})'
        
        # Template literal or complex args - keep as-is, just replace function
        return f'logger.error({args_str})'

    # Match console.error(...) — handles nested parens naively for single-line
    new_text = re.sub(r'console\.error\(([^;]*?)\)', replacer, text)
    return new_text, count


def process_file(path: Path) -> tuple[bool, int]:
    rel = str(path).replace("\\", "/")
    
    # Skip known files
    for skip in SKIP_FILES:
        if rel.endswith(skip):
            return False, 0
    
    # Skip .tsx (UI components) unless it's a pure server file
    if path.suffix == ".tsx":
        return False, 0
    
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return False, 0
    
    # Skip client components
    if is_client_component(text):
        return False, 0
    
    # Skip files with no console.error
    if "console.error(" not in text:
        return False, 0
    
    new_text, count = convert_console_error(text)
    if count == 0:
        return False, 0
    
    # Add logger import if needed
    if not has_logger_import(new_text):
        new_text = add_logger_import(new_text)
    
    path.write_text(new_text, encoding="utf-8")
    return True, count


total_files = 0
total_replacements = 0
changed_files = []

for d in TARGET_DIRS:
    for f in sorted(Path(d).rglob("*.ts")):
        if ".d.ts" in f.name:
            continue
        modified, count = process_file(f)
        if modified:
            total_files += 1
            total_replacements += count
            changed_files.append((count, str(f)))

print(f"Modified {total_files} files, {total_replacements} replacements:")
for count, path in sorted(changed_files, reverse=True):
    print(f"  {count}x  {path}")
