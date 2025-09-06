<template>
    <aside :class="['sidebar', { collapsed: isCollapsed }]">
        <div class="logo">
            <span>DAD</span>
            <button class="toggle" @click="isCollapsed = !isCollapsed">
                {{ isCollapsed ? '➡' : '⬅' }}
            </button>
        </div>

        <ul>
            <li :class="{ active: activeMenu === 'dashboard' }" class="" @click="setActive('dashboard')">
                <img src="../assets/images/svg/dashbroad.svg" alt="">
                Dashboard
            </li>
            <li :class="{ active: activeMenu === 'home' }" @click="setActive('home')">
                <img src="../assets/images/svg/main.svg" alt="">
                Bosh sahifa
            </li>
            <li :class="{ active: activeMenu === 'patients' }" @click="setActive('patients')">
                <img src="../assets/images/svg/309042_group_users_people_icon.svg" alt="">
                Bemorlar
            </li>
            <li :class="{ active: activeMenu === 'appointments' }" @click="setActive('appointments')">
                <img src="../assets/images/svg/calendar.svg" alt="">
                Qabulga yozilganlar
            </li>
            <li :class="{ active: activeMenu === 'goals' }" @click="setActive('goals')">
                <img src="../assets/images/svg/circle.svg" alt="">
                Maqsadli bemorlar
            </li>
        </ul>
    </aside>
</template>

<script setup>
import { ref } from 'vue'

const isCollapsed = ref(false)
const activeMenu = ref('dashboard')

function setActive(menu) {
    activeMenu.value = menu
}
</script>