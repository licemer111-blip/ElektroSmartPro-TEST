"""
Fix logger.error calls where error/unknown was placed as 2nd arg (context).
Patterns to fix:
  logger.error('msg', supabaseError)   -> logger.error('msg', {}, supabaseError)
  logger.error('msg', unknownVal)      -> logger.error('msg', {}, unknownVal)
  logger.error('msg', {}, a, b)        -> logger.error('msg', { extra: a }, b)
"""
import re
from pathlib import Path

TARGET_FILES = [
    "app/api/push/subscribe/route.ts",
    "app/api/reminders/deadlines/route.ts",
    "app/dashboard/projects/[id]/voice-actions.ts",
    "app/dashboard/settings/generate-catalog-action.ts",
    "lib/catalog-search.ts",
    "lib/web-push.ts",
]

def fix_file(path: Path) -> int:
    text = path.read_text(encoding="utf-8", errors="ignore")
    original = text
    count = 0

    # Fix pattern 1: logger.error('msg', nonObjectVar) — 2nd arg is not {} or {...}
    # This means error was placed as context → move to 3rd arg
    def fix_two_args(m: re.Match) -> str:
        nonlocal count
        msg = m.group(1)       # quoted string
        second = m.group(2).strip()  # the misplaced error
        # Skip if second arg is already an object literal
        if second.startswith('{'):
            return m.group(0)
        count += 1
        return f'logger.error({msg}, {{}}, {second})'

    text = re.sub(
        r'logger\.error\((["\`][^"\`\n]*["\`]),\s*([^{}\n][^,\n\)]*)\)',
        fix_two_args,
        text
    )

    # Fix pattern 2: logger.error('msg', {}, arg1, arg2) — 4 args → 3 args
    def fix_four_args(m: re.Match) -> str:
        nonlocal count
        msg = m.group(1)
        arg1 = m.group(2).strip()
        arg2 = m.group(3).strip()
        count += 1
        return f'logger.error({msg}, {{ extra: String({arg1}) }}, {arg2})'

    text = re.sub(
        r'logger\.error\((["\`][^"\`\n]*["\`]),\s*\{\},\s*([^,\n\)]+),\s*([^\n\)]+)\)',
        fix_four_args,
        text
    )

    if text != original:
        path.write_text(text, encoding="utf-8")
        return count
    return 0

total = 0
for path_str in TARGET_FILES:
    f = Path(path_str)
    if not f.exists():
        print(f"  SKIP: {path_str}")
        continue
    n = fix_file(f)
    print(f"  {n}x  {path_str}")
    total += n

print(f"\nTotal: {total} fixes")
