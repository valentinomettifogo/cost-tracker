import { ref } from 'vue'

// Global state for categories settings modal
const showCategoriesModal = ref(false)

export function useCategoriesModal() {
  const openCategoriesModal = () => {
    showCategoriesModal.value = true
  }

  const closeCategoriesModal = () => {
    showCategoriesModal.value = false
  }

  return {
    showCategoriesModal,
    openCategoriesModal,
    closeCategoriesModal
  }
}