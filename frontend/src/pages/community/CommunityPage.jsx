import { useMemo, useState } from 'react'
import useAuthStore from '@/store/authStore'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { CommunityFeedPanel } from '@/components/community/CommunityFeedPanel'
import { CommunityMinePanel } from '@/components/community/CommunityMinePanel'
import { CommunityModerationPanel } from '@/components/community/CommunityModerationPanel'
import { cn } from '@/lib/utils'

export default function CommunityPage() {
  const role = useAuthStore((s) => s.profile?.role)
  const [tab, setTab] = useState('feed')

  const backHref = role === 'analyst' ? '/analyst' : `/${role}`

  const tabs = useMemo(() => {
    if (role === 'worker') {
      return [
        { id: 'feed', label: 'Feed' },
        { id: 'mine', label: 'My posts' },
      ]
    }
    if (role === 'advocate') {
      return [
        { id: 'feed', label: 'Feed' },
        { id: 'moderate', label: 'Moderate' },
      ]
    }
    return [{ id: 'feed', label: 'Feed' }]
  }, [role])

  const showTabBar = tabs.length > 1

  return (
    <div className="min-h-screen bg-brand-light">
      <DashboardHeader
        title="Community"
        subtitle="Anonymous bulletin among peers"
        backHref={backHref}
        backLabel="Dashboard"
      />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {showTabBar ? (
          <div className="mb-6 flex gap-1 rounded-full border border-brand-muted bg-white p-1 shadow-sm">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex-1 rounded-full py-2.5 text-center text-sm font-bold transition-colors',
                  tab === t.id
                    ? 'bg-brand-primary text-brand-light shadow-md'
                    : 'text-brand-muted hover:text-brand-darkest'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : null}

        {tab === 'feed' ? <CommunityFeedPanel role={role} /> : null}
        {tab === 'mine' && role === 'worker' ? <CommunityMinePanel /> : null}
        {tab === 'moderate' && role === 'advocate' ? <CommunityModerationPanel /> : null}
      </main>
    </div>
  )
}
