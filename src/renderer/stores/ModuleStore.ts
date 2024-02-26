import { ref, toRaw, nextTick } from 'vue'
import { defineStore } from 'pinia'

import { useCableStore } from './CableStore'

import { NumberUtil } from '../scripts/util/NumberUtil'

export const useModuleStore = defineStore('module', () => {
	const cableStore = useCableStore()

	const mimes = ref({
		moduleId: 'application/msmodule.id',
		moduleType: 'application/msmodule.type',
		moduleIdx: 'application/msmodule.idx',
		moduleDragOffsetX: 'application/msmodule.dox',
		moduleDragOffsetY: 'application/msmodule.doy'
	})

	const moduleTypes = ref({
		base: 'base',
		enabled: 'enabled'
	})

	const jackTypes = ref({
		audioInput: 'audioInput',
		audioOutput: 'audioOutput',
		cvInput: 'cvInput',
		cvOutput: 'cvOutput'
	})

	const moduleCategories = ref({
		source: 'Source',
		visual: 'Visual',
		filter: 'Filter'
	})

	const modules = ref({
		volume: {
			name: 'Volume',
			category: moduleCategories.value.filter,
			controls: [
				{
					id: 'volume',
					name: 'Vol',
					component: 'Knob',
					min: 0,
					max: 2,
					step: 0.1,
					value: 0.5
				}
			],
			jacks: [
				{
					name: 'In',
					type: jackTypes.value.audioInput
				},
				{
					name: 'Out',
					type: jackTypes.value.audioOutput
				}
			]
		},
		oscillator: {
			name: 'Osc',
			category: moduleCategories.value.source,
			controls: [
				{
					id: 'type',
					name: 'Type',
					component: 'VSelect',
					items: [
						{
							name: 'sine',
							image: '/images/waveforms/sine.svg'
						},
						{
							name: 'square',
							image: '/images/waveforms/square.svg'
						},
						{
							name: 'sawtooth',
							image: '/images/waveforms/sawtooth.svg'
						},
						{
							name: 'triangle',
							image: '/images/waveforms/triangle.svg'
						}
					],
					value: 'sine'
				},
				{
					id: 'frequency',
					name: 'Freq',
					component: 'Knob',
					min: 1,
					max: 16e3,
					step: 1,
					value: 1e3
				}
			],
			jacks: [
				{
					name: 'Out',
					type: jackTypes.value.audioOutput
				}
			]
		},
		monitor: {
			name: 'Monitor',
			category: moduleCategories.value.visual,
			controls: [
				{
					id: 'fftMax',
					name: 'FFT Max',
					component: 'Knob',
					min: 1e3,
					max: 16e3,
					step: 1e3,
					value: 16e3,
					si: true
				},
				{
					id: 'scopeSize',
					name: 'Scope Size',
					component: 'Knob',
					min: 1,
					max: 16,
					step: 1,
					value: 8
				}
			],
			monitors: [
				{
					id: 'oscilloscope',
					name: 'Oscilloscope',
					width: 200,
					height: 80
				},
				{
					id: 'fft',
					name: 'FFT',
					width: 200,
					height: 80
				}
			],
			jacks: [
				{
					name: 'In',
					type: jackTypes.value.audioInput
				}
			]
		},
		audioPlayer: {
			name: 'Audio Player',
			category: moduleCategories.value.source,
			controls: [
				{
					id: 'file',
					name: 'File',
					component: 'VFileInput'
				},
				{
					id: 'audio',
					name: 'Audio',
					component: 'audio'
				},
				{
					id: 'seek',
					name: '',
					component: 'VSlider',
					min: 0,
					max: 0,
					step: 1,
					value: 0
				},
				{
					id: 'play',
					name: 'Play',
					component: 'Knob',
					min: 0,
					max: 1,
					step: 1,
					value: 0,
					disabled: true
				},
				{
					id: 'volume',
					name: 'Vol',
					component: 'Knob',
					min: 0,
					max: 1,
					step: 0.1,
					value: 0.5
				},
				{
					id: 'speed',
					name: 'Speed',
					component: 'Knob',
					min: 0.3,
					max: 4,
					step: 0.1,
					value: 1
				},
				{
					id: 'pitchCor',
					name: 'Pitch Corr',
					component: 'Knob',
					min: 0,
					max: 1,
					step: 1,
					value: 1
				}
			],
			jacks: [
				{
					name: 'Out',
					type: jackTypes.value.audioOutput
				}
			]
		},
		inputDevice: {
			name: 'Input Device',
			category: moduleCategories.value.source,
			controls: [
				{
					id: 'device',
					name: 'Device',
					component: 'VSelect',
					items: [],
					value: ''
				}
			],
			jacks: [
				{
					name: 'Out',
					type: jackTypes.value.audioOutput
				}
			]
		}
	})

	const enabledModules = ref([])

	const audioCtx = ref(new window.AudioContext())

	// initialize input device list
	const initDevices = async () => {
		modules.value.inputDevice.controls[0].items = (await navigator.mediaDevices.enumerateDevices()).filter(device =>
			device.kind === 'audioinput'
			).map(device => ({
				name: device.label,
				value: device.deviceId
		}))
		modules.value.inputDevice.controls[0].value = modules.value.inputDevice.controls[0].items[0].value
	}
	initDevices()

	async function add(module) {
		const idx = enabledModules.value.push(module) - 1

		let defaultVal
		switch(module.id) {
			case 'volume':
				defaultVal = module.controls.find(control => control.id == 'volume').value
				module.input = audioCtx.value.createGain()
				module.input.gain.setValueAtTime(defaultVal, audioCtx.value.currentTime)
				module.output = module.input
			break

			case 'oscillator':
				defaultVal = module.controls.find(control => control.id == 'frequency').value
				module.output = audioCtx.value.createOscillator()
				module.output.type = "sine"
				module.output.frequency.setValueAtTime(defaultVal, audioCtx.value.currentTime)
				module.output.start()
			break

			case 'monitor':
				module.input = audioCtx.value.createAnalyser()
				module.input.fftSize = 2048
				module.monitors[0].draw = () => {
					requestAnimationFrame(module.monitors[0].draw)
					const canvas = document.getElementById(`m${idx}.monitor.${module.monitors[0].id}`)

					if(canvas !== null) {
						const ctx = canvas.getContext('2d')

						const scopeSizeControl = module.controls.find(control => control.id === 'scopeSize')
						const maxScopeSize = scopeSizeControl.max
						let scopeSize = scopeSizeControl.value

						if(module.monitors[0].scopeSize !== undefined) {
							scopeSize = module.monitors[0].scopeSize
						}

						const len = module.input.frequencyBinCount / (maxScopeSize - scopeSize + 1)
						const sliceWidth = (canvas.width) / (len - 2)

						const data = new Uint8Array(len)
						module.input.getByteTimeDomainData(data)

						ctx.fillStyle = 'rgb(0, 0, 0)'
						ctx.fillRect(0, 0, canvas.width, canvas.height)

						ctx.lineWidth = 2
						ctx.strokeStyle = 'rgb(255, 255, 255)'

						ctx.beginPath()

						for(let i = 0, x = 0; i < len; i++, x += sliceWidth) {
							const y = (data[i] / 128.0 * canvas.height) / 2
							if(i === 0) {
								ctx.moveTo(x, y)
							} else {
								ctx.lineTo(x, y)
							}
						}

						ctx.lineTo(canvas.width + ctx.lineWidth, canvas.height / 2)

						ctx.stroke()
					}
				}

				module.monitors[1].draw = () => {
					requestAnimationFrame(module.monitors[1].draw)
					const canvas = document.getElementById(`m${idx}.monitor.${module.monitors[1].id}`)

					if(canvas !== null) {
						const ctx = canvas.getContext('2d')

						const len = module.input.frequencyBinCount

						const data = new Uint8Array(len)
						module.input.getByteFrequencyData(data)

						const freqStep = audioCtx.value.sampleRate / module.input.fftSize

						let fftMax = module.controls.find(control => control.id === 'fftMax').value

						if(module.monitors[1].fftMax !== undefined) {
							fftMax = module.monitors[1].fftMax
						}
						const maxFreq = Math.min(fftMax, freqStep * len)

						const sliceWidth = (canvas.width) / (maxFreq / freqStep)

						const rulerMax = NumberUtil.getNiceRoundNumber(maxFreq, 3)
						const rulerCount = 6
						const rulerStep = NumberUtil.getNiceRoundNumber(rulerMax / rulerCount)

						let rulers = []
						for(let i = 0; i <= rulerMax; i += rulerStep) {
							rulers.push(i)
						}

						ctx.fillStyle = 'rgb(0, 0, 0)'
						ctx.fillRect(0, 0, canvas.width, canvas.height)

						ctx.lineWidth = sliceWidth + 1
						ctx.strokeStyle = 'rgb(255, 255, 255)'

						ctx.fillStyle = 'rgb(255, 255, 255)'
						ctx.font = '8px sans-serif'

						ctx.beginPath()

						for(let i = 0, x = 0; i * freqStep <= maxFreq; i++, x += sliceWidth) {
							const y = ((256 - data[i]) / 256.0) * canvas.height
							ctx.moveTo(x, canvas.height)
							ctx.lineTo(x, y)
						}

						ctx.stroke()

						ctx.beginPath()
						ctx.lineWidth = 2

						for(let i = 0, x = 0, r = 0; i * freqStep <= maxFreq; i++, x += sliceWidth) {
							if(i * freqStep > rulers[r]) {
								const rulerK = rulers[r] / 1e3
								let text
								if(rulerK >= 1) {
									text = `${rulerK}k`
								} else {
									text = rulers[r]
								}
								const meas = ctx.measureText(text)
								const textPosX = Math.min(Math.max(0, x - meas.width / 2), canvas.width - meas.width)
								const textPosY = canvas.height - (meas.actualBoundingBoxAscent + meas.actualBoundingBoxDescent)
								const linePos = canvas.height - 5

								ctx.fillText(text, textPosX, textPosY)
								ctx.moveTo(x, canvas.height)
								ctx.lineTo(x, linePos)
								r++
							}
						}

						ctx.stroke()
					}
				}
				module.monitors[0].draw()
				module.monitors[1].draw()
			break

			case 'audioPlayer':
				nextTick(() => {
					const audioCtrlIdx = module.controls.findIndex(control => control.id === 'audio')
					module.controls[audioCtrlIdx].elmId = `m${idx}.${module.controls[audioCtrlIdx].id}`

					const audioElm = document.getElementById(module.controls[audioCtrlIdx].elmId)

					module.output = audioCtx.value.createMediaElementSource(audioElm)

					const eventNames = [
						'canplay',
						'loadedmetadata',
						'pause',
						'play',
						'timeupdate'
					]

					eventNames.forEach(eventName => {
						audioElm.addEventListener(eventName, (event) => {
							updateValue(audioElm.dataset.moduleidx, audioElm.dataset.id, event)
						})
					})
				})
			break

			case 'inputDevice':
				const deviceCtrlIdx = module.controls.findIndex(control => control.id === 'device')
				module.output = audioCtx.value.createMediaStreamSource(
					await navigator.mediaDevices.getUserMedia({
						audio: {
							deviceId: {
								exact: module.controls[deviceCtrlIdx].value
							}
						}
					})
				)
			break
		}
	}

	function remove(idx) {
		enabledModules.value[idx].input?.disconnect()
		enabledModules.value[idx].output?.disconnect()
		delete enabledModules.value[idx]
		nextTick(() => {
			cableStore.updateCables()
		})
	}

	async function updateValue(idx, id, value) {
		const module = enabledModules.value[idx]

		if(module !== undefined) {
			switch(module.id) {
				case 'volume':
					switch(id) {
						case 'volume':
							module.input.gain.setValueAtTime(value, audioCtx.value.currentTime)
						break
					}
				break

				case 'oscillator':
					switch(id) {
						case 'type':
							module.output.type = value
						break

						case 'frequency':
							module.output.frequency.setValueAtTime(value, audioCtx.value.currentTime)
						break
					}
				break

				case 'monitor':
					switch(id) {
						case 'fftMax':
							module.monitors[1].fftMax = value
						break

						case 'scopeSize':
							module.monitors[0].scopeSize = value
						break
					}
				break

				case 'audioPlayer':
					const audioElm = module.output.mediaElement

					switch(id) {
						case 'audio':
							const seekCtrlIdx = module.controls.findIndex(control => control.id === 'seek')
							const playCtrlIdx = module.controls.findIndex(control => control.id === 'play')

							switch(value.type) {
								case 'canplay':
									module.controls[playCtrlIdx].disabled = false
								break

								case 'loadedmetadata':
									module.controls[seekCtrlIdx].max = value.target.duration
								break

								case 'pause':
									module.controls[playCtrlIdx].value = 0
								break

								case 'play':
									module.controls[playCtrlIdx].value = 1
								break

								case 'timeupdate':
									module.controls[seekCtrlIdx].value = value.target.currentTime
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
				break

				case 'inputDevice':
					switch(id) {
						case 'device':
							const newStream = await navigator.mediaDevices.getUserMedia({
								audio: {
									deviceId: {
										exact: value
									}
								}
							})

							const jackId = `m${idx}.Out`
							const removed = cableStore.remove(jackId)

							module.output = audioCtx.value.createMediaStreamSource(newStream)

							for(const cable of removed) {
								cableStore.add(cable.j1, cable.j2)
							}
						break
					}
				break
			}
		}
	}

	function baseDragStart(event) {
		event.dataTransfer.setData(mimes.value.moduleId, event.target.dataset.id)
		event.dataTransfer.setData(mimes.value.moduleType, moduleTypes.value.base)
		event.dataTransfer.setData(
			mimes.value.moduleDragOffsetX,
			event.clientX - event.target.getBoundingClientRect().left - window.scrollX
		)
		event.dataTransfer.setData(
			mimes.value.moduleDragOffsetY,
			event.clientY - event.target.getBoundingClientRect().top - window.scrollY
		)
	}

	function baseDragOver(event) {
		if(event.dataTransfer.types.includes(mimes.value.moduleType)) {
			event.preventDefault()
		}
	}

	function baseDrop(event) {
		if(event.dataTransfer.types.includes(mimes.value.moduleType)) {
			if(event.dataTransfer.getData(mimes.value.moduleType) == moduleTypes.value.enabled) {
				const idx = event.dataTransfer.getData(mimes.value.moduleIdx)
				remove(idx)
			}
		}
	}

	function dragStart(event) {
		event.dataTransfer.setData(mimes.value.moduleType, moduleTypes.value.enabled)
		event.dataTransfer.setData(mimes.value.moduleIdx, event.target.dataset.idx)
		event.dataTransfer.setData(
			mimes.value.moduleDragOffsetX,
			event.clientX - event.target.getBoundingClientRect().left - window.scrollX
		)
		event.dataTransfer.setData(
			mimes.value.moduleDragOffsetY,
			event.clientY - event.target.getBoundingClientRect().top - window.scrollY
		)
	}

	function dragOver(event) {
		if(event.dataTransfer.types.includes(mimes.value.moduleType)) {
			event.preventDefault()
		}
	}

	function dragEnd(event) {
		event.dataTransfer.clearData()
	}

	function drop(event) {
		if(event.dataTransfer.types.includes(mimes.value.moduleType) && !event.dataTransfer.types.includes(cableStore.mimes.cableId1)) {
			const offsetX = event.dataTransfer.getData(mimes.value.moduleDragOffsetX)
			const offsetY = event.dataTransfer.getData(mimes.value.moduleDragOffsetY)

			switch(event.dataTransfer.getData(mimes.value.moduleType)) {
				case moduleTypes.value.base:
					const id = event.dataTransfer.getData(mimes.value.moduleId)

					let module = structuredClone(toRaw(modules.value[id]))

					module.id = id
					module.pos = {
						x: event.clientX - offsetX,
						y: event.clientY - offsetY
					}

					add(module)
				break

				case moduleTypes.value.enabled:
					const idx = event.dataTransfer.getData(mimes.value.moduleIdx)

					enabledModules.value[idx].pos = {
						x: event.clientX - offsetX,
						y: event.clientY - offsetY
					}

					nextTick(() => {
						cableStore.updateCables()
					})
				break
			}
		}
	}

	return {
		mimes, moduleTypes, jackTypes, moduleCategories,
		modules, enabledModules, audioCtx,
		add, remove, updateValue,
		baseDragStart, baseDragOver, baseDrop,
		dragStart, dragOver, dragEnd, drop
	}
})
