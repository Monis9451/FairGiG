import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Bike,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
}

function LogoMark({ className }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl bg-brand-primary text-brand-light shadow-lg shadow-brand-primary/35',
        className ?? 'h-10 w-10'
      )}
    >
      <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5" aria-hidden="true">
        <path
          d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M16 8L22 12V20L16 24L10 20V12L16 8Z"
          fill="currentColor"
          fillOpacity="0.35"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

const features = [
  {
    icon: ShieldCheck,
    title: 'Verified earnings',
    text: 'Shift logs and proof go through a clear review path so your record is trustworthy.',
  },
  {
    icon: BarChart3,
    title: 'Pay vs your city',
    text: 'See how your hourly pay compares to other riders where you work — in plain language.',
  },
  {
    icon: FileCheck2,
    title: 'Income letter',
    text: 'Generate a clean statement from verified shifts when you need it for rent, loans, or records.',
  },
  {
    icon: Users,
    title: 'Community & support',
    text: 'Connect with other riders and raise issues when something does not look right.',
  },
]

const companyLogos = [
  { src: '/companies/careem-logo-vector.png', alt: 'Careem' },
  { src: '/companies/download.png', alt: 'Company logo' },
  { src: '/companies/fiverr-new3326.jpg', alt: 'Fiverr' },
  { src: '/companies/freelancer.jpg', alt: 'Freelancer' },
  { src: '/companies/images (1).png', alt: 'Partner company' },
  { src: '/companies/images (2).png', alt: 'Partner company' },
  { src: '/companies/images (3).png', alt: 'Partner company' },
  { src: '/companies/images.jpg', alt: 'Partner company' },
  { src: '/companies/images.png', alt: 'Partner company' },
  { src: '/companies/Leopards-Logo.png', alt: 'Leopards' },
  { src: '/companies/pandamart.png', alt: 'Pandamart' },
  { src: '/companies/TCS_Pakistan_logo_(2024).png', alt: 'TCS Pakistan' },
  { src: '/companies/Yango.png', alt: 'Yango' },
]

const sliderLogos = [...companyLogos, ...companyLogos]

const LandingPage = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-brand-light text-brand-darkest">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-darkest/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="flex min-h-[44px] items-center gap-2.5 touch-manipulation"
            aria-label="FairGig home"
          >
            <LogoMark className="h-9 w-9 sm:h-10 sm:w-10" />
            <span className="text-lg font-bold tracking-tight text-white">FairGig</span>
          </Link>
          <nav className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-4 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white touch-manipulation"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-brand-primary px-4 py-2.5 text-sm font-bold text-brand-light shadow-md shadow-brand-primary/30 transition-transform active:scale-[0.98] touch-manipulation sm:px-5"
            >
              Sign up
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative bg-gradient-to-b from-brand-darkest via-[#1a2229] to-brand-darkest px-4 pb-16 pt-12 text-white sm:px-6 sm:pb-24 sm:pt-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(18,78,102,0.45),transparent)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[min(100%,42rem)] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl"
          />

          <div className="relative mx-auto max-w-3xl text-center">
            <motion.p
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-200/90"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Fair pay for gig work
            </motion.p>
            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-5 text-[1.75rem] font-black leading-[1.15] tracking-tight sm:text-4xl sm:leading-tight md:text-[2.75rem]"
            >
              Track, verify, and stand behind your real earnings.
            </motion.h1>
            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg"
            >
              Built for riders and delivery partners: one place to log shifts, see how you compare in your city, and
              get paperwork you can trust.
            </motion.p>
            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-8 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white/85"
            >
              Built for real-world shift work: quick logs, trusted verification, and clean records when they matter.
            </motion.div>
            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/55 sm:text-sm"
            >
              <span className="inline-flex items-center gap-1.5">
                <Bike className="h-4 w-4 text-emerald-300" aria-hidden />
                Ride-hailing & delivery
              </span>
              <span className="hidden h-4 w-px bg-white/20 sm:block" aria-hidden />
              <span>Verified records · City benchmarks · Rider-first</span>
            </motion.div>
          </div>
        </section>

        <section className="relative border-b border-brand-darkest/8 bg-[#040a16] py-10 sm:py-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_0%,rgba(56,189,248,0.12),transparent_60%)]"
          />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-white/60">
              Companies Workers Already Serve
            </p>

            <div className="relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#02060f]/85 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#02060f] to-transparent sm:w-24"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#02060f] to-transparent sm:w-24"
              />

              <motion.div
                className="flex w-max items-center gap-4 py-5 pl-4 pr-4 sm:gap-6 sm:py-6 sm:pl-6 sm:pr-6"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 34, ease: 'linear', repeat: Infinity }}
              >
                {sliderLogos.map((logo, index) => (
                  <div
                    key={`${logo.src}-${index}`}
                    className="flex h-16 min-w-[150px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 sm:min-w-[180px]"
                  >
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      className="max-h-8 w-auto object-contain opacity-90 sm:max-h-10"
                      loading="lazy"
                    />
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        <section className="border-b border-brand-darkest/8 bg-white px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-brand-muted">
              What you get
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-2xl font-bold text-brand-darkest sm:text-3xl">
              Everything in your pocket, tuned for small screens
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, text }, index) => (
                <li
                  key={title}
                  className="flex flex-col rounded-2xl border border-brand-darkest/10 bg-brand-light/40 p-5 transition-shadow hover:shadow-md"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/12 text-brand-primary">
                    <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-brand-darkest">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-muted">{text}</p>
                  <span className="sr-only">{`Feature ${index + 1} of ${features.length}`}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <h2 className="text-2xl font-bold text-brand-darkest sm:text-3xl">Why riders use FairGig</h2>
              <ul className="mt-6 space-y-4 text-sm leading-relaxed text-brand-dark sm:text-base">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" aria-hidden />
                  <span>
                    <strong className="text-brand-darkest">Clarity:</strong> one dashboard for shifts, status, and
                    earnings — no spreadsheet juggling.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" aria-hidden />
                  <span>
                    <strong className="text-brand-darkest">Confidence:</strong> verified logs back up what you earned
                    when you need to prove it.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" aria-hidden />
                  <span>
                    <strong className="text-brand-darkest">Context:</strong> see how your pay lines up with others in
                    your city, explained in simple terms.
                  </span>
                </li>
              </ul>
            </div>
            <div className="rounded-3xl border border-brand-darkest/10 bg-gradient-to-br from-brand-primary/10 via-white to-brand-light/80 p-6 shadow-sm sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">Ready when you are</p>
              <p className="mt-3 text-lg font-bold text-brand-darkest sm:text-xl">
                Large tap targets, readable type, and fast flows on your phone.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                We designed the rider home like the apps you already use — big actions, short paths, and no clutter.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-brand-primary px-4 py-14 text-brand-light sm:px-6 sm:py-16">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Join FairGig</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
              Create an account to log shifts, follow verification, and unlock city pay insights in minutes.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-brand-darkest/10 bg-brand-darkest px-4 py-10 text-center text-sm text-white/55 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <LogoMark className="h-8 w-8 opacity-90" />
            <span className="font-semibold text-white/90">FairGig</span>
          </div>
          <p className="text-xs text-white/45">Fair records for gig workers, built for speed and trust.</p>
        </div>
        <p className="mx-auto mt-6 max-w-md text-xs text-white/40">
          FairGig helps you organise and verify gig earnings. It does not replace official tax or legal advice.
        </p>
      </footer>
    </div>
  )
}

export default LandingPage
