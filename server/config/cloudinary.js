const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Whether Cloudinary credentials are present.
 *
 * Deliberately coerced with `Boolean()`: the raw `&&` chain would evaluate to
 * CLOUDINARY_API_SECRET itself when configured, and exporting that string made
 * every importer hold the secret. All three call sites treat this as a flag, so
 * the coercion changes no behaviour and stops leaking the key.
 */
const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'prepagent',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'docx', 'doc', 'txt'],
    resource_type: 'auto',
  },
});

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const storage = isConfigured ? cloudinaryStorage : localStorage;

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/jpg', 'image/png',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('UNSUPPORTED_FORMAT'), false);
  }
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * Client-facing status for each upload failure this app can produce.
 *
 * multer rejects inside `fileFilter`/`limits` by calling back with a bare Error,
 * which carries no `statusCode`. The global error handler therefore treated a
 * rejected file type as an INTERNAL failure and answered 500 - telling the client
 * the server broke, when in fact their file was simply not allowed. Mapping the
 * known upload errors to real 4xx statuses fixes the status class without
 * loosening a single validation rule: the same MIME allow-list and the same 5 MB
 * cap still reject, they just report the truth.
 *
 * `UNSUPPORTED_FORMAT` arrives as `err.message` (it is constructed by our own
 * fileFilter); the remaining keys are multer's own `err.code` values.
 */
const UPLOAD_ERROR_STATUS = {
  UNSUPPORTED_FORMAT: {
    statusCode: 400,
    message: 'Unsupported file format. Please upload PDF, DOCX, DOC, TXT, or image files.',
  },
  LIMIT_FILE_SIZE: {
    statusCode: 413,
    message: 'File is too large. Maximum size is 5 MB.',
  },
  LIMIT_UNEXPECTED_FILE: {
    statusCode: 400,
    message: 'Unexpected file field.',
  },
  LIMIT_PART_COUNT: { statusCode: 400, message: 'Too many files uploaded.' },
};

/**
 * Wraps a multer middleware so upload rejections become curated 4xx errors.
 * Call sites keep using `upload.single('field')` unchanged.
 *
 * Unrecognised errors are forwarded untouched so genuine server faults still
 * reach the global handler and are sanitised there.
 */
const withUploadErrorMapping = (middleware) => (req, res, next) =>
  middleware(req, res, (err) => {
    if (!err) return next();
    const mapped = UPLOAD_ERROR_STATUS[err.code] || UPLOAD_ERROR_STATUS[err.message];
    if (!mapped) return next(err);
    // Rebuild as a curated error carrying ONLY the safe message. Multer's
    // original error can embed the storage path or driver internals, so it is
    // logged server-side and never forwarded.
    console.error(`[upload] rejected (${err.code || err.message}):`, err.message);
    return next(Object.assign(new Error(mapped.message), { statusCode: mapped.statusCode }));
  });

const upload = {
  single: (field) => withUploadErrorMapping(multerUpload.single(field)),
  array: (field, max) => withUploadErrorMapping(multerUpload.array(field, max)),
};

const getFileUrl = (file) => {
  if (isConfigured) {
    return file.path;
  }
  return `/uploads/${file.filename}`;
};

module.exports = { upload, getFileUrl, isConfigured };