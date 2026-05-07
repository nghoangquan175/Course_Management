import api from '../utils/api';
import axios from 'axios';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;

export interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

export const cloudinaryService = {
  getSignature: async (folder?: string): Promise<CloudinarySignatureResponse> => {
    const response = await api.get('/cloudinary/signature', {
      params: { folder }
    });
    return response.data;
  },

  uploadImage: async (file: File, folder?: string) => {
    return cloudinaryService.uploadMedia(file, 'image', folder);
  },

  uploadMedia: async (
    file: File, 
    resourceType: 'image' | 'video' | 'raw' = 'image', 
    folder?: string,
    onProgress?: (percent: number) => void,
    preFetchedSignature?: CloudinarySignatureResponse // New optional parameter
  ) => {
    // 1. Get signature from backend or use pre-fetched one
    const { signature, timestamp, folder: targetFolder } = 
      preFetchedSignature || await cloudinaryService.getSignature(folder);

    // 2. Prepare form data for Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', API_KEY);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', targetFolder);

    // 3. Upload to Cloudinary directly
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      }
    );

    return response.data; // Contains secure_url, duration (for video), etc.
  }
};
