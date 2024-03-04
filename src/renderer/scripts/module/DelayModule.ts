import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import ModuleData from './interface/ModuleData'

import Module from './Module'

export default class DelayModule extends Module {
	data: ModuleData = {
		id: 'delay',
		name: 'Delay',
		category: ModuleCategory.FILTER,
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
		const result = new DelayModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		const timeCtrl = this.getControl('time')

		if(timeCtrl === undefined) return

		this.data.output = this.moduleStore.audioCtx.createDelay()

		if(!(this.data.output instanceof DelayNode)) return

		this.data.output.delayTime.setValueAtTime(timeCtrl.value as number, this.moduleStore.audioCtx.currentTime)

		this.data.input = this.data.output
	}

	updateValue(idx: number, id: string, value: number | string) {
		if(!(this.data.output instanceof DelayNode)) return

		switch(id) {
			case 'time':
				this.data.output.delayTime.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break
		}
	}
}
