import { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/product.service";
import { ProductStatus } from "@repo/types";

export class ProductController {
  // GET /api/products
  static async listProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page,
        limit,
        search,
        categoryId,
        minPrice,
        maxPrice,
        featured,
        sortBy,
      } = req.query;

      const result = await ProductService.listProducts({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        categoryId: categoryId as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        featured: featured === "true" ? true : featured === "false" ? false : undefined,
        sortBy: sortBy as any,
        status: "ACTIVE", // Customers can only list active products
      });

      res.status(200).json({
        success: true,
        message: "Products fetched successfully",
        data: result.products,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/products/:slug
  static async getProductDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.getProductByIdOrSlug(req.params.slug);
      
      // If product is not active and requester is not an administrator
      if (product.status !== "ACTIVE" && (!req.user || req.user.role === "CUSTOMER")) {
        return res.status(403).json({
          success: false,
          message: "Product is not available for public purchasing",
        });
      }

      res.status(200).json({
        success: true,
        message: "Product details fetched successfully",
        data: product,
      });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  // GET /api/categories
  static async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await ProductService.listCategories();
      res.status(200).json({
        success: true,
        message: "Categories fetched successfully",
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }
}
export default ProductController;
