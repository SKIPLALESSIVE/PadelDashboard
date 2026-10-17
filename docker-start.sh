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

# (Re)build seulement si l'image absente ou le code a changé
if ! docker image inspect "$NAME:latest" >/dev/null 2>&1; then
  echo "Construction de l'image…"
  docker build -t "$NAME:latest" .
elif [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
  echo "Code modifié depuis le dernier build — reconstruction…"
  docker build -t "$NAME:latest" .
fi

# Supprime un éventuel conteneur précédent au même nom
docker rm -f "$NAME" >/dev/null 2>&1 || true

docker run -d \
  --name "$NAME" \
  --restart unless-stopped \
  -p "$PORT:8080" \
  "$NAME:latest" >/dev/null

echo "PadelTrack est en ligne :  http://localhost:${PORT}"
