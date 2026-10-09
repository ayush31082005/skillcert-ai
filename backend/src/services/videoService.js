import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

import Video from "../models/Video.js";

import {
  analyzeTranscript,
  transcribeAudio,
} from "./llmService.js";

import {
  removeLocalFile,
} from "./cloudinaryService.js";

const execFileAsync = promisify(execFile);

const tempRootDirectory = path.join(
  process.cwd(),
  "uploads",
  "temp"
);

fs.mkdirSync(tempRootDirectory, {
  recursive: true,
});

/**
 * FFmpeg aur FFprobe binary paths verify karta hai.
 */
function ensureMediaBinaries() {
  if (!ffmpegPath) {
    throw new Error(
      "FFmpeg binary nahi mili. ffmpeg-static install karo."
    );
  }

  if (!ffprobeStatic?.path) {
    throw new Error(
      "FFprobe binary nahi mili. ffprobe-static install karo."
    );
  }
}

/**
 * File ka extension Cloudinary URL se nikalta hai.
 */
function getRemoteFileExtension(url) {
  try {
    const pathname = new URL(url).pathname;

    const extension = path.extname(pathname);

    return extension || ".mp4";
  } catch {
    return ".mp4";
  }
}

/**
 * Cloudinary video ko temporary local file me download karta hai.
 *
 * Ye tab use hoga jab:
 * - local Multer file delete ho chuki ho
 * - processing dobara retry karni ho
 */
async function downloadRemoteVideo(
  videoUrl,
  destinationPath
) {
  if (!videoUrl) {
    throw new Error(
      "Cloudinary video URL available nahi hai"
    );
  }

  const response = await fetch(videoUrl);

  if (!response.ok) {
    throw new Error(
      `Cloudinary video download failed: ${response.status}`
    );
  }

  if (!response.body) {
    throw new Error(
      "Cloudinary response me video stream nahi mili"
    );
  }

  const nodeReadableStream =
    Readable.fromWeb(response.body);

  const fileWriteStream =
    fs.createWriteStream(destinationPath);

  await pipeline(
    nodeReadableStream,
    fileWriteStream
  );

  return destinationPath;
}

/**
 * FFprobe se video duration seconds me nikalta hai.
 */
async function getVideoDuration(videoPath) {
  ensureMediaBinaries();

  const { stdout } = await execFileAsync(
    ffprobeStatic.path,
    [
      "-v",
      "error",

      "-show_entries",
      "format=duration",

      "-of",
      "default=noprint_wrappers=1:nokey=1",

      videoPath,
    ],
    {
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true,
    }
  );

  const duration = Number(
    String(stdout).trim()
  );

  if (
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    throw new Error(
      "Video duration detect nahi hui"
    );
  }

  return duration;
}

async function hasAudioStream(videoPath) {
  ensureMediaBinaries();

  const { stdout } = await execFileAsync(
    ffprobeStatic.path,
    [
      "-v", "error",
      "-select_streams", "a:0",
      "-show_entries", "stream=index",
      "-of", "csv=p=0",
      videoPath,
    ],
    { maxBuffer: 10 * 1024 * 1024, windowsHide: true }
  );

  return Boolean(String(stdout).trim());
}

/**
 * Video audio ko chhote MP3 chunks me convert karta hai.
 *
 * Har chunk lagbhag 20 minute ka hoga.
 * Isse lambi video ki transcription easy hogi.
 */
async function extractAudioChunks(
  videoPath,
  jobDirectory
) {
  ensureMediaBinaries();

  const outputPattern = path.join(
    jobDirectory,
    "audio-%03d.mp3"
  );

  await execFileAsync(
    ffmpegPath,
    [
      "-y",

      "-i",
      videoPath,

      /*
       * First audio track select karo.
       * ? ka matlab audio absent hone par FFmpeg
       * immediately map error na de.
       */
      "-map",
      "0:a:0?",

      "-vn",

      /*
       * Speech transcription ke liye mono audio.
       */
      "-ac",
      "1",

      /*
       * Speech ke liye 16 kHz sample rate.
       */
      "-ar",
      "16000",

      "-c:a",
      "libmp3lame",

      "-b:a",
      "48k",

      /*
       * Audio ko multiple files me divide karo.
       */
      "-f",
      "segment",

      /*
       * 1200 seconds = 20 minutes.
       */
      "-segment_time",
      "1200",

      "-reset_timestamps",
      "1",

      outputPattern,
    ],
    {
      maxBuffer: 50 * 1024 * 1024,
      windowsHide: true,
    }
  );

  const audioFiles = fs
    .readdirSync(jobDirectory)
    .filter(
      (fileName) =>
        fileName.startsWith("audio-") &&
        fileName.endsWith(".mp3")
    )
    .sort()
    .map((fileName) =>
      path.join(jobDirectory, fileName)
    );

  if (audioFiles.length === 0) {
    throw new Error(
      "Video me audio track nahi mili"
    );
  }

  return audioFiles;
}

/**
 * Saare audio chunks ko ek-ek karke transcribe karta hai.
 */
async function transcribeAudioChunks(
  audioFiles
) {
  const transcriptParts = [];

  for (
    let index = 0;
    index < audioFiles.length;
    index += 1
  ) {
    const audioFile = audioFiles[index];

    console.log(
      `Transcribing audio chunk ${index + 1}/${audioFiles.length}`
    );

    const transcript =
      await transcribeAudio(audioFile);

    if (
      transcript &&
      typeof transcript === "string"
    ) {
      transcriptParts.push(
        transcript.trim()
      );
    }
  }

  const completeTranscript =
    transcriptParts
      .filter(Boolean)
      .join("\n\n");

  if (!completeTranscript) {
    throw new Error(
      "Video transcript empty generate hui"
    );
  }

  return completeTranscript;
}

/**
 * Video ke liye usable local source file return karta hai.
 *
 * Priority:
 * 1. Multer wali existing local file
 * 2. Cloudinary video download
 */
async function resolveLocalVideoPath(
  video,
  jobDirectory
) {
  if (
    video.filePath &&
    fs.existsSync(video.filePath)
  ) {
    return {
      filePath: video.filePath,
      downloadedFromCloudinary: false,
    };
  }

  const extension =
    getRemoteFileExtension(video.videoUrl);

  const downloadedPath = path.join(
    jobDirectory,
    `source-video${extension}`
  );

  await downloadRemoteVideo(
    video.videoUrl,
    downloadedPath
  );

  return {
    filePath: downloadedPath,
    downloadedFromCloudinary: true,
  };
}

/**
 * Video processing ka complete flow:
 *
 * 1. Video processing status update
 * 2. Local file ya Cloudinary video resolve
 * 3. Duration detect
 * 4. Audio chunks extract
 * 5. Speech-to-text transcript
 * 6. Transcript MongoDB me save
 * 7. LLM summary aur topics generate
 * 8. Processing complete
 * 9. Temporary files delete
 */
export async function processVideo(videoId) {
  const video = await Video.findById(
    videoId
  ).select(
    "+transcript +processingError"
  );

  if (!video) {
    throw new Error("Video nahi mila");
  }

  video.processingStatus = "processing";
  video.processingError = "";

  await video.save();

  const jobDirectory = path.join(
    tempRootDirectory,
    `video-${video._id}-${Date.now()}`
  );

  fs.mkdirSync(jobDirectory, {
    recursive: true,
  });

  let originalLocalFilePath = "";
  let transcript =
    typeof video.transcript === "string"
      ? video.transcript.trim()
      : "";

  try {
    /*
     * Transcript pehle se available hai to
     * video dobara transcribe nahi karenge.
     */
    if (!transcript) {
      const localVideo =
        await resolveLocalVideoPath(
          video,
          jobDirectory
        );

      const sourceVideoPath =
        localVideo.filePath;

      if (
        !localVideo.downloadedFromCloudinary
      ) {
        originalLocalFilePath =
          sourceVideoPath;
      }

      const duration =
        await getVideoDuration(
          sourceVideoPath
        );

      if (!(await hasAudioStream(sourceVideoPath))) {
        throw new Error(
          "Is video mein audio track nahi hai. Upload ke waqt lesson transcript add karein, phir AI processing retry karein."
        );
      }

      const audioFiles =
        await extractAudioChunks(
          sourceVideoPath,
          jobDirectory
        );

      transcript =
        await transcribeAudioChunks(
          audioFiles
        );

      /*
       * Transcript pehle save kar do.
       *
       * Agar summary/topics analysis fail ho jaye,
       * to retry par video dobara transcribe
       * nahi karni padegi.
       */
      video.duration = duration;
      video.transcript = transcript;
      video.processingStatus = "processing";
      video.processingError = "";

      /*
       * Transcription complete hone ke baad original
       * Multer local video delete ki ja sakti hai.
       */
      if (originalLocalFilePath) {
        removeLocalFile(
          originalLocalFilePath
        );

        video.filePath = "";
      }

      await video.save();
    }

    /*
     * Transcript ko LLM se analyze karke
     * summary aur topics generate karo.
     */
    const analysis =
      await analyzeTranscript(transcript);

    video.summary =
      typeof analysis?.summary === "string"
        ? analysis.summary
        : "";

    video.topics =
      Array.isArray(analysis?.topics)
        ? analysis.topics
            .filter(
              (topic) =>
                typeof topic === "string"
            )
            .map((topic) => topic.trim())
            .filter(Boolean)
            .slice(0, 30)
        : [];

    if (video.topics.length === 0) {
      throw new Error(
        "AI ne transcript se topics generate nahi kiye. Generate topics action se dobara try karein."
      );
    }

    video.processingStatus = "completed";
    video.processingError = "";

    /*
     * Agar local file abhi bhi stored hai to
     * processing complete hone ke baad delete karo.
     */
    if (
      video.filePath &&
      fs.existsSync(video.filePath)
    ) {
      removeLocalFile(video.filePath);
      video.filePath = "";
    }

    await video.save();

    console.log(
      `Video processing completed: ${video._id}`
    );

    return video;
  } catch (error) {
    console.error(
      `Video processing failed for ${video._id}:`,
      error
    );

    video.processingStatus = "failed";
    video.processingError =
      error.message ||
      "Unknown video processing error";

    /*
     * Transcription fail hui hai to original Multer
     * video ko delete nahi karenge.
     * Admin retry kar sakta hai.
     *
     * Agar transcript already save ho chuki hai,
     * local video ki zarurat nahi hai.
     */
    if (
      video.transcript &&
      video.filePath &&
      fs.existsSync(video.filePath)
    ) {
      removeLocalFile(video.filePath);
      video.filePath = "";
    }

    await video.save().catch(
      (saveError) => {
        console.error(
          "Video failure status save nahi hua:",
          saveError.message
        );
      }
    );

    throw error;
  } finally {
    /*
     * Audio chunks aur Cloudinary se downloaded
     * temporary video delete karo.
     */
    try {
      fs.rmSync(jobDirectory, {
        recursive: true,
        force: true,
      });
    } catch (cleanupError) {
      console.error(
        "Video temporary folder cleanup failed:",
        cleanupError.message
      );
    }
  }
}
