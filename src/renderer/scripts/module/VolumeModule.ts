import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import ModuleData from './interface/ModuleData'

import Module from './Module'

export default class VolumeModule extends Module {
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
		const result = new VolumeModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		const volCtrl = this.getControl('volume')

		if(volCtrl === undefined) return

		const vol = volCtrl.value

		this.data.input = this.moduleStore.audioCtx.createGain()

		if(!(this.data.input instanceof GainNode)) return

		this.data.input.gain.setValueAtTime(vol as number, this.moduleStore.audioCtx.currentTime)
		this.data.output = this.data.input
	}

	updateValue(idx: number, id: string, value: number) {
		if(!(this.data.input instanceof GainNode)) return

		switch(id) {
			case 'volume':
				this.data.input.gain.setValueAtTime(value, this.moduleStore.audioCtx.currentTime)
			break
		}
	}
}
