import { ref, computed } from 'vue'
import { db } from '../firebase'
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore'
import { useToast } from './useToast'

// Mapping of existing legacy categories to types (for migration)
export const LEGACY_CATEGORY_MAPPING = {
  // Income categories
  'Paycheck': 'income',
  
  // Spend categories  
  'Mortgage': 'spend',
  'Restaurant': 'spend',
  'Bills': 'spend',
  'Health': 'spend',
  'Transportation': 'spend',
  'Entertainment': 'spend',
  'Groceries': 'spend',
  'Parents': 'spend',
  'Clothing/Accessories': 'spend',
  'Lunch @ work': 'spend',
  'Home': 'spend',
  'Travel': 'spend',
  'Utilities': 'spend',
  
  // Savings categories
  'Savings': 'savings'
}

// Global default categories (shared across all users) - Based on your existing categories
export const GLOBAL_DEFAULT_CATEGORIES = {
  income: [
    'Paycheck'
  ],
  spend: [
    'Mortgage',
    'Restaurant', 
    'Bills',
    'Health',
    'Transportation',
    'Entertainment',
    'Groceries',
    'Parents',
    'Clothing/Accessories',
    'Lunch @ work',
    'Home',
    'Travel',
    'Utilities'
  ],
  savings: [
    'Savings'
  ]
}

// Additional default categories for new users (can be added to global defaults)
export const ADDITIONAL_DEFAULT_CATEGORIES = {
  income: [
    'Salary',
    'Freelance', 
    'Investment Returns',
    'Gift/Bonus'
  ],
  spend: [
    'Shopping',
    'Dining Out',
    'Healthcare'
  ],
  savings: [
    'Emergency Fund',
    'Vacation',
    'Investment',
    'Retirement'
  ]
}

export function useCategories(userId) {
  const { showSuccess, showError } = useToast()
  
  // Separate state for global defaults and user custom categories
  const globalCategories = ref([])
  const userCustomCategories = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Combined categories (global + user custom)
  const allCategories = computed(() => {
    const combined = [...globalCategories.value, ...userCustomCategories.value]
    // Remove duplicates by name (user custom takes precedence)
    const seen = new Set()
    return combined.filter(cat => {
      const key = `${cat.name.toLowerCase()}_${cat.type}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  })

  // Computed getters for filtering by type
  const incomeCategories = computed(() => 
    allCategories.value.filter(cat => cat.type === 'income')
  )
  
  const spendCategories = computed(() => 
    allCategories.value.filter(cat => cat.type === 'spend')
  )
  
  const savingsCategories = computed(() => 
    allCategories.value.filter(cat => cat.type === 'savings')
  )

  // Get categories by type (for form dropdowns)
  const getCategoriesByType = (type) => {
    return allCategories.value.filter(cat => cat.type === type)
  }

  // Legacy compatibility - expose as userCategories for existing code
  const userCategories = computed(() => allCategories.value)

  // Load global default categories
  const loadGlobalCategories = async () => {
    try {
      const docRef = doc(db, 'apps', 'budget', 'config', 'globalCategories')
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        // Convert global categories to category objects
        const globals = []
        Object.entries(data.categories || {}).forEach(([type, names]) => {
          names.forEach((name, index) => {
            globals.push({
              id: `global_${type}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
              name: name,
              type: type,
              isDefault: true,
              isGlobal: true
            })
          })
        })
        globalCategories.value = globals
      } else {
        // Initialize global categories if they don't exist
        await initializeGlobalCategories()
      }
    } catch (err) {
      console.error('Error loading global categories:', err)
      // Fallback to hardcoded defaults
      globalCategories.value = createGlobalCategoryObjects()
    }
  }

  // Initialize global categories in Firestore (one-time setup)
  const initializeGlobalCategories = async () => {
    try {
      const docRef = doc(db, 'apps', 'budget', 'config', 'globalCategories')
      await setDoc(docRef, {
        categories: GLOBAL_DEFAULT_CATEGORIES,
        createdAt: new Date(),
        version: 1
      })
      globalCategories.value = createGlobalCategoryObjects()
      console.log('Global categories initialized')
    } catch (err) {
      console.error('Error initializing global categories:', err)
    }
  }

  // Create global category objects from hardcoded data
  const createGlobalCategoryObjects = () => {
    const globals = []
    Object.entries(GLOBAL_DEFAULT_CATEGORIES).forEach(([type, names]) => {
      names.forEach((name, index) => {
        globals.push({
          id: `global_${type}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          name: name,
          type: type,
          isDefault: true,
          isGlobal: true
        })
      })
    })
    return globals
  }

  // Load user's custom categories (new structured format)
  const loadUserCustomCategories = async () => {
    if (!userId) return
    
    try {
      const docRef = doc(db, 'apps', 'budget', 'userCategories', userId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        // Convert user custom categories to category objects
        const customs = []
        Object.entries(data.categories || {}).forEach(([type, names]) => {
          names.forEach((name, index) => {
            customs.push({
              id: `custom_${type}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
              name: name,
              type: type,
              isDefault: false,
              isGlobal: false
            })
          })
        })
        userCustomCategories.value = customs
      } else {
        userCustomCategories.value = []
      }
    } catch (err) {
      console.error('Error loading user custom categories:', err)
      userCustomCategories.value = []
    }
  }

  // Load all categories (global + user custom)
  const loadUserCategories = async () => {
    if (!userId) return
    
    loading.value = true
    error.value = null
    
    try {
      // Load global categories first
      await loadGlobalCategories()
      
      // Then load user custom categories
      await loadUserCustomCategories()
      
      // Check if user needs migration from old structure
      await checkAndMigrateOldStructure()
      
    } catch (err) {
      console.error('Error loading categories:', err)
      error.value = 'Failed to load categories'
      showError('Failed to load categories')
    } finally {
      loading.value = false
    }
  }

  // Check and migrate from old structure to new hybrid structure
  const checkAndMigrateOldStructure = async () => {
    if (!userId) return

    try {
      // Check if user has current structure (version 2)
      const userDocRef = doc(db, 'apps', 'budget', 'userCategories', userId)
      const userDocSnap = await getDoc(userDocRef)
      
      if (userDocSnap.exists()) {
        const data = userDocSnap.data()
        
        // Check if user has new structured format (version 2)
        if (data.version === 2 && data.categories && typeof data.categories === 'object') {
          console.log('User already has optimized category structure (v2)')
          return // No migration needed
        }
        
        // If user has old array structure in categories field, skip migration
        // (This should not happen after our migration script)
        if (data.categories && Array.isArray(data.categories)) {
          console.log('Found legacy array structure, but migration already completed')
          return
        }
      }
      
      // Check if user needs migration from transactions (first time user)
      const hasCustomCategories = userCustomCategories.value.length > 0
      if (!hasCustomCategories) {
        await migrateFromTransactions()
      }
    } catch (err) {
      console.error('Error checking/migrating old structure:', err)
    }
  }

  // Migrate categories from existing transactions (for users with no category setup)
  const migrateFromTransactions = async () => {
    if (!userId) return

    try {
      // Get user's existing transactions to extract custom categories
      const transactionsRef = collection(db, 'apps', 'budget', 'transactions')
      const q = query(transactionsRef, where('userId', '==', userId))
      const querySnapshot = await getDocs(q)
      
      const customCategoriesFound = new Set()
      const globalNames = new Set(globalCategories.value.map(cat => cat.name.toLowerCase()))
      
      querySnapshot.docs.forEach(doc => {
        const transaction = doc.data()
        if (transaction.category) {
          const categoryName = transaction.category.toLowerCase()
          // If category is not in global defaults, it's custom
          if (!globalNames.has(categoryName)) {
            customCategoriesFound.add({
              name: transaction.category,
              type: transaction.type || 'spend', // default to spend if type not specified
              createdAt: transaction.date || new Date(),
              isMigrated: true
            })
          }
        }
      })

      // Save found custom categories
      if (customCategoriesFound.size > 0) {
        const customCollectionRef = collection(db, 'apps', 'budget', 'userCategories', userId, 'customCategories')
        
        for (const customCat of customCategoriesFound) {
          await addDoc(customCollectionRef, customCat)
        }
        
        await loadUserCustomCategories()
        console.log(`Migrated ${customCategoriesFound.size} custom categories from transactions`)
      }
    } catch (err) {
      console.error('Error migrating from transactions:', err)
    }
  }

  // DEPRECATED: Old migration function - no longer needed after script migration
  const migrateToHybridStructure = async (oldCategories) => {
    // This function is deprecated - migration already completed with script
    // Categories are now stored in structured format: {income: [], spend: [], savings: []}
    console.log('Migration function deprecated - using structured format')
    return
  }

  // Create default categories for a new user (now just ensures global categories exist)
  const createDefaultCategories = async () => {
    if (!userId) return
    
    try {
      // Global categories are loaded automatically
      // Just ensure we have loaded user's custom categories
      await loadUserCustomCategories()
      
      console.log('Categories ensured for user:', userId)
    } catch (err) {
      console.error('Error ensuring categories:', err)
      error.value = 'Failed to load categories'
      showError('Failed to load categories')
    }
  }

  // Add a new custom category (structured format)
  const addCategory = async (name, type) => {
    if (!userId || !name || !type) return false
    
    // Check if category already exists (in both global and custom)
    const existsInAll = allCategories.value.some(
      cat => cat.name.toLowerCase() === name.toLowerCase() && cat.type === type
    )
    
    if (existsInAll) {
      showError('Category already exists')
      return false
    }

    try {
      const docRef = doc(db, 'apps', 'budget', 'userCategories', userId)
      const docSnap = await getDoc(docRef)
      
      let currentCategories = { income: [], spend: [], savings: [] }
      if (docSnap.exists()) {
        currentCategories = docSnap.data().categories || currentCategories
      }
      
      // Add the new category to the appropriate type array
      if (!currentCategories[type].includes(name.trim())) {
        currentCategories[type].push(name.trim())
      }
      
      // Update the document
      await setDoc(docRef, {
        categories: currentCategories,
        updatedAt: new Date(),
        version: 2
      }, { merge: true })
      
      // Update local state
      await loadUserCustomCategories()
      
      showSuccess(`Category "${name}" added successfully`)
      return true
    } catch (err) {
      console.error('Error adding category:', err)
      showError('Failed to add category')
      return false
    }
  }

  // Update custom category name (structured format)
  const updateCategory = async (categoryId, newName) => {
    if (!userId || !categoryId || !newName) return false
    
    // Only custom categories can be updated (not global ones)
    const category = userCustomCategories.value.find(cat => cat.id === categoryId)
    if (!category) {
      showError('Cannot edit global default categories')
      return false
    }
    
    const oldName = category.name
    const type = category.type

    // Check if new name conflicts with existing categories
    const nameExists = allCategories.value.some(cat => 
      cat.name.toLowerCase() === newName.toLowerCase() && 
      cat.type === type && 
      cat.id !== categoryId
    )
    
    if (nameExists) {
      showError('Category name already exists')
      return false
    }

    try {
      const docRef = doc(db, 'apps', 'budget', 'userCategories', userId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const currentCategories = docSnap.data().categories || {}
        
        // Find and replace the old name with new name in the appropriate type array
        if (currentCategories[type] && currentCategories[type].includes(oldName)) {
          const index = currentCategories[type].indexOf(oldName)
          currentCategories[type][index] = newName.trim()
          
          // Update the document
          await updateDoc(docRef, {
            categories: currentCategories,
            updatedAt: new Date()
          })
          
          // Update local state
          await loadUserCustomCategories()
          
          showSuccess(`Category updated successfully`)
          return true
        }
      }
      
      showError('Category not found')
      return false
    } catch (err) {
      console.error('Error updating category:', err)
      showError('Failed to update category')
      return false
    }
  }

  // Delete custom category (structured format)
  const deleteCategory = async (categoryId) => {
    if (!userId || !categoryId) return false
    
    // Only custom categories can be deleted (not global ones)
    const category = userCustomCategories.value.find(cat => cat.id === categoryId)
    if (!category) {
      showError('Cannot delete global default categories')
      return false
    }
    
    const categoryName = category.name
    const type = category.type

    try {
      const docRef = doc(db, 'apps', 'budget', 'userCategories', userId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const currentCategories = docSnap.data().categories || {}
        
        // Remove the category from the appropriate type array
        if (currentCategories[type] && currentCategories[type].includes(categoryName)) {
          currentCategories[type] = currentCategories[type].filter(name => name !== categoryName)
          
          // Update the document
          await updateDoc(docRef, {
            categories: currentCategories,
            updatedAt: new Date()
          })
          
          // Update local state
          await loadUserCustomCategories()
          
          showSuccess(`Category "${categoryName}" deleted successfully`)
          return true
        }
      }
      
      showError('Category not found')
      return false
    } catch (err) {
      console.error('Error deleting category:', err)
      showError('Failed to delete category')
      return false
    }
  }

  // Check if user has categories (for migration purposes)
  const hasCategories = async () => {
    if (!userId) return false
    
    try {
      const docRef = doc(db, 'apps', 'budget', 'userCategories', userId)
      const docSnap = await getDoc(docRef)
      return docSnap.exists() && docSnap.data().categories?.length > 0
    } catch (err) {
      console.error('Error checking user categories:', err)
      return false
    }
  }

  // Initialize categories (called when user logs in)
  const initCategories = async () => {
    if (!userId) return
    
    try {
      loading.value = true
      error.value = null
      
      // Load global categories (shared by all users)
      await loadGlobalCategories()
      
      // Load user's custom categories
      await loadUserCustomCategories()
      
      // Check for migration needs
      await checkAndMigrateOldStructure()
      
    } catch (err) {
      console.error('Error initializing categories:', err)
      error.value = 'Failed to initialize categories'
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    globalCategories,
    userCustomCategories,
    loading,
    error,
    
    // Computed
    allCategories,
    incomeCategories,
    spendCategories, 
    savingsCategories,
    
    // Methods
    initCategories,
    loadGlobalCategories,
    loadUserCustomCategories,
    createDefaultCategories,
    getCategoriesByType,
    addCategory,
    updateCategory,
    deleteCategory,
    checkAndMigrateOldStructure,
    migrateFromTransactions
  }
}