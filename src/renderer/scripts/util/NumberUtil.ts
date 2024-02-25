export class NumberUtil {
	public static getNumberLength(value: number) {
		return parseInt(value).toString().length
	}

	public static toSI(value: number) {
		if(value < 1e3) {
			return value.toString()
		} else if(value < 1e6) {
			return `${Math.floor(value / 1e3)}k`
		}

		return value.toString()
	}

	public static getNiceRoundNumber(value: number, count: number | undefined) {
		let offset
		if(count === undefined) {
			offset = Math.pow(10, Math.floor(value).toString().length - 1)
		} else {
			offset = Math.pow(10, count - 1)
		}

		return Math.floor(value / offset) * offset
	}
}
