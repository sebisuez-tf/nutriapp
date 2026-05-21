// DECISIÓN: Stripe preparado para Fase 3. Funciones documentadas pero no implementadas en MVP.
// Integrar con Stripe Billing cuando se active el cobro real.

export async function createSubscription(
  _nutritionistId: string,
  _planType: string
): Promise<never> {
  throw new Error('Stripe integration not implemented in MVP')
}

export async function cancelSubscription(_subscriptionId: string): Promise<never> {
  throw new Error('Stripe integration not implemented in MVP')
}

export async function getPortalUrl(_customerId: string): Promise<never> {
  throw new Error('Stripe integration not implemented in MVP')
}

export async function handleWebhook(_payload: string, _signature: string): Promise<never> {
  throw new Error('Stripe integration not implemented in MVP')
}

export async function createCustomer(
  _email: string,
  _name: string
): Promise<never> {
  throw new Error('Stripe integration not implemented in MVP')
}

export async function getSubscriptionStatus(_subscriptionId: string): Promise<never> {
  throw new Error('Stripe integration not implemented in MVP')
}
