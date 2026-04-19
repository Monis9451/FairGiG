import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSignIn } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
})

export function LoginForm() {
  const signIn = useSignIn()
  const { error: showErrorToast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = (data) => {
    signIn.mutate({
      email: data.email,
      password: data.password,
    })
  }

  const onInvalid = () => {
    showErrorToast('Check the fields below and try again.')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex flex-col gap-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          {...register('email')}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={errors.email ? 'true' : 'false'}
        />
        {errors.email ? (
          <p className="text-xs font-medium text-red-600" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          {...register('password')}
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={errors.password ? 'true' : 'false'}
        />
        {errors.password ? (
          <p className="text-xs font-medium text-red-600" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={signIn.isPending}
        className="mt-1 h-12 w-full rounded-lg bg-brand-darkest text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {signIn.isPending ? 'Signing in…' : 'Sign in'}
      </Button>

      {signIn.isError ? (
        <p className="text-sm text-red-700" role="alert">
          {signIn.error?.response?.data?.error || 'Could not sign in. Check your email and password.'}
        </p>
      ) : null}
    </form>
  )
}
