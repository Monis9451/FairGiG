import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSignUp } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Enter your name'),
    cityZone: z.string().min(2, 'Enter your city or zone'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'At least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export function RegisterForm() {
  const signUp = useSignUp()
  const { error: showErrorToast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      cityZone: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = (data) => {
    signUp.mutate({
      email: data.email,
      password: data.password,
      full_name: data.fullName,
      city_zone: data.cityZone,
    })
  }

  const onInvalid = () => {
    showErrorToast('Check the fields below and try again.')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-1">
          <Label htmlFor="reg-name">Full name</Label>
          <Input id="reg-name" {...register('fullName')} autoComplete="name" placeholder="Your name" />
          {errors.fullName ? (
            <p className="text-xs font-medium text-red-600" role="alert">
              {errors.fullName.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5 sm:col-span-1">
          <Label htmlFor="reg-city">City / zone</Label>
          <Input id="reg-city" {...register('cityZone')} autoComplete="address-level2" placeholder="e.g. Karachi" />
          {errors.cityZone ? (
            <p className="text-xs font-medium text-red-600" role="alert">
              {errors.cityZone.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-email">Email</Label>
        <Input id="reg-email" {...register('email')} type="email" autoComplete="email" placeholder="you@example.com" />
        {errors.email ? (
          <p className="text-xs font-medium text-red-600" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="reg-password">Password</Label>
          <Input
            id="reg-password"
            type="password"
            {...register('password')}
            autoComplete="new-password"
            placeholder="At least 6 characters"
          />
          {errors.password ? (
            <p className="text-xs font-medium text-red-600" role="alert">
              {errors.password.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-confirm">Confirm password</Label>
          <Input
            id="reg-confirm"
            type="password"
            {...register('confirmPassword')}
            autoComplete="new-password"
            placeholder="Repeat password"
          />
          {errors.confirmPassword ? (
            <p className="text-xs font-medium text-red-600" role="alert">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>
      </div>

      <Button
        type="submit"
        disabled={signUp.isPending}
        className="mt-1 h-12 w-full rounded-lg bg-brand-darkest text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {signUp.isPending ? 'Creating account…' : 'Create account'}
      </Button>

      {signUp.isError ? (
        <p className="text-sm text-red-700" role="alert">
          {signUp.error?.response?.data?.error || 'Could not create account. Try again.'}
        </p>
      ) : null}
    </form>
  )
}
