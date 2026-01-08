import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import getConstants from '../utils/getConstants'
import { WalletClient, AuthFetch, AcquireCertificateResult, IdentityClient } from "@bsv/sdk"
import useStyles from './register-style'
import { useAsyncEffect } from "use-async-effect"
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner"
import { getBackendUrl, getBaseUrl } from "../utils/getBackendUrl"
import socialCertLogo from "../assets/images/socialCert.svg"
import { FaDiscord } from "react-icons/fa"
import NavigateButton from "../components/NavigateButton"


const clientWallet = new WalletClient('json-api', 'localhost')

const DiscordVerification = () => {
  const [progressStatus, setProgressStatus] = useState('')
  const [successStatus, setSuccessStatus] = useState(false)
  const constants = getConstants()
  const navigate = useNavigate()
  const classes = useStyles()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Processing...");


  const [isChecked, setIsChecked] = useState<boolean>(() => {
    const savedValue = localStorage.getItem("isChecked");
    return savedValue === null ? true : savedValue === "true";
  });

  useEffect(() => {
    localStorage.setItem("isChecked", isChecked.toString());
    console.log(`Saved to localStorage: ${isChecked}`);
  }, [isChecked]);

  useAsyncEffect(async () => {
    const params = new URLSearchParams(window.location.search)
    const accessCode = params.get('code');
    try {
      if (accessCode) {
        setLoadingMessage("Creating your certificate, please check the metanet client...")
        setIsLoading(true)
        const data = { accessCode, funcAction: "getDiscordData" }

        const response = await new AuthFetch(clientWallet).fetch(getBackendUrl("discord"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
        const userData = await response.json()
        console.log(`user data ${userData}`);
        console.log(userData.userName);
        console.log(userData.profilePhoto);

        const newCertificate = await clientWallet.acquireCertificate({
          certifier: '02cf6cdf466951d8dfc9e7c9367511d0007ed6fba35ed42d425cc412fd6cfd4a17',
          certifierUrl: getBaseUrl(),
          type: '2TgqRC35B1zehGmB21xveZNc7i5iqHc0uxMb+1NMPW4=',
          acquisitionProtocol: 'issuance',
          fields: {
            userName: userData.userName,
            profilePhoto: userData.profilePhoto,
          }
        })

        const shouldRevealPublicly = localStorage.getItem("isChecked") === "true";

        if (shouldRevealPublicly) {
          console.log('INSIDE IF STATEMENT')
          const publicationResult = await new IdentityClient(new WalletClient()).publiclyRevealAttributes(
            newCertificate,
            ['userName', 'profilePhoto'],
          )
        }

        navigate('/DiscordVerification/VerifyResults/success')

      }
    } catch (error) {
      console.error("Error in processing request", error)
      navigate('/DiscordVerification/VerifyResults/error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSignIn = async () => {
    const hostname = window.location.hostname

    if (hostname.includes("staging")) {
      return (window.location.href =
        "https://discord.com/oauth2/authorize?client_id=1202716017055375421&response_type=code&redirect_uri=https%3A%2F%2Fstaging.socialcert.net%2FdiscordVerification&scope=identify")
    } else if (hostname.includes("localhost")) {
      return (window.location.href =
        "https://discord.com/oauth2/authorize?client_id=1202716017055375421&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8088%2FdiscordVerification&scope=identify")
    } else {
      return (window.location.href =
        "https://discord.com/oauth2/authorize?client_id=1202716017055375421&response_type=code&redirect_uri=https%3A%2F%2Fsocialcert.net%2FdiscordVerification&scope=identify")
    }
  }

  const handleCheckboxChange = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    console.log(`IS CHECKED STATE changing to: ${newValue}`);
  };

  return (
    <div className="container">
      <img src={socialCertLogo} className="main-logo" />
      <p className="sub-header-text">
        Certify your identity using your discord account
      </p>

      {isLoading ? (
        <div className="flex" style={{ alignItems: "center" }}>
          <span style={{ marginRight: "1rem" }}>{loadingMessage}</span>
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <button id="discord-cert-button" className="sign-in-button" onClick={handleSignIn}>
            Sign in with <FaDiscord />
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

export default DiscordVerification
