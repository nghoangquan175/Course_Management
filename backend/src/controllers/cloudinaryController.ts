import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';

export const getSignature = (req: Request, res: Response, next: NextFunction) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = req.query.folder as string || 'course_management/thumbnails';
    
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    res.status(200).json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
    });
  } catch (error) {
    next(error);
  }
};
