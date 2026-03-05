import { computed, ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import { getTransactions } from '../store.js'
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
  emits: ['edit'],

  setup(_, { emit }) {
    const version = ref(0)

    const txList = computed(() => {
      version.value // tracked for manual refresh after delete
      return getTransactions()
    })

    const groupedList = computed(() => {
      const sorted = [...txList.value].sort((a, b) => b.spending_date.localeCompare(a.spending_date))
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

    function handleEdit(tx) {
      emit('edit', tx)
    }

    return { txList, groupedList, dayTotal, potLabel, categoryMeta, headerDate, handleEdit }
  },

  template: `
    <div class="transaction-list">
      <h1>Ausgaben</h1>

      <div class="empty-state" v-if="txList.length === 0">
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
