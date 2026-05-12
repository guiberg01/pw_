import { Router } from "express";
import {
  addToCart,
  applyCartCoupon,
  decrementCartItem,
  getCart,
  removeAllCart,
  removeCartCoupon,
  removeCartItemByProduct,
  updateCartItem,
} from "../controllers/cart.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";
import { validateBody, validateParams } from "../middleware/validation.middleware.js";
import {
  addCartItemSchema,
  applyCartCouponSchema,
  cartItemParamsSchema,
  updateCartItemSchema,
} from "../validators/cart.validator.js";

const router = Router();

router.use(optionalAuth);

router.get("/", getCart);
router.post("/items/:productId", validateParams(cartItemParamsSchema), validateBody(addCartItemSchema), addToCart);
router.put(
  "/items/:productId",
  validateParams(cartItemParamsSchema),
  validateBody(updateCartItemSchema),
  updateCartItem,
);
router.put("/items/:productId/decrement", validateParams(cartItemParamsSchema), decrementCartItem);
router.delete("/items/:productId", validateParams(cartItemParamsSchema), removeCartItemByProduct);
router.post("/apply-coupon", validateBody(applyCartCouponSchema), applyCartCoupon);
router.post("/remove-coupon", removeCartCoupon);
router.delete("/all", removeAllCart);

export default router;
