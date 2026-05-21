/**
 * NutriApp — Demo Seed Script
 *
 * Uso: npx tsx scripts/seed.ts
 * Requiere: .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 *
 * Idempotente: detecta usuarios existentes por email y los saltea.
 * Eliminar todos los datos: supabase db reset
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { default as postgres } from 'postgres'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const DATABASE_URL = process.env.DATABASE_URL!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !DATABASE_URL) {
  console.error('Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const sql = postgres(DATABASE_URL, { ssl: 'require' })

const DEMO_PASSWORD = 'NutriDemo2026!'

// ─── Demo users ──────────────────────────────────────────────────────────────

const NUTRITIONISTS = [
  {
    email: 'annette@nutriapp.demo',
    full_name: 'Annette Sandoval',
    business_name: 'Annette Sandoval — Nutrición',
    primary_color: '#7c3aed',
    secondary_color: '#6d28d9',
    accent_color: '#ede9fe',
    city: 'Buenos Aires',
    contact_email: 'annette@nutriapp.demo',
    contact_phone: '+54 11 5555-0101',
    instagram_handle: '@annettenutri',
    bio: 'Nutricionista especializada en nutrición deportiva y clínica. Más de 8 años de experiencia acompañando pacientes en Buenos Aires.',
  },
  {
    email: 'carlos.mendoza@nutriapp.demo',
    full_name: 'Carlos Mendoza',
    business_name: 'Lic. Mendoza — Nutrición Clínica',
    primary_color: '#0284c7',
    secondary_color: '#0369a1',
    accent_color: '#e0f2fe',
    city: 'Córdoba',
    contact_email: 'carlos.mendoza@nutriapp.demo',
    contact_phone: '+54 351 555-0202',
    instagram_handle: '@carlosmendozanutri',
    bio: 'Especialista en nutrición clínica y tratamiento de obesidad. Atención presencial en Córdoba y online.',
  },
  {
    email: 'lucia.fernandez@nutriapp.demo',
    full_name: 'Lucía Fernández',
    business_name: 'Nutri Lucía — Alimentación Consciente',
    primary_color: '#16a34a',
    secondary_color: '#15803d',
    accent_color: '#dcfce7',
    city: 'Rosario',
    contact_email: 'lucia.fernandez@nutriapp.demo',
    contact_phone: '+54 341 555-0303',
    instagram_handle: '@nutriluciarosario',
    bio: 'Nutricionista y coach en alimentación consciente. Especializada en trastornos alimentarios y nutrición vegana.',
  },
]

const ADMIN = {
  email: 'admin@nutriapp.demo',
  full_name: 'Admin NutriApp',
  role: 'super_admin',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createOrGetUser(email: string, fullName: string, role: string) {
  // Check if user already exists
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers()
  const found = existing?.users?.find((u) => u.email === email)
  if (found) {
    console.log(`  ↳ ya existe: ${email}`)
    return found.id
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  })
  if (error) throw new Error(`createUser(${email}): ${error.message}`)
  console.log(`  ✅ creado: ${email}`)
  return data.user.id
}

async function getNutritionistId(profileId: string): Promise<string> {
  // Retry up to 3 times — trigger runs async
  for (let i = 0; i < 5; i++) {
    const rows = await sql`SELECT id FROM nutritionists WHERE profile_id = ${profileId}`
    if (rows[0]) return rows[0].id as string
    await new Promise((r) => setTimeout(r, 800))
  }
  throw new Error(`No se encontró nutritionist para profile_id=${profileId}`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Iniciando seed de NutriApp...\n')

  // 1. Admin
  console.log('👤 Creando admin...')
  await createOrGetUser(ADMIN.email, ADMIN.full_name, ADMIN.role)

  // 2. Nutricionistas
  console.log('\n👩‍⚕️ Creando nutricionistas...')
  const nutriIds: string[] = []

  for (const n of NUTRITIONISTS) {
    const profileId = await createOrGetUser(n.email, n.full_name, 'nutritionist')
    const nutriId = await getNutritionistId(profileId)

    // Update nutritionist profile
    await sql`
      UPDATE nutritionists SET
        business_name    = ${n.business_name},
        bio              = ${n.bio},
        primary_color    = ${n.primary_color},
        secondary_color  = ${n.secondary_color},
        accent_color     = ${n.accent_color},
        city             = ${n.city},
        contact_email    = ${n.contact_email},
        contact_phone    = ${n.contact_phone},
        instagram_handle = ${n.instagram_handle},
        is_active        = true,
        onboarding_step  = 4,
        max_patients     = 50
      WHERE id = ${nutriId}
    `
    nutriIds.push(nutriId)
  }

  const [annetteId, carlosId, luciaId] = nutriIds

  // 3. Pacientes de Annette
  console.log('\n🧑‍🤝‍🧑 Creando pacientes...')

  const annettePacientes = await sql`
    INSERT INTO patients
      (nutritionist_id, first_name, last_name, email, phone, date_of_birth, sex, occupation, city, is_active, notes)
    VALUES
      (${annetteId}, 'Valentina', 'Gómez', 'valentina.gomez@demo.com', '+54 11 6666-0001', '1995-03-22', 'female', 'Diseñadora gráfica', 'Buenos Aires', true, 'Objetivo: bajar 8 kg antes de diciembre'),
      (${annetteId}, 'Martín',   'Herrera', 'martin.herrera@demo.com',  '+54 11 6666-0002', '1988-07-14', 'male',   'Abogado',            'Buenos Aires', true, 'Hipertensión controlada'),
      (${annetteId}, 'Sofía',    'Álvarez', 'sofia.alvarez@demo.com',   '+54 11 6666-0003', '2001-11-05', 'female', 'Estudiante',         'CABA',         true, 'Deporte: natación 4 veces por semana'),
      (${annetteId}, 'Diego',    'Ruiz',    'diego.ruiz@demo.com',      '+54 11 6666-0004', '1979-02-28', 'male',   'Cocinero',           'La Matanza',   true, 'Trabajo nocturno, horarios irregulares')
    ON CONFLICT DO NOTHING
    RETURNING id, first_name
  `
  console.log(`  ✅ ${annettePacientes.length} pacientes de Annette`)

  // Get patient IDs (handle idempotency — may return 0 rows if already existed)
  const [valentinaRow, martinRow, sofiaRow, diegoRow] = await sql`
    SELECT id, first_name FROM patients
    WHERE nutritionist_id = ${annetteId}
    ORDER BY created_at
    LIMIT 4
  `
  const valentinaId = valentinaRow.id as string
  const martinId    = martinRow.id as string
  const sofiaId     = sofiaRow.id as string
  const diegoId     = diegoRow.id as string

  // Pacientes de Carlos
  const carlosPacientes = await sql`
    INSERT INTO patients
      (nutritionist_id, first_name, last_name, email, phone, date_of_birth, sex, occupation, city, is_active)
    VALUES
      (${carlosId}, 'Florencia', 'Benítez',  'florencia.benitez@demo.com',  '+54 351 7777-0001', '1992-09-10', 'female', 'Enfermera',          'Córdoba', true),
      (${carlosId}, 'Rodrigo',   'Sánchez',  'rodrigo.sanchez@demo.com',    '+54 351 7777-0002', '1985-04-17', 'male',   'Mecánico',           'Córdoba', true),
      (${carlosId}, 'Camila',    'Navarro',  'camila.navarro@demo.com',     '+54 351 7777-0003', '1998-12-03', 'female', 'Estudiante medicina','Córdoba', true)
    ON CONFLICT DO NOTHING
    RETURNING id
  `
  console.log(`  ✅ ${carlosPacientes.length} pacientes de Carlos`)

  // 4. Historia clínica de Valentina
  await sql`
    INSERT INTO clinical_records
      (patient_id, nutritionist_id, main_objective, secondary_objectives, eating_habits,
       meal_frequency, water_intake_liters, physical_activity, stress_level, sleep_hours,
       food_preferences, food_dislikes, dietary_pattern, pathologies, smoking_status)
    VALUES
      (${valentinaId}, ${annetteId},
       'Bajar 8 kg y mejorar composición corporal',
       ARRAY['Mejorar energía diaria', 'Reducir inflamación'],
       'Come rápido, saltea el desayuno, almuerza al mediodía, cena tarde',
       4, 1.5, 'Camina 30 min/día, quiere volver al gym',
       6, 7.0,
       'Pasta, frutas, lácteos, mate',
       'Pescado, brócoli',
       'omnivore',
       ARRAY[]::TEXT[],
       'no'
      )
    ON CONFLICT (patient_id) DO NOTHING
  `

  // 5. Mediciones de Valentina (progreso últimos 5 meses)
  console.log('\n📊 Cargando mediciones...')
  await sql`
    INSERT INTO measurements
      (patient_id, nutritionist_id, measured_at, weight_kg, height_cm, bmi,
       body_fat_percentage, muscle_mass_kg, waist_circumference, hip_circumference)
    VALUES
      (${valentinaId}, ${annetteId}, '2026-01-15', 78.4, 165.0, 28.80, 34.2, 32.1, 88.0, 102.0),
      (${valentinaId}, ${annetteId}, '2026-02-12', 76.9, 165.0, 28.26, 33.5, 32.4, 86.5, 100.5),
      (${valentinaId}, ${annetteId}, '2026-03-10', 75.2, 165.0, 27.64, 32.8, 32.7, 85.0,  99.0),
      (${valentinaId}, ${annetteId}, '2026-04-08', 73.8, 165.0, 27.12, 31.9, 33.1, 83.5,  97.5),
      (${valentinaId}, ${annetteId}, '2026-05-06', 72.1, 165.0, 26.50, 30.8, 33.6, 82.0,  96.0)
    ON CONFLICT DO NOTHING
  `

  // Mediciones de Martín
  await sql`
    INSERT INTO measurements
      (patient_id, nutritionist_id, measured_at, weight_kg, height_cm, bmi, body_fat_percentage, muscle_mass_kg)
    VALUES
      (${martinId}, ${annetteId}, '2026-02-01', 95.0, 178.0, 29.97, 28.5, 44.0),
      (${martinId}, ${annetteId}, '2026-03-01', 93.5, 178.0, 29.50, 27.9, 44.3),
      (${martinId}, ${annetteId}, '2026-04-01', 92.1, 178.0, 29.06, 27.2, 44.7),
      (${martinId}, ${annetteId}, '2026-05-01', 90.8, 178.0, 28.65, 26.5, 45.2)
    ON CONFLICT DO NOTHING
  `
  console.log('  ✅ Mediciones cargadas')

  // 6. Plan alimentario de Valentina
  console.log('\n🥗 Creando plan alimentario...')
  const planRows = await sql`
    INSERT INTO meal_plans
      (nutritionist_id, patient_id, title, description, status,
       total_calories, total_protein_g, total_carbs_g, total_fat_g,
       valid_from, valid_until)
    VALUES
      (${annetteId}, ${valentinaId},
       'Plan Reducción Mayo-Junio 2026',
       'Plan hipocalórico con adecuado aporte proteico para preservar masa muscular durante la etapa de reducción.',
       'active',
       1650, 115.00, 195.00, 52.00,
       '2026-05-01', '2026-06-30')
    ON CONFLICT DO NOTHING
    RETURNING id
  `

  let planId: string
  if (planRows.length > 0) {
    planId = planRows[0].id as string
  } else {
    const existing = await sql`SELECT id FROM meal_plans WHERE patient_id = ${valentinaId} AND title = 'Plan Reducción Mayo-Junio 2026' LIMIT 1`
    planId = existing[0].id as string
  }

  // Slots del plan
  const slotData = [
    { name: 'Desayuno', time_of_day: '08:00', sort_order: 0 },
    { name: 'Media Mañana', time_of_day: '10:30', sort_order: 1 },
    { name: 'Almuerzo', time_of_day: '13:00', sort_order: 2 },
    { name: 'Merienda', time_of_day: '17:00', sort_order: 3 },
    { name: 'Cena', time_of_day: '20:30', sort_order: 4 },
  ]

  // Check if slots already exist
  const existingSlots = await sql`SELECT id, name FROM meal_slots WHERE meal_plan_id = ${planId}`
  let slots: Array<{ id: string; name: string }> = existingSlots as any

  if (slots.length === 0) {
    for (const s of slotData) {
      const [slot] = await sql`
        INSERT INTO meal_slots (meal_plan_id, name, time_of_day, sort_order)
        VALUES (${planId}, ${s.name}, ${s.time_of_day}, ${s.sort_order})
        RETURNING id, name
      `
      slots.push(slot as any)
    }
  }

  // Items por slot
  const itemsBySlot: Record<string, Array<{ food_name: string; quantity: number; unit: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; notes?: string; is_optional?: boolean }>> = {
    'Desayuno': [
      { food_name: 'Mate cocido con leche descremada', quantity: 250, unit: 'ml', calories: 90, protein_g: 7, carbs_g: 10, fat_g: 2 },
      { food_name: 'Tostadas integrales', quantity: 2, unit: 'unidades', calories: 130, protein_g: 5, carbs_g: 24, fat_g: 2 },
      { food_name: 'Queso blanco 0% de grasa', quantity: 80, unit: 'g', calories: 55, protein_g: 9, carbs_g: 3, fat_g: 0.5 },
      { food_name: 'Fruta de estación (naranja o mandarina)', quantity: 1, unit: 'unidad', calories: 60, protein_g: 1, carbs_g: 14, fat_g: 0.2 },
    ],
    'Media Mañana': [
      { food_name: 'Mate (sin azúcar)', quantity: 1, unit: 'cebadura', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      { food_name: 'Yogur descremado sin azúcar', quantity: 1, unit: 'pot (200g)', calories: 100, protein_g: 8, carbs_g: 12, fat_g: 1.5 },
      { food_name: 'Puñado de nueces', quantity: 20, unit: 'g', calories: 130, protein_g: 3, carbs_g: 3, fat_g: 13, is_optional: true },
    ],
    'Almuerzo': [
      { food_name: 'Milanesa de pollo al horno', quantity: 150, unit: 'g', calories: 280, protein_g: 35, carbs_g: 12, fat_g: 8 },
      { food_name: 'Ensalada mixta (lechuga, tomate, zanahoria)', quantity: 200, unit: 'g', calories: 50, protein_g: 2, carbs_g: 8, fat_g: 0.5, notes: 'Aderezar con limón y aceite (1 cdita)' },
      { food_name: 'Arroz integral cocido', quantity: 100, unit: 'g', calories: 130, protein_g: 3, carbs_g: 28, fat_g: 1 },
    ],
    'Merienda': [
      { food_name: 'Mate con leche o té', quantity: 1, unit: 'taza', calories: 50, protein_g: 3, carbs_g: 6, fat_g: 1 },
      { food_name: 'Galletitas de arroz', quantity: 4, unit: 'unidades', calories: 90, protein_g: 2, carbs_g: 20, fat_g: 0.5 },
      { food_name: 'Banana', quantity: 1, unit: 'mediana', calories: 90, protein_g: 1, carbs_g: 22, fat_g: 0.3, is_optional: true, notes: 'Alternativa: manzana' },
    ],
    'Cena': [
      { food_name: 'Ñoquis de papa caseros', quantity: 150, unit: 'g', calories: 260, protein_g: 7, carbs_g: 52, fat_g: 3, notes: 'Día jueves — tradición argentina' },
      { food_name: 'Salsa de tomate natural', quantity: 100, unit: 'g', calories: 45, protein_g: 2, carbs_g: 9, fat_g: 0.5 },
      { food_name: 'Pechuga de pollo a la plancha', quantity: 130, unit: 'g', calories: 185, protein_g: 35, carbs_g: 0, fat_g: 4, notes: 'Los demás días reemplaza los ñoquis' },
      { food_name: 'Verduras salteadas (zapallito, morrón)', quantity: 150, unit: 'g', calories: 60, protein_g: 2, carbs_g: 10, fat_g: 1.5 },
    ],
  }

  for (const slot of slots) {
    const items = itemsBySlot[slot.name as string]
    if (!items) continue
    // Check if items already exist for this slot
    const existingItems = await sql`SELECT id FROM meal_items WHERE meal_slot_id = ${slot.id} LIMIT 1`
    if (existingItems.length > 0) continue
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      await sql`
        INSERT INTO meal_items
          (meal_slot_id, food_name, quantity, unit, calories, protein_g, carbs_g, fat_g,
           is_optional, notes, sort_order)
        VALUES
          (${slot.id}, ${item.food_name}, ${item.quantity}, ${item.unit},
           ${item.calories}, ${item.protein_g}, ${item.carbs_g}, ${item.fat_g},
           ${item.is_optional ?? false}, ${item.notes ?? null}, ${i})
      `
    }
  }
  console.log('  ✅ Plan alimentario creado con 5 comidas típicas argentinas')

  // Template plan (asado del fin de semana)
  await sql`
    INSERT INTO meal_plans
      (nutritionist_id, title, description, is_template, template_name, status,
       total_calories, total_protein_g, total_carbs_g, total_fat_g)
    VALUES
      (${annetteId},
       'Plan Asado de Fin de Semana',
       'Plan de un día para asados y reuniones familiares. Permite disfrutar sin culpa.',
       true, 'asado_finde', 'active',
       2100, 130.00, 180.00, 75.00)
    ON CONFLICT DO NOTHING
  `

  // 7. Turnos
  console.log('\n📅 Creando turnos...')
  await sql`
    INSERT INTO appointments
      (nutritionist_id, patient_id, scheduled_at, duration_minutes, type, status, notes)
    VALUES
      (${annetteId}, ${valentinaId}, NOW() + interval '3 days',  60, 'followup',  'scheduled',  'Seguimiento mensual — revisar mediciones y ajustar plan'),
      (${annetteId}, ${martinId},   NOW() + interval '7 days',  45, 'followup',  'scheduled',  'Control de presión y peso'),
      (${annetteId}, ${sofiaId},    NOW() + interval '10 days', 60, 'initial',   'scheduled',  'Primera consulta — anamnesis completa'),
      (${annetteId}, ${valentinaId}, NOW() - interval '30 days', 60, 'followup', 'completed',  'Revisión del plan anterior — buena adherencia'),
      (${annetteId}, ${martinId},   NOW() - interval '28 days', 45, 'followup', 'completed',  'Bajó 1.5kg en el mes')
    ON CONFLICT DO NOTHING
  `
  console.log('  ✅ Turnos creados')

  // 8. Grupo de pacientes
  console.log('\n👥 Creando grupos...')
  const groupRows = await sql`
    INSERT INTO patient_groups (nutritionist_id, name, description, type)
    VALUES
      (${annetteId}, 'Reducción de Peso 2026', 'Pacientes en proceso de reducción de peso corporal', 'category'),
      (${annetteId}, 'Deportistas',             'Pacientes con actividad deportiva intensa',           'team')
    ON CONFLICT DO NOTHING
    RETURNING id, name
  `
  if (groupRows.length > 0) {
    const pesoGroupId = groupRows[0].id as string
    await sql`
      INSERT INTO patient_group_members (group_id, patient_id)
      VALUES (${pesoGroupId}, ${valentinaId}), (${pesoGroupId}, ${martinId})
      ON CONFLICT DO NOTHING
    `
    if (groupRows[1]) {
      const deportesGroupId = groupRows[1].id as string
      await sql`
        INSERT INTO patient_group_members (group_id, patient_id)
        VALUES (${deportesGroupId}, ${sofiaId})
        ON CONFLICT DO NOTHING
      `
    }
  }
  console.log('  ✅ Grupos creados')

  // 9. Plan de Sofía (deportista)
  const sofiaPlanRows = await sql`
    INSERT INTO meal_plans
      (nutritionist_id, patient_id, title, description, status,
       total_calories, total_protein_g, total_carbs_g, total_fat_g,
       valid_from, valid_until)
    VALUES
      (${annetteId}, ${sofiaId},
       'Plan Alto Rendimiento — Natación',
       'Plan diseñado para optimizar el rendimiento en natación competitiva.',
       'active', 2400, 145.00, 310.00, 65.00,
       '2026-05-01', '2026-07-31')
    ON CONFLICT DO NOTHING
    RETURNING id
  `
  if (sofiaPlanRows.length > 0) {
    const sofiaPlanId = sofiaPlanRows[0].id as string
    const [preSlot, postSlot] = await sql`
      INSERT INTO meal_slots (meal_plan_id, name, time_of_day, sort_order)
      VALUES
        (${sofiaPlanId}, 'Pre-entrenamiento', '07:00', 0),
        (${sofiaPlanId}, 'Post-entrenamiento', '09:30', 1),
        (${sofiaPlanId}, 'Almuerzo', '13:00', 2)
      RETURNING id, name
    `
    await sql`
      INSERT INTO meal_items (meal_slot_id, food_name, quantity, unit, calories, protein_g, carbs_g, fat_g, sort_order)
      VALUES
        (${preSlot.id},  'Banana',                      1,   'unidad', 90, 1, 22, 0.3, 0),
        (${preSlot.id},  'Avena con leche',              60,  'g',     240, 9, 42, 5.0, 1),
        (${postSlot.id}, 'Batido de proteínas con leche',1,   'porción',220, 28, 12, 4.0, 0),
        (${postSlot.id}, 'Tostadas integrales con miel', 2,   'unidades',170, 5, 36, 2.0, 1)
      ON CONFLICT DO NOTHING
    `
  }

  console.log('\n✅ Seed completado exitosamente!\n')
  console.log('─'.repeat(50))
  console.log('CREDENCIALES DE DEMO:')
  console.log('─'.repeat(50))
  console.log(`Nutricionista "Annette":  ${NUTRITIONISTS[0].email}  /  ${DEMO_PASSWORD}`)
  console.log(`Nutricionista "Carlos":   ${NUTRITIONISTS[1].email}  /  ${DEMO_PASSWORD}`)
  console.log(`Nutricionista "Lucía":    ${NUTRITIONISTS[2].email}  /  ${DEMO_PASSWORD}`)
  console.log(`Super Admin:              ${ADMIN.email}                /  ${DEMO_PASSWORD}`)
  console.log('─'.repeat(50))

  await sql.end()
}

main().catch((e) => {
  console.error('❌ Seed falló:', e)
  sql.end()
  process.exit(1)
})
