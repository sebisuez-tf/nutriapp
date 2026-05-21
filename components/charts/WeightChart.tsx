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

interface WeightChartProps {
  data: Array<{ date: string; weight_kg: number | null }>
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <p className="mb-1 text-xs text-gray-500">{formatDate(label as string)}</p>
      <p className="text-sm font-semibold text-gray-900">
        {payload[0]?.value?.toFixed(1)} kg
      </p>
    </div>
  )
}

export function WeightChart({ data }: WeightChartProps) {
  const filtered = data.filter((d) => d.weight_kg !== null)

  if (!filtered.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400">
        Sin datos de peso
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
          dataKey="weight_kg"
          stroke="#16a34a"
          strokeWidth={2}
          dot={{ fill: '#16a34a', r: 4 }}
          activeDot={{ r: 6 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
