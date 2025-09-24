<template>
  <div class="mt-4">
    <div class="table-header">
      <h3>Transactions</h3>
      <button class="export-btn" @click="exportToCSV" title="Export to CSV">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
        Export CSV
      </button>
    </div>

    <!-- Filters Section -->
    <div class="filters-container">
      <!-- Desktop Filters -->
      <div class="filters desktop-filters">
        <div class="filter-group">
          <label for="searchFilter">Search:</label>
          <input 
            id="searchFilter" 
            type="text" 
            v-model="searchText" 
            placeholder="Search in description..."
            class="filter-input"
          />
        </div>
        
        <div class="filter-group">
          <label for="categoryFilter">Category:</label>
          <select id="categoryFilter" v-model="selectedCategory" class="filter-select">
            <option value="">All Categories</option>
            <option v-for="category in availableCategories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="typeFilter">Type:</label>
          <select id="typeFilter" v-model="selectedType" class="filter-select">
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="spend">Spend</option>
            <option value="savings">Savings</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="recurringFilter">Recurring:</label>
          <select id="recurringFilter" v-model="selectedRecurring" class="filter-select">
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="dateFilter">Month/Year:</label>
          <select id="dateFilter" v-model="selectedMonthYear" class="filter-select">
            <option value="">All Months</option>
            <option v-for="monthYear in availableMonthsYears" :key="monthYear" :value="monthYear">
              {{ monthYear }}
            </option>
          </select>
        </div>
        
        <div class="filter-actions">
          <button @click="resetFilters" class="reset-filters-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            Reset
          </button>
        </div>
      </div>

      <!-- Mobile Filters -->
      <div class="mobile-filters">
        <!-- Search bar senza label -->
        <div class="search-section">
          <input 
            id="searchFilterMobile" 
            type="text" 
            v-model="searchText" 
            placeholder="Search in description or category..."
            class="filter-input search-input"
          />
        </div>
        
        <!-- Filtri con layout labels/boxes -->
        <div class="filters-layout">
          <div class="labels-column">
            <div class="filter-label">Category:</div>
            <div class="filter-label">Type:</div>
            <div class="filter-label">Recurring:</div>
            <div class="filter-label">Month/Year:</div>
          </div>
          
          <div class="boxes-column">
            <select v-model="selectedCategory" class="filter-select uniform-size">
              <option value="">All Categories</option>
              <option v-for="category in availableCategories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
            
            <select v-model="selectedType" class="filter-select uniform-size">
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="spend">Spend</option>
              <option value="savings">Savings</option>
            </select>
            
            <select v-model="selectedRecurring" class="filter-select uniform-size">
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
            
            <select v-model="selectedMonthYear" class="filter-select uniform-size">
              <option value="">All Months</option>
              <option v-for="monthYear in availableMonthsYears" :key="monthYear" :value="monthYear">
                {{ monthYear }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="filter-actions">
          <button @click="resetFilters" class="reset-filters-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            Reset
          </button>
        </div>
      </div>
      
      <!-- Results Counter -->
      <div class="results-counte mt-3">
        Showing {{ filteredTransactions.length }} of {{ transactions.length }} transactions
      </div>
    </div>
    <!-- Desktop Table View -->
    <div class="desktop-table">
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Amount</th>
            <th>Category</th>
            <!-- <th>Currency</th> -->
            <th>Date</th>
            <th>Description</th>
            <th>Recurring</th>
            <!-- <th>Note</th> -->
            <th>Type</th>
            <th>User</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in filteredTransactions" :key="tx.id">
            <td>
              <button class="edit-btn" @click="emitEdit(tx)" title="Edit">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style="color:#2563eb;vertical-align:middle">
                  <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-2.54-2.54a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
            </td>
            <td :class="getAmountClass(tx.type)">
              {{ formatCurrency(tx.amount) }}
            </td>
            <td>{{ tx.category }}</td>
            <!-- <td>{{ tx.currency }}</td> -->
            <td>{{ formatDate(tx.date) }}</td>
            <td>{{ tx.description }}</td>
            <td>{{ tx.isRecurring ? 'Yes' : 'No' }}</td>
            <!-- <td>{{ tx.note }}</td> -->
            <td>{{ tx.type }}</td>
            <td>{{ props.userIdToName[tx.userId] || tx.userId }}</td>
            <td>
              <button class="delete-btn" @click="confirmDelete(tx.id)" title="Delete">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"
                  style="color:#ff2d2d;vertical-align:middle">
                  <path
                    d="M3 6h18v2H3V6zm2 3h14l-1.5 12.5c-.1.8-.8 1.5-1.6 1.5H8.1c-.8 0-1.5-.7-1.6-1.5L5 9zm5 2v8h2v-8h-2zm4 0v8h2v-8h-2zm-8 0v8h2v-8H6z" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Card View -->
    <div class="mobile-cards">
      <div v-for="tx in filteredTransactions" :key="tx.id" class="transaction-card">
        <div class="card-header">
          <div class="amount-and-type">
            <div class="amount" :class="getAmountClass(tx.type)">
              {{ formatCurrency(tx.amount) }}
            </div>
            <div class="type-badge" :class="`type-${tx.type}`">{{ tx.type }}</div>
          </div>
          <div class="actions">
            <button class="edit-btn" @click="emitEdit(tx)" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-2.54-2.54a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            <button class="delete-btn" @click="confirmDelete(tx.id)" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 6h18v2H3V6zm2 3h14l-1.5 12.5c-.1.8-.8 1.5-1.6 1.5H8.1c-.8 0-1.5-.7-1.6-1.5L5 9zm5 2v8h2v-8h-2zm4 0v8h2v-8h-2zm-8 0v8h2v-8H6z"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="field">
            <span class="label">Category:</span>
            <span class="value">{{ tx.category }}</span>
          </div>
          <div class="field" v-if="tx.description">
            <span class="label">Description:</span>
            <span class="value">{{ tx.description }}</span>
          </div>
          <div class="field" v-if="tx.isRecurring">
            <span class="label">Recurring:</span>
            <span class="value recurring-badge">Yes</span>
          </div>
        </div>
        <div class="card-footer">
          <div class="date">{{ formatDate(tx.date) }}</div>
          <div class="user" v-if="props.userIdToName[tx.userId]">{{ props.userIdToName[tx.userId] || tx.userId }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useModal } from '../composables/useModal';

const props = defineProps({
  transactions: {
    type: Array,
    required: true
  },
  userIdToName: {
    type: Object,
    default: () => ({})
  }
});
const emit = defineEmits(['deleted', 'edit']);

// Filter states
const searchText = ref('');
const selectedCategory = ref('');
const selectedType = ref('');
const selectedRecurring = ref('');
const selectedMonthYear = ref('');

// Modal composable
const { showConfirm, showError, showAlert } = useModal();

// Computed properties
const availableCategories = computed(() => {
  const categories = new Set();
  props.transactions.forEach(tx => {
    if (tx.category) {
      categories.add(tx.category);
    }
  });
  return Array.from(categories).sort();
});

const availableMonthsYears = computed(() => {
  const monthsYears = new Set();
  props.transactions.forEach(tx => {
    if (tx.date) {
      let d;
      if (typeof tx.date === 'string') {
        d = new Date(tx.date);
      } else if (tx.date.seconds) {
        d = new Date(tx.date.seconds * 1000);
      } else {
        d = new Date(tx.date);
      }
      
      const year = d.getFullYear();
      const month = d.toLocaleString('en-US', { month: 'long' });
      const monthYear = `${month} ${year}`;
      monthsYears.add(monthYear);
    }
  });
  
  // Sort by date (most recent first)
  return Array.from(monthsYears).sort((a, b) => {
    const dateA = new Date(a.split(' ')[1] + '-' + getMonthNumber(a.split(' ')[0]) + '-01');
    const dateB = new Date(b.split(' ')[1] + '-' + getMonthNumber(b.split(' ')[0]) + '-01');
    return dateB - dateA;
  });
});

function getMonthNumber(monthName) {
  const months = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12'
  };
  return months[monthName.toLowerCase()] || '01';
}

const filteredTransactions = computed(() => {
  let filtered = props.transactions;

  // Search filter
  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    filtered = filtered.filter(tx => 
      (tx.description && tx.description.toLowerCase().includes(search)) ||
      (tx.category && tx.category.toLowerCase().includes(search))
    );
  }

  // Category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(tx => tx.category === selectedCategory.value);
  }

  // Type filter
  if (selectedType.value) {
    filtered = filtered.filter(tx => tx.type === selectedType.value);
  }

  // Recurring filter
  if (selectedRecurring.value !== '') {
    const isRecurring = selectedRecurring.value === 'true';
    filtered = filtered.filter(tx => Boolean(tx.isRecurring) === isRecurring);
  }

  // Month/Year filter
  if (selectedMonthYear.value) {
    filtered = filtered.filter(tx => {
      if (!tx.date) return false;
      
      let d;
      if (typeof tx.date === 'string') {
        d = new Date(tx.date);
      } else if (tx.date.seconds) {
        d = new Date(tx.date.seconds * 1000);
      } else {
        d = new Date(tx.date);
      }
      
      const year = d.getFullYear();
      const month = d.toLocaleString('en-US', { month: 'long' });
      const txMonthYear = `${month} ${year}`;
      
      return txMonthYear === selectedMonthYear.value;
    });
  }

  return filtered;
});

// Methods
function resetFilters() {
  searchText.value = '';
  selectedCategory.value = '';
  selectedType.value = '';
  selectedRecurring.value = '';
  selectedMonthYear.value = '';
}

function emitEdit(tx) {
  emit('edit', tx);
}

function formatDate(date) {
  if (!date) return '';
  let d;
  if (typeof date === 'string') {
    d = new Date(date);
  } else if (date.seconds) {
    d = new Date(date.seconds * 1000);
  } else {
    d = new Date(date);
  }
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getAmountClass(type) {
  switch (type) {
    case 'income':
      return 'amount-income';
    case 'spend':
      return 'amount-cost';
    case 'savings':
      return 'amount-saving';
    default:
      return 'amount-cost';
  }
}

function formatCurrency(amount) {
  if (typeof amount !== 'number') amount = Number(amount) || 0;
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'EUR' });
}


async function handleDelete(id) {
  try {
    await deleteDoc(doc(db, 'apps', 'budget', 'transactions', id));
    emit('deleted', id);
  } catch (error) {
    console.error('Error deleting transaction:', error);
    showError('Failed to delete transaction. Please try again.', 'Delete Error');
  }
}

async function confirmDelete(id) {
  const confirmed = await showConfirm(
    'This action cannot be undone. Are you sure you want to delete this transaction?', 
    'Delete Transaction',
    {
      confirmText: 'Delete',
      cancelText: 'Cancel'
    }
  );
  
  if (confirmed) {
    handleDelete(id);
  }
}

function exportToCSV() {
  if (!filteredTransactions.value || filteredTransactions.value.length === 0) {
    showAlert('No transactions available to export.', 'Export Error');
    return;
  }

  // Header CSV
  const headers = ['Amount', 'Category', 'Date', 'Description', 'Recurring', 'Type', 'User ID'];
  
  // Converti le transazioni filtrate in righe CSV
  const csvRows = filteredTransactions.value.map(tx => {
    return [
      tx.amount || 0,
      `"${(tx.category || '').replace(/"/g, '""')}"`, // Escape quotes
      formatDateForCSV(tx.date),
      `"${(tx.description || '').replace(/"/g, '""')}"`, // Escape quotes
      tx.isRecurring ? 'Yes' : 'No',
      tx.type || 'cost',
      `"${(tx.userId || '').replace(/"/g, '""')}"` // Escape quotes
    ].join(',');
  });

  // Combina header e righe
  const csvContent = [headers.join(','), ...csvRows].join('\n');

  // Crea il file e triggera il download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_filtered_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function formatDateForCSV(date) {
  if (!date) return '';
  let d;
  if (typeof date === 'string') {
    d = new Date(date);
  } else if (date.seconds) {
    d = new Date(date.seconds * 1000);
  } else {
    d = new Date(date);
  }
  return d.toISOString().slice(0, 10); // YYYY-MM-DD format
}
</script>

<style scoped>
/* Filters Styles */
.filters-container {
  margin-bottom: 1.5rem;
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: end;
  flex-wrap: wrap;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
  margin-bottom: 0.75rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 120px;
}

.filter-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.filter-input,
.filter-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 0.875rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-input {
  min-width: 200px;
}

.filter-actions {
  display: flex;
  align-items: end;
}

.reset-filters-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  transition: background-color 0.2s ease;
  height: fit-content;
}

.reset-filters-btn:hover {
  background: #4b5563;
}

.reset-filters-btn svg {
  flex-shrink: 0;
}

.results-counter {
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 4px;
}

/* Mobile adjustments for filters */
@media (max-width: 767px) {
  .filters {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
  
  /* Search field sempre su una riga intera */
  .filter-group:first-child {
    grid-column: 1;
  }
  
  /* Filtri select su 2 colonne */
  .filter-group:nth-child(2),
  .filter-group:nth-child(3) {
    grid-column: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  
  .filter-group:nth-child(4),
  .filter-group:nth-child(5) {
    grid-column: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  
  /* Prevent iOS zoom on input focus */
  .filter-input {
    min-width: auto;
    font-size: 16px !important; /* Prevents zoom on iOS */
    padding: 0.75rem;
  }
  
  .filter-select {
    font-size: 16px !important; /* Prevents zoom on iOS */
    padding: 0.75rem;
  }
  
  .filter-actions {
    align-items: center;
    justify-content: center;
    margin-top: 0.5rem;
  }
  
  .reset-filters-btn {
    width: 100%;
    justify-content: center;
    padding: 0.75rem 1rem;
  }
  
  .results-counter {
    font-size: 0.9rem;
    padding: 0.6rem;
  }
}

/* Mobile filters layout */
@media (max-width: 767px) {
  .search-section {
    margin-bottom: 1rem;
  }
  
  .search-input {
    width: 100%;
    font-size: 16px !important;
    padding: 0.75rem;
    border-radius: 6px;
    border: 1px solid #d1d5db;
  }
  
  .filters-layout {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1rem;
    align-items: start;
  }
  
  .labels-column {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-top: 0.1rem; /* Allineamento con le select */
  }
  
  .filter-label {
    font-weight: 600;
    color: #374151;
    font-size: 0.9rem;
    height: 48px; /* Stessa altezza delle select */
    display: flex;
    align-items: center;
    white-space: nowrap;
  }
  
  .boxes-column {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .uniform-size {
    height: 48px !important;
    width: 100%;
    font-size: 16px !important;
    padding: 0.75rem;
    border-radius: 6px;
    border: 1px solid #d1d5db;
    background: white;
  }
}

@media (min-width: 768px) and (max-width: 1024px) {
  .filters {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.75rem;
    align-items: end;
  }
  
  .filter-group:nth-child(1) {
    grid-column: 1 / -1;
  }
  
  .filter-actions {
    grid-column: 1 / -1;
    justify-content: center;
  }
}

@media (max-width: 479px) {
  .filters {
    padding: 0.5rem;
  }
  
  .filter-input,
  .filter-select {
    padding: 0.4rem;
    font-size: 0.8rem;
  }
  
  .filter-group label {
    font-size: 0.8rem;
  }
  
  .reset-filters-btn {
    padding: 0.6rem 1rem;
    font-size: 0.8rem;
  }
}

/* Mobile-first approach */
.mobile-cards {
  display: block;
}

.desktop-table {
  display: none;
}

.mobile-filters {
  display: block;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.desktop-filters {
  display: none;
}

/* Desktop styles */
@media (min-width: 768px) {
  .mobile-cards {
    display: none;
  }
  
  .desktop-table {
    display: block;
  }
  
  .mobile-filters {
    display: none;
  }
  
  .desktop-filters {
    display: flex;
  }
}

/* Mobile Card Styles */
.transaction-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  padding: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.375rem;
  border-bottom: 1px solid #f3f4f6;
}

.amount-and-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-header .amount {
  font-size: 1.125rem;
  font-weight: bold;
}

.actions {
  display: flex;
  gap: 0.25rem;
}

.card-body .field {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  padding: 0.125rem 0;
}

.field-row {
  display: flex;
  gap: 0.75rem;
}

.field-row .field {
  flex: 1;
  margin-bottom: 0.25rem;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  padding-top: 0.375rem;
  border-top: 1px solid #f3f4f6;
  font-size: 0.75rem;
  color: #6b7280;
}

.card-footer .date {
  font-weight: 500;
}

.card-footer .user {
  font-weight: 500;
  color: #374151;
}

.label {
  font-weight: 500;
  color: #6b7280;
  font-size: 0.8rem;
}

.value {
  color: #374151;
  font-size: 0.8rem;
}

.type-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.type-income {
  background: #dcfce7;
  color: #166534;
}

.type-spend {
  background: #fee2e2;
  color: #991b1b;
}

.type-savings {
  background: #fef3c7;
  color: #92400e;
}

.recurring-badge {
  background: #dbeafe;
  color: #1e40af;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.edit-btn {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.125rem 0.25rem;
  transition: color 0.2s;
}
.edit-btn:hover {
  color: #1d4ed8;
}
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.table-header h3 {
  margin: 0;
  color: #374151;
  font-size: 1.5rem;
  font-weight: 600;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.export-btn:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.export-btn svg {
  flex-shrink: 0;
}

/* Mobile adjustments for header */
@media (max-width: 767px) {
  .table-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .table-header h3 {
    font-size: 1.25rem;
    text-align: center;
  }
  
  .export-btn {
    justify-content: center;
    font-size: 0.8rem;
    padding: 0.75rem 1rem;
  }
}

table {
  width: 100%;
  border-collapse: collapse;
  overflow-x: auto;
}

th,
td {
  padding: 8px 12px;
  border: 1px solid #ddd;
  text-align: left;
}

th {
  background-color: #374151;
  color: #fff;
  font-weight: bold;
  border-bottom: 3px solid #1e293b;
  letter-spacing: 0.5px;
}

button {
  background: none;
  border: none;
  cursor: pointer;
}

img {
  width: 20px;
  height: 20px;
}

.delete-btn {
  background: none;
  border: none;
  color: #e53e3e;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  transition: color 0.2s;
}

.delete-btn:hover {
  color: #b91c1c;
}

tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

.amount-income {
  color: #16a34a;
  font-weight: bold;
}

.amount-cost {
  color: #dc2626;
  font-weight: bold;
}

.amount-saving {
  color: #FFD700;
  font-weight: bold;
}
</style>