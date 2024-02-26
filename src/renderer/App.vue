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

        <v-sheet>
          <v-window v-model="moduleTab">
            <v-window-item
              v-for="(modules, category) in modulesByCategory"
              :key="category"
              :value="category"
            >
              <v-sheet v-for="(module, id) in modules" :key="id">
                <Module
                  draggable="true"
                  :data-id="id"
                  :key="id"
                  :name="module.name"
                  :controls="module.controls"
                  :monitors="module.monitors"
                  :jacks="module.jacks"
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
        class="flex-grow-1"
        @dragover="moduleStore.dragOver"
        @drop="moduleStore.drop"
      >
        <template v-for="(module, idx) in enabledModules">
          <Module
            v-if="module !== undefined"
            draggable="true"
            class="enabledModule"
            :key="idx"
            :data-id="module.id"
            :data-idx="idx"
            :idx="idx"
            :name="module.name"
            :controls="module.controls"
            :monitors="module.monitors"
            :jacks="module.jacks"
            :style="{
              position: 'absolute',
              left: module.pos.x + 'px',
              top: module.pos.y + 'px'
            }"
            @dragstart="moduleStore.dragStart"
            @dragend="moduleStore.dragEnd"
          />
        </template>
      </v-sheet>
      <v-sheet class="flex-shrink-1">
        <Jack name="Speaker" dataKey="master.output" :dataType="moduleStore.jackTypes.audioInput" />
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
import { reactive, computed, ref } from 'vue'

import { useCableStore } from './stores/CableStore'
import { useModuleStore } from './stores/ModuleStore'

import Jack from './components/Jack.vue'
import Module from './components/Module.vue'

const cableStore = useCableStore()
const moduleStore = useModuleStore()

const cables = computed(() => cableStore.cablesData)

const moduleTab = ref(null)

let modulesByCategory = {}
for(const key of Object.keys(moduleStore.modules)) {
  const module = moduleStore.modules[key]
  if(!(module.category in modulesByCategory)) {
    modulesByCategory[module.category] = {}
  }

  modulesByCategory[module.category][key] = module
}

console.log(modulesByCategory)

const enabledModules = computed(() => moduleStore.enabledModules)
</script>
