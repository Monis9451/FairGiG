import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import WorkerSectionCard from '@/components/worker/WorkerSectionCard'

const selectClassName =
  'h-11 w-full rounded-xl border border-brand-primary/35 bg-brand-light/90 px-3 text-sm text-brand-darkest shadow-sm transition-all duration-200 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30'

const inputClassName =
  'h-11 rounded-xl border border-brand-primary/35 bg-brand-light/90 shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-brand-primary/30'

const textAreaClassName =
  'min-h-[130px] w-full rounded-xl border border-brand-primary/35 bg-brand-light/90 px-3 py-2 text-sm text-brand-darkest shadow-sm transition-all duration-200 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30'

const errorClassName = 'mt-1.5 text-xs font-medium text-brand-dark'

const GrievanceFormCard = ({
  registerGrievance,
  grievanceErrors,
  onCreateGrievance,
  platformOptions,
  createGrievancePending,
}) => {
  return (
    <WorkerSectionCard
      kicker="Submission"
      title="Create a Grievance"
      description="Raise an issue with clear details so it can be reviewed and resolved faster."
      contentClassName="space-y-5"
    >
      <form className="space-y-5" onSubmit={onCreateGrievance}>
        <div className="rounded-2xl border border-brand-muted/35 bg-brand-light/70 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">Core details</p>

          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="grievance_platform">Platform</Label>
              <select
                id="grievance_platform"
                {...registerGrievance('platform')}
                className={selectClassName}
              >
                {platformOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {grievanceErrors.platform ? (
                <p className={errorClassName}>{grievanceErrors.platform.message}</p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="grievance_category">Category</Label>
              <Input
                id="grievance_category"
                placeholder="payment issue"
                {...registerGrievance('category')}
                className={inputClassName}
              />
              {grievanceErrors.category ? (
                <p className={errorClassName}>{grievanceErrors.category.message}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-muted/35 bg-brand-light/70 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">Issue narrative</p>

          <div className="mt-3">
            <Label htmlFor="grievance_description">Description</Label>
            <textarea
              id="grievance_description"
              rows={5}
              className={textAreaClassName}
              placeholder="Describe what happened and why this should be reviewed."
              {...registerGrievance('description')}
            />
            {grievanceErrors.description ? (
              <p className={errorClassName}>{grievanceErrors.description.message}</p>
            ) : null}
          </div>

          <div className="mt-4">
            <Label htmlFor="grievance_tags">Tags (optional, comma separated)</Label>
            <Input
              id="grievance_tags"
              placeholder="late payout, deduction mismatch"
              {...registerGrievance('tags')}
              className={inputClassName}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="inline-flex min-h-[44px] items-center rounded-xl border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light shadow-[0_10px_20px_rgba(18,78,102,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 disabled:translate-y-0 disabled:opacity-60"
          disabled={createGrievancePending}
        >
          {createGrievancePending ? 'Submitting...' : 'Submit Grievance'}
        </Button>
      </form>
    </WorkerSectionCard>
  )
}

export default GrievanceFormCard
