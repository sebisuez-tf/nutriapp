-- ─────────────────────────────────────────────────────────────────────────────
-- NutriApp — Initial Migration (regenerated from Drizzle schema)
-- Run: supabase db reset  OR  psql $DATABASE_URL -f this_file
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE role AS ENUM ('super_admin','nutritionist','patient','coordinator','support'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE plan_type AS ENUM ('basic','professional','premium','club'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE patient_sex AS ENUM ('male','female','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE dietary_pattern AS ENUM ('omnivore','vegetarian','vegan','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE meal_plan_status AS ENUM ('draft','active','inactive','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE appointment_status AS ENUM ('scheduled','confirmed','completed','cancelled','no_show'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE appointment_type AS ENUM ('initial','followup','online','remote'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE document_type AS ENUM ('meal_plan_pdf','anthropometric_report','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE subscription_status AS ENUM ('active','past_due','cancelled','trial'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE group_type AS ENUM ('club','team','institution','category'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role       role NOT NULL DEFAULT 'nutritionist',
  full_name  TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  phone      TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nutritionists (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id        UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  business_name     TEXT NOT NULL DEFAULT '',
  bio               TEXT,
  logo_url          TEXT,
  primary_color     TEXT NOT NULL DEFAULT '#16a34a',
  secondary_color   TEXT NOT NULL DEFAULT '#15803d',
  accent_color      TEXT NOT NULL DEFAULT '#4ade80',
  contact_email     TEXT,
  contact_phone     TEXT,
  website_url       TEXT,
  instagram_handle  TEXT,
  address           TEXT,
  city              TEXT,
  country           TEXT DEFAULT 'Argentina',
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  plan_type         plan_type NOT NULL DEFAULT 'basic',
  plan_expires_at   TIMESTAMPTZ,
  max_patients      INTEGER NOT NULL DEFAULT 20,
  onboarding_step   INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutritionist_id   UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  profile_id        UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  date_of_birth     DATE,
  sex               patient_sex,
  occupation        TEXT,
  city              TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  access_expires_at TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_records (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id            UUID NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
  nutritionist_id       UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  personal_history      TEXT,
  family_history        TEXT,
  pathologies           TEXT[],
  medications           TEXT,
  allergies             TEXT[],
  intolerances          TEXT[],
  eating_habits         TEXT,
  meal_frequency        INTEGER,
  water_intake_liters   NUMERIC(4,2),
  alcohol_consumption   TEXT,
  smoking_status        TEXT,
  sleep_hours           NUMERIC(4,1),
  stress_level          INTEGER,
  physical_activity     TEXT,
  main_objective        TEXT,
  secondary_objectives  TEXT[],
  food_preferences      TEXT,
  food_dislikes         TEXT,
  dietary_pattern       dietary_pattern,
  sport_history         TEXT,
  current_sport         TEXT,
  training_frequency    TEXT,
  competition_level     TEXT,
  consent_signed_at     TIMESTAMPTZ,
  consent_ip_address    TEXT,
  terms_accepted_at     TIMESTAMPTZ,
  privacy_accepted_at   TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS measurements (
  id                           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id                   UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  nutritionist_id              UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  measured_at                  DATE NOT NULL,
  weight_kg                    NUMERIC(5,2),
  height_cm                    NUMERIC(5,1),
  bmi                          NUMERIC(5,2),
  body_fat_percentage          NUMERIC(5,2),
  muscle_mass_kg               NUMERIC(5,2),
  bone_mass_kg                 NUMERIC(5,2),
  visceral_fat_level           INTEGER,
  total_body_water_percentage  NUMERIC(5,2),
  waist_circumference          NUMERIC(5,1),
  hip_circumference            NUMERIC(5,1),
  arm_circumference            NUMERIC(5,1),
  thigh_circumference          NUMERIC(5,1),
  calf_circumference           NUMERIC(5,1),
  chest_circumference          NUMERIC(5,1),
  triceps_skinfold             NUMERIC(5,1),
  subscapular_skinfold         NUMERIC(5,1),
  abdominal_skinfold           NUMERIC(5,1),
  suprailiac_skinfold          NUMERIC(5,1),
  thigh_skinfold               NUMERIC(5,1),
  metabolic_age                INTEGER,
  basal_metabolic_rate         INTEGER,
  notes                        TEXT,
  measurement_method           TEXT,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_plans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutritionist_id UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  patient_id      UUID REFERENCES patients(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  is_template     BOOLEAN NOT NULL DEFAULT FALSE,
  template_name   TEXT,
  status          meal_plan_status NOT NULL DEFAULT 'draft',
  total_calories  INTEGER,
  total_protein_g NUMERIC(6,2),
  total_carbs_g   NUMERIC(6,2),
  total_fat_g     NUMERIC(6,2),
  notes           TEXT,
  valid_from      DATE,
  valid_until     DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_slots (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  time_of_day  TIME,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  notes        TEXT
);

CREATE TABLE IF NOT EXISTS meal_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_slot_id UUID NOT NULL REFERENCES meal_slots(id) ON DELETE CASCADE,
  food_name    TEXT NOT NULL,
  quantity     NUMERIC(8,2),
  unit         TEXT,
  calories     NUMERIC(8,2),
  protein_g    NUMERIC(6,2),
  carbs_g      NUMERIC(6,2),
  fat_g        NUMERIC(6,2),
  is_optional  BOOLEAN NOT NULL DEFAULT FALSE,
  alternatives TEXT,
  notes        TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS recipes (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutritionist_id      UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  description          TEXT,
  instructions         TEXT,
  prep_time_minutes    INTEGER,
  cook_time_minutes    INTEGER,
  servings             INTEGER,
  calories_per_serving NUMERIC(7,2),
  protein_per_serving  NUMERIC(6,2),
  carbs_per_serving    NUMERIC(6,2),
  fat_per_serving      NUMERIC(6,2),
  image_url            TEXT,
  tags                 TEXT[],
  is_public            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id       UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity        NUMERIC(8,2),
  unit            TEXT,
  notes           TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS appointments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutritionist_id  UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status           appointment_status NOT NULL DEFAULT 'scheduled',
  type             appointment_type NOT NULL DEFAULT 'followup',
  notes            TEXT,
  reminder_sent    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutritionist_id UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutritionist_id    UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  patient_id         UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type               document_type NOT NULL,
  title              TEXT NOT NULL,
  file_url           TEXT NOT NULL,
  generated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_sent_to_patient BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS educational_videos (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutritionist_id         UUID REFERENCES nutritionists(id) ON DELETE SET NULL,
  title                   TEXT NOT NULL,
  description             TEXT,
  video_url               TEXT NOT NULL,
  thumbnail_url           TEXT,
  tags                    TEXT[],
  is_visible_to_patients  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_videos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  video_id    UUID NOT NULL REFERENCES educational_videos(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  watched_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS recommended_products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutritionist_id UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  brand           TEXT,
  description     TEXT,
  image_url       TEXT,
  category        TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES recommended_products(id) ON DELETE CASCADE,
  notes       TEXT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nutritionist_id UUID REFERENCES nutritionists(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       TEXT,
  old_values      JSONB,
  new_values      JSONB,
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutritionist_id        UUID NOT NULL UNIQUE REFERENCES nutritionists(id) ON DELETE CASCADE,
  plan_type              plan_type NOT NULL,
  status                 subscription_status NOT NULL DEFAULT 'trial',
  stripe_subscription_id TEXT,
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_groups (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutritionist_id UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  type            group_type NOT NULL DEFAULT 'category',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_group_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id   UUID NOT NULL REFERENCES patient_groups(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, patient_id)
);

CREATE TABLE IF NOT EXISTS nutritionist_coordinators (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutritionist_id        UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  coordinator_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id               UUID REFERENCES patient_groups(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(nutritionist_id, coordinator_profile_id)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS nutritionists_profile_id_idx ON nutritionists(profile_id);
CREATE INDEX IF NOT EXISTS patients_nutritionist_id_idx ON patients(nutritionist_id);
CREATE INDEX IF NOT EXISTS patients_profile_id_idx ON patients(profile_id);
CREATE INDEX IF NOT EXISTS patients_created_at_idx ON patients(created_at);
CREATE INDEX IF NOT EXISTS clinical_records_patient_id_idx ON clinical_records(patient_id);
CREATE INDEX IF NOT EXISTS clinical_records_nutritionist_id_idx ON clinical_records(nutritionist_id);
CREATE INDEX IF NOT EXISTS measurements_patient_id_idx ON measurements(patient_id);
CREATE INDEX IF NOT EXISTS measurements_nutritionist_id_idx ON measurements(nutritionist_id);
CREATE INDEX IF NOT EXISTS measurements_measured_at_idx ON measurements(measured_at);
CREATE INDEX IF NOT EXISTS meal_plans_nutritionist_id_idx ON meal_plans(nutritionist_id);
CREATE INDEX IF NOT EXISTS meal_plans_patient_id_idx ON meal_plans(patient_id);
CREATE INDEX IF NOT EXISTS meal_plans_status_idx ON meal_plans(status);
CREATE INDEX IF NOT EXISTS meal_slots_meal_plan_id_idx ON meal_slots(meal_plan_id);
CREATE INDEX IF NOT EXISTS meal_items_meal_slot_id_idx ON meal_items(meal_slot_id);
CREATE INDEX IF NOT EXISTS recipes_nutritionist_id_idx ON recipes(nutritionist_id);
CREATE INDEX IF NOT EXISTS recipe_ingredients_recipe_id_idx ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS appointments_nutritionist_id_idx ON appointments(nutritionist_id);
CREATE INDEX IF NOT EXISTS appointments_patient_id_idx ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS appointments_scheduled_at_idx ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS messages_nutritionist_id_idx ON messages(nutritionist_id);
CREATE INDEX IF NOT EXISTS messages_patient_id_idx ON messages(patient_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);
CREATE INDEX IF NOT EXISTS documents_nutritionist_id_idx ON documents(nutritionist_id);
CREATE INDEX IF NOT EXISTS documents_patient_id_idx ON documents(patient_id);
CREATE INDEX IF NOT EXISTS educational_videos_nutritionist_id_idx ON educational_videos(nutritionist_id);
CREATE INDEX IF NOT EXISTS patient_videos_patient_id_idx ON patient_videos(patient_id);
CREATE INDEX IF NOT EXISTS patient_videos_video_id_idx ON patient_videos(video_id);
CREATE INDEX IF NOT EXISTS recommended_products_nutritionist_id_idx ON recommended_products(nutritionist_id);
CREATE INDEX IF NOT EXISTS patient_products_patient_id_idx ON patient_products(patient_id);
CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_nutritionist_id_idx ON audit_logs(nutritionist_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS subscriptions_nutritionist_id_idx ON subscriptions(nutritionist_id);
CREATE INDEX IF NOT EXISTS patient_groups_nutritionist_id_idx ON patient_groups(nutritionist_id);
CREATE INDEX IF NOT EXISTS patient_group_members_group_id_idx ON patient_group_members(group_id);
CREATE INDEX IF NOT EXISTS patient_group_members_patient_id_idx ON patient_group_members(patient_id);
CREATE INDEX IF NOT EXISTS nutritionist_coordinators_nutritionist_id_idx ON nutritionist_coordinators(nutritionist_id);
CREATE INDEX IF NOT EXISTS nutritionist_coordinators_coordinator_profile_id_idx ON nutritionist_coordinators(coordinator_profile_id);

-- ─── Trigger: auto-create profile on Supabase signup ─────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role role;
BEGIN
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

-- ─── RLS ─────────────────────────────────────────────────────────────────────

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

-- Helper functions

CREATE OR REPLACE FUNCTION get_my_role() RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT role::TEXT FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_my_nutritionist_id() RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT id FROM public.nutritionists WHERE profile_id = auth.uid();
$$;

-- Profiles
CREATE POLICY "profiles_own"   ON profiles FOR ALL USING (id = auth.uid());
CREATE POLICY "profiles_admin" ON profiles FOR ALL USING (get_my_role() = 'super_admin');

-- Nutritionists
CREATE POLICY "nutritionists_own"   ON nutritionists FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "nutritionists_admin" ON nutritionists FOR ALL USING (get_my_role() = 'super_admin');

-- Patients
CREATE POLICY "patients_nutritionist" ON patients FOR ALL    USING (nutritionist_id = get_my_nutritionist_id());
CREATE POLICY "patients_self"         ON patients FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "patients_admin"        ON patients FOR ALL    USING (get_my_role() = 'super_admin');

-- Clinical Records
CREATE POLICY "clinical_nutritionist" ON clinical_records FOR ALL USING (
  nutritionist_id = get_my_nutritionist_id()
);
CREATE POLICY "clinical_admin" ON clinical_records FOR ALL USING (get_my_role() = 'super_admin');

-- Measurements
CREATE POLICY "measurements_nutritionist"  ON measurements FOR ALL    USING (nutritionist_id = get_my_nutritionist_id());
CREATE POLICY "measurements_patient_self"  ON measurements FOR SELECT USING (
  patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
);
CREATE POLICY "measurements_admin"         ON measurements FOR ALL    USING (get_my_role() = 'super_admin');

-- Meal Plans
CREATE POLICY "meal_plans_nutritionist"  ON meal_plans FOR ALL    USING (nutritionist_id = get_my_nutritionist_id());
CREATE POLICY "meal_plans_patient_self"  ON meal_plans FOR SELECT USING (
  patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()) AND status = 'active'
);
CREATE POLICY "meal_plans_admin"         ON meal_plans FOR ALL    USING (get_my_role() = 'super_admin');

-- Meal Slots
CREATE POLICY "meal_slots_nutritionist" ON meal_slots FOR ALL USING (
  meal_plan_id IN (SELECT id FROM meal_plans WHERE nutritionist_id = get_my_nutritionist_id())
);
CREATE POLICY "meal_slots_patient_self" ON meal_slots FOR SELECT USING (
  meal_plan_id IN (
    SELECT id FROM meal_plans
    WHERE patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()) AND status = 'active'
  )
);

-- Meal Items
CREATE POLICY "meal_items_nutritionist" ON meal_items FOR ALL USING (
  meal_slot_id IN (
    SELECT ms.id FROM meal_slots ms
    JOIN meal_plans mp ON ms.meal_plan_id = mp.id
    WHERE mp.nutritionist_id = get_my_nutritionist_id()
  )
);
CREATE POLICY "meal_items_patient_self" ON meal_items FOR SELECT USING (
  meal_slot_id IN (
    SELECT ms.id FROM meal_slots ms
    JOIN meal_plans mp ON ms.meal_plan_id = mp.id
    WHERE mp.patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()) AND mp.status = 'active'
  )
);

-- Recipes
CREATE POLICY "recipes_nutritionist" ON recipes FOR ALL    USING (nutritionist_id = get_my_nutritionist_id());
CREATE POLICY "recipes_public"       ON recipes FOR SELECT USING (is_public = TRUE);

-- Recipe Ingredients
CREATE POLICY "recipe_ingredients_nutritionist" ON recipe_ingredients FOR ALL USING (
  recipe_id IN (SELECT id FROM recipes WHERE nutritionist_id = get_my_nutritionist_id())
);

-- Appointments
CREATE POLICY "appointments_nutritionist"  ON appointments FOR ALL    USING (nutritionist_id = get_my_nutritionist_id());
CREATE POLICY "appointments_patient_self"  ON appointments FOR SELECT USING (
  patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
);
CREATE POLICY "appointments_admin"         ON appointments FOR ALL    USING (get_my_role() = 'super_admin');

-- Messages
CREATE POLICY "messages_participants"  ON messages FOR ALL USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "messages_nutritionist"  ON messages FOR ALL USING (nutritionist_id = get_my_nutritionist_id());
CREATE POLICY "messages_admin"         ON messages FOR ALL USING (get_my_role() = 'super_admin');

-- Documents
CREATE POLICY "documents_nutritionist"  ON documents FOR ALL    USING (nutritionist_id = get_my_nutritionist_id());
CREATE POLICY "documents_patient_self"  ON documents FOR SELECT USING (
  patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()) AND is_sent_to_patient = TRUE
);
CREATE POLICY "documents_admin"         ON documents FOR ALL    USING (get_my_role() = 'super_admin');

-- Educational Videos
CREATE POLICY "videos_nutritionist" ON educational_videos FOR ALL    USING (nutritionist_id = get_my_nutritionist_id());
CREATE POLICY "videos_patient"      ON educational_videos FOR SELECT USING (is_visible_to_patients = TRUE);

-- Patient Videos
CREATE POLICY "patient_videos_nutritionist" ON patient_videos FOR ALL USING (
  patient_id IN (SELECT id FROM patients WHERE nutritionist_id = get_my_nutritionist_id())
);
CREATE POLICY "patient_videos_patient_self" ON patient_videos FOR SELECT USING (
  patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
);

-- Recommended Products
CREATE POLICY "products_nutritionist" ON recommended_products FOR ALL USING (nutritionist_id = get_my_nutritionist_id());

-- Patient Products
CREATE POLICY "patient_products_nutritionist" ON patient_products FOR ALL USING (
  patient_id IN (SELECT id FROM patients WHERE nutritionist_id = get_my_nutritionist_id())
);
CREATE POLICY "patient_products_patient_self" ON patient_products FOR SELECT USING (
  patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
);

-- Audit Logs
CREATE POLICY "audit_logs_admin"            ON audit_logs FOR ALL    USING (get_my_role() = 'super_admin');
CREATE POLICY "audit_logs_own_nutritionist" ON audit_logs FOR SELECT USING (nutritionist_id = get_my_nutritionist_id());

-- Subscriptions
CREATE POLICY "subscriptions_own"   ON subscriptions FOR SELECT USING (nutritionist_id = get_my_nutritionist_id());
CREATE POLICY "subscriptions_admin" ON subscriptions FOR ALL    USING (get_my_role() = 'super_admin');

-- Patient Groups
CREATE POLICY "groups_nutritionist" ON patient_groups FOR ALL USING (nutritionist_id = get_my_nutritionist_id());

-- Group Members
CREATE POLICY "group_members_nutritionist" ON patient_group_members FOR ALL USING (
  group_id IN (SELECT id FROM patient_groups WHERE nutritionist_id = get_my_nutritionist_id())
);

-- Nutritionist Coordinators
CREATE POLICY "coordinators_nutritionist" ON nutritionist_coordinators FOR ALL USING (
  nutritionist_id = get_my_nutritionist_id()
);

-- ─── Supabase Realtime ────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ─── Storage bucket (create via Supabase dashboard or CLI) ───────────────────
-- Bucket: patient-pdfs (private)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('patient-pdfs', 'patient-pdfs', false)
-- ON CONFLICT DO NOTHING;
