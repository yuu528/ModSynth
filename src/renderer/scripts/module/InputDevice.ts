import { toRaw } from 'vue'

import { Cable } from '../../stores/CableStore'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import ModuleData from './interface/ModuleData'

import Module from './Module'

export default class InputDevice extends Module {
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
		const result = new InputDevice()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		this._onEnable(idx)

		const deviceCtrl = this.getControl('device');

		if(deviceCtrl === undefined) return

		(async () => {
			if(typeof deviceCtrl.value !== 'string') return

			this.data.output = this.moduleStore.audioCtx.createMediaStreamSource(
				await navigator.mediaDevices.getUserMedia({
					audio: {
						deviceId: {
							exact: deviceCtrl.value
						}
					}
				})
			)
		})()
	}

	updateValue(idx: number, id: string, value: string) {
		switch(id) {
			case 'device':
				(async () => {
					const newStream = await navigator.mediaDevices.getUserMedia({
						audio: {
							deviceId: {
								exact: value
							}
						}
					})

					const jackId = `m${idx}.Out`
					const removed: Cable[] = this.cableStore.remove(jackId)

					this.data.output = this.moduleStore.audioCtx.createMediaStreamSource(newStream)

					for(const cable of removed) {
						this.cableStore.add(cable.j1, cable.j2)
					}
				})()
			break
		}

	}
}
