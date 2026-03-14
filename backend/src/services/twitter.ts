import { TwitterApi } from "twitter-api-v2";
import { config } from "../config";
import { logger } from "../utils/logger";
import {
  storeOAuthSession,
  consumeOAuthSession,
  storeXRefreshToken,
  getXRefreshToken,
} from "./redis";

/**
 * Generate an OAuth 2.0 authorization URL with PKCE for X/Twitter.
 */
export async function generateAuthUrl(
  identityKey: string,
): Promise<{ url: string; state: string }> {
  const client = new TwitterApi({
    clientId: config.X_CLIENT_ID,
    clientSecret: config.X_CLIENT_SECRET,
  });

  const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
    config.X_REDIRECT_URI,
    {
      scope: ["tweet.read", "users.read"],
    },
  );

  // Store the PKCE code verifier and identity key in Redis
  await storeOAuthSession(state, { codeVerifier, identityKey });

  logger.info({ identityKey, state }, "X OAuth URL generated");
  return { url, state };
}

/**
 * Handle the OAuth 2.0 callback from X/Twitter.
 * Exchanges the code for tokens and fetches user profile.
 */
export async function handleCallback(
  code: string,
  state: string,
): Promise<{
  userName: string;
  profilePhoto: string;
  identityKey: string;
}> {
  // Retrieve the stored session
  const session = await consumeOAuthSession(state);
  if (!session) {
    throw Object.assign(new Error("Invalid or expired OAuth session"), {
      statusCode: 400,
    });
  }

  const client = new TwitterApi({
    clientId: config.X_CLIENT_ID,
    clientSecret: config.X_CLIENT_SECRET,
  });

  // Exchange the code for tokens
  const { accessToken, refreshToken } = await client.loginWithOAuth2({
    code,
    codeVerifier: session.codeVerifier,
    redirectUri: config.X_REDIRECT_URI,
  });

  // Store refresh token for future share posting
  if (refreshToken) {
    await storeXRefreshToken(session.identityKey, refreshToken);
  }

  // Fetch user profile
  const loggedClient = new TwitterApi(accessToken);
  const { data: user } = await loggedClient.v2.me({
    "user.fields": ["profile_image_url", "username"],
  });

  const userName = user.username;
  const profilePhoto = user.profile_image_url || "";

  logger.info(
    { identityKey: session.identityKey, userName },
    "X verification successful",
  );

  return {
    userName,
    profilePhoto,
    identityKey: session.identityKey,
  };
}

/**
 * Post a certification tweet on behalf of the user.
 */
export async function shareCertification(
  identityKey: string,
  certType: string,
  frontendUrl: string,
): Promise<{ tweetId: string; tweetUrl: string }> {
  const refreshToken = await getXRefreshToken(identityKey);
  if (!refreshToken) {
    throw Object.assign(
      new Error(
        "No X authorization found. Please verify your X account first.",
      ),
      { statusCode: 400 },
    );
  }

  const client = new TwitterApi({
    clientId: config.X_CLIENT_ID,
    clientSecret: config.X_CLIENT_SECRET,
  });

  // Refresh the access token
  const { accessToken, refreshToken: newRefreshToken } =
    await client.refreshOAuth2Token(refreshToken);

  // Store the new refresh token
  if (newRefreshToken) {
    await storeXRefreshToken(identityKey, newRefreshToken);
  }

  const loggedClient = new TwitterApi(accessToken);

  // Get the user's username for the tweet URL
  const { data: user } = await loggedClient.v2.me();

  const certTypeName =
    certType === "email"
      ? "email"
      : certType === "phone"
        ? "phone number"
        : "X account";
  const tweetText = `I just published my verified ${certTypeName} on Who I Am — now anyone in the BSV ecosystem can find me.\n\n${frontendUrl}\n\n#WhoIAm #BSV #DigitalIdentity`;

  const { data: tweet } = await loggedClient.v2.tweet(tweetText);

  const tweetUrl = `https://x.com/${user.username}/status/${tweet.id}`;

  logger.info({ identityKey, tweetId: tweet.id }, "Certification shared on X");

  return { tweetId: tweet.id, tweetUrl };
}
