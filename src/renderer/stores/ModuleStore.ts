import { ref, nextTick } from 'vue'
import type { Ref } from 'vue'

import { defineStore } from 'pinia'

import { useCableStore } from './CableStore'

import ModuleType from '../scripts/enum/ModuleType'

import Module from '../scripts/module/Module'

import ADSRModule from '../scripts/module/ADSRModule'
import AudioPlayerModule from '../scripts/module/AudioPlayerModule'
import CompressorModule from '../scripts/module/CompressorModule'
import DelayModule from '../scripts/module/DelayModule'
import EchoModule from '../scripts/module/EchoModule'
import InputDeviceModule from '../scripts/module/InputDeviceModule'
import LFOModule from '../scripts/module/LFOModule'
import MIDIInputModule from '../scripts/module/MIDIInputModule'
import MergerModule from '../scripts/module/MergerModule'
import MonitorModule from '../scripts/module/MonitorModule'
import OscillatorModule from '../scripts/module/OscillatorModule'
import PannerModule from '../scripts/module/PannerModule'
import ParamEQModule from '../scripts/module/ParamEQModule'
import SplitterModule from '../scripts/module/SplitterModule'
import StereoPannerModule from '../scripts/module/StereoPannerModule'
import VolumeModule from '../scripts/module/VolumeModule'

import ADSRProcessor from '../scripts/processor/ADSRProcessor.ts?url'

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
	const enabledModulesOrder = ref<number[]>([])

	const audioCtx = ref(new window.AudioContext());
	const midiAccess = ref<MIDIAccess>()

	const edited = ref(false)

	async function init() {
		midiAccess.value = await navigator.requestMIDIAccess()

		audioCtx.value.audioWorklet.addModule(ADSRProcessor)

		for(const module of [
			// Source
			new AudioPlayerModule(),
			new InputDeviceModule(),
			new MIDIInputModule(),
			new OscillatorModule(),
			new LFOModule(),

			// Filter
			new MergerModule(),
			new SplitterModule(),

			new VolumeModule(),
			new StereoPannerModule(),
			new DelayModule(),
			new ADSRModule(),
			new EchoModule(),
			new ParamEQModule(),
			new CompressorModule(),
			new PannerModule(),

			// Visual
			new MonitorModule(),
		]) {
			await module.init()
			modules.value.push(module)
		}
	}

	function add(module: Module, idx?: number): number {
		if(idx !== undefined) {
			enabledModules.value[idx] = module
		} else {
			idx = enabledModules.value.push(module) - 1
		}

		enabledModulesOrder.value.push(idx)

		nextTick(() => {
			module.onEnable(idx)
		})

		edited.value = true

		return idx
	}

	function remove(idx: number) {
		const module = enabledModules.value[idx]

		enabledModulesOrder.value = enabledModulesOrder.value.filter(order => order !== idx)

		for(const input of Object.values(module.inputs)) {
			if(input instanceof AudioNode) {
				input.disconnect()
			}
		}

		for(const output of Object.values(module.outputs)) {
			output.disconnect()
		}

		delete enabledModules.value[idx]

		edited.value = true

		nextTick(() => {
			cableStore.updateCables()
		})
	}

	function reorder(fromIdx: number, toIdx?: number) {
		const fromOrder = enabledModulesOrder.value.indexOf(fromIdx)
		enabledModulesOrder.value.splice(fromOrder, 1)

		let toOrder = enabledModulesOrder.value.length
		if(toIdx !== undefined) {
			toOrder = enabledModulesOrder.value.indexOf(toIdx)
		}

		enabledModulesOrder.value.splice(toOrder, 0, fromIdx)

		nextTick(() => {
			cableStore.updateCables()
		})
	}

	async function updateValue(idx: number, id: string, value: number | string | boolean | Event | File) {
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

	function enabledDragOver(event: DragEvent) {
		if(event.dataTransfer === null) return

		if(event.dataTransfer.types.includes(mimes.value.moduleType)) {
			event.preventDefault()
		}
	}

	function enabledDrop(event: DragEvent) {
		if(event.dataTransfer === null) return

		if(event.dataTransfer.types.includes(mimes.value.moduleType)) {
			const target = event.target as HTMLElement
			const targetModule = target.closest('.enabledModule') as HTMLElement | null

			if(targetModule === null) return
			if(targetModule.dataset.idx === undefined) return

			const targetModuleIdx = parseInt(targetModule.dataset.idx)

			switch(event.dataTransfer.getData(mimes.value.moduleType)) {
				case ModuleType.BASE:
					{
						event.stopPropagation()

						const id = event.dataTransfer.getData(mimes.value.moduleId)
						const module = getModuleBase(id).clone()

						if(module.data === undefined) return

						module.data.id = id

					reorder(add(module), targetModuleIdx)
					}
				break

				case ModuleType.ENABLED:
					{
						event.stopPropagation()
						const idx = parseInt(event.dataTransfer.getData(mimes.value.moduleIdx))

						reorder(idx, targetModuleIdx)
					}
				break
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

			const target = document.getElementById('moduleCase')

			if(target === null) return

			switch(event.dataTransfer.getData(mimes.value.moduleType)) {
				case ModuleType.BASE:
					const id = event.dataTransfer.getData(mimes.value.moduleId)

					try {
						const module = getModuleBase(id).clone()

						if(module.data === undefined) return

						module.data.id = id

						add(module)
					} catch(e) {
						// ignore
					}
				break

				case ModuleType.ENABLED:
					const idx = parseInt(event.dataTransfer.getData(mimes.value.moduleIdx))
					reorder(idx)
				break
			}
		}
	}

	return {
		modules, enabledModules, enabledModulesOrder, audioCtx, midiAccess, edited,
		init, add, remove, updateValue, getModuleBase,
		baseDragStart, baseDragOver, baseDrop,
		enabledDragOver, enabledDrop,
		dragStart, dragOver, dragEnd, drop
	}
})
