import fs from "node:fs";

import Course from "../models/Course.js";
import Video from "../models/Video.js";

import {
  AppError,
  sendSuccess,
} from "../utils/apiResponse.js";

import { processVideo } from "../services/videoService.js";

import {
  deleteCloudinaryAsset,
  removeLocalFile,
  uploadImageToCloudinary,
  uploadVideoToCloudinary,
} from "../services/cloudinaryService.js";

/**
 * Admin video aur optional thumbnail upload karega.
 *
 * Flow:
 * 1. Multer local temporary file save karega.
 * 2. Video Cloudinary par upload hogi.
 * 3. Thumbnail Cloudinary par upload hogi.
 * 4. Video details MongoDB me save hongi.
 * 5. Background me AI video processing start hogi.
 */
export async function uploadVideo(request, response) {
  const videoFile = request.files?.video?.[0];
  const thumbnailFile =
    request.files?.thumbnail?.[0];

  if (!videoFile) {
    throw new AppError(
      "Video file required hai",
      400
    );
  }

  const {
    courseId,
    title,
    description = "",
    order = 1,
    transcript = "",
  } = request.body;

  if (!courseId || !title?.trim()) {
    removeLocalFile(videoFile.path);
    removeLocalFile(thumbnailFile?.path);

    throw new AppError(
      "Course ID aur video title required hain",
      400
    );
  }

  const course = await Course.findById(courseId);

  if (!course) {
    removeLocalFile(videoFile.path);
    removeLocalFile(thumbnailFile?.path);

    throw new AppError(
      "Course nahi mila",
      404
    );
  }

  let uploadedVideo = null;
  let uploadedThumbnail = null;
  let createdVideo = null;

  try {
    /*
     * Step 1:
     * Local temporary video ko Cloudinary par upload karo.
     */
    uploadedVideo =
      await uploadVideoToCloudinary(
        videoFile.path,
        {
          folder:
            process.env.CLOUDINARY_VIDEO_FOLDER ||
            "skillcert-ai/videos",
        }
      );

    /*
     * Step 2:
     * Thumbnail di gayi hai to Cloudinary par upload karo.
     */
    if (thumbnailFile) {
      uploadedThumbnail =
        await uploadImageToCloudinary(
          thumbnailFile.path,
          {
            folder:
              process.env.CLOUDINARY_IMAGE_FOLDER ||
              "skillcert-ai/images",

            transformation: [
              {
                width: 1280,
                height: 720,
                crop: "fill",
                gravity: "auto",
                quality: "auto",
                fetch_format: "auto",
              },
            ],
          }
        );
    }

    /*
     * Step 3:
     * Video ki details MongoDB me save karo.
     *
     * Local video abhi delete nahi kar rahe,
     * kyunki processVideo() isi local file se
     * audio extract aur transcript generate karega.
     */
    createdVideo = await Video.create({
      courseId: course._id,

      title: title.trim(),

      description:
        typeof description === "string"
          ? description.trim()
          : "",

      transcript:
        typeof transcript === "string"
          ? transcript.trim()
          : "",

      fileName: videoFile.filename,

      filePath: videoFile.path,

      videoUrl: uploadedVideo.secure_url,

      cloudinaryPublicId:
        uploadedVideo.public_id,

      cloudinaryResourceType:
        uploadedVideo.resource_type || "video",

      thumbnailUrl:
        uploadedThumbnail?.secure_url || "",

      thumbnailPublicId:
        uploadedThumbnail?.public_id || "",

      mimeType: videoFile.mimetype,

      fileSize:
        Number(uploadedVideo.bytes) ||
        Number(videoFile.size) ||
        0,

      duration:
        Number(uploadedVideo.duration) || 0,

      order: Math.max(
        1,
        Number(order) || 1
      ),

      uploadedBy: request.user._id,

      processingStatus: "pending",
    });

    /*
     * Thumbnail local copy ki ab zarurat nahi hai.
     */
    removeLocalFile(thumbnailFile?.path);

    /*
     * Step 4:
     * Video ka transcription aur AI analysis start karo.
     *
     * API response ko process complete hone tak block nahi karenge.
     */
    setImmediate(() => {
      processVideo(createdVideo._id).catch(
        (error) => {
          console.error(
            `Automatic video processing failed for ${createdVideo._id}:`,
            error.message
          );
        }
      );
    });

    return sendSuccess(response, {
      statusCode: 201,

      message:
        "Video Cloudinary par upload ho gayi. AI processing start ho gayi hai.",

      data: {
        video: createdVideo,
      },
    });
  } catch (error) {
    /*
     * Database save ya kisi upload me error aaye,
     * to local temporary files remove karo.
     */
    removeLocalFile(videoFile.path);
    removeLocalFile(thumbnailFile?.path);

    /*
     * Video Cloudinary par upload ho gayi lekin baad me
     * error aaya, to Cloudinary video bhi delete karo.
     */
    if (uploadedVideo?.public_id) {
      await deleteCloudinaryAsset(
        uploadedVideo.public_id,
        "video"
      ).catch((deleteError) => {
        console.error(
          "Uploaded video cleanup failed:",
          deleteError.message
        );
      });
    }

    if (uploadedThumbnail?.public_id) {
      await deleteCloudinaryAsset(
        uploadedThumbnail.public_id,
        "image"
      ).catch((deleteError) => {
        console.error(
          "Uploaded thumbnail cleanup failed:",
          deleteError.message
        );
      });
    }

    /*
     * MongoDB document create ho gaya tha aur baad me
     * error aaya to document bhi remove karo.
     */
    if (createdVideo?._id) {
      await Video.findByIdAndDelete(
        createdVideo._id
      ).catch((deleteError) => {
        console.error(
          "Video database cleanup failed:",
          deleteError.message
        );
      });
    }

    throw error;
  }
}

/**
 * Student/Admin ko ek course ke saare videos dega.
 * Transcript aur internal Cloudinary IDs response me nahi jayengi.
 */
export async function getCourseVideos(
  request,
  response
) {
  const { courseId } = request.params;

  const course = await Course.findById(
    courseId
  ).select("_id title status");

  if (!course) {
    throw new AppError(
      "Course nahi mila",
      404
    );
  }

  const videoFilter = {
    courseId,
  };

  const videos = await Video.find(videoFilter)
    .select(
      [
        "title",
        "description",
        "videoUrl",
        "thumbnailUrl",
        "duration",
        "order",
        "summary",
        "topics",
        "processingStatus",
        "createdAt",
      ].join(" ")
    )
    .sort({
      order: 1,
      createdAt: 1,
    });

  return sendSuccess(response, {
    message:
      "Course videos successfully fetched",

    data: {
      course,
      videos,
    },
  });
}

/**
 * Ek single video ki public/student-safe details dega.
 */
export async function getVideo(
  request,
  response
) {
  const video = await Video.findById(
    request.params.videoId
  )
    .select(
      [
        "courseId",
        "title",
        "description",
        "videoUrl",
        "thumbnailUrl",
        "duration",
        "order",
        "summary",
        "topics",
        "processingStatus",
        "createdAt",
      ].join(" ")
    )
    .populate(
      "courseId",
      "title description status"
    );

  if (!video) {
    throw new AppError(
      "Video nahi mila",
      404
    );
  }

  return sendSuccess(response, {
    message: "Video successfully fetched",

    data: {
      video,
    },
  });
}

/**
 * Admin video ka processing status dekhega.
 */
export async function getProcessingStatus(
  request,
  response
) {
  const video = await Video.findById(
    request.params.videoId
  ).select(
    [
      "title",
      "processingStatus",
      "processingError",
      "duration",
      "topics",
      "summary",
      "videoUrl",
      "createdAt",
      "updatedAt",
    ].join(" ")
  );

  if (!video) {
    throw new AppError(
      "Video nahi mila",
      404
    );
  }

  return sendSuccess(response, {
    message:
      "Video processing status fetched",

    data: {
      video,
    },
  });
}

/**
 * Admin video ka title, description aur order update karega.
 */
export async function updateVideo(
  request,
  response
) {
  const { title, description, order } =
    request.body;

  const video = await Video.findById(
    request.params.videoId
  );

  if (!video) {
    throw new AppError(
      "Video nahi mila",
      404
    );
  }

  if (title !== undefined) {
    const cleanTitle = String(title).trim();

    if (cleanTitle.length < 2) {
      throw new AppError(
        "Video title minimum 2 characters ka hona chahiye",
        400
      );
    }

    video.title = cleanTitle;
  }

  if (description !== undefined) {
    video.description =
      String(description).trim();
  }

  if (order !== undefined) {
    const numericOrder = Number(order);

    if (
      !Number.isInteger(numericOrder) ||
      numericOrder < 1
    ) {
      throw new AppError(
        "Video order positive integer hona chahiye",
        400
      );
    }

    video.order = numericOrder;
  }

  await video.save();

  return sendSuccess(response, {
    message: "Video updated successfully",

    data: {
      video,
    },
  });
}

/**
 * Failed/pending video processing ko dobara start karega.
 * Local file na ho to processVideo Cloudinary URL se video download karega.
 */
export async function retryProcessing(
  request,
  response
) {
  const video = await Video.findById(
    request.params.videoId
  ).select("+processingError");

  if (!video) {
    throw new AppError(
      "Video nahi mila",
      404
    );
  }

  if (
    video.processingStatus === "processing"
  ) {
    throw new AppError(
      "Video processing pehle se chal rahi hai",
      409
    );
  }

  const hasLocalVideo = Boolean(
    video.filePath && fs.existsSync(video.filePath)
  );
  const hasCloudinaryVideo = Boolean(video.videoUrl);

  if (!hasLocalVideo && !hasCloudinaryVideo) {
    throw new AppError(
      "Video ka local file aur Cloudinary URL dono available nahi hain. Video ko dobara upload karein.",
      409
    );
  }

  if (typeof request.body?.transcript === "string" && request.body.transcript.trim()) {
    video.transcript = request.body.transcript.trim();
  }

  video.processingStatus = "pending";
  video.processingError = "";

  await video.save();

  setImmediate(() => {
    processVideo(video._id).catch(
      (error) => {
        console.error(
          `Retry processing failed for ${video._id}:`,
          error.message
        );
      }
    );
  });

  return sendSuccess(response, {
    message:
      "Video processing dobara start ho gayi",

    data: {
      videoId: video._id,
      processingStatus: "pending",
    },
  });
}

/**
 * Admin video delete karega.
 *
 * Delete hoga:
 * 1. Cloudinary video
 * 2. Cloudinary thumbnail
 * 3. Local temporary file
 * 4. MongoDB video document
 */
export async function deleteVideo(
  request,
  response
) {
  const video = await Video.findById(
    request.params.videoId
  );

  if (!video) {
    throw new AppError(
      "Video nahi mila",
      404
    );
  }

  /*
   * Pehle Cloudinary video delete karo.
   */
  if (video.cloudinaryPublicId) {
    await deleteCloudinaryAsset(
      video.cloudinaryPublicId,
      video.cloudinaryResourceType || "video"
    );
  }

  /*
   * Thumbnail delete karo.
   */
  if (video.thumbnailPublicId) {
    await deleteCloudinaryAsset(
      video.thumbnailPublicId,
      "image"
    );
  }

  /*
   * Agar local temporary file bachi hai to delete karo.
   */
  removeLocalFile(video.filePath);

  await video.deleteOne();

  return sendSuccess(response, {
    message:
      "Video, thumbnail aur database record successfully delete ho gaye",
  });
}
