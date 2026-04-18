import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fieldVariant, fieldContainerVariant } from './motionVariants';
import { useSignIn } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
});

export function LoginForm() {
  const signIn = useSignIn();
  const { error: showErrorToast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data) => {
    signIn.mutate({
      email: data.email,
      password: data.password,
    });
  };

  const onInvalid = () => {
    showErrorToast('Please fix the highlighted sign-in fields.');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} autoComplete="off">
      <motion.div variants={fieldContainerVariant} initial="hidden" animate="visible" className="flex flex-col gap-4">
        <motion.div variants={fieldVariant}>
          <Label>E-mail</Label>
          <Input {...register('email')} type="email" autoComplete="off" placeholder="you@example.com" />
          {errors.email && <span className="text-xs text-brand-muted">{errors.email.message}</span>}
        </motion.div>

        <motion.div variants={fieldVariant}>
          <Label>Password</Label>
          <Input type="password" {...register('password')} autoComplete="new-password" placeholder="••••••••" />
          {errors.password && <span className="text-xs text-brand-muted">{errors.password.message}</span>}
        </motion.div>

        <motion.div variants={fieldVariant} className="mt-2">
          <Button type="submit" disabled={signIn.isPending} className="h-12 w-full rounded-full border-2 border-brand-primary bg-brand-primary text-sm font-bold uppercase tracking-widest text-brand-light transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70">
            Sign In
          </Button>
        </motion.div>

        {signIn.isError && (
          <p className="text-sm text-brand-muted">
            {signIn.error?.response?.data?.error || 'Unable to sign in. Please check your credentials.'}
          </p>
        )}
      </motion.div>
    </form>
  );
}