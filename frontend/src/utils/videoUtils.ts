/**
 * Utility functions for media handling, especially Cloudinary transformations
 */

/**
 * Transforms a standard Cloudinary video URL into an HLS (HTTP Live Streaming) URL
 * using Adaptive Bitrate Streaming (sp_auto).
 */
export const getStreamingUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;
  if (url.endsWith('.m3u8')) return url;

  try {
    // Cloudinary HLS Transformation:
    // Replace '/upload/' with '/upload/sp_auto/' and change extension to '.m3u8'
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;

    const baseUrl = parts[0];
    // Remove existing extension and add .m3u8
    const videoPath = parts[1].replace(/\.[^/.]+$/, '.m3u8');

    return `${baseUrl}/upload/sp_auto/${videoPath}`;
  } catch (_e) {
    return url;
  }
};

export const formatDuration = (seconds: number | null | undefined): string => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return '0m 0s';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
};
