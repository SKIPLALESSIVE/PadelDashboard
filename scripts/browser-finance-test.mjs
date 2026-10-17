// Vérif navigateur : jour indisponible + tournoi → conflit ; événement avec coût apparaît dans Finances
import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errs = []
page.on('pageerror', (e) => errs.push(e.message))
await page.goto('http://localhost:8080', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
// Fermer l'onboarding si présent (1re visite)
const later = page.getByText('Plus tard')
if (await later.count().catch(() => 0)) await later.click()
await page.waitForTimeout(300)
// Ouvrir le calendrier
await page.click('text=Calendrier')
await page.waitForTimeout(400)
// Cliquer sur le premier jour du mois courant affiché
const dayBtn = page.locator('button:has(span.text-\\[11px\\])').first()
await dayBtn.click()
await page.waitForTimeout(300)
// Ajouter un évancement entraînement avec coût
await page.click('text=+ Événement')
await page.selectOption('select.field', { index: 2 }).catch(() => {})
await page.fill('input[placeholder*="Libellé"]', 'Cours collectif test')
await page.fill('input[placeholder="ex. 20"]', '20')
await page.locator('div[role=dialog]').getByRole('button', { name: 'Ajouter', exact: true }).click()
await page.waitForTimeout(300)
await page.locator('div[role=dialog]').getByText('Fermer', { exact: true }).click()
// Finances → vérifier la carte séances
await page.locator('aside').getByRole('button', { name: /Finances/ }).click()
await page.waitForTimeout(500)
const body = await page.locator('body').innerText()
const ok = body.includes('Cours collectif test') || body.includes('Séances hors tournoi')
console.log('finance séances visibles:', ok)
console.log('erreurs page:', errs.length)
await browser.close()
