<template>
  <div class="layout">
    <Sidebar />
    <main class="content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import Sidebar from "@/components/SlideBar.vue";
</script>

<style scoped lang="scss">
.layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  height: 100vh;
}

.content {
  padding: 20px;
  overflow-y: auto;
  background: #f8f9fa
}
</style>
