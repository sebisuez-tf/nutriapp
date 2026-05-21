import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/services/stripe'
import { db } from '@/lib/db'
import { subscriptions, nutritionists } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type Stripe from 'stripe'

// Stripe webhooks require the raw body — disable Next.js body parsing
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const rawBody = await req.text()
    event = await constructWebhookEvent(rawBody, signature)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(sub)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(sub)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      default:
        // Unhandled event type — log and return 200 so Stripe doesn't retry
        console.log(`Unhandled Stripe event type: ${event.type}`)
    }
  } catch (err) {
    console.error(`Error handling Stripe webhook ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// DECISIÓN: Stripe API basil (v22) removed current_period_start/end from Subscription root.
// They now live on SubscriptionItem. Invoice.subscription moved to Invoice.parent.subscription_details.subscription.
function getSubPeriod(sub: Stripe.Subscription): { start: Date | null; end: Date | null } {
  const item = sub.items.data[0]
  return {
    start: item?.current_period_start ? new Date(item.current_period_start * 1000) : null,
    end: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
  }
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const details = invoice.parent?.subscription_details
  if (!details) return null
  const sub = details.subscription
  return typeof sub === 'string' ? sub : sub.id
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const nutritionistId = session.metadata?.nutritionist_id
  if (!nutritionistId || !session.subscription) return

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription.id

  const { getSubscription } = await import('@/lib/services/stripe')
  const stripeSub = await getSubscription(subscriptionId)
  const priceId = stripeSub.items.data[0]?.price.id ?? ''

  const { STRIPE_PLAN_PRICES } = await import('@/lib/services/stripe')
  const planType =
    Object.entries(STRIPE_PLAN_PRICES).find(([, v]) => v === priceId)?.[0] ?? 'professional'

  const { start: periodStart, end: periodEnd } = getSubPeriod(stripeSub)

  await db
    .insert(subscriptions)
    .values({
      nutritionist_id: nutritionistId,
      plan_type: planType as 'basic' | 'professional' | 'premium' | 'club',
      status: 'active',
      stripe_subscription_id: subscriptionId,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: stripeSub.cancel_at_period_end,
    })
    .onConflictDoUpdate({
      target: subscriptions.nutritionist_id,
      set: {
        plan_type: planType as 'basic' | 'professional' | 'premium' | 'club',
        status: 'active',
        stripe_subscription_id: subscriptionId,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: stripeSub.cancel_at_period_end,
        updated_at: new Date(),
      },
    })

  const maxPatients: Record<string, number> = {
    basic: 20,
    professional: 100,
    premium: 500,
    club: 9999,
  }

  await db
    .update(nutritionists)
    .set({
      plan_type: planType as 'basic' | 'professional' | 'premium' | 'club',
      max_patients: maxPatients[planType] ?? 20,
      plan_expires_at: periodEnd,
      updated_at: new Date(),
    })
    .where(eq(nutritionists.id, nutritionistId))
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const nutritionistId = sub.metadata?.nutritionist_id
  if (!nutritionistId) return

  const status =
    sub.status === 'active'
      ? 'active'
      : sub.status === 'past_due'
      ? 'past_due'
      : sub.status === 'canceled'
      ? 'cancelled'
      : 'active'

  const { start: periodStart, end: periodEnd } = getSubPeriod(sub)

  await db
    .update(subscriptions)
    .set({
      status: status as 'active' | 'past_due' | 'cancelled' | 'trial',
      cancel_at_period_end: sub.cancel_at_period_end,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      updated_at: new Date(),
    })
    .where(eq(subscriptions.nutritionist_id, nutritionistId))

  await db
    .update(nutritionists)
    .set({ plan_expires_at: periodEnd, updated_at: new Date() })
    .where(eq(nutritionists.id, nutritionistId))
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const nutritionistId = sub.metadata?.nutritionist_id
  if (!nutritionistId) return

  await db
    .update(subscriptions)
    .set({ status: 'cancelled', updated_at: new Date() })
    .where(eq(subscriptions.nutritionist_id, nutritionistId))

  await db
    .update(nutritionists)
    .set({
      plan_type: 'basic',
      max_patients: 20,
      plan_expires_at: null,
      updated_at: new Date(),
    })
    .where(eq(nutritionists.id, nutritionistId))
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice)
  if (!subscriptionId) return

  await db
    .update(subscriptions)
    .set({ status: 'past_due', updated_at: new Date() })
    .where(eq(subscriptions.stripe_subscription_id, subscriptionId))
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice)
  if (!subscriptionId) return

  // Invoice has its own period_start/period_end at the top level
  const periodStart = invoice.period_start ? new Date(invoice.period_start * 1000) : null
  const periodEnd = invoice.period_end ? new Date(invoice.period_end * 1000) : null

  await db
    .update(subscriptions)
    .set({
      status: 'active',
      current_period_start: periodStart,
      current_period_end: periodEnd,
      updated_at: new Date(),
    })
    .where(eq(subscriptions.stripe_subscription_id, subscriptionId))
}
