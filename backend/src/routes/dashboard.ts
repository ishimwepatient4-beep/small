import { Router } from 'express';
import { prisma } from '../index';
import { authenticate } from '../utils/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const [totalProducts, totalStock, outOfStockItems, recentTransactions, lowStock] = await Promise.all([
      prisma.product.count(),
      prisma.product.aggregate({ _sum: { stock: true } }),
      prisma.product.count({ where: { stock: 0 } }),
      prisma.transaction.findMany({
        include: { product: true, user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*) as count FROM products WHERE stock > 0 AND stock <= minimum_stock`
      ),
    ]);

    res.json({
      totalProducts,
      totalStock: totalStock._sum.stock || 0,
      lowStockItems: Number(lowStock[0]?.count || 0),
      outOfStockItems,
      recentTransactions,
    });
  } catch (error: any) {
    console.error('Dashboard error:', error.message);
    res.status(500).json({ error: 'Server error', detail: error.message });
  }
});

export default router;
