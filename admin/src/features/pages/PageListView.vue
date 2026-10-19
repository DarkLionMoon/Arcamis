<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { carouselApi, errorText, pagesApi, registryApi, statusApi } from '@/shared/api'
import { confirmAction } from '@/shared/confirm'
import { useUnsavedGuard } from '@/shared/guard'
import { useAuthStore, useCoversStore, useRegistryStore, useUIStore } from '@/app/store'
import { compileTemplate } from '@/features/pages/templates/compile'
import { emptyTemplateData } from '@/features/pages/templates/schema'
import { validateTemplateData } from '@/features/pages/templates/validate'
import { getTemplate } from '@/features/pages/templates'
import TemplatePicker from '@/features/pages/editor/TemplatePicker.vue'
import VIcon from '@/shared/components/VIcon.vue'
import {
  PAGE_STATUSES,
  applyAction,
  canRunAction,
  statusMeta,
  statusOf,
  workflowFields,
  type PageStatus,
  type WorkflowActionId
} from '@/features/pages/workflow'
import type { PageContent, PageRegistryEntry, SectionRegistryEntry } from '@/types'

const router = useRouter()
const route = useRoute()
const registry = useRegistryStore()
const covers = useCoversStore()
const ui = useUIStore()
const auth = useAuthStore()

const loading = ref(true)
const savingNew = ref(false)
const busyKey = ref('')
const searchQuery = ref('')
const showPicker = ref(false)
const statusFilter = ref<PageStatus | 'all'>('all')
const selected = ref<string[]>([])

/* Lo stato effettivo del registro: una «programmata» scaduta è già
   pubblica, e la lista deve dirlo senza aspettare la build. */
const statusOfEntry = (page: PageRegistryEntry): PageStatus => statusOf(page)

const statusCounts = computed(() => {
  const counts: Record<PageStatus, number> = { draft: 0, review: 0, scheduled: 0, published: 0 }
  for (const page of registry.pages) counts[statusOfEntry(page)]++
  return counts
})

const filteredPages = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return registry.pages.filter((page) => {
    if (statusFilter.value !== 'all' && statusOfEntry(page) !== statusFilter.value) return false
    if (!q) return true
    return (
      (page.l || '').toLowerCase().includes(q) ||
      (page.k || '').toLowerCase().includes(q) ||
      (page.id || '').toLowerCase().includes(q) ||
      (page.layout || '').toLowerCase().includes(q)
    )
  })
})

const groupedPages = computed(() => {
  const groups = new Map<string, PageRegistryEntry[]>()
  for (const page of filteredPages.value) {
    const group = page.sec || '—'
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)!.push(page)
  }
  return Array.from(groups.entries()).sort((a, b) => {
    if (a[0] === '—') return 1
    if (b[0] === '—') return -1
    return a[0].localeCompare(b[0])
  })
})

const sectionLabel = (value?: string): string => {
  if (!value) return 'Senza sezione'
  const found = registry.sections.find((section) => section.v === value)
  return found?.l || value
}

async function load(): Promise<void> {
  loading.value = true
  try {
    const data = await registryApi.get()
    registry.setRegistry(data.pages as PageRegistryEntry[], (data.sections as SectionRegistryEntry[]) || [], data.ui)
    const coversMap = await carouselApi.getCovers().catch(() => ({}))
    covers.setCovers(coversMap || {})
    await syncStatuses()
  } catch (e) {
    ui.toast('Errore caricamento pagine: ' + errorText(e), 'error')
  } finally {
    loading.value = false
  }
}

/**
 * Allinea i chip al file della pagina, che è la fonte di verità dello
 * stato: il registro è la voce di menu e può essere indietro. Se la
 * chiamata fallisce si continua con quello che dice il registro.
 */
async function syncStatuses(): Promise<void> {
  try {
    const statuses = await statusApi.getAll()
    if (!statuses || typeof statuses !== 'object') return
    for (const page of registry.pages) {
      const remote = statuses[page.k]
      if (!remote) continue
      /* Mutazione in memoria, specchio del file: il registro salvato
         verrà riscritto alla prossima modifica che l'utente fa. */
      page.status = remote.status
      page.publishAt = remote.publishAt
      page.isDraft = remote.isDraft
    }
  } catch {
    /* endpoint non disponibile (o GH non configurato): chip dal registro */
  }
}

/* ── Selezione multipla e azioni bulk ── */
const visibleKeys = computed(() => filteredPages.value.map((entry) => entry.k))

const allChecked = computed(
  () => visibleKeys.value.length > 0 && visibleKeys.value.every((key) => selected.value.includes(key))
)

function toggleSelect(key: string): void {
  selected.value = selected.value.includes(key)
    ? selected.value.filter((candidate) => candidate !== key)
    : [...selected.value, key]
}

function toggleAll(): void {
  selected.value = allChecked.value
    ? selected.value.filter((key) => !visibleKeys.value.includes(key))
    : [...new Set([...selected.value, ...visibleKeys.value])]
}

async function bulkReview(): Promise<void> {
  const targets = registry.pages.filter(
    (entry) =>
      selected.value.includes(entry.k) &&
      statusOfEntry(entry) === 'draft' &&
      canRunAction(auth.role, 'draft', 'request-review')
  )
  if (!targets.length) {
    ui.toast('Nessuna bozza selezionata che puoi inviare in revisione', 'warning')
    return
  }
  for (const entry of targets) {
    await quickAction({ stopPropagation() {} } as unknown as MouseEvent, entry, 'request-review')
  }
  selected.value = []
  ui.toast(`${targets.length} pagine inviate in revisione`, 'success')
}

async function bulkRemove(): Promise<void> {
  const targets = registry.pages.filter((entry) => selected.value.includes(entry.k))
  if (!targets.length) return
  const ok = await confirmAction({
    title: 'Rimuovi pagine dal registro',
    message: `Rimuovere ${targets.length} pagine dal registro di navigazione?`,
    detail: 'I file delle pagine non vengono toccati.',
    confirmLabel: `Rimuovi ${targets.length} pagine`,
    danger: true
  })
  if (!ok) return
  try {
    for (const entry of targets) registry.removePage(entry.k)
    await registryApi.save(registry.pages)
    registry.clearDirty()
    ui.toast(`${targets.length} pagine rimosse dal registro`, 'success')
  } catch (e) {
    ui.toast('Errore rimozione: ' + errorText(e), 'error')
  }
  selected.value = []
}

function openPage(key: string): void {
  void router.push({ name: 'editor', params: { key } })
}

/** Azioni di flusso dalla lista: si tocca il file della pagina e il registro. */
async function quickAction(event: MouseEvent, page: PageRegistryEntry, id: WorkflowActionId): Promise<void> {
  event.stopPropagation()
  if (busyKey.value) return
  busyKey.value = page.k
  try {
    if (!canRunAction(auth.role, statusOf(page), id)) {
      ui.toast('Il tuo ruolo non può eseguire questa azione', 'error')
      return
    }
    const current = await pagesApi.get(page.k)

    /* Pubblicare con campi obbligatori vuoti manderebbe online un
       segnaposto: la lista controlla prima di toccare lo stato. */
    if (id === 'publish' || id === 'approve') {
      const template = current.template ? getTemplate(current.template) : undefined
      if (template && current.templateData) {
        const errors = validateTemplateData(template, current.templateData, current.draftFields || []).errors
        if (errors.length) {
          ui.toast(
            `${errors.length} camp${errors.length === 1 ? 'o' : 'i'} da correggere: apri la pagina per completarla`,
            'error',
            {
              title: 'Pubblicazione bloccata'
            }
          )
          return
        }
      }
      const ok = await confirmAction({
        title: 'Pubblicare la pagina',
        message: `Rendere pubblica «${page.l}»?`,
        detail: 'La pagina diventa visibile nel sito alla prossima build.',
        confirmLabel: 'Pubblica'
      })
      if (!ok) return
    }

    const result = applyAction(id, current, { actor: auth.user || undefined })
    await pagesApi.save({ ...current, ...result, lastModified: new Date().toISOString() }, `admin: ${id} ${page.k}`)
    Object.assign(
      page,
      workflowFields({
        status: result.status,
        publishAt: result.publishAt,
        isDraft: result.isDraft,
        review: result.review
      })
    )
    await registryApi.save(registry.pages)
    registry.clearDirty()
    ui.toast(result.message || 'Stato aggiornato', 'success')
  } catch (e) {
    ui.toast('Errore: ' + errorText(e), 'error')
  } finally {
    busyKey.value = ''
  }
}

async function deletePage(page: PageRegistryEntry): Promise<void> {
  const ok = await confirmAction({
    title: 'Rimuovi pagina dal registro',
    message: `Eliminare «${page.l}» dal registro di navigazione?`,
    detail: 'Il file della pagina non viene toccato: potrai recuperarlo dal repository o dalla cronologia.',
    confirmLabel: 'Rimuovi dal registro',
    danger: true
  })
  if (!ok) return
  try {
    registry.removePage(page.k)
    await registryApi.save(registry.pages)
    registry.clearDirty()
    ui.toast('Pagina rimossa dal registro — ricorda di eliminare il file', 'success')
  } catch (e) {
    ui.toast('Errore: ' + errorText(e), 'error')
  }
}

async function createPage(payload: {
  templateId: string | null
  title: string
  key: string
  icon: string
  section: string
}): Promise<void> {
  const template = payload.templateId ? getTemplate(payload.templateId) : undefined
  if (payload.templateId && !template) {
    ui.toast('Modello non disponibile', 'error')
    return
  }
  if (registry.pages.some((page) => page.k === payload.key)) {
    ui.toast('Chiave già esistente', 'error')
    return
  }

  savingNew.value = true
  try {
    const data = template ? emptyTemplateData(template) : undefined
    const content = template ? compileTemplate(template, data!, []).markdown : ''
    const page: PageContent = {
      k: payload.key,
      title: payload.title,
      icon: payload.icon,
      content,
      layout: template?.layout ?? '',
      lastModified: new Date().toISOString(),
      /* Le pagine nascono in bozza: il flusso di revisione parte da qui. */
      status: 'draft',
      isDraft: true,
      review: {},
      ...(template && data ? { template: template.id, templateData: data, draftFields: [] } : {})
    }

    await pagesApi.create(page, `admin: create page ${payload.key}`)
    registry.addPage({
      k: payload.key,
      l: payload.title,
      i: payload.icon,
      id: 'pag-' + payload.key,
      sec: payload.section || undefined,
      sub: '',
      c: 1,
      layout: template?.layout ?? '',
      status: 'draft',
      isDraft: true
    } as PageRegistryEntry)
    await registryApi.save(registry.pages)
    /* Il registro appena scritto non ha più modifiche pendenti: senza
       questo, aprire la pagina nuova incappava nel guard "modifiche non
       salvate" e il click su Crea sembrava non fare nulla. */
    registry.clearDirty()
    showPicker.value = false
    ui.toast(
      template ? `Pagina creata dal modello «${template.label}»` : 'Pagina creata — apri per compilare',
      'success'
    )
    openPage(payload.key)
  } catch (e) {
    ui.toast('Errore creazione: ' + errorText(e), 'error')
  } finally {
    savingNew.value = false
  }
}

/* Riordino/rimozione restano nel registro: senza guard si perdevano
   navigando altrove prima del salvataggio. */
useUnsavedGuard(() => registry.dirty, 'modifiche al registro pagine non salvate')

onMounted(() => {
  void load()
  /* Dalla command palette (`>nuova pagina`): apre subito il creatore. */
  if (route.query.new) showPicker.value = true
})
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <div>
        <h1 class="arc-page-title">Pagine</h1>
        <p class="arc-hint" style="margin-top: -14px">
          {{ registry.pages.length }} pagine nel registro · apri una pagina per l'editor a modelli.
        </p>
      </div>
      <div class="arc-head-actions">
        <button class="btn btn-p" type="button" :disabled="savingNew" @click="showPicker = true">
          <VIcon name="plus" :size="15" /> Nuova pagina
        </button>
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">
          <VIcon name="replace" :size="15" /> Aggiorna
        </button>
      </div>
    </div>

    <div class="arc-panel" style="margin-bottom: 16px">
      <input v-model="searchQuery" class="in" placeholder="🔎 Cerca per titolo, chiave o layout…" />
      <div class="arc-status-filter" role="group" aria-label="Filtra per stato di pubblicazione">
        <button
          class="arc-filter-chip"
          type="button"
          :class="{ 'is-active': statusFilter === 'all' }"
          @click="statusFilter = 'all'"
        >
          Tutte <span>{{ registry.pages.length }}</span>
        </button>
        <button
          v-for="status in PAGE_STATUSES"
          :key="status"
          class="arc-filter-chip"
          type="button"
          :class="[{ 'is-active': statusFilter === status }, 'arc-status-' + status]"
          :title="statusMeta(status).hint"
          @click="statusFilter = status"
        >
          {{ statusMeta(status).label }} <span>{{ statusCounts[status] }}</span>
        </button>
        <label class="arc-select-all">
          <input type="checkbox" :checked="allChecked" @change="toggleAll" />
          <span>Seleziona visibili</span>
        </label>
      </div>
    </div>

    <div v-if="selected.length" class="arc-panel arc-bulkbar">
      <strong>{{ selected.length }} selezionate</strong>
      <button class="btn btn-soft btn-sm" type="button" @click="bulkReview">
        <VIcon name="eye" :size="14" /> Invia in revisione
      </button>
      <button class="btn btn-d btn-sm" type="button" @click="bulkRemove">
        <VIcon name="trash" :size="14" /> Rimuovi dal registro
      </button>
      <span class="arc-toolbar-spacer"></span>
      <button class="btn btn-soft btn-sm" type="button" @click="selected = []">Deseleziona</button>
    </div>

    <div v-if="loading" class="arc-panel">
      <span class="arc-skel-bar" style="width: 40%"></span>
      <span class="arc-skel-block"></span>
      <span class="arc-skel-block" style="width: 70%"></span>
    </div>

    <div v-for="[group, pages] in groupedPages" :key="group" class="arc-panel" style="margin-bottom: 16px">
      <h3 class="arc-panel-title">
        {{ sectionLabel(group === '—' ? undefined : group) }}
        <span style="opacity: 0.55; font-weight: 500">({{ pages.length }})</span>
      </h3>
      <table class="arc-table">
        <tbody>
          <tr v-for="page in pages" :key="page.k" class="arc-page-row" @dblclick="openPage(page.k)">
            <td style="width: 30px">
              <input
                type="checkbox"
                :checked="selected.includes(page.k)"
                :aria-label="'Seleziona ' + (page.l || page.k)"
                @click.stop
                @change="toggleSelect(page.k)"
              />
            </td>
            <td style="width: 38px; font-size: 20px">{{ page.i || '📄' }}</td>
            <td>
              <button class="arc-page-link" type="button" @click="openPage(page.k)">
                {{ page.l || page.k }}
              </button>
              <div class="arc-page-meta">
                <span>{{ page.k }}</span>
                <span v-if="page.layout" class="arc-chip">{{ page.layout }}</span>
                <span
                  class="arc-chip"
                  :class="'arc-status-' + statusOfEntry(page)"
                  :title="statusMeta(statusOfEntry(page)).hint"
                >
                  {{ statusMeta(statusOfEntry(page)).label }}
                </span>
              </div>
            </td>
            <td style="width: 62px; text-align: right">
              <img
                v-if="covers.covers[page.id]"
                :src="covers.covers[page.id]"
                alt=""
                class="arc-page-cover"
                loading="lazy"
              />
            </td>
            <td style="width: 300px; text-align: right">
              <button
                v-if="statusOfEntry(page) === 'draft' && canRunAction(auth.role, 'draft', 'request-review')"
                class="btn btn-soft btn-sm"
                type="button"
                title="Segnala la pagina per la revisione"
                :disabled="busyKey === page.k"
                @click="quickAction($event, page, 'request-review')"
              >
                <VIcon name="eye" :size="14" /> Invia in revisione
              </button>
              <button
                v-if="statusOfEntry(page) === 'review' && canRunAction(auth.role, 'review', 'approve')"
                class="btn btn-p btn-sm"
                type="button"
                title="Approva e pubblica la pagina"
                :disabled="busyKey === page.k"
                @click="quickAction($event, page, 'approve')"
              >
                <VIcon name="check" :size="14" /> Approva
              </button>
              <button class="btn btn-p btn-sm" type="button" @click="openPage(page.k)">
                <VIcon name="structure" :size="14" /> Modifica
              </button>
              <button class="btn btn-d btn-sm" type="button" title="Rimuovi dal registro" @click="deletePage(page)">
                <VIcon name="trash" :size="14" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!loading && registry.pages.length === 0" class="arc-empty-side">Nessuna pagina nel registro.</div>

    <TemplatePicker
      :open="showPicker"
      mode="create"
      :existing-keys="registry.pages.map((page) => page.k)"
      :sections="registry.sections"
      @close="showPicker = false"
      @create="createPage"
    />
  </section>
</template>

<style scoped>
.arc-select-all {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  opacity: 0.8;
  margin-left: 8px;
  cursor: pointer;
}
.arc-bulkbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  border-color: var(--accent, #c89b3c);
}
</style>
