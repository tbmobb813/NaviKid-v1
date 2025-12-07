#!/bin/bash

# NaviKid-v1: Branch Consolidation Script
# This script helps consolidate branches in the NaviKid-v1 repository
# Usage: bash branch-consolidation.sh [phase] [--dry-run]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DRY_RUN=false
PHASE=${1:-0}

# Helper functions
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

run_cmd() {
  local cmd=$1
  local description=$2
  
  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] $description"
    echo "  Command: $cmd"
  else
    log_info "$description"
    eval "$cmd"
    log_success "Done"
  fi
}

check_dependencies() {
  if ! command -v git &> /dev/null; then
    log_error "Git is not installed"
    exit 1
  fi
  
  if ! command -v npm &> /dev/null; then
    log_warning "npm not found - test commands will skip"
  fi
}

show_menu() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}NaviKid-v1: Branch Consolidation Menu${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  echo "Options:"
  echo "  1) Phase 1 - Merge Ready Branches (LOW RISK)"
  echo "  2) Phase 2 - Fix Out-of-Sync Branches (MEDIUM RISK)"
  echo "  3) Phase 3 - Delete Stale Branches (NO RISK)"
  echo "  4) Phase 1+2 - Full Consolidation"
  echo "  5) Check Branch Status"
  echo "  6) Fetch Latest Changes"
  echo "  0) Exit"
  echo ""
  read -p "Select option (0-6): " choice
}

check_status() {
  log_info "Checking branch status..."
  echo ""
  
  branches=(
    "feat/Supabase"
    "feat/compliance"
    "feat/transit"
    "chore/ts-fix-tests"
    "test/fix/storage-mock-parental-auth"
    "chore/upgrade-rn-mmkv-v4"
  )
  
  for branch in "${branches[@]}"; do
    if git rev-parse --verify "$branch" > /dev/null 2>&1; then
      ahead=$(git rev-list --count "main..$branch" 2>/dev/null || echo "?")
      behind=$(git rev-list --count "$branch..main" 2>/dev/null || echo "?")
      current_branch=$(git rev-parse --abbrev-ref HEAD)
      marker=""
      if [ "$current_branch" = "$branch" ]; then
        marker=" ← current"
      fi
      echo "  $branch: ${ahead} ahead, ${behind} behind${marker}"
    else
      log_warning "  $branch: Not found locally"
    fi
  done
  echo ""
}

fetch_latest() {
  log_info "Fetching latest changes..."
  run_cmd "git fetch -p" "Fetching from remote with prune"
  log_success "Fetch complete"
}

phase_1() {
  log_info "Phase 1: Merging Ready Branches (LOW RISK)"
  echo ""
  
  # Ensure clean main
  run_cmd "git checkout main" "Switching to main"
  run_cmd "git pull origin main" "Pulling latest main"
  
  current_status=$(git status --porcelain)
  if [ -n "$current_status" ]; then
    log_error "Uncommitted changes detected. Please commit or stash:"
    git status
    return 1
  fi
  
  # Merge feat/Supabase
  echo ""
  log_info "Merging feat/Supabase..."
  if git merge-base --is-ancestor feat/Supabase main; then
    log_warning "feat/Supabase already in main, skipping"
  else
    run_cmd "git merge feat/Supabase" "Merging feat/Supabase"
    run_cmd "git push origin main" "Pushing main"
  fi
  
  # Merge feat/transit
  echo ""
  log_info "Merging feat/transit..."
  if git merge-base --is-ancestor feat/transit main; then
    log_warning "feat/transit already in main, skipping"
  else
    run_cmd "git merge feat/transit" "Merging feat/transit"
    run_cmd "git push origin main" "Pushing main"
  fi
  
  # Merge chore/ts-fix-tests with testing
  echo ""
  log_info "Merging chore/ts-fix-tests (with tests)..."
  if git merge-base --is-ancestor chore/ts-fix-tests main; then
    log_warning "chore/ts-fix-tests already in main, skipping"
  else
    run_cmd "git merge chore/ts-fix-tests" "Merging chore/ts-fix-tests"
    
    if command -v npm &> /dev/null; then
      run_cmd "npm test" "Running tests"
      run_cmd "npm run typecheck" "Type checking"
    else
      log_warning "Skipping npm test/typecheck - npm not found"
    fi
    
    run_cmd "git push origin main" "Pushing main"
  fi
  
  log_success "Phase 1 Complete"
}

phase_2() {
  log_info "Phase 2: Fixing Out-of-Sync Branches (MEDIUM RISK)"
  echo ""
  
  # Fetch latest
  run_cmd "git fetch -p" "Fetching latest changes"
  
  # feat/compliance
  echo ""
  log_info "Rebasing feat/compliance..."
  if git rev-parse --verify feat/compliance > /dev/null 2>&1; then
    run_cmd "git checkout feat/compliance" "Switching to feat/compliance"
    run_cmd "git rebase origin/main" "Rebasing onto main"
    
    if command -v npm &> /dev/null; then
      run_cmd "npm test" "Running tests"
    fi
    
    run_cmd "git push origin feat/compliance --force-with-lease" "Force pushing rebased branch"
    log_success "feat/compliance rebased"
  else
    log_warning "feat/compliance not found locally"
  fi
  
  # chore/upgrade-rn-mmkv-v4
  echo ""
  log_info "Rebasing chore/upgrade-rn-mmkv-v4..."
  if git rev-parse --verify chore/upgrade-rn-mmkv-v4 > /dev/null 2>&1; then
    run_cmd "git checkout chore/upgrade-rn-mmkv-v4" "Switching to chore/upgrade-rn-mmkv-v4"
    run_cmd "git rebase origin/main" "Rebasing onto main"
    
    if command -v npm &> /dev/null; then
      run_cmd "npm install" "Installing dependencies"
      run_cmd "npm test" "Running tests"
    fi
    
    run_cmd "git push origin chore/upgrade-rn-mmkv-v4 --force-with-lease" "Force pushing rebased branch"
    log_success "chore/upgrade-rn-mmkv-v4 rebased"
  else
    log_warning "chore/upgrade-rn-mmkv-v4 not found locally"
  fi
  
  # test/fix/storage-mock-parental-auth
  echo ""
  log_info "Assessing test/fix/storage-mock-parental-auth..."
  read -p "Should this branch be kept? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Deleting test/fix/storage-mock-parental-auth..."
    run_cmd "git push origin :test/fix/storage-mock-parental-auth" "Deleting remote branch"
    run_cmd "git branch -D test/fix/storage-mock-parental-auth" "Deleting local branch"
  else
    if git rev-parse --verify test/fix/storage-mock-parental-auth > /dev/null 2>&1; then
      run_cmd "git checkout test/fix/storage-mock-parental-auth" "Switching branch"
      run_cmd "git rebase origin/main" "Rebasing onto main"
      run_cmd "git push origin test/fix/storage-mock-parental-auth --force-with-lease" "Force pushing"
      log_success "test/fix/storage-mock-parental-auth rebased"
    fi
  fi
  
  log_success "Phase 2 Complete"
}

phase_3() {
  log_info "Phase 3: Deleting Stale Branches (NO RISK)"
  echo ""
  
  local_branches=(
    "sub-pr-35-cherry-picks"
    "work/trace-map-transit"
    "reproduce/trace-map-transit"
  )
  
  remote_branches=(
    "docs/auto-fix-markdown"
    "docs/fix-top-docs"
    "claude/code-review-018QyGs7hm281LoTKqv38cV5"
    "claude/project-review-improvements-011CUyeTFb2yW5W4cKCV9R29"
    "claude/wire-supabase-integration-016ZLNkme6j4kdx2MEvQ4keE"
  )
  
  # Delete local branches
  for branch in "${local_branches[@]}"; do
    if git rev-parse --verify "$branch" > /dev/null 2>&1; then
      run_cmd "git branch -D $branch" "Deleting local branch: $branch"
    fi
  done
  
  # Delete remote branches
  for branch in "${remote_branches[@]}"; do
    if git rev-parse --verify "origin/$branch" > /dev/null 2>&1; then
      run_cmd "git push origin :$branch" "Deleting remote branch: $branch"
    fi
  done
  
  # Archive backup as tag
  if git rev-parse --verify "origin/backup/feat-geolocation-local-edits-20251021T163737Z" > /dev/null 2>&1; then
    log_info "Archiving backup as tag..."
    run_cmd "git tag -a backup/feat-geolocation-local-edits-20251021T163737Z origin/backup/feat-geolocation-local-edits-20251021T163737Z -m 'Archived backup from October 21, 2025'" "Creating archive tag"
    run_cmd "git push origin backup/feat-geolocation-local-edits-20251021T163737Z" "Pushing tag"
    run_cmd "git push origin :backup/feat-geolocation-local-edits-20251021T163737Z" "Deleting backup branch"
  fi
  
  log_success "Phase 3 Complete"
}

main() {
  check_dependencies
  
  # Check for --dry-run flag
  if [ "$2" = "--dry-run" ]; then
    DRY_RUN=true
    log_warning "Running in DRY RUN mode - no changes will be made"
    echo ""
  fi
  
  if [ -z "$PHASE" ] || [ "$PHASE" = "0" ]; then
    while true; do
      show_menu
      case $choice in
        1)
          phase_1
          ;;
        2)
          phase_2
          ;;
        3)
          phase_3
          ;;
        4)
          phase_1
          phase_2
          ;;
        5)
          check_status
          ;;
        6)
          fetch_latest
          ;;
        0)
          log_info "Exiting"
          exit 0
          ;;
        *)
          log_error "Invalid option"
          ;;
      esac
    done
  else
    case $PHASE in
      1)
        phase_1
        ;;
      2)
        phase_2
        ;;
      3)
        phase_3
        ;;
      *)
        log_error "Invalid phase: $PHASE (must be 1, 2, or 3)"
        exit 1
        ;;
    esac
  fi
}

main "$@"
