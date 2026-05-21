'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts'
import { formatDate } from '@/lib/utils'

interface MuscleChartProps {
  data: Array<{ date: string; muscle_mass_kg: number | null }>
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <p className="mb-1 text-xs text-gray-500">{formatDate(label as string)}</p>
      <p className="text-sm font-semibold text-blue-600">
        {payload[0]?.value?.toFixed(1)} kg
      </p>
    </div>
  )
}

export function MuscleChart({ data }: MuscleChartProps) {
  const filtered = data.filter((d) => d.muscle_mass_kg !== null)

  if (!filtered.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400">
        Sin datos de masa muscular
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={filtered} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickFormatter={(val: string) => {
            const d = new Date(val)
            return `${d.getDate()}/${d.getMonth() + 1}`
          }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickFormatter={(val: number) => `${val}kg`}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="muscle_mass_kg"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ fill: '#2563eb', r: 4 }}
          activeDot={{ r: 6 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
