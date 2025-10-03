<template>
  <div v-if="isVisible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <div class="modal-icon" :class="iconClass">
          <component :is="iconComponent" />
        </div>
        <h3 class="modal-title">{{ title }}</h3>
        <button class="modal-close" @click="close">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <p>{{ message }}</p>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button 
          v-if="type === 'confirm'" 
          class="btn btn-secondary" 
          @click="cancel"
        >
          {{ cancelText }}
        </button>
        <button 
          class="btn" 
          :class="confirmButtonClass"
          @click="confirm"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'info', // 'info', 'success', 'warning', 'error', 'confirm'
    validator: (value) => ['info', 'success', 'warning', 'error', 'confirm'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'OK'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  closeOnOverlay: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['confirm', 'cancel', 'close'])

// Computed properties for styling
const iconClass = computed(() => {
  const classes = {
    info: 'icon-info',
    success: 'icon-success',
    warning: 'icon-warning',
    error: 'icon-error',
    confirm: 'icon-confirm'
  }
  return classes[props.type] || 'icon-info'
})

const confirmButtonClass = computed(() => {
  const classes = {
    info: 'btn-primary',
    success: 'btn-success',
    warning: 'btn-warning',
    error: 'btn-danger',
    confirm: 'btn-danger'
  }
  return classes[props.type] || 'btn-primary'
})

const iconComponent = computed(() => {
  const icons = {
    info: 'InfoIcon',
    success: 'CheckIcon',
    warning: 'WarningIcon',
    error: 'ErrorIcon',
    confirm: 'QuestionIcon'
  }
  return icons[props.type] || 'InfoIcon'
})

// Methods
const close = () => {
  emit('close')
}

const confirm = () => {
  emit('confirm')
}

const cancel = () => {
  emit('cancel')
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    close()
  }
}
</script>

<script>
import { h } from 'vue'

// Icon components
const InfoIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '24',
      height: '24',
      fill: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'
      })
    ])
  }
}

const CheckIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '24',
      height: '24',
      fill: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        d: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'
      })
    ])
  }
}

const WarningIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '24',
      height: '24',
      fill: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        d: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z'
      })
    ])
  }
}

const ErrorIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '24',
      height: '24',
      fill: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        d: 'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z'
      })
    ])
  }
}

const QuestionIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '24',
      height: '24',
      fill: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z'
      })
    ])
  }
}

export default {
  components: {
    InfoIcon,
    CheckIcon,
    WarningIcon,
    ErrorIcon,
    QuestionIcon
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  backdrop-filter: blur(2px);
}

.modal-container {
  background: white;
  border-radius: 12px;
  min-width: 320px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: modalEnter 0.3s ease-out;
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
}

.modal-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
}

.icon-info {
  background: #dbeafe;
  color: #1e40af;
}

.icon-success {
  background: #dcfce7;
  color: #166534;
}

.icon-warning {
  background: #fef3c7;
  color: #92400e;
}

.icon-error {
  background: #fee2e2;
  color: #991b1b;
}

.icon-confirm {
  background: #fef3c7;
  color: #92400e;
}

.modal-title {
  flex: 1;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  color: #6b7280;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

/* Mobile adjustments */
@media (max-width: 480px) {
  .modal-container {
    width: 95%;
    min-width: 300px;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
  
  .modal-title {
    font-size: 1.1rem;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>