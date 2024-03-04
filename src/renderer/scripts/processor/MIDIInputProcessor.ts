import { NumberUtil } from '../util/NumberUtil'

class MIDIInputProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors() {
		return [
			{
				name: 'note',
				defaultValue: 0,
				minValue: 0,
				maxValue: 127,
				automationRate: 'a-rate'
			},
			{
				name: 'velocity',
				defaultValue: 0,
				minValue: 0,
				maxValue: 127,
				automationRate: 'a-rate'
			}
		]
	}

	process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: {[key: string]: Float32Array}): boolean {
		const velOut = outputs[0]
		const pitchOut = outputs[1]

		if(velOut !== undefined) {
			velOut.forEach(channel => {
				for(let i = 0; i < channel.length; i++) {
					channel[i] = NumberUtil.map(
						parameters.velocity.length > i
							? parameters.velocity[i]
							: parameters.velocity[0],
						0, 127, -1, 1
					)
				}
			})
		}

		if(pitchOut !== undefined) {
			pitchOut.forEach(channel => {
				for(let i = 0; i < channel.length; i++) {
					// convert MIDI note to frequency
					channel[i] = NumberUtil.map(
						NumberUtil.noteNumberToFreq(
							parameters.note.length > i
								? parameters.note[i]
								: parameters.note[0]
						),
						NumberUtil.noteNumberToFreq(0),
						NumberUtil.noteNumberToFreq(127),
						-1, 1
					)
				}
			})
		}

		return true
	}
}

registerProcessor('MIDIInputProcessor', MIDIInputProcessor)
