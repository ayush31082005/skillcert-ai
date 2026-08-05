import express from "express";

import {
  activateTemplate,
  createTemplate,
  deleteTemplate,
  getTemplates,
  updateTemplate,
} from "../controllers/certificateTemplateController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get(
  "/",
  asyncHandler(getTemplates)
);

router.post(
  "/",
  asyncHandler(createTemplate)
);

router.put(
  "/:templateId",
  asyncHandler(updateTemplate)
);

router.patch(
  "/:templateId/activate",
  asyncHandler(activateTemplate)
);

router.delete(
  "/:templateId",
  asyncHandler(deleteTemplate)
);

export default router;