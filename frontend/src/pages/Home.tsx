import { Shell } from '@/components/layout/Shell'
import { VerificationCard } from '@/components/VerificationCard'
import { Mail, Phone, Twitter, Shield, ArrowRight } from 'lucide-react'
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
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-light px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Shield className="h-3.5 w-3.5" />
            Blockchain-verified identity
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary tracking-tight mb-4">
            Verify your identity<br />on the blockchain
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Link your email, phone number, or X account to your blockchain identity
            with cryptographic proof. Simple, private, and verifiable.
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
            icon={Twitter}
            title="X / Twitter"
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
