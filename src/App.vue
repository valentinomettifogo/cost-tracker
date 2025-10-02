<template>

  <!-- Login -->
  <Login v-if="!user" />

  <!-- Access Denied -->
  <div v-else-if="!isAllowed">
    <div class="denied-container">
      <h2>Access Denied</h2>
      <p>You are not authorized to access this application.</p>
      <button class="logout-btn" @click="logout">Logout</button>
    </div>
  </div>

  <!-- Main App -->
  <div v-else>
    <div class="">
      <header>
        <nav class="navbar">
          <div class="nav-top">
            <div class="nav-brand">
              <h2>{{ user?.displayName || user?.email || 'User' }}</h2>
            </div>
            <div class="nav-right">
              <NotificationBell />
              <button class="logout-btn" @click="logout">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 13v-2H7V8l-5 4 5 4v-3z"/>
                  <path d="M20 3h-9c-1.103 0-2 .897-2 2v4h2V5h9v14h-9v-4H9v4c0 1.103.897 2 2 2h9c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2z"/>
                </svg>
                Logout
              </button>
            </div>
          </div>
          <div class="nav-center">
            <button :class="{ active: currentView === 'form' }" @click="show('form')">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Add Transaction
            </button>
            <button :class="{ active: currentView === 'datatable' }" @click="show('datatable')">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/>
                <path d="M7 7h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zM7 11h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zM7 15h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
              </svg>
              Transactions
            </button>
            <button :class="{ active: currentView === 'stats' }" @click="show('stats')">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/>
                <path d="M7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z"/>
              </svg>
              Stats
            </button>
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
    
    <!-- Global Modal -->
    <Modal
      :isVisible="modalState.isVisible"
      :type="modalState.type"
      :title="modalState.title"
      :message="modalState.message"
      :confirmText="modalState.confirmText"
      :cancelText="modalState.cancelText"
      :closeOnOverlay="modalState.closeOnOverlay"
      @confirm="handleConfirm"
      @cancel="handleCancel"
      @close="handleClose"
    />
  </div>
</template>

<script setup>
import TransactionForm from './components/TransactionForm.vue';
import DataTable from './components/DataTable.vue';
import Login from './components/Login.vue';
import Stats from './components/Stats.vue';
import Modal from './components/Modal.vue';
import NotificationBell from './components/NotificationBell.vue';
import { ref, onMounted } from 'vue';
import { db, auth } from './firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useModal } from './composables/useModal';


const transactions = ref([]);
const currentView = ref('form');
const user = ref(null);
const transactionToEdit = ref(null);
const userIdToName = ref({});
const isAllowed = ref(false);

// Modal composable
const { modalState, handleConfirm, handleCancel, handleClose } = useModal();

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
    
    // Ordinamento primario per data (decrescente)
    const dateDiff = dateB - dateA;
    if (dateDiff !== 0) {
      return dateDiff;
    }
    
    // Ordinamento secondario per createdAt (decrescente) se le date sono uguali
    const createdAtA = a.createdAt?.seconds ? a.createdAt.seconds : 0;
    const createdAtB = b.createdAt?.seconds ? b.createdAt.seconds : 0;
    return createdAtB - createdAtA;
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
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1rem;
}

.nav-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.nav-brand {
  flex: 3;
  padding-right: 1rem;
}

.nav-brand h2 {
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
}

.nav-center {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

nav button {
  background: none;
  border: none;
  font-size: 0.875rem;
  color: #374151;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

nav button:hover {
  background: #4b5563;
  color: white;
  transform: translateY(-1px);
}

nav button.active {
  background: #374151;
  color: white;
  font-weight: 600;
}

.logout-btn {
  background: #ef4444 !important;
  color: white !important;
  border-radius: 8px;
  padding: 0.5rem 0.875rem !important;
  font-weight: 600;
  font-size: 0.8rem !important;
  min-width: fit-content;
}

.logout-btn:hover {
  background: #dc2626 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.logout-btn svg {
  width: 14px;
  height: 14px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .navbar {
    padding: 0.75rem;
  }
  
  .nav-top {
    margin-bottom: 0.75rem;
  }
  
  .nav-brand h2 {
    font-size: 1.1rem;
  }
  
  .nav-center {
    gap: 0.25rem;
  }
  
  nav button {
    font-size: 0.75rem;
    padding: 0.5rem 0.75rem;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 80px;
  }
  
  nav button svg {
    width: 16px;
    height: 16px;
  }
  
  .logout-btn {
    font-size: 0.7rem !important;
    padding: 0.5rem 0.7rem !important;
  }
  
  .logout-btn svg {
    width: 12px;
    height: 12px;
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  .nav-brand h2 {
    font-size: 1rem;
  }
  
  nav button {
    font-size: 0.7rem;
    padding: 0.4rem 0.6rem;
    min-width: 70px;
  }
  
  nav button svg {
    width: 14px;
    height: 14px;
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