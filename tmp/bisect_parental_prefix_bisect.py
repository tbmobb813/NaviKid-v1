#!/usr/bin/env python3
"""
Create temporary test files that keep only the first N `it`/`test` blocks
and run Jest on them to locate the earliest prefix that reproduces failures.

Usage: python3 tmp/bisect_parental_prefix_bisect.py

This script assumes the repository has `npm test` configured to run jest.
"""
import os
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEST_PATH = ROOT / 'stores' / '__tests__' / 'parentalStore.test.ts'
TMP_DIR = TEST_PATH.parent  # write temp prefix files next to the original test so imports resolve


def read_testsource():
    return TEST_PATH.read_text()


def find_it_positions(src: str):
    # find positions of 'it(' or "it.each" or 'test(' or 'test.each'
    pattern = re.compile(r"(^|\s)(it|test)(\.each\([^\)]*\))?\s*\(", re.M)
    return [m.start(0) for m in pattern.finditer(src)]


def make_prefix_file(src: str, keep: int, out_path: Path):
    # We will replace the (keep+1)..end occurrences of 'it'/'test' with 'it.skip'/'test.skip'
    # This preserves structure and imports.
    if keep <= 0:
        raise ValueError('keep must be >= 1')
    pattern = re.compile(r"(^|\s)(it|test)(\.each\([^\)]*\))?\s*\(", re.M)
    parts = []
    last = 0
    count = 0
    for m in pattern.finditer(src):
        count += 1
        # append text before this match
        parts.append(src[last:m.start(0)])
        word = m.group(2)
        each = m.group(3) or ''
        if count <= keep:
            # keep original
            parts.append(m.group(0))
        else:
            # replace with skip variant
            parts.append(m.group(0).replace(word, word + '.skip', 1))
        last = m.end(0)
    parts.append(src[last:])
    out_path.write_text(''.join(parts))


def run_jest_on_file(file_path: Path):
    cmd = ["npm", "test", "--", str(file_path), "-i", "--runInBand", "--detectOpenHandles"]
    print('\nRunning:', ' '.join(cmd))
    p = subprocess.run(cmd, cwd=ROOT)
    return p.returncode


def get_total_its(src: str):
    return len(re.findall(r"(^|\s)(it|test)(\.each\([^\)]*\))?\s*\(", src, flags=re.M))


def binary_bisect():
    src = read_testsource()
    total = get_total_its(src)
    print(f'Found {total} it/test blocks in {TEST_PATH}')
    if total == 0:
        return

    lo = 1
    hi = total
    failing_prefix = None
    # First ensure full file fails when run as a group (quick check)
    full_tmp = TMP_DIR / 'prefix_full.test.ts'
    make_prefix_file(src, total, full_tmp)
    rc_full = run_jest_on_file(full_tmp)
    if rc_full == 0:
        print('Full test file did not fail (exit code 0). Aborting bisect.')
        return

    # Binary search for smallest prefix that still fails
    while lo <= hi:
        mid = (lo + hi) // 2
        print(f'Checking prefix up to it #{mid} (range {lo}-{hi})')
        tmp_file = TMP_DIR / f'prefix_{mid}.test.ts'
        make_prefix_file(src, mid, tmp_file)
        rc = run_jest_on_file(tmp_file)
        if rc != 0:
            failing_prefix = mid
            hi = mid - 1
        else:
            lo = mid + 1

    if failing_prefix is not None:
        print(f'Found failing prefix at it #{failing_prefix}')
    else:
        print('No failing prefix found; failures may be due to interactions not captured by prefix runs.')


if __name__ == '__main__':
    binary_bisect()
