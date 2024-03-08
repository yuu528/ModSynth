import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import Module from './Module'

export default class EchoModule extends Module {
	constructor() {
		super()

		this.data = {
			...this.data,
			id: 'echo',
			name: 'Echo / Reverb',
			category: ModuleCategory.FILTER,
			icon: 'mdi-leak',
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
		const result = new EchoModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		const ctrls = this.getControls()

		const input = this.moduleStore.audioCtx.createGain()
		const delay = this.moduleStore.audioCtx.createDelay()
		const feedback = this.moduleStore.audioCtx.createGain()
		const dryVol = this.moduleStore.audioCtx.createGain()
		const wetVol = this.moduleStore.audioCtx.createGain()
		const mixer = this.moduleStore.audioCtx.createGain()
		const output = this.moduleStore.audioCtx.createGain()

		this.inputs.input = input
		this.intNodes.delay = delay
		this.intNodes.feedback = feedback
		this.intNodes.dryVol = dryVol
		this.intNodes.wetVol = wetVol
		this.intNodes.mixer = mixer
		this.outputs.output = output

		input.gain.setValueAtTime(1, this.moduleStore.audioCtx.currentTime)
		delay.delayTime.setValueAtTime(ctrls.time.value as number, this.moduleStore.audioCtx.currentTime)
		feedback.gain.setValueAtTime(ctrls.sustain.value as number, this.moduleStore.audioCtx.currentTime)
		dryVol.gain.setValueAtTime(1 - (ctrls.mix.value as number), this.moduleStore.audioCtx.currentTime)
		wetVol.gain.setValueAtTime(ctrls.mix.value as number, this.moduleStore.audioCtx.currentTime)
		mixer.gain.setValueAtTime(1, this.moduleStore.audioCtx.currentTime)
		output.gain.setValueAtTime(ctrls.gain.value as number, this.moduleStore.audioCtx.currentTime)

		// Diagram:
		//               -------------> output
		//              |                 ^
		//       ->  dryVol             wetVol
		//      |               ,---------^
		//    input -------> mixer ---> delay
		//                     ^          v
		//                     '------ feedback

		// input -> mixer -> delay -> feedback vol -> mixer -> wet vol -> output
		input
			.connect(mixer)
			.connect(delay)
			.connect(feedback)
			.connect(mixer)
			.connect(wetVol)
			.connect(output)

		// input -> dry vol -> output
		input
			.connect(dryVol)
			.connect(output)
	}

	updateValue(idx: number, id: string, value: number | string) {
		switch(id) {
			case 'time':
				(this.intNodes.delay as DelayNode).delayTime.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'sustain':
				(this.intNodes.feedback as GainNode).gain.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'mix':
				(this.intNodes.dryVol as GainNode).gain.setValueAtTime(1 - (value as number), this.moduleStore.audioCtx.currentTime);
				(this.intNodes.wetVol as GainNode).gain.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'gain':
				(this.outputs.output as GainNode).gain.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break
		}
	}
}
