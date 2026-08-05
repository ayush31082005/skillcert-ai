import Certificate from "../models/Certificate.js";
import Test from "../models/Test.js";
import {
  AppError,
  sendSuccess,
} from "../utils/apiResponse.js";
import { generateCertificateForTest } from "../services/certificateService.js";

function safeCertificate(certificate) {
  const value =
    typeof certificate?.toObject === "function"
      ? certificate.toObject()
      : { ...certificate };

  delete value.filePath;
  delete value.templateSnapshot;
  delete value.__v;

  return value;
}

export async function generateCertificate(
  request,
  response
) {
  const { testId } = request.body;

  if (!testId) {
    throw new AppError(
      "testId required hai",
      400
    );
  }

  const test = await Test.findById(testId)
    .populate("userId", "name email role")
    .populate(
      "courseId",
      "title passingPercentage"
    );

  if (!test) {
    throw new AppError("Test nahi mila", 404);
  }

  if (!test.userId || !test.courseId) {
    throw new AppError(
      "Test ka student ya course nahi mila",
      409
    );
  }

  const isOwner =
    String(test.userId._id) ===
    String(request.user._id);

  if (
    !isOwner &&
    request.user.role !== "admin"
  ) {
    throw new AppError(
      "Aap is certificate ko generate nahi kar sakte",
      403
    );
  }

  const certificate =
    await generateCertificateForTest(
      testId,
      request.user.role === "admin"
        ? request.user._id
        : null
    );

  return sendSuccess(response, {
    statusCode: 201,
    message: "Certificate generated",
    data: {
      certificate: safeCertificate(certificate),
    },
  });
}

export async function getMyCertificates(
  request,
  response
) {
  const certificates = await Certificate.find({
    userId: request.user._id,
  })
    .populate("courseId", "title")
    .sort({
      issuedAt: -1,
    });

  return sendSuccess(response, {
    message: "Certificates fetched",
    data: {
      certificates: certificates.map(
        safeCertificate
      ),
    },
  });
}

export async function getAllCertificates(
  request,
  response
) {
  const certificates = await Certificate.find()
    .populate("userId", "name email")
    .populate("courseId", "title")
    .sort({
      issuedAt: -1,
    });

  return sendSuccess(response, {
    message: "All certificates fetched",
    data: {
      certificates: certificates.map(
        safeCertificate
      ),
    },
  });
}

export async function getCertificate(
  request,
  response
) {
  const certificate = await Certificate.findOne({
    certificateId: request.params.certificateId,
  })
    .populate("userId", "name email")
    .populate("courseId", "title");

  if (!certificate) {
    throw new AppError(
      "Certificate nahi mila",
      404
    );
  }

  const isOwner =
    String(certificate.userId._id) ===
    String(request.user._id);

  if (
    !isOwner &&
    request.user.role !== "admin"
  ) {
    throw new AppError(
      "Certificate access denied",
      403
    );
  }

  return sendSuccess(response, {
    message: "Certificate fetched",
    data: {
      certificate: safeCertificate(certificate),
    },
  });
}

export async function verifyCertificate(
  request,
  response
) {
  const certificate = await Certificate.findOne({
    certificateId: request.params.certificateId,
  })
    .populate("userId", "name email")
    .populate("courseId", "title");

  if (!certificate) {
    throw new AppError(
      "Certificate invalid ya nahi mila",
      404
    );
  }

  return sendSuccess(response, {
    message:
      certificate.status === "valid"
        ? "Certificate valid hai"
        : "Certificate revoke ho chuka hai",
    data: {
      valid: certificate.status === "valid",
      certificate: {
        certificateId:
          certificate.certificateId,
        studentName:
          certificate.studentName ||
          certificate.userId?.name ||
          "",
        studentEmail:
          certificate.studentEmail ||
          certificate.userId?.email ||
          "",
        courseName:
          certificate.courseName ||
          certificate.courseId?.title ||
          "",
        score: certificate.score,
        issuedAt: certificate.issuedAt,
        status: certificate.status,
        certificateUrl:
          certificate.certificateUrl,
      },
    },
  });
}

export async function revokeCertificate(
  request,
  response
) {
  const certificate = await Certificate.findOne({
    certificateId: request.params.certificateId,
  });

  if (!certificate) {
    throw new AppError(
      "Certificate nahi mila",
      404
    );
  }

  certificate.status = "revoked";
  certificate.revokedAt = new Date();

  await certificate.save();

  return sendSuccess(response, {
    message: "Certificate revoked",
    data: {
      certificate: safeCertificate(certificate),
    },
  });
}
