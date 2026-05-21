'use client'

interface MacroItem {
  calories: string | null
  protein_g: string | null
  carbs_g: string | null
  fat_g: string | null
}

interface MacroTotalsProps {
  items: MacroItem[]
  target?: {
    calories: number | null
    protein_g: string | null
    carbs_g: string | null
    fat_g: string | null
  }
}

function sum(items: MacroItem[], key: keyof MacroItem): number {
  return items.reduce((acc, item) => {
    const val = item[key]
    return acc + (val ? parseFloat(val) : 0)
  }, 0)
}

function MacroBar({
  label,
  value,
  target,
  unit,
  color,
}: {
  label: string
  value: number
  target?: number | null
  unit: string
  color: string
}) {
  const pct = target && target > 0 ? Math.min((value / target) * 100, 100) : null
  const overTarget = target && value > target

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={overTarget ? 'text-red-600 font-semibold' : 'text-gray-600'}>
          {value.toFixed(0)}
          {unit}
          {target ? ` / ${target}${unit}` : ''}
        </span>
      </div>
      {pct !== null && (
        <div className="h-1.5 w-full rounded-full bg-gray-200">
          <div
            className={`h-1.5 rounded-full transition-all ${color} ${overTarget ? 'bg-red-500' : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

export function MacroTotals({ items, target }: MacroTotalsProps) {
  const totalCalories = sum(items, 'calories')
  const totalProtein = sum(items, 'protein_g')
  const totalCarbs = sum(items, 'carbs_g')
  const totalFat = sum(items, 'fat_g')

  const targetCalories = target?.calories ?? null
  const targetProtein = target?.protein_g ? parseFloat(target.protein_g) : null
  const targetCarbs = target?.carbs_g ? parseFloat(target.carbs_g) : null
  const targetFat = target?.fat_g ? parseFloat(target.fat_g) : null

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Macros del plan</h3>

      {/* Calories headline */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{totalCalories.toFixed(0)}</span>
        <span className="text-sm text-gray-500">kcal</span>
        {targetCalories && (
          <span className="ml-auto text-xs text-gray-400">
            objetivo: {targetCalories} kcal
          </span>
        )}
      </div>

      {targetCalories && (
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className={`h-2 rounded-full transition-all ${
              totalCalories > targetCalories ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{
              width: `${Math.min((totalCalories / targetCalories) * 100, 100)}%`,
            }}
          />
        </div>
      )}

      <div className="space-y-2 pt-1">
        <MacroBar
          label="Proteínas"
          value={totalProtein}
          target={targetProtein}
          unit="g"
          color="bg-blue-500"
        />
        <MacroBar
          label="Carbohidratos"
          value={totalCarbs}
          target={targetCarbs}
          unit="g"
          color="bg-yellow-500"
        />
        <MacroBar
          label="Grasas"
          value={totalFat}
          target={targetFat}
          unit="g"
          color="bg-orange-500"
        />
      </div>

      {/* Macro distribution if we have data */}
      {(totalProtein + totalCarbs + totalFat) > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <p className="mb-1.5 text-xs font-medium text-gray-500">Distribución</p>
          <div className="flex h-2 w-full overflow-hidden rounded-full">
            {(() => {
              const total = totalProtein * 4 + totalCarbs * 4 + totalFat * 9
              if (total === 0) return null
              const protPct = ((totalProtein * 4) / total) * 100
              const carbPct = ((totalCarbs * 4) / total) * 100
              const fatPct = ((totalFat * 9) / total) * 100
              return (
                <>
                  <div
                    className="bg-blue-500"
                    style={{ width: `${protPct}%` }}
                    title={`Proteínas ${protPct.toFixed(0)}%`}
                  />
                  <div
                    className="bg-yellow-500"
                    style={{ width: `${carbPct}%` }}
                    title={`Carbohidratos ${carbPct.toFixed(0)}%`}
                  />
                  <div
                    className="bg-orange-500"
                    style={{ width: `${fatPct}%` }}
                    title={`Grasas ${fatPct.toFixed(0)}%`}
                  />
                </>
              )
            })()}
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-400">
            <span>P {((totalProtein * 4) / Math.max(totalCalories, 1) * 100).toFixed(0)}%</span>
            <span>HC {((totalCarbs * 4) / Math.max(totalCalories, 1) * 100).toFixed(0)}%</span>
            <span>G {((totalFat * 9) / Math.max(totalCalories, 1) * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}
