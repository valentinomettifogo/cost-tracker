<template>
  <form @submit.prevent="handleSubmit">
    <div class="form-fields">
      <div class="field-group">
        <label for="amount">Amount:</label>
        <input 
          id="amount"
          v-model="transaction.amount" 
          type="text" 
          inputmode="decimal"
          pattern="[0-9]*[,.]?[0-9]*"
          required 
          @input="handleAmountInput"
          @blur="formatAmountDisplay"
        />
      </div>
      <div class="field-group">
        <label for="category">Category:</label>
        <select id="category" v-model="selectedCategoryWithType" required @change="handleCategoryChange">
          <option value="">Select a category...</option>
          
          <optgroup label="💰 Income">
            <option 
              v-for="cat in incomeCategories" 
              :key="`income-${cat.name}`" 
              :value="`income|${cat.name}`"
            >
              {{ cat.name }}
            </option>
          </optgroup>
          
          <optgroup label="💸 Spend">
            <option 
              v-for="cat in spendCategories" 
              :key="`spend-${cat.name}`" 
              :value="`spend|${cat.name}`"
            >
              {{ cat.name }}
            </option>
          </optgroup>
          
          <optgroup label="💰 Savings">
            <option 
              v-for="cat in savingsCategories" 
              :key="`savings-${cat.name}`" 
              :value="`savings|${cat.name}`"
            >
              {{ cat.name }}
            </option>
          </optgroup>
        </select>
      </div>
      <div class="field-group">
        <label for="description">Description:</label>
        <input id="description" v-model="transaction.description" type="text" required />
      </div>
      <div class="field-group">
        <label for="date">Date:</label>
        <input id="date" v-model="transaction.date" type="date" required />
      </div>
      <div class="field-group checkbox-group">
        <label for="recurring">Recurring:</label>
        <div class="checkbox-wrapper">
          <label class="checkbox-label" for="recurring">
            <input 
              v-model="transaction.isRecurring" 
              type="checkbox" 
              id="recurring"
            />
            <span class="checkbox-text">Enable recurring</span>
            <span class="recurring-info" v-if="!transaction.isRecurring">
              (Monthly until end of year)
            </span>
            <span class="recurring-count" v-if="transaction.isRecurring && recurringMonthsCount > 0">
              - Will create {{ recurringMonthsCount }} transactions
            </span>
          </label>
        </div>
      </div>
    </div>
    <div class="mt-4">
      <button type="submit">Save Transaction</button>
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { db } from "../firebase";
import { collection, addDoc, updateDoc, Timestamp, doc } from "firebase/firestore";
import { useModal } from "../composables/useModal";
import { useCategories } from "../composables/useCategories";
const props = defineProps({
  editTransaction: {
    type: Object,
    default: null
  }
});
const emit = defineEmits(['edited']);

function getToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

import { useAuth } from "../composables/useAuth";
import { useInAppNotifications } from "../composables/useInAppNotifications";
const { user } = useAuth();
const { showError, showSuccess } = useModal();
const { createNotificationForSharedUsers, getSharedUsers } = useInAppNotifications();

// Initialize transaction object first
const transaction = ref({
  amount: "",
  category: "",
  currency: "EUR",
  date: getToday(),
  description: "",
  isRecurring: false,
  type: "spend",
  userId: user.value?.uid || ""
});

// Categories state for grouped dropdown
const incomeCategories = ref([]);
const spendCategories = ref([]);
const savingsCategories = ref([]);
const selectedCategoryWithType = ref('');

// Initialize categories when user is available
let categoriesComposable = null;
watch(user, (newUser) => {
  if (newUser?.uid && !categoriesComposable) {
    categoriesComposable = useCategories(newUser.uid);
    
    // Watch for category changes and update grouped categories
    watch(categoriesComposable.allCategories, (newCategories) => {
      if (newCategories && newCategories.length > 0) {
        incomeCategories.value = newCategories
          .filter(cat => cat.type === 'income')
          .sort((a, b) => a.name.localeCompare(b.name));
          
        spendCategories.value = newCategories
          .filter(cat => cat.type === 'spend')
          .sort((a, b) => a.name.localeCompare(b.name));
          
        savingsCategories.value = newCategories
          .filter(cat => cat.type === 'savings')
          .sort((a, b) => a.name.localeCompare(b.name));
      }
    }, { immediate: true });
  }
}, { immediate: true });

// Handle category selection (parses type|category format)
const handleCategoryChange = () => {
  if (selectedCategoryWithType.value) {
    const [type, categoryName] = selectedCategoryWithType.value.split('|');
    transaction.value.type = type;
    transaction.value.category = categoryName;
  }
};

// Computed property to show how many recurring transactions will be created
const recurringMonthsCount = computed(() => {
  if (!transaction.value.isRecurring || !transaction.value.date) return 0;
  
  const selectedDate = new Date(transaction.value.date);
  const currentYear = selectedDate.getFullYear();
  const endOfYear = new Date(currentYear, 11, 31);
  
  let count = 0;
  let currentDate = new Date(selectedDate);
  
  while (currentDate <= endOfYear) {
    count++;
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return count;
});

// Precompila il form se editTransaction cambia
watch(() => props.editTransaction, (val) => {
  if (val) {
    // Normalizza il valore di isRecurring per gestire dati legacy
    let normalizedRecurring = false;
    if (val.isRecurring === true || val.isRecurring === "true" || val.isRecurring === "yes" || val.isRecurring === "series") {
      normalizedRecurring = true;
    }
    
    transaction.value = {
      ...val,
      date: formatDateForInput(val.date),
      isRecurring: normalizedRecurring
    };
    
    // Set the combined category selection for editing
    selectedCategoryWithType.value = `${val.type}|${val.category}`;
  } else {
    resetForm();
    selectedCategoryWithType.value = '';
  }
}, { immediate: true });

onMounted(async () => {
  // Initialize categories using hybrid structure
  if (user.value?.uid && categoriesComposable) {
    await categoriesComposable.initCategories();
  }
});



function formatDateForInput(date) {
  if (!date) return getToday();
  let d;
  if (typeof date === 'string') {
    d = new Date(date);
  } else if (date.seconds) {
    d = new Date(date.seconds * 1000);
  } else {
    d = new Date(date);
  }
  // Compensa il fuso orario locale
  const tzOffset = d.getTimezoneOffset() * 60000;
  const localISO = new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
  return localISO;
}

function resetForm() {
  transaction.value = {
    amount: "",
    category: "",
    currency: "EUR",
    date: getToday(),
    description: "",
    isRecurring: false,
    type: "spend",
    userId: user.value?.uid || ""
  };
  // Category will be set by the watcher
}

// Handle amount input with comma/dot conversion
function handleAmountInput(event) {
  let value = event.target.value;
  // Allow only numbers, commas, and dots
  value = value.replace(/[^0-9,.]/g, '');
  
  // Replace comma with dot for consistency
  value = value.replace(',', '.');
  
  // Ensure only one decimal separator
  const parts = value.split('.');
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit to 2 decimal places
  if (parts[1] && parts[1].length > 2) {
    value = parts[0] + '.' + parts[1].substring(0, 2);
  }
  
  transaction.value.amount = value;
}

// Format amount display when user leaves the field
function formatAmountDisplay() {
  if (transaction.value.amount) {
    const numericValue = parseFloat(transaction.value.amount.toString().replace(',', '.'));
    if (!isNaN(numericValue)) {
      transaction.value.amount = numericValue.toFixed(2);
    }
  }
}

// Get numeric amount value for validation and submission
function getNumericAmount() {
  if (!transaction.value.amount) return 0;
  const numericValue = parseFloat(transaction.value.amount.toString().replace(',', '.'));
  return isNaN(numericValue) ? 0 : numericValue;
}

// Send notifications to shared users
async function sendNotificationForNewTransaction(transactionData) {
  try {
    const sharedUsers = await getSharedUsers();
    
    if (sharedUsers && sharedUsers.length > 0) {
      const currentUserName = user.value?.displayName || user.value?.email || 'Un utente';
      
      await createNotificationForSharedUsers(
        transactionData,
        sharedUsers,
        currentUserName
      );
    }
  } catch (error) {

    // Non bloccare il salvataggio se le notifiche falliscono
  }
}

// Generate recurring transactions from selected date until end of year
function generateRecurringTransactions(baseTransaction, startDate) {
  const transactions = [];
  const start = new Date(startDate);
  const currentYear = start.getFullYear();
  const endOfYear = new Date(currentYear, 11, 31); // December 31st of the same year
  
  // Generate unique recurring group ID
  const recurringGroupId = `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  let currentDate = new Date(start);
  
  while (currentDate <= endOfYear) {
    const transactionData = {
      ...baseTransaction,
      date: Timestamp.fromDate(new Date(currentDate)),
      isRecurring: true,
      recurringGroupId: recurringGroupId,
      recurringOriginalDate: Timestamp.fromDate(start),
      createdAt: Timestamp.now(),
      lastModified: Timestamp.now()
    };
    
    transactions.push(transactionData);
    
    // Move to next month, same day
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return transactions;
}

// Save multiple recurring transactions
async function saveRecurringTransactions(transactions) {
  const promises = transactions.map(txData => 
    addDoc(collection(db, "apps", "budget", "transactions"), txData)
  );
  
  await Promise.all(promises);
}

const handleSubmit = async () => {
  // Additional validation for required fields
  const numericAmount = getNumericAmount();
  if (!numericAmount || numericAmount <= 0) {
    showError("Please enter a valid amount greater than 0", "Invalid Amount");
    return;
  }
  
  if (!transaction.value.description || transaction.value.description.trim() === "") {
    showError("Please enter a description", "Missing Description");
    return;
  }

  if (props.editTransaction && props.editTransaction.id) {
    // Edit existing transaction
    try {
      // Check if the original transaction was recurring
      const isOriginallyRecurring = props.editTransaction.isRecurring && props.editTransaction.recurringGroupId;
      const isNowRecurring = Boolean(transaction.value.isRecurring);
      
      // Update the existing transaction
      await updateDoc(doc(db, "apps", "budget", "transactions", props.editTransaction.id), {
        ...transaction.value,
        amount: numericAmount,
        description: transaction.value.description.trim(),
        date: Timestamp.fromDate(new Date(transaction.value.date)),
        userId: user.value?.uid || "",
        isRecurring: isNowRecurring,
        lastModified: Timestamp.now(),
        // Preserve original recurring metadata if it existed
        ...(isOriginallyRecurring && {
          recurringGroupId: props.editTransaction.recurringGroupId,
          recurringOriginalDate: props.editTransaction.recurringOriginalDate
        })
      });
      
      // If recurring is now enabled and it wasn't originally recurring, create future transactions
      if (isNowRecurring && !isOriginallyRecurring) {
        const baseTransaction = {
          ...transaction.value,
          amount: numericAmount,
          description: transaction.value.description.trim(),
          userId: user.value?.uid || ""
        };
        
        // Generate transactions starting from the NEXT month
        const currentDate = new Date(transaction.value.date);
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        const futureTransactions = generateRecurringTransactions(
          baseTransaction, 
          nextMonth.toISOString().slice(0, 10)
        );
        
        if (futureTransactions.length > 0) {
          await saveRecurringTransactions(futureTransactions);
          showSuccess(
            `Transaction updated and ${futureTransactions.length} recurring transactions created for future months!`, 
            "Success"
          );
        } else {
          showSuccess("Transaction updated successfully!", "Success");
        }
      } else if (isOriginallyRecurring && !isNowRecurring) {
        // If recurring was disabled, just show a message about the single update
        showSuccess(
          "Transaction updated successfully! Note: This only affects this single transaction. Other recurring instances remain unchanged.", 
          "Success"
        );
      } else {
        showSuccess("Transaction updated successfully!", "Success");
      }
      
      emit('edited', { 
        ...transaction.value, 
        amount: numericAmount, 
        id: props.editTransaction.id 
      });
      resetForm();
    } catch (e) {

      showError("Failed to update transaction. Please try again.", "Update Error");
    }
  } else {
    // New transaction
    try {
      if (transaction.value.isRecurring) {
        // Handle recurring transactions
        const baseTransaction = {
          ...transaction.value,
          amount: numericAmount,
          description: transaction.value.description.trim(),
          userId: user.value?.uid || ""
        };
        
        const recurringTransactions = generateRecurringTransactions(
          baseTransaction, 
          transaction.value.date
        );
        
        await saveRecurringTransactions(recurringTransactions);
        
        // Invia notifiche per la serie di transazioni ricorrenti
        if (recurringTransactions.length > 0) {
          await sendNotificationForNewTransaction({
            id: 'recurring_series',
            ...baseTransaction,
            description: `${baseTransaction.description} (Recurring series - ${recurringTransactions.length} transactions)`
          });
        }
        
        showSuccess(
          `${recurringTransactions.length} recurring transactions created successfully until end of year!`, 
          "Recurring Transactions Created"
        );
      } else {
        // Handle single transaction
        const now = Timestamp.now();
        const docRef = await addDoc(collection(db, "apps", "budget", "transactions"), {
          ...transaction.value,
          amount: numericAmount,
          description: transaction.value.description.trim(),
          userId: user.value?.uid || "",
          date: Timestamp.fromDate(new Date(transaction.value.date)),
          isRecurring: false,
          createdAt: now,
          lastModified: now
        });
        
        // Invia notifiche agli utenti condivisi
        await sendNotificationForNewTransaction({
          id: docRef.id,
          ...transaction.value,
          amount: numericAmount,
          description: transaction.value.description.trim()
        });
        
        showSuccess("Transaction saved successfully!", "Success");
      }
      
      resetForm();
    } catch (e) {

      showError("Failed to save transaction. Please try again.", "Save Error");
    }
  }
};
</script>

<style scoped>
form {
  width: 100%;
  max-width: 900px;
  margin: 1rem auto;
  padding: 1rem;
  background: #ffffff;
  box-sizing: border-box;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Desktop styles */
@media (min-width: 768px) {
  form {
    width: 80%;
    margin: 2rem auto;
    padding: 2rem;
  }
}

@media (min-width: 1024px) {
  form {
    width: 70%;
  }
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.field-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  margin: 0;
  min-width: 100px;
  white-space: nowrap;
}

.checkbox-group {
  align-items: flex-start;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  flex-wrap: wrap;
}

.checkbox-text {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.field-group input,
.field-group select,
.field-group textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.875rem;
  color: #374151;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
  flex: 1;
  height: 48px; /* Altezza uniforme per tutti i campi */
  -webkit-appearance: none; /* Rimuove stili nativi su Safari */
  -moz-appearance: none; /* Rimuove stili nativi su Firefox */
  appearance: none; /* Rimuove stili nativi */
}

/* Fix specifico per input date */
.field-group input[type="date"] {
  padding: 0.75rem;
  height: 48px;
  line-height: normal;
  font-family: inherit;
}

/* Fix per textarea che deve essere più alta */
.field-group textarea {
  height: auto;
  min-height: 80px;
  resize: vertical;
}

/* Mobile improvements */
@media (max-width: 767px) {
  form {
    margin: 0.5rem;
    padding: 1rem;
  }
  
  /* Layout mobile come i filtri: labels a sinistra, input a destra */
  .field-group {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1rem;
    align-items: center;
  }
  
  .field-group label {
    font-weight: 600;
    color: #374151;
    font-size: 0.9rem;
    white-space: nowrap;
    margin: 0;
  }
  
  .checkbox-group {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1rem;
    align-items: center;
  }
  
  .checkbox-wrapper {
    display: flex;
    align-items: center;
  }
  
  .checkbox-label {
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  
  .field-group input,
  .field-group select,
  .field-group textarea {
    padding: 0.75rem;
    font-size: 16px; /* Previene lo zoom su iOS */
    border-radius: 6px;
    height: 48px; /* Altezza consistente con i filtri */
    width: 100%;
  }
  
  /* Fix specifico per input date su mobile */
  .field-group input[type="date"] {
    padding: 0.75rem;
    height: 48px;
    font-size: 16px;
  }
  
  /* Fix per textarea su mobile */
  .field-group textarea {
    height: auto;
    min-height: 80px;
    padding: 0.75rem;
  }
}

.field-group input:focus,
.field-group select:focus,
.field-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin-right: 0.5rem;
  accent-color: #10b981;
  cursor: pointer;
  -webkit-appearance: auto;
  -moz-appearance: auto;
  appearance: auto;
  border: 2px solid #d1d5db;
  border-radius: 3px;
  background-color: white;
  transition: all 0.2s ease;
}

/* Checkbox styles */
input[type="checkbox"]:checked {
  accent-color: #10b981;
  background-color: #10b981;
  border-color: #10b981;
}

input[type="checkbox"]:hover {
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
}

input[type="checkbox"]:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.recurring-info {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 400;
  font-style: italic;
  margin-left: 0.25rem;
}

.recurring-count {
  font-size: 0.75rem;
  color: #3b82f6;
  font-weight: 600;
  margin-left: 0.25rem;
}

/* Mobile checkbox adjustments */
@media (max-width: 767px) {
  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    -webkit-appearance: auto;
    -moz-appearance: auto;
    appearance: auto;
  }
  


  
  .recurring-info,
  .recurring-count {
    font-size: 0.7rem;
    margin-left: 0.25rem;
  }
}

/* Selects styling per uniformità */
.field-group select {
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23374151' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
  padding-right: 2.5rem; /* Spazio per la freccia */
}

button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  background: #374151;
  color: #ffffff;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1rem;
  width: 100%;
  box-sizing: border-box;
}

/* Mobile button improvements */
@media (max-width: 767px) {
  button {
    padding: 1rem 1.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 8px;
    margin-top: 1rem;
  }
}

button:hover {
  background: #4b5563;
}

button:active {
  background: #1f2937;
}

/* Mobile grid adjustments */
@media (max-width: 767px) {
  .grid {
    gap: 1rem;
  }
  
  .col-8,
  .col-4 {
    grid-column: span 12;
  }
  
  /* Stack type and recurring on mobile */
  .type-recurring-mobile {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
}

/* Tablet adjustments */
@media (min-width: 768px) and (max-width: 1023px) {
  .col-8 {
    grid-column: span 8;
  }
  
  .col-4 {
    grid-column: span 4;
  }
}
</style>
