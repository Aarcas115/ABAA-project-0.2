/**
 * File type detection utility for Phase 3 (Video/Audio-to-Transcript Pipeline)
 * 
 * Detects file types using MIME type check as primary method,
 * with file extension as fallback.
 * 
 * @returns {string} 'text', 'audio', or 'video'
 * @throws {Error} For unsupported file types
 */

// Supported MIME types for audio files
const AUDIO_MIME_TYPES = [
  'audio/mpeg',      // .mp3
  'audio/wav',       // .wav
  'audio/mp4',       // .m4a
  'audio/ogg',       // .ogg
  'audio/flac',      // .flac
]

// Supported MIME types for video files
const VIDEO_MIME_TYPES = [
  'video/mp4',       // .mp4
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
  'video/x-matroska',// .mkv
  'video/webm',      // .webm
]

// Supported file extensions (lowercase, with dot)
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg', '.flac']
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm']

/**
 * Detects the type of a file based on its MIME type or extension
 * 
 * @param {File} file - The file object to detect
 * @returns {string} 'text', 'audio', or 'video'
 * @throws {Error} If file type is not supported
 */
export function detectFileType(file) {
  if (!file) {
    return 'text'
  }

  // Check MIME type first (primary method)
  const mimeType = file.type.toLowerCase()
  
  if (AUDIO_MIME_TYPES.includes(mimeType)) {
    return 'audio'
  }
  
  if (VIDEO_MIME_TYPES.includes(mimeType)) {
    return 'video'
  }

  // Fallback to file extension check
  const fileName = file.name.toLowerCase()
  const extension = fileName.substring(fileName.lastIndexOf('.'))
  
  if (AUDIO_EXTENSIONS.includes(extension)) {
    return 'audio'
  }
  
  if (VIDEO_EXTENSIONS.includes(extension)) {
    return 'video'
  }

  // If we reach here, the file type is not supported
  throw new Error(`Unsupported file type: ${mimeType || file.name}`)
}

/**
 * Checks if a file is a supported audio file
 * 
 * @param {File} file - The file to check
 * @returns {boolean}
 */
export function isAudioFile(file) {
  try {
    return detectFileType(file) === 'audio'
  } catch {
    return false
  }
}

/**
 * Checks if a file is a supported video file
 * 
 * @param {File} file - The file to check
 * @returns {boolean}
 */
export function isVideoFile(file) {
  try {
    return detectFileType(file) === 'video'
  } catch {
    return false
  }
}

/**
 * Gets the maximum file size limit in bytes
 * Groq API has a 25MB limit
 * 
 * @returns {number} Maximum file size in bytes (25MB)
 */
export function getMaxFileSize() {
  return 25 * 1024 * 1024 // 25MB in bytes
}

/**
 * Checks if a file is within the size limit
 * 
 * @param {File} file - The file to check
 * @returns {boolean}
 */
export function isFileSizeValid(file) {
  return file.size <= getMaxFileSize()
}
