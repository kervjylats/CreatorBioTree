#!/usr/bin/env python3
"""
check-docs.py — Verify TypeScript files have purpose docstrings.

Usage:
    python scripts/check-docs.py              # scan src/, report missing docstrings
    python scripts/check-docs.py --fix         # same + insert placeholder docstrings

Rules:
    1. Every .ts and .tsx file (except barrel/index files) must have a JSDoc
       comment block (/** ... */) within the first 10 lines.
    2. Barrel/index files (re-exports only) are exempt — they're detected by
       checking if the file body consists entirely of `export ...` lines.
    3. Next.js route.ts files get a special "Route:" prefix convention.

Exit code: 0 if all pass, 1 if any fail.
"""

import argparse
import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = REPO_ROOT / "src"

# Files we ignore entirely
EXEMPT_FILES = {
    "src/components/ui/*.tsx",  # shadcn
}

JSOC_RE = re.compile(r"/\*\*[\s\S]*?\*/")
EXPORT_LINE_RE = re.compile(r"^\s*export\s")


def is_barrel_file(content: str) -> bool:
    """Heuristic: a file where every non-empty line starts with 'export'."""
    non_empty = [line for line in content.splitlines() if line.strip()]
    if not non_empty:
        return False
    return all(EXPORT_LINE_RE.match(line) for line in non_empty)


def file_matches_exempt(path: Path) -> bool:
    rel = path.relative_to(REPO_ROOT).as_posix()
    for pattern in EXEMPT_FILES:
        if glob_match(rel, pattern):
            return True
    return False


def glob_match(path: str, pattern: str) -> bool:
    # Very minimal glob: only handles trailing /*.ext
    if pattern.endswith("/*.tsx"):
        prefix = pattern[:-5]
        return path.startswith(prefix) and path.endswith(".tsx")
    if pattern.endswith("/*.ts"):
        prefix = pattern[:-4]
        return path.startswith(prefix) and path.endswith(".ts")
    return path == pattern


def check_file(path: Path, fix: bool = False) -> bool:
    """Returns True if file passes, False if it fails."""
    content = path.read_text(encoding="utf-8")
    first_10_lines = "\n".join(content.splitlines()[:10])

    if JSOC_RE.search(first_10_lines):
        return True  # has docstring (pass)

    if is_barrel_file(content):
        return True  # exempt

    if file_matches_exempt(path):
        return True

    rel = path.relative_to(REPO_ROOT).as_posix()
    if fix:
        is_route = "route.ts" in path.name
        suffix = " — Route handler" if is_route else ""
        placeholder = f"/** TODO: Add purpose docstring{suffix}. */\n"
        path.write_text(placeholder + content, encoding="utf-8")
        print(f"  [FIXED] {rel}")
        return True
    else:
        print(f"  [MISSING] {rel}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Check TypeScript files for purpose docstrings.")
    parser.add_argument("--fix", action="store_true", help="Insert placeholder docstrings where missing.")
    args = parser.parse_args()

    ts_files = sorted(SRC_DIR.rglob("*.ts")) + sorted(SRC_DIR.rglob("*.tsx"))
    all_pass = True

    print(f"Scanning {len(ts_files)} TypeScript files in src/...\n")
    for filepath in ts_files:
        if not check_file(filepath, fix=args.fix):
            all_pass = False

    if not all_pass:
        print("\n[FAIL] Some files are missing purpose docstrings.")
        print("   Run with --fix to auto-insert placeholders, then fill them in.")
        sys.exit(1)
    else:
        print("\n[PASS] All TypeScript files have purpose docstrings (or are exempt).")


if __name__ == "__main__":
    main()
