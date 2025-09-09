<template>
    <div class="appointments-page">
        <!-- Qidiruv va Filter -->
        <div class="header">
            <h2>Qabul</h2>
            <button class="add-btn">+ Qo‘shish</button>
        </div>
        <div class="controls">
            <!-- Search input -->
            <input v-model="search" type="text" placeholder="Qidiruv (Ism yoki Telefon)" />

            <!-- Status filter dropdown -->
            <div class="dropdown" @click="toggleDropdown">
                <div class="dropdown-selected">
                    {{ statusLabel }}
                    <span class="arrow" :class="{ open: openDropdown }">▼</span>
                </div>

                <div v-if="openDropdown" class="dropdown-options">
                    <div v-for="opt in statusOptions" :key="opt.value" class="dropdown-option"
                        @click.stop="selectOption(opt)">
                        {{ opt.label }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Jadval -->
        <div class="table-wrapper">
            <table class="appointments-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Ismi</th>
                        <th>Telefon</th>
                        <th>Sana</th>
                        <th>Holati</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in filteredAppointments" :key="item.id">
                        <td>{{ item.id }}</td>
                        <td>{{ item.name }}</td>
                        <td>{{ item.phone }}</td>
                        <td>{{ item.date }}</td>
                        <td>
                            <span :class="['status', item.status.toLowerCase()]">
                                {{ item.status }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue";

const search = ref("");
const statusFilter = ref("");

const appointments = ref([
    { id: 1, name: "Ali Valiyev", phone: "998901234567", date: "2025-09-01", status: "Keldi" },
    { id: 2, name: "Dilnoza Karimova", phone: "998909876543", date: "2025-09-02", status: "Kutilmoqda" },
    { id: 3, name: "Jasur Sodiqov", phone: "998935551212", date: "2025-09-02", status: "Kelmadi" },
    { id: 4, name: "Madina Rasulova", phone: "998941112233", date: "2025-09-03", status: "Keldi" },
    { id: 5, name: "Shahzod Qodirov", phone: "998901234555", date: "2025-09-04", status: "Kutilmoqda" },
    { id: 6, name: "Kamola Axmedova", phone: "998907778899", date: "2025-09-04", status: "Keldi" },
    { id: 7, name: "Bobur Ismoilov", phone: "998935552222", date: "2025-09-05", status: "Kelmadi" },
    { id: 8, name: "Nilufar Toshpulatova", phone: "998912223344", date: "2025-09-06", status: "Kutilmoqda" },
    { id: 9, name: "Oybek Sobirov", phone: "998901111999", date: "2025-09-06", status: "Keldi" },
    { id: 10, name: "Zarina Xolmatova", phone: "998905556677", date: "2025-09-07", status: "Kelmadi" },
]);

const filteredAppointments = computed(() => {
    return appointments.value.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(search.value.toLowerCase()) ||
            item.phone.includes(search.value);
        const matchesStatus =
            !statusFilter.value || item.status === statusFilter.value;
        return matchesSearch && matchesStatus;
    });
});

const openDropdown = ref(false);

const statusOptions = [
  { value: "", label: "Barchasi" },
  { value: "Keldi", label: "Keldi" },
  { value: "Kutilmoqda", label: "Kutilmoqda" },
  { value: "Kelmadi", label: "Kelmadi" },
];

const statusLabel = computed(
  () => statusOptions.find((o) => o.value === statusFilter.value)?.label
);

function toggleDropdown() {
  openDropdown.value = !openDropdown.value;
}

function selectOption(opt) {
  statusFilter.value = opt.value;
  openDropdown.value = false;
}

onMounted(() => {
  document.addEventListener("click", (e) => {
    if (!(e.target.closest(".dropdown"))) {
      openDropdown.value = false;
    }
  });
});
</script>