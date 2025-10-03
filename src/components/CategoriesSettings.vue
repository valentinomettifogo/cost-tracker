<template>
  <div class="categories-management p-2">
    <div class="section-header px-4 pt-2">
      <p>Organize your categories by type. Default categories cannot be deleted.</p>
    </div>

    <div v-if="loading" class="loading">
      Loading categories...
    </div>

    <div v-else class="categories-sections">
      <!-- Income Categories -->
      <div class="category-section">
        <div class="section-title">
          <h4>Income Categories 📈</h4>
          <button @click="showAddForm('income')" class="add-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
            Add Income Category
          </button>
        </div>
        
        <div class="categories-list">
          <div v-for="category in incomeCategories" :key="category.id" class="category-item">
            <div class="category-info">
              <span class="category-name">{{ category.name }}</span>
              <span v-if="isGlobalCategory(category)" class="default-badge">Default</span>
            </div>
            <div class="category-actions">
              <button 
                v-if="!isGlobalCategory(category)" 
                @click="startEdit(category)" 
                class="edit-btn"
                title="Edit category"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-2.54-2.54a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
              <button 
                v-if="!isGlobalCategory(category)" 
                @click="deleteCategory(category)" 
                class="delete-btn"
                title="Delete category"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 6h18v2H3V6zm2 3h14l-1.5 12.5c-.1.8-.8 1.5-1.6 1.5H8.1c-.8 0-1.5-.7-1.6-1.5L5 9zm5 2v8h2v-8h-2zm4 0v8h2v-8h-2zm-8 0v8h2v-8H6z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Spend Categories -->
      <div class="category-section">
        <div class="section-title">
          <h4>Spend Categories 📉</h4>
          <button @click="showAddForm('spend')" class="add-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
            Add Spend Category
          </button>
        </div>
        
        <div class="categories-list">
          <div v-for="category in spendCategories" :key="category.id" class="category-item">
            <div class="category-info">
              <span class="category-name">{{ category.name }}</span>
              <span v-if="isGlobalCategory(category)" class="default-badge">Default</span>
            </div>
            <div class="category-actions">
              <button 
                v-if="!isGlobalCategory(category)" 
                @click="startEdit(category)" 
                class="edit-btn"
                title="Edit category"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-2.54-2.54a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
              <button 
                v-if="!isGlobalCategory(category)" 
                @click="deleteCategory(category)" 
                class="delete-btn"
                title="Delete category"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 6h18v2H3V6zm2 3h14l-1.5 12.5c-.1.8-.8 1.5-1.6 1.5H8.1c-.8 0-1.5-.7-1.6-1.5L5 9zm5 2v8h2v-8h-2zm4 0v8h2v-8h-2zm-8 0v8h2v-8H6z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Savings Categories -->
      <div class="category-section">
        <div class="section-title">
          <h4>Savings Categories 💰</h4>
          <button @click="showAddForm('savings')" class="add-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
            Add Savings Category
          </button>
        </div>
        
        <div class="categories-list">
          <div v-for="category in savingsCategories" :key="category.id" class="category-item">
            <div class="category-info">
              <span class="category-name">{{ category.name }}</span>
              <span v-if="isGlobalCategory(category)" class="default-badge">Default</span>
            </div>
            <div class="category-actions">
              <button 
                v-if="!isGlobalCategory(category)" 
                @click="startEdit(category)" 
                class="edit-btn"
                title="Edit category"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-2.54-2.54a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
              <button 
                v-if="!isGlobalCategory(category)" 
                @click="deleteCategory(category)" 
                class="delete-btn"
                title="Delete category"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 6h18v2H3V6zm2 3h14l-1.5 12.5c-.1.8-.8 1.5-1.6 1.5H8.1c-.8 0-1.5-.7-1.6-1.5L5 9zm5 2v8h2v-8h-2zm4 0v8h2v-8h-2zm-8 0v8h2v-8H6z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Form Modal -->
    <div v-if="showForm" class="modal-overlay" @click="closeForm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>{{ editingCategory ? 'Edit' : 'Add' }} {{ formType }} Category</h4>
          <button @click="closeForm" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="submitForm" class="modal-body">
          <div class="form-group">
            <label for="categoryName">Category Name</label>
            <input 
              id="categoryName"
              v-model="formData.name" 
              type="text" 
              placeholder="Enter category name"
              maxlength="50"
              required
            />
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeForm" class="cancel-btn">Cancel</button>
            <button type="submit" class="save-btn" :disabled="!formData.name.trim()">
              {{ editingCategory ? 'Update' : 'Add' }} Category
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCategories } from '../composables/useCategories'
import { useModal } from '../composables/useModal'
import { useAuth } from '../composables/useAuth'

const { user } = useAuth()
const { showConfirm } = useModal()

const {
  globalCategories,
  userCustomCategories,
  allCategories,
  loading,
  incomeCategories,
  spendCategories,
  savingsCategories,
  initCategories,
  addCategory,
  updateCategory,
  deleteCategory: deleteCategoryFn
} = useCategories(user.value?.uid)

// Helper function to check if a category is global (default)
const isGlobalCategory = (category) => {
  return globalCategories.value.some(global => global.name === category.name && global.type === category.type)
}

// Form state
const showForm = ref(false)
const formType = ref('')
const editingCategory = ref(null)
const formData = ref({
  name: ''
})

onMounted(() => {
  if (user.value?.uid) {
    initCategories()
  }
})

// Show add form
const showAddForm = (type) => {
  formType.value = type
  editingCategory.value = null
  formData.value.name = ''
  showForm.value = true
}

// Start editing
const startEdit = (category) => {
  formType.value = category.type
  editingCategory.value = category
  formData.value.name = category.name
  showForm.value = true
}

// Close form
const closeForm = () => {
  showForm.value = false
  editingCategory.value = null
  formData.value.name = ''
}

// Submit form
const submitForm = async () => {
  const name = formData.value.name.trim()
  if (!name) return

  let success = false
  
  if (editingCategory.value) {
    success = await updateCategory(editingCategory.value.id, name)
  } else {
    success = await addCategory(name, formType.value)
  }
  
  if (success) {
    closeForm()
  }
}

// Delete category with confirmation
const deleteCategory = async (category) => {
  const confirmed = await showConfirm(
    `Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`,
    'Delete Category',
    {
      confirmText: 'Delete',
      cancelText: 'Cancel'
    }
  )
  
  if (confirmed) {
    await deleteCategoryFn(category.id)
  }
}
</script>

<style scoped>
.categories-management {
  max-width: 800px;
  margin: 0 auto;
}

.section-header {
  margin-bottom: 2rem;
}

.section-header h3 {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 1.5rem;
}

.section-header p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.categories-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.category-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.section-title h4 {
  margin: 0;
  color: #374151;
  font-size: 1.125rem;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-btn:hover {
  background: #059669;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.category-item:hover {
  background: #f3f4f6;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.category-name {
  font-weight: 500;
  color: #374151;
}

.default-badge {
  background: #dbeafe;
  color: #1e40af;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.category-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn, .delete-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.edit-btn {
  color: #6b7280;
}

.edit-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.delete-btn {
  color: #ef4444;
}

.delete-btn:hover {
  background: #fef2f2;
  color: #dc2626;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h4 {
  margin: 0;
  color: #374151;
  font-size: 1.125rem;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.save-btn {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-btn:hover:not(:disabled) {
  background: #2563eb;
}

.save-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .categories-management {
    padding: 0 1rem;
  }
  
  .category-section {
    padding: 1rem;
  }
  
  .section-title {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .add-btn {
    justify-content: center;
  }
  
  .category-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .category-actions {
    justify-content: center;
  }
  
  .modal-content {
    margin: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .cancel-btn, .save-btn {
    width: 100%;
  }
}
</style>
