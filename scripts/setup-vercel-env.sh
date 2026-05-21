#!/usr/bin/env bash
# setup-vercel-env.sh — Sube las variables de .env.local a Vercel
#
# Uso: bash scripts/setup-vercel-env.sh
# Requiere: vercel CLI instalado y proyecto linkeado (vercel link)
# Idempotente: usa `vercel env rm` antes de agregar para evitar duplicados

set -euo pipefail

ENV_FILE="${1:-.env.local}"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌  No se encontró $ENV_FILE"
  echo "   Crear .env.local con los valores reales antes de correr este script."
  exit 1
fi

echo "📦 Subiendo variables de $ENV_FILE a Vercel (production + preview)..."
echo ""

# Variables que NO subir a Vercel (solo locales)
SKIP_VARS=("DATABASE_URL_LOCAL")

while IFS= read -r line || [ -n "$line" ]; do
  # Saltear comentarios y líneas vacías
  [[ "$line" =~ ^#.*$ ]] && continue
  [[ -z "$line" ]] && continue

  KEY="${line%%=*}"
  VALUE="${line#*=}"

  # Saltear si está en la lista de skip
  skip=false
  for skip_var in "${SKIP_VARS[@]}"; do
    [[ "$KEY" == "$skip_var" ]] && skip=true && break
  done
  $skip && echo "  ⏭  Salteando $KEY" && continue

  # Eliminar si ya existe (idempotencia)
  vercel env rm "$KEY" production --yes 2>/dev/null || true
  vercel env rm "$KEY" preview    --yes 2>/dev/null || true

  # Agregar a production y preview
  printf '%s' "$VALUE" | vercel env add "$KEY" production < /dev/stdin 2>/dev/null || \
    echo "$VALUE" | vercel env add "$KEY" production
  printf '%s' "$VALUE" | vercel env add "$KEY" preview   < /dev/stdin 2>/dev/null || \
    echo "$VALUE" | vercel env add "$KEY" preview

  echo "  ✅  $KEY"
done < "$ENV_FILE"

echo ""
echo "✅ Variables subidas. Correr: vercel deploy --prod"
