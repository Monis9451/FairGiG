import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const GrievanceFormCard = ({
  registerGrievance,
  grievanceErrors,
  onCreateGrievance,
  platformOptions,
  createGrievancePending,
}) => {
  const fieldClass = (name) =>
    cn(
      'h-11 w-full rounded-lg border bg-white px-3 text-base text-brand-darkest sm:text-sm',
      grievanceErrors[name]
        ? 'border-red-400 focus-visible:ring-2 focus-visible:ring-red-400/40'
        : 'border-brand-muted/40 focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/25'
    )

  const textAreaClass = cn(
    'min-h-[140px] w-full rounded-lg border bg-white px-3 py-2 text-base text-brand-darkest sm:text-sm',
    grievanceErrors.description
      ? 'border-red-400 focus-visible:ring-2 focus-visible:ring-red-400/40'
      : 'border-brand-muted/40 focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/25'
  )

  return (
    <section className="rounded-2xl border border-brand-muted/25 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-semibold text-brand-darkest">New report</h2>
      <p className="mt-1 text-sm text-brand-muted">
        Clear details help advocates review your case faster. You can track status under &quot;My reports&quot;.
      </p>

      <form className="mt-5 space-y-5" onSubmit={onCreateGrievance} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="grievance_platform" className="text-xs font-medium text-brand-dark">
              Platform
            </Label>
            <select
              id="grievance_platform"
              {...registerGrievance('platform')}
              className={fieldClass('platform')}
              aria-invalid={grievanceErrors.platform ? 'true' : 'false'}
            >
              {platformOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {grievanceErrors.platform ? (
              <p className="text-xs font-medium text-red-600" role="alert">
                {grievanceErrors.platform.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="grievance_category" className="text-xs font-medium text-brand-dark">
              Type of issue
            </Label>
            <Input
              id="grievance_category"
              placeholder="e.g. late payment, wrong deduction"
              {...registerGrievance('category')}
              className={fieldClass('category')}
              aria-invalid={grievanceErrors.category ? 'true' : 'false'}
            />
            {grievanceErrors.category ? (
              <p className="text-xs font-medium text-red-600" role="alert">
                {grievanceErrors.category.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="grievance_description" className="text-xs font-medium text-brand-dark">
            What happened?
          </Label>
          <textarea
            id="grievance_description"
            rows={5}
            className={textAreaClass}
            placeholder="Dates, amounts, order or trip IDs if you have them — anything that helps someone understand the problem."
            {...registerGrievance('description')}
            aria-invalid={grievanceErrors.description ? 'true' : 'false'}
          />
          {grievanceErrors.description ? (
            <p className="text-xs font-medium text-red-600" role="alert">
              {grievanceErrors.description.message}
            </p>
          ) : (
            <p className="text-xs text-brand-muted">At least a few sentences work best.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="grievance_tags" className="text-xs font-medium text-brand-dark">
            Tags <span className="font-normal text-brand-muted">(optional)</span>
          </Label>
          <Input
            id="grievance_tags"
            placeholder="e.g. payout, Karachi, week 12"
            {...registerGrievance('tags')}
            className={fieldClass('tags')}
          />
          <p className="text-xs text-brand-muted">Comma-separated keywords — helps filtering later.</p>
        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-lg font-semibold sm:h-11 sm:w-auto sm:min-w-[160px]"
          disabled={createGrievancePending}
        >
          {createGrievancePending ? 'Sending…' : 'Submit report'}
        </Button>
      </form>
    </section>
  )
}

export default GrievanceFormCard
