# Build Plan: Authentication, Monetization & Implementation Sequence

## 1. Auth Modal Constraint

### Decision: All auth happens in an overlay, never a page redirect

Sign-up and sign-in occur in a modal that overlays the current page. The user never loses context. After authentication, they return to the exact state they were in and the attempted action completes automatically.

### Technical Implications for Supabase

**Email + password (v1 launch):**
Works natively in a modal. Call `supabase.auth.signUp()` / `supabase.auth.signInWithPassword()` from within the modal form. No redirects involved.

**OAuth — Google, Apple, etc. (fast follow, not v1 launch):**
Supabase's default OAuth uses full-page redirects. To preserve context, use popup-based OAuth: `supabase.auth.signInWithOAuth({ options: { skipBrowserRedirect: true } })` combined with `window.open()`. Requires handling popup blockers and callback URLs. Deferred to post-launch.

**Magic links (deferred):**
User clicks a link from email which opens a new tab. The original tab doesn't know auth succeeded without polling or a broadcast channel. Poor fit for modal flow. Deferred indefinitely.

### V1 Auth: Email + Password Only

This is the simplest path that fully satisfies the modal constraint. OAuth adds conversion lift but is not a launch blocker.

### Deferred Action Pattern

When an unauthenticated user triggers a gated action, the system must remember what they were trying to do:

```
1. User clicks "Save" on provider card at /provider/sunrise-senior-living
2. AuthModal opens, receives context: { action: "save", targetProfileId: "abc-123" }
3. User signs up within modal (email + password)
4. On auth success: modal closes, auth context updates globally
5. Deferred action fires: save("abc-123") executes
6. User sees "Saved" confirmation — never left the page
```

Implementation: A React context (`DeferredActionContext`) holds a single `{ action, params }` object. The auth modal writes to it before opening. The auth state listener reads it on successful sign-in and executes the action. Simple, no queue needed.

### Auth Modal Component Architecture

```
components/
├── auth/
│   ├── AuthModal.tsx          → Modal shell, switches between signin/signup
│   ├── SignInForm.tsx          → Email + password sign-in
│   ├── SignUpForm.tsx          → Email + password sign-up + intent selection
│   └── AuthProvider.tsx        → React context: session state + deferred actions
```

The `AuthProvider` wraps the app at the root layout level. It exposes:
- `session` — current Supabase session (null if unauthenticated)
- `account` — current account record with active profile
- `openAuthModal(action?, params?)` — triggers the modal, optionally with a deferred action
- `signOut()` — clears session

Any component that needs to gate an action calls `openAuthModal({ action: "inquiry", targetProfileId })`. If the user is already authenticated, the action fires immediately. If not, the modal opens.

---

## 2. Trial Model (Updated)

### 30-Day Free Trial for Providers

Every provider account gets a 30-day trial with full engagement access starting when their first provider profile is created or claimed.

### Engagement Tiers

```
Free (default after trial expires):
  ✓ Public profile visible
  ✓ Receive inbound inquiries
  ✓ See inquiry metadata (zip code, care type, timeline)
  ✗ View full inquiry details (name, contact blurred)
  ✗ Respond to inquiries
  ✗ Initiate outbound contact
  ✗ Invite caregivers

Trial (30 days from first provider profile creation):
  ✓ Everything in Free
  ✓ Full inquiry details
  ✓ Respond to inquiries
  ✓ Initiate outbound contact
  ✓ All pro features

Pro ($25/month or $249/year):
  ✓ Same as Trial, permanent
  ✓ Engagement analytics (v2)
```

### When the Trial Starts

The trial starts when the first provider profile is created or claimed — NOT at account creation. A family user who later adds a provider profile gets their 30 days from that moment.

### Membership Record Lifecycle

```
Account created (family only)     → No membership record needed
Account creates provider profile  → Membership created: status=trialing, trial_ends_at=NOW()+30d
Trial expires                     → Status changes to: free
User subscribes                   → Status changes to: active
Payment fails                     → Status changes to: past_due (7-day grace)
Grace period expires              → Status changes to: free
User cancels                      → Status changes to: canceled (access until period end)
Period ends after cancel           → Status changes to: free
```

### Permission Check (Server-Side)

```
function canEngage(account, action):
  // Families always can (they never pay)
  if account.activeProfile.type == "family":
    return true

  // Saves are always free for everyone
  if action == "save":
    return true

  // Receiving/viewing inquiry existence is always free
  if action == "receive_inquiry" or action == "view_inquiry_metadata":
    return true

  // Everything else requires active trial or pro
  membership = account.membership
  if membership is null:
    return false

  if membership.status == "active":
    return true
  if membership.status == "trialing" and membership.trial_ends_at > now():
    return true
  if membership.status == "past_due":
    return true  // grace period

  return false  // show upgrade prompt
```

### Trial in Onboarding

During provider onboarding, after profile creation:
- Show a confirmation: "Your 30-day free trial is active. You have full access to respond to inquiries and connect with families."
- No credit card required to start trial
- Trial countdown visible in portal sidebar: "Trial: 23 days remaining"
- At 7 days remaining: gentle prompt to subscribe
- At expiry: clear message explaining what's now locked + upgrade CTA

---

## 3. Build Sequence

### Philosophy: Walking Skeleton First

Build the thinnest end-to-end flow that proves the architecture works:

> A family browses providers → clicks "Request Consultation" → authenticates in modal → completes onboarding → inquiry lands on provider dashboard.

This single flow exercises: auth modal, onboarding, profile creation, connection model, and the portal. If it works, everything else is incremental.

### Phase 0: Infrastructure

```
Scope:
  ☐ Supabase client setup (browser client + server client + middleware)
  ☐ Database schema: accounts, profiles, memberships, connections tables
  ☐ Row-level security policies for all tables
  ☐ Auth modal component (email + password, sign-in + sign-up)
  ☐ AuthProvider context (session state, deferred actions, openAuthModal)
  ☐ Protected route middleware (redirect unauthenticated users)
  ☐ Seed script: 15-20 realistic provider profiles for development

De-risks:
  - Supabase auth works in a modal (no redirect needed)
  - Schema handles all three profile types
  - RLS policies don't block legitimate queries

Validation:
  "Can a user sign up in a modal, see their account created in the
   database, and stay on the same page?"
```

### Phase 1: Onboarding + Portal Shell

```
Scope:
  ☐ Onboarding flow: intent selection → threshold info → profile creation
  ☐ Organization onboarding branch: search seeded profiles → claim or create
  ☐ /portal layout (sidebar + content area, protected)
  ☐ /portal dashboard (placeholder stats, trial countdown)
  ☐ /portal/profile (profile editor, pre-filled from onboarding)

Depends on: Phase 0 (auth + schema)

De-risks:
  - Onboarding data maps cleanly to profile columns (no duplication)
  - Portal sidebar adapts correctly per role
  - Profile editor works for all three types

Validation:
  "Can a provider sign up, complete onboarding, see their profile
   in the portal editor with onboarding data pre-filled?"
```

### Phase 2: Public Profiles + Claim Flow

```
Scope:
  ☐ Extend /provider/[slug] with claim state badges and CTAs
  ☐ /for-providers landing page (value prop, claim/create CTAs)
  ☐ Claim search page: search seeded profiles by name/location
  ☐ Claim flow: select profile → authenticate → verify ownership
  ☐ Create flow: new org or caregiver (if no seeded match)

Depends on: Phase 1 (onboarding creates profiles to claim)

De-risks:
  - Seeded profiles are findable and recognizable
  - Claim flow works end-to-end
  - Public profile pages handle unclaimed/sparse data gracefully

Validation:
  "Can a provider find their seeded profile, claim it, and see it
   appear in their portal with the seeded data as a starting point?"
```

### Phase 3: Marketplace Loop

```
Scope:
  ☐ /browse/providers (family browse with filters)
  ☐ Inquiry connection flow: family → provider
  ☐ Auth modal triggered inline by "Request Consultation"
  ☐ /portal/connections (provider sees inbound inquiries)
  ☐ Response flow (provider replies to inquiry)
  ☐ Trial enforcement: full access during trial, blurred after expiry
  ☐ Upgrade prompt when paywalled action is attempted

Depends on: Phase 2 (providers must have profiles to receive inquiries)

De-risks:
  - Full marketplace loop works end-to-end
  - Paywall enforcement is correct and not bypassable
  - Trial-to-paid transition is smooth

Validation:
  "Can a family send an inquiry, a provider see and respond to it,
   and does the paywall correctly block after trial expiry?"
```

### Phase 4: Payments + Polish

```
Scope:
  ☐ Stripe integration (checkout, subscription management)
  ☐ /portal/settings (billing, plan management)
  ☐ /browse/families (provider-side browse, pro only)
  ☐ Role-aware navbar (different links per auth state + role)
  ☐ Profile switcher for multi-profile accounts
  ☐ CI pipeline: lint + type-check on every PR

Depends on: Phase 3 (trial must exist before payments matter)

Note: Stripe is not needed until ~30 days after first providers sign up.
This phase can start in parallel with Phase 3 testing.
```

### Explicitly Deferred (Not V1)

```
- Hiring marketplace (org ↔ caregiver browse + apply)
- Review system (submit, manage, display)
- Analytics dashboard for providers
- Email/SMS notifications
- OAuth login (Google, Apple)
- Magic link auth
- Claim dispute resolution
- Advanced verification (NPI, license lookup)
- Tiered pricing (solo vs. enterprise)
- Admin panel
- Caregiver-to-family browse
```

---

## 4. Assumptions to Validate Early

| # | Assumption | Validation Method | Phase |
|---|-----------|-------------------|-------|
| 1 | Supabase auth works in a modal without redirects | Build AuthModal, test signup/signin cycle | 0 |
| 2 | Unified profile table handles all three role types | Seed all three types, query and display them | 0 |
| 3 | RLS policies don't create performance issues | Test queries with auth context at ~100 profiles | 0 |
| 4 | Onboarding flows cleanly into profile editor | Complete onboarding, open editor, verify pre-fill | 1 |
| 5 | Claim search finds real organizations accurately | Seed with real public data, test fuzzy matching | 2 |
| 6 | Inquiry flow completes end-to-end | Family → inquiry → provider dashboard | 3 |
| 7 | Trial expiry correctly gates engagement | Simulate expired trial, verify blurred UI | 3 |

---

## 5. What Could Go Wrong

### Auth modal breaks OAuth later
If we build the entire auth system around modal-only flows and later need OAuth, the popup-based approach may not work on all mobile browsers (some block popups aggressively). Mitigation: when adding OAuth, test mobile Safari and Chrome specifically. May need a hybrid approach where OAuth falls back to redirect on mobile with state preservation via URL params.

### Profile table becomes a junk drawer
With three role types sharing one table, there will be nullable columns that only apply to certain types (e.g., `service_area` only for home-based providers, `care_needs` only for families). This is fine if we keep nullable columns to < 10. If it grows beyond that, extract type-specific fields into a JSONB `metadata` column rather than adding more nullable columns.

### Trial abuse
A provider could create a new account every 30 days for a fresh trial. V1 mitigation: trial is per-account, not per-profile. V2: flag accounts sharing the same organization name or email domain.

### Build order dependency chains
Phase 3 (marketplace loop) depends on having real provider profiles (Phase 2) and working auth (Phase 0). If Phase 0 takes longer than expected, everything shifts. Mitigation: Phase 0 is the smallest scope by design — schema + auth modal + seed script. Keep it tight.
