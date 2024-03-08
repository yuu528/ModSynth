<template>
	<div>
		<div
			class="pilot"
			:style="computedStyle"
		>
		</div>
		<div class="text-center text-caption label">
			<span>{{ props.label.replace(' ', '\n') }}</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const model = defineModel<boolean>({ required: true })
const props = defineProps([
	'label',
	'color',
	'colorOff',
])

const color = props.color ?? 'limegreen'
const colorOff = props.colorOff ?? 'dimgray'

const computedStyle = computed(() => ({
	backgroundColor: model.value ? color : colorOff
}))
</script>

<style scoped>
.pilot {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	margin: auto;
}
</style>
