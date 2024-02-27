<template>
	<v-select
		density="compact"
		v-model="model"
		:class="props.class"
		:label="props.label"
		:items="props.items"
		item-title="value"
		item-value="value"
		variant="outlined"
		@update:modelValue="value => { props.update(value) }"
	>
		<template v-slot:selection="{ item, index }">
			<SelectItem :props="props" :item="item" />
		</template>
		<template v-slot:item="{ props, item }">
			<SelectItem :props="props" :item="item" />
		</template>
	</v-select>
</template>

<script setup lang="ts">
import SelectItem from './SelectItem.vue'

const props = defineProps([
	'class',
	'label',
	'items',
	'update'
])

const model = defineModel()
</script>
