import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'

import Module from './Module'

export default class SplitterModule extends Module {
	constructor() {
		super()

		this.data = {
			...this.data,
			id: 'splitter',
			name: 'Channel Splitter',
			category: ModuleCategory.FILTER,
			jacks: [
				{
					id: 'input',
					name: 'In',
					type: JackType.AUDIO_INPUT
				},
				{
					id: 'output',
					name: 'L',
					type: JackType.AUDIO_OUTPUT,
					index: 0
				},
				{
					id: 'output',
					name: 'R',
					type: JackType.AUDIO_OUTPUT,
					index: 1
				}
			]
		}
	}

	clone() {
		const result = new SplitterModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		this.outputs.output = this.moduleStore.audioCtx.createChannelSplitter(2)
		this.inputs.input = this.outputs.output
	}
}
