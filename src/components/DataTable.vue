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
          <tr v-for="tx in transactions" :key="tx.id">
            <td>
              <button class="edit-btn" @click="emitEdit(tx)" title="Modifica">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style="color:#2563eb;vertical-align:middle">
                  <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-2.54-2.54a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
            </td>
            <td :class="getAmountClass(tx.type)">
              <span v-if="tx.type === 'spend'" style="color:inherit">-</span>{{ formatCurrency(tx.amount) }}
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
              <button class="delete-btn" @click="confirmDelete(tx.id)" title="Elimina">
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
      <div v-for="tx in transactions" :key="tx.id" class="transaction-card">
        <div class="card-header">
          <div class="amount" :class="getAmountClass(tx.type)">
            <span v-if="tx.type === 'spend'" style="color:inherit">-</span>{{ formatCurrency(tx.amount) }}
          </div>
          <div class="actions">
            <button class="edit-btn" @click="emitEdit(tx)" title="Modifica">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-2.54-2.54a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            <button class="delete-btn" @click="confirmDelete(tx.id)" title="Elimina">
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
          <div class="field">
            <span class="label">Date:</span>
            <span class="value">{{ formatDate(tx.date) }}</span>
          </div>
          <div class="field" v-if="tx.description">
            <span class="label">Description:</span>
            <span class="value">{{ tx.description }}</span>
          </div>
          <div class="field-row">
            <div class="field">
              <span class="label">Type:</span>
              <span class="value type-badge" :class="`type-${tx.type}`">{{ tx.type }}</span>
            </div>
            <div class="field" v-if="tx.isRecurring">
              <span class="label">Recurring:</span>
              <span class="value recurring-badge">Yes</span>
            </div>
          </div>
          <div class="field" v-if="props.userIdToName[tx.userId]">
            <span class="label">User:</span>
            <span class="value">{{ props.userIdToName[tx.userId] || tx.userId }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
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
  return amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}


async function handleDelete(id) {
  await deleteDoc(doc(db, 'apps', 'budget', 'transactions', id));
  emit('deleted', id);
}

function confirmDelete(id) {
  if (window.confirm('Sei sicuro di voler eliminare questa transazione?')) {
    handleDelete(id);
  }
}

function exportToCSV() {
  if (!props.transactions || props.transactions.length === 0) {
    alert('No transactions to export');
    return;
  }

  // Header CSV
  const headers = ['Amount', 'Category', 'Date', 'Description', 'Recurring', 'Type', 'User ID'];
  
  // Converti le transazioni in righe CSV
  const csvRows = props.transactions.map(tx => {
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
    link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
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
/* Mobile-first approach */
.mobile-cards {
  display: block;
}

.desktop-table {
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
}

/* Mobile Card Styles */
.transaction-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.card-header .amount {
  font-size: 1.25rem;
  font-weight: bold;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.card-body .field {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  padding: 0.25rem 0;
}

.field-row {
  display: flex;
  gap: 1rem;
}

.field-row .field {
  flex: 1;
  margin-bottom: 0.5rem;
}

.label {
  font-weight: 500;
  color: #6b7280;
  font-size: 0.875rem;
}

.value {
  color: #374151;
  font-size: 0.875rem;
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
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
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