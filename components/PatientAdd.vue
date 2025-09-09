<template>
    <!-- Modal overlay -->
    <div class="modal-overlay" v-if="isOpen" @click.self="closeModal" :class="{ show: isOpen }">
        <div class="modal">
            <!-- Header -->
            <div class="modal-header">
                <h3>Yangi bemor qo'shish</h3>
                <button class="close-btn" @click="closeModal">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Body -->
            <div class="modal-body">
                <form @submit.prevent="submitForm">
                    <!-- F.I.O -->
                    <div class="form-group">
                        <label for="full_name">
                            F.I.O <span class="required">*</span>
                        </label>
                        <input id="full_name" v-model="form.full_name" type="text" placeholder="Familiya Ism Sharif"
                            :class="{ error: errors.full_name }" maxlength="255" />
                        <div v-if="errors.full_name" class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            {{ errors.full_name }}
                        </div>
                    </div>

                    <!-- Telefon -->
                    <div class="form-group">
                        <label for="phone">
                            Telefon <span class="required">*</span>
                        </label>
                        <input id="phone" v-model="form.phone" type="tel" placeholder="+998 90 123 45 67"
                            :class="{ error: errors.phone }" maxlength="20" @input="formatPhoneNumber" />
                        <div v-if="errors.phone" class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            {{ errors.phone }}
                        </div>
                    </div>

                    <!-- Asosiy shifokor -->
                    <div class="form-group">
                        <label>
                            Asosiy shifokor <span class="required">*</span>
                        </label>
                        <div class="custom-dropdown" :class="{ open: dropdownOpen, error: errors.doctor }"
                            @click="toggleDropdown">
                            <div class="selected">
                                {{ selectedDoctorName || "Shifokor tanlang" }}
                                <i class="fas fa-chevron-down dropdown-icon"></i>
                            </div>
                            <div v-show="dropdownOpen" class="dropdown-list">
                                <div v-for="doctor in doctorsList" :key="doctor.id"
                                    @click.stop="selectDoctor(doctor)" class="dropdown-item">
                                    <div class="doctor-info">
                                        <span class="doctor-name">{{ doctor.name_uz || doctor.name }}</span>
                                        <span class="doctor-specialty" v-if="doctor.specialty">{{ doctor.specialty }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-if="errors.doctor" class="error-message">
                            <i class="fas fa-exclamation-circle"></i> 
                            {{ errors.doctor }}
                        </div>
                    </div>

                    <!-- Telegram username -->
                    <div class="form-group">
                        <label for="tg_username">Telegram Username</label>
                        <input id="tg_username" v-model="form.tg_username" type="text" placeholder="@username"
                            :class="{ error: errors.tg_username }" maxlength="50" @input="formatTelegramUsername" />
                        <div v-if="errors.tg_username" class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            {{ errors.tg_username }}
                        </div>
                    </div>

                    <!-- Holat -->

                    <!-- Qo'shimcha izoh -->
                    <div class="form-group">
                        <label for="notes">Qo'shimcha izoh</label>
                        <textarea id="notes" v-model="form.notes" placeholder="Bemor haqida qo'shimcha ma'lumotlar..."
                            :class="{ error: errors.notes }" rows="4"></textarea>
                        <div v-if="errors.notes" class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            {{ errors.notes }}
                        </div>
                    </div>
                </form>
            </div>

            <!-- Footer -->
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeModal">
                    <i class="fas fa-times"></i>
                    Bekor qilish
                </button>
                <button type="button" class="btn btn-primary" @click="submitForm" :disabled="loading">
                    <i class="fas fa-spinner fa-spin" v-if="loading"></i>
                    <i class="fas fa-save" v-else></i>
                    {{ loading ? 'Saqlanmoqda...' : 'Saqlash' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed } from 'vue'

const props = defineProps({
    isOpen: { type: Boolean, default: false }
})

// Emits
const emit = defineEmits(['close', 'success'])

// Reactive data
const loading = ref(false)
const doctorsList = ref([])
const dropdownOpen = ref(false)

// Status options
const statusOptions = ref([
    { value: 'active', label: 'Faol', icon: 'fas fa-check-circle' },
    { value: 'inactive', label: 'Nofaol', icon: 'fas fa-times-circle' },
    { value: 'pending', label: 'Kutilmoqda', icon: 'fas fa-clock' }
])

// Form data
const form = reactive({
    full_name: '',
    phone: '',
    doctor: '',
    tg_username: '',
    status: 'active',
    notes: ''
})

// Error handling
const errors = ref({})

// API URLs
const API_URL = 'https://web.dad-urolog.uz/api/dashboard/patients/'
const DOCTORS_API_URL = 'https://web.dad-urolog.uz/api/dashboard/doctors/'

// Computed
const selectedDoctorName = computed(() => {
    const doc = doctorsList.value.find(d => d.id === form.doctor)
    return doc ? (doc.name_uz || doc.name) : ''
})

// Methods
const closeModal = () => {
    resetForm()
    dropdownOpen.value = false
    emit('close')
}

const resetForm = () => {
    Object.keys(form).forEach(key => {
        if (key === 'status') {
            form[key] = 'active'
        } else {
            form[key] = ''
        }
    })
    errors.value = {}
    dropdownOpen.value = false
}

const validateForm = () => {
    errors.value = {}

    // F.I.O validation
    if (!form.full_name.trim()) {
        errors.value.full_name = 'F.I.O kiritish majburiy'
    } else if (form.full_name.trim().length < 2) {
        errors.value.full_name = 'F.I.O kamida 2 ta belgidan iborat bo\'lishi kerak'
    }

    // Phone validation
    if (!form.phone.trim()) {
        errors.value.phone = 'Telefon raqami kiritish majburiy'
    } else if (!/^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/.test(form.phone.replace(/\s/g, ''))) {
        errors.value.phone = 'Telefon raqami noto\'g\'ri formatda'
    }

    // Doctor validation
    if (!form.doctor) {
        errors.value.doctor = 'Shifokor tanlash majburiy'
    }

    // Telegram username validation (optional)
    if (form.tg_username && !form.tg_username.startsWith('@')) {
        errors.value.tg_username = 'Telegram username @ belgisi bilan boshlanishi kerak'
    }

    return Object.keys(errors.value).length === 0
}

const formatPhoneNumber = (event) => {
    let value = event.target.value.replace(/\D/g, '')

    // Add +998 prefix if not exists
    if (!value.startsWith('998') && value.length > 0) {
        if (value.startsWith('9')) {
            value = '998' + value
        }
    }

    // Format the number
    if (value.length >= 3) {
        value = value.replace(/^(\d{3})(\d{2})(\d{3})(\d{2})(\d{2}).*/, '+$1 $2 $3 $4 $5')
    } else if (value.length > 0) {
        value = '+' + value
    }

    form.phone = value
}

const formatTelegramUsername = (event) => {
    let value = event.target.value

    // Add @ if not exists and there's content
    if (value && !value.startsWith('@')) {
        value = '@' + value.replace(/^@+/, '')
    }

    // Remove invalid characters
    value = value.replace(/[^@a-zA-Z0-9_]/g, '')

    form.tg_username = value
}

const toggleDropdown = () => {
    dropdownOpen.value = !dropdownOpen.value
}

const selectDoctor = (doctor) => {
    form.doctor = doctor.id
    dropdownOpen.value = false
}

const selectStatus = (status) => {
    form.status = status
}

const fetchDoctorsList = async () => {
    try {
        const response = await fetch(DOCTORS_API_URL)
        const result = await response.json()
        
        if (result.status && result.data) {
            doctorsList.value = result.data?.results ?? result.data ?? []
        }
    } catch (error) {
        console.error('Shifokorlar ro\'yxati olishda xatolik:', error)
    }
}

const submitForm = async () => {
    if (!validateForm()) {
        return
    }

    loading.value = true

    try {
        // Prepare data for API
        const formData = {
            full_name: form.full_name.trim(),
            phone: form.phone.replace(/\s/g, ''), // Remove spaces for API
            doctor: form.doctor,
            tg_username: form.tg_username || null,
            status: form.status,
            notes: form.notes.trim() || null
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })

        const result = await response.json()

        if (response.ok && result.status) {
            emit('success', result.data)
            closeModal()
        } else {
            // Handle API errors
            if (result.errors) {
                errors.value = result.errors
            } else {
                console.error('API Error:', result.message)
                errors.value.general = result.message || 'Xatolik yuz berdi'
            }
        }
    } catch (error) {
        console.error('Network Error:', error)
        errors.value.general = 'Tarmoq xatoligi yuz berdi'
    } finally {
        loading.value = false
    }
}

// Lifecycle hooks
onMounted(() => {
    fetchDoctorsList()
})

// Watch for modal opening to reset form
watch(() => props.isOpen, (newValue) => {
    if (newValue) {
        resetForm()
    }
})

// Close modal with Escape key
const handleKeydown = (event) => {
    if (event.key === 'Escape' && props.isOpen) {
        closeModal()
    }
}

onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-overlay.show {
    opacity: 1;
    visibility: visible;
}

.modal {
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 25px 50px rgba(15, 23, 42, 0.25);
    max-width: 520px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    transform: scale(0.9) translateY(20px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-overlay.show .modal {
    transform: scale(1) translateY(0);
}

/* Header */
.modal-header {
    padding: 24px 24px 16px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: #1e293b;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.close-btn {
    background: #f8fafc;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #64748b;
    transition: all 0.2s ease;
}

.close-btn:hover {
    background: #fee2e2;
    color: #dc2626;
    transform: scale(1.05);
}

/* Body */
.modal-body {
    padding: 24px;
}

.form-group {
    margin-bottom: 24px;
}

label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #374151;
    font-size: 14px;
}

.required {
    color: #ef4444;
}

/* Input Styles */
input, textarea {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 14px;
    transition: all 0.2s ease;
    background: #fafafa;
}

input:focus, textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    background: #ffffff;
}

input.error, textarea.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}

/* Custom Dropdown */
.custom-dropdown {
    position: relative;
    background: #fafafa;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.custom-dropdown:hover {
    border-color: #d1d5db;
}

.custom-dropdown.open {
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    background: #ffffff;
}

.custom-dropdown.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}

.selected {
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    color: #374151;
}

.dropdown-icon {
    font-size: 12px;
    color: #9ca3af;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-dropdown.open .dropdown-icon {
    transform: rotate(180deg);
}

.dropdown-list {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    width: 100%;
    max-height: 200px;
    overflow-y: auto;
    background: #ffffff;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    z-index: 1001;
    animation: dropdownSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes dropdownSlide {
    from {
        opacity: 0;
        transform: translateY(-8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.dropdown-item {
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid #f8fafc;
}

.dropdown-item:last-child {
    border-bottom: none;
}

.dropdown-item:hover {
    background: #f8fafc;
    transform: translateX(4px);
}

.doctor-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.doctor-name {
    font-weight: 500;
    color: #374151;
}

.doctor-specialty {
    font-size: 12px;
    color: #9ca3af;
}

/* Status Selector */
.status-selector {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

.status-option {
    flex: 1;
    min-width: 120px;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    background: #fafafa;
}

.status-option:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.status-option.active {
    background: #ffffff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.status-option.active i {
    transform: scale(1.1);
}

.status-option.active {
    border-color: #10b981;
    color: #10b981;
}

.status-option.inactive.active {
    border-color: #ef4444;
    color: #ef4444;
}

.status-option.pending.active {
    border-color: #f59e0b;
    color: #f59e0b;
}

/* General Error */
.general-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
    color: #991b1b;
}

/* Error Message */
.error-message {
    margin-top: 6px;
    font-size: 13px;
    color: #ef4444;
    display: flex;
    align-items: center;
    gap: 6px;
    animation: errorSlide 0.3s ease;
}

@keyframes errorSlide {
    from {
        opacity: 0;
        transform: translateY(-4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Footer */
.modal-footer {
    padding: 16px 24px 24px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    border-top: 1px solid #f1f5f9;
}

/* Buttons */
.btn {
    padding: 12px 24px;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
}

.btn-secondary {
    background: #f8fafc;
    color: #64748b;
    border: 2px solid #e2e8f0;
}

.btn-secondary:hover {
    background: #f1f5f9;
    transform: translateY(-1px);
}

.btn-primary {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

/* Scrollbar */
::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Responsive */
@media (max-width: 640px) {
    .modal {
        margin: 16px;
        width: calc(100% - 32px);
    }
    
    .status-selector {
        flex-direction: column;
    }
    
    .status-option {
        min-width: auto;
    }
    
    .modal-footer {
        flex-direction: column-reverse;
    }
    
    .btn {
        width: 100%;
        justify-content: center;
    }
}
</style>