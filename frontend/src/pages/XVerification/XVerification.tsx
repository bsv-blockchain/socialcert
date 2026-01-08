import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getBackendUrl, getBaseUrl } from "../../utils/getBackendUrl"
import getConstants from "../../utils/getConstants"
import { useAsyncEffect } from "use-async-effect"
import socialCertLogo from "../../assets/images/socialCert.svg"
import NavigateButton from "../../components/NavigateButton"
import { FaXTwitter } from "react-icons/fa6"
import { WalletClient, AuthFetch, AcquireCertificateResult, IdentityClient } from "@bsv/sdk"
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner"

const clientWallet = new WalletClient('json-api', 'localhost')

const XVerification = () => {
  // Constructors ============================================================
  const constants = getConstants()
  const hostname = window.location.hostname
  const navigate = useNavigate()
  const queryParams = new URLSearchParams(window.location.search)
  const oauthToken = queryParams.get("oauth_token")
  const oauthVerifier = queryParams.get("oauth_verifier")

  // State ==================================================================
  const [status, setStatus] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Processing...");


  // Initialize isChecked from localStorage if it exists, otherwise default to false
  const [isChecked, setIsChecked] = useState<boolean>(() => {
    const savedValue = localStorage.getItem("isChecked");
    return savedValue === null ? true : savedValue === "true";
  });

  // Store isChecked state in localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("isChecked", isChecked.toString());
    console.log(`Saved to localStorage: ${isChecked}`);
  }, [isChecked]);

  useAsyncEffect(async () => {
    try {
      if (oauthToken && oauthVerifier) {
        setLoadingMessage("Creating your certificate, please check the metanet client...")
        setIsLoading(true)

        const data = { oauthToken, oauthVerifier, funcAction: "getUserInfo" }

        const response = await new AuthFetch(clientWallet).fetch(getBackendUrl("X"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
        const userData = await response.json()
        const newCertificate = await clientWallet.acquireCertificate({
          certifier: '02cf6cdf466951d8dfc9e7c9367511d0007ed6fba35ed42d425cc412fd6cfd4a17',
          certifierUrl: getBaseUrl(),
          type: 'vdDWvftf1H+5+ZprUw123kjHlywH+v20aPQTuXgMpNc=',
          acquisitionProtocol: 'issuance',
          fields: {
            userName: userData.userName,
            profilePhoto: userData.profilePhoto,
          }
        })

        // Get the current value from localStorage to ensure it's the most up-to-date
        const shouldRevealPublicly = localStorage.getItem("isChecked") === "true";

        if (shouldRevealPublicly) {
          const publicationResult = await new IdentityClient(new WalletClient()).publiclyRevealAttributes(
            newCertificate,
            ['userName', 'profilePhoto'],
          )
        }

        navigate('/XVerification/VerifyResult/success')
      }
    } catch (error) {
      console.error("Error in processing request", error)
      navigate('/XVerification/VerifyResult/error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSignIn = async () => {
    setLoadingMessage("You will be redirected to the X sign-in page shortly...");
    setIsLoading(true);
    try {
      console.log("ON X PAGE")
      // Ensure the current checkbox state is saved before redirecting
      localStorage.setItem("isChecked", isChecked.toString());

      const data = { funcAction: "makeRequest", hostURL: hostname }
      const response = await new AuthFetch(clientWallet).fetch(getBackendUrl("X"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      const requestTokenData = await response.json()
      window.location.href = `https://api.twitter.com/oauth/authenticate?oauth_token=${requestTokenData.requestToken}`
    } catch (error) {
      setIsLoading(false);
      console.error("Error in processing request", error)
      navigate('/XVerification/VerifyResult/error')
    }
  }

  // Handler to properly update and log checkbox changes
  const handleCheckboxChange = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    console.log(`IS CHECKED STATE changing to: ${newValue}`);
  };

  return (
    <div className="container">
      <img src={socialCertLogo} className="main-logo" />
      <p className="sub-header-text">
        Certify your identity using your{" "}
        <FaXTwitter style={{ transform: "translateY(.25rem)" }} /> account
      </p>

      {isLoading ? (
        <div className="flex" style={{ alignItems: "center" }}>
          <span style={{ marginRight: "1rem" }}>{loadingMessage}</span>
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <button className="sign-in-button" onClick={handleSignIn}>
            Sign in with X
          </button>

          <div className="checkbox-container">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={handleCheckboxChange}
            />
            <label>Publicly reveal attributes of issued certificates</label>
          </div>
        </>
      )}

      <NavigateButton navigatePath="/" label={"Go back"} style={{ marginTop: "1rem" }} />
    </div>
  )
}

export default XVerification