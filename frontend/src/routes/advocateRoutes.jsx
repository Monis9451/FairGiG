import { Route } from 'react-router-dom'

import AdvocateBenchmarksPage from '@/pages/advocate/AdvocateBenchmarksPage'
import AdvocateCertificatesPage from '@/pages/advocate/AdvocateCertificatesPage'
import AdvocateGrievancesPage from '@/pages/advocate/AdvocateGrievancesPage'
import AdvocateLayout from '@/pages/advocate/AdvocateLayout'
import AdvocateOverviewPage from '@/pages/advocate/AdvocateOverviewPage'

export const renderAdvocateRoutes = (basePath = '/advocate') => {
  return (
    <Route path={basePath} element={<AdvocateLayout />}>
      <Route index element={<AdvocateOverviewPage />} />
      <Route path="grievances" element={<AdvocateGrievancesPage />} />
      <Route path="benchmarks" element={<AdvocateBenchmarksPage />} />
      <Route path="certificates" element={<AdvocateCertificatesPage />} />
    </Route>
  )
}
