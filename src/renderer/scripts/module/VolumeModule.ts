import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import Module from './Module'

export default class VolumeModule extends Module {
	constructor() {
		super()

		this.data = {
			...this.data,
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
				},
				{
					id: 'offset',
					name: 'Offset',
					component: Component.Knob,
					min: -1,
					max: 1,
					step: 0.1,
					value: 0
				}
			],
			jacks: [
				{
					id: 'gainCvInput',
					name: 'Gain CV',
					type: JackType.CV_INPUT
				},
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
		const result = new VolumeModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		const ctrls = this.getControls()

		const input = this.moduleStore.audioCtx.createGain()
		const offset = this.moduleStore.audioCtx.createConstantSource()
		const gainCvInput = this.moduleStore.audioCtx.createGain()
		const output = this.moduleStore.audioCtx.createGain()

		this.intNodes.offset = offset

		this.inputs.gainCvInput = gainCvInput

		this.inputs.input = input
		this.outputs.output = output

		input.gain.setValueAtTime(ctrls.volume.value as number, this.moduleStore.audioCtx.currentTime)
		offset.offset.setValueAtTime(ctrls.offset.value as number, this.moduleStore.audioCtx.currentTime)

		gainCvInput.connect(output.gain)

		offset.connect(output)
		input.connect(output)

		offset.start()
	}

	updateValue(idx: number, id: string, value: number) {
		const input = this.inputs.input as GainNode
		const offset = this.intNodes.offset as ConstantSourceNode

		switch(id) {
			case 'volume':
				input.gain.setValueAtTime(value, this.moduleStore.audioCtx.currentTime)
			break

			case 'offset':
				offset.offset.setValueAtTime(value, this.moduleStore.audioCtx.currentTime)
			break
		}
	}
}
