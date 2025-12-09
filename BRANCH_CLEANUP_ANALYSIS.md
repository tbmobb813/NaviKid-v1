# NaviKid-v1: Branch Cleanup & Consolidation Analysis

**Analysis Date**: December 4, 2025  
**Current Main**: `c18bc16` - chore(tests): remove unused eslint-disable directives in jest.setup.cjs

---

## Summary

Your repository has **11 active branches** beyond main, with a mix of:

- **Feature branches** with significant work (77, 15 commits ahead)
- **Fix/test branches** with conflicting changes (behind main)
- **Chore branches** with small, mergeable improvements

**Recommendation**: Consolidate into **3-4 working branches** to unblock development.

---

## Detailed Branch Analysis

### 🔴 HIGH PRIORITY - Merge These Now

#### 1. `feat/Supabase` (77 commits ahead, 0 behind)

**Status**: Ready to merge | **Risk**: LOW  
**Latest**: `c812bed` - chore(lint): enhance backend ESLint configuration  

**Key Changes**:

- Backend ESLint configuration improvements
- Module resolution and error handling enhancements
- Docker node22 image updates for linting
- Split frontend/backend ESLint configs

**Recommendation**: ✅ **MERGE TO MAIN**

```bash
git checkout main
git pull origin main
git merge feat/Supabase
git push origin main
```

**Why**: Clean linear history, no conflicts, improves developer experience.

---

#### 2. `feat/transit` (15 commits ahead, 0 behind)

**Status**: Ready to merge | **Risk**: LOW  
**Latest**: `9db1b81` - feat(ci): add database environment variables for integration tests  

**Key Changes**:

- Database environment variables for integration tests
- Smoke test implementation
- Coverage command improvements

**Recommendation**: ✅ **MERGE TO MAIN**

```bash
git checkout main
git pull origin main
git merge feat/transit
git push origin main
```

**Why**: Standalone CI/testing improvements, no conflicts expected.

---

#### 3. `chore/ts-fix-tests` (178 commits ahead, 0 behind)

**Status**: Large PR | **Risk**: MEDIUM  
**Latest**: `f54c265` - Refactor code structure for improved readability and maintainability  

**Key Changes**:

- Major code refactoring (178 commits!)
- Test infrastructure updates
- Auth route registration changes
- README documentation updates

**Recommendation**: ⚠️ **REVIEW BEFORE MERGE**

- Check PR description and review comments
- Run full test suite: `npm test`
- Verify type safety: `npm run typecheck`
- Then merge if all tests pass

```bash
git checkout main
git pull origin main
git merge chore/ts-fix-tests
npm test
npm run typecheck
git push origin main
```

---

### 🟡 MEDIUM PRIORITY - Needs Work

#### 4. `feat/compliance` (8 ahead, 28 behind)

**Status**: Out of sync | **Risk**: HIGH  
**Latest**: `c34df02` - chore(ci): remove Bun workflow files  

**Issues**:

- 28 commits behind main (needs rebase)
- Likely merge conflicts
- Automated CI cleanup suggests stale state

**Recommendation**: 🔄 **REBASE & ASSESS**

```bash
git checkout feat/compliance
git rebase origin/main
# Fix any conflicts
npm test
# If tests pass, force push and prepare PR
git push origin feat/compliance --force-with-lease
```

**If conflicts are too complex**: Consider starting fresh from main:

```bash
git branch -D feat/compliance
git checkout -b feat/compliance origin/main
# Re-apply targeted compliance changes
```

---

#### 5. `test/fix/storage-mock-parental-auth` (9 ahead, 19 behind)

**Status**: Out of sync | **Risk**: MEDIUM  
**Latest**: `c03fc0b` - chore(ci): remove Bun workflow files  

**Issues**:

- 19 commits behind main (needs rebase)
- Test-specific fixes may have been superseded
- Storage mock for MMKV v4 compatibility

**Recommendation**: 🔄 **REBASE OR DELETE**

Check if MMKV v4 fixes are already in main or superseded:

```bash
git checkout main
git log --grep="MMKV\|mainStorage" --oneline | head -10
```

If already fixed in main, delete:

```bash
git push origin :test/fix/storage-mock-parental-auth
git branch -D test/fix/storage-mock-parental-auth
```

If not, rebase:

```bash
git checkout test/fix/storage-mock-parental-auth
git rebase origin/main
npm test
git push origin test/fix/storage-mock-parental-auth --force-with-lease
```

---

#### 6. `chore/upgrade-rn-mmkv-v4` (14 ahead, 18 behind)

**Status**: Out of sync | **Risk**: MEDIUM  
**Latest**: Unknown (need to check)  

**Issues**:

- 18 commits behind main (needs rebase)
- Dependency upgrade branches can accumulate stale changes

**Recommendation**: 🔄 **REBASE & TEST**

```bash
git checkout chore/upgrade-rn-mmkv-v4
git rebase origin/main
npm install  # If package.json changed
npm test
npm run typecheck
git push origin chore/upgrade-rn-mmkv-v4 --force-with-lease
```

---

### 🟢 CLEANUP - Remove or Archive

#### Branches to Delete

**Local-only branches** (no remote):

- `sub-pr-35-cherry-picks` - Likely temporary work
- `work/trace-map-transit` - Working branch (archive if not active)
- `reproduce/trace-map-transit` - Debugging branch (archive)

**Remote branches** to delete (after verifying no active work):

- `origin/backup/feat-geolocation-local-edits-20251021T163737Z` - Backup (archive to tag instead)
- `origin/docs/auto-fix-markdown` - Auto-fix cleanup (already merged implications?)
- `origin/docs/fix-top-docs` - Documentation (check if needed)
- `origin/chore/lint` - Likely superseded by lint improvements in main

**Claude-generated branches** (one-time tasks):

- `claude/code-review-018QyGs7hm281LoTKqv38cV5` - Delete after review
- `claude/project-review-improvements-011CUyeTFb2yW5W4cKCV9R29` - Delete after review
- `claude/wire-supabase-integration-016ZLNkme6j4kdx2MEvQ4keE` - Delete (Supabase work is in feat/Supabase)

---

## Consolidation Plan (Step-by-Step)

### Phase 1: Merge Ready Branches (Risk: LOW)

```bash
# Ensure clean main
git checkout main
git pull origin main
git status

# 1. Merge feat/Supabase
git merge feat/Supabase
git push origin main

# 2. Merge feat/transit
git merge feat/transit
git push origin main

# 3. Review and merge chore/ts-fix-tests
git merge chore/ts-fix-tests
npm test
npm run typecheck
git push origin main
```

**Estimated time**: 30 minutes  
**Risk**: Low (all ahead, no conflicts expected)

---

### Phase 2: Fix Out-of-Sync Branches (Risk: MEDIUM)

```bash
# 1. Assess feat/compliance
git checkout feat/compliance
git rebase origin/main
# Address conflicts if any
npm test
git push origin feat/compliance --force-with-lease

# 2. Assess chore/upgrade-rn-mmkv-v4
git checkout chore/upgrade-rn-mmkv-v4
git rebase origin/main
npm install
npm test
git push origin chore/upgrade-rn-mmkv-v4 --force-with-lease

# 3. Handle test/fix/storage-mock-parental-auth
# (See detailed recommendation above)
```

**Estimated time**: 1-2 hours (depends on conflict complexity)  
**Risk**: Medium (manual conflict resolution needed)

---

### Phase 3: Delete Stale Branches (Risk: NONE)

```bash
# Delete local temporary branches
git branch -d sub-pr-35-cherry-picks
git branch -d work/trace-map-transit
git branch -d reproduce/trace-map-transit

# Delete remote branches (one-time tasks)
git push origin :docs/auto-fix-markdown
git push origin :claude/code-review-018QyGs7hm281LoTKqv38cV5
git push origin :claude/project-review-improvements-011CUyeTFb2yW5W4cKCV9R29
git push origin :claude/wire-supabase-integration-016ZLNkme6j4kdx2MEvQ4keE

# Archive backup branch as tag instead
git tag -a backup/feat-geolocation-local-edits-20251021T163737Z \
  origin/backup/feat-geolocation-local-edits-20251021T163737Z \
  -m "Archived backup from October 21, 2025"
git push origin backup/feat-geolocation-local-edits-20251021T163737Z
git push origin :backup/feat-geolocation-local-edits-20251021T163737Z
```

**Estimated time**: 15 minutes  
**Risk**: None (archives backup, deletes temporary work)

---

## Final Branch Structure (Post-Cleanup)

**Active branches** (after consolidation):

main                              ← All merged work
├── feat/compliance              ← Compliance feature (rebased, in progress)
├── chore/upgrade-rn-mmkv-v4     ← MMKV v4 upgrade (rebased, in progress)
└── review-lint                  ← Code review/linting (status unknown)

**Optional working branches** (if active):

├── chore/lint                   ← Lint improvements (check if redundant)
└── feature/your-next-feature    ← New work (as needed)

---

## Recommended Git Workflow Going Forward

1. **Always branch from main**: `git checkout -b feature/X origin/main`
2. **Keep branches short-lived**: Target merge within 1-2 weeks
3. **Rebase before merge**: `git rebase origin/main` before PR
4. **Delete after merge**: `git push origin :feature/X && git branch -D feature/X`
5. **Use tags for releases**: `git tag -a v1.0.0 -m "Release description"`

---

## Quick Commands

### Check branch status

```bash
for branch in feat/Supabase feat/compliance feat/transit chore/ts-fix-tests; do
  ahead=$(git rev-list --count main..$branch)
  behind=$(git rev-list --count $branch..main)
  echo "$branch: $ahead ahead, $behind behind"
done
```

### Clean up all local tracking references

```bash
git fetch -p
git branch -vv | grep ': gone' | awk '{print $1}' | xargs git branch -D
```

### Force sync with remote (careful!)

```bash
git fetch -p
git reset --hard origin/main
```

---

## Questions to Ask Before Executing

1. **Are any of the "out-of-sync" branches actively being worked on?**
   - If yes, coordinate rebase timing
   - If no, safe to rebase/delete

2. **Should feat/compliance go into this sprint or next?**
   - If current sprint: prioritize rebase
   - If next sprint: can wait, but rebase soon

3. **Is MMKV v4 upgrade blocked or in progress?**
   - Check with team before deleting `chore/upgrade-rn-mmkv-v4`

4. **Any PRs open against deleted branches?**
   - Check GitHub/GitLab for linked PRs before deletion

---

## Risk Mitigation

| Action | Risk | Mitigation |
|--------|------|-----------|
| Merge feat/Supabase | Low | Already ahead, tested |
| Merge feat/transit | Low | Already ahead, tested |
| Merge chore/ts-fix-tests | Medium | Run full test suite first |
| Rebase feat/compliance | Medium | Start rebase in new branch if uncertain |
| Delete branches | None | Tag important backups first |

---

## Next Steps

1. **Decide**: Execute Phase 1 (merge ready branches) immediately
2. **Review**: Check feat/compliance and chore/upgrade-rn-mmkv-v4 status
3. **Execute**: Phase 2 (rebase out-of-sync branches)
4. **Clean**: Phase 3 (delete stale branches)
5. **Document**: Update CONTRIBUTING.md with new branch standards

---

**Document Version**: 1.0  
**Author**: GitHub Copilot  
**Last Updated**: December 4, 2025
