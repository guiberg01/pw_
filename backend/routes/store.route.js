import { Router } from "express";
import {
  allStores,
  createStore,
  createMyStoreStripeOnboardingLink,
  getMyStoreMelhorEnvioStatus,
  getMyStoreStripeConnectStatus,
  postMyStoreStripePayoutDispatch,
  getMyStore,
  getStoreById,
  updateMyStore,
  deleteMyStore,
} from "../controllers/store.controller.js";
import { getMyStoreOrderById, getMyStoreOrders } from "../controllers/storeOrder.controller.js";
import { updateMyStoreOrderStatus } from "../controllers/storeOrderAction.controller.js";
import { getMyStoreProducts, createProductForMyStore } from "../controllers/product.controller.js";
import { isLoggedIn, isSeller } from "../middleware/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validation.middleware.js";
import { createProductSchema } from "../validators/product.validator.js";
import {
  createStoreSchema,
  storeIdParamSchema,
  storeListQuerySchema,
  stripeOnboardingLinkSchema,
  updateMyStoreSchema,
} from "../validators/store.validator.js";
import {
  storeOrderIdParamSchema,
  storeOrderListQuerySchema,
  storeOrderStatusUpdateSchema,
} from "../validators/storeOrder.validator.js";
import { productListQuerySchema } from "../validators/product.validator.js";

const router = Router();

router.post("/", isLoggedIn, validateBody(createStoreSchema), createStore);
router.get("/", validateQuery(storeListQuerySchema), allStores);

router.get("/me", isLoggedIn, getMyStore);
router.put("/me", isLoggedIn, isSeller, validateBody(updateMyStoreSchema), updateMyStore);
router.get("/me/products", isLoggedIn, isSeller, validateQuery(productListQuerySchema), getMyStoreProducts);
router.get("/me/melhorenvio/status", isLoggedIn, isSeller, getMyStoreMelhorEnvioStatus);
router.get("/me/stripe/status", isLoggedIn, isSeller, getMyStoreStripeConnectStatus);
router.post("/me/stripe/payouts/dispatch", isLoggedIn, isSeller, postMyStoreStripePayoutDispatch);
router.get("/me/orders", isLoggedIn, isSeller, validateQuery(storeOrderListQuerySchema), getMyStoreOrders);
router.get("/me/orders/:orderId", isLoggedIn, isSeller, validateParams(storeOrderIdParamSchema), getMyStoreOrderById);
router.patch(
  "/me/orders/:orderId/status",
  isLoggedIn,
  isSeller,
  validateParams(storeOrderIdParamSchema),
  validateBody(storeOrderStatusUpdateSchema),
  updateMyStoreOrderStatus,
);
router.post(
  "/me/stripe/onboarding-link",
  isLoggedIn,
  isSeller,
  validateBody(stripeOnboardingLinkSchema),
  createMyStoreStripeOnboardingLink,
);
router.post("/me/products", isLoggedIn, isSeller, validateBody(createProductSchema), createProductForMyStore);
router.get("/:storeId", validateParams(storeIdParamSchema), getStoreById);
router.delete("/:storeId", isLoggedIn, isSeller, validateParams(storeIdParamSchema), deleteMyStore);

export default router;
