import { BUDGET_POTS } from './config.js'

const STORAGE_KEY = 'ausgaben_transactions'
const POTS_KEY    = 'ausgaben_pots'

/**
 * Transaction shape:
 * {
 *   id: string,
 *   type: 'expense' | 'transfer',
 *   title: string,
 *   amount: number,
 *   spending_date: string,        // ISO date (YYYY-MM-DD)
 *   consumption_from: string,     // ISO date, defaults to spending_date
 *   consumption_to: string|null,  // ISO date or null (null = no distribution)
 *   from_pot: string,             // pot id
 *   to_pot: string|null,          // pot id, transfers only
 *   category: string|null,        // category id, expenses only
 *   notes: string,
 * }
 */

export function getTransactions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

export function saveTransaction(transaction) {
  const transactions = getTransactions()
  if (transaction.id) {
    const index = transactions.findIndex(t => t.id === transaction.id)
    if (index >= 0) {
      transactions[index] = transaction
    } else {
      transactions.push(transaction)
    }
  } else {
    transactions.push({ ...transaction, id: crypto.randomUUID() })
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
}

export function deleteTransaction(id) {
  const transactions = getTransactions().filter(t => t.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
}

// ── Budget pot configuration ──────────────────────────────

/** Returns the current pot list, falling back to the defaults in config.js */
export function getPots() {
  try {
    return JSON.parse(localStorage.getItem(POTS_KEY)) || [...BUDGET_POTS]
  } catch {
    return [...BUDGET_POTS]
  }
}

/** Persists a full pot list replacement */
export function savePots(pots) {
  localStorage.setItem(POTS_KEY, JSON.stringify(pots))
}

/** Add or update a single pot (matched by id) */
export function savePot(pot) {
  const pots = getPots()
  const index = pots.findIndex(p => p.id === pot.id)
  if (index >= 0) {
    pots[index] = pot
  } else {
    pots.push(pot)
  }
  savePots(pots)
}

/** Remove a pot by id */
export function deletePot(id) {
  savePots(getPots().filter(p => p.id !== id))
}

/** Reset pots to the defaults from config.js */
export function resetPots() {
  localStorage.removeItem(POTS_KEY)
}
