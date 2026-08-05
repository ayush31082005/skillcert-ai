const requiredVariables = [
  "MONGODB_URI",
  "JWT_SECRET",
  "CLIENT_URL",
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
  return process.env.CLIENT_URL.split(",")
    .map((url) => url.trim())
    .filter(Boolean);
}