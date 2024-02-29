<template>
	<v-sheet class="d-flex align-center mb-1">
		<div class="text-caption">{{ props.label }}</div>
		<div class="flex-grow-1" :style="{ color: props.color }">
			<!--
				VProgress's color prop is not working,
				so define color in style
			-->
			<v-progress-linear
				v-model="value"
				:bg-color="props.bgColor"
				:bg-opacity="props.bgColor === undefined ? undefined : 1"
			></v-progress-linear>
		</div>
		<div class="text-caption text-right" style="width: 3em;">{{ valueText }}</div>
	</v-sheet>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { NumberUtil } from '../scripts/util/NumberUtil'

const model = defineModel({ required: true })
const props = defineProps([
	'min',
	'max',
	'valueUnit',
	'label',
	'color',
	'bgColor'
])

const value = computed(() =>
	Math.max(0, NumberUtil.map(model.value as number, props.min, props.max, 0, 100))
)

const valueText = computed(() =>{
	if(props.valueUnit !== undefined) {
		return `${Math.round(model.value as number)}${props.valueUnit}`
	}

	return `${Math.floor(model.value as number)}`
})
</script>
