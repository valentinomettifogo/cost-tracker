<template>
  <form @submit.prevent="handleSubmit">
    <div class="grid">
      <div class="col-12">
        <label>Amount</label>
  <input v-model.number="transaction.amount" type="number" step="0.01" required />
      </div>
      <div class="col-12">
        <label>Category</label>
        <select v-model="transaction.category" required>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div class="col-12">
        <label>Description</label>
        <input v-model="transaction.description" type="text" required />
      </div>
      <div class="col-12">
        <label>Date</label>
        <input v-model="transaction.date" type="date" required />
      </div>
      <div class="col-8">
        <label>Type</label>
        <select v-model="transaction.type">
          <option value="spend">Spend</option>
          <option value="income">Income</option>
          <option value="savings">Savings</option>
        </select>
      </div>
      <div class="col-4">
        <div class="flex items-center" style="height: 100%; padding-top: 1.5rem;">
          <input v-model="transaction.isRecurring" type="checkbox" id="recurring" />
          <label for="recurring" class="mr-0" style="margin-bottom: 0;">Recurring?</label>
        </div>
      </div>
    </div>
    <div class="mt-4">
      <button type="submit">Save Transaction</button>
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { db } from "../firebase";
import { collection, addDoc, updateDoc, Timestamp, doc, getDoc } from "firebase/firestore";
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
const { user } = useAuth();

const categories = ref([]);
const transaction = ref({
  amount: 0,
  category: "",
  currency: "EUR",
  date: getToday(),
  description: "",
  isRecurring: false,
  type: "spend",
  userId: user.value?.uid || ""
});

// Precompila il form se editTransaction cambia
watch(() => props.editTransaction, (val) => {
  if (val) {
    transaction.value = {
      ...val,
      date: formatDateForInput(val.date)
    };
  } else {
    resetForm();
  }
}, { immediate: true });

onMounted(async () => {
  const categoryDoc = await getDoc(doc(db, "apps", "budget", "config", "category"));
  if (categoryDoc.exists()) {
    categories.value = categoryDoc.data().name || [];
    // Imposta la categoria di default solo se non stai editando
    if (categories.value.length > 0 && !props.editTransaction) {
      transaction.value.category = categories.value[0];
    }
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
    amount: 0,
    category: "",
    currency: "EUR",
    date: getToday(),
    description: "",
    isRecurring: false,
    type: "spend",
    userId: user.value?.uid || ""
  };
}

const handleSubmit = async () => {
  // Validazione aggiuntiva per i campi obbligatori
  if (!transaction.value.amount || transaction.value.amount <= 0) {
    alert("Please enter a valid amount greater than 0");
    return;
  }
  
  if (!transaction.value.description || transaction.value.description.trim() === "") {
    alert("Please enter a description");
    return;
  }

  if (props.editTransaction && props.editTransaction.id) {
    // Modifica
    try {
      await updateDoc(doc(db, "apps", "budget", "transactions", props.editTransaction.id), {
        ...transaction.value,
        description: transaction.value.description.trim(), // Removes extra spaces
        date: Timestamp.fromDate(new Date(transaction.value.date)),
        userId: user.value?.uid || ""
      });
      emit('edited', { ...transaction.value, id: props.editTransaction.id });
      resetForm();
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  } else {
    // Nuova
    try {
      await addDoc(collection(db, "apps", "budget", "transactions"), {
        ...transaction.value,
        description: transaction.value.description.trim(), // Removes extra spaces
        userId: user.value?.uid || "",
        date: Timestamp.fromDate(new Date(transaction.value.date))
      });
      alert("Transaction saved!");
      resetForm();
    } catch (e) {
      console.error("Error adding document: ", e);
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
    width: 60%;
    margin: 2rem auto;
    padding: 2rem;
  }
}

@media (min-width: 1024px) {
  form {
    width: 40%;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  display: block;
}

input,
select,
textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  font-size: 1rem;
  color: #374151;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
  width: 100%;
}

/* Mobile improvements */
@media (max-width: 767px) {
  input,
  select,
  textarea {
    padding: 1rem;
    font-size: 16px; /* Previene lo zoom su iOS */
    border-radius: 8px;
  }
  
  label {
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #6b7280;
  box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.1);
}

input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin-right: 0.5rem;
  accent-color: #374151;
}

/* Mobile checkbox adjustments */
@media (max-width: 767px) {
  input[type="checkbox"] {
    width: 20px;
    height: 20px;
  }
  
  .col-4.flex.items-center {
    justify-content: flex-start;
    gap: 0.5rem;
  }
  
  .col-4.flex.items-center label {
    margin-bottom: 0;
  }
}

textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

button {
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 6px;
  background: #374151;
  color: #ffffff;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 0.5rem;
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