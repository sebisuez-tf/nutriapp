# DEMO_GUIDE.md — NutriApp

Guía paso a paso para preparar la demo.

---

## Credenciales de usuarios demo

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Nutricionista (demo principal) | `annette@nutriapp.demo` | `NutriDemo2026!` |
| Nutricionista | `carlos.mendoza@nutriapp.demo` | `NutriDemo2026!` |
| Nutricionista | `lucia.fernandez@nutriapp.demo` | `NutriDemo2026!` |
| Super Admin | `admin@nutriapp.demo` | `NutriDemo2026!` |

---

## Paso 1 — Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → "New project"
2. Nombre: `nutriapp-demo`
3. Región: `South America (São Paulo)` para menor latencia AR
4. Anotar la contraseña del proyecto (la necesitás para el DATABASE_URL)

---

## Paso 2 — Crear el bucket de Storage

En el dashboard de Supabase:
1. Storage → "New bucket"
2. Nombre: `patient-pdfs`
3. **Public**: OFF (privado)
4. "Create bucket"

---

## Paso 3 — Correr la migración

En Supabase → SQL Editor → "New query":

```sql
-- Pegar el contenido completo de:
-- supabase/migrations/0001_initial.sql
```

O con la CLI de Supabase:
```bash
supabase db reset --linked
# o si tenés la CLI conectada:
supabase db push
```

---

## Paso 4 — Configurar variables de entorno localmente

Crear `.env.local` en la raíz del proyecto:

```bash
cp .env.example .env.local
```

Completar con los valores reales de Supabase:
- `NEXT_PUBLIC_SUPABASE_URL` → Supabase → Settings → API → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Settings → API → anon public
- `SUPABASE_SERVICE_ROLE_KEY` → Settings → API → service_role (¡mantener en secreto!)
- `DATABASE_URL` → Settings → Database → Connection string → Transaction pooler → URI

---

## Paso 5 — Correr el seed

```bash
npx tsx scripts/seed.ts
```

El seed es **idempotente**: se puede correr varias veces sin duplicar datos.

Qué crea el seed:
- 3 nutricionistas con perfiles completos
- 1 super admin
- 7 pacientes con datos reales argentinos
- Historia clínica de Valentina
- 5 mediciones mensuales con progreso real (Valentina y Martín)
- Plan alimentario activo con 5 comidas típicas argentinas
- Plan de alto rendimiento para nadadora
- 5 turnos (3 próximos + 2 completados)
- 2 grupos de pacientes

---

## Paso 6 — Deploy a Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login (abre el browser)
vercel login

# Linkear proyecto
vercel link
# → Scope: tu cuenta
# → Create new project: Yes
# → Name: nutriapp-demo

# Subir env vars desde .env.local
bash scripts/setup-vercel-env.sh

# Deploy
vercel deploy --prod
```

---

## Flujo sugerido para la demo (15 min)

### Acto 1 — Vista del nutricionista (login como Annette)

1. **Login** → `annette@nutriapp.demo` / `NutriDemo2026!`
2. **Dashboard** → mostrar métricas: 4 pacientes, próximos turnos, evolución de pacientes
3. **Ficha de Valentina Gómez** → navegar a Pacientes → Valentina
   - Tab "Evolución": gráfico de peso (78.4 → 72.1 kg en 5 meses — 6.3 kg bajados)
   - Tab "Mediciones": tabla completa con IMC, % grasa, masa muscular
   - Tab "Plan": ver el "Plan Reducción Mayo-Junio 2026" activo
4. **Editor de plan** → Planes → "Plan Reducción Mayo-Junio 2026"
   - Mostrar el plan con 5 comidas: Desayuno, Media Mañana, Almuerzo, Merienda, Cena
   - Mostrar items típicos: mate, milanesa de pollo, ñoquis del jueves
   - Demo de drag & drop de items
5. **Generar PDF** → en el plan, botón "Generar PDF" → ver cómo se crea y aparece en Documentos
6. **Turnos** → Agenda → mostrar los próximos turnos y los completados

### Acto 2 — Vista del paciente

7. **Cerrar sesión** → Login como paciente (si creaste un usuario paciente)
   - O mostrar el portal paciente directamente desde `/patient/dashboard`

### Acto 3 — Billing / Admin (opcional)

8. **Settings → Billing** → mostrar los planes disponibles
9. **Login como Admin** → `admin@nutriapp.demo` → ver panel de nutricionistas

---

## Notas para la demo

- Las mediciones de **Valentina** muestran progreso consistente (6.3 kg en 5 meses)
- El plan tiene **ñoquis del jueves** en la cena (detalle argentino que genera reacción)
- Los **mates** aparecen en varios momentos del plan
- El **Plan Asado** está como template — good for a laugh durante la demo
- Stripe: en modo demo/test no procesa pagos reales. Los botones de upgrade aparecen pero si Stripe no está configurado muestran error graceful.

---

## Troubleshooting

**El seed falla con "connection refused"**
→ Verificar que `DATABASE_URL` usa el Transaction Pooler (port 6543), no el Direct (port 5432)

**"RLS policy violation"**
→ El seed usa SERVICE_ROLE_KEY que bypasea RLS. Si sigue fallando, verificar que la migración corrió correctamente.

**Imágenes de PDF sin logo**
→ Normal — el seed no configura logos. Para la demo, el PDF se genera igual con el nombre del negocio.

**Stripe muestra error en billing**
→ Esperado sin credenciales reales. Para la demo enfocarse en el flujo nutricional, no en billing.
