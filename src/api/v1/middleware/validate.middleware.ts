// src/middlewares/validate.ts
import { ZodObject } from "zod";

export const validate =
  (schema: ZodObject<any>) => (req: any, res: any, next: any) => {
    try {
      schema.parse(req);
      next();
    } catch (error) {
      next(error);
    }
  };
