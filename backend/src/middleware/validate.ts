import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Dữ liệu không hợp lệ',
        errors: error.issues.map((issue) => ({
          path: issue.path[1], 
          message: issue.message,
        })),
      });
    }
    return res.status(500).json({ message: 'Lỗi server khi validate' });
  }
};
