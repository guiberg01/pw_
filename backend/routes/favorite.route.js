import { Router } from "express";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import { validateParams, validateQuery } from "../middleware/validation.middleware.js";
import { favoriteListQuerySchema, favoriteProductIdParamSchema } from "../validators/favorite.validator.js";
import { getMyFavorites, removeMyFavorite, toggleMyFavorite } from "../controllers/favorite.controller.js";

const router = Router();

router.use(isLoggedIn);

router.get("/me", validateQuery(favoriteListQuerySchema), getMyFavorites);
router.patch("/me/:productId/toggle", validateParams(favoriteProductIdParamSchema), toggleMyFavorite);
router.delete("/me/:productId", validateParams(favoriteProductIdParamSchema), removeMyFavorite);

export default router;
