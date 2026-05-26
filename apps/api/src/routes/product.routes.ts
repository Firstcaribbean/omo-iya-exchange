import { Router } from "express";
import { ProductController } from "../controllers/product.controller";

const router = Router();

router.get("/", ProductController.listProducts);
router.get("/categories", ProductController.listCategories);
router.get("/:slug", ProductController.getProductDetail);

export default router;
