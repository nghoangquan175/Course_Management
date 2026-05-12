import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';

export const getSignature = (req: Request, res: Response, next: NextFunction) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = (req.query.folder as string) || 'course_management/thumbnails';
    const type = (req.query.type as string) || 'upload';

    const params: any = {
      timestamp,
      folder,
    };

    if (type !== 'upload') {
      params.type = type;
    }

    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);

    res.status(200).json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
      type,
    });
  } catch (error) {
    next(error);
  }
};

export const getSignedUrl = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { publicId, resourceType = 'video', transformation = 'sp_auto' } = req.query;

    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    // Determine transformation based on resource type
    let transformationOptions: any = {};
    if (resourceType === 'video') {
      // Use the explicit transformation array which is most reliable for HLS + signing
      transformationOptions = {
        transformation: [
          { streaming_profile: 'auto' }, // SDK will turn this into sp_auto
        ],
      };
    } else if (transformation && transformation !== 'none') {
      transformationOptions = { transformation };
    }

    const expiry = Math.floor(Date.now() / 1000) + 60;

    const url = cloudinary.url(publicId as string, {
      resource_type: 'video',
      type: 'authenticated',
      sign_url: true,
      transformation: [{ streaming_profile: 'auto' }],
      format: 'm3u8',
      expires_at: expiry,
      secure: true,
      version: undefined,
    });

    res.status(200).json({ url });
  } catch (error) {
    next(error);
  }
};
