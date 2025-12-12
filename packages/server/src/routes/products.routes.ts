import { Router } from 'express';
import { prisma } from '@product-ops-agent/database';

const router = Router();

// GET /api/products - List all products
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        plans: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    // Parse JSON fields
    const formatted = products.map((product: any) => ({
      ...product,
      pricing: product.pricing ? JSON.parse(product.pricing) : null,
      descriptionBlocks: product.descriptionBlocks
        ? JSON.parse(product.descriptionBlocks)
        : null,
      faqs: product.faqs ? JSON.parse(product.faqs) : null,
      paymentOptions: product.paymentOptions
        ? JSON.parse(product.paymentOptions)
        : null,
    }));

    res.json(formatted);
  } catch (error: any) {
    console.error('Error listing products:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/products/:id - Get product details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        plans: {
          orderBy: { createdAt: 'desc' },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Parse JSON fields
    const formatted = {
      ...product,
      pricing: product.pricing ? JSON.parse(product.pricing) : null,
      descriptionBlocks: product.descriptionBlocks
        ? JSON.parse(product.descriptionBlocks)
        : null,
      faqs: product.faqs ? JSON.parse(product.faqs) : null,
      paymentOptions: product.paymentOptions
        ? JSON.parse(product.paymentOptions)
        : null,
    };

    res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching product:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/products/:id - Delete a draft product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.status === 'published') {
      return res
        .status(400)
        .json({ error: 'Cannot delete published products' });
    }

    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
