interface CertificateTypes {
  discord: string
  phone: string
  x: string
  email: string
}

interface Constants {
  certifierUrl: string
  certifierPublicKey: string
  certificateTypes: CertificateTypes
}

const getConstants = (): Constants => {
  let certifierUrl: string
  let certifierPublicKey: string
  const certificateTypes: CertificateTypes = {
    discord: '2TgqRC35B1zehGmB21xveZNc7i5iqHc0uxMb+1NMPW4=',
    phone: 'mffUklUzxbHr65xLohn0hRL0Tq2GjW1GYF/OPfzqJ6A=',
    x: 'vdDWvftf1H+5+ZprUw123kjHlywH+v20aPQTuXgMpNc=',
    email: 'exOl3KM0dIJ04EW5pZgbZmPag6MdJXd3/a1enmUU/BA='
  }

  if ((window.location.host.startsWith('staging'))) {
    certifierUrl = 'https://staging-backend.socialcert.net/'
    certifierPublicKey = '02cf6cdf466951d8dfc9e7c9367511d0007ed6fba35ed42d425cc412fd6cfd4a17'
  } else if (window.location.host.startsWith('localhost')) {
    certifierUrl = 'https://staging-backend.socialcert.net/'
    certifierPublicKey = '02cf6cdf466951d8dfc9e7c9367511d0007ed6fba35ed42d425cc412fd6cfd4a17'
  } else {
    certifierUrl = 'https://backend.socialcert.net/'
    certifierPublicKey = '03285263f06139b66fb27f51cf8a92e9dd007c4c4b83876ad6c3e7028db450a4c2'
  }

  return {
    certifierUrl,
    certifierPublicKey,
    certificateTypes
  }
}
export default getConstants
