import express from "express";

import {
  generateTest,
  getAdminTestDetails,
  getAdminTests,
  getMyTests,
  getResult,
  getTest,
  reviewTest,
  startTest,
  submitTest,
} from "../controllers/testController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.post(
  "/generate",
  protect,
  asyncHandler(generateTest)
);

router.get(
  "/my-tests",
  protect,
  asyncHandler(getMyTests)
);

router.get(
  "/admin/all",
  protect,
  adminOnly,
  asyncHandler(getAdminTests)
);

router.get(
  "/admin/:testId",
  protect,
  adminOnly,
  asyncHandler(getAdminTestDetails)
);

router.patch(
  "/:testId/review",
  protect,
  adminOnly,
  asyncHandler(reviewTest)
);

router.post(
  "/:testId/start",
  protect,
  asyncHandler(startTest)
);

router.post(
  "/:testId/submit",
  protect,
  asyncHandler(submitTest)
);

router.get(
  "/:testId/result",
  protect,
  asyncHandler(getResult)
);

router.get(
  "/:testId",
  protect,
  asyncHandler(getTest)
);

export default router;