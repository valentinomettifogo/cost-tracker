<template>
  <form @submit.prevent="addTransaction">
    <div class="grid">
      <div class="col-12">
        <label>Amount</label>
        <input v-model.number="transaction.amount" type="number" required />
      </div>
      <div class="col-12">
        <label>Category</label>
        <select v-model="transaction.category" required>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div class="col-12">
        <label>Description</label>
        <input v-model="transaction.description" type="text" />
      </div>
      <div class="col-12">
        <label>Date</label>
        <input v-model="transaction.date" type="date" required />
      </div>
      <div class="col-8">
        <label>Type</label>
        <select v-model="transaction.type">
          <option value="cost">Spend</option>
          <option value="income">Income</option>
          <option value="saving">Saving</option>
        </select>
      </div>
      <div class="col-4 flex items-center">
        <label class="mr-2">Recurring?</label>
        <input v-model="transaction.isRecurring" type="checkbox" />
      </div>
    </div>
    <div class="mt-4">
      <button type="submit">Save Transaction</button>
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { db } from "../firebase";
import { collection, addDoc, Timestamp, doc, getDoc } from "firebase/firestore";

function getToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

const categories = ref([]);
const transaction = ref({
  amount: 0,
  category: "",
  currency: "EUR",
  date: getToday(),
  description: "",
  isRecurring: false,
  type: "cost",
  userId: "user_123"
});

onMounted(async () => {
  const categoryDoc = await getDoc(doc(db, "apps", "budget", "config", "category"));
  if (categoryDoc.exists()) {
    categories.value = categoryDoc.data().name || [];
    if (categories.value.length > 0) {
      transaction.value.category = categories.value[0];
    }
  }
});
const addTransaction = async () => {
  try {
    await addDoc(collection(db, "apps", "budget", "transactions"), {
      ...transaction.value,
      date: Timestamp.fromDate(new Date(transaction.value.date))
    });
    alert("Transaction saved!");
    transaction.value = {
      amount: 0,
      category: "",
      currency: "EUR",
      date: getToday(),
      description: "",
      isRecurring: false,
      type: "cost",
      userId: "user_123"
    };
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};
</script>

<style scoped>
form {
  width: 40%;
  max-width: 900px;
  margin: 2rem auto;
  padding: 1rem 2rem;
  background: #ffffff;
  box-sizing: border-box;
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

button:hover {
  background: #4b5563;
}

button:active {
  background: #1f2937;
}
</style>