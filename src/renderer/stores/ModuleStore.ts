import { ref, toRaw, nextTick } from 'vue'
import { defineStore } from 'pinia'

import { useCableStore } from './CableStore'

import { NumberUtil } from '../scripts/util/NumberUtil'

import ModuleType from '../scripts/enum/ModuleType'

import AudioPlayer from '../scripts/module/AudioPlayer'
import InputDevice from '../scripts/module/InputDevice'
import Monitor from '../scripts/module/Monitor'
import Oscillator from '../scripts/module/Oscillator'
import Volume from '../scripts/module/Volume'

export const useModuleStore = defineStore('module', () => {
	const cableStore = useCableStore()

	const mimes = ref({
		moduleId: 'application/msmodule.id',
		moduleType: 'application/msmodule.type',
		moduleIdx: 'application/msmodule.idx',
		moduleDragOffsetX: 'application/msmodule.dox',
		moduleDragOffsetY: 'application/msmodule.doy'
	})

	const modules = ref([
		new AudioPlayer(),
		new InputDevice(),
		new Monitor(),
		new Oscillator(),
		new Volume()
	])

	const enabledModules = ref([])

	const audioCtx = ref(new window.AudioContext())

	async function add(module) {
		const idx = enabledModules.value.push(module) - 1

		nextTick(() => {
			module.onEnable(idx)
		})
	}

	function remove(idx) {
		enabledModules.value[idx].input?.disconnect()
		enabledModules.value[idx].output?.disconnect()
		delete enabledModules.value[idx]
		nextTick(() => {
			cableStore.updateCables()
		})
	}

	async function updateValue(idx, id, value) {
		const module = enabledModules.value[idx]

		if(module !== undefined) {
			module.updateValue(idx, id, value)
		}
	}

	function getModuleBase(id: string) {
		return modules.value.find(module => module.data.id === id)
	}

	function getModuleBaseIdx(id: string) {
		return modules.value.findIndex(module => module.data.id === id)
	}

	function baseDragStart(event) {
		event.dataTransfer.setData(mimes.value.moduleId, event.target.dataset.id)
		event.dataTransfer.setData(mimes.value.moduleType, ModuleType.BASE)
		event.dataTransfer.setData(
			mimes.value.moduleDragOffsetX,
			event.clientX - event.target.getBoundingClientRect().left - window.scrollX
		)
		event.dataTransfer.setData(
			mimes.value.moduleDragOffsetY,
			event.clientY - event.target.getBoundingClientRect().top - window.scrollY
		)
	}

	function baseDragOver(event) {
		if(event.dataTransfer.types.includes(mimes.value.moduleType)) {
			event.preventDefault()
		}
	}

	function baseDrop(event) {
		if(event.dataTransfer.types.includes(mimes.value.moduleType)) {
			if(event.dataTransfer.getData(mimes.value.moduleType) == ModuleType.ENABLED) {
				const idx = event.dataTransfer.getData(mimes.value.moduleIdx)
				remove(idx)
			}
		}
	}

	function dragStart(event) {
		event.dataTransfer.setData(mimes.value.moduleType, ModuleType.ENABLED)
		event.dataTransfer.setData(mimes.value.moduleIdx, event.target.dataset.idx)
		event.dataTransfer.setData(
			mimes.value.moduleDragOffsetX,
			event.clientX - event.target.getBoundingClientRect().left - window.scrollX
		)
		event.dataTransfer.setData(
			mimes.value.moduleDragOffsetY,
			event.clientY - event.target.getBoundingClientRect().top - window.scrollY
		)
	}

	function dragOver(event) {
		if(event.dataTransfer.types.includes(mimes.value.moduleType)) {
			event.preventDefault()
		}
	}

	function dragEnd(event) {
		event.dataTransfer.clearData()
	}

	function drop(event) {
		if(event.dataTransfer.types.includes(mimes.value.moduleType) && !event.dataTransfer.types.includes(cableStore.mimes.cableId1)) {
			const offsetX = event.dataTransfer.getData(mimes.value.moduleDragOffsetX)
			const offsetY = event.dataTransfer.getData(mimes.value.moduleDragOffsetY)

			switch(parseInt(event.dataTransfer.getData(mimes.value.moduleType))) {
				case ModuleType.BASE:
					const id = event.dataTransfer.getData(mimes.value.moduleId)

					let module = getModuleBase(id).clone()

					module.data.id = id
					module.data.pos = {
						x: event.clientX - offsetX,
						y: event.clientY - offsetY
					}

					add(module)
				break

				case ModuleType.ENABLED:
					const idx = event.dataTransfer.getData(mimes.value.moduleIdx)

					enabledModules.value[idx].data.pos = {
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

	return {
		modules, enabledModules, audioCtx,
		add, remove, updateValue,
		baseDragStart, baseDragOver, baseDrop,
		dragStart, dragOver, dragEnd, drop
	}
})
