<script setup lang="ts">
/** Righe "scheletro" mostrate durante il caricamento, al posto della
 *  riga "Caricamento…" che faceva collassare la tabella. */
withDefaults(
  defineProps<{
    rows?: number
    cols: number
    label?: string
  }>(),
  { rows: 4, label: 'Caricamento in corso' }
)
</script>

<template>
  <tbody class="arc-skel" :aria-busy="'true'" :aria-label="label">
    <tr v-for="r in rows" :key="r">
      <td v-for="c in cols" :key="c">
        <span class="arc-skel-bar" :style="{ width: c === 1 ? '42%' : c === cols ? '30%' : '62%' }"></span>
      </td>
    </tr>
  </tbody>
</template>
