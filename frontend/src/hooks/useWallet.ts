import { useState, useEffect } from 'react'
import { getWalletClient } from '@/lib/wallet'
import { useVerificationStore } from '@/stores/verification'

export function useWallet() {
  const [identityKey, setIdentityKey] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const { isWalletConnected, setWalletConnected } = useVerificationStore()

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const wallet = getWalletClient()
        const key = await wallet.getPublicKey({ identityKey: true })
        if (!cancelled) {
          setIdentityKey(key)
          setWalletConnected(true)
        }
      } catch {
        if (!cancelled) {
          setIdentityKey(null)
          setWalletConnected(false)
        }
      } finally {
        if (!cancelled) setIsChecking(false)
      }
    }

    check()
    return () => { cancelled = true }
  }, [setWalletConnected])

  return { identityKey, isWalletConnected, isChecking }
}
