import jwt from "jsonwebtoken";

import User from "../models/User.js";
import { AppError } from "../utils/apiResponse.js";

export async function protect(request, response, next) {
  const authorization = request.headers.authorization;
  let token =
    authorization &&
    authorization.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length).trim()
      : request.cookies?.skillcert_token;

  if (!token) {
    return next(
      new AppError("Login required hai", 401)
    );
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(
        new AppError("Token ka user nahi mila", 401)
      );
    }

    if (!user.isActive) {
      return next(
        new AppError("Aapka account inactive hai", 403)
      );
    }

    request.user = user;

    next();
  } catch {
    next(
      new AppError(
        "Token invalid ya expire ho gaya hai",
        401
      )
    );
  }
}
