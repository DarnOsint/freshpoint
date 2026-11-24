export function formatMoney(value: number) {
  return `SSP ${value.toLocaleString('en-SS')}`
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-SS', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || 'there'
}

export function initials(fullName: string) {
  return fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'FP'
}
