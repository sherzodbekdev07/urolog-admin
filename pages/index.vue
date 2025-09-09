<template>
    <div class="medical-dashboard">
        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
            <div class="spinner"></div>
            <p>Ma'lumotlar yuklanmoqda...</p>
        </div>

        <!-- Dashboard Content -->
        <div v-else class="dashboard-content">
            <!-- Header -->
            <div class="dashboard-header">
                <h1>Tibbiy Markaz Dashboard</h1>
                <div class="date-info">
                    <span>{{ currentDate }}</span>
                </div>
            </div>

            <!-- Main Stats Cards -->
            <div class="stats-grid">
                <div class="stat-card primary">
                    <div class="stat-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h3>{{ dashboardData?.general_stats?.total_doctors || 0 }}</h3>
                        <p>Jami shifokorlar</p>
                    </div>
                </div>

                <div class="stat-card success">
                    <div class="stat-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 9.5V12L21 14.5V12.5L19 11.5L21 9ZM3 9L9 7V9L5 11.5V12.5L3 14.5V9Z" />
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h3>{{ dashboardData?.general_stats?.total_patients || 0 }}</h3>
                        <p>Jami bemorlar</p>
                    </div>
                </div>

                <div class="stat-card warning">
                    <div class="stat-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H9V16H7V10ZM11 10H13V16H11V10ZM15 10H17V16H15V10Z" />
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h3>{{ dashboardData?.general_stats?.today_appointments || 0 }}</h3>
                        <p>Bugungi qabullar</p>
                    </div>
                </div>

                <div class="stat-card info">
                    <div class="stat-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" />
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h3>{{ dashboardData?.general_stats?.total_leads || 0 }}</h3>
                        <p>Yangi murojatlar</p>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="charts-section">
                <!-- Booking Trends Chart -->
                <div class="chart-container">
                    <h3>Haftalik Qabul Tendensiyasi</h3>
                    <div class="chart-wrapper">
                        <svg ref="weeklyChart" class="chart-svg"></svg>
                    </div>
                </div>

                <!-- Daily Bookings Chart -->
                <div class="chart-container">
                    <h3>Kunlik Qabullar</h3>
                    <div class="chart-wrapper">
                        <svg ref="dailyChart" class="chart-svg"></svg>
                    </div>
                </div>
            </div>

            <!-- Performance Metrics -->
            <div class="metrics-section">
                <div class="metric-card">
                    <h4>Davomat Ko'rsatkichi</h4>
                    <div class="metric-value success">
                        {{ dashboardData?.performance_metrics?.attendance_rate?.toFixed(1) || 0 }}%
                    </div>
                </div>

                <div class="metric-card">
                    <h4>Bekor Qilish Ko'rsatkichi</h4>
                    <div class="metric-value warning">
                        {{ dashboardData?.performance_metrics?.cancellation_rate?.toFixed(1) || 0 }}%
                    </div>
                </div>

                <div class="metric-card">
                    <h4>Oylik O'sish</h4>
                    <div class="metric-value"
                        :class="dashboardData?.performance_metrics?.monthly_growth?.bookings > 0 ? 'success' : 'danger'">
                        {{ dashboardData?.performance_metrics?.monthly_growth?.bookings?.toFixed(1) || 0 }}%
                    </div>
                </div>
            </div>

            <!-- Doctors Performance -->
            <div class="doctors-section">
                <h3>Shifokorlar Faoliyati</h3>
                <div class="doctors-grid">
                    <div v-for="doctor in dashboardData?.doctors_performance" :key="doctor.id" class="doctor-card">
                        <div class="doctor-header">
                            <div class="doctor-avatar">
                                <img v-if="doctorImages[doctor.id]" :src="doctorImages[doctor.id]" :alt="doctor.name_uz"
                                    class="doctor-img" />
                                <span v-else class="doctor-initials">{{ getInitials(doctor.name_uz) }}</span>
                            </div>
                            <div class="doctor-info">
                                <h4><nuxt-link :to="`/${doctor.id}`">{{ doctor.name_uz }}</nuxt-link></h4>
                                <p>{{ doctor.job_uz }}</p>
                                <span class="experience">{{ doctor.experience_years }} yil tajriba</span>
                            </div>
                        </div>
                        <div class="doctor-stats">
                            <div class="stat-item">
                                <span>Jami qabullar</span>
                                <strong>{{ doctor.total_bookings }}</strong>
                            </div>
                            <div class="stat-item">
                                <span>Bemorlar</span>
                                <strong>{{ doctor.patients_count }}</strong>
                            </div>
                            <div class="stat-item">
                                <span>Bu hafta</span>
                                <strong>{{ doctor.this_week_bookings }}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Popular Times -->
            <div class="times-section">
                <h3>Mashhur Qabul Vaqtlari</h3>
                <div class="times-chart">
                    <div v-for="time in dashboardData?.popular_booking_times" :key="time.hour" class="time-bar">
                        <div class="time-label">{{ time.hour }}:00</div>
                        <div class="bar-container">
                            <div class="bar" :style="{ width: (time.count / getMaxBookings() * 100) + '%' }"></div>
                            <span class="count">{{ time.count }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Leads Analytics -->
            <div class="leads-section">
                <h3>Murojatlar Tahlili</h3>
                <div class="leads-grid">
                    <div v-for="lead in dashboardData?.leads_analytics?.status_breakdown" :key="lead.status"
                        class="lead-card">
                        <div class="lead-count">{{ lead.count }}</div>
                        <div class="lead-status">{{ getStatusText(lead.status) }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const loading = ref(true)
const dashboardData = ref(null)
const doctorImages = ref({})
const currentDate = ref(
    new Date().toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
)

const weeklyChart = ref(null)
const dailyChart = ref(null)

const fetchDashboardData = async () => {
    try {
        const response = await fetch('https://web.dad-urolog.uz/api/dashboard/api/dashboard/analytics/')
        const data = await response.json()
        if (data.success) {
            dashboardData.value = data.data
            // Shifokorlar rasmlarini olish
            if (data.data.doctors_performance) {
                await fetchDoctorImages(data.data.doctors_performance)
            }
        }
    } catch (error) {
        console.error("Dashboard ma'lumotlarini olishda xatolik:", error)
    } finally {
        loading.value = false
    }
}

const fetchDoctorImages = async (doctors) => {
    const images = {}
    for (const doctor of doctors) {
        try {
            const response = await fetch(`https://web.dad-urolog.uz/api/dashboard/doctors/${doctor.id}/`)
            const data = await response.json()
            if (data.status && data.data && data.data.image) {
                images[doctor.id] = data.data.image
            }
        } catch (error) {
            console.error(`Shifokor ${doctor.id} rasmini olishda xatolik:`, error)
        }
    }
    doctorImages.value = images
}

const initializeCharts = () => {
    nextTick(() => {
        drawWeeklyChart()
        drawDailyChart()
    })
}

const drawWeeklyChart = () => {
    const svg = weeklyChart.value
    if (!svg || !dashboardData.value?.weekly_trends) return

    const data = dashboardData.value.weekly_trends
    if (data.length === 0) return

    const margin = { top: 20, right: 80, bottom: 40, left: 50 }
    const width = 500 - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

    svg.innerHTML = ''
    svg.setAttribute('width', width + margin.left + margin.right)
    svg.setAttribute('height', height + margin.top + margin.bottom)

    const maxValue = Math.max(...data.map(d => Math.max(d.total, d.completed, d.cancelled)))
    const xStep = width / (data.length - 1)

    // Grid lines
    for (let i = 0; i <= 5; i++) {
        const y = margin.top + (height / 5) * i
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1', margin.left)
        line.setAttribute('y1', y)
        line.setAttribute('x2', width + margin.left)
        line.setAttribute('y2', y)
        line.setAttribute('stroke', '#e5e7eb')
        line.setAttribute('stroke-width', '1')
        svg.appendChild(line)
    }

    // Draw lines
    const drawLine = (values, color, label) => {
        const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
        const points = values.map((value, index) => {
            const x = margin.left + xStep * index
            const y = margin.top + height - (value / maxValue) * height
            return `${x},${y}`
        }).join(' ')

        polyline.setAttribute('points', points)
        polyline.setAttribute('fill', 'none')
        polyline.setAttribute('stroke', color)
        polyline.setAttribute('stroke-width', '3')
        svg.appendChild(polyline)

        // Add circles for data points
        values.forEach((value, index) => {
            const x = margin.left + xStep * index
            const y = margin.top + height - (value / maxValue) * height
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
            circle.setAttribute('cx', x)
            circle.setAttribute('cy', y)
            circle.setAttribute('r', '4')
            circle.setAttribute('fill', color)
            svg.appendChild(circle)
        })
    }

    drawLine(data.map(d => d.total), '#3b82f6', 'Jami')
    drawLine(data.map(d => d.completed), '#10b981', 'Yakunlangan')
    drawLine(data.map(d => d.cancelled), '#ef4444', 'Bekor qilingan')

    // Labels
    data.forEach((item, index) => {
        const x = margin.left + xStep * index
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.setAttribute('x', x)
        text.setAttribute('y', height + margin.top + 20)
        text.setAttribute('text-anchor', 'middle')
        text.setAttribute('font-size', '12')
        text.setAttribute('fill', '#374151')
        text.textContent = item.week.split(' - ')[0].slice(5)
        svg.appendChild(text)
    })

    // Legend
    const legendData = [
        { color: '#3b82f6', label: 'Jami' },
        { color: '#10b981', label: 'Yakunlangan' },
        { color: '#ef4444', label: 'Bekor qilingan' }
    ]

    legendData.forEach((item, index) => {
        const x = width + margin.left - 70
        const y = margin.top + index * 20

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        rect.setAttribute('x', x)
        rect.setAttribute('y', y - 10)
        rect.setAttribute('width', '12')
        rect.setAttribute('height', '12')
        rect.setAttribute('fill', item.color)
        svg.appendChild(rect)

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.setAttribute('x', x + 16)
        text.setAttribute('y', y)
        text.setAttribute('font-size', '12')
        text.setAttribute('fill', '#374151')
        text.textContent = item.label
        svg.appendChild(text)
    })
}

const drawDailyChart = () => {
    const svg = dailyChart.value
    if (!svg || !dashboardData.value?.daily_bookings) return

    const data = dashboardData.value.daily_bookings
    if (data.length === 0) return

    const margin = { top: 20, right: 30, bottom: 40, left: 50 }
    const width = 500 - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

    svg.innerHTML = ''
    svg.setAttribute('width', width + margin.left + margin.right)
    svg.setAttribute('height', height + margin.top + margin.bottom)

    const maxValue = Math.max(...data.map(d => d.total))
    const barWidth = (width / data.length) * 0.8
    const barSpacing = (width / data.length) * 0.2

    // Grid lines
    for (let i = 0; i <= 5; i++) {
        const y = margin.top + (height / 5) * i
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1', margin.left)
        line.setAttribute('y1', y)
        line.setAttribute('x2', width + margin.left)
        line.setAttribute('y2', y)
        line.setAttribute('stroke', '#e5e7eb')
        line.setAttribute('stroke-width', '1')
        svg.appendChild(line)
    }

    // Draw bars
    data.forEach((item, index) => {
        const x = margin.left + (width / data.length) * index + barSpacing / 2
        const barHeight = (item.total / maxValue) * height
        const y = margin.top + height - barHeight

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        rect.setAttribute('x', x)
        rect.setAttribute('y', y)
        rect.setAttribute('width', barWidth)
        rect.setAttribute('height', barHeight)
        rect.setAttribute('fill', '#3b82f6')
        rect.setAttribute('rx', '4')
        svg.appendChild(rect)

        // Labels
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.setAttribute('x', x + barWidth / 2)
        text.setAttribute('y', height + margin.top + 20)
        text.setAttribute('text-anchor', 'middle')
        text.setAttribute('font-size', '11')
        text.setAttribute('fill', '#374151')
        text.textContent = new Date(item.date).toLocaleDateString('uz-UZ', {
            day: '2-digit',
            month: '2-digit'
        })
        svg.appendChild(text)
    })
}

const getInitials = (name) => {
    if (!name) return 'DR'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getMaxBookings = () => {
    const times = dashboardData.value?.popular_booking_times || []
    return Math.max(...times.map(t => t.count), 1)
}

const getStatusText = (status) => {
    const statusMap = {
        'new': 'Yangi',
        'contacted': 'Aloqada',
        'appt_set': 'Qabul belgilangan',
        'call_later': "Keyinroq qo'ng'iroq"
    }
    return statusMap[status] || status
}

onMounted(async () => {
    await fetchDashboardData()
    initializeCharts()
})
</script>


<style scoped>
</style>