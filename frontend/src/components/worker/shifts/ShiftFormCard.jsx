import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import WorkerSectionCard from '@/components/worker/WorkerSectionCard'

const selectClassName =
  'h-11 w-full rounded-xl border border-brand-primary/35 bg-brand-light/90 px-3 text-sm text-brand-darkest shadow-sm transition-all duration-200 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30'

const fieldInputClassName =
  'h-11 rounded-xl border border-brand-primary/35 bg-brand-light/90 shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-brand-primary/30'

const fieldErrorClassName = 'mt-1.5 text-xs font-medium text-brand-dark'

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
}) => {
  const shiftSaveInProgress = savePending || uploadScreenshotPending

  return (
    <WorkerSectionCard
      kicker="Shift Capture"
      title="Log a Shift"
      description="Submit one shift record with proof. Net received is auto-calculated for accuracy and speed."
      contentClassName="space-y-5"
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="rounded-2xl border border-brand-muted/35 bg-brand-light/70 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">Shift details</p>

          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="platform">Platform</Label>
              <select
                id="platform"
                {...register('platform')}
                className={selectClassName}
              >
                {platformOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.platform ? <p className={fieldErrorClassName}>{errors.platform.message}</p> : null}
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register('date')} className={fieldInputClassName} />
              {errors.date ? <p className={fieldErrorClassName}>{errors.date.message}</p> : null}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-muted/35 bg-brand-light/70 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">Earnings breakdown</p>

          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="hours_worked">Hours Worked</Label>
              <Input
                id="hours_worked"
                type="number"
                step="0.1"
                {...register('hours_worked')}
                className={fieldInputClassName}
              />
              {errors.hours_worked ? (
                <p className={fieldErrorClassName}>{errors.hours_worked.message}</p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="gross_earned">Gross Earned</Label>
              <Input
                id="gross_earned"
                type="number"
                step="0.01"
                {...register('gross_earned')}
                className={fieldInputClassName}
              />
              {errors.gross_earned ? (
                <p className={fieldErrorClassName}>{errors.gross_earned.message}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="deductions">Deductions</Label>
              <Input
                id="deductions"
                type="number"
                step="0.01"
                {...register('deductions')}
                className={fieldInputClassName}
              />
              {errors.deductions ? (
                <p className={fieldErrorClassName}>{errors.deductions.message}</p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="net_received">Net Received</Label>
              <Input
                id="net_received"
                type="number"
                step="0.01"
                {...register('net_received')}
                readOnly
                className="h-11 rounded-xl border border-brand-muted/45 bg-brand-muted/20 text-base font-semibold shadow-inner"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-brand-muted/35 bg-brand-light/70 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">Proof Upload</p>
            <span className="rounded-full border border-brand-muted/45 bg-brand-light px-2.5 py-1 text-xs font-medium text-brand-muted">
              Required
            </span>
          </div>

          <div className="rounded-xl border border-dashed border-brand-muted/55 bg-brand-light/70 p-4">
            <Label htmlFor="screenshot_file">Shift Screenshot</Label>
            <input
              id="screenshot_file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="mt-1 block w-full rounded-xl border border-brand-primary/35 bg-brand-light px-3 py-2 text-sm text-brand-darkest shadow-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-light hover:file:opacity-90"
              onChange={(event) => onSelectScreenshotFile(event.target.files?.[0] || null)}
            />
            <p className="mt-2 text-xs text-brand-muted">
              Allowed: JPG, PNG, WEBP up to {maxScreenshotMb} MB. Screenshot will auto-upload when you save shift.
            </p>
          </div>

          <p className="text-sm font-medium text-brand-muted">
            {uploadScreenshotPending
              ? 'Uploading screenshot...'
              : uploadedScreenshot?.secure_url
                ? 'Screenshot uploaded and ready.'
                : screenshotFile
                  ? 'Screenshot selected. It will upload automatically on save.'
                  : 'Select a screenshot before saving shift.'}
          </p>

          {screenshotPreviewUrl ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-brand-muted">Selected Preview</p>
              <img
                src={screenshotPreviewUrl}
                alt="Selected shift screenshot preview"
                className="h-44 w-full rounded-xl border border-brand-muted/45 bg-brand-light object-contain"
                loading="lazy"
              />
            </div>
          ) : null}

          {watchedScreenshotUrl ? (
            <a
              href={watchedScreenshotUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg border border-brand-primary/35 bg-brand-primary/10 px-2.5 py-1 text-xs font-semibold text-brand-primary transition-all hover:bg-brand-primary/20"
            >
              Open uploaded screenshot
            </a>
          ) : null}

          <input type="hidden" {...register('screenshot_url')} />
          {errors.screenshot_url ? (
            <p className={fieldErrorClassName}>{errors.screenshot_url.message}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <Button
            type="submit"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light shadow-[0_10px_20px_rgba(18,78,102,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 disabled:translate-y-0 disabled:opacity-60"
            disabled={shiftSaveInProgress}
          >
            {shiftSaveInProgress ? 'Uploading + Saving...' : 'Save Shift'}
          </Button>

          <Button
            type="button"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-brand-darkest shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-light/80 disabled:translate-y-0 disabled:opacity-60"
            onClick={onAnalyzeCurrentShift}
            disabled={analyzePending}
          >
            {analyzePending ? 'Processing...' : 'Analyze Current Shift'}
          </Button>
        </div>
      </form>
    </WorkerSectionCard>
  )
}

export default ShiftFormCard
