<template>
  <div class="settings-dropdown" v-click-outside="closeDropdown">
    <button @click="toggleDropdown" class="settings-button" title="Settings">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
      </svg>
    </button>
    
    <Transition name="dropdown">
      <div v-if="showDropdown" class="dropdown">
        <div class="dropdown-header">
          <h4>Settings</h4>
          <div v-if="props.user" class="user-info">
            {{ props.user.displayName || props.user.email || 'User' }}
          </div>
        </div>
        
        <div class="settings-list">
          <button @click="handleLogout" class="settings-item logout-item">
            <span style="display: flex; align-items: center; gap: 0.75rem; min-width: 0;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 13v-2H7V8l-5 4 5 4v-3z"/>
                <path d="M20 3h-9c-1.103 0-2 .897-2 2v4h2V5h9v14h-9v-4H9v4c0 1.103.897 2 2 2h9c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2z"/>
              </svg>
              <span style="white-space: nowrap;">Logout</span>
            </span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

// Props
const props = defineProps({
  user: {
    type: Object,
    default: null
  }
})

const showDropdown = ref(false)

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const closeDropdown = () => {
  showDropdown.value = false
}

const handleLogout = async () => {
  try {
    await signOut(auth)
    closeDropdown()
  } catch (error) {
    console.error('Error logging out:', error)
  }
}

// Click outside directive
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = function(event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}
</script>

<style scoped>
.settings-dropdown {
  position: relative;
  display: inline-block;
}

.settings-button {
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.625rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  width: 44px;
  height: 44px;
}

.settings-button:hover {
  background: #4b5563;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
}

.settings-button svg {
  width: 16px;
  height: 16px;
}

.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  width: 280px;
  z-index: 1000;
  overflow: hidden;
}

.dropdown-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
  background: #f9fafb;
}

.dropdown-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.user-info {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.settings-list {
  padding: 0.5rem 0;
}

.settings-item {
  width: 100%;
  padding: 0.875rem 1.25rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #374151;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.settings-item:hover {
  background: #f3f4f6;
}

.logout-item {
  color: #ef4444;
}

.logout-item:hover {
  background: #fef2f2;
  color: #dc2626;
}

.logout-item svg {
  width: 16px;
  height: 16px;
}

/* Dropdown transitions */
.dropdown-enter-active, .dropdown-leave-active {
  transition: all 0.2s ease;
  transform-origin: top right;
}

.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

.dropdown-enter-to, .dropdown-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .settings-button {
    min-width: 52px;
    min-height: 52px;
    width: 52px;
    height: 52px;
    padding: 0.75rem;
  }
  
  .settings-button svg {
    width: 24px;
    height: 24px;
  }
  
  .dropdown {
    width: 280px;
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  .dropdown {
    width: 260px;
    right: 0;
  }
  
  .settings-item {
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
    white-space: nowrap;
  }
}
</style>