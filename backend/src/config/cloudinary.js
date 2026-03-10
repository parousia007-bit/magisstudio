// ─── magis-studio/backend/src/config/cloudinary.js ───────────────────────────
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// ─── Initialize Cloudinary ────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS
});

// ─── Verify connection on startup ─────────────────────────────────────────────
export const verifyCloudinary = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connected:', result.status);
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
  }
};

// ─── Storage Presets ──────────────────────────────────────────────────────────

/**
 * Gear images: product photos, hero shots, detail shots
 * Stored under: magis-studio/gear/{slug}/
 */
const gearImageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `magis-studio/gear/${req.body.slug || 'uncategorized'}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    transformation: [
      { width: 1920, height: 1080, crop: 'limit', quality: 'auto:best' },
      { fetch_format: 'auto' },
    ],
    resource_type: 'image',
    use_filename: true,
    unique_filename: true,
  }),
});

/**
 * Audio files: lossless WAV/FLAC for Laboratorio Sonoro
 * NOTE: Cloudinary handles audio as 'video' resource type
 */
const audioStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `magis-studio/audio/${req.body.album || 'library'}`,
    allowed_formats: ['wav', 'flac', 'mp3', 'aac', 'ogg'],
    resource_type: 'video', // Cloudinary uses 'video' for audio files
    use_filename: true,
    unique_filename: true,
  }),
});

/**
 * Download assets: sample packs, EQ presets, PDFs
 */
const downloadStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `magis-studio/downloads/${req.body.category || 'misc'}`,
    allowed_formats: ['pdf', 'zip', 'rar'],
    resource_type: 'raw', // raw = any file type
    use_filename: true,
    unique_filename: true,
  }),
});

/**
 * Avatar images for user profiles
 */
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `magis-studio/avatars`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good' },
    ],
    resource_type: 'image',
    public_id: `avatar_${req.user._id}`, // Overwrites old avatar
  }),
});

// ─── Multer Middleware Instances ──────────────────────────────────────────────

const fileSizeLimit = (limitMB) => limitMB * 1024 * 1024;

export const uploadGearImage = multer({
  storage: gearImageStorage,
  limits: { fileSize: fileSizeLimit(20), files: 10 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed for gear photos.'), false);
  },
});

export const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: fileSizeLimit(500) }, // 500MB for lossless WAV/FLAC
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac', 'audio/mpeg', 'audio/ogg'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only WAV, FLAC, MP3, or OGG audio files are allowed.'), false);
  },
});

export const uploadDownloadAsset = multer({
  storage: downloadStorage,
  limits: { fileSize: fileSizeLimit(200) },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/zip', 'application/x-rar-compressed', 'application/octet-stream'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only PDF, ZIP, or RAR files are allowed.'), false);
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: fileSizeLimit(5) },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed for avatars.'), false);
  },
});

// ─── Cloudinary Utilities ─────────────────────────────────────────────────────

/**
 * Delete a resource from Cloudinary by public_id
 * @param {string} publicId - The Cloudinary public_id
 * @param {string} resourceType - 'image' | 'video' | 'raw'
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    console.error(`Error deleting ${publicId} from Cloudinary:`, error);
    throw error;
  }
};

/**
 * Generate a signed URL for secure/private asset delivery
 * @param {string} publicId
 * @param {object} options - Transformation options
 */
export const getSignedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    sign_url: true,
    type: 'authenticated',
    ...options,
  });
};

export default cloudinary;
