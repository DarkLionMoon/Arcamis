<script setup lang="ts">
import { computed } from 'vue'

import { icons, type IconName } from '@/shared/icons'

const props = withDefaults(defineProps<{ name: IconName | string; size?: number }>(), {
  size: 18
})

const inner = computed(() => icons[props.name] || icons.sparkle)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="inner"
  ></svg>
</template>