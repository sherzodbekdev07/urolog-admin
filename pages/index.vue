<template>
    <div class="dashboard">
        <Sidebar />
        <div class="main">
            <Header />
            <DashboardStats />
            <DashboardChart />
            <AppointmentsTable />
            <PatientsList />
        </div>
    </div>
</template>

<script setup>
import Sidebar from '../components/SlideBar.vue'
import Header from '../components/Header.vue'
import DashboardStats from '../components/DashboardStats.vue'
import DashboardChart from '@/components/DashboardCharts.vue'
import AppointmentsTable from '../components/AppointmentsTable.vue'
import PatientsList from '../components/PatientsList.vue'
</script>
