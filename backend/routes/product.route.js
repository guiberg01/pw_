import { Router } from "express";
import { allProducts } from "../controllers/product.controller.js";
import { isLoggedIn, isAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", isLoggedIn, isAdmin, allProducts);

//router.post("/add", createProduct);

export default router;
