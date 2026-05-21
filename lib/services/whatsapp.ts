// DECISIÓN: WhatsApp reservado para Fase 4.
//
// Opciones de integración evaluadas:
//   1. WATI (https://www.wati.io) — SaaS sobre WhatsApp Business API. Más simple de configurar,
//      templates pre-aprobados, webhooks para recibir respuestas. Recomendado para MVP+.
//   2. Twilio Business API — más flexible, mayor costo, requiere aprobación de Meta para cada template.
//   3. Meta Cloud API directa — sin capa intermedia, mayor complejidad de auth y webhooks.
//
// Variables de entorno necesarias (agregar a .env.example cuando se active):
//   WATI_API_URL=https://live-mt-server.wati.io/<account-id>
//   WATI_API_KEY=Bearer <token>
//   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx
//   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxx
//   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
//
// Templates aprobados a registrar en Meta Business Manager:
//   - appointment_confirmation: "Hola {{1}}, tu turno con {{2}} quedó confirmado para el {{3}}."
//   - appointment_reminder:     "Hola {{1}}, te recordamos tu turno de mañana {{2}} a las {{3}}."
//   - patient_welcome:          "Hola {{1}}, bienvenido/a a {{2}}. Tu portal: {{3}}"
//
// Implementación esperada con WATI:
//   POST ${WATI_API_URL}/api/v1/sendTemplateMessage?whatsappNumber={phone}
//   Authorization: ${WATI_API_KEY}
//   Body: { template_name, broadcast_name, parameters: [{name, value}] }

export interface WhatsAppMessage {
  to: string // número con código de país, ej: +5491112345678
  template: 'appointment_confirmation' | 'appointment_reminder' | 'patient_welcome'
  params: Record<string, string>
}

// TODO (Fase 4): Implementar con WATI o Twilio Business API.
// Ver comentarios al inicio de este archivo para detalles de integración.
export async function sendWhatsAppMessage(_msg: WhatsAppMessage): Promise<void> {
  // Stub — no lanza en producción para no romper flows que lo llamen opcionalmente
  console.warn('[WhatsApp stub] mensaje no enviado:', _msg.template, _msg.to)
}

// TODO (Fase 4): Enviar template appointment_reminder con params:
//   1 = patientName, 2 = scheduledAt (formateada), 3 = nutritionistName
export async function sendAppointmentReminderWhatsApp(
  phoneNumber: string,
  patientName: string,
  scheduledAt: Date,
  nutritionistName: string
): Promise<void> {
  await sendWhatsAppMessage({
    to: phoneNumber,
    template: 'appointment_reminder',
    params: {
      '1': patientName,
      '2': scheduledAt.toLocaleDateString('es-AR'),
      '3': nutritionistName,
    },
  })
}

// TODO (Fase 4): Enviar template patient_welcome con params:
//   1 = patientName, 2 = nutritionistName, 3 = portalUrl
export async function sendWelcomeWhatsApp(
  phoneNumber: string,
  patientName: string,
  nutritionistName: string,
  portalUrl: string
): Promise<void> {
  await sendWhatsAppMessage({
    to: phoneNumber,
    template: 'patient_welcome',
    params: { '1': patientName, '2': nutritionistName, '3': portalUrl },
  })
}
