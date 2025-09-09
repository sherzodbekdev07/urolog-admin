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

        <!-- Patient Add Modal -->
        <PatientAdd v-if="newPatientOP" :is-open="newPatientOP" @close="newPatientOP = false"
            @success="handleAddSuccess" />

        <!-- Patient Edit Modal -->
        <div v-if="editModalOpen" class="modal-overlay" @click.self="closeEditModal">
            <div class="modal">
                <div class="modal-header">
                    <h3>Bemorni tahrirlash</h3>
                    <button class="close-btn" @click="closeEditModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form @submit.prevent="savePatient" class="modal-body">
                    <div class="form-group">
                        <label>To'liq ism</label>
                        <input v-model="editingPatient.full_name" type="text" required>
                    </div>
                    <div class="form-group">
                        <label>Telefon</label>
                        <input v-model="editingPatient.phone" type="text" required>
                    </div>
                    <div class="form-group">
                        <label>Tug'ilgan sana</label>
                        <input v-model="editingPatient.birth_date" type="date">
                    </div>
                    <div class="form-group">
                        <label>Doktor</label>
                        <select v-model="editingPatient.doctor" required>
                            <option value="">Doktorni tanlang</option>
                            <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
                                {{ doctor.full_name }}
                            </option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Telegram username</label>
                        <input v-model="editingPatient.tg_username" type="text">
                    </div>
                    <div class="form-group">
                        <label>Izohlar</label>
                        <textarea v-model="editingPatient.notes" rows="3"></textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="cancel-btn" @click="closeEditModal">Bekor qilish</button>
                        <button type="submit" class="save-btn" :disabled="editLoading">
                            <i v-if="editLoading" class="fas fa-spinner fa-spin"></i>
                            {{ editLoading ? 'Saqlanmoqda...' : 'Saqlash' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

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
            <p>{{ search ? 'Qidiruv so\'zini o\'zgartirib ko\'ring' : 'Yangi bemor qo\'shish uchun yuqoridagitugmanibosing' }}</p>
        </div>

        <!-- Jadval -->
        <div v-else class="table-container">
            <div class="table-wrapper">
                <table class="patients-table">
                    <thead>
                        <tr>
                            <th class="number-col">№</th>
                            <th class="name-col" @click="setSortField('full_name')">
                                <span>To'liq ism</span>
                                <i class="fas fa-sort sort-icon" :class="getSortClass('full_name')"></i>
                            </th>
                            <th class="phone-col" @click="setSortField('phone')">
                                <span>Telefon</span>
                                <i class="fas fa-sort sort-icon" :class="getSortClass('phone')"></i>
                            </th>
                            <th class="date-col" @click="setSortField('created_at')">
                                <span></span>
                                <i class="fas fa-sort sort-icon" :class="getSortClass('created_at')"></i>
                            </th>
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
                                <div class="status-select" @click="openStatusDropdown(patient, index)">

                                    <i class="fas fa-chevron-down status-arrow"
                                        :class="{ rotate: openStatusIndex === index }"></i>

                                    <div v-if="openStatusIndex === index" class="status-dropdown">
                                        <div v-for="status in statusOptions" :key="status.value" class="status-option"
                                            :class="{ active: patient.status === status.value }"
                                            @click.stop="changeStatus(patient, status.value)">
                                            <span class="status-badge" :class="status.value">
                                                <i class="fas fa-circle status-dot"></i>
                                                {{ status.label }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td class="date-col">
                                <div class="date-info">
                                    <span class="date">{{ formatDate(patient.created_at) }}</span>
                                    <span class="time">{{ formatTime(patient.created_at) }}</span>
                                </div>
                            </td>
                            <td class="actions-col">
                                <div class="action-buttons">
                                    <button class="action-btn edit" @click="editPatient(patient)" title="Tahrirlash">
                                        <i class="fas fa-edit"></i>
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
// Reactive data
const loading = ref(false);
const editLoading = ref(false);
const patients = ref([]);
const doctors = ref([]);
const search = ref("");
const filterField = ref("full_name");
const sortOrder = ref("desc");
const sortField = ref("created_at");
const openDropdown = ref(null);
const openStatusIndex = ref(null);
const currentPage = ref(1);
const totalPatients = ref(0);
const totalPages = ref(0);
const newPatientOP = ref(false);
const editModalOpen = ref(false);
const editingPatient = ref({});

// API URL
const API_URL = "https://web.dad-urolog.uz/api/dashboard/patients/";
const DOCTORS_URL = "https://web.dad-urolog.uz/api/dashboard/doctors/";

// Dropdown options
const filterOptions = [
    { value: "full_name", label: "Ism", icon: "fas fa-user" },
    { value: "phone", label: "Telefon", icon: "fas fa-phone" },
    { value: "id", label: "ID", icon: "fas fa-hashtag" },
];
const sortOptions = [
    { value: "asc", label: "O'sish tartibida", icon: "fas fa-sort-up" },
    { value: "desc", label: "Kamayish tartibida", icon: "fas fa-sort-down" },
];
const statusOptions = [
    { value: "active", label: "Faol" },
    { value: "inactive", label: "Nofaol" },
    { value: "pending", label: "Kutilmoqda" }
];

// Computed properties
const filterFieldLabel = computed(() =>
    filterOptions.find(o => o.value === filterField.value)?.label || "Filter"
);
const sortOrderLabel = computed(() =>
    sortOptions.find(o => o.value === sortOrder.value)?.label || "Tartiblash"
);
const filteredPatients = computed(() => {
    if (!search.value.trim()) return patients.value;
    const searchTerm = search.value.toLowerCase();
    return patients.value.filter(patient => {
        const searchIn = patient[filterField.value]?.toString().toLowerCase() || "";
        return searchIn.includes(searchTerm);
    });
});
const visiblePages = computed(() => {
    const pages = [];
    const start = Math.max(1, currentPage.value - 2);
    const end = Math.min(totalPages.value, currentPage.value + 2);
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }
    return pages;
});

// API Methods
const fetchPatients = async (page = 1) => {
    try {
        loading.value = true;
        console.log(`🔄 Bemorlar yuklanmoqda - sahifa: ${page}`);
        const result = await $fetch(`${API_URL}`, {
            query: { page }
        });
        console.log("📋 API javobi:", result);
        if (result.status) {
            patients.value = result.data;
            totalPatients.value = result.total;
            totalPages.value = result.total_pages;
            currentPage.value = result.current_page;
            console.log(`✅ ${result.data.length} ta bemor yuklandi`);
        } else {
            console.error("❌ API xatolik:", result.message);
            showNotification('Ma\'lumotlarni yuklashda xatolik', 'error');
        }
    } catch (error) {
        console.error("❌ Bemorlarni yuklashda xatolik:", error);
        showNotification('Bemorlarni yuklashda xatolik yuz berdi', 'error');
    } finally {
        loading.value = false;
    }
};

const fetchDoctors = async () => {
    try {
        console.log("🔄 Doktorlar yuklanmoqda...");
        const result = await $fetch(DOCTORS_URL);
        console.log("📋 Doktorlar API javobi:", result);
        if (result.status) {
            doctors.value = result.data;
            console.log("✅ Doktorlar yuklandi:", doctors.value);
        } else {
            console.error("❌ Doktorlarni yuklashda xatolik:", result.message);
        }
    } catch (error) {
        console.error("❌ Doktorlarni yuklashda xatolik:", error);
    }
};

const changeStatus = async (patient, newStatus) => {
    try {
        console.log(`🔄 Status o'zgartirilmoqda: ${patient.full_name} -> ${newStatus}`);
        await $fetch(`${API_URL}${patient.id}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'X-CSRFTOKEN': 'qiXtHL1ARCFCmnMSqP6HW2dKD3M8EfoNGmYRCPDccCUSOvvaRJ37rLYkWwatA1do'
            },
            body: { status: newStatus }
        });
        const patientIndex = patients.value.findIndex(p => p.id === patient.id);
        if (patientIndex !== -1) {
            patients.value[patientIndex].status = newStatus;
        }
        openStatusIndex.value = null;
        console.log("✅ Status muvaffaqiyatli o'zgartirildi");
        showNotification('Status muvaffaqiyatli o\'zgartirildi', 'success');
    } catch (error) {
        console.error("❌ Status o'zgartirishda xatolik:", error);
        if (error.data) {
            console.error("📋 Error details:", error.data);
        }
        showNotification('Status o\'zgartirishda xatolik yuz berdi', 'error');
        if (error.statusCode === 400) {
            console.log("⚠️ Bad Request - yuborilgan ma'lumotlarni tekshiring");
        }
    }
};

const savePatient = async () => {
    try {
        editLoading.value = true;
        const patientId = editingPatient.value.id;
        const csrfToken = 'qiXtHL1ARCFCmnMSqP6HW2dKD3M8EfoNGmYRCPDccCUSOvvaRJ37rLYkWwatA1do';
        const payload = {
            full_name: editingPatient.value.full_name,
            phone: editingPatient.value.phone,
            birth_date: editingPatient.value.birth_date,
            tg_username: editingPatient.value.tg_username,
            notes: editingPatient.value.notes,
            doctor: editingPatient.value.doctor || null,
        };
        console.log("📤 Yuborilayotgan ma'lumot:", payload);
        const res = await fetch(`${API_URL}${patientId}/`, {
            method: "PATCH",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-CSRFTOKEN": csrfToken
            },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Server error: ${res.status} - ${text}`);
        }
        const data = await res.json();
        console.log("✅ Bemor yangilandi:", data);
        // Local data yangilash
        const index = patients.value.findIndex(p => p.id === patientId);
        if (index !== -1) {
            patients.value[index] = {
                ...editingPatient.value,
                doctor: doctors.value.find(d => d.id === editingPatient.value.doctor) || null,
            };
        }
        showNotification('Bemor muvaffaqiyatli yangilandi', 'success');
        closeEditModal();
    } catch (error) {
        console.error("❌ Bemorni tahrirlashda xatolik:", error);
        showNotification('Bemorni tahrirlashda xatolik yuz berdi', 'error');
    } finally {
        editLoading.value = false;
    }
};

const deletePatient = async (patient) => {
    if (!confirm(`${patient.full_name} bemorni o'chirishni tasdiqlaysizmi?`)) {
        return;
    }
    try {
        console.log("🗑️ Bemor o'chirilmoqda:", patient.full_name);
        await $fetch(`${API_URL}${patient.id}/`, {
            method: 'DELETE',
            headers: {
                'accept': 'application/json',
                'X-CSRFTOKEN': 'qiXtHL1ARCFCmnMSqP6HW2dKD3M8EfoNGmYRCPDccCUSOvvaRJ37rLYkWwatA1do'
            }
        });
        patients.value = patients.value.filter(p => p.id !== patient.id);
        totalPatients.value -= 1;
        console.log("✅ Bemor muvaffaqiyatli o'chirildi");
        showNotification('Bemor muvaffaqiyatli o\'chirildi', 'success');
    } catch (error) {
        console.error("❌ Bemorni o'chirishda xatolik:", error);
        if (error.data) {
            console.error("📋 Error details:", error.data);
        }
        showNotification('Bemorni o\'chirishda xatolik yuz berdi', 'error');
    }
};

// UI Methods
const toggleDropdown = (type) => {
    openDropdown.value = openDropdown.value === type ? null : type;
};
const selectFilter = (option) => {
    filterField.value = option.value;
    openDropdown.value = null;
};
const selectSort = (option) => {
    sortOrder.value = option.value;
    openDropdown.value = null;
};
const setSortField = (field) => {
    if (sortField.value === field) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortField.value = field;
        sortOrder.value = 'asc';
    }
};
const getSortClass = (field) => {
    if (sortField.value !== field) return '';
    return sortOrder.value === 'asc' ? 'fa-sort-up active' : 'fa-sort-down active';
};
const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        fetchPatients(page);
    }
};
const clearSearch = () => {
    search.value = "";
};
const debouncedSearch = (() => {
    let timeout;
    return () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            // Qidiruv logikasi
        }, 300);
    };
})();

// Status methods
const openStatusDropdown = (patient, index) => {
    openStatusIndex.value = openStatusIndex.value === index ? null : index;
};

// Edit patient methods
const editPatient = (patient) => {
    editingPatient.value = {
        ...patient,
        doctor: patient.doctor?.id || ""
    };
    editModalOpen.value = true;
};
const closeEditModal = () => {
    editModalOpen.value = false;
    editingPatient.value = {};
};

// Handle successful add from PatientAdd component
const handleAddSuccess = (newPatient) => {
    newPatientOP.value = false;
    fetchPatients(currentPage.value);
};

// Utility functions
const getPatientInitials = (fullName) => {
    if (!fullName) return "?";
    return fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};
const formatPhone = (phone) => {
    if (!phone) return "";
    return phone.replace(/(\+998)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
};
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};
const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit'
    });
};
const getStatusText = (status) => {
    const statusMap = {
        active: 'Faol',
        inactive: 'Nofaol',
        pending: 'Kutilmoqda'
    };
    return statusMap[status] || status;
};

// Notification helper
const showNotification = (message, type) => {
    try {
        useNuxtApp().$toast?.[type](message);
    } catch (error) {
        console.log(`${type}: ${message}`);
    }
};

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
    if (!event.target.closest('.dropdown')) {
        openDropdown.value = null;
    }
    if (!event.target.closest('.status-select')) {
        openStatusIndex.value = null;
    }
};

// Lifecycle
onMounted(() => {
    fetchPatients();
    fetchDoctors();
    document.addEventListener('click', handleClickOutside);
});
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

// Watch for sort changes
watch([sortField, sortOrder], () => {
    patients.value.sort((a, b) => {
        const aVal = a[sortField.value];
        const bVal = b[sortField.value];
        if (sortOrder.value === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
});
</script>

<style scoped>
/* Modal styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    animation: modalSlide 0.3s ease-out;
}

@keyframes modalSlide {
    from {
        opacity: 0;
        transform: translateY(-50px) scale(0.95);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    margin: 0;
    color: #1f2937;
    font-size: 18px;
    font-weight: 600;
}

.close-btn {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    transition: all 0.2s;
}

.close-btn:hover {
    background: #f3f4f6;
    color: #374151;
}

.modal-body {
    padding: 24px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 6px;
    color: #374151;
    font-weight: 500;
    font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 32px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
}

.cancel-btn,
.save-btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
}

.cancel-btn {
    background: #f3f4f6;
    color: #374151;
    border: none;
}

.cancel-btn:hover {
    background: #e5e7eb;
}

.save-btn {
    background: #3b82f6;
    color: white;
    border: none;
}

.save-btn:hover:not(:disabled) {
    background: #2563eb;
}

.save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Status select styles */
.status-select {
    position: relative;
    cursor: pointer;
    user-select: none;
    display: inline-block;
    width: 100%;
}

.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s;
}

.status-badge.active {
    background: #dcfce7;
    color: #166534;
}

.status-badge.inactive {
    background: #fef2f2;
    color: #991b1b;
}

.status-badge.pending {
    background: #fef3c7;
    color: #92400e;
}

.status-dot {
    font-size: 8px;
}

.status-arrow {
    margin-left: 8px;
    font-size: 10px;
    transition: transform 0.2s;
}

.status-arrow.rotate {
    transform: rotate(180deg);
}

.status-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 100;
    animation: dropdownSlide 0.2s ease-out;
    overflow: hidden;
}

@keyframes dropdownSlide {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.status-option {
    padding: 8px 12px;
    cursor: pointer;
    transition: background 0.2s;
    border-bottom: 1px solid #f3f4f6;
}

.status-option:last-child {
    border-bottom: none;
}

.status-option:hover {
    background: #f9fafb;
}

.status-option.active {
    background: #eff6ff;
}

/* Action buttons update */
.action-buttons {
    display: flex;
    gap: 8px;
    justify-content: center;
}

.action-btn {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: all 0.2s;
}

.action-btn.edit {
    background: #eff6ff;
    color: #2563eb;
}

.action-btn.edit:hover {
    background: #dbeafe;
    color: #1d4ed8;
}

.action-btn.delete {
    background: #fef2f2;
    color: #dc2626;
}

.action-btn.delete:hover {
    background: #fee2e2;
    color: #b91c1c;
}

/* Additional utility styles */
.fa-spin {
    animation: fa-spin 1s infinite linear;
}

@keyframes fa-spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

/* Base table and page styles */
.patients-page {
    padding: 24px;
    background: #f8fafc;
    min-height: 100vh;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header h2 {
    margin: 0;
    color: #1f2937;
    font-size: 24px;
    font-weight: 600;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
}

.patients-count {
    color: #6b7280;
    font-size: 14px;
}

.add-btn {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    transition: all 0.2s;
}

.add-btn:hover {
    background: #2563eb;
    transform: translateY(-1px);
}

.search-controls {
    background: white;
    padding: 24px;
    border-radius: 12px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-input-wrapper {
    position: relative;
    margin-bottom: 16px;
}

.search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    font-size: 16px;
}

.search-input {
    width: 100%;
    padding: 12px 12px 12px 40px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.2s;
}

.search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    transition: all 0.2s;
}

.clear-btn:hover {
    background: #f3f4f6;
    color: #374151;
}

.filter-controls {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

.dropdown {
    position: relative;
}

.dropdown-toggle {
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    transition: all 0.2s;
    white-space: nowrap;
}

.dropdown-toggle:hover {
    background: #f1f5f9;
    border-color: #d1d5db;
}

.dropdown.active .dropdown-toggle {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #2563eb;
}

.arrow {
    font-size: 10px;
    transition: transform 0.2s;
}

.arrow.rotate {
    transform: rotate(180deg);
}

.dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 100;
    min-width: 150px;
    animation: dropdownSlide 0.2s ease-out;
    overflow: hidden;
}

.dropdown-item {
    padding: 10px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    transition: background 0.2s;
    border-bottom: 1px solid #f3f4f6;
}

.dropdown-item:last-child {
    border-bottom: none;
}

.dropdown-item:hover {
    background: #f9fafb;
}

.dropdown-item.active {
    background: #eff6ff;
    color: #2563eb;
}

.refresh-btn {
    background: #10b981;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
    background: #059669;
}

.refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.spinning {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

/* Loading and empty states */
.loading-state,
.empty-state {
    text-align: center;
    padding: 60px 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #f3f4f6;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
}

.empty-icon {
    font-size: 48px;
    color: #d1d5db;
    margin-bottom: 16px;
}

.empty-state h3 {
    color: #374151;
    margin-bottom: 8px;
}

.empty-state p {
    color: #6b7280;
    font-size: 14px;
}

/* Table styles */
.table-container {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-wrapper {
    overflow-x: auto;
}

.patients-table {
    width: 100%;
    border-collapse: collapse;
}

.patients-table th {
    background: #f8fafc;
    padding: 16px 12px;
    text-align: left;
    font-weight: 600;
    color: #374151;
    font-size: 13px;
    border-bottom: 2px solid #e5e7eb;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s;
}

.patients-table th:hover {
    background: #f1f5f9;
}

.patients-table th .sort-icon {
    margin-left: 8px;
    color: #9ca3af;
    font-size: 10px;
}

.patients-table th .sort-icon.active {
    color: #3b82f6;
}

.patients-table td {
    padding: 16px 12px;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: middle;
}

.patient-row:hover {
    background: #f9fafb;
}

.number-col {
    width: 60px;
    color: #6b7280;
    font-weight: 500;
}

.name-col {
    min-width: 200px;
}

.patient-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.patient-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #3b82f6;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
}

.patient-name {
    font-weight: 500;
    color: #1f2937;
}

.phone-col {
    min-width: 140px;
}

.phone-link {
    color: #3b82f6;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    transition: color 0.2s;
}

.phone-link:hover {
    color: #1d4ed8;
}

.status-col {
    width: 140px;
}

.date-col {
    min-width: 120px;
}

.date-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.date {
    font-size: 14px;
    color: #374151;
}

.time {
    font-size: 12px;
    color: #9ca3af;
}

.actions-col {
    width: 100px;
}

/* Pagination */
.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 20px;
    border-top: 1px solid #e5e7eb;
}

.pagination-btn {
    padding: 8px 12px;
    border: 1px solid #e5e7eb;
    background: white;
    color: #374151;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #d1d5db;
}

.pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.page-numbers {
    display: flex;
    gap: 4px;
}

.page-btn {
    width: 36px;
    height: 36px;
    border: 1px solid #e5e7eb;
    background: white;
    color: #374151;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
}

.page-btn:hover {
    background: #f9fafb;
    border-color: #d1d5db;
}

.page-btn.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
}

/* Responsive */
@media (max-width: 768px) {
    .patients-page {
        padding: 16px;
    }

    .header {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
    }

    .filter-controls {
        flex-direction: column;
    }

    .dropdown-toggle {
        width: 100%;
        justify-content: space-between;
    }

    .action-buttons {
        flex-direction: column;
        gap: 4px;
    }
}
</style>