import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import Module from './Module'

export default class ADSRModule extends Module {
	constructor() {
	super()

		this.data = {
			...this.data,
			id: 'adsr',
			name: 'ADSR',
			category: ModuleCategory.FILTER,
			icon: 'mdi-tune-vertical',
			controls: [
				{
					id: 'attack',
					name: 'Atk',
					component: Component.Knob,
					min: 0,
					max: 5,
					step: 1e-2,
					value: 0.5
				},
				{
					id: 'hold',
					name: 'Hold',
					component: Component.Knob,
					min: 0,
					max: 5,
					step: 1e-2,
					value: 0.5
				},
				{
					id: 'decay',
					name: 'Dec',
					component: Component.Knob,
					min: 0,
					max: 5,
					step: 1e-2,
					value: 0.5
				},
				{
					id: 'sustain',
					name: 'Sus',
					component: Component.Knob,
					min: 0,
					max: 1,
					step: 1e-2,
					value: 0.5
				},
				{
					id: 'release',
					name: 'Rel',
					component: Component.Knob,
					min: 0,
					max: 5,
					step: 1e-2,
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
		const result = new ADSRModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		const ctrls = this.getControls()

		const output = new AudioWorkletNode(this.moduleStore.audioCtx, 'adsr-processor', {
			parameterData: {
				attack: ctrls.attack.value as number,
				hold: ctrls.hold.value as number,
				decay: ctrls.decay.value as number,
				sustain: ctrls.sustain.value as number,
				release: ctrls.release.value as number,
				sampleRate: this.moduleStore.audioCtx.sampleRate
			}
		})

		this.inputs.input = output
		this.outputs.output = output
	}


	updateValue(idx: number, id: string, value: number | string) {
		const output = this.outputs.output as AudioWorkletNode

		switch(id) {
			case 'attack':
				output.parameters.get('attack').setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'hold':
				output.parameters.get('hold').setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'decay':
				output.parameters.get('decay').setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'sustain':
				output.parameters.get('sustain').setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'release':
				output.parameters.get('release').setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break
		}
	}
}
