import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import ModuleData from './interface/ModuleData'

import Module from './Module'

export default class OscillatorModule extends Module {
	data: ModuleData = {
		id: 'oscillator',
		name: 'Osc',
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
				min: 1,
				max: 16e3,
				step: 1,
				value: 1e3
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
				name: 'Out',
				type: JackType.AUDIO_OUTPUT
			}
		]
	}

	clone() {
		const result = new OscillatorModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		this._onEnable(idx)

		const ctrls = this.getControls()

		this.data.input = this.moduleStore.audioCtx.createOscillator()
		this.data.output = this.moduleStore.audioCtx.createGain()

		if(!(this.data.input instanceof OscillatorNode) || !(this.data.output instanceof GainNode)) return

		this.data.input.type = ctrls.type.value
		this.data.input.frequency.setValueAtTime(ctrls.frequency.value as number, this.moduleStore.audioCtx.currentTime)
		this.data.output.gain.setValueAtTime(ctrls.volume.value as number, this.moduleStore.audioCtx.currentTime)

		this.data.input.connect(this.data.output)
		this.data.input.start()
	}

	updateValue(idx: number, id: string, value: number | string) {
		if(!(this.data.input instanceof OscillatorNode) || !(this.data.output instanceof GainNode)) return

		switch(id) {
			case 'type':
				this.data.input.type = value
			break

			case 'frequency':
				this.data.input.frequency.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'volume':
				this.data.output.gain.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break
		}
	}
}
