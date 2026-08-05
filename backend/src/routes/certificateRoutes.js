import express from "express";

import {
  generateCertificate,
  getAllCertificates,
  getCertificate,
  getMyCertificates,
  revokeCertificate,
  verifyCertificate,
} from "../controllers/certificateController.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.post(
  "/generate",
  protect,
  asyncHandler(generateCertificate)
);

router.get(
  "/my-certificates",
  protect,
  asyncHandler(getMyCertificates)
);

router.get(
  "/admin/all",
  protect,
  adminOnly,
  asyncHandler(getAllCertificates)
);

router.get(
  "/verify/:certificateId",
  asyncHandler(verifyCertificate)
);

router.patch(
  "/:certificateId/revoke",
  protect,
  adminOnly,
  asyncHandler(revokeCertificate)
);

router.get(
  "/:certificateId",
  protect,
  asyncHandler(getCertificate)
);

export default router;
