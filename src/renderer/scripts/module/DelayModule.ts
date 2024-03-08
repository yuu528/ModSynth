import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import Module from './Module'

export default class DelayModule extends Module {
	constructor() {
		super()

		this.data = {
			...this.data,
			id: 'delay',
			name: 'Delay',
			category: ModuleCategory.FILTER,
			icon: 'mdi-timeline-clock',
			controls: [
				{
					id: 'time',
					name: 'Time',
					component: Component.Knob,
					min: 0,
					max: 1,
					step: 1e-3,
					value: 0.5,
					si: true
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
		const result = new DelayModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		const ctrls = this.getControls()

		const output = this.moduleStore.audioCtx.createDelay()
		this.outputs.output = output

		output.delayTime.setValueAtTime(ctrls.time.value as number, this.moduleStore.audioCtx.currentTime)

		this.inputs.input = output
	}

	updateValue(idx: number, id: string, value: number | string) {
		const output = this.outputs.output as DelayNode

		switch(id) {
			case 'time':
				output.delayTime.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break
		}
	}
}
