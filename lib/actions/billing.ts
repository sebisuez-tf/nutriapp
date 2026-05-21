'use server'

import { db } from '@/lib/db'
import { nutritionists, profiles, subscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireRole } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import type { ActionResult } from '@/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function createCheckoutSessionAction(
  planType: 'professional' | 'premium' | 'club'
): Promise<ActionResult<null>> {
  const current = await requireRole('nutritionist')
  const nutritionistId = current.nutritionist?.id
  if (!nutritionistId) return { success: false, error: 'Nutricionista no encontrado' }

  try {
    const {
      createCustomer,
      createCheckoutSession,
      STRIPE_PLAN_PRICES,
    } = await import('@/lib/services/stripe')

    const priceId = STRIPE_PLAN_PRICES[planType]
    if (!priceId || priceId.includes('placeholder')) {
      return {
        success: false,
        error: 'Los pagos en línea aún no están activos. Contactá a soporte para cambiar de plan.',
      }
    }

    // Get or create Stripe customer
    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, current.profile.id))
      .limit(1)
      .then((r) => r[0] ?? null)

    if (!profile) return { success: false, error: 'Perfil no encontrado' }

    // DECISIÓN: No almacenamos stripe_customer_id en la DB para simplificar el MVP.
    // En producción, almacenar en nutritionists.stripe_customer_id para evitar crear
    // clientes duplicados. Agregarlo como migración cuando se active Stripe.
    const customerId = await createCustomer(profile.email, profile.full_name)

    const checkoutUrl = await createCheckoutSession({
      customerId,
      priceId,
      nutritionistId,
      successUrl: `${APP_URL}/nutritionist/settings/billing?success=1`,
      cancelUrl: `${APP_URL}/nutritionist/settings/billing?cancelled=1`,
    })

    redirect(checkoutUrl)
  } catch (err) {
    if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) throw err
    console.error('createCheckoutSessionAction error:', err)
    return { success: false, error: 'Error iniciando checkout. Intentá de nuevo.' }
  }
}

export async function getPortalSessionAction(): Promise<ActionResult<null>> {
  const current = await requireRole('nutritionist')
  const nutritionistId = current.nutritionist?.id
  if (!nutritionistId) return { success: false, error: 'Nutricionista no encontrado' }

  try {
    const sub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.nutritionist_id, nutritionistId))
      .limit(1)
      .then((r) => r[0] ?? null)

    if (!sub?.stripe_subscription_id) {
      return {
        success: false,
        error: 'No tenés una suscripción activa de Stripe para gestionar.',
      }
    }

    // To get the customer ID we'd need to store it. For now, inform user to contact support.
    // DECISIÓN: getPortalUrl requires stripe_customer_id. Since we didn't store it in this MVP,
    // redirect to support instead. Add stripe_customer_id column when Stripe goes live.
    return {
      success: false,
      error: 'Portal de facturación disponible próximamente. Contactá a soporte para cambios.',
    }
  } catch (err) {
    console.error('getPortalSessionAction error:', err)
    return { success: false, error: 'Error abriendo portal de facturación.' }
  }
}

export async function getSubscriptionStatusAction() {
  const current = await requireRole('nutritionist')
  const nutritionistId = current.nutritionist?.id
  if (!nutritionistId) return null

  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.nutritionist_id, nutritionistId))
    .limit(1)
    .then((r) => r[0] ?? null)

  return sub
}
