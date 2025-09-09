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
                        <input
                            id="full_name"
                            v-model="form.full_name"
                            type="text"
                            placeholder="Familiya Ism Sharif"
                            :class="{ error: errors.full_name }"
                            maxlength="255"
                        />
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
                        <input
                            id="phone"
                            v-model="form.phone"
                            type="tel"
                            placeholder="+998 90 123 45 67"
                            :class="{ error: errors.phone }"
                            maxlength="20"
                            @input="formatPhoneNumber"
                        />
                        <div v-if="errors.phone" class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            {{ errors.phone }}
                        </div>
                    </div>

                    <!-- Tug'ilgan sana va Asosiy shifokor -->
                    <div class="form-group">
                        <div class="form-row">
                            <div class="form-col">
                                <label for="birth_date">Tug'ilgan sana</label>
                                <input
                                    id="birth_date"
                                    v-model="form.birth_date"
                                    type="date"
                                    :class="{ error: errors.birth_date }"
                                />
                                <div v-if="errors.birth_date" class="error-message">
                                    <i class="fas fa-exclamation-circle"></i>
                                    {{ errors.birth_date }}
                                </div>
                            </div>
                            <div class="form-col">
                                <label for="doctor">Asosiy shifokor</label>
                                <select
                                    id="doctor"
                                    v-model="form.doctor"
                                    :class="{ error: errors.doctor }"
                                >
                                    <option value="">Shifokor tanlang</option>
                                    <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
                                        {{ doctor.full_name }}
                                    </option>
                                </select>
                                <div v-if="errors.doctor" class="error-message">
                                    <i class="fas fa-exclamation-circle"></i>
                                    {{ errors.doctor }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Telegram username -->
                    <div class="form-group">
                        <label for="tg_username">Telegram Username</label>
                        <input
                            id="tg_username"
                            v-model="form.tg_username"
                            type="text"
                            placeholder="@username"
                            :class="{ error: errors.tg_username }"
                            maxlength="50"
                            @input="formatTelegramUsername"
                        />
                        <div v-if="errors.tg_username" class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            {{ errors.tg_username }}
                        </div>
                    </div>

                    <!-- Holat -->
                    <div class="form-group">
                        <label for="status">Holati</label>
                        <select
                            id="status"
                            v-model="form.status"
                            :class="{ error: errors.status }"
                        >
                            <option value="active">Faol</option>
                            <option value="inactive">Nofaol</option>
                            <option value="pending">Kutilmoqda</option>
                        </select>
                        <div v-if="errors.status" class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            {{ errors.status }}
                        </div>
                    </div>

                    <!-- Qo'shimcha izoh -->
                    <div class="form-group">
                        <label for="notes">Qo'shimcha izoh</label>
                        <textarea
                            id="notes"
                            v-model="form.notes"
                            placeholder="Bemor haqida qo'shimcha ma'lumotlar..."
                            :class="{ error: errors.notes }"
                            rows="4"
                        ></textarea>
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
                <button 
                    type="button" 
                    class="btn btn-primary" 
                    @click="submitForm"
                    :disabled="loading"
                >
                    <i class="fas fa-spinner fa-spin" v-if="loading"></i>
                    <i class="fas fa-save" v-else></i>
                    {{ loading ? 'Saqlanmoqda...' : 'Saqlash' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
// Props
const props = defineProps({
    isOpen: {
        type: Boolean,
        default: false
    }
})

// Emits
const emit = defineEmits(['close', 'success'])

// Reactive data
const loading = ref(false)
const doctors = ref([])

// Form data
const form = reactive({
    full_name: '',
    phone: '',
    birth_date: '',
    doctor: '',
    tg_username: '',
    status: 'active',
    notes: ''
})

// Error handling
const errors = ref({})

// API URL
const API_URL = 'https://web.dad-urolog.uz/api/dashboard/patients/'
const DOCTORS_API_URL = 'https://web.dad-urolog.uz/api/dashboard/doctors/'

// Methods
const closeModal = () => {
    resetForm()
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
    
    // Birth date validation (optional but if provided, should be valid)
    if (form.birth_date) {
        const birthDate = new Date(form.birth_date)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear()
        
        if (birthDate > today) {
            errors.value.birth_date = 'Tug\'ilgan sana bugungi kundan katta bo\'lishi mumkin emas'
        } else if (age > 120) {
            errors.value.birth_date = 'Yosh 120 dan katta bo\'lishi mumkin emas'
        }
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
            birth_date: form.birth_date || null,
            doctor: form.doctor || null,
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
                // Show general error
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

const fetchDoctors = async () => {
    try {
        const response = await fetch(DOCTORS_API_URL)
        const result = await response.json()
        
        if (result.status && result.data) {
            doctors.value = result.data
        }
    } catch (error) {
        console.error('Shifokorlarni yuklashda xatolik:', error)
    }
}

// Lifecycle hooks
onMounted(() => {
    fetchDoctors()
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