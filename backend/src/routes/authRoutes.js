import express from "express";

import {
  getMe,
  login,
  logout,
  register,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.post(
  "/register",
  asyncHandler(register)
);

router.post(
  "/login",
  asyncHandler(login)
);

router.post(
  "/logout",
  asyncHandler(logout)
);

router.get(
  "/me",
  protect,
  asyncHandler(getMe)
);

export default router;