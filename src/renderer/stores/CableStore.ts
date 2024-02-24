import { defineStore } from 'pinia'

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

export const useCableStore = defineStore('cable', {
	state: () => ({
		cables: [] as Cable[],
		cablesData: [],
		jacks: [] as HTMLElement[],
		mimes: {
			cableId1: 'application/mscable.id1'
		}
	}),
	actions: {
		add(p1: string, p2: string) {
			if(this.cables.every(cable =>
				!(cable.j1 === p1 && cable.j2 === p2)
				&& !(cable.j1 === p2 && cable.j2 === p1)
			)) {
				this.cables.push(
					new Cable(p1, p2)
				)
				this.updateCables()
			}
		},
		delete(p: string) {
			this.cables = this.cables.filter(cable =>
				cable.j1 !== p && cable.j2 !== p
			)
			this.updateCables()
		},
		registerJack(el: HTMLElement) {
			this.jacks.push(el)
		},
		getJack(id: string) {
			return this.jacks.find(jack =>
				jack.dataset.id === id
			)
		},
		getJackPos(id: string) {
			const pos = this.getJack(id).getBoundingClientRect()

			return {
				x: pos.left + pos.width / 2,
				y: pos.top + pos.height / 2
			}
		},
		updateCables() {
			this.jacks = this.jacks.filter(jack => document.body.contains(jack))
			this.cables = this.cables.filter(cable =>
				this.getJack(cable.j1) !== undefined && this.getJack(cable.j2) !== undefined
			)

			this.cablesData = this.cables.map(cable => {
				const p1 = this.getJackPos(cable.j1)
				const p2 = this.getJackPos(cable.j2)

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
		},
		dragStart(event) {
			event.dataTransfer.setData(this.mimes.cableId1, event.target.dataset.id)
		},
		dragOver(event) {
			if(event.dataTransfer.types.includes(this.mimes.cableId1)) {
				event.preventDefault()
			}
		},
		drop(event) {
			if(event.dataTransfer.types.includes(this.mimes.cableId1)) {
				const id1 = event.dataTransfer.getData(this.mimes.cableId1)
				const id2 = event.target.dataset.id

				this.add(id1, id2)
			}
		},
		click(event) {
			this.delete(event.target.dataset.id)
		}
	}
})
