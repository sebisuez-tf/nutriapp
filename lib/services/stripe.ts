import Stripe from 'stripe'

// DECISIÓN: Se instancia Stripe solo si la env var existe. Si no, las funciones
// lanzan un error descriptivo. El build pasa sin credenciales; solo falla en runtime.
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY no está configurada. Consultar BUILD_REPORT.md.')
  }
  return new Stripe(key, { apiVersion: '2026-04-22.dahlia' })
}

export const STRIPE_PLAN_PRICES: Record<string, string> = {
  // Mapeo plan_type → Stripe Price ID.
  // Reemplazar con los Price IDs reales creados en el dashboard de Stripe.
  professional: process.env.STRIPE_PRICE_PROFESSIONAL ?? 'price_professional_placeholder',
  premium: process.env.STRIPE_PRICE_PREMIUM ?? 'price_premium_placeholder',
  club: process.env.STRIPE_PRICE_CLUB ?? 'price_club_placeholder',
}

export async function createCustomer(email: string, name: string): Promise<string> {
  const stripe = getStripe()
  const customer = await stripe.customers.create({ email, name })
  return customer.id
}

export async function createCheckoutSession(params: {
  customerId: string
  priceId: string
  nutritionistId: string
  successUrl: string
  cancelUrl: string
}): Promise<string> {
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    customer: params.customerId,
    payment_method_types: ['card'],
    line_items: [{ price: params.priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { nutritionist_id: params.nutritionistId },
    subscription_data: {
      metadata: { nutritionist_id: params.nutritionistId },
    },
  })

  if (!session.url) throw new Error('Stripe checkout session URL not returned')
  return session.url
}

export async function getPortalUrl(customerId: string, returnUrl: string): Promise<string> {
  const stripe = getStripe()

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session.url
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripe()
  await stripe.subscriptions.cancel(subscriptionId)
}

export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const stripe = getStripe()
  return stripe.subscriptions.retrieve(subscriptionId)
}

export async function constructWebhookEvent(
  payload: string,
  signature: string
): Promise<Stripe.Event> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET no está configurada. Consultar BUILD_REPORT.md.')
  }
  const stripe = getStripe()
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
