<template>

  <!-- Login -->
  <Login v-if="!user" />

  <!-- Accesso negato -->
  <div v-else-if="!isAllowed">
    <div class="denied-container">
      <h2>Accesso negato</h2>
      <p>Non sei autorizzato ad accedere a questa app.</p>
      <button class="logout-btn" @click="logout">Logout</button>
    </div>
  </div>

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
          <TransactionForm
            v-if="currentView === 'form'"
            :editTransaction="transactionToEdit"
            @edited="onTransactionEdited"
          />
          <DataTable
            v-if="currentView === 'datatable'"
            :transactions="transactions"
            :userIdToName="userIdToName"
            @deleted="id => transactions = transactions.filter(tx => tx.id !== id)"
            @edit="onEditTransaction"
          />
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
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';


const transactions = ref([]);
const currentView = ref('form');
const user = ref(null);
const transactionToEdit = ref(null);
const userIdToName = ref({});
const isAllowed = ref(false);

// Controlla lo stato utente e recupera dati utente da Firestore

onMounted(() => {
  onAuthStateChanged(auth, async (u) => {
    if (u) {
      // Recupera il documento Firestore dell'utente
      const userDocRef = doc(db, "users", u.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        user.value = {
          ...userData,
          uid: u.uid,
          email: u.email,
        };
        // Controlla allowedApps
        isAllowed.value = Array.isArray(userData.allowedApps) && userData.allowedApps.includes("cost-tracker");
      } else {
        // fallback: se non esiste il doc, usa dati auth
        user.value = u;
        isAllowed.value = false;
      }
    } else {
      user.value = null;
      isAllowed.value = false;
    }
  });
});

// Firestore
async function fetchTransactions() {
  if (!user.value) return;
  const querySnapshot = await getDocs(collection(db, "apps", "budget", "transactions"));
  const allTransactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Recupera in parallelo i documenti degli utenti unici (userId)
  const uniqueUserIds = Array.from(new Set(allTransactions.map(tx => tx.userId).filter(id => id)));
  const userDocs = await Promise.all(
    uniqueUserIds.map(async (userId) => {
      try {
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);
        return userDocSnap.exists() ? { userId, data: userDocSnap.data() } : { userId, data: null };
      } catch {
        return { userId, data: null };
      }
    })
  );

  // Mappa userId → dati utente
  const userIdToData = {};
  const userIdToNameMap = {};
  userDocs.forEach(({ userId, data }) => {
    userIdToData[userId] = data || {};
    userIdToNameMap[userId] = data ? (data.displayName || data.name || data.email || userId) : userId;
  });
  userIdToName.value = userIdToNameMap;

  // Filtro: proprie transazioni e quelle condivise
  const filteredTransactions = allTransactions.filter(tx => {
    if (!tx.userId) return false;
    if (tx.userId === user.value.uid) {
      return true;
    }
    const ownerData = userIdToData[tx.userId];
    if (ownerData && Array.isArray(ownerData.sharedWith) && ownerData.sharedWith.includes(user.value.uid)) {
      return true;
    }
    return false;
  });

  transactions.value = filteredTransactions.sort((a, b) => {
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
    transactionToEdit.value = null;
  }
}

// Auth functions
const logout = async () => {
  await signOut(auth);
};

function onEditTransaction(tx) {
  transactionToEdit.value = tx;
  currentView.value = 'form';
}

function onTransactionEdited(updatedTx) {
  const idx = transactions.value.findIndex(t => t.id === updatedTx.id);
  if (idx !== -1) {
    transactions.value[idx] = { ...updatedTx };
  }
  transactionToEdit.value = null;
  currentView.value = 'datatable';
}
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
  flex: 1;
  display: flex;
  justify-content: center;
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
.denied-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  background: #fff0f0;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(239,68,68,0.08);
  padding: 2rem;
  margin: 2rem auto;
  max-width: 400px;
}
.denied-container h2 {
  color: #ef4444;
  font-size: 2rem;
  margin-bottom: 1rem;
}
.denied-container p {
  color: #6b7280;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

</style>