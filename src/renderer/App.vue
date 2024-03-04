<template>
  <v-layout>
    <v-app-bar density="compact">
      <v-app-bar-title>ModSynth</v-app-bar-title>
    </v-app-bar>

    <v-main class="d-flex h-screen">
      <v-sheet
        border
        @dragover="moduleStore.baseDragOver"
        @drop="moduleStore.baseDrop"
      >
        <v-tabs v-model="moduleTab" align-tabs="center">
          <v-tab v-for="(modules, category) in modulesByCategory" :key="category" :value="category">
            {{ category }}
          </v-tab>
        </v-tabs>

        <v-sheet class="overflow-y-auto" style="height: calc(100% - 48px)">
          <v-window v-model="moduleTab">
            <v-window-item
              v-for="(modules, category) in modulesByCategory"
              :key="category"
              :value="category"
            >
              <v-sheet v-for="module in modules" :key="module.data?.id">
                <Module
                  v-if="module.data !== undefined"
                  draggable="true"
                  :data-id="module.data.id"
                  :key="module.data.id"
                  :name="module.data.name"
                  :controls="module.data.controls"
                  :monitors="module.data.monitors"
                  :jacks="module.data.jacks"
                  @dragstart="moduleStore.baseDragStart"
                  @dragend="moduleStore.dragEnd"
                  style="transform: scale(0.8);"
                />
              </v-sheet>
            </v-window-item>
          </v-window>
        </v-sheet>
      </v-sheet>
      <v-sheet
        id="moduleCase"
        class="flex-grow-1 h-100 overflow-y-auto d-flex flex-wrap"
        @dragover="moduleStore.dragOver"
        @drop="moduleStore.drop"
        @scroll="cableStore.updateCables"
      >
        <template v-for="idx in enabledModulesOrder">
          <Module
            v-if="enabledModules[idx] !== undefined && enabledModules[idx].data !== undefined"
            draggable="true"
            class="enabledModule"
            :key="idx"
            :data-id="enabledModules[idx].data.id"
            :data-idx="idx"
            :idx="idx"
            :name="enabledModules[idx].data.name"
            :controls="enabledModules[idx].data.controls"
            :monitors="enabledModules[idx].data.monitors"
            :jacks="enabledModules[idx].data.jacks"
            @dragstart="moduleStore.dragStart"
            @dragend="moduleStore.dragEnd"
            @dragover="moduleStore.enabledDragOver"
            @drop="moduleStore.enabledDrop"
          />
        </template>
      </v-sheet>
      <v-sheet class="flex-shrink-1">
        <Jack name="Speaker" dataKey="master.output" :dataType="JackType.AUDIO_INPUT" />
      </v-sheet>
      <svg
        width="100%"
        height="100%"
        id="cable-svg"
        style="
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        "
      >
        <path
          v-for="cable in cables"
          :d="calcPath(cable.p1.x, cable.p1.y, cable.p2.x, cable.p2.y)"
          stroke="black"
          stroke-width="2"
          fill="transparent"
        />
      </svg>
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { useCableStore } from './stores/CableStore'
import { useModuleStore } from './stores/ModuleStore'

import JackType from './scripts/enum/JackType'

import ModuleClass from './scripts/module/Module'

import Jack from './components/Jack.vue'
import Module from './components/Module.vue'

const cableStore = useCableStore()
const moduleStore = useModuleStore()

const cables = computed(() => cableStore.cablesData)
const moduleTab = ref<string | null>(null)
const modulesByCategory = ref<{[category: string]: ModuleClass[]}>({})
const enabledModulesOrder = computed(() => moduleStore.enabledModulesOrder)
const enabledModules = computed(() => moduleStore.enabledModules)

init()

async function init() {
  await moduleStore.init()

  for(const module of moduleStore.modules) {
    if(module.data === undefined) continue

    if(!(module.data.category in modulesByCategory.value)) {
      modulesByCategory.value[module.data.category] = []
    }

    modulesByCategory.value[module.data.category].push(module as ModuleClass)
  }

  moduleTab.value = Object.keys(modulesByCategory.value)[0]

  window.addEventListener('resize', cableStore.updateCables)
}

function calcPath(x1: number, y1: number, x2: number, y2: number) {
  const yg = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / 4
  const xg = Math.abs(x2 - x1) / 6

  let cx1
  let cx2
  let cy1 = y1 + yg
  let cy2 = y2 + yg

  if(x1 < x2) {
    cx1 = x1 + xg
    cx2 = x2 - xg
  } else {
    cx1 = x1 - xg
    cx2 = x2 + xg
  }

  const d = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2}, ${y2}`

  return d
}
</script>
