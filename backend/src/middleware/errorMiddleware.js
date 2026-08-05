import multer from "multer";

export function notFound(request, response, next) {
  const error = new Error(
    `API route nahi mili: ${request.originalUrl}`
  );

  response.status(404);

  next(error);
}

export function errorHandler(
  error,
  request,
  response,
  next
) {
  console.error(error);

  let statusCode =
    error.statusCode ||
    (response.statusCode === 200
      ? 500
      : response.statusCode);

  let message =
    error.message || "Internal server error";

  if (error.name === "ValidationError") {
    statusCode = 400;

    message = Object.values(error.errors)
      .map((item) => item.message)
      .join(", ");
  }

  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID";
  }

  if (error.code === 11000) {
    statusCode = 409;

    const field = Object.keys(
      error.keyValue || {}
    )[0];

    message = `${field || "Record"} pehle se maujood hai`;
  }

  if (error instanceof multer.MulterError) {
    statusCode = 400;
    message = error.message;
  }

  response.status(statusCode).json({
    success: false,
    message,
    details: error.details || undefined,
    stack:
      process.env.NODE_ENV === "development"
        ? error.stack
        : undefined,
  });
}