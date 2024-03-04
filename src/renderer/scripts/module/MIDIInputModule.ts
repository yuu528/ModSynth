import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import ModuleData from './interface/ModuleData'

import Module from './Module'

export default class MIDIInputModule extends Module {
	data: ModuleData = {
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
				name: 'Vel Out',
				type: JackType.CV_OUTPUT,
				index: 0
			},
			{
				name: 'Pitch Out',
				type: JackType.CV_OUTPUT,
				index: 1
			}
		]
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

		this.data.output = new AudioWorkletNode(
			this.moduleStore.audioCtx,
			'MIDIInputProcessor',
			{
				numberOfOutputs: 2
			}
		)
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
		if(!(this.data.output instanceof AudioWorkletNode)) return

		const noteParam = this.data.output.parameters.get('note')
		const velParam = this.data.output.parameters.get('velocity')

		if((event.data[0] & 0xf0) === 0x90) { // Note on
			noteParam.setValueAtTime(event.data[1], this.moduleStore.audioCtx.currentTime)
			velParam.setValueAtTime(event.data[2], this.moduleStore.audioCtx.currentTime)
		}

		if((event.data[0] & 0xf0) === 0x80) { // Note off
			noteParam.setValueAtTime(0, this.moduleStore.audioCtx.currentTime)
			velParam.setValueAtTime(0, this.moduleStore.audioCtx.currentTime)
		}
	}
}
