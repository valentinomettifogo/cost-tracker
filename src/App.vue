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
          <!-- Desktop Layout: Single row -->
          <div class="nav-desktop">
            <!-- <div class="nav-brand">
              <h2>{{ user?.displayName || user?.email || 'User' }}</h2>
            </div> -->
            <div class="nav-center">
              <button :class="{ active: currentView === 'form' }" @click="show('form')" class="nav-center-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Add
              </button>
              <button :class="{ active: currentView === 'datatable' }" @click="show('datatable')" class="nav-center-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/>
                  <path d="M7 7h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zM7 11h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zM7 15h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
                </svg>
                Detail
              </button>
              <button :class="{ active: currentView === 'stats' }" @click="show('stats')" class="nav-center-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/>
                  <path d="M7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z"/>
                </svg>
                Stat
              </button>
            </div>
            <div class="nav-right">
              <NotificationBell />
              <SettingsDropdown :user="user" />
            </div>
          </div>
          
          <!-- Mobile Layout: Single row -->
          <div class="nav-mobile">
            <div class="nav-center">
              <button :class="{ active: currentView === 'form' }" @click="show('form')" class="nav-center-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Add
              </button>
              <button :class="{ active: currentView === 'datatable' }" @click="show('datatable')" class="nav-center-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/>
                  <path d="M7 7h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zM7 11h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zM7 15h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
                </svg>
                Detail
              </button>
              <button :class="{ active: currentView === 'stats' }" @click="show('stats')" class="nav-center-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/>
                  <path d="M7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z"/>
                </svg>
                Stat
              </button>
            </div>
            <div class="nav-right">
              <NotificationBell />
              <SettingsDropdown :user="user" />
            </div>
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
    
    <!-- Categories Settings Modal -->
    <div v-if="showCategoriesModal" class="modal-overlay" @click="closeCategoriesModal">
      <div class="categories-modal" @click.stop>
        <div class="categories-modal-header">
          <h3>Manage Categories</h3>
          <button @click="closeCategoriesModal" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div class="categories-modal-body">
          <CategoriesSettings />
        </div>
      </div>
    </div>
    
    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<script setup>
import TransactionForm from './components/TransactionForm.vue';
import DataTable from './components/DataTable.vue';
import Login from './components/Login.vue';
import Stats from './components/Stats.vue';
import Modal from './components/Modal.vue';
import NotificationBell from './components/NotificationBell.vue';
import SettingsDropdown from './components/SettingsDropdown.vue';
import ToastContainer from './components/ToastContainer.vue';
import CategoriesSettings from './components/CategoriesSettings.vue';
import { ref, onMounted } from 'vue';
import { db, auth } from './firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useModal } from './composables/useModal';
import { useCategoriesModal } from './composables/useCategoriesModal';


const transactions = ref([]);
const currentView = ref('form');
const user = ref(null);
const transactionToEdit = ref(null);
const userIdToName = ref({});
const isAllowed = ref(false);

// Modal composable
const { modalState, handleConfirm, handleCancel, handleClose } = useModal();

// Categories modal composable
const { showCategoriesModal, closeCategoriesModal } = useCategoriesModal();

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

// Auth functions (logout now handled by SettingsDropdown)

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

/* Desktop Layout: Single row */
.nav-desktop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.nav-mobile {
  display: none;
}

.nav-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.nav-brand {
  flex-shrink: 0;
  min-width: 0;
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
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.nav-center {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
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



/* Mobile responsive */
@media (max-width: 768px) {
  .navbar {
    padding: 0.75rem;
  }
  
  /* Hide desktop layout, show mobile layout */
  .nav-desktop {
    display: none;
  }
  
  .nav-mobile {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }
  
  .nav-center {
    display: flex;
    gap: 0.25rem;
    flex: 1;
    justify-content: center;
  }
  
  .nav-right {
    flex-shrink: 0;
  }
  
  nav button {
    font-size: 0.7rem;
    padding: 0.4rem 0.6rem;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 70px;
  }
  
  .nav-center-btn {
    flex: 1;
    max-width: 80px;
  }
  
  nav button svg {
    width: 16px;
    height: 16px;
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
/* Nav-center button: same width for all */
.nav-center-btn {
  flex: 1 1 0;
  min-width: 90px;
  max-width: 120px;
  justify-content: center;
  text-align: center;
}

/* Categories Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.categories-modal {
  background: white;
  border-radius: 8px;
  max-width: 800px;
  width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.categories-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.categories-modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.categories-modal-body {
  padding: 0;
  overflow-y: auto;
  max-height: calc(80vh - 80px);
}
</style>

