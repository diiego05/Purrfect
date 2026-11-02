import mongoose from 'mongoose';
import { Course, ICourse } from '../models/Course';
import { OnboardingSurvey } from '../models/OnboardingSurvey';
import { UserInteraction, InteractionType } from '../models/UserInteraction';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

const INTERACTION_WEIGHTS: Record<InteractionType, number> = {
  SEARCH: 0.5,
  VIEW: 1.0,
  CART: 2.0,
  ENROLL: 3.0,
  PROGRESS: 3.5,
  RATING: 4.5,
};

/**
 * Ghi nhận tương tác của người dùng để làm dữ liệu huấn luyện AI
 */
export async function recordInteraction(data: {
  userId: string | mongoose.Types.ObjectId;
  courseId?: string | mongoose.Types.ObjectId | null;
  actionType: InteractionType;
  searchKeyword?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const weight = INTERACTION_WEIGHTS[data.actionType] || 1.0;
    await UserInteraction.create({
      userId: new mongoose.Types.ObjectId(data.userId.toString()),
      courseId: data.courseId
        ? new mongoose.Types.ObjectId(data.courseId.toString())
        : null,
      actionType: data.actionType,
      searchKeyword: data.searchKeyword ? data.searchKeyword.trim() : '',
      weightScore: weight,
      metadata: data.metadata || {},
    });
  } catch (err) {
    console.error('[RecommendationService] Lỗi khi ghi nhận tương tác:', err);
  }
}

/**
 * Chuẩn hóa cấp độ người dùng sang 'Beginner' | 'Intermediate' | 'Advanced'
 */
function normalizeLevel(
  levelStr?: string,
): 'Beginner' | 'Intermediate' | 'Advanced' {
  if (!levelStr) return 'Beginner';
  const lower = levelStr.toLowerCase();
  if (lower.includes('inter') || lower.includes('trung')) return 'Intermediate';
  if (lower.includes('adv') || lower.includes('cao')) return 'Advanced';
  return 'Beginner';
}

/**
 * Gọi Python AI Microservice (FastAPI + Scikit-Learn TF-IDF + SVD)
 */
async function callPythonAIService(
  payload: Record<string, unknown>,
): Promise<string[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500); // 1.5s timeout

    const res = await fetch(`${AI_SERVICE_URL}/api/v1/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.recommended_course_ids)) {
        return data.recommended_course_ids;
      }
    }
  } catch {
    // Nếu Python AI service chưa bật hoặc timeout -> Chuyển sang fallback local
  }
  return null;
}

/**
 * Thuật toán Gợi ý cá nhân hóa:
 * 1. Ưu tiên gọi Python AI Microservice (TF-IDF + SVD + Next-in-Sequence)
 * 2. Tự động Fallback thuật toán Content-Based trên Node.js nếu Python service offline
 */
export async function getPersonalizedRecommendations(
  userId: string,
  limit = 8,
): Promise<ICourse[]> {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1. Đọc khảo sát Onboarding của học viên
    const survey = await OnboardingSurvey.findOne({ userId: userObjectId });

    // 2. Đọc tương tác gần đây của học viên (tìm kiếm, xem chi tiết, đã ghi danh)
    const recentInteractions = await UserInteraction.find({
      userId: userObjectId,
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const enrolledCourseIds = new Set<string>();
    const searchKeywords: string[] = [];

    for (const item of recentInteractions) {
      if (item.actionType === 'ENROLL' && item.courseId) {
        enrolledCourseIds.add(item.courseId.toString());
      }
      if (item.actionType === 'SEARCH' && item.searchKeyword) {
        searchKeywords.push(item.searchKeyword.toLowerCase());
      }
    }

    // 3. Lấy tất cả khóa học PUBLISHED
    const allCourses = await Course.find({
      status: 'PUBLISHED',
      isDeleted: false,
    })
      .populate('categoryId', 'name slug')
      .populate('skillIds', 'name slug')
      .lean();

    // Loại trừ các khóa học đã ghi danh
    const candidates = allCourses.filter(
      (c) => !enrolledCourseIds.has(c._id.toString()),
    );

    if (candidates.length === 0) {
      return [];
    }

    // Nếu học viên chưa làm Onboarding và chưa tìm kiếm gì -> Fallback khóa học nổi bật
    if (!survey && searchKeywords.length === 0) {
      return (await Course.find({
        status: 'PUBLISHED',
        isDeleted: false,
        isForYou: true,
      })
        .populate('categoryId', 'name slug')
        .sort({ averageRating: -1, totalStudents: -1 })
        .limit(limit)
        .lean()) as unknown as ICourse[];
    }

    // 4. THỬ GỌI PYTHON AI SERVICE (FastAPI SVD + TF-IDF)
    const pythonPayload = {
      user_id: userId,
      onboarding: survey
        ? {
            primary_goal: survey.primaryGoal || '',
            category_slugs: (survey.interestedCategoryIds || []).map(
              (id: unknown) => String(id),
            ),
            skill_slugs: (survey.interestedSkillIds || []).map((id: unknown) =>
              String(id),
            ),
            skill_level: survey.skillLevel || 'Beginner',
          }
        : null,
      search_keywords: searchKeywords,
      enrolled_courses: Array.from(enrolledCourseIds).map((id) => ({
        course_id: id,
        progress_percent: 0,
      })),
      all_courses: allCourses.map((c) => ({
        course_id: c._id.toString(),
        title: c.title,
        title_en: c.titleEn || c.title,
        short_description: c.shortDescription || '',
        short_description_en: c.shortDescriptionEn || c.shortDescription || '',
        category_slug: (c.categoryId as { slug?: string } | null)?.slug || '',
        skill_slugs: Array.isArray(c.skillIds)
          ? (c.skillIds as Array<{ slug?: string; name?: string }>).map(
              (s) => s.slug || s.name || String(s),
            )
          : [],
        level: c.level || 'Beginner',
        average_rating: c.averageRating || 5.0,
        total_students: c.totalStudents || 0,
      })),
      interactions: recentInteractions.map((i) => ({
        userId: i.userId.toString(),
        courseId: i.courseId ? i.courseId.toString() : '',
        rating: i.weightScore || 1.0,
      })),
      limit,
    };

    const pythonRecommendedIds = await callPythonAIService(pythonPayload);
    if (pythonRecommendedIds && pythonRecommendedIds.length > 0) {
      const courseMap = new Map(allCourses.map((c) => [c._id.toString(), c]));
      const recommended = pythonRecommendedIds
        .map((id) => courseMap.get(id))
        .filter(Boolean) as unknown as ICourse[];
      if (recommended.length > 0) {
        return recommended;
      }
    }

    // 5. LOCAL FALLBACK (Content-Based Matching thuần)
    const userCategoryIds = new Set(
      (survey?.interestedCategoryIds || []).map((id) => id.toString()),
    );
    const userSkillIds = new Set(
      (survey?.interestedSkillIds || []).map((id) => id.toString()),
    );
    const userLevel = normalizeLevel(survey?.skillLevel);

    const scoredCourses = candidates.map((course) => {
      let score = 0;

      // Tiêu chí A: Khớp Lĩnh vực Onboarding (Trọng số 40%)
      const catObj = course.categoryId as { _id?: unknown } | null;
      const courseCatId = catObj
        ? catObj._id
          ? String(catObj._id)
          : String(course.categoryId)
        : '';
      if (courseCatId && userCategoryIds.has(courseCatId)) {
        score += 0.4;
      }

      // Tiêu chí B: Khớp Kỹ năng mục tiêu Onboarding (Trọng số 30%)
      const courseSkillList = Array.isArray(course.skillIds)
        ? course.skillIds
        : [];
      if (courseSkillList.length > 0 && userSkillIds.size > 0) {
        const matchedSkills = courseSkillList.filter((s: unknown) => {
          const item = s as { _id?: unknown } | null;
          const sId = item?._id ? String(item._id) : s ? String(s) : '';
          return Boolean(sId && userSkillIds.has(sId));
        });
        score += 0.3 * (matchedSkills.length / courseSkillList.length);
      }

      // Tiêu chí C: Khớp Cấp độ trình độ (Trọng số 20%)
      const courseLevel = normalizeLevel(course.level);
      if (courseLevel === userLevel) {
        score += 0.2;
      } else if (
        (userLevel === 'Beginner' && courseLevel === 'Intermediate') ||
        (userLevel === 'Intermediate' && courseLevel === 'Advanced')
      ) {
        score += 0.08;
      }

      // Tiêu chí D: Khớp từ khóa tìm kiếm gần đây (Trọng số 10%)
      if (searchKeywords.length > 0) {
        const textCorpus = `${course.title} ${course.titleEn || ''} ${
          course.shortDescription
        } ${course.shortDescriptionEn || ''}`.toLowerCase();
        for (const kw of searchKeywords) {
          if (textCorpus.includes(kw)) {
            score += 0.1;
            break;
          }
        }
      }

      // Tiêu chí E: Điểm uy tín chất lượng (Bonus tối đa 5%)
      score += ((course.averageRating || 5.0) / 5.0) * 0.05;

      return {
        course,
        score,
      };
    });

    scoredCourses.sort((a, b) => b.score - a.score);
    return scoredCourses
      .slice(0, limit)
      .map((item) => item.course as unknown as ICourse);
  } catch (err) {
    console.error(
      '[RecommendationService] Lỗi khi tạo gợi ý cá nhân hóa:',
      err,
    );
    return (await Course.find({
      status: 'PUBLISHED',
      isDeleted: false,
      isForYou: true,
    })
      .populate('categoryId', 'name slug')
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean()) as unknown as ICourse[];
  }
}
