CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');
CREATE TYPE "TransactionType" AS ENUM ('IN', 'OUT');

CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "purchase_price" DECIMAL(10,2) NOT NULL,
    "selling_price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minimum_stock" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "barcode" TEXT,
    "image" TEXT,
    "category_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_transactions" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "supplier" TEXT,
    "customer" TEXT,
    "notes" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO users (name, email, password, role, updated_at) VALUES
  ('Admin', 'admin@example.com', '$2a$10$zbofsSFgDJaIN/JKDA1kOO2Lrv5JlhQ6Nrppv7PBqzNMAN14sAeE2', 'ADMIN', CURRENT_TIMESTAMP),
  ('User', 'user@example.com', '$2a$10$NlLhZ5KbwqdLZsB/Vz88DeHpc8L52/N8YjkZsoVkxaVZ11R9irAke', 'USER', CURRENT_TIMESTAMP);

INSERT INTO categories (name, description, updated_at) VALUES
  ('Electronics', 'Electronic devices and gadgets', CURRENT_TIMESTAMP),
  ('Groceries', 'Food and household items', CURRENT_TIMESTAMP),
  ('Clothing', 'Apparel and accessories', CURRENT_TIMESTAMP);

INSERT INTO products (sku, name, description, purchase_price, selling_price, stock, minimum_stock, unit, category_id, updated_at) VALUES
  ('ELEC-001', 'Wireless Mouse', 'Ergonomic wireless mouse', 15.00, 29.99, 50, 10, 'pcs', 1, CURRENT_TIMESTAMP),
  ('ELEC-002', 'USB-C Cable', '1.5m braided USB-C cable', 3.00, 9.99, 200, 20, 'pcs', 1, CURRENT_TIMESTAMP),
  ('ELEC-003', 'Bluetooth Speaker', 'Portable waterproof speaker', 25.00, 49.99, 30, 5, 'pcs', 1, CURRENT_TIMESTAMP),
  ('GROC-001', 'Rice 5kg', 'Premium long grain rice', 8.00, 12.99, 100, 15, 'kg', 2, CURRENT_TIMESTAMP),
  ('GROC-002', 'Olive Oil 1L', 'Extra virgin olive oil', 6.00, 11.99, 75, 10, 'liters', 2, CURRENT_TIMESTAMP),
  ('CLTH-001', 'Cotton T-Shirt', 'Plain cotton t-shirt', 5.00, 14.99, 120, 20, 'pcs', 3, CURRENT_TIMESTAMP),
  ('CLTH-002', 'Denim Jeans', 'Classic fit denim jeans', 18.00, 39.99, 45, 10, 'pcs', 3, CURRENT_TIMESTAMP);

INSERT INTO inventory_transactions (product_id, transaction_type, quantity, supplier, customer, notes, created_by) VALUES
  (1, 'IN', 50, 'Tech Supplies Co.', NULL, 'Initial stock', 1),
  (4, 'IN', 100, 'Farm Direct', NULL, 'Weekly restock', 1);
