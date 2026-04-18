import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SHIFT_STATUS_OPTIONS } from '@/features/verifier/constants'

const QueueFilters = ({ filters, onChange, onApply, onReset }) => {
  return (
    <div className="rounded-xl border border-brand-muted/35 bg-brand-light/70 p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <Label htmlFor="shift_filter_worker_id">Worker ID</Label>
          <Input
            id="shift_filter_worker_id"
            placeholder="worker uuid"
            value={filters.workerId}
            onChange={(event) => onChange('workerId', event.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="shift_filter_status">Status</Label>
          <select
            id="shift_filter_status"
            className="h-10 w-full rounded-md border-2 border-brand-primary bg-brand-light px-3 text-sm text-brand-darkest focus:outline-none focus:ring-2 focus:ring-brand-primary"
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
          />
        </div>

        <div>
          <Label htmlFor="shift_filter_from">From</Label>
          <Input
            id="shift_filter_from"
            type="date"
            value={filters.from}
            onChange={(event) => onChange('from', event.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="shift_filter_to">To</Label>
          <Input
            id="shift_filter_to"
            type="date"
            value={filters.to}
            onChange={(event) => onChange('to', event.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="button"
          className="rounded-xl border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
          onClick={onApply}
        >
          Apply Filters
        </Button>
        <Button
          type="button"
          className="rounded-xl border border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-brand-darkest transition-opacity hover:opacity-90"
          onClick={onReset}
        >
          Reset
        </Button>
      </div>
    </div>
  )
}

export default QueueFilters
