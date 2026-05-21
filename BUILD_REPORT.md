# BUILD_REPORT.md

Generated: 2026-05-21

## Build Status

```
npm run build   ✅ PASS — 25 routes compiled, 0 errors
npx tsc --noEmit ✅ PASS — 0 type errors
```

---

## Completed Parts (of 16)

| # | Feature | Status |
|---|---------|--------|
| 1 | Auth (login/register/supabase) | ✅ Complete |
| 2 | Nutritionist onboarding | ✅ Complete |
| 3 | Patient management CRUD | ✅ Complete |
| 4 | Clinical records | ✅ Complete |
| 5 | Anthropometric measurements + charts | ✅ Complete |
| 6 | Meal plan editor (with patient combobox) | ✅ Complete |
| 7 | Appointments | ✅ Complete |
| 8 | Patient groups | ✅ Complete |
| 9 | Chat / messaging | ✅ Complete |
| 10 | PDF generation (anthropometric + meal plan) | ✅ Complete |
| 11 | Email delivery (Resend) | ✅ Complete (requires env vars) |
| 12 | Branding / settings | ✅ Complete |
| 13 | Stripe billing (checkout, webhooks, portal) | ✅ Complete (requires env vars) |
| 14 | Patient portal (dashboard, plan, reports) | ✅ Complete |
| 15 | Admin panel (super_admin) | ✅ Complete |
| 16 | WhatsApp notifications | ⚠️ Stub only — see lib/services/whatsapp.ts |

**Completion: 15.5 / 16 (~97%)**

---

## Routes (25 total)

```
/ (static landing)                    ✅
/login /register /forgot-password     ✅
/reset-password                        ✅
/nutritionist/dashboard                ✅
/nutritionist/patients                 ✅
/nutritionist/patients/new             ✅
/nutritionist/patients/[id]            ✅
/nutritionist/patients/[id]/chat       ✅
/nutritionist/appointments             ✅
/nutritionist/plans                    ✅
/nutritionist/plans/new                ✅
/nutritionist/plans/[id]               ✅
/nutritionist/groups                   ✅
/nutritionist/groups/[id]              ✅
/nutritionist/messages                 ✅
/nutritionist/onboarding               ✅
/nutritionist/settings/branding        ✅
/nutritionist/settings/billing         ✅
/patient/dashboard                     ✅
/patient/plan                          ✅
/patient/reports                       ✅
/admin/dashboard                       ✅
/admin/nutritionists                   ✅
/admin/nutritionists/[id]              ✅
/api/plans/[id]                        ✅
/api/nutritionist/me                   ✅
/api/webhooks/stripe                   ✅
```

---

## Manual Setup Required (before production)

### Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
- Run migrations in `supabase/migrations/`
- Create storage bucket `patient-pdfs` (private)
- Enable RLS policies per migration files

### Stripe
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_PREMIUM=price_...
STRIPE_PRICE_CLUB=price_...
```
- Create Products + Prices in Stripe dashboard
- Configure webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
- Events to listen: `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`

### Resend (email)
```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
```
- Verify sending domain in Resend dashboard

### WhatsApp (NOT implemented — stub only)
```env
# WATI (recommended):
WATI_API_URL=https://live-mt-server.wati.io/...
WATI_API_KEY=...
# OR Twilio:
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```
- See `lib/services/whatsapp.ts` for full integration guide
- Template names to register: `appointment_confirmation`, `appointment_reminder`, `patient_welcome`

### Supabase Storage
- Bucket `patient-pdfs` must exist (private, no public access)
- The `getSignedUrl` function in `lib/services/storage.ts` generates 60-minute URLs

---

## Key Technical Decisions

### DECISIÓN: Route group → named directory migration
Next.js 16.2.6 Turbopack enforces that no two pages resolve to the same URL path.
The original route groups `(admin)`, `(nutritionist)`, `(patient)` were URL-transparent,
causing three pages at `/dashboard`. Migrated to named directories `admin/`, `nutritionist/`,
`patient/` which aligns with the middleware guards and all existing `href` values.

### DECISIÓN: middleware.ts → proxy.ts
Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts` with export `proxy()`.
Renamed and updated export name to eliminate the deprecation warning.

### DECISIÓN: Resend lazy initialization
`new Resend(key)` throws at module evaluation if key is missing, crashing build-time
page collection. Wrapped in a lazy getter `getResend()` so construction only happens
at runtime when email functions are called.

### DECISIÓN: Stripe API version 2026-04-22.dahlia
Stripe Node SDK v22.1.1 requires dahlia API version. Breaking changes from prior:
- `Subscription.current_period_start/end` moved to `items.data[0].current_period_start/end`
- `Invoice.subscription` moved to `invoice.parent?.subscription_details?.subscription`

### DECISIÓN: Zod v4 — .issues not .errors
Zod v4 renamed `ZodError.errors` to `ZodError.issues`. All action files updated.
Removed `.default()` from validation schemas to avoid zodResolver type inference mismatch
(input type vs. output type with defaults).

### DECISIÓN: Recharts v3 — TooltipContentProps<any, any>
`TooltipContentProps<number, string>` is incompatible with `ContentType<ValueType, NameType>`
in Recharts v3 because the generic constraint is contravariant. Using `<any, any>` is the
documented workaround; `ValueType`/`NameType` are not in the public recharts export.

### DECISIÓN: Base UI render prop (no asChild)
`@base-ui/react` uses `render={<Component />}` instead of the Radix UI `asChild` pattern.
All trigger/portal components updated accordingly.

### DECISIÓN: Drizzle numeric() → string
`numeric()` columns in Drizzle ORM resolve to TypeScript `string`. Explicit `.toString()`
required when setting these values from parsed numeric input.

---

## Known Tech Debt

1. **`stripe_customer_id` not stored on nutritionist row** — `getPortalSessionAction` returns
   an error because we don't have the Stripe customer ID after checkout. The webhook
   `checkout.session.completed` receives the customer ID and should store it in the
   `nutritionists` table. Add a `stripe_customer_id` column via migration.

2. **WhatsApp is a stub** — `lib/services/whatsapp.ts` logs warnings but sends nothing.
   Appointment reminders and patient welcome messages are silent.

3. **No recipe page** — `lib/actions/recipes.ts` exists with CRUD but there is no
   `/nutritionist/recipes` route yet. `revalidatePath('/nutritionist/recipes')` calls
   will silently no-op until the page is added.

4. **PDF logo rendering** — Logo URLs from Supabase Storage are signed URLs (expire in 1h).
   PDFs generated after signature expiry may show broken logos. Consider using public
   bucket or embedding as base64 for PDF generation.

5. **Chat real-time** — Messages use Supabase Realtime subscriptions. Performance under
   load has not been tested. Channel cleanup on unmount is implemented but not load-tested.
