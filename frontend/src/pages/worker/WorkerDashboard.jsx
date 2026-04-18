import { Outlet } from 'react-router-dom'

const WorkerDashboard = () => {
  return (
    <div className="min-h-screen bg-brand-light text-brand-darkest antialiased">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_-2%,rgba(18,78,102,0.2),transparent_30%),radial-gradient(circle_at_86%_10%,rgba(46,57,68,0.16),transparent_32%),linear-gradient(180deg,rgba(211,217,212,0.98),rgba(211,217,212,1))]" />
        <div className="absolute inset-0 opacity-[0.24] [background-image:linear-gradient(rgba(46,57,68,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(46,57,68,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.45),transparent_45%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1600px] px-3 py-5 sm:px-4 lg:px-6">
        <Outlet />
      </div>
    </div>
  )
}

export default WorkerDashboard
