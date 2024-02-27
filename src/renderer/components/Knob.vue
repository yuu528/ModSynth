<template>
	<v-sheet class="d-flex justify-center flex-wrap">
		<div>
			<div class="knob" @wheel="wheel" :style="{transform: `rotate(${calcDeg()}deg)`, backgroundColor: props.disabled ? 'gray' : 'black' }">
				<div class="mark">
				</div>
				<div
					class="value"
					:style="{transform: `rotate(${-calcDeg()}deg)`}"
					:contenteditable="!props.disabled"
					@keypress="keypress"
				>
					{{ value }}
				</div>
			</div>
			<div class="text-center text-caption label">
				<span>{{ props.label.replace(' ', '\n') }}</span>
			</div>
		</div>
	</v-sheet>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { NumberUtil } from '../scripts/util/NumberUtil'

const model = defineModel<number>({ required: true })
const props = defineProps([
	'min', 'max', 'step', 'change', 'label', 'si', 'disabled'
])

const value = computed(() => {
	if(props.si) {
		return NumberUtil.toSI(model.value)
	}

	if(props.min === 0 && props.max === 1 && props.step === 1) {
		return model.value ? 'On' : 'Off'
	}

	return model.value
})

function getDecPointLen(n: number) {
	const split = String(n).split('.')
	if(split.length === 1) return 0
	return String(n).split('.')[1].length
}

function setModelValue(value: number) {
	model.value = value
	props.change(value)
}

function stepUp() {
	const len = Math.pow(10, getDecPointLen(props.step))
	setModelValue(Math.round(
		Math.min(model.value + props.step, props.max) * len
	) / len)
}

function stepDown() {
	const len = Math.pow(10, getDecPointLen(props.step))
	setModelValue(Math.round(
		Math.max(model.value - props.step, props.min) * len
	) / len)
}

function calcDeg() {
	return ((model.value - props.min) / (props.max - props.min)) * 270 - 135
}

function wheel(event: WheelEvent) {
	event.preventDefault()
	if(!props.disabled) {
		if (0 < event.deltaY) {
			stepDown()
		} else if(event.deltaY < 0) {
			stepUp()
		}
	}
}

function keypress(event: KeyboardEvent) {
	if(event.target === null) return

	const target = event.target as HTMLElement

	if(props.disabled) {
		event.preventDefault()
		return
	} else {
		if(isNaN(parseInt(event.key)) && event.key !== 'Enter' && event.key !== '.') {
			event.preventDefault()
		} else if(event.key === 'Enter') {
			const value = Number(target.innerText)

			if(isNaN(parseInt(target.innerText))) {
				target.innerText = model.value.toString()
			} else if(props.min <= value && value <= props.max) {
				setModelValue(value)
			} else {
				target.innerText = model.value.toString()
			}
			target.blur()
		}
	}
}
</script>

<style scoped>
.knob {
	width: 30px;
	height: 30px;
	background-color: black;
	border-radius: 50%;
}

.mark {
	width: 2px;
	height: 20%;
	background-color: white;
	position: relative;
	top: 0;
	left: calc(50% - 1px);
}

.value {
	color: white;
	font-size: 12px;
	width: 100%;
	text-align: center;
}

.label {
	width: 30px;
	overflow: visible;
}

.label span {
	display: flex;
	justify-content: center;
}
</style>
