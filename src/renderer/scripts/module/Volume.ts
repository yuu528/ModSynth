import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import ModuleData from './interface/ModuleData'

import Module from './Module'

export default class Volume extends Module {
	data: ModuleData = {
		id: 'volume',
		name: 'Volume',
		category: ModuleCategory.FILTER,
		controls: [
			{
				id: 'volume',
				name: 'Vol',
				component: Component.Knob,
				min: 0,
				max: 2,
				step: 0.01,
				value: 0.5
			}
		],
		jacks: [
			{
				name: 'In',
				type: JackType.AUDIO_INPUT
			},
			{
				name: 'Out',
				type: JackType.AUDIO_OUTPUT
			}
		]
	}

	clone() {
		const result = new Volume()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		this._onEnable(idx)

		const vol = this.getControl('volume').value
		this.data.input = this.moduleStore.audioCtx.createGain()
		this.data.input.gain.setValueAtTime(vol, this.moduleStore.audioCtx.currentTime)
		this.data.output = this.data.input
	}

	updateValue(idx: number, id: string, value: number) {
		switch(id) {
			case 'volume':
				this.data.input.gain.setValueAtTime(value, this.moduleStore.audioCtx.currentTime)
			break
		}
	}
}
