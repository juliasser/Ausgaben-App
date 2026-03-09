// Supabase REST API — no SDK needed, plain fetch()

const URL_KEY = 'ausgaben_supabase_url'
const KEY_KEY = 'ausgaben_supabase_key'

// ── Credentials ───────────────────────────────────────────

export function getCredentials() {
  return {
    url: (localStorage.getItem(URL_KEY) || '').replace(/\/$/, ''),
    key:  localStorage.getItem(KEY_KEY) || '',
  }
}

export function saveCredentials(url, key) {
  localStorage.setItem(URL_KEY, url.trim().replace(/\/$/, ''))
  localStorage.setItem(KEY_KEY, key.trim())
}

export function isConfigured() {
  const { url, key } = getCredentials()
  return url !== '' && key !== ''
}

// ── Internal request helper ───────────────────────────────

async function request(path, { method = 'GET', body, returnData = false } = {}) {
  const { url, key } = getCredentials()
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
  }
  if (body       !== undefined) headers['Content-Type'] = 'application/json'
  if (returnData)               headers['Prefer']       = 'return=representation'

  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status}: ${text}`)
  }

  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// Supabase returns NUMERIC as string — normalise amounts to number
function normalise(tx) {
  return {
    ...tx,
    amount:           parseFloat(tx.amount),
    secondary_amount: tx.secondary_amount != null ? parseFloat(tx.secondary_amount) : null,
  }
}

// ── Transaction CRUD ──────────────────────────────────────

export async function fetchTransactions() {
  const rows = await request('transactions?select=*&order=spending_date.desc,created_at.desc')
  return rows.map(normalise)
}

export async function createTransaction(data) {
  const rows = await request('transactions', { method: 'POST', body: data, returnData: true })
  return normalise(rows[0])
}

export async function updateTransaction(id, data) {
  const rows = await request(`transactions?id=eq.${id}`, { method: 'PATCH', body: data, returnData: true })
  return normalise(rows[0])
}

export async function deleteTransaction(id) {
  await request(`transactions?id=eq.${id}`, { method: 'DELETE' })
}

// ── Connection test (uses provided values, not stored ones) ─

export async function testConnection(url, key) {
  const cleanUrl = url.trim().replace(/\/$/, '')
  const res = await fetch(`${cleanUrl}/rest/v1/transactions?limit=1`, {
    headers: { 'apikey': key.trim(), 'Authorization': `Bearer ${key.trim()}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
