<template>
    <div class="sidebar" :class="{ collapsed: isCollapsed }">
        <!-- Logo -->
        <div class="logo">
            <h2>DAD</h2>
            <button class="collapse-btn" @click="isCollapsed = !isCollapsed">
                {{ isCollapsed ? "»" : "«" }}
            </button>
        </div>

        <!-- Menu -->
        <nav class="menu" @transitionend="$emit('transition-end', $event)">
            <NuxtLink v-for="item in menuItems" :key="item.path" :to="item.path" class="menu-item"
                :class="{ active: route.fullPath === item.path }">
                <img :src="item.icon" class="icon" />
                <span v-if="showLabels">{{ item.label }}</span>
            </NuxtLink>
        </nav>

        <!-- Collapse button -->
    </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { ref } from "vue";

import HomeIcon from "@/assets/images/svg/dashboard.svg?url"
import DoctorIcon from "@/assets/images/svg/309042_group_users_people_icon.svg?url"
import CalendarIcon from "@/assets/images/svg/calendar.svg?url"
import TargetIcon from "@/assets/images/svg/circle.svg?url"

const menuItems = [
    { path: "/", label: "Dashboard", icon: HomeIcon },
    { path: "/patients", label: "Bemorlar", icon: DoctorIcon },
    { path: "/appointments", label: "Qabul", icon: CalendarIcon },
    { path: "/goals", label: "Maqsadlar", icon: TargetIcon },
];
import { useEventBus } from "@vueuse/core"

// reactive collapsed state for sidebar
const isCollapsed = ref(false)
// showLabels becomes true only after expand transition completes to avoid partial text visibility
const showLabels = ref(true)

// route for active link checks
const route = useRoute()

import { onMounted, ref as vueRef } from 'vue'

// menuRef used to listen for transitionend
const menuRef = vueRef(null)

const bus = useEventBus("sidebar")

const onTransitionEnd = (e) => {
    if (e.propertyName !== "width") return

    if (!isCollapsed.value) {
        showLabels.value = true
    }

    // ✅ Chartlarga signal yuboramiz
    bus.emit()
}

// toggle handler to hide labels immediately when collapsing
const toggleCollapsed = () => {
    if (isCollapsed.value) {
        // currently collapsed -> expanding
        isCollapsed.value = false
        // don't show labels until transitionend
        showLabels.value = false
    } else {
        // currently expanded -> collapsing
        // hide labels immediately
        showLabels.value = false
        isCollapsed.value = true
    }
}
// ensure initial state
onMounted(() => {
    // if starting expanded, show labels
    showLabels.value = !isCollapsed.value
})

</script>