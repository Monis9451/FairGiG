import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GRIEVANCE_STATUS_OPTIONS } from '@/features/verifier/constants'

const selectClass =
  'h-11 w-full rounded-lg border border-brand-darkest/15 bg-white px-3 text-sm text-brand-darkest shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/25'

const GrievanceFilters = ({ filters, onChange, onApply, onReset }) => {
  return (
    <div className="rounded-lg border border-brand-darkest/10 bg-brand-light/30 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="grievance_filter_worker_id">Worker account</Label>
          <Input
            id="grievance_filter_worker_id"
            value={filters.workerId}
            onChange={(event) => onChange('workerId', event.target.value)}
            placeholder="UUID if filtering by account"
            className="mt-1.5 h-11 rounded-lg border-brand-darkest/15"
          />
        </div>

        <div>
          <Label htmlFor="grievance_filter_status">Status</Label>
          <select
            id="grievance_filter_status"
            className={`mt-1.5 ${selectClass}`}
            value={filters.status}
            onChange={(event) => onChange('status', event.target.value)}
          >
            <option value="">All</option>
            {GRIEVANCE_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="grievance_filter_platform">Platform</Label>
          <Input
            id="grievance_filter_platform"
            value={filters.platform}
            onChange={(event) => onChange('platform', event.target.value)}
            placeholder="Uber"
            className="mt-1.5 h-11 rounded-lg border-brand-darkest/15"
          />
        </div>

        <div>
          <Label htmlFor="grievance_filter_category">Category</Label>
          <Input
            id="grievance_filter_category"
            value={filters.category}
            onChange={(event) => onChange('category', event.target.value)}
            placeholder="payment issue"
            className="mt-1.5 h-11 rounded-lg border-brand-darkest/15"
          />
        </div>

        <div>
          <Label htmlFor="grievance_filter_tag">Tag</Label>
          <Input
            id="grievance_filter_tag"
            value={filters.tag}
            onChange={(event) => onChange('tag', event.target.value)}
            placeholder="late payout"
            className="mt-1.5 h-11 rounded-lg border-brand-darkest/15"
          />
        </div>

        <div>
          <Label htmlFor="grievance_filter_search">Search</Label>
          <Input
            id="grievance_filter_search"
            value={filters.search}
            onChange={(event) => onChange('search', event.target.value)}
            placeholder="description or category"
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

export default GrievanceFilters
