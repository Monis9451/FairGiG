import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react'

import { formatCurrency, formatPercent } from '@/utils/formatters'
import { cn } from '@/lib/utils'

/** Backend joins net + deduction text; drop the deduction part so we don't say it twice. */
const stripDeductionFromCombinedExplanation = (fullExplanation, deduction) => {
  let text = String(fullExplanation || '').trim()
  const ded = deduction?.explanation?.trim()
  if (!ded || !text) return text
  if (text.includes(ded)) {
    text = text.replace(ded, '').replace(/\s+/g, ' ').trim()
  }
  return text.replace(/\s+\./g, '.').replace(/^[\s.]+/, '')
}

const friendlyInsufficientMessage = (reason) => {
  if (!reason || !String(reason).trim()) {
    return 'We need more verified shifts on this app before we can compare. Those shifts must be on earlier dates than the one you picked.'
  }

  const match = String(reason).match(
    /At least (\d+) verified history points are required;\s*got (\d+)\.?/i
  )
  if (match) {
    const [, need, have] = match
    return `To compare this date, we need at least ${need} verified shifts on this app from dates before that day. Right now we only have ${have}. Add or import shifts on earlier days, get them verified, then try again—or pick a later date once you have enough history.`
  }

  return reason
}

/** Plain-language take-home vs usual (uses API means when present). */
const takeHomeInPlainLanguage = ({ flagged, currentNet, meanNet, strippedBackend }) => {
  const cur = currentNet != null && Number.isFinite(Number(currentNet)) ? Number(currentNet) : null
  const mean = meanNet != null && Number.isFinite(Number(meanNet)) ? Number(meanNet) : null

  if (flagged) {
    let msg =
      "This shift's take-home looks noticeably lower than what you usually get on verified days for this app. Double-check the amounts or your trip summary."
    if (cur != null && mean != null) {
      msg += ` On similar past shifts you averaged about ${formatCurrency(mean)} net; this one is ${formatCurrency(cur)}.`
    }
    return msg
  }

  let msg =
    "This shift's take-home doesn't look unusually low compared with your other verified shifts on this app."
  if (cur != null && mean != null) {
    msg += ` On those you averaged about ${formatCurrency(mean)} net; here it's ${formatCurrency(cur)}.`
  } else if (strippedBackend) {
    const cleaned = String(strippedBackend)
      .replace(/z-score\s+[-\d.]+/gi, '')
      .replace(/baseline mean\s+[\d.]+%/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (cleaned.length > 20) msg = cleaned
  }

  return msg
}

/** Fees/deductions without z-score jargon. */
const feesInPlainLanguage = (d) => {
  if (!d?.evaluated) return null
  const curR = d.current_deduction_ratio
  if (curR == null || !Number.isFinite(Number(curR))) {
    return String(d.explanation || 'Fees could not be compared.').replace(/z-score\s+[-\d.]+/gi, '').trim()
  }

  const curPct = formatPercent(Number(curR) * 100)
  const meanR = d.mean_deduction_ratio
  const meanPct =
    meanR != null && Number.isFinite(Number(meanR)) ? formatPercent(Number(meanR) * 100) : null

  if (d.is_anomaly) {
    return meanPct
      ? `Platform fees and deductions are a bigger slice of gross than usual for you (${curPct} vs about ${meanPct} on past verified shifts). Worth a second look.`
      : `Platform fees and deductions are a bigger slice of gross than usual for you (${curPct}). Worth a second look.`
  }

  return meanPct
    ? `Platform fees and deductions here are ${curPct} of gross—close to what you usually see (${meanPct} on past verified shifts).`
    : `Platform fees and deductions here are ${curPct} of gross—similar to your past verified shifts.`
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
          Checking your pay against your verified history…
        </p>
        <p className="mt-1 text-xs text-brand-muted">
          We only use shifts that are already verified on this app, from dates before the one you entered.
        </p>
      </div>
    )
  }

  if (!anomalyResult) {
    return (
      <div className="rounded-xl border border-dashed border-brand-muted/40 bg-brand-light/40 px-4 py-3 text-sm text-brand-muted">
        <p className="font-medium text-brand-darkest/80">Quick pay check</p>
        <p className="mt-1 text-xs leading-relaxed">
          Fill in this shift&apos;s numbers, then tap{' '}
          <span className="font-semibold text-brand-darkest">Compare to my usual pay</span>. No screenshot needed for
          that—only when you save the shift.
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

  const strippedNetOnly = insufficient
    ? ''
    : stripDeductionFromCombinedExplanation(anomalyResult.explanation, deduction)

  const summary = insufficient
    ? friendlyInsufficientMessage(anomalyResult.insufficient_reason)
    : takeHomeInPlainLanguage({
        flagged,
        currentNet: anomalyResult.current_net_received,
        meanNet: anomalyResult.history_mean_net_received,
        strippedBackend: strippedNetOnly,
      })

  const showDropExtra =
    ready &&
    !insufficient &&
    dropPct != null &&
    dropPct >= 1 &&
    !summary.includes('%') &&
    (anomalyResult.history_mean_net_received == null || anomalyResult.current_net_received == null)

  const extraPayContext = showDropExtra ? ` About ${formatPercent(dropPct)} below your usual take-home.` : ''

  const deductionPlain = feesInPlainLanguage(deduction)
  const showDeductionBlock = Boolean(deductionPlain && deduction?.evaluated)

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
            ? 'Need more history first'
            : flagged
              ? 'Looks lower than usual'
              : 'Looks normal'}
        </span>
      </div>
      <p className="mt-2 leading-relaxed">
        {summary}
        {extraPayContext}
      </p>

      {ready && historyCount != null ? (
        <p className={cn('mt-2 text-xs leading-relaxed opacity-85', flagged && 'text-brand-light/90')}>
          This used <span className="font-semibold text-current">{historyCount}</span> verified{' '}
          {historyCount === 1 ? 'shift' : 'shifts'} on this app from <span className="font-semibold">earlier dates</span>{' '}
          than the one you&apos;re checking—not including the same calendar day.
        </p>
      ) : null}

      {showDeductionBlock ? (
        <p
          className={cn(
            'mt-2 rounded-lg border border-black/5 bg-black/[0.03] px-3 py-2 text-xs leading-relaxed',
            flagged && 'border-white/10 bg-black/20',
            deduction?.is_anomaly && 'font-medium'
          )}
        >
          <span className="font-semibold">Platform cuts: </span>
          {deductionPlain}
        </p>
      ) : null}

      {anomalyResult.persist_warning ? (
        <p className="mt-2 text-xs opacity-80">Note: {anomalyResult.persist_warning}</p>
      ) : null}
    </div>
  )
}

export default ShiftAnomalyPanel
