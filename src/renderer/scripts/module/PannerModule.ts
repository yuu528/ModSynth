import { toRaw } from 'vue'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import ModuleData from './interface/ModuleData'

import Module from './Module'

import { NumberUtil } from '../util/NumberUtil'

export default class PannerModule extends Module {
	data: ModuleData = {
		id: 'panner',
		name: 'Panner(Beta)',
		category: ModuleCategory.FILTER,
		monitors: [
			{
				id: 'hMonitor',
				name: 'Plan View',
				width: 200,
				height: 50
			},
			{
				id: 'vMonitor',
				name: 'Side View',
				width: 200,
				height: 100
			}
		],
		controls: [
			{
				id: 'innerAngle',
				name: 'Inner Angle',
				component: Component.Knob,
				min: 0,
				max: 360,
				step: 1,
				value: 60
			},
			{
				id: 'outerAngle',
				name: 'Outer Angle',
				component: Component.Knob,
				min: 0,
				max: 360,
				step: 1,
				value: 90
			},
			{
				id: 'outerGain',
				name: 'Outer Gain',
				component: Component.Knob,
				min: 0,
				max: 1,
				step: 0.1,
				value: 0
			},
			{
				id: 'distanceModel',
				name: 'Dist Type',
				component: Component.Knob,
				min: 0,
				max: 2,
				step: 1,
				value: 1,
				valueLabels: ['Lin', 'Inv', 'Exp']
			},
			{
				id: 'hDeg',
				name: 'H Rot',
				component: Component.Knob,
				min: -360,
				max: 360,
				step: 1,
				value: 0
			},
			{
				id: 'vDeg',
				name: 'V Rot',
				component: Component.Knob,
				min: -360,
				max: 360,
				step: 1,
				value: 0
			},
			{
				id: 'panningModel',
				name: 'Pan Type',
				component: Component.Knob,
				min: 0,
				max: 1,
				step: 1,
				value: 0,
				valueLabels: ['EP', 'HRTF']
			},
			{
				id: 'x',
				name: 'X',
				component: Component.Knob,
				min: -100,
				max: 100,
				step: 1,
				value: 0
			},
			{
				id: 'y',
				name: 'Y',
				component: Component.Knob,
				min: -100,
				max: 100,
				step: 1,
				value: 0
			},
			{
				id: 'z',
				name: 'Z',
				component: Component.Knob,
				min: -100,
				max: 100,
				step: 1,
				value: 0
			},
		],
		jacks: [
			{
				name: 'In',
				type: JackType.AUDIO_INPUT
			},
			{
				name: 'Out',
				type: JackType.AUDIO_OUTPUT
			}
		]
	}

	clone() {
		const result = new PannerModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		this._onEnable(idx)

		const ctrls = this.getControls()

		this.data.output = this.moduleStore.audioCtx.createPanner()

		if(!(this.data.output instanceof PannerNode)) return

		this.data.output.coneInnerAngle = ctrls.innerAngle.value as number
		this.data.output.coneOuterAngle = ctrls.outerAngle.value as number
		this.data.output.coneOuterGain = ctrls.outerGain.value as number
		this.data.output.distanceModel = ['linear', 'inverse', 'exponential'][ctrls.distanceModel.value as number]

		this.updateOrientation(ctrls.hDeg.value as number, ctrls.vDeg.value as number)

		this.data.output.panningModel = ['equalpower', 'HRTF'][ctrls.panningModel.value as number]

		this.data.output.positionX.setValueAtTime(ctrls.x.value as number, this.moduleStore.audioCtx.currentTime)
		this.data.output.positionY.setValueAtTime(ctrls.y.value as number, this.moduleStore.audioCtx.currentTime)
		this.data.output.positionZ.setValueAtTime(-(ctrls.z.value as number), this.moduleStore.audioCtx.currentTime)

		this.data.input = this.data.output

		this.draw()
	}

	updateValue(idx: number, id: string, value: number | string) {
		if(!(this.data.output instanceof PannerNode)) return

		switch(id) {
			case 'innerAngle':
				this.data.output.coneInnerAngle = value as number
			break

			case 'outerAngle':
			this.data.output.coneOuterAngle = value as number
			break

			case 'outerGain':
			this.data.output.coneOuterGain = value as number
			break

			case 'distanceModel':
				this.data.output.distanceModel = ['linear', 'inverse', 'exponential'][value as number]
			break

			case 'hDeg':
				{
					const ctrls = this.getControls()

					this.updateOrientation(
						value as number,
						ctrls.vDeg.value as number
					)
				}
			break

			case 'vDeg':
				{
					const ctrls = this.getControls()

					this.updateOrientation(
						ctrls.hDeg.value as number,
						value as number
					)
				}
			break

			case 'panningModel':
				this.data.output.panningModel = ['equalpower', 'HRTF'][value as number]
			break

			case 'x':
				{
					const ctrls = this.getControls()

					this.data.output.positionX.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
				}
			break

			case 'y':
				{
					const ctrl = this.getControls()

					this.data.output.positionY.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
				}
			break

			case 'z':
				{
					const ctrls = this.getControls()

					this.data.output.positionZ.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
				}
			break
		}

		this.draw()
	}

	private updateOrientation(hDeg: number, vDeg: number) {
		if(this.data.output === undefined || !(this.data.output instanceof PannerNode)) return

		const vec = NumberUtil.degToVector3d(hDeg - 90, vDeg)

		this.data.output.orientationX.setValueAtTime(
			vec.x,
			this.moduleStore.audioCtx.currentTime
		)
		this.data.output.orientationY.setValueAtTime(
			vec.y,
			this.moduleStore.audioCtx.currentTime
		)
		this.data.output.orientationZ.setValueAtTime(
			vec.z,
			this.moduleStore.audioCtx.currentTime
		)
	}

	private draw() {
		const ctrls = this.getControls()

		if(this.data.monitors === undefined) return

		const hCanvas = document.getElementById(`m${this.data.idx}.monitor.${this.data.monitors[1].id}`) as HTMLCanvasElement | null
		const vCanvas = document.getElementById(`m${this.data.idx}.monitor.${this.data.monitors[0].id}`) as HTMLCanvasElement | null

		if(hCanvas === null || vCanvas === null) return

		const hCtx = hCanvas.getContext('2d')
		const vCtx = vCanvas.getContext('2d')

		if(hCtx === null || vCtx === null) return

		// draw plan view
		const drawPlanView = () => {
			hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height)

			// horizontal: z, vertical: x
			const sourcePos = {
				x: ctrls.x.value as number,
				z: ctrls.z.value as number
			}

			// range
			const padding = {
				z: 5,
				x: 5
			}
			const range = {
				z: {
					min: Math.min(0, sourcePos.z) - padding.z,
					max: Math.max(0, sourcePos.z) + padding.z
				},
				x: {
					min: Math.min(0, sourcePos.x) - padding.x,
					max: Math.max(0, sourcePos.x) + padding.x
				}
			}
			const toCanvasX = (x: number) => NumberUtil.map(x, range.z.min, range.z.max, 0, hCanvas.width)
			const toCanvasY = (y: number) => NumberUtil.map(y, range.x.min, range.x.max, hCanvas.height, 0)

			// cone
			const innerAngle = ctrls.innerAngle.value as number
			const outerAngle = ctrls.outerAngle.value as number
			const hRotation = ctrls.hDeg.value as number + 180

			// outer
			hCtx.fillStyle = 'rgb(0 127 255 / .5)'

			hCtx.beginPath()
			hCtx.moveTo(
				toCanvasX(sourcePos.z),
				toCanvasY(sourcePos.x)
			)
			hCtx.arc(
				toCanvasX(sourcePos.z),
				toCanvasY(sourcePos.x),
				hCanvas.width,
				NumberUtil.degToRad(hRotation - outerAngle / 2),
				NumberUtil.degToRad(hRotation + outerAngle / 2)
			)
			hCtx.lineTo(
				toCanvasX(sourcePos.z),
				toCanvasY(sourcePos.x)
			)
			hCtx.fill()

			// inner
			hCtx.fillStyle = 'rgb(255 255 255 / .3)'

			hCtx.beginPath()
			hCtx.moveTo(
				toCanvasX(sourcePos.z),
				toCanvasY(sourcePos.x)
			)
			hCtx.arc(
				toCanvasX(sourcePos.z),
				toCanvasY(sourcePos.x),
				hCanvas.width,
				NumberUtil.degToRad(hRotation - innerAngle / 2),
				NumberUtil.degToRad(hRotation + innerAngle / 2)
			)
			hCtx.lineTo(
				toCanvasX(sourcePos.z),
				toCanvasY(sourcePos.x)
			)
			hCtx.fill()

			// ruler
			const rulerRange = {
				h: {
					min: Math.min(-10, NumberUtil.getNiceRoundNumber(Math.min(0, sourcePos.z))),
					max: Math.max(10, NumberUtil.getNiceRoundNumber(Math.max(0, sourcePos.z as number)))
				},
				v: {
					min: Math.min(-10, NumberUtil.getNiceRoundNumber(Math.min(0, sourcePos.x))),
					max: Math.max(10, NumberUtil.getNiceRoundNumber(Math.max(0, sourcePos.x)))
				}
			}
			const rulerCount = {
				h: 5,
				v: 5
			}
			const rulerStep = {
				h: NumberUtil.getNiceRoundNumber((rulerRange.h.max - rulerRange.h.min) / rulerCount.h),
				v: NumberUtil.getNiceRoundNumber((rulerRange.v.max - rulerRange.v.min) / rulerCount.v)
			}
			const rulers = {
				h: [] as number[],
				v: [] as number[]
			}

			for(let i = rulerRange.h.min; i <= range.z.max; i += rulerStep.h) {
				rulers.h.push(i)
			}

			for(let i = rulerRange.v.min; i <= rulerRange.v.max; i += rulerStep.v) {
				rulers.v.push(i)
			}

			if(!rulers.h.includes(0)) rulers.h.push(0)
			if(!rulers.v.includes(0)) rulers.v.push(0)

			hCtx.strokeStyle = 'gray'
			hCtx.fillStyle = 'white'
			hCtx.beginPath()
			for(const ruler of rulers.h) {
				const x = toCanvasX(ruler)

				hCtx.moveTo(x, 0)
				hCtx.lineTo(x, hCanvas.height)
				hCtx.fillText(ruler.toString(), x, hCanvas.height - 5)
			}
			for(const ruler of rulers.v) {
				const y = toCanvasY(ruler)

				hCtx.moveTo(0, y)
				hCtx.lineTo(hCanvas.width, y)
				hCtx.fillText(ruler.toString(), 20, y)
			}
			hCtx.stroke()

			// listener position
			const listenerPos = {
				x: 0,
				y: 0
			}
			hCtx.fillStyle = 'red'

			hCtx.beginPath()
			hCtx.arc(toCanvasX(listenerPos.x), toCanvasY(listenerPos.y), 5, 0, 2 * Math.PI)
			hCtx.fill()

			// source position
			hCtx.fillStyle = 'green'

			hCtx.beginPath()
			hCtx.arc(toCanvasX(sourcePos.z), toCanvasY(sourcePos.x), 5, 0, 2 * Math.PI)
			hCtx.fill()
		}

		// draw side view
		const drawSideView = () => {
			vCtx.clearRect(0, 0, vCanvas.width, vCanvas.height)

			// horizontal: z, vertical: y
			const sourcePos = {
				z: ctrls.z.value as number,
				y: ctrls.y.value as number
			}

			// range
			const padding = {
				z: 5,
				y: 5
			}
			const range = {
				z: {
					min: Math.min(0, sourcePos.z) - padding.z,
					max: Math.max(0, sourcePos.z) + padding.z
				},
				y: {
					min: Math.min(0, sourcePos.y) - padding.y,
					max: Math.max(0, sourcePos.y) + padding.y
				}
			}
			const toCanvasX = (x: number) => NumberUtil.map(x, range.z.min, range.z.max, 0, vCanvas.width)
			const toCanvasY = (y: number) => NumberUtil.map(y, range.y.min, range.y.max, vCanvas.height, 0)

			// cone
			const innerAngle = ctrls.innerAngle.value as number
			const outerAngle = ctrls.outerAngle.value as number
			const vRotation = ctrls.vDeg.value as number + 180

			// outer
			vCtx.fillStyle = 'rgb(0 127 255 / .5)'

			vCtx.beginPath()
			vCtx.moveTo(
				toCanvasX(sourcePos.z),
				toCanvasY(sourcePos.y)
			)
			vCtx.arc(
				toCanvasX(sourcePos.z),
				toCanvasY(sourcePos.y),
				vCanvas.width,
				NumberUtil.degToRad(vRotation - outerAngle / 2),
				NumberUtil.degToRad(vRotation + outerAngle / 2)
			)
			vCtx.lineTo(
				toCanvasX(sourcePos.z),
				toCanvasY(sourcePos.y)
			)
			vCtx.fill()

			// inner
			vCtx.fillStyle = 'rgb(255 255 255 / .3)'

			vCtx.beginPath()
			vCtx.moveTo(
				toCanvasX(sourcePos.z),
				toCanvasY(sourcePos.y)
			)
			vCtx.arc(
				toCanvasX(sourcePos.z),
				toCanvasY(sourcePos.y),
				vCanvas.width,
				NumberUtil.degToRad(vRotation - innerAngle / 2),
				NumberUtil.degToRad(vRotation + innerAngle / 2)
			)
			vCtx.lineTo(
				toCanvasX(sourcePos.z),
				toCanvasY(sourcePos.y)
			)
			vCtx.fill()

			// ruler
			const rulerRange = {
				h: {
					min: Math.min(-10, NumberUtil.getNiceRoundNumber(Math.min(0, sourcePos.z))),
					max: Math.max(10, NumberUtil.getNiceRoundNumber(Math.max(0, sourcePos.z as number)))
				},
				v: {
					min: Math.min(-10, NumberUtil.getNiceRoundNumber(Math.min(0, sourcePos.y))),
					max: Math.max(10, NumberUtil.getNiceRoundNumber(Math.max(0, sourcePos.y)))
				}
			}
			const rulerCount = {
				h: 5,
				v: 5
			}
			const rulerStep = {
				h: NumberUtil.getNiceRoundNumber((rulerRange.h.max - rulerRange.h.min) / rulerCount.h),
				v: NumberUtil.getNiceRoundNumber((rulerRange.v.max - rulerRange.v.min) / rulerCount.v)
			}
			const rulers = {
				h: [] as number[],
				v: [] as number[]
			}

			for(let i = rulerRange.h.min; i <= range.z.max; i += rulerStep.h) {
				rulers.h.push(i)
			}

			for(let i = rulerRange.v.min; i <= rulerRange.v.max; i += rulerStep.v) {
				rulers.v.push(i)
			}

			if(!rulers.h.includes(0)) rulers.h.push(0)
			if(!rulers.v.includes(0)) rulers.v.push(0)

			vCtx.strokeStyle = 'gray'
			vCtx.fillStyle = 'white'
			vCtx.beginPath()
			for(const ruler of rulers.h) {
				const x = toCanvasX(ruler)

				vCtx.moveTo(x, 0)
				vCtx.lineTo(x, vCanvas.height)
				vCtx.fillText(ruler.toString(), x, vCanvas.height - 5)
			}
			for(const ruler of rulers.v) {
				const y = toCanvasY(ruler)

				vCtx.moveTo(0, y)
				vCtx.lineTo(vCanvas.width, y)
				vCtx.fillText(ruler.toString(), 20, y)
			}
			vCtx.stroke()

			// listener position
			const listenerPos = {
				x: 0,
				y: 0
			}
			vCtx.fillStyle = 'red'

			vCtx.beginPath()
			vCtx.arc(toCanvasX(listenerPos.x), toCanvasY(listenerPos.y), 5, 0, 2 * Math.PI)
			vCtx.fill()

			// source position
			vCtx.fillStyle = 'green'

			vCtx.beginPath()
			vCtx.arc(toCanvasX(sourcePos.z), toCanvasY(sourcePos.y), 5, 0, 2 * Math.PI)
			vCtx.fill()
		}

		drawPlanView()
		drawSideView()
	}
}
