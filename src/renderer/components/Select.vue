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
			<v-list-item v-bind="props">
				<template v-slot:title>
					<template v-if="typeof item.raw === 'object'">
						<img v-if="'image' in item.raw" :src="item.raw.image" style="height: 2em;">
						<span v-else-if="'label' in item.raw">{{ item.raw.label }}</span>
					</template>
					<span v-if="typeof item.raw === 'string'">{{ item.raw }}</span>
				</template>
			</v-list-item>
		</template>
		<template v-slot:item="{ props, item }">
			<v-list-item v-bind="props">
				<template v-slot:title>
					<template v-if="typeof item.raw === 'object'">
						<img v-if="'image' in item.raw" :src="item.raw.image" style="height: 2em;">
						<span v-if="'label' in item.raw">{{ item.raw.label }}</span>
					</template>
					<span v-if="typeof item.raw === 'string'">{{ item.raw }}</span>
				</template>
			</v-list-item>
		</template>
	</v-select>
</template>

<script setup lang="ts">
import { useModuleStore } from '../stores/ModuleStore'

import Component from '../scripts/enum/Component'

const moduleStore = useModuleStore()

const props = defineProps([
	'class',
	'label',
	'items',
	'update'
])

const model = defineModel()
</script>
