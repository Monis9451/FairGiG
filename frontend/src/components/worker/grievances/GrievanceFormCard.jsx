import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import WorkerSectionCard from '@/components/worker/WorkerSectionCard'

const GrievanceFormCard = ({
  registerGrievance,
  grievanceErrors,
  onCreateGrievance,
  platformOptions,
  createGrievancePending,
}) => {
  return (
    <WorkerSectionCard
      title="Grievances"
      description="Raise an issue and track your grievance statuses."
    >
      <form className="space-y-4" onSubmit={onCreateGrievance}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="grievance_platform">Platform</Label>
            <select
              id="grievance_platform"
              {...registerGrievance('platform')}
              className="h-10 w-full rounded-md border-2 border-brand-primary bg-brand-light px-3 text-sm text-brand-darkest focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              {platformOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {grievanceErrors.platform ? (
              <p className="mt-1 text-xs text-brand-muted">{grievanceErrors.platform.message}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="grievance_category">Category</Label>
            <Input
              id="grievance_category"
              placeholder="payment issue"
              {...registerGrievance('category')}
            />
            {grievanceErrors.category ? (
              <p className="mt-1 text-xs text-brand-muted">{grievanceErrors.category.message}</p>
            ) : null}
          </div>
        </div>

        <div>
          <Label htmlFor="grievance_description">Description</Label>
          <textarea
            id="grievance_description"
            rows={4}
            className="min-h-[110px] w-full rounded-md border-2 border-brand-primary bg-brand-light px-3 py-2 text-sm text-brand-darkest focus:outline-none focus:ring-2 focus:ring-brand-primary"
            placeholder="Describe what happened and why this should be reviewed."
            {...registerGrievance('description')}
          />
          {grievanceErrors.description ? (
            <p className="mt-1 text-xs text-brand-muted">{grievanceErrors.description.message}</p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="grievance_tags">Tags (optional, comma separated)</Label>
          <Input
            id="grievance_tags"
            placeholder="late payout, deduction mismatch"
            {...registerGrievance('tags')}
          />
        </div>

        <Button
          type="submit"
          className="rounded-md border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
          disabled={createGrievancePending}
        >
          {createGrievancePending ? 'Submitting...' : 'Submit Grievance'}
        </Button>
      </form>
    </WorkerSectionCard>
  )
}

export default GrievanceFormCard
