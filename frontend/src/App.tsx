import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Home from '@/pages/Home'
import EmailVerification from '@/pages/EmailVerification'
import PhoneVerification from '@/pages/PhoneVerification'
import XVerification from '@/pages/XVerification'
import XCallback from '@/pages/XCallback'
import Certificates from '@/pages/Certificates'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors closeButton />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/verify/email" element={<EmailVerification />} />
        <Route path="/verify/phone" element={<PhoneVerification />} />
        <Route path="/verify/x" element={<XVerification />} />
        <Route path="/verify/x/callback" element={<XCallback />} />
        <Route path="/certificates" element={<Certificates />} />
      </Routes>
    </BrowserRouter>
  )
}
