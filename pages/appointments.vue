<template>
  <div class="dashboard">
    <div class="wrp">
      <div class="header">
        <h1 class="title">
          <i class="fas fa-calendar-check"></i>
          Booking Management
        </h1>

        <!-- Controls -->
        <div class="controls">
          <!-- Search -->
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input v-model="searchTerm" type="text" placeholder="Bemor yoki shifokor nomi..." class="search-input" />
          </div>

          <!-- Status Filter -->
          <select v-model="statusFilter" class="filter-select">
            <option value="Barchasi">Barcha holatlar</option>
            <option value="Kutilmoqda">Kutilmoqda</option>
            <option value="Keldi">Keldi</option>
            <option value="Bekor qilindi">Bekor qilindi</option>
          </select>

          <!-- Sort -->
          <select v-model="sortBy" class="filter-select">
            <option value="date">Sana bo'yicha</option>
            <option value="created_at">Yaratilgan vaqt</option>
            <option value="patient_name">Bemor nomi</option>
            <option value="doctor_name">Shifokor nomi</option>
          </select>

          <!-- Sort Order -->
          <button @click="toggleSortOrder" class="sort-btn">
            <i :class="sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats">
        <div class="stat-card">
          <div class="stat-number">{{ totalBookings }}</div>
          <div class="stat-label">Jami</div>
        </div>
        <div class="stat-card waiting">
          <div class="stat-number">{{ waitingCount }}</div>
          <div class="stat-label">Kutilmoqda</div>
        </div>
        <div class="stat-card completed">
          <div class="stat-number">{{ completedCount }}</div>
          <div class="stat-label">Keldi</div>
        </div>
        <div class="stat-card cancelled">
          <div class="stat-number">{{ cancelledCount }}</div>
          <div class="stat-label">Bekor qilindi</div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="loading">
        <div class="spinner"></div>
        <p>Ma'lumotlar yuklanmoqda...</p>
      </div>

      <!-- Bookings Grid -->
      <div v-else class="bookings-grid">
        <TransitionGroup name="booking" tag="div" class="grid">
          <div v-for="booking in filteredBookings" :key="booking.id" class="booking-card"
            :class="getStatusClass(booking.status)">
            <!-- Status Badge (clickable) -->
            <div class="status-badge" :class="getStatusClass(booking.status)" @click="toggleStatusDropdown(booking.id)">
              <i :class="getStatusIcon(booking.status)"></i>
              {{ booking.status }}
            </div>

            <!-- Status Dropdown (hidden by default) -->
            <div v-if="activeDropdownId === booking.id" class="status-dropdown">
              <div v-for="status in statusOptions" :key="status.value" class="status-option"
                @click="updateBookingStatus(booking.id, status.value)">
                <i :class="status.icon"></i>
                {{ status.label }}
              </div>
            </div>

            <!-- Patient Info -->
            <div class="patient-section">
              <div class="patient-name">
                <i class="fas fa-user"></i>
                {{ booking.name }}
              </div>
              <div class="patient-phone">
                <i class="fas fa-phone"></i>
                {{ booking.phone }}
              </div>
            </div>

            <!-- Doctor Info -->
            <div class="doctor-section">
              <div class="doctor-name">
                <i class="fas fa-user-md"></i>
                {{ booking.doctor_name }}
              </div>
            </div>

            <!-- Date & Time -->
            <div class="datetime-section">
              <div class="booking-date">
                <i class="fas fa-calendar"></i>
                {{ formatDate(booking.date) }}
              </div>
              <div class="booking-time">
                <i class="fas fa-clock"></i>
                {{ formatTime(booking.date) }}
              </div>
            </div>

            <!-- Created Date -->
            <div class="created-date">
              Yaratildi: {{ formatDateTime(booking.created_at) }}
            </div>

            <!-- Updating Indicator -->
            <div v-if="updatingIds.includes(booking.id)" class="updating-overlay">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Empty State -->
      <div v-if="!pending && filteredBookings.length === 0" class="empty-state">
        <i class="fas fa-calendar-times"></i>
        <h3>Hech qanday booking topilmadi</h3>
        <p>Qidiruv shartlaringizni o'zgartiring yoki yangi booking qo'shing</p>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button @click="currentPage--" :disabled="currentPage === 1" class="page-btn">
          <i class="fas fa-chevron-left"></i>
        </button>

        <span class="page-info">
          {{ currentPage }} / {{ totalPages }}
        </span>

        <button @click="currentPage++" :disabled="currentPage === totalPages" class="page-btn">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// State
const searchTerm = ref('')
const statusFilter = ref('Barchasi')
const sortBy = ref('date')
const sortOrder = ref('desc')
const currentPage = ref(1)
const updatingIds = ref([])
const activeDropdownId = ref(null)

// Status options for dropdown
const statusOptions = [
  { value: 'Kutilmoqda', label: 'Kutilmoqda', icon: 'fas fa-clock' },
  { value: 'Keldi', label: 'Keldi', icon: 'fas fa-check-circle' },
  { value: 'Bekor qilindi', label: 'Bekor qilindi', icon: 'fas fa-times-circle' },
]

// API Data
const { data: bookingsData, pending, error, refresh } = await useFetch('https://web.dad-urolog.uz/api/dashboard/bookings/', {
  query: computed(() => ({
    page: currentPage.value,
    search: searchTerm.value,
    status: statusFilter.value === 'Barchasi' ? '' : statusFilter.value
  }))
})

// Computed properties
const bookings = computed(() => bookingsData.value?.data || [])
const totalBookings = computed(() => bookingsData.value?.total || 0)
const totalPages = computed(() => bookingsData.value?.total_pages || 1)

const filteredBookings = computed(() => {
  let filtered = [...bookings.value]
  // Search filter
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(booking =>
      booking.name.toLowerCase().includes(term) ||
      booking.doctor_name.toLowerCase().includes(term) ||
      booking.phone.includes(term)
    )
  }
  // Status filter
  if (statusFilter.value !== 'Barchasi') {
    filtered = filtered.filter(booking => booking.status === statusFilter.value)
  }
  // Sort
  filtered.sort((a, b) => {
    let aVal = a[sortBy.value]
    let bVal = b[sortBy.value]

    if (sortBy.value.includes('date')) {
      aVal = new Date(aVal)
      bVal = new Date(bVal)
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    if (sortOrder.value === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })
  return filtered
})

// Stats
const waitingCount = computed(() =>
  bookings.value.filter(b => b.status === 'Kutilmoqda').length
)
const completedCount = computed(() =>
  bookings.value.filter(b => b.status === 'Keldi').length
)
const cancelledCount = computed(() =>
  bookings.value.filter(b => b.status === 'Bekor qilindi').length
)

// Methods
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const getStatusClass = (status) => {
  const classes = {
    'Kutilmoqda': 'waiting',
    'Keldi': 'completed',
    'Bekor qilindi': 'cancelled'
  }
  return classes[status] || ''
}

const getStatusIcon = (status) => {
  const icons = {
    'Kutilmoqda': 'fas fa-clock',
    'Keldi': 'fas fa-check-circle',
    'Bekor qilindi': 'fas fa-times-circle'
  }
  return icons[status] || 'fas fa-question-circle'
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDateTime = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const toggleStatusDropdown = (bookingId) => {
  activeDropdownId.value = activeDropdownId.value === bookingId ? null : bookingId
}

const updateBookingStatus = async (bookingId, newStatus) => {
  try {
    updatingIds.value.push(bookingId)
    activeDropdownId.value = null

    const { data } = await $fetch(`https://web.dad-urolog.uz/api/dashboard/bookings/${bookingId}/`, {
      method: 'PATCH',
      body: {
        status: newStatus
      }
    })

    // Update local data
    const bookingIndex = bookings.value.findIndex(b => b.id === bookingId)
    if (bookingIndex !== -1) {
      bookings.value[bookingIndex].status = newStatus
    }

    showNotification('Status muvaffaqiyatli oʻzgartirildi!', 'success')
  } catch (error) {
    console.error('Status update error:', error)
    showNotification('Xatolik yuz berdi!', 'error')
    refresh()
  } finally {
    updatingIds.value = updatingIds.value.filter(id => id !== bookingId)
  }
}

const showNotification = (message, type) => {
  console.log(`${type}: ${message}`)
}

// Watch for search and filter changes to reset page
watch([searchTerm, statusFilter], () => {
  currentPage.value = 1
})

// SEO
useHead({
  title: 'Booking Management - Dashboard',
  meta: [
    { name: 'description', content: 'Booking management dashboard for medical appointments' }
  ]
})
</script>

<style scoped>
/* Umumiy stil */
.booking-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  border-left: 5px solid transparent;
  position: relative;
  overflow: hidden;
}
.booking-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}
/* Status klasslari */
.booking-card.waiting {
  border-left-color: #ff9800;
}
.booking-card.completed {
  border-left-color: #4caf50;
}
.booking-card.cancelled {
  border-left-color: #f44336;
}
/* Status badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.2s;
}
.status-badge:hover {
  opacity: 0.9;
}
.status-badge.waiting {
  background-color: #ff9800;
}
.status-badge.completed {
  background-color: #4caf50;
}
.status-badge.cancelled {
  background-color: #f44336;
}
.status-badge i {
  margin-right: 6px;
}
/* Status dropdown */
.status-dropdown {
  position: absolute;
  top: 50px;
  right: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  overflow: hidden;
  width: 180px;
}
.status-option {
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}
.status-option:hover {
  background: #f8f9fa;
}
.status-option i {
  margin-right: 10px;
  color: #6c757d;
}
/* Updating overlay */
.updating-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #007bff;
  z-index: 20;
  border-radius: 12px;
}
/* Qolgan stil (o'zgartirilmagan) */
.patient-section {
  margin-bottom: 15px;
}
.patient-name,
.patient-phone {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 16px;
}
.patient-name i,
.patient-phone i {
  margin-right: 10px;
  color: #6c757d;
}
.doctor-section {
  margin-bottom: 15px;
}
.doctor-name {
  display: flex;
  align-items: center;
  font-size: 16px;
}
.doctor-name i {
  margin-right: 10px;
  color: #6c757d;
}
.datetime-section {
  display: flex;
  margin-bottom: 15px;
}
.booking-date,
.booking-time {
  display: flex;
  align-items: center;
  margin-right: 15px;
  font-size: 14px;
}
.booking-date i,
.booking-time i {
  margin-right: 8px;
  color: #6c757d;
}
.created-date {
  font-size: 12px;
  color: #6c757d;
  text-align: right;
}
@media (max-width: 768px) {
  .booking-card {
    padding: 15px;
  }
  .datetime-section {
    flex-direction: column;
  }
  .booking-date,
  .booking-time {
    margin-bottom: 8px;
  }
}
</style>