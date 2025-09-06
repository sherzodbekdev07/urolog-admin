<!-- components/layout/DashboardStats.vue -->
<template>
    <section class="stats">
        <div class="card" v-for="(stat, i) in stats" :key="i">
            <h3>{{ stat.title }}</h3>
            <p class="number">{{ stat.value }}</p>
            <span :class="['trend', stat.trend]">{{ stat.change }}</span>
        </div>
    </section>
</template>

<script setup>
const stats = [
    { title: "Appointments", value: 120, change: "+15% this week", trend: "up" },
    { title: "Patients", value: 86, change: "+8% this week", trend: "up" },
    { title: "Revenue", value: "$12,450", change: "-3% this week", trend: "down" },
    { title: "Feedback", value: "4.8 ⭐", change: "+10 reviews", trend: "up" }
]
</script>

<style scoped lang="scss">
.stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;

    .card {
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);

        h3 {
            font-size: 1rem;
            color: #64748b;
        }

        .number {
            font-size: 1.6rem;
            font-weight: bold;
            color: #1e293b;
        }

        .trend.up {
            color: #16a34a;
        }

        .trend.down {
            color: #dc2626;
        }
    }
}
</style>
