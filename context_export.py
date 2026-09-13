#!/usr/bin/env python3
"""
BioTree — AI Session Context Exporter
=========================================
Run this script from inside your project folder before switching
to a new Claude session. It produces a single .md file you upload
to the new Claude so it has full context instantly.

Usage:
  python context_export.py                  # scans current directory
  python context_export.py C:/path/to/proj  # scans specific path

Output:
  context_YYYYMMDD_HHMM.md  (in your project root)
"""

import os
import sys
import re
import json
from pathlib import Path
from datetime import datetime

# ─── Configuration ────────────────────────────────────────────────────────────

SKIP_DIRS = {
    '.git', 'node_modules', '.next', 'dist', 'build', 'out',
    '__pycache__', '.cache', '.vercel', 'coverage', '.turbo',
    '.pnpm-store', 'storybook-static'
}

SKIP_FILES = {
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    '.env', '.env.local', '.env.production', '.env.development',
    '.DS_Store', 'Thumbs.db'
}

# Only include these extensions (everything else is binary/irrelevant)
INCLUDE_EXTENSIONS = {
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.py', '.sh', '.sql',
    '.json', '.jsonc',
    '.css', '.scss', '.sass',
    '.html', '.md', '.mdx', '.txt',
    '.env.example', '.gitignore', '.eslintrc',
    '.toml', '.yaml', '.yml'
}

MAX_FILE_CHARS = 8000    # truncate files larger than this
MAX_OUTPUT_KB  = 400     # warn if output exceeds this


# ─── Stripping helpers ────────────────────────────────────────────────────────

def strip_js_comments(src: str) -> str:
    # Remove // single-line comments (but keep //http:// style links)
    src = re.sub(r'(?<![:/])//(?!\s*eslint|@|#).+', '', src)
    # Remove /* */ block comments (not JSDoc /** */)
    src = re.sub(r'/\*(?!\*).+?\*/', '', src, flags=re.DOTALL)
    return src

def strip_py_comments(src: str) -> str:
    src = re.sub(r'(?m)^\s*#.*$', '', src)
    return src

def strip_css_comments(src: str) -> str:
    return re.sub(r'/\*.*?\*/', '', src, flags=re.DOTALL)

def compress_blanks(src: str) -> str:
    # Max 1 consecutive blank line
    src = re.sub(r'\n{3,}', '\n\n', src)
    # Strip trailing spaces on each line
    src = re.sub(r'[ \t]+$', '', src, flags=re.MULTILINE)
    return src.strip()

def process_file(path: Path) -> str:
    try:
        content = path.read_text(encoding='utf-8', errors='replace')
    except Exception as e:
        return f'[ERROR READING FILE: {e}]'

    ext = path.suffix.lower()

    if ext in {'.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'}:
        content = strip_js_comments(content)
    elif ext == '.py':
        content = strip_py_comments(content)
    elif ext in {'.css', '.scss', '.sass'}:
        content = strip_css_comments(content)

    content = compress_blanks(content)

    if len(content) > MAX_FILE_CHARS:
        head = content[:MAX_FILE_CHARS // 2]
        tail = content[-(MAX_FILE_CHARS // 4):]
        omitted = len(content) - len(head) - len(tail)
        content = (
            head +
            f'\n\n... [{omitted} chars omitted — file too large] ...\n\n' +
            tail
        )

    return content


# ─── Project scanner ──────────────────────────────────────────────────────────

def build_file_tree(root: Path) -> str:
    lines = []

    def walk(path: Path, indent: int = 0):
        prefix = '  ' * indent
        name = path.name

        if path.is_dir():
            if name in SKIP_DIRS:
                lines.append(f'{prefix}📁 {name}/ [skipped]')
                return
            lines.append(f'{prefix}📁 {name}/')
            children = sorted(path.iterdir(), key=lambda p: (p.is_file(), p.name.lower()))
            for child in children:
                walk(child, indent + 1)
        else:
            if name in SKIP_FILES:
                return
            size = path.stat().st_size
            tag = f' ({size // 1024}KB)' if size > 10240 else ''
            lines.append(f'{prefix}📄 {name}{tag}')

    walk(root)
    return '\n'.join(lines)


def collect_sources(root: Path) -> dict[str, str]:
    sources = {}

    for path in sorted(root.rglob('*')):
        if not path.is_file():
            continue

        # Skip if inside a skipped dir
        rel_parts = path.relative_to(root).parts
        if any(p in SKIP_DIRS for p in rel_parts):
            continue

        if path.name in SKIP_FILES:
            continue

        # Check extension (handle dotfiles like .gitignore)
        ext = path.suffix.lower()
        name = path.name.lower()
        is_dotfile = name.startswith('.') and '.' not in name[1:]
        if not is_dotfile and ext not in INCLUDE_EXTENSIONS:
            continue

        rel_path = str(path.relative_to(root)).replace('\\', '/')
        sources[rel_path] = process_file(path)

    return sources


# ─── Analysis ─────────────────────────────────────────────────────────────────

def analyze(root: Path, sources: dict[str, str]) -> dict:
    issues = []
    todos = []
    stats = {
        'file_count': len(sources),
        'line_count': sum(c.count('\n') for c in sources.values()),
        'approx_size_kb': sum(len(c) for c in sources.values()) // 1024
    }

    # Expected key files
    for key in ['package.json', 'next.config.ts', 'next.config.js', '.env.example']:
        if not (root / key).exists():
            issues.append(f'Missing expected file: {key}')

    for fpath, content in sources.items():
        ext = Path(fpath).suffix.lower()

        # TODOs
        for i, line in enumerate(content.splitlines(), 1):
            if any(tag in line for tag in ('TODO', 'FIXME', 'HACK', 'XXX')):
                todos.append(f'{fpath}:{i} → {line.strip()[:80]}')

        # console.logs in TS/JS
        if ext in {'.ts', '.tsx', '.js', '.jsx'}:
            n = content.count('console.log')
            if n > 2:
                issues.append(f'{fpath}: {n}× console.log (clean up before prod)')

        # TypeScript `any`
        if ext in {'.ts', '.tsx'}:
            n = len(re.findall(r':\s*any\b', content))
            if n > 3:
                issues.append(f'{fpath}: {n}× TypeScript `any` (improve typing)')

        # Missing error handling in API routes
        if 'api/' in fpath and ext in {'.ts', '.js'}:
            if 'try' not in content and 'catch' not in content:
                issues.append(f'{fpath}: no try/catch detected in API route')

    return {'stats': stats, 'issues': issues, 'todos': todos[:30]}


# ─── Blueprint loader ─────────────────────────────────────────────────────────

def load_blueprint(root: Path) -> str | None:
    for name in ('BLUEPRINT.md', 'blueprint.md', 'BLUEPRINT.txt'):
        p = root / name
        if p.exists():
            return p.read_text(encoding='utf-8', errors='replace')
    return None


# ─── Output builder ───────────────────────────────────────────────────────────

def build_output(project_path: Path) -> str:
    root = project_path.resolve()
    now  = datetime.now().strftime('%Y-%m-%d %H:%M')

    print(f'\n  Scanning: {root}')
    file_tree = build_file_tree(root)
    sources   = collect_sources(root)
    analysis  = analyze(root, sources)
    blueprint = load_blueprint(root)

    parts = []

    # ── Header / handoff instructions ──────────────────────────────────────
    parts.append(f"""\
# BioTree — AI Session Handoff Context
> Generated: {now}  |  Project: {root}

## FOR THE NEW CLAUDE SESSION — READ THIS FIRST

You are continuing development of **BioTree**, a PWA SaaS platform that turns
a creator's bio link into an installable mobile app for their fans.
The developer is **rowlu** (Mauritius, building this as a startup while unemployed).
You are picking up exactly where the last session left off.

**Your job:**
1. Read the BLUEPRINT section below — it contains every architectural decision made so far
2. Review the current project files
3. Note the analysis / issues section
4. Continue helping rowlu build this, phase by phase

Be direct, practical, and detailed. rowlu knows what they want — help them build it.

---

**Stats:** {analysis['stats']['file_count']} files | {analysis['stats']['line_count']:,} lines | ~{analysis['stats']['approx_size_kb']}KB source
""")

    # ── Blueprint ───────────────────────────────────────────────────────────
    if blueprint:
        parts.append('## BLUEPRINT\n\n' + blueprint)
    else:
        parts.append('## BLUEPRINT\n\n*(BLUEPRINT.md not found in project root — ask rowlu to add it)*')

    # ── File tree ───────────────────────────────────────────────────────────
    parts.append(f'## PROJECT FILE TREE\n\n```\n{file_tree}\n```')

    # ── Analysis ────────────────────────────────────────────────────────────
    analysis_lines = ['## ANALYSIS\n']
    if analysis['issues']:
        analysis_lines.append('### Issues detected')
        analysis_lines += [f'- {i}' for i in analysis['issues']]
    else:
        analysis_lines.append('### Issues detected\n- None detected')

    if analysis['todos']:
        analysis_lines.append('\n### TODOs / FIXMEs in codebase')
        analysis_lines += [f'- {t}' for t in analysis['todos']]

    parts.append('\n'.join(analysis_lines))

    # ── Source files ────────────────────────────────────────────────────────
    file_parts = ['## SOURCE FILES\n']
    for fpath, content in sorted(sources.items()):
        ext = Path(fpath).suffix.lstrip('.') or 'text'
        file_parts.append(f'### `{fpath}`\n```{ext}\n{content}\n```')

    parts.append('\n\n'.join(file_parts))

    return '\n\n---\n\n'.join(parts)


# ─── Entry point ──────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) > 1:
        project_path = Path(sys.argv[1])
    else:
        project_path = Path.cwd()

    if not project_path.exists():
        print(f'Error: path does not exist: {project_path}')
        sys.exit(1)

    print('\n  BioTree Context Exporter')
    print('  ─────────────────────────────')

    output_text = build_output(project_path)

    timestamp   = datetime.now().strftime('%Y%m%d_%H%M')
    output_file = project_path / f'context_{timestamp}.md'
    output_file.write_text(output_text, encoding='utf-8')

    size_kb = output_file.stat().st_size // 1024

    print(f'\n  ✓ Exported to: {output_file.name}')
    print(f'  ✓ Output size: {size_kb} KB')

    if size_kb > MAX_OUTPUT_KB:
        print(f'\n  ⚠ WARNING: File is large ({size_kb}KB).')
        print('    Split your upload: send BLUEPRINT section first,')
        print('    then source files in a follow-up message.')
    elif size_kb > 150:
        print('  → Medium size. Fine to upload in one go.')
    else:
        print('  → Small size. Upload in one go, no issues.')

    print('\n  HOW TO USE:')
    print(f'  1. Open a new Claude session')
    print(f'  2. Upload: {output_file.name}')
    print(f'  3. Say: "Continue building BioTree. Read the context file first."')
    print(f'  4. Claude will have full context and pick up where you left off.\n')


if __name__ == '__main__':
    main()
