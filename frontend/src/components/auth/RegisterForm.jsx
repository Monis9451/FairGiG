import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fieldVariant, fieldContainerVariant } from './AuthSplitCard';
import { useSignUp } from '@/hooks/useAuth';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  cityZone: z.string().min(2, 'City zone is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string().min(6, 'Min 6 characters'),
}).refine((values) => values.password === values.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export function RegisterForm() {
  const signUp = useSignUp();

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
  });

  const onSubmit = (data) => {
    signUp.mutate({
      email: data.email,
      password: data.password,
      full_name: data.fullName,
      city_zone: data.cityZone,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
      <motion.div variants={fieldContainerVariant} initial="hidden" animate="visible" className="flex flex-col gap-2.5">
        <motion.div variants={fieldVariant} className="grid gap-2.5 md:grid-cols-2 md:gap-3">
          <div>
            <Label>Full Name</Label>
            <Input {...register('fullName')} autoComplete="off" placeholder="Enter your full name" className="h-9" />
            {errors.fullName && <span className="mt-1 block text-xs text-brand-muted">{errors.fullName.message}</span>}
          </div>

          <div>
            <Label>City Zone</Label>
            <Input {...register('cityZone')} autoComplete="off" placeholder="Enter your city zone" className="h-9" />
            {errors.cityZone && <span className="mt-1 block text-xs text-brand-muted">{errors.cityZone.message}</span>}
          </div>
        </motion.div>

        <motion.div variants={fieldVariant}>
          <Label>E-mail</Label>
          <Input {...register('email')} type="email" autoComplete="off" placeholder="you@example.com" className="h-9" />
          {errors.email && <span className="mt-1 block text-xs text-brand-muted">{errors.email.message}</span>}
        </motion.div>

        <motion.div variants={fieldVariant} className="grid gap-2.5 md:grid-cols-2 md:gap-3">
          <div>
            <Label>Password</Label>
            <Input type="password" {...register('password')} autoComplete="new-password" placeholder="Create a password" className="h-9" />
            {errors.password && <span className="mt-1 block text-xs text-brand-muted">{errors.password.message}</span>}
          </div>

          <div>
            <Label>Confirm Password</Label>
            <Input type="password" {...register('confirmPassword')} autoComplete="new-password" placeholder="Confirm your password" className="h-9" />
            {errors.confirmPassword && <span className="mt-1 block text-xs text-brand-muted">{errors.confirmPassword.message}</span>}
          </div>
        </motion.div>

        <motion.div variants={fieldVariant} className="mt-0.5">
          <Button type="submit" disabled={signUp.isPending} className="h-10 w-full rounded-full border-2 border-brand-primary bg-brand-primary text-sm font-bold uppercase tracking-widest text-brand-light transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70">
            Create Account
          </Button>
        </motion.div>

        {signUp.isError && (
          <p className="text-sm text-brand-muted">
            {signUp.error?.response?.data?.error || 'Unable to create account. Please try again.'}
          </p>
        )}
      </motion.div>
    </form>
  );
}
