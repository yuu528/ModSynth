import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import Module from './Module'

export default class CompressorModule extends Module {
	constructor() {
		super()

		this.data = {
			...this.data,
			id: 'compressor',
			name: 'Compressor',
			category: ModuleCategory.FILTER,
			icon: 'mdi-tune-vertical',
			controls: [
				{
					id: 'threshold',
					name: 'Thresh',
					component: Component.Knob,
					min: -100,
					max: 0,
					step: 1,
					value: -24,
					valueUnit: 'dB'
				},
				{
					id: 'knee',
					name: 'Knee',
					component: Component.Knob,
					min: 0,
					max: 40,
					step: 1,
					value: 30,
					valueUnit: 'dB'
				},
				{
					id: 'ratio',
					name: 'Ratio',
					component: Component.Knob,
					min: 1,
					max: 20,
					step: 1,
					value: 12,
					valueUnit: ':1'
				},
				{
					id: 'attack',
					name: 'Atk',
					component: Component.Knob,
					min: 0,
					max: 1,
					step: 1e-3,
					value: 3e-3,
					si: true,
					valueUnit: 's'
				},
				{
					id: 'release',
					name: 'Rel',
					component: Component.Knob,
					min: 0,
					max: 1,
					step: 1e-3,
					value: 0.25,
					si: true,
					valueUnit: 's'
				},
				{
					id: 'gainReduction',
					name: 'GR',
					component: Component.Progress,
					min: -20,
					max: 0,
					value: 0,
					valueUnit: 'dB',
					color: 'gray',
					bgColor: 'red'
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
		const result = new CompressorModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		const ctrls = this.getControls();

		const output = this.moduleStore.audioCtx.createDynamicsCompressor()
		this.outputs.output = output

		output.threshold.setValueAtTime(ctrls.threshold.value as number, this.moduleStore.audioCtx.currentTime)
		output.knee.setValueAtTime(ctrls.knee.value as number, this.moduleStore.audioCtx.currentTime)
		output.ratio.setValueAtTime(ctrls.ratio.value as number, this.moduleStore.audioCtx.currentTime)
		output.attack.setValueAtTime(ctrls.attack.value as number, this.moduleStore.audioCtx.currentTime)
		output.release.setValueAtTime(ctrls.release.value as number, this.moduleStore.audioCtx.currentTime)

		this.inputs.input = output

		this.drawGR()
	}

	updateValue(idx: number, id: string, value: number | string) {
		const output = this.outputs.output as DynamicsCompressorNode

		switch(id) {
			case 'threshold':
				output.threshold.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'knee':
				output.knee.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'ratio':
				output.ratio.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'attack':
				output.attack.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'release':
				output.release.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break

			case 'gainReduction':
				const ctrl = this.getControl('gainReduction')
				if(ctrl === undefined) return
				ctrl.value = value as number
			break
		}
	}

	private drawGR() {
		requestAnimationFrame(() => this.drawGR())

		const ctrl = this.getControl('gainReduction')
		const output = this.data.outputs.output as DynamicsCompressorNode

		if(ctrl === undefined) return

		this.moduleStore.updateValue(this.data.idx, ctrl.id, output.reduction as number)
	}
}
