import jwt from "jsonwebtoken";

export function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
}

export function getCookieOptions() {
  const days = Number(
    process.env.COOKIE_EXPIRES_DAYS || 7
  );

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite:
      process.env.NODE_ENV === "production"
        ? "none"
        : "lax",
    maxAge: days * 24 * 60 * 60 * 1000,
  };
}