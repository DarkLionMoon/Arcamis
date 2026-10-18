/* ════════════════════════════════════════════════════════════════
   Compatibilità con i contenuti reali

   I modelli non vivono in un mondo a parte: devono poter importare e
   ricompilare i file già pubblicati senza cambiare le forme che
   notion-nav.js riconosce (H1 per scheda, `---` come separatore,
   immagini con ritaglio, righe `- **Etichetta:**`).

   Niente conteggi fissi: il test resta valido quando il contenuto
   cresce, ma fallisce se l'import smette di riconoscere le schede.
   ════════════════════════════════════════════════════════════════ */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { getTemplate } from './index'
import { compileTemplate } from './compile'
import { seedFromMarkdown } from './seed'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..')

function content(key: string): string {
  const file = path.join(repoRoot, 'content/pages', key + '.json')
  return (JSON.parse(fs.readFileSync(file, 'utf8')) as { content: string }).content
}

const cards = (markdown: string): string[] =>
  markdown.split(/\n[ \t]*---[ \t]*\n/).filter((block) => /^#{1}\s+/m.test(block))

describe('contenuti reali', () => {
  it('pantheon.json conserva una scheda per entità e un blocco per scheda', () => {
    const template = getTemplate('divinita')!
    const result = seedFromMarkdown(template, content('pantheon'))
    const items = result.data.collections.entita
    expect(items.length).toBeGreaterThan(10)
    for (const item of items) expect(String(item.nome ?? '').trim()).not.toBe('')

    const compiled = compileTemplate(template, result.data, []).markdown
    /* intro con il titolo della pagina + una scheda per entità */
    expect(cards(compiled)).toHaveLength(items.length + 1)
    expect(compiled).toContain('# Anivia')
    expect(compiled).toContain('- **Epiteto:**')
  })

  it('regole-del-server.json conserva numero e titolo di ogni regola', () => {
    const template = getTemplate('regola')!
    const result = seedFromMarkdown(template, content('regole-del-server'))
    const rules = result.data.collections.regole
    expect(rules.length).toBeGreaterThan(5)
    for (const rule of rules) {
      expect(String(rule.titolo ?? '').trim()).not.toBe('')
      expect(Number(rule.numero)).toBeGreaterThan(0)
    }

    const compiled = compileTemplate(template, result.data, []).markdown
    expect(compiled).toMatch(/^## Regola \d+ — /m)
    /* Ogni regola è un blocco separato (`---`), quindi il renderer
       ne ricava una sezione per voce; l'intro può aggiungerne una. */
    expect(compiled.split(/\n[ \t]*---[ \t]*\n/).length).toBeGreaterThanOrEqual(rules.length)
  })

  it('lavori.json importa i mestieri con nome, immagine e stipendio', () => {
    const template = getTemplate('mestiere')!
    const result = seedFromMarkdown(template, content('lavori'))
    const jobs = result.data.collections.mestieri
    expect(jobs.length).toBeGreaterThan(5)
    for (const job of jobs) expect(String(job.nome ?? '').trim()).not.toBe('')

    const compiled = compileTemplate(template, result.data, []).markdown
    expect(compiled.startsWith('# Lavori ad Arcamis')).toBe(true)
    expect(compiled).toMatch(/!\[[^\]]+\]\(\/images\/[^)]+\)/)
    expect(compiled).toContain('## Stipendio')
  })
})
