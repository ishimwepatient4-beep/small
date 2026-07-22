import { body, query, param } from 'express-validator';

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

export const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const productValidation = [
  body('name').notEmpty().withMessage('Product name required'),
  body('sku').notEmpty().withMessage('SKU required'),
  body('categoryId').isInt().withMessage('Valid category required'),
  body('purchasePrice').isFloat({ min: 0 }).withMessage('Valid purchase price required'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Valid selling price required'),
  body('minimumStock').isInt({ min: 0 }).withMessage('Minimum stock must be non-negative'),
];

export const categoryValidation = [
  body('name').notEmpty().withMessage('Category name required'),
];

export const stockInValidation = [
  body('productId').isInt().withMessage('Valid product required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

export const stockOutValidation = [
  body('productId').isInt().withMessage('Valid product required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];
