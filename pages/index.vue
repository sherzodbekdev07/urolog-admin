<template>
    <div class="dashboard-container">
        <!-- HEADER -->
        <div class="header">
            <h1>Tibbiy Dashboard</h1>
            <div class="time-filter">
                <button :class="['filter-btn', { active: activeFilter === 'daily' }]" @click="setFilter('daily')">
                    Kunlik
                </button>
                <button :class="['filter-btn', { active: activeFilter === 'weekly' }]" @click="setFilter('weekly')">
                    Haftalik
                </button>
                <button :class="['filter-btn', { active: activeFilter === 'monthly' }]" @click="setFilter('monthly')">
                    Oylik
                </button>
            </div>
            <div class="user-info">
                <span>Xush kelibsiz, Dr. {{ topDoctor?.name_uz?.split(' ')[0] || 'Smith' }}</span>
                <div class="avatar">{{ getInitials(topDoctor?.name_uz) }}</div>
            </div>
        </div>

        <!-- LOADING STATE -->
        <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Dashboard ma'lumotlari yuklanmoqda...</p>
        </div>

        <!-- MAIN CONTENT -->
        <div v-else>
            <!-- STATS GRID -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Jami Bemorlar</h3>
                        <div class="stat-icon patients"><i class="fas fa-user-injured"></i></div>
                    </div>
                    <div class="stat-value">{{ getFilteredStats('patients') }}</div>
                    <div class="stat-desc">Faol bemorlar</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <h3>{{ activeFilter === 'daily' ? 'Bugungi' : activeFilter === 'weekly' ? 'Bu hafta' : 'Bu oy'
                        }} Qabullar</h3>
                        <div class="stat-icon success"><i class="fas fa-calendar-check"></i></div>
                    </div>
                    <div class="stat-value">{{ getFilteredStats('appointments') }}</div>
                    <div class="stat-desc">{{ getFilteredStats('completed') }} yakunlangan</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Yangi Mijozlar</h3>
                        <div class="stat-icon warning"><i class="fas fa-user-plus"></i></div>
                    </div>
                    <div class="stat-value">{{ getFilteredStats('leads') }}</div>
                    <div class="stat-desc">{{ activeFilter === 'daily' ? 'Bugungi' : activeFilter === 'weekly' ?
                        'Buhafta' : 'Bu oy' }} yangi mijozlar</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Davomat Foizi</h3>
                        <div class="stat-icon danger"><i class="fas fa-chart-line"></i></div>
                    </div>
                    <div class="stat-value">{{ apiData?.performance_metrics?.attendance_rate?.toFixed(1) || 0 }}%</div>
                    <div class="stat-desc">{{ getAttendanceStatus(apiData?.performance_metrics?.attendance_rate) }}
                    </div>
                </div>
            </div>

            <!-- CHARTS -->
            <div class="charts-container">
                <div class="chart-card">
                    <h3>Kunlik Qabullar Tendensiyasi</h3>
                    <VChart ref="trendsChart" class="chart" :option="dailyTrendsOption" v-if="isMounted && apiData" />
                </div>

                <div class="chart-card">
                    <h3>Qabullar Holati</h3>
                    <VChart ref="statusChart" class="chart" :option="bookingStatusOption"
                        v-if="isMounted && apiData && apiData.bookings_monthly" />
                </div>
            </div>

            <!-- DOCTORS PERFORMANCE -->
            <div class="doctors-section">
                <h2 class="section-title">👨‍⚕️ Shifokorlar — To-Do</h2>

                <div class="doctors-todo">
                    <!-- LEFT: doctors list -->
                    <aside class="doctors-sidebar">
                        <input v-model="doctorSearch" class="doc-search" placeholder="Shifokorni qidirish..." />

                        <div class="doc-list">
                            <div v-for="doc in filteredDoctors" :key="doc.id"
                                :class="['doc-item', { active: selectedDoctorId === doc.id }]"
                                @click="selectDoctor(doc.id)">
                                <div class="avatar-small">
                                    <img v-if="doc.image" :src="doc.image" alt="avatar" />
                                    <div v-else class="avatar-letters">{{ getInitials(doc.name_uz || doc.name) }}</div>
                                </div>

                                <div class="doc-info">
                                    <div class="doc-name">{{ doc.name_uz || doc.name }}</div>
                                    <div class="doc-job">{{ doc.job_uz || doc.job || '—' }}</div>
                                </div>

                                <div class="doc-actions">
                                    <span class="chev">›</span>
                                </div>
                            </div>

                            <div v-if="!filteredDoctors.length" class="no-docs">Shifokor topilmadi</div>
                        </div>
                    </aside>

                    <!-- RIGHT: selected doctor detail -->
                    <section class="doctor-detail">
                        <div v-if="loadingDoctorData" class="loading-small">
                            <div class="spinner-small"></div>
                            <p>Ma'lumot yuklanmoqda...</p>
                        </div>

                        <div v-else-if="doctorSpecificData" class="detail-card">
                            <div class="detail-top">
                                <div class="avatar-lg">
                                    <img v-if="doctorSpecificData.image" :src="doctorSpecificData.image" alt="avatar" />
                                    <div v-else class="avatar-letters-lg">{{ getInitials(doctorSpecificData.name_uz ||
                                        doctorSpecificData.name) }}</div>
                                </div>

                                <div class="meta">
                                    <h3>{{ doctorSpecificData.name_uz || doctorSpecificData.name }}</h3>
                                    <p class="job">{{ doctorSpecificData.job_uz || doctorSpecificData.job }}</p>
                                    <p class="clinic">{{ doctorSpecificData.doctor_clinic ||
                                        doctorSpecificData.doctor_address || '—' }}</p>
                                </div>
                            </div>

                            <div class="kpis">
                                <div class="kpi">
                                    <div class="kpi-value">{{ doctorSpecificData.patients || 0 }}</div>
                                    <div class="kpi-label">Bemorlar</div>
                                </div>
                                <div class="kpi">
                                    <div class="kpi-value">{{ doctorSpecificData.experience_years || '—' }}</div>
                                    <div class="kpi-label">Yil tajriba</div>
                                </div>
                                <div class="kpi">
                                    <div class="kpi-value">{{ (doctorSpecificData.certificates?.length) ||
                                        (doctorSpecificData.certification ? 1 : 0) }}</div>
                                    <div class="kpi-label">Sertifikatlar</div>
                                </div>
                            </div>

                            <div class="bio" v-if="doctorSpecificData.biography_uz"
                                v-html="doctorSpecificData.biography_uz"></div>

                            <div class="socials" v-if="doctorSpecificData.social_media?.length">
                                <h4>Ijtimoiy tarmoqlar</h4>
                                <div class="social-links">
                                    <a v-for="s in doctorSpecificData.social_media" :key="s.id" :href="s.link"
                                        target="_blank">{{ s.name }}</a>
                                </div>
                            </div>
                        </div>

                        <div v-else class="no-docs">Tanlangan shifokor ma'lumotlari mavjud emas</div>
                    </section>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue"
import { useEventBus } from "@vueuse/core"
import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { PieChart, LineChart, BarChart } from "echarts/charts"
import {
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent
} from "echarts/components"
import VChart from "vue-echarts"

// ECharts setup
use([
    CanvasRenderer,
    PieChart,
    LineChart,
    BarChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent
])

// Reactive data
const isMounted = ref(false)
const loading = ref(true)
const loadingDoctorData = ref(false)
const activeFilter = ref("daily")
const apiData = ref(null)
const doctorSpecificData = ref(null)
const selectedDoctorId = ref(1) // Default doctor ID
const trendsChart = ref(null)
const statusChart = ref(null)

// API URLs
const API_URL = "https://web.dad-urolog.uz/api/dashboard/analytics/"
// const DOCTOR_API_URL = "https://web.dad-urolog.uz/api/dashboard/doctor/"

// Event bus for sidebar
const bus = useEventBus("sidebar")
bus.on(() => {
    resizeCharts()
})

// Methods
const resizeCharts = () => {
    trendsChart.value?.chart?.resize()
    statusChart.value?.chart?.resize()
}

const fetchDashboardData = async () => {
    try {
        loading.value = true
        const response = await fetch(API_URL)
        const result = await response.json()

        if (result.success) {
            apiData.value = result.data
        } else {
            console.error("API xatolik qaytardi:", result)
            // Fallback data
            apiData.value = getSampleData()
        }
    } catch (error) {
        console.error("Dashboard ma'lumotlarini olishda xatolik:", error)
        apiData.value = getSampleData()
    } finally {
        loading.value = false
    }
}

const setFilter = (filter) => {
    activeFilter.value = filter
}

const getFilteredStats = (type) => {
    if (!apiData.value) return 0

    const stats = apiData.value.general_stats

    switch (type) {
        case 'patients':
            if (activeFilter.value === 'daily') return stats.new_patients_this_month || 0
            if (activeFilter.value === 'weekly') return Math.floor(stats.total_patients * 0.1) || 0
            return stats.total_patients || 0

        case 'appointments':
            if (activeFilter.value === 'daily') return stats.today_appointments || 0
            if (activeFilter.value === 'weekly') return (stats.today_appointments || 0) * 7
            return apiData.value.bookings_monthly?.total_bookings || 0

        case 'completed':
            if (activeFilter.value === 'daily') return stats.today_completed || 0
            if (activeFilter.value === 'weekly') return (stats.today_completed || 0) * 7
            return apiData.value.bookings_monthly?.completed_bookings || 0

        case 'leads':
            if (activeFilter.value === 'daily') return stats.new_leads_today || 0
            if (activeFilter.value === 'weekly') return (stats.new_leads_today || 0) * 7
            return stats.total_leads || 0

        default:
            return 0
    }
}

const getSampleData = () => ({
    "general_stats": {
        "total_doctors": 4,
        "active_doctors": 4,
        "total_patients": 709,
        "active_patients": 709,
        "new_patients_this_month": 709,
        "today_appointments": 5,
        "today_completed": 2,
        "today_pending": 0,
        "today_cancelled": 3,
        "total_leads": 14,
        "new_leads_today": 7,
        "converted_leads": 0
    },
    "bookings_monthly": {
        "total_bookings": 38,
        "completed_bookings": 9,
        "cancelled_bookings": 14,
        "pending_bookings": 15
    },
    "doctors_performance": [
        {
            "id": 1,
            "name_uz": "Kuziyev Azizjon Davlatovich",
            "job_uz": "Urolog-androlog",
            "experience_years": 10,
            "total_bookings": 966,
            "completed_bookings": 127,
            "pending_bookings": 744,
            "cancelled_bookings": 95,
            "patients_count": 709,
            "this_week_bookings": 10
        },
        {
            "id": 2,
            "name_uz": "Dautov Davron Davlatgeldiyevich",
            "job_uz": "Urolog-Androlog",
            "experience_years": 4,
            "total_bookings": 0,
            "completed_bookings": 0,
            "pending_bookings": 0,
            "cancelled_bookings": 0,
            "patients_count": 0,
            "this_week_bookings": 0
        }
    ],
    "daily_bookings": [
        { "date": "2025-09-08", "day_name": "Dushanba", "total": 5, "completed": 2, "pending": 0, "cancelled": 3 },
        { "date": "2025-09-07", "day_name": "Yakshanba", "total": 1, "completed": 0, "pending": 1, "cancelled": 0 },
        { "date": "2025-09-06", "day_name": "Shanba", "total": 11, "completed": 5, "pending": 1, "cancelled": 5 },
        { "date": "2025-09-05", "day_name": "Juma", "total": 2, "completed": 0, "pending": 1, "cancelled": 1 },
        { "date": "2025-09-04", "day_name": "Payshanba", "total": 3, "completed": 0, "pending": 3, "cancelled": 0 },
        { "date": "2025-09-03", "day_name": "Chorshanba", "total": 2, "completed": 0, "pending": 0, "cancelled": 2 },
        { "date": "2025-09-02", "day_name": "Seshanba", "total": 5, "completed": 2, "pending": 0, "cancelled": 3 }
    ],
    "popular_booking_times": [
        { "hour": 10, "count": 10 },
        { "hour": 9, "count": 6 },
        { "hour": 14, "count": 5 }
    ],
    "leads_analytics": {
        "conversion_funnel": {
            "new_leads": 10,
            "contacted": 2,
            "qualified": 0,
            "appointment_set": 1,
            "converted": 0
        }
    },
    "performance_metrics": {
        "attendance_rate": 23.68,
        "cancellation_rate": 36.84
    }
})

const getInitials = (name) => {
    if (!name) return "DS"
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const getAttendanceStatus = (rate) => {
    if (!rate) return "Ma'lumot yo'q"
    if (rate >= 80) return "A'lo"
    if (rate >= 60) return "Yaxshi"
    if (rate >= 40) return "Yaxshilanishi kerak"
    return "Jiddiy"
}

const formatHour = (hour) => {
    return `${hour}:00`
}

const getBarWidth = (count, timeSlots) => {
    if (!timeSlots || timeSlots.length === 0) return 0
    const maxCount = Math.max(...timeSlots.map(t => t.count))
    return maxCount > 0 ? (count / maxCount) * 100 : 0
}

// Computed properties
const topDoctor = computed(() => {
    if (!apiData.value?.doctors_performance) return null
    return apiData.value.doctors_performance.find(d => d.total_bookings > 0) ||
        apiData.value.doctors_performance[0]
})

const selectedDoctorData = computed(() => {
    if (!apiData.value?.doctors_performance) return null
    return apiData.value.doctors_performance.find(d => d.id === selectedDoctorId.value)
})

const dailyTrendsOption = computed(() => {
    if (!apiData.value?.daily_bookings) return {}

    const days = apiData.value.daily_bookings.map(d => d.day_name)
    const totals = apiData.value.daily_bookings.map(d => d.total)
    const completed = apiData.value.daily_bookings.map(d => d.completed)
    const cancelled = apiData.value.daily_bookings.map(d => d.cancelled)

    return {
        tooltip: {
            trigger: "axis",
            formatter: function (params) {
                let result = `<strong>${params[0].axisValue}</strong><br/>`
                params.forEach(param => {
                    result += `${param.seriesName}: ${param.value}<br/>`
                })
                return result
            }
        },
        legend: {
            data: ["Jami", "Yakunlangan", "Bekor qilingan"],
            bottom: 10
        },
        grid: {
            left: "3%",
            right: "4%",
            bottom: "15%",
            top: "10%",
            containLabel: true
        },
        xAxis: {
            type: "category",
            data: days,
            axisLabel: {
                rotate: 45,
                fontSize: 12
            }
        },
        yAxis: {
            type: "value",
            axisLabel: {
                fontSize: 12
            }
        },
        series: [
            {
                name: "Jami",
                type: "line",
                smooth: true,
                data: totals,
                lineStyle: { width: 4, color: "#4361ee" },
                itemStyle: { color: "#4361ee", borderWidth: 2 },
                symbol: 'circle',
                symbolSize: 8
            },
            {
                name: "Yakunlangan",
                type: "line",
                smooth: true,
                data: completed,
                lineStyle: { width: 4, color: "#06d6a0" },
                itemStyle: { color: "#06d6a0", borderWidth: 2 },
                symbol: 'circle',
                symbolSize: 8
            },
            {
                name: "Bekor qilingan",
                type: "line",
                smooth: true,
                data: cancelled,
                lineStyle: { width: 4, color: "#f72585" },
                itemStyle: { color: "#f72585", borderWidth: 2 },
                symbol: 'circle',
                symbolSize: 8
            }
        ]
    }
})

const bookingStatusOption = computed(() => {
    if (!apiData.value?.bookings_monthly) return {}

    const data = apiData.value.bookings_monthly
    const total = data.total_bookings || 1 // Avoid division by zero

    return {
        tooltip: {
            trigger: "item",
            formatter: function (params) {
                const percentage = ((params.value / total) * 100).toFixed(1)
                return `${params.name}: ${params.value} (${percentage}%)`
            }
        },
        legend: {
            top: "5%",
            left: "center",
            textStyle: {
                fontSize: 12
            }
        },
        series: [{
            name: "Qabullar Holati",
            type: "pie",
            radius: ["35%", "65%"],
            center: ['50%', '55%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 8,
                borderColor: "#fff",
                borderWidth: 3
            },
            label: {
                show: true,
                position: "outside",
                formatter: '{b}: {c}',
                fontSize: 11,
                fontWeight: 'bold'
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: 14,
                    fontWeight: "bold"
                },
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            },
            labelLine: {
                show: true,
                length: 15,
                length2: 10
            },
            data: [
                { value: data.completed_bookings || 0, name: "Yakunlangan" },
                { value: data.pending_bookings || 0, name: "Kutilmoqda" },
                { value: data.cancelled_bookings || 0, name: "Bekor qilingan" }
            ],
            color: ["#06d6a0", "#4cc9f0", "#f72585"]
        }]
    }
})



const DOCTOR_API_URL = "https://web.dad-urolog.uz/api/dashboard/doctors/"

// 2) doctors ro'yxati va qidiruv
const doctorsList = ref([])
const doctorSearch = ref('')
const filteredDoctors = computed(() => {
    const q = doctorSearch.value.trim().toLowerCase()
    if (!q) return doctorsList.value
    return doctorsList.value.filter(d => ((d.name_uz || d.name || '').toLowerCase().includes(q)))
})

// 3) yangilangan fetchDoctorData — plural endpoint ishlatadi
const fetchDoctorData = async (doctorId) => {
    try {
        loadingDoctorData.value = true
        const response = await fetch(`${DOCTOR_API_URL}${doctorId}/`)
        const result = await response.json()
        if (result.status || result.success) {
            doctorSpecificData.value = result.data
        } else {
            console.error("Shifokor ma'lumotlari xatolik:", result)
            doctorSpecificData.value = null
        }
    } catch (error) {
        console.error("Shifokor ma'lumotlarini olishda xatolik:", error)
        doctorSpecificData.value = null
    } finally {
        loadingDoctorData.value = false
    }
}

// 4) doctors ro'yxatini olish
const fetchDoctorsList = async () => {
    try {
        const response = await fetch(DOCTOR_API_URL)
        const result = await response.json()
        if (result.status || result.success) {
            // ba'zan paginated bo'lishi mumkin: result.data.results
            doctorsList.value = result.data?.results ?? result.data ?? []
        } else {
            console.error("Doctorlar ro'yxati xatolik:", result)
            doctorsList.value = []
        }
    } catch (error) {
        console.error("Doctorlar ro'yxatini olishda xatolik:", error)
        doctorsList.value = []
    }
}

// 5) selectDoctor — mavjud selectDoctor funksiyangizni shu tarzda ishlatishingiz mumkin
const selectDoctor = async (doctorId) => {
    selectedDoctorId.value = doctorId
    await fetchDoctorData(doctorId)
}

// 6) onMounted — doctors ro'yxatini ham yuklab olamiz
onMounted(async () => {
    await fetchDashboardData()
    await fetchDoctorsList()
    // default id mavjud bo'lsa uni yukla, aks holda ro'yxatdagi birinchisini yukla
    const initialId = selectedDoctorId.value || (doctorsList.value[0]?.id ?? 1)
    await fetchDoctorData(initialId)
    isMounted.value = true
})

onMounted(async () => {
    await fetchDoctorsList()
    await selectDoctor(1) // default 1-chi doctor
})

// Lifecycle
onMounted(async () => {
    await fetchDoctorsList()
    await selectDoctor(1) // default id=1
})

// Lifecycle
onMounted(async () => {
    await fetchDashboardData()
    await fetchDoctorData(selectedDoctorId.value) // Load default doctor data
    isMounted.value = true
})

// Watch for filter changes
watch(activeFilter, () => {
    // Trigger chart updates when filter changes
    setTimeout(() => {
        resizeCharts()
    }, 100)
})
</script>
<style scoped>
.doctors-section {
    margin-top: 28px;
}

.section-title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 12px;
}

.doctors-todo {
    display: flex;
    gap: 20px;
    align-items: flex-start;
}

.doctors-sidebar {
    width: 320px;
    background: #fff;
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 6px 20px rgba(30, 40, 60, 0.06);
}

.doc-search {
    width: 100%;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #eef2ff;
    margin-bottom: 10px;
}

.doc-list {
    max-height: 520px;
    overflow-y: auto;
}

.doc-item {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 10px;
    border-radius: 10px;
    cursor: pointer;
    transition: background .12s, transform .08s;
}

.doc-item:hover {
    background: #f7fbff;
    transform: translateY(-1px);
}

.doc-item.active {
    background: #e8f0ff;
    box-shadow: inset 0 1px 0 rgba(0, 0, 0, 0.02);
    font-weight: 600;
}

.avatar-small {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f2f6ff;
    font-weight: 700;
    color: #2b4bd6;
}

.avatar-small img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-letters {
    font-size: 14px;
}

.doc-info {
    flex: 1;
}

.doc-name {
    font-weight: 600;
}

.doc-job {
    color: #667085;
    font-size: 13px;
    margin-top: 2px;
}

.doctor-detail {
    flex: 1;
    min-width: 0;
}

.detail-card {
    background: #fff;
    border-radius: 12px;
    padding: 18px;
    box-shadow: 0 8px 30px rgba(30, 40, 60, 0.05);
}

.detail-top {
    display: flex;
    gap: 18px;
    align-items: center;
}

.avatar-lg {
    width: 88px;
    height: 88px;
    border-radius: 12px;
    overflow: hidden;
    background: #f2f6ff;
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar-lg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.head-meta h3 {
    margin: 0;
    font-size: 18px;
}

.job {
    color: #3b82f6;
    font-weight: 600;
    margin-top: 6px;
}

.clinic {
    color: #667085;
    margin-top: 6px;
}

.kpis {
    display: flex;
    gap: 12px;
    margin-top: 14px;
}

.kpi {
    background: #f8fbff;
    border-radius: 10px;
    padding: 12px;
    min-width: 100px;
    text-align: center;
}

.kpi-value {
    font-size: 18px;
    font-weight: 700;
}

.kpi-label {
    color: #6b7280;
    font-size: 12px;
}

.bio {
    margin-top: 14px;
    color: #374151;
    line-height: 1.5;
    max-height: 260px;
    overflow: auto;
}

.social-links {
    margin-top: 12px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.social-links a {
    padding: 6px 10px;
    border-radius: 8px;
    text-decoration: none;
    background: #eef2ff;
    color: #2b4bd6;
    font-weight: 600;
    font-size: 13px;
}

.no-docs {
    padding: 16px;
    color: #9ca3af;
    text-align: center;
}

.loading-small {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 20px;
}

.spinner-small {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 4px solid #e6eefc;
    border-top-color: #4f46e5;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>