import fs from "node:fs";
import path from "node:path";

import PDFDocument from "pdfkit";
import QRCode from "qrcode";

import Certificate from "../models/Certificate.js";
import CertificateTemplate from "../models/CertificateTemplate.js";
import Test from "../models/Test.js";
import { AppError } from "../utils/apiResponse.js";
import generateCertificateId from "../utils/generateCertificateId.js";

const certificateDirectory = path.join(
  process.cwd(),
  "uploads",
  "certificates"
);

fs.mkdirSync(certificateDirectory, {
  recursive: true,
});

function replacePlaceholders(value, data) {
  return String(value || "").replace(
    /\{\{(.*?)\}\}/g,
    (match, key) => {
      const cleanKey = key.trim();

      return data[cleanKey] ?? "";
    }
  );
}

function getPdfFont(fontFamily, fontWeight) {
  const family = String(
    fontFamily || "Helvetica"
  ).toLowerCase();

  const bold = fontWeight === "bold";

  if (family.includes("times")) {
    return bold ? "Times-Bold" : "Times-Roman";
  }

  if (family.includes("courier")) {
    return bold ? "Courier-Bold" : "Courier";
  }

  return bold ? "Helvetica-Bold" : "Helvetica";
}

async function loadImageBuffer(source) {
  if (!source) {
    return null;
  }

  try {
    if (
      source.startsWith("http://") ||
      source.startsWith("https://")
    ) {
      const response = await fetch(source);

      if (!response.ok) {
        return null;
      }

      return Buffer.from(
        await response.arrayBuffer()
      );
    }

    let localPath = source;

    if (source.startsWith("/")) {
      localPath = path.join(
        process.cwd(),
        source.replace(/^\/+/, "")
      );
    }

    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }

    return null;
  } catch {
    return null;
  }
}

const instituteBrandingElements = [
  {
    type: "rectangle",
    x: 42,
    y: 42,
    width: 48,
    height: 48,
    fillColor: "#1f6b4f",
    borderColor: "#1f6b4f",
    borderWidth: 1,
  },
  {
    type: "text",
    value: "S",
    x: 42,
    y: 52,
    width: 48,
    height: 32,
    fontWeight: "bold",
    fontSize: 24,
    color: "#ffffff",
    alignment: "center",
  },
  {
    type: "text",
    value: "SkillCert AI",
    x: 102,
    y: 49,
    width: 190,
    height: 26,
    fontWeight: "bold",
    fontSize: 18,
    color: "#154b38",
    alignment: "left",
  },
  {
    type: "text",
    value: "INSTITUTE OF DIGITAL SKILLS",
    x: 102,
    y: 73,
    width: 230,
    height: 18,
    fontSize: 8,
    color: "#68756d",
    alignment: "left",
  },
  {
    type: "rectangle",
    x: 335,
    y: 478,
    width: 180,
    height: 1,
    fillColor: "#154b38",
    borderColor: "#154b38",
    borderWidth: 1,
  },
  {
    type: "text",
    value: "Ayush Chaubey",
    x: 335,
    y: 442,
    width: 180,
    height: 34,
    fontFamily: "Times",
    fontWeight: "bold",
    fontSize: 22,
    color: "#154b38",
    alignment: "center",
  },
  {
    type: "text",
    value: "AYUSH CHAUBEY",
    x: 335,
    y: 486,
    width: 180,
    height: 18,
    fontWeight: "bold",
    fontSize: 10,
    color: "#154b38",
    alignment: "center",
  },
  {
    type: "text",
    value: "FOUNDER & DIRECTOR",
    x: 335,
    y: 503,
    width: 180,
    height: 18,
    fontSize: 8,
    color: "#68756d",
    alignment: "center",
  },
];

async function getOrCreateDefaultTemplate(adminUserId) {
  let template = await CertificateTemplate.findOne({
    isActive: true,
  });

  if (template) {
    /*
     * Sirf product ke built-in default template ko institute branding se
     * upgrade karo. Admin ke custom active templates ko overwrite nahi karna.
     */
    if (
      template.name === "Default SkillCert Template" &&
      !template.elements?.some(
        (element) =>
          element.type === "text" &&
          element.value === "FOUNDER & DIRECTOR"
      )
    ) {
      template.elements = [
        ...(template.elements || []),
        ...instituteBrandingElements,
      ];
      template.signatureUrl = "";
      await template.save();
    }

    return template;
  }

  template = await CertificateTemplate.create({
    name: "Default SkillCert Template",
    pageSize: "A4",
    orientation: "landscape",
    isActive: true,
    createdBy: adminUserId,
    elements: [
      {
        type: "rectangle",
        x: 20,
        y: 20,
        width: 802,
        height: 555,
        borderColor: "#1f2937",
        borderWidth: 3,
      },
      {
        type: "text",
        value: "CERTIFICATE OF COMPLETION",
        x: 80,
        y: 80,
        width: 682,
        fontFamily: "Helvetica",
        fontWeight: "bold",
        fontSize: 30,
        color: "#111827",
        alignment: "center",
      },
      {
        type: "text",
        value: "This certificate is proudly awarded to",
        x: 100,
        y: 160,
        width: 642,
        fontSize: 16,
        color: "#4b5563",
        alignment: "center",
      },
      {
        type: "text",
        value: "{{studentName}}",
        x: 80,
        y: 210,
        width: 682,
        fontFamily: "Times",
        fontWeight: "bold",
        fontSize: 34,
        color: "#111827",
        alignment: "center",
      },
      {
        type: "text",
        value: "{{studentEmail}}",
        x: 100,
        y: 252,
        width: 642,
        fontSize: 12,
        color: "#4b5563",
        alignment: "center",
      },
      {
        type: "text",
        value: "for successfully completing",
        x: 100,
        y: 285,
        width: 642,
        fontSize: 15,
        color: "#4b5563",
        alignment: "center",
      },
      {
        type: "text",
        value: "{{courseName}}",
        x: 80,
        y: 325,
        width: 682,
        fontWeight: "bold",
        fontSize: 26,
        color: "#111827",
        alignment: "center",
      },
      {
        type: "text",
        value: "Score: {{score}}%",
        x: 100,
        y: 390,
        width: 300,
        fontSize: 15,
        alignment: "left",
      },
      {
        type: "text",
        value: "Issued: {{issuedDate}}",
        x: 100,
        y: 420,
        width: 300,
        fontSize: 15,
        alignment: "left",
      },
      {
        type: "text",
        value: "Certificate ID: {{certificateId}}",
        x: 100,
        y: 450,
        width: 400,
        fontSize: 11,
        alignment: "left",
      },
      {
        type: "qr",
        value: "{{verificationUrl}}",
        x: 660,
        y: 410,
        width: 100,
        height: 100,
      },
      ...instituteBrandingElements,
    ],
  });

  return template;
}

async function renderCertificate({
  template,
  outputPath,
  data,
}) {
  return new Promise(async (resolve, reject) => {
    try {
      const document = new PDFDocument({
        size: template.pageSize,
        layout: template.orientation,
        margin: 0,
      });

      const stream = fs.createWriteStream(outputPath);

      document.pipe(stream);

      if (template.backgroundUrl) {
        const background = await loadImageBuffer(
          template.backgroundUrl
        );

        if (background) {
          document.image(background, 0, 0, {
            width: document.page.width,
            height: document.page.height,
          });
        }
      }

      const templateElements = Array.isArray(
        template.elements
      )
        ? template.elements
        : [];

      const hasInstituteSignature =
        templateElements.some(
          (element) =>
            element.type === "text" &&
            element.value === "FOUNDER & DIRECTOR"
        );

      const elements = hasInstituteSignature
        ? templateElements
        : [
            ...templateElements,
            ...instituteBrandingElements,
          ];

      for (const element of elements) {
        if (element.type === "text") {
          const text = replacePlaceholders(
            element.value,
            data
          );

          document
            .font(
              getPdfFont(
                element.fontFamily,
                element.fontWeight
              )
            )
            .fontSize(element.fontSize || 18)
            .fillColor(element.color || "#000000")
            .text(text, element.x, element.y, {
              width: element.width,
              height: element.height,
              align: element.alignment || "left",
            });
        }

        if (element.type === "rectangle") {
          document
            .save()
            .lineWidth(element.borderWidth || 1)
            .strokeColor(
              element.borderColor || "#000000"
            );

          if (element.fillColor) {
            document
              .fillColor(element.fillColor)
              .rect(
                element.x,
                element.y,
                element.width,
                element.height
              )
              .fillAndStroke();
          } else {
            document
              .rect(
                element.x,
                element.y,
                element.width,
                element.height
              )
              .stroke();
          }

          document.restore();
        }

        if (element.type === "image") {
          const source = replacePlaceholders(
            element.value,
            data
          );

          const image = await loadImageBuffer(source);

          if (image) {
            document.image(
              image,
              element.x,
              element.y,
              {
                fit: [
                  element.width,
                  element.height,
                ],
                align: "center",
                valign: "center",
              }
            );
          }
        }

        if (element.type === "qr") {
          const qrValue = replacePlaceholders(
            element.value,
            data
          );

          const qrBuffer = await QRCode.toBuffer(
            qrValue,
            {
              width: Math.round(element.width || 100),
              margin: 1,
            }
          );

          document.image(
            qrBuffer,
            element.x,
            element.y,
            {
              width: element.width,
              height: element.height,
            }
          );
        }
      }

      document.end();

      stream.on("finish", resolve);
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateCertificateForTest(
  testId,
  adminUserId = null
) {
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

  if (test.status !== "submitted") {
    throw new AppError(
      test.status === "review_required"
        ? "Test ka admin review pending hai"
        : "Certificate ke liye test submitted hona chahiye",
      409
    );
  }

  if (!test.passed) {
    throw new AppError(
      "Failed test ka certificate generate nahi hoga",
      403
    );
  }

  const fallbackAdminId =
    adminUserId || test.userId._id;

  const template =
    await getOrCreateDefaultTemplate(fallbackAdminId);

  if (
    !template ||
    !Array.isArray(template.elements) ||
    template.elements.length === 0
  ) {
    throw new AppError(
      "Active certificate template valid nahi hai",
      503
    );
  }

  const existingCertificate =
    await Certificate.findOne({
      testId: test._id,
    });

  const certificateId =
    existingCertificate?.certificateId ||
    generateCertificateId();

  const verificationUrl =
    `${String(process.env.FRONTEND_URL).replace(/\/+$/, "")}/verify/` +
    certificateId;

  const fileName = `${certificateId}.pdf`;

  const outputPath = path.join(
    certificateDirectory,
    fileName
  );

  const certificateUrl =
    `${String(process.env.API_BASE_URL).replace(/\/+$/, "")}/uploads/` +
    `certificates/${fileName}`;

  const issuedAt =
    existingCertificate?.issuedAt ||
    new Date();

  const data = {
    studentName: test.userId.name,
    studentEmail: test.userId.email,
    courseName: test.courseId.title,
    score: Number(test.score).toFixed(2),
    issuedDate: issuedAt.toLocaleDateString(
      "en-IN"
    ),
    certificateId,
    verificationUrl,
    logoUrl: template.logoUrl,
    signatureUrl: template.signatureUrl,
  };

  // Purane templates me {{issueDate}} use hua tha; dono aliases support karo.
  data.issueDate = data.issuedDate;

  try {
    await renderCertificate({
      template,
      outputPath,
      data,
    });
  } catch (error) {
    if (!existingCertificate) {
      try {
        fs.unlinkSync(outputPath);
      } catch {
        // Partial PDF create nahi hui ya pehle hi remove ho chuki hai.
      }
    }

    throw error;
  }

  const certificateValues = {
    certificateId,
    userId: test.userId._id,
    studentName: test.userId.name,
    studentEmail: test.userId.email,
    courseId: test.courseId._id,
    courseName: test.courseId.title,
    testId: test._id,
    templateId: template._id,
    certificateUrl,
    filePath: outputPath,
    verificationUrl,
    score: test.score,
    issuedAt,
    templateSnapshot: template.toObject(),
  };

  let certificate;

  if (existingCertificate) {
    /*
     * Legacy certificate me admin identity save ho gayi ho to same
     * certificateId ko preserve karke authoritative test student/course data
     * aur regenerated PDF se repair karo. Duplicate document create nahi hoga.
     */
    Object.assign(
      existingCertificate,
      certificateValues
    );

    certificate = await existingCertificate.save();
  } else {
    certificate = await Certificate.create({
      ...certificateValues,
      status: "valid",
    });
  }

  return certificate;
}
