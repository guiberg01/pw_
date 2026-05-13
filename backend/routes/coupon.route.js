import { Router } from "express";
import {
  createCoupon,
  deleteCoupon,
  getAllCoupons,
  getAllCouponsForAdmin,
  getCouponById,
  updateCoupon,
} from "../controllers/coupon.controller.js";
import { validateParams, validateBody, validateQuery } from "../middleware/validation.middleware.js";
import {
  couponAdminListQuerySchema,
  couponIdParamsSchema,
  couponListQuerySchema,
  createCouponSchema,
  updateCouponSchema,
} from "../validators/coupon.validator.js";
import { isAdmin, isLoggedIn } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", validateQuery(couponListQuerySchema), getAllCoupons);
router.get("/admin", isLoggedIn, isAdmin, validateQuery(couponAdminListQuerySchema), getAllCouponsForAdmin);
router.get("/:id", validateParams(couponIdParamsSchema), getCouponById);
router.post("/", isLoggedIn, isAdmin, validateBody(createCouponSchema), createCoupon);
router.put(
  "/:id",
  isLoggedIn,
  isAdmin,
  validateParams(couponIdParamsSchema),
  validateBody(updateCouponSchema),
  updateCoupon,
);
router.delete("/:id", isLoggedIn, isAdmin, validateParams(couponIdParamsSchema), deleteCoupon);

export default router;
