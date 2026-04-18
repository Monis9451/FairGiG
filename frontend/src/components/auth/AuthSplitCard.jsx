import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

function AppLogoMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-brand-light shadow-lg shadow-brand-primary/30">
      <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M16 8L22 12V20L16 24L10 20V12L16 8Z" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function AuthSplitCard({
  formTitle,
  ctaTitle,
  ctaSubtitle,
  ctaButtonLabel,
  ctaButtonHref,
  mobileSwitchText,
  mobileSwitchLabel,
  mobileSwitchHref,
  ctaPosition = 'right',
  children,
}) {
  const ctaVariants = {
    hidden: { opacity: 0, x: ctaPosition === 'right' ? 24 : -24 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { delay: 0.22, duration: 0.45, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-brand-muted bg-brand-light shadow-2xl shadow-brand-darkest/50 md:max-h-[calc(100vh-2rem)] md:flex-row"
    >
      <div className={cn(
        'flex w-full flex-col bg-white px-5 py-5 sm:px-6 sm:py-6 md:w-[55%] md:px-8 md:py-8 lg:px-10 lg:py-9',
        ctaPosition === 'left' ? 'order-last' : 'order-first'
      )}>
        <div className="mb-5 flex flex-col items-center gap-2">
          <AppLogoMark />
          <h1 className="text-center text-2xl font-extrabold tracking-tight text-brand-darkest lg:text-[2rem]">{formTitle}</h1>
        </div>
        {children}

        <div className="mt-4 flex items-center justify-center gap-2 text-sm md:hidden">
          {mobileSwitchText ? <span className="text-brand-muted">{mobileSwitchText}</span> : null}
          {mobileSwitchHref && mobileSwitchLabel ? (
            <Link to={mobileSwitchHref} className="font-semibold text-brand-primary underline-offset-4 hover:underline">
              {mobileSwitchLabel}
            </Link>
          ) : null}
        </div>
      </div>

      <motion.div
        variants={ctaVariants}
        className={cn(
          'relative hidden overflow-hidden md:flex md:w-[45%] md:flex-col md:items-center md:justify-center md:p-8 lg:p-10 text-center text-brand-light',
          'bg-gradient-to-br from-brand-primary via-brand-dark to-brand-darkest',
          ctaPosition === 'left' ? 'order-first' : 'order-last'
        )}
      >
        <div className="relative z-10">
          <h2 className="mb-3 text-2xl font-extrabold lg:text-3xl">{ctaTitle}</h2>
          <p className="mb-6 text-brand-light/85 lg:mb-8">{ctaSubtitle}</p>
          <Link
            to={ctaButtonHref}
            className="inline-flex h-11 items-center justify-center rounded-full border-2 border-brand-light px-10 text-sm font-bold uppercase tracking-wider text-brand-light transition-all hover:bg-brand-light hover:text-brand-darkest"
          >
            {ctaButtonLabel}
          </Link>
        </div>
        {/* Animated Background Blobs */}
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-brand-light/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-brand-muted/20 blur-2xl animate-bounce" />
      </motion.div>
    </motion.div>
  );
}