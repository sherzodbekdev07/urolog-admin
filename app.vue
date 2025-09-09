<template>
  <div class="dashboard">
    <Sidebar />
    <NuxtPage />
    <!-- <NuxtLayout /> -->
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
