import { NextRequest, NextResponse } from 'next/server'
import { getMealPlanWithFullDetails } from '@/lib/db/queries/plans'
import { requireRole } from '@/lib/actions/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['nutritionist', 'super_admin'])
    const { id } = await params
    const data = await getMealPlanWithFullDetails(id)

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
