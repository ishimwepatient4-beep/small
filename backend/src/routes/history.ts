import { Router } from 'express';
import { prisma } from '../index';
import { authenticate } from '../utils/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
    const transactionType = req.query.transactionType as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (productId) where.productId = productId;
    if (transactionType && (transactionType === 'IN' || transactionType === 'OUT')) {
      where.transactionType = transactionType;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.000Z');
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { product: true, user: { select: { name: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({ transactions, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
