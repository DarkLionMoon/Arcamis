<script setup lang="ts">
import { ref, watch } from 'vue'

import {
  createEntity,
  parsePantheon,
  serializePantheon,
  updateEntity,
  updateField,
  type PantheonDoc,
  type PantheonEntity
} from '../pantheon'
import VIcon from '@/shared/components/VIcon.vue'

const props = defineProps<{ content: string }>()
const emit = defineEmits<{ (e: 'update:content', value: string): void }>()

const doc = ref<PantheonDoc>(parsePantheon(props.content))
const open = ref<Set<string>>(new Set())

watch(
  () => props.content,
  (value) => {
    /* Il parent riscrive il contenuto dopo ogni commit: ricaricare qui
       riporterebbe il cursore a zero. Si rilegge solo se il markdown
       esterno è davvero diverso da quello prodotto dal form. */
    if (serializePantheon(doc.value) !== value) doc.value = parsePantheon(value)
  }
)

function commit(): void {
  emit('update:content', serializePantheon(doc.value))
}

function value(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value
}

function toggle(id: string): void {
  const next = new Set(open.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  open.value = next
}

function replaceEntity(index: number, next: PantheonEntity): void {
  doc.value.parts = doc.value.parts.map((part, position) => (position === index ? next : part))
}

function setName(index: number, entity: PantheonEntity, event: Event): void {
  replaceEntity(index, updateEntity(entity, { name: value(event) }))
  commit()
}

function setText(
  index: number,
  entity: PantheonEntity,
  patch: { image?: string; position?: string; quote?: string; personality?: string },
  event: Event
): void {
  replaceEntity(index, updateEntity(entity, { ...patch, [Object.keys(patch)[0]]: value(event) }))
  commit()
}

function setIdentity(index: number, entity: PantheonEntity, label: string, event: Event): void {
  replaceEntity(index, updateField(entity, 'identity', label, value(event)))
  commit()
}

function setCult(index: number, entity: PantheonEntity, label: string, event: Event): void {
  replaceEntity(index, updateField(entity, 'cult', label, value(event)))
  commit()
}

function identityValue(entity: PantheonEntity, label: string): string {
  return entity.identity.find((field) => field.label.toLowerCase() === label.toLowerCase())?.value || ''
}

function cultValue(entity: PantheonEntity, label: string): string {
  return entity.cult.find((field) => field.label.toLowerCase() === label.toLowerCase())?.value || ''
}

function addEntity(): void {
  const entity = createEntity('Nuova divinità')
  doc.value.parts.push(entity)
  open.value = new Set([...open.value, entity.id])
  commit()
}

function removeEntity(index: number): void {
  const part = doc.value.parts[index]
  if (!part || part.kind !== 'entity') return
  if (!window.confirm(`Eliminare la scheda «${part.name}»?`)) return
  doc.value.parts.splice(index, 1)
  commit()
}

function updateRaw(index: number, raw: string): void {
  const part = doc.value.parts[index]
  if (!part || part.kind !== 'raw') return
  part.raw = raw
  commit()
}

function setIntro(event: Event): void {
  doc.value.intro = value(event)
  commit()
}

const entityCount = () =>
  doc.value.parts.filter((part) => part.kind === 'entity').length
</script>

<template>
  <section class="arc-pantheon-editor">
    <div class="arc-pantheon-head">
      <div>
        <h2>Schede divinità</h2>
        <p class="arc-hint">
          {{ entityCount() }} entità modificate a campi. Le sezioni speciali restano markdown e vengono preservate.
        </p>
      </div>
      <button class="btn btn-soft btn-sm" type="button" @click="addEntity">
        <VIcon name="plus" :size="14" /> Aggiungi divinità
      </button>
    </div>

    <label class="arc-field">
      <span class="arc-label">Introduzione</span>
      <textarea class="in" rows="4" :value="doc.intro" @input="setIntro" />
    </label>

    <article
      v-for="(part, index) in doc.parts"
      :key="part.id"
      class="arc-pantheon-card"
      :class="{ 'is-raw': part.kind === 'raw' }"
    >
      <template v-if="part.kind === 'entity'">
        <header class="arc-pantheon-card-head" @click="toggle(part.id)">
          <span class="arc-pantheon-glyph">🛐</span>
          <strong>{{ identityValue(part, 'Nome') || part.name || 'Senza nome' }}</strong>
          <span class="arc-pantheon-epithet">{{ identityValue(part, 'Epiteto') }}</span>
          <span class="arc-pantheon-tools">
            <button class="arc-icon-btn is-danger" type="button" title="Elimina divinità" @click.stop="removeEntity(index)">
              <VIcon name="trash" :size="14" />
            </button>
            <button class="arc-icon-btn" type="button" :aria-expanded="open.has(part.id)" @click.stop="toggle(part.id)">
              <VIcon :name="open.has(part.id) ? 'down' : 'chevron'" :size="14" />
            </button>
          </span>
        </header>

        <div v-if="open.has(part.id)" class="arc-pantheon-card-body">
          <div class="arc-pantheon-grid">
            <label class="arc-field">
              <span class="arc-label">Nome</span>
              <input class="in" :value="identityValue(part, 'Nome')" @input="setName(index, part, $event)" />
            </label>
            <label class="arc-field">
              <span class="arc-label">Epiteto</span>
              <input class="in" :value="identityValue(part, 'Epiteto')" @input="setIdentity(index, part, 'Epiteto', $event)" />
            </label>
            <label class="arc-field">
              <span class="arc-label">Allineamento</span>
              <input
                class="in"
                :value="identityValue(part, 'Allineamento')"
                @input="setIdentity(index, part, 'Allineamento', $event)"
              />
            </label>
            <label class="arc-field">
              <span class="arc-label">Sfere</span>
              <input class="in" :value="identityValue(part, 'Sfere')" @input="setIdentity(index, part, 'Sfere', $event)" />
            </label>
            <label class="arc-field">
              <span class="arc-label">Simbolo</span>
              <input
                class="in"
                :value="identityValue(part, 'Simbolo')"
                @input="setIdentity(index, part, 'Simbolo', $event)"
              />
            </label>
          </div>

          <div class="arc-pantheon-grid">
            <label class="arc-field">
              <span class="arc-label">Immagine</span>
              <input class="in" :value="part.image" @input="setText(index, part, { image: '' }, $event)" />
            </label>
            <label class="arc-field">
              <span class="arc-label">Ritaglio (x,y)</span>
              <input class="in" :value="part.position" @input="setText(index, part, { position: '' }, $event)" />
            </label>
          </div>

          <label class="arc-field">
            <span class="arc-label">Citazione</span>
            <textarea class="in" rows="2" :value="part.quote" @input="setText(index, part, { quote: '' }, $event)" />
          </label>

          <label class="arc-field">
            <span class="arc-label">Personalità</span>
            <textarea
              class="in"
              rows="5"
              :value="part.personality"
              @input="setText(index, part, { personality: '' }, $event)"
            />
          </label>

          <div class="arc-pantheon-grid is-three">
            <label class="arc-field">
              <span class="arc-label">Tempio</span>
              <input class="in" :value="cultValue(part, 'Tempio')" @input="setCult(index, part, 'Tempio', $event)" />
            </label>
            <label class="arc-field">
              <span class="arc-label">Rituali</span>
              <input class="in" :value="cultValue(part, 'Rituali')" @input="setCult(index, part, 'Rituali', $event)" />
            </label>
            <label class="arc-field">
              <span class="arc-label">Seguaci</span>
              <input class="in" :value="cultValue(part, 'Seguaci')" @input="setCult(index, part, 'Seguaci', $event)" />
            </label>
          </div>
        </div>
      </template>

      <template v-else>
        <header class="arc-pantheon-card-head is-static">
          <span class="arc-pantheon-glyph">📜</span>
          <strong>Sezione speciale</strong>
          <span class="arc-pantheon-epithet">markdown preservato</span>
        </header>
        <div class="arc-pantheon-card-body">
          <textarea class="in arc-pantheon-raw" rows="8" :value="part.raw" @input="updateRaw(index, value($event))" />
        </div>
      </template>
    </article>
  </section>
</template>

<style scoped>
.arc-pantheon-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}
.arc-pantheon-head h2 {
  font-family: 'Cinzel', serif;
  font-size: 16px;
  color: var(--accent, #c89b3c);
  margin-bottom: 4px;
}
.arc-pantheon-card {
  border: 1px solid rgba(200, 155, 60, 0.16);
  border-radius: 8px;
  margin-bottom: 10px;
  background: rgba(200, 155, 60, 0.025);
  overflow: hidden;
}
.arc-pantheon-card-head {
  display: flex;
  align-items: baseline;
  gap: 9px;
  padding: 10px 12px;
  cursor: pointer;
  min-height: 42px;
}
.arc-pantheon-card-head.is-static {
  cursor: default;
}
.arc-pantheon-glyph {
  font-size: 16px;
}
.arc-pantheon-card-head strong {
  font-family: 'Cinzel', serif;
  font-size: 13px;
  color: var(--text, #e8dcc0);
}
.arc-pantheon-epithet {
  font-size: 12px;
  color: var(--text-muted, #b0a080);
  font-style: italic;
}
.arc-pantheon-tools {
  margin-left: auto;
  display: flex;
  gap: 2px;
}
.arc-pantheon-card-body {
  padding: 0 12px 14px;
  border-top: 1px solid rgba(200, 155, 60, 0.1);
}
.arc-pantheon-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.arc-pantheon-grid.is-three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.arc-pantheon-card-body .arc-field {
  margin-top: 12px;
}
.arc-pantheon-raw {
  width: 100%;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
@media (max-width: 900px) {
  .arc-pantheon-grid,
  .arc-pantheon-grid.is-three {
    grid-template-columns: 1fr;
  }
}
</style>
