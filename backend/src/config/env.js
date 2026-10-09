const DEFAULT_FRONTEND_URL = "https://skillcert-ai-six.vercel.app";
const DEFAULT_API_BASE_URL = "https://skillcert-ai-1.onrender.com";

const requiredVariables = [
  "MONGODB_URI",
  "JWT_SECRET",
];

export function validateEnvironment() {
  const missingVariables = requiredVariables.filter(
    (variable) => !process.env[variable]
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing environment variables: ${missingVariables.join(", ")}`
    );
  }
}

export function getClientUrls() {
  const configuredUrls =
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    DEFAULT_FRONTEND_URL;

  return configuredUrls.split(",")
    .map((url) => url.trim())
    .filter(Boolean);
}

export function getFrontendUrl() {
  return process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;
}

export function getApiBaseUrl() {
  return process.env.API_BASE_URL || DEFAULT_API_BASE_URL;
}
