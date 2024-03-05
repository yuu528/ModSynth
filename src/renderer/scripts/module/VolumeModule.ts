import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import ModuleData from './interface/ModuleData'

import Module from './Module'

export default class VolumeModule extends Module {
	constructor() {
		super()

		this.data = {
			...this.data,
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
					id: 'input',
					name: 'In',
					type: JackType.AUDIO_INPUT
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
		const result = new VolumeModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		const volCtrl = this.getControl('volume')

		if(volCtrl === undefined) return

		const vol = volCtrl.value

		const input = this.moduleStore.audioCtx.createGain()
		this.inputs.input = input

		input.gain.setValueAtTime(vol as number, this.moduleStore.audioCtx.currentTime)
		this.outputs.output = input
	}

	updateValue(idx: number, id: string, value: number) {
		const input = this.inputs.input as GainNode

		switch(id) {
			case 'volume':
				input.gain.setValueAtTime(value, this.moduleStore.audioCtx.currentTime)
			break
		}
	}
}
