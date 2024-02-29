import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'

import ModuleData from './interface/ModuleData'

import Module from './Module'

export default class MergerModule extends Module {
	data: ModuleData = {
		id: 'merger',
		name: 'Channel Merger',
		category: ModuleCategory.FILTER,
		jacks: [
			{
				name: 'L',
				type: JackType.AUDIO_INPUT,
				index: 0
			},
			{
				name: 'R',
				type: JackType.AUDIO_INPUT,
				index: 1
			},
			{
				name: 'In',
				type: JackType.AUDIO_OUTPUT
			}
		]
	}

	clone() {
		const result = new MergerModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		this._onEnable(idx)

		this.data.output = this.moduleStore.audioCtx.createChannelMerger(2)
		this.data.input = this.data.output
	}
}
