import { Link } from 'react-router-dom'

import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <AuthPageShell
      title="Sign in"
      description="Use the email and password you registered with."
      footer={
        <p className="text-center text-sm text-brand-muted">
          Need an account?{' '}
          <Link to="/register" className="font-medium text-brand-primary hover:underline">
            Register
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthPageShell>
  )
}
