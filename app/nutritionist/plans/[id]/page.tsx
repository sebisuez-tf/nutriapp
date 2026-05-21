'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { MacroTotals } from '@/components/nutritionist/MacroTotals'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import {
  addMealSlotAction,
  deleteMealSlotAction,
  addMealItemAction,
  deleteMealItemAction,
  reorderMealItemsAction,
  updateMealPlanAction,
  activateMealPlanAction,
  getPatientsForSelectorAction,
} from '@/lib/actions/plans'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
  Zap,
  ChevronsUpDown,
  Check,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MealItem {
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
  sort_order: number
  meal_slot_id: string
}

interface MealSlot {
  id: string
  name: string
  time_of_day: string | null
  sort_order: number
  notes: string | null
  meal_plan_id: string
}

interface Plan {
  id: string
  title: string
  status: string
  total_calories: number | null
  total_protein_g: string | null
  total_carbs_g: string | null
  total_fat_g: string | null
  patient_id: string | null
  notes: string | null
}

interface PlanData {
  plan: Plan
  slots: MealSlot[]
  itemsBySlot: Record<string, MealItem[]>
}

// ─── Sortable Item Row ─────────────────────────────────────────────────────────

function SortableItem({
  item,
  onDelete,
}: {
  item: MealItem
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-600 touch-none"
        aria-label="Arrastrar"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800 truncate">{item.food_name}</span>
          {item.quantity && item.unit && (
            <span className="text-xs text-gray-500">
              {item.quantity} {item.unit}
            </span>
          )}
          {item.is_optional && (
            <Badge variant="outline" className="text-xs py-0 h-4">
              opcional
            </Badge>
          )}
        </div>
        {(item.calories || item.protein_g || item.carbs_g || item.fat_g) && (
          <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
            {item.calories && <span>{parseFloat(item.calories).toFixed(0)} kcal</span>}
            {item.protein_g && <span>{parseFloat(item.protein_g).toFixed(0)}g P</span>}
            {item.carbs_g && <span>{parseFloat(item.carbs_g).toFixed(0)}g HC</span>}
            {item.fat_g && <span>{parseFloat(item.fat_g).toFixed(0)}g G</span>}
          </div>
        )}
        {item.alternatives && (
          <p className="text-xs text-gray-400 mt-0.5">Alt: {item.alternatives}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="text-gray-400 hover:text-red-500 transition-colors"
        aria-label="Eliminar alimento"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ─── Add Item Form ─────────────────────────────────────────────────────────────

function AddItemForm({
  slotId,
  nextSortOrder,
  onAdded,
}: {
  slotId: string
  nextSortOrder: number
  onAdded: (item: MealItem) => void
}) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const fd = new FormData(e.currentTarget)
    fd.set('sort_order', String(nextSortOrder))

    const result = await addMealItemAction(slotId, fd)
    setIsSubmitting(false)

    if (result.success) {
      toast.success('Alimento agregado')
      setOpen(false)
      const foodName = fd.get('food_name') as string
      onAdded({
        id: result.data,
        food_name: foodName,
        quantity: fd.get('quantity') as string | null,
        unit: fd.get('unit') as string | null,
        calories: fd.get('calories') as string | null,
        protein_g: fd.get('protein_g') as string | null,
        carbs_g: fd.get('carbs_g') as string | null,
        fat_g: fd.get('fat_g') as string | null,
        is_optional: fd.get('is_optional') === 'true',
        alternatives: fd.get('alternatives') as string | null,
        notes: fd.get('notes') as string | null,
        sort_order: nextSortOrder,
        meal_slot_id: slotId,
      })
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="mt-1 h-7 text-xs text-green-700" />}>
        <Plus className="mr-1 h-3 w-3" />
        Agregar alimento
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar alimento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="food_name">Alimento *</Label>
            <Input
              id="food_name"
              name="food_name"
              required
              className="mt-1"
              placeholder="Avena, pollo, banana..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cantidad</Label>
              <Input name="quantity" type="number" step="0.1" className="mt-1" placeholder="100" />
            </div>
            <div>
              <Label>Unidad</Label>
              <Input name="unit" className="mt-1" placeholder="g, ml, unidad" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Calorías (kcal)</Label>
              <Input name="calories" type="number" step="0.1" className="mt-1" placeholder="0" />
            </div>
            <div>
              <Label>Proteínas (g)</Label>
              <Input name="protein_g" type="number" step="0.1" className="mt-1" placeholder="0" />
            </div>
            <div>
              <Label>Carbohidratos (g)</Label>
              <Input name="carbs_g" type="number" step="0.1" className="mt-1" placeholder="0" />
            </div>
            <div>
              <Label>Grasas (g)</Label>
              <Input name="fat_g" type="number" step="0.1" className="mt-1" placeholder="0" />
            </div>
          </div>
          <div>
            <Label>Alternativas</Label>
            <Input
              name="alternatives"
              className="mt-1"
              placeholder="O bien: arroz, quinoa..."
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_optional" name="is_optional" value="true" />
            <Label htmlFor="is_optional" className="cursor-pointer">
              Alimento opcional
            </Label>
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? 'Agregando...' : 'Agregar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Slot Card ─────────────────────────────────────────────────────────────────

function SlotCard({
  slot,
  items,
  onDeleteSlot,
  onItemsChange,
}: {
  slot: MealSlot
  items: MealItem[]
  onDeleteSlot: (id: string) => void
  onItemsChange: (slotId: string, items: MealItem[]) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [localItems, setLocalItems] = useState<MealItem[]>(items)

  useEffect(() => {
    setLocalItems(items)
  }, [items])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = localItems.findIndex((i) => i.id === active.id)
    const newIndex = localItems.findIndex((i) => i.id === over.id)
    const reordered = arrayMove(localItems, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      sort_order: idx,
    }))

    setLocalItems(reordered)
    onItemsChange(slot.id, reordered)

    await reorderMealItemsAction(reordered.map((i) => ({ id: i.id, sort_order: i.sort_order })))
  }

  async function handleDeleteItem(itemId: string) {
    const result = await deleteMealItemAction(itemId)
    if (result.success) {
      const updated = localItems.filter((i) => i.id !== itemId)
      setLocalItems(updated)
      onItemsChange(slot.id, updated)
      toast.success('Alimento eliminado')
    } else {
      toast.error(result.error)
    }
  }

  function handleItemAdded(item: MealItem) {
    const updated = [...localItems, item]
    setLocalItems(updated)
    onItemsChange(slot.id, updated)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Slot header */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-100">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          {collapsed ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          )}
          <span className="font-medium text-gray-800">{slot.name}</span>
          {slot.time_of_day && (
            <span className="text-xs text-gray-400">{slot.time_of_day}</span>
          )}
          <Badge variant="outline" className="ml-auto text-xs">
            {localItems.length} alimento{localItems.length !== 1 ? 's' : ''}
          </Badge>
        </button>
        <button
          type="button"
          onClick={() => onDeleteSlot(slot.id)}
          className="text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Eliminar momento"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localItems.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {localItems.map((item) => (
                <SortableItem key={item.id} item={item} onDelete={handleDeleteItem} />
              ))}
            </SortableContext>
          </DndContext>

          {localItems.length === 0 && (
            <p className="py-2 text-center text-xs text-gray-400">
              Sin alimentos. Agregá uno abajo.
            </p>
          )}

          <AddItemForm
            slotId={slot.id}
            nextSortOrder={localItems.length}
            onAdded={handleItemAdded}
          />
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PlanEditorPage() {
  const params = useParams()
  const router = useRouter()
  const planId = params.id as string

  const [loading, setLoading] = useState(true)
  const [planData, setPlanData] = useState<PlanData | null>(null)
  const [slots, setSlots] = useState<MealSlot[]>([])
  const [itemsBySlot, setItemsBySlot] = useState<Record<string, MealItem[]>>({})
  const [addingSlot, setAddingSlot] = useState(false)
  const [newSlotName, setNewSlotName] = useState('')
  const [activatingPatientId, setActivatingPatientId] = useState('')
  const [activating, setActivating] = useState(false)
  const [patients, setPatients] = useState<Array<{ id: string; name: string }>>([])
  const [patientComboOpen, setPatientComboOpen] = useState(false)

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch(`/api/plans/${planId}`)
      if (!res.ok) throw new Error('Not found')
      const data: PlanData = await res.json()
      setPlanData(data)
      setSlots(data.slots)
      setItemsBySlot(data.itemsBySlot)
    } catch {
      toast.error('Error cargando plan')
      router.push('/nutritionist/plans')
    } finally {
      setLoading(false)
    }
  }, [planId, router])

  useEffect(() => {
    fetchPlan()
    getPatientsForSelectorAction().then((result) => {
      if (result.success) setPatients(result.data)
    })
  }, [fetchPlan])

  async function handleAddSlot() {
    if (!newSlotName.trim()) return
    setAddingSlot(true)
    const result = await addMealSlotAction(planId, newSlotName.trim(), slots.length)
    setAddingSlot(false)

    if (result.success) {
      toast.success('Momento agregado')
      setNewSlotName('')
      const newSlot: MealSlot = {
        id: result.data,
        name: newSlotName.trim(),
        time_of_day: null,
        sort_order: slots.length,
        notes: null,
        meal_plan_id: planId,
      }
      setSlots((prev) => [...prev, newSlot])
      setItemsBySlot((prev) => ({ ...prev, [result.data]: [] }))
    } else {
      toast.error(result.error)
    }
  }

  async function handleDeleteSlot(slotId: string) {
    const result = await deleteMealSlotAction(slotId)
    if (result.success) {
      toast.success('Momento eliminado')
      setSlots((prev) => prev.filter((s) => s.id !== slotId))
      setItemsBySlot((prev) => {
        const next = { ...prev }
        delete next[slotId]
        return next
      })
    } else {
      toast.error(result.error)
    }
  }

  function handleItemsChange(slotId: string, items: MealItem[]) {
    setItemsBySlot((prev) => ({ ...prev, [slotId]: items }))
  }

  async function handleActivate() {
    if (!activatingPatientId.trim()) {
      toast.error('Ingresá el ID del paciente')
      return
    }
    setActivating(true)
    const result = await activateMealPlanAction(planId, activatingPatientId.trim())
    setActivating(false)

    if (result.success) {
      toast.success('Plan activado para el paciente')
      router.push(`/nutritionist/patients/${activatingPatientId.trim()}`)
    } else {
      toast.error(result.error)
    }
  }

  // Compute all items flat for MacroTotals
  const allItems = Object.values(itemsBySlot).flat()

  if (loading) return <LoadingSpinner fullPage />

  if (!planData) return null

  const { plan } = planData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/nutritionist/plans">
          <Button variant="ghost" size="sm" className="mt-0.5">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{plan.title}</h1>
            <Badge
              className={
                plan.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : plan.status === 'draft'
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-yellow-100 text-yellow-700'
              }
            >
              {plan.status === 'active'
                ? 'Activo'
                : plan.status === 'draft'
                ? 'Borrador'
                : 'Inactivo'}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {slots.length} momento{slots.length !== 1 ? 's' : ''} · {allItems.length} alimento
            {allItems.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Left: slots */}
        <div className="space-y-4">
          {slots.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">
                Sin momentos. Agregá el primer momento del día abajo.
              </p>
            </div>
          )}

          {slots.map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              items={itemsBySlot[slot.id] ?? []}
              onDeleteSlot={handleDeleteSlot}
              onItemsChange={handleItemsChange}
            />
          ))}

          {/* Add slot */}
          <div className="flex gap-2">
            <Input
              value={newSlotName}
              onChange={(e) => setNewSlotName(e.target.value)}
              placeholder="Ej: Desayuno, Almuerzo, Merienda..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddSlot()}
            />
            <Button
              type="button"
              onClick={handleAddSlot}
              disabled={addingSlot || !newSlotName.trim()}
              className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
            >
              <Plus className="mr-1 h-4 w-4" />
              Agregar momento
            </Button>
          </div>
        </div>

        {/* Right: Macros + Activate */}
        <div className="space-y-4">
          <MacroTotals
            items={allItems}
            target={{
              calories: plan.total_calories,
              protein_g: plan.total_protein_g,
              carbs_g: plan.total_carbs_g,
              fat_g: plan.total_fat_g,
            }}
          />

          {/* Activate plan */}
          {plan.status !== 'active' && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-600" />
                Activar para paciente
              </h3>
              <p className="text-xs text-gray-500">
                Asigná este plan a un paciente y actívalo como plan vigente.
              </p>
              <Popover open={patientComboOpen} onOpenChange={setPatientComboOpen}>
                <PopoverTrigger render={<Button variant="outline" role="combobox" aria-expanded={patientComboOpen} className="w-full justify-between text-xs font-normal" size="sm" />}>
                  {activatingPatientId
                    ? (patients.find((p) => p.id === activatingPatientId)?.name ?? 'Paciente seleccionado')
                    : 'Seleccionar paciente...'}
                  <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar paciente..." className="h-8 text-xs" />
                    <CommandList>
                      <CommandEmpty className="py-3 text-center text-xs text-gray-500">
                        Sin resultados
                      </CommandEmpty>
                      <CommandGroup>
                        {patients.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={p.name}
                            onSelect={() => {
                              setActivatingPatientId(p.id)
                              setPatientComboOpen(false)
                            }}
                            className="text-xs"
                          >
                            <Check
                              className={`mr-2 h-3.5 w-3.5 ${activatingPatientId === p.id ? 'opacity-100' : 'opacity-0'}`}
                            />
                            {p.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                onClick={handleActivate}
                disabled={activating || !activatingPatientId.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                {activating ? 'Activando...' : 'Activar plan'}
              </Button>
              <p className="text-xs text-gray-400">
                Tip: podés activar el plan desde la ficha del paciente.
              </p>
            </div>
          )}

          {plan.status === 'active' && plan.patient_id && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-700 font-medium">Plan activo</p>
              <p className="text-xs text-green-600 mt-1">
                Este plan está asignado y activo para un paciente.
              </p>
              <Link href={`/nutritionist/patients/${plan.patient_id}`}>
                <Button variant="outline" size="sm" className="mt-3 w-full border-green-200 text-green-700">
                  Ver paciente
                </Button>
              </Link>
            </div>
          )}

          {/* Plan notes */}
          {plan.notes && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Notas</h3>
              <p className="text-xs text-gray-600 whitespace-pre-wrap">{plan.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
