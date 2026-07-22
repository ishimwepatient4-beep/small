import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@example.com', password: adminPassword, role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: { name: 'Regular User', email: 'user@example.com', password: userPassword, role: 'USER' },
  });

  const electronics = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: { name: 'Electronics', description: 'Electronic devices and accessories' },
  });
  const groceries = await prisma.category.upsert({
    where: { name: 'Groceries' },
    update: {},
    create: { name: 'Groceries', description: 'Food and household items' },
  });
  const clothing = await prisma.category.upsert({
    where: { name: 'Clothing' },
    update: {},
    create: { name: 'Clothing', description: 'Apparel and accessories' },
  });

  await prisma.product.createMany({
    data: [
      { sku: 'ELEC-001', name: 'Wireless Mouse', purchasePrice: 8.50, sellingPrice: 15.99, stock: 45, minimumStock: 10, unit: 'pcs', categoryId: electronics.id },
      { sku: 'ELEC-002', name: 'USB-C Cable', purchasePrice: 2.00, sellingPrice: 7.99, stock: 120, minimumStock: 20, unit: 'pcs', categoryId: electronics.id },
      { sku: 'ELEC-003', name: 'Bluetooth Speaker', purchasePrice: 15.00, sellingPrice: 34.99, stock: 3, minimumStock: 5, unit: 'pcs', categoryId: electronics.id },
      { sku: 'GROC-001', name: 'Organic Rice (1kg)', purchasePrice: 1.50, sellingPrice: 3.99, stock: 200, minimumStock: 50, unit: 'kg', categoryId: groceries.id },
      { sku: 'GROC-002', name: 'Olive Oil (500ml)', purchasePrice: 4.00, sellingPrice: 9.99, stock: 0, minimumStock: 15, unit: 'pcs', categoryId: groceries.id },
      { sku: 'CLOT-001', name: 'Cotton T-Shirt', purchasePrice: 3.50, sellingPrice: 12.99, stock: 80, minimumStock: 20, unit: 'pcs', categoryId: clothing.id },
      { sku: 'CLOT-002', name: 'Denim Jeans', purchasePrice: 10.00, sellingPrice: 29.99, stock: 2, minimumStock: 10, unit: 'pcs', categoryId: clothing.id },
    ],
    skipDuplicates: true,
  });

  const admin = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
  const product = await prisma.product.findFirst({ where: { sku: 'ELEC-001' } });
  if (admin && product) {
    await prisma.transaction.createMany({
      data: [
        { productId: product.id, transactionType: 'IN', quantity: 50, supplier: 'TechWholesale', createdBy: admin.id },
        { productId: product.id, transactionType: 'OUT', quantity: 5, customer: 'John Doe', createdBy: admin.id },
      ],
      skipDuplicates: true,
    });
  }

  console.log('Seed data created successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
