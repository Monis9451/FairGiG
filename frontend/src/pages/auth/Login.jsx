import { AuthSplitCard } from '@/components/auth/AuthSplitCard';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-darkest p-3 md:p-4">
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