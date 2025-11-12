#!/usr/bin/env python3
"""
Simple mechanical markdown cleaner.
- Adds blank lines around fenced code blocks and headings
- Adds an obvious language hint to empty fences where next line suggests a language (bash/json/typescript)
- Renumbers ordered lists starting from 1 within a block

Usage: python3 scripts/markdown_cleanup.py docs

This is conservative: it only edits files in-place and makes small mechanical changes.
"""
import sys
from pathlib import Path
import re

LANG_BASH_HINT = ['npm', 'npx', 'yarn', 'node', 'curl', '$', 'bash', 'sh']
LANG_TS_HINT = ['import ', 'export ', 'interface ', 'type ', 'React', 'const ', 'let ', 'function ', '=>']
LANG_JSON_HINT = ['"', '{', '[', '"key"', ':']

fence_re = re.compile(r'^(?P<indent>\s*)```(?P<lang>\w+)?\s*$')
olist_re = re.compile(r'^(?P<indent>\s*)(?P<num>\d+)\.\s+')

def guess_lang_from_line(line: str):
    l = line.strip()
    if not l:
        return None
    low = l.lower()
    for k in LANG_BASH_HINT:
        if k in low:
            return 'bash'
    for k in LANG_TS_HINT:
        if k in line:
            return 'typescript'
    # JSON heuristics: line starts with { or [ or contains "key":
    stripped = line.lstrip()
    if stripped.startswith('{') or stripped.startswith('[') or '"' in line and ':' in line:
        return 'json'
    return None


def ensure_blank_lines(lines):
    # Ensure blank lines around headings and fenced code blocks
    out = []
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        # headings: ensure blank line before and after
        if line.lstrip().startswith('#'):
            if out and out[-1].strip() != '':
                out.append('\n')
            out.append(line)
            # ensure next line blank if next exists and not blank
            if i+1 < n and lines[i+1].strip() != '':
                out.append('\n')
            i += 1
            continue
        m = fence_re.match(line)
        if m:
            # fence start
            # ensure previous is blank
            if out and out[-1].strip() != '':
                out.append('\n')
            lang = m.group('lang')
            indent = m.group('indent') or ''
            if not lang:
                # peek next non-empty line
                j = i+1
                while j < n and lines[j].strip() == '':
                    j += 1
                next_line = lines[j] if j < n else ''
                guessed = guess_lang_from_line(next_line)
                if guessed:
                    out.append(f"{indent}```{guessed}\n")
                else:
                    out.append(line)
            else:
                out.append(line)
            i += 1
            # copy until closing fence
            while i < n:
                out.append(lines[i])
                if fence_re.match(lines[i]):
                    break
                i += 1
            # ensure blank after fence
            if out and out[-1].strip() != '':
                out.append('\n')
            i += 1
            continue
        out.append(line)
        i += 1
    return out


def renumber_ordered_lists(lines):
    out = []
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        m = olist_re.match(line)
        if m:
            # Start of ordered list block
            indent = m.group('indent')
            counter = 1
            while i < n:
                m2 = olist_re.match(lines[i])
                if not m2 or m2.group('indent') != indent:
                    break
                suffix = lines[i][m2.end():]
                out.append(f"{indent}{counter}. {suffix}")
                counter += 1
                i += 1
            continue
        out.append(line)
        i += 1
    return out


def process_file(path: Path):
    text = path.read_text(encoding='utf-8')
    lines = text.splitlines(keepends=True)
    changed = False
    new = ensure_blank_lines(lines)
    new2 = renumber_ordered_lists(new)
    new_text = ''.join(new2)
    if new_text != text:
        path.write_text(new_text, encoding='utf-8')
        return True
    return False


def main():
    if len(sys.argv) < 2:
        print('Usage: markdown_cleanup.py <dir>')
        sys.exit(2)
    root = Path(sys.argv[1])
    if not root.exists():
        print('Path not found:', root)
        sys.exit(2)
    md_files = list(root.rglob('*.md'))
    changed_files = []
    for f in md_files:
        try:
            if process_file(f):
                changed_files.append(str(f))
        except Exception as e:
            print('Error processing', f, e)
    print('Processed', len(md_files), 'files, modified', len(changed_files))
    for ff in changed_files[:200]:
        print('M', ff)

if __name__ == '__main__':
    main()
