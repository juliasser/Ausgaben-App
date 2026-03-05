import { createApp, ref, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
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

    return {
      currentScreen, editingTransaction,
      transactions, loading, loadError,
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
          @saved="onSaved"
          @cancel="editingTransaction = null; currentScreen = 'list'"
        />
        <TransactionList
          v-else-if="currentScreen === 'list'"
          :transactions="transactions"
          :loading="loading"
          @edit="startEdit"
          @settings="currentScreen = 'settings'"
        />
        <Statistics
          v-else-if="currentScreen === 'stats'"
          :transactions="transactions"
        />
        <Settings
          v-else-if="currentScreen === 'settings'"
          @saved="onSettingsSaved"
        />
      </main>

      <NavBar :current="currentScreen" @navigate="currentScreen = $event" />
    </div>
  `,
}

createApp(App).mount('#app')
