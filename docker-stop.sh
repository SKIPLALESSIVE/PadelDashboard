#!/usr/bin/env bash
# Arrête et supprime le conteneur PadelTrack.
# L'image est conservée par défaut (relance instantanée) ; ./docker-stop.sh --clean supprime aussi l'image.
set -euo pipefail

NAME="padeltrack"

if [[ "${1:-}" == "--clean" ]]; then
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  docker rmi "$NAME:latest" >/dev/null 2>&1 || true
  echo "Conteneur et image supprimés."
  exit 0
fi

if docker ps -a --format '{{.Names}}' | grep -qx "$NAME"; then
  docker rm -f "$NAME" >/dev/null
  echo "Conteneur $NAME arrêté et supprimé."
else
  echo "Aucun conteneur $NAME en cours (déjà à l'arrêt)."
fi
