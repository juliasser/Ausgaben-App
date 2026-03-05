const STORAGE_KEY = 'ausgaben_transactions'

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
