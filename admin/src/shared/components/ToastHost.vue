<script setup lang="ts">
import { useUIStore } from '@/app/store'

const ui = useUIStore()

const ICONS: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i'
}
</script>

<template>
  <!-- aria-live: gli avvisi vengono annunciati dagli screen reader.
       polite per gli esiti positivi, assertive per gli errori. -->
  <div class="arc-toasts" role="status" aria-live="polite">
    <transition-group name="arc-toast">
      <div
        v-for="t in ui.toasts"
        :key="t.id"
        class="arc-toast"
        :class="'arc-toast--' + t.type"
        :role="t.type === 'error' ? 'alert' : 'status'"
        tabindex="0"
        @mouseenter="ui.holdToast(t.id)"
        @mouseleave="ui.releaseToast(t.id)"
        @focusin="ui.holdToast(t.id)"
        @focusout="ui.releaseToast(t.id)"
      >
        <span class="arc-toast-ico" aria-hidden="true">{{ ICONS[t.type] || 'i' }}</span>
        <span class="arc-toast-body">
          <span v-if="t.title" class="arc-toast-title">{{ t.title }}</span>
          <span class="arc-toast-msg">{{ t.message }}</span>
        </span>
        <button class="arc-toast-x" type="button" :aria-label="'Chiudi avviso'" @click="ui.dismissToast(t.id)">
          ✕
        </button>
        <span class="arc-toast-timer" :style="{ animationDuration: t.duration + 'ms' }" aria-hidden="true"></span>
      </div>
    </transition-group>
  </div>
</template>
