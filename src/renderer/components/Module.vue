<template>
  <v-sheet class="rounded" border="md">
    <v-container>
      <v-row>
        <v-col class="text-center">
          {{ props.name }}
        </v-col>
      </v-row>
      <v-row>
        <v-col v-for="control in props.controls" :key="control.name">
          <v-text-field
            type="number"
            :v-model="control.value"
            :label="control.name"
            :min="control.min"
            :max="control.max"
          >
          </v-text-field>
        </v-col>
      </v-row>
      <v-row>
        <v-col v-for="jack in props.jacks" :key="jack.name">
          <Jack :name="jack.name" />
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
</template>

<script setup lang="ts">
import Jack from './Jack.vue'

const props = defineProps([
  'name',
  'controls',
  'jacks'
])
</script>
