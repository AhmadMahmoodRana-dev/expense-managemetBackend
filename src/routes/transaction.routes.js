import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js'; // Multer middleware
import { createTransaction, deleteTransaction, getTransaction, getTransactions, getTransactionSummary, updateTransaction } from '../controllers/transaction.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Transaction CRUD
router.post('/', upload.array('receipts', 5), createTransaction); // Allow up to 5 receipt uploads
router.get('/', getTransactions);
router.get('/summary', getTransactionSummary);
router.get('/:id', getTransaction);
router.put('/:id', upload.array('receipts', 5), updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;