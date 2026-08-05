import express from "express";

import {
  getMyLearning,
  getProgress,
  updateProgress,
} from "../controllers/progressController.js";
import { protect } from "../middleware/authMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.get(
  "/my-learning",
  protect,
  asyncHandler(getMyLearning)
);

router.put(
  "/:videoId",
  protect,
  asyncHandler(updateProgress)
);

router.get(
  "/:videoId",
  protect,
  asyncHandler(getProgress)
);

export default router;
