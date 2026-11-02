import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Category } from '../models/Category';
import { Skill } from '../models/Skill';
import { Course } from '../models/Course';
import { UserInteraction, InteractionType } from '../models/UserInteraction';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'purrfect';

// 1. Danh sách 8 Danh mục đa lĩnh vực
const CATEGORIES_DATA = [
  {
    name: 'Kỹ năng số',
    slug: 'digital-skills',
    description: 'Kỹ năng số, tin học văn phòng và công cụ làm việc hiện đại',
  },
  {
    name: 'Lập trình & Phát triển',
    slug: 'development',
    description: 'Lập trình web, di động, kiến trúc hệ thống và backend',
  },
  {
    name: 'Thiết kế & Sáng tạo',
    slug: 'design',
    description: 'UI/UX Design, đồ họa thương hiệu và sản phẩm kỹ thuật số',
  },
  {
    name: 'Kinh doanh & Quản trị',
    slug: 'business',
    description: 'Khởi nghiệp, quản lý dự án Agile/Scrum và digital marketing',
  },
  {
    name: 'Trí tuệ nhân tạo & Dữ liệu',
    slug: 'ai-data',
    description: 'AI, Machine Learning, Deep Learning và phân tích dữ liệu',
  },
  {
    name: 'Ngoại ngữ & Giao tiếp',
    slug: 'languages',
    description:
      'Tiếng Anh giao tiếp, luyện thi IELTS, tiếng Nhật, tiếng Trung',
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
      'Dinh dưỡng khoa học Eat Clean, Yoga trị liệu và giảm căng thẳng',
  },
];

// 2. Kỹ năng chi tiết theo từng danh mục
const SKILLS_DATA: Record<string, string[]> = {
  'digital-skills': [
    'Tin học văn phòng (Word, Excel, PowerPoint)',
    'Phân tích dữ liệu với Excel nâng cao',
    'Google Workspace & Tự động hóa công việc',
    'An toàn thông tin & Bảo mật dữ liệu',
  ],
  development: [
    'Lập trình Web Frontend (React, Next.js)',
    'Lập trình Backend (Node.js, Express)',
    'Lập trình Python & Tự động hóa',
    'Cơ sở dữ liệu MongoDB & PostgreSQL',
  ],
  design: [
    'Thiết kế giao diện UI/UX với Figma',
    'Nghiên cứu trải nghiệm người dùng (UX Research)',
    'Thiết kế đồ họa thương hiệu (Photoshop, Illustrator)',
    'Biên tập video & Animation',
  ],
  business: [
    'Digital Marketing & Social Media Ads',
    'SEO & Content Marketing chiến lược',
    'Quản trị dự án theo mô hình Agile / Scrum',
    'Kỹ năng đàm phán & Thuyết trình kinh doanh',
  ],
  'ai-data': [
    'Prompt Engineering với ChatGPT & Claude',
    'Machine Learning & Xây dựng mô hình AI',
    'Phân tích dữ liệu với Python & Pandas',
    'Trực quan hóa dữ liệu với Power BI',
  ],
  languages: [
    'Tiếng Anh giao tiếp phản xạ công sở',
    'Luyện thi IELTS 4 kỹ năng (6.5+)',
    'Tiếng Trung thương mại cho người đi làm',
    'Tiếng Nhật giao tiếp ứng dụng (N5 - N3)',
  ],
  finance: [
    'Quản lý tài chính cá nhân & Lập ngân sách',
    'Đầu tư chứng khoán thực chiến & Phân tích kỹ thuật',
    'Đọc hiểu & Phân tích báo cáo tài chính',
    'Quản trị danh mục đầu tư & Quản trị rủi ro',
  ],
  'health-wellness': [
    'Dinh dưỡng khoa học & Chế độ ăn Eat Clean',
    'Yoga phục hồi cổ vai gáy cho dân văn phòng',
    'Thiền chánh niệm & Quản trị cảm xúc / Giảm stress',
    'Tập luyện thể lực kháng lực tại nhà',
  ],
};

// 3. Khóa học thực tế theo từng lĩnh vực
const COURSES_DATA = [
  // --- LĨNH VỰC 1: LẬP TRÌNH (IT) ---
  {
    title: 'Lập trình ReactJS từ cơ bản đến nâng cao',
    titleEn: 'ReactJS from Beginner to Advanced',
    slug: 'lap-trinh-reactjs-tu-co-ban-den-nang-cao',
    shortDescription:
      'Làm chủ React 19, Component, Hooks, State Management và Redux Toolkit.',
    shortDescriptionEn:
      'Master React 19, Components, Hooks, State Management and Redux Toolkit.',
    categorySlug: 'development',
    skillIndex: 0,
    level: 'Beginner' as const,
    averageRating: 4.9,
    totalStudents: 1250,
    price: 149.99,
    discountPrice: 99.99,
    durationHours: 30,
    durationText: '30h',
    badge: 'HOT',
    isForYou: true,
  },
  {
    title: 'Chinh phục Next.js 14 & React Server Components',
    titleEn: 'Mastering Next.js 14 & Server Components',
    slug: 'chinh-phuc-nextjs-14-react-server-components',
    shortDescription:
      'Lộ trình nối tiếp dành cho lập trình viên React muốn lên trình độ Intermediate/Advanced.',
    shortDescriptionEn:
      'Learning progression for React developers aiming for Intermediate/Advanced level.',
    categorySlug: 'development',
    skillIndex: 0,
    level: 'Intermediate' as const,
    averageRating: 5.0,
    totalStudents: 680,
    price: 179.99,
    discountPrice: 129.99,
    durationHours: 35,
    durationText: '35h',
    badge: 'NEW',
    isForYou: false,
  },
  {
    title: 'Xây dựng RESTful API chuẩn Enterprise với Node.js & Express',
    titleEn: 'Enterprise RESTful API with Node.js and Express',
    slug: 'xay-dung-restful-api-nodejs-express',
    shortDescription:
      'Thiết kế kiến trúc backend mở rộng, bảo mật JWT, kết nối MongoDB.',
    shortDescriptionEn:
      'Design scalable backend architecture, JWT security, MongoDB integration.',
    categorySlug: 'development',
    skillIndex: 1,
    level: 'Beginner' as const,
    averageRating: 4.8,
    totalStudents: 890,
    price: 139.99,
    discountPrice: 89.99,
    durationHours: 25,
    durationText: '25h',
    badge: 'POPULAR',
    isForYou: true,
  },

  // --- LĨNH VỰC 2: NGOẠI NGỮ & GIAO TIẾP (NON-IT) ---
  {
    title: 'Tiếng Anh Giao Tiếp Phản Xạ Đột Phá Cho Người Mới Bắt Đầu',
    titleEn: 'Breakthrough English Communication for Beginners',
    slug: 'tieng-anh-giao-tiep-phan-xa-dot-pha',
    shortDescription:
      'Chuẩn hóa phát âm IPA, tạo phản xạ nói tự nhiên trong công việc và đời sống.',
    shortDescriptionEn:
      'Standardize IPA pronunciation, build natural speaking reflexes for work and life.',
    categorySlug: 'languages',
    skillIndex: 0,
    level: 'Beginner' as const,
    averageRating: 4.9,
    totalStudents: 1540,
    price: 129.99,
    discountPrice: 79.99,
    durationHours: 24,
    durationText: '24h',
    badge: 'HOT',
    isForYou: true,
  },
  {
    title: 'Chiến Thuật Bứt Phá IELTS 6.5+ Toàn Diện 4 Kỹ Năng',
    titleEn: 'IELTS 6.5+ Comprehensive Strategy: 4 Skills',
    slug: 'chien-thuat-but-pha-ielts-6-5-plus',
    shortDescription:
      'Lộ trình nối tiếp nâng tầm từ giao tiếp nền tảng lên band 6.5+ phục vụ du học và định cư.',
    shortDescriptionEn:
      'Next progression from communication foundation to band 6.5+ for study and work.',
    categorySlug: 'languages',
    skillIndex: 1,
    level: 'Intermediate' as const,
    averageRating: 5.0,
    totalStudents: 910,
    price: 189.99,
    discountPrice: 149.99,
    durationHours: 45,
    durationText: '45h',
    badge: 'NEW',
    isForYou: false,
  },
  {
    title: 'Tiếng Trung Giao Tiếp Thương Mại Dành Cho Người Đi Làm',
    titleEn: 'Business Chinese Communication for Professionals',
    slug: 'tieng-trung-giao-tiep-thuong-mai-nguoi-di-lam',
    shortDescription:
      'Thành thạo 600 từ vựng và cấu trúc đàm phán, làm việc trực tiếp với đối tác Trung Quốc.',
    shortDescriptionEn:
      'Master 600 vocabulary words and negotiation structures with Chinese partners.',
    categorySlug: 'languages',
    skillIndex: 2,
    level: 'Beginner' as const,
    averageRating: 4.8,
    totalStudents: 580,
    price: 119.99,
    discountPrice: 69.99,
    durationHours: 20,
    durationText: '20h',
    badge: 'NEW',
    isForYou: true,
  },

  // --- LĨNH VỰC 3: TÀI CHÍNH & ĐẦU TƯ (NON-IT) ---
  {
    title: 'Quản Lý Tài Chính Cá Nhân & Tư Duy Tích Lũy Đầu Tư An Toàn',
    titleEn: 'Personal Finance Management & Safe Wealth Building',
    slug: 'quan-ly-tai-chinh-ca-nhan-tich-luy-dau-tu',
    shortDescription:
      'Quản lý dòng tiền thông minh, xây dựng quỹ dự phòng và lộ trình đạt tự do tài chính.',
    shortDescriptionEn:
      'Smart cashflow management, emergency fund building and financial freedom roadmap.',
    categorySlug: 'finance',
    skillIndex: 0,
    level: 'Beginner' as const,
    averageRating: 4.9,
    totalStudents: 1220,
    price: 99.99,
    discountPrice: 59.99,
    durationHours: 18,
    durationText: '18h',
    badge: 'HOT',
    isForYou: true,
  },
  {
    title: 'Đầu Tư Chứng Khoán Thực Chiến & Đọc Vị Báo Cáo Tài Chính',
    titleEn: 'Practical Stock Market Investing & Financial Statements',
    slug: 'dau-tu-chung-khoan-thuc-chien-doc-vi-bctc',
    shortDescription:
      'Khóa học nối tiếp: Phân tích kỹ thuật biểu đồ, định giá doanh nghiệp và quản trị rủi ro.',
    shortDescriptionEn:
      'Progression course: Technical chart analysis, business valuation and risk management.',
    categorySlug: 'finance',
    skillIndex: 1,
    level: 'Intermediate' as const,
    averageRating: 4.8,
    totalStudents: 850,
    price: 159.99,
    discountPrice: 119.99,
    durationHours: 32,
    durationText: '32h',
    badge: 'POPULAR',
    isForYou: false,
  },

  // --- LĨNH VỰC 4: SỨC KHỎE & ĐỜI SỐNG (NON-IT) ---
  {
    title: 'Dinh Dưỡng Khoa Học & Thiết Kế Thực Đơn Sống Khỏe (Eat Clean)',
    titleEn: 'Applied Nutrition Science & Healthy Meal Planning',
    slug: 'dinh-duong-khoa-hoc-thuc-don-song-khoe-eat-clean',
    shortDescription:
      'Hiểu đúng về Calo, Macro, chế độ ăn Eat Clean khoa học không gây kiệt sức hay tăng cân lại.',
    shortDescriptionEn:
      'Understand Calories, Macros, sustainable Eat Clean meal planning without fatigue.',
    categorySlug: 'health-wellness',
    skillIndex: 0,
    level: 'Beginner' as const,
    averageRating: 4.9,
    totalStudents: 780,
    price: 89.99,
    discountPrice: 49.99,
    durationHours: 15,
    durationText: '15h',
    badge: 'HOT',
    isForYou: true,
  },
  {
    title: 'Yoga Trị Liệu Cổ Vai Gáy & Phục Hồi Cột Sống Nơi Công Sở',
    titleEn: 'Office Yoga Therapy for Neck, Shoulder & Spine Relief',
    slug: 'yoga-tri-lieu-co-vai-gay-phuc-hoi-cot-song',
    shortDescription:
      '15 phút mỗi ngày phục hồi cơ bắp, giảm đau lưng và tái tạo năng lượng cho dân văn phòng.',
    shortDescriptionEn:
      '15 minutes daily to relieve muscle tension, back pain and recharge energy.',
    categorySlug: 'health-wellness',
    skillIndex: 1,
    level: 'Beginner' as const,
    averageRating: 4.9,
    totalStudents: 980,
    price: 79.99,
    discountPrice: 39.99,
    durationHours: 14,
    durationText: '14h',
    badge: 'NEW',
    isForYou: true,
  },

  // --- LĨNH VỰC 5: THIẾT KẾ & SÁNG TẠO ---
  {
    title: 'UI/UX Design Mastery: Thiết Kế Sản Phẩm Số Chuẩn Quốc Tế với Figma',
    titleEn: 'UI/UX Design Mastery with Figma',
    slug: 'ui-ux-design-mastery-figma',
    shortDescription:
      'Từ nghiên cứu hành vi người dùng, Wireframe đến xây dựng Design System hoàn chỉnh.',
    shortDescriptionEn:
      'From user research, Wireframes to complete Design System architecture.',
    categorySlug: 'design',
    skillIndex: 0,
    level: 'Beginner' as const,
    averageRating: 4.9,
    totalStudents: 920,
    price: 139.99,
    discountPrice: 89.99,
    durationHours: 26,
    durationText: '26h',
    badge: 'HOT',
    isForYou: true,
  },

  // --- LĨNH VỰC 6: TRÍ TUỆ NHÂN TẠO ---
  {
    title: 'Làm Chủ AI: Ứng Dụng ChatGPT & Claude Tự Động Hóa Công Việc',
    titleEn: 'Mastering AI: Automate Work with ChatGPT & Claude',
    slug: 'lam-chu-ai-chatgpt-claude-tu-dong-hoa',
    shortDescription:
      'Nắm vững nghệ thuật Prompt Engineering, tối ưu 80% thời gian xử lý văn bản, dữ liệu và code.',
    shortDescriptionEn:
      'Master Prompt Engineering, automate 80% of document, data and coding tasks.',
    categorySlug: 'ai-data',
    skillIndex: 0,
    level: 'Beginner' as const,
    averageRating: 5.0,
    totalStudents: 1650,
    price: 109.99,
    discountPrice: 69.99,
    durationHours: 16,
    durationText: '16h',
    badge: 'HOT',
    isForYou: true,
  },
];

async function runSeed() {
  console.log(
    '===============================================================',
  );
  console.log('   BẮT ĐẦU SEED DỮ LIỆU ĐA LĨNH VỰC VÀO MONGODB DATABASE');
  console.log(
    '===============================================================',
  );

  try {
    console.log(
      `[1/5] Kết nối tới MongoDB: ${MONGODB_URI} (DB: ${MONGODB_DB_NAME})...`,
    );
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✓ Kết nối MongoDB thành công!');

    // 1. Tạo hoặc cập nhật Categories
    console.log('\n[2/5] Đang đồng bộ 8 Danh mục (Categories)...');
    const categoryMap: Record<string, mongoose.Types.ObjectId> = {};
    for (const catData of CATEGORIES_DATA) {
      const cat = await Category.findOneAndUpdate(
        { slug: catData.slug },
        { $set: catData },
        { upsert: true, new: true },
      );
      categoryMap[catData.slug] = cat._id;
      console.log(`  + [Category] ${cat.name} (${cat.slug}) -> ID: ${cat._id}`);
    }

    // 2. Tạo hoặc cập nhật Skills
    console.log('\n[3/5] Đang đồng bộ Kỹ năng (Skills) cho từng danh mục...');
    const skillMap: Record<string, mongoose.Types.ObjectId[]> = {};
    for (const [catSlug, skillList] of Object.entries(SKILLS_DATA)) {
      const catId = categoryMap[catSlug];
      if (!catId) continue;
      skillMap[catSlug] = [];

      for (const skillName of skillList) {
        const slug = skillName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const skill = await Skill.findOneAndUpdate(
          { name: skillName, categoryId: catId },
          {
            $set: {
              name: skillName,
              slug: `${slug}-${catId.toString().slice(-4)}`,
              categoryId: catId,
            },
          },
          { upsert: true, new: true },
        );
        skillMap[catSlug].push(skill._id);
      }
      console.log(
        `  + Đã lưu ${skillList.length} kỹ năng cho danh mục: ${catSlug}`,
      );
    }

    // 3. Tạo hoặc cập nhật Khóa học (Courses) với liên kết chính xác CategoryId và SkillIds
    console.log(
      '\n[4/5] Đang đồng bộ Khóa học (Courses) với liên kết MongoDB thực tế...',
    );
    const courseMap: Record<string, mongoose.Types.ObjectId> = {};

    for (const c of COURSES_DATA) {
      const catId = categoryMap[c.categorySlug];
      const availableSkills = skillMap[c.categorySlug] || [];
      const primarySkillId =
        availableSkills[c.skillIndex] || availableSkills[0];
      const skillIds = primarySkillId ? [primarySkillId] : [];

      const courseDoc = await Course.findOneAndUpdate(
        { slug: c.slug },
        {
          $set: {
            title: c.title,
            titleEn: c.titleEn,
            slug: c.slug,
            shortDescription: c.shortDescription,
            shortDescriptionEn: c.shortDescriptionEn,
            thumbnailUrl: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80`,
            badge: c.badge,
            price: c.price,
            discountPrice: c.discountPrice,
            durationHours: c.durationHours,
            durationText: c.durationText,
            status: 'PUBLISHED',
            averageRating: c.averageRating,
            totalStudents: c.totalStudents,
            isForYou: c.isForYou,
            level: c.level,
            categoryId: catId,
            skillIds: skillIds,
            isDeleted: false,
          },
        },
        { upsert: true, new: true },
      );

      courseMap[c.slug] = courseDoc._id;
      console.log(
        `  + [Course] ${c.title.slice(0, 42)}... | Level: ${c.level} | Cat: ${c.categorySlug} | Skills: ${skillIds.length}`,
      );
    }

    // 4. Seed dữ liệu tương tác mẫu (UserInteraction) trong MongoDB cho Collaborative Filtering SVD
    console.log(
      '\n[5/5] Đang tạo dữ liệu tương tác học viên mẫu (UserInteractions) trong MongoDB...',
    );
    const interactionCount = await UserInteraction.countDocuments();
    if (interactionCount < 25) {
      const demoUsers = [
        new mongoose.Types.ObjectId('650000000000000000000001'),
        new mongoose.Types.ObjectId('650000000000000000000002'),
        new mongoose.Types.ObjectId('650000000000000000000003'),
        new mongoose.Types.ObjectId('650000000000000000000004'),
        new mongoose.Types.ObjectId('650000000000000000000005'),
        new mongoose.Types.ObjectId('650000000000000000000006'),
      ];

      const sampleInteractions: Array<{
        userId: mongoose.Types.ObjectId;
        courseId: mongoose.Types.ObjectId;
        actionType: InteractionType;
        weightScore: number;
      }> = [
        // User 1: Thích Ngoại ngữ
        {
          userId: demoUsers[0],
          courseId: courseMap['tieng-anh-giao-tiep-phan-xa-dot-pha'],
          actionType: 'ENROLL',
          weightScore: 5.0,
        },
        {
          userId: demoUsers[0],
          courseId: courseMap['chien-thuat-but-pha-ielts-6-5-plus'],
          actionType: 'VIEW',
          weightScore: 4.5,
        },
        {
          userId: demoUsers[0],
          courseId: courseMap['tieng-trung-giao-tiep-thuong-mai-nguoi-di-lam'],
          actionType: 'CART',
          weightScore: 4.0,
        },
        // User 2: Thích Ngoại ngữ & IELTS
        {
          userId: demoUsers[1],
          courseId: courseMap['tieng-anh-giao-tiep-phan-xa-dot-pha'],
          actionType: 'PROGRESS',
          weightScore: 4.8,
        },
        {
          userId: demoUsers[1],
          courseId: courseMap['chien-thuat-but-pha-ielts-6-5-plus'],
          actionType: 'ENROLL',
          weightScore: 5.0,
        },
        // User 3: Thích Tài chính
        {
          userId: demoUsers[2],
          courseId: courseMap['quan-ly-tai-chinh-ca-nhan-tich-luy-dau-tu'],
          actionType: 'ENROLL',
          weightScore: 5.0,
        },
        {
          userId: demoUsers[2],
          courseId: courseMap['dau-tu-chung-khoan-thuc-chien-doc-vi-bctc'],
          actionType: 'PROGRESS',
          weightScore: 4.9,
        },
        // User 4: Thích Sức khỏe & Yoga
        {
          userId: demoUsers[3],
          courseId:
            courseMap['dinh-duong-khoa-hoc-thuc-don-song-khoe-eat-clean'],
          actionType: 'ENROLL',
          weightScore: 5.0,
        },
        {
          userId: demoUsers[3],
          courseId: courseMap['yoga-tri-lieu-co-vai-gay-phuc-hoi-cot-song'],
          actionType: 'PROGRESS',
          weightScore: 4.9,
        },
        // User 5: Thích Lập trình
        {
          userId: demoUsers[4],
          courseId: courseMap['lap-trinh-reactjs-tu-co-ban-den-nang-cao'],
          actionType: 'ENROLL',
          weightScore: 5.0,
        },
        {
          userId: demoUsers[4],
          courseId: courseMap['chinh-phuc-nextjs-14-react-server-components'],
          actionType: 'PROGRESS',
          weightScore: 5.0,
        },
        {
          userId: demoUsers[4],
          courseId: courseMap['xay-dung-restful-api-nodejs-express'],
          actionType: 'CART',
          weightScore: 4.0,
        },
        // User 6: Thích AI & Thiết kế
        {
          userId: demoUsers[5],
          courseId: courseMap['lam-chu-ai-chatgpt-claude-tu-dong-hoa'],
          actionType: 'ENROLL',
          weightScore: 5.0,
        },
        {
          userId: demoUsers[5],
          courseId: courseMap['ui-ux-design-mastery-figma'],
          actionType: 'VIEW',
          weightScore: 4.5,
        },
      ];

      for (const item of sampleInteractions) {
        if (item.courseId) {
          await UserInteraction.create(item);
        }
      }
      console.log(
        `  + Đã tạo ${sampleInteractions.length} bản ghi tương tác thực tế trong UserInteractions collection!`,
      );
    }

    // THỐNG KÊ TỔNG KẾT TRONG DATABASE
    const totalCats = await Category.countDocuments();
    const totalSkills = await Skill.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalInteractions = await UserInteraction.countDocuments();

    console.log(
      '\n===============================================================',
    );
    console.log('   ĐỒNG BỘ DỮ LIỆU VÀO MONGODB HOÀN TẤT!');
    console.log(
      '===============================================================',
    );
    console.log(`✓ Tổng số Danh mục trong Database:   ${totalCats}`);
    console.log(`✓ Tổng số Kỹ năng trong Database:     ${totalSkills}`);
    console.log(`✓ Tổng số Khóa học trong Database:    ${totalCourses}`);
    console.log(`✓ Tổng số Tương tác trong Database:   ${totalInteractions}`);
    console.log(
      '===============================================================',
    );

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Lỗi khi thực hiện seed vào MongoDB:', error);
    process.exit(1);
  }
}

runSeed();
