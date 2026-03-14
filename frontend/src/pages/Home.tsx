import { Shell } from '@/components/layout/Shell'
import { VerificationCard } from '@/components/VerificationCard'
import { Mail, Phone, ArrowRight } from 'lucide-react'
import { XLogo } from '@/components/icons/XLogo'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary tracking-tight mb-8">
            Choose how people<br />see you
          </h1>

          {/* Before / After visual */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8 max-w-2xl mx-auto">
            {/* Before */}
            <div className="flex-1 w-full rounded-xl border border-border bg-surface px-4 py-4">
              <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-2">Without Who I Am</p>
              <p className="font-mono text-xs text-text-secondary break-all leading-relaxed">
                02da1df0360bead34cb0e06ca3d18a9c7b9cf066c1b48b6ad867e485832438d703
              </p>
            </div>

            <ArrowRight className="h-5 w-5 text-primary shrink-0 hidden sm:block" />
            <span className="text-primary font-medium text-sm sm:hidden">becomes</span>

            {/* After */}
            <div className="flex-1 w-full rounded-xl border-2 border-primary bg-white px-4 py-4 shadow-sm">
              <p className="text-[10px] font-medium text-primary uppercase tracking-wider mb-2">With Who I Am</p>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl" role="img" aria-label="person raising hand">&#x1F64B;&#x1F3FC;&#x200D;&#x2642;&#xFE0F;</span>
                  <span className="text-lg font-semibold text-text-primary">deggen</span>
                </div>
                <p className="text-[11px] text-text-secondary">X account verified by Who I Am</p>
              </div>
            </div>
          </div>

          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Control how others see you across every app in the BSV ecosystem.
            Publish verified attributes — email, phone, or X handle — so people
            you interact with see a name, not a key.
          </p>
        </motion.div>

        {/* Verification cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto"
        >
          <VerificationCard
            icon={Mail}
            title="Email"
            description="Verify your email address with a one-time code"
            href="/verify/email"
            accentColor="bg-blue-50 text-blue-600"
          />
          <VerificationCard
            icon={Phone}
            title="Phone"
            description="Verify your phone number via SMS"
            href="/verify/phone"
            accentColor="bg-emerald-50 text-emerald-600"
          />
          <VerificationCard
            icon={XLogo}
            title="X"
            description="Connect your X account to your identity"
            href="/verify/x"
            accentColor="bg-zinc-100 text-zinc-800"
          />
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-20 text-center"
        >
          <h2 className="text-xl font-semibold text-text-primary mb-8">How it works</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold">1</span>
              Choose a verification method
            </div>
            <ArrowRight className="h-4 w-4 text-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold">2</span>
              Complete verification
            </div>
            <ArrowRight className="h-4 w-4 text-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold">3</span>
              Certificate is issued to your wallet
            </div>
          </div>
        </motion.div>
      </div>
    </Shell>
  )
}
