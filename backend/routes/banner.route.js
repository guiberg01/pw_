import { Router } from "express";
import { isAdmin, isLoggedIn } from "../middleware/auth.middleware.js";
import {
  createBanner,
  deleteBanner,
  getAllBanners,
  getBannerById,
  getPublicBanners,
  updateBanner,
} from "../controllers/banner.controller.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validation.middleware.js";
import {
  createBannerSchema,
  updateBannerSchema,
  bannerParamsSchema,
  listBannersQuerySchema,
} from "../validators/banner.validator.js";

const router = Router();

router.get("/", validateQuery(listBannersQuerySchema), getPublicBanners);
router.get("/admin", isLoggedIn, isAdmin, validateQuery(listBannersQuerySchema), getAllBanners);
router.get("/:id", isLoggedIn, isAdmin, validateParams(bannerParamsSchema), getBannerById);
router.post("/", isLoggedIn, isAdmin, validateBody(createBannerSchema), createBanner);
router.put(
  "/:id",
  isLoggedIn,
  isAdmin,
  validateParams(bannerParamsSchema),
  validateBody(updateBannerSchema),
  updateBanner,
);
router.delete("/:id", isLoggedIn, isAdmin, validateParams(bannerParamsSchema), deleteBanner);

export default router;
