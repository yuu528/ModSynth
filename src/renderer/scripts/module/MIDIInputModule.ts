import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import { NumberUtil } from '../util/NumberUtil'

import Module from './Module'

export default class MIDIInputModule extends Module {
	private midiListener: AbortController
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
					id: 'gateOutput',
					name: 'Gate Out',
					type: JackType.CV_OUTPUT
				},
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

		this.midiListener = new AbortController()
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

		const gateOutput = this.moduleStore.audioCtx.createConstantSource()
		const velocityOutput = this.moduleStore.audioCtx.createConstantSource()
		const pitchOutput = this.moduleStore.audioCtx.createConstantSource()

		gateOutput.offset.setValueAtTime(0, this.moduleStore.audioCtx.currentTime)
		velocityOutput.offset.setValueAtTime(0, this.moduleStore.audioCtx.currentTime)
		pitchOutput.offset.setValueAtTime(0, this.moduleStore.audioCtx.currentTime)

		this.outputs.gateOutput = gateOutput
		this.outputs.velocityOutput = velocityOutput
		this.outputs.pitchOutput = pitchOutput

		gateOutput.start()
		velocityOutput.start()
		pitchOutput.start()

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
		this.midiListener.abort()

		this.midiListener = new AbortController()

		if(this.moduleStore.midiAccess === undefined) return

		for(const input of this.moduleStore.midiAccess.inputs.values()) {
			if(input.id === id) {
				input.addEventListener(
					'midimessage',
					this.onMIDIMessage.bind(this),
					{ signal: this.midiListener.signal }
				)
			}
		}
	}

	private setParams(note?: number, velocity?: number) {
		const gateOutput = this.outputs.gateOutput as ConstantSourceNode
		const pitchOutput = this.outputs.pitchOutput as ConstantSourceNode
		const velocityOutput = this.outputs.velocityOutput as ConstantSourceNode

		if(note !== undefined) {
			pitchOutput.offset.setValueAtTime(
				NumberUtil.map(
					NumberUtil.noteNumberToFreq(note),
					NumberUtil.noteNumberToFreq(0),
					NumberUtil.noteNumberToFreq(127),
					0, 1
				),
				this.moduleStore.audioCtx.currentTime
			)
		}

		if(velocity !== undefined) {
			velocityOutput.offset.setValueAtTime(
				NumberUtil.map(velocity, 0, 127, 0, 1),
				this.moduleStore.audioCtx.currentTime
			)

			gateOutput.offset.setValueAtTime(
				velocity === 0 ? 0 : 1,
				this.moduleStore.audioCtx.currentTime
			)
		}
	}

	private onMIDIMessage(event: MIDIMessageEvent) {
		if((event.data[0] & 0xf0) === 0x90 && event.data[2] !== 0) { // Note on
			this.setParams(event.data[1], event.data[2])
			this.notes.push([event.data[1], event.data[2]])
		}

		if((event.data[0] & 0xf0) === 0x80 || event.data[2] === 0) { // Note off
			this.notes = this.notes.filter(note => note[0] !== event.data[1])

			if(this.notes.length === 0) {
				this.setParams(undefined, 0)
			} else {
				this.setParams(this.notes.slice(-1)[0][0], this.notes.slice(-1)[0][1])
			}
		}
	}
}
