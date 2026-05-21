import { Document, Page, Text, View, StyleSheet, Image, Svg, Polyline, Line, G } from '@react-pdf/renderer'
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
  chartContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#fafafa',
    marginBottom: 4,
  },
  chartLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 6,
    fontFamily: 'Helvetica-Bold',
  },
})

function getAge(dateOfBirth: string | null): string {
  if (!dateOfBirth) return '—'
  const birth = new Date(dateOfBirth)
  const now = new Date()
  return `${now.getFullYear() - birth.getFullYear()} años`
}

// DECISIÓN: Gráfico de líneas renderizado como SVG vectorial nativo de react-pdf.
// No requiere DOM ni canvas — funciona 100% server-side.
function WeightChartPDF({
  measurements,
  primaryColor,
}: {
  measurements: MeasurementData[]
  primaryColor: string
}) {
  const dataPoints = measurements
    .map((m) => ({ date: m.measured_at, value: m.weight_kg }))
    .filter((d): d is { date: string; value: number } => d.value !== null)

  if (dataPoints.length < 2) return null

  const W = 450
  const H = 120
  const PADDING = { top: 10, right: 10, bottom: 25, left: 35 }
  const chartW = W - PADDING.left - PADDING.right
  const chartH = H - PADDING.top - PADDING.bottom

  const values = dataPoints.map((d) => d.value)
  const minVal = Math.min(...values) - 1
  const maxVal = Math.max(...values) + 1

  const toX = (i: number) => PADDING.left + (i / (dataPoints.length - 1)) * chartW
  const toY = (v: number) =>
    PADDING.top + chartH - ((v - minVal) / (maxVal - minVal)) * chartH

  const points = dataPoints.map((d, i) => `${toX(i).toFixed(1)},${toY(d.value).toFixed(1)}`).join(' ')

  // Y-axis ticks
  const yTicks = [minVal + 1, (minVal + maxVal) / 2, maxVal - 1].map((v) => ({
    y: toY(v),
    label: v.toFixed(1),
  }))

  // X-axis labels (first, middle, last)
  const xLabels = [0, Math.floor((dataPoints.length - 1) / 2), dataPoints.length - 1].map(
    (i) => ({
      x: toX(i),
      label: formatDate(dataPoints[i].date).slice(0, 8),
    })
  )

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartLabel}>Evolución del Peso (kg)</Text>
      <Svg width={W} height={H}>
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <G key={i}>
            <Line
              x1={PADDING.left}
              y1={tick.y}
              x2={W - PADDING.right}
              y2={tick.y}
              stroke="#e5e7eb"
              strokeWidth={0.5}
            />
            <Text
              style={{
                fontSize: 6,
                color: '#9ca3af',
              }}
              x={PADDING.left - 2}
              y={tick.y + 2}
            >
              {tick.label}
            </Text>
          </G>
        ))}

        {/* X-axis */}
        <Line
          x1={PADDING.left}
          y1={PADDING.top + chartH}
          x2={W - PADDING.right}
          y2={PADDING.top + chartH}
          stroke="#d1d5db"
          strokeWidth={1}
        />

        {/* Y-axis */}
        <Line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={PADDING.top + chartH}
          stroke="#d1d5db"
          strokeWidth={1}
        />

        {/* Area fill (simplified as a lighter polyline) */}
        <Polyline
          points={points}
          stroke={primaryColor}
          strokeWidth={2}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points */}
        {dataPoints.map((d, i) => (
          <G key={i}>
            <Line
              x1={toX(i)}
              y1={toY(d.value) - 3}
              x2={toX(i)}
              y2={toY(d.value) + 3}
              stroke={primaryColor}
              strokeWidth={3}
              strokeLinecap="round"
            />
          </G>
        ))}

        {/* X-axis date labels */}
        {xLabels.map((l, i) => (
          <Text
            key={i}
            style={{ fontSize: 6, color: '#6b7280' }}
            x={l.x - 12}
            y={H - 6}
          >
            {l.label}
          </Text>
        ))}
      </Svg>
    </View>
  )
}

function BodyFatChartPDF({
  measurements,
  primaryColor,
}: {
  measurements: MeasurementData[]
  primaryColor: string
}) {
  const dataPoints = measurements
    .map((m) => ({ date: m.measured_at, value: m.body_fat_percentage }))
    .filter((d): d is { date: string; value: number } => d.value !== null)

  if (dataPoints.length < 2) return null

  const W = 450
  const H = 100
  const PADDING = { top: 10, right: 10, bottom: 25, left: 35 }
  const chartW = W - PADDING.left - PADDING.right
  const chartH = H - PADDING.top - PADDING.bottom

  const values = dataPoints.map((d) => d.value)
  const minVal = Math.max(0, Math.min(...values) - 2)
  const maxVal = Math.min(60, Math.max(...values) + 2)

  const toX = (i: number) => PADDING.left + (i / (dataPoints.length - 1)) * chartW
  const toY = (v: number) =>
    PADDING.top + chartH - ((v - minVal) / (maxVal - minVal)) * chartH

  const points = dataPoints.map((d, i) => `${toX(i).toFixed(1)},${toY(d.value).toFixed(1)}`).join(' ')

  const xLabels = [0, dataPoints.length - 1].map((i) => ({
    x: toX(i),
    label: formatDate(dataPoints[i].date).slice(0, 8),
  }))

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartLabel}>Evolución de Grasa Corporal (%)</Text>
      <Svg width={W} height={H}>
        <Line
          x1={PADDING.left}
          y1={PADDING.top + chartH}
          x2={W - PADDING.right}
          y2={PADDING.top + chartH}
          stroke="#d1d5db"
          strokeWidth={1}
        />
        <Line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={PADDING.top + chartH}
          stroke="#d1d5db"
          strokeWidth={1}
        />
        <Polyline
          points={points}
          stroke="#dc2626"
          strokeWidth={2}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {xLabels.map((l, i) => (
          <Text key={i} style={{ fontSize: 6, color: '#6b7280' }} x={l.x - 12} y={H - 6}>
            {l.label}
          </Text>
        ))}
        <Text
          style={{ fontSize: 7, color: '#9ca3af' }}
          x={PADDING.left - 2}
          y={PADDING.top + chartH / 2}
        >
          {((minVal + maxVal) / 2).toFixed(0)}%
        </Text>
      </Svg>
    </View>
  )
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
              <Text style={styles.value}>{formatDate(new Date().toISOString())}</Text>
            </View>
          </View>

          {/* Charts */}
          {measurements.length >= 2 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: primaryColor }]}>Evolución Gráfica</Text>
              <WeightChartPDF measurements={measurements} primaryColor={primaryColor} />
              <BodyFatChartPDF measurements={measurements} primaryColor={primaryColor} />
            </View>
          )}

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
