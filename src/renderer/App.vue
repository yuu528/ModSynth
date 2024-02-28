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
      >
        <template v-for="idx in enabledModulesOrder">
          <Module
            v-if="enabledModules[idx] !== undefined && enabledModules[idx].data !== undefined && enabledModules[idx].data.pos !== undefined"
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
          :d="`M ${cable.p1.x} ${cable.p1.y} L ${cable.p2.x} ${cable.p2.y}`"
          stroke="black"
          stroke-width="2"
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

const moduleTab = ref(null)

let modulesByCategory: { [category: string]: ModuleClass[] } = {}

for(const module of moduleStore.modules) {
  if(module.data === undefined) continue

  if(!(module.data.category in modulesByCategory)) {
    modulesByCategory[module.data.category] = []
  }

  modulesByCategory[module.data.category].push(module as ModuleClass)
}

const enabledModulesOrder = computed(() => moduleStore.enabledModulesOrder)

const enabledModules = computed(() => moduleStore.enabledModules)

window.addEventListener('resize', cableStore.updateCables)
</script>
