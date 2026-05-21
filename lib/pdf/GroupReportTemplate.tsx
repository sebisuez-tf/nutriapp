import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { formatDate } from '@/lib/utils'

interface NutritionistData {
  business_name: string
  logo_url: string | null
  primary_color: string
}

interface GroupMemberData {
  first_name: string
  last_name: string
  latest_weight: number | null
  latest_body_fat: number | null
  latest_muscle_mass: number | null
}

interface GroupData {
  name: string
  type: string
  description: string | null
}

interface AggregateMetrics {
  avg_weight: number | null
  avg_body_fat: number | null
  avg_muscle_mass: number | null
  member_count: number
}

interface GroupReportTemplateProps {
  nutritionist: NutritionistData
  group: GroupData
  members: GroupMemberData[]
  aggregateMetrics: AggregateMetrics
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 0,
    paddingBottom: 40,
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
  body: { paddingHorizontal: 40 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#16a34a',
  },
  metricLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  table: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
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
  disclaimer: {
    fontSize: 8,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 8,
  },
})

const GROUP_TYPE_LABELS: Record<string, string> = {
  club: 'Club',
  team: 'Equipo',
  institution: 'Institución',
  category: 'Categoría',
}

export function GroupReportTemplate({
  nutritionist,
  group,
  members,
  aggregateMetrics,
}: GroupReportTemplateProps) {
  const primaryColor = nutritionist.primary_color || '#16a34a'

  return (
    <Document
      title={`Informe de Grupo - ${group.name}`}
      author={nutritionist.business_name}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: primaryColor }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.businessName}>{nutritionist.business_name}</Text>
              <Text style={styles.reportTitle}>
                Informe de Grupo: {group.name}
              </Text>
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
          {/* Group Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: primaryColor }]}>
              Información del Grupo
            </Text>
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={{ width: 100, color: '#6b7280' }}>Tipo:</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                {GROUP_TYPE_LABELS[group.type] ?? group.type}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={{ width: 100, color: '#6b7280' }}>Total miembros:</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                {aggregateMetrics.member_count}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={{ width: 100, color: '#6b7280' }}>Fecha del informe:</Text>
              <Text>{formatDate(new Date())}</Text>
            </View>
            {group.description && (
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ width: 100, color: '#6b7280' }}>Descripción:</Text>
                <Text style={{ flex: 1 }}>{group.description}</Text>
              </View>
            )}
          </View>

          {/* Aggregate Metrics */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: primaryColor }]}>
              Promedios del Grupo (última medición)
            </Text>
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {aggregateMetrics.avg_weight
                    ? aggregateMetrics.avg_weight.toFixed(1)
                    : '—'}
                </Text>
                <Text style={styles.metricLabel}>Peso promedio (kg)</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {aggregateMetrics.avg_body_fat
                    ? aggregateMetrics.avg_body_fat.toFixed(1) + '%'
                    : '—'}
                </Text>
                <Text style={styles.metricLabel}>Grasa corporal promedio</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {aggregateMetrics.avg_muscle_mass
                    ? aggregateMetrics.avg_muscle_mass.toFixed(1)
                    : '—'}
                </Text>
                <Text style={styles.metricLabel}>Masa muscular promedio (kg)</Text>
              </View>
            </View>
          </View>

          {/* Members Table (aggregate data only, no clinical info) */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: primaryColor }]}>
              Resumen por Miembro
            </Text>
            <Text style={styles.disclaimer}>
              * Solo se muestran datos antropométricos agregados, no información clínica individual.
            </Text>
            <View style={[styles.table, { marginTop: 8 }]}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCell}>Nombre</Text>
                <Text style={styles.tableCell}>Peso (kg)</Text>
                <Text style={styles.tableCell}>Grasa (%)</Text>
                <Text style={styles.tableCell}>Músculo (kg)</Text>
              </View>
              {members.map((member, i) => (
                <View
                  key={i}
                  style={[
                    styles.tableRow,
                    { backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' },
                  ]}
                >
                  <Text style={styles.tableCell}>
                    {member.first_name} {member.last_name}
                  </Text>
                  <Text style={styles.tableCell}>
                    {member.latest_weight?.toFixed(1) ?? '—'}
                  </Text>
                  <Text style={styles.tableCell}>
                    {member.latest_body_fat?.toFixed(1) ?? '—'}
                  </Text>
                  <Text style={styles.tableCell}>
                    {member.latest_muscle_mass?.toFixed(1) ?? '—'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{nutritionist.business_name}</Text>
          <Text style={styles.footerText}>{group.name}</Text>
          <Text style={styles.footerText}>Generado con NutriApp</Text>
        </View>
      </Page>
    </Document>
  )
}
