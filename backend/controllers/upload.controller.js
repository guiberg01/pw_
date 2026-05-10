import { sendSuccess } from "../helpers/successResponse.js";
import {
  authorizeUploadByContext as authorizeUploadByContextService,
  buildUploadImageResponse,
} from "../services/upload.service.js";

export const authorizeUploadByContext = async (req, res, next) => {
  await authorizeUploadByContextService(req);
  return next();
};

export const uploadImageByContext = async (req, res, next) => {
  const response = buildUploadImageResponse({ req, file: req.file });

  return sendSuccess(res, 201, "Imagem enviada com sucesso", response);
};
