import bcrypt from "bcryptjs";

import User from "../models/User.js";
import {
  AppError,
  sendSuccess,
} from "../utils/apiResponse.js";
import {
  generateToken,
  getCookieOptions,
} from "../utils/generateToken.js";

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export async function register(request, response) {
  const { name, email, password } = request.body;

  if (!name || !email || !password) {
    throw new AppError(
      "Name, email aur password required hain",
      400
    );
  }

  if (password.length < 6) {
    throw new AppError(
      "Password minimum 6 characters ka hona chahiye",
      400
    );
  }

  const normalizedEmail = email
    .trim()
    .toLowerCase();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new AppError(
      "Is email se account pehle se bana hai",
      409
    );
  }

  const hashedPassword = await bcrypt.hash(
    password,
    12
  );

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: "student",
  });

  const token = generateToken(user);

  response.cookie(
    "skillcert_token",
    token,
    getCookieOptions()
  );

  return sendSuccess(response, {
    statusCode: 201,
    message: "Registration successful",
    data: {
      user: publicUser(user),
      token,
    },
  });
}

export async function login(request, response) {
  const { email, password } = request.body;

  if (!email || !password) {
    throw new AppError(
      "Email aur password required hain",
      400
    );
  }

  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  }).select("+password");

  if (!user) {
    throw new AppError(
      "Is email se account nahi mila. Email check karein ya account create karein.",
      401
    );
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatches) {
    throw new AppError(
      "Password galat hai. Dobara check karke try karein.",
      401
    );
  }

  if (!user.isActive) {
    throw new AppError(
      "Aapka account inactive hai",
      403
    );
  }

  const token = generateToken(user);

  response.cookie(
    "skillcert_token",
    token,
    getCookieOptions()
  );

  return sendSuccess(response, {
    message: "Login successful",
    data: {
      user: publicUser(user),
      token,
    },
  });
}

export async function logout(request, response) {
  response.cookie("skillcert_token", "", {
    ...getCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });

  return sendSuccess(response, {
    message: "Logout successful",
  });
}

export async function getMe(request, response) {
  return sendSuccess(response, {
    message: "User profile fetched",
    data: {
      user: publicUser(request.user),
    },
  });
}
