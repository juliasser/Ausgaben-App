export default {
  props: {
    current: { type: String, required: true },
  },
  emits: ['navigate'],
  template: `
    <nav class="nav-bar">
      <button
        class="nav-item"
        :class="{ active: current === 'add' }"
        @click="$emit('navigate', 'add')"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        <span>Hinzufügen</span>
      </button>

      <button
        class="nav-item"
        :class="{ active: current === 'list' }"
        @click="$emit('navigate', 'list')"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        <span>Liste</span>
      </button>

      <button
        class="nav-item"
        :class="{ active: current === 'stats' }"
        @click="$emit('navigate', 'stats')"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <span>Statistik</span>
      </button>
    </nav>
  `,
}
