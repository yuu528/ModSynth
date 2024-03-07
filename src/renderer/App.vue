<template>
  <v-layout>
    <v-system-bar class="d-flex justify-start">
      <v-btn v-for="menu in menus" variant="text" class="text-none h-100 menuBtn">
        {{ menu.name }}

        <v-menu activator="parent">
          <v-list density="compact">
            <v-list-item
              v-for="(item, index) in menu.items"
              :key="index"
              :value="index"
              @click="menuClick(menu.name, item)"
            >
              <v-list-item-title>{{ item }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>
    </v-system-bar>
    <v-app-bar density="compact">
      <v-spacer></v-spacer>
      <Jack name="Speaker" dataKey="master.output" :dataType="JackType.AUDIO_INPUT" />
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
      <svg
        width="100%"
        height="100%"
        id="cable-svg"
        style="
        position: absolute;
        top: 0;
        left: 0;
        z-index: 2000;
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
      <v-dialog v-model="alertVisible">
        <v-card>
          <v-card-title>{{ computedAlertData.title }}</v-card-title>
          <v-card-text>{{ computedAlertData.text }}</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn
              v-for="button in computedAlertData.buttons"
              @click="button.fn"
            >
              {{ button.text }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'

import { useCableStore, Cable } from './stores/CableStore'
import { useModuleStore } from './stores/ModuleStore'

import JackType from './scripts/enum/JackType'

import ModuleClass from './scripts/module/Module'

import Jack from './components/Jack.vue'
import Module from './components/Module.vue'

const menus = [
  {
    name: 'File',
    items: [
      'New',
      'Open',
      'Save'
    ]
  }
]

const cableStore = useCableStore()
const moduleStore = useModuleStore()

const cables = computed(() => cableStore.cablesData)
const moduleTab = ref<string | null>(null)
const modulesByCategory = ref<{[category: string]: ModuleClass[]}>({})
const enabledModulesOrder = computed(() => moduleStore.enabledModulesOrder)
const enabledModules = computed(() => moduleStore.enabledModules)

const alertVisible = ref(false)
const alertData = {
  title: '',
  text: '',
  buttons: [
    {
      text: '',
      fn: (): void => {}
    }
  ]
}
const computedAlertData = computed(() => alertData)

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

function openAlert(title: string, text: string, buttons: {text: string, fn: () => {}}[]) {
  alertData.title = title
  alertData.text = text
  alertData.buttons = buttons
  alertVisible.value = true
}

function closeAlert() {
  alertVisible.value = false
}

function menuClick(menuName: string, itemName: string) {
  switch(menuName) {
    case 'File':
      switch(itemName) {
        case 'New':
          if(moduleStore.edited) {
            openAlert(
              'Confirm',
              'Are you sure you want to create a new project? All unsaved changes will be lost.',
              [
                {
                  text: 'Yes',
                  fn: () => {
                    newProject()
                    closeAlert()
                  }
                },
                {
                  text: 'No',
                  fn: () => {
                    closeAlert()
                  }
                }
              ]
            )
          } else {
            newProject()
          }
        break

        case 'Open':
          if(moduleStore.edited) {
            openAlert(
              'Confirm',
              'Are you sure you want to open a new project? All unsaved changes will be lost.',
              [
                {
                  text: 'Yes',
                  fn: () => {
                    loadFromFile()
                    closeAlert()
                  }
                },
                {
                  text: 'No',
                  fn: () => {
                    closeAlert()
                  }
                }
              ]
            )
          } else {
            loadFromFile()
          }
        break

        case 'Save':
          saveToFile()
        break
      }
    break
  }
}

function newProject() {
  moduleStore.enabledModules.forEach((module, idx) => {
    moduleStore.remove(idx)
  })
  moduleStore.edited = false
}

function loadFromFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.addEventListener('change', event => {
    if(event.target === null) return
    const target = event.target as HTMLInputElement

    if(target.files === null) return
    const file = target.files[0]
    const reader = new FileReader()
    reader.onload = () => {
      const data = JSON.parse(reader.result as string)

      newProject()

      data.modules.forEach((module: ModuleClass) => {
        if(module === null || module === undefined) return

        const base = moduleStore.getModuleBase(module.data.id).clone()

        base.data.controls = module.data.controls

        moduleStore.add(base, module.data.idx)
      })

      moduleStore.enabledModulesOrder = data.order

      nextTick(() => {
        data.cables.forEach((cable: Cable) => {
          cableStore.add(cable.j1, cable.j2)
        })
      })
    }

    reader.readAsText(file)
  })
  input.click()
}

function saveToFile() {
  const data = {
    modules: moduleStore.enabledModules,
    order: moduleStore.enabledModulesOrder,
    cables: cableStore.cables
  }

  const json = JSON.stringify(data, (key, value) => {
    switch(key) {
      case 'data':
        return {
          controls: value.controls,
          id: value.id,
          idx: value.idx
        }

      case 'inputs': return undefined
      case 'intNodes': return undefined
      case 'outputs': return undefined
      case 'moduleStore': return undefined
      case 'cableStore': return undefined
      default: return value
    }
  })

  const blob = new Blob([json], {type: 'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.download = 'new_project.json'
  a.href = url
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
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

<style scoped>
.menuBtn {
  min-width: 0;
  padding: 0 0.5em;
}
</style>
