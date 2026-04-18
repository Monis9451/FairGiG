import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import { CommunityFeedPanel } from '@/components/community/CommunityFeedPanel'
import { CommunityMinePanel } from '@/components/community/CommunityMinePanel'
import { CommunityModerationPanel } from '@/components/community/CommunityModerationPanel'
import { cn } from '@/lib/utils'

export default function CommunityPage() {
  const role = useAuthStore((s) => s.profile?.role)
  const [searchParams, setSearchParams] = useSearchParams()

  const tabs = useMemo(() => {
    if (role === 'worker') {
      return [
        { id: 'feed', label: 'Feed' },
        { id: 'mine', label: 'My posts' },
      ]
    }
    if (role === 'advocate' || role === 'analyst') {
      return [
        { id: 'feed', label: 'Feed' },
        { id: 'moderate', label: 'Moderate' },
      ]
    }
    return [{ id: 'feed', label: 'Feed' }]
  }, [role])

  const tabParam = searchParams.get('tab') || ''
  const activeTab = tabs.some((tabOption) => tabOption.id === tabParam)
    ? tabParam
    : tabs[0]?.id || 'feed'

  const setActiveTab = (nextTab) => {
    const nextParams = new URLSearchParams(searchParams)
    if (nextTab === 'feed') {
      nextParams.delete('tab')
    } else {
      nextParams.set('tab', nextTab)
    }

    setSearchParams(nextParams, { replace: true })
  }

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
                aria-selected={activeTab === t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'min-h-[48px] flex-1 touch-manipulation rounded-xl px-2 text-center text-sm font-bold transition-all active:scale-[0.98] sm:min-h-[44px] sm:rounded-full sm:px-3 sm:text-[0.9375rem]',
                  activeTab === t.id
                    ? 'bg-brand-primary text-brand-light shadow-md shadow-brand-primary/25'
                    : 'text-brand-muted hover:bg-brand-light/60 hover:text-brand-darkest'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : null}

        {activeTab === 'feed' ? <CommunityFeedPanel role={role} /> : null}
        {activeTab === 'mine' && role === 'worker' ? <CommunityMinePanel /> : null}
        {activeTab === 'moderate' && (role === 'advocate' || role === 'analyst') ? (
          <CommunityModerationPanel />
        ) : null}
      </main>
    </div>
  )
}
