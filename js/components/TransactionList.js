import { computed } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import { CATEGORIES, TRANSFER_META } from '../config.js'
import { getPots } from '../store.js'

const DATE_HDR = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

function headerDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return DATE_HDR.format(new Date(y, m - 1, d))
}

function categoryMeta(id) {
  return CATEGORIES.find(c => c.id === id) ?? TRANSFER_META
}

export default {
  props: {
    transactions: { type: Array, default: () => [] },
    loading:      { type: Boolean, default: false },
  },
  emits: ['edit', 'settings'],

  setup(props, { emit }) {
    const groupedList = computed(() => {
      const sorted = [...props.transactions].sort((a, b) => b.spending_date.localeCompare(a.spending_date))
      const map = new Map()
      for (const tx of sorted) {
        if (!map.has(tx.spending_date)) map.set(tx.spending_date, [])
        map.get(tx.spending_date).push(tx)
      }
      return [...map.entries()].map(([date, items]) => ({ date, items }))
    })

    const dayTotal = items =>
      items.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    const pots = getPots()
    const potLabel = id => pots.find(p => p.id === id)?.label ?? id

    return { groupedList, dayTotal, potLabel, categoryMeta, headerDate,
      handleEdit: tx => emit('edit', tx) }
  },

  template: `
    <div class="transaction-list">
      <div class="list-header">
        <h1>Ausgaben</h1>
        <button class="icon-btn" @click="$emit('settings')" aria-label="Einstellungen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </button>
      </div>

      <div class="empty-state" v-if="!loading && transactions.length === 0">
        <p>Noch keine Einträge.</p>
      </div>

      <div class="date-group" v-for="group in groupedList" :key="group.date">
        <div class="date-header">
          <span>{{ headerDate(group.date) }}</span>
          <span class="day-total" v-if="dayTotal(group.items) > 0">
            {{ dayTotal(group.items).toFixed(2) }}&thinsp;€
          </span>
        </div>

        <div
          class="tx-item"
          v-for="tx in group.items"
          :key="tx.id"
          @click="handleEdit(tx)"
        >
          <div
            class="tx-indicator"
            :style="{ background: categoryMeta(tx.category).bg, color: categoryMeta(tx.category).color }"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="categoryMeta(tx.category).icon" />
          </div>

          <div class="tx-body">
            <span class="tx-title">{{ tx.title }}</span>
            <span class="tx-meta">
              <span v-if="tx.category">{{ categoryMeta(tx.category).label }} &middot; </span>{{ potLabel(tx.from_pot) }}<span v-if="tx.consumption_to"> &middot; ⏱</span>
            </span>
          </div>

          <div class="tx-amount">
            {{ tx.amount.toFixed(2) }}&thinsp;€
          </div>
        </div>
      </div>
    </div>
  `,
}
