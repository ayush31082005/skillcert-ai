const requiredVariables = [
  "MONGODB_URI",
  "JWT_SECRET",
  "API_BASE_URL",
  "FRONTEND_URL",
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
    process.env.CLIENT_URL || process.env.FRONTEND_URL || "";

  return configuredUrls.split(",")
    .map((url) => url.trim())
    .filter(Boolean);
}
