import { ref, computed, watch } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import { CATEGORIES } from '../config.js'
import { getPots } from '../store.js'
import { createTransaction, updateTransaction, deleteTransaction } from '../db.js'

function today() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export default {
  props: {
    transaction: { type: Object, default: null },
  },
  emits: ['saved', 'cancel'],

  setup(props, { emit }) {
    const pots = getPots()

    // ── Form state ────────────────────────────────────────
    const type          = ref('expense')
    const title         = ref('')
    const amount        = ref('')
    const spending_date = ref(today())
    const from_pot      = ref(pots[0]?.id || '')
    const to_pot        = ref('')
    const category      = ref('')
    const notes         = ref('')

    const showConsumption            = ref(false)
    const consumption_from           = ref(today())
    const consumption_to             = ref('')
    const consumptionFromUserEdited  = ref(false)

    // Keep consumption_from in sync with spending_date unless user changed it manually
    watch(spending_date, val => {
      if (!consumptionFromUserEdited.value) consumption_from.value = val
    })

    // Reset consumption state when section is collapsed
    watch(showConsumption, open => {
      if (!open) {
        consumption_from.value = spending_date.value
        consumption_to.value   = ''
        consumptionFromUserEdited.value = false
      }
    })

    // ── Pre-fill when editing ─────────────────────────────
    if (props.transaction) {
      const t = props.transaction
      type.value          = t.type
      title.value         = t.title
      amount.value        = String(t.amount)
      spending_date.value = t.spending_date
      from_pot.value      = t.from_pot
      to_pot.value        = t.to_pot || ''
      category.value      = t.category || ''
      notes.value         = t.notes || ''

      const hasRange = t.consumption_from !== t.spending_date || t.consumption_to
      if (hasRange) {
        showConsumption.value          = true
        consumption_from.value         = t.consumption_from
        consumption_to.value           = t.consumption_to || ''
        consumptionFromUserEdited.value = true
      }
    }

    // ── Computed ──────────────────────────────────────────
    const dayCount = computed(() => {
      if (!consumption_to.value || !consumption_from.value) return 0
      const diff = new Date(consumption_to.value) - new Date(consumption_from.value)
      return Math.max(1, Math.round(diff / 86400000) + 1)
    })

    const dailyAmount = computed(() => {
      if (!dayCount.value || !amount.value) return '–'
      return (parseFloat(amount.value) / dayCount.value).toFixed(2)
    })

    function potLabel(id) {
      return pots.find(p => p.id === id)?.label || id
    }

    // ── Validation ────────────────────────────────────────
    const errors = ref({})

    function validate() {
      const e = {}
      const amt = parseFloat(amount.value)
      if (!amount.value || isNaN(amt) || amt <= 0) e.amount = 'Bitte einen gültigen Betrag eingeben'
      if (!spending_date.value)                    e.spending_date = 'Datum erforderlich'
      if (!from_pot.value)                         e.from_pot = 'Budget-Topf erforderlich'

      if (type.value === 'expense') {
        if (!title.value.trim()) e.title    = 'Titel erforderlich'
        if (!category.value)     e.category = 'Kategorie erforderlich'
      }

      if (type.value === 'transfer') {
        if (!to_pot.value)                    e.to_pot = 'Ziel-Topf erforderlich'
        else if (to_pot.value === from_pot.value) e.to_pot = 'Muss ein anderer Topf sein'
      }

      if (showConsumption.value && consumption_to.value && consumption_to.value < consumption_from.value) {
        e.consumption_to = 'Muss nach dem Startdatum liegen'
      }

      errors.value = e
      return Object.keys(e).length === 0
    }

    // ── Async state ───────────────────────────────────────
    const saving    = ref(false)
    const saveError = ref(null)

    // ── Save ──────────────────────────────────────────────
    async function save() {
      if (!validate()) return
      saving.value    = true
      saveError.value = null
      try {
        const data = {
          type:             type.value,
          title:            type.value === 'transfer'
                              ? `${potLabel(from_pot.value)} → ${potLabel(to_pot.value)}`
                              : title.value.trim(),
          amount:           parseFloat(amount.value),
          spending_date:    spending_date.value,
          consumption_from: showConsumption.value ? consumption_from.value : spending_date.value,
          consumption_to:   showConsumption.value && consumption_to.value ? consumption_to.value : null,
          from_pot:         from_pot.value,
          to_pot:           type.value === 'transfer' ? to_pot.value : null,
          category:         type.value === 'expense' ? category.value : null,
          notes:            notes.value.trim(),
        }
        if (props.transaction?.id) {
          await updateTransaction(props.transaction.id, data)
        } else {
          await createTransaction(data)
        }
        emit('saved')
      } catch (e) {
        saveError.value = e.message
      } finally {
        saving.value = false
      }
    }

    // ── Delete (edit mode only) ───────────────────────────
    const confirmingDelete = ref(false)

    async function doDelete() {
      saving.value = true
      try {
        await deleteTransaction(props.transaction.id)
        emit('saved')
      } catch (e) {
        saveError.value = e.message
        saving.value = false
      }
    }

    return {
      pots, CATEGORIES,
      type, title, amount, spending_date, from_pot, to_pot, category, notes,
      showConsumption, consumption_from, consumption_to, consumptionFromUserEdited,
      dayCount, dailyAmount,
      errors, saving, saveError, save,
      confirmingDelete, doDelete,
    }
  },

  template: `
    <div class="add-transaction">
      <div class="screen-header">
        <h1>{{ transaction ? 'Bearbeiten' : 'Hinzufügen' }}</h1>
        <button v-if="transaction" class="icon-btn" type="button" @click="$emit('cancel')" aria-label="Abbrechen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="22" height="22">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Type toggle -->
      <div class="type-toggle">
        <button :class="{ active: type === 'expense' }"  @click="type = 'expense'">Ausgabe</button>
        <button :class="{ active: type === 'transfer' }" @click="type = 'transfer'">Überweisung</button>
      </div>

      <!-- Spending date -->
      <div class="form-group">
        <label>Datum</label>
        <input type="date" v-model="spending_date" :class="{ 'has-error': errors.spending_date }" />
        <span class="error" v-if="errors.spending_date">{{ errors.spending_date }}</span>
      </div>

      <!-- Amount (large display) -->
      <div class="form-group">
        <label>Betrag</label>
        <div class="amount-large" :class="{ 'has-error': errors.amount }">
          <span class="amount-currency">€</span>
          <input
            type="number"
            v-model="amount"
            inputmode="decimal"
            min="0"
            step="0.01"
            placeholder="0"
          />
        </div>
        <span class="error" v-if="errors.amount">{{ errors.amount }}</span>
      </div>

      <!-- Title (expense only) -->
      <div class="form-group" v-if="type === 'expense'">
        <label>Titel</label>
        <input type="text" v-model="title" placeholder="Wofür?" :class="{ 'has-error': errors.title }" />
        <span class="error" v-if="errors.title">{{ errors.title }}</span>
      </div>

      <!-- Category (expense only) -->
      <div class="form-group" v-if="type === 'expense'">
        <label>Kategorie</label>
        <select v-model="category" :class="{ 'has-error': errors.category }">
          <option value="">Kategorie wählen…</option>
          <option v-for="c in CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
        </select>
        <span class="error" v-if="errors.category">{{ errors.category }}</span>
      </div>

      <!-- From pot -->
      <div class="form-group">
        <label>{{ type === 'transfer' ? 'Von' : 'Zahlungsmittel' }}</label>
        <select v-model="from_pot" :class="{ 'has-error': errors.from_pot }">
          <option v-for="p in pots" :key="p.id" :value="p.id">{{ p.label }}</option>
        </select>
        <span class="error" v-if="errors.from_pot">{{ errors.from_pot }}</span>
      </div>

      <!-- To pot (transfer only) -->
      <div class="form-group" v-if="type === 'transfer'">
        <label>An</label>
        <select v-model="to_pot" :class="{ 'has-error': errors.to_pot }">
          <option value="">Topf wählen…</option>
          <option
            v-for="p in pots"
            :key="p.id"
            :value="p.id"
            :disabled="p.id === from_pot"
          >{{ p.label }}</option>
        </select>
        <span class="error" v-if="errors.to_pot">{{ errors.to_pot }}</span>
      </div>

      <!-- Erweitert (expense only) -->
      <div class="consumption-section" v-if="type === 'expense'">
        <button class="toggle-btn" type="button" @click="showConsumption = !showConsumption">
          <span>Erweitert</span>
          <svg class="chevron" :class="{ open: showConsumption }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div v-if="showConsumption" class="consumption-fields">
          <div class="form-row">
            <div class="form-group">
              <label>Von</label>
              <input
                type="date"
                v-model="consumption_from"
                @change="consumptionFromUserEdited = true"
              />
            </div>
            <div class="form-group">
              <label>Bis <span class="optional">(optional)</span></label>
              <input type="date" v-model="consumption_to" :class="{ 'has-error': errors.consumption_to }" />
            </div>
          </div>
          <span class="error" v-if="errors.consumption_to">{{ errors.consumption_to }}</span>
          <p class="hint" v-if="consumption_to && dayCount > 0">
            {{ dayCount }} Tage &rarr; {{ dailyAmount }}&thinsp;€/Tag
          </p>
          <div class="form-group">
            <label>Notizen <span class="optional">(optional)</span></label>
            <textarea v-model="notes" rows="2" placeholder="…"></textarea>
          </div>
        </div>
      </div>

      <!-- Notes (transfer only) -->
      <div class="form-group" v-if="type === 'transfer'">
        <label>Notizen <span class="optional">(optional)</span></label>
        <textarea v-model="notes" rows="2" placeholder="…"></textarea>
      </div>

      <div class="save-wrapper">
        <p class="save-error" v-if="saveError">{{ saveError }}</p>
        <button class="save-btn" type="button" tabindex="0" @click="save" :disabled="saving">
          {{ saving ? 'Speichern…' : 'Speichern' }}
        </button>
      </div>

      <template v-if="transaction">
        <button v-if="!confirmingDelete" class="delete-btn" type="button" @click="confirmingDelete = true">
          Löschen
        </button>
        <div v-else class="delete-confirm">
          <span>Wirklich löschen?</span>
          <div class="delete-confirm-actions">
            <button type="button" @click="confirmingDelete = false">Abbrechen</button>
            <button type="button" class="delete-confirm-yes" @click="doDelete">Ja, löschen</button>
          </div>
        </div>
      </template>
    </div>
  `,
}
