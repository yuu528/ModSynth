import { ref } from 'vue'
import { defineStore } from 'pinia'

import { useModuleStore } from './ModuleStore'

export class Cable {
	private _j1: string
	private _j2: string

	constructor(j1: string, j2: string) {
		this._j1 = j1
		this._j2 = j2
	}

	set j1(j1: string) {
		this._j1 = j1
	}

	set j2(j2: string) {
		this._j2 = j2
	}

	get j1() {
		return this._j1
	}

	get j2() {
		return this._j2
	}
}

export const useCableStore = defineStore('cable', () => {
	const moduleStore = useModuleStore()

	const cables = ref([])
	const cablesData = ref([])
	const jacks = ref([])
	const mimes = ref({
		cableId1: 'application/mscable.id1'
	})

	function add(p1: string, p2: string) {
		const type1 = getJack(p1).dataset.type
		const type2 = getJack(p2).dataset.type

		if(type1 === 'output' && type2 === 'input') {
			// nothing
		} else if(type1 === 'input' && type2 === 'output') {
			// swap
			const tmp = p1
			p1 = p2
			p2 = tmp
		} else {
			return
		}

		if(cables.value.every(cable =>
			!(cable.j1 === p1 && cable.j2 === p2)
		)) {
			cables.value.push(
				new Cable(p1, p2)
			)

			updateCables()

			const src = getParentModuleObj(p1).output

			let dest
			if(p2.indexOf('master') !== -1) {
				dest = moduleStore.audioCtx.destination
			} else {
				dest = getParentModuleObj(p2).input
			}

			src.connect(dest)
		}
	}

	function remove(p: string) {
		const removed = cables.value.filter(cable =>
			cable.j1 === p || cables.j2 === p
		)
		cables.value = cables.value.filter(cable =>
			cable.j1 !== p && cable.j2 !== p
		)

		for(const cable of removed) {
			const jack1 = getJack(cable.j1)
			const jack2 = getJack(cable.j2)

			if(jack1.dataset.type === 'output') {
				getParentModuleObj(cable.j1).output.disconnect()
			}

			if(jack2.dataset.type === 'output') {
				getParentModuleObj(cable.j2).output.disconnect()
			}
		}
		updateCables()
	}

	function registerJack(el: HTMLElement) {
		jacks.value.push(el)
	}

	function getJack(id: string) {
		return jacks.value.find(jack =>
			jack.dataset.id === id
		)
	}

	function getJackPos(id: string) {
		const pos = getJack(id).getBoundingClientRect()

		return {
			x: pos.left + pos.width / 2 + window.scrollX,
			y: pos.top + pos.height / 2 + window.scrollY
		}
	}

	function getParentModule(id: string) {
		return getJack(id).closest('.enabledModule')
	}

	function getParentModuleObj(id: string) {
		return moduleStore.enabledModules[getJack(id).dataset.moduleidx]
	}

	function updateCables() {
		jacks.value = jacks.value.filter(jack => document.body.contains(jack))
		cables.value = cables.value.filter(cable =>
			getJack(cable.j1) !== undefined && getJack(cable.j2) !== undefined
		)

		cablesData.value = cables.value.map(cable => {
			const p1 = getJackPos(cable.j1)
			const p2 = getJackPos(cable.j2)

			return {
				p1: {
					x: p1.x,
					y: p1.y
				},
				p2: {
					x: p2.x,
					y: p2.y
				}
			}
		})
	}

	function dragStart(event) {
		if(event.target.closest('.enabledModule') !== null || event.target.dataset.id.indexOf('master') !== -1) {
			event.dataTransfer.setData(mimes.value.cableId1, event.target.dataset.id)
		}
	}

	function dragOver(event) {
		if(event.dataTransfer.types.includes(mimes.value.cableId1)) {
			event.preventDefault()
		}
	}

	function dragEnd(event) {
		event.dataTransfer.clearData()
	}

	function drop(event) {
		if(event.dataTransfer.types.includes(mimes.value.cableId1)) {
			const id1 = event.dataTransfer.getData(mimes.value.cableId1)
			const id2 = event.target.dataset.id

			add(id1, id2)
		}
	}

	function click(event) {
		remove(event.target.dataset.id)
	}

	return {
		cables, cablesData, jacks, mimes,
		add, remove, registerJack, getJack, getJackPos,
		updateCables, dragStart, dragOver, dragEnd, drop, click
	}
})
