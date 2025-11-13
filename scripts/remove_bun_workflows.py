#!/usr/bin/env python3
"""Remove workflow files that mention 'bun' from remote branches.

This script will:
- list remote branches (origin), skipping 'main'
- for each branch, check for workflow files under .github/workflows that contain 'bun' (case-insensitive)
- if found, create a local branch, remove those files, commit, and push to origin

Be conservative: if push fails (protected branch / permission), it reports and continues.
"""
import subprocess
import sys
from pathlib import Path


def run(cmd, check=True, capture=False, text=True):
    return subprocess.run(cmd, shell=True, check=check, capture_output=capture, text=text)


def list_remote_branches():
    out = run("git for-each-ref --format='%(refname:short)' refs/remotes/origin", capture=True)
    branches = [b.strip().replace('origin/', '') for b in out.stdout.splitlines() if b.strip()]
    return branches


def grep_bun_files(branch):
    try:
        out = run(f"git grep -i --name-only 'bun' origin/{branch} -- .github/workflows || true", capture=True)
        files = [l.strip() for l in out.stdout.splitlines() if l.strip()]
        # Filter unique and only paths under .github/workflows
        files = [f for f in sorted(set(files)) if f.startswith('.github/workflows/')]
        return files
    except Exception:
        return []


def safe_checkout(branch, local_branch):
    run(f"git fetch origin {branch}")
    run(f"git checkout -B {local_branch} origin/{branch}")


def remove_and_push(branch, files):
    local_branch = f"remove-bun-workflows/{branch.replace('/', '-') }"
    print(f"  creating local branch {local_branch}")
    safe_checkout(branch, local_branch)
    removed = []
    for f in files:
        p = Path(f)
        if p.exists():
            run(f"git rm -f --quiet {f}")
            removed.append(f)
        else:
            # File may not exist in checked out tree; still attempt git rm in case
            try:
                run(f"git rm -f --quiet {f}")
                removed.append(f)
            except subprocess.CalledProcessError:
                print(f"    warning: failed to remove {f} (may not exist in this branch)")

    if not removed:
        print("  no files removed (nothing staged)")
        run("git checkout -")
        run(f"git branch -D {local_branch}")
        return (False, "no changes")

    # commit
    try:
        run("git commit -m 'chore(ci): remove Bun workflow files (automated cleanup)'")
    except subprocess.CalledProcessError as e:
        print("  nothing to commit or commit failed:", e)
        run("git checkout -")
        run(f"git branch -D {local_branch}")
        return (False, "commit failed or nothing to commit")

    # push
    try:
        run(f"git push origin HEAD:refs/heads/{branch}")
        result = True
        msg = "pushed"
    except subprocess.CalledProcessError as e:
        print(f"  push failed for branch {branch}: {e}")
        result = False
        msg = f"push failed: {e}"

    # cleanup local branch
    run("git checkout -")
    run(f"git branch -D {local_branch}")
    return (result, msg)


def main():
    branches = list_remote_branches()
    # skip main
    targets = [b for b in branches if b != 'main']
    summary = []
    for b in targets:
        files = grep_bun_files(b)
        if not files:
            continue
        print(f"=== Branch: {b} ===")
        for f in files:
            print(f"  matches: {f}")
        ok, msg = remove_and_push(b, files)
        summary.append((b, files, ok, msg))

    print("\nSummary:")
    for b, files, ok, msg in summary:
        print(f"- {b}: removed {len(files)} file(s) -> {msg}")


if __name__ == '__main__':
    main()
