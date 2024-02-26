<template>
  <v-sheet class="rounded" border="md" style="max-width: 280px;">
    <v-container>
      <v-row>
        <v-col class="text-center">
          {{ props.name }}
        </v-col>
      </v-row>
      <v-row v-for="monitor in props.monitors" :key="monitor.id">
        <v-col cols="12">
          <v-sheet>
            <div class="text-center">{{ monitor.name }}</div>
            <canvas
              :id="`m${props.idx}.monitor.${monitor.id}`"
              :width="monitor.width"
              :height="monitor.height"
              style="background-color: black;"
            ></canvas>
          </v-sheet>
        </v-col>
      </v-row>
      <v-row no-gutters justify="center">
        <v-col
          v-for="control in props.controls"
          :key="control.name"
          :cols="getCols(control.component)"
        >
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
          <v-select
            v-if="control.component === 'VSelect'"
            density="compact"
            v-model="control.value"
            :class="control.id"
            :label="control.name"
            :items="control.items"
            item-title="name"
            variant="outlined"
            @update:modelValue="event => { moduleStore.updateValue(props.idx, control.id, event) }"
          >
            <template v-slot:selection="{ item, index }">
              <v-list-item v-bind="props">
                <template v-slot:title>
                  <img v-if="typeof item.raw === 'object'" :src="item.raw.image" style="height: 2em;">
                  <span v-if="typeof item.raw === 'string'">{{ item.raw }}</span>
                </template>
              </v-list-item>
            </template>
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props">
                <template v-slot:title>
                  <img v-if="typeof item.raw === 'object'" :src="item.raw.image" style="height: 2em;">
                  <span v-if="typeof item.raw === 'string'">{{ item.raw }}</span>
                </template>
              </v-list-item>
            </template>
          </v-select>
          <Knob
            v-if="control.component === 'Knob'"
            v-model="control.value"
            :class="control.id"
            :label="control.name"
            :min="control.min"
            :max="control.max"
            :step="control.step"
            :si="control.si"
            :disabled="control.disabled"
            :change="value => { moduleStore.updateValue(props.idx, control.id, value) }"
          />
          <v-file-input
            v-if="control.component === 'VFileInput'"
            accept="audio/*"
            variant="outlined"
            :class="control.id"
            :label="control.name"
            @update:modelValue="file => { moduleStore.updateValue(props.idx, control.id, file[0]) }"
          >
          </v-file-input>
          <audio
            v-if="control.component === 'audio'"
            :class="control.id"
            :id="`m${props.idx}.${control.id}`"
            :data-moduleidx="props.idx"
            :data-id="control.id"
          ></audio>
          <v-btn
            v-if="control.component === 'VBtn'"
            variant="outlined"
            :class="control.id"
            :active="control.active"
            :disabled="control.disabled"
            @click="event => { moduleStore.updateValue(props.idx, control.id, null) }"
          >
            {{ control.name }}
          </v-btn>
          <v-slider
            v-if="control.component === 'VSlider'"
            v-model="control.value"
            :class="control.id"
            :label="control.name"
            :min="control.min"
            :max="control.max"
            :step="control.step"
            @update:modelValue="value => { moduleStore.updateValue(props.idx, control.id, value) }"
          ></v-slider>
        </v-col>
      </v-row>
      <v-row no-gutters>
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
  'monitors',
  'jacks',
  'idx'
])

function getCols(component: string) {
  const cols = {
    Knob: 3,
    VBtn: 4
  }

  if(component in cols) {
    return cols[component]
  } else {
    return 12
  }
}
</script>
