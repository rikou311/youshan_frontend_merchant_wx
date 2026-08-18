function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** 旧站 moment(Number(date)).format('YYYY-MM-DD HH:mm:ss') */
export function formatDateTime(ts: unknown) {
  if (ts == null || ts === '') return ''
  if (typeof ts === 'string' && ts.includes('-') && ts.includes(':')) return ts
  const n = Number(ts)
  if (!Number.isFinite(n) || n <= 0) return String(ts)
  const d = new Date(n)
  if (Number.isNaN(d.getTime())) return String(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function dayStartMs(dateStr: string) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return ''
  return new Date(y, m - 1, d, 0, 0, 0).getTime()
}

export function dayEndMs(dateStr: string) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return ''
  return new Date(y, m - 1, d, 23, 59, 59).getTime()
}
