/*
  ARCAMIS — test dell'app integrata Imprese & Licenze

  `scripts/js/imprese.js` gira nel browser senza dipendenze: qui lo si
  avvia in un contesto vm con un DOM finto minimale e si verifica che
  il montaggio, la navigazione a tab/sidebar e la ricerca funzionino.
  Perché serve: l'app è iniettata via `_impreseInit` dentro la pagina
  wiki — un errore qui lascia la pagina vuota senza rompere la build.
*/
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')

function makeClassList() {
  const set = new Set()
  return {
    add(c) {
      set.add(c)
    },
    remove(c) {
      set.delete(c)
    },
    toggle(c, force) {
      if (force === undefined) set.has(c) ? set.delete(c) : set.add(c)
      else if (force) set.add(c)
      else set.delete(c)
      return set.has(c)
    },
    contains(c) {
      return set.has(c)
    }
  }
}

function makeEl(tag) {
  const listeners = {}
  return {
    tagName: tag || 'div',
    innerHTML: '',
    textContent: '',
    value: '',
    style: {},
    children: [],
    classList: makeClassList(),
    addEventListener(t, fn) {
      ;(listeners[t] = listeners[t] || []).push(fn)
    },
    removeEventListener(t, fn) {
      listeners[t] = (listeners[t] || []).filter((f) => f !== fn)
    },
    _listeners: listeners,
    setAttribute() {},
    getAttribute() {
      return null
    },
    querySelector() {
      return null
    },
    querySelectorAll() {
      return []
    },
    appendChild(c) {
      this.children.push(c)
      return c
    },
    scrollIntoView() {},
    matches() {
      return false
    },
    closest() {
      return null
    }
  }
}

const IMP_IDS = [
  'tabsRow',
  'searchRow',
  'sidenav',
  'content',
  'modalTitle',
  'modalBody',
  'modalFooter',
  'modalOverlay',
  'mobileDrawer',
  'drawerOverlay',
  'mobileDrawerNav',
  'mobileNavBtn',
  'globalSearch',
  'activeFilters'
]

function loadApp() {
  const byId = {}
  IMP_IDS.forEach((k) => {
    byId['imp-' + k] = makeEl('div')
  })
  const doc = {
    _byId: byId,
    getElementById(id) {
      return byId[id] || null
    },
    createElement(tag) {
      return makeEl(tag)
    },
    addEventListener() {},
    querySelectorAll() {
      return []
    }
  }
  const store = {}
  const sandbox = {
    window: {},
    document: doc,
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => {
        store[k] = String(v)
      },
      removeItem: (k) => {
        delete store[k]
      }
    },
    confirm: () => true,
    alert: () => {},
    console
  }
  vm.createContext(sandbox)
  vm.runInContext(fs.readFileSync(path.join(root, 'scripts/js/imprese.js'), 'utf8'), sandbox)
  return { sandbox, doc }
}

function stubEl(attrs, value) {
  return {
    getAttribute: (n) => (attrs && attrs[n] != null ? attrs[n] : null),
    value: value || ''
  }
}

function boot() {
  const { sandbox, doc } = loadApp()
  const container = makeEl('div')
  sandbox.window._impreseInit(container)
  return { sandbox, doc, container }
}

describe('app Imprese integrata', () => {
  it('monta shell, tab, sidenav e contenuto con i listener sul container', () => {
    const { sandbox, doc, container } = boot()
    expect(typeof sandbox.window._impreseInit).toBe('function')
    expect(container.innerHTML).toContain('imp-tabsRow')
    expect(container.innerHTML).toContain('imp-sidenav')
    expect(container.innerHTML).toContain('imp-content')
    expect(container.innerHTML).toContain('imp-globalSearch')
    expect(container.innerHTML).toContain('imp-modalOverlay')
    expect((container._listeners.click || []).length).toBe(1)
    expect((container._listeners.input || []).length).toBe(1)
    expect(doc._byId['imp-tabsRow'].innerHTML).toContain('Licenze')
    expect(doc._byId['imp-sidenav'].innerHTML).toContain('Panoramica')
    expect(doc._byId['imp-content'].innerHTML).toContain('Bottega')
  })

  it('naviga tra sezioni e pagine via dispatcher (come i click delegati)', () => {
    const { sandbox, doc } = boot()
    const handle = sandbox.window._impHandle
    handle('setSection', stubEl({ 'data-imp-setsection': 'livelli' }))
    expect(doc._byId['imp-content'].innerHTML).toContain('Corporazione')
    expect(doc._byId['imp-sidenav'].innerHTML).toContain('active')
    handle('setPage', stubEl({ 'data-imp-setpage': 'licenze' }))
    expect(doc._byId['imp-tabsRow'].innerHTML).toContain('active')
    expect(doc._byId['imp-content'].innerHTML).toContain('Codice Patenti')
    handle('goto', stubEl({ 'data-imp-goto': 'licenze,pmc' }))
    expect(doc._byId['imp-content'].innerHTML).toContain('Manifattura Comune')
    handle('setSection', stubEl({ 'data-imp-setsection': 'inesistente' }))
    expect(doc._byId['imp-content'].innerHTML).toContain('Sezione non trovata')
  })

  it('il gestore rende senza esplodere anche senza i suoi nodi (guard gInit)', () => {
    const { sandbox, doc } = boot()
    sandbox.window._impHandle('setSection', stubEl({ 'data-imp-setsection': 'gestore' }))
    expect(doc._byId['imp-content'].innerHTML.length).toBeGreaterThan(100)
  })

  it('stacca i listener allo smontaggio e il remount riparte pulito', () => {
    const { sandbox, container } = boot()
    sandbox.window._impreseDestroy()
    expect((container._listeners.click || []).length).toBe(0)
    expect((container._listeners.input || []).length).toBe(0)
    const fresh = makeEl('div')
    sandbox.window._impreseInit(fresh)
    expect((fresh._listeners.click || []).length).toBe(1)
    expect(fresh.innerHTML).toContain('imp-content')
  })
})

describe('ricerca globale delle Imprese', () => {
  function searchHarness() {
    const { sandbox, doc } = boot()
    const unit = (text) => {
      const el = makeEl('div')
      el.textContent = text
      return el
    }
    const units = [unit('Bottega e tassa di registrazione'), unit('Corporazione e monopolio'), unit('Come creare una Bottega')]
    const title = makeEl('div')
    title.textContent = 'I 3 Livelli in Sintesi'
    const section = makeEl('div')
    section.querySelector = () => title
    section.querySelectorAll = () => units
    const content = doc._byId['imp-content']
    content.querySelectorAll = (sel) => (sel === '.imp-doc-section' ? [section] : units)
    return { sandbox, doc, units, section }
  }

  it('nasconde le unità che non matchano e mostra il conteggio', () => {
    const { sandbox, doc, units } = searchHarness()
    const hits = sandbox.window._impSearch('bottega')
    expect(hits).toBe(2)
    expect(units[0].classList.contains('imp-hide')).toBe(false)
    expect(units[1].classList.contains('imp-hide')).toBe(true)
    expect(units[2].classList.contains('imp-hide')).toBe(false)
    expect(doc._byId['imp-activeFilters'].innerHTML).toContain('2 risultati')
  })

  it('query corta o vuota ripristina tutto', () => {
    const { sandbox, doc, units } = searchHarness()
    sandbox.window._impSearch('bottega')
    expect(sandbox.window._impSearch('')).toBe(3)
    expect(units.every((u) => !u.classList.contains('imp-hide'))).toBe(true)
    expect(doc._byId['imp-activeFilters'].innerHTML).toBe('')
    expect(sandbox.window._impSearch('b')).toBe(3)
  })

  it('nasconde la sezione rimasta senza unità visibili', () => {
    const { sandbox, section } = searchHarness()
    sandbox.window._impSearch('zzzz-nulla')
    expect(section.classList.contains('imp-hide')).toBe(true)
  })

  it('clearSearch azzera input e filtro', () => {
    const { sandbox, doc, units } = searchHarness()
    doc._byId['imp-globalSearch'].value = 'bottega'
    sandbox.window._impSearch('bottega')
    sandbox.window._impHandle('clearSearch', stubEl({}))
    expect(doc._byId['imp-globalSearch'].value).toBe('')
    expect(units.every((u) => !u.classList.contains('imp-hide'))).toBe(true)
  })
})

describe('integrazione nella pagina wiki', () => {
  it('notion-nav monta l\u2019app integrata invece dell\u2019iframe', () => {
    const source = fs.readFileSync(path.join(root, 'scripts/js/notion-nav.js'), 'utf8')
    expect(source).toContain('window._impreseInit(_impRoot)')
    expect(source).toContain("id=\"imprese-app-root\"")
    expect(source).not.toContain('imprese-standalone/index.html')
    expect(source).toContain('window._impreseDestroy()')
  })
})
