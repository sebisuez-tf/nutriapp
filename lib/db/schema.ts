import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  numeric,
  date,
  jsonb,
  time,
  index,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum('role', [
  'super_admin',
  'nutritionist',
  'patient',
  'coordinator',
  'support',
])

export const planTypeEnum = pgEnum('plan_type', [
  'basic',
  'professional',
  'premium',
  'club',
])

export const patientSexEnum = pgEnum('patient_sex', ['male', 'female', 'other'])

export const dietaryPatternEnum = pgEnum('dietary_pattern', [
  'omnivore',
  'vegetarian',
  'vegan',
  'other',
])

export const mealPlanStatusEnum = pgEnum('meal_plan_status', [
  'draft',
  'active',
  'inactive',
  'archived',
])

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
])

export const appointmentTypeEnum = pgEnum('appointment_type', [
  'initial',
  'followup',
  'online',
  'remote',
])

export const documentTypeEnum = pgEnum('document_type', [
  'meal_plan_pdf',
  'anthropometric_report',
  'other',
])

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'past_due',
  'cancelled',
  'trial',
])

export const groupTypeEnum = pgEnum('group_type', [
  'club',
  'team',
  'institution',
  'category',
])

// ─── Tables ──────────────────────────────────────────────────────────────────

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // References auth.users — set by Supabase trigger
  role: roleEnum('role').notNull().default('nutritionist'),
  full_name: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  avatar_url: text('avatar_url'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const nutritionists = pgTable(
  'nutritionists',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    profile_id: uuid('profile_id')
      .notNull()
      .unique()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    business_name: text('business_name').notNull().default(''),
    bio: text('bio'),
    logo_url: text('logo_url'),
    primary_color: text('primary_color').notNull().default('#16a34a'),
    secondary_color: text('secondary_color').notNull().default('#15803d'),
    accent_color: text('accent_color').notNull().default('#4ade80'),
    contact_email: text('contact_email'),
    contact_phone: text('contact_phone'),
    website_url: text('website_url'),
    instagram_handle: text('instagram_handle'),
    address: text('address'),
    city: text('city'),
    country: text('country').default('Argentina'),
    is_active: boolean('is_active').notNull().default(true),
    plan_type: planTypeEnum('plan_type').notNull().default('basic'),
    plan_expires_at: timestamp('plan_expires_at', { withTimezone: true }),
    max_patients: integer('max_patients').notNull().default(20),
    onboarding_step: integer('onboarding_step').notNull().default(0),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('nutritionists_profile_id_idx').on(t.profile_id)]
)

export const patients = pgTable(
  'patients',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    nutritionist_id: uuid('nutritionist_id')
      .notNull()
      .references(() => nutritionists.id, { onDelete: 'cascade' }),
    profile_id: uuid('profile_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    first_name: text('first_name').notNull(),
    last_name: text('last_name').notNull(),
    email: text('email'),
    phone: text('phone'),
    date_of_birth: date('date_of_birth'),
    sex: patientSexEnum('sex'),
    occupation: text('occupation'),
    city: text('city'),
    is_active: boolean('is_active').notNull().default(true),
    access_expires_at: timestamp('access_expires_at', { withTimezone: true }),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('patients_nutritionist_id_idx').on(t.nutritionist_id),
    index('patients_profile_id_idx').on(t.profile_id),
    index('patients_created_at_idx').on(t.created_at),
  ]
)

export const clinicalRecords = pgTable(
  'clinical_records',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    patient_id: uuid('patient_id')
      .notNull()
      .unique()
      .references(() => patients.id, { onDelete: 'cascade' }),
    nutritionist_id: uuid('nutritionist_id')
      .notNull()
      .references(() => nutritionists.id, { onDelete: 'cascade' }),
    personal_history: text('personal_history'),
    family_history: text('family_history'),
    pathologies: text('pathologies').array(),
    medications: text('medications'),
    allergies: text('allergies').array(),
    intolerances: text('intolerances').array(),
    eating_habits: text('eating_habits'),
    meal_frequency: integer('meal_frequency'),
    water_intake_liters: numeric('water_intake_liters', { precision: 4, scale: 2 }),
    alcohol_consumption: text('alcohol_consumption'),
    smoking_status: text('smoking_status'),
    sleep_hours: numeric('sleep_hours', { precision: 4, scale: 1 }),
    stress_level: integer('stress_level'), // 1-10
    physical_activity: text('physical_activity'),
    main_objective: text('main_objective'),
    secondary_objectives: text('secondary_objectives').array(),
    food_preferences: text('food_preferences'),
    food_dislikes: text('food_dislikes'),
    dietary_pattern: dietaryPatternEnum('dietary_pattern'),
    sport_history: text('sport_history'),
    current_sport: text('current_sport'),
    training_frequency: text('training_frequency'),
    competition_level: text('competition_level'),
    consent_signed_at: timestamp('consent_signed_at', { withTimezone: true }),
    consent_ip_address: text('consent_ip_address'),
    terms_accepted_at: timestamp('terms_accepted_at', { withTimezone: true }),
    privacy_accepted_at: timestamp('privacy_accepted_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('clinical_records_patient_id_idx').on(t.patient_id),
    index('clinical_records_nutritionist_id_idx').on(t.nutritionist_id),
  ]
)

export const measurements = pgTable(
  'measurements',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    patient_id: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    nutritionist_id: uuid('nutritionist_id')
      .notNull()
      .references(() => nutritionists.id, { onDelete: 'cascade' }),
    measured_at: date('measured_at').notNull(),
    weight_kg: numeric('weight_kg', { precision: 5, scale: 2 }),
    height_cm: numeric('height_cm', { precision: 5, scale: 1 }),
    bmi: numeric('bmi', { precision: 5, scale: 2 }), // computed in application layer
    body_fat_percentage: numeric('body_fat_percentage', { precision: 5, scale: 2 }),
    muscle_mass_kg: numeric('muscle_mass_kg', { precision: 5, scale: 2 }),
    bone_mass_kg: numeric('bone_mass_kg', { precision: 5, scale: 2 }),
    visceral_fat_level: integer('visceral_fat_level'),
    total_body_water_percentage: numeric('total_body_water_percentage', { precision: 5, scale: 2 }),
    waist_circumference: numeric('waist_circumference', { precision: 5, scale: 1 }),
    hip_circumference: numeric('hip_circumference', { precision: 5, scale: 1 }),
    arm_circumference: numeric('arm_circumference', { precision: 5, scale: 1 }),
    thigh_circumference: numeric('thigh_circumference', { precision: 5, scale: 1 }),
    calf_circumference: numeric('calf_circumference', { precision: 5, scale: 1 }),
    chest_circumference: numeric('chest_circumference', { precision: 5, scale: 1 }),
    triceps_skinfold: numeric('triceps_skinfold', { precision: 5, scale: 1 }),
    subscapular_skinfold: numeric('subscapular_skinfold', { precision: 5, scale: 1 }),
    abdominal_skinfold: numeric('abdominal_skinfold', { precision: 5, scale: 1 }),
    suprailiac_skinfold: numeric('suprailiac_skinfold', { precision: 5, scale: 1 }),
    thigh_skinfold: numeric('thigh_skinfold', { precision: 5, scale: 1 }),
    metabolic_age: integer('metabolic_age'),
    basal_metabolic_rate: integer('basal_metabolic_rate'),
    notes: text('notes'),
    measurement_method: text('measurement_method'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('measurements_patient_id_idx').on(t.patient_id),
    index('measurements_nutritionist_id_idx').on(t.nutritionist_id),
    index('measurements_measured_at_idx').on(t.measured_at),
  ]
)

export const mealPlans = pgTable(
  'meal_plans',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    nutritionist_id: uuid('nutritionist_id')
      .notNull()
      .references(() => nutritionists.id, { onDelete: 'cascade' }),
    patient_id: uuid('patient_id').references(() => patients.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    description: text('description'),
    is_template: boolean('is_template').notNull().default(false),
    template_name: text('template_name'),
    status: mealPlanStatusEnum('status').notNull().default('draft'),
    total_calories: integer('total_calories'),
    total_protein_g: numeric('total_protein_g', { precision: 6, scale: 2 }),
    total_carbs_g: numeric('total_carbs_g', { precision: 6, scale: 2 }),
    total_fat_g: numeric('total_fat_g', { precision: 6, scale: 2 }),
    notes: text('notes'),
    valid_from: date('valid_from'),
    valid_until: date('valid_until'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('meal_plans_nutritionist_id_idx').on(t.nutritionist_id),
    index('meal_plans_patient_id_idx').on(t.patient_id),
    index('meal_plans_status_idx').on(t.status),
  ]
)

export const mealSlots = pgTable(
  'meal_slots',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    meal_plan_id: uuid('meal_plan_id')
      .notNull()
      .references(() => mealPlans.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    time_of_day: time('time_of_day'),
    sort_order: integer('sort_order').notNull().default(0),
    notes: text('notes'),
  },
  (t) => [index('meal_slots_meal_plan_id_idx').on(t.meal_plan_id)]
)

export const mealItems = pgTable(
  'meal_items',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    meal_slot_id: uuid('meal_slot_id')
      .notNull()
      .references(() => mealSlots.id, { onDelete: 'cascade' }),
    food_name: text('food_name').notNull(),
    quantity: numeric('quantity', { precision: 8, scale: 2 }),
    unit: text('unit'),
    calories: numeric('calories', { precision: 7, scale: 2 }),
    protein_g: numeric('protein_g', { precision: 6, scale: 2 }),
    carbs_g: numeric('carbs_g', { precision: 6, scale: 2 }),
    fat_g: numeric('fat_g', { precision: 6, scale: 2 }),
    is_optional: boolean('is_optional').notNull().default(false),
    alternatives: text('alternatives'),
    notes: text('notes'),
    sort_order: integer('sort_order').notNull().default(0),
  },
  (t) => [index('meal_items_meal_slot_id_idx').on(t.meal_slot_id)]
)

export const recipes = pgTable(
  'recipes',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    nutritionist_id: uuid('nutritionist_id')
      .notNull()
      .references(() => nutritionists.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    instructions: text('instructions'),
    prep_time_minutes: integer('prep_time_minutes'),
    cook_time_minutes: integer('cook_time_minutes'),
    servings: integer('servings'),
    calories_per_serving: numeric('calories_per_serving', { precision: 7, scale: 2 }),
    protein_per_serving: numeric('protein_per_serving', { precision: 6, scale: 2 }),
    carbs_per_serving: numeric('carbs_per_serving', { precision: 6, scale: 2 }),
    fat_per_serving: numeric('fat_per_serving', { precision: 6, scale: 2 }),
    image_url: text('image_url'),
    tags: text('tags').array(),
    is_public: boolean('is_public').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('recipes_nutritionist_id_idx').on(t.nutritionist_id)]
)

export const recipeIngredients = pgTable(
  'recipe_ingredients',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    recipe_id: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    ingredient_name: text('ingredient_name').notNull(),
    quantity: numeric('quantity', { precision: 8, scale: 2 }),
    unit: text('unit'),
    notes: text('notes'),
    sort_order: integer('sort_order').notNull().default(0),
  },
  (t) => [index('recipe_ingredients_recipe_id_idx').on(t.recipe_id)]
)

export const appointments = pgTable(
  'appointments',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    nutritionist_id: uuid('nutritionist_id')
      .notNull()
      .references(() => nutritionists.id, { onDelete: 'cascade' }),
    patient_id: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    scheduled_at: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    duration_minutes: integer('duration_minutes').notNull().default(60),
    status: appointmentStatusEnum('status').notNull().default('scheduled'),
    type: appointmentTypeEnum('type').notNull().default('followup'),
    notes: text('notes'),
    reminder_sent: boolean('reminder_sent').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('appointments_nutritionist_id_idx').on(t.nutritionist_id),
    index('appointments_patient_id_idx').on(t.patient_id),
    index('appointments_scheduled_at_idx').on(t.scheduled_at),
  ]
)

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    nutritionist_id: uuid('nutritionist_id')
      .notNull()
      .references(() => nutritionists.id, { onDelete: 'cascade' }),
    sender_id: uuid('sender_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    receiver_id: uuid('receiver_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    patient_id: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    is_read: boolean('is_read').notNull().default(false),
    read_at: timestamp('read_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('messages_nutritionist_id_idx').on(t.nutritionist_id),
    index('messages_patient_id_idx').on(t.patient_id),
    index('messages_created_at_idx').on(t.created_at),
  ]
)

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    nutritionist_id: uuid('nutritionist_id')
      .notNull()
      .references(() => nutritionists.id, { onDelete: 'cascade' }),
    patient_id: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    type: documentTypeEnum('type').notNull(),
    title: text('title').notNull(),
    file_url: text('file_url').notNull(),
    generated_at: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
    is_sent_to_patient: boolean('is_sent_to_patient').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('documents_nutritionist_id_idx').on(t.nutritionist_id),
    index('documents_patient_id_idx').on(t.patient_id),
  ]
)

export const educationalVideos = pgTable(
  'educational_videos',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    nutritionist_id: uuid('nutritionist_id').references(() => nutritionists.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    description: text('description'),
    video_url: text('video_url').notNull(),
    thumbnail_url: text('thumbnail_url'),
    tags: text('tags').array(),
    is_visible_to_patients: boolean('is_visible_to_patients').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('educational_videos_nutritionist_id_idx').on(t.nutritionist_id)]
)

export const patientVideos = pgTable(
  'patient_videos',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    patient_id: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    video_id: uuid('video_id')
      .notNull()
      .references(() => educationalVideos.id, { onDelete: 'cascade' }),
    assigned_at: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
    watched_at: timestamp('watched_at', { withTimezone: true }),
  },
  (t) => [
    index('patient_videos_patient_id_idx').on(t.patient_id),
    index('patient_videos_video_id_idx').on(t.video_id),
  ]
)

export const recommendedProducts = pgTable(
  'recommended_products',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    nutritionist_id: uuid('nutritionist_id')
      .notNull()
      .references(() => nutritionists.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    brand: text('brand'),
    description: text('description'),
    image_url: text('image_url'),
    category: text('category'),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('recommended_products_nutritionist_id_idx').on(t.nutritionist_id)]
)

export const patientProducts = pgTable(
  'patient_products',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    patient_id: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    product_id: uuid('product_id')
      .notNull()
      .references(() => recommendedProducts.id, { onDelete: 'cascade' }),
    notes: text('notes'),
    assigned_at: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('patient_products_patient_id_idx').on(t.patient_id)]
)

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    actor_id: uuid('actor_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    nutritionist_id: uuid('nutritionist_id').references(() => nutritionists.id, {
      onDelete: 'set null',
    }),
    action: text('action').notNull(),
    entity_type: text('entity_type').notNull(),
    entity_id: text('entity_id'),
    old_values: jsonb('old_values'),
    new_values: jsonb('new_values'),
    ip_address: text('ip_address'),
    user_agent: text('user_agent'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('audit_logs_actor_id_idx').on(t.actor_id),
    index('audit_logs_nutritionist_id_idx').on(t.nutritionist_id),
    index('audit_logs_created_at_idx').on(t.created_at),
  ]
)

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    nutritionist_id: uuid('nutritionist_id')
      .notNull()
      .unique()
      .references(() => nutritionists.id, { onDelete: 'cascade' }),
    plan_type: planTypeEnum('plan_type').notNull(),
    status: subscriptionStatusEnum('status').notNull().default('trial'),
    stripe_subscription_id: text('stripe_subscription_id'),
    current_period_start: timestamp('current_period_start', { withTimezone: true }),
    current_period_end: timestamp('current_period_end', { withTimezone: true }),
    cancel_at_period_end: boolean('cancel_at_period_end').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('subscriptions_nutritionist_id_idx').on(t.nutritionist_id)]
)

export const patientGroups = pgTable(
  'patient_groups',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    nutritionist_id: uuid('nutritionist_id')
      .notNull()
      .references(() => nutritionists.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    type: groupTypeEnum('type').notNull().default('category'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('patient_groups_nutritionist_id_idx').on(t.nutritionist_id)]
)

export const patientGroupMembers = pgTable(
  'patient_group_members',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    group_id: uuid('group_id')
      .notNull()
      .references(() => patientGroups.id, { onDelete: 'cascade' }),
    patient_id: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    joined_at: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('patient_group_members_group_id_idx').on(t.group_id),
    index('patient_group_members_patient_id_idx').on(t.patient_id),
  ]
)

export const nutritionistCoordinators = pgTable(
  'nutritionist_coordinators',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    nutritionist_id: uuid('nutritionist_id')
      .notNull()
      .references(() => nutritionists.id, { onDelete: 'cascade' }),
    coordinator_profile_id: uuid('coordinator_profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    group_id: uuid('group_id').references(() => patientGroups.id, {
      onDelete: 'set null',
    }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('nutritionist_coordinators_nutritionist_id_idx').on(t.nutritionist_id),
    index('nutritionist_coordinators_coordinator_profile_id_idx').on(t.coordinator_profile_id),
  ]
)

// ─── Relations ────────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  nutritionist: one(nutritionists, {
    fields: [profiles.id],
    references: [nutritionists.profile_id],
  }),
  sentMessages: many(messages, { relationName: 'sender' }),
  receivedMessages: many(messages, { relationName: 'receiver' }),
  auditLogs: many(auditLogs),
  coordinatorRoles: many(nutritionistCoordinators),
}))

export const nutritionistsRelations = relations(nutritionists, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [nutritionists.profile_id],
    references: [profiles.id],
  }),
  patients: many(patients),
  mealPlans: many(mealPlans),
  recipes: many(recipes),
  appointments: many(appointments),
  messages: many(messages),
  documents: many(documents),
  educationalVideos: many(educationalVideos),
  recommendedProducts: many(recommendedProducts),
  auditLogs: many(auditLogs),
  subscription: one(subscriptions),
  patientGroups: many(patientGroups),
  coordinators: many(nutritionistCoordinators),
}))

export const patientsRelations = relations(patients, ({ one, many }) => ({
  nutritionist: one(nutritionists, {
    fields: [patients.nutritionist_id],
    references: [nutritionists.id],
  }),
  profile: one(profiles, {
    fields: [patients.profile_id],
    references: [profiles.id],
  }),
  clinicalRecord: one(clinicalRecords),
  measurements: many(measurements),
  mealPlans: many(mealPlans),
  appointments: many(appointments),
  messages: many(messages),
  documents: many(documents),
  patientVideos: many(patientVideos),
  patientProducts: many(patientProducts),
  groupMemberships: many(patientGroupMembers),
}))

export const clinicalRecordsRelations = relations(clinicalRecords, ({ one }) => ({
  patient: one(patients, {
    fields: [clinicalRecords.patient_id],
    references: [patients.id],
  }),
  nutritionist: one(nutritionists, {
    fields: [clinicalRecords.nutritionist_id],
    references: [nutritionists.id],
  }),
}))

export const measurementsRelations = relations(measurements, ({ one }) => ({
  patient: one(patients, {
    fields: [measurements.patient_id],
    references: [patients.id],
  }),
  nutritionist: one(nutritionists, {
    fields: [measurements.nutritionist_id],
    references: [nutritionists.id],
  }),
}))

export const mealPlansRelations = relations(mealPlans, ({ one, many }) => ({
  nutritionist: one(nutritionists, {
    fields: [mealPlans.nutritionist_id],
    references: [nutritionists.id],
  }),
  patient: one(patients, {
    fields: [mealPlans.patient_id],
    references: [patients.id],
  }),
  slots: many(mealSlots),
}))

export const mealSlotsRelations = relations(mealSlots, ({ one, many }) => ({
  mealPlan: one(mealPlans, {
    fields: [mealSlots.meal_plan_id],
    references: [mealPlans.id],
  }),
  items: many(mealItems),
}))

export const mealItemsRelations = relations(mealItems, ({ one }) => ({
  slot: one(mealSlots, {
    fields: [mealItems.meal_slot_id],
    references: [mealSlots.id],
  }),
}))

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  nutritionist: one(nutritionists, {
    fields: [recipes.nutritionist_id],
    references: [nutritionists.id],
  }),
  ingredients: many(recipeIngredients),
}))

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipe_id],
    references: [recipes.id],
  }),
}))

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  nutritionist: one(nutritionists, {
    fields: [appointments.nutritionist_id],
    references: [nutritionists.id],
  }),
  patient: one(patients, {
    fields: [appointments.patient_id],
    references: [patients.id],
  }),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  nutritionist: one(nutritionists, {
    fields: [messages.nutritionist_id],
    references: [nutritionists.id],
  }),
  sender: one(profiles, {
    fields: [messages.sender_id],
    references: [profiles.id],
    relationName: 'sender',
  }),
  receiver: one(profiles, {
    fields: [messages.receiver_id],
    references: [profiles.id],
    relationName: 'receiver',
  }),
  patient: one(patients, {
    fields: [messages.patient_id],
    references: [patients.id],
  }),
}))

export const documentsRelations = relations(documents, ({ one }) => ({
  nutritionist: one(nutritionists, {
    fields: [documents.nutritionist_id],
    references: [nutritionists.id],
  }),
  patient: one(patients, {
    fields: [documents.patient_id],
    references: [patients.id],
  }),
}))

export const educationalVideosRelations = relations(educationalVideos, ({ one, many }) => ({
  nutritionist: one(nutritionists, {
    fields: [educationalVideos.nutritionist_id],
    references: [nutritionists.id],
  }),
  patientVideos: many(patientVideos),
}))

export const patientVideosRelations = relations(patientVideos, ({ one }) => ({
  patient: one(patients, {
    fields: [patientVideos.patient_id],
    references: [patients.id],
  }),
  video: one(educationalVideos, {
    fields: [patientVideos.video_id],
    references: [educationalVideos.id],
  }),
}))

export const recommendedProductsRelations = relations(recommendedProducts, ({ one, many }) => ({
  nutritionist: one(nutritionists, {
    fields: [recommendedProducts.nutritionist_id],
    references: [nutritionists.id],
  }),
  patientProducts: many(patientProducts),
}))

export const patientProductsRelations = relations(patientProducts, ({ one }) => ({
  patient: one(patients, {
    fields: [patientProducts.patient_id],
    references: [patients.id],
  }),
  product: one(recommendedProducts, {
    fields: [patientProducts.product_id],
    references: [recommendedProducts.id],
  }),
}))

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(profiles, {
    fields: [auditLogs.actor_id],
    references: [profiles.id],
  }),
  nutritionist: one(nutritionists, {
    fields: [auditLogs.nutritionist_id],
    references: [nutritionists.id],
  }),
}))

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  nutritionist: one(nutritionists, {
    fields: [subscriptions.nutritionist_id],
    references: [nutritionists.id],
  }),
}))

export const patientGroupsRelations = relations(patientGroups, ({ one, many }) => ({
  nutritionist: one(nutritionists, {
    fields: [patientGroups.nutritionist_id],
    references: [nutritionists.id],
  }),
  members: many(patientGroupMembers),
  coordinators: many(nutritionistCoordinators),
}))

export const patientGroupMembersRelations = relations(patientGroupMembers, ({ one }) => ({
  group: one(patientGroups, {
    fields: [patientGroupMembers.group_id],
    references: [patientGroups.id],
  }),
  patient: one(patients, {
    fields: [patientGroupMembers.patient_id],
    references: [patients.id],
  }),
}))

export const nutritionistCoordinatorsRelations = relations(nutritionistCoordinators, ({ one }) => ({
  nutritionist: one(nutritionists, {
    fields: [nutritionistCoordinators.nutritionist_id],
    references: [nutritionists.id],
  }),
  coordinatorProfile: one(profiles, {
    fields: [nutritionistCoordinators.coordinator_profile_id],
    references: [profiles.id],
  }),
  group: one(patientGroups, {
    fields: [nutritionistCoordinators.group_id],
    references: [patientGroups.id],
  }),
}))

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert

export type Nutritionist = typeof nutritionists.$inferSelect
export type NewNutritionist = typeof nutritionists.$inferInsert

export type Patient = typeof patients.$inferSelect
export type NewPatient = typeof patients.$inferInsert

export type ClinicalRecord = typeof clinicalRecords.$inferSelect
export type NewClinicalRecord = typeof clinicalRecords.$inferInsert

export type Measurement = typeof measurements.$inferSelect
export type NewMeasurement = typeof measurements.$inferInsert

export type MealPlan = typeof mealPlans.$inferSelect
export type NewMealPlan = typeof mealPlans.$inferInsert

export type MealSlot = typeof mealSlots.$inferSelect
export type NewMealSlot = typeof mealSlots.$inferInsert

export type MealItem = typeof mealItems.$inferSelect
export type NewMealItem = typeof mealItems.$inferInsert

export type Recipe = typeof recipes.$inferSelect
export type NewRecipe = typeof recipes.$inferInsert

export type RecipeIngredient = typeof recipeIngredients.$inferSelect
export type NewRecipeIngredient = typeof recipeIngredients.$inferInsert

export type Appointment = typeof appointments.$inferSelect
export type NewAppointment = typeof appointments.$inferInsert

export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert

export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert

export type EducationalVideo = typeof educationalVideos.$inferSelect
export type NewEducationalVideo = typeof educationalVideos.$inferInsert

export type PatientVideo = typeof patientVideos.$inferSelect
export type NewPatientVideo = typeof patientVideos.$inferInsert

export type RecommendedProduct = typeof recommendedProducts.$inferSelect
export type NewRecommendedProduct = typeof recommendedProducts.$inferInsert

export type PatientProduct = typeof patientProducts.$inferSelect
export type NewPatientProduct = typeof patientProducts.$inferInsert

export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert

export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert

export type PatientGroup = typeof patientGroups.$inferSelect
export type NewPatientGroup = typeof patientGroups.$inferInsert

export type PatientGroupMember = typeof patientGroupMembers.$inferSelect
export type NewPatientGroupMember = typeof patientGroupMembers.$inferInsert

export type NutritionistCoordinator = typeof nutritionistCoordinators.$inferSelect
export type NewNutritionistCoordinator = typeof nutritionistCoordinators.$inferInsert
