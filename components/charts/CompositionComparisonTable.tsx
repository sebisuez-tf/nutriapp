'use client'

import { cn, formatDate } from '@/lib/utils'

interface MeasurementSnapshot {
  measured_at: string
  weight_kg: number | null
  bmi: number | null
  body_fat_percentage: number | null
  muscle_mass_kg: number | null
  waist_circumference: number | null
}

interface CompositionComparisonTableProps {
  first: MeasurementSnapshot
  latest: MeasurementSnapshot
}

interface MetricRow {
  label: string
  firstValue: number | null
  latestValue: number | null
  unit: string
  lowerIsBetter?: boolean
}

function DeltaCell({ first, latest, lowerIsBetter = false }: { first: number | null; latest: number | null; lowerIsBetter?: boolean }) {
  if (first === null || latest === null) return <td className="px-4 py-2 text-center text-gray-400">—</td>

  const delta = latest - first
  const improved = lowerIsBetter ? delta < 0 : delta > 0
  const neutral = Math.abs(delta) < 0.1

  return (
    <td
      className={cn(
        'px-4 py-2 text-center text-sm font-medium',
        neutral ? 'text-gray-500' : improved ? 'text-green-600' : 'text-red-500'
      )}
    >
      {delta > 0 ? '+' : ''}{delta.toFixed(1)}
    </td>
  )
}

export function CompositionComparisonTable({ first, latest }: CompositionComparisonTableProps) {
  const metrics: MetricRow[] = [
    { label: 'Peso', firstValue: first.weight_kg, latestValue: latest.weight_kg, unit: 'kg' },
    { label: 'IMC', firstValue: first.bmi, latestValue: latest.bmi, unit: '', lowerIsBetter: true },
    { label: 'Grasa corporal', firstValue: first.body_fat_percentage, latestValue: latest.body_fat_percentage, unit: '%', lowerIsBetter: true },
    { label: 'Masa muscular', firstValue: first.muscle_mass_kg, latestValue: latest.muscle_mass_kg, unit: 'kg' },
    { label: 'Cintura', firstValue: first.waist_circumference, latestValue: latest.waist_circumference, unit: 'cm', lowerIsBetter: true },
  ]

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Indicador
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
              Inicial ({formatDate(first.measured_at)})
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
              Último ({formatDate(latest.measured_at)})
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
              Cambio
            </th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric, i) => (
            <tr key={metric.label} className={cn('border-b border-gray-100', i % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
              <td className="px-4 py-2 font-medium text-gray-700">{metric.label}</td>
              <td className="px-4 py-2 text-center text-gray-600">
                {metric.firstValue !== null ? `${metric.firstValue.toFixed(1)}${metric.unit}` : '—'}
              </td>
              <td className="px-4 py-2 text-center font-medium text-gray-900">
                {metric.latestValue !== null ? `${metric.latestValue.toFixed(1)}${metric.unit}` : '—'}
              </td>
              <DeltaCell
                first={metric.firstValue}
                latest={metric.latestValue}
                lowerIsBetter={metric.lowerIsBetter}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
