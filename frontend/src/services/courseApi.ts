import type { HomeCoursesData, Course, Category } from '../types/course';
import { getAccessToken } from './authApi';

const API_BASE = '/api/courses';

export const defaultCategories: Category[] = [
  {
    name: 'Kỹ năng số',
    slug: 'digital-skills',
    description: 'Tin học, tự động hóa & kỹ năng hiện đại',
    courseCount: 2,
  },
  {
    name: 'Lập trình & Phát triển',
    slug: 'development',
    description: 'Web, Mobile, Backend & Cloud Architecture',
    courseCount: 3,
  },
  {
    name: 'Thiết kế & Sáng tạo',
    slug: 'design',
    description: 'UI/UX, Đồ họa & Visual Storytelling',
    courseCount: 2,
  },
  {
    name: 'Kinh doanh & Quản lý',
    slug: 'business',
    description: 'Khởi nghiệp, Marketing & Quản trị',
    courseCount: 3,
  },
  {
    name: 'Trí tuệ nhân tạo',
    slug: 'ai-data',
    description: 'AI, LLMs, Machine Learning & Data Science',
    courseCount: 2,
  },
];

/**
 * Lấy danh sách danh mục (categories) của nền tảng
 */
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Không thể tải danh mục');
    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      return json.data;
    }
    return defaultCategories;
  } catch (error) {
    console.warn('[CourseApi] Sử dụng danh mục mặc định:', error);
    return defaultCategories;
  }
};

/**
 * Lấy danh sách khóa học cho Trang chủ:
 * - forYou: Dành riêng cho bạn (Tự động cá nhân hóa bằng AI nếu đã đăng nhập)
 * - bestSellers: Khóa học bán chạy nhất
 * - newReleases: Khóa học mới ra mắt
 */
export const fetchHomeCourses = async (
  tokenOverride?: string,
): Promise<HomeCoursesData> => {
  try {
    const token = tokenOverride || getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/home`, {
      headers,
    });

    if (!res.ok) {
      throw new Error(`Lỗi kết nối máy chủ (${res.status})`);
    }

    const data = await res.json();
    if (data.success && data.data) {
      return data.data;
    }

    throw new Error(data.message || 'Không thể tải dữ liệu khóa học');
  } catch (err) {
    console.warn('[CourseApi] Sử dụng dữ liệu dự phòng do:', err);
    // Trả về dữ liệu mẫu chất lượng cao dự phòng nếu mạng gián đoạn
    return getFallbackCourses();
  }
};

/**
 * Ghi nhận tương tác của học viên (tìm kiếm, xem khóa học, thêm giỏ hàng)
 * phục vụ huấn luyện mô hình AI gợi ý
 */
export const recordCourseInteraction = async (data: {
  actionType: 'SEARCH' | 'VIEW' | 'CART' | 'ENROLL' | 'PROGRESS' | 'RATING';
  courseId?: string;
  searchKeyword?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> => {
  try {
    const token = getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    await fetch(`${API_BASE}/interactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  } catch (err) {
    // Không làm gián đoạn trải nghiệm người dùng nếu log tương tác gặp lỗi mạng
    console.debug('[CourseApi] Không thể ghi nhận tương tác:', err);
  }
};

/**
 * Lấy chi tiết khóa học theo slug
 */
export const fetchCourseBySlug = async (
  slug: string,
): Promise<Course | null> => {
  try {
    const res = await fetch(`${API_BASE}/${slug}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (error) {
    console.error('[CourseApi] Lỗi lấy chi tiết khóa học:', error);
    return null;
  }
};

// Dữ liệu dự phòng chuẩn đẹp (chính xác mẫu trong ảnh)
const getFallbackCourses = (): HomeCoursesData => ({
  forYou: [
    {
      _id: 'ads-1',
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
      totalStudents: 340,
      isForYou: true,
    },
    {
      _id: 'fullstack-1',
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
    },
    {
      _id: 'uiux-1',
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
    },
    {
      _id: 'genai-1',
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
    },
  ],
  bestSellers: [
    {
      _id: 'bs-1',
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
    },
    {
      _id: 'bs-2',
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
    },
    {
      _id: 'bs-3',
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
    },
    {
      _id: 'bs-4',
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
    },
  ],
  newReleases: [
    {
      _id: 'nr-1',
      title: 'Cloud Native & DevOps on Kubernetes & AWS',
      slug: 'cloud-native-devops-kubernetes-aws',
      shortDescription:
        'Triển khai CI/CD pipeline tự động hóa và kiến trúc vi dịch vụ.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      badge: 'NEW',
      price: 219.99,
      discountPrice: 179.99,
      durationHours: 32,
      durationText: '32h',
      status: 'PUBLISHED',
      averageRating: 4.9,
      totalStudents: 180,
    },
    {
      _id: 'nr-2',
      title: 'Creative Direction & Visual Storytelling',
      slug: 'creative-direction-visual-storytelling',
      shortDescription:
        'Kể chuyện qua hình ảnh và định hướng phong cách sáng tạo đỉnh cao.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
      badge: 'NEW',
      price: 139.99,
      discountPrice: 99.99,
      durationHours: 16,
      durationText: '16h',
      status: 'PUBLISHED',
      averageRating: 4.8,
      totalStudents: 210,
    },
    {
      _id: 'nr-3',
      title: 'Next-Gen Cybersecurity & Ethical Hacking',
      slug: 'next-gen-cybersecurity-ethical-hacking',
      shortDescription:
        'Bảo mật hệ thống thông tin, phòng chống tấn công mạng thế hệ mới.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
      badge: 'NEW',
      price: 199.99,
      discountPrice: 149.99,
      durationHours: 30,
      durationText: '30h',
      status: 'PUBLISHED',
      averageRating: 4.8,
      totalStudents: 145,
    },
    {
      _id: 'nr-4',
      title: 'Startup Financial Modeling & Pitching for Investors',
      slug: 'startup-financial-modeling-pitching',
      shortDescription:
        'Lập mô hình tài chính và kỹ năng thuyết trình gọi vốn cho startup.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80',
      badge: 'NEW',
      price: 149.99,
      discountPrice: 119.99,
      durationHours: 15,
      durationText: '15h',
      status: 'PUBLISHED',
      averageRating: 4.9,
      totalStudents: 95,
    },
  ],
});
