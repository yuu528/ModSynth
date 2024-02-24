import { ref, toRaw, nextTick } from 'vue'
import { defineStore } from 'pinia'

import { useCableStore } from './CableStore'


export const useModuleStore = defineStore('module', () => {
	const cableStore = useCableStore()

	const mimes = ref({
		moduleId: 'application/msmodule.id',
		moduleType: 'application/msmodule.type',
		moduleIdx: 'application/msmodule.idx',
		moduleDragOffsetX: 'application/msmodule.dox',
		moduleDragOffsetY: 'application/msmodule.doy'
	})

	const types = ref({
		base: 'base',
		enabled: 'enabled'
	})

	const modules = ref({
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
		},
		oscillator: {
			name: 'Osc',
			controls: [
				{
					name: 'Freq',
					min: 1,
					max: 16e3,
					value: 1e3
				}
			],
			jacks: [
				{
					name: 'Output'
				}
			]
		}
	})

	const enabledModules = ref([])

	function baseDragStart(event) {
		event.dataTransfer.setData(mimes.value.moduleId, event.target.dataset.id)
		event.dataTransfer.setData(mimes.value.moduleType, types.value.base)
		event.dataTransfer.setData(
			mimes.value.moduleDragOffsetX,
			event.clientX - event.target.getBoundingClientRect().left
		)
		event.dataTransfer.setData(
			mimes.value.moduleDragOffsetY,
			event.clientY - event.target.getBoundingClientRect().top
		)
	}

	function baseDragOver(event) {
		if(event.dataTransfer.types.includes(mimes.value.moduleType)) {
			event.preventDefault()
		}
	}

	function baseDrop(event) {
		if(event.dataTransfer.types.includes(mimes.value.moduleType)) {
			if(event.dataTransfer.getData(mimes.value.moduleType) == types.value.enabled) {
				const idx = event.dataTransfer.getData(mimes.value.moduleIdx)
				enabledModules.value.splice(idx, 1)
				nextTick(() => {
					cableStore.updateCables()
				})
			}
		}
	}

	function dragStart(event) {
		event.dataTransfer.setData(mimes.value.moduleType, types.value.enabled)
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

			switch(event.dataTransfer.getData(mimes.value.moduleType)) {
				case types.value.base:
					const id = event.dataTransfer.getData(mimes.value.moduleId)

					let module = structuredClone(toRaw(modules.value[id]))

					module.id = id
					module.pos = {
						x: event.clientX - offsetX,
						y: event.clientY - offsetY
					}

					enabledModules.value.push(module)
				break

				case types.value.enabled:
					const idx = event.dataTransfer.getData(mimes.value.moduleIdx)

					enabledModules.value[idx].pos = {
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
		mimes, types, modules, enabledModules,
		baseDragStart, baseDragOver, baseDrop,
		dragStart, dragOver, dragEnd, drop
	}
})
