"""
Replace console.error(...) with logger.error(...) in server-side TS files.
Correct signature: logger.error(message: string, context: Record<string,unknown>, error?: unknown)
Strategy:
  console.error("msg", supaErr)  -> logger.error("msg", { error: supaErr })
  console.error("msg", e)        -> logger.error("msg", {}, e)
  console.error("msg")           -> logger.error("msg", {})
"""
import re
from pathlib import Path

SKIP_PATHS = {"lib/logger.ts", "lib/logger.test.ts"}
TARGET_DIRS = ["app", "lib", "server", "utils"]
LOGGER_IMPORT = 'import { logger } from "@/lib/logger";\n'

def is_client_component(text: str) -> bool:
    return '"use client"' in text or "'use client'" in text

def has_logger_import(text: str) -> bool:
    return 'from "@/lib/logger"' in text or "from '@/lib/logger'" in text

def add_logger_import(text: str) -> str:
    lines = text.splitlines(keepends=True)
    insert_at = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped in ('"use server";', "'use server';"):
            insert_at = i + 1
            if insert_at < len(lines) and lines[insert_at].strip() == "":
                insert_at += 1
            break
        elif stripped.startswith("import "):
            insert_at = i
            break
    lines.insert(insert_at, LOGGER_IMPORT)
    return "".join(lines)

def convert_line(line: str) -> tuple[str, bool]:
    """Convert a single line's console.error to logger.error."""
    if "console.error(" not in line:
        return line, False

    stripped = line.strip()
    if stripped.startswith("//"):
        return line, False

    indent = len(line) - len(line.lstrip())
    prefix = " " * indent

    def replacer(m: re.Match) -> str:
        raw = m.group(1).strip()

        # Parse first string argument
        # Match quoted string (single or double or backtick)
        str_match = re.match(r'^(["\`])(.*?)(["\`])(,\s*)?(.*)$', raw, re.DOTALL)
        if str_match:
            q1, msg, q3, comma, rest = str_match.groups()
            # Remove leading emoji from message
            msg_clean = re.sub(r'^[❌⚠️🔥🚀✅📊📋⚡🔴🟡🟢⚙️🏗️💾]+\s*', '', msg)
            # Remove trailing colon+space
            msg_clean = msg_clean.rstrip(': ').rstrip()
            rest = (rest or "").strip()
            
            if not rest:
                return f'logger.error({q1}{msg_clean}{q3}, {{}})'
            else:
                # rest is the error/data object
                # Use it as 3rd arg (unknown) - safe for any type
                return f'logger.error({q1}{msg_clean}{q3}, {{}}, {rest})'
        
        # Fallback: can't parse, wrap entire args safely
        return f'logger.error({raw})'

    new_line = re.sub(r'console\.error\((.+?)\)(?=\s*[;,\n])', replacer, line)
    changed = new_line != line
    return new_line, changed


def process_file(path: Path) -> tuple[bool, int]:
    rel = str(path).replace("\\", "/")
    for skip in SKIP_PATHS:
        if rel.endswith(skip):
            return False, 0
    if path.suffix == ".tsx":
        return False, 0

    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return False, 0

    if is_client_component(text):
        return False, 0
    if "console.error(" not in text:
        return False, 0

    lines = text.splitlines(keepends=True)
    new_lines = []
    count = 0
    for line in lines:
        new_line, changed = convert_line(line)
        new_lines.append(new_line)
        if changed:
            count += 1

    if count == 0:
        return False, 0

    new_text = "".join(new_lines)
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
