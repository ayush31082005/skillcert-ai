import mongoose from "mongoose";

/*
 * Certificate editor ke elements alag-alag shape rakhte hain:
 * text, rectangle, image aur QR. Mixed schema un sab properties ko
 * preserve karta hai, jabki controller elements ko array validate karta hai.
 */
const certificateTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Template name required hai"],
      trim: true,
      maxlength: 150,
    },

    pageSize: {
      type: String,
      default: "A4",
      trim: true,
    },

    orientation: {
      type: String,
      enum: ["portrait", "landscape"],
      default: "landscape",
    },

    backgroundUrl: {
      type: String,
      default: "",
      trim: true,
    },

    logoUrl: {
      type: String,
      default: "",
      trim: true,
    },

    signatureUrl: {
      type: String,
      default: "",
      trim: true,
    },

    elements: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const CertificateTemplate =
  mongoose.models.CertificateTemplate ||
  mongoose.model(
    "CertificateTemplate",
    certificateTemplateSchema
  );

export default CertificateTemplate;
