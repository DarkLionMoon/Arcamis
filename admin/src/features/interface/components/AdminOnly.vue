<script setup lang="ts">
import { computed } from 'vue'

import { useAuthStore } from '@/app/store'
import { canAccess, deniedMessage, roleLabel, type RequiredRole } from '@/app/router/roles'

/** La rotta è già protetta dal guard: questo gate evita che un ruolo
    inferiore veda pannelli che chiamerebbero API destinate ai soli admin. */
const props = withDefaults(defineProps<{ required?: RequiredRole }>(), { required: 'admin' })

const auth = useAuthStore()
const allowed = computed(() => canAccess(auth.role, props.required))
</script>

<template>
  <template v-if="allowed">
    <slot />
  </template>
  <div v-else class="arc-alert" role="status">
    {{ deniedMessage(required) }}. Il tuo ruolo è {{ roleLabel(auth.role) }}.
  </div>
</template>
