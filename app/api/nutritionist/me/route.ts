import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/actions/auth'
import { getNutritionistById } from '@/lib/db/queries/nutritionist'

export async function GET() {
  try {
    const { nutritionist } = await requireRole(['nutritionist', 'super_admin'])
    if (!nutritionist) {
      return NextResponse.json(null, { status: 404 })
    }

    const data = await getNutritionistById(nutritionist.id)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
