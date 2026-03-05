import { createApp, ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import NavBar from './components/NavBar.js'
import AddTransaction from './components/AddTransaction.js'
import TransactionList from './components/TransactionList.js'
import Statistics from './components/Statistics.js'

const App = {
  components: { NavBar, AddTransaction, TransactionList, Statistics },
  setup() {
    const currentScreen = ref('add')
    return { currentScreen }
  },
  template: `
    <div class="app">
      <main class="screen">
        <AddTransaction    v-if="currentScreen === 'add'" />
        <TransactionList   v-else-if="currentScreen === 'list'" />
        <Statistics        v-else-if="currentScreen === 'stats'" />
      </main>
      <NavBar :current="currentScreen" @navigate="currentScreen = $event" />
    </div>
  `,
}

createApp(App).mount('#app')
