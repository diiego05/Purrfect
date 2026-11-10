import { Course } from '../models/Course';
import { Category } from '../models/Category';
import SystemConfig from '../models/SystemConfig';

// ────────────── Kiến thức nền tảng (Platform Knowledge Base) ──────────────

/**
 * Xây dựng cơ sở tri thức từ các khóa học đang công khai và chính sách hệ thống.
 * Dùng cho RAG: cung cấp context cho AI trả lời câu hỏi.
 */
export async function buildKnowledgeBase(): Promise<string> {
  const sections: string[] = [];

  // 1. Danh sách khóa học đang công khai
  const courses = await Course.find({ status: 'PUBLISHED', isDeleted: false })
    .populate('categoryId', 'name')
    .select(
      'title shortDescription level price discountPrice durationHours averageRating totalStudents slug badge',
    )
    .lean()
    .limit(100);

  if (courses.length > 0) {
    const courseLines = courses.map((c) => {
      const cat =
        c.categoryId && typeof c.categoryId === 'object'
          ? (c.categoryId as { name?: string }).name || 'Chưa phân loại'
          : 'Chưa phân loại';
      const priceStr =
        c.discountPrice && c.discountPrice > 0
          ? `${c.discountPrice.toLocaleString('vi-VN')}đ (gốc ${c.price.toLocaleString('vi-VN')}đ)`
          : c.price === 0
            ? 'Miễn phí'
            : `${c.price.toLocaleString('vi-VN')}đ`;
      return `- "${c.title}" | Danh mục: ${cat} | Trình độ: ${c.level} | Giá: ${priceStr} | ${c.durationHours}h | ⭐${c.averageRating}/5 (${c.totalStudents} học viên) | Đường dẫn: /courses/${c.slug}`;
    });
    sections.push(
      `## DANH SÁCH KHÓA HỌC HIỆN CÓ (${courses.length} khóa)\n${courseLines.join('\n')}`,
    );
  } else {
    sections.push(
      '## DANH SÁCH KHÓA HỌC\nHiện tại hệ thống chưa có khóa học nào được công khai.',
    );
  }

  // 2. Danh mục ngành học
  const categories = await Category.find({}).select('name description').lean();
  if (categories.length > 0) {
    const catLines = categories.map(
      (c) => `- ${c.name}${c.description ? ': ' + c.description : ''}`,
    );
    sections.push(`## DANH MỤC NGÀNH HỌC\n${catLines.join('\n')}`);
  }

  // 3. Chính sách hệ thống từ SystemConfig
  const configs = await SystemConfig.find({}).select('keyName valueText').lean();
  const configMap = new Map<string, string>();
  configs.forEach((cfg: { keyName: string; valueText: string }) =>
    configMap.set(cfg.keyName, cfg.valueText),
  );

  sections.push(`## CHÍNH SÁCH VÀ QUY ĐỊNH CỦA NỀN TẢNG LEARNOVA

### Giới thiệu
Learnova (Purrfect) là nền tảng học trực tuyến (e-learning) cung cấp các khóa học đa dạng từ lập trình, thiết kế đến kinh doanh và phát triển bản thân.

### Chính sách chung
- Người dùng cần đăng ký tài khoản để mua và theo dõi tiến độ khóa học.
- Khách vãng lai có thể xem thông tin khóa học nhưng cần đăng ký để học.
- Hệ thống hỗ trợ đăng nhập bằng email/mật khẩu hoặc Google OAuth.
- Mỗi học viên được sử dụng mã giảm giá (coupon) khi thanh toán khóa học.

### Chính sách hoàn tiền
- Yêu cầu hoàn tiền cần được gửi trong vòng 7 ngày kể từ ngày mua.
- Học viên đã hoàn thành trên 30% nội dung khóa học sẽ không được hoàn tiền.
- Xử lý hoàn tiền trong 5-10 ngày làm việc.

### Chứng chỉ
- Học viên hoàn thành 100% nội dung khóa học sẽ nhận được chứng chỉ hoàn thành.
- Chứng chỉ được cấp dạng điện tử, có thể tải về và chia sẻ.

### Hỗ trợ
- Email hỗ trợ: support@learnova.com
- Thời gian hỗ trợ: 8:00 - 22:00 hàng ngày (GMT+7)
- Hotline: 1900-xxxx

${configMap.get('site_name') ? `Tên nền tảng: ${configMap.get('site_name')}` : ''}
${configMap.get('support_email') ? `Email hỗ trợ: ${configMap.get('support_email')}` : ''}
${configMap.get('support_phone') ? `Điện thoại hỗ trợ: ${configMap.get('support_phone')}` : ''}
`);

  return sections.join('\n\n');
}

// ────────────── Gọi AI (Google Generative AI / Gemini) ──────────────

const SYSTEM_PROMPT = `Bạn là Trợ lý AI tư vấn của nền tảng học trực tuyến Learnova.

QUY TẮC BẮT BUỘC:
1. CHỈ trả lời dựa trên thông tin trong phần "CƠ SỞ TRI THỨC" được cung cấp bên dưới. KHÔNG được tự suy diễn hoặc bịa đặt thông tin không có trong dữ liệu.
2. Nếu câu hỏi nằm NGOÀI phạm vi dữ liệu hệ thống (ví dụ: câu hỏi về thời sự, kiến thức tổng quát, vấn đề cá nhân...), hãy trả lời: "Xin lỗi, tôi chưa có dữ liệu chính xác cho thắc mắc này. Bạn có thể liên hệ bộ phận Chăm sóc khách hàng qua email support@learnova.com hoặc hotline 1900-xxxx để được hỗ trợ thêm nhé!"
3. Luôn trả lời bằng tiếng Việt, thân thiện, ngắn gọn và dễ hiểu.
4. Khi gợi ý khóa học, hãy liệt kê rõ tên khóa học, giá, trình độ và đường dẫn.
5. Nếu người dùng hỏi về lộ trình học tập, hãy gợi ý thứ tự khóa học phù hợp dựa trên trình độ (Beginner → Intermediate → Advanced).
6. KHÔNG bao giờ trả lời về nội dung nhạy cảm, chính trị, tôn giáo hoặc bất kỳ chủ đề nào không liên quan đến giáo dục và nền tảng Learnova.

ĐỊNH DẠNG:
- Trả lời ngắn gọn, tối đa 500 từ.
- Sử dụng bullet points khi liệt kê.
- Khi đề cập khóa học, luôn kèm đường dẫn dạng /courses/slug-name.`;

interface AiChatResponse {
  message: string;
  suggestedCourses: Array<{
    _id: string;
    title: string;
    slug: string;
    price: number;
    discountPrice?: number;
    thumbnailUrl?: string;
    averageRating?: number;
    level?: string;
  }>;
}

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

/**
 * Gọi Python AI Service (FastAPI RAG Microservice)
 * Khớp chuẩn Lược đồ tuần tự 3.2.21:
 * POST /ai/v1/rag/query (courseId, userPrompt)
 * Thời gian chờ tối đa 2s theo ràng buộc hiệu năng của đồ án.
 */
async function callPythonRAGService(
  userMessage: string,
  courseId?: string,
): Promise<AiChatResponse | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${AI_SERVICE_URL}/ai/v1/rag/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId: courseId || null,
        userPrompt: userMessage,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = (await res.json()) as {
      success: boolean;
      answer: string;
    };

    if (data.success && data.answer) {
      const suggestedCourses = await extractMentionedCourses(data.answer);
      return {
        message: data.answer,
        suggestedCourses,
      };
    }
    return null;
  } catch {
    // Python AI service offline hoặc quá 2 giây -> Kích hoạt cơ chế Fallback tự động
    return null;
  }
}

/**
 * Gửi câu hỏi cho AI và nhận câu trả lời có context từ knowledge base.
 */
export async function chat(
  userMessage: string,
  courseId?: string,
): Promise<AiChatResponse> {
  // 1. Thử gọi Python AI Service (RAG) trước theo kiến trúc phân tầng 3.2.21
  const pythonResponse = await callPythonRAGService(userMessage, courseId);
  if (pythonResponse) {
    return pythonResponse;
  }

  // 2. Cơ chế Dự phòng (Fallback): Nếu Python AI quá 2s hoặc chưa bật
  const knowledgeBase = await buildKnowledgeBase();

  const apiKey = process.env.GEMINI_API_KEY;

  // Nếu có API key, dùng Gemini
  if (apiKey) {
    return callGeminiApi(apiKey, knowledgeBase, userMessage);
  }

  // Fallback: trả lời bằng rule-based khi chưa cấu hình API key
  return ruleBasedResponse(knowledgeBase, userMessage);
}

/**
 * Server-Sent Events (SSE) Token Streaming Generator
 * Trả về từng token dạng chuỗi ký tự nối tiếp cho giao diện chat (< 3 giây)
 */
export async function* streamChat(
  userMessage: string,
  courseId?: string,
): AsyncGenerator<{
  type: 'token' | 'done';
  token?: string;
  suggestedCourses?: AiChatResponse['suggestedCourses'];
}> {
  const fullResponse = await chat(userMessage, courseId);

  // Tách từ theo khoảng trắng giữ nguyên định dạng
  const tokens = fullResponse.message.split(/(\s+)/);

  for (const token of tokens) {
    if (token) {
      yield { type: 'token', token };
      // Delay 15ms mô phỏng streaming token tự nhiên
      await new Promise((resolve) => setTimeout(resolve, 15));
    }
  }

  yield {
    type: 'done',
    suggestedCourses: fullResponse.suggestedCourses,
  };
}

/**
 * Gọi Google Generative AI (Gemini) API
 */
async function callGeminiApi(
  apiKey: string,
  knowledgeBase: string,
  userMessage: string,
): Promise<AiChatResponse> {
  // Dynamic import để không crash nếu package chưa cài
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `${SYSTEM_PROMPT}\n\n--- CƠ SỞ TRI THỨC ---\n${knowledgeBase}\n--- HẾT CƠ SỞ TRI THỨC ---\n\nCâu hỏi của người dùng: "${userMessage}"\n\nHãy trả lời theo đúng quy tắc:`;

  const result = await model.generateContent(prompt);
  const responseText =
    result.response?.text?.() || 'Xin lỗi, tôi không thể xử lý yêu cầu này.';

  // Trích xuất khóa học được đề cập trong câu trả lời
  const suggestedCourses = await extractMentionedCourses(responseText);

  return {
    message: responseText,
    suggestedCourses,
  };
}

function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();
}

/**
 * Fallback rule-based khi chưa có API key
 * Tìm kiếm keyword trong câu hỏi và match với khóa học / chính sách
 */
async function ruleBasedResponse(
  knowledgeBase: string,
  userMessage: string,
): Promise<AiChatResponse> {
  const msgLower = userMessage.toLowerCase();
  const msgNormalized = removeDiacritics(msgLower);

  // Các từ khóa chính sách
  const policyKeywords = [
    'hoan tien',
    'hoàn tiền',
    'refund',
    'chinh sach',
    'chính sách',
    'policy',
    'chung chi',
    'chứng chỉ',
    'certificate',
    'ho tro',
    'hỗ trợ',
    'support',
    'lien he',
    'liên hệ',
    'contact',
    'thanh toan',
    'thanh toán',
    'payment',
    'ma giam gia',
    'mã giảm giá',
    'coupon',
    'voucher',
  ];

  const isPolicyQuestion = policyKeywords.some(
    (kw) => msgLower.includes(kw) || msgNormalized.includes(kw),
  );

  if (isPolicyQuestion) {
    let relevantPolicy: string;
    if (
      msgLower.includes('hoàn tiền') ||
      msgNormalized.includes('hoan tien') ||
      msgLower.includes('refund')
    ) {
      relevantPolicy =
        '**Chính sách hoàn tiền:**\n- Yêu cầu hoàn tiền cần được gửi trong vòng 7 ngày kể từ ngày mua.\n- Học viên đã hoàn thành trên 30% nội dung khóa học sẽ không được hoàn tiền.\n- Xử lý hoàn tiền trong 5-10 ngày làm việc.';
    } else if (
      msgLower.includes('chứng chỉ') ||
      msgNormalized.includes('chung chi') ||
      msgLower.includes('certificate')
    ) {
      relevantPolicy =
        '**Chứng chỉ:**\n- Học viên hoàn thành 100% nội dung khóa học sẽ nhận được chứng chỉ hoàn thành.\n- Chứng chỉ được cấp dạng điện tử, có thể tải về và chia sẻ.';
    } else if (
      msgLower.includes('mã giảm giá') ||
      msgNormalized.includes('ma giam gia') ||
      msgLower.includes('coupon') ||
      msgLower.includes('voucher')
    ) {
      relevantPolicy =
        '**Mã giảm giá:**\n- Bạn có thể sử dụng mã giảm giá (coupon) khi thanh toán khóa học.\n- Mỗi mã giảm giá có điều kiện sử dụng riêng (thời hạn, giá trị đơn tối thiểu, số lần sử dụng).';
    } else {
      relevantPolicy =
        'Bạn có thể liên hệ bộ phận hỗ trợ qua email **support@learnova.com** hoặc hotline **1900-xxxx** trong khung giờ 8:00 - 22:00 hàng ngày.';
    }
    return {
      message: `Chào bạn! Dưới đây là thông tin bạn cần:\n\n${relevantPolicy}\n\nNếu cần thêm thông tin, đừng ngại hỏi tôi nhé! 😊`,
      suggestedCourses: [],
    };
  }

  // Khóa học miễn phí
  if (
    msgLower.includes('miễn phí') ||
    msgNormalized.includes('mien phi') ||
    msgLower.includes('free')
  ) {
    const freeCourses = await Course.find({
      status: 'PUBLISHED',
      isDeleted: false,
      price: 0,
    })
      .select('title slug price discountPrice thumbnailUrl averageRating level')
      .limit(4)
      .lean();

    if (freeCourses.length > 0) {
      return {
        message:
          'Chào bạn! Dưới đây là các khóa học **Miễn phí** hiện có trên hệ thống mà bạn có thể bắt đầu học ngay:\n\n' +
          freeCourses.map((c) => `- **${c.title}** (${c.level})`).join('\n') +
          '\n\nChúc bạn học tập hiệu quả! 🚀',
        suggestedCourses: freeCourses.map((c) => ({
          _id: String(c._id),
          title: c.title,
          slug: c.slug,
          price: c.price,
          discountPrice: c.discountPrice,
          thumbnailUrl: c.thumbnailUrl,
          averageRating: c.averageRating,
          level: c.level,
        })),
      };
    } else {
      const budgetCourses = await Course.find({
        status: 'PUBLISHED',
        isDeleted: false,
      })
        .select('title slug price discountPrice thumbnailUrl averageRating level')
        .sort({ discountPrice: 1, price: 1 })
        .limit(3)
        .lean();

      return {
        message:
          'Chào bạn! Hiện tại hệ thống chưa có khóa học miễn phí 100%. Tuy nhiên, Learnova đang áp dụng các chương trình **trợ giá và mã giảm giá (coupon)** cho học viên mới. Dưới đây là các khóa học có mức học phí tối ưu nhất:\n\n' +
          budgetCourses
            .map(
              (c) =>
                `- **${c.title}** | Giá: ${(c.discountPrice || c.price).toLocaleString('vi-VN')}đ`,
            )
            .join('\n') +
          '\n\nBạn có thể nhập mã giảm giá khi thanh toán để được giảm thêm nhé! 😊',
        suggestedCourses: budgetCourses.map((c) => ({
          _id: String(c._id),
          title: c.title,
          slug: c.slug,
          price: c.price,
          discountPrice: c.discountPrice,
          thumbnailUrl: c.thumbnailUrl,
          averageRating: c.averageRating,
          level: c.level,
        })),
      };
    }
  }

  // Khóa học cho người mới bắt đầu (Beginner)
  if (
    msgLower.includes('người mới') ||
    msgNormalized.includes('nguoi moi') ||
    msgNormalized.includes('bat dau') ||
    msgLower.includes('beginner')
  ) {
    const beginnerCourses = await Course.find({
      status: 'PUBLISHED',
      isDeleted: false,
      level: 'Beginner',
    })
      .select('title slug price discountPrice thumbnailUrl averageRating level')
      .limit(4)
      .lean();

    if (beginnerCourses.length > 0) {
      return {
        message:
          'Chào bạn! Đối với người mới bắt đầu, Learnova đề xuất các khóa học nền tảng sau để bạn làm quen dễ dàng nhất:\n\n' +
          beginnerCourses
            .map(
              (c) =>
                `- **${c.title}** | Giá: ${c.price === 0 ? 'Miễn phí' : `${c.price.toLocaleString('vi-VN')}đ`}`,
            )
            .join('\n') +
          '\n\nBạn có thể nhấn vào khóa học bên dưới để xem đề cương chi tiết nhé!',
        suggestedCourses: beginnerCourses.map((c) => ({
          _id: String(c._id),
          title: c.title,
          slug: c.slug,
          price: c.price,
          discountPrice: c.discountPrice,
          thumbnailUrl: c.thumbnailUrl,
          averageRating: c.averageRating,
          level: c.level,
        })),
      };
    }
  }

  // Lộ trình học tập
  if (
    msgLower.includes('lộ trình') ||
    msgNormalized.includes('lo trinh') ||
    msgLower.includes('roadmap')
  ) {
    const roadCourses = await Course.find({
      status: 'PUBLISHED',
      isDeleted: false,
    })
      .select('title slug price discountPrice thumbnailUrl averageRating level')
      .sort({ level: 1 })
      .limit(4)
      .lean();

    return {
      message:
        'Chào bạn! Dưới đây là gợi ý lộ trình học tập tiêu chuẩn tại Learnova theo 3 giai đoạn:\n\n' +
        '1️⃣ **Giai đoạn 1 (Cơ bản - Beginner):** Nắm vững kiến thức nền tảng, cú pháp và tư duy cốt lõi.\n' +
        '2️⃣ **Giai đoạn 2 (Thực hành - Intermediate):** Thực hiện dự án thực tế, áp dụng quy chuẩn ngành.\n' +
        '3️⃣ **Giai đoạn 3 (Chuyên sâu - Advanced):** Tối ưu hóa hiệu năng, kiến trúc hệ thống và triển khai thực tế.\n\n' +
        'Dưới đây là các khóa học tương ứng cho lộ trình của bạn:',
      suggestedCourses: roadCourses.map((c) => ({
        _id: String(c._id),
        title: c.title,
        slug: c.slug,
        price: c.price,
        discountPrice: c.discountPrice,
        thumbnailUrl: c.thumbnailUrl,
        averageRating: c.averageRating,
        level: c.level,
      })),
    };
  }

  // Tìm khóa học theo từ khóa tìm kiếm
  const stopWords = new Set([
    'toi',
    'can',
    'muon',
    'cho',
    'gioi',
    'thieu',
    'goi',
    'recommend',
    'suggest',
    'khoa',
    'hoc',
    'course',
    'courses',
    'va',
    'hoac',
    'hay',
    'co',
    'nao',
    'tot',
    'nhat',
    'phu',
    'hop',
    've',
    'o',
    'tai',
    'la',
    'gi',
    'the',
    'nao',
    'sao',
    'hom',
    'nay',
    'ngay',
    'thoi',
    'tiet',
    'mai',
    'qua',
    'kia',
    'tuan',
    'thang',
    'nam',
    'gio',
    'phut',
    'mua',
    'nang',
    'troi',
    'nhiet',
    'ha',
    'noi',
    'sai',
    'gon',
    'tinh',
    'thanh',
    'pho',
    'ban',
    'minh',
    'em',
    'anh',
    'chi',
    'noi',
    'trong',
    'tren',
    'duoi',
    'cua',
    'nhu',
    'khong',
    'biet',
    'duoc',
  ]);

  const searchTerms = msgNormalized
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !stopWords.has(t));

  if (searchTerms.length > 0) {
    const courses = await Course.find({
      status: 'PUBLISHED',
      isDeleted: false,
    })
      .populate('categoryId', 'name')
      .select(
        'title shortDescription level price discountPrice durationHours averageRating totalStudents slug thumbnailUrl',
      )
      .lean();

    // Tìm khóa học match keyword (tính điểm theo từ nguyên vẹn hoặc từ khóa có nghĩa)
    const scored = courses
      .map((c) => {
        const titleNorm = ` ${removeDiacritics(c.title)} `;
        const descNorm = ` ${removeDiacritics(c.shortDescription || '')} `;
        let score = 0;
        for (const term of searchTerms) {
          // Khớp cả từ hoặc cụm từ
          if (titleNorm.includes(` ${term} `)) {
            score += 5;
          } else if (titleNorm.includes(term)) {
            score += 2;
          }

          if (descNorm.includes(` ${term} `)) {
            score += 2;
          } else if (descNorm.includes(term)) {
            score += 1;
          }
        }
        return { course: c, score };
      })
      .filter((s) => s.score >= 4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    if (scored.length > 0) {
      const courseList = scored
        .map((s) => {
          const c = s.course;
          const priceStr =
            c.discountPrice && c.discountPrice > 0
              ? `${c.discountPrice.toLocaleString('vi-VN')}đ`
              : c.price === 0
                ? 'Miễn phí'
                : `${c.price.toLocaleString('vi-VN')}đ`;
          return `- **${c.title}** | Trình độ: ${c.level} | Giá: ${priceStr} | ⭐${c.averageRating}/5`;
        })
        .join('\n');

      return {
        message: `Chào bạn! Dựa trên yêu cầu của bạn, tôi tìm thấy các khóa học phù hợp sau:\n\n${courseList}\n\nBạn có thể nhấn vào thẻ khóa học bên dưới để xem thông tin chi tiết! 😊`,
        suggestedCourses: scored.map((s) => ({
          _id: String(s.course._id),
          title: s.course.title,
          slug: s.course.slug,
          price: s.course.price,
          discountPrice: s.course.discountPrice,
          thumbnailUrl: s.course.thumbnailUrl,
          averageRating: s.course.averageRating,
          level: s.course.level,
        })),
      };
    }
  }

  // Lời chào mở đầu
  const isGreeting =
    msgLower.includes('xin chào') ||
    msgNormalized.includes('xin chao') ||
    msgLower.includes('hello') ||
    msgLower.includes('hi ') ||
    msgLower === 'hi' ||
    msgLower.includes('hey');

  if (isGreeting) {
    return {
      message:
        'Xin chào! 👋 Tôi là Trợ lý AI của Learnova. Tôi có thể giúp bạn:\n\n- 🎓 Tìm khóa học phù hợp theo nhu cầu\n- 🗺️ Tư vấn lộ trình học tập từ cơ bản đến nâng cao\n- 📋 Giải đáp chính sách hoàn tiền, chứng chỉ, thanh toán\n- 🏷️ Thông tin về mã giảm giá\n\nBạn muốn tôi hỗ trợ gì nhé?',
      suggestedCourses: [],
    };
  }

  // Ngoài phạm vi dữ liệu hệ thống (BR21.2)
  return {
    message:
      'Xin lỗi, tôi chưa có dữ liệu chính xác cho thắc mắc này. Bạn có thể liên hệ bộ phận Chăm sóc khách hàng qua email **support@learnova.com** hoặc hotline **1900-xxxx** để được hỗ trợ thêm nhé! 🙏',
    suggestedCourses: [],
  };
}

/**
 * Trích xuất các khóa học được đề cập trong câu trả lời AI (dựa trên slug trong /courses/xxx)
 */
async function extractMentionedCourses(
  responseText: string,
): Promise<AiChatResponse['suggestedCourses']> {
  const slugMatches = responseText.match(/\/courses\/([a-z0-9-]+)/g);
  if (!slugMatches || slugMatches.length === 0) return [];

  const slugs = slugMatches.map((m) => m.replace('/courses/', ''));
  const courses = await Course.find({
    slug: { $in: slugs },
    status: 'PUBLISHED',
    isDeleted: false,
  })
    .select(
      'title slug price discountPrice thumbnailUrl averageRating level',
    )
    .lean();

  return courses.map((c) => ({
    _id: String(c._id),
    title: c.title,
    slug: c.slug,
    price: c.price,
    discountPrice: c.discountPrice,
    thumbnailUrl: c.thumbnailUrl,
    averageRating: c.averageRating,
    level: c.level,
  }));
}

/**
 * Danh sách câu hỏi gợi ý nhanh (Alternative Flow 2a)
 */
export function getQuickSuggestions(): string[] {
  return [
    'Giới thiệu các khóa học cho người mới bắt đầu',
    'Chính sách hoàn tiền như thế nào?',
    'Làm sao để nhận chứng chỉ?',
    'Có khóa học miễn phí nào không?',
    'Gợi ý lộ trình học lập trình',
    'Cách sử dụng mã giảm giá',
  ];
}
