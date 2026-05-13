import { Router } from "express";
import { getMyOrderById, getMyOrders, cancelMyOrder, confirmMyOrderReceipt } from "../controllers/order.controller.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validation.middleware.js";
import { confirmOrderReceiptSchema, orderIdParamSchema, orderListQuerySchema } from "../validators/order.validator.js";

const router = Router();

router.use(isLoggedIn);

router.get("/me", validateQuery(orderListQuerySchema), getMyOrders);
router.get("/:id", validateParams(orderIdParamSchema), getMyOrderById);
router.post("/:id/cancel", validateParams(orderIdParamSchema), cancelMyOrder);
router.post(
  "/:id/received",
  validateParams(orderIdParamSchema),
  validateBody(confirmOrderReceiptSchema),
  confirmMyOrderReceipt,
);

export default router;
