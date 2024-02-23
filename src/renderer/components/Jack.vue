<template>
  <div class="text-center">
    <v-avatar color="black" size="x-small">
    </v-avatar>

    <div class="text-caption">
      {{ props.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps([
  'name',
  'dragOverFn',
  'dropFn'
])
</script>
