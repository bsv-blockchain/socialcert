export const CERTIFICATE_TYPES = {
  email: 'exOl3KM0dIJ04EW5pZgbZmPag6MdJXd3/a1enmUU/BA=',
  phone: 'mffUklUzxbHr65xLohn0hRL0Tq2GjW1GYF/OPfzqJ6A=',
  x: 'vdDWvftf1H+5+ZprUw123kjHlywH+v20aPQTuXgMpNc=',
} as const

export type CertType = keyof typeof CERTIFICATE_TYPES

export function getCertifierConfig() {
  const hostname = window.location.hostname

  if (hostname.includes('staging')) {
    return {
      certifierUrl: 'https://staging-backend.socialcert.net',
      certifierPublicKey: '02cf6cdf466951d8dfc9e7c9367511d0007ed6fba35ed42d425cc412fd6cfd4a17',
    }
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return {
      certifierUrl: 'http://localhost:8080',
      certifierPublicKey: '02cf6cdf466951d8dfc9e7c9367511d0007ed6fba35ed42d425cc412fd6cfd4a17',
    }
  }

  return {
    certifierUrl: 'https://backend.socialcert.net',
    certifierPublicKey: '03285263f06139b66fb27f51cf8a92e9dd007c4c4b83876ad6c3e7028db450a4c2',
  }
}

export function getApiBaseUrl(): string {
  const hostname = window.location.hostname
  if (hostname.includes('staging')) return 'https://staging-backend.socialcert.net'
  if (hostname === 'localhost' || hostname === '127.0.0.1') return ''  // Vite proxy handles /api
  return 'https://backend.socialcert.net'
}

export const CERT_TYPE_LABELS: Record<string, string> = {
  [CERTIFICATE_TYPES.email]: 'Email',
  [CERTIFICATE_TYPES.phone]: 'Phone',
  [CERTIFICATE_TYPES.x]: 'X / Twitter',
}

export const CERT_TYPE_FIELDS: Record<string, string[]> = {
  [CERTIFICATE_TYPES.email]: ['email'],
  [CERTIFICATE_TYPES.phone]: ['phoneNumber'],
  [CERTIFICATE_TYPES.x]: ['userName', 'profilePhoto'],
}
