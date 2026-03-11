import { create } from 'zustand'

interface VerificationState {
  // Wallet connection
  isWalletConnected: boolean
  setWalletConnected: (connected: boolean) => void

  // General loading state
  isLoading: boolean
  setLoading: (loading: boolean) => void
  loadingMessage: string
  setLoadingMessage: (message: string) => void

  // Public reveal preference (persisted in localStorage)
  shouldRevealPublicly: boolean
  setShouldRevealPublicly: (reveal: boolean) => void
}

export const useVerificationStore = create<VerificationState>((set) => ({
  isWalletConnected: false,
  setWalletConnected: (connected) => set({ isWalletConnected: connected }),

  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  loadingMessage: 'Processing...',
  setLoadingMessage: (message) => set({ loadingMessage: message }),

  shouldRevealPublicly: localStorage.getItem('shouldRevealPublicly') !== 'false',
  setShouldRevealPublicly: (reveal) => {
    localStorage.setItem('shouldRevealPublicly', reveal.toString())
    set({ shouldRevealPublicly: reveal })
  },
}))
