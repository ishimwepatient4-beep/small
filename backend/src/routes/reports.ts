import { Router } from 'express';
import { prisma } from '../index';
import { authenticate } from '../utils/auth';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

const router = Router();
router.use(authenticate);

router.get('/current-inventory', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/stock-movement', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date((endDate as string) + 'T23:59:59.000Z');
    }
    const transactions = await prisma.transaction.findMany({
      where,
      include: { product: true, user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/low-stock', async (req, res) => {
  try {
    const products = await prisma.$queryRawUnsafe<any[]>(
      `SELECT p.*, c.name as "categoryName" FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.stock <= p.minimum_stock ORDER BY p.stock ASC`
    );
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/export/pdf/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text(`${type.replace(/-/g, ' ').toUpperCase()} REPORT`, { align: 'center' });
    doc.moveDown();

    if (type === 'current-inventory') {
      const products = await prisma.product.findMany({ include: { category: true }, orderBy: { name: 'asc' } });
      doc.fontSize(10).text('Name | SKU | Category | Stock | Price', { underline: true });
      doc.moveDown(0.5);
      products.forEach(p => {
        doc.fontSize(9).text(`${p.name} | ${p.sku} | ${p.category.name} | ${p.stock} ${p.unit} | $${p.sellingPrice}`);
      });
    } else if (type === 'low-stock') {
      const products = await prisma.$queryRawUnsafe<any[]>(
        `SELECT p.*, c.name as "categoryName" FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.stock <= p.minimum_stock ORDER BY p.stock ASC`
      );
      doc.fontSize(10).text('Name | SKU | Stock | Min Stock', { underline: true });
      doc.moveDown(0.5);
      products.forEach(p => {
        doc.fontSize(9).text(`${p.name} | ${p.sku} | ${p.stock} | ${p.minimum_stock}`);
      });
    } else if (type === 'stock-movement') {
      const transactions = await prisma.transaction.findMany({
        include: { product: true, user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      doc.fontSize(10).text('Date | Product | Type | Quantity | User | Notes', { underline: true });
      doc.moveDown(0.5);
      transactions.forEach(t => {
        const date = new Date(t.createdAt).toLocaleDateString();
        doc.fontSize(9).text(`${date} | ${t.product.name} | ${t.transactionType} | ${t.quantity} | ${t.user.name} | ${t.notes || ''}`);
      });
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/export/excel/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');

    if (type === 'current-inventory') {
      const products = await prisma.product.findMany({ include: { category: true }, orderBy: { name: 'asc' } });
      sheet.columns = [
        { header: 'Name', key: 'name', width: 25 },
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Stock', key: 'stock', width: 10 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Purchase Price', key: 'purchasePrice', width: 15 },
        { header: 'Selling Price', key: 'sellingPrice', width: 15 },
      ];
      products.forEach(p => sheet.addRow({
        name: p.name, sku: p.sku, category: p.category.name,
        stock: p.stock, unit: p.unit,
        purchasePrice: Number(p.purchasePrice), sellingPrice: Number(p.sellingPrice),
      }));
    } else if (type === 'low-stock') {
      const products = await prisma.$queryRawUnsafe<any[]>(
        `SELECT p.*, c.name as "categoryName" FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.stock <= p.minimum_stock ORDER BY p.stock ASC`
      );
      sheet.columns = [
        { header: 'Name', key: 'name', width: 25 },
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Stock', key: 'stock', width: 10 },
        { header: 'Min Stock', key: 'minimum_stock', width: 10 },
      ];
      products.forEach(p => sheet.addRow({ name: p.name, sku: p.sku, stock: p.stock, minimum_stock: p.minimum_stock }));
    } else if (type === 'stock-movement') {
      const transactions = await prisma.transaction.findMany({ include: { product: true, user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
      sheet.columns = [
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Product', key: 'product', width: 25 },
        { header: 'Type', key: 'type', width: 10 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'User', key: 'user', width: 20 },
        { header: 'Notes', key: 'notes', width: 30 },
      ];
      transactions.forEach(t => sheet.addRow({
        date: t.createdAt, product: t.product.name, type: t.transactionType,
        quantity: t.quantity, user: t.user.name, notes: t.notes || '',
      }));
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
