import { computed, ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import { CATEGORIES, BUDGET_POTS } from '../config.js'
import { getInitialBalances } from '../store.js'

// ── Date utilities ────────────────────────────────────────

function isoToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateFromIso(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDays(iso, n) {
  const d = dateFromIso(iso)
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Inclusive day count between two ISO dates
function spanDays(from, to) {
  return Math.round((dateFromIso(to) - dateFromIso(from)) / 86400000) + 1
}

// Overlap in days between [aFrom, aTo] and [bFrom, bTo]
function overlapDays(aFrom, aTo, bFrom, bTo) {
  const start = aFrom > bFrom ? aFrom : bFrom
  const end   = aTo   < bTo   ? aTo   : bTo
  return start > end ? 0 : spanDays(start, end)
}

const MONTH_FMT = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' })

// ── Component ─────────────────────────────────────────────

export default {
  props: {
    transactions: { type: Array, default: () => [] },
  },
  setup(props) {
    const mode = ref('30days') // '30days' | 'month'

    const now = new Date()
    const selectedYear  = ref(now.getFullYear())
    const selectedMonth = ref(now.getMonth() + 1) // 1-12

    // ── Date range for current mode ───────────────────────
    const dateRange = computed(() => {
      if (mode.value === '30days') {
        const end   = isoToday()
        const start = addDays(end, -29)
        return { start, end, days: 30 }
      }
      const y = selectedYear.value
      const m = selectedMonth.value
      const start = `${y}-${String(m).padStart(2, '0')}-01`
      const days  = new Date(y, m, 0).getDate()
      const end   = `${y}-${String(m).padStart(2, '0')}-${String(days).padStart(2, '0')}`
      return { start, end, days }
    })

    // ── Transactions ──────────────────────────────────────
    const allTransactions = computed(() => props.transactions)

    // ── Consumption totals for the period ─────────────────
    // Each expense's amount is distributed across its consumption range.
    // We calculate the overlap with the selected period.
    const periodData = computed(() => {
      const { start, end } = dateRange.value
      const catTotals = {}
      let total = 0

      for (const tx of allTransactions.value) {
        if (tx.type !== 'expense') continue

        const from = tx.consumption_from || tx.spending_date
        const to   = tx.consumption_to   || from

        const overlap = overlapDays(from, to, start, end)
        if (overlap <= 0) continue

        const txDays   = spanDays(from, to)
        const consumed = tx.amount - (tx.secondary_amount ?? 0)
        const amount   = (consumed / txDays) * overlap

        total += amount
        const cat = tx.category || 'sonstiges'
        catTotals[cat] = (catTotals[cat] || 0) + amount
      }

      return { total, catTotals }
    })

    const totalAmount = computed(() => periodData.value.total)

    const avgDays = computed(() => {
      if (mode.value === '30days') return 30
      const n = new Date()
      if (selectedYear.value === n.getFullYear() && selectedMonth.value === n.getMonth() + 1) {
        return n.getDate()
      }
      return dateRange.value.days
    })

    const dailyAverage = computed(() => totalAmount.value / avgDays.value)

    const categoryRows = computed(() =>
      CATEGORIES
        .map(c => ({ ...c, amount: periodData.value.catTotals[c.id] || 0 }))
        .filter(c => c.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .map(c => ({ ...c, pct: totalAmount.value > 0 ? (c.amount / totalAmount.value) * 100 : 0 }))
    )

    // ── Month navigation ──────────────────────────────────
    function prevMonth() {
      if (selectedMonth.value === 1) { selectedYear.value--; selectedMonth.value = 12 }
      else selectedMonth.value--
    }

    function nextMonth() {
      if (selectedMonth.value === 12) { selectedYear.value++; selectedMonth.value = 1 }
      else selectedMonth.value++
    }

    const monthLabel = computed(() =>
      MONTH_FMT.format(new Date(selectedYear.value, selectedMonth.value - 1, 1))
    )

    const canGoNext = computed(() => {
      const n = new Date()
      return !(selectedYear.value === n.getFullYear() && selectedMonth.value === n.getMonth() + 1)
    })

    // ── Pot balances (all-time) ────────────────────────────
    const potBalances = computed(() => {
      const initial = getInitialBalances()
      const bal = Object.fromEntries(BUDGET_POTS.map(p => [p.id, initial[p.id] || 0]))
      for (const tx of allTransactions.value) {
        if (tx.type === 'expense') {
          bal[tx.from_pot] -= tx.amount
          if (tx.secondary_pot != null && tx.secondary_amount != null)
            bal[tx.secondary_pot] += tx.secondary_amount
        } else if (tx.type === 'transfer') {
          bal[tx.from_pot] -= tx.amount
          if (tx.to_pot) bal[tx.to_pot] += tx.amount
        }
      }
      return BUDGET_POTS.map(p => ({ ...p, balance: bal[p.id] }))
    })

    const fmt = n => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    return {
      mode, monthLabel, canGoNext, prevMonth, nextMonth,
      totalAmount, dailyAverage, categoryRows, potBalances, fmt,
    }
  },

  template: `
    <div class="statistics">
      <h1>Statistik</h1>

      <!-- Mode toggle -->
      <div class="type-toggle">
        <button :class="{ active: mode === '30days' }" @click="mode = '30days'">30 Tage</button>
        <button :class="{ active: mode === 'month' }"  @click="mode = 'month'">Monat</button>
      </div>

      <!-- Month navigator -->
      <div class="month-nav" v-if="mode === 'month'">
        <button class="month-nav-btn" @click="prevMonth">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span class="month-nav-label">{{ monthLabel }}</span>
        <button class="month-nav-btn" @click="nextMonth" :disabled="!canGoNext">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      <!-- Summary cards -->
      <div class="stats-summary">
        <div class="summary-card">
          <span class="summary-label">Gesamt</span>
          <span class="summary-value">{{ fmt(totalAmount) }}&thinsp;€</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Ø pro Tag</span>
          <span class="summary-value">{{ fmt(dailyAverage) }}&thinsp;€</span>
        </div>
      </div>

      <!-- Category breakdown -->
      <div class="category-breakdown" v-if="categoryRows.length > 0">
        <h2>Nach Kategorie</h2>
        <div class="stats-category-row" v-for="cat in categoryRows" :key="cat.id">
          <div class="tx-indicator" :style="{ background: cat.bg, color: cat.color }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="cat.icon" />
          </div>
          <div class="stats-category-info">
            <div class="stats-category-header">
              <span class="stats-category-name">{{ cat.label }}</span>
              <span class="stats-category-amount">{{ fmt(cat.amount) }}&thinsp;€</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: cat.pct + '%', background: cat.color }" />
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" v-else>
        <p>Keine Ausgaben in diesem Zeitraum.</p>
      </div>

      <!-- Pot balances -->
      <div class="pot-balances">
        <h2>Salden</h2>
        <div class="pot-balance-row" v-for="p in potBalances" :key="p.id">
          <span class="pot-balance-name">{{ p.label }}</span>
          <span class="pot-balance-amount" :class="p.balance > 0 ? 'pot-balance--pos' : p.balance === 0 ? 'pot-balance--zero' : ''">
            {{ p.balance > 0 ? '+' : '' }}{{ fmt(p.balance) }}&thinsp;€
          </span>
        </div>
      </div>
    </div>
  `,
}
