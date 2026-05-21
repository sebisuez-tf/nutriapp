-- ─────────────────────────────────────────────────────────────────────────────
-- NutriApp — Initial Migration
-- Run after: supabase db reset OR psql -f this file
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE role AS ENUM ('super_admin','nutritionist','patient','coordinator','support');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM ('basic','professional','premium','club');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE patient_sex AS ENUM ('male','female','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE dietary_pattern AS ENUM ('omnivore','vegetarian','vegan','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE meal_plan_status AS ENUM ('draft','active','inactive','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('scheduled','confirmed','completed','cancelled','no_show');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_type AS ENUM ('initial','followup','online','remote');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM ('meal_plan_pdf','anthropometric_report','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active','past_due','cancelled','trial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE group_type AS ENUM ('club','team','institution','category');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role        role NOT NULL DEFAULT 'nutritionist',
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nutritionists (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type           plan_type NOT NULL DEFAULT 'basic',
  is_active           BOOLEAN NOT NULL DEFAULT FALSE,
  business_name       TEXT,
  bio                 TEXT,
  logo_url            TEXT,
  primary_color       TEXT DEFAULT '#16a34a',
  secondary_color     TEXT DEFAULT '#15803d',
  accent_color        TEXT DEFAULT '#dcfce7',
  contact_email       TEXT,
  contact_phone       TEXT,
  website_url         TEXT,
  instagram_handle    TEXT,
  address             TEXT,
  city                TEXT,
  country             TEXT DEFAULT 'Argentina',
  onboarding_done     BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_status subscription_status DEFAULT 'trial',
  stripe_customer_id  TEXT,
  stripe_subscription_id TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id     UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  profile_id          UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  email               TEXT,
  phone               TEXT,
  date_of_birth       DATE,
  sex                 patient_sex,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  access_expires_at   TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_records (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id                  UUID NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
  personal_history            TEXT,
  family_history              TEXT,
  medications                 TEXT,
  eating_habits               TEXT,
  meal_frequency              INTEGER,
  water_intake_liters         NUMERIC(4,2),
  alcohol_consumption         TEXT,
  smoking_status              TEXT,
  sleep_hours                 NUMERIC(4,2),
  stress_level                INTEGER,
  physical_activity           TEXT,
  main_objective              TEXT,
  food_preferences            TEXT,
  food_dislikes               TEXT,
  dietary_pattern             dietary_pattern,
  sport_history               TEXT,
  current_sport               TEXT,
  training_frequency          TEXT,
  competition_level           TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS measurements (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id                  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  nutritionist_id             UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  measured_at                 DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg                   NUMERIC(6,2),
  height_cm                   NUMERIC(5,2),
  bmi                         NUMERIC(5,2),
  bmi_category                TEXT,
  body_fat_percentage         NUMERIC(5,2),
  muscle_mass_kg              NUMERIC(6,2),
  bone_mass_kg                NUMERIC(5,2),
  visceral_fat_level          INTEGER,
  total_body_water_percentage NUMERIC(5,2),
  metabolic_age               INTEGER,
  basal_metabolic_rate        INTEGER,
  waist_circumference         NUMERIC(5,2),
  hip_circumference           NUMERIC(5,2),
  arm_circumference           NUMERIC(5,2),
  thigh_circumference         NUMERIC(5,2),
  calf_circumference          NUMERIC(5,2),
  chest_circumference         NUMERIC(5,2),
  measurement_method          TEXT,
  notes                       TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  patient_id      UUID REFERENCES patients(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  status          meal_plan_status NOT NULL DEFAULT 'draft',
  is_template     BOOLEAN NOT NULL DEFAULT FALSE,
  template_name   TEXT,
  total_calories  INTEGER,
  total_protein_g NUMERIC(8,2),
  total_carbs_g   NUMERIC(8,2),
  total_fat_g     NUMERIC(8,2),
  valid_from      DATE,
  valid_until     DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  time_of_day  TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_slot_id   UUID NOT NULL REFERENCES meal_slots(id) ON DELETE CASCADE,
  food_name      TEXT NOT NULL,
  quantity       NUMERIC(8,2),
  unit           TEXT,
  calories       NUMERIC(8,2),
  protein_g      NUMERIC(8,2),
  carbs_g        NUMERIC(8,2),
  fat_g          NUMERIC(8,2),
  is_optional    BOOLEAN NOT NULL DEFAULT FALSE,
  alternatives   TEXT,
  notes          TEXT,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  preparation_time_minutes INTEGER,
  servings        INTEGER DEFAULT 1,
  calories_per_serving NUMERIC(8,2),
  protein_g       NUMERIC(8,2),
  carbs_g         NUMERIC(8,2),
  fat_g           NUMERIC(8,2),
  instructions    TEXT,
  tags            TEXT[],
  image_url       TEXT,
  is_public       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id   UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  food_name   TEXT NOT NULL,
  quantity    NUMERIC(8,2),
  unit        TEXT,
  notes       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  type            appointment_type NOT NULL DEFAULT 'followup',
  status          appointment_status NOT NULL DEFAULT 'scheduled',
  notes           TEXT,
  reminder_sent   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id),
  receiver_id     UUID NOT NULL REFERENCES profiles(id),
  content         TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type            document_type NOT NULL,
  title           TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  file_size_bytes INTEGER,
  sent_to_patient BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS educational_videos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  video_url       TEXT NOT NULL,
  thumbnail_url   TEXT,
  tags            TEXT[],
  is_public       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_videos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  video_id    UUID NOT NULL REFERENCES educational_videos(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  viewed_at   TIMESTAMPTZ,
  UNIQUE(patient_id, video_id)
);

CREATE TABLE IF NOT EXISTS recommended_products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  url             TEXT,
  image_url       TEXT,
  category        TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES recommended_products(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes       TEXT,
  UNIQUE(patient_id, product_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        UUID NOT NULL REFERENCES profiles(id),
  nutritionist_id UUID REFERENCES nutritionists(id),
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id         UUID NOT NULL UNIQUE REFERENCES nutritionists(id) ON DELETE CASCADE,
  stripe_subscription_id  TEXT UNIQUE,
  status                  subscription_status NOT NULL DEFAULT 'trial',
  plan_type               plan_type NOT NULL DEFAULT 'basic',
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  type            group_type NOT NULL DEFAULT 'category',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_group_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES patient_groups(id) ON DELETE CASCADE,
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, patient_id)
);

CREATE TABLE IF NOT EXISTS nutritionist_coordinators (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id         UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  coordinator_profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id                UUID REFERENCES patient_groups(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(nutritionist_id, coordinator_profile_id)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_patients_nutritionist ON patients(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_patients_profile ON patients(profile_id);
CREATE INDEX IF NOT EXISTS idx_measurements_patient ON measurements(patient_id);
CREATE INDEX IF NOT EXISTS idx_measurements_nutritionist ON measurements(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_nutritionist ON meal_plans(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_patient ON meal_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_meal_slots_plan ON meal_slots(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_items_slot ON meal_items(meal_slot_id);
CREATE INDEX IF NOT EXISTS idx_appointments_nutritionist ON appointments(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_messages_patient ON messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_nutritionist ON audit_logs(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON patient_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_patient ON patient_group_members(patient_id);

-- ─── Trigger: auto-create profile on signup ──────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role role;
BEGIN
  -- Determine role from metadata
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::role,
    'nutritionist'
  );

  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- Auto-create nutritionist record for nutritionist role
  IF user_role = 'nutritionist' THEN
    INSERT INTO public.nutritionists (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── RLS Policies ────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutritionists ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommended_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutritionist_coordinators ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role::TEXT FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper function: get current user's nutritionist id
CREATE OR REPLACE FUNCTION get_my_nutritionist_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.nutritionists WHERE profile_id = auth.uid();
$$;

-- Helper function: get patient's nutritionist id
CREATE OR REPLACE FUNCTION get_patient_nutritionist_id(patient_uuid UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT nutritionist_id FROM public.patients WHERE id = patient_uuid;
$$;

-- ── Profiles ─────────────────────────────────────────────────────────────────

CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (id = auth.uid());

CREATE POLICY "profiles_admin" ON profiles
  FOR ALL USING (get_my_role() = 'super_admin');

-- ── Nutritionists ─────────────────────────────────────────────────────────────

CREATE POLICY "nutritionists_own" ON nutritionists
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "nutritionists_admin" ON nutritionists
  FOR ALL USING (get_my_role() = 'super_admin');

-- ── Patients ──────────────────────────────────────────────────────────────────

CREATE POLICY "patients_nutritionist" ON patients
  FOR ALL USING (nutritionist_id = get_my_nutritionist_id());

CREATE POLICY "patients_self" ON patients
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "patients_admin" ON patients
  FOR ALL USING (get_my_role() = 'super_admin');

-- ── Clinical Records ──────────────────────────────────────────────────────────

CREATE POLICY "clinical_records_nutritionist" ON clinical_records
  FOR ALL USING (
    get_patient_nutritionist_id(patient_id) = get_my_nutritionist_id()
  );

CREATE POLICY "clinical_records_admin" ON clinical_records
  FOR ALL USING (get_my_role() = 'super_admin');

-- ── Measurements ──────────────────────────────────────────────────────────────

CREATE POLICY "measurements_nutritionist" ON measurements
  FOR ALL USING (nutritionist_id = get_my_nutritionist_id());

CREATE POLICY "measurements_patient_self" ON measurements
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
  );

CREATE POLICY "measurements_admin" ON measurements
  FOR ALL USING (get_my_role() = 'super_admin');

-- ── Meal Plans ────────────────────────────────────────────────────────────────

CREATE POLICY "meal_plans_nutritionist" ON meal_plans
  FOR ALL USING (nutritionist_id = get_my_nutritionist_id());

CREATE POLICY "meal_plans_patient_self" ON meal_plans
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
    AND status = 'active'
  );

CREATE POLICY "meal_plans_admin" ON meal_plans
  FOR ALL USING (get_my_role() = 'super_admin');

-- ── Meal Slots ────────────────────────────────────────────────────────────────

CREATE POLICY "meal_slots_nutritionist" ON meal_slots
  FOR ALL USING (
    meal_plan_id IN (
      SELECT id FROM meal_plans WHERE nutritionist_id = get_my_nutritionist_id()
    )
  );

CREATE POLICY "meal_slots_patient_self" ON meal_slots
  FOR SELECT USING (
    meal_plan_id IN (
      SELECT id FROM meal_plans
      WHERE patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
        AND status = 'active'
    )
  );

-- ── Meal Items ────────────────────────────────────────────────────────────────

CREATE POLICY "meal_items_nutritionist" ON meal_items
  FOR ALL USING (
    meal_slot_id IN (
      SELECT ms.id FROM meal_slots ms
      JOIN meal_plans mp ON ms.meal_plan_id = mp.id
      WHERE mp.nutritionist_id = get_my_nutritionist_id()
    )
  );

CREATE POLICY "meal_items_patient_self" ON meal_items
  FOR SELECT USING (
    meal_slot_id IN (
      SELECT ms.id FROM meal_slots ms
      JOIN meal_plans mp ON ms.meal_plan_id = mp.id
      WHERE mp.patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
        AND mp.status = 'active'
    )
  );

-- ── Appointments ─────────────────────────────────────────────────────────────

CREATE POLICY "appointments_nutritionist" ON appointments
  FOR ALL USING (nutritionist_id = get_my_nutritionist_id());

CREATE POLICY "appointments_patient_self" ON appointments
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
  );

CREATE POLICY "appointments_admin" ON appointments
  FOR ALL USING (get_my_role() = 'super_admin');

-- ── Messages ──────────────────────────────────────────────────────────────────

CREATE POLICY "messages_participants" ON messages
  FOR ALL USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

CREATE POLICY "messages_nutritionist" ON messages
  FOR ALL USING (nutritionist_id = get_my_nutritionist_id());

CREATE POLICY "messages_admin" ON messages
  FOR ALL USING (get_my_role() = 'super_admin');

-- ── Documents ─────────────────────────────────────────────────────────────────

CREATE POLICY "documents_nutritionist" ON documents
  FOR ALL USING (nutritionist_id = get_my_nutritionist_id());

CREATE POLICY "documents_patient_self" ON documents
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
    AND sent_to_patient = TRUE
  );

CREATE POLICY "documents_admin" ON documents
  FOR ALL USING (get_my_role() = 'super_admin');

-- ── Recipes ───────────────────────────────────────────────────────────────────

CREATE POLICY "recipes_nutritionist" ON recipes
  FOR ALL USING (nutritionist_id = get_my_nutritionist_id());

CREATE POLICY "recipes_public" ON recipes
  FOR SELECT USING (is_public = TRUE);

-- ── Recipe Ingredients ────────────────────────────────────────────────────────

CREATE POLICY "recipe_ingredients_nutritionist" ON recipe_ingredients
  FOR ALL USING (
    recipe_id IN (SELECT id FROM recipes WHERE nutritionist_id = get_my_nutritionist_id())
  );

-- ── Patient Groups ────────────────────────────────────────────────────────────

CREATE POLICY "groups_nutritionist" ON patient_groups
  FOR ALL USING (nutritionist_id = get_my_nutritionist_id());

CREATE POLICY "groups_coordinator" ON patient_groups
  FOR SELECT USING (
    id IN (
      SELECT group_id FROM nutritionist_coordinators
      WHERE coordinator_profile_id = auth.uid()
    )
  );

-- ── Group Members ─────────────────────────────────────────────────────────────

CREATE POLICY "group_members_nutritionist" ON patient_group_members
  FOR ALL USING (
    group_id IN (SELECT id FROM patient_groups WHERE nutritionist_id = get_my_nutritionist_id())
  );

-- ── Audit Logs ────────────────────────────────────────────────────────────────

CREATE POLICY "audit_logs_admin" ON audit_logs
  FOR ALL USING (get_my_role() = 'super_admin');

CREATE POLICY "audit_logs_own_nutritionist" ON audit_logs
  FOR SELECT USING (nutritionist_id = get_my_nutritionist_id());

-- ── Subscriptions ─────────────────────────────────────────────────────────────

CREATE POLICY "subscriptions_own" ON subscriptions
  FOR SELECT USING (nutritionist_id = get_my_nutritionist_id());

CREATE POLICY "subscriptions_admin" ON subscriptions
  FOR ALL USING (get_my_role() = 'super_admin');

-- ─── Realtime: enable for messages ───────────────────────────────────────────

-- Allow realtime replication for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
