/** Stockage local protégé : si le navigateur bloque localStorage (mode privé, quotas,
 *  préférence anti-consentement), l'app doit continuer à fonctionner sans mémorisation. */
export function storageGet(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null
  } catch {
    return null
  }
}

export function storageSet(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value)
  } catch {
    /* silencieux : perte d'agrément de préférences uniquement */
  }
}
