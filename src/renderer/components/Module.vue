<template>
  <v-sheet class="rounded" border="md" style="max-width: 232px;">
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
          style="max-width: 100%;"
        >
          <v-text-field
            v-if="control.component === Component.TextField"
            type="number"
            density="compact"
            v-model="control.value"
            :class="control.id"
            :label="control.name"
            :min="control.min"
            :max="control.max"
            :step="control.step"
            @update:modelValue="value => { moduleStore.updateValue(props.idx, control.id, value) }"
          >
          </v-text-field>
          <Select
            v-if="control.component === Component.Select"
            v-model="control.value"
            :class="control.id"
            :label="control.name"
            :items="control.items"
            :update="(value: string) => { moduleStore.updateValue(props.idx, control.id, value) }"
          />
          <Knob
            v-if="control.component === Component.Knob"
            v-model="control.value"
            :class="control.id"
            :label="control.name"
            :min="control.min"
            :max="control.max"
            :step="control.step"
            :si="control.si"
            :disabled="control.disabled"
            :valueLabels="control.valueLabels"
            :valueUnit="control.valueUnit"
            :change="(value: number) => { moduleStore.updateValue(props.idx, control.id, value) }"
          />
          <v-file-input
            v-if="control.component === Component.FileInput"
            accept="audio/*"
            variant="outlined"
            :class="control.id"
            :label="control.name"
            @update:modelValue="file => { moduleStore.updateValue(props.idx, control.id, file[0]) }"
          >
          </v-file-input>
          <audio
            v-if="control.component === Component.Audio"
            :class="control.id"
            :id="`m${props.idx}.${control.id}`"
            :data-moduleidx="props.idx"
            :data-id="control.id"
          ></audio>
          <v-btn
            v-if="control.component === Component.Btn"
            variant="outlined"
            :class="control.id"
            :active="control.active"
            :disabled="control.disabled"
            @click="() => { moduleStore.updateValue(props.idx, control.id, 0) }"
          >
            {{ control.name }}
          </v-btn>
          <v-slider
            v-if="control.component === Component.Slider"
            v-model="control.value"
            :class="control.id"
            :label="control.name"
            :min="control.min"
            :max="control.max"
            :step="control.step"
            @update:modelValue="value => { moduleStore.updateValue(props.idx, control.id, value) }"
          ></v-slider>
          <Progress
            v-if="control.component === Component.Progress"
            v-model="control.value"
            :class="control.id"
            :label="control.name"
            :min="control.min"
            :max="control.max"
            :valueUnit="control.valueUnit"
            :color="control.color"
            :bgColor="control.bgColor"
          />
          <Pilot
            v-if="control.component === Component.Pilot"
            v-model="control.value"
            :class="control.id"
            :label="control.name"
            :color="control.color"
            :colorOff="control.colorOff"
          />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col
          v-for="jack in props.jacks"
          :key="jack.name"
          style="max-width: 100%;"
        >
          <Jack :name="jack.name" :dataKey="`m${props.idx}.${jack.name}`" :dataId="jack.id" :dataType="jack.type" :dataIdx="jack.index" :dataModuleIdx="props.idx" />
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
</template>

<script setup lang="ts">
import { useModuleStore } from '../stores/ModuleStore'

import Component from '../scripts/enum/Component'

import Knob from './Knob.vue'
import Jack from './Jack.vue'
import Progress from './Progress.vue'
import Select from './Select.vue'
import Pilot from './Pilot.vue'

const moduleStore = useModuleStore()

const props = defineProps([
  'name',
  'controls',
  'monitors',
  'jacks',
  'idx'
])

function getCols(component: Component) {
  switch(component) {
    case Component.Knob:
      return 3

    case Component.Pilot:
      return 3

    default:
      return 12
  }
}
</script>
