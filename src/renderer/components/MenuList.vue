<template>
  <v-list density="compact">
    <v-list-item
      v-for="(item, index) in props.items"
      :key="index"
      :value="index"
      @click="onClick(props.parentId, item)"
    >
      <!-- when item is string -->
      <v-list-item-title v-if="typeof item === 'string'">{{ item }}</v-list-item-title>

      <!-- when item is object -->
      <template v-if="typeof item === 'object'">
        <v-list-item-title>{{ item.name }}</v-list-item-title>

        <v-menu
          v-if="'items' in item"
          activator="parent"
          location="end"
          open-on-hover
        >
          <MenuList
            :parentId="`${props.parentId}.${item.name}`"
            :items="item.items"
            :fn="props.fn"
          />
        </v-menu>
      </template>

      <!-- slots -->
      <template
        v-if="typeof item === 'object'"
        v-slot:prepend
      >
        <v-icon v-if="item.checked === true">mdi-checkbox-outline</v-icon>
        <v-icon v-if="item.checked === false">mdi-checkbox-blank-outline</v-icon>
        <v-icon v-if="item.selected === true">mdi-radiobox-marked</v-icon>
        <v-icon v-if="item.selected === false">mdi-radiobox-blank</v-icon>
      </template>

      <template v-if="typeof item === 'object' && 'items' in item" v-slot:append>
        <v-icon>mdi-chevron-right</v-icon>
      </template>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
const props = defineProps([
  'parentId',
  'items',
  'fn'
])

function onClick(parentId: string, item: string | object) {
  switch(typeof item) {
    case 'string':
      props.fn(`${parentId}.${item}`)
      break

    case 'object':
      if('items' in item) {
        return
      } else if('name' in item && 'value' in item) {
        props.fn(`${parentId}`, item.value)
      }
      break
  }
}
</script>
