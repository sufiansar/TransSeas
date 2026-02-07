import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { ZodError } from "zod";

/**
 * Sanitize error messages for production
 */
const sanitizeError = (error: any) => {
  if (process.env.NODE_ENV === "production") {
    if (error?.code?.startsWith("P")) {
      return { message: "Database operation failed", errorDetails: null };
    }
    if (error instanceof ZodError) {
      return { message: "Validation failed", errorDetails: null };
    }
  }
  return error;
};

/**
 * Global Error Handler
 */
const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("Global Error:", err);

  let statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  let success = false;
  let message = err.message || "Something went wrong!";
  let error: any = err;

  // Zod validation errors
  if (err instanceof ZodError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Validation Error";
    error = err.issues.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    }));
  }

  // Prisma known request errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": // Unique constraint failed
        statusCode = httpStatus.CONFLICT;
        message = `Duplicate field value: ${(err.meta as any)?.target}`;
        error = err.meta;
        break;
      case "P2003": // Foreign key constraint failed
        statusCode = httpStatus.BAD_REQUEST;
        message = "Foreign key constraint failed";
        error = err.meta;
        break;
      case "P2025": // Record not found
        statusCode = httpStatus.NOT_FOUND;
        message = "Record not found";
        error = err.meta;
        break;
      default:
        statusCode = httpStatus.BAD_REQUEST;
        message = `Prisma Error: ${err.code}`;
        error = err.meta;
        break;
    }
  }

  // Prisma validation errors (e.g., missing unique field)
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message =
      "Prisma Validation Error: Missing required unique field (id, email, or username)";
    error = {
      details: err.message,
      hint: "Ensure the 'id', 'email', or 'username' field is provided and not undefined.",
    };
  }

  // Prisma unknown, rust panic, or initialization errors
  else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "Unknown Prisma Error";
    error = err.message;
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "Prisma Rust Panic Error";
    error = err.message;
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "Prisma Initialization Error";
    error = err.message;
  }

  // Other generic errors
  else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
    error = err;
  }

  // Additional check for missing unique field in findUnique (optional)
  if (
    err.message?.includes(
      "Argument `where` of type UserWhereUniqueInput needs at least one of",
    )
  ) {
    statusCode = httpStatus.BAD_REQUEST;
    message =
      "Prisma Validation Error: Missing required unique field (id, email, or username)";
    error = {
      details: err.message,
      hint: "Ensure the 'id', 'email', or 'username' field is provided and not undefined.",
    };
  }

  const sanitizedError = sanitizeError(error);

  res.status(statusCode).json({
    success,
    message,
    error: sanitizedError,
  });
};

export default globalErrorHandler;
