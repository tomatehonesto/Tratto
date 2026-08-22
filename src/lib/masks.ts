/**
 * Máscara de valor em reais aplicada durante a digitação.
 *
 * Agrupa milhares e aceita centavos opcionais: "850000" vira "850.000".
 * Preferimos isso à máscara de centavos (onde todo dígito desloca a vírgula)
 * porque valor de imóvel costuma ser redondo — digitar "85000000" para chegar
 * em 850.000,00 seria pior.
 */
export function formatCurrencyInput(raw: string) {
  // Mantém dígitos e no máximo uma vírgula.
  let cleaned = raw.replace(/[^\d,]/g, '')
  const firstComma = cleaned.indexOf(',')
  if (firstComma !== -1) {
    cleaned = cleaned.slice(0, firstComma + 1) + cleaned.slice(firstComma + 1).replace(/,/g, '')
  }

  const [intPart = '', decPart] = cleaned.split(',')
  const intDigits = intPart.replace(/^0+(?=\d)/, '')
  const grouped = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  if (decPart === undefined) return grouped
  return `${grouped},${decPart.slice(0, 2)}`
}

/** Converte o texto mascarado de volta para número. `NaN` se inválido. */
export function parseCurrencyInput(masked: string) {
  const normalized = masked.replace(/\./g, '').replace(',', '.')
  if (normalized === '' || normalized === '.') return NaN
  return Number(normalized)
}

/** "01310100" → "01310-100" */
export function formatCep(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function cepDigits(masked: string) {
  return masked.replace(/\D/g, '')
}
