import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'

import Module from './Module'

export default class MergerModule extends Module {
	constructor() {
		super()

		this.data = {
			...this.data,
			id: 'merger',
			name: 'Channel Merger',
			category: ModuleCategory.FILTER,
			jacks: [
				{
					id: 'input',
					name: 'L',
					type: JackType.AUDIO_INPUT,
					index: 0
				},
				{
					id: 'input',
					name: 'R',
					type: JackType.AUDIO_INPUT,
					index: 1
				},
				{
					id: 'output',
					name: 'Out',
					type: JackType.AUDIO_OUTPUT
				}
			]
		}
	}

	clone() {
		const result = new MergerModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		this.outputs.output = this.moduleStore.audioCtx.createChannelMerger(2)
		this.inputs.input = this.outputs.output
	}
}
