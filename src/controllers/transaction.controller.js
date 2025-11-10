import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import Category from "../models/Category.js";
import Account from "../models/Account.js";
import { uploadToCloudinary } from "../utils/cloudinary.js"; // You'll need to implement this

// Create Transaction
export const createTransaction = async (req, res) => {
  try {
    const {
      title,
      amount,
      type,
      category,
      fromAccount,
      toAccount,
      date,
      time,
      paymentMethod,
      description,
      tags,
      isRecurring,
      frequency,
      endDate
    } = req.body;

    const userId = req.user._id;

    // Validation
    if (!title || !amount || !type || !fromAccount || !date) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields"
      });
    }

    // For expense and income, category is required
    if ((type === 'expense' || type === 'income') && !category) {
      return res.status(400).json({
        success: false,
        message: "Category is required for expense/income transactions"
      });
    }

    // For transfer, toAccount is required
    if (type === 'transfer' && !toAccount) {
      return res.status(400).json({
        success: false,
        message: "Destination account is required for transfer"
      });
    }

    // For online payment methods, receipt is mandatory
    const onlinePaymentMethods = ['card', 'upi', 'bank_transfer'];
    if (onlinePaymentMethods.includes(paymentMethod) && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Receipt/document is mandatory for online payment methods"
      });
    }

    // Verify category exists and belongs to user
    if (category) {
      const categoryExists = await Category.findOne({
        _id: category,
        userId: userId
      });
      
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: "Category not found"
        });
      }
    }

    // Verify account exists
    const accountExists = await Account.findOne({
      _id: fromAccount,
      userId: userId
    });

    if (!accountExists) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    // Handle file uploads (receipts)
    let receipts = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await uploadToCloudinary(file);
        receipts.push({
          url: uploadResult.secure_url,
          filename: file.originalname
        });
      }
    }

    // Create transaction
    const transaction = await Transaction.create({
      userId,
      title,
      amount,
      type,
      category: type !== 'transfer' ? category : undefined,
      fromAccount,
      toAccount: type === 'transfer' ? toAccount : undefined,
      date,
      time,
      paymentMethod,
      description,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [],
      receipts,
      isRecurring
    });

    // Update budget if it's an expense
    if (type === 'expense' && category) {
      const transactionDate = new Date(date);
      const month = transactionDate.getMonth() + 1;
      const year = transactionDate.getFullYear();

      const budget = await Budget.findOne({
        userId,
        month,
        year,
        'categories.category': category
      });

      if (budget) {
        // Find the category in the budget
        const categoryIndex = budget.categories.findIndex(
          cat => cat.category.toString() === category.toString()
        );

        if (categoryIndex !== -1) {
          // Update spent amount
          budget.categories[categoryIndex].spentAmount += amount;
          budget.totalSpent += amount;

          // Check if budget exceeded
          const categoryBudget = budget.categories[categoryIndex];
          if (categoryBudget.spentAmount > categoryBudget.budgetAmount) {
            budget.status = 'exceeded';
          }

          // Save budget with transaction reference
          transaction.budgetId = budget._id;
          await transaction.save();
          await budget.save();
        }
      }
    }

    // Populate the transaction before sending response
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('category', 'name icon color')
      .populate('fromAccount', 'name type')
      .populate('toAccount', 'name type');

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      transaction: populatedTransaction
    });

  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create transaction",
      error: error.message
    });
  }
};

// Get all transactions for user
export const getTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, category, fromDate, toDate, page = 1, limit = 50 } = req.query;

    // Build filter
    const filter = { userId };
    
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(filter)
      .populate('category', 'name icon color')
      .populate('fromAccount', 'name type')
      .populate('toAccount', 'name type')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(filter);

    res.status(200).json({
      success: true,
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message
    });
  }
};

// Get single transaction
export const getTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const transaction = await Transaction.findOne({ _id: id, userId })
      .populate('category', 'name icon color')
      .populate('fromAccount', 'name type')
      .populate('toAccount', 'name type')
      .populate('budgetId');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    res.status(200).json({
      success: true,
      transaction
    });

  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction",
      error: error.message
    });
  }
};

// Update transaction
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const transaction = await Transaction.findOne({ _id: id, userId });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    // Store old values for budget adjustment
    const oldAmount = transaction.amount;
    const oldCategory = transaction.category;
    const oldDate = transaction.date;

    // Update transaction fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        transaction[key] = updates[key];
      }
    });

    await transaction.save();

    // Handle budget updates if expense and amount/category changed
    if (transaction.type === 'expense') {
      const oldMonth = new Date(oldDate).getMonth() + 1;
      const oldYear = new Date(oldDate).getFullYear();
      const newMonth = new Date(transaction.date).getMonth() + 1;
      const newYear = new Date(transaction.date).getFullYear();

      // Revert old budget
      if (oldCategory) {
        const oldBudget = await Budget.findOne({
          userId,
          month: oldMonth,
          year: oldYear,
          'categories.category': oldCategory
        });

        if (oldBudget) {
          const categoryIndex = oldBudget.categories.findIndex(
            cat => cat.category.toString() === oldCategory.toString()
          );
          if (categoryIndex !== -1) {
            oldBudget.categories[categoryIndex].spentAmount -= oldAmount;
            oldBudget.totalSpent -= oldAmount;
            await oldBudget.save();
          }
        }
      }

      // Apply new budget
      if (transaction.category) {
        const newBudget = await Budget.findOne({
          userId,
          month: newMonth,
          year: newYear,
          'categories.category': transaction.category
        });

        if (newBudget) {
          const categoryIndex = newBudget.categories.findIndex(
            cat => cat.category.toString() === transaction.category.toString()
          );
          if (categoryIndex !== -1) {
            newBudget.categories[categoryIndex].spentAmount += transaction.amount;
            newBudget.totalSpent += transaction.amount;
            await newBudget.save();
          }
        }
      }
    }

    const updatedTransaction = await Transaction.findById(id)
      .populate('category', 'name icon color')
      .populate('fromAccount', 'name type')
      .populate('toAccount', 'name type');

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      transaction: updatedTransaction
    });

  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update transaction",
      error: error.message
    });
  }
};

// Delete transaction
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const transaction = await Transaction.findOne({ _id: id, userId });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    // Revert budget if expense
    if (transaction.type === 'expense' && transaction.category) {
      const transactionDate = new Date(transaction.date);
      const month = transactionDate.getMonth() + 1;
      const year = transactionDate.getFullYear();

      const budget = await Budget.findOne({
        userId,
        month,
        year,
        'categories.category': transaction.category
      });

      if (budget) {
        const categoryIndex = budget.categories.findIndex(
          cat => cat.category.toString() === transaction.category.toString()
        );
        if (categoryIndex !== -1) {
          budget.categories[categoryIndex].spentAmount -= transaction.amount;
          budget.totalSpent -= transaction.amount;
          await budget.save();
        }
      }
    }

    await transaction.deleteOne();

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
      error: error.message
    });
  }
};

// Get transaction summary
export const getTransactionSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const summary = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      income: 0,
      expense: 0,
      transfer: 0,
      transactions: {
        income: 0,
        expense: 0,
        transfer: 0
      }
    };

    summary.forEach(item => {
      result[item._id] = item.total;
      result.transactions[item._id] = item.count;
    });

    result.balance = result.income - result.expense;

    res.status(200).json({
      success: true,
      summary: result
    });

  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch summary",
      error: error.message
    });
  }
};