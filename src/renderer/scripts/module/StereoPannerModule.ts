import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import Module from './Module'

export default class StereoPannerModule extends Module {
	constructor() {
		super()

		this.data = {
			...this.data,
			id: 'stereoPanner',
			name: 'Stereo Panner',
			category: ModuleCategory.FILTER,
			controls: [
				{
					id: 'pan',
					name: 'Pan',
					component: Component.Knob,
					min: -1,
					max: 1,
					step: 1e-2,
					value: 0
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
		const result = new StereoPannerModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		const panCtrl = this.getControl('pan')

		if(panCtrl === undefined) return

		const output = this.moduleStore.audioCtx.createStereoPanner()
		this.outputs.output = output

		output.pan.setValueAtTime(panCtrl.value as number, this.moduleStore.audioCtx.currentTime)

		this.inputs.input = output
	}

	updateValue(idx: number, id: string, value: number | string) {
		const output = this.outputs.output as StereoPannerNode

		switch(id) {
			case 'pan':
				output.pan.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break
		}
	}
}
