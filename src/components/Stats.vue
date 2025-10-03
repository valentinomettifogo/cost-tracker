<template>
  <div class="stats-container">
    <div class="stats-header">
      
      <!-- Toggle Filters Button (Desktop) -->
      <button class="toggle-filters-btn desktop-toggle" @click="filtersOpen = !filtersOpen">
        <span v-if="!filtersOpen">Show Filters</span>
        <span v-else>Hide Filters</span>
        <svg v-if="!filtersOpen" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 14l5-5 5 5z"/>
        </svg>
      </button>
      
      <!-- Desktop Filters -->
      <transition name="fade">
        <div v-show="filtersOpen" class="filters desktop-filters">
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
            <option value="ytd">YTD (Jan-Current)</option>
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
      </transition>

      <!-- Toggle Filters Button (Mobile) -->
      <button class="toggle-filters-btn mobile-toggle" @click="mobileFiltersOpen = !mobileFiltersOpen">
        <span v-if="!mobileFiltersOpen">Show Filters</span>
        <span v-else>Hide Filters</span>
        <svg v-if="!mobileFiltersOpen" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 14l5-5 5 5z"/>
        </svg>
      </button>

      <!-- Mobile Filters -->
      <transition name="fade">
        <div v-show="mobileFiltersOpen" class="mobile-filters">
        <!-- Filtri con layout labels/boxes -->
        <div class="filters-layout">
          <div class="labels-column">
            <div class="filter-label">Year:</div>
            <div class="filter-label">Month:</div>
            <div class="filter-label">Category:</div>
          </div>
          
          <div class="boxes-column">
            <select v-model="selectedYear" @change="updateCharts" class="filter-select uniform-size">
              <option value="all">All Years</option>
              <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
            </select>
            
            <select v-model="selectedMonth" @change="updateCharts" class="filter-select uniform-size">
              <option value="all">All Months</option>
              <option value="ytd">YTD (Jan-Current)</option>
              <option v-for="(month, index) in months" :key="index" :value="index + 1">{{ month }}</option>
            </select>
            
            <select v-model="selectedCategory" @change="updateCharts" class="filter-select uniform-size">
              <option value="all">All Categories</option>
              <option v-for="category in availableCategories" :key="category" :value="category">{{ category }}</option>
            </select>
          </div>
        </div>
        
        <div class="filter-actions">
          <button @click="resetFilters" class="reset-filters-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            Reset
          </button>
        </div>
        </div>
      </transition>
    </div>

    <!-- Stats Summary Cards -->
    <div class="summary-cards">
      <div class="card income">
        <div class="card-header">
          <h4>Total Income</h4>
          <span class="icon">📈</span>
        </div>
        <div class="card-value">€{{ formatCurrency(totalIncome) }}</div>
      </div>
      
      <div class="card cost">
        <div class="card-header">
          <h4>Total Spends</h4>
          <span class="icon">📉</span>
        </div>
        <div class="card-value">€{{ formatCurrency(totalCosts) }}</div>
      </div>
      
      <div class="card saving">
        <div class="card-header">
          <h4>Total Savings</h4>
          <span class="icon">💰</span>
        </div>
        <div class="card-value">€{{ formatCurrency(totalSavings) }}</div>
      </div>
      
      <div class="card balance">
        <div class="card-header">
          <h4>Net Balance</h4>
          <span class="icon">⚖️</span>
        </div>
        <div class="card-value" :class="{ negative: netBalance < 0 }">€{{ formatCurrency(netBalance) }}</div>
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
import { useCategories } from '../composables/useCategories';
import { useAuth } from '../composables/useAuth';

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

// Get user and categories
const { user } = useAuth();
const { allCategories } = useCategories(user.value?.uid);

// Refs per i chart canvas
const barChart = ref(null);
const pieChart = ref(null);

// Chart instances
let barChartInstance = null;
let pieChartInstance = null;

// Filtri
const selectedYear = ref('all');
const selectedMonth = ref('ytd');
const selectedCategory = ref('all');

// Collapsible filters state
const filtersOpen = ref(true); // desktop - open by default
const mobileFiltersOpen = ref(false); // mobile

// Dati per i selettori
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Get current month for YTD filtering
function getCurrentMonth() {
  return new Date().getMonth() + 1; // 1-based month
}

// Formatter per valuta con virgola come decimale e punto come migliaia (formato IT/EU)
const currencyFormatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const formatCurrency = (value) => {
  return currencyFormatter.format(value);
};

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
  // Use categories from hybrid structure if available, otherwise fall back to transaction extraction
  if (allCategories.value && allCategories.value.length > 0) {
    return allCategories.value.map(cat => cat.name).sort();
  }
  
  // Fallback: extract from transactions for backward compatibility
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
    
    let monthMatch;
    if (selectedMonth.value === 'all') {
      monthMatch = true;
    } else if (selectedMonth.value === 'ytd') {
      // YTD: from January to current month (inclusive)
      const currentMonth = getCurrentMonth();
      monthMatch = month >= 1 && month <= currentMonth;
    } else {
      monthMatch = month === parseInt(selectedMonth.value);
    }
    
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
    .filter(tx => tx.type === 'spend')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);
});

const totalSavings = computed(() => {
  return filteredTransactions.value
    .filter(tx => tx.type === 'savings')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);
});

const netBalance = computed(() => {
  return totalIncome.value - totalCosts.value - totalSavings.value;
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
    
    if (tx.type === 'income') monthlyData[monthYear].income += tx.amount || 0;
    if (tx.type === 'spend') monthlyData[monthYear].cost += tx.amount || 0;
    if (tx.type === 'savings') monthlyData[monthYear].saving += tx.amount || 0;
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
        backgroundColor: '#b99b04',
        borderColor: '#b99b04',
        borderWidth: 1
      }
    ]
  };
});

const pieChartData = computed(() => {
  const categoryData = {};
  
  filteredTransactions.value.forEach(tx => {
    if (tx.type !== 'income') {
      if (!categoryData[tx.category]) {
        categoryData[tx.category] = 0;
      }
      categoryData[tx.category] += tx.amount || 0;
    }
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
  selectedMonth.value = 'ytd';
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
  
  const isMobile = window.innerWidth < 768;
  
  barChartInstance = new Chart(ctx, {
    type: 'bar',
    data: barChartData.value,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            maxRotation: isMobile ? 45 : 0,
            font: {
              size: isMobile ? 10 : 12
            }
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '€' + currencyFormatter.format(value);
            },
            font: {
              size: isMobile ? 10 : 12
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': €' + currencyFormatter.format(context.parsed.y);
            }
          },
          titleFont: {
            size: isMobile ? 12 : 14
          },
          bodyFont: {
            size: isMobile ? 11 : 13
          }
        },
        legend: {
          position: 'top',
          labels: {
            font: {
              size: isMobile ? 11 : 12
            },
            padding: isMobile ? 10 : 20
          }
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
  
  const isMobile = window.innerWidth < 768;
  
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
              return context.label + ': €' + currencyFormatter.format(value) + ' (' + percentage + '%)';
            }
          },
          titleFont: {
            size: isMobile ? 12 : 14
          },
          bodyFont: {
            size: isMobile ? 11 : 13
          }
        },
        legend: {
          position: isMobile ? 'bottom' : 'bottom',
          labels: {
            font: {
              size: isMobile ? 10 : 12
            },
            padding: isMobile ? 8 : 20,
            boxWidth: isMobile ? 12 : 20,
            usePointStyle: isMobile
          }
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
/* Fade transition for filters */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Toggle Filters Button */
.toggle-filters-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #374151;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.toggle-filters-btn:hover {
  background: #4b5563;
}
.desktop-toggle {
  display: none;
}
.mobile-toggle {
  display: none;
}
@media (min-width: 768px) {
  .desktop-toggle {
    display: inline-flex;
  }
}
@media (max-width: 767px) {
  .mobile-toggle {
    display: inline-flex;
    width: 100%;
    justify-content: center;
    margin-bottom: 0.5rem;
  }
}

.stats-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

/* Mobile first approach */
@media (min-width: 768px) {
  .stats-container {
    padding: 2rem;
  }
}

.stats-header {
  margin-bottom: 2rem;
}

.stats-header h3 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 700;
}

@media (min-width: 768px) {
  .stats-header h3 {
    font-size: 2rem;
  }
}

.filters {
  display: flex;
  gap: 0.75rem;
  align-items: end;
  flex-wrap: wrap;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

@media (min-width: 768px) {
  .filters {
    gap: 1rem;
    padding: 1.5rem;
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 100px;
}

@media (min-width: 768px) {
  .filter-group {
    flex: none;
    min-width: 120px;
  }
}

.filter-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.8rem;
}

@media (min-width: 768px) {
  .filter-group label {
    font-size: 0.875rem;
  }
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 0.875rem;
  width: 100%;
}

@media (min-width: 768px) {
  .filter-group select {
    width: auto;
    min-width: 120px;
  }
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
  width: 100%;
  margin-top: 1rem;
  font-size: 0.875rem;
}

@media (min-width: 768px) {
  .reset-btn {
    width: auto;
    margin-top: 0;
  }
}

.reset-btn:hover {
  background: #4b5563;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 2rem 0;
}

@media (min-width: 768px) {
  .summary-cards {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }
}

.card {
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: white;
}

@media (min-width: 768px) {
  .card {
    padding: 1.5rem;
  }
}

.card.income {
  border-left: 4px solid #16a34a;
}

.card.cost {
  border-left: 4px solid #dc2626;
}

.card.saving {
  border-left: 4px solid #FFD700;
}

.card.balance {
  border-left: 4px solid #3b82f6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

@media (min-width: 768px) {
  .card-header {
    margin-bottom: 1rem;
  }
}

.card-header h4 {
  margin: 0;
  color: #374151;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (min-width: 768px) {
  .card-header h4 {
    font-size: 0.875rem;
  }
}

.card-header .icon {
  font-size: 1.25rem;
}

@media (min-width: 768px) {
  .card-header .icon {
    font-size: 1.5rem;
  }
}

.card-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

@media (min-width: 768px) {
  .card-value {
    font-size: 2rem;
  }
}

.card-value.negative {
  color: #dc2626;
}

.charts-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin: 2rem 0;
}

@media (min-width: 1024px) {
  .charts-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }
}

.chart-section {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .chart-section {
    padding: 1.5rem;
  }
}

.chart-section h4 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
}

@media (min-width: 768px) {
  .chart-section h4 {
    font-size: 1.25rem;
  }
}

.chart-wrapper {
  position: relative;
  height: 250px;
  width: 100%;
}

@media (min-width: 480px) {
  .chart-wrapper {
    height: 300px;
  }
}

@media (min-width: 768px) {
  .chart-wrapper {
    height: 350px;
  }
}

@media (min-width: 1024px) {
  .chart-wrapper {
    height: 400px;
  }
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
  font-size: 0.875rem;
}

@media (min-width: 768px) {
  .table-summary h4 {
    font-size: 1rem;
  }
}

/* Mobile-first approach for filters */
.mobile-filters {
  display: block;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.desktop-filters {
  display: none;
}

/* Desktop styles */
@media (min-width: 768px) {
  .mobile-filters {
    display: none;
  }
  
  .desktop-filters {
    display: flex;
  }
}

/* Mobile filters layout */
@media (max-width: 767px) {
  .filters-layout {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1rem;
    align-items: start;
  }
  
  .labels-column {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    padding-top: 0.1rem; /* Allineamento con le select */
  }
  
  .filter-label {
    font-weight: 600;
    color: #374151;
    font-size: 0.85rem;
    height: 44px; /* Slightly smaller for 3 filters */
    display: flex;
    align-items: center;
    white-space: nowrap;
  }
  
  .boxes-column {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }
  
  .uniform-size {
    height: 44px !important;
    width: 100%;
    font-size: 15px !important;
    padding: 0.6rem;
    border-radius: 6px;
    border: 1px solid #d1d5db;
    background: white;
  }
  
  .filter-actions {
    align-items: center;
    justify-content: center;
    margin-top: 0.5rem;
    display: flex;
    gap: 0.5rem;
  }
  
  .reset-filters-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    padding: 0.75rem 1rem;
    width: auto;
    min-width: 120px;
    background: #6b7280;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.875rem;
    transition: background-color 0.2s ease;
  }
  
  .reset-filters-btn:hover {
    background: #4b5563;
  }
  
  .reset-filters-btn svg {
    flex-shrink: 0;
  }
}

/* Mobile specific optimizations */
@media (max-width: 479px) {
  .mobile-filters {
    padding: 0.75rem;
  }
  
  .filter-label {
    font-size: 0.8rem;
  }
  
  .uniform-size {
    font-size: 14px !important;
    padding: 0.5rem;
    height: 40px !important;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .card {
    padding: 0.75rem;
  }
  
  .card-value {
    font-size: 1.1rem;
  }
  
  .chart-wrapper {
    height: 220px;
  }
}
</style>
