import { Link } from 'react-router-dom'

import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <AuthPageShell
      title="Create an account"
      description="City or zone is used for pay comparisons and certificates."
      footer={
        <p className="text-center text-sm text-brand-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-primary hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthPageShell>
  )
}
