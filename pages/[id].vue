<template>
  <div class="doctor-dashboard">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="medical-loader">
        <div class="pulse-circle"></div>
        <div class="heartbeat-line"></div>
      </div>
      <p>Shifokor ma'lumotlari yuklanmoqda...</p>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="dashboard-content">
      <!-- Doctor Profile Header -->
      <div class="doctor-profile-header">
        <div class="doctor-avatar-section">
          <div class="doctor-avatar">
            <div class="avatar-circle">
              <img v-if="doctorImage" :src="doctorImage" alt="Doctor image" class="doctor-img" />
              <span v-else class="doctor-initials">{{ getDoctorInitials() }}</span>
            </div>
            <div class="status-indicator active"></div>
          </div>

          <div class="doctor-info">
            <h1 class="doctor-name">{{ doctorData?.doctor_info?.name }}</h1>
            <p class="doctor-specialty">{{ doctorData?.doctor_info?.job }}</p>
            <div class="doctor-details">
              <span class="experience-badge">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {{ doctorData?.doctor_info?.experience_years }} yil tajriba
              </span>
              <span class="clinic-info">{{ doctorData?.doctor_info?.clinic }}</span>
            </div>
          </div>
        </div>

        <div class="contact-section">
          <div class="contact-card">
            <svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
            <span>{{ doctorData?.doctor_info?.phone }}</span>
          </div>
          <div class="patient-count">
            <span class="count">{{ doctorData?.doctor_info?.total_patients?.toLocaleString() }}</span>
            <span class="label">Jami bemorlar</span>
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-section">
        <div v-for="stat in statsList" :key="stat.type" class="stat-card" :class="stat.type">
          <div class="stat-icon" v-html="stat.icon"></div>
          <div class="stat-content">
            <h3 class="stat-number">{{ stat.value }}</h3>
            <p class="stat-label">{{ stat.label }}</p>
            <div class="stat-progress">
              <div class="progress-bar" :style="{ width: stat.progress + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Schedule and Today's Appointments -->
      <div class="main-content-grid">
        <!-- Weekly Schedule -->
        <div class="schedule-section">
          <div class="section-header">
            <h3>Ish Jadvali</h3>
          </div>
          <div class="schedule-grid">
            <div v-for="(schedule, index) in formattedSchedule" :key="index" class="schedule-day"
              :class="{ active: schedule.isToday }">
              <div class="day-header">
                <span class="day-name">{{ schedule.dayName }}</span>
                <span v-if="schedule.isToday" class="today-badge">Bugun</span>
              </div>

              <div v-if="schedule.isWorking" class="working-hours">
                <div class="time-slot">
                  <span>{{ schedule.startTime }} - {{ schedule.endTime }}</span>
                </div>
                <div class="duration-info">
                  <span>{{ schedule.duration }} daqiqa/bemor</span>
                </div>
              </div>

              <div v-else class="rest-day">
                <span>Dam olish kuni</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Today's Appointments -->
        <div class="appointments-section">
          <div class="section-header">
            <h3>Yaqin Qabullar ({{ doctorData?.recent_bookings?.length || 0 }})</h3>
          </div>

          <div class="appointments-list">
            <div v-for="appointment in doctorData?.recent_bookings" :key="appointment.id" class="appointment-card"
              :class="getAppointmentClass(appointment.status)">
              <div class="appointment-time">
                <span>{{ formatTime(appointment.date) }}</span>
              </div>
              <div class="patient-info">
                <h4>{{ appointment.name }}</h4>
                <p>{{ appointment.phone }}</p>
                <span>{{ formatDate(appointment.date) }}</span>
              </div>
              <div class="status-badge" :class="getStatusClass(appointment.status)">
                {{ getStatusText(appointment.status) }}
              </div>
            </div>
          </div>
        </div>

        <div class="appointments-section">
          <div class="section-header">
            <h3>Bugungi Qabullar ({{ doctorData?.today_bookings?.count || 0 }})</h3>
          </div>

          <div class="appointments-list">
            <div v-for="appointment in doctorData?.today_bookings?.items" :key="appointment.id" class="appointment-card"
              :class="getAppointmentClass(appointment.status)">
              <div class="appointment-time">
                <span>{{ formatTime(appointment.date) }}</span>
              </div>
              <div class="patient-info">
                <h4>{{ appointment.name }}</h4>
                <p>{{ appointment.phone }}</p>
              </div>
              <div class="status-badge" :class="getStatusClass(appointment.status)">
                {{ getStatusText(appointment.status) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const doctorId = ref(route.params.id)

const loading = ref(true)
const doctorData = ref(null)
const doctorImage = ref(null)

// Fetch doctor data from API
const fetchDoctorData = async () => {
  try {
    const res = await fetch(`https://web.dad-urolog.uz/api/dashboard/api/dashboard/doctor/${doctorId.value}/`)
    const data = await res.json()
    if (data.success) {
      doctorData.value = data.data
    }
  } catch (err) {
    console.error('Shifokor ma\'lumotlarini olishda xatolik:', err)
  }
}

// Fetch doctor image separately
const fetchDoctorImage = async () => {
  try {
    const res = await fetch(`https://web.dad-urolog.uz/api/dashboard/doctors/${doctorId.value}/`)
    const data = await res.json()

    if (data.status && data.data.image) {
      doctorImage.value = data.data.image
    } else {
      doctorImage.value = null
    }
  } catch (err) {
    console.error('Shifokor rasmini olishda xatolik:', err)
    doctorImage.value = null
  }
}

// Initialize data loading
const initializeData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchDoctorData(),
      fetchDoctorImage()
    ])
  } finally {
    loading.value = false
  }
}

// Compute formatted schedule
const formattedSchedule = computed(() => {
  if (!doctorData.value?.schedule) return []

  const weekDays = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
  const today = new Date().getDay()

  return Array.from({ length: 7 }, (_, index) => {
    const schedule = doctorData.value.schedule.find(s => s.weekday === index)
    return {
      dayName: weekDays[index],
      isToday: index === today,
      isWorking: !!schedule,
      startTime: schedule?.start_time.slice(0, 5) || null,
      endTime: schedule?.end_time.slice(0, 5) || null,
      duration: schedule?.duration_minutes || null
    }
  })
})

// Statistics computed
const statsList = computed(() => [
  {
    type: 'completed',
    label: "Yakunlangan qabullar",
    value: doctorData.value?.bookings_stats?.completed || 0,
    progress: getProgressWidth('completed'),
    icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
  },
  {
    type: 'pending',
    label: "Kutilayotgan qabullar",
    value: doctorData.value?.bookings_stats?.pending || 0,
    progress: getProgressWidth('pending'),
    icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/></svg>'
  },
  {
    type: 'cancelled',
    label: "Bekor qilingan",
    value: doctorData.value?.bookings_stats?.cancelled || 0,
    progress: getProgressWidth('cancelled'),
    icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
  }
])

// Methods
const getDoctorInitials = () => {
  if (!doctorData.value?.doctor_info?.name) return 'DR'
  return doctorData.value.doctor_info.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
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
  return new Date(dateString).toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getProgressWidth = (type) => {
  const total = doctorData.value?.bookings_stats?.total || 1
  const value = doctorData.value?.bookings_stats?.[type] || 0
  return Math.min((value / total) * 100, 100)
}

const getAppointmentClass = (status) => ({
  completed: status === 'Keldi',
  pending: status === 'Kutilmoqda',
  cancelled: status === 'Bekor qilindi'
})

const getStatusClass = (status) => {
  const statusMap = {
    'Keldi': 'status-completed',
    'Kutilmoqda': 'status-pending',
    'Bekor qilindi': 'status-cancelled'
  }
  return statusMap[status] || 'status-default'
}

const getStatusText = (status) => status || 'Noma\'lum'

// Image error handling
const handleImageError = (event) => {
  console.error('Image failed to load:', event)
  doctorImage.value = null
}

const handleImageLoad = (event) => {
  console.log('Image loaded successfully:', event.target.src)
}

onMounted(() => {
  initializeData()
})
</script>

<style scoped>
.doctor-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 20px;
  width: 100%;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: white;
  font-size: 18px;
}

.medical-loader {
  position: relative;
  width: 100px;
  height: 60px;
  margin-bottom: 30px;
}

.pulse-circle {
  width: 20px;
  height: 20px;
  background: #ff4757;
  border-radius: 50%;
  position: absolute;
  top: 20px;
  left: 10px;
  animation: heartbeat 1.2s infinite;
}

.heartbeat-line {
  width: 80px;
  height: 2px;
  background: white;
  position: absolute;
  top: 29px;
  left: 30px;
  animation: pulse-line 1.2s infinite;
}

@keyframes heartbeat {

  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.3);
    opacity: 0.7;
  }
}

@keyframes pulse-line {

  0%,
  100% {
    transform: scaleX(1);
    opacity: 1;
  }

  50% {
    transform: scaleX(1.2);
    opacity: 0.8;
  }
}

.dashboard-content {
  max-width: 1400px;
  margin: 0 auto;
}

.doctor-profile-header {
  background: rgba(255, 255, 255, 0.95);
  padding: 30px;
  border-radius: 20px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: slideInDown 0.6s ease;
}

@keyframes slideInDown {
  from {
    transform: translateY(-30px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.doctor-avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.doctor-avatar {
  position: relative;
}

.avatar-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.8rem;
  font-weight: 700;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.doctor-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid white;
}

.status-indicator.active {
  background: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.doctor-info h1 {
  margin: 0 0 8px 0;
  color: #2d3748;
  font-size: 2rem;
  font-weight: 700;
}

.doctor-specialty {
  color: #4a5568;
  font-size: 1.1rem;
  margin: 0 0 15px 0;
  font-weight: 500;
}

.doctor-details {
  display: flex;
  gap: 15px;
  align-items: center;
}

.experience-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.experience-badge svg {
  width: 16px;
  height: 16px;
}

.clinic-info {
  color: #718096;
  font-size: 0.95rem;
  font-style: italic;
}

.contact-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: flex-end;
}

.contact-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f7fafc;
  padding: 10px 15px;
  border-radius: 12px;
  color: #4a5568;
  font-weight: 500;
}

.contact-icon {
  width: 20px;
  height: 20px;
  color: #667eea;
}

.patient-count {
  text-align: right;
}

.patient-count .count {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
  line-height: 1;
}

.patient-count .label {
  color: #718096;
  font-size: 0.9rem;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 25px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease;
  animation-fill-mode: backwards;
}

.stat-card:nth-child(1) {
  animation-delay: 0.1s;
}

.stat-card:nth-child(2) {
  animation-delay: 0.2s;
}

.stat-card:nth-child(3) {
  animation-delay: 0.3s;
}

.stat-card:nth-child(4) {
  animation-delay: 0.4s;
}

@keyframes fadeInUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
}

.stat-card.completed .stat-icon {
  background: linear-gradient(135deg, #10b981, #059669);
}

.stat-card.pending .stat-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.stat-card.cancelled .stat-icon {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.stat-card.month .stat-icon {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  margin: 0 0 5px 0;
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
}

.stat-label {
  margin: 0 0 15px 0;
  color: #718096;
  font-size: 0.9rem;
  font-weight: 500;
}

.stat-progress {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--progress-color, #667eea), var(--progress-color-end, #764ba2));
  border-radius: 3px;
  transition: width 1s ease;
}

.stat-card.completed .progress-bar {
  --progress-color: #10b981;
  --progress-color-end: #059669;
}

.stat-card.pending .progress-bar {
  --progress-color: #f59e0b;
  --progress-color-end: #d97706;
}

.stat-card.cancelled .progress-bar {
  --progress-color: #ef4444;
  --progress-color-end: #dc2626;
}

.main-content-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  margin-bottom: 40px;
}

.schedule-section,
.appointments-section {
  background: rgba(255, 255, 255, 0.95);
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: slideInLeft 0.8s ease;
  height: 100%;
}

.appointments-section {
  animation: slideInRight 0.8s ease;
}

@keyframes slideInLeft {
  from {
    transform: translateX(-50px);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(50px);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e2e8f0;
}

.section-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 1.3rem;
  font-weight: 600;
}

.header-icon {
  width: 24px;
  height: 24px;
  color: #667eea;
}

.schedule-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.schedule-day {
  padding: 15px;
  border-radius: 12px;
  background: #f8fafc;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.schedule-day.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-color: #667eea;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.day-name {
  font-weight: 600;
  color: #2d3748;
  font-size: 0.95rem;
}

.today-badge {
  background: #667eea;
  color: white;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
}

.working-hours {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.time-slot {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4a5568;
  font-size: 0.9rem;
  font-weight: 500;
}

.time-icon {
  width: 16px;
  height: 16px;
  color: #667eea;
}

.duration-info {
  color: #718096;
  font-size: 0.8rem;
  padding-left: 24px;
}

.rest-day {
  color: #a0aec0;
  font-style: italic;
  text-align: center;
  padding: 10px 0;
}

.appointments-list {
  /* max-height: 400px; */
  overflow-y: auto;
  padding-right: 5px;
}

.appointment-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 12px;
  background: #f8fafc;
  border-left: 4px solid #e2e8f0;
  transition: all 0.3s ease;
  animation: fadeIn 0.5s ease;
  animation-fill-mode: backwards;
}

.appointment-card:nth-child(1) {
  animation-delay: 0.1s;
}

.appointment-card:nth-child(2) {
  animation-delay: 0.2s;
}

.appointment-card:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.appointment-card.completed {
  border-left-color: #10b981;
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.05), transparent);
}

.appointment-card.pending {
  border-left-color: #f59e0b;
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.05), transparent);
}

.appointment-card.cancelled {
  border-left-color: #ef4444;
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.05), transparent);
}

.appointment-card:hover {
  transform: translateX(5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.appointment-time {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
}

.patient-info h4 {
  margin: 0 0 5px 0;
  color: #2d3748;
  font-size: 1rem;
  font-weight: 600;
}

.patient-info p {
  margin: 0;
  color: #718096;
  font-size: 0.85rem;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.status-completed {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.status-badge.status-pending {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.status-badge.status-cancelled {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.no-appointments {
  text-align: center;
  padding: 40px 20px;
  color: #a0aec0;
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 15px;
  opacity: 0.5;
}

.recent-bookings-section {
  background: rgba(255, 255, 255, 0.95);
  padding: 25px;
  border-radius: 16px;
  margin-bottom: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: fadeInUp 1s ease;
}

.bookings-table {
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1.2fr 1fr;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.header-cell {
  padding: 15px;
  text-align: left;
}

.table-body {
  background: white;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1.2fr 1fr;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.3s ease;
  animation: slideInUp 0.6s ease;
  animation-fill-mode: backwards;
}

@keyframes slideInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.table-row:hover {
  background: #f8fafc;
  transform: scale(1.01);
}

.table-cell {
  padding: 15px;
  display: flex;
  align-items: center;
}

.patient-cell {
  gap: 12px;
}

.patient-avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  flex-shrink: 0;
}

.phone-cell {
  color: #4a5568;
  font-family: monospace;
}

.date-cell {
  color: #718096;
  font-size: 0.9rem;
}

.status-tag {
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.performance-section {
  background: rgba(255, 255, 255, 0.95);
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: fadeInUp 1.2s ease;
}

.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.performance-chart {
  max-width: 100%;
  height: 300px;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .main-content-grid {
    grid-template-columns: 1fr;
  }

  .doctor-profile-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .contact-section {
    align-items: center;
  }
}

@media (max-width: 768px) {
  .doctor-dashboard {
    padding: 15px;
  }

  .stats-section {
    grid-template-columns: 1fr;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .table-cell {
    padding: 10px;
    border-bottom: 1px solid #f1f5f9;
  }

  .header-cell {
    display: none;
  }

  .table-cell:before {
    content: attr(data-label);
    font-weight: 600;
    color: #4a5568;
    margin-right: 10px;
    min-width: 100px;
    display: inline-block;
  }

  .doctor-profile-header {
    padding: 20px;
  }

  .doctor-avatar-section {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .appointment-card {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }

  .schedule-day {
    padding: 12px;
  }

  .stat-card {
    padding: 20px;
  }

  .chart-container {
    min-height: 250px;
  }

  .performance-chart {
    height: 250px;
  }
}

/* Scroll Styles */
.appointments-list::-webkit-scrollbar {
  width: 6px;
}

.appointments-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.appointments-list::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.appointments-list::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* Custom animations for better UX */
.stat-card,
.appointment-card,
.table-row {
  will-change: transform;
}

.stat-progress .progress-bar {
  animation: progressFill 2s ease 0.5s both;
}

@keyframes progressFill {
  from {
    width: 0;
  }

  to {
    width: var(--final-width, 100%);
  }
}
</style>