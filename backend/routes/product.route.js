import { Router } from "express";
import { allProducts, createProduct } from "../controllers/product.controller.js";
import { isLoggedIn, isAdmin, isSellerOrAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/all", isLoggedIn, isAdmin, allProducts);

router.post("/add", isLoggedIn, isSellerOrAdmin, createProduct);

router.delete("/delete/:id", isLoggedIn, isSellerOrAdmin);

router.put("/update/:id", isLoggedIn, isSellerOrAdmin);

export default router;
