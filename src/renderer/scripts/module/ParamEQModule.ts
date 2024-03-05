import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import Module from './Module'

export default class ParamEQModule extends Module {
	constructor() {
	super()

		this.data = {
			...this.data,
			id: 'paramEQ',
			name: 'Parametric EQ',
			category: ModuleCategory.FILTER,
			controls: [
				{
					id: 'type',
					name: 'Type',
					component: Component.Select,
					items: [
						{
							value: 'lowpass',
							label: 'Lowpass'
						},
						{
							value: 'highpass',
							label: 'Highpass'
						},
						{
							value: 'bandpass',
							label: 'Bandpass'
						},
						{
							value: 'lowshelf',
							label: 'Lowshelf'
						},
						{
							value: 'highshelf',
							label: 'Highshelf'
						},
						{
							value: 'peaking',
							label: 'Peaking'
						},
						{
							value: 'notch',
							label: 'Notch'
						},
						{
							value: 'allpass',
							label: 'Allpass'
						}
					],
					value: 'lowpass'
				},
				{
					id: 'frequency',
					name: 'Freq',
					component: Component.Knob,
					min: 10,
					max: 16e3,
					step: 1,
					value: 350
				},
				{
					id: 'fine',
					name: 'Fine',
					component: Component.Knob,
					min: -100,
					max: 100,
					step: 1,
					value: 0
				},
				{
					id: 'q',
					name: 'Q',
					component: Component.Knob,
					min: 0.01,
					max: 24,
					step: 0.01,
					value: 1
				},
				{
					id: 'gain',
					name: 'Gain',
					component: Component.Knob,
					min: -40,
					max: 40,
					step: 1,
					value: 0,
					disabled: true
				}
			],
			jacks: [
				{
					id: 'input',
					name: 'In',
					type: JackType.AUDIO_INPUT
				},
				{
					id: 'input',
					name: 'Out',
					type: JackType.AUDIO_OUTPUT
				}
			]
		}
	}

	clone() {
		const result = new ParamEQModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		const ctrls = this.getControls()

		ctrls.frequency.max = Math.floor(this.moduleStore.audioCtx.sampleRate / 2)

		const output = this.moduleStore.audioCtx.createBiquadFilter()
		this.outputs.output = output

		output.type = ctrls.type.value
		output.frequency.setValueAtTime(ctrls.frequency.value as number, this.moduleStore.audioCtx.currentTime)
		output.Q.setValueAtTime(ctrls.q.value as number, this.moduleStore.audioCtx.currentTime)
		output.gain.setValueAtTime(ctrls.gain.value as number, this.moduleStore.audioCtx.currentTime)
		output.detune.setValueAtTime(ctrls.fine.value as number, this.moduleStore.audioCtx.currentTime)

		this.inputs.input = output
	}

	updateValue(idx: number, id: string, value: number | string) {
		const output = this.outputs.output as BiquadFilterNode
		const ctrls = this.getControls()

		switch(id) {
			case 'type':
				output.type = value

				switch(value) {
					case 'lowpass':
						ctrls.gain.disabled = true
						ctrls.Q.disabled = false
					break

					case 'highpass':
						ctrls.gain.disabled = true
						ctrls.Q.disabled = false
					break

					case 'bandpass':
						ctrls.gain.disabled = true
						ctrls.Q.disabled = false
					break

					case 'lowshelf':
						ctrls.gain.disabled = false
						ctrls.Q.disabled = true
					break

					case 'peaking':
						ctrls.gain.disabled = false
						ctrls.Q.disabled = false
					break

					case 'notch':
						ctrls.gain.disabled = true
						ctrls.Q.disabled = false
					break

					case 'allpass':
						ctrls.gain.disabled = true
						ctrls.Q.disabled = false
					break
				}
			break

			case 'frequency':
				output.frequency.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'q':
				output.Q.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'gain':
				output.gain.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'fine':
				output.detune.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break
		}
	}
}
