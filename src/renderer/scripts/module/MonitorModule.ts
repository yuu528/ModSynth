import { toRaw } from 'vue'
import Chart from 'chart.js/auto'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import { NumberUtil } from '../util/NumberUtil'

import Module from './Module'

export default class MonitorModule extends Module {
	private strokeColor = 'limegreen'

	private scopeChart: Chart | null = null
	private fftChart: Chart | null = null

	constructor() {
		super()

		this.data = {
			...this.data,
			id: 'monitor',
			name: 'Monitor',
			category: ModuleCategory.VISUAL,
			icon: 'mdi-monitor-speaker',
			controls: [
				{
					id: 'minFreq',
					name: 'Min Freq',
					component: Component.Knob,
					min: 0,
					max: 19e3,
					step: 1e3,
					value: 0,
					si: true
				},
				{
					id: 'maxFreq',
					name: 'Max Freq',
					component: Component.Knob,
					min: 1e3,
					max: 20e3,
					step: 1e3,
					value: 16e3,
					si: true
				},
				{
					id: 'maxLevel',
					name: 'Max Level',
					component: Component.Knob,
					min: -99,
					max: 0,
					step: 1,
					value: -30,
					valueUnit: 'dB'
				},
				{
					id: 'minLevel',
					name: 'Min Level',
					component: Component.Knob,
					min: -100,
					max: -40,
					step: 1,
					value: -100,
					valueUnit: 'dB'
				},
				{
					id: 'scopeSize',
					name: 'Scope Size',
					component: Component.Knob,
					min: 1,
					max: 16,
					step: 1,
					value: 8
				},
				{
					id: 'scopeAmp',
					name: 'Scope Amp',
					component: Component.Knob,
					min: 1,
					max: 16,
					step: 1,
					value: 1
				}
			],
			monitors: [
				{
					id: 'oscilloscope',
					name: 'Oscilloscope',
					width: 200,
					height: 120
				},
				{
					id: 'fft',
					name: 'FFT',
					width: 200,
					height: 120
				},
			],
			jacks: [
				{
					id: 'input',
					name: 'In',
					type: JackType.AUDIO_INPUT
				}
			]
		}
	}

	clone() {
		const result = new MonitorModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		const analyser = this.moduleStore.audioCtx.createAnalyser()
		this.inputs.input = analyser

		analyser.fftSize = 2048

		this.drawScope()
		this.drawFFT()
	}

	updateValue(idx: number, id: string, value: number) {
		const control = this.getControl(id)
		const ctrls = this.getControls()
		const input = this.inputs.input as AnalyserNode

		if(control === undefined) return

		switch(id) {
			case 'maxFreq':
				ctrls.minFreq.max = value - (ctrls.minFreq.step ?? 0)
				ctrls.minFreq.value = Math.min(value, ctrls.minFreq.value as number)
			break

			case 'minFreq':
				ctrls.maxFreq.min = value + (ctrls.maxFreq.step ?? 0)
				ctrls.maxFreq.value = Math.max(value, ctrls.maxFreq.value as number)
			break

			case 'maxLevel':
				ctrls.minLevel.max = value - (ctrls.minLevel.step ?? 0)
				ctrls.minLevel.value = Math.min(value, ctrls.minLevel.value as number)

				input.minDecibels = ctrls.minLevel.value as number
				input.maxDecibels = value
			break

			case 'minLevel':
				ctrls.maxLevel.min = value + (ctrls.maxLevel.step ?? 0)
				ctrls.maxLevel.value = Math.max(value, ctrls.maxLevel.value as number)

				input.minDecibels = value
				input.maxDecibels = ctrls.maxLevel.value as number
			break
		}
	}

	private drawScope() {
		requestAnimationFrame(() => this.drawScope())
		if(this.data === undefined) return
		if(this.data.monitors === undefined) return

		const canvas = document.getElementById(`m${this.data.idx}.monitor.${this.data.monitors[0].id}`) as HTMLCanvasElement | null

		if(canvas === null) return

		const input = this.inputs.input as AnalyserNode

		const ctrls = this.getControls()

		if(ctrls.scopeSize.max === undefined) return

		const len = Math.round(input.frequencyBinCount / (ctrls.scopeSize.max - (ctrls.scopeSize.value as number) + 1))

		const byteData = new Uint8Array(len)
		input.getByteTimeDomainData(byteData)

		const data = Array.from(byteData).map((value, index) => {
			return {
				x: index,
				y: value
			}
		})

		const ySize = 256 / (ctrls.scopeAmp.value as number)
		const yRange = {
			min: 128 - ySize / 2,
			max: 128 + ySize / 2
		}

		if(this.scopeChart !== null) {
			if(this.scopeChart.options.scales?.x !== undefined) {
				this.scopeChart.options.scales.x.max = len
			}

			if(this.scopeChart.options.scales?.y !== undefined) {
				this.scopeChart.options.scales.y.min = yRange.min
				this.scopeChart.options.scales.y.max = yRange.max
			}

			this.scopeChart.data.datasets[0].data = data
			this.scopeChart.update('none')
		} else {
			this.scopeChart = new Chart(canvas, {
				type: 'scatter',
				data: {
					datasets: [{
						data: data,
						parsing: false,
						borderColor: this.strokeColor,
						borderWidth: 2,
						pointRadius: 0,
						showLine: true
					}]
				},
				options: {
					animation: false,
					events: [],
					scales: {
						x: {
							min: 0,
							max: len,
							ticks: {
								display: false
							}
						},
						y: {
							min: yRange.min,
							max: yRange.max,
							ticks: {
								display: false
							}
						}
					},
					layout: {
						padding: -5
					},
					plugins: {
						legend: {
							display: false
						}
					}
				}
			})
		}
	}

	private drawFFT() {
		requestAnimationFrame(() => this.drawFFT())
		if(this.data === undefined) return
		if(this.data.monitors === undefined) return

		const canvas = document.getElementById(`m${this.data.idx}.monitor.${this.data.monitors[1].id}`) as HTMLCanvasElement | null

		if(canvas === null) return

		const input = this.inputs.input as AnalyserNode

		const ctrls = this.getControls()

		const freqStep = this.moduleStore.audioCtx.sampleRate / input.fftSize

		const freqData = new Uint8Array(input.frequencyBinCount)
		input.getByteFrequencyData(freqData)

		const data = Array.from(freqData).map((value, index) => {
			return {
				x: (index + 1) * freqStep,
				y: value
			}
		})

		const freqRange = {
			min: Math.max(ctrls.minFreq.value as number, freqStep),
			max: ctrls.maxFreq.value as number
		}

		if(this.fftChart !== null) {
			if(this.fftChart.options.scales?.x !== undefined) {
				this.fftChart.options.scales.x.min = freqRange.min
				this.fftChart.options.scales.x.max = freqRange.max
			}

			this.fftChart.data.datasets[0].data = data
			this.fftChart.update('none')
		} else {
			this.fftChart = new Chart(canvas, {
				type: 'scatter',
				data: {
					datasets: [{
						data: data,
						parsing: false,
						borderColor: this.strokeColor,
						borderWidth: 2,
						pointRadius: 0,
						showLine: true
					}]
				},
				options: {
					animation: false,
					events: [],
					scales: {
						x: {
							type: 'logarithmic',
							max: ctrls.maxFreq.value as number,
							ticks: {
								minRotation: 90,
								maxRotation: 90,
								callback: (value) => NumberUtil.toSI(
									Math.round(value as number * 10) / 10,
									undefined,
									1
								)
							},
							grid: {
								color: 'rgba(255, 255, 255, 0.2)'
							}
						},
						y: {
							min: 0,
							max: 255,
							ticks: {
								callback: (value) => Math.round(NumberUtil.map(
									value as number,
									0, 255,
									input.minDecibels,
									input.maxDecibels
								))
							},
							grid: {
								color: 'rgba(255, 255, 255, 0.2)'
							}
						}
					},
					plugins: {
						legend: {
							display: false
						}
					}
				}
			})
		}
	}
}
