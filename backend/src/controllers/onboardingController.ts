import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Category } from '../models/Category';
import { Skill } from '../models/Skill';
import { OnboardingSurvey } from '../models/OnboardingSurvey';
import { User } from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { seedCoursesIfEmpty } from './courseController';

// Dữ liệu kỹ năng mẫu theo từng danh mục
const initialSkillsByCategory: Record<string, string[]> = {
  'digital-skills': [
    'Tin học văn phòng (Word, Excel, PowerPoint)',
    'Phân tích dữ liệu với Excel nâng cao',
    'Google Workspace & Tự động hóa công việc',
    'An toàn thông tin & Bảo mật dữ liệu cá nhân',
    'Kỹ năng làm việc từ xa & Quản lý thời gian',
  ],
  development: [
    'Lập trình Web Frontend (React, Next.js, TypeScript)',
    'Lập trình Web Backend (Node.js, Express, NestJS)',
    'Lập trình Python & Tự động hóa',
    'Lập trình ứng dụng di động (Flutter, React Native)',
    'Cơ sở dữ liệu & SQL/NoSQL (MongoDB, PostgreSQL)',
    'DevOps, Docker & Cloud Architecture',
  ],
  design: [
    'Thiết kế giao diện UI/UX (Figma)',
    'Tư duy thiết kế trải nghiệm người dùng (UX Research)',
    'Thiết kế đồ họa & Visual Branding (Photoshop, AI)',
    'Biên tập video & Animation (Premiere, After Effects)',
    'Thiết kế 3D cơ bản (Blender)',
  ],
  business: [
    'Digital Marketing & Social Media Advertising',
    'SEO & Chiến lược tiếp thị nội dung (Content Strategy)',
    'Quản lý dự án theo mô hình Agile / Scrum',
    'Khởi nghiệp & Xây dựng mô hình kinh doanh',
    'Kỹ năng lãnh đạo & Đàm phán kinh doanh',
    'Phân tích tài chính & Đầu tư',
  ],
  'ai-data': [
    'ChatGPT, Claude & Prompt Engineering chuyên sâu',
    'Machine Learning cơ bản đến nâng cao',
    'Deep Learning & Thị giác máy tính (Computer Vision)',
    'Khoa học dữ liệu (Data Science) với Python & Pandas',
    'Xây dựng AI Agents với LangChain & RAG',
    'Trực quan hóa dữ liệu với Power BI & Tableau',
  ],
  languages: [
    'Tiếng Anh giao tiếp công sở & phản xạ đột phá',
    'Luyện thi IELTS 4 kỹ năng (Listening, Speaking, Reading, Writing)',
    'Tiếng Nhật ứng dụng cho người đi làm (JLPT N5 - N3)',
    'Tiếng Trung thương mại & giao tiếp thực chiến',
    'Kỹ năng thuyết trình & đàm phán tự tin trước đám đông',
  ],
  finance: [
    'Quản lý tài chính cá nhân & Kế hoạch tự do tài chính',
    'Đầu tư chứng khoán thực chiến & Phân tích kỹ thuật',
    'Đọc hiểu & Phân tích báo cáo tài chính doanh nghiệp',
    'Quản trị danh mục đầu tư & Quản lý rủi ro',
    'Tư duy tích lũy & Tạo lập thu nhập thụ động',
  ],
  'health-wellness': [
    'Dinh dưỡng học ứng dụng & Chế độ ăn lành mạnh (Eat Clean)',
    'Yoga phục hồi cổ vai gáy & Cột sống cho dân văn phòng',
    'Rèn luyện thể lực & Tập luyện kháng lực tại nhà',
    'Thiền định chánh niệm & Quản trị cảm xúc / Giảm stress',
    'Chăm sóc giấc ngủ & Tối ưu năng lượng sống',
  ],
};

// Hàm seed skills tự động nếu chưa có
export const seedSkillsIfEmpty = async () => {
  try {
    await seedCoursesIfEmpty();
    const categories = await Category.find();

    for (const cat of categories) {
      const existingCount = await Skill.countDocuments({ categoryId: cat._id });
      if (existingCount > 0) continue;

      const skillNames = initialSkillsByCategory[cat.slug] || [];
      if (skillNames.length === 0) continue;

      for (const name of skillNames) {
        const slug = name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        await Skill.create({
          name,
          slug: `${slug}-${cat._id.toString().slice(-4)}`,
          categoryId: cat._id,
        });
      }
    }
  } catch (err) {
    console.error('[Onboarding] Lỗi khi seed skills:', err);
  }
};

/**
 * Lấy toàn bộ danh mục và kỹ năng phục vụ trang Onboarding
 * GET /api/courses/onboarding-data
 */
export const getOnboardingData = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    await seedSkillsIfEmpty();

    const categories = await Category.find().sort({ createdAt: 1 }).lean();
    const skills = await Skill.find().lean();

    // Map skills grouped by categoryId
    const skillsWithCategory = skills.map((s) => ({
      id: s._id.toString(),
      name: s.name,
      slug: s.slug,
      categoryId: s.categoryId.toString(),
    }));

    res.status(200).json({
      success: true,
      categories: categories.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
        description: c.description || '',
      })),
      skills: skillsWithCategory,
    });
  } catch (error) {
    console.error('[Onboarding] Lỗi khi lấy data onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy dữ liệu onboarding',
    });
  }
};

/**
 * Lưu khảo sát Onboarding của người dùng
 * POST /api/auth/onboarding
 */
export const saveOnboardingSurvey = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập' });
      return;
    }

    const {
      primaryGoal,
      interestedCategoryIds,
      interestedSkillIds,
      skillLevel,
    } = req.body;

    if (!primaryGoal) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng chọn mục tiêu học tập chính của bạn',
      });
      return;
    }

    // Convert string ids to ObjectIds safely if valid
    const validCatIds = (interestedCategoryIds || [])
      .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
      .map((id: string) => new mongoose.Types.ObjectId(id));

    const validSkillIds = (interestedSkillIds || [])
      .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
      .map((id: string) => new mongoose.Types.ObjectId(id));

    // Update or create survey
    const survey = await OnboardingSurvey.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      {
        primaryGoal,
        interestedCategoryIds: validCatIds,
        interestedSkillIds: validSkillIds,
        skillLevel: skillLevel || 'Beginner',
        completedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    // Cập nhật trạng thái người dùng đã hoàn thành onboarding
    await User.findByIdAndUpdate(userId, { onboardingCompleted: true });

    res.status(200).json({
      success: true,
      message: 'Khảo sát định hướng onboarding đã được lưu thành công!',
      survey,
    });
  } catch (error) {
    console.error('[Onboarding] Lỗi khi lưu khảo sát:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lưu khảo sát onboarding',
    });
  }
};

/**
 * Lấy khảo sát Onboarding của người dùng hiện tại (nếu có)
 * GET /api/auth/onboarding
 */
export const getUserOnboarding = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập' });
      return;
    }

    const survey = await OnboardingSurvey.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .populate('interestedCategoryIds', 'name slug')
      .populate('interestedSkillIds', 'name slug')
      .lean();

    res.status(200).json({
      success: true,
      survey: survey || null,
    });
  } catch (error) {
    console.error('[Onboarding] Lỗi khi lấy khảo sát user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin khảo sát',
    });
  }
};
