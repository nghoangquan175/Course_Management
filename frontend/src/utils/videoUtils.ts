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

/**
 * Extracts the public_id from a Cloudinary URL
 */
export const extractPublicId = (url: string | null | undefined): string | null => {
  if (!url || !url.includes('cloudinary.com')) return null;

  try {
    // 1. Split by /upload/, /authenticated/, or /private/
    const match = url.match(/\/(upload|authenticated|private)\/(.+)$/);
    if (!match) return null;

    const afterType = match[2]; // e.g., "v12345/courses/abc/lessons/xyz.mp4" or "s--sig--/v123/courses/..."
    const parts = afterType.split('/');

    let startIndex = 0;

    // Skip signature s--...--
    if (parts[startIndex].startsWith('s--')) {
      startIndex++;
    }

    // Skip transformations and version until we hit the root folder 'courses'
    // Common transformations: w_500, c_fill, sp_auto, t_sp_auto, etc.
    while (startIndex < parts.length) {
      const p = parts[startIndex];
      // Skip if it's a version (v123...)
      if (p.startsWith('v') && !isNaN(Number(p.substring(1)))) {
        startIndex++;
        break; // Public ID starts right after version
      }
      // If we find 'courses', we know the public ID starts here
      if (p === 'courses' || p === 'course_management') {
        break;
      }
      // Otherwise it's likely a transformation or signature segment, skip it
      startIndex++;
    }

    const pathWithExt = parts.slice(startIndex).join('/');
    // Remove extension
    return pathWithExt.replace(/\.[^/.]+$/, '');
  } catch (_e) {
    return null;
  }
};

export const formatDuration = (seconds: number | null | undefined): string => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return '0m 0s';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
};
