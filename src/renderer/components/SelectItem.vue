<template>
	<v-list-item v-bind="props.props">
		<template v-slot:title>
			<template v-if="typeof props.item.raw === 'object'">
				<img v-if="'image' in props.item.raw" :src="props.item.raw.image" style="height: 2em;">
				<span v-else-if="'label' in props.item.raw">{{ props.item.raw.label }}</span>
			</template>
			<span v-if="typeof props.item.raw === 'string'">{{ props.item.raw }}</span>
		</template>
	</v-list-item>
</template>

<script setup lang="ts">
const props = defineProps([
	'props',
	'item'
])
</script>
