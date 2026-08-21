const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number) {
  return BRL.format(value)
}

/** Custos de certidão: `null` significa emissão sem taxa. */
export function formatCost(value: number | null) {
  return value === null ? 'Gratuito' : `R$ ${value}`
}

const LONG_DATE = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function formatDate(iso: string | null) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return LONG_DATE.format(new Date(y, m - 1, d))
}

const FULL_DATE = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatToday(date = new Date()) {
  return FULL_DATE.format(date)
}

export function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}
