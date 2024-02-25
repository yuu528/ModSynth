<template>
  <v-sheet class="rounded" border="md">
    <v-container>
      <v-row>
        <v-col class="text-center">
          {{ props.name }}
        </v-col>
      </v-row>
      <v-row>
        <v-col v-for="control in props.controls" :key="control.name">
          <v-text-field
            v-if="control.component === 'VTextField'"
            type="number"
            density="compact"
            v-model="control.value"
            :class="control.id"
            :label="control.name"
            :min="control.min"
            :max="control.max"
            :step="control.step"
            @change="event => { moduleStore.updateValue(props.idx, control.id, event.target.value) }"
          >
          </v-text-field>
          <Knob
            v-if="control.component === 'Knob'"
            v-model="control.value"
            :class="control.id"
            :label="control.name"
            :min="control.min"
            :max="control.max"
            :step="control.step"
            :change="value => { moduleStore.updateValue(props.idx, control.id, value) }"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col v-for="jack in props.jacks" :key="jack.name">
          <Jack :name="jack.name" :dataKey="`m${props.idx}.${jack.name}`" :dataType="jack.type" :dataModuleIdx="props.idx" />
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
</template>

<script setup lang="ts">
import { useModuleStore } from '../stores/ModuleStore'

import Knob from './Knob.vue'
import Jack from './Jack.vue'

const moduleStore = useModuleStore()

const props = defineProps([
  'name',
  'controls',
  'jacks',
  'idx'
])
</script>
