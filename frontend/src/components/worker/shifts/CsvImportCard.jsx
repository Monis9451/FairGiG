import { AlertTriangle, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import WorkerSectionCard from '@/components/worker/WorkerSectionCard'
import { formatPercent } from '@/utils/formatters'

const CsvImportCard = ({ csvFile, setCsvFile, onImportCsv, csvImportPending, anomalyResult }) => {
  const hasAnomalyResult = Boolean(anomalyResult)
  const anomalyDetected = Boolean(anomalyResult?.is_anomaly)
  const AnomalyIcon = anomalyDetected ? AlertTriangle : CheckCircle2

  return (
    <WorkerSectionCard
      kicker="Bulk Upload"
      title="CSV Import"
      description="Upload a UTF-8 CSV with at least 10 rows and required earnings columns."
      contentClassName="space-y-5"
    >
      <div className="rounded-2xl border border-brand-muted/35 bg-brand-light/70 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">Import file</p>

        <div className="mt-3 rounded-xl border border-dashed border-brand-muted/55 bg-brand-light/70 p-4">
          <input
            type="file"
            accept=".csv,text/csv"
            className="block w-full rounded-xl border border-brand-primary/35 bg-brand-light px-3 py-2 text-sm text-brand-darkest shadow-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-light hover:file:opacity-90"
            onChange={(event) => {
              const file = event.target.files?.[0] || null
              setCsvFile(file)
            }}
          />
          <p className="mt-2 text-xs text-brand-muted">
            Expected columns: platform, date, hours_worked, gross_earned, deductions, net_received.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light shadow-[0_10px_20px_rgba(18,78,102,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 disabled:translate-y-0 disabled:opacity-60"
            onClick={onImportCsv}
            disabled={csvImportPending}
          >
            {csvImportPending ? 'Importing...' : 'Import CSV'}
          </Button>

          <span className="rounded-full border border-brand-muted/45 bg-brand-light px-3 py-1 text-xs font-medium text-brand-muted">
            {csvFile ? `Selected: ${csvFile.name}` : 'No file selected'}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-muted/35 bg-brand-light/70 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">Anomaly Result</p>
          {hasAnomalyResult ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                anomalyDetected
                  ? 'border-brand-dark/70 bg-brand-dark text-brand-light'
                  : 'border-brand-primary/35 bg-brand-primary/15 text-brand-darkest'
              }`}
            >
              <AnomalyIcon size={12} aria-hidden="true" />
              {anomalyDetected ? 'Anomaly detected' : 'Normal'}
            </span>
          ) : null}
        </div>

        {hasAnomalyResult ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-brand-muted/35 bg-brand-light p-3">
              <p className="text-xs uppercase tracking-wide text-brand-muted">Explanation</p>
              <p className="mt-1 text-sm leading-relaxed text-brand-darkest">{anomalyResult.explanation}</p>
            </div>
            <div className="rounded-xl border border-brand-muted/35 bg-brand-light p-3">
              <p className="text-xs uppercase tracking-wide text-brand-muted">Scores</p>
              <p className="mt-1 text-sm text-brand-darkest">
                Z-score: <span className="font-semibold">{anomalyResult.z_score}</span>
              </p>
              <p className="text-sm text-brand-darkest">
                Drop: <span className="font-semibold">{formatPercent(anomalyResult.percent_drop)}</span>
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 rounded-xl border border-brand-muted/35 bg-brand-light px-3 py-2.5 text-sm text-brand-muted">
            No anomaly run yet.
          </p>
        )}
      </div>
    </WorkerSectionCard>
  )
}

export default CsvImportCard
