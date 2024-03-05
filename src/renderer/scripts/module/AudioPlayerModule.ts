import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import Module from './Module'

export default class AudioPlayerModule extends Module {
	constructor() {
		super()

		this.data = {
			...this.data,
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
					id: 'output',
					name: 'Out',
					type: JackType.AUDIO_OUTPUT
				}
			]
		}
	}

	clone() {
		const result = new AudioPlayerModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		const audioCtrl = this.getControl('audio')
		if(audioCtrl === undefined) return

		audioCtrl.elmId = `m${idx}.${audioCtrl.id}`

		const audioElm = document.getElementById(audioCtrl.elmId) as HTMLAudioElement

		this.outputs.output = this.moduleStore.audioCtx.createMediaElementSource(audioElm)

		// to avoid stopping the audio when MediaElementAudioSourceNode is disconnected
		this.intNodes.analyser = this.outputs.output.connect(this.moduleStore.audioCtx.createAnalyser());

		[
			'canplay',
			'emptied',
			'loadedmetadata',
			'pause',
			'play',
			'timeupdate'
			].forEach(eventName => {
				audioElm.addEventListener(eventName, (event) => {
					this.moduleStore.updateValue(parseInt(audioElm.dataset.moduleidx as string), audioElm.dataset.id as string, event)
				})
		})
	}

	updateValue(idx: number, id: string, value: number | File | Event) {
		const output = this.outputs.output as MediaElementAudioSourceNode
		const audioElm = output.mediaElement

		switch(id) {
			case 'audio':
				if(!(value instanceof Event)) return

				const target = value.target as HTMLAudioElement

				const ctrls = this.getControls()

				switch(value.type) {
					case 'canplay':
						ctrls.play.disabled = false
					break

					case 'emptied':
						ctrls.play.value = 0
					break

					case 'loadedmetadata':
						ctrls.seek.max = target.duration
					break

					case 'pause':
						ctrls.play.value = 0
					break

					case 'play':
						ctrls.play.value = 1
					break

					case 'timeupdate':
						ctrls.seek.value = target.currentTime
					break
				}
			break

			case 'file':
				if(!(value instanceof File)) return

				audioElm.src = URL.createObjectURL(value)
				audioElm.load()
			break

			case 'seek':
				if(typeof value !== 'number') return
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
				if(typeof value !== 'number') return
				audioElm.volume = value
			break

			case 'speed':
				if(typeof value !== 'number') return
				audioElm.playbackRate = value
			break

			case 'pitchCor':
				audioElm.preservesPitch = !!value
			break
		}
	}
}
