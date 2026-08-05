import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID required hai"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Video title required hai"],
      trim: true,
      minlength: [2, "Video title minimum 2 characters ka hona chahiye"],
      maxlength: [150, "Video title maximum 150 characters ka ho sakta hai"],
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2000, "Description maximum 2000 characters ka ho sakta hai"],
    },

    // Local temporary file name
    fileName: {
      type: String,
      default: "",
    },

    /*
     * Local temporary path.
     * AI transcription complete hone ke baad local file delete hogi
     * aur filePath empty string ho jayega.
     */
    filePath: {
      type: String,
      default: "",
    },

    // Cloudinary secure video URL
    videoUrl: {
      type: String,
      required: [true, "Video URL required hai"],
    },

    // Cloudinary video public ID
    cloudinaryPublicId: {
      type: String,
      required: [true, "Cloudinary public ID required hai"],
      index: true,
    },

    cloudinaryResourceType: {
      type: String,
      default: "video",
    },

    // Thumbnail secure URL
    thumbnailUrl: {
      type: String,
      default: "",
    },

    // Thumbnail Cloudinary public ID
    thumbnailPublicId: {
      type: String,
      default: "",
    },

    mimeType: {
      type: String,
      default: "",
    },

    fileSize: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Duration seconds me save hogi
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Course me video ka order
    order: {
      type: Number,
      default: 1,
      min: 1,
    },

    /*
     * AI processing ke baad generated transcript.
     * User frontend ko directly send nahi karna.
     */
    transcript: {
      type: String,
      default: "",
      select: false,
    },

    topics: {
      type: [String],
      default: [],
    },

    summary: {
      type: String,
      default: "",
    },

    processingStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
      ],
      default: "pending",
      index: true,
    },

    processingError: {
      type: String,
      default: "",
      select: false,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader user ID required hai"],
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Ek course me order ke basis par videos find aur sort
 * karne me performance improve karega.
 */
videoSchema.index({
  courseId: 1,
  order: 1,
});

const Video =
  mongoose.models.Video ||
  mongoose.model("Video", videoSchema);

export default Video;