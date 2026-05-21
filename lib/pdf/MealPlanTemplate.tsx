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
}

interface PlanData {
  title: string
  description: string | null
  total_calories: number | null
  valid_from: string | null
  valid_until: string | null
}

interface SlotData {
  id: string
  name: string
  time_of_day: string | null
  sort_order: number
  notes: string | null
}

interface ItemData {
  id: string
  food_name: string
  quantity: string | null
  unit: string | null
  calories: string | null
  protein_g: string | null
  carbs_g: string | null
  fat_g: string | null
  is_optional: boolean
  alternatives: string | null
  notes: string | null
}

interface MealPlanTemplateProps {
  nutritionist: NutritionistData
  patient: PatientData
  plan: PlanData
  slots: SlotData[]
  items: Record<string, ItemData[]>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  patientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  planTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 8,
  },
  macroBar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#f0fdf4',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#16a34a',
  },
  macroLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  slotContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  slotName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  slotTime: {
    fontSize: 9,
    color: '#ffffff',
    opacity: 0.8,
  },
  itemRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  itemName: {
    flex: 3,
    fontSize: 9,
  },
  itemQty: {
    flex: 1,
    fontSize: 9,
    color: '#6b7280',
  },
  itemCal: {
    flex: 1,
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'right',
  },
  optional: {
    fontSize: 7,
    color: '#9ca3af',
    fontStyle: 'italic',
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
})

export function MealPlanTemplate({
  nutritionist,
  patient,
  plan,
  slots,
  items,
}: MealPlanTemplateProps) {
  const primaryColor = nutritionist.primary_color || '#16a34a'

  return (
    <Document
      title={`Plan Alimentario - ${patient.first_name} ${patient.last_name}`}
      author={nutritionist.business_name}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: primaryColor }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.businessName}>{nutritionist.business_name}</Text>
              <Text style={styles.reportTitle}>Plan Alimentario</Text>
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
          {/* Patient + Plan Info */}
          <View style={styles.patientSection}>
            <View>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>Paciente</Text>
              <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold' }}>
                {patient.first_name} {patient.last_name}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>Vigencia</Text>
              <Text style={{ fontSize: 10 }}>
                {plan.valid_from ? formatDate(plan.valid_from) : '—'}
                {plan.valid_until ? ` al ${formatDate(plan.valid_until)}` : ''}
              </Text>
            </View>
          </View>

          {/* Plan Title */}
          <Text style={styles.planTitle}>{plan.title}</Text>
          {plan.description && (
            <Text style={styles.planDescription}>{plan.description}</Text>
          )}

          {/* Macro Summary */}
          {plan.total_calories && (
            <View style={styles.macroBar}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{plan.total_calories}</Text>
                <Text style={styles.macroLabel}>Calorías</Text>
              </View>
            </View>
          )}

          {/* Meal Slots */}
          {slots.map((slot) => {
            const slotItems = items[slot.id] ?? []
            return (
              <View key={slot.id} style={styles.slotContainer} wrap={false}>
                <View style={[styles.slotHeader, { backgroundColor: primaryColor }]}>
                  <Text style={styles.slotName}>{slot.name}</Text>
                  {slot.time_of_day && (
                    <Text style={styles.slotTime}>{slot.time_of_day.slice(0, 5)}</Text>
                  )}
                </View>
                {slotItems.length === 0 && (
                  <View style={styles.itemRow}>
                    <Text style={[styles.itemName, { color: '#9ca3af' }]}>Sin alimentos registrados</Text>
                  </View>
                )}
                {slotItems.map((item, i) => (
                  <View
                    key={item.id}
                    style={[
                      styles.itemRow,
                      { backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' },
                    ]}
                  >
                    <View style={{ flex: 3 }}>
                      <Text style={styles.itemName}>
                        {item.food_name}
                        {item.is_optional && <Text style={styles.optional}> (opcional)</Text>}
                      </Text>
                      {item.alternatives && (
                        <Text style={[styles.optional, { marginTop: 1 }]}>
                          Alt: {item.alternatives}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.itemQty}>
                      {item.quantity && item.unit
                        ? `${item.quantity} ${item.unit}`
                        : item.quantity ?? ''}
                    </Text>
                    <Text style={styles.itemCal}>
                      {item.calories ? `${parseFloat(item.calories).toFixed(0)} kcal` : ''}
                    </Text>
                  </View>
                ))}
                {slot.notes && (
                  <View style={{ padding: 8, backgroundColor: '#fffbeb' }}>
                    <Text style={{ fontSize: 8, color: '#92400e' }}>Nota: {slot.notes}</Text>
                  </View>
                )}
              </View>
            )
          })}
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
