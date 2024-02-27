import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import ModuleData from './interface/ModuleData'

import Module from './Module'

export default class Oscillator extends Module {
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
		const result = new Oscillator()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		this._onEnable(idx)

		const freq = this.getControl('frequency').value
		const type = this.getControl('type').value

		this.data.output = this.moduleStore.audioCtx.createOscillator()
		this.data.output.type = type
		this.data.output.frequency.setValueAtTime(freq, this.moduleStore.audioCtx.currentTime)
		this.data.output.start()
	}

	updateValue(idx: number, id: string, value: number | string) {
		switch(id) {
			case 'type':
				this.data.output.type = value
			break

			case 'frequency':
				this.data.output.frequency.setValueAtTime(value, this.moduleStore.audioCtx.currentTime)
			break
		}
	}
}
