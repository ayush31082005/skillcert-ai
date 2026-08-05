import { AppError } from "../utils/apiResponse.js";

export function adminOnly(request, response, next) {
  if (!request.user || request.user.role !== "admin") {
    return next(
      new AppError(
        "Is action ke liye admin access required hai",
        403
      )
    );
  }

  next();
}