import { useState } from "react"
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input"
import "react-phone-number-input/style.css"

import { useNavigate } from "react-router-dom"
import socialCertLogo from "../../assets/images/socialCert.svg"

import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner"
import NavigateButton from "../../components/NavigateButton"
import { usePhoneStore } from "../../stores/stores"
import "./phoneVerification.scss"
import { sendVerificationText } from "./utils/phoneUtils"

const PhoneVerification = () => {
  // Constructors ===========================================================
  const navigate = useNavigate()

  // State ==================================================================

  // Form state
  const [valid, setValid] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Phone number response from backend, used in EnterPhoneCode
  const [
    textSentPhonenumber,
    setTextSentPhonenumber,
    textSentStatus,
    setTextSentStatus,
  ] = usePhoneStore((state: any) => [
    state.textSentPhonenumber,
    state.setTextSentPhonenumber,
    state.textSentStatus,
    state.setTextSentStatus,
  ])

  // Handlers ===================================================================

  const handlePhoneNumberSubmit = async (e: any) => {
    e.preventDefault()
    setIsSubmitting(true)
    if (valid) {
      try {
        const responseData = await sendVerificationText(phoneNumber)
        setTextSentPhonenumber(responseData.textSentPhonenumber)
        setTextSentStatus(responseData.textSentStatus)

        // navigate to enter phone code page
        navigate("EnterPhoneCode")
      } catch (error) {
        console.error(
          "Error in fetch call to phone verification occurred",
          error
        )
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handlePhoneInputChange = (value?: string) => {
    if (!value) return
    const regex = /[a-zA-Z]/
    if (!regex.test(value)) {
      setPhoneNumber(value)
      setValid(isValidPhoneNumber(value))
    }
  }

  return (
    <div className="container">
      <img src={socialCertLogo} className="main-logo" />

      <p className="sub-header-text">
        Certify your identity using your phone number
      </p>
      <div style={{ textAlign: "center", maxWidth: "25rem" }}>
        <p style={{ marginBottom: ".25rem" }}>
          Add your number for securtiy, login, and account-related purposes.{" "}
        </p>
        <p>We'll send you a text to verify.</p>
      </div>
      <form onSubmit={handlePhoneNumberSubmit}>
        <div className="flex phone-input-container">
          {/* Phone input component*/}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
            }}
          >
            <PhoneInput
              defaultCountry="US"
              placeholder="555-867-5309"
              value={phoneNumber}
              rules={{ required: true }}
              onChange={handlePhoneInputChange}
              className="phone-input"
            />
            {/* Background component to add contrast under the country select */}
            <div className="phone-input-country-background" />
          </div>

          <button
            type="submit"
            className="submit-button"
            onClick={() => {
              setHasSubmitted(true)
            }}
          >
            Submit
          </button>
        </div>
      </form>
      {!valid && hasSubmitted && (
        <p style={{ color: "tomato" }}>A valid phone number is required</p>
      )}

      {isSubmitting && (
        <>
          <div className="flex" style={{ alignItems: "center" }}>
            <p>Checking verification status...</p>
            <LoadingSpinner />
          </div>
        </>
      )}

      <NavigateButton navigatePath="/" label={"Go back"} />
    </div>
  )
}

export default PhoneVerification
