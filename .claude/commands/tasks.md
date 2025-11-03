---
description: Quick reference for priority tasks and implementation checklist
---

# KidMap Priority Tasks

## 🔴 CRITICAL - Week 1 (Security & Compliance)

### Task 1: Security Hardening
**Status:** ⏳ Not Started
**Files:** `stores/parentalStore.ts`
**Estimated Time:** 4-6 hours

**Checklist:**
- [ ] Install expo-crypto dependency
- [ ] Hash parent PIN with SHA-256 + salt
- [ ] Move PIN to expo-secure-store
- [ ] Add rate limiting (max 5 attempts, 15min lockout)
- [ ] Implement session timeout (30 minutes)
- [ ] Write tests for authentication
- [ ] Test on both iOS and Android

**Dependencies:**
```bash
npx expo install expo-crypto expo-secure-store
```

### Task 2: Data Retention Enforcement
**Status:** ⏳ Not Started
**Files:** `utils/dataRetention.ts` (new), `app/_layout.tsx`
**Estimated Time:** 3-4 hours

**Checklist:**
- [ ] Create `utils/dataRetention.ts`
- [ ] Implement retention policies (90 days check-ins, 90 days pings)
- [ ] Add automatic purging on app startup
- [ ] Add daily cleanup interval
- [ ] Initialize in `app/_layout.tsx`
- [ ] Write tests for retention logic
- [ ] Add admin UI to view retention status

### Task 3: Sentry Configuration
**Status:** ⏳ Not Started
**Files:** `utils/sentry.ts`, `app/_layout.tsx`, `.env`
**Estimated Time:** 2-3 hours

**Checklist:**
- [ ] Create Sentry account (free tier: 5K events/mo)
- [ ] Get DSN from Sentry dashboard
- [ ] Add EXPO_PUBLIC_SENTRY_DSN to .env
- [ ] Complete utils/sentry.ts implementation
- [ ] Initialize in app/_layout.tsx
- [ ] Test error reporting
- [ ] Configure PII stripping
- [ ] Set up performance monitoring

**Sentry Setup:**
```bash
# Install Sentry
npm install @sentry/react-native

# Get DSN from: https://sentry.io/
# Add to .env:
EXPO_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### Task 4: Create Strategic Docs
**Status:** ⏳ Not Started
**Files:** `docs/strategy/` (new directory)
**Estimated Time:** 2-3 hours

**Checklist:**
- [ ] Create `docs/strategy/UVP.md` (Unique Value Proposition)
- [ ] Create `docs/strategy/personas.md` (User personas)
- [ ] Create `docs/strategy/competitive-positioning.md`
- [ ] Create `docs/strategy/user-journey-maps.md`
- [ ] Review with stakeholders

## 🟡 HIGH PRIORITY - Weeks 2-4

### Task 5: User Research Preparation
**Status:** ⏳ Not Started
**Files:** `docs/research/` (new directory)
**Estimated Time:** Ongoing

**Checklist:**
- [ ] Create research directory structure
- [ ] Draft parent interview script
- [ ] Draft child usability test protocol
- [ ] Prepare educator consultation questions
- [ ] Contact special needs specialists
- [ ] Set up incentive payment system
- [ ] Create recruitment materials
- [ ] Schedule 15-20 parent interviews
- [ ] Schedule 20+ child sessions
- [ ] Schedule 5-7 educator consultations

### Task 6: Compliance Documentation
**Status:** ⏳ Not Started
**Files:** `docs/privacy/` (new directory)
**Estimated Time:** 8-12 hours (plus legal review)

**Checklist:**
- [ ] Shortlist 3 privacy lawyers
- [ ] Send RFPs to lawyers
- [ ] Create `docs/privacy/COPPA_COMPLIANCE.md`
- [ ] Create `docs/privacy/GDPR_COMPLIANCE.md`
- [ ] Create `docs/privacy/CCPA_COMPLIANCE.md`
- [ ] Create `docs/privacy/data-flow-diagram.md`
- [ ] Update `docs/privacy-policy.md` (remove DRAFT)
- [ ] Legal review and approval
- [ ] Implement parental consent verification flow

### Task 7: Offline Validation Testing
**Status:** ⏳ Not Started
**Files:** `__tests__/offline-mode.test.ts` (new), `docs/OFFLINE_READINESS.md` (new)
**Estimated Time:** 4-6 hours

**Checklist:**
- [ ] Create `docs/OFFLINE_READINESS.md`
- [ ] Document offline capabilities
- [ ] Write automated airplane-mode tests
- [ ] Create manual test scenarios
- [ ] Test map caching offline
- [ ] Test safe zone functionality offline
- [ ] Test category management offline
- [ ] Test trip planning offline

### Task 8: Analytics Setup
**Status:** ⏳ Not Started
**Files:** `utils/analytics.ts` (new), `docs/analytics/` (new)
**Estimated Time:** 3-4 hours

**Checklist:**
- [ ] Create Plausible account ($9/mo)
- [ ] Create `utils/analytics.ts`
- [ ] Implement opt-in consent flow
- [ ] Create events taxonomy (`docs/analytics/events.md`)
- [ ] Add privacy toggle in parent dashboard
- [ ] Document in privacy policy

## 🟢 MEDIUM PRIORITY - Weeks 5-8

### Task 9: Voice Guidance Integration
**Status:** ⚠️ Components exist, needs integration
**Files:** `components/VoiceNavigation.tsx`, `stores/navigationStore.ts`
**Estimated Time:** 6-8 hours

**Checklist:**
- [ ] Review existing VoiceNavigation.tsx component
- [ ] Integrate with routing system
- [ ] Add TTS for turn-by-turn directions
- [ ] Add voice prompts for safety alerts
- [ ] Test with children (accessibility)
- [ ] Add settings toggle
- [ ] Update accessibility documentation

### Task 10: Backend Service Development
**Status:** ⏳ Transit proxy exists, needs expansion
**Files:** `server/` directory
**Estimated Time:** 40-60 hours (2-3 weeks)

**Checklist:**
- [ ] Bootstrap Fastify + TypeScript project
- [ ] Set up PostgreSQL + PostGIS database
- [ ] Configure Prisma ORM
- [ ] Implement authentication endpoints (JWT)
- [ ] Create user/family management API
- [ ] Build safe zone sync endpoints
- [ ] Add check-in history API
- [ ] Implement device ping coordination
- [ ] Add real-time layer (Socket.io)
- [ ] Write API documentation
- [ ] Deploy to Railway (staging)
- [ ] Deploy to AWS (production)

### Task 11: Progressive Independence System
**Status:** ⏳ Not Started
**Files:** `stores/progressionStore.ts` (new), `components/ProgressionUI.tsx` (new)
**Estimated Time:** 12-16 hours

**Checklist:**
- [ ] Define 4-5 competency levels
- [ ] Document unlock criteria
- [ ] Create progression store
- [ ] Build progression UI component
- [ ] Implement parent approval workflow
- [ ] Add celebration animations
- [ ] Create level-based feature gates
- [ ] User test with families

## 📊 Testing Checklist

### Unit Tests
- [ ] parentalStore authentication tests
- [ ] Data retention tests
- [ ] Validation utility tests
- [ ] Gamification store tests

### Integration Tests
- [ ] Offline mode end-to-end
- [ ] Parent dashboard workflows
- [ ] Safety panel features
- [ ] Photo check-in with GPS verification

### Security Tests
- [ ] PIN brute-force protection
- [ ] Session timeout enforcement
- [ ] Data encryption verification
- [ ] HTTPS enforcement

### Accessibility Tests
- [ ] Screen reader compatibility
- [ ] High contrast mode
- [ ] Large text settings
- [ ] Voice navigation

## 📋 Documentation Checklist

### Technical Docs
- [ ] API documentation (backend)
- [ ] Component documentation (Storybook?)
- [ ] Testing guide updates
- [ ] Deployment guide

### Legal Docs
- [ ] Privacy policy (final, approved)
- [ ] Terms of service (final, approved)
- [ ] COPPA compliance checklist
- [ ] GDPR compliance checklist

### Strategic Docs
- [ ] UVP document
- [ ] User personas
- [ ] Competitive positioning
- [ ] User journey maps

### User Docs
- [ ] Parent guide
- [ ] Child guide (age-appropriate)
- [ ] FAQ
- [ ] Troubleshooting guide

## 💰 Budget Tracking

| Item | Budget | Status | Notes |
|---|---|---|---|
| Privacy Lawyer | $10K-20K | ⏳ Pending | RFP process |
| User Research | $5K-10K | ⏳ Pending | Participant incentives |
| Infrastructure | $2K-5K | ⏳ Pending | Railway + AWS |
| Beta Program | $3K-5K | ⏳ Pending | Recruitment |
| Sentry | $0-26/mo | ⏳ Pending | Start with free tier |
| Plausible | $9/mo | ⏳ Pending | Analytics |
| **Total** | **$20K-40K** | | 90-day runway |

## 🚀 Weekly Goals

### Week 1
- ✅ Security hardening complete
- ✅ Sentry configured
- ✅ Strategic docs created
- ✅ Lawyer shortlisted

### Week 2
- Data retention implemented
- Analytics setup complete
- User research recruitment started
- Compliance docs drafted

### Week 3
- User research in progress (50% complete)
- Legal review scheduled
- Offline testing complete
- Test coverage improved

### Week 4
- User research complete (synthesis)
- Compliance docs reviewed by lawyer
- Voice guidance integrated
- Backend development started

### Week 8
- Backend service deployed (staging)
- Progressive independence system complete
- 50% of Week 12 goals met

### Week 12 (Beta Launch)
- 100+ families recruited
- Legal approvals complete
- Production deploy
- Monitoring dashboards live

---

Use this checklist to track progress. Update status as tasks are completed.

**Commands:**
- `/init` - Reload project context
- `/dev` - Development assistant
- `/tasks` - This checklist
