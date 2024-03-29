import { ref } from 'vue'
import { defineStore } from 'pinia'

import { useModuleStore } from './ModuleStore'

import JackType from '../scripts/enum/JackType'

export interface Cable {
	j1: string
	j2: string
}

export interface CableData {
	p1: { x: number, y: number }
	p2: { x: number, y: number }
}

export const useCableStore = defineStore('cable', () => {
	const moduleStore = useModuleStore()

	const cables = ref<Cable[]>([])
	const cablesData = ref<CableData[]>([])
	const jacks = ref<HTMLElement[]>([])
	const mimes = ref({
		cableId1: 'application/mscable.id1'
	})

	function add(p1: string, p2: string) {
		let jack1 = getJack(p1)
		let jack2 = getJack(p2)

		if(jack1 === undefined || jack2 === undefined) return

		if(jack1.dataset.type === undefined || jack2.dataset.type === undefined) return

		const type1 = parseInt(jack1.dataset.type)
		const type2 = parseInt(jack2.dataset.type)

		if(
			(type1 === JackType.AUDIO_OUTPUT || type1 === JackType.CV_OUTPUT)
				&& (type2 === JackType.AUDIO_INPUT || type2 === JackType.CV_INPUT)
		) {
			// nothing
		} else if(
			(type1 === JackType.AUDIO_INPUT || type1 === JackType.CV_INPUT)
				&& (type2 === JackType.AUDIO_OUTPUT || type2 === JackType.CV_OUTPUT)
		) {
			// swap
			const tmp = p1
			p1 = p2
			p2 = tmp

			const tmpJack = jack1
			jack1 = jack2
			jack2 = tmpJack
		} else {
			return
		}

		if(cables.value.every(cable =>
			!(cable.j1 === p1 && cable.j2 === p2)
		)) {
			cables.value.push({
				j1: p1,
				j2: p2
			})

			updateCables()

			const src = getAudioNode(p1, jack1.dataset.id as string)
			const dest = getAudioNode(p2, jack2.dataset.id as string)

			let jack1Idx = undefined
			if(jack1.dataset.index !== undefined) {
				jack1Idx = parseInt(jack1.dataset.index)
			}

			let jack2Idx = undefined
			if(jack2.dataset.index !== undefined) {
				jack2Idx = parseInt(jack2.dataset.index)
			}

			if(src !== null && dest !== null) {
				switch(parseInt(jack2.dataset.type as string)) {
					case JackType.AUDIO_INPUT:
						(src as AudioNode).connect(dest as AudioNode, jack1Idx, jack2Idx)
						getParentModule(p2)?.onConnectedTo(jack2.dataset.id as string)
					break

					case JackType.CV_INPUT:
						(src as AudioNode).connect(dest as AudioParam)
						getParentModule(p2)?.onConnectedTo(jack2.dataset.id as string)
					break
				}
			}
		}
	}

	function remove(p: string) {
		const removed = cables.value.filter(cable =>
			cable.j1 === p || cable.j2 === p
		)
		cables.value = cables.value.filter(cable =>
			cable.j1 !== p && cable.j2 !== p
		)

		for(const cable of removed) {
			const jack1 = getJack(cable.j1)
			const jack2 = getJack(cable.j2)

			if(jack1 === undefined || jack2 === undefined) continue

			const src = getAudioNode(cable.j1, jack1.dataset.id as string) as AudioNode
			const dest = getAudioNode(cable.j2, jack2.dataset.id as string)

			let jack1Idx = undefined
			if(jack1 !== undefined && jack1.dataset.index !== undefined) {
				jack1Idx = parseInt(jack1.dataset.index)
			}

			let jack2Idx = undefined
			if(jack2 !== undefined && jack2.dataset.index !== undefined) {
				jack2Idx = parseInt(jack2.dataset.index)
			}

			if(src !== null && dest !== null) {
				switch(parseInt(jack2.dataset.type as string)) {
					case JackType.AUDIO_INPUT:
						src.disconnect(dest as AudioNode, jack1Idx, jack2Idx)
						getParentModule(cable.j2)?.onDisconnectedTo(jack2.dataset.id as string)
					break

					case JackType.CV_INPUT:
						src.disconnect(dest as AudioParam)
						getParentModule(cable.j2)?.onDisconnectedTo(jack2.dataset.id as string)
					break
				}
			}
		}
		updateCables()

		return removed
	}

	function registerJack(el: HTMLElement) {
		jacks.value.push(el)
	}

	function getJack(key: string) {
		return jacks.value.find(jack =>
			jack.dataset.key === key
		)
	}

	function getJackPos(key: string) {
		const jack = getJack(key)

		if(jack === undefined) return undefined

		const pos = jack.getBoundingClientRect()

		return {
			x: pos.left + pos.width / 2 + window.scrollX,
			y: pos.top + pos.height / 2 + window.scrollY
		}
	}

	function getParentModule(id: string) {
		const jack = getJack(id) as HTMLElement

		if(jack.dataset.moduleidx === undefined) return undefined

		return moduleStore.enabledModules[parseInt(jack.dataset.moduleidx)]
	}

	function getAudioNode(key: string, id: string) {
		if(key.indexOf('master') !== -1) {
			return moduleStore.audioCtx.destination
		}

		const jack = getJack(key) as HTMLElement
		const module = getParentModule(key)

		if(jack.dataset.type === undefined || module === undefined) return null

		let result = undefined
		if(jack !== undefined && module !== undefined) {
			switch(parseInt(jack.dataset.type)) {
				case JackType.AUDIO_OUTPUT:
				case JackType.CV_OUTPUT:
					if(!(id in module.outputs)) return null
					result = module.outputs[id]
					break

				case JackType.AUDIO_INPUT:
				case JackType.CV_INPUT:
					if(!(id in module.inputs)) return null
					result = module.inputs[id]
					break
			}

			if(result !== undefined) {
				return result
			}
		}

		return null
	}

	function updateCables() {
		jacks.value = jacks.value.filter(jack => document.body.contains(jack))
		cables.value = cables.value.filter(cable =>
			getJack(cable.j1) !== undefined && getJack(cable.j2) !== undefined
		)

		const newData = cables.value.reduce((acc, cable) => {
			const p1 = getJackPos(cable.j1)
			const p2 = getJackPos(cable.j2)

			if(p1 === undefined || p2 === undefined) return acc

			acc.push({
				p1: {
					x: p1.x,
					y: p1.y
				},
				p2: {
					x: p2.x,
					y: p2.y
				}
			})

			return acc
		}, [] as CableData[])

		const maxY = Math.max(...newData.map(cable => Math.max(cable.p1.y, cable.p2.y)))
		if(isFinite(maxY)) {
			const svgElm = document.getElementById('cable-svg')
			if(svgElm === null) return

			svgElm.setAttribute('height', `min(${maxY + 100}px, 100vh)`)
		}

		cablesData.value = newData
	}

	function dragStart(event: DragEvent) {
		if(event.target === null) return
		if(event.dataTransfer === null) return

		const target = event.target as HTMLElement

		if(target.dataset.key === undefined) return

		if(target.closest('.enabledModule') !== null || target.dataset.key.indexOf('master') !== -1) {
			event.dataTransfer.setData(mimes.value.cableId1, target.dataset.key)
		}
	}

	function dragOver(event: DragEvent) {
		if(event.target === null) return
		if(event.dataTransfer === null) return

		if(event.dataTransfer.types.includes(mimes.value.cableId1)) {
			event.preventDefault()
		}
	}

	function dragEnd(event: DragEvent) {
		if(event.target === null) return
		if(event.dataTransfer === null) return

		event.dataTransfer.clearData()
	}

	function drop(event: DragEvent) {
		if(event.target === null) return
		if(event.dataTransfer === null) return

		const target = event.target as HTMLElement

		if(target.dataset.key === undefined) return

		if(event.dataTransfer.types.includes(mimes.value.cableId1)) {
			const id1 = event.dataTransfer.getData(mimes.value.cableId1)
			const id2 = target.dataset.key

			add(id1, id2)
		}
	}

	function click(event: MouseEvent) {
		if(event.target === null) return

		const target = event.target as HTMLElement

		if(target.dataset.key === undefined) return

		remove(target.dataset.key)
	}

	return {
		cables, cablesData, jacks, mimes,
		add, remove, registerJack, getJack, getJackPos,
		updateCables, dragStart, dragOver, dragEnd, drop, click
	}
})
