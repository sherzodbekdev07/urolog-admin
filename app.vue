<template>
  <div class="dashboard">
    <Sidebar />
    <NuxtPage />
  </div>
</template>

<script setup>
import Sidebar from '@/components/SlideBar.vue'
</script>

<style>
.dashboard {
  display: flex;
}
</style>
