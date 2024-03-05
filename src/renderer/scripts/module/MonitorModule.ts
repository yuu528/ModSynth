import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import { NumberUtil } from '../util/NumberUtil'

import Module from './Module'

export default class MonitorModule extends Module {
	private strokeColor = 'limegreen'

	constructor() {
		super()

		this.data = {
			...this.data,
			id: 'monitor',
			name: 'Monitor',
			category: ModuleCategory.VISUAL,
			controls: [
				{
					id: 'fftMax',
					name: 'FFT Max',
					component: Component.Knob,
					min: 1e3,
					max: 16e3,
					step: 1e3,
					value: 16e3,
					si: true
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
					height: 80
				},
				{
					id: 'fft',
					name: 'FFT',
					width: 200,
					height: 80
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

		if(control === undefined) return

		switch(id) {
			case 'fftMax':
				control.value = value
			break

			case 'scopeSize':
				control.value = value
			break

			case 'scopeAmp':
				control.value = value
			break
		}
	}

	private drawScope() {
		requestAnimationFrame(() => this.drawScope())
		const canvas = document.getElementById(`m${this.data.idx}.monitor.${this.data.monitors[0].id}`) as HTMLCanvasElement

		if(canvas !== null) {
			const ctx = canvas.getContext('2d')

			if(ctx === null) return

			const scopeSizeCtrl = this.getControl('scopeSize')
			const scopeAmpCtrl = this.getControl('scopeAmp')

			if(scopeSizeCtrl === undefined || scopeAmpCtrl === undefined) return
			if(scopeSizeCtrl.max === undefined || scopeSizeCtrl.value === undefined || scopeAmpCtrl.value === undefined) return

			const maxScopeSize = scopeSizeCtrl.max as number
			const scopeSize = scopeSizeCtrl.value as number
			const scopeAmp = scopeAmpCtrl.value as number

			const input = this.inputs.input as AnalyserNode

			const len = input.frequencyBinCount / (maxScopeSize - scopeSize + 1)
			const sliceWidth = (canvas.width) / (len - 2)

			const data = new Uint8Array(len)
			input.getByteTimeDomainData(data)

			ctx.fillStyle = 'black'
			ctx.fillRect(0, 0, canvas.width, canvas.height)

			ctx.lineWidth = 2
			ctx.strokeStyle = this.strokeColor

			ctx.beginPath()

			for(let i = 0, x = 0; i < len; i++, x += sliceWidth) {
				const y = data[i] / 256 * canvas.height * scopeAmp - (canvas.height / 2) * (scopeAmp - 1)
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

	private drawFFT() {
		requestAnimationFrame(() => this.drawFFT())
		if(this.data === undefined) return
		if(this.data.monitors === undefined) return

		const canvas = document.getElementById(`m${this.data.idx}.monitor.${this.data.monitors[1].id}`) as HTMLCanvasElement

		if(canvas !== null) {
			const ctx = canvas.getContext('2d')

			if(ctx === null) return

			const input = this.inputs.input as AnalyserNode

			const len = input.frequencyBinCount

			const data = new Uint8Array(len)
			input.getByteFrequencyData(data)

			const freqStep = this.moduleStore.audioCtx.sampleRate / input.fftSize

			const fftMaxCtrl = this.getControl('fftMax')

			if(fftMaxCtrl === undefined) return

			if(fftMaxCtrl.value === undefined) return

			const fftMax = fftMaxCtrl.value as number

			const maxFreq = Math.min(fftMax, freqStep * len)

			const sliceWidth = (canvas.width) / (maxFreq / freqStep)

			const rulerMax = NumberUtil.getNiceRoundNumber(maxFreq, 3)
			const rulerCount = 6
			const rulerStep = NumberUtil.getNiceRoundNumber(rulerMax / rulerCount)

			let rulers = []
			for(let i = 0; i <= rulerMax; i += rulerStep) {
				rulers.push(i)
			}

			ctx.fillStyle = 'black'
			ctx.fillRect(0, 0, canvas.width, canvas.height)

			ctx.lineWidth = sliceWidth + 1
			ctx.strokeStyle = this.strokeColor

			ctx.fillStyle = 'white'
			ctx.font = '8px sans-serif'

			ctx.beginPath()

			for(let i = 0, x = 0; i * freqStep <= maxFreq; i++, x += sliceWidth) {
				const y = ((256 - data[i]) / 256.0) * canvas.height
				ctx.moveTo(x, canvas.height)
				ctx.lineTo(x, y)
			}

			ctx.stroke()

			ctx.beginPath()
			ctx.lineWidth = 1
			ctx.strokeStyle = 'gray'

			for(let i = 0, x = 0, r = 0; i * freqStep <= maxFreq; i++, x += sliceWidth) {
				if(i * freqStep > rulers[r]) {
					const rulerK = rulers[r] / 1e3
					let text
					if(rulerK >= 1) {
						text = `${rulerK}k`
					} else {
						text = rulers[r].toString()
					}
					const meas = ctx.measureText(text)
					const textPosX = Math.min(Math.max(0, x - meas.width / 2), canvas.width - meas.width)
					const textPosY = canvas.height - (meas.actualBoundingBoxAscent + meas.actualBoundingBoxDescent)
					const linePos = 0

					ctx.fillText(text, textPosX, textPosY)
					ctx.moveTo(x, canvas.height)
					ctx.lineTo(x, linePos)
					r++
				}
			}

			ctx.stroke()
		}
	}
}
