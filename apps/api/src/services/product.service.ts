import { db } from "../config/database";
import { slugify } from "../utils/slugify";
import { ProductStatus } from "@repo/types";

export interface ProductFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  sortBy?: "price_asc" | "price_desc" | "newest" | "name_asc";
  status?: ProductStatus;
}

export class ProductService {
  // Create product
  static async createProduct(data: {
    name: string;
    description: string;
    shortDesc?: string;
    price: number;
    comparePrice?: number;
    categoryId: string;
    images?: string[];
    digitalAsset?: string;
    stock: number;
    sku?: string;
    status?: ProductStatus;
    featured?: boolean;
    tags?: string[];
    metadata?: any;
  }) {
    const slug = slugify(data.name) + "-" + Math.round(Math.random() * 1000);
    
    // Check if category exists
    const category = await db.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      throw new Error("Specified Category does not exist");
    }

    return db.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        shortDesc: data.shortDesc,
        price: data.price,
        comparePrice: data.comparePrice,
        categoryId: data.categoryId,
        images: data.images || [],
        digitalAsset: data.digitalAsset,
        stock: data.stock,
        sku: data.sku,
        status: data.status || "DRAFT",
        featured: data.featured || false,
        tags: data.tags || [],
        metadata: data.metadata || {},
      },
      include: {
        category: true,
      },
    });
  }

  // Update product
  static async updateProduct(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      shortDesc: string;
      price: number;
      comparePrice: number;
      categoryId: string;
      images: string[];
      digitalAsset: string;
      stock: number;
      sku: string;
      status: ProductStatus;
      featured: boolean;
      tags: string[];
      metadata: any;
    }>
  ) {
    const product = await db.product.findUnique({ where: { id } });
    if (!product) {
      throw new Error("Product not found");
    }

    const updateData: any = { ...data };
    if (data.name && data.name !== product.name) {
      updateData.slug = slugify(data.name) + "-" + Math.round(Math.random() * 1000);
    }

    return db.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });
  }

  // Get single product by ID or Slug
  static async getProductByIdOrSlug(identifier: string) {
    const product = await db.product.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        category: true,
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  }

  // List all products with advanced filters
  static async listProducts(filter: ProductFilterQuery) {
    const page = Math.max(1, Number(filter.page || 1));
    const limit = Math.max(1, Math.min(50, Number(filter.limit || 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by search string
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: "insensitive" } },
        { description: { contains: filter.search, mode: "insensitive" } },
        { tags: { has: filter.search.toLowerCase() } },
        { sku: { contains: filter.search, mode: "insensitive" } },
      ];
    }

    // Filter by Category
    if (filter.categoryId) {
      where.categoryId = filter.categoryId;
    }

    // Filter by Price range
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.price = {};
      if (filter.minPrice !== undefined) {
        where.price.gte = filter.minPrice;
      }
      if (filter.maxPrice !== undefined) {
        where.price.lte = filter.maxPrice;
      }
    }

    // Filter by Featured status
    if (filter.featured !== undefined) {
      where.featured = filter.featured;
    }

    // Status filter (customers only see ACTIVE)
    if (filter.status) {
      where.status = filter.status;
    } else {
      where.status = "ACTIVE";
    }

    // Sorting options
    let orderBy: any = { createdAt: "desc" };
    if (filter.sortBy) {
      switch (filter.sortBy) {
        case "price_asc":
          orderBy = { price: "asc" };
          break;
        case "price_desc":
          orderBy = { price: "desc" };
          break;
        case "newest":
          orderBy = { createdAt: "desc" };
          break;
        case "name_asc":
          orderBy = { name: "asc" };
          break;
      }
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      db.product.count({ where }),
    ]);

    return { products, total, page, limit };
  }

  // Delete product (hard or soft via status)
  static async deleteProduct(id: string) {
    const product = await db.product.findUnique({ where: { id } });
    if (!product) {
      throw new Error("Product not found");
    }

    // Soft delete by archiving to keep database foreign integrity
    return db.product.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  }

  // Category Tree creation and listing
  static async createCategory(data: { name: string; description?: string; image?: string; parentId?: string }) {
    const slug = slugify(data.name);
    
    // Check if duplicate slug exists
    const duplicate = await db.category.findUnique({ where: { slug } });
    if (duplicate) {
      throw new Error("Category with a similar name already exists");
    }

    return db.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        image: data.image,
        parentId: data.parentId || null,
      },
    });
  }

  static async listCategories() {
    return db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });
  }
}
export default ProductService;
