import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Category, ICategory } from '../models/Category';
import { Course } from '../models/Course';
import { AuthRequest } from '../middlewares/auth';
import { recordAuditLog } from '../utils/auditLogger';

export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export interface CategoryTreeNode {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string | null;
  courseCount: number;
  children: CategoryTreeNode[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lấy danh sách danh mục (Hỗ trợ định dạng phẳng hoặc cây lồng nhau)
 * GET /api/categories?tree=true
 */
export const getCategories = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const isTree = req.query.tree === 'true';

    // Lấy tất cả danh mục
    const categories = await Category.find().sort({ createdAt: 1 }).lean();

    // Đếm số khóa học theo từng categoryId
    const courseCounts = await Course.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    for (const item of courseCounts) {
      if (item._id) {
        countMap.set(item._id.toString(), item.count);
      }
    }

    const categoriesWithCount = categories.map((cat) => ({
      ...cat,
      _id: cat._id.toString(),
      parentId: cat.parentId ? cat.parentId.toString() : null,
      courseCount: countMap.get(cat._id.toString()) || 0,
    }));

    if (!isTree) {
      res.status(200).json({
        success: true,
        data: categoriesWithCount,
      });
      return;
    }

    // Xây dựng cây danh mục (Category Tree)
    const nodeMap = new Map<string, CategoryTreeNode>();
    const rootNodes: CategoryTreeNode[] = [];

    // Khởi tạo các node
    for (const cat of categoriesWithCount) {
      nodeMap.set(cat._id, {
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        icon: cat.icon || '',
        parentId: cat.parentId,
        courseCount: cat.courseCount,
        children: [],
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      });
    }

    // Gắn con vào cha
    for (const cat of categoriesWithCount) {
      const node = nodeMap.get(cat._id)!;
      if (cat.parentId && nodeMap.has(cat.parentId)) {
        nodeMap.get(cat.parentId)!.children.push(node);
      } else {
        rootNodes.push(node);
      }
    }

    res.status(200).json({
      success: true,
      data: rootNodes,
    });
  } catch (error) {
    console.error('[CategoryController] getCategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách danh mục',
    });
  }
};

/**
 * Lấy chi tiết một danh mục theo ID hoặc Slug
 * GET /api/categories/:identifier
 */
export const getCategoryByIdentifier = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const identifier = String(req.params.identifier);

    let category: ICategory | null = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      category = await Category.findById(identifier);
    }
    if (!category) {
      category = await Category.findOne({ slug: identifier });
    }

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục yêu cầu',
      });
      return;
    }

    const courseCount = await Course.countDocuments({
      categoryId: category._id,
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      data: {
        ...category.toObject(),
        courseCount,
      },
    });
  } catch (error) {
    console.error('[CategoryController] getCategoryByIdentifier error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thông tin danh mục',
    });
  }
};

/**
 * Thêm danh mục mới (Admin only)
 * POST /api/categories
 */
export const createCategory = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { name, slug, description, parentId, icon } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({
        success: false,
        message: 'Tên danh mục không được để trống',
      });
      return;
    }

    const cleanName = name.trim();
    const finalSlug = (
      slug && typeof slug === 'string' && slug.trim()
        ? slugify(slug)
        : slugify(cleanName)
    ).toLowerCase();

    if (!finalSlug) {
      res.status(400).json({
        success: false,
        message: 'Đường dẫn tĩnh (Slug) không hợp lệ',
      });
      return;
    }

    // Kiểm tra tính duy nhất của slug
    const existingSlug = await Category.findOne({ slug: finalSlug });
    if (existingSlug) {
      res.status(400).json({
        success: false,
        message: `Đường dẫn tĩnh "${finalSlug}" đã tồn tại trên hệ thống. Vui lòng chọn đường dẫn khác.`,
      });
      return;
    }

    let validParentId: mongoose.Types.ObjectId | null = null;
    if (parentId && parentId !== 'null' && parentId !== '') {
      const parentIdStr = String(parentId);
      if (!mongoose.Types.ObjectId.isValid(parentIdStr)) {
        res.status(400).json({
          success: false,
          message: 'Mã danh mục cha không hợp lệ',
        });
        return;
      }
      const parentExists = await Category.findById(parentIdStr);
      if (!parentExists) {
        res.status(400).json({
          success: false,
          message: 'Danh mục cha được chọn không tồn tại',
        });
        return;
      }
      validParentId = new mongoose.Types.ObjectId(parentIdStr);
    }

    const newCategory: ICategory = await new Category({
      name: cleanName,
      slug: finalSlug,
      description: description ? description.trim() : '',
      parentId: validParentId,
      icon: icon ? icon.trim() : '',
    }).save();

    // Ghi nhật ký kiểm toán (Audit Log)
    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: 'CREATE_CATEGORY',
        targetType: 'CATEGORY',
        targetId: newCategory._id.toString(),
        details: {
          name: newCategory.name,
          slug: newCategory.slug,
          parentId: validParentId ? validParentId.toString() : null,
        },
        ipAddress: req.ip || '',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Thêm danh mục mới thành công',
      data: newCategory,
    });
  } catch (error) {
    console.error('[CategoryController] createCategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo danh mục mới',
    });
  }
};

/**
 * Cập nhật danh mục (Admin only)
 * PUT /api/categories/:id
 */
export const updateCategory = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { name, slug, description, parentId, icon } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Mã danh mục không hợp lệ',
      });
      return;
    }

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục cần cập nhật',
      });
      return;
    }

    const oldData = {
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      icon: category.icon,
    };

    if (name && typeof name === 'string') {
      category.name = name.trim();
    }

    if (slug && typeof slug === 'string') {
      const cleanSlug = slugify(slug).toLowerCase();
      if (cleanSlug !== category.slug) {
        const existing = await Category.findOne({
          slug: cleanSlug,
          _id: { $ne: category._id },
        });
        if (existing) {
          res.status(400).json({
            success: false,
            message: `Đường dẫn tĩnh "${cleanSlug}" đã thuộc về danh mục khác`,
          });
          return;
        }
        category.slug = cleanSlug;
      }
    }

    if (description !== undefined) {
      category.description =
        typeof description === 'string' ? description.trim() : '';
    }

    if (icon !== undefined) {
      category.icon = typeof icon === 'string' ? icon.trim() : '';
    }

    if (parentId !== undefined) {
      if (!parentId || parentId === 'null' || parentId === '') {
        category.parentId = null;
      } else {
        const parentIdStr = String(parentId);
        if (!mongoose.Types.ObjectId.isValid(parentIdStr)) {
          res.status(400).json({
            success: false,
            message: 'Mã danh mục cha không hợp lệ',
          });
          return;
        }

        // Chặn chu trình lặp: Không thể chọn chính mình làm cha
        if (parentIdStr === category._id.toString()) {
          res.status(400).json({
            success: false,
            message:
              'Không thể chọn chính danh mục này làm danh mục cha của nó',
          });
          return;
        }

        // Chặn chu trình lặp: Không thể chọn con cháu của chính nó làm cha
        const isDescendant = await checkIsDescendant(category._id, parentIdStr);
        if (isDescendant) {
          res.status(400).json({
            success: false,
            message: 'Không thể gán danh mục con trực thuộc làm danh mục cha',
          });
          return;
        }

        const parentExists = await Category.findById(parentIdStr);
        if (!parentExists) {
          res.status(400).json({
            success: false,
            message: 'Danh mục cha không tồn tại trên hệ thống',
          });
          return;
        }

        category.parentId = new mongoose.Types.ObjectId(parentIdStr);
      }
    }

    await category.save();

    // Ghi nhật ký kiểm toán
    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: 'UPDATE_CATEGORY',
        targetType: 'CATEGORY',
        targetId: category._id.toString(),
        details: {
          before: oldData,
          after: {
            name: category.name,
            slug: category.slug,
            parentId: category.parentId,
            icon: category.icon,
          },
        },
        ipAddress: req.ip || '',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật danh mục thành công',
      data: category,
    });
  } catch (error) {
    console.error('[CategoryController] updateCategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật danh mục',
    });
  }
};

/**
 * Xóa danh mục (Admin only)
 * Quy tắc nghiệp vụ: Chặn xóa nếu danh mục đang chứa khóa học hoạt động hoặc có danh mục con
 * DELETE /api/categories/:id
 */
export const deleteCategory = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Mã danh mục không hợp lệ',
      });
      return;
    }

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục cần xóa',
      });
      return;
    }

    // 1. Kiểm tra khóa học trực thuộc
    const activeCourseCount = await Course.countDocuments({
      categoryId: category._id,
      isDeleted: false,
    });

    if (activeCourseCount > 0) {
      res.status(400).json({
        success: false,
        message: `Chặn thao tác: Danh mục "${category.name}" hiện đang chứa ${activeCourseCount} khóa học đang hoạt động. Vui lòng chuyển toàn bộ khóa học sang danh mục khác trước khi thực hiện xóa.`,
        data: { activeCourseCount },
      });
      return;
    }

    // 2. Kiểm tra danh mục con
    const subCategoryCount = await Category.countDocuments({
      parentId: category._id,
    });

    if (subCategoryCount > 0) {
      res.status(400).json({
        success: false,
        message: `Chặn thao tác: Danh mục "${category.name}" đang có ${subCategoryCount} danh mục con trực thuộc. Vui lòng di chuyển hoặc xóa các danh mục con trước.`,
        data: { subCategoryCount },
      });
      return;
    }

    const deletedData = {
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
    };

    await Category.findByIdAndDelete(category._id);

    // Ghi nhật ký kiểm toán
    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: 'DELETE_CATEGORY',
        targetType: 'CATEGORY',
        targetId: category._id.toString(),
        details: deletedData,
        ipAddress: req.ip || '',
      });
    }

    res.status(200).json({
      success: true,
      message: `Đã xóa thành công danh mục "${category.name}"`,
    });
  } catch (error) {
    console.error('[CategoryController] deleteCategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa danh mục',
    });
  }
};

/**
 * Hàm kiểm tra targetParentId có phải là hậu duệ của currentId không
 */
async function checkIsDescendant(
  currentId: mongoose.Types.ObjectId,
  targetParentId: string | mongoose.Types.ObjectId,
): Promise<boolean> {
  const targetIdStr = targetParentId.toString();
  const visited = new Set<string>();
  const queue: string[] = [currentId.toString()];

  while (queue.length > 0) {
    const parent = queue.shift()!;
    visited.add(parent);

    const children = await Category.find({ parentId: parent }, '_id').lean();
    for (const child of children) {
      const childIdStr = child._id.toString();
      if (childIdStr === targetIdStr) {
        return true;
      }
      if (!visited.has(childIdStr)) {
        queue.push(childIdStr);
      }
    }
  }

  return false;
}
