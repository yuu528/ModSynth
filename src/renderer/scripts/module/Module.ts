import { useCableStore } from '../../stores/CableStore'
import { useModuleStore } from '../../stores/ModuleStore'

import Control from './interface/Control'
import Jack from './interface/Jack'
import ModuleData from './interface/ModuleData'
import Monitor from './interface/Monitor'

export default class Module {
	data: ModuleData

	protected moduleStore
	protected cableStore

	constructor() {
		this.moduleStore = useModuleStore()
		this.cableStore = useCableStore()
	}

	getControl(id: string): Control {
		return this.data.controls.find(control => control.id === id)
	}

	getControlIdx(id: string): Control {
		return this.data.controls.findIndex(control => control.id === id)
	}

	protected _onEnable(idx: number) {
		this.data.idx = idx
	}
}
