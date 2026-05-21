import { Resend } from 'resend'
import type { NutritionistBranding } from '@/types'
import { formatDateTime } from '@/lib/utils'

// DECISIÓN: lazy init — Resend throws at construction if key is absent, which breaks build-time page collection
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!)
  return _resend
}
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@nutriapp.com'

function brandedHeader(branding: NutritionistBranding): string {
  return `
    <div style="background-color:${branding.primary_color};padding:24px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-family:sans-serif;font-size:24px;font-weight:bold;">
        ${branding.business_name}
      </h1>
    </div>
  `
}

function emailWrapper(content: string, branding: NutritionistBranding): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:20px;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            <tr><td>${brandedHeader(branding)}</td></tr>
            <tr><td style="padding:32px;">${content}</td></tr>
            <tr><td style="background:#f4f4f5;padding:16px;text-align:center;color:#6b7280;font-size:12px;">
              © ${new Date().getFullYear()} ${branding.business_name} · NutriApp
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `
}

export async function sendAppointmentConfirmation(params: {
  patientEmail: string
  patientName: string
  scheduledAt: Date
  durationMinutes: number
  nutritionistName: string
  nutritionistPhone?: string
  branding: NutritionistBranding
}) {
  const content = `
    <h2 style="color:#111827;margin-top:0;">Confirmación de turno</h2>
    <p style="color:#374151;">Hola <strong>${params.patientName}</strong>,</p>
    <p style="color:#374151;">Tu turno ha sido confirmado.</p>
    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:4px 0;color:#374151;"><strong>Fecha y hora:</strong> ${formatDateTime(params.scheduledAt)}</p>
      <p style="margin:4px 0;color:#374151;"><strong>Duración:</strong> ${params.durationMinutes} minutos</p>
      <p style="margin:4px 0;color:#374151;"><strong>Profesional:</strong> ${params.nutritionistName}</p>
      ${params.nutritionistPhone ? `<p style="margin:4px 0;color:#374151;"><strong>Teléfono:</strong> ${params.nutritionistPhone}</p>` : ''}
    </div>
    <p style="color:#6b7280;font-size:14px;">Si necesitás cancelar o reprogramar, por favor contactá a tu nutricionista con anticipación.</p>
  `

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: params.patientEmail,
    subject: `Turno confirmado - ${formatDateTime(params.scheduledAt)}`,
    html: emailWrapper(content, params.branding),
  })
}

export async function sendPatientInvite(params: {
  patientEmail: string
  patientName: string
  magicLink: string
  nutritionistName: string
  branding: NutritionistBranding
}) {
  const content = `
    <h2 style="color:#111827;margin-top:0;">¡Bienvenido/a a tu portal nutricional!</h2>
    <p style="color:#374151;">Hola <strong>${params.patientName}</strong>,</p>
    <p style="color:#374151;">${params.nutritionistName} te ha dado acceso a tu portal de nutrición personalizado.</p>
    <p style="color:#374151;">Aquí podrás ver tu plan alimentario, registrar tu progreso y comunicarte con tu nutricionista.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${params.magicLink}" style="background-color:${params.branding.primary_color};color:#ffffff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">
        Acceder a mi portal
      </a>
    </div>
    <p style="color:#6b7280;font-size:12px;">Este enlace expira en 24 horas. Si no solicitaste este acceso, ignorá este email.</p>
  `

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: params.patientEmail,
    subject: `Acceso a tu portal nutricional - ${params.branding.business_name}`,
    html: emailWrapper(content, params.branding),
  })
}

export async function sendNutritionistInvite(params: {
  email: string
  magicLink: string
}) {
  const defaultBranding: NutritionistBranding = {
    logo_url: null,
    primary_color: '#16a34a',
    secondary_color: '#15803d',
    accent_color: '#4ade80',
    business_name: 'NutriApp',
  }

  const content = `
    <h2 style="color:#111827;margin-top:0;">Bienvenido/a a NutriApp</h2>
    <p style="color:#374151;">Has sido invitado/a a unirte a NutriApp como nutricionista.</p>
    <p style="color:#374151;">Hacé clic en el botón para configurar tu cuenta y empezar a usar la plataforma.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${params.magicLink}" style="background-color:#16a34a;color:#ffffff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">
        Configurar mi cuenta
      </a>
    </div>
    <p style="color:#6b7280;font-size:12px;">Este enlace expira en 24 horas.</p>
  `

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: params.email,
    subject: 'Invitación a NutriApp',
    html: emailWrapper(content, defaultBranding),
  })
}

export async function sendDocumentEmail(params: {
  patientEmail: string
  patientName: string
  documentTitle: string
  documentUrl: string
  nutritionistName: string
  branding: NutritionistBranding
}) {
  const content = `
    <h2 style="color:#111827;margin-top:0;">Nuevo documento disponible</h2>
    <p style="color:#374151;">Hola <strong>${params.patientName}</strong>,</p>
    <p style="color:#374151;">Tu nutricionista <strong>${params.nutritionistName}</strong> te ha enviado el siguiente documento:</p>
    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0;color:#374151;font-weight:bold;">${params.documentTitle}</p>
    </div>
    <div style="text-align:center;margin:32px 0;">
      <a href="${params.documentUrl}" style="background-color:${params.branding.primary_color};color:#ffffff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">
        Descargar documento
      </a>
    </div>
  `

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: params.patientEmail,
    subject: `${params.documentTitle} - ${params.branding.business_name}`,
    html: emailWrapper(content, params.branding),
  })
}
