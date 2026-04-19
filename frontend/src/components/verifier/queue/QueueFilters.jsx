import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SHIFT_STATUS_OPTIONS } from '@/features/verifier/constants'

const selectClass =
  'h-11 w-full rounded-lg border border-brand-darkest/15 bg-white px-3 text-sm text-brand-darkest shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/25'

const QueueFilters = ({ filters, onChange, onApply, onReset }) => {
  return (
    <div className="rounded-lg border border-brand-darkest/10 bg-brand-light/30 p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <Label htmlFor="shift_filter_worker_id">Worker account</Label>
          <Input
            id="shift_filter_worker_id"
            placeholder="UUID if filtering by account"
            value={filters.workerId}
            onChange={(event) => onChange('workerId', event.target.value)}
            className="mt-1.5 h-11 rounded-lg border-brand-darkest/15"
          />
        </div>

        <div>
          <Label htmlFor="shift_filter_status">Status</Label>
          <select
            id="shift_filter_status"
            className={`mt-1.5 ${selectClass}`}
            value={filters.status}
            onChange={(event) => onChange('status', event.target.value)}
          >
            {SHIFT_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="shift_filter_platform">Platform</Label>
          <Input
            id="shift_filter_platform"
            placeholder="Uber"
            value={filters.platform}
            onChange={(event) => onChange('platform', event.target.value)}
            className="mt-1.5 h-11 rounded-lg border-brand-darkest/15"
          />
        </div>

        <div>
          <Label htmlFor="shift_filter_from">From</Label>
          <Input
            id="shift_filter_from"
            type="date"
            value={filters.from}
            onChange={(event) => onChange('from', event.target.value)}
            className="mt-1.5 h-11 rounded-lg border-brand-darkest/15"
          />
        </div>

        <div>
          <Label htmlFor="shift_filter_to">To</Label>
          <Input
            id="shift_filter_to"
            type="date"
            value={filters.to}
            onChange={(event) => onChange('to', event.target.value)}
            className="mt-1.5 h-11 rounded-lg border-brand-darkest/15"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          className="h-11 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-brand-light hover:opacity-90"
          onClick={onApply}
        >
          Apply
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-lg border-brand-darkest/15 bg-white px-4 text-sm font-semibold text-brand-darkest"
          onClick={onReset}
        >
          Reset
        </Button>
      </div>
    </div>
  )
}

export default QueueFilters
