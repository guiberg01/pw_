import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { createHttpError } from "../helpers/httpError.js";

const MAX_IMAGE_SIZE_MB = Number(process.env.UPLOAD_MAX_IMAGE_MB ?? 5);
const MAX_IMAGE_SIZE_BYTES = Math.max(1, MAX_IMAGE_SIZE_MB) * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const ensureUploadDirectoryExists = async () => {};
export const getUploadDirectoryPath = () => "";

const cloudStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "tanamao_uploads",
    allowed_formats: ["jpg", "png", "jpeg", "webp", "gif"],
  },
});

const imageFileFilter = (req, file, callback) => {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    callback(
      createHttpError(
        "Formato de imagem não suportado",
        400,
        { allowed: [...ALLOWED_IMAGE_MIME_TYPES] },
        "UPLOAD_INVALID_IMAGE_TYPE",
      ),
    );
    return;
  }
  callback(null, true);
};

const imageUpload = multer({
  storage: cloudStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
  },
});

export const singleImageUpload = (fieldName = "image") => {
  const middleware = imageUpload.single(fieldName);

  return (req, res, next) => {
    middleware(req, res, (error) => {
      if (!error) return next();

      if (error?.name === "MulterError" && error?.code === "LIMIT_FILE_SIZE") {
        return next(
          createHttpError(
            `A imagem excede o limite de ${MAX_IMAGE_SIZE_MB}MB`,
            400,
            { maxSizeMb: MAX_IMAGE_SIZE_MB },
            "UPLOAD_FILE_TOO_LARGE",
          ),
        );
      }
      return next(error);
    });
  };
};
