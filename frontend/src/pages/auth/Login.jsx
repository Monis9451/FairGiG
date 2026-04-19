import { Link } from 'react-router-dom'

import { AuthSplitCard } from '@/components/auth/AuthSplitCard'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-brand-darkest p-3 md:p-4">
      <Link
        to="/"
        className="absolute left-4 top-4 z-10 inline-flex min-h-[44px] items-center text-sm font-semibold text-white/70 transition-colors hover:text-white md:left-6 md:top-5"
      >
        ← Home
      </Link>
      <AuthSplitCard
        formTitle="Sign In to FairGig"
        ctaTitle="Hello, Friend!"
        ctaSubtitle="Register with your personal details to track and verify your gig earnings."
        ctaButtonLabel="Sign Up"
        ctaButtonHref="/register"
        mobileSwitchText="New to FairGig?"
        mobileSwitchLabel="Sign Up"
        mobileSwitchHref="/register"
      >
        <LoginForm />
      </AuthSplitCard>
    </div>
  );
}