<script setup lang="ts">
import { computed } from 'vue'

import VIcon from '@/shared/components/VIcon.vue'
import type { ExploreConfig, ExploreGroup, ExploreMode, PageContent } from '@/types'
import {
  EXPLORE_MODES,
  assignSection,
  countEntries,
  countTableRows,
  createExplore,
  moveItem,
  newFilter,
  newGroup,
  normalizeExplore,
  sectionTitles,
  suggestedMode,
  toggleSection
} from '../explore'

const props = defineProps<{ page: PageContent; content: string }>()
const emit = defineEmits<{ (e: 'update', value: ExploreConfig): void }>()

const cfg = computed(() => normalizeExplore(props.page.explore, suggestedMode(props.page.layout)))
const headings = computed(() => sectionTitles(props.content))
const count = computed(() =>
  cfg.value.source === 'table' ? countTableRows(props.content) : countEntries(props.content, cfg.value)
)
const groupKey = computed<'tabs' | 'groups'>(() => (cfg.value.mode === 'tabs' ? 'tabs' : 'groups'))
const groups = computed<ExploreGroup[]>(() => (groupKey.value === 'tabs' ? cfg.value.tabs : cfg.value.groups))
const canGroup = computed(() => cfg.value.mode === 'tabs' || cfg.value.mode === 'accordion')

const unassigned = computed(() => {
  if (!canGroup.value) return []
  const assigned = new Set(groups.value.flatMap((group) => group.sections))
  return headings.value.filter((heading) => heading.level === 2 && !assigned.has(heading.title))
})

function patch(partial: Partial<ExploreConfig>): void {
  emit('update', normalizeExplore({ ...cfg.value, ...partial }))
}

function setMode(mode: ExploreMode): void {
  const previous = cfg.value
  const next = createExplore(mode)
  /* Conserva le etichette già scritte: cambiare pattern non deve
     costringere a riscriverle. */
  emit('update', {
    ...next,
    label: previous.label || next.label,
    plural: previous.plural || next.plural,
    hash: previous.hash || next.hash,
    source: previous.source,
    filters: previous.filters || [],
    tabs: previous.tabs || [],
    groups: previous.groups || []
  })
}

function setEntryLevel(event: Event): void {
  const level = Number((event.target as HTMLSelectElement).value)
  patch({ entryLevel: level === 2 ? 2 : level === 3 ? 3 : 1 })
}

/* Le voci possono venire dai titoli markdown oppure dalle righe di una
   tabella (es. Materiale Approvato). */
function setSource(event: Event): void {
  patch({ source: (event.target as HTMLSelectElement).value === 'table' ? 'table' : 'headings' })
}

function setTargetGroups(next: ExploreGroup[]): void {
  patch({ [groupKey.value]: next } as Partial<ExploreConfig>)
}

function addGroup(): void {
  setTargetGroups([...groups.value, newGroup(groups.value.length, cfg.value.mode === 'tabs' ? 'Scheda' : 'Gruppo')])
}

function updateGroup(index: number, changes: Partial<ExploreGroup>): void {
  setTargetGroups(groups.value.map((group, i) => (i === index ? { ...group, ...changes } : group)))
}

function removeGroup(index: number): void {
  setTargetGroups(groups.value.filter((_group, i) => i !== index))
}

function moveGroup(index: number, offset: number): void {
  setTargetGroups(moveItem(groups.value, index, index + offset))
}

function toggle(group: ExploreGroup, title: string): void {
  setTargetGroups(toggleSection(groups.value, group.id, title))
}

function assignAll(): void {
  const base = groups.value.length ? groups.value : [newGroup(0, cfg.value.mode === 'tabs' ? 'Scheda' : 'Gruppo')]
  const target = base[base.length - 1]
  if (!target) return
  const next = unassigned.value.reduce((current, heading) => assignSection(current, target.id, heading.title), base)
  setTargetGroups(next)
}

function updateFilter(index: number, changes: { label?: string; field?: string; id?: string }): void {
  patch({
    filters: cfg.value.filters.map((filter, i) => (i === index ? { ...filter, ...changes } : filter))
  })
}

function addFilter(): void {
  patch({ filters: [...cfg.value.filters, newFilter(cfg.value.filters.length)] })
}

function removeFilter(index: number): void {
  patch({ filters: cfg.value.filters.filter((_filter, i) => i !== index) })
}

function moveFilter(index: number, offset: number): void {
  patch({ filters: moveItem(cfg.value.filters, index, index + offset) })
}

function reset(): void {
  emit('update', createExplore(cfg.value.mode))
}
</script>

<template>
  <section class="arc-explorer">
    <header class="arc-explorer-head">
      <div>
        <h2>Esplorazione della pagina</h2>
        <p class="arc-hint">
          Il markdown resta la fonte delle voci: qui scegli come il sito le legge e le presenta. Nessuna modifica al
          codice.
        </p>
      </div>
      <span class="arc-chip">{{ count }} {{ cfg.plural || 'voci' }}</span>
    </header>

    <div class="arc-explorer-modes" role="radiogroup" aria-label="Pattern di esplorazione">
      <button
        v-for="option in EXPLORE_MODES"
        :key="option.value"
        class="arc-explorer-mode"
        type="button"
        role="radio"
        :aria-checked="cfg.mode === option.value"
        :class="{ active: cfg.mode === option.value }"
        @click="setMode(option.value)"
      >
        <span class="arc-explorer-mode-icon" aria-hidden="true">{{ option.icon }}</span>
        <span class="arc-explorer-mode-label">{{ option.label }}</span>
        <span class="arc-explorer-mode-desc">{{ option.description }}</span>
      </button>
    </div>

    <div class="arc-explorer-grid">
      <label class="arc-field">
        <span class="arc-label">Sorgente delle voci</span>
        <select class="in" :value="cfg.source === 'table' ? 'table' : 'headings'" @change="setSource">
          <option value="headings">Titoli del markdown</option>
          <option value="table">Righe di una tabella</option>
        </select>
      </label>
      <label v-if="cfg.source !== 'table'" class="arc-field">
        <span class="arc-label">Voci lette da</span>
        <select class="in" :value="String(cfg.entryLevel || 1)" @change="setEntryLevel">
          <option value="1">Titoli H1 (#)</option>
          <option value="2">Titoli H2 (##)</option>
          <option value="3">Titoli H3 (###)</option>
        </select>
      </label>
      <label class="arc-field">
        <span class="arc-label">Nome della voce</span>
        <input
          class="in"
          :value="cfg.label"
          placeholder="Scheda, Regola, Divinità…"
          @input="patch({ label: ($event.target as HTMLInputElement).value })"
        />
      </label>
      <label class="arc-field">
        <span class="arc-label">Plurale (conteggi)</span>
        <input
          class="in"
          :value="cfg.plural"
          placeholder="schede, regole, voci…"
          @input="patch({ plural: ($event.target as HTMLInputElement).value })"
        />
      </label>
      <label class="arc-field">
        <span class="arc-label">Prefisso URL (hash)</span>
        <input
          class="in"
          :value="cfg.hash"
          :placeholder="page.k"
          @input="patch({ hash: ($event.target as HTMLInputElement).value })"
        />
        <small class="arc-field-help">Es. <code>specie</code> → /lore/specie-homebrew#specie/ascesi</small>
      </label>
      <label v-if="cfg.mode === 'group-tabs'" class="arc-field">
        <span class="arc-label">Raggruppa per campo</span>
        <input
          class="in"
          :value="cfg.groupBy"
          placeholder="Classe"
          @input="patch({ groupBy: ($event.target as HTMLInputElement).value })"
        />
        <small class="arc-field-help">Etichetta già presente nella scheda, es. <code>Classe:</code></small>
      </label>
      <label v-if="cfg.mode === 'group-tabs'" class="arc-field">
        <span class="arc-label">Nome dei gruppi (plurale)</span>
        <input
          class="in"
          :value="cfg.groupPlural"
          placeholder="classi"
          @input="patch({ groupPlural: ($event.target as HTMLInputElement).value })"
        />
      </label>
    </div>

    <div class="arc-explorer-options">
      <label class="arc-check">
        <input
          type="checkbox"
          :checked="cfg.search !== false"
          @change="patch({ search: ($event.target as HTMLInputElement).checked })"
        />
        <span>Mostra la ricerca</span>
      </label>
      <label
        v-if="cfg.mode === 'master-detail' || cfg.mode === 'drawer' || cfg.mode === 'group-tabs'"
        class="arc-check"
      >
        <input
          type="checkbox"
          :checked="cfg.showHero !== false"
          @change="patch({ showHero: ($event.target as HTMLInputElement).checked })"
        />
        <span>Immagine in testa alla scheda</span>
      </label>
      <label class="arc-check">
        <input
          type="checkbox"
          :checked="cfg.unassigned !== false"
          @change="patch({ unassigned: ($event.target as HTMLInputElement).checked })"
        />
        <span>Raccogli le sezioni non assegnate</span>
      </label>
    </div>

    <div v-if="canGroup" class="arc-explorer-block">
      <div class="arc-explorer-block-head">
        <div>
          <h3>{{ cfg.mode === 'tabs' ? 'Schede orizzontali' : 'Macro-categorie' }}</h3>
          <p class="arc-hint">
            Assegna i titoli H2 alle schede. Una sezione può stare in una sola scheda; quelle libere finiscono
            nell’ultima.
          </p>
        </div>
        <div class="arc-explorer-actions">
          <button class="btn btn-soft btn-sm" type="button" @click="addGroup">
            <VIcon name="plus" :size="14" /> {{ cfg.mode === 'tabs' ? 'Nuova scheda' : 'Nuovo gruppo' }}
          </button>
          <button v-if="unassigned.length" class="btn btn-soft btn-sm" type="button" @click="assignAll">
            Assegna tutte
          </button>
        </div>
      </div>

      <div v-for="(group, index) in groups" :key="group.id" class="arc-explorer-group">
        <div class="arc-explorer-group-head">
          <span class="arc-explorer-order">{{ index + 1 }}</span>
          <input
            class="in arc-explorer-group-name"
            :value="group.label"
            :aria-label="'Nome del gruppo ' + (index + 1)"
            @input="updateGroup(index, { label: ($event.target as HTMLInputElement).value })"
          />
          <button
            class="arc-icon-btn"
            type="button"
            title="Sposta su"
            :disabled="index === 0"
            @click="moveGroup(index, -1)"
          >
            ↑
          </button>
          <button
            class="arc-icon-btn"
            type="button"
            title="Sposta giù"
            :disabled="index === groups.length - 1"
            @click="moveGroup(index, 1)"
          >
            ↓
          </button>
          <button class="arc-icon-btn is-danger" type="button" title="Elimina gruppo" @click="removeGroup(index)">
            <VIcon name="trash" :size="13" />
          </button>
        </div>
        <div class="arc-explorer-sections">
          <button
            v-for="heading in headings.filter((item) => item.level === 2)"
            :key="heading.title"
            class="arc-section-chip"
            type="button"
            :class="{ 'is-on': group.sections.includes(heading.title) }"
            @click="toggle(group, heading.title)"
          >
            {{ heading.title }}
          </button>
          <span v-if="!headings.some((item) => item.level === 2)" class="arc-hint">
            Nessun titolo H2 nel contenuto: aggiungine uno nell’editor a blocchi.
          </span>
        </div>
      </div>
      <p v-if="!groups.length" class="arc-empty-side">Nessun gruppo: il sito userà un’unica scheda.</p>
    </div>

    <div class="arc-explorer-block">
      <div class="arc-explorer-block-head">
        <div>
          <h3>Filtri rapidi</h3>
          <p class="arc-hint">
            Ogni filtro legge un’etichetta dalle schede, ad esempio <code>Tipologia</code>, <code>Classe</code> o
            <code>Fonte</code>. I valori vengono ricavati dal contenuto.
          </p>
        </div>
        <button class="btn btn-soft btn-sm" type="button" @click="addFilter">
          <VIcon name="plus" :size="14" /> Nuovo filtro
        </button>
      </div>
      <div v-for="(filter, index) in cfg.filters" :key="filter.id" class="arc-explorer-filter">
        <input
          class="in"
          :value="filter.label"
          placeholder="Etichetta visibile"
          @input="updateFilter(index, { label: ($event.target as HTMLInputElement).value })"
        />
        <input
          class="in"
          :value="filter.field"
          placeholder="Campo nel markdown (es. Tipologia)"
          @input="updateFilter(index, { field: ($event.target as HTMLInputElement).value })"
        />
        <button
          class="arc-icon-btn"
          type="button"
          title="Sposta su"
          :disabled="index === 0"
          @click="moveFilter(index, -1)"
        >
          ↑
        </button>
        <button
          class="arc-icon-btn"
          type="button"
          title="Sposta giù"
          :disabled="index === cfg.filters.length - 1"
          @click="moveFilter(index, 1)"
        >
          ↓
        </button>
        <button class="arc-icon-btn is-danger" type="button" title="Elimina filtro" @click="removeFilter(index)">
          <VIcon name="trash" :size="13" />
        </button>
      </div>
      <p v-if="!cfg.filters.length" class="arc-hint">Nessun filtro: resta la ricerca testuale.</p>
    </div>

    <footer class="arc-explorer-footer">
      <span class="arc-hint">Il pattern viene salvato nella pagina e reso dal sito al prossimo deploy.</span>
      <button class="btn btn-soft btn-sm" type="button" @click="reset">Ripristina impostazioni del pattern</button>
    </footer>
  </section>
</template>

<style scoped>
.arc-explorer {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.arc-explorer-head,
.arc-explorer-block-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}
.arc-explorer-head h2,
.arc-explorer-block-head h3 {
  font-family: 'Cinzel', serif;
  color: var(--accent, #c89b3c);
  font-size: 16px;
  margin-bottom: 4px;
}
.arc-explorer-block-head h3 {
  font-size: 13px;
}
.arc-explorer-modes {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.arc-explorer-mode {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 11px 12px;
  border: 1px solid var(--aline, rgba(200, 155, 60, 0.16));
  border-radius: 8px;
  background: var(--asurface, rgba(200, 155, 60, 0.025));
  color: var(--text, #e8dcc0);
  cursor: pointer;
  text-align: left;
}
.arc-explorer-mode:hover,
.arc-explorer-mode.active {
  border-color: var(--accent, #c89b3c);
  background: var(--accent-soft, rgba(200, 155, 60, 0.12));
}
.arc-explorer-mode-icon {
  color: var(--accent, #c89b3c);
  font-size: 18px;
}
.arc-explorer-mode-label {
  font-family: 'Cinzel', serif;
  font-size: 12px;
  font-weight: 700;
}
.arc-explorer-mode-desc {
  color: var(--text-muted, #b0a080);
  font-size: 10px;
  line-height: 1.4;
}
.arc-explorer-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.arc-explorer-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  padding: 10px 12px;
  border: 1px solid var(--aline, rgba(200, 155, 60, 0.14));
  border-radius: 8px;
  background: var(--asurface, rgba(200, 155, 60, 0.02));
}
.arc-explorer-block {
  padding: 14px;
  border: 1px solid var(--aline, rgba(200, 155, 60, 0.16));
  border-radius: 8px;
  background: var(--asurface, rgba(200, 155, 60, 0.025));
}
.arc-explorer-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.arc-explorer-group {
  margin-top: 12px;
  padding: 10px;
  border: 1px solid var(--aline, rgba(200, 155, 60, 0.14));
  border-radius: 7px;
  background: rgba(0, 0, 0, 0.12);
}
.arc-explorer-group-head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.arc-explorer-order {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  flex: none;
  border: 1px solid var(--aline, rgba(200, 155, 60, 0.22));
  border-radius: 50%;
  color: var(--text-muted, #b0a080);
  font-size: 10px;
}
.arc-explorer-group-name {
  flex: 1;
  min-width: 0;
}
.arc-explorer-sections {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}
.arc-section-chip {
  padding: 3px 8px;
  border: 1px solid var(--aline, rgba(200, 155, 60, 0.18));
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted, #b0a080);
  cursor: pointer;
  font-size: 10px;
}
.arc-section-chip.is-on {
  border-color: var(--accent, #c89b3c);
  background: var(--accent-soft, rgba(200, 155, 60, 0.16));
  color: var(--text, #e8dcc0);
}
.arc-explorer-filter {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto auto auto;
  gap: 6px;
  align-items: center;
  margin-top: 8px;
}
.arc-explorer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
@media (max-width: 900px) {
  .arc-explorer-modes,
  .arc-explorer-grid {
    grid-template-columns: 1fr 1fr;
  }
  .arc-explorer-filter {
    grid-template-columns: 1fr;
  }
  .arc-explorer-filter .arc-icon-btn {
    justify-self: start;
  }
}
</style>
