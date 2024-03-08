import { toRaw } from 'vue'
import {
	CylinderGeometry,
	GridHelper,
	Mesh,
	MeshBasicMaterial,
	OrthographicCamera,
	Scene,
	Vector3,
	WebGLRenderer
} from 'three'

import ModuleCategory from '../enum/ModuleCategory'
import JackType from '../enum/JackType'
import Component from '../enum/Component'

import Module from './Module'

import { NumberUtil } from '../util/NumberUtil'

export default class PannerModule extends Module {
	constructor() {
		super()

		this.data = {
			...this.data,
			id: 'panner',
			name: 'Panner',
			category: ModuleCategory.FILTER,
			icon: 'mdi-surround-sound',
			monitors: [
				{
					id: 'vMonitor',
					name: 'Side View',
					width: 200,
					height: 200
				},
				{
					id: 'hMonitor',
					name: 'Plan View',
					width: 200,
					height: 200
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
					id: 'input',
					name: 'In',
					type: JackType.AUDIO_INPUT
				},
				{
					id: 'output',
					name: 'Out',
					type: JackType.AUDIO_OUTPUT
				}
			]
		}
	}

	clone() {
		const result = new PannerModule()
		result.data = structuredClone(toRaw(this.data))
		return result
	}

	onEnable(idx: number) {
		super.onEnable(idx)

		const ctrls = this.getControls()

		const output = this.moduleStore.audioCtx.createPanner()
		this.outputs.output = output

		output.coneInnerAngle = ctrls.innerAngle.value as number
		output.coneOuterAngle = ctrls.outerAngle.value as number
		output.coneOuterGain = ctrls.outerGain.value as number
		output.distanceModel = ['linear', 'inverse', 'exponential'][ctrls.distanceModel.value as number]

		this.updateOrientation(ctrls.hDeg.value as number, ctrls.vDeg.value as number)

		output.panningModel = ['equalpower', 'HRTF'][ctrls.panningModel.value as number]

		output.positionX.setValueAtTime(ctrls.x.value as number, this.moduleStore.audioCtx.currentTime)
		output.positionY.setValueAtTime(ctrls.y.value as number, this.moduleStore.audioCtx.currentTime)
		output.positionZ.setValueAtTime(-(ctrls.z.value as number), this.moduleStore.audioCtx.currentTime)

		this.inputs.input = output

		this.draw()
	}

	updateValue(idx: number, id: string, value: number | string) {
		const output = this.outputs.output as PannerNode

		switch(id) {
			case 'innerAngle':
				output.coneInnerAngle = value as number
			break

			case 'outerAngle':
				output.coneOuterAngle = value as number
			break

			case 'outerGain':
				output.coneOuterGain = value as number
			break

			case 'distanceModel':
				output.distanceModel = ['linear', 'inverse', 'exponential'][value as number]
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
				output.panningModel = ['equalpower', 'HRTF'][value as number]
			break

			case 'x':
				{
					const ctrls = this.getControls()

					output.positionX.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
				}
			break

			case 'y':
				{
					const ctrl = this.getControls()

					output.positionY.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
				}
			break

			case 'z':
				{
					const ctrls = this.getControls()

					output.positionZ.setValueAtTime(value as number, this.moduleStore.audioCtx.currentTime)
				}
			break
		}

		this.draw()
	}

	private updateOrientation(hDeg: number, vDeg: number) {
		const output = this.outputs.output as PannerNode

		const vec = NumberUtil.degToVector3d(hDeg + 90, vDeg)

		output.orientationX.setValueAtTime(
			vec.x,
			this.moduleStore.audioCtx.currentTime
		)
		output.orientationY.setValueAtTime(
			vec.y,
			this.moduleStore.audioCtx.currentTime
		)
		output.orientationZ.setValueAtTime(
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

		const listener = this.moduleStore.audioCtx.listener

		const hMonitorSize = {
			w: hCanvas.width,
			h: hCanvas.height
		}
		const vMonitorSize = {
			w: vCanvas.width,
			h: vCanvas.height
		}
		const padding = {
			x: 5,
			y: 5,
			z: 5
		}
		const range = {
			x: {
				min: Math.min(listener.positionX.value, ctrls.x.value as number) - padding.x,
				max: Math.max(listener.positionX.value, ctrls.x.value as number) + padding.x
			},
			y: {
				min: Math.min(listener.positionY.value, ctrls.y.value as number) - padding.y,
				max: Math.max(listener.positionY.value, ctrls.y.value as number) + padding.y
			},
			z: {
				min: Math.min(listener.positionZ.value, ctrls.z.value as number) - padding.z,
				max: Math.max(listener.positionZ.value, ctrls.z.value as number) + padding.z
			}
		}
		const size = {
			x: range.x.max - range.x.min,
			y: range.y.max - range.y.min,
			z: range.z.max - range.z.min,
		}
		const mid = {
			x: (range.x.min + range.x.max) / 2,
			y: (range.y.min + range.y.max) / 2,
			z: (range.z.min + range.z.max) / 2
		}

		const hRenderer = new WebGLRenderer({ canvas: hCanvas })
		const vRenderer = new WebGLRenderer({ canvas: vCanvas })

		hRenderer.setSize(hMonitorSize.w, hMonitorSize.h)
		vRenderer.setSize(vMonitorSize.w, vMonitorSize.h)

		const scene = new Scene()

		const listenerGeom = new CylinderGeometry(0.5, 0, 1)
		const listenerMat = new MeshBasicMaterial({ color: 0xffff00 })
		const listenerMesh = new Mesh(listenerGeom, listenerMat)
		listenerMesh.position.set(
			listener.positionX.value,
			listener.positionY.value,
			listener.positionZ.value
		)
		listenerMesh.setRotationFromAxisAngle(
			new Vector3(0, 1, 0).applyAxisAngle(
				new Vector3(
					listener.forwardX.value,
					listener.forwardY.value,
					listener.forwardZ.value
				).normalize(), Math.PI / 2
			), Math.PI / 2
		)
		scene.add(listenerMesh)

		const sourceGeom = new CylinderGeometry(0, 0.5, 1)
		const sourceMat = new MeshBasicMaterial({ color: 0xff0000 })
		const sourceMesh = new Mesh(sourceGeom, sourceMat)
		sourceMesh.position.set(
			ctrls.x.value as number,
			ctrls.y.value as number,
			ctrls.z.value as number
		)
		const vec = NumberUtil.degToVector3d(ctrls.hDeg.value as number + 90, ctrls.vDeg.value as number)
		sourceGeom.rotateX(Math.PI / 2)
		sourceMesh.lookAt(
			ctrls.x.value as number + vec.x,
			ctrls.y.value as number + vec.y,
			ctrls.z.value as number + vec.z
		)
		scene.add(sourceMesh)

		const cameraWidth = Math.max(size.x, size.y, size.z)
		const cameraHeight = cameraWidth * (hMonitorSize.h / hMonitorSize.w)

		const coneHeight = Math.max(cameraWidth * 2, cameraHeight * 2)
		const innerConeGeom = new CylinderGeometry(
			coneHeight * Math.tan(NumberUtil.degToRad(ctrls.innerAngle.value as number / 2)),
			0,
			coneHeight
		)
		const innerConeMat = new MeshBasicMaterial({ color: 0x009688, transparent: true, opacity: 0.5 })
		const innerConeMesh = new Mesh(innerConeGeom, innerConeMat)
		innerConeGeom.translate(0, coneHeight / 2, 0)
		innerConeGeom.rotateX(Math.PI / 2)
		innerConeMesh.position.set(
			ctrls.x.value as number,
			ctrls.y.value as number,
			ctrls.z.value as number
		)
		innerConeMesh.lookAt(
			ctrls.x.value as number + vec.x,
			ctrls.y.value as number + vec.y,
			ctrls.z.value as number + vec.z
		)
		scene.add(innerConeMesh)

		const outerConeGeom = new CylinderGeometry(
			(coneHeight - 1) * Math.tan(NumberUtil.degToRad(ctrls.outerAngle.value as number / 2)),
			0,
			coneHeight - 1
		)
		const outerConeMat = new MeshBasicMaterial({ color: 0x3f51b5, transparent: true, opacity: 0.5 })
		const outerConeMesh = new Mesh(outerConeGeom, outerConeMat)
		outerConeGeom.translate(0, coneHeight / 2, 0)
		outerConeGeom.rotateX(Math.PI / 2)
		outerConeMesh.position.set(
			ctrls.x.value as number,
			ctrls.y.value as number,
			ctrls.z.value as number
		)
		outerConeMesh.lookAt(
			ctrls.x.value as number + vec.x,
			ctrls.y.value as number + vec.y,
			ctrls.z.value as number + vec.z
		)
		scene.add(outerConeMesh)

		// x, z -> x, y
		const hCameraDist = range.y.max + coneHeight
		const hCamera = new OrthographicCamera(
			cameraWidth / -2,
			cameraWidth / 2,
			cameraHeight / 2,
			cameraHeight / -2,
			0,
			size.y + hCameraDist
		)
		hCamera.position.set(
			mid.x,
			range.y.max + hCameraDist,
			mid.z
		)
		hCamera.lookAt(
			mid.x,
			range.y.min,
			mid.z
		)
		scene.add(hCamera)

		// x, y -> x, y
		const vCameraDist = range.z.max + coneHeight
		const vCamera = new OrthographicCamera(
			cameraWidth / -2,
			cameraWidth / 2,
			cameraHeight / 2,
			cameraHeight / -2,
			0,
			cameraHeight + vCameraDist
		)
		vCamera.position.set(
			mid.x,
			mid.y,
			range.z.max + vCameraDist
		)
		vCamera.lookAt(
			mid.x,
			mid.y,
			range.z.min
		)
		scene.add(vCamera)

		const minGridSize = Math.min(cameraWidth, cameraHeight) * 2
		const gridCount = 20
		const gridSize = Math.ceil(
			Math.ceil(minGridSize / 10) * 10 / gridCount
			) * gridCount

		const hGrid = new GridHelper(gridSize, gridCount)
		scene.add(hGrid)

		const vGrid = new GridHelper(gridSize, gridCount)
		vGrid.rotation.x = Math.PI / 2
		vGrid.position.y = 0
		vGrid.position.z = mid.z - cameraHeight / 2
		scene.add(vGrid)

		hCamera.updateProjectionMatrix()
		vCamera.updateProjectionMatrix()

		hRenderer.render(scene, hCamera)
		vRenderer.render(scene, vCamera)
	}
}
