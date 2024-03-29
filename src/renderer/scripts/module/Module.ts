import { useCableStore } from '../../stores/CableStore'
import { useModuleStore } from '../../stores/ModuleStore'

import ModuleCategory from '../enum/ModuleCategory'

import Control from './interface/Control'
import ModuleData from './interface/ModuleData'

export default class Module {
	data: ModuleData = {
		id: '',
		name: '',
		category: ModuleCategory.OTHER,
		icon: '',
		idx: -1,
		controls: [],
		monitors: [],
		jacks: [],
	}

	inputs: {[id: string]: AudioNode | AudioParam} = {}
	outputs: {[id: string]: AudioNode} = {}
	intNodes: {[id: string]: AudioNode} = {}

	protected moduleStore
	protected cableStore

	constructor() {
		this.moduleStore = useModuleStore()
		this.cableStore = useCableStore()
	}

	getControl(id: string): Control | undefined {
		if(this.data === undefined) return undefined
		if(this.data.controls === undefined) return undefined

		return this.data.controls.find(control => control.id === id)
	}

	getControlIdx(id: string): number {
		if(this.data === undefined) return -1
		if(this.data.controls === undefined) return -1

		return this.data.controls.findIndex(control => control.id === id)
	}

	getControls(): { [id: string]: Control } {
		if(this.data === undefined) return {}
		if(this.data.controls === undefined) return {}

		const result: { [id: string]: Control } = {}

		this.data.controls.forEach(control => {
			result[control.id] = control
		})

		return result
	}

	getControlIds(): string[] {
		if(this.data === undefined) return []
		if(this.data.controls === undefined) return []

		return this.data.controls.map(control => control.id)
	}

	onEnable(idx: number) {
		if(this.data === undefined) return

		this.data.idx = idx
	}

	onReorder() {}

	onConnectedTo(jackId: string) {}

	onDisconnectedTo(jackId: string) {}

	clone(): Module { return new Module() }

	async init() {}

	updateValue(idx: number, id: string, value: number | string | boolean | Event | File) {}
}
