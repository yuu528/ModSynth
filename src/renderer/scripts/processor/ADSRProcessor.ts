enum Phase {
	NONE,
	ATTACK,
	HOLD,
	DECAY,
	SUSTAIN,
	RELEASE
}

class ADSRProcessor extends AudioWorkletProcessor {
	private lastSampleVal: number
	private currentSampleIdx: number
	private currentPhase: Phase

	constructor() {
		super()

		this.lastSampleVal = 0
		this.currentSampleIdx = 0
		this.currentPhase = Phase.NONE
	}

	static get parameterDescriptors() {
		return [
			{
				name: 'attack',
				defaultValue: 0.5,
				minValue: 0,
				maxValue: 5,
				automationRate: 'k-rate'
			},
			{
				name: 'hold',
				defaultValue: 0.5,
				minValue: 0,
				maxValue: 5,
				automationRate: 'k-rate'
			},
			{
				name: 'decay',
				defaultValue: 0.5,
				minValue: 0,
				maxValue: 5,
				automationRate: 'k-rate'
			},
			{
				name: 'sustain',
				defaultValue: 0.5,
				minValue: 0,
				maxValue: 5,
				automationRate: 'k-rate'
			},
			{
				name: 'release',
				defaultValue: 0.5,
				minValue: 0,
				maxValue: 5,
				automationRate: 'k-rate'
			}
		]
	}

	process(
		inputs: Float32Array[][],
		outputs: Float32Array[][],
		parameters: { [key: string]: Float32Array }
	) {
		const a = 1 / (parameters.attack[0] * sampleRate)
		const h = parameters.hold[0] * sampleRate
		const d = (1 - parameters.sustain[0]) / (parameters.decay[0] * sampleRate)
		const r = 1 / (parameters.release[0] * sampleRate)

		const input = inputs[0][0]
		const output = outputs[0][0]

		if(input === undefined || output === undefined) return true

		input.forEach((value, i) => {
			if(this.currentPhase !== Phase.NONE) {
				this.currentSampleIdx++
			}

			if(value > 0) {
				// input: high

				switch(this.currentPhase) {
					case Phase.NONE:
					case Phase.RELEASE:
						this.currentPhase = Phase.ATTACK
						this.currentSampleIdx = 0
					// fall through

					case Phase.ATTACK:
						this.lastSampleVal += a

						if(this.lastSampleVal >= 1) {
							this.currentPhase = Phase.HOLD
							this.currentSampleIdx = 0
						}
					break

					case Phase.HOLD:
						this.lastSampleVal = 1

						if(this.currentSampleIdx >= h) {
							this.currentPhase = Phase.DECAY
							this.currentSampleIdx = 0
						}
					break

					case Phase.DECAY:
						this.lastSampleVal -= d

						if(this.lastSampleVal <= parameters.sustain[0]) {
							this.currentPhase = Phase.SUSTAIN
							this.currentSampleIdx = 0
						}
					break

					case Phase.SUSTAIN:
						this.lastSampleVal = parameters.sustain[0]
					break
				}

			} else {
				// input: low

				switch(this.currentPhase) {
					case Phase.NONE:
						this.lastSampleVal = 0
					break

					case Phase.ATTACK:
					case Phase.HOLD:
					case Phase.DECAY:
					case Phase.SUSTAIN:
						this.currentPhase = Phase.RELEASE
						this.currentSampleIdx = 0
					// fall through

					case Phase.RELEASE:
						this.lastSampleVal -= r

						if(this.lastSampleVal <= 0) {
							this.currentPhase = Phase.NONE
							this.currentSampleIdx = 0
						}
					break
				}
			}

			output.set([this.lastSampleVal], i)
		})

		return true
	}
}

registerProcessor('adsr-processor', ADSRProcessor)
