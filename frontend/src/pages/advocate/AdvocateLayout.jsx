import { Outlet } from 'react-router-dom'

const AdvocateLayout = () => {
  return (
    <div className="min-h-screen bg-brand-light text-brand-darkest">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(18,78,102,0.18),transparent_34%),radial-gradient(circle_at_84%_14%,rgba(46,57,68,0.16),transparent_36%),linear-gradient(180deg,rgba(211,217,212,0.96),rgba(211,217,212,1))]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(46,57,68,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(46,57,68,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-4 lg:px-6">
        <Outlet />
      </div>
    </div>
  )
}

export default AdvocateLayout
