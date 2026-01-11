import { ZodError } from "zod";
import { HTTP_STATUS } from "../../../constants/httpStatus";

export const errorHandler = (err: any, req: any, res: any, next: any) => {

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.flatten().fieldErrors,
    });
  }

  res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
