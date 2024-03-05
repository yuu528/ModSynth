import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import { NumberUtil } from '../util/NumberUtil'

import Module from './Module'

export default class OscillatorModule extends Module {
	constructor() {
	super()

		this.data = {
			...this.data,
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
					id: 'gainInput',
					name: 'Gain CV',
					type: JackType.CV_INPUT
				},
				{
					id: 'frequencyInput',
					name: 'Freq CV',
					type: JackType.CV_INPUT
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
		const result = new OscillatorModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		const ctrls = this.getControls()

		const input = this.moduleStore.audioCtx.createOscillator()
		const cvGainInput = this.moduleStore.audioCtx.createGain()
		const cvGainInputOffset = this.moduleStore.audioCtx.createConstantSource()
		const cvGain = this.moduleStore.audioCtx.createGain()
		const cvFreq = this.moduleStore.audioCtx.createGain()
		const output = this.moduleStore.audioCtx.createGain()

		this.inputs.input = input
		this.inputs.gainInput = cvGainInput
		this.intNodes.cvGainInputOffset = cvGainInputOffset
		this.inputs.frequencyInput = cvFreq
		this.outputs.output = output

		input.type = ctrls.type.value
		input.frequency.setValueAtTime(ctrls.frequency.value as number, this.moduleStore.audioCtx.currentTime)
		cvGainInput.gain.setValueAtTime(1, this.moduleStore.audioCtx.currentTime)
		cvGainInputOffset.offset.setValueAtTime(-1, this.moduleStore.audioCtx.currentTime)
		cvGain.gain.setValueAtTime(1, this.moduleStore.audioCtx.currentTime)
		cvFreq.gain.setValueAtTime(NumberUtil.noteNumberToFreq(127), this.moduleStore.audioCtx.currentTime)
		output.gain.setValueAtTime(ctrls.volume.value as number, this.moduleStore.audioCtx.currentTime)

		cvGainInput.connect(cvGain.gain)
		cvGainInputOffset.connect(cvGain.gain)
		cvFreq.connect(input.frequency)

		input.connect(cvGain).connect(output)

		cvGainInputOffset.start()
		input.start()
	}

	onConnectedTo(jackId: string) {
		const input = this.inputs.input as OscillatorNode

		switch(jackId) {
			case 'frequencyInput':
				// when frequency input range: 0 -> 1,
				// frequency value range: noteNumberToFreq(0) -> noteNumberToFreq(127)
				// center frequency: noteNumberToFreq(0)
				input.frequency.setValueAtTime(NumberUtil.noteNumberToFreq(0), this.moduleStore.audioCtx.currentTime)

				const freqCtrl = this.getControl('frequency')
				if(freqCtrl === undefined) return
				freqCtrl.disabled = true
			break
		}
	}

	onDisconnectedTo(jackId: string) {
		const input = this.inputs.input as OscillatorNode

		switch(jackId) {
			case 'frequencyInput':
				input.frequency.setValueAtTime(this.getControls().frequency.value as number, this.moduleStore.audioCtx.currentTime)

				const freqCtrl = this.getControl('frequency')
				if(freqCtrl === undefined) return
				freqCtrl.disabled = false
			break
		}
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
