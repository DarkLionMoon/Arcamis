<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import { confirmState, resolveConfirm } from '@/shared/confirm'

const typed = ref('')
const input = ref<HTMLInputElement | null>(null)

const needsKeyword = computed(() => !!confirmState.value?.keyword)
const matches = computed(() => {
  const keyword = confirmState.value?.keyword
  if (!keyword) return true
  return typed.value.trim() === keyword
})

watch(
  () => confirmState.value?.id,
  async (id) => {
    typed.value = ''
    if (!id) return
    await nextTick()
    input.value?.focus()
  }
)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    resolveConfirm(false)
    return
  }
  if (e.key === 'Enter' && matches.value) {
    e.preventDefault()
    resolveConfirm(true)
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="confirmState"
      class="arc-modal-backdrop"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="'arc-confirm-title'"
      @click.self="resolveConfirm(false)"
      @keydown="onKeydown"
    >
      <div class="arc-modal arc-confirm" :class="{ 'arc-modal--danger': confirmState.danger }" tabindex="-1">
        <h2 id="arc-confirm-title" class="arc-modal-title">
          {{ confirmState.title || (confirmState.danger ? 'Conferma eliminazione' : 'Conferma') }}
        </h2>
        <p class="arc-modal-text">{{ confirmState.message }}</p>
        <p v-if="confirmState.detail" class="arc-modal-detail">{{ confirmState.detail }}</p>

        <label v-if="needsKeyword" class="arc-modal-keyword">
          <span
            >Digita <code>{{ confirmState.keyword }}</code> per confermare</span
          >
          <input
            ref="input"
            v-model="typed"
            class="in"
            type="text"
            autocomplete="off"
            spellcheck="false"
            :placeholder="confirmState.keyword"
          />
        </label>

        <div class="arc-modal-actions">
          <button class="btn btn-soft" type="button" @click="resolveConfirm(false)">
            {{ confirmState.cancelLabel || 'Annulla' }}
          </button>
          <button
            class="btn"
            :class="confirmState.danger ? 'btn-d' : 'btn-p'"
            type="button"
            :disabled="!matches"
            @click="resolveConfirm(true)"
          >
            {{ confirmState.confirmLabel || 'Conferma' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
