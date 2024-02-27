import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import ModuleData from './interface/ModuleData'

import Module from './Module'

export default class AudioPlayer extends Module {
	data: ModuleData = {
		id: 'audioPlayer',
		name: 'Audio Player',
		category: ModuleCategory.SOURCE,
		controls: [
			{
				id: 'file',
				name: 'File',
				component: Component.FileInput
			},
			{
				id: 'audio',
				name: 'Audio',
				component: Component.Audio
			},
			{
				id: 'seek',
				name: '',
				component: Component.Slider,
				min: 0,
				max: 0,
				step: 1,
				value: 0
			},
			{
				id: 'play',
				name: 'Play',
				component: Component.Knob,
				min: 0,
				max: 1,
				step: 1,
				value: 0,
				disabled: true
			},
			{
				id: 'volume',
				name: 'Vol',
				component: Component.Knob,
				min: 0,
				max: 1,
				step: 0.01,
				value: 0.5
			},
			{
				id: 'speed',
				name: 'Speed',
				component: Component.Knob,
				min: 0.1,
				max: 16,
				step: 0.1,
				value: 1
			},
			{
				id: 'pitchCor',
				name: 'Pitch Corr',
				component: Component.Knob,
				min: 0,
				max: 1,
				step: 1,
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

	clone() {
		const result = new AudioPlayer()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		this._onEnable(idx)

		const audioCtrl = this.getControl('audio')
		audioCtrl.elmId = `m${idx}.${audioCtrl.id}`

		const audioElm = document.getElementById(audioCtrl.elmId)

		this.data.output = this.moduleStore.audioCtx.createMediaElementSource(audioElm)

		const eventNames = [
			'canplay',
			'loadedmetadata',
			'pause',
			'play',
			'timeupdate'
		]

		eventNames.forEach(eventName => {
			audioElm.addEventListener(eventName, (event) => {
				this.moduleStore.updateValue(audioElm.dataset.moduleidx, audioElm.dataset.id, event)
			})
		})
	}

	updateValue(idx: number, id: string, value: number | File | Event) {
		const audioElm = this.data.output.mediaElement

		switch(id) {
			case 'audio':
				const seekCtrl = this.getControl('seek')
				const playCtrl = this.getControl('play')

				switch(value.type) {
					case 'canplay':
						playCtrl.disabled = false
					break

					case 'loadedmetadata':
						seekCtrl.max = value.target.duration
					break

					case 'pause':
						playCtrl.value = 0
					break

					case 'play':
						playCtrl.value = 1
					break

					case 'timeupdate':
						seekCtrl.value = value.target.currentTime
					break
				}
			break

			case 'file':
				audioElm.src = URL.createObjectURL(value)
				audioElm.load()
			break

			case 'seek':
				audioElm.currentTime = value
			break

			case 'play':
				if(value) {
					audioElm.play()
				} else {
					audioElm.pause()
				}
			break

			case 'volume':
				audioElm.volume = value
			break

			case 'speed':
				audioElm.playbackRate = value
			break

			case 'pitchCor':
				audioElm.preservesPitch = value
			break
		}
	}
}
