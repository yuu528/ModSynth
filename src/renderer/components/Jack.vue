<template>
  <div class="text-center">
    <v-avatar
      color="black"
      size="x-small"
      ref="jack"
      draggable="true"
      :data-id="props.dataKey"
      :data-type="props.dataType"
      :data-moduleIdx="props.dataModuleIdx"
      @dragstart="cableStore.dragStart"
      @dragover="cableStore.dragOver"
      @dragend="cableStore.dragEnd"
      @drop="cableStore.drop"
      @mouseenter="mouseEnter"
      @mouseout="mouseOut"
      @click="cableStore.click"
    >
    </v-avatar>

    <div class="text-caption">
      {{ props.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

import { useCableStore } from '../stores/CableStore'

const cableStore = useCableStore()

const jack = ref()

onMounted(() => {
  cableStore.registerJack(jack.value.$el)
})

const props = defineProps([
  'name',
  'dataKey',
  'dataType',
  'dataModuleIdx'
])

function mouseEnter(event: MouseEvent) {
  if(event.target === null) return

  const module = (event.target as HTMLElement).closest('.enabledModule')
  if(module !== null) {
    module.setAttribute('draggable', 'false')
  }
}

function mouseOut(event: MouseEvent) {
  if(event.target === null) return

  const module = (event.target as HTMLElement).closest('.enabledModule')
  if(module !== null) {
    module.setAttribute('draggable', 'true')
  }
}
</script>
