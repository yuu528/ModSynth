import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import Module from './Module'

export default class MIDIInputModule extends Module {
	private notes: number[][] = []

	constructor() {
		super()

		this.data = {
			...this.data,
			id: 'midiInput',
			name: 'MIDI Input',
			category: ModuleCategory.SOURCE,
			controls: [
				{
					id: 'device',
					name: 'Device',
					component: Component.Select,
					items: [],
					value: ''
				}
			],
			jacks: [
				{
					id: 'velocityOutput',
					name: 'Vel Out',
					type: JackType.CV_OUTPUT
				},
				{
					id: 'pitchOutput',
					name: 'Pitch Out',
					type: JackType.CV_OUTPUT
				}
			]
		}
	}

	async init() {
		const ctrls = this.getControls()

		if(ctrls.device.items === undefined || this.moduleStore.midiAccess === undefined) return

		for(const input of this.moduleStore.midiAccess.inputs.values()) {
			ctrls.device.items.push({
				value: input.id,
				label: input.name
			})
		}

		if(ctrls.device.items.length !== 0) {
			ctrls.device.value = ctrls.device.items[0].value
		}
	}

	clone() {
		const result = new MIDIInputModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		const ctrls = this.getControls()

		const midi = new AudioWorkletNode(
			this.moduleStore.audioCtx,
			'MIDIInputProcessor',
			{
				numberOfOutputs: 2
			}
		)
		const velocityOutput = this.moduleStore.audioCtx.createGain()
		const pitchOutput = this.moduleStore.audioCtx.createGain()

		this.intNodes.midi = midi
		this.outputs.velocityOutput = velocityOutput
		this.outputs.pitchOutput = pitchOutput

		midi.connect(velocityOutput, 0)
		midi.connect(pitchOutput, 1)

		this.enableMIDIInput(ctrls.device.value as string)
	}

	updateValue(idx: number, id: string, value: number | string) {
		switch(id) {
			case 'device':
				this.enableMIDIInput(value as string)
			break
		}
	}

	private enableMIDIInput(id: string) {
		if(this.moduleStore.midiAccess === undefined) return

		for(const input of this.moduleStore.midiAccess.inputs.values()) {
			if(input.id === id) {
				input.addEventListener('midimessage', (event: MIDIMessageEvent) => this.onMIDIMessage(event))
			} else {
				input.removeEventListener('midimessage', this.onMIDIMessage)
			}
		}
	}

	private onMIDIMessage(event: MIDIMessageEvent) {
		const midi = this.intNodes.midi as AudioWorkletNode

		const noteParam = midi.parameters.get('note')
		const velParam = midi.parameters.get('velocity')

		if((event.data[0] & 0xf0) === 0x90 && event.data[2] !== 0) { // Note on
			noteParam.setValueAtTime(event.data[1], this.moduleStore.audioCtx.currentTime)
			velParam.setValueAtTime(event.data[2], this.moduleStore.audioCtx.currentTime)
			this.notes.push([event.data[1], event.data[2]])
			console.log(this.notes)
		}

		if((event.data[0] & 0xf0) === 0x80 || event.data[2] === 0) { // Note off
			this.notes = this.notes.filter(note => note[0] !== event.data[1])

			if(this.notes.length === 0) {
				noteParam.setValueAtTime(0, this.moduleStore.audioCtx.currentTime)
				velParam.setValueAtTime(0, this.moduleStore.audioCtx.currentTime)
			} else {
				noteParam.setValueAtTime(this.notes.slice(-1)[0][0], this.moduleStore.audioCtx.currentTime)
				velParam.setValueAtTime(this.notes.slice(-1)[0][1], this.moduleStore.audioCtx.currentTime)
			}
		}
	}
}
