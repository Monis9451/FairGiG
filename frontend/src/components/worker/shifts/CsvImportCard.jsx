import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import WorkerSectionCard from '@/components/worker/WorkerSectionCard'
import { formatPercent } from '@/utils/formatters'

const CsvImportCard = ({ csvFile, setCsvFile, onImportCsv, csvImportPending, anomalyResult }) => {
  return (
    <WorkerSectionCard
      title="CSV Import"
      description="Upload a UTF-8 CSV with at least 10 rows and required earnings columns."
    >
      <div className="space-y-4">
        <Input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0] || null
            setCsvFile(file)
          }}
        />

        <div className="flex items-center gap-3">
          <Button
            type="button"
            className="rounded-md border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
            onClick={onImportCsv}
            disabled={csvImportPending}
          >
            {csvImportPending ? 'Importing...' : 'Import CSV'}
          </Button>

          {csvFile ? (
            <p className="text-sm text-brand-muted">Selected: {csvFile.name}</p>
          ) : (
            <p className="text-sm text-brand-muted">No file selected</p>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-brand-muted/50 bg-brand-light p-4">
        <h3 className="font-semibold">Anomaly Result</h3>
        {anomalyResult ? (
          <div className="mt-3 space-y-2 text-sm">
            <p>
              <span className="font-medium">Status:</span>{' '}
              {anomalyResult.is_anomaly ? 'Anomaly detected' : 'No anomaly detected'}
            </p>
            <p>
              <span className="font-medium">Explanation:</span> {anomalyResult.explanation}
            </p>
            <p>
              <span className="font-medium">Z-score:</span> {anomalyResult.z_score}
            </p>
            <p>
              <span className="font-medium">Drop:</span> {formatPercent(anomalyResult.percent_drop)}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-brand-muted">No anomaly run yet.</p>
        )}
      </div>
    </WorkerSectionCard>
  )
}

export default CsvImportCard
