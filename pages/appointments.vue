<template>
  <div class="dashboard">
    <div class="wrp">
      <!-- Header -->
      <div class="header">
        <h1 class="title">
          <i class="fas fa-calendar-check"></i>
          Booking Management
        </h1>
        <div class="controls">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Bemor yoki shifokor nomi..."
              class="search-input"
            />
          </div>
          <select v-model="statusFilter" class="filter-select">
            <option value="Barchasi">Barcha holatlar</option>
            <option value="Kutilmoqda">Kutilmoqda</option>
            <option value="Keldi">Keldi</option>
            <option value="Bekor qilindi">Bekor qilindi</option>
          </select>
          <select v-model="sortBy" class="filter-select">
            <option value="date">Sana bo'yicha</option>
            <option value="created_at">Yaratilgan vaqt</option>
            <option value="name">Bemor nomi</option>
            <option value="doctor_name">Shifokor nomi</option>
          </select>
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

      <!-- Error -->
      <div v-else-if="error" class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Ma'lumotlarni yuklashda xatolik yuz berdi!</p>
      </div>

      <!-- Todo List -->
      <div v-else class="todo-list">
        <TransitionGroup name="todo" tag="ul" class="list">
          <li
            v-for="booking in filteredBookings"
            :key="booking.id"
            class="todo-item"
            :class="getStatusClass(booking.status)"
          >
            <!-- Status indicator (bosilganda dropdown ochiladi) -->
            <div
              class="status-indicator"
              @click="toggleStatusDropdown(booking.id)"
            >
              <i :class="getStatusIcon(booking.status)"></i>
              <span>{{ booking.status }}</span>
            </div>

            <!-- Status dropdown (status indicatoriga bosilganda ochiladi) -->
            <div
              v-if="activeDropdownId === booking.id"
              class="status-dropdown"
            >
              <div
                v-for="status in statusOptions"
                :key="status.value"
                class="status-option"
                @click="updateBookingStatus(booking.id, status.value)"
              >
                <i :class="status.icon"></i>
                {{ status.label }}
              </div>
            </div>

            <!-- Booking info -->
            <div class="booking-info">
              <div class="patient-name">
                <i class="fas fa-user"></i>
                {{ booking.name }}
              </div>
              <div class="doctor-name">
                <i class="fas fa-user-md"></i>
                {{ booking.doctor_name }}
              </div>
              <div class="booking-time">
                <i class="fas fa-clock"></i>
                {{ formatDate(booking.date) }} | {{ formatTime(booking.date) }}
              </div>
              <div class="phone">
                <i class="fas fa-phone"></i>
                {{ booking.phone }}
              </div>
            </div>

            <!-- Updating indicator -->
            <div v-if="updatingIds.includes(booking.id)" class="updating">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
          </li>
        </TransitionGroup>
      </div>

      <!-- Empty state -->
      <div v-if="!pending && !error && filteredBookings.length === 0" class="empty-state">
        <i class="fas fa-calendar-times"></i>
        <h3>Hech qanday booking topilmadi</h3>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="page-btn"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-info">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
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

// Status options
const statusOptions = [
  { value: 'Kutilmoqda', label: 'Kutilmoqda', icon: 'fas fa-clock' },
  { value: 'Keldi', label: 'Keldi', icon: 'fas fa-check-circle' },
  { value: 'Bekor qilindi', label: 'Bekor qilindi', icon: 'fas fa-times-circle' },
]

// API Data
const { data: bookingsData, pending, error, refresh } = await useFetch(
  'https://web.dad-urolog.uz/api/dashboard/bookings/',
  {
    query: computed(() => ({
      page: currentPage.value,
      search: searchTerm.value,
      status: statusFilter.value === 'Barchasi' ? '' : statusFilter.value,
    })),
  }
)

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

  // Sort
  filtered.sort((a, b) => {
    let aVal = a[sortBy.value]
    let bVal = b[sortBy.value]

    if (sortBy.value.includes('date') || sortBy.value.includes('created_at')) {
      aVal = new Date(aVal).getTime()
      bVal = new Date(bVal).getTime()
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }

    return sortOrder.value === 'asc' ? aVal - bVal : bVal - aVal
  })

  return filtered
})

// Stats
const waitingCount = computed(() => bookings.value.filter(b => b.status === 'Kutilmoqda').length)
const completedCount = computed(() => bookings.value.filter(b => b.status === 'Keldi').length)
const cancelledCount = computed(() => bookings.value.filter(b => b.status === 'Bekor qilindi').length)

// Methods
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const getStatusClass = (status) => ({
  'status-waiting': status === 'Kutilmoqda',
  'status-completed': status === 'Keldi',
  'status-cancelled': status === 'Bekor qilindi',
})

const getStatusIcon = (status) => {
  const icons = {
    'Kutilmoqda': 'fas fa-clock',
    'Keldi': 'fas fa-check-circle',
    'Bekor qilindi': 'fas fa-times-circle',
  }
  return icons[status] || 'fas fa-question-circle'
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const toggleStatusDropdown = (bookingId) => {
  activeDropdownId.value = activeDropdownId.value === bookingId ? null : bookingId
}

const updateBookingStatus = async (bookingId, newStatus) => {
  try {
    updatingIds.value = [...updatingIds.value, bookingId]
    activeDropdownId.value = null

    await $fetch(`https://web.dad-urolog.uz/api/dashboard/bookings/${bookingId}/`, {
      method: 'PATCH',
      body: { status: newStatus },
    })

    // Update local data
    const index = bookings.value.findIndex(b => b.id === bookingId)
    if (index !== -1) {
      bookings.value[index].status = newStatus
    }
  } catch (err) {
    console.error('Status update error:', err)
  } finally {
    updatingIds.value = updatingIds.value.filter(id => id !== bookingId)
  }
}

// Watch for changes
watch([searchTerm, statusFilter], () => {
  currentPage.value = 1
})

// SEO
useHead({
  title: 'Booking Management',
  meta: [{ name: 'description', content: 'Medical appointment management' }],
})
</script>

<style scoped>
/* Base styles */
.dashboard {
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.wrp {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  font-size: 24px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title i {
  color: #007bff;
}

.controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-box {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 0 12px;
}

.search-input {
  border: none;
  background: transparent;
  padding: 8px 0;
  outline: none;
  width: 200px;
}

.filter-select, .sort-btn {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
}

/* Stats */
.stats {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  padding: 15px;
  border-radius: 10px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #6c757d;
}

.stat-card.waiting .stat-number {
  color: #ff9800;
}

.stat-card.completed .stat-number {
  color: #4caf50;
}

.stat-card.cancelled .stat-number {
  color: #f44336;
}

/* Todo list */
.todo-list {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 15px;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.todo-item {
  background: white;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  margin-bottom: 10px;
  cursor: pointer;
  width: fit-content;
}

.status-waiting .status-indicator {
  background-color: #ff9800;
}

.status-completed .status-indicator {
  background-color: #4caf50;
}

.status-cancelled .status-indicator {
  background-color: #f44336;
}

.status-indicator i {
  margin-right: 6px;
}

.status-dropdown {
  position: absolute;
  top: 45px;
  left: 15px;
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
  gap: 10px;
  transition: all 0.2s;
}

.status-option:hover {
  background: #f8f9fa;
}

.status-option i {
  color: #6c757d;
}

.booking-info {
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 6px;
  margin-top: 10px;
}

.patient-name, .doctor-name, .booking-time, .phone {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.patient-name {
  font-weight: 600;
  font-size: 16px;
}

.booking-info i {
  color: #6c757d;
  width: 16px;
}

.updating {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #007bff;
  border-radius: 8px;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.empty-state i {
  font-size: 40px;
  margin-bottom: 15px;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 15px;
}

.page-btn {
  background: #f8f9fa;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #6c757d;
}

/* Loading and error */
.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #6c757d;
}

.error i {
  font-size: 40px;
  margin-bottom: 15px;
  color: #f44336;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #007bff;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .search-input {
    width: 100%;
  }

  .stats {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
