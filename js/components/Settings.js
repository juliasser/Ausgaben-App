import { ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import { getCredentials, saveCredentials, testConnection } from '../db.js'

export default {
  emits: ['saved'],

  setup(_, { emit }) {
    const creds = getCredentials()
    const url   = ref(creds.url)
    const key   = ref(creds.key)

    const testing    = ref(false)
    const testStatus = ref(null) // 'success' | 'error'
    const testMsg    = ref('')

    async function test() {
      testing.value    = true
      testStatus.value = null
      try {
        await testConnection(url.value, key.value)
        testStatus.value = 'success'
        testMsg.value    = 'Verbindung erfolgreich'
      } catch (e) {
        testStatus.value = 'error'
        testMsg.value    = e.message
      } finally {
        testing.value = false
      }
    }

    function save() {
      saveCredentials(url.value, key.value)
      emit('saved')
    }

    // ── Export ────────────────────────────────────────────
    const hasBackup = !!localStorage.getItem('ausgaben_backup')

    function downloadJSON() {
      const raw = localStorage.getItem('ausgaben_backup')
      if (!raw) return
      const blob = new Blob([raw], { type: 'application/json' })
      const a    = document.createElement('a')
      a.href     = URL.createObjectURL(blob)
      a.download = `ausgaben-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(a.href)
    }

    function downloadCSV() {
      const raw = localStorage.getItem('ausgaben_backup')
      if (!raw) return
      const txs     = JSON.parse(raw)
      const headers = ['id', 'type', 'title', 'amount', 'spending_date',
                       'consumption_from', 'consumption_to', 'from_pot', 'to_pot',
                       'category', 'notes', 'secondary_pot', 'secondary_amount']
      const esc = v => {
        if (v == null) return ''
        const s = String(v)
        return (s.includes(';') || s.includes('"') || s.includes('\n'))
          ? '"' + s.replace(/"/g, '""') + '"'
          : s
      }
      const lines = [
        headers.join(';'),
        ...txs.map(tx => headers.map(h => esc(tx[h])).join(';')),
      ]
      // UTF-8 BOM for Excel on Windows
      const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const a    = document.createElement('a')
      a.href     = URL.createObjectURL(blob)
      a.download = `ausgaben-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
    }

    return { url, key, testing, testStatus, testMsg, test, save, hasBackup, downloadCSV, downloadJSON }
  },

  template: `
    <div class="settings">
      <h1>Einstellungen</h1>

      <div class="settings-section">
        <h2>Supabase</h2>

        <div class="form-group">
          <label>Supabase URL</label>
          <input
            type="url"
            v-model="url"
            placeholder="https://xxxx.supabase.co"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
          />
        </div>

        <div class="form-group">
          <label>Anon Key</label>
          <input
            type="password"
            v-model="key"
            placeholder="eyJ…"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
          />
        </div>

        <button class="test-btn" type="button" @click="test" :disabled="testing || !url || !key">
          {{ testing ? 'Teste…' : 'Verbindung testen' }}
        </button>

        <div v-if="testStatus" class="test-status" :class="'test-status--' + testStatus">
          <svg v-if="testStatus === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          <span>{{ testMsg }}</span>
        </div>
      </div>

      <div class="settings-section">
        <h2>Exportieren</h2>
        <p v-if="!hasBackup" style="font-size:0.875rem; color:var(--color-muted);">
          Noch keine lokalen Daten. Öffne zuerst die Transaktionsliste.
        </p>
        <template v-else>
          <button class="test-btn" type="button" @click="downloadCSV">CSV herunterladen</button>
          <button class="test-btn" type="button" @click="downloadJSON">JSON herunterladen</button>
        </template>
      </div>

      <div class="save-wrapper">
        <button class="save-btn" type="button" @click="save" :disabled="!url || !key">
          Speichern
        </button>
      </div>
    </div>
  `,
}
