import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GRIEVANCE_STATUS_OPTIONS } from '@/features/verifier/constants'

const GrievanceFilters = ({ filters, onChange, onApply, onReset }) => {
  return (
    <div className="rounded-xl border border-brand-muted/35 bg-brand-light/70 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="grievance_filter_worker_id">Worker ID</Label>
          <Input
            id="grievance_filter_worker_id"
            value={filters.workerId}
            onChange={(event) => onChange('workerId', event.target.value)}
            placeholder="worker uuid"
          />
        </div>

        <div>
          <Label htmlFor="grievance_filter_status">Status</Label>
          <select
            id="grievance_filter_status"
            className="h-10 w-full rounded-md border-2 border-brand-primary bg-brand-light px-3 text-sm text-brand-darkest focus:outline-none focus:ring-2 focus:ring-brand-primary"
            value={filters.status}
            onChange={(event) => onChange('status', event.target.value)}
          >
            <option value="">all</option>
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
          />
        </div>

        <div>
          <Label htmlFor="grievance_filter_category">Category</Label>
          <Input
            id="grievance_filter_category"
            value={filters.category}
            onChange={(event) => onChange('category', event.target.value)}
            placeholder="payment issue"
          />
        </div>

        <div>
          <Label htmlFor="grievance_filter_tag">Tag</Label>
          <Input
            id="grievance_filter_tag"
            value={filters.tag}
            onChange={(event) => onChange('tag', event.target.value)}
            placeholder="late payout"
          />
        </div>

        <div>
          <Label htmlFor="grievance_filter_search">Search</Label>
          <Input
            id="grievance_filter_search"
            value={filters.search}
            onChange={(event) => onChange('search', event.target.value)}
            placeholder="description or category"
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

export default GrievanceFilters
