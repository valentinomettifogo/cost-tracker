<template>
  <!-- Login -->
  <Login v-if="!user" />

  <!-- App principale -->
  <div v-else>
    <div class="">
      <header>
        <nav class="navbar">
          <div class="nav-brand">
            <h2>{{ user?.displayName || user?.email || 'User' }}</h2>
          </div>
          <div class="nav-center">
            <button :class="{ active: currentView === 'form' }" @click="show('form')">Form</button>
            <button :class="{ active: currentView === 'datatable' }" @click="show('datatable')">Datatable</button>
            <button :class="{ active: currentView === 'stats' }" @click="show('stats')">Stats</button>
          </div>
          <div class="nav-right">
            <button class="logout-btn" @click="logout">Logout</button>
          </div>
        </nav>
      </header>
      <main class="container">
        <div class="w-full">
          <TransactionForm v-if="currentView === 'form'" />
          <DataTable v-if="currentView === 'datatable'" :transactions="transactions"
            @deleted="id => transactions = transactions.filter(tx => tx.id !== id)" />
          <Stats v-if="currentView === 'stats'" :transactions="transactions" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import TransactionForm from './components/TransactionForm.vue';
import DataTable from './components/DataTable.vue';
import Login from './components/Login.vue';
import Stats from './components/Stats.vue';
import { ref, onMounted } from 'vue';
import { db, auth } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const transactions = ref([]);
const currentView = ref('form');
const user = ref(null);

// Controlla lo stato utente
onMounted(() => {
  onAuthStateChanged(auth, (u) => {
    user.value = u;
  });
});

// Firestore
async function fetchTransactions() {
  if (!user.value) return;
  const querySnapshot = await getDocs(collection(db, "apps", "budget", "transactions"));
  transactions.value = querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => {
      const dateA = a.date?.seconds ? a.date.seconds : new Date(a.date).getTime() / 1000;
      const dateB = b.date?.seconds ? b.date.seconds : new Date(b.date).getTime() / 1000;
      return dateB - dateA;
    });
}

// Mostra form o datatable
async function show(view) {
  currentView.value = view;
  if (view === 'datatable' || view === 'stats') {
    await fetchTransactions();
  }
}

// Auth functions
const logout = async () => {
  await signOut(auth);
};
</script>

<style>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-brand h2 {
  margin: 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 700;
}

.nav-center {
  display: flex;
  gap: 1rem;
}

.nav-right {
  display: flex;
  align-items: center;
}

nav button {
  background: none;
  border: none;
  font-size: 1rem;
  color: #374151;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

nav button:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
}

nav button.active {
  background: #667eea;
  color: white;
  font-weight: 600;
}

.logout-btn {
  background: #ef4444 !important;
  color: white !important;
  border-radius: 8px;
  padding: 0.5rem 1rem !important;
  font-weight: 600;
  font-size: 0.875rem;
}

.logout-btn:hover {
  background: #dc2626 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .nav-brand h2 {
    font-size: 1.25rem;
  }
  
  .nav-center {
    order: 2;
  }
  
  .nav-right {
    order: 3;
  }
}
</style>