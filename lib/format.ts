const moneyFormatter = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const intFormatter = new Intl.NumberFormat('es-MX')

export function formatMoney(value: number) {
  return `$${moneyFormatter.format(value || 0)}`
}

export function formatInt(value: number) {
  return intFormatter.format(value || 0)
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function formatDate(value: string | null) {
  if (!value) return '—'
  const [y, m, d] = value.slice(0, 10).split('-')
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`
}

export function formatDateTime(value: string) {
  return `${formatDate(value)} · ${value.slice(11, 16)}`
}

export function formatMonth(yyyyMm: string) {
  const [y, m] = yyyyMm.split('-')
  return `${MONTHS[Number(m) - 1]} ${y.slice(2)}`
}

export function formatShortDay(yyyyMmDd: string) {
  const [, m, d] = yyyyMmDd.split('-')
  return `${Number(d)} ${MONTHS[Number(m) - 1]}`
}

export const METODO_PAGO_LABEL = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
} as const
