import { ref, nextTick } from 'vue'
import type { Ref } from 'vue'

import { defineStore } from 'pinia'

import { useCableStore } from './CableStore'

import ModuleType from '../scripts/enum/ModuleType'

import Module from '../scripts/module/Module'

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

	const modules: Ref<Module[]> = ref([])

	const enabledModules = ref<Module[]>([])

	const audioCtx = ref(new window.AudioContext());

	// Push modules by forEach to avoid type annotation problem
	[
		new AudioPlayer(),
		new InputDevice(),
		new Monitor(),
		new Oscillator(),
		new Volume()
	].forEach(module => {
		modules.value.push(module)
	})

	async function add(module: Module) {
		const idx = enabledModules.value.push(module) - 1

		nextTick(() => {
			module.onEnable(idx)
		})
	}

	function remove(idx: number) {
		const module = enabledModules.value[idx]

		if(module.data === undefined) return

		module.data.input?.disconnect()
		module.data.output?.disconnect()

		delete enabledModules.value[idx]

		nextTick(() => {
			cableStore.updateCables()
		})
	}

	async function updateValue(idx: number, id: string, value: number | string | Event | File) {
		const module = enabledModules.value[idx]

		if(module !== undefined) {
			module.updateValue(idx, id, value)
		}
	}

	function getModuleBase(id: string) {
		const module = modules.value.find(module => module.data !== undefined && module.data.id === id)
		if(module === undefined) {
			throw new Error(`Module ${id} not found`)
		}

		return module
	}

	function getModuleBaseIdx(id: string) {
		return modules.value.findIndex(module => module.data !== undefined && module.data.id === id)
	}

	function baseDragStart(event: DragEvent) {
		if(event.target === null) return
		if(event.dataTransfer === null) return

		const target = event.target as HTMLElement

		if(target.dataset.id === undefined) return

		event.dataTransfer.setData(mimes.value.moduleId, target.dataset.id)
		event.dataTransfer.setData(mimes.value.moduleType, ModuleType.BASE)
		event.dataTransfer.setData(
			mimes.value.moduleDragOffsetX,
			(event.clientX - target.getBoundingClientRect().left - window.scrollX).toString()
		)
		event.dataTransfer.setData(
			mimes.value.moduleDragOffsetY,
			(event.clientY - target.getBoundingClientRect().top - window.scrollY).toString()
		)
	}

	function baseDragOver(event: DragEvent) {
		if(event.dataTransfer === null) return

		if(event.dataTransfer.types.includes(mimes.value.moduleType)) {
			event.preventDefault()
		}
	}

	function baseDrop(event: DragEvent) {
		if(event.dataTransfer === null) return

		if(event.dataTransfer.types.includes(mimes.value.moduleType)) {
			if(event.dataTransfer.getData(mimes.value.moduleType) == ModuleType.ENABLED) {
				const idx = parseInt(event.dataTransfer.getData(mimes.value.moduleIdx))
				remove(idx)
			}
		}
	}

	function dragStart(event: DragEvent) {
		if(event.target === null) return
		if(event.dataTransfer === null) return

		const target = event.target as HTMLElement

		if(target.dataset.idx === undefined) return

		event.dataTransfer.setData(mimes.value.moduleType, ModuleType.ENABLED)
		event.dataTransfer.setData(mimes.value.moduleIdx, target.dataset.idx)
		event.dataTransfer.setData(
			mimes.value.moduleDragOffsetX,
			(event.clientX - target.getBoundingClientRect().left - window.scrollX).toString()
		)
		event.dataTransfer.setData(
			mimes.value.moduleDragOffsetY,
			(event.clientY - target.getBoundingClientRect().top - window.scrollY).toString()
		)
	}

	function dragOver(event: DragEvent) {
		if(event.dataTransfer === null) return

		if(event.dataTransfer.types.includes(mimes.value.moduleType)) {
			event.preventDefault()
		}
	}

	function dragEnd(event: DragEvent) {
		if(event.dataTransfer === null) return

		event.dataTransfer.clearData()
	}

	function drop(event: DragEvent) {
		if(event.dataTransfer === null) return

		if(event.dataTransfer.types.includes(mimes.value.moduleType) && !event.dataTransfer.types.includes(cableStore.mimes.cableId1)) {
			const offsetX = parseInt(event.dataTransfer.getData(mimes.value.moduleDragOffsetX))
			const offsetY = parseInt(event.dataTransfer.getData(mimes.value.moduleDragOffsetY))

			switch(event.dataTransfer.getData(mimes.value.moduleType)) {
				case ModuleType.BASE:
					{
						const id = event.dataTransfer.getData(mimes.value.moduleId)

						try {
							const module = getModuleBase(id).clone()

							if(module.data === undefined) return

							module.data.id = id
							module.data.pos = {
								x: event.clientX - offsetX,
								y: event.clientY - offsetY
							}

							add(module)
						} catch(e) {
							// ignore
						}
					}
				break

				case ModuleType.ENABLED:
					{
						const idx = parseInt(event.dataTransfer.getData(mimes.value.moduleIdx))

						const module = enabledModules.value[idx]

						if(module.data === undefined) return

						module.data.pos = {
							x: event.clientX - offsetX,
							y: event.clientY - offsetY
						}

						nextTick(() => {
							cableStore.updateCables()
						})
					}
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
