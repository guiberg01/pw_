import { Router } from "express";
import { get } from "mongoose";

const router = Router();

router.get("/", allProducts);

export default router;
