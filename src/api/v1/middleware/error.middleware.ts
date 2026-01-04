import { ZodError } from "zod";

export const errorHandler = (err: any, req: any, res: any, next: any) => {

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.flatten().fieldErrors,
    });
  }

  res.status(err.status || 500).json({
    error: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
