import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import socialCertLogo from "../../assets/images/socialCert.svg"
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner"
import NavigateButton from "../../components/NavigateButton"
import VerifyCodeInput from "../../components/VerifyCodeInput/VerifyCodeInput"
import { getBackendUrl } from "../../utils/getBackendUrl"
import getConstants from "../../utils/getConstants"
import "./EmailVerification.scss"
import { sendVerificationEmail, acquireEmailCertificate } from "./utils/emailUtils"
import { toast } from "react-toastify"
import { WalletClient, AuthFetch, IdentityClient } from "@bsv/sdk"

const EmailVerification = () => {
  // Constructors ======================================================================
  const constants = getConstants()
  const navigate = useNavigate()

  // State =======================================================================

  const [email, setEmail] = useState<string>("")
  const [valid, setValid] = useState<boolean>(true)
  const [verificationCode, setVerificationCode] = useState<string>("")
  const [emailSentStatus, setEmailSentStatus] = useState<boolean>(false)
  const [sentEmail, setSentEmail] = useState<string>("")
  const [successStatus, setSuccessStatus] = useState<boolean>(false)
  const [verificationAttempts, setVerificationAttempts] = useState<number>(5)
  const [locked, setLocked] = useState<boolean>(false)
  const [verificationSubmitted, setVerificationSubmitted] = useState<boolean>(
    false
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isChecked, setIsChecked] = useState(true)

  // Effects ====================================================================

  useEffect(() => {
    if (locked) {
      setTimeout(() => {
        setLocked(false)
        setVerificationAttempts(5)
      }, 600000)
    }
  }, [locked])

  // Reset valid state if email input changes
  useEffect(() => {
    setValid(true)
  }, [email])

  // Handlers ====================================================================

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!validEmailRegex.test(email)) {
      setValid(false)
      toast.error("Please enter a valid email address")
      return
    }

    setIsSubmitting(true)

    const data = { email, funcAction: "sendEmail" }
    try {
      const responseData = await sendVerificationEmail(email)
      setEmailSentStatus(responseData.emailSentStatus)
      setSentEmail(responseData.sentEmail)
      if (responseData?.emailSentStatus) {
        toast.success(`Verification email sent to ${responseData.sentEmail || email}`)
        setHasSubmitted(true)
      } else {
        toast.error("Request succeeded, but the server did not confirm sending an email. Please try again.")
      }
    } catch (error) {
      toast.error('Unable to send verification email. Please try again.')
      setIsSubmitting(false)
      return
    }
    setIsSubmitting(false)
  }

  const handleVerificationSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    // Guard/early return for locked or no email sent status
    if (!emailSentStatus || locked) {
      toast.error(
        "No email sent status found, or has been locked from too many attempts."
      )
      return
    }

    setVerificationSubmitted(true)
    const data = {
      verifyEmail: sentEmail,
      verificationCode,
      funcAction: "verifyCode",
    }
    try {
      const clientWallet = new WalletClient("auto")
      let AF = await new AuthFetch(clientWallet)
      const response = await AF.fetch('https://backend.socialcert.net/handleEmailVerification', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()
      if (responseData.verificationStatus) {
        try {
          const newCertificate = await acquireEmailCertificate(responseData.certType, data.verifyEmail)
          if (isChecked) {
            const publicationResult = await new IdentityClient(clientWallet).publiclyRevealAttributes(
              newCertificate,
              ['email'],
            )
          }
        } catch (certError) {
          toast.warn('Code verified, but certificate issuance/publication failed. You can retry later.')
        }
        toast.success("Code verified")
        navigate("/EmailVerification/VerifyResult/success")
      } else {
        if (verificationAttempts === 1) {
          setLocked(true)
          toast.error("Too many attempts. Locked for 10 minutes.")
        }
        const nextAttempts = verificationAttempts - 1
        setVerificationAttempts(nextAttempts)
        if (nextAttempts >= 0) {
          toast.error(`Invalid code. Attempts left: ${nextAttempts}`)
        }
      }

      setSuccessStatus(true)
      if (!successStatus) {
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.')
      setSuccessStatus(false)
      navigate("/EmailVerification/VerifyResult/error")
    }
  }

  return (
    <div className="container">
      <img
        src={socialCertLogo}
        alt="Social Certification Logo"
        className="main-logo"
      />
      <p className="sub-header-text">
        Certify your identity using your email address
      </p>

      {!hasSubmitted && (
        <>
          <div style={{ textAlign: "center", maxWidth: "25rem" }}>
            <p>We'll send you an email to verify.</p>
          </div>
          <form onSubmit={handleEmailSubmit}>
            <div className="flex-wrap">
              <input
                type="email"
                name="emailField"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="email-input"
                placeholder="janedoe@email.com"
                autoComplete="email"
                inputMode="email"
                enterKeyHint="send"
                required
              />
              <button
                type="submit"
                className="fancy-button"
                disabled={isSubmitting || !email}
              >
                {isSubmitting ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 12H19M19 12L13 6M19 12L13 18"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Send code
                  </>
                )}
              </button>
            </div>
          </form>
          {!valid && (
            <b style={{ color: "tomato" }}>A valid email is required</b>
          )}
          <div className="checkbox-container" style={{ paddingTop: "0.5rem" }}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => setIsChecked(!isChecked)}
            />
            <label>Publicly reveal attributes of issued certificates</label>
          </div>
        </>
      )}

      {/* Text + spinner when the user has submitted their email */}
      {isSubmitting && (
        <>
          <div className="flex" style={{ alignItems: "center" }}>
            <p>Checking verification status...</p>
            <LoadingSpinner />
          </div>
        </>
      )}

      {/* Enter verification page. TODO: This should be its own component-- see src/pages/PhoneVerification/EnterPhoneCode.tsx */}
      {hasSubmitted && (
        <>
          <form onSubmit={handleVerificationSubmit}>
            <div style={{ display: "block", margin: "auto" }}>
              <p>
                Please enter the 6 digit code sent to <b>{email}</b>
              </p>
              <VerifyCodeInput
                onChange={setVerificationCode}
                handleSubmit={handleVerificationSubmit}
              />
            </div>
          </form>
          {verificationSubmitted && locked && (
            <p>You must wait 10 minutes before trying again.</p>
          )}
          {verificationSubmitted && !locked && (
            <p>Remaining attempts until lock out: {verificationAttempts}</p>
          )}

          {verificationSubmitted && (
            <>
              <div className="flex" style={{ alignItems: "center" }}>
                <p>Checking verification code...</p>
                <LoadingSpinner />
              </div>
            </>
          )}

          {verificationSubmitted && (
            <>
              <p style={{ textAlign: "center" }}>
                Haven't received an email in 1-2 mins? <br />
                Make sure your email is correct above, then <br />
                <a
                  className="request-new-code-link"
                  onClick={async () => {
                    try {
                      await sendVerificationEmail(sentEmail)
                      toast.success("A new code has been sent to your email.")
                    } catch (e) {
                      toast.error(
                        `There was an error resending a code to your email: ${e}`
                      )
                    }
                  }}
                >
                  request a new code
                </a>
              </p>
            </>
          )}
        </>
      )}
      {/* <p style={{ margin: "0" }}>Wrong email?</p> */}
      <NavigateButton
        navigatePath="/"
        label="Go back"
        style={{ marginTop: "4rem" }}
      />
    </div>
  )
}

export default EmailVerification
