<template>
  <v-layout>
    <v-app-bar density="compact">
      <v-app-bar-title>ModSynth</v-app-bar-title>
    </v-app-bar>

    <v-main class="d-flex h-100">
      <v-sheet
        border
        @dragover="baseDragOver"
        @drop="baseDrop"
      >
        <v-container
        >
          <v-row>
            <v-col v-for="(module, id) in modules" :key="id">
              <v-sheet>
                <Module
                  draggable="true"
                  :data-id="id"
                  :key="id"
                  :name="module.name"
                  :controls="module.controls"
                  :jacks="module.jacks"
                  @dragstart="baseDragStart"
                />
              </v-sheet>
            </v-col>
          </v-row>
        </v-container>
      </v-sheet>
      <v-sheet
        class="flex-grow-1 h-screen"
        @dragover="dragOver"
        @drop="drop"
      >
        <Module
          v-for="(module, idx) in enabledModules"
          draggable="true"
          class="enabledModule"
          :key="idx"
          :data-id="module.id"
          :data-idx="idx"
          :idx="idx"
          :name="module.name"
          :controls="module.controls"
          :jacks="module.jacks"
          :style="{
            position: 'absolute',
            left: module.pos.x + 'px',
            top: module.pos.y + 'px'
          }"
          @dragstart="dragStart"
        />
      </v-sheet>
      <v-sheet class="flex-shrink-1">
        <Jack name="Output" dataKey="master.output" />
      </v-sheet>
      <svg
        width="100%"
        height="100%"
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
import { reactive, computed, nextTick } from 'vue'

import { useCableStore } from './stores/CableStore'

import Jack from './components/Jack.vue'
import Module from './components/Module.vue'

const cableStore = useCableStore()

const cables = computed(() => cableStore.cablesData)

const modules = {
  volume: {
    name: 'Volume',
    controls: [
      {
        name: 'Volume',
        min: 0,
        max: 100,
        value: 50
      }
    ],
    jacks: [
      {
        name: 'Input'
      },
      {
        name: 'Output'
      }
    ]
  }
}

const mimes = {
  moduleId: 'application/msmodule.id',
  moduleType: 'application/msmodule.type',
  moduleIdx: 'application/msmodule.idx',
  moduleDragOffsetX: 'application/msmodule.dox',
  moduleDragOffsetY: 'application/msmodule.doy'
}

const types = {
  base: 'base',
  enabled: 'enabled'
}

let enabledModules = reactive([])

function baseDragStart(event) {
  event.dataTransfer.setData(mimes.moduleId, event.target.dataset.id)
  event.dataTransfer.setData(mimes.moduleType, types.base)
  event.dataTransfer.setData(
    mimes.moduleDragOffsetX,
    event.clientX - event.target.getBoundingClientRect().left
  )
  event.dataTransfer.setData(
    mimes.moduleDragOffsetY,
    event.clientY - event.target.getBoundingClientRect().top
  )
}

function baseDragOver(event) {
  if(event.dataTransfer.types.includes(mimes.moduleType)) {
    event.preventDefault()
  }
}

function baseDrop(event) {
  if(event.dataTransfer.types.includes(mimes.moduleType)) {
    if(event.dataTransfer.getData(mimes.moduleType) == types.enabled) {
      const idx = event.dataTransfer.getData(mimes.moduleIdx)
      enabledModules.splice(idx, 1)
      nextTick(() => {
        cableStore.updateCables()
      })
    }
  }
}

function dragStart(event) {
  event.dataTransfer.setData(mimes.moduleType, types.enabled)
  event.dataTransfer.setData(mimes.moduleIdx, event.target.dataset.idx)
  event.dataTransfer.setData(
    mimes.moduleDragOffsetX,
    event.clientX - event.target.getBoundingClientRect().left
  )
  event.dataTransfer.setData(
    mimes.moduleDragOffsetY,
    event.clientY - event.target.getBoundingClientRect().top
  )
}

function dragOver(event) {
  if(event.dataTransfer.types.includes(mimes.moduleType)) {
    event.preventDefault()
  }
}

function drop(event) {
  if(event.dataTransfer.types.includes(mimes.moduleType) && !event.dataTransfer.types.includes(cableStore.mimes.cableId1)) {
    const offsetX = event.dataTransfer.getData(mimes.moduleDragOffsetX)
    const offsetY = event.dataTransfer.getData(mimes.moduleDragOffsetY)

    switch(event.dataTransfer.getData(mimes.moduleType)) {
      case types.base:
        const id = event.dataTransfer.getData(mimes.moduleId)

        let module = structuredClone(modules[id])

        module.id = id
        module.pos = {
          x: event.clientX - offsetX,
          y: event.clientY - offsetY
        }

        enabledModules.push(module)
        break

      case types.enabled:
        const idx = event.dataTransfer.getData(mimes.moduleIdx)

        enabledModules[idx].pos = {
          x: event.clientX - offsetX,
          y: event.clientY - offsetY
        }

        nextTick(() => {
          cableStore.updateCables()
        })
        break
    }
  }
}
</script>
