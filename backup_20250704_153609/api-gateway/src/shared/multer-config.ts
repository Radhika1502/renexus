import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';

// Ensure uploads directory exists
export const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure storage
export const multerStorage = diskStorage({
  destination: (req: Express.Request, file: Express.Multer.File, cb: Function) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req: Express.Request, file: Express.Multer.File, cb: Function) => {
    // Create unique filename with original extension
    const uniqueFilename = `${uuid()}${extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

// Filter files by mime type
export const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: Function) => {
  // Accept images, documents, and common file types
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    'text/plain',
    'text/csv',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

// Configure file size limits (10MB)
export const fileSizeLimit = 10 * 1024 * 1024; // 10MB

// Export default multer options
export const multerOptions = {
  storage: multerStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: fileSizeLimit,
  },
};
