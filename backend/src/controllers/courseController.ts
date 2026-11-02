import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Course, ICourse } from '../models/Course';
import { Category } from '../models/Category';
import { Skill } from '../models/Skill';
import { AuthRequest } from '../middlewares/auth';
import {
  getPersonalizedRecommendations,
  recordInteraction,
} from '../services/recommendationService';

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
  {
    name: 'Ngoại ngữ & Giao tiếp',
    slug: 'languages',
    description:
      'Tiếng Anh giao tiếp, IELTS, tiếng Nhật, tiếng Trung và đàm phán',
  },
  {
    name: 'Tài chính & Đầu tư',
    slug: 'finance',
    description:
      'Quản lý tài chính cá nhân, đầu tư chứng khoán và quản trị tài sản',
  },
  {
    name: 'Sức khỏe & Đời sống',
    slug: 'health-wellness',
    description:
      'Dinh dưỡng khoa học, Yoga trị liệu, rèn luyện thể lực và giảm stress',
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
  // --- CÁC KHÓA HỌC NGOÀI IT: NGOẠI NGỮ, TÀI CHÍNH, SỨC KHỎE ---
  {
    title: 'Tiếng Anh Giao Tiếp Phản Xạ Đột Phá Cho Người Mới Bắt Đầu',
    slug: 'tieng-anh-giao-tiep-phan-xa-dot-pha',
    shortDescription:
      'Xây dựng phản xạ phát âm chuẩn quốc tế, tự tin giao tiếp mọi tình huống công sở và đời sống.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop&q=80',
    badge: 'HOT',
    price: 129.99,
    discountPrice: 89.99,
    durationHours: 25,
    durationText: '25h',
    status: 'PUBLISHED',
    averageRating: 4.9,
    totalStudents: 1420,
    isForYou: true,
    categorySlug: 'languages',
  },
  {
    title: 'Chiến Thuật Bứt Phá IELTS 6.5+ Toàn Diện 4 Kỹ Năng',
    slug: 'chien-thuat-but-pha-ielts-6-5-plus',
    shortDescription:
      'Lộ trình học nâng cao từ nền tảng giao tiếp lên band 6.5+, tối ưu chiến lược làm bài thi.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
    badge: 'NEW',
    price: 179.99,
    discountPrice: 139.99,
    durationHours: 40,
    durationText: '40h',
    status: 'PUBLISHED',
    averageRating: 5.0,
    totalStudents: 780,
    isForYou: false,
    categorySlug: 'languages',
  },
  {
    title: 'Tiếng Trung Giao Tiếp Thương Mại Dành Cho Người Đi Làm',
    slug: 'tieng-trung-giao-tiep-thuong-mai',
    shortDescription:
      'Nắm vững 500 từ vựng và mẫu câu giao tiếp phổ biến trong thương mại, trao đổi với đối tác.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    badge: 'NEW',
    price: 119.99,
    discountPrice: 79.99,
    durationHours: 20,
    durationText: '20h',
    status: 'PUBLISHED',
    averageRating: 4.8,
    totalStudents: 610,
    isForYou: true,
    categorySlug: 'languages',
  },
  {
    title: 'Quản Lý Tài Chính Cá Nhân & Tư Duy Tích Lũy Đầu Tư An Toàn',
    slug: 'quan-ly-tai-chinh-ca-nhan-tich-luy',
    shortDescription:
      'Kiểm soát dòng tiền, thoát bẫy nợ nần và xây dựng quỹ dự phòng tài chính vững chắc hướng tới tự do.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    badge: 'HOT',
    price: 99.99,
    discountPrice: 69.99,
    durationHours: 16,
    durationText: '16h',
    status: 'PUBLISHED',
    averageRating: 4.9,
    totalStudents: 1100,
    isForYou: true,
    categorySlug: 'finance',
  },
  {
    title: 'Đầu Tư Chứng Khoán Thực Chiến & Đọc Vị Báo Cáo Tài Chính',
    slug: 'dau-tu-chung-khoan-thuc-chien',
    shortDescription:
      'Nâng cao tư duy phân tích kỹ thuật, đọc hiểu báo cáo tài chính và quản trị rủi ro danh mục đầu tư.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
    badge: 'NEW',
    price: 159.99,
    discountPrice: 129.99,
    durationHours: 30,
    durationText: '30h',
    status: 'PUBLISHED',
    averageRating: 4.8,
    totalStudents: 830,
    isForYou: false,
    categorySlug: 'finance',
  },
  {
    title: 'Dinh Dưỡng Khoa Học & Thiết Kế Thực Đơn Sống Khỏe Mỗi Ngày',
    slug: 'dinh-duong-khoa-hoc-thuc-don-song-khoe',
    shortDescription:
      'Hiểu đúng về Calo, Macro, chế độ ăn Eat Clean khoa học không gây kiệt sức, nâng cao thể trạng.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop&q=80',
    badge: 'HOT',
    price: 89.99,
    discountPrice: 59.99,
    durationHours: 14,
    durationText: '14h',
    status: 'PUBLISHED',
    averageRating: 4.9,
    totalStudents: 690,
    isForYou: true,
    categorySlug: 'health-wellness',
  },
  {
    title: 'Yoga Trị Liệu Cổ Vai Gáy & Cải Thiện Vóc Dáng Nơi Công Sở',
    slug: 'yoga-tri-lieu-co-vai-gay-cong-so',
    shortDescription:
      '15 phút mỗi ngày phục hồi cột sống thắt lưng, thư giãn tinh thần và xua tan mệt mỏi văn phòng.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
    badge: 'NEW',
    price: 79.99,
    discountPrice: 49.99,
    durationHours: 12,
    durationText: '12h',
    status: 'PUBLISHED',
    averageRating: 4.9,
    totalStudents: 950,
    isForYou: true,
    categorySlug: 'health-wellness',
  },
];

export const seedCoursesIfEmpty = async () => {
  try {
    const categoryMap: Record<string, string> = {};
    for (const cat of initialCategories) {
      let existingCat = await Category.findOne({ slug: cat.slug });
      if (!existingCat) {
        existingCat = await Category.create(cat);
      }
      categoryMap[cat.slug] = existingCat._id.toString();
    }

    for (const c of initialCourses) {
      const existing = await Course.findOne({ slug: c.slug });
      if (!existing) {
        const categoryId = categoryMap[c.categorySlug];
        await Course.create({
          title: c.title,
          titleEn: c.title,
          slug: c.slug,
          shortDescription: c.shortDescription,
          shortDescriptionEn: c.shortDescription,
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
          categoryId: categoryId
            ? new mongoose.Types.ObjectId(categoryId)
            : null,
        });
      }
    }

    const categories = await Category.find();
    for (const cat of categories) {
      const skills = await Skill.find({ categoryId: cat._id });
      if (skills.length > 0) {
        const skillIds = skills.map((s) => s._id);
        await Course.updateMany(
          {
            categoryId: cat._id,
            $or: [{ skillIds: { $exists: false } }, { skillIds: { $size: 0 } }],
          },
          { $set: { skillIds: skillIds.slice(0, 3) } },
        );
      }
    }

    await Course.updateMany(
      {
        slug: /advanced|cybersecurity|devops|production/i,
        level: { $ne: 'Advanced' },
      },
      { $set: { level: 'Advanced' } },
    );
    await Course.updateMany(
      {
        slug: /mastery|architecture|typescript|modeling|ielts|thuc-chien/i,
        level: { $ne: 'Intermediate' },
      },
      { $set: { level: 'Intermediate' } },
    );
    await Course.updateMany(
      { level: { $exists: false } },
      { $set: { level: 'Beginner' } },
    );
  } catch (error) {
    console.error('[CourseController] seedCoursesIfEmpty error:', error);
  }
};

export const getHomeCourses = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await seedCoursesIfEmpty();

    let forYou: ICourse[] = [];
    if (req.user) {
      forYou = await getPersonalizedRecommendations(req.user._id.toString(), 8);
    }

    if (!forYou || forYou.length === 0) {
      forYou = await Course.find({
        status: 'PUBLISHED',
        isDeleted: false,
        isForYou: true,
      })
        .populate('categoryId', 'name slug')
        .sort({ createdAt: 1 })
        .limit(8);
    }

    const bestSellers = await Course.find({
      status: 'PUBLISHED',
      isDeleted: false,
    })
      .populate('categoryId', 'name slug')
      .sort({ totalStudents: -1 })
      .limit(8);

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
    console.error('[CourseController] getHomeCourses error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách khóa học trang chủ',
    });
  }
};

export const recordCourseInteraction = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { actionType, courseId, searchKeyword, metadata } = req.body;
    if (!actionType) {
      res.status(400).json({ success: false, message: 'Thiếu actionType' });
      return;
    }

    if (req.user) {
      await recordInteraction({
        userId: req.user._id,
        courseId: courseId || null,
        actionType,
        searchKeyword,
        metadata,
      });
    }

    res.status(200).json({ success: true, message: 'Đã ghi nhận tương tác' });
  } catch (error) {
    console.error('[CourseController] recordCourseInteraction error:', error);
    res.status(500).json({ success: false, message: 'Lỗi ghi nhận tương tác' });
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
