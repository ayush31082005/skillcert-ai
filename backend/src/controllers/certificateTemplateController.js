import CertificateTemplate from "../models/CertificateTemplate.js";
import {
  AppError,
  sendSuccess,
} from "../utils/apiResponse.js";

export async function createTemplate(
  request,
  response
) {
  const {
    name,
    pageSize,
    orientation,
    backgroundUrl,
    logoUrl,
    signatureUrl,
    elements,
    isActive,
  } = request.body;

  if (!name) {
    throw new AppError(
      "Template name required hai",
      400
    );
  }

  if (isActive) {
    await CertificateTemplate.updateMany(
      {},
      {
        isActive: false,
      }
    );
  }

  const template =
    await CertificateTemplate.create({
      name,
      pageSize: pageSize || "A4",
      orientation: orientation || "landscape",
      backgroundUrl: backgroundUrl || "",
      logoUrl: logoUrl || "",
      signatureUrl: signatureUrl || "",
      elements: Array.isArray(elements)
        ? elements
        : [],
      isActive: Boolean(isActive),
      createdBy: request.user._id,
    });

  return sendSuccess(response, {
    statusCode: 201,
    message: "Certificate template created",
    data: {
      template,
    },
  });
}

export async function getTemplates(
  request,
  response
) {
  const templates =
    await CertificateTemplate.find()
      .populate("createdBy", "name email")
      .sort({
        createdAt: -1,
      });

  return sendSuccess(response, {
    message: "Certificate templates fetched",
    data: {
      templates,
    },
  });
}

export async function updateTemplate(
  request,
  response
) {
  if (request.body.isActive) {
    await CertificateTemplate.updateMany(
      {
        _id: {
          $ne: request.params.templateId,
        },
      },
      {
        isActive: false,
      }
    );
  }

  const template =
    await CertificateTemplate.findByIdAndUpdate(
      request.params.templateId,
      request.body,
      {
        new: true,
        runValidators: true,
      }
    );

  if (!template) {
    throw new AppError(
      "Certificate template nahi mila",
      404
    );
  }

  return sendSuccess(response, {
    message: "Certificate template updated",
    data: {
      template,
    },
  });
}

export async function activateTemplate(
  request,
  response
) {
  const template =
    await CertificateTemplate.findById(
      request.params.templateId
    );

  if (!template) {
    throw new AppError(
      "Certificate template nahi mila",
      404
    );
  }

  await CertificateTemplate.updateMany(
    {},
    {
      isActive: false,
    }
  );

  template.isActive = true;

  await template.save();

  return sendSuccess(response, {
    message: "Certificate template activated",
    data: {
      template,
    },
  });
}

export async function deleteTemplate(
  request,
  response
) {
  const template =
    await CertificateTemplate.findByIdAndDelete(
      request.params.templateId
    );

  if (!template) {
    throw new AppError(
      "Certificate template nahi mila",
      404
    );
  }

  return sendSuccess(response, {
    message: "Certificate template deleted",
  });
}