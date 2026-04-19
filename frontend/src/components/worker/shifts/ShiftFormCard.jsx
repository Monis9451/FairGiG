import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ShiftAnomalyPanel from '@/components/worker/shifts/ShiftAnomalyPanel'
import { cn } from '@/lib/utils'

const ShiftFormCard = ({
  register,
  errors,
  onSubmit,
  platformOptions,
  onSelectScreenshotFile,
  maxScreenshotMb,
  screenshotFile,
  uploadScreenshotPending,
  uploadedScreenshot,
  screenshotPreviewUrl,
  watchedScreenshotUrl,
  savePending,
  analyzePending,
  onAnalyzeCurrentShift,
  anomalyResult,
}) => {
  const shiftSaveInProgress = savePending || uploadScreenshotPending
  const busy = shiftSaveInProgress || analyzePending

  const fieldClass = (name) =>
    cn(
      'h-11 w-full rounded-lg border bg-white px-3 text-base text-brand-darkest transition-colors sm:text-sm',
      errors[name]
        ? 'border-red-400 focus-visible:ring-2 focus-visible:ring-red-400/40'
        : 'border-brand-muted/40 focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/25'
    )

  return (
    <section className="rounded-2xl border border-brand-muted/25 bg-white p-4 shadow-sm sm:p-5">
      <div className="border-b border-brand-muted/15 pb-4">
        <h2 className="text-lg font-semibold text-brand-darkest">Add a shift</h2>
        <p className="mt-1 text-sm text-brand-muted">
          Net pay updates as you type. You can run a quick pay check below without a screenshot; you only need proof when
          you hit Save.
        </p>
      </div>

      <form className="mt-5 space-y-5" onSubmit={onSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="platform" className="text-xs font-medium text-brand-dark">
              Platform
            </Label>
            <select
              id="platform"
              {...register('platform')}
              className={fieldClass('platform')}
              aria-invalid={errors.platform ? 'true' : 'false'}
              aria-describedby={errors.platform ? 'platform-error' : undefined}
            >
              {platformOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.platform ? (
              <p id="platform-error" className="text-xs font-medium text-red-600" role="alert">
                {errors.platform.message}
              </p>
            ) : (
              <p className="text-xs text-brand-muted">
                Pay check only uses shifts that are already <strong className="font-semibold">verified</strong> on this
                app, and only from <strong className="font-semibold">dates before</strong> the one you pick.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-xs font-medium text-brand-dark">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
              className={fieldClass('date')}
              aria-invalid={errors.date ? 'true' : 'false'}
              aria-describedby={errors.date ? 'date-error' : undefined}
            />
            {errors.date ? (
              <p id="date-error" className="text-xs font-medium text-red-600" role="alert">
                {errors.date.message}
              </p>
            ) : (
              <p className="text-xs text-brand-muted">
                Use the real day this shift belongs to. To compare &quot;today&quot;, your older verified shifts should
                be logged on earlier calendar days.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="hours_worked" className="text-xs font-medium text-brand-dark">
              Hours worked
            </Label>
            <Input
              id="hours_worked"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              {...register('hours_worked')}
              className={fieldClass('hours_worked')}
              aria-invalid={errors.hours_worked ? 'true' : 'false'}
              aria-describedby={errors.hours_worked ? 'hours-error' : 'hours-hint'}
            />
            {errors.hours_worked ? (
              <p id="hours-error" className="text-xs font-medium text-red-600" role="alert">
                {errors.hours_worked.message}
              </p>
            ) : (
              <p id="hours-hint" className="text-xs text-brand-muted">
                Between 0 and 24 hours.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gross_earned" className="text-xs font-medium text-brand-dark">
              Gross earned
            </Label>
            <Input
              id="gross_earned"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              {...register('gross_earned')}
              className={fieldClass('gross_earned')}
              aria-invalid={errors.gross_earned ? 'true' : 'false'}
              aria-describedby={errors.gross_earned ? 'gross-error' : undefined}
            />
            {errors.gross_earned ? (
              <p id="gross-error" className="text-xs font-medium text-red-600" role="alert">
                {errors.gross_earned.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="deductions" className="text-xs font-medium text-brand-dark">
              Deductions
            </Label>
            <Input
              id="deductions"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              {...register('deductions')}
              className={fieldClass('deductions')}
              aria-invalid={errors.deductions ? 'true' : 'false'}
              aria-describedby={errors.deductions ? 'deductions-error' : undefined}
            />
            {errors.deductions ? (
              <p id="deductions-error" className="text-xs font-medium text-red-600" role="alert">
                {errors.deductions.message}
              </p>
            ) : (
              <p className="text-xs text-brand-muted">Cannot exceed gross.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="net_received" className="text-xs font-medium text-brand-dark">
              Net received
            </Label>
            <Input
              id="net_received"
              type="number"
              step="0.01"
              readOnly
              {...register('net_received')}
              className="h-11 rounded-lg border border-brand-muted/30 bg-brand-light/50 px-3 text-base font-semibold tabular-nums text-brand-darkest sm:text-sm"
              aria-live="polite"
            />
            <p className="text-xs text-brand-muted">Gross − deductions (read-only).</p>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-brand-muted/25 bg-brand-light/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="screenshot_file" className="text-xs font-medium text-brand-dark">
              Proof screenshot
            </Label>
            <span className="rounded-md bg-brand-darkest/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-light">
              Required to save
            </span>
          </div>
          <input
            id="screenshot_file"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="block w-full text-sm text-brand-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-light"
            onChange={(event) => onSelectScreenshotFile(event.target.files?.[0] || null)}
          />
          <p className="text-xs text-brand-muted">
            JPG, PNG, or WEBP · max {maxScreenshotMb} MB. Upload runs when you save.
          </p>
          <p className="text-sm text-brand-darkest/90">
            {uploadScreenshotPending
              ? 'Uploading…'
              : uploadedScreenshot?.secure_url
                ? 'Ready to save.'
                : screenshotFile
                  ? 'File selected — will upload on save.'
                  : 'Choose a file before saving.'}
          </p>
          {screenshotPreviewUrl ? (
            <img
              src={screenshotPreviewUrl}
              alt=""
              className="max-h-40 w-full rounded-lg border border-brand-muted/30 object-contain"
              loading="lazy"
            />
          ) : null}
          {watchedScreenshotUrl ? (
            <a
              href={watchedScreenshotUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-xs font-semibold text-brand-primary underline-offset-2 hover:underline"
            >
              Open current screenshot URL
            </a>
          ) : null}
          <input type="hidden" {...register('screenshot_url')} />
          {errors.screenshot_url ? (
            <p className="text-xs font-medium text-red-600" role="alert">
              {errors.screenshot_url.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            type="submit"
            className="h-12 w-full rounded-lg font-semibold sm:h-11 sm:w-auto sm:min-w-[140px]"
            disabled={shiftSaveInProgress}
          >
            {shiftSaveInProgress ? 'Saving…' : 'Save shift'}
          </Button>
          <Button
            type="button"
            className="h-12 w-full rounded-lg border-2 border-brand-muted/45 bg-white font-semibold text-brand-darkest hover:bg-brand-light/80 sm:h-11 sm:w-auto sm:min-w-[140px]"
            onClick={onAnalyzeCurrentShift}
            disabled={busy}
          >
            {analyzePending ? 'Comparing…' : 'Compare to my usual pay'}
          </Button>
        </div>

        <ShiftAnomalyPanel anomalyResult={anomalyResult} analyzePending={analyzePending} />
      </form>
    </section>
  )
}

export default ShiftFormCard
