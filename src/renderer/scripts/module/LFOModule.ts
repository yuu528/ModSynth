import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import { NumberUtil } from '../util/NumberUtil'

import Module from './Module'

export default class LFOModule extends Module {
	constructor() {
		super()

		this.data = {
			...this.data,
			id: 'lfo',
			name: 'LFO',
			category: ModuleCategory.SOURCE,
			controls: [
				{
					id: 'type',
					name: 'Type',
					component: Component.Select,
					items: [
						{
							value: 'sine',
							image: '/images/waveforms/sine.svg'
						},
						{
							value: 'square',
							image: '/images/waveforms/square.svg'
						},
						{
							value: 'sawtooth',
							image: '/images/waveforms/sawtooth.svg'
						},
						{
							value: 'triangle',
							image: '/images/waveforms/triangle.svg'
						}
					],
					value: 'sine'
				},
				{
					id: 'frequency',
					name: 'Freq',
					component: Component.Knob,
					min: 0.1,
					max: 50,
					step: 0.1,
					value: 10
				},
				{
					id: 'volume',
					name: 'Vol',
					component: Component.Knob,
					min: 0,
					max: 2,
					step: 1e-2,
					value: 1
				}
			],
			jacks: [
				{
					id: 'output',
					name: 'Out',
					type: JackType.AUDIO_OUTPUT
				}
			]
		}
	}

	clone() {
		const result = new LFOModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		const ctrls = this.getControls()

		const input = this.moduleStore.audioCtx.createOscillator()
		const output = this.moduleStore.audioCtx.createGain()

		this.inputs.input = input
		this.outputs.output = output

		input.type = ctrls.type.value
		input.frequency.setValueAtTime(ctrls.frequency.value as number, this.moduleStore.audioCtx.currentTime)
		output.gain.setValueAtTime(ctrls.volume.value as number, this.moduleStore.audioCtx.currentTime)

		input.connect(output)

		input.start()
	}

	updateValue(idx: number, id: string, value: number | string) {
		const input = this.inputs.input as OscillatorNode
		const output = this.outputs.output as GainNode

		switch(id) {
			case 'type':
				input.type = value
			break

			case 'frequency':
				input.frequency.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'volume':
				output.gain.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break
		}
	}
}
