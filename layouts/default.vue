<template>
    <div class="flex">
        <!-- Sidebar -->
        <aside class="sidebar">
            <h1>Doctor Admin</h1>
            <nav>
                <NuxtLink to="/">Dashboard</NuxtLink>
                <NuxtLink to="/appointments">Appointments</NuxtLink>
                <NuxtLink to="/patients">Patients</NuxtLink>
                <NuxtLink to="/analytics">Analytics</NuxtLink>
                <NuxtLink to="/notifications">Notifications</NuxtLink>
            </nav>
        </aside>

        <!-- Main -->
        <div class="main">
            <header>
                <h2>Admin Panel</h2>
                <button>+ New</button>
            </header>
            <main>
                <slot />
            </main>
        </div>
    </div>
</template>

<style scoped lang="scss">
.flex {
    display: flex;
}
</style>
