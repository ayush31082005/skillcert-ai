import path from "node:path";

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

import { getClientUrls } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import certificateTemplateRoutes from "./routes/certificateTemplateRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import {
  errorHandler,
  notFound,
} from "./middleware/errorMiddleware.js";

const app = express();

const allowedOrigins = getClientUrls();

app.use(
  cors({
    credentials: true,

    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      callback(
        new Error(
          `CORS blocked origin: ${origin}`
        )
      );
    },
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(express.json({
  limit: "10mb",
}));

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

app.use(cookieParser());

app.get("/favicon.ico", (request, response) => {
  response.status(204).end();
});

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(
  "/uploads",
  express.static(
    path.join(process.cwd(), "uploads")
  )
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.get("/api/health", (request, response) => {
  response.status(200).json({
    success: true,
    message: "SkillCert AI backend is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", apiLimiter);

app.use(
  "/api/auth",
  authLimiter,
  authRoutes
);

app.use("/api/courses", courseRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/tests", testRoutes);

app.use(
  "/api/certificate-templates",
  certificateTemplateRoutes
);

app.use(
  "/api/certificates",
  certificateRoutes
);

app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
