<template>
  <div class="stats-container">
    <div class="stats-header">
      <h3>Statistics & Analytics</h3>
      
      <!-- Filtri -->
      <div class="filters">
        <div class="filter-group">
          <label for="yearFilter">Year:</label>
          <select id="yearFilter" v-model="selectedYear" @change="updateCharts">
            <option value="all">All Years</option>
            <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="monthFilter">Month:</label>
          <select id="monthFilter" v-model="selectedMonth" @change="updateCharts">
            <option value="all">All Months</option>
            <option v-for="(month, index) in months" :key="index" :value="index + 1">{{ month }}</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="categoryFilter">Category:</label>
          <select id="categoryFilter" v-model="selectedCategory" @change="updateCharts">
            <option value="all">All Categories</option>
            <option v-for="category in availableCategories" :key="category" :value="category">{{ category }}</option>
          </select>
        </div>
        
        <button @click="resetFilters" class="reset-btn">Reset Filters</button>
      </div>
    </div>

    <!-- Stats Summary Cards -->
    <div class="summary-cards">
      <div class="card income">
        <div class="card-header">
          <h4>Total Income</h4>
          <span class="icon">📈</span>
        </div>
        <div class="card-value">€{{ totalIncome.toFixed(2) }}</div>
      </div>
      
      <div class="card cost">
        <div class="card-header">
          <h4>Total Costs</h4>
          <span class="icon">📉</span>
        </div>
        <div class="card-value">€{{ totalCosts.toFixed(2) }}</div>
      </div>
      
      <div class="card saving">
        <div class="card-header">
          <h4>Total Savings</h4>
          <span class="icon">💰</span>
        </div>
        <div class="card-value">€{{ totalSavings.toFixed(2) }}</div>
      </div>
      
      <div class="card balance">
        <div class="card-header">
          <h4>Net Balance</h4>
          <span class="icon">⚖️</span>
        </div>
        <div class="card-value" :class="{ negative: netBalance < 0 }">€{{ netBalance.toFixed(2) }}</div>
      </div>
    </div>

    <!-- Charts Container -->
    <div class="charts-container">
      <!-- Bar Chart - Amount by Type per Month -->
      <div class="chart-section">
        <h4>Monthly Amount by Type</h4>
        <div class="chart-wrapper">
          <canvas ref="barChart"></canvas>
        </div>
      </div>
      
      <!-- Pie Chart - Amount by Category -->
      <div class="chart-section">
        <h4>Amount by Category</h4>
        <div class="chart-wrapper">
          <canvas ref="pieChart"></canvas>
        </div>
      </div>
    </div>
    
    <!-- Transactions Table Summary -->
    <div class="table-summary">
      <h4>Filtered Results: {{ filteredTransactions.length }} transactions</h4>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  ArcElement,
  PieController,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Registra i componenti di Chart.js
Chart.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  BarController,
  ArcElement, 
  PieController,
  Title, 
  Tooltip, 
  Legend
);

const props = defineProps({
  transactions: {
    type: Array,
    default: () => []
  }
});

// Refs per i chart canvas
const barChart = ref(null);
const pieChart = ref(null);

// Chart instances
let barChartInstance = null;
let pieChartInstance = null;

// Filtri
const selectedYear = ref('all');
const selectedMonth = ref('all');
const selectedCategory = ref('all');

// Dati per i selettori
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Computed properties
const availableYears = computed(() => {
  const years = new Set();
  props.transactions.forEach(tx => {
    if (tx.date) {
      let date;
      if (typeof tx.date === 'string') {
        date = new Date(tx.date);
      } else if (tx.date.seconds) {
        date = new Date(tx.date.seconds * 1000);
      } else {
        date = new Date(tx.date);
      }
      years.add(date.getFullYear());
    }
  });
  return Array.from(years).sort((a, b) => b - a);
});

const availableCategories = computed(() => {
  const categories = new Set();
  props.transactions.forEach(tx => {
    if (tx.category) {
      categories.add(tx.category);
    }
  });
  return Array.from(categories).sort();
});

const filteredTransactions = computed(() => {
  return props.transactions.filter(tx => {
    let date;
    if (typeof tx.date === 'string') {
      date = new Date(tx.date);
    } else if (tx.date.seconds) {
      date = new Date(tx.date.seconds * 1000);
    } else {
      date = new Date(tx.date);
    }
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    const yearMatch = selectedYear.value === 'all' || year === parseInt(selectedYear.value);
    const monthMatch = selectedMonth.value === 'all' || month === parseInt(selectedMonth.value);
    const categoryMatch = selectedCategory.value === 'all' || tx.category === selectedCategory.value;
    
    return yearMatch && monthMatch && categoryMatch;
  });
});

// Summary computeds
const totalIncome = computed(() => {
  return filteredTransactions.value
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);
});

const totalCosts = computed(() => {
  return filteredTransactions.value
    .filter(tx => tx.type === 'cost')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);
});

const totalSavings = computed(() => {
  return filteredTransactions.value
    .filter(tx => tx.type === 'saving')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);
});

const netBalance = computed(() => {
  return totalIncome.value - totalCosts.value;
});

// Chart data computeds
const barChartData = computed(() => {
  const monthlyData = {};
  
  filteredTransactions.value.forEach(tx => {
    let date;
    if (typeof tx.date === 'string') {
      date = new Date(tx.date);
    } else if (tx.date.seconds) {
      date = new Date(tx.date.seconds * 1000);
    } else {
      date = new Date(tx.date);
    }
    
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = { income: 0, cost: 0, saving: 0 };
    }
    
    monthlyData[monthYear][tx.type] += tx.amount || 0;
  });
  
  const sortedMonths = Object.keys(monthlyData).sort();
  
  return {
    labels: sortedMonths,
    datasets: [
      {
        label: 'Income',
        data: sortedMonths.map(month => monthlyData[month].income),
        backgroundColor: '#16a34a',
        borderColor: '#15803d',
        borderWidth: 1
      },
      {
        label: 'Costs',
        data: sortedMonths.map(month => monthlyData[month].cost),
        backgroundColor: '#dc2626',
        borderColor: '#b91c1c',
        borderWidth: 1
      },
      {
        label: 'Savings',
        data: sortedMonths.map(month => monthlyData[month].saving),
        backgroundColor: '#ea580c',
        borderColor: '#c2410c',
        borderWidth: 1
      }
    ]
  };
});

const pieChartData = computed(() => {
  const categoryData = {};
  
  filteredTransactions.value.forEach(tx => {
    if (!categoryData[tx.category]) {
      categoryData[tx.category] = 0;
    }
    categoryData[tx.category] += tx.amount || 0;
  });
  
  const colors = [
    '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ];
  
  return {
    labels: Object.keys(categoryData),
    datasets: [{
      data: Object.values(categoryData),
      backgroundColor: colors.slice(0, Object.keys(categoryData).length),
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };
});

// Methods
const resetFilters = () => {
  selectedYear.value = 'all';
  selectedMonth.value = 'all';
  selectedCategory.value = 'all';
  updateCharts();
};

const updateCharts = async () => {
  await nextTick();
  createBarChart();
  createPieChart();
};

const createBarChart = () => {
  if (barChartInstance) {
    barChartInstance.destroy();
    barChartInstance = null;
  }
  
  const ctx = barChart.value?.getContext('2d');
  if (!ctx) return;
  
  barChartInstance = new Chart(ctx, {
    type: 'bar',
    data: barChartData.value,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '€' + value.toFixed(0);
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': €' + context.parsed.y.toFixed(2);
            }
          }
        },
        legend: {
          position: 'top'
        }
      }
    }
  });
};

const createPieChart = () => {
  if (pieChartInstance) {
    pieChartInstance.destroy();
    pieChartInstance = null;
  }
  
  const ctx = pieChart.value?.getContext('2d');
  if (!ctx) return;
  
  pieChartInstance = new Chart(ctx, {
    type: 'pie',
    data: pieChartData.value,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return context.label + ': €' + value.toFixed(2) + ' (' + percentage + '%)';
            }
          }
        },
        legend: {
          position: 'bottom'
        }
      }
    }
  });
};

// Lifecycle
onMounted(() => {
  nextTick(() => {
    createBarChart();
    createPieChart();
  });
});

onUnmounted(() => {
  if (barChartInstance) {
    barChartInstance.destroy();
    barChartInstance = null;
  }
  if (pieChartInstance) {
    pieChartInstance.destroy();
    pieChartInstance = null;
  }
});

// Watch for transaction changes
watch(() => props.transactions, () => {
  updateCharts();
}, { deep: true });
</script>

<style scoped>
.stats-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.stats-header {
  margin-bottom: 2rem;
}

.stats-header h3 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 2rem;
  font-weight: 700;
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: end;
  flex-wrap: wrap;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  min-width: 120px;
}

.reset-btn {
  padding: 0.5rem 1rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  height: fit-content;
}

.reset-btn:hover {
  background: #4b5563;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.card {
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: white;
}

.card.income {
  border-left: 4px solid #16a34a;
}

.card.cost {
  border-left: 4px solid #dc2626;
}

.card.saving {
  border-left: 4px solid #ea580c;
}

.card.balance {
  border-left: 4px solid #3b82f6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h4 {
  margin: 0;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-header .icon {
  font-size: 1.5rem;
}

.card-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
}

.card-value.negative {
  color: #dc2626;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.chart-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-section h4 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.25rem;
  font-weight: 600;
}

.chart-wrapper {
  position: relative;
  height: 400px;
}

.table-summary {
  text-align: center;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  margin-top: 2rem;
}

.table-summary h4 {
  margin: 0;
  color: #4b5563;
  font-weight: 500;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .chart-wrapper {
    height: 300px;
  }
}
</style>