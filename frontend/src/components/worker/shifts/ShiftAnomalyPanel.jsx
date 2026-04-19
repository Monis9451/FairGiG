import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react'

import { formatPercent } from '@/utils/formatters'
import { cn } from '@/lib/utils'

/** Turn backend wording into short, rider-friendly copy when we recognize it. */
const friendlyInsufficientMessage = (reason) => {
  if (!reason || !String(reason).trim()) {
    return 'We need more of your verified shifts on this app before we can tell if this day looks normal for you.'
  }

  const match = String(reason).match(
    /At least (\d+) verified history points are required;\s*got (\d+)\.?/i
  )
  if (match) {
    const [, need, have] = match
    return `We compare a new day to your past verified shifts on the same app. You need at least ${need} in your history for a fair comparison — right now we have ${have}. Add or get more shifts verified, then try again.`
  }

  return reason
}

const ShiftAnomalyPanel = ({ anomalyResult, analyzePending }) => {
  if (analyzePending) {
    return (
      <div
        className="rounded-xl border border-brand-primary/25 bg-brand-primary/5 px-4 py-3"
        role="status"
        aria-live="polite"
      >
        <p className="flex items-center gap-2 text-sm font-medium text-brand-darkest">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-primary" aria-hidden />
          Comparing this shift to your past verified days on the same app…
        </p>
        <p className="mt-1 text-xs text-brand-muted">
          This only uses shifts that are already verified — not drafts or other apps.
        </p>
      </div>
    )
  }

  if (!anomalyResult) {
    return (
      <div className="rounded-xl border border-dashed border-brand-muted/40 bg-brand-light/40 px-4 py-3 text-sm text-brand-muted">
        <p className="font-medium text-brand-darkest/80">Pay check</p>
        <p className="mt-1 text-xs leading-relaxed">
          Enter this shift&apos;s amounts, then tap{' '}
          <span className="font-semibold text-brand-darkest">Compare to my usual pay</span>. You don&apos;t need a
          screenshot for that — only when you save the shift.
        </p>
      </div>
    )
  }

  const ready = anomalyResult.ready !== false
  const insufficient = !ready
  const flagged = ready && Boolean(anomalyResult.is_anomaly)
  const deduction = anomalyResult.deduction_signal

  const historyCount =
    anomalyResult.history_count != null && Number.isFinite(Number(anomalyResult.history_count))
      ? Number(anomalyResult.history_count)
      : null

  const hasValidDrop =
    anomalyResult.percent_drop != null && Number.isFinite(Number(anomalyResult.percent_drop))
  const dropPct = hasValidDrop ? Number(anomalyResult.percent_drop) : null

  const summary = insufficient
    ? friendlyInsufficientMessage(anomalyResult.insufficient_reason)
    : flagged
      ? anomalyResult.explanation ||
        'This day looks noticeably lower than what you usually take home on verified shifts for this app. Double-check the numbers or your trip summary if something feels off.'
      : anomalyResult.explanation ||
        'This day looks in line with what you usually earn on verified shifts for this app.'

  const extraPayContext =
    ready && !insufficient && dropPct != null && dropPct >= 1 && !summary.includes('%')
      ? ` About ${formatPercent(dropPct)} below your usual take-home for this app.`
      : ''

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-sm',
        insufficient && 'border-amber-200 bg-amber-50/90 text-amber-950',
        !insufficient && flagged && 'border-brand-dark/40 bg-brand-dark text-brand-light',
        !insufficient && !flagged && ready && 'border-emerald-200/80 bg-emerald-50/90 text-emerald-950'
      )}
      role="region"
      aria-label="Pay comparison result"
    >
      <div className="flex flex-wrap items-center gap-2">
        {insufficient ? (
          <Info className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
        ) : flagged ? (
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
        )}
        <span className="text-xs font-bold uppercase tracking-wide opacity-90">
          {insufficient
            ? 'Not enough past shifts yet'
            : flagged
              ? 'Lower than your usual'
              : 'Looks normal for you'}
        </span>
      </div>
      <p className="mt-2 leading-relaxed">
        {summary}
        {extraPayContext}
      </p>

      {ready && historyCount != null ? (
        <p className={cn('mt-2 text-xs leading-relaxed opacity-85', flagged && 'text-brand-light/90')}>
          We used {historyCount} of your earlier verified {historyCount === 1 ? 'shift' : 'shifts'} on this app as
          the reference.
        </p>
      ) : null}

      {deduction?.evaluated ? (
        <p
          className={cn(
            'mt-2 rounded-lg px-2 py-1.5 text-xs leading-relaxed',
            deduction.is_anomaly ? 'bg-black/10 font-medium' : 'opacity-90'
          )}
        >
          <span className="font-semibold">Fees and deductions: </span>
          {deduction.explanation}
        </p>
      ) : null}

      {anomalyResult.persist_warning ? (
        <p className="mt-2 text-xs opacity-80">Note: {anomalyResult.persist_warning}</p>
      ) : null}
    </div>
  )
}

export default ShiftAnomalyPanel
