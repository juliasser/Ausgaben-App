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
    // uiType: 'expense' | 'transfer' | 'splitwise' (tab in the UI)
    const uiType        = ref('expense')
    const title         = ref('')
    const amount        = ref('')
    const spending_date = ref(today())
    const from_pot      = ref(pots[0]?.id || '')
    const to_pot        = ref('')
    const category      = ref('')
    const notes         = ref('')

    const showConsumption           = ref(false)
    const consumption_from          = ref(today())
    const consumption_to            = ref('')
    const consumptionFromUserEdited = ref(false)

    // ── Splitwise state ───────────────────────────────────
    const swTotalAmount  = ref('')
    const swPaidBy       = ref('ich')  // 'ich' | 'andere'
    const swMyShareEur   = ref('')     // my share in euros

    // When total changes, reset my share to 50 %
    watch(swTotalAmount, val => {
      const total = parseFloat(val)
      swMyShareEur.value = (!isNaN(total) && total > 0)
        ? (total / 2).toFixed(2)
        : ''
    })

    const swTheirShareAmount = computed(() => {
      const total = parseFloat(swTotalAmount.value)
      const mine  = parseFloat(swMyShareEur.value)
      if (isNaN(total) || total <= 0 || isNaN(mine)) return 0
      return total - mine
    })

    const nonSplitwisePots = computed(() => pots.filter(p => p.id !== 'splitwise'))

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

    // When switching to Splitwise, ensure from_pot is not 'splitwise'
    watch(uiType, newType => {
      if (newType === 'splitwise' && from_pot.value === 'splitwise') {
        from_pot.value = nonSplitwisePots.value[0]?.id || ''
      }
    })

    // ── Pre-fill when editing ─────────────────────────────
    if (props.transaction) {
      const t = props.transaction
      title.value         = t.title
      spending_date.value = t.spending_date
      from_pot.value      = t.from_pot
      category.value      = t.category || ''
      const rawNotes = t.notes || ''
      const gestamtMatch = rawNotes.match(/^Gesamt: [\d.,]+\u202f€\n?/)
      notes.value = gestamtMatch ? rawNotes.slice(gestamtMatch[0].length) : rawNotes

      const hasRange = t.consumption_from !== t.spending_date || t.consumption_to
      if (hasRange) {
        showConsumption.value           = true
        consumption_from.value          = t.consumption_from
        consumption_to.value            = t.consumption_to || ''
        consumptionFromUserEdited.value = true
      }

      if (t.secondary_pot === 'splitwise' && t.secondary_amount != null) {
        // Splitwise — I paid, other owes me
        uiType.value         = 'splitwise'
        swPaidBy.value       = 'ich'
        swTotalAmount.value  = String(t.amount)
        swMyShareEur.value   = String(t.amount - t.secondary_amount)
      } else if (t.type === 'transfer') {
        uiType.value   = 'transfer'
        amount.value   = String(t.amount)
        to_pot.value   = t.to_pot || ''
      } else {
        uiType.value   = 'expense'
        amount.value   = String(t.amount)
      }
    }

    // ── Computed ──────────────────────────────────────────
    const dayCount = computed(() => {
      if (!consumption_to.value || !consumption_from.value) return 0
      const diff = new Date(consumption_to.value) - new Date(consumption_from.value)
      return Math.max(1, Math.round(diff / 86400000) + 1)
    })

    const dailyAmount = computed(() => {
      if (!dayCount.value) return '–'
      if (uiType.value === 'splitwise') {
        const myAmt = parseFloat(swMyShareEur.value)
        if (!myAmt || isNaN(myAmt)) return '–'
        return (myAmt / dayCount.value).toFixed(2)
      }
      if (!amount.value) return '–'
      return (parseFloat(amount.value) / dayCount.value).toFixed(2)
    })

    function potLabel(id) {
      return pots.find(p => p.id === id)?.label || id
    }

    const fmt2 = n => (isNaN(n) || n <= 0) ? '0,00' : n.toFixed(2).replace('.', ',')

    // ── Validation ────────────────────────────────────────
    const errors = ref({})

    function validate() {
      const e = {}

      if (uiType.value === 'splitwise') {
        const total = parseFloat(swTotalAmount.value)
        if (!swTotalAmount.value || isNaN(total) || total <= 0)
          e.swTotalAmount = 'Bitte einen gültigen Betrag eingeben'
        const mine = parseFloat(swMyShareEur.value)
        if (isNaN(mine) || mine <= 0 || mine >= total)
          e.swMyShareEur = 'Muss zwischen 0 und dem Gesamtbetrag liegen'
        if (!title.value.trim()) e.title    = 'Titel erforderlich'
        if (!category.value)     e.category = 'Kategorie erforderlich'
        if (!spending_date.value) e.spending_date = 'Datum erforderlich'
        if (swPaidBy.value === 'ich' && !from_pot.value)
          e.from_pot = 'Zahlungsmittel erforderlich'
      } else {
        const amt = parseFloat(amount.value)
        if (!amount.value || isNaN(amt) || amt <= 0) e.amount = 'Bitte einen gültigen Betrag eingeben'
        if (!spending_date.value)                    e.spending_date = 'Datum erforderlich'
        if (!from_pot.value)                         e.from_pot = 'Budget-Topf erforderlich'

        if (uiType.value === 'expense') {
          if (!title.value.trim()) e.title    = 'Titel erforderlich'
          if (!category.value)     e.category = 'Kategorie erforderlich'
        }

        if (uiType.value === 'transfer') {
          if (!to_pot.value)                      e.to_pot = 'Ziel-Topf erforderlich'
          else if (to_pot.value === from_pot.value) e.to_pot = 'Muss ein anderer Topf sein'
        }
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
        let data

        if (uiType.value === 'splitwise') {
          const total    = parseFloat(swTotalAmount.value)
          const myAmt    = parseFloat(swMyShareEur.value)
          const fmtTotal = total.toFixed(2).replace('.', ',')
          const totalRef = `Gesamt: ${fmtTotal}\u202f€`
          const finalNotes = notes.value.trim()
            ? `${totalRef}\n${notes.value.trim()}`
            : totalRef

          if (swPaidBy.value === 'ich') {
            data = {
              type:             'expense',
              title:            title.value.trim(),
              amount:           total,
              spending_date:    spending_date.value,
              consumption_from: showConsumption.value ? consumption_from.value : spending_date.value,
              consumption_to:   showConsumption.value && consumption_to.value ? consumption_to.value : null,
              from_pot:         from_pot.value,
              to_pot:           null,
              category:         category.value,
              notes:            finalNotes,
              secondary_pot:    'splitwise',
              secondary_amount: total - myAmt,  // what the other person owes me
            }
          } else {
            // Andere Person hat gezahlt — I owe my share from Splitwise
            data = {
              type:             'expense',
              title:            title.value.trim(),
              amount:           myAmt,
              spending_date:    spending_date.value,
              consumption_from: showConsumption.value ? consumption_from.value : spending_date.value,
              consumption_to:   showConsumption.value && consumption_to.value ? consumption_to.value : null,
              from_pot:         'splitwise',
              to_pot:           null,
              category:         category.value,
              notes:            finalNotes,
              secondary_pot:    null,
              secondary_amount: null,
            }
          }
        } else {
          data = {
            type:             uiType.value,
            title:            uiType.value === 'transfer'
                                ? `${potLabel(from_pot.value)} → ${potLabel(to_pot.value)}`
                                : title.value.trim(),
            amount:           parseFloat(amount.value),
            spending_date:    spending_date.value,
            consumption_from: showConsumption.value ? consumption_from.value : spending_date.value,
            consumption_to:   showConsumption.value && consumption_to.value ? consumption_to.value : null,
            from_pot:         from_pot.value,
            to_pot:           uiType.value === 'transfer' ? to_pot.value : null,
            category:         uiType.value === 'expense' ? category.value : null,
            notes:            notes.value.trim(),
            secondary_pot:    null,
            secondary_amount: null,
          }
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
      pots, CATEGORIES, nonSplitwisePots,
      uiType, title, amount, spending_date, from_pot, to_pot, category, notes,
      showConsumption, consumption_from, consumption_to, consumptionFromUserEdited,
      dayCount, dailyAmount,
      swTotalAmount, swPaidBy, swMyShareEur, swTheirShareAmount,
      errors, saving, saveError, save, fmt2,
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
        <button :class="{ active: uiType === 'expense' }"   @click="uiType = 'expense'">Ausgabe</button>
        <button :class="{ active: uiType === 'transfer' }"  @click="uiType = 'transfer'">Überweisung</button>
        <button :class="{ active: uiType === 'splitwise' }" @click="uiType = 'splitwise'">Splitwise</button>
      </div>

      <!-- ── EXPENSE / TRANSFER FORM ──────────────────────── -->
      <template v-if="uiType !== 'splitwise'">

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
        <div class="form-group" v-if="uiType === 'expense'">
          <label>Titel</label>
          <input type="text" v-model="title" placeholder="Wofür?" :class="{ 'has-error': errors.title }" />
          <span class="error" v-if="errors.title">{{ errors.title }}</span>
        </div>

        <!-- Category (expense only) -->
        <div class="form-group" v-if="uiType === 'expense'">
          <label>Kategorie</label>
          <select v-model="category" :class="{ 'has-error': errors.category }">
            <option value="">Kategorie wählen…</option>
            <option v-for="c in CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
          </select>
          <span class="error" v-if="errors.category">{{ errors.category }}</span>
        </div>

        <!-- From pot -->
        <div class="form-group">
          <label>{{ uiType === 'transfer' ? 'Von' : 'Zahlungsmittel' }}</label>
          <select v-model="from_pot" :class="{ 'has-error': errors.from_pot }">
            <option v-for="p in pots" :key="p.id" :value="p.id">{{ p.label }}</option>
          </select>
          <span class="error" v-if="errors.from_pot">{{ errors.from_pot }}</span>
        </div>

        <!-- To pot (transfer only) -->
        <div class="form-group" v-if="uiType === 'transfer'">
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
        <div class="consumption-section" v-if="uiType === 'expense'">
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
        <div class="form-group" v-if="uiType === 'transfer'">
          <label>Notizen <span class="optional">(optional)</span></label>
          <textarea v-model="notes" rows="2" placeholder="…"></textarea>
        </div>

      </template>

      <!-- ── SPLITWISE FORM ────────────────────────────────── -->
      <template v-if="uiType === 'splitwise'">

        <!-- Gesamtbetrag -->
        <div class="form-group">
          <label>Gesamtbetrag</label>
          <div class="amount-large" :class="{ 'has-error': errors.swTotalAmount }">
            <span class="amount-currency">€</span>
            <input
              type="number"
              v-model="swTotalAmount"
              inputmode="decimal"
              min="0"
              step="0.01"
              placeholder="0"
            />
          </div>
          <span class="error" v-if="errors.swTotalAmount">{{ errors.swTotalAmount }}</span>
        </div>

        <!-- Wer hat bezahlt? -->
        <div class="form-group">
          <label>Wer hat bezahlt?</label>
          <div class="type-toggle">
            <button type="button" :class="{ active: swPaidBy === 'ich' }"    @click="swPaidBy = 'ich'">Ich</button>
            <button type="button" :class="{ active: swPaidBy === 'andere' }" @click="swPaidBy = 'andere'">Andere Person</button>
          </div>
        </div>

        <!-- Mein Anteil -->
        <div class="form-group">
          <label>Mein Anteil</label>
          <div class="sw-share-row">
            <div class="sw-share-input" :class="{ 'has-error': errors.swMyShareEur }">
              <input
                type="number"
                v-model="swMyShareEur"
                inputmode="decimal"
                min="0"
                step="0.01"
                placeholder="0"
              />
              <span class="sw-share-symbol">€</span>
            </div>
            <div class="sw-share-calc">
              <span class="sw-share-sep">andere: </span>
              <span class="sw-share-mine">{{ fmt2(swTheirShareAmount) }}&thinsp;€</span>
            </div>
          </div>
          <span class="error" v-if="errors.swMyShareEur">{{ errors.swMyShareEur }}</span>
        </div>

        <!-- Mein Zahlungsmittel (only if Ich paid) -->
        <div class="form-group" v-if="swPaidBy === 'ich'">
          <label>Mein Zahlungsmittel</label>
          <select v-model="from_pot" :class="{ 'has-error': errors.from_pot }">
            <option v-for="pot in nonSplitwisePots" :key="pot.id" :value="pot.id">{{ pot.label }}</option>
          </select>
          <span class="error" v-if="errors.from_pot">{{ errors.from_pot }}</span>
        </div>

        <!-- Titel -->
        <div class="form-group">
          <label>Titel</label>
          <input type="text" v-model="title" placeholder="Wofür?" :class="{ 'has-error': errors.title }" />
          <span class="error" v-if="errors.title">{{ errors.title }}</span>
        </div>

        <!-- Kategorie -->
        <div class="form-group">
          <label>Kategorie</label>
          <select v-model="category" :class="{ 'has-error': errors.category }">
            <option value="">Kategorie wählen…</option>
            <option v-for="c in CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
          </select>
          <span class="error" v-if="errors.category">{{ errors.category }}</span>
        </div>

        <!-- Datum -->
        <div class="form-group">
          <label>Datum</label>
          <input type="date" v-model="spending_date" :class="{ 'has-error': errors.spending_date }" />
          <span class="error" v-if="errors.spending_date">{{ errors.spending_date }}</span>
        </div>

        <!-- Erweitert (consumption range + notes) -->
        <div class="consumption-section">
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
              {{ dayCount }} Tage &rarr; {{ dailyAmount }}&thinsp;€/Tag (mein Anteil)
            </p>
            <div class="form-group">
              <label>Notizen <span class="optional">(optional)</span></label>
              <textarea v-model="notes" rows="2" placeholder="…"></textarea>
            </div>
          </div>
        </div>

      </template>

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
