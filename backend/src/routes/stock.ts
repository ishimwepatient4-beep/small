import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../utils/auth';
import { stockInValidation, stockOutValidation } from '../utils/validators';
import { validationResult } from 'express-validator';

const router = Router();
router.use(authenticate);

router.post('/in', stockInValidation, async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { productId, quantity, supplier, notes } = req.body;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const [updatedProduct, transaction] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } },
      }),
      prisma.transaction.create({
        data: {
          productId,
          transactionType: 'IN',
          quantity,
          supplier: supplier || null,
          notes: notes || null,
          createdBy: req.userId!,
        },
      }),
    ]);

    res.status(201).json({ product: updatedProduct, transaction });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/out', stockOutValidation, async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { productId, quantity, customer, notes } = req.body;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const [updatedProduct, transaction] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } },
      }),
      prisma.transaction.create({
        data: {
          productId,
          transactionType: 'OUT',
          quantity,
          customer: customer || null,
          notes: notes || null,
          createdBy: req.userId!,
        },
      }),
    ]);

    res.status(201).json({ product: updatedProduct, transaction });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
