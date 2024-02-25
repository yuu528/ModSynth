<template>
	<v-sheet>
		<div class="knob" @wheel="wheel" :style="{transform: `rotate(${calcDeg()}deg)`}">
			<div class="mark">
			</div>
			<div
				class="value"
				:style="{transform: `rotate(${-calcDeg()}deg)`}"
				contenteditable="true"
				@keypress="keypress"
			>
				{{ value }}
			</div>
		</div>
		<div class="text-center text-caption label">
			{{ props.label }}
		</div>
	</v-sheet>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { NumberUtil } from '../scripts/util/NumberUtil'

const model = defineModel()
const props = defineProps([
	'min', 'max', 'step', 'change', 'label', 'si'
])

const value = computed(() => {
	if(props.si) {
		return NumberUtil.toSI(model.value)
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

function wheel(event) {
	event.preventDefault()
	if (0 < event.deltaY) {
		stepDown()
	} else if(event.deltaY < 0) {
		stepUp()
	}
}

function keypress(event) {
	if(isNaN(event.key) && event.key !== 'Enter' && event.key !== '.') {
		event.preventDefault()
	} else if(event.key === 'Enter') {
		const value = Number(event.target.innerText)

		if(isNaN(event.target.innerText)) {
			event.target.innerText = model.value
		} else if(props.min <= value && value <= props.max) {
			setModelValue(value)
		} else {
			event.target.innerText = model.value
		}
		event.target.blur()
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
	overflow-wrap: anywhere;
}
</style>
