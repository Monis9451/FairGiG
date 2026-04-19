import { Button } from '@/components/ui/button'

const CsvImportCard = ({ csvFile, setCsvFile, onImportCsv, csvImportPending }) => {
  return (
    <section className="rounded-2xl border border-brand-muted/25 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-semibold text-brand-darkest">Import CSV</h2>
      <p className="mt-1 text-sm text-brand-muted">
        UTF-8 CSV with columns: platform, date, hours_worked, gross_earned, deductions, net_received.
      </p>

      <div className="mt-4 space-y-3">
        <input
          type="file"
          accept=".csv,text/csv"
          className="block w-full text-sm text-brand-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-light"
          onChange={(event) => {
            const file = event.target.files?.[0] || null
            setCsvFile(file)
          }}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            className="h-11 w-full rounded-lg font-semibold sm:w-auto"
            onClick={onImportCsv}
            disabled={csvImportPending}
          >
            {csvImportPending ? 'Importing…' : 'Run import'}
          </Button>
          <p className="truncate text-xs text-brand-muted sm:max-w-[12rem]">
            {csvFile ? csvFile.name : 'No file selected'}
          </p>
        </div>
      </div>
    </section>
  )
}

export default CsvImportCard
