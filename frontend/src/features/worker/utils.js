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

/** Newest grievance first. */
export const sortGrievancesNewestFirst = (items) =>
  [...items].sort((a, b) => {
    const ta = new Date(a.created_at).getTime()
    const tb = new Date(b.created_at).getTime()
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta)
  })

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

const roundMoney = (value) => Number(Number(value || 0).toFixed(2))

export const buildAnalyzePayload = (currentShift) => {
  const normalizedCurrentPlatform = normalizePlatformName(currentShift.platform)

  return {
    platform: normalizedCurrentPlatform,
    current_shift: {
      date: currentShift.date,
      platform: normalizedCurrentPlatform,
      gross_earned: roundMoney(currentShift.gross_earned),
      deductions: roundMoney(currentShift.deductions),
      net_received: roundMoney(currentShift.net_received),
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

/** Newest shift date first (for dashboards and lists). */
export const sortShiftLogsNewestFirst = (shiftItems) =>
  [...shiftItems].sort((a, b) => {
    const ta = new Date(`${a.date}T12:00:00`).getTime()
    const tb = new Date(`${b.date}T12:00:00`).getTime()
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta)
  })

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

  const needsAttention = shiftItems.filter((i) => i.status === 'pending' || i.status === 'flagged').length

  return {
    weekNet: Number(weekNet.toFixed(2)),
    monthNet: Number(monthNet.toFixed(2)),
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

/** Brand-aligned print/PDF (browser Print → Save as PDF). */
export const buildCertificatePrintHtml = (certificate) => {
  const worker = certificate?.worker || {}
  const summary = certificate?.summary || {}
  const filters = certificate?.filters || {}
  const logs = certificate?.logs || []

  const periodFrom = filters.from ? formatDate(filters.from) : 'Start of records'
  const periodTo = filters.to ? formatDate(filters.to) : 'Latest verified shift'
  const issued = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const rows = logs
    .map(
      (item, index) => `
        <tr class="${index % 2 === 0 ? 'r-even' : 'r-odd'}">
          <td>${escapeHtml(formatDate(item.date))}</td>
          <td>${escapeHtml(item.platform)}</td>
          <td class="num">${escapeHtml(Number(item.hours_worked || 0).toFixed(2))}</td>
          <td class="num">${escapeHtml(formatCurrency(item.gross_earned))}</td>
          <td class="num">${escapeHtml(formatCurrency(item.deductions))}</td>
          <td class="num net">${escapeHtml(formatCurrency(item.net_received))}</td>
        </tr>
      `
    )
    .join('')

  const stat = (label, value, strong) => `
    <div class="stat ${strong ? 'stat-em' : ''}">
      <p class="stat-label">${escapeHtml(label)}</p>
      <p class="stat-value">${value}</p>
    </div>
  `

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>FairGig — Verified earnings statement</title>
    <style>
      :root {
        --fg: #212A31;
        --fg2: #2E3944;
        --muted: #748D92;
        --primary: #124E66;
        --light: #D3D9D4;
        --paper: #ffffff;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: var(--fg);
        background: var(--light);
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .sheet {
        max-width: 800px;
        margin: 0 auto;
        padding: 12px;
      }
      .paper {
        background: var(--paper);
        border: 1px solid rgba(18, 78, 102, 0.22);
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 12px 40px rgba(18, 78, 102, 0.12);
      }
      .hero {
        background: var(--primary);
        color: #fff;
        padding: 22px 26px;
      }
      .hero-kicker {
        margin: 0;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        opacity: 0.78;
      }
      .hero h1 {
        margin: 8px 0 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 24px;
        font-weight: 700;
        line-height: 1.2;
      }
      .hero-lead {
        margin: 12px 0 0;
        font-size: 13px;
        line-height: 1.5;
        opacity: 0.92;
        max-width: 52ch;
      }
      .body {
        padding: 22px 26px 26px;
      }
      .identity {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        justify-content: space-between;
        padding-bottom: 18px;
        border-bottom: 1px solid rgba(116, 141, 146, 0.28);
      }
      .identity h2 {
        margin: 4px 0 0;
        font-size: 20px;
      }
      .muted { color: var(--muted); font-size: 12px; }
      .mono { font-family: ui-monospace, monospace; color: var(--fg2); }
      .period-box {
        border: 1px solid rgba(18, 78, 102, 0.22);
        background: rgba(18, 78, 102, 0.06);
        border-radius: 8px;
        padding: 10px 14px;
        min-width: 200px;
      }
      .period-box .t { font-size: 11px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.06em; }
      .period-box .d { margin-top: 6px; font-size: 13px; color: var(--fg2); }
      .period-box .i { margin-top: 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
      .stats-title {
        margin: 20px 0 10px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }
      .stat {
        border: 1px solid rgba(116, 141, 146, 0.25);
        background: rgba(211, 217, 212, 0.2);
        border-radius: 8px;
        padding: 10px 12px;
      }
      .stat-em {
        border-color: rgba(18, 78, 102, 0.32);
        background: rgba(18, 78, 102, 0.08);
      }
      .stat-label {
        margin: 0;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--muted);
      }
      .stat-value {
        margin: 6px 0 0;
        font-size: 16px;
        font-weight: 700;
        color: var(--fg);
      }
      .stat-em .stat-value { color: var(--primary); }
      .table-title {
        margin: 22px 0 10px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--muted);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }
      thead { display: table-header-group; }
      th {
        background: var(--fg);
        color: var(--light);
        text-align: left;
        padding: 9px 8px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      td {
        padding: 8px;
        border-bottom: 1px solid rgba(116, 141, 146, 0.2);
        color: var(--fg2);
      }
      .r-even { background: #fff; }
      .r-odd { background: rgba(211, 217, 212, 0.14); }
      .num { text-align: right; font-variant-numeric: tabular-nums; }
      .net { font-weight: 700; color: var(--primary); }
      .empty {
        text-align: center;
        padding: 28px 16px;
        color: var(--muted);
        border: 1px dashed rgba(116, 141, 146, 0.4);
        border-radius: 8px;
        background: rgba(211, 217, 212, 0.18);
      }
      footer {
        margin-top: 20px;
        padding-top: 14px;
        border-top: 1px solid rgba(116, 141, 146, 0.25);
        font-size: 10px;
        line-height: 1.55;
        color: var(--muted);
      }
      @page {
        size: A4;
        margin: 14mm;
      }
      @media print {
        body { background: #fff; }
        .sheet { padding: 0; max-width: none; }
        .paper { box-shadow: none; border-radius: 0; border: none; }
        tr { break-inside: avoid; page-break-inside: avoid; }
      }
      @media (max-width: 640px) {
        .stats { grid-template-columns: 1fr 1fr; }
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="paper">
        <header class="hero">
          <p class="hero-kicker">FairGig</p>
          <h1>Verified earnings statement</h1>
          <p class="hero-lead">
            Official-style summary of <strong>verified</strong> platform shift earnings recorded in FairGig for the
            worker and period below. Use Print → Save as PDF for a copy.
          </p>
        </header>
        <div class="body">
          <div class="identity">
            <div>
              <p class="muted" style="margin:0;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;font-size:10px;">Worker</p>
              <h2>${escapeHtml(worker.full_name || '—')}</h2>
              <p class="muted" style="margin:6px 0 0;">ID: <span class="mono">${escapeHtml(worker.id || '—')}</span></p>
              ${
                worker.city_zone
                  ? `<p class="muted" style="margin:6px 0 0;">City / zone: ${escapeHtml(worker.city_zone)}</p>`
                  : ''
              }
            </div>
            <div class="period-box">
              <p class="t">Period covered</p>
              <p class="d">${escapeHtml(periodFrom)} — ${escapeHtml(periodTo)}</p>
              <p class="i">Issued on</p>
              <p class="d" style="margin-top:4px;font-weight:600;color:var(--fg);">${escapeHtml(issued)}</p>
            </div>
          </div>

          <p class="stats-title">Totals (verified only)</p>
          <div class="stats">
            ${stat('Verified shifts', escapeHtml(String(summary.total_verified_logs ?? 0)), false)}
            ${stat('Total hours', escapeHtml(Number(summary.total_hours || 0).toFixed(2)), false)}
            ${stat('Total gross', escapeHtml(formatCurrency(summary.total_gross || 0)), false)}
            ${stat('Total deductions', escapeHtml(formatCurrency(summary.total_deductions || 0)), false)}
            ${stat('Total net paid', escapeHtml(formatCurrency(summary.total_net || 0)), true)}
          </div>

          <p class="table-title">Shift detail</p>
          ${
            logs.length === 0
              ? '<div class="empty">No verified shifts in this date range.</div>'
              : `<table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Platform</th>
                <th class="num">Hours</th>
                <th class="num">Gross</th>
                <th class="num">Deductions</th>
                <th class="num">Net</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>`
          }

          <footer>
            <p>
              This statement reflects verified earnings only. It is for your records and does not replace tax or legal
              advice from a qualified professional. FairGig does not guarantee completeness for third-party platforms.
            </p>
          </footer>
        </div>
      </div>
    </div>
  </body>
</html>`
}
