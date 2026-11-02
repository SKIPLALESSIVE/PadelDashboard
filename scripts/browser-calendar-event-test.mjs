import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:8080'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`)
})

await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

// Fermer l'onboarding si présent
await page.locator('button:has-text("Plus tard")').first().click({ timeout: 3000 }).catch(() => {})
await page.waitForTimeout(300)

// Onglet Calendrier
await page.locator('button:has-text("Calendrier"), a:has-text("Calendrier")').first().click()
await page.waitForTimeout(400)

// Revenir au mois courant
await page.locator('button:has-text("Aujourd")').first().click().catch(() => {})
await page.waitForTimeout(400)

const now = new Date()
const dayNum = String(now.getDate())
const monthLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
console.log('date de test :', dayNum, monthLabel)

// Cliquer la cellule du jour (button dont le texte commence par le n° du jour)
const cell = page.locator('button').filter({ hasText: new RegExp(`^${dayNum}\\b`) }).locator('visible=true').first()
await cell.click()
await page.waitForTimeout(300)

// Ajouter un événement « cours »
await page.locator('button:has-text("+ Événement")').first().click()
await page.waitForTimeout(200)
await page.locator('select').first().selectOption('cours')
await page.locator('input[placeholder*="Libellé"]').fill('cours collectif [TEST]')
await page.locator('button:has-text("Ajouter")').last().click()
await page.waitForTimeout(400)

// Vérifier dans la modale
const modalText = (await page.locator('body').innerText())
const seenInModal = modalText.includes('cours collectif [TEST]')
console.log('visible dans la modale du jour :', seenInModal)

// Fermer la modale et vérifier la cellule
await page.locator('button:has-text("Fermer")').last().click()
await page.waitForTimeout(500)
const after = await cell.innerText()
console.log('contenu de la cellule après fermeture :', JSON.stringify(after.trim()))
const visibleInCell = after.includes('🎓')
console.log('emoji cours visible sur la cellule :', visibleInCell)

console.log('--- erreurs console/page (', errors.length, ') ---')
errors.forEach((e) => console.log(e))
await browser.close()

const ok = seenInModal && visibleInCell && errors.length === 0
console.log(ok ? '✅ TEST OK' : '❌ TEST ÉCHOUÉ')
process.exit(ok ? 0 : 1)
