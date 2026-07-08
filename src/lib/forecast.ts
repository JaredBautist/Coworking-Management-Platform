// Lightweight utilization forecasting (stretch goal).
// Projects the next N days of reservations from the last 30 days using a
// weekday-seasonal average blended with the overall linear trend. Honest,
// explainable statistics — no black box.

export interface DailyPoint {
  date: string // YYYY-MM-DD
  count: number
}

export interface ForecastPoint extends DailyPoint {
  forecast: boolean
}

export function forecastReservations(
  history: DailyPoint[],
  horizon = 7
): ForecastPoint[] {
  if (history.length === 0) return []

  const overallAvg =
    history.reduce((acc, p) => acc + p.count, 0) / history.length

  // Average per weekday (0=Sun … 6=Sat) captures the weekly pattern.
  const byWeekday = new Map<number, number[]>()
  for (const p of history) {
    const wd = new Date(`${p.date}T00:00`).getDay()
    const arr = byWeekday.get(wd) ?? []
    arr.push(p.count)
    byWeekday.set(wd, arr)
  }
  const weekdayAvg = (wd: number) => {
    const arr = byWeekday.get(wd)
    return arr && arr.length
      ? arr.reduce((a, b) => a + b, 0) / arr.length
      : overallAvg
  }

  // Least-squares slope over the day index → mild trend adjustment.
  const n = history.length
  const xMean = (n - 1) / 2
  let num = 0
  let den = 0
  history.forEach((p, i) => {
    num += (i - xMean) * (p.count - overallAvg)
    den += (i - xMean) ** 2
  })
  const slope = den === 0 ? 0 : num / den

  const pad = (x: number) => String(x).padStart(2, '0')
  const lastDate = new Date(`${history[history.length - 1].date}T00:00`)

  const out: ForecastPoint[] = []
  for (let k = 1; k <= horizon; k++) {
    const d = new Date(lastDate)
    d.setDate(d.getDate() + k)
    const value = Math.max(0, Math.round(weekdayAvg(d.getDay()) + slope * k))
    out.push({
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      count: value,
      forecast: true,
    })
  }
  return out
}
