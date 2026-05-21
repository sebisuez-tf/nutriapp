// DECISIÓN: WhatsApp preparado para Fase 4. Usar WATI o Twilio Business API.
// Mensajes a implementar: confirmación de turno, recordatorio 24hs, bienvenida paciente

export interface WhatsAppMessage {
  to: string // phone number with country code e.g. +5491112345678
  template: 'appointment_confirmation' | 'appointment_reminder' | 'patient_welcome'
  params: Record<string, string>
}

export async function sendWhatsAppMessage(_msg: WhatsAppMessage): Promise<void> {
  throw new Error('WhatsApp integration not implemented in MVP')
}

export async function sendAppointmentReminderWhatsApp(
  _phoneNumber: string,
  _patientName: string,
  _scheduledAt: Date,
  _nutritionistName: string
): Promise<void> {
  throw new Error('WhatsApp integration not implemented in MVP')
}

export async function sendWelcomeWhatsApp(
  _phoneNumber: string,
  _patientName: string,
  _nutritionistName: string,
  _portalUrl: string
): Promise<void> {
  throw new Error('WhatsApp integration not implemented in MVP')
}
