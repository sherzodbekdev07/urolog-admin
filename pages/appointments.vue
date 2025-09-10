<template>
  <div class="bookings-page">
    <div class="header">
      <h2>Bronlar</h2>
      <div class="header-actions">
        <div class="bookings-count" v-if="!loading">
          <span>Jami: {{ totalBookings }} ta bron</span>
        </div>
        <button class="add-btn" @click="newBookingOP = true">
          <i class="fas fa-plus"></i>
          Qo'shish
        </button>
      </div>
    </div>

    <!-- Qidiruv va Filterlar -->
    <div class="search-controls">
      <div class="search-input-wrapper">
        <i class="fas fa-search search-icon"></i>
        <input
          v-model="searchFilters.search"
          type="text"
          placeholder="Ism, telefon, ID yoki matn bo'yicha qidirish..."
          class="search-input"
          @input="debouncedSearch"
        />
        <button v-if="searchFilters.search" @click="clearSearch" class="clear-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="filter-controls">
        <!-- Qo'shimcha filterlar -->
        <div
          class="dropdown advanced-filter"
          :class="{ active: openDropdown === 'advanced' }"
        >
          <button
            class="dropdown-toggle"
            @click="toggleDropdown('advanced')"
            :class="{ 'has-filter': hasAdvancedFilter }"
          >
            <i class="fas fa-filter"></i>
            <span>Qo'shimcha filterlar</span>
            <span v-if="advancedFilterCount" class="filter-count">
              {{ advancedFilterCount }}
            </span>
            <i
              class="fas fa-chevron-down arrow"
              :class="{ rotate: openDropdown === 'advanced' }"
            ></i>
          </button>
          <div class="dropdown-menu advanced-menu" v-if="openDropdown === 'advanced'">
            <!-- Bemor filterlari -->
            <div class="filter-section">
              <h4><i class="fas fa-user"></i> Bemor</h4>
              <div class="filter-row">
                <div class="filter-group">
                  <label>Bemor ID</label>
                  <input
                    type="number"
                    v-model="searchFilters.patient_id"
                    placeholder="Bemor ID kiriting"
                    @change="applyAdvancedFilters"
                  />
                </div>
                <div class="filter-group">
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      v-model="searchFilters.patient_is_null"
                      @change="applyAdvancedFilters"
                    />
                    <span class="checkbox-custom"></span>
                    Bemorsiz bronlar
                  </label>
                </div>
              </div>
              <div class="filter-row">
                <div class="filter-group">
                  <label>Bemor ismi</label>
                  <input
                    type="text"
                    v-model="searchFilters.name"
                    placeholder="Ism kiriting"
                    @input="debouncedAdvancedFilter"
                  />
                </div>
                <div class="filter-group">
                  <label>Telefon</label>
                  <input
                    type="text"
                    v-model="searchFilters.phone"
                    placeholder="Telefon raqam"
                    @input="debouncedAdvancedFilter"
                  />
                </div>
              </div>
            </div>
            <!-- Matn va izohlar filterlari -->
            <div class="filter-section">
              <h4><i class="fas fa-comment-alt"></i> Matn va izohlar</h4>
              <div class="filter-row">
                <div class="filter-group">
                  <label>Matn qidiruvi</label>
                  <input
                    type="text"
                    v-model="searchFilters.text"
                    placeholder="Bronlardagi matn"
                    @input="debouncedAdvancedFilter"
                  />
                </div>
                <div class="filter-group">
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      v-model="searchFilters.has_comment"
                      @change="applyAdvancedFilters"
                    />
                    <span class="checkbox-custom"></span>
                    Izohli bronlar
                  </label>
                </div>
              </div>
            </div>
            <div class="filter-actions">
              <button class="clear-filter-btn" @click="clearAdvancedFilters">
                <i class="fas fa-eraser"></i>
                Tozalash
              </button>
              <button class="apply-filter-btn" @click="applyAdvancedFilters">
                <i class="fas fa-check"></i>
                Qo'llash
              </button>
            </div>
          </div>
        </div>

        <!-- Sana filterlari -->
        <div
          class="dropdown date-filter"
          :class="{ active: openDropdown === 'date' }"
        >
          <button
            class="dropdown-toggle"
            @click="toggleDropdown('date')"
            :class="{ 'has-filter': hasDateFilter }"
          >
            <i class="fas fa-calendar-alt"></i>
            <span>{{ dateFilterLabel }}</span>
            <span v-if="hasDateFilter" class="filter-count">
              {{ activeDateFiltersCount }}
            </span>
            <i
              class="fas fa-chevron-down arrow"
              :class="{ rotate: openDropdown === 'date' }"
            ></i>
          </button>
          <div class="dropdown-menu date-menu" v-if="openDropdown === 'date'">
            <!-- Tez sana filterlari -->
            <div class="quick-filters">
              <h4>Tez filter</h4>
              <div class="quick-filter-buttons">
                <button
                  v-for="quick in quickDateFilters"
                  :key="quick.value"
                  class="quick-filter-btn"
                  :class="{ active: selectedQuickFilter === quick.value }"
                  @click="applyQuickDateFilter(quick)"
                >
                  <i :class="quick.icon"></i>
                  {{ quick.label }}
                </button>
              </div>
            </div>
            <!-- Sana turini tanlash -->
            <div class="date-type-selector">
              <h4>Sana turi</h4>
              <div class="radio-group">
                <label class="radio-item">
                  <input
                    type="radio"
                    v-model="dateFilterType"
                    value="appointment"
                    @change="updateDateFilterType"
                  />
                  <span class="radio-custom"></span>
                  Tashrif sanasi (date_after/before)
                </label>
                <label class="radio-item">
                  <input
                    type="radio"
                    v-model="dateFilterType"
                    value="created"
                    @change="updateDateFilterType"
                  />
                  <span class="radio-custom"></span>
                  Yaratilgan sana (created_after/before)
                </label>
              </div>
            </div>
            <!-- Maxsus sana oralig'i -->
            <div class="custom-date-range">
              <h4>
                {{
                  dateFilterType === "appointment"
                    ? "Tashrif sanasi oralig'i"
                    : "Yaratilgan sana oralig'i"
                }}
              </h4>
              <div class="date-inputs">
                <div class="date-input-group">
                  <label>Dan:</label>
                  <input
                    type="datetime-local"
                    v-model="customDateRange.start"
                    @change="onCustomDateChange"
                  />
                </div>
                <div class="date-input-group">
                  <label>Gacha:</label>
                  <input
                    type="datetime-local"
                    v-model="customDateRange.end"
                    @change="onCustomDateChange"
                  />
                </div>
              </div>
            </div>
            <div class="filter-actions">
              <button class="clear-filter-btn" @click="clearDateFilters">
                <i class="fas fa-eraser"></i>
                Tozalash
              </button>
              <button class="apply-filter-btn" @click="applyDateFilters">
                <i class="fas fa-check"></i>
                Qo'llash
              </button>
            </div>
          </div>
        </div>

        <!-- Status filterlari -->
        <div
          class="dropdown status-filter"
          :class="{ active: openDropdown === 'status' }"
        >
          <button
            class="dropdown-toggle"
            @click="toggleDropdown('status')"
            :class="{ 'has-filter': selectedStatuses.length > 0 }"
          >
            <i class="fas fa-tasks"></i>
            <span>Status</span>
            <span v-if="selectedStatuses.length > 0" class="filter-count">
              {{ selectedStatuses.length }}
            </span>
            <i
              class="fas fa-chevron-down arrow"
              :class="{ rotate: openDropdown === 'status' }"
            ></i>
          </button>
          <div class="dropdown-menu status-menu" v-if="openDropdown === 'status'">
            <div class="single-status-section">
              <h4>Yagona status</h4>
              <div class="radio-group">
                <label class="radio-item" @click="setSingleStatus('')">
                  <input type="radio" :checked="!searchFilters.status" name="single-status" />
                  <span class="radio-custom"></span>
                  Barcha statuslar
                </label>
                <label
                  v-for="status in statusOptions"
                  :key="`single-${status.value}`"
                  class="radio-item"
                  @click="setSingleStatus(status.value)"
                >
                  <input
                    type="radio"
                    :checked="searchFilters.status === status.value"
                    name="single-status"
                  />
                  <span class="radio-custom"></span>
                  <span class="status-badge" :class="status.value">
                    <i class="fas fa-circle status-dot"></i>
                    {{ status.label }}
                  </span>
                </label>
              </div>
            </div>
            <div class="divider"></div>
            <div class="multi-status-section">
              <h4>Bir nechta status</h4>
              <div class="status-options">
                <label
                  v-for="status in statusOptions"
                  :key="`multi-${status.value}`"
                  class="checkbox-item"
                >
                  <input
                    type="checkbox"
                    :value="status.value"
                    v-model="selectedStatuses"
                    @change="applyMultiStatusFilter"
                  />
                  <span class="checkbox-custom"></span>
                  <span class="status-badge" :class="status.value">
                    <i class="fas fa-circle status-dot"></i>
                    {{ status.label }}
                  </span>
                </label>
              </div>
            </div>
            <div class="filter-actions">
              <button class="clear-filter-btn" @click="clearStatusFilter">
                <i class="fas fa-eraser"></i>
                Tozalash
              </button>
            </div>
          </div>
        </div>

        <!-- Doktor filterlari -->
        <div
          class="dropdown doctor-filter"
          :class="{ active: openDropdown === 'doctor' }"
        >
          <button
            class="dropdown-toggle"
            @click="toggleDropdown('doctor')"
            :class="{ 'has-filter': searchFilters.doctor_id }"
          >
            <i class="fas fa-user-md"></i>
            <span>{{ doctorFilterLabel }}</span>
            <span v-if="searchFilters.doctor_id" class="filter-count">1</span>
            <i
              class="fas fa-chevron-down arrow"
              :class="{ rotate: openDropdown === 'doctor' }"
            ></i>
          </button>
          <div class="dropdown-menu doctor-menu" v-if="openDropdown === 'doctor'">
            <div class="doctor-search">
              <input
                type="text"
                v-model="doctorSearch"
                placeholder="Doktorni qidirish..."
                class="doctor-search-input"
              />
            </div>
            <div class="doctor-options">
              <div
                class="doctor-option"
                :class="{ active: !searchFilters.doctor_id }"
                @click="selectDoctor(null)"
              >
                <i class="fas fa-users"></i>
                Barcha doktorlar
              </div>
              <div
                v-for="doctor in filteredDoctors"
                :key="doctor.id"
                class="doctor-option"
                :class="{ active: searchFilters.doctor_id == doctor.id }"
                @click="selectDoctor(doctor.id)"
              >
                <div class="doctor-avatar">
                  {{ getInitials(doctor.full_name) }}
                </div>
                <span class="doctor-name">{{ doctor.full_name }}</span>
              </div>
            </div>
            <div class="filter-actions">
              <button class="clear-filter-btn" @click="clearDoctorFilter">
                <i class="fas fa-eraser"></i>
                Tozalash
              </button>
            </div>
          </div>
        </div>

        <!-- Tartiblash -->
        <div
          class="dropdown sort-filter"
          :class="{ active: openDropdown === 'sort' }"
        >
          <button class="dropdown-toggle" @click="toggleDropdown('sort')">
            <i class="fas fa-sort"></i>
            {{ sortOrderLabel }}
            <i
              class="fas fa-chevron-down arrow"
              :class="{ rotate: openDropdown === 'sort' }"
            ></i>
          </button>
          <div class="dropdown-menu" v-if="openDropdown === 'sort'">
            <div
              v-for="opt in sortOptions"
              :key="opt.value"
              class="dropdown-item"
              :class="{ active: searchFilters.ordering === opt.value }"
              @click="selectSort(opt)"
            >
              <i :class="opt.icon"></i>
              {{ opt.label }}
            </div>
          </div>
        </div>

        <!-- Barcha filterlarni tozalash -->
        <button v-if="hasAnyFilter" class="clear-all-btn" @click="clearAllFilters">
          <i class="fas fa-times-circle"></i>
          Barchasini tozalash
        </button>
        <button class="refresh-btn" @click="fetchBookings" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ spinning: loading }"></i>
          Yangilash
        </button>
      </div>
    </div>

    <!-- Faol filterlar -->
    <div v-if="hasAnyFilter" class="active-filters">
      <div class="filter-tags">
        <div v-if="searchFilters.search" class="filter-tag search-tag">
          <i class="fas fa-search"></i>
          <span>"{{ searchFilters.search }}"</span>
          <button @click="clearSearch" class="remove-tag">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div v-if="hasDateFilter" class="filter-tag date-tag">
          <i class="fas fa-calendar-alt"></i>
          <span>{{ getDateFilterText() }}</span>
          <button @click="clearDateFilters" class="remove-tag">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div v-if="searchFilters.status" class="filter-tag status-tag">
          <span class="status-badge" :class="searchFilters.status">
            <i class="fas fa-circle status-dot"></i>
            {{ getStatusLabel(searchFilters.status) }}
          </span>
          <button @click="clearStatusFilter" class="remove-tag">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div
          v-for="status in selectedStatuses"
          :key="status"
          class="filter-tag status-tag"
        >
          <span class="status-badge" :class="status">
            <i class="fas fa-circle status-dot"></i>
            {{ getStatusLabel(status) }}
          </span>
          <button @click="removeStatusFilter(status)" class="remove-tag">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div v-if="searchFilters.doctor_id" class="filter-tag doctor-tag">
          <i class="fas fa-user-md"></i>
          <span>{{ getDoctorName(searchFilters.doctor_id) }}</span>
          <button @click="clearDoctorFilter" class="remove-tag">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div v-if="searchFilters.patient_id" class="filter-tag advanced-tag">
          <i class="fas fa-user"></i>
          <span>Bemor ID: {{ searchFilters.patient_id }}</span>
          <button @click="clearFilter('patient_id')" class="remove-tag">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div v-if="searchFilters.patient_is_null" class="filter-tag advanced-tag">
          <i class="fas fa-user-slash"></i>
          <span>Bemorsiz bronlar</span>
          <button @click="clearFilter('patient_is_null')" class="remove-tag">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div v-if="searchFilters.name" class="filter-tag advanced-tag">
          <i class="fas fa-user"></i>
          <span>Ism: "{{ searchFilters.name }}"</span>
          <button @click="clearFilter('name')" class="remove-tag">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div v-if="searchFilters.phone" class="filter-tag advanced-tag">
          <i class="fas fa-phone"></i>
          <span>Tel: {{ searchFilters.phone }}</span>
          <button @click="clearFilter('phone')" class="remove-tag">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div v-if="searchFilters.text" class="filter-tag advanced-tag">
          <i class="fas fa-align-left"></i>
          <span>Matn: "{{ searchFilters.text }}"</span>
          <button @click="clearFilter('text')" class="remove-tag">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div v-if="searchFilters.has_comment" class="filter-tag advanced-tag">
          <i class="fas fa-comment-alt"></i>
          <span>Izohli bronlar</span>
          <button @click="clearFilter('has_comment')" class="remove-tag">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Yuklash holati -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Bronlar ro'yxati yuklanmoqda...</p>
    </div>

    <!-- Bo'sh holat -->
    <div v-else-if="bookings.length === 0 && !loading" class="empty-state">
      <i class="fas fa-calendar-times empty-icon"></i>
      <h3>
        {{ hasAnyFilter ? "Filter bo'yicha natija topilmadi" : "Bronlar topilmadi" }}
      </h3>
      <p>
        {{
          hasAnyFilter
            ? "Filterlarni o'zgartirib ko'ring"
            : "Yangi bron qo'shish uchun yuqoridagi tugmani bosing"
        }}
      </p>
    </div>

    <!-- Jadval -->
    <div v-else class="table-container">
      <div class="table-wrapper">
        <table class="bookings-table">
          <thead>
            <tr>
              <th class="number-col">№</th>
              <th class="patient-col" @click="setSortField('name')">
                <span>Bemor</span>
                <i class="fas fa-sort sort-icon" :class="getSortClass('name')"></i>
              </th>
              <th class="phone-col" @click="setSortField('phone')">
                <span>Telefon</span>
                <i class="fas fa-sort sort-icon" :class="getSortClass('phone')"></i>
              </th>
              <th class="doctor-col">Doktor</th>
              <th class="date-col" @click="setSortField('date')">
                <span>Tashrif sanasi</span>
                <i class="fas fa-sort sort-icon" :class="getSortClass('date')"></i>
              </th>
              <th class="status-col">Status</th>
              <th class="created-col" @click="setSortField('created_at')">
                <span>Yaratilgan</span>
                <i
                  class="fas fa-sort sort-icon"
                  :class="getSortClass('created_at')"
                ></i>
              </th>
              <th class="actions-col">Harakatlar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(booking, index) in bookings" :key="booking.id" class="booking-row">
              <td class="number-col">{{ (currentPage - 1) * 10 + index + 1 }}</td>
              <td class="patient-col">
                <div class="patient-info">
                  <div class="patient-avatar">
                    {{ getInitials(booking.name || "N/A") }}
                  </div>
                  <div class="patient-details">
                    <span class="patient-name">{{ booking.name || "Noma'lum" }}</span>
                    <span v-if="booking.patient_id" class="patient-id"
                      >ID: {{ booking.patient_id }}</span
                    >
                  </div>
                </div>
              </td>
              <td class="phone-col">
                <a v-if="booking.phone" :href="`tel:${booking.phone}`" class="phone-link">
                  <i class="fas fa-phone"></i>
                  {{ formatPhone(booking.phone) }}
                </a>
                <span v-else class="no-phone">Telefon yo'q</span>
              </td>
              <td class="doctor-col">
                <div v-if="booking.doctor" class="doctor-info">
                  <div class="doctor-avatar">
                    {{ getInitials(booking.doctor.full_name) }}
                  </div>
                  <span class="doctor-name">{{ booking.doctor.full_name }}</span>
                </div>
                <span v-else class="no-doctor">Doktor belgilanmagan</span>
              </td>
              <td class="date-col">
                <div v-if="booking.date" class="date-info">
                  <span class="date">{{ formatDate(booking.date) }}</span>
                  <span class="time">{{ formatTime(booking.date) }}</span>
                </div>
                <span v-else class="no-date">Sana yo'q</span>
              </td>
              <td class="status-col">
                <div class="status-select" @click="openStatusDropdown(booking, index)">
                  <span class="status-badge" :class="booking.status">
                    <i class="fas fa-circle status-dot"></i>
                    {{ getStatusText(booking.status) }}
                  </span>
                  <i
                    class="fas fa-chevron-down status-arrow"
                    :class="{ rotate: openStatusIndex === index }"
                  ></i>
                  <div v-if="openStatusIndex === index" class="status-dropdown">
                    <div
                      v-for="status in statusOptions"
                      :key="status.value"
                      class="status-option"
                      :class="{ active: booking.status === status.value }"
                      @click.stop="changeStatus(booking, status.value)"
                    >
                      <span class="status-badge" :class="status.value">
                        <i class="fas fa-circle status-dot"></i>
                        {{ status.label }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="created-col">
                <div class="date-info">
                  <span class="date">{{ formatDate(booking.created_at) }}</span>
                  <span class="time">{{ formatTime(booking.created_at) }}</span>
                </div>
              </td>
              <td class="actions-col">
                <div class="action-buttons">
                  <button class="action-btn view" @click="viewBooking(booking)" title="Ko'rish">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="action-btn edit" @click="editBooking(booking)" title="Tahrirlash">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    class="action-btn delete"
                    @click="deleteBooking(booking)"
                    title="O'chirish"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Sahifalash -->
      <div class="pagination" v-if="totalPages > 1">
        <button
          class="pagination-btn"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          <i class="fas fa-chevron-left"></i>
          Oldingi
        </button>
        <div class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            class="page-btn"
            :class="{ active: page === currentPage }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        <button
          class="pagination-btn"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          Keyingi
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

// Reactive data
const loading = ref(false);
const bookings = ref([]);
const doctors = ref([]);
const openDropdown = ref(null);
const openStatusIndex = ref(null);
const currentPage = ref(1);
const totalBookings = ref(0);
const totalPages = ref(0);
const newBookingOP = ref(false);

// Filterlar
const searchFilters = ref({
  search: "",
  doctor_id: null,
  patient_id: null,
  patient_is_null: false,
  name: "",
  phone: "",
  text: "",
  status: "",
  status_in: "",
  date_after: null,
  date_before: null,
  created_after: null,
  created_before: null,
  has_comment: false,
  ordering: "-date",
});
const selectedStatuses = ref([]);
const doctorSearch = ref("");
const dateFilterType = ref("appointment");
const selectedQuickFilter = ref("");
const customDateRange = ref({ start: "", end: "" });

// API URL
const API_URL = "https://web.dad-urolog.uz/api/dashboard/bookings/";
const DOCTORS_URL = "https://web.dad-urolog.uz/api/dashboard/doctors/";

// Filter opsiyalar
const statusOptions = [
  { value: "pending", label: "Kutilmoqda" },
  { value: "confirmed", label: "Tasdiqlangan" },
  { value: "cancelled", label: "Bekor qilingan" },
  { value: "completed", label: "Yakunlangan" },
  { value: "no_show", label: "Kelmadi" },
];

const sortOptions = [
  { value: "name", label: "Ism bo'yicha (A-Z)", icon: "fas fa-sort-alpha-down" },
  { value: "-name", label: "Ism bo'yicha (Z-A)", icon: "fas fa-sort-alpha-up" },
  { value: "phone", label: "Telefon bo'yicha", icon: "fas fa-sort-numeric-down" },
  { value: "-phone", label: "Telefon bo'yicha (teskari)", icon: "fas fa-sort-numeric-up" },
  { value: "date", label: "Tashrif sanasi (eski)", icon: "fas fa-calendar-alt" },
  { value: "-date", label: "Tashrif sanasi (yangi)", icon: "fas fa-calendar-alt" },
  { value: "created_at", label: "Yaratilgan sana (eski)", icon: "fas fa-clock" },
  { value: "-created_at", label: "Yaratilgan sana (yangi)", icon: "fas fa-clock" },
  { value: "status", label: "Status bo'yicha", icon: "fas fa-tasks" },
];

const quickDateFilters = [
  { value: "today", label: "Bugun", icon: "fas fa-calendar-day" },
  { value: "tomorrow", label: "Ertaga", icon: "fas fa-calendar-plus" },
  { value: "this_week", label: "Bu hafta", icon: "fas fa-calendar-week" },
  { value: "next_week", label: "Keyingi hafta", icon: "fas fa-calendar-week" },
  { value: "this_month", label: "Bu oy", icon: "fas fa-calendar-alt" },
  { value: "next_month", label: "Keyingi oy", icon: "fas fa-calendar-alt" },
  { value: "last_7_days", label: "Oxirgi 7 kun", icon: "fas fa-calendar-minus" },
  { value: "last_30_days", label: "Oxirgi 30 kun", icon: "fas fa-calendar-minus" },
];

// Computed properties
const sortOrderLabel = computed(() =>
  sortOptions.find((o) => o.value === searchFilters.value.ordering)?.label || "Tartiblash"
);

const doctorFilterLabel = computed(() => {
  if (searchFilters.value.doctor_id) {
    return getDoctorName(searchFilters.value.doctor_id);
  }
  return "Doktor";
});

const filteredDoctors = computed(() => {
  if (!doctorSearch.value.trim()) return doctors.value;
  return doctors.value.filter((doctor) =>
    doctor.full_name.toLowerCase().includes(doctorSearch.value.toLowerCase())
  );
});

const hasDateFilter = computed(() => {
  return !!(searchFilters.value.date_after || searchFilters.value.date_before || searchFilters.value.created_after || searchFilters.value.created_before);
});

const activeDateFiltersCount = computed(() => {
  let count = 0;
  if (searchFilters.value.date_after) count++;
  if (searchFilters.value.date_before) count++;
  if (searchFilters.value.created_after) count++;
  if (searchFilters.value.created_before) count++;
  return count;
});

const dateFilterLabel = computed(() => {
  if (selectedQuickFilter.value) {
    return quickDateFilters.find((f) => f.value === selectedQuickFilter.value)?.label || "Sana";
  }
  if (hasDateFilter.value) {
    const type = dateFilterType.value === "appointment" ? "Tashrif" : "Yaratilgan";
    return `${type} (${activeDateFiltersCount.value})`;
  }
  return "Sana";
});

const hasAdvancedFilter = computed(() => {
  return !!(
    searchFilters.value.patient_id ||
    searchFilters.value.patient_is_null ||
    searchFilters.value.name ||
    searchFilters.value.phone ||
    searchFilters.value.text ||
    searchFilters.value.has_comment
  );
});

const advancedFilterCount = computed(() => {
  let count = 0;
  if (searchFilters.value.patient_id) count++;
  if (searchFilters.value.patient_is_null) count++;
  if (searchFilters.value.name) count++;
  if (searchFilters.value.phone) count++;
  if (searchFilters.value.text) count++;
  if (searchFilters.value.has_comment) count++;
  return count;
});

const hasAnyFilter = computed(() => {
  return !!(
    searchFilters.value.search ||
    selectedStatuses.value.length > 0 ||
    searchFilters.value.status ||
    searchFilters.value.doctor_id ||
    hasDateFilter.value ||
    hasAdvancedFilter.value
  );
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
const buildAPIQuery = () => {
  const query = {};

  // Basic search
  if (searchFilters.value.search?.trim()) {
    query.search = searchFilters.value.search.trim();
  }

  // Patient filters
  if (searchFilters.value.doctor_id) {
    query.doctor_id = searchFilters.value.doctor_id;
  }
  if (searchFilters.value.patient_id) {
    query.patient_id = searchFilters.value.patient_id;
  }
  if (searchFilters.value.patient_is_null) {
    query.patient_is_null = "true";
  }

  // Text filters
  if (searchFilters.value.name?.trim()) {
    query.name = searchFilters.value.name.trim();
  }
  if (searchFilters.value.phone?.trim()) {
    query.phone = searchFilters.value.phone.trim();
  }
  if (searchFilters.value.text?.trim()) {
    query.text = searchFilters.value.text.trim();
  }

  // Status filters
  if (searchFilters.value.status) {
    query.status = searchFilters.value.status;
  }
  if (selectedStatuses.value.length > 0) {
    query.status_in = selectedStatuses.value.join(",");
  }

  // Date filters
  if (searchFilters.value.date_after) {
    query.date_after = searchFilters.value.date_after;
  }
  if (searchFilters.value.date_before) {
    query.date_before = searchFilters.value.date_before;
  }
  if (searchFilters.value.created_after) {
    query.created_after = searchFilters.value.created_after;
  }
  if (searchFilters.value.created_before) {
    query.created_before = searchFilters.value.created_before;
  }

  // Other filters
  if (searchFilters.value.has_comment) {
    query.has_comment = "true";
  }

  // Ordering
  if (searchFilters.value.ordering) {
    query.ordering = searchFilters.value.ordering;
  }

  return query;
};

const fetchBookings = async (page = 1) => {
  try {
    loading.value = true;
    const query = {
      page,
      ...buildAPIQuery(),
    };
    const result = await $fetch(API_URL, { query });
    if (result.status) {
      bookings.value = result.data;
      totalBookings.value = result.total;
      totalPages.value = result.total_pages;
      currentPage.value = result.current_page;
    } else {
      showNotification("Ma'lumotlarni yuklashda xatolik", "error");
    }
  } catch (error) {
    showNotification("Bronlarni yuklashda xatolik yuz berdi", "error");
  } finally {
    loading.value = false;
  }
};

const fetchDoctors = async () => {
  try {
    const result = await $fetch(DOCTORS_URL);
    if (result.status) {
      doctors.value = result.data;
    }
  } catch (error) {
    console.error("Doktorlarni yuklashda xatolik:", error);
  }
};

// Filter Methods
const applyQuickDateFilter = (quickFilter) => {
  selectedQuickFilter.value = quickFilter.value;
  customDateRange.value = { start: "", end: "" };

  const now = new Date();
  let start, end;

  switch (quickFilter.value) {
    case "today":
      start = end = new Date().toISOString().split("T")[0] + "T00:00";
      break;
    case "tomorrow":
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      start = end = tomorrow.toISOString().split("T")[0] + "T00:00";
      break;
    case "this_week":
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      start = startOfWeek.toISOString().split("T")[0] + "T00:00";
      end = now.toISOString().split("T")[0] + "T23:59";
      break;
    case "next_week":
      const nextWeekStart = new Date(now);
      nextWeekStart.setDate(now.getDate() + (7 - now.getDay()));
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
      start = nextWeekStart.toISOString().split("T")[0] + "T00:00";
      end = nextWeekEnd.toISOString().split("T")[0] + "T23:59";
      break;
    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0] + "T00:00";
      end = now.toISOString().split("T")[0] + "T23:59";
      break;
    case "next_month":
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      start = nextMonth.toISOString().split("T")[0] + "T00:00";
      end = nextMonthEnd.toISOString().split("T")[0] + "T23:59";
      break;
    case "last_7_days":
      const last7Days = new Date(now);
      last7Days.setDate(now.getDate() - 7);
      start = last7Days.toISOString().split("T")[0] + "T00:00";
      end = now.toISOString().split("T")[0] + "T23:59";
      break;
    case "last_30_days":
      const last30Days = new Date(now);
      last30Days.setDate(now.getDate() - 30);
      start = last30Days.toISOString().split("T")[0] + "T00:00";
      end = now.toISOString().split("T")[0] + "T23:59";
      break;
  }

  if (dateFilterType.value === "created") {
    searchFilters.value.created_after = start;
    searchFilters.value.created_before = end;
    searchFilters.value.date_after = null;
    searchFilters.value.date_before = null;
  } else {
    searchFilters.value.date_after = start;
    searchFilters.value.date_before = end;
    searchFilters.value.created_after = null;
    searchFilters.value.created_before = null;
  }

  applyDateFilters();
};

const onCustomDateChange = () => {
  selectedQuickFilter.value = "";
  if (customDateRange.value.start || customDateRange.value.end) {
    if (dateFilterType.value === "created") {
      searchFilters.value.created_after = customDateRange.value.start;
      searchFilters.value.created_before = customDateRange.value.end;
      searchFilters.value.date_after = null;
      searchFilters.value.date_before = null;
    } else {
      searchFilters.value.date_after = customDateRange.value.start;
      searchFilters.value.date_before = customDateRange.value.end;
      searchFilters.value.created_after = null;
      searchFilters.value.created_before = null;
    }
    applyDateFilters();
  }
};

const updateDateFilterType = () => {
  searchFilters.value.date_after = null;
  searchFilters.value.date_before = null;
  searchFilters.value.created_after = null;
  searchFilters.value.created_before = null;
  customDateRange.value = { start: "", end: "" };
  selectedQuickFilter.value = "";
};

const applyDateFilters = () => {
  currentPage.value = 1;
  fetchBookings();
  openDropdown.value = null;
};

const clearDateFilters = () => {
  searchFilters.value.date_after = null;
  searchFilters.value.date_before = null;
  searchFilters.value.created_after = null;
  searchFilters.value.created_before = null;
  customDateRange.value = { start: "", end: "" };
  selectedQuickFilter.value = "";
  currentPage.value = 1;
  fetchBookings();
  openDropdown.value = null;
};

const setSingleStatus = (status) => {
  searchFilters.value.status = status;
  searchFilters.value.status_in = "";
  selectedStatuses.value = [];
  currentPage.value = 1;
  fetchBookings();
  openDropdown.value = null;
};

const applyMultiStatusFilter = () => {
  searchFilters.value.status = "";
  searchFilters.value.status_in = selectedStatuses.value.join(",");
  currentPage.value = 1;
  fetchBookings();
};

const clearStatusFilter = () => {
  searchFilters.value.status = "";
  searchFilters.value.status_in = "";
  selectedStatuses.value = [];
  currentPage.value = 1;
  fetchBookings();
  openDropdown.value = null;
};

const removeStatusFilter = (status) => {
  selectedStatuses.value = selectedStatuses.value.filter((s) => s !== status);
  applyMultiStatusFilter();
};

const selectDoctor = (doctorId) => {
  searchFilters.value.doctor_id = doctorId;
  currentPage.value = 1;
  fetchBookings();
  openDropdown.value = null;
};

const clearDoctorFilter = () => {
  searchFilters.value.doctor_id = null;
  currentPage.value = 1;
  fetchBookings();
  openDropdown.value = null;
};

const applyAdvancedFilters = () => {
  currentPage.value = 1;
  fetchBookings();
};

const clearAdvancedFilters = () => {
  searchFilters.value.patient_id = null;
  searchFilters.value.patient_is_null = false;
  searchFilters.value.name = "";
  searchFilters.value.phone = "";
  searchFilters.value.text = "";
  searchFilters.value.has_comment = false;
  currentPage.value = 1;
  fetchBookings();
  openDropdown.value = null;
};

const clearFilter = (filterKey) => {
  if (filterKey === "patient_is_null" || filterKey === "has_comment") {
    searchFilters.value[filterKey] = false;
  } else {
    searchFilters.value[filterKey] = filterKey === "patient_id" ? null : "";
  }
  currentPage.value = 1;
  fetchBookings();
};

const clearAllFilters = () => {
  Object.assign(searchFilters.value, {
    search: "",
    doctor_id: null,
    patient_id: null,
    patient_is_null: false,
    name: "",
    phone: "",
    text: "",
    status: "",
    status_in: "",
    date_after: null,
    date_before: null,
    created_after: null,
    created_before: null,
    has_comment: false,
    ordering: "-date",
  });

  selectedStatuses.value = [];
  customDateRange.value = { start: "", end: "" };
  selectedQuickFilter.value = "";
  doctorSearch.value = "";
  currentPage.value = 1;
  fetchBookings();
};

// Debounced filter methods
const debouncedSearch = (() => {
  let timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      currentPage.value = 1;
      fetchBookings();
    }, 500);
  };
})();

const debouncedAdvancedFilter = (() => {
  let timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      applyAdvancedFilters();
    }, 500);
  };
})();

// Booking Methods
const changeStatus = async (booking, newStatus) => {
  try {
    await $fetch(`${API_URL}${booking.id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        "X-CSRFTOKEN": "qiXtHL1ARCFCmnMSqP6HW2dKD3M8EfoNGmYRCPDccCUSOvvaRJ37rLYkWwatA1do",
      },
      body: { status: newStatus },
    });
    const bookingIndex = bookings.value.findIndex((b) => b.id === booking.id);
    if (bookingIndex !== -1) {
      bookings.value[bookingIndex].status = newStatus;
    }
    openStatusIndex.value = null;
    showNotification("Status muvaffaqiyatli o'zgartirildi", "success");
  } catch (error) {
    showNotification("Status o'zgartirishda xatolik yuz berdi", "error");
  }
};

const viewBooking = (booking) => {
  console.log("Bronni ko'rish:", booking);
};

const editBooking = (booking) => {
  console.log("Bronni tahrirlash:", booking);
};

const deleteBooking = async (booking) => {
  if (!confirm(`${booking.name || "Bu"} bronni o'chirishni tasdiqlaysizmi?`)) {
    return;
  }
  try {
    await $fetch(`${API_URL}${booking.id}/`, {
      method: "DELETE",
      headers: {
        accept: "application/json",
        "X-CSRFTOKEN": "qiXtHL1ARCFCmnMSqP6HW2dKD3M8EfoNGmYRCPDccCUSOvvaRJ37rLYkWwatA1do",
      },
    });
    bookings.value = bookings.value.filter((b) => b.id !== booking.id);
    totalBookings.value -= 1;
    showNotification("Bron muvaffaqiyatli o'chirildi", "success");
  } catch (error) {
    showNotification("Bronni o'chirishda xatolik yuz berdi", "error");
  }
};

// UI Methods
const toggleDropdown = (type) => {
  openDropdown.value = openDropdown.value === type ? null : type;
};

const selectSort = (option) => {
  searchFilters.value.ordering = option.value;
  currentPage.value = 1;
  fetchBookings();
  openDropdown.value = null;
};

const setSortField = (field) => {
  const currentOrder = searchFilters.value.ordering;
  if (currentOrder === field) {
    searchFilters.value.ordering = `-${field}`;
  } else if (currentOrder === `-${field}`) {
    searchFilters.value.ordering = field;
  } else {
    searchFilters.value.ordering = field;
  }
  currentPage.value = 1;
  fetchBookings();
};

const getSortClass = (field) => {
  const ordering = searchFilters.value.ordering;
  if (ordering === field) return "fa-sort-up active";
  if (ordering === `-${field}`) return "fa-sort-down active";
  return "";
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    fetchBookings(page);
  }
};

const clearSearch = () => {
  searchFilters.value.search = "";
  currentPage.value = 1;
  fetchBookings();
};

const openStatusDropdown = (booking, index) => {
  openStatusIndex.value = openStatusIndex.value === index ? null : index;
};

// Helper Methods
const getDateFilterText = () => {
  if (selectedQuickFilter.value) {
    return quickDateFilters.find((f) => f.value === selectedQuickFilter.value)?.label;
  }

  const filters = [];
  const type = dateFilterType.value === "appointment" ? "Tashrif" : "Yaratilgan";

  if (dateFilterType.value === "appointment") {
    if (searchFilters.value.date_after) filters.push(`Dan: ${formatDateTime(searchFilters.value.date_after)}`);
    if (searchFilters.value.date_before) filters.push(`Gacha: ${formatDateTime(searchFilters.value.date_before)}`);
  } else {
    if (searchFilters.value.created_after) filters.push(`Dan: ${formatDateTime(searchFilters.value.created_after)}`);
    if (searchFilters.value.created_before) filters.push(`Gacha: ${formatDateTime(searchFilters.value.created_before)}`);
  }

  return filters.length > 0 ? `${type}: ${filters.join(", ")}` : `${type} filtri`;
};

const getStatusLabel = (status) => {
  return statusOptions.find((s) => s.value === status)?.label || status;
};

const getDoctorName = (doctorId) => {
  return doctors.value.find((d) => d.id == doctorId)?.full_name || "Noma'lum doktor";
};

const getInitials = (fullName) => {
  if (!fullName) return "?";
  return fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
};

const formatPhone = (phone) => {
  if (!phone) return "";
  return phone.replace(/(\+998)(\d{2})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return "";
  const date = new Date(dateTimeString);
  return date.toLocaleString("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusText = (status) => {
  const statusMap = {
    pending: "Kutilmoqda",
    confirmed: "Tasdiqlangan",
    cancelled: "Bekor qilingan",
    completed: "Yakunlangan",
    no_show: "Kelmadi",
  };
  return statusMap[status] || status;
};

const showNotification = (message, type) => {
  try {
    useNuxtApp().$toast?.[type](message);
  } catch (error) {
    console.log(`${type}: ${message}`);
  }
};

// Click outside handler
const handleClickOutside = (event) => {
  if (!event.target.closest(".dropdown")) {
    openDropdown.value = null;
  }
  if (!event.target.closest(".status-select")) {
    openStatusIndex.value = null;
  }
};

// Lifecycle
onMounted(() => {
  fetchBookings();
  fetchDoctors();
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
/* Umumiy stylelar */
.bookings-page {
  width: 100%;
  padding: 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bookings-count {
  font-size: 0.9rem;
  color: #6b7280;
}

.add-btn {
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.add-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.25);
}

/* Qidiruv va filterlar */
.search-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.clear-btn {
  position: absolute;
  right: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  font-size: 0.875rem;
}

.filter-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

/* Dropdown stylelari */
.dropdown {
  position: relative;
}

.dropdown-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.875rem;
  font-weight: 500;
  min-width: 120px;
}

.dropdown-toggle:hover {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.dropdown-toggle.has-filter {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1d4ed8;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1);
}

.filter-count {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
  line-height: 1.2;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.arrow {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #6b7280;
}

.arrow.rotate {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 300px;
  max-height: 500px;
  overflow-y: auto;
  animation: dropdown-enter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  backdrop-filter: blur(8px);
}

@keyframes dropdown-enter {
  from {
    opacity: 0;
    transform: translateY(-12px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Advanced filter menu */
.advanced-menu {
  padding: 1.5rem;
  min-width: 500px;
}

.filter-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.filter-section:last-of-type {
  border-bottom: none;
  margin-bottom: 1rem;
}

.filter-section h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f3f4f6;
}

.filter-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.filter-group {
  flex: 1;
}

.filter-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.filter-group input[type="text"],
.filter-group input[type="number"] {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.filter-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 500;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkbox-custom {
  width: 1.125rem;
  height: 1.125rem;
  border: 2px solid #d1d5db;
  border-radius: 0.375rem;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  transform: scale(1.05);
}

.checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 0.875rem;
  font-weight: bold;
}

/* Date filter styles */
.date-menu {
  padding: 1.5rem;
  min-width: 400px;
}

.date-menu h4 {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 0.75rem;
}

.quick-filters {
  margin-bottom: 2rem;
}

.quick-filter-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.quick-filter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.8rem;
  font-weight: 500;
}

.quick-filter-btn:hover {
  border-color: #3b82f6;
  background: #f8fafc;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.quick-filter-btn.active {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1);
}

.date-type-selector {
  margin-bottom: 2rem;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.radio-item:hover {
  color: #3b82f6;
}

.radio-item input[type="radio"] {
  display: none;
}

.radio-custom {
  width: 1.125rem;
  height: 1.125rem;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.radio-item input[type="radio"]:checked + .radio-custom {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  transform: scale(1.05);
}

.radio-item input[type="radio"]:checked + .radio-custom::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0.5rem;
  height: 0.5rem;
  background: white;
  border-radius: 50%;
}

.custom-date-range {
  margin-bottom: 2rem;
}

.date-inputs {
  display: flex;
  gap: 1rem;
}

.date-input-group {
  flex: 1;
}

.date-input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: #374151;
}

.date-input-group input {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.date-input-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Status filter styles */
.status-menu {
  padding: 1rem;
  min-width: 280px;
}

.single-status-section,
.multi-status-section {
  margin-bottom: 1.5rem;
}

.divider {
  height: 1px;
  background: #e5e7eb;
  margin: 1.5rem 0;
}

.status-options {
  max-height: 200px;
  overflow-y: auto;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.5rem;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.checkbox-item:hover {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

/* Doctor filter styles */
.doctor-menu {
  padding: 1rem;
  min-width: 300px;
}

.doctor-search {
  margin-bottom: 1rem;
}

.doctor-search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.doctor-search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.doctor-options {
  max-height: 250px;
  overflow-y: auto;
}

.doctor-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 0.75rem;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.doctor-option:hover {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.doctor-option.active {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1d4ed8;
  font-weight: 500;
}

.doctor-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  flex-shrink: 0;
}

/* Filter actions */
.filter-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
  margin-top: 1rem;
}

.clear-filter-btn,
.apply-filter-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.clear-filter-btn {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  color: #6b7280;
}

.clear-filter-btn:hover {
  background: #f1f5f9;
  border-color: #d1d5db;
  transform: translateY(-1px);
}

.apply-filter-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: 1px solid #3b82f6;
  color: white;
}

.apply-filter-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.25);
}

/* Clear All Button */
.clear-all-btn {
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.clear-all-btn:hover {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.15);
}

/* Active Filters Display */
.active-filters {
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  animation: slide-down 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-15px);
    max-height: 0;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    max-height: 200px;
  }
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.filter-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 2rem;
  font-size: 0.8rem;
  font-weight: 500;
  animation: tag-enter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

@keyframes tag-enter {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.filter-tag.search-tag {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #f3f0ff 0%, #ede9fe 100%);
  color: #7c3aed;
}

.filter-tag.date-tag {
  border-color: #a78bfa;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  color: #7c3aed;
}

.filter-tag.status-tag {
  border-color: #34d399;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.filter-tag.doctor-tag {
  border-color: #60a5fa;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #2563eb;
}

.filter-tag.advanced-tag {
  border-color: #fbbf24;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  color: #d97706;
}

.remove-tag {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  padding: 0.125rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  font-size: 0.75rem;
}

.remove-tag:hover {
  background: rgba(0, 0, 0, 0.1);
  opacity: 1;
  transform: scale(1.1);
}

/* Status Badges */
.status-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.pending {
  color: #d97706;
}

.status-badge.confirmed {
  color: #059669;
}

.status-badge.cancelled {
  color: #dc2626;
}

.status-badge.completed {
  color: #0891b2;
}

.status-badge.no_show {
  color: #7c2d12;
}

.status-dot {
  font-size: 0.5rem;
  opacity: 0.8;
}

/* Table Styles */
.bookings-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.bookings-table th {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
}

.bookings-table td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.booking-row:hover {
  background: linear-gradient(135deg, #fefefe 0%, #f8fafc 100%);
}

.patient-info,
.doctor-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.patient-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 600;
  flex-shrink: 0;
}

.patient-details {
  display: flex;
  flex-direction: column;
}

.patient-name {
  font-weight: 500;
  color: #111827;
}

.patient-id {
  font-size: 0.75rem;
  color: #6b7280;
}

.phone-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #3b82f6;
  text-decoration: none;
  transition: all 0.2s ease;
}

.phone-link:hover {
  color: #2563eb;
  transform: translateY(-1px);
}

.no-phone,
.no-doctor,
.no-date {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.875rem;
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date {
  font-weight: 500;
  color: #111827;
}

.time {
  font-size: 0.8rem;
  color: #6b7280;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.action-btn.view {
  background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%);
  color: #0288d1;
}

.action-btn.view:hover {
  background: linear-gradient(135deg, #b3e5fc 0%, #81d4fa 100%);
  transform: translateY(-1px);
}

.action-btn.edit {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  color: #f57c00;
}

.action-btn.edit:hover {
  background: linear-gradient(135deg, #ffe0b2 0%, #ffcc80 100%);
  transform: translateY(-1px);
}

.action-btn.delete {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  color: #d32f2f;
}

.action-btn.delete:hover {
  background: linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 100%);
  transform: translateY(-1px);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
  padding: 1rem;
}

.pagination-btn,
.page-btn {
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.pagination-btn:hover:not(:disabled),
.page-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  transform: translateY(-1px);
}

.page-btn.active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: #3b82f6;
  color: white;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

/* Loading and Empty States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: #6b7280;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-icon {
  font-size: 3rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

/* Refresh Button */
.refresh-btn {
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.refresh-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #374151;
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .advanced-menu {
    min-width: 400px;
  }

  .filter-row {
    flex-direction: column;
    gap: 0.75rem;
  }
}

@media (max-width: 768px) {
  .search-controls {
    gap: 0.75rem;
  }

  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .dropdown-menu {
    min-width: auto;
    left: 0;
    right: 0;
  }

  .advanced-menu {
    min-width: auto;
    padding: 1rem;
  }

  .date-inputs {
    flex-direction: column;
    gap: 0.75rem;
  }

  .quick-filter-buttons {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .filter-tags {
    gap: 0.5rem;
  }

  .filter-tag {
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
  }

  .bookings-table {
    font-size: 0.875rem;
  }

  .bookings-table th,
  .bookings-table td {
    padding: 0.75rem 0.5rem;
  }
}
</style>
