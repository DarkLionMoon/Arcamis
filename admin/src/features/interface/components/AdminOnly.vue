<script setup lang="ts">
import { useAuthStore } from '@/app/store'

const auth = useAuthStore()
</script>

<template>
  <div v-if="!auth.isAdmin" class="arc-alert">Solo gli amministratori possono accedere a questa sezione.</div>
  <template v-if="auth.isAdmin">
    <slot />
  </template>
</template>