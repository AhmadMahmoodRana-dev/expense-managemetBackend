import mongoose from 'mongoose';
import Category from "../schema/category.schema.js"
// Create a new category
export const createCategory = async (req, res) => {
  try {
    const { name, type, icon, color, parentCategory, description, order } = req.body;
    const userId = req.user.id;

    // If parentCategory is provided, validate it exists and belongs to the same user
    if (parentCategory) {
      const parent = await Category.findOne({ 
        _id: parentCategory, 
        userId,
        type 
      });
      
      if (!parent) {
        return res.status(404).json({ 
          success: false, 
          message: 'Parent category not found or type mismatch' 
        });
      }
    }

    // Check if category name already exists for this user and type
    const existingCategory = await Category.findOne({ userId, name, type });
    if (existingCategory) {
      return res.status(409).json({ 
        success: false, 
        message: 'Category with this name already exists for this type' 
      });
    }

    const category = new Category({
      userId,
      name,
      type,
      icon,
      color,
      parentCategory: parentCategory || null,
      description,
      order
    });

    await category.save();

    res.status(201).json({ 
      success: true, 
      message: 'Category created successfully', 
      data: category 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error creating category', 
      error: error.message 
    });
  }
};

// Get all categories for a user
export const getCategories = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, includeInactive } = req.query;

    const filter = { userId };
    
    if (type && ['income', 'expense'].includes(type)) {
      filter.type = type;
    }
    
    if (!includeInactive) {
      filter.isActive = true;
    }

    const categories = await Category.find(filter)
      .populate('parentCategory', 'name icon color')
      .sort({ order: 1, createdAt: 1 });

    res.status(200).json({ 
      success: true, 
      count: categories.length,
      data: categories 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching categories', 
      error: error.message 
    });
  }
};

// Get categories by type (income or expense)
export const getCategoriesByType = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.params;

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type must be either "income" or "expense"' 
      });
    }

    const categories = await Category.find({ 
      userId, 
      type,
      isActive: true 
    })
    .populate('parentCategory', 'name icon color')
    .sort({ order: 1, createdAt: 1 });

    res.status(200).json({ 
      success: true, 
      count: categories.length,
      data: categories 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching categories', 
      error: error.message 
    });
  }
};

// Get a single category by ID
export const getCategoryById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid category ID' 
      });
    }

    const category = await Category.findOne({ _id: id, userId })
      .populate('parentCategory', 'name icon color');

    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    // Get subcategories
    const subcategories = await Category.find({ 
      parentCategory: id, 
      userId,
      isActive: true 
    }).sort({ order: 1 });

    res.status(200).json({ 
      success: true, 
      data: {
        ...category.toObject(),
        subcategories
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching category', 
      error: error.message 
    });
  }
};

// Get subcategories of a parent category
export const getSubcategories = async (req, res) => {
  try {
    const userId = req.user.id;
    const { parentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid parent category ID' 
      });
    }

    // Verify parent category exists and belongs to user
    const parentCategory = await Category.findOne({ _id: parentId, userId });
    if (!parentCategory) {
      return res.status(404).json({ 
        success: false, 
        message: 'Parent category not found' 
      });
    }

    const subcategories = await Category.find({ 
      parentCategory: parentId, 
      userId,
      isActive: true 
    }).sort({ order: 1, createdAt: 1 });

    res.status(200).json({ 
      success: true, 
      count: subcategories.length,
      data: subcategories 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching subcategories', 
      error: error.message 
    });
  }
};

// Get categories in tree structure
export const getCategoryTree = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    const filter = { userId, isActive: true };
    if (type && ['income', 'expense'].includes(type)) {
      filter.type = type;
    }

    const categories = await Category.find(filter)
      .populate('parentCategory', 'name icon color')
      .sort({ order: 1, createdAt: 1 });

    // Build category tree
    const buildTree = (parentId = null) => {
      return categories
        .filter(category => {
          if (parentId === null) {
            return !category.parentCategory;
          }
          return category.parentCategory && category.parentCategory._id.toString() === parentId;
        })
        .map(category => ({
          ...category.toObject(),
          subcategories: buildTree(category._id.toString())
        }));
    };

    const categoryTree = buildTree();

    res.status(200).json({ 
      success: true, 
      count: categories.length,
      data: categoryTree 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching category tree', 
      error: error.message 
    });
  }
};

// Update a category
export const updateCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, icon, color, parentCategory, description, isActive, order } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid category ID' 
      });
    }

    const category = await Category.findOne({ _id: id, userId });

    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    // Prevent updating default categories' core properties
    if (category.isDefault) {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot modify default category core properties' 
      });
    }

    // If changing parent category, validate it
    if (parentCategory !== undefined) {
      if (parentCategory) {
        // Cannot set self as parent
        if (parentCategory === id) {
          return res.status(400).json({ 
            success: false, 
            message: 'Category cannot be its own parent' 
          });
        }

        const parent = await Category.findOne({ 
          _id: parentCategory, 
          userId,
          type: category.type 
        });
        
        if (!parent) {
          return res.status(404).json({ 
            success: false, 
            message: 'Parent category not found or type mismatch' 
          });
        }

        // Prevent circular references - parent cannot be a child of this category
        if (parent.parentCategory && parent.parentCategory.toString() === id) {
          return res.status(400).json({ 
            success: false, 
            message: 'Cannot create circular category reference' 
          });
        }
      }
      category.parentCategory = parentCategory || null;
    }

    // Check for name uniqueness if name is being changed
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        userId, 
        name, 
        type: category.type,
        _id: { $ne: id }
      });
      
      if (existingCategory) {
        return res.status(409).json({ 
          success: false, 
          message: 'Category with this name already exists for this type' 
        });
      }
      category.name = name;
    }

    if (icon !== undefined) category.icon = icon;
    if (color !== undefined) category.color = color;
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;
    if (order !== undefined) category.order = order;

    await category.save();

    res.status(200).json({ 
      success: true, 
      message: 'Category updated successfully', 
      data: category 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating category', 
      error: error.message 
    });
  }
};

// Delete a category
export const deleteCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid category ID' 
      });
    }

    const category = await Category.findOne({ _id: id, userId });

    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    // Prevent deleting default categories
    if (category.isDefault) {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot delete default category' 
      });
    }

    // Check if category has subcategories
    const subcategoriesCount = await Category.countDocuments({ 
      parentCategory: id, 
      userId 
    });

    if (subcategoriesCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete category with subcategories. Delete subcategories first.' 
      });
    }

    // You might want to check if there are transactions using this category
    // and handle accordingly (prevent deletion or reassign transactions)

    await Category.deleteOne({ _id: id, userId });

    res.status(200).json({ 
      success: true, 
      message: 'Category deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting category', 
      error: error.message 
    });
  }
};

// Soft delete (deactivate) a category
export const deactivateCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid category ID' 
      });
    }

    const category = await Category.findOne({ _id: id, userId });

    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    category.isActive = false;
    await category.save();

    res.status(200).json({ 
      success: true, 
      message: 'Category deactivated successfully', 
      data: category 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deactivating category', 
      error: error.message 
    });
  }
};

// Reorder categories
export const reorderCategories = async (req, res) => {
  try {
    const userId = req.user.id;
    const { categoryOrders } = req.body; // Array of { id, order }

    if (!Array.isArray(categoryOrders)) {
      return res.status(400).json({ 
        success: false, 
        message: 'categoryOrders must be an array' 
      });
    }

    const bulkOps = categoryOrders.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id, userId },
        update: { $set: { order } }
      }
    }));

    await Category.bulkWrite(bulkOps);

    res.status(200).json({ 
      success: true, 
      message: 'Categories reordered successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error reordering categories', 
      error: error.message 
    });
  }
};