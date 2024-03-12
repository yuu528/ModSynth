<template>
  <v-btn v-for="menu in props.menus" variant="text" class="text-none h-100 menuBtn">
    {{ menu.name }}

    <v-menu activator="parent">
      <MenuList :parentId="menu.name" :items="menu.items" :fn="props.fn" />
    </v-menu>
  </v-btn>
</template>

<script setup lang="ts">
import MenuList from './MenuList.vue'

const props = defineProps([
  'menus',
  'fn'
]);
</script>

<style scoped>
.menuBtn {
  min-width: 0;
  padding: 0 0.5em;
}
</style>
