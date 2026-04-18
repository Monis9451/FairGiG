import { AuthSplitCard } from '@/components/auth/AuthSplitCard';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-brand-darkest p-3 md:p-4">
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