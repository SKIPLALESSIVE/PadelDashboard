import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:8080'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`[console.${m.type()}] ${m.text()}`)
})
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
const aside = await page.locator('aside').count()
const header = await page.locator('header').count()
const bodyText = (await page.locator('body').innerText()).slice(0, 400)
console.log('aside count:', aside, '| header count:', header)
console.log('--- texte visible (400 premiers caractères) ---')
console.log(bodyText)
console.log('--- erreurs console/page (', errors.length, ') ---')
errors.forEach((e) => console.log(e))
await browser.close()
