<template>
  <div class="mt-4">
    <table>
      <thead>
        <tr>
          <th>Amount</th>
          <th>Category</th>
          <!-- <th>Currency</th> -->
          <th>Date</th>
          <th>Description</th>
          <th>Recurring</th>
          <!-- <th>Note</th> -->
          <th>Type</th>
          <th>User ID</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tx in transactions" :key="tx.id">
          <td :class="tx.type === 'income' ? 'amount-income' : 'amount-cost'">
            <span v-if="tx.type === 'cost'" style="color:inherit">-</span>{{ tx.amount }}
          </td>
          <td>{{ tx.category }}</td>
          <!-- <td>{{ tx.currency }}</td> -->
          <td>{{ formatDate(tx.date) }}</td>
          <td>{{ tx.description }}</td>
          <td>{{ tx.isRecurring ? 'Yes' : 'No' }}</td>
          <!-- <td>{{ tx.note }}</td> -->
          <td>{{ tx.type }}</td>
          <td>{{ tx.userId }}</td>
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
</template>

<script setup>
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
const props = defineProps({
  transactions: {
    type: Array,
    required: true
  }
});
const emit = defineEmits(['deleted']);

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


async function handleDelete(id) {
  await deleteDoc(doc(db, 'apps', 'budget', 'transactions', id));
  emit('deleted', id);
}

function confirmDelete(id) {
  if (window.confirm('Sei sicuro di voler eliminare questa transazione?')) {
    handleDelete(id);
  }
}
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
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
</style>