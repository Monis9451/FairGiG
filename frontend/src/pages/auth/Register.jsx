import { Link } from 'react-router-dom'

import { AuthSplitCard } from '@/components/auth/AuthSplitCard'
import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-brand-darkest p-3 md:p-4">
      <Link
        to="/"
        className="absolute left-4 top-4 z-10 inline-flex min-h-[44px] items-center text-sm font-semibold text-white/70 transition-colors hover:text-white md:left-6 md:top-5"
      >
        ← Home
      </Link>
      <AuthSplitCard
        formTitle="Create Account"
        ctaTitle="Welcome Back!"
        ctaSubtitle="Already have a FairGig account? Sign in to manage your income profiles."
        ctaButtonLabel="Sign In"
        ctaButtonHref="/login"
        mobileSwitchText="Already have an account?"
        mobileSwitchLabel="Sign In"
        mobileSwitchHref="/login"
        ctaPosition="left"
      >
        <RegisterForm />
      </AuthSplitCard>
    </div>
  );
}