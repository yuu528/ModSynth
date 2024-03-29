import Unit from '../enum/Unit'

export class NumberUtil {
	public static getNumberLength(value: number): number {
		return Math.floor(Math.abs(value)).toString().length
	}

	public static toSI(value: number, disabledUnits?: Unit[], pointLength?: number): string {
		if(disabledUnits === undefined) {
			disabledUnits = []
		}

		if(pointLength === undefined) {
			pointLength = 0
		}

		const pointPad = Math.pow(10, pointLength)

		if(value === 0) {
			return '0'
		} else if(value < 1e-3 && !disabledUnits.includes(Unit.MICRO)) {
			return `${value * 1e6}${Unit.MICRO}`
		} else if(value < 1 && !disabledUnits.includes(Unit.MILLI)) {
			return `${value * 1e3}${Unit.MILLI}`
		} else if(value < 1e3) {
			return value.toString()
		} else if(value < 1e6 && !disabledUnits.includes(Unit.KILO)) {
			return `${Math.round(value / 1e3 * pointPad) / pointPad}${Unit.KILO}`
		}

		return value.toString()
	}

	public static fromSI(value: string): number {
		if(value.endsWith(Unit.MICRO)) {
			return parseFloat(value.slice(0, -1)) * 1e-6
		} else if(value.endsWith(Unit.MILLI)) {
			return parseFloat(value.slice(0, -1)) * 1e-3
		} else if(value.endsWith(Unit.KILO)) {
			return parseFloat(value.slice(0, -1)) * 1e3
		}

		return parseFloat(value)
	}

	public static isSIValue(value: string, disabledUnits?: Unit[]): boolean {
		if(disabledUnits === undefined) {
			disabledUnits = []
		}

		const units = [
			Unit.MICRO,
			Unit.MILLI,
			Unit.KILO
		].filter(unit =>
			disabledUnits === undefined || !disabledUnits.includes(unit)
		).join('|')

		return new RegExp(
			`^[0-9.]+(${units})?$`
		).test(value)
	}

	public static isSIUnitPrefix(value: string, disabledUnits?: Unit[]): boolean {
		if(disabledUnits === undefined) {
			disabledUnits = []
		}

		if(value === Unit.MICRO && !disabledUnits.includes(Unit.MICRO)) {
			return true
		} else if(value === Unit.MILLI && !disabledUnits.includes(Unit.MILLI)) {
			return true
		} else if(value === Unit.KILO && !disabledUnits.includes(Unit.KILO)) {
			return true
		}

		return false
	}

	public static getNiceRoundNumber(value: number, count?: number) {
		let offset
		if(count === undefined) {
			offset = Math.pow(10, NumberUtil.getNumberLength(value) - 1)
		} else {
			offset = Math.pow(10, count - 1)
		}

		return Math.floor(value / offset) * offset
	}

	public static map(value: number, min: number, max: number, newMin: number, newMax: number): number {
		return (value - min) * (newMax - newMin) / (max - min) + newMin
	}

	public static degToRad(deg: number): number {
		return deg * Math.PI / 180
	}

	public static degToVector(deg: number): { x: number, y: number } {
		return {
			x: Math.cos(NumberUtil.degToRad(deg)),
			y: Math.sin(NumberUtil.degToRad(deg))
		}
	}

	public static degToVector3d(hDeg: number, vDeg: number): { x: number, y: number, z: number } {
		const vector2d = NumberUtil.degToVector(hDeg)
		const vRad = NumberUtil.degToRad(vDeg)

		return {
			x: vector2d.x * Math.cos(vRad),
			y: Math.sin(vRad),
			z: vector2d.y * Math.cos(vRad)
		}
	}

	public static noteNumberToFreq(note: number): number {
		return 440 * Math.pow(2, (note - 69) / 12)
	}
}
