import { ref } from 'vue'

// Stato globale per i toast
const toasts = ref([])
let toastIdCounter = 0

export function useToast() {
  function showToast(message, type = 'info', duration = 4000) {
    // Evita duplicati controllando se esiste già un toast con lo stesso messaggio
    const existingToast = toasts.value.find(t => t.message === message && t.visible)
    if (existingToast) {
      return existingToast.id
    }

    const id = ++toastIdCounter
    const toast = {
      id,
      message,
      type,
      visible: true
    }
    
    toasts.value.push(toast)
    
    // Auto-remove dopo duration
    setTimeout(() => {
      removeToast(id)
    }, duration)
    
    return id
  }
  
  function removeToast(id) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value[index].visible = false
      // Rimuovi completamente dopo l'animazione
      setTimeout(() => {
        const finalIndex = toasts.value.findIndex(t => t.id === id)
        if (finalIndex > -1) {
          toasts.value.splice(finalIndex, 1)
        }
      }, 300)
    }
  }
  
  function showNotificationToast(notificationData) {
    const message = `${notificationData.title}: ${notificationData.message}`
    return showToast(message, 'notification', 5000)
  }
  
  // Convenience functions for common toast types
  function showSuccess(message, duration = 4000) {
    return showToast(message, 'success', duration)
  }
  
  function showError(message, duration = 4000) {
    return showToast(message, 'error', duration)
  }
  
  function showInfo(message, duration = 4000) {
    return showToast(message, 'info', duration)
  }
  
  return {
    toasts, // Restituisco il ref direttamente
    showToast,
    removeToast,
    showNotificationToast,
    showSuccess,
    showError,
    showInfo
  }
}