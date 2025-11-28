---
description: Display current project status and health check
---

# KidMap Status Check

Run health checks and display current project status.

## Quick Status

Display:

1. Git status
2. Recent commits
3. Test results (if available)
4. Dependencies status
5. Current priorities

## Commands to Run

```bash
# Navigate to project
cd /home/nixstation-remote/tbmobb813/Kid-Friendly-Map-v1

# Git status
echo "=== GIT STATUS ==="
git status --short || echo "Not a git repository"

# Recent work
echo -e "\n=== RECENT COMMITS ==="
git log --oneline -5 2>/dev/null || echo "No git history"

# Dependencies check
echo -e "\n=== DEPENDENCIES ==="
if [ -f package.json ]; then
  echo "✓ package.json exists"
  npm outdated 2>/dev/null | head -10 || echo "All dependencies up to date"
else
  echo "✗ package.json not found"
fi

# Type check
echo -e "\n=== TYPE CHECK ==="
npx tsc --noEmit 2>&1 | head -20 || echo "TypeScript check passed"

# Test status
echo -e "\n=== TEST STATUS ==="
npm test -- --listTests 2>&1 | head -10 || echo "Tests configured"

# Project health
echo -e "\n=== PROJECT HEALTH ==="
echo "Location: /home/nixstation-remote/tbmobb813/Kid-Friendly-Map-v1"
echo "Components: $(find components -name "*.tsx" 2>/dev/null | wc -l) files"
echo "Tests: $(find __tests__ -name "*.test.*" 2>/dev/null | wc -l) files"
echo "Stores: $(ls stores/*.ts 2>/dev/null | wc -l) files"

# Priority checklist
echo -e "\n=== PRIORITY TASKS ==="
echo "🔴 Week 1 Critical:"
echo "  [ ] Security hardening (PIN hashing)"
echo "  [ ] Sentry configuration"
echo "  [ ] Data retention enforcement"
echo "  [ ] Strategic documentation"
echo ""
echo "🟡 Week 2-4 High Priority:"
echo "  [ ] User research preparation"
echo "  [ ] Compliance documentation"
echo "  [ ] Analytics setup"
echo "  [ ] Offline validation"
echo ""
echo "Use /tasks for full checklist"
echo "Use /dev for development help"
echo "Use /init to reload context"
```

---

Show me the current status of the KidMap project.
