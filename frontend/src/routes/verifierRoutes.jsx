import { Route } from 'react-router-dom'

import VerifierDashboard from '@/pages/verifier/VerifierDashboard'
import VerifierGrievancesPage from '@/pages/verifier/VerifierGrievancesPage'
import VerifierOverviewPage from '@/pages/verifier/VerifierOverviewPage'
import VerifierQueuePage from '@/pages/verifier/VerifierQueuePage'
import VerifierVulnerabilityPage from '@/pages/verifier/VerifierVulnerabilityPage'

export const renderVerifierRoutes = () => {
  return (
    <Route path="/verifier" element={<VerifierDashboard />}>
      <Route index element={<VerifierOverviewPage />} />
      <Route path="queue" element={<VerifierQueuePage />} />
      <Route path="vulnerability" element={<VerifierVulnerabilityPage />} />
      <Route path="grievances" element={<VerifierGrievancesPage />} />
    </Route>
  )
}
