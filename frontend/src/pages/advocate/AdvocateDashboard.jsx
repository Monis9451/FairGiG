import useAuthStore from '@/store/authStore'
import { StaffMonitoringHub } from '@/components/staff/StaffMonitoringHub'

const AdvocateDashboard = () => {
  const role = useAuthStore((s) => s.profile?.role)
  const title = role === 'analyst' ? 'Analyst dashboard' : 'Advocate dashboard'

  return (
    <div className="min-h-full bg-brand-light p-4 sm:p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-brand-darkest sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-muted sm:text-base">
        Monitoring below uses verified earnings and grievances. Use the sidebar for{' '}
        <strong className="text-brand-dark">Community</strong> (feed and moderation).
      </p>
      <StaffMonitoringHub />
    </div>
  )
}

export default AdvocateDashboard
