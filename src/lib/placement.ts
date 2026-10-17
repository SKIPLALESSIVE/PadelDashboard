/** Place normalisée au sein du tableau : place / nb_paires.
 *  Retourne null si la donnée est absente ou incohérente (place > paires, place < 1)
 *  afin qu'aucune statistique n'affiche un pourcentage absurde (> 100 %). */
export function placeRatio(place?: number | null, pairs?: number | null): number | null {
  if (!place || !pairs || pairs <= 0) return null
  if (place < 1 || place > pairs) return null
  return place / pairs
}

/** Indique si le couple place/paires saisi est incohérent (à signaler dans l'UI). */
export function isIncoherentPlace(place?: number | null, pairs?: number | null): boolean {
  return (!!place && !!pairs && (place > pairs || place < 1))
}
