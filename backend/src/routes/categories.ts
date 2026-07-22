import { Router } from 'express';
import { prisma } from '../index';
import { authenticate } from '../utils/auth';
import { categoryValidation } from '../utils/validators';
import { validationResult } from 'express-validator';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { products: true },
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', categoryValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const existing = await prisma.category.findUnique({ where: { name: req.body.name } });
    if (existing) return res.status(400).json({ error: 'Category name already exists' });
    const category = await prisma.category.create({
      data: { name: req.body.name, description: req.body.description },
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', categoryValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const existing = await prisma.category.findFirst({
      where: { name: req.body.name, id: { not: parseInt(req.params.id) } },
    });
    if (existing) return res.status(400).json({ error: 'Category name already exists' });
    const category = await prisma.category.update({
      where: { id: parseInt(req.params.id) },
      data: { name: req.body.name, description: req.body.description },
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const productCount = await prisma.product.count({
      where: { categoryId: parseInt(req.params.id) },
    });
    if (productCount > 0) {
      return res.status(400).json({ error: 'Cannot delete category with products' });
    }
    await prisma.category.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
