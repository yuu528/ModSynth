import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import ModuleData from './interface/ModuleData'

import Module from './Module'

export default class EchoModule extends Module {
	data: ModuleData = {
		id: 'echo',
		name: 'Echo / Reverb',
		category: ModuleCategory.FILTER,
		controls: [
			{
				id: 'time',
				name: 'Time',
				component: Component.Knob,
				min: 0,
				max: 1,
				step: 1e-3,
				value: 0.1,
				si: true
			},
			{
				id: 'sustain',
				name: 'Sus',
				component: Component.Knob,
				min: 0,
				max: 0.94,
				step: 1e-2,
				value: 0.5,
			},
			{
				id: 'mix',
				name: 'Mix',
				component: Component.Knob,
				min: 0,
				max: 1,
				step: 1e-2,
				value: 0.5
			},
			{
				id: 'gain',
				name: 'Gain',
				component: Component.Knob,
				min: 0,
				max: 1,
				step: 1e-2,
				value: 1
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
		const result = new EchoModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		this._onEnable(idx)

		const ctrls = this.getControls()

		this.data.input = this.moduleStore.audioCtx.createGain()
		this.data.intNodes = [
			this.moduleStore.audioCtx.createDelay(), // delay
			this.moduleStore.audioCtx.createGain(), // feedback(sustain)
			this.moduleStore.audioCtx.createGain(), // dry volume
			this.moduleStore.audioCtx.createGain(), // wet volume
			this.moduleStore.audioCtx.createDelay(), // dry delay
			this.moduleStore.audioCtx.createGain() // mixer before delay
		]
		this.data.output = this.moduleStore.audioCtx.createGain()

		if(
			!(this.data.input instanceof GainNode)
			|| !(this.data.intNodes[0] instanceof DelayNode)
			|| !(this.data.intNodes[1] instanceof GainNode)
			|| !(this.data.intNodes[2] instanceof GainNode)
			|| !(this.data.intNodes[3] instanceof GainNode)
			|| !(this.data.intNodes[4] instanceof DelayNode)
			|| !(this.data.intNodes[5] instanceof GainNode)
			|| !(this.data.output instanceof GainNode)
		) return

		this.data.input.gain.setValueAtTime(1, this.moduleStore.audioCtx.currentTime)
		this.data.intNodes[0].delayTime.setValueAtTime(ctrls.time.value as number, this.moduleStore.audioCtx.currentTime)
		this.data.intNodes[1].gain.setValueAtTime(ctrls.sustain.value as number, this.moduleStore.audioCtx.currentTime)
		this.data.intNodes[2].gain.setValueAtTime(1 - (ctrls.mix.value as number), this.moduleStore.audioCtx.currentTime)
		this.data.intNodes[3].gain.setValueAtTime(ctrls.mix.value as number, this.moduleStore.audioCtx.currentTime)
		this.data.intNodes[4].delayTime.setValueAtTime(ctrls.time.value as number, this.moduleStore.audioCtx.currentTime)
		this.data.intNodes[5].gain.setValueAtTime(1, this.moduleStore.audioCtx.currentTime)
		this.data.output.gain.setValueAtTime(ctrls.gain.value as number, this.moduleStore.audioCtx.currentTime)

		// Diagram:
		//               ----------> Output volume
		//              |                 ^
		//       -> Dry volume(2)     Wet volume(3)
		//      |               ,---------^
		// Input volume ---> Mixer(5) -> Delay(0)
		//                     ^            v
		//                     '-- Feedback volume(1)

		// input -> mixer -> delay -> feedback vol -> mixer -> wet vol -> output
		this.data.input
			.connect(this.data.intNodes[5]) // mixer
			.connect(this.data.intNodes[0]) // delay
			.connect(this.data.intNodes[1]) // feedback vol
			.connect(this.data.intNodes[5]) // mixer
			.connect(this.data.intNodes[3]) // wet vol
			.connect(this.data.output)

		// input -> dry vol -> output
		this.data.input
			.connect(this.data.intNodes[2])
			.connect(this.data.output)
	}

	updateValue(idx: number, id: string, value: number | string) {
		if(
			!(this.data.input instanceof GainNode)
			|| this.data.intNodes === undefined
			|| this.data.intNodes.length < 4
			|| !(this.data.intNodes[0] instanceof DelayNode)
			|| !(this.data.intNodes[1] instanceof GainNode)
			|| !(this.data.intNodes[2] instanceof GainNode)
			|| !(this.data.intNodes[3] instanceof GainNode)
			|| !(this.data.intNodes[4] instanceof DelayNode)
			|| !(this.data.output instanceof GainNode)
		) return

		switch(id) {
			case 'time':
				this.data.intNodes[0].delayTime.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
				this.data.intNodes[4].delayTime.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'sustain':
				this.data.intNodes[1].gain.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'mix':
				this.data.intNodes[2].gain.setValueAtTime(1 - (value as number), this.moduleStore.audioCtx.currentTime)
				this.data.intNodes[3].gain.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'gain':
				this.data.output.gain.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break
		}
	}
}
