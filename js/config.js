export const BUDGET_POTS = [
  { id: 'cash',       label: 'Bar' },
  { id: 'card',       label: 'Karte' },
  { id: 'splitwise',  label: 'Splitwise' },
  { id: 'paypal',     label: 'Paypal' },
  { id: 'granada',    label: 'Granada Karte' },
  { id: 'schulden',   label: 'Schulden' },
]

export const CATEGORIES = [
  {
    id: 'einkauf', label: 'Einkauf', color: '#10b981', bg: '#d1fae5',
    icon: `<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>`,
  },
  {
    id: 'essen', label: 'Essen', color: '#f59e0b', bg: '#fef3c7',
    icon: `<path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/>`,
  },
  {
    id: 'transport', label: 'Transport', color: '#3b82f6', bg: '#dbeafe',
    icon: `<rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>`,
  },
  {
    id: 'gesundheit', label: 'Gesundheit', color: '#ef4444', bg: '#fee2e2',
    icon: `<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>`,
  },
  {
    id: 'freizeit', label: 'Freizeit', color: '#8b5cf6', bg: '#ede9fe',
    icon: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
  },
  {
    id: 'wohnen', label: 'Wohnen', color: '#f97316', bg: '#ffedd5',
    icon: `<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
  },
  {
    id: 'anschaffungen', label: 'Anschaffungen', color: '#6366f1', bg: '#e0e7ff',
    icon: `<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>`,
  },
  {
    id: 'ausgehen', label: 'Ausgehen', color: '#ec4899', bg: '#fce7f3',
    icon: `<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>`,
  },
  {
    id: 'sonstiges', label: 'Sonstiges', color: '#6b7280', bg: '#f3f4f6',
    icon: `<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>`,
  },
]

// Used for transfer transactions
export const TRANSFER_META = {
  color: '#3b82f6', bg: '#dbeafe',
  icon: `<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>`,
}
