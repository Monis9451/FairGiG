import { formatCurrency, formatDate, formatHourlyRate } from '@/utils/formatters'
import { getApiErrorMessage } from '@/lib/apiError'

const normalizePlatformKey = (platform) => String(platform || '').trim().toLowerCase().replace(/\s+/g, '')

export const normalizePlatformName = (platform) => {
  const key = normalizePlatformKey(platform)

  if (key === 'uber') {
    return 'Uber'
  }

  if (key === 'foodpanda') {
    return 'FoodPanda'
  }

  if (key === 'bykea') {
    return 'Bykea'
  }

  if (key === 'indrive') {
    return 'inDrive'
  }

  if (key === 'careem') {
    return 'Careem'
  }

  return String(platform || '').trim()
}

export const parseApiError = (error) => {
  return getApiErrorMessage(error)
}

export const normalizeShiftPayload = (values) => ({
  platform: normalizePlatformName(values.platform),
  date: values.date,
  hours_worked: Number(values.hours_worked),
  gross_earned: Number(values.gross_earned),
  deductions: Number(values.deductions),
  net_received: Number(values.net_received),
  screenshot_url: values.screenshot_url?.trim() || null,
})

export const shiftBadgeClassByStatus = (status) => {
  if (status === 'verified') {
    return 'border-brand-primary/40 bg-brand-primary/20 text-brand-darkest'
  }

  if (status === 'pending') {
    return 'border-brand-muted/50 bg-brand-muted/25 text-brand-darkest'
  }

  if (status === 'flagged') {
    return 'border-brand-dark bg-brand-dark text-brand-light'
  }

  if (status === 'unverifiable') {
    return 'border-amber-500/60 bg-amber-100 text-amber-950'
  }

  return 'border-brand-muted/50 bg-brand-light text-brand-darkest'
}

export const grievanceBadgeClassByStatus = (status) => {
  if (status === 'resolved') {
    return 'border-brand-primary/40 bg-brand-primary/20 text-brand-darkest'
  }

  if (status === 'escalated') {
    return 'border-brand-dark bg-brand-dark text-brand-light'
  }

  return 'border-brand-muted/50 bg-brand-muted/25 text-brand-darkest'
}

export const parseTagsFromInput = (value) => {
  if (!value || typeof value !== 'string') {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export const buildAnalyzePayload = (currentShift) => {
  const normalizedCurrentPlatform = normalizePlatformName(currentShift.platform)

  return {
    current_shift: {
      date: currentShift.date,
      platform: normalizedCurrentPlatform,
      gross_earned: Number(currentShift.gross_earned || 0),
      deductions: Number(currentShift.deductions || 0),
      net_received: Number(currentShift.net_received || 0),
    },
  }
}

export const buildWorkerStats = (shiftItems) => {
  const total = shiftItems.length
  const verified = shiftItems.filter((item) => item.status === 'verified').length
  const pending = shiftItems.filter((item) => item.status === 'pending').length
  const flagged = shiftItems.filter((item) => item.status === 'flagged').length
  const unverifiable = shiftItems.filter((item) => item.status === 'unverifiable').length

  const forAverage = shiftItems.filter((item) => item.status !== 'unverifiable')
  const averageHourly =
    forAverage.length > 0
      ? forAverage
          .map((item) => formatHourlyRate(item.net_received, item.hours_worked))
          .reduce((sum, value) => sum + value, 0) / forAverage.length
      : 0

  return {
    total,
    verified,
    pending,
    flagged,
    unverifiable,
    averageHourly: Number(averageHourly.toFixed(2)),
  }
}

/** Sum net_received for shifts whose `date` falls in the rolling window (local midnight). */
export const buildWorkerDashboardMetrics = (shiftItems) => {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(startOfToday)
  weekStart.setDate(weekStart.getDate() - 6)
  const monthStart = new Date(startOfToday)
  monthStart.setDate(monthStart.getDate() - 29)

  let weekNet = 0
  let monthNet = 0

  for (const item of shiftItems) {
    const raw = item?.date
    if (!raw) continue
    const d = new Date(`${raw}T12:00:00`)
    if (Number.isNaN(d.getTime())) continue
    const net = Number(item.net_received)
    if (!Number.isFinite(net)) continue
    if (d >= weekStart && d <= now) weekNet += net
    if (d >= monthStart && d <= now) monthNet += net
  }

  const sorted = [...shiftItems].sort((a, b) => {
    const ta = new Date(`${a.date}T12:00:00`).getTime()
    const tb = new Date(`${b.date}T12:00:00`).getTime()
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta)
  })

  const recent = sorted.slice(0, 5)
  const needsAttention = shiftItems.filter((i) => i.status === 'pending' || i.status === 'flagged').length

  return {
    weekNet: Number(weekNet.toFixed(2)),
    monthNet: Number(monthNet.toFixed(2)),
    recent,
    needsAttention,
  }
}

export const buildBenchmarkChartData = ({ shiftItems, selectedPlatform, benchmarkMedian }) => {
  return shiftItems
    .filter((item) => item.platform === selectedPlatform)
    .map((item) => ({
      rawDate: item.date,
      dateLabel: formatDate(item.date),
      myHourly: formatHourlyRate(item.net_received, item.hours_worked),
      cityMedian: benchmarkMedian,
    }))
    .sort((first, second) => new Date(first.rawDate) - new Date(second.rawDate))
    .slice(-20)
}

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const buildCertificatePrintHtml = (certificate) => {
  const worker = certificate?.worker || {}
  const summary = certificate?.summary || {}
  const filters = certificate?.filters || {}
  const logs = certificate?.logs || []

  const rows = logs
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(formatDate(item.date))}</td>
          <td>${escapeHtml(item.platform)}</td>
          <td>${escapeHtml(Number(item.hours_worked || 0).toFixed(2))}</td>
          <td>${escapeHtml(formatCurrency(item.net_received))}</td>
          <td>${escapeHtml(item.status)}</td>
        </tr>
      `
    )
    .join('')

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>FairGig Certificate</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1f2937; margin: 24px; }
          h1 { margin: 0 0 8px; }
          p { margin: 4px 0; }
          .meta { margin-bottom: 16px; }
          .summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 16px 0; }
          .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f1f5f9; }
        </style>
      </head>
      <body>
        <h1>FairGig Verified Earnings Certificate</h1>
        <div class="meta">
          <p><strong>Worker:</strong> ${escapeHtml(worker.full_name || 'N/A')}</p>
          <p><strong>Worker ID:</strong> ${escapeHtml(worker.id || 'N/A')}</p>
          <p><strong>City:</strong> ${escapeHtml(worker.city_zone || 'N/A')}</p>
          <p><strong>Filters:</strong> From ${escapeHtml(filters.from || 'Start')} to ${escapeHtml(filters.to || 'Now')}</p>
        </div>

        <div class="summary">
          <div class="card"><strong>Verified Logs</strong><br/>${escapeHtml(summary.total_verified_logs || 0)}</div>
          <div class="card"><strong>Total Hours</strong><br/>${escapeHtml(Number(summary.total_hours || 0).toFixed(2))}</div>
          <div class="card"><strong>Total Gross</strong><br/>${escapeHtml(formatCurrency(summary.total_gross || 0))}</div>
          <div class="card"><strong>Total Net</strong><br/>${escapeHtml(formatCurrency(summary.total_net || 0))}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Platform</th>
              <th>Hours</th>
              <th>Net</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="5">No verified logs found for selected range.</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
  `
}
