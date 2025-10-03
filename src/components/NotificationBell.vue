<template>
  <div class="notification-bell" v-click-outside="closeDropdown">
    <button @click="toggleDropdown" class="bell-button" :class="{ 'has-notifications': unreadCount > 0, 'shake': shouldShake }">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
      </svg>
      <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </button>
    
    <Transition name="dropdown">
      <div v-if="showDropdown" class="dropdown">
        <div class="dropdown-header">
          <h4>Notifications</h4>
          <div class="header-actions">
            <button 
              v-if="unreadCount > 0" 
              @click="handleMarkAllAsRead" 
              class="mark-all-read"
              title="Mark all as read"
            >
              Mark all as read
            </button>
            <button 
              v-if="notifications.filter(n => n.read).length > 0" 
              @click="handleCleanupRead" 
              class="cleanup-read"
              title="Clear read notifications"
            >
              Clear read
            </button>
          </div>
        </div>
        
        <div class="notifications-list">
          <div 
            v-for="notification in displayedNotifications" 
            :key="notification.id"
            class="notification-item"
            :class="{ 'unread': !notification.read }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-content">
              <div class="notification-header">
                <h5>{{ notification.title }}</h5>
                <div class="notification-time">{{ formatDate(notification.createdAt) }}</div>
              </div>
              <p>{{ notification.message }}</p>
              <div v-if="notification.transactionData" class="transaction-preview">
                <span class="transaction-amount" :class="getAmountClass(notification.transactionData.type)">
                  €{{ notification.transactionData.amount }}
                </span>
                <span class="transaction-category">{{ notification.transactionData.category }}</span>
              </div>
            </div>
            <div v-if="!notification.read" class="unread-dot"></div>
          </div>
          
          <div v-if="notifications.length === 0" class="no-notifications">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
            <p>No notifications</p>
          </div>

          <div v-if="notifications.length > 10" class="show-more">
            <button @click="showMore = !showMore" class="show-more-btn">
              {{ showMore ? 'Show less' : `Show ${Math.min(notifications.length - 10, 40)} more notifications` }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useInAppNotifications } from '../composables/useInAppNotifications'

const { notifications, unreadCount, markAsRead, markAllAsRead, deleteAllReadNotifications } = useInAppNotifications()
const showDropdown = ref(false)
const showMore = ref(false)
const shouldShake = ref(false)

// Watch per animare quando aumenta il contatore non lette
watch(unreadCount, (newCount, oldCount) => {
  if (newCount > oldCount && newCount > 0) {
    shouldShake.value = true
    setTimeout(() => {
      shouldShake.value = false
    }, 1000)
  }
})

const displayedNotifications = computed(() => {
  if (showMore.value) {
    // Mostra massimo 50 notifiche anche quando "show more" è attivo
    return notifications.value.slice(0, 50)
  }
  return notifications.value.slice(0, 10)
})

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function closeDropdown() {
  showDropdown.value = false
  showMore.value = false
}

async function handleNotificationClick(notification) {
  if (!notification.read) {
    await markAsRead(notification.id)
  }
}

async function handleMarkAllAsRead() {
  await markAllAsRead()
}

async function handleCleanupRead() {
  await deleteAllReadNotifications()
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  
  let date
  if (timestamp.toDate) {
    date = timestamp.toDate()
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000)
  } else {
    date = new Date(timestamp)
  }
  
  const now = new Date()
  const diffInHours = (now - date) / (1000 * 60 * 60)
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    return diffInMinutes <= 1 ? 'Now' : `${diffInMinutes}m ago`
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`
  } else if (diffInHours < 48) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: '2-digit',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

function getAmountClass(type) {
  switch (type) {
    case 'income':
      return 'amount-income'
    case 'spend':
      return 'amount-spend'
    case 'savings':
      return 'amount-savings'
    default:
      return 'amount-spend'
  }
}

// Direttiva personalizzata per gestire i click fuori dal componente
const vClickOutside = {
  beforeMount(el, binding) {
    el.clickOutsideEvent = function(event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
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
.notification-bell {
  position: relative;
  z-index: 1000;
}

.bell-button {
  position: relative;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
}

.bell-button:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.bell-button.has-notifications {
  color: #3b82f6;
}

.bell-button.has-notifications:hover {
  background-color: #eff6ff;
}

.badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 380px;
  max-height: 500px;
  overflow: hidden;
  z-index: 1001;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  background: #f9fafb;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.dropdown-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.mark-all-read,
.cleanup-read {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.mark-all-read:hover,
.cleanup-read:hover {
  background-color: #eff6ff;
  color: #2563eb;
}

.cleanup-read {
  color: #6b7280;
}

.cleanup-read:hover {
  background-color: #f3f4f6;
  color: #4b5563;
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s ease;
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.notification-item:hover {
  background-color: #f9fafb;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item.unread {
  background-color: #eff6ff;
}

.notification-content {
  flex: 1;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.notification-content h5 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.notification-time {
  font-size: 0.75rem;
  color: #9ca3af;
  white-space: nowrap;
}

.notification-content p {
  margin: 0 0 0.75rem 0;
  font-size: 0.8125rem;
  color: #6b7280;
  line-height: 1.4;
}

.transaction-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 6px;
  border-left: 3px solid #e5e7eb;
}

.transaction-amount {
  font-weight: 600;
  font-size: 0.875rem;
}

.amount-income {
  color: #059669;
}

.amount-spend {
  color: #dc2626;
}

.amount-savings {
  color: #d97706;
}

.transaction-category {
  font-size: 0.75rem;
  color: #6b7280;
  background: #e5e7eb;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: #3b82f6;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.no-notifications {
  padding: 3rem 2rem;
  text-align: center;
  color: #9ca3af;
}

.no-notifications svg {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-notifications p {
  margin: 0;
  font-size: 0.875rem;
}

.show-more {
  padding: 0.75rem 1rem;
  border-top: 1px solid #f3f4f6;
  background: #f9fafb;
}

.show-more-btn {
  width: 100%;
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.show-more-btn:hover {
  background-color: #eff6ff;
}

/* Animazioni */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

.bell-button.shake {
  animation: shake 0.6s ease-in-out;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .bell-button {
    min-width: 48px;
    min-height: 48px;
    padding: 0.75rem;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
  }
  
  .bell-button svg {
    width: 24px;
    height: 24px;
  }
  
  .bell-button:hover {
    background-color: #f1f5f9;
    border-color: #cbd5e1;
  }
  
  .bell-button.has-notifications {
    background-color: #eff6ff;
    border-color: #bfdbfe;
    color: #2563eb;
  }
  
  .bell-button.has-notifications:hover {
    background-color: #dbeafe;
    border-color: #93c5fd;
  }
  
  .badge {
    top: 4px;
    right: 4px;
    min-width: 20px;
    height: 20px;
    font-size: 0.8rem;
    font-weight: 700;
  }
  
  .dropdown {
    width: 300px;
    right: -120px;
    right: 0;
    max-height: 70vh;
  }
}

@media (max-width: 640px) {
  .bell-button {
    min-width: 50px;
    min-height: 50px;
    padding: 0.875rem;
  }
  
  .bell-button svg {
    width: 26px;
    height: 26px;
  }
  
  .badge {
    top: 2px;
    right: 2px;
    min-width: 22px;
    height: 22px;
    font-size: 0.85rem;
  }
  
  .dropdown {
    width: 280px;
    right: -140px;
  }
}

@media (max-width: 480px) {
  .dropdown {
    width: calc(100vw - 20px);
    right: auto;
    left: -270px;
    right: 0;
    max-height: 60vh;
  }
  
  .notification-item {
    padding: 0.75rem;
  }
  
  .notification-content h5 {
    font-size: 0.8125rem;
  }
  
  .notification-content p {
    font-size: 0.75rem;
  }
  
  .transaction-preview {
    padding: 0.375rem;
  }
  
  .transaction-amount {
    font-size: 0.8125rem;
  }
  
  .transaction-category {
    font-size: 0.7rem;
  }
}

/* Scrollbar personalizzata */
.notifications-list::-webkit-scrollbar {
  width: 4px;
}

.notifications-list::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.notifications-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.notifications-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
