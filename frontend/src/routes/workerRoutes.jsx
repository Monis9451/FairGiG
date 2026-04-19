import { Route } from 'react-router-dom'

import WorkerBenchmarkPage from '@/pages/worker/WorkerBenchmarkPage'
import WorkerCertificatePage from '@/pages/worker/WorkerCertificatePage'
import WorkerCommissionTrendsPage from '@/pages/worker/WorkerCommissionTrendsPage'
import WorkerDashboard from '@/pages/worker/WorkerDashboard'
import WorkerGrievancesPage from '@/pages/worker/WorkerGrievancesPage'
import WorkerOverviewPage from '@/pages/worker/WorkerOverviewPage'
import WorkerShiftsPage from '@/pages/worker/WorkerShiftsPage'

export const renderWorkerRoutes = () => {
  return (
    <Route path="/worker" element={<WorkerDashboard />}>
      <Route index element={<WorkerOverviewPage />} />
      <Route path="shifts" element={<WorkerShiftsPage />} />
      <Route path="grievances" element={<WorkerGrievancesPage />} />
      <Route path="certificate" element={<WorkerCertificatePage />} />
      <Route path="benchmark" element={<WorkerBenchmarkPage />} />
      <Route path="commission" element={<WorkerCommissionTrendsPage />} />
    </Route>
  )
}
