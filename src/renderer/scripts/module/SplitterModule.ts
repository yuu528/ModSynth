import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'

import ModuleData from './interface/ModuleData'

import Module from './Module'

export default class SplitterModule extends Module {
	data: ModuleData = {
		id: 'splitter',
		name: 'Channel Splitter',
		category: ModuleCategory.FILTER,
		jacks: [
			{
				name: 'In',
				type: JackType.AUDIO_INPUT
			},
			{
				name: 'L',
				type: JackType.AUDIO_OUTPUT,
				index: 0
			},
			{
				name: 'R',
				type: JackType.AUDIO_OUTPUT,
				index: 1
			}
		]
	}

	clone() {
		const result = new SplitterModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		this.data.output = this.moduleStore.audioCtx.createChannelSplitter(2)
		this.data.input = this.data.output
	}
}
