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

// Monday of the week containing the given ISO date
function weekStart(iso) {
  const d = dateFromIso(iso)
  const day = d.getDay() // 0=Sun … 6=Sat
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const MONTH_FMT   = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' })
const MONTH_SHORT = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
const DATE_SHORT = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' })

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return DATE_SHORT.format(new Date(y, m - 1, d))
}

// ── Component ─────────────────────────────────────────────

export default {
  props: {
    transactions: { type: Array, default: () => [] },
  },
  setup(props) {
    const mode = ref('30days') // '30days' | 'month' | 'week'

    const now = new Date()
    const selectedYear      = ref(now.getFullYear())
    const selectedMonth     = ref(now.getMonth() + 1) // 1-12
    const selectedWeekStart = ref(weekStart(isoToday()))
    const weekWindowEnd     = ref(weekStart(isoToday())) // rightmost bar in the chart

    // ── Date range for current mode ───────────────────────
    const dateRange = computed(() => {
      if (mode.value === '30days') {
        const end   = isoToday()
        const start = addDays(end, -29)
        return { start, end, days: 30 }
      }
      if (mode.value === 'week') {
        const start = selectedWeekStart.value
        const end   = addDays(start, 6)
        return { start, end, days: 7 }
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
      const catTxs    = {}
      let total = 0

      for (const tx of allTransactions.value) {
        if (tx.type !== 'expense') continue

        const from = tx.consumption_from || tx.spending_date
        const to   = tx.consumption_to   || from

        const overlap = overlapDays(from, to, start, end)
        if (overlap <= 0) continue

        const txDays      = spanDays(from, to)
        const consumed    = tx.amount - (tx.secondary_amount ?? 0)
        const amount      = (consumed / txDays) * overlap

        total += amount
        const cat = tx.category || 'sonstiges'
        catTotals[cat] = (catTotals[cat] || 0) + amount
        if (!catTxs[cat]) catTxs[cat] = []
        catTxs[cat].push({ tx, periodAmount: amount })
      }

      for (const cat in catTxs) {
        catTxs[cat].sort((a, b) => b.tx.spending_date.localeCompare(a.tx.spending_date))
      }

      return { total, catTotals, catTxs }
    })

    const totalAmount = computed(() => periodData.value.total)

    const avgDays = computed(() => {
      if (mode.value === '30days') return 30
      if (mode.value === 'week') {
        const today   = isoToday()
        const weekEnd = addDays(selectedWeekStart.value, 6)
        if (selectedWeekStart.value > today) return 7   // future week: full 7 days
        if (weekEnd > today) return spanDays(selectedWeekStart.value, today) // current week: elapsed days only
        return 7
      }
      const n = new Date()
      if (selectedYear.value === n.getFullYear() && selectedMonth.value === n.getMonth() + 1) {
        return n.getDate()
      }
      return dateRange.value.days
    })

    const dailyAverage = computed(() => totalAmount.value / avgDays.value)

    const categoryRows = computed(() =>
      CATEGORIES
        .map(c => ({
          ...c,
          amount: periodData.value.catTotals[c.id] || 0,
          txs:    periodData.value.catTxs[c.id]    || [],
        }))
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
      // Always allow going back to past or current month
      if (selectedYear.value < n.getFullYear()) return true
      if (selectedYear.value === n.getFullYear() && selectedMonth.value < n.getMonth() + 1) return true
      // Beyond current month: only allow if a transaction has consumption extending further
      return allTransactions.value.some(tx => {
        if (!tx.consumption_to) return false
        const [toY, toM] = tx.consumption_to.split('-').map(Number)
        return toY > selectedYear.value || (toY === selectedYear.value && toM > selectedMonth.value)
      })
    })

    // ── Week navigation ───────────────────────────────────
    function prevWeek() {
      selectedWeekStart.value = addDays(selectedWeekStart.value, -7)
      weekWindowEnd.value     = addDays(weekWindowEnd.value,     -7)
    }
    function nextWeek() {
      selectedWeekStart.value = addDays(selectedWeekStart.value, 7)
      weekWindowEnd.value     = addDays(weekWindowEnd.value,     7)
    }

    const weekLabel = computed(() => {
      const start = selectedWeekStart.value
      const end   = addDays(start, 6)
      const s = dateFromIso(start)
      const e = dateFromIso(end)
      if (s.getMonth() === e.getMonth()) {
        return `${s.getDate()}. – ${e.getDate()}. ${MONTH_SHORT[e.getMonth()]} ${e.getFullYear()}`
      }
      return `${s.getDate()}. ${MONTH_SHORT[s.getMonth()]} – ${e.getDate()}. ${MONTH_SHORT[e.getMonth()]} ${e.getFullYear()}`
    })

    const canGoNextWeek = computed(() => {
      const today     = isoToday()
      const nextStart = addDays(selectedWeekStart.value, 7)
      if (nextStart <= today) return true
      return allTransactions.value.some(tx => tx.consumption_to >= nextStart)
    })

    // ── Week bar chart (15-week window ending on weekWindowEnd) ──
    const weekBars = computed(() => {
      const today = isoToday()
      const bars  = []
      let wStart  = addDays(weekWindowEnd.value, -14 * 7)

      for (let i = 0; i < 15; i++) {
        const wEnd = addDays(wStart, 6)
        let total = 0
        for (const tx of allTransactions.value) {
          if (tx.type !== 'expense') continue
          const from     = tx.consumption_from || tx.spending_date
          const to       = tx.consumption_to   || from
          const consumed = tx.amount - (tx.secondary_amount ?? 0)
          const overlap  = overlapDays(from, to, wStart, wEnd)
          if (overlap > 0) total += (consumed / spanDays(from, to)) * overlap
        }
        const d = dateFromIso(wStart)
        bars.push({
          start:      wStart,
          total,
          isSelected: selectedWeekStart.value === wStart,
          isCurrent:  wStart === weekStart(today),
          isFuture:   wStart > today && total === 0,
        })
        wStart = addDays(wStart, 7)
      }

      const max = Math.max(...bars.map(b => b.total), 1)
      return bars.map(b => ({ ...b, pct: (b.total / max) * 100 }))
    })

    function selectBarWeek(bar) {
      if (!bar.isFuture) selectedWeekStart.value = bar.start
      // window stays put — only the active week changes
    }

    const weekMonthGroups = computed(() => {
      const groups = []
      let col = 1
      for (const bar of weekBars.value) {
        const [y, m] = bar.start.split('-').map(Number)
        const key = `${y}-${m}`
        if (groups.length && groups[groups.length - 1].monthKey === key) {
          groups[groups.length - 1].count++
        } else {
          groups.push({ monthKey: key, label: MONTH_SHORT[m - 1], count: 1, startCol: col })
        }
        col++
      }
      return groups
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

    // ── Category accordion ────────────────────────────────
    const expandedCats = ref({})
    function toggleCat(id) {
      expandedCats.value = { ...expandedCats.value, [id]: !expandedCats.value[id] }
    }

    // ── Year bar chart ────────────────────────────────────
    const yearBars = computed(() => {
      const y   = selectedYear.value
      const now = new Date()
      const monthTotals = new Array(12).fill(0)

      for (const tx of allTransactions.value) {
        if (tx.type !== 'expense') continue
        const from    = tx.consumption_from || tx.spending_date
        const to      = tx.consumption_to   || from
        const consumed = tx.amount - (tx.secondary_amount ?? 0)
        const txDays  = spanDays(from, to)

        for (let m = 1; m <= 12; m++) {
          const mStart = `${y}-${String(m).padStart(2, '0')}-01`
          const mDays  = new Date(y, m, 0).getDate()
          const mEnd   = `${y}-${String(m).padStart(2, '0')}-${String(mDays).padStart(2, '0')}`
          const overlap = overlapDays(from, to, mStart, mEnd)
          if (overlap > 0) monthTotals[m - 1] += (consumed / txDays) * overlap
        }
      }

      const max = Math.max(...monthTotals, 1)

      return monthTotals.map((total, i) => {
        const month    = i + 1
        const pastOrNow = y < now.getFullYear() ||
          (y === now.getFullYear() && month <= now.getMonth() + 1)
        return {
          month,
          total,
          pct:        (total / max) * 100,
          label:      MONTH_SHORT[i],
          isSelected: selectedMonth.value === month,
          isCurrent:  y === now.getFullYear() && month === now.getMonth() + 1,
          isFuture:   !pastOrNow && total === 0,  // only dim if future AND empty
        }
      })
    })

    function selectBarMonth(bar) {
      if (!bar.isFuture) selectedMonth.value = bar.month
    }

    return {
      mode, monthLabel, canGoNext, prevMonth, nextMonth,
      weekLabel, canGoNextWeek, prevWeek, nextWeek,
      totalAmount, dailyAverage, categoryRows, potBalances, fmt,
      expandedCats, toggleCat, fmtDate,
      yearBars, selectBarMonth,
      weekBars, selectBarWeek, weekMonthGroups,
    }
  },

  template: `
    <div class="statistics">
      <h1>Statistik</h1>

      <!-- Mode toggle -->
      <div class="type-toggle">
        <button :class="{ active: mode === '30days' }" @click="mode = '30days'">30 Tage</button>
        <button :class="{ active: mode === 'week' }"   @click="mode = 'week'">Woche</button>
        <button :class="{ active: mode === 'month' }"  @click="mode = 'month'">Monat</button>
      </div>

      <!-- Week navigator -->
      <div class="month-nav" v-if="mode === 'week'">
        <button class="month-nav-btn" @click="prevWeek">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span class="month-nav-label">{{ weekLabel }}</span>
        <button class="month-nav-btn" @click="nextWeek" :disabled="!canGoNextWeek">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      <!-- Week bar chart -->
      <div class="month-chart" v-if="mode === 'week'">
        <div class="week-chart-grid">
          <div
            v-for="(bar, i) in weekBars"
            :key="bar.start"
            class="week-chart-bar-cell"
            :style="{ gridColumn: i + 1 }"
            @click="selectBarWeek(bar)"
          >
            <div
              class="month-chart-bar"
              :class="{ active: bar.isSelected, future: bar.isFuture, current: bar.isCurrent }"
              :style="{ height: bar.pct + '%' }"
            ></div>
          </div>
          <div
            v-for="g in weekMonthGroups"
            :key="g.monthKey"
            class="week-month-label"
            :style="{ gridColumn: g.startCol + ' / span ' + g.count }"
          >{{ g.label }}</div>
        </div>
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

      <!-- Year bar chart (month mode only) -->
      <div class="month-chart" v-if="mode === 'month'">
        <div class="month-chart-bars">
          <div
            v-for="bar in yearBars"
            :key="bar.month"
            class="month-chart-bar"
            :class="{ active: bar.isSelected, future: bar.isFuture, current: bar.isCurrent }"
            :style="{ height: bar.pct + '%' }"
            @click="selectBarMonth(bar)"
          ></div>
        </div>
        <div class="month-chart-labels">
          <span
            v-for="bar in yearBars"
            :key="bar.month"
            class="month-chart-label"
            :class="{ active: bar.isSelected, current: bar.isCurrent }"
          >{{ bar.label }}</span>
        </div>
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
        <div class="stats-category-row" v-for="cat in categoryRows" :key="cat.id" @click="toggleCat(cat.id)">
          <div class="tx-indicator" :style="{ background: cat.bg, color: cat.color }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="cat.icon" />
          </div>
          <div class="stats-category-info">
            <div class="stats-category-header">
              <span class="stats-category-name">{{ cat.label }}</span>
              <div class="stats-category-right">
                <span class="stats-category-amount">{{ fmt(cat.amount) }}&thinsp;€</span>
                <svg class="chevron" :class="{ open: expandedCats[cat.id] }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: cat.pct + '%', background: cat.color }" />
            </div>
            <div v-if="expandedCats[cat.id]" class="cat-tx-list">
              <div class="cat-tx-item" v-for="item in cat.txs" :key="item.tx.id">
                <span class="cat-tx-date">{{ fmtDate(item.tx.spending_date) }}</span>
                <span class="cat-tx-title">{{ item.tx.title }}</span>
                <span class="cat-tx-amount">{{ fmt(item.periodAmount) }}&thinsp;€</span>
              </div>
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
