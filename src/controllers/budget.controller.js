import Budget from "../schema/budget.schema.js";


export const createBudget = async (req, res) => {
  try {
    const {name,month,year,categories,totalBudget,rolloverUnused,alertThreshold,applyToFuture} = req.body;
    const userId = req.user.id; 

    // Check if budget already exists for this user and month/year
    const existingBudget = await Budget.findOne({userId,month,year});
    if (existingBudget) {
      return res.status(400).json({
        success: false,
        message: 'Budget already exists for this month and year'
      });
    }

    // Calculate total spent from categories
    const totalSpent = categories.reduce((sum, category) => sum + (category.spentAmount || 0), 0);

    // Determine status based on spending
    let status = 'active';
    if (totalSpent >= totalBudget) {
      status = 'exceeded';
    }

    const budget = new Budget({
      userId,
      name: name || 'Monthly Budget',
      month,
      year,
      categories: categories.map(cat => ({
        category: cat.category,
        budgetAmount: cat.budgetAmount,
        spentAmount: cat.spentAmount || 0,
        isActive: cat.isActive !== undefined ? cat.isActive : true
      })),
      totalBudget,
      totalSpent,
      rolloverUnused: rolloverUnused || false,
      alertThreshold: alertThreshold || 80,
      status
    });

    const savedBudget = await budget.save();

    // If applyToFuture is true, create budgets for future months
    if (applyToFuture) {
      await createFutureBudgets(userId, month, year, budget, savedBudget);
    }

    // Populate category references
    await savedBudget.populate('categories.category', 'name icon color');

    res.status(201).json({
      success: true,
      data: savedBudget,
      message: 'Budget created successfully'
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Budget already exists for this month and year'
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get budgets for a specific month and year
// @route   GET /api/budgets/by-month
// @access  Private
export const getBudgetsByMonth = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required',
      });
    }

    // Convert to integers (since your schema likely stores month/year as numbers)
    const numericMonth = parseInt(month);
    const numericYear = parseInt(year);

    // Fetch budgets
    const budgets = await Budget.find({
      userId,
      month: numericMonth,
      year: numericYear
    }).populate('categories.category', 'name icon color');

    if (!budgets || budgets.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No budgets found for ${getMonthName(numericMonth)} ${numericYear}`
      });
    }

    // Calculate total budget and spent for that month
    const totalBudget = budgets.reduce((sum, b) => sum + b.totalBudget, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.totalSpent, 0);

    res.status(200).json({
      success: true,
      data: {
        budgets,
        summary: {
          month: getMonthName(numericMonth),
          year: numericYear,
          totalBudget,
          totalSpent,
          remaining: totalBudget - totalSpent
        }
      },
      message: 'Budgets fetched successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Get all budgets for a user
// @route   GET /api/budgets
// @access  Private
export const getBudgets = async (req, res) => {
  try {
    const userId = req.user._id;
    const { year, month, page = 1, limit = 10 } = req.query;

    let query = { userId };
    
    // Filter by year and month if provided
    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);

    const budgets = await Budget.find(query)
      .populate('categories.category', 'name icon color')
      .sort({ year: -1, month: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Budget.countDocuments(query);

    res.json({
      success: true,
      data: budgets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBudgets: total
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single budget
// @route   GET /api/budgets/:id
// @access  Private
export const getBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id)
      .populate('categories.category', 'name icon color');

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Check if user owns this budget
    if (budget.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this budget'
      });
    }

    res.json({
      success: true,
      data: budget
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
export const updateBudget = async (req, res) => {
  try {
    const {
      name,
      categories,
      totalBudget,
      rolloverUnused,
      alertThreshold
    } = req.body;

    let budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Check if user owns this budget
    if (budget.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this budget'
      });
    }

    // Calculate total spent from categories
    const totalSpent = categories.reduce((sum, category) => sum + (category.spentAmount || 0), 0);

    // Determine status based on spending
    let status = 'active';
    if (totalSpent >= totalBudget) {
      status = 'exceeded';
    } else if (budget.month < new Date().getMonth() + 1 && budget.year <= new Date().getFullYear()) {
      status = 'completed';
    }

    budget = await Budget.findByIdAndUpdate(
      req.params.id,
      {
        name,
        categories: categories.map(cat => ({
          category: cat.category,
          budgetAmount: cat.budgetAmount,
          spentAmount: cat.spentAmount || 0,
          isActive: cat.isActive !== undefined ? cat.isActive : true
        })),
        totalBudget,
        totalSpent,
        rolloverUnused,
        alertThreshold,
        status
      },
      { new: true, runValidators: true }
    ).populate('categories.category', 'name icon color');

    res.json({
      success: true,
      data: budget,
      message: 'Budget updated successfully'
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
export const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Check if user owns this budget
    if (budget.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this budget'
      });
    }

    await Budget.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update spent amount for a category
// @route   PATCH /api/budgets/:id/categories/:categoryId/spent
// @access  Private
export const updateCategorySpent = async (req, res) => {
  try {
    const { spentAmount } = req.body;

    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Check if user owns this budget
    if (budget.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this budget'
      });
    }

    // Find the category and update spent amount
    const categoryIndex = budget.categories.findIndex(
      cat => cat._id.toString() === req.params.categoryId
    );

    if (categoryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Category not found in budget'
      });
    }

    budget.categories[categoryIndex].spentAmount = spentAmount;

    // Recalculate total spent
    budget.totalSpent = budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);

    // Update status
    if (budget.totalSpent >= budget.totalBudget) {
      budget.status = 'exceeded';
    } else {
      budget.status = 'active';
    }

    await budget.save();
    await budget.populate('categories.category', 'name icon color');

    res.json({
      success: true,
      data: budget,
      message: 'Category spent amount updated successfully'
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current month budget
// @route   GET /api/budgets/current
// @access  Private
export const getCurrentBudget = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const budget = await Budget.findOne({ userId, month, year })
      .populate('categories.category', 'name icon color');

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'No budget found for current month'
      });
    }

    res.json({
      success: true,
      data: budget
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check budget alerts
// @route   GET /api/budgets/:id/alerts
// @access  Private
export const getBudgetAlerts = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id)
      .populate('categories.category', 'name icon color');

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Check if user owns this budget
    if (budget.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this budget'
      });
    }

    const alerts = [];
    const threshold = budget.alertThreshold;

    // Check overall budget
    const overallUsage = (budget.totalSpent / budget.totalBudget) * 100;
    if (overallUsage >= threshold) {
      alerts.push({
        type: 'overall',
        message: `You've used ${overallUsage.toFixed(1)}% of your total budget`,
        severity: overallUsage >= 100 ? 'high' : 'medium'
      });
    }

    // Check individual categories
    budget.categories.forEach(cat => {
      if (cat.isActive) {
        const categoryUsage = (cat.spentAmount / cat.budgetAmount) * 100;
        if (categoryUsage >= threshold) {
          alerts.push({
            type: 'category',
            category: cat.category.name,
            message: `You've used ${categoryUsage.toFixed(1)}% of your ${cat.category.name} budget`,
            severity: categoryUsage >= 100 ? 'high' : 'medium'
          });
        }
      }
    });

    res.json({
      success: true,
      data: {
        budget,
        alerts,
        hasAlerts: alerts.length > 0
      }
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to create future budgets
const createFutureBudgets = async (userId, startMonth, startYear, templateBudget, savedBudget) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    for (let year = startYear; year <= currentYear + 1; year++) {
      const start = year === startYear ? startMonth + 1 : 1;
      const end = year === currentYear + 1 ? currentMonth : 12;

      for (let month = start; month <= end; month++) {
        // Check if budget already exists
        const existingBudget = await Budget.findOne({ userId, month, year });
        if (existingBudget) continue;

        // Create new budget based on template
        const newBudget = new Budget({
          userId,
          name: `Budget for ${getMonthName(month)} ${year}`,
          month,
          year,
          categories: templateBudget.categories.map(cat => ({
            category: cat.category,
            budgetAmount: cat.budgetAmount,
            spentAmount: 0,
            isActive: cat.isActive
          })),
          totalBudget: templateBudget.totalBudget,
          totalSpent: 0,
          rolloverUnused: templateBudget.rolloverUnused,
          alertThreshold: templateBudget.alertThreshold,
          status: 'active'
        });

        await newBudget.save();
      }
    }
  } catch (error) {
    console.error('Error creating future budgets:', error);
  }
};

// Helper function to get month name
const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
};

export default {
  createBudget,
  getBudgets,
  getBudget,
  updateBudget,
  deleteBudget,
  updateCategorySpent,
  getCurrentBudget,
  getBudgetAlerts
};