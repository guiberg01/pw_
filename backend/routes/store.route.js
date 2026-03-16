import { Router } from "express";
import { createStore, getMyStore, getStoreById, updateMyStore } from "../controllers/store.controller.js";
import { isLoggedIn, isSellerOrAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", isLoggedIn, isSellerOrAdmin, createStore);
router.get("/me", isLoggedIn, isSellerOrAdmin, getMyStore);
router.put("/me", isLoggedIn, isSellerOrAdmin, updateMyStore);
router.get("/:storeId", getStoreById);

export default router;
