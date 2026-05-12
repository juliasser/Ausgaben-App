import { createApp, ref, computed, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import NavBar          from './components/NavBar.js'
import AddTransaction  from './components/AddTransaction.js'
import TransactionList from './components/TransactionList.js'
import Statistics      from './components/Statistics.js'
import Settings        from './components/Settings.js'
import { isConfigured, fetchTransactions } from './db.js'

const App = {
  components: { NavBar, AddTransaction, TransactionList, Statistics, Settings },

  setup() {
    const currentScreen      = ref(isConfigured() ? 'list' : 'settings')
    const editingTransaction = ref(null)
    const transactions       = ref([])
    const loading            = ref(false)
    const loadError          = ref(null)

    async function refresh() {
      if (!isConfigured()) return
      loading.value   = true
      loadError.value = null
      try {
        transactions.value = await fetchTransactions()
        localStorage.setItem('ausgaben_backup', JSON.stringify(transactions.value))
      } catch (e) {
        loadError.value = e.message
      } finally {
        loading.value = false
      }
    }

    onMounted(refresh)

    function startEdit(transaction) {
      editingTransaction.value = transaction
      currentScreen.value = 'add'
    }

    function onSaved() {
      editingTransaction.value = null
      currentScreen.value = 'list'
      refresh()
    }

    function onSettingsSaved() {
      currentScreen.value = 'list'
      refresh()
    }

    const allTags = computed(() => {
      const set = new Set()
      for (const tx of transactions.value) {
        for (const tag of (tx.tags || [])) set.add(tag)
      }
      return [...set].sort()
    })

    return {
      currentScreen, editingTransaction,
      transactions, loading, loadError, allTags,
      startEdit, onSaved, onSettingsSaved,
    }
  },

  template: `
    <div class="app">
      <div class="loading-bar" v-if="loading" />

      <main class="screen">
        <div class="load-error" v-if="loadError">
          <span>Fehler beim Laden: {{ loadError }}</span>
        </div>

        <AddTransaction
          v-if="currentScreen === 'add'"
          :transaction="editingTransaction"
          :allTags="allTags"
          @saved="onSaved"
          @cancel="editingTransaction = null; currentScreen = 'list'"
        />
        <TransactionList
          v-else-if="currentScreen === 'list' || currentScreen === 'settings'"
          :transactions="transactions"
          :loading="loading"
          :settingsActive="currentScreen === 'settings'"
          @edit="startEdit"
          @settings="currentScreen = 'settings'"
        />
        <Statistics
          v-else-if="currentScreen === 'stats'"
          :transactions="transactions"
        />
        <div v-if="currentScreen === 'settings'" class="settings-overlay">
          <Settings @saved="onSettingsSaved" @cancel="currentScreen = 'list'" />
        </div>
      </main>

      <NavBar :current="currentScreen" @navigate="currentScreen = $event" />
    </div>
  `,
}

createApp(App).mount('#app')
