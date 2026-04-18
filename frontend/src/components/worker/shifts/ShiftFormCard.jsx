import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import WorkerSectionCard from '@/components/worker/WorkerSectionCard'

const ShiftFormCard = ({
  register,
  errors,
  onSubmit,
  platformOptions,
  onSelectScreenshotFile,
  maxScreenshotMb,
  onUploadScreenshot,
  screenshotFile,
  uploadScreenshotPending,
  uploadedScreenshot,
  screenshotPreviewUrl,
  watchedScreenshotUrl,
  savePending,
  analyzePending,
  onAnalyzeCurrentShift,
}) => {
  return (
    <WorkerSectionCard
      title="Log a Shift"
      description="Submit one shift record. Net received is auto-calculated."
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="platform">Platform</Label>
            <select
              id="platform"
              {...register('platform')}
              className="h-10 w-full rounded-md border-2 border-brand-primary bg-brand-light px-3 text-sm text-brand-darkest focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              {platformOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.platform ? <p className="mt-1 text-xs text-brand-muted">{errors.platform.message}</p> : null}
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date ? <p className="mt-1 text-xs text-brand-muted">{errors.date.message}</p> : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="hours_worked">Hours Worked</Label>
            <Input id="hours_worked" type="number" step="0.1" {...register('hours_worked')} />
            {errors.hours_worked ? (
              <p className="mt-1 text-xs text-brand-muted">{errors.hours_worked.message}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="gross_earned">Gross Earned</Label>
            <Input id="gross_earned" type="number" step="0.01" {...register('gross_earned')} />
            {errors.gross_earned ? (
              <p className="mt-1 text-xs text-brand-muted">{errors.gross_earned.message}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="deductions">Deductions</Label>
            <Input id="deductions" type="number" step="0.01" {...register('deductions')} />
            {errors.deductions ? (
              <p className="mt-1 text-xs text-brand-muted">{errors.deductions.message}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="net_received">Net Received</Label>
            <Input id="net_received" type="number" step="0.01" {...register('net_received')} readOnly />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-brand-muted/50 bg-brand-light p-4">
          <div>
            <Label htmlFor="screenshot_file">Shift Screenshot (required)</Label>
            <Input
              id="screenshot_file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => onSelectScreenshotFile(event.target.files?.[0] || null)}
            />
            <p className="mt-1 text-xs text-brand-muted">
              Allowed: JPG, PNG, WEBP up to {maxScreenshotMb} MB.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              className="rounded-md border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
              onClick={onUploadScreenshot}
              disabled={!screenshotFile || uploadScreenshotPending}
            >
              {uploadScreenshotPending ? 'Uploading...' : 'Upload Screenshot'}
            </Button>

            <p className="text-sm text-brand-muted">
              {uploadedScreenshot?.secure_url
                ? 'Uploaded to Cloudinary.'
                : 'Upload screenshot before saving the shift.'}
            </p>
          </div>

          {screenshotPreviewUrl ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-brand-muted">Selected Preview</p>
              <img
                src={screenshotPreviewUrl}
                alt="Selected shift screenshot preview"
                className="h-40 w-full rounded-md border border-brand-muted/50 object-contain"
                loading="lazy"
              />
            </div>
          ) : null}

          {watchedScreenshotUrl ? (
            <a
              href={watchedScreenshotUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-xs font-semibold text-brand-primary underline-offset-2 hover:underline"
            >
              Open uploaded screenshot
            </a>
          ) : null}

          <input type="hidden" {...register('screenshot_url')} />
          {errors.screenshot_url ? (
            <p className="text-xs text-brand-muted">{errors.screenshot_url.message}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            className="rounded-md border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
            disabled={savePending || uploadScreenshotPending || !watchedScreenshotUrl}
          >
            {savePending ? 'Saving...' : 'Save Shift'}
          </Button>

          <Button
            type="button"
            className="rounded-md border border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-brand-darkest transition-opacity hover:opacity-90"
            onClick={onAnalyzeCurrentShift}
            disabled={analyzePending}
          >
            {analyzePending ? 'Analyzing...' : 'Analyze Current Shift'}
          </Button>
        </div>
      </form>
    </WorkerSectionCard>
  )
}

export default ShiftFormCard
