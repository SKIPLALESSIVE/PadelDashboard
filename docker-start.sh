#!/usr/bin/env bash
# Démarre PadelTrack dans Docker (build image si nécessaire).
# Usage : ./docker-start.sh [PORT]   (8080 par défaut)
set -euo pipefail

PORT="${1:-8080}"
NAME="padeltrack"

cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Erreur : le démon Docker n'est pas démarré." >&2
  exit 1
fi

# Rebuild systématique : avec le cache de build ça ne coûte rien si le code n'a
# pas changé (npm ci recache tant que package*.json est inchangé), et ça garantit
# que le conteneur sert toujours le code le plus récent — y compris si les
# changements ont été commités, ce que la détection par git status manquait.
echo "Construction de l'image…"
docker build -t "$NAME:latest" .

# Supprime un éventuel conteneur précédent au même nom
docker rm -f "$NAME" >/dev/null 2>&1 || true

docker run -d \
  --name "$NAME" \
  --restart unless-stopped \
  -p "$PORT:8080" \
  "$NAME:latest" >/dev/null

echo "PadelTrack est en ligne :  http://localhost:${PORT}"
