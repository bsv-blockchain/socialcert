import React from "react"
import { useNavigate } from "react-router-dom"
import "react-toastify/dist/ReactToastify.css"

// Assets
import { FaDiscord, FaPhoneAlt } from "react-icons/fa"
import { FaXTwitter } from "react-icons/fa6"
import { IoIosMail } from "react-icons/io"
import socialCertLogo from "../assets/images/socialCert.svg"

const Register = () => {
  const navigate = useNavigate()

  // const handleDiscordClick = async () => {
  //   const hostname = window.location.hostname

  //   if (hostname.includes("staging")) {
  //     return (window.location.href =
  //       "https://discord.com/oauth2/authorize?client_id=1202716017055375421&response_type=code&redirect_uri=https%3A%2F%2Fstaging.socialcert.net%2FdiscordVerification&scope=identify")
  //   } else if (hostname.includes("localhost")) {
  //     return (window.location.href =
  //       "https://discord.com/oauth2/authorize?client_id=1202716017055375421&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8088%2FdiscordVerification&scope=identify")
  //   } else {
  //     return (window.location.href =
  //       "https://discord.com/oauth2/authorize?client_id=1202716017055375421&response_type=code&redirect_uri=https%3A%2F%2Fsocialcert.net%2FdiscordVerification&scope=identify")
  //   }
  // }

  return (
    <div className="container">
      <div className="sub-container">
        <div className="sub-container-2">
          <h2 style={{ margin: 0 }}>Welcome to</h2>
          <img src={socialCertLogo} width={300} className="main-logo" />
        </div>
      </div>
      <p style={{ marginBottom: "2rem" }}>
        Access the MetaNet using your own certified identity{" "}
      </p>

      <h3>Choose your desired identity certification</h3>
      <div className="flex button-group">
        {/* <button
          id="phone-cert-button"
          onClick={() => navigate("/PhoneVerification")}
        >
          <FaPhoneAlt />
          <label>Phone Number</label>
        </button> */}

        <button id="discord-cert-button" onClick={() => navigate("/discordVerification")}>
          <FaDiscord />
          <label>Discord</label>
        </button>

        <button id="x-cert-button" onClick={() => navigate("/XVerification")}>
          <FaXTwitter />
          X/Twitter
        </button>

        <button
          id="email-cert-button"
          onClick={() => navigate("/EmailVerification")}
        >
          <IoIosMail />
          Email
        </button>
      </div>
    </div>
  )
}

export default Register
