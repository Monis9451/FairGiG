import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { StaffMonitoringHub } from '@/components/staff/StaffMonitoringHub'
import WorkerPageHeader from '@/components/worker/WorkerPageHeader'
import useAuthStore from '@/store/authStore'

/**
 * Full-page staff analytics: commission trends, zone volatility, income distribution,
 * vulnerability (MoM drop), grievance clusters & category window — backed by /api/analytics/*.
 */
const AdvocateMonitoringPage = () => {
  const role = useAuthStore((s) => s.profile?.role)
  const basePath = role === 'analyst' ? '/analyst' : '/advocate'
  const roleLabel = role === 'analyst' ? 'Analyst' : 'Advocate'

  return (
    <div className="space-y-6">
      <Link
        to={basePath}
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to dashboard
      </Link>

      <WorkerPageHeader
        badge={`${roleLabel} · Monitoring`}
        title="Aggregate trends & risk signals"
        description={
          role === 'analyst'
            ? 'Read-only view of verified earnings aggregates, grievance patterns, and income-drop flags. Use with Community and Grievances for full context.'
            : 'Commission share over time, income volatility by city zone, deactivation-style complaint clusters, rolling category counts, and workers with sharp month-on-month income drops — aligned with the advocate analytics panel spec.'
        }
      />

      <StaffMonitoringHub />
    </div>
  )
}

export default AdvocateMonitoringPage
