import { getBackendUrl } from "../../../utils/getBackendUrl"
import { WalletClient, AuthFetch } from "@bsv/sdk"

const clientWallet = new WalletClient('auto')

export const sendVerificationText = async (phoneNumber: string) => {
  try {
    const data = { phoneNumber, funcAction: "sendText" }
    const response = await new AuthFetch(clientWallet).fetch(getBackendUrl("phone"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    const responseData = await response.json()

    return responseData
  } catch (e) {
    throw e
  }
}
