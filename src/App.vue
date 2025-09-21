<template>
  <div class="container">
    <header>
      <nav class="flex justify-center items-center g-1 py-4">
        <button :class="{active: currentView === 'form'}" @click="show('form')">Form</button>
        <button :class="{active: currentView === 'datatable'}" @click="show('datatable')">Datatable</button>
      </nav>
    </header>
    <main class="">
      <div class="w-full">
        <TransactionForm v-if="currentView === 'form'" />
        <DataTable v-if="currentView === 'datatable'" :transactions="transactions" @deleted="id => transactions = transactions.filter(tx => tx.id !== id)" />
      </div>
    </main>
  </div>
</template>

<script setup>
import TransactionForm from './components/TransactionForm.vue';
import DataTable from './components/DataTable.vue';
import { ref, onMounted } from 'vue';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

const transactions = ref([]);
const currentView = ref('form');

async function fetchTransactions() {
  const querySnapshot = await getDocs(collection(db, "transactions"));
  transactions.value = querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => {
      const dateA = a.date?.seconds ? a.date.seconds : new Date(a.date).getTime() / 1000;
      const dateB = b.date?.seconds ? b.date.seconds : new Date(b.date).getTime() / 1000;
      return dateB - dateA;
    });
}

onMounted(fetchTransactions);

async function show(view) {
  currentView.value = view;
  if (view === 'datatable') {
    await fetchTransactions();
  }
}
</script>

<style>
nav button {
  background: none;
  border: none;
  font-size: 1rem;
  color: #374151;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  width: 150px;
}

nav button.active,
nav button:hover {
  background: #e5e7eb;
  font-weight: 600;
}

</style>