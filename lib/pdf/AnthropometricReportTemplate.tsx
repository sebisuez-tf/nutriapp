import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { formatDate } from '@/lib/utils'

interface NutritionistData {
  business_name: string
  logo_url: string | null
  primary_color: string
  contact_email: string | null
  contact_phone: string | null
}

interface PatientData {
  first_name: string
  last_name: string
  date_of_birth: string | null
}

interface MeasurementData {
  measured_at: string
  weight_kg: number | null
  height_cm: number | null
  bmi: number | null
  body_fat_percentage: number | null
  muscle_mass_kg: number | null
}

interface AnthropometricReportTemplateProps {
  nutritionist: NutritionistData
  patient: PatientData
  measurements: MeasurementData[]
  notes?: string
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
    color: '#1f2937',
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  businessName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  reportTitle: {
    fontSize: 11,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
  },
  body: {
    paddingHorizontal: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 120,
    color: '#6b7280',
  },
  value: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
  },
  table: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    fontFamily: 'Helvetica-Bold',
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  notesBox: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#16a34a',
  },
  notesText: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.5,
  },
})

function getAge(dateOfBirth: string | null): string {
  if (!dateOfBirth) return '—'
  const birth = new Date(dateOfBirth)
  const now = new Date()
  return `${now.getFullYear() - birth.getFullYear()} años`
}

export function AnthropometricReportTemplate({
  nutritionist,
  patient,
  measurements,
  notes,
}: AnthropometricReportTemplateProps) {
  const primaryColor = nutritionist.primary_color || '#16a34a'
  const first = measurements[0]
  const latest = measurements[measurements.length - 1]

  return (
    <Document
      title={`Informe Antropométrico - ${patient.first_name} ${patient.last_name}`}
      author={nutritionist.business_name}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: primaryColor }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.businessName}>{nutritionist.business_name}</Text>
              <Text style={styles.reportTitle}>Informe Antropométrico</Text>
            </View>
            {nutritionist.logo_url && (
              <Image
                src={nutritionist.logo_url}
                style={{ width: 60, height: 60, borderRadius: 4 }}
              />
            )}
          </View>
        </View>

        <View style={styles.body}>
          {/* Patient Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: primaryColor }]}>Datos del Paciente</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Nombre:</Text>
              <Text style={styles.value}>{patient.first_name} {patient.last_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Edad:</Text>
              <Text style={styles.value}>{getAge(patient.date_of_birth)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Fecha del informe:</Text>
              <Text style={styles.value}>{formatDate(new Date())}</Text>
            </View>
          </View>

          {/* Summary Comparison */}
          {first && latest && measurements.length > 1 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: primaryColor }]}>Resumen Comparativo</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={styles.tableCell}>Indicador</Text>
                  <Text style={styles.tableCell}>Inicial ({formatDate(first.measured_at)})</Text>
                  <Text style={styles.tableCell}>Actual ({formatDate(latest.measured_at)})</Text>
                  <Text style={styles.tableCell}>Cambio</Text>
                </View>
                {[
                  { label: 'Peso (kg)', first: first.weight_kg, last: latest.weight_kg },
                  { label: 'IMC', first: first.bmi, last: latest.bmi },
                  { label: 'Grasa corporal (%)', first: first.body_fat_percentage, last: latest.body_fat_percentage },
                  { label: 'Masa muscular (kg)', first: first.muscle_mass_kg, last: latest.muscle_mass_kg },
                ].map((row, i) => {
                  const delta =
                    row.first !== null && row.last !== null
                      ? (row.last - row.first).toFixed(1)
                      : null
                  return (
                    <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }]}>
                      <Text style={styles.tableCell}>{row.label}</Text>
                      <Text style={styles.tableCell}>{row.first?.toFixed(1) ?? '—'}</Text>
                      <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>
                        {row.last?.toFixed(1) ?? '—'}
                      </Text>
                      <Text style={styles.tableCell}>
                        {delta ? (parseFloat(delta) > 0 ? `+${delta}` : delta) : '—'}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )}

          {/* All Measurements */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: primaryColor }]}>Historial de Mediciones</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCell}>Fecha</Text>
                <Text style={styles.tableCell}>Peso (kg)</Text>
                <Text style={styles.tableCell}>Talla (cm)</Text>
                <Text style={styles.tableCell}>IMC</Text>
                <Text style={styles.tableCell}>Grasa (%)</Text>
                <Text style={styles.tableCell}>Músculo (kg)</Text>
              </View>
              {measurements.map((m, i) => (
                <View
                  key={i}
                  style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }]}
                >
                  <Text style={styles.tableCell}>{formatDate(m.measured_at)}</Text>
                  <Text style={styles.tableCell}>{m.weight_kg?.toFixed(1) ?? '—'}</Text>
                  <Text style={styles.tableCell}>{m.height_cm?.toFixed(0) ?? '—'}</Text>
                  <Text style={styles.tableCell}>{m.bmi?.toFixed(1) ?? '—'}</Text>
                  <Text style={styles.tableCell}>{m.body_fat_percentage?.toFixed(1) ?? '—'}</Text>
                  <Text style={styles.tableCell}>{m.muscle_mass_kg?.toFixed(1) ?? '—'}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Notes */}
          {notes && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: primaryColor }]}>Observaciones</Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>{notes}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{nutritionist.business_name}</Text>
          <Text style={styles.footerText}>
            {nutritionist.contact_email}
            {nutritionist.contact_phone ? ` · ${nutritionist.contact_phone}` : ''}
          </Text>
          <Text style={styles.footerText}>Generado con NutriApp</Text>
        </View>
      </Page>
    </Document>
  )
}
