import { ref } from 'vue'

const modalState = ref({
  isVisible: false,
  type: 'info',
  title: '',
  message: '',
  confirmText: 'OK',
  cancelText: 'Cancel',
  closeOnOverlay: true,
  onConfirm: null,
  onCancel: null
})

export function useModal() {
  const showModal = (options) => {
    modalState.value = {
      isVisible: true,
      type: options.type || 'info',
      title: options.title || 'Information',
      message: options.message || '',
      confirmText: options.confirmText || 'OK',
      cancelText: options.cancelText || 'Cancel',
      closeOnOverlay: options.closeOnOverlay !== false,
      onConfirm: options.onConfirm || null,
      onCancel: options.onCancel || null
    }
    
    return new Promise((resolve) => {
      modalState.value.resolve = resolve
    })
  }

  const hideModal = () => {
    modalState.value.isVisible = false
  }

  const handleConfirm = () => {
    if (modalState.value.onConfirm) {
      modalState.value.onConfirm()
    }
    if (modalState.value.resolve) {
      modalState.value.resolve(true)
    }
    hideModal()
  }

  const handleCancel = () => {
    if (modalState.value.onCancel) {
      modalState.value.onCancel()
    }
    if (modalState.value.resolve) {
      modalState.value.resolve(false)
    }
    hideModal()
  }

  const handleClose = () => {
    if (modalState.value.resolve) {
      modalState.value.resolve(false)
    }
    hideModal()
  }

  // Convenience methods
  const showAlert = (message, title = 'Alert') => {
    return showModal({
      type: 'info',
      title,
      message,
      confirmText: 'OK'
    })
  }

  const showSuccess = (message, title = 'Success') => {
    return showModal({
      type: 'success',
      title,
      message,
      confirmText: 'OK'
    })
  }

  const showError = (message, title = 'Error') => {
    return showModal({
      type: 'error',
      title,
      message,
      confirmText: 'OK'
    })
  }

  const showWarning = (message, title = 'Warning') => {
    return showModal({
      type: 'warning',
      title,
      message,
      confirmText: 'OK'
    })
  }

  const showConfirm = (message, title = 'Confirm', options = {}) => {
    return showModal({
      type: 'confirm',
      title,
      message,
      confirmText: options.confirmText || 'Yes',
      cancelText: options.cancelText || 'No',
      ...options
    })
  }

  return {
    modalState,
    showModal,
    hideModal,
    handleConfirm,
    handleCancel,
    handleClose,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showConfirm
  }
}