<template>
    <div class="patients-page">
        <div class="header">
            <h2>Bemorlar</h2>
            <div class="header-actions">
                <div class="patients-count" v-if="!loading">
                    <span>Jami: {{ totalPatients }} ta bemor</span>
                </div>
                <button class="add-btn" @click="newPatientOP = true">
                    <i class="fas fa-plus"></i>
                    Qo'shish
                </button>
            </div>
        </div>
    <PatientAdd :isOpen="newPatientOP" @close="newPatientOP = false" @success="() => { newPatientOP = false; fetchPatients(); }" />
        <!-- Qidiruv va filter -->
        <div class="search-controls">
            <div class="search-input-wrapper">
                <i class="fas fa-search search-icon"></i>
                <input v-model="search" type="text" placeholder="Ism, telefon yoki ID bo'yicha qidirish..."
                    class="search-input" @input="debouncedSearch" />
                <button v-if="search" @click="clearSearch" class="clear-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="filter-controls">
                <!-- Filter Dropdown -->
                <div class="dropdown" :class="{ active: openDropdown === 'filter' }">
                    <button class="dropdown-toggle" @click="toggleDropdown('filter')">
                        <i class="fas fa-filter"></i>
                        {{ filterFieldLabel }}
                        <i class="fas fa-chevron-down arrow" :class="{ rotate: openDropdown === 'filter' }"></i>
                    </button>
                    <div class="dropdown-menu" v-if="openDropdown === 'filter'">
                        <div v-for="opt in filterOptions" :key="opt.value" class="dropdown-item"
                            :class="{ active: filterField === opt.value }" @click="selectFilter(opt)">
                            <i :class="opt.icon"></i>
                            {{ opt.label }}
                        </div>
                    </div>
                </div>

                <!-- Sort Dropdown -->
                <div class="dropdown" :class="{ active: openDropdown === 'sort' }">
                    <button class="dropdown-toggle" @click="toggleDropdown('sort')">
                        <i class="fas fa-sort"></i>
                        {{ sortOrderLabel }}
                        <i class="fas fa-chevron-down arrow" :class="{ rotate: openDropdown === 'sort' }"></i>
                    </button>
                    <div class="dropdown-menu" v-if="openDropdown === 'sort'">
                        <div v-for="opt in sortOptions" :key="opt.value" class="dropdown-item"
                            :class="{ active: sortOrder === opt.value }" @click="selectSort(opt)">
                            <i :class="opt.icon"></i>
                            {{ opt.label }}
                        </div>
                    </div>
                </div>

                <button class="refresh-btn" @click="fetchPatients" :disabled="loading">
                    <i class="fas fa-sync-alt" :class="{ spinning: loading }"></i>
                    Yangilash
                </button>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Bemorlar ro'yxati yuklanmoqda...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredPatients.length === 0 && !loading" class="empty-state">
            <i class="fas fa-user-friends empty-icon"></i>
            <h3>{{ search ? 'Qidiruv natijalari topilmadi' : 'Bemorlar topilmadi' }}</h3>
            <p>{{ search ? 'Qidiruv so\'zini o\'zgartirib ko\'ring' : 'Yangi bemor qo\'shish uchun yuqoridagi tugmanibosing' }}</p>
        </div>

        <!-- Jadval -->
        <div v-else class="table-container">
            <div class="table-wrapper">
                <table class="patients-table">
                    <thead>
                        <tr>
                            <th class="number-col">№</th>
                            <th class="id-col" @click="setSortField('id')">
                                <span>ID</span>
                                <i class="fas fa-sort sort-icon" :class="getSortClass('id')"></i>
                            </th>
                            <th class="name-col" @click="setSortField('full_name')">
                                <span>To'liq ism</span>
                                <i class="fas fa-sort sort-icon" :class="getSortClass('full_name')"></i>
                            </th>
                            <th class="phone-col" @click="setSortField('phone')">
                                <span>Telefon</span>
                                <i class="fas fa-sort sort-icon" :class="getSortClass('phone')"></i>
                            </th>
                            <th class="status-col">Holat</th>
                            <th class="date-col" @click="setSortField('created_at')">
                                <span>Ro'yxatdan o'tgan</span>
                                <i class="fas fa-sort sort-icon" :class="getSortClass('created_at')"></i>
                            </th>
                            <th class="actions-col">Harakatlar</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(patient, index) in filteredPatients" :key="patient.id" class="patient-row">
                            <td class="number-col">{{ (currentPage - 1) * 10 + index + 1 }}</td>
                            <td class="id-col">
                                <span class="patient-id">#{{ patient.id }}</span>
                            </td>
                            <td class="name-col">
                                <div class="patient-info">
                                    <div class="patient-avatar">
                                        {{ getPatientInitials(patient.full_name) }}
                                    </div>
                                    <span class="patient-name">{{ patient.full_name }}</span>
                                </div>
                            </td>
                            <td class="phone-col">
                                <a :href="`tel:${patient.phone}`" class="phone-link">
                                    <i class="fas fa-phone"></i>
                                    {{ formatPhone(patient.phone) }}
                                </a>
                            </td>
                            <td class="status-col">
                                <span class="status-badge" :class="patient.status">
                                    <i class="fas fa-circle status-dot"></i>
                                    {{ getStatusText(patient.status) }}
                                </span>
                            </td>
                            <td class="date-col">
                                <div class="date-info">
                                    <span class="date">{{ formatDate(patient.created_at) }}</span>
                                    <span class="time">{{ formatTime(patient.created_at) }}</span>
                                </div>
                            </td>
                            <td class="actions-col">
                                <div class="action-buttons">
                                    <button class="action-btn add" @click="addAppointment(patient)"
                                        title="Qabul qo'shish">
                                        <i class="fas fa-calendar-plus"></i>
                                    </button>
                                    <button class="action-btn edit" @click="editPatient(patient)" title="Tahrirlash">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn view" @click="viewPatient(patient)" title="Ko'rish">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="action-btn delete" @click="deletePatient(patient)" title="O'chirish">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="pagination" v-if="totalPages > 1">
                <button class="pagination-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
                    <i class="fas fa-chevron-left"></i>
                    Oldingi
                </button>

                <div class="page-numbers">
                    <button v-for="page in visiblePages" :key="page" class="page-btn"
                        :class="{ active: page === currentPage }" @click="goToPage(page)">
                        {{ page }}
                    </button>
                </div>

                <button class="pagination-btn" :disabled="currentPage === totalPages"
                    @click="goToPage(currentPage + 1)">
                    Keyingi
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue"
import PatientAdd from "@/components/PatientAdd.vue"
// Reactive data
const loading = ref(false)
const patients = ref([])
const search = ref("")
const filterField = ref("full_name")
const sortOrder = ref("desc")
const sortField = ref("created_at")
const openDropdown = ref(null)
const currentPage = ref(1)
const totalPatients = ref(0)
const totalPages = ref(0)
const newPatientOP = ref(false)
// API URL
const API_URL = "https://web.dad-urolog.uz/api/dashboard/patients/"

// Dropdown options
const filterOptions = [
    { value: "full_name", label: "Ism", icon: "fas fa-user" },
    { value: "phone", label: "Telefon", icon: "fas fa-phone" },
    { value: "id", label: "ID", icon: "fas fa-hashtag" },
]

const sortOptions = [
    { value: "asc", label: "O'sish tartibida", icon: "fas fa-sort-up" },
    { value: "desc", label: "Kamayish tartibida", icon: "fas fa-sort-down" },
]

// Computed properties
const filterFieldLabel = computed(() =>
    filterOptions.find(o => o.value === filterField.value)?.label || "Filter"
)

const sortOrderLabel = computed(() =>
    sortOptions.find(o => o.value === sortOrder.value)?.label || "Tartiblash"
)

const filteredPatients = computed(() => {
    if (!search.value.trim()) return patients.value

    const searchTerm = search.value.toLowerCase()
    return patients.value.filter(patient => {
        const searchIn = patient[filterField.value]?.toString().toLowerCase() || ""
        return searchIn.includes(searchTerm)
    })
})

const visiblePages = computed(() => {
    const pages = []
    const start = Math.max(1, currentPage.value - 2)
    const end = Math.min(totalPages.value, currentPage.value + 2)

    for (let i = start; i <= end; i++) {
        pages.push(i)
    }
    return pages
})

// Methods
const fetchPatients = async (page = 1) => {
    try {
        loading.value = true
        const response = await fetch(`${API_URL}?page=${page}`)
        const result = await response.json()

        if (result.status) {
            patients.value = result.data
            totalPatients.value = result.total
            totalPages.value = result.total_pages
            currentPage.value = result.current_page
        } else {
            console.error("API xatolik:", result.message)
        }
    } catch (error) {
        console.error("Bemorlarni yuklashda xatolik:", error)
    } finally {
        loading.value = false
    }
}

const toggleDropdown = (type) => {
    openDropdown.value = openDropdown.value === type ? null : type
}

const selectFilter = (option) => {
    filterField.value = option.value
    openDropdown.value = null
}

const selectSort = (option) => {
    sortOrder.value = option.value
    openDropdown.value = null
}

const setSortField = (field) => {
    if (sortField.value === field) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
        sortField.value = field
        sortOrder.value = 'asc'
    }
}

const getSortClass = (field) => {
    if (sortField.value !== field) return ''
    return sortOrder.value === 'asc' ? 'fa-sort-up active' : 'fa-sort-down active'
}

const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        fetchPatients(page)
    }
}

const clearSearch = () => {
    search.value = ""
}

const debouncedSearch = (() => {
    let timeout
    return () => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
            // Qidiruv logikasi
        }, 300)
    }
})()

// Utility functions
const getPatientInitials = (fullName) => {
    if (!fullName) return "?"
    return fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const formatPhone = (phone) => {
    if (!phone) return ""
    return phone.replace(/(\+998)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
}

const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
}

const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

const getStatusText = (status) => {
    const statusMap = {
        active: 'Faol',
        inactive: 'Nofaol',
        pending: 'Kutilmoqda'
    }
    return statusMap[status] || status
}

// Action handlers
const openAddModal = () => {
    console.log("Yangi bemor qo'shish")
}

const addAppointment = (patient) => {
    console.log("Qabul qo'shish:", patient)
}

const editPatient = (patient) => {
    console.log("Bemorni tahrirlash:", patient)
}

const viewPatient = (patient) => {
    console.log("Bemorni ko'rish:", patient)
}

const deletePatient = (patient) => {
    if (confirm(`${patient.full_name} bemorni o'chirishni tasdiqlaysizmi?`)) {
        console.log("Bemorni o'chirish:", patient)
    }
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
    if (!event.target.closest('.dropdown')) {
        openDropdown.value = null
    }
}

// Lifecycle
onMounted(() => {
    fetchPatients()
    document.addEventListener('click', handleClickOutside)
})

// Watch for sort changes
watch([sortField, sortOrder], () => {
    // Re-sort patients when sort criteria changes
    patients.value.sort((a, b) => {
        const aVal = a[sortField.value]
        const bVal = b[sortField.value]

        if (sortOrder.value === 'asc') {
            return aVal > bVal ? 1 : -1
        } else {
            return aVal < bVal ? 1 : -1
        }
    })
})
</script>
