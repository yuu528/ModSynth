import { toRaw } from 'vue'

import { Cable } from '../../stores/CableStore'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import ModuleData from './interface/ModuleData'

import Module from './Module'

export default class InputDeviceModule extends Module {
	data: ModuleData = {
		id: 'inputDevice',
		name: 'Input Device',
		category: ModuleCategory.SOURCE,
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
				name: 'Out',
				type: JackType.AUDIO_OUTPUT
			}
		]
	}

	constructor() {
		super();

		(async (data) => {
			if(data.controls === undefined) return

			const devices = (await navigator.mediaDevices.enumerateDevices()).filter(device =>
				device.kind === 'audioinput'
			).map(device => ({
				label: device.label,
				value: device.deviceId
			}))

			data.controls[0].items = devices
			data.controls[0].value = devices[0].value
		})(this.data)
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
			if(typeof ctrls.device.value !== 'string') return

			this.data.input = this.moduleStore.audioCtx.createMediaStreamSource(
				await navigator.mediaDevices.getUserMedia({
					audio: {
						deviceId: {
							exact: ctrls.device.value
						},
						autoGainControl: false,
						echoCancellation: false,
						noiseSuppression: false
					}
				})
			)

			this.data.output = this.moduleStore.audioCtx.createGain()
			this.data.input.connect(this.data.output)
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
					const removed: Cable[] = this.cableStore.remove(jackId)

					if(this.data.input !== undefined) {
						this.data.input.disconnect()
					}
					this.data.input = this.moduleStore.audioCtx.createMediaStreamSource(newStream)
					this.data.input.connect(this.data.output as AudioNode)

					for(const cable of removed) {
						this.cableStore.add(cable.j1, cable.j2)
					}
				})()
			break

			case 'volume':
				if(!(this.data.output instanceof GainNode)) return
				this.data.output.gain.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
			break
		}

	}
}
