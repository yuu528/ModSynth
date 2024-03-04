import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import ModuleData from './interface/ModuleData'

import Module from './Module'

export default class StereoPannerModule extends Module {
	data: ModuleData = {
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
		const result = new StereoPannerModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		const panCtrl = this.getControl('pan')

		if(panCtrl === undefined) return

		this.data.output = this.moduleStore.audioCtx.createStereoPanner()

		if(!(this.data.output instanceof StereoPannerNode)) return

		this.data.output.pan.setValueAtTime(panCtrl.value as number, this.moduleStore.audioCtx.currentTime)

		this.data.input = this.data.output
	}

	updateValue(idx: number, id: string, value: number | string) {
		if(!(this.data.output instanceof StereoPannerNode)) return

		switch(id) {
			case 'pan':
				this.data.output.pan.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break
		}
	}
}
