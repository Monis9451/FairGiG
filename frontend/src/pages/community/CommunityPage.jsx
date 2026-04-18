import { useMemo, useState } from 'react'
import useAuthStore from '@/store/authStore'
import { CommunityFeedPanel } from '@/components/community/CommunityFeedPanel'
import { CommunityMinePanel } from '@/components/community/CommunityMinePanel'
import { CommunityModerationPanel } from '@/components/community/CommunityModerationPanel'
import { cn } from '@/lib/utils'

export default function CommunityPage() {
  const role = useAuthStore((s) => s.profile?.role)
  const [tab, setTab] = useState('feed')

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
    <div className="min-h-full bg-gradient-to-b from-brand-light via-brand-light to-white pb-[max(1rem,env(safe-area-inset-bottom))]">
      <main className="mx-auto w-full max-w-3xl px-3 py-4 sm:px-5 sm:py-6 md:px-6 md:py-8">
        <header className="mb-4 sm:mb-6">
          <h1 className="text-xl font-extrabold tracking-tight text-brand-darkest sm:text-2xl">Community</h1>
          <p className="mt-1 text-sm text-brand-muted">Anonymous bulletin among peers</p>
        </header>
        {showTabBar ? (
          <div
            className="mb-4 flex gap-1 rounded-2xl border border-brand-muted/80 bg-white/90 p-1 shadow-sm shadow-brand-darkest/5 backdrop-blur-sm sm:mb-6 sm:rounded-full sm:p-1"
            role="tablist"
            aria-label="Community sections"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'min-h-[48px] flex-1 touch-manipulation rounded-xl px-2 text-center text-sm font-bold transition-all active:scale-[0.98] sm:min-h-[44px] sm:rounded-full sm:px-3 sm:text-[0.9375rem]',
                  tab === t.id
                    ? 'bg-brand-primary text-brand-light shadow-md shadow-brand-primary/25'
                    : 'text-brand-muted hover:bg-brand-light/60 hover:text-brand-darkest'
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
