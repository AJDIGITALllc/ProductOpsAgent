import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/products
 * List all products
 */
router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const products = await prisma.product.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON fields
    const formattedProducts = products.map((product) => ({
      ...product,
      description: product.description ? JSON.parse(product.description) : null,
      pricing: product.pricing ? JSON.parse(product.pricing) : null,
      faqs: product.faqs ? JSON.parse(product.faqs) : null,
    }));

    res.json({ products: formattedProducts, total: products.length });
  } catch (error: any) {
    console.error('Products list error:', error);
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
});

/**
 * GET /api/products/:id
 * Get a specific product by ID
 */
router.get('/:id', optionalAuthMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Parse JSON fields
    const formattedProduct = {
      ...product,
      description: product.description ? JSON.parse(product.description) : null,
      pricing: product.pricing ? JSON.parse(product.pricing) : null,
      faqs: product.faqs ? JSON.parse(product.faqs) : null,
    };

    res.json(formattedProduct);
  } catch (error: any) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch product', details: error.message });
  }
});

export { router as productsRouter };
