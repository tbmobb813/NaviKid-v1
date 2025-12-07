# NaviKid-v1: Branch Consolidation Quick Reference

## Quick Start

### Option 1: Interactive Menu (Recommended)
```bash
bash branch-consolidation.sh
```

### Option 2: Direct Phase Execution
```bash
# Phase 1: Merge ready branches
bash branch-consolidation.sh 1

# Phase 2: Fix out-of-sync branches
bash branch-consolidation.sh 2

# Phase 3: Delete stale branches
bash branch-consolidation.sh 3

# Phases 1+2 combined
bash branch-consolidation.sh 4
```

### Option 3: Dry Run (Preview Changes)
```bash
bash branch-consolidation.sh 1 --dry-run
bash branch-consolidation.sh 2 --dry-run
```

---

## Branch Status Summary

| Branch | Status | Action | Priority |
|--------|--------|--------|----------|
| **feat/Supabase** | 77 ahead, 0 behind | ✅ MERGE | HIGH |
| **feat/transit** | 15 ahead, 0 behind | ✅ MERGE | HIGH |
| **chore/ts-fix-tests** | 178 ahead, 0 behind | ✅ MERGE* | HIGH |
| **feat/compliance** | 8 ahead, 28 behind | 🔄 REBASE | MEDIUM |
| **chore/upgrade-rn-mmkv-v4** | 14 ahead, 18 behind | 🔄 REBASE | MEDIUM |
| **test/fix/storage-mock-parental-auth** | 9 ahead, 19 behind | 🗑️ DELETE | LOW |

*chore/ts-fix-tests: Merge after running full test suite

---

## What's in Each Phase?

### Phase 1: LOW RISK (Ready to Merge)
- ✅ `feat/Supabase` → Merge to main
- ✅ `feat/transit` → Merge to main
- ✅ `chore/ts-fix-tests` → Merge to main (after testing)

**Time**: ~30 min  
**Rollback**: Revert commits if needed

---

### Phase 2: MEDIUM RISK (Needs Rebase)
- 🔄 `feat/compliance` → Rebase + merge OR delete
- 🔄 `chore/upgrade-rn-mmkv-v4` → Rebase + merge OR delete
- 🗑️ `test/fix/storage-mock-parental-auth` → Delete (likely superseded)

**Time**: 1-2 hours (depends on conflicts)  
**Rollback**: Force push original if rebased

---

### Phase 3: NO RISK (Cleanup)
Delete these branches:
- 🗑️ `sub-pr-35-cherry-picks` (local)
- 🗑️ `work/trace-map-transit` (local)
- 🗑️ `reproduce/trace-map-transit` (local)
- 🗑️ `docs/auto-fix-markdown` (remote)
- 🗑️ `docs/fix-top-docs` (remote)
- 🗑️ `claude/code-review-*` (remote - temporary AI work)
- 📦 `backup/feat-geolocation-local-edits-20251021T163737Z` (archive as tag)

**Time**: ~15 min  
**Risk**: None - branches archived or safe to delete

---

## Manual Commands (If Not Using Script)

### Check Status
```bash
git fetch -p
git rev-list --count main..feat/Supabase     # Should be 77
git rev-list --count main..feat/compliance   # Should be 8, behind 28
```

### Merge Phase 1 Branches
```bash
git checkout main
git pull origin main
git merge feat/Supabase && git push origin main
git merge feat/transit && git push origin main
npm test && npm run typecheck  # Before merging ts-fix-tests
git merge chore/ts-fix-tests && git push origin main
```

### Rebase Phase 2 Branches
```bash
# feat/compliance
git checkout feat/compliance
git rebase origin/main
npm test
git push origin feat/compliance --force-with-lease

# chore/upgrade-rn-mmkv-v4
git checkout chore/upgrade-rn-mmkv-v4
git rebase origin/main
npm install && npm test
git push origin chore/upgrade-rn-mmkv-v4 --force-with-lease
```

### Delete Branches (Phase 3)
```bash
# Local branches
git branch -D sub-pr-35-cherry-picks
git branch -D work/trace-map-transit
git branch -D reproduce/trace-map-transit

# Remote branches
git push origin :docs/auto-fix-markdown
git push origin :docs/fix-top-docs
git push origin :claude/code-review-018QyGs7hm281LoTKqv38cV5
git push origin :claude/project-review-improvements-011CUyeTFb2yW5W4cKCV9R29

# Archive backup as tag
git tag -a backup/feat-geolocation-local-edits-20251021T163737Z \
  origin/backup/feat-geolocation-local-edits-20251021T163737Z \
  -m "Archived backup from Oct 21, 2025"
git push origin backup/feat-geolocation-local-edits-20251021T163737Z
git push origin :backup/feat-geolocation-local-edits-20251021T163737Z
```

---

## Troubleshooting

### Merge Conflicts
If Phase 1 encounters conflicts:
```bash
# See what's conflicting
git status

# Manually resolve files, then:
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

### Rebase Conflicts (Phase 2)
If rebase encounters conflicts:
```bash
# Resolve conflicts in files
git add .
git rebase --continue

# Or start over if needed:
git rebase --abort
git push origin <branch> --force-with-lease
```

### Can't Push After Rebase
If you get "rejected (non-fast-forward)", use force-with-lease:
```bash
git push origin <branch> --force-with-lease
```

### Need to Undo a Merge/Rebase
```bash
# Get the original commit hash
git reflog

# Reset to that commit
git reset --hard <commit-hash>
git push origin <branch> --force-with-lease  # Only if needed
```

---

## Post-Consolidation Checklist

- [ ] Phase 1 branches merged to main
- [ ] Phase 2 branches rebased and passing tests
- [ ] Phase 3 branches deleted and cleaned up
- [ ] Run full test suite: `npm test`
- [ ] Run type checking: `npm run typecheck`
- [ ] Verify all CI/CD pipelines pass
- [ ] Update `.github/BRANCH_STRATEGY.md` with new conventions
- [ ] Notify team of consolidation completion

---

## Expected Outcome

**Before**:
```
main
├── feat/Supabase (77 commits)
├── feat/compliance (8 ahead, 28 behind)
├── feat/transit (15 commits)
├── chore/ts-fix-tests (178 commits!)
├── chore/upgrade-rn-mmkv-v4 (14 ahead, 18 behind)
├── test/fix/storage-mock-parental-auth (9 ahead, 19 behind)
└── [8+ temporary/stale branches]
```

**After**:
```
main ← All major work merged
├── feat/compliance ← Active feature
├── chore/upgrade-rn-mmkv-v4 ← Active chore
└── [clean state, ready for new work]
```

---

## Files Generated

1. **BRANCH_CLEANUP_ANALYSIS.md** - Detailed analysis of all branches
2. **branch-consolidation.sh** - Automated consolidation script
3. **BRANCH_CONSOLIDATION_QUICK_REFERENCE.md** - This file

---

## Support

For issues or questions:
1. Check the detailed analysis: `BRANCH_CLEANUP_ANALYSIS.md`
2. Run with `--dry-run` first: `bash branch-consolidation.sh 1 --dry-run`
3. Review the "Troubleshooting" section above

---

**Last Updated**: December 6, 2025  
**Status**: Ready to execute  
**Risk Level**: LOW (Phase 1) → MEDIUM (Phase 2) → NONE (Phase 3)
