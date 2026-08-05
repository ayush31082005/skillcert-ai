import express from "express";

import {
  getStudentDetails,
  getStudents,
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.get(
  "/students",
  protect,
  adminOnly,
  asyncHandler(getStudents)
);

router.get(
  "/students/:userId",
  protect,
  adminOnly,
  asyncHandler(getStudentDetails)
);

export default router;