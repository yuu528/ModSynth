import { toRaw } from 'vue'

import { Cable } from '../../stores/CableStore'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import Module from './Module'

export default class InputDeviceModule extends Module {
	constructor() {
		super()

		this.data = {
			...this.data,
			id: 'inputDevice',
			name: 'Input Device',
			category: ModuleCategory.SOURCE,
			icon: 'mdi-audio-input-stereo-minijack',
			controls: [
				{
					id: 'device',
					name: 'Device',
					component: Component.Select,
					items: [],
					value: ''
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
					id: 'output',
					name: 'Out',
					type: JackType.AUDIO_OUTPUT
				}
			]
		}
	}

	async init() {
		if(this.data.controls === undefined) return

		const devices = (await navigator.mediaDevices.enumerateDevices()).filter(device =>
			device.kind === 'audioinput'
		).map(device => ({
			label: device.label,
			value: device.deviceId
		}))

		this.data.controls[0].items = devices
		this.data.controls[0].value = devices[0].value
	}

	clone() {
		const result = new InputDeviceModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		const ctrls = this.getControls();

		(async () => {
			this.inputs.input = this.moduleStore.audioCtx.createMediaStreamSource(
				await navigator.mediaDevices.getUserMedia({
					audio: {
						deviceId: {
							exact: ctrls.device.value as string
						},
						autoGainControl: false,
						echoCancellation: false,
						noiseSuppression: false
					}
				})
			)

			this.outputs.output = this.moduleStore.audioCtx.createGain()
			this.inputs.input.connect(this.outputs.output)
		})()
	}

	updateValue(idx: number, id: string, value: number | string) {
		switch(id) {
			case 'device':
				(async () => {
					const newStream = await navigator.mediaDevices.getUserMedia({
						audio: {
							deviceId: {
								exact: value as string
							}
						}
					})

					const jackId = `m${idx}.Out`
					const removed: Cable[] = this.cableStore.remove(jackId);

					(this.inputs.input as AudioNode).disconnect()
					this.inputs.input = this.moduleStore.audioCtx.createMediaStreamSource(newStream)
					this.inputs.input.connect(this.outputs.output)

					for(const cable of removed) {
						this.cableStore.add(cable.j1, cable.j2)
					}
				})()
			break

			case 'volume':
				(this.outputs.output as GainNode).gain.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break
		}

	}
}
