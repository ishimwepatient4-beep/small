import { Router } from 'express';
import { prisma } from '../index';
import { authenticate } from '../utils/auth';
import { productValidation } from '../utils/validators';
import { validationResult } from 'express-validator';
import { upload } from '../utils/upload';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ products, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { category: true },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', upload.single('image'), productValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const existing = await prisma.product.findUnique({ where: { sku: req.body.sku } });
    if (existing) return res.status(400).json({ error: 'SKU already exists' });
    const product = await prisma.product.create({
      data: {
        name: req.body.name,
        sku: req.body.sku,
        description: req.body.description,
        purchasePrice: parseFloat(req.body.purchasePrice),
        sellingPrice: parseFloat(req.body.sellingPrice),
        stock: parseInt(req.body.stock) || 0,
        minimumStock: parseInt(req.body.minimumStock) || 0,
        unit: req.body.unit || 'pcs',
        barcode: req.body.barcode,
        image: req.file ? `/uploads/${req.file.filename}` : req.body.image || null,
        categoryId: parseInt(req.body.categoryId),
      },
      include: { category: true },
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', upload.single('image'), productValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const existing = await prisma.product.findFirst({
      where: { sku: req.body.sku, id: { not: parseInt(req.params.id) } },
    });
    if (existing) return res.status(400).json({ error: 'SKU already exists' });
    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name: req.body.name,
        sku: req.body.sku,
        description: req.body.description,
        purchasePrice: parseFloat(req.body.purchasePrice),
        sellingPrice: parseFloat(req.body.sellingPrice),
        minimumStock: parseInt(req.body.minimumStock),
        unit: req.body.unit,
        barcode: req.body.barcode,
        image: req.file ? `/uploads/${req.file.filename}` : req.body.image || null,
        categoryId: parseInt(req.body.categoryId),
      },
      include: { category: true },
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const transactionCount = await prisma.transaction.count({
      where: { productId: parseInt(req.params.id) },
    });
    if (transactionCount > 0) {
      return res.status(400).json({ error: 'Cannot delete product with transaction history' });
    }
    await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
