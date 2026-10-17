<script setup lang="ts">
import ConfirmHost from '@/shared/components/ConfirmHost.vue'
</script>

<template>
  <router-view />
  <!-- Modale di conferma globale: sostituisce window.confirm() in tutto il pannello. -->
  <ConfirmHost />
</template>
