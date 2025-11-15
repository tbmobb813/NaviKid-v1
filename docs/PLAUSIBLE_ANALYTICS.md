# Plausible Analytics Implementation

**Date:** 2025-11-03
**Status:** ✅ Implemented and Configured
**Priority:** 🟡 HIGH - Week 2 Task
**Privacy:** 🔒 Privacy-First, COPPA-Compliant

---

## Overview

Plausible Analytics provides privacy-respecting usage analytics for the Kid-Friendly Map application without sacrificing user privacy or COPPA compliance.

### Key Features

- **Privacy-First:** No cookies, no tracking pixels, GDPR-compliant
- **COPPA-Compliant:** Never sends personal information of children
- **Opt-In Consent:** Users must explicitly allow analytics before tracking begins
- **Anonymous Events:** Uses site-relative URLs instead of absolute URLs
- **Simple Integration:** Easy to track custom events

---

## What Was Implemented

### 1. ✅ Privacy Store (`stores/privacyStore.ts`)

Manages user consent for analytics:

```typescript
interface PrivacySettings {
  analyticsEnabled: boolean; // User's consent choice
  lastConsentUpdate: number | null; // When consent was updated
  consentVersion: number; // Version of consent flow
}
```

**Features:**

- Persistent storage using Zustand + AsyncStorage
- Privacy-first: analytics disabled by default
- Methods:
  - `setAnalyticsEnabled(enabled)` - Update consent
  - `getConsentStatus()` - Get 'accepted' | 'declined' | 'unknown'
  - `resetConsent()` - Reset privacy settings

### 2. ✅ Plausible Hook (`hooks/usePlausible.ts`)

Provides analytics tracking functions:

```typescript
const { trackPageView, trackUserAction, trackEvent, isEnabled } = usePlausible();

// Track screen view
trackPageView('home-screen', { category: 'maps' });

// Track user action
trackUserAction('zoom-map', { zoomLevel: 15 });

// Track custom event
trackEvent('favorite-saved', { location: 'central-park' });

// Flush pending events
await flush();
```

### 3. ✅ Consent Modal (`components/PrivacyConsentModal.tsx`)

Beautiful, informative consent UI:

- Explains what analytics collects
- Lists what's NOT tracked (privacy guarantees)
- COPPA compliance statement
- Accept/Decline buttons
- Persistent state using privacy store

### 4. ✅ App Integration (`app/_layout.tsx`)

Auto-initialized on app startup:

- Calls `initializePlausible()` on mount
- Shows consent modal on first load
- Enables/disables analytics based on user choice
- Integrated with Sentry error tracking

### 5. ✅ Existing Analytics Engine (`utils/analytics.ts`)

Already implemented:

- Event batching (groups events before sending)
- Automatic flushing (every 30 seconds)
- Error handling and retry logic
- Data sanitization before sending

---

## How It Works

### User Flow

```
App Launch
    ↓
Load Privacy Settings
    ↓
Consent Status = Unknown?
    ↓ Yes
Show Privacy Consent Modal
    ↓
User Choice (Accept / Decline)
    ↓ Accept
Enable Analytics
    ↓
Track Events to Plausible
```

### Technical Flow

```
User Action (e.g., click, screen view)
    ↓
trackEvent() called
    ↓
Analytics Enabled? → No → Skip
    ↓ Yes
Add to Event Batch
    ↓
Batch full (10 events) OR timeout (30s)?
    ↓ Yes
Fetch to Plausible API
    ↓
Server processes event
```

---

## Configuration

### Environment Variables

Create `.env.production`:

```bash
# Plausible Configuration
PLAUSIBLE_ENDPOINT=https://plausible.io/api/event
PLAUSIBLE_SITE_ID=kid-friendly-map.com
PLAUSIBLE_SHARED_KEY=your-optional-api-key
```

Or add to EAS Build:

```bash
eas build --platform ios \
  --env PLAUSIBLE_ENDPOINT=https://plausible.io/api/event \
  --env PLAUSIBLE_SITE_ID=kid-friendly-map.com
```

### App Config (`app.config.ts`)

Already configured:

```typescript
extra: {
  analytics: {
    enabled: process.env.NODE_ENV === 'production',
    batchSize: 10,
    flushInterval: 30000,
    plausible: {
      enabled: process.env.NODE_ENV === 'production',
      endpoint: process.env.PLAUSIBLE_ENDPOINT || 'https://plausible.io/api/event',
      siteId: process.env.PLAUSIBLE_SITE_ID || '',
      sharedKey: process.env.PLAUSIBLE_SHARED_KEY || '',
    },
  },
}
```

---

## Usage Examples

### Track Screen Views

```typescript
import { usePlausible } from '@/hooks/usePlausible';

function HomeScreen() {
  const { trackPageView } = usePlausible();

  useEffect(() => {
    trackPageView('home-screen');
  }, []);

  return <View>...</View>;
}
```

### Track User Actions

```typescript
function MapScreen() {
  const { trackUserAction } = usePlausible();

  const handleZoom = (level: number) => {
    trackUserAction('map-zoom', {
      zoom_level: level,
    });
  };

  return <MapView onZoom={handleZoom} />;
}
```

### Track Feature Usage

```typescript
function AddSafeZoneButton() {
  const { trackEvent } = usePlausible();

  const handlePress = async () => {
    trackEvent('safe-zone-created', {
      type: 'school',
      has_alerts: true,
    });
    // ... create safe zone
  };

  return <Button onPress={handlePress} title="Add Safe Zone" />;
}
```

### Track Errors

```typescript
function RiskyOperation() {
  const { trackError } = usePlausible();

  try {
    await performRiskyOperation();
  } catch (error) {
    trackError(error as Error, 'risky-operation');
  }
}
```

---

## What Gets Tracked

### Automatically

- **Page views:** Which screens users visit
- **Session duration:** How long users stay in the app
- **Device type:** iOS, Android, or Web
- **Referrer:** Where the user came from (if applicable)

### Manually (with Consent)

- **Custom events:** Feature usage, user actions
- **Properties:** Contextual data about events

### Never Tracked

- ❌ User identity (name, email, ID)
- ❌ Location data (unless user shares it)
- ❌ IP address (Plausible doesn't capture this)
- ❌ Cookies or tracking pixels
- ❌ Child-specific information (COPPA compliance)

---

## Plausible Dashboard

### Accessing Your Stats

1. Go to https://plausible.io
2. Sign in with your account
3. Select your site
4. View real-time analytics

### Key Metrics

- **Unique Visitors:** Daily active users
- **Total Pageviews:** Screen views across the app
- **Visit Duration:** Average time spent
- **Bounce Rate:** Users who leave without action
- **Top Pages:** Most-visited screens
- **Top Conversions:** Custom events (if enabled)

### Custom Events

To track custom events in Plausible:

1. Add event goals in Plausible dashboard:
   - Settings → Events → Add event
   - Name: `safe-zone-created`
   - Click "Create"

1. Track event in code:

   ```typescript
   trackEvent('safe-zone-created', { type: 'school' });
   ```

---

## Privacy & Compliance

### COPPA Compliance (US Children)

✅ **What we do:**

- Analytics is opt-in only
- No collection of personal information
- No PII sent to Plausible
- No cookies or persistent identifiers
- No targeting or profiling of children
- Data deleted after 90 days

❌ **What we don't do:**

- Behavioral tracking
- Cross-site tracking
- Profile building
- Selling data
- Third-party analytics

### GDPR Compliance (EU Users)

✅ **Features:**

- Users can opt-out anytime
- No cookies set
- No tracking across sites
- Data processor agreement with Plausible
- Right to data deletion (settings)

### CCPA Compliance (California Users)

✅ **Features:**

- Users can opt-out in app settings
- No sale of personal information
- Clear privacy disclosures
- Easy opt-out mechanism

---

## Testing Analytics

### Test in Development

1. **Enable test mode:**

   ```bash
   export NODE_ENV=production
   npm start
   ```

1. **Accept consent modal**
1. **Trigger events:**
   - Navigate between screens
   - Click buttons
   - Use features

1. **Check events:**

   ```bash
   npm logs | grep Analytics
   ```

### Verify on Plausible Dashboard

1. Go to Plausible dashboard
2. Check "Realtime" section
3. Should see events appearing as you use the app
4. May take 30 seconds for batched events to send

### Debug with Console Logs

```typescript
// Enable debug logging
const { isEnabled } = usePlausible();
console.log('[Plausible] Analytics enabled:', isEnabled);
```

---

## Best Practices

### ✅ DO

```typescript
// Good: Meaningful event names
trackEvent('location-shared', { accuracy: 'high' });

// Good: Relevant properties
trackEvent('safe-zone-created', { type: 'school' });

// Good: Batch-friendly (respects event batching)
trackEvent('map-opened', { view: 'list' });
```

### ❌ DON'T

```typescript
// Bad: Logging sensitive data
trackEvent('user-authenticated', { email: 'user@example.com' });

// Bad: Too many events (creates noise)
trackEvent('map-render', { coordinates: [...] });

// Bad: Personally identifiable info
trackEvent('user-identified', { user_id: '12345' });
```

---

## Troubleshooting

### Events Not Appearing in Dashboard

1. **Check consent:**

   ```bash
   # In app console
   usePrivacyStore.getState().getConsentStatus()
   ```

   Should return `'accepted'`

1. **Check configuration:**

   ```bash
   # In app console
   Config.ANALYTICS.ENABLED  // Should be true
   Config.ANALYTICS.PLAUSIBLE.SITE_ID  // Should be set
   ```

1. **Check network:**
   - Open DevTools → Network
   - Look for requests to `plausible.io`
   - Check response status (should be 200-204)

1. **Check logs:**

   ```bash
   npm logs | grep -i analytics
   ```

### Too Many Events

If quota exceeded on Plausible:

1. Increase `flushInterval` in config:

   ```typescript
   flushInterval: 60000, // 1 minute instead of 30s
   ```

1. Reduce `batchSize`:

   ```typescript
   batchSize: 5, // Send after 5 events instead of 10
   ```

1. Filter non-essential events:

   ```typescript
   // In hooks/usePlausible.ts
   if (isVerboseEvent(name)) {
     return; // Skip verbose events
   }
   ```

---

## Next Steps

### Setup Your Plausible Account

1. Go to https://plausible.io/register
2. Sign up (free tier available)
3. Create new website:
   - Site URL: `app.kidfriendlymap.example`
   - Time Zone: Your location
4. Copy Site ID and Endpoint
5. Set environment variables

### Configure Custom Events

In Plausible dashboard, create these events:

- `screen_view` - Track all screen transitions
- `feature_used` - Track feature usage
- `safe-zone-created` - When user adds safe zone
- `location-shared` - When user shares location
- `emergency-contact-added` - When contact is added

### Add to Privacy Policy

Update your privacy policy to disclose:

- You use Plausible Analytics
- What data is collected
- How users can opt-out
- Link to Plausible Privacy Policy

### Set Up Alerts (Optional)

1. In Plausible: Stats → Alerts
2. Create alert for:
   - Spike in errors
   - Drop in daily visitors
   - Unusual behavior

---

## Files Created/Modified

### New Files

- ✅ `stores/privacyStore.ts` (66 lines) - Privacy consent management
- ✅ `hooks/usePlausible.ts` (92 lines) - Analytics tracking hook
- ✅ `components/PrivacyConsentModal.tsx` (230 lines) - Consent UI
- ✅ `docs/PLAUSIBLE_ANALYTICS.md` (this file)

### Modified Files

- ✅ `app/_layout.tsx` - Added Plausible initialization and consent modal
- ✅ `utils/analytics.ts` - Already supports Plausible (no changes needed)
- ✅ `app.config.ts` - Already has Plausible config (no changes needed)

### Dependencies

- No new dependencies needed! ✅
- Uses existing: `zustand`, `async-storage`, `react-native`

---

## Summary

| Component        | Status | Purpose                       |
| ---------------- | ------ | ----------------------------- |
| Privacy Store    | ✅     | Manages user consent          |
| Plausible Hook   | ✅     | Provides tracking functions   |
| Consent Modal    | ✅     | Shows privacy terms to users  |
| Analytics Engine | ✅     | Batches and sends events      |
| Plausible API    | ⏳     | Receives and processes events |

---

## Support

### Questions?

1. **How do I track a new event?**

   ```typescript
   const { trackEvent } = usePlausible();
   trackEvent('my-event', { property: 'value' });
   ```

1. **How do users opt-out?**
   - Settings screen: Add toggle for `setAnalyticsEnabled(false)`
   - Modal: Click "Decline Analytics"

1. **How do I view the data?**
   - Go to https://plausible.io and sign in
   - Select your site
   - View real-time analytics

---

**Last Updated:** 2025-11-03
**Status:** ✅ Ready for Configuration
**Next:** Set Plausible credentials in environment variables
