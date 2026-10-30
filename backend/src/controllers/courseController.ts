import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Course } from '../models/Course';
import { Category } from '../models/Category';

// Danh sách dữ liệu mẫu chất lượng cao khởi tạo ban đầu
export const initialCategories = [
  {
    name: 'Kỹ năng số',
    slug: 'digital-skills',
    description: 'Kỹ năng số và công nghệ hiện đại',
  },
  {
    name: 'Lập trình & Phát triển',
    slug: 'development',
    description: 'Lập trình web, app, backend',
  },
  {
    name: 'Thiết kế & Sáng tạo',
    slug: 'design',
    description: 'UI/UX Design, đồ họa và truyền thông',
  },
  {
    name: 'Kinh doanh & Quản lý',
    slug: 'business',
    description: 'Khởi nghiệp, marketing và quản trị',
  },
  {
    name: 'Trí tuệ nhân tạo',
    slug: 'ai-data',
    description: 'AI, Machine Learning và Data Science',
  },
];

export const initialCourses = [
  // 1. Dành riêng cho bạn (Khóa học chuẩn chính xác như ảnh mẫu người dùng gửi)
  {
    title: 'Advanced Digital Skills 1',
    slug: 'advanced-digital-skills-1',
    shortDescription:
      'Master cutting-edge techniques in this comprehensive course.',
    thumbnailUrl: '/assets/advanced_digital_skills.jpg',
    badge: 'NEW',
    price: 199.99,
    discountPrice: 159.99,
    durationHours: 20,
    durationText: '20h',
    status: 'PUBLISHED',
    averageRating: 4.8,
    totalStudents: 1250,
    isForYou: true,
    categorySlug: 'digital-skills',
  },
  {
    title: 'Fullstack Web Architecture with Next.js & Node.js',
    slug: 'fullstack-web-architecture-nextjs-nodejs',
    shortDescription:
      'Xây dựng hệ thống web chuẩn enterprise với hiệu năng tối đa.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    badge: 'NEW',
    price: 149.99,
    discountPrice: 119.99,
    durationHours: 35,
    durationText: '35h',
    status: 'PUBLISHED',
    averageRating: 4.9,
    totalStudents: 520,
    isForYou: true,
    categorySlug: 'development',
  },
  {
    title: 'UI/UX Design Mastery: From Figma to Production',
    slug: 'ui-ux-design-mastery-figma-production',
    shortDescription:
      'Tư duy thiết kế trải nghiệm người dùng đẳng cấp và hệ thống design token.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
    badge: 'HOT',
    price: 129.99,
    discountPrice: 99.99,
    durationHours: 18,
    durationText: '18h',
    status: 'PUBLISHED',
    averageRating: 4.9,
    totalStudents: 890,
    isForYou: true,
    categorySlug: 'design',
  },
  {
    title: 'Generative AI & LLMs in Production',
    slug: 'generative-ai-llms-in-production',
    shortDescription:
      'Ứng dụng mô hình ngôn ngữ lớn và giải pháp AI vào quy trình doanh nghiệp.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    badge: 'NEW',
    price: 249.99,
    discountPrice: 199.99,
    durationHours: 24,
    durationText: '24h',
    status: 'PUBLISHED',
    averageRating: 5.0,
    totalStudents: 410,
    isForYou: true,
    categorySlug: 'ai-data',
  },

  // 2. Khóa học bán chạy nhất (Best Sellers)
  {
    title: 'React 19 & TypeScript: Complete Modern Blueprint',
    slug: 'react-19-typescript-complete-modern-blueprint',
    shortDescription:
      'Làm chủ toàn diện React hiện đại, Server Actions và TypeScript chuyên sâu.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80',
    badge: 'BESTSELLER',
    price: 189.99,
    discountPrice: 139.99,
    durationHours: 42,
    durationText: '42h',
    status: 'PUBLISHED',
    averageRating: 4.9,
    totalStudents: 3450,
    isForYou: false,
    categorySlug: 'development',
  },
  {
    title: 'Digital Marketing & Growth Hacking 2026',
    slug: 'digital-marketing-growth-hacking-2026',
    shortDescription:
      'Chiến lược tăng trưởng đột phá doanh thu trên đa nền tảng số.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    badge: 'BESTSELLER',
    price: 159.99,
    discountPrice: 109.99,
    durationHours: 28,
    durationText: '28h',
    status: 'PUBLISHED',
    averageRating: 4.8,
    totalStudents: 2890,
    isForYou: false,
    categorySlug: 'business',
  },
  {
    title: 'Product Management from Zero to Hero',
    slug: 'product-management-zero-to-hero',
    shortDescription:
      'Xây dựng lộ trình sản phẩm, phân tích thị trường và quản trị backlog.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=80',
    badge: 'HOT',
    price: 169.99,
    discountPrice: 129.99,
    durationHours: 26,
    durationText: '26h',
    status: 'PUBLISHED',
    averageRating: 4.7,
    totalStudents: 2150,
    isForYou: false,
    categorySlug: 'business',
  },
  {
    title: 'Python for Data Science & Machine Learning Bootcamp',
    slug: 'python-data-science-machine-learning-bootcamp',
    shortDescription:
      'Thực chiến phân tích dữ liệu, Pandas, NumPy và thuật toán Machine Learning.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    badge: 'BESTSELLER',
    price: 179.99,
    discountPrice: 139.99,
    durationHours: 50,
    durationText: '50h',
    status: 'PUBLISHED',
    averageRating: 4.9,
    totalStudents: 4120,
    isForYou: false,
    categorySlug: 'ai-data',
  },

  // 3. Khóa học mới ra mắt (New Releases)
  {
    title: 'Cloud Native & DevOps on Kubernetes & AWS',
    slug: 'cloud-native-devops-kubernetes-aws',
    shortDescription:
      'Triển khai CI/CD pipeline tự động hóa và kiến trúc vi dịch vụ.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    badge: 'NEW',
    price: 219.99,
    discountPrice: 179.99,
    durationHours: 32,
    durationText: '32h',
    status: 'PUBLISHED',
    averageRating: 4.9,
    totalStudents: 180,
    isForYou: false,
    categorySlug: 'development',
  },
  {
    title: 'Creative Direction & Visual Storytelling',
    slug: 'creative-direction-visual-storytelling',
    shortDescription:
      'Kể chuyện qua hình ảnh và định hướng phong cách sáng tạo đỉnh cao.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
    badge: 'NEW',
    price: 139.99,
    discountPrice: 99.99,
    durationHours: 16,
    durationText: '16h',
    status: 'PUBLISHED',
    averageRating: 4.8,
    totalStudents: 210,
    isForYou: false,
    categorySlug: 'design',
  },
  {
    title: 'Next-Gen Cybersecurity & Ethical Hacking',
    slug: 'next-gen-cybersecurity-ethical-hacking',
    shortDescription:
      'Bảo mật hệ thống thông tin, phòng chống tấn công mạng thế hệ mới.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    badge: 'NEW',
    price: 199.99,
    discountPrice: 149.99,
    durationHours: 30,
    durationText: '30h',
    status: 'PUBLISHED',
    averageRating: 4.8,
    totalStudents: 145,
    isForYou: false,
    categorySlug: 'digital-skills',
  },
  {
    title: 'Startup Financial Modeling & Pitching for Investors',
    slug: 'startup-financial-modeling-pitching',
    shortDescription:
      'Lập mô hình tài chính và kỹ năng thuyết trình gọi vốn cho startup.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=80',
    badge: 'NEW',
    price: 149.99,
    discountPrice: 119.99,
    durationHours: 15,
    durationText: '15h',
    status: 'PUBLISHED',
    averageRating: 4.9,
    totalStudents: 95,
    isForYou: false,
    categorySlug: 'business',
  },
];

// Hàm tự động seed dữ liệu nếu DB chưa có khóa học
export const seedCoursesIfEmpty = async () => {
  try {
    const courseCount = await Course.countDocuments();
    if (courseCount > 0) {
      return;
    }

    console.log('[Seed] Khởi tạo danh mục và khóa học mẫu cho trang chủ...');

    // 1. Tạo Category map
    const categoryMap: Record<string, string> = {};
    for (const cat of initialCategories) {
      let existingCat = await Category.findOne({ slug: cat.slug });
      if (!existingCat) {
        existingCat = await Category.create(cat);
      }
      categoryMap[cat.slug] = existingCat._id.toString();
    }

    // 2. Tạo Courses
    for (const c of initialCourses) {
      const categoryId = categoryMap[c.categorySlug];
      await Course.create({
        title: c.title,
        slug: c.slug,
        shortDescription: c.shortDescription,
        thumbnailUrl: c.thumbnailUrl,
        badge: c.badge,
        price: c.price,
        discountPrice: c.discountPrice,
        durationHours: c.durationHours,
        durationText: c.durationText,
        status: (c.status as 'PUBLISHED' | 'DRAFT') || 'PUBLISHED',
        averageRating: c.averageRating,
        totalStudents: c.totalStudents,
        isForYou: c.isForYou,
        categoryId: categoryId ? new mongoose.Types.ObjectId(categoryId) : null,
      });
    }

    console.log('[Seed] Đã tạo thành công dữ liệu mẫu cho khóa học!');
  } catch (error) {
    console.error('[Seed] Lỗi khi seed dữ liệu khóa học:', error);
  }
};

/**
 * Lấy các nhóm khóa học cho Trang chủ:
 * 1. Dành riêng cho bạn (forYou)
 * 2. Khóa học bán chạy nhất (bestSellers)
 * 3. Khóa học mới ra mắt (newReleases)
 */
export const getHomeCourses = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Đảm bảo có dữ liệu
    await seedCoursesIfEmpty();

    // 1. Dành riêng cho bạn (khóa học được gắn cờ isForYou, ưu tiên khóa học mẫu hiển thị đầu tiên)
    const forYou = await Course.find({
      status: 'PUBLISHED',
      isDeleted: false,
      isForYou: true,
    })
      .populate('categoryId', 'name slug')
      .sort({ createdAt: 1 })
      .limit(8);

    // 2. Khóa học bán chạy nhất (sắp xếp theo totalStudents giảm dần)
    const bestSellers = await Course.find({
      status: 'PUBLISHED',
      isDeleted: false,
    })
      .populate('categoryId', 'name slug')
      .sort({ totalStudents: -1 })
      .limit(8);

    // 3. Khóa học mới ra mắt (sắp xếp theo createdAt giảm dần hoặc có badge 'NEW')
    const newReleases = await Course.find({
      status: 'PUBLISHED',
      isDeleted: false,
    })
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 })
      .limit(8);

    res.status(200).json({
      success: true,
      data: {
        forYou,
        bestSellers,
        newReleases,
      },
    });
  } catch (error) {
    console.error(
      '[CourseController] Lỗi khi lấy danh sách khóa học trang chủ:',
      error,
    );
    res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách khóa học trang chủ',
    });
  }
};

/**
 * Lấy tất cả khóa học có hỗ trợ phân trang & lọc
 */
export const getCourses = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      category,
      search,
      sort = 'newest',
      page = '1',
      limit = '12',
    } = req.query;

    const filter: Record<string, unknown> = {
      status: 'PUBLISHED',
      isDeleted: false,
    };

    if (category) {
      const cat = await Category.findOne({ slug: category as string });
      if (cat) {
        filter.categoryId = cat._id;
      }
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search as string, $options: 'i' } },
        { shortDescription: { $regex: search as string, $options: 'i' } },
      ];
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'popular') {
      sortOption = { totalStudents: -1 };
    } else if (sort === 'rating') {
      sortOption = { averageRating: -1 };
    } else if (sort === 'price-low') {
      sortOption = { price: 1 };
    } else if (sort === 'price-high') {
      sortOption = { price: -1 };
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate('categoryId', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Course.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        courses,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('[CourseController] Lỗi khi lấy danh sách khóa học:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách khóa học',
    });
  }
};

/**
 * Lấy chi tiết khóa học theo slug
 */
export const getCourseBySlug = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { slug } = req.params;
    const course = await Course.findOne({ slug, isDeleted: false }).populate(
      'categoryId',
      'name slug',
    );

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('[CourseController] Lỗi khi lấy chi tiết khóa học:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ',
    });
  }
};

/**
 * Lấy danh sách tất cả danh mục (categories) kèm số lượng khóa học
 */
export const getCategories = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    await seedCoursesIfEmpty();
    const categories = await Category.find().sort({ createdAt: 1 }).lean();

    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const courseCount = await Course.countDocuments({
          categoryId: cat._id,
          status: 'PUBLISHED',
          isDeleted: false,
        });
        return {
          ...cat,
          courseCount,
        };
      }),
    );

    res.status(200).json({
      success: true,
      data: categoriesWithCount,
    });
  } catch (error) {
    console.error('[CourseController] Lỗi khi lấy danh mục:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh mục',
    });
  }
};

/**
 * Endpoint chủ động buộc khởi tạo lại dữ liệu mẫu
 */
export const resetAndSeedCourses = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    await Course.deleteMany({});
    await Category.deleteMany({});
    await seedCoursesIfEmpty();

    res.status(200).json({
      success: true,
      message: 'Đã thiết lập lại dữ liệu khóa học mẫu thành công!',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi reset seed courses',
      error: error instanceof Error ? error.message : error,
    });
  }
};
