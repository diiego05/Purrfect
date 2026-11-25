import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Course } from '../models/Course';
import { Category } from '../models/Category';
import { Skill } from '../models/Skill';
import { User } from '../models/User';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/purrfect';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'purrfect';

interface CourseSeedDef {
  categorySlug: string;
  title: string;
  titleEn: string;
  slug: string;
  shortDescription: string;
  shortDescriptionEn: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  price: number;
  discountPrice?: number;
  durationHours: number;
  durationText: string;
  badge?: string;
  averageRating: number;
  totalStudents: number;
  isForYou: boolean;
  thumbnailUrl: string;
}

const NEW_COURSES: CourseSeedDef[] = [
  // ==========================================
  // 1. KỸ NĂNG SỐ (digital-skills) - 10 KHÓA
  // ==========================================
  {
    categorySlug: 'digital-skills',
    title: 'Làm Chủ Excel Từ Cơ Bản Đến Chuyên Gia Xử Lý Dữ Liệu',
    titleEn: 'Excel Mastery: From Basic to Advanced Data Professional',
    slug: 'lam-chu-excel-tu-co-ban-den-chuyen-gia',
    shortDescription:
      'Thành thạo hơn 100 hàm thông dụng, VLOOKUP, XLOOKUP, PivotTable và phân tích báo cáo trực quan.',
    shortDescriptionEn:
      'Master 100+ functions, XLOOKUP, PivotTables and dynamic management reporting.',
    description:
      'Khóa học trang bị toàn diện kỹ năng bảng tính điện tử từ định dạng dữ liệu, xử lý công thức phức tạp, tự động hóa tính toán đến trực quan hóa số liệu phục vụ văn phòng.',
    level: 'Beginner',
    price: 990000,
    discountPrice: 499000,
    durationHours: 25,
    durationText: '25h',
    badge: 'HOT',
    averageRating: 4.9,
    totalStudents: 3120,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'digital-skills',
    title: 'Tự Động Hóa Công Việc Văn Phòng Với Google Sheets & Apps Script',
    titleEn: 'Office Automation with Google Sheets & Apps Script',
    slug: 'tu-dong-hoa-google-sheets-apps-script',
    shortDescription:
      'Tự động gửi email báo cáo, đồng bộ dữ liệu thời gian thực và lập lịch tác vụ thông minh không cần code phức tạp.',
    shortDescriptionEn:
      'Automate email reports, real-time sync and scheduled tasks with Google Apps Script.',
    description:
      'Giải phóng thời gian làm việc thủ công với sức mạnh của Google Apps Script tích hợp Gmail, Google Drive và Forms.',
    level: 'Intermediate',
    price: 1200000,
    discountPrice: 650000,
    durationHours: 18,
    durationText: '18h',
    badge: 'NEW',
    averageRating: 4.8,
    totalStudents: 1450,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'digital-skills',
    title:
      'Xây Dựng Dashboard Báo Cáo Quản Trị Đỉnh Cao Bằng Excel & Power Query',
    titleEn: 'Executive Dashboard Building with Excel & Power Query',
    slug: 'xay-dung-dashboard-bao-cao-quan-tri-excel-power-query',
    shortDescription:
      'Biến dữ liệu thô hàng triệu dòng thành Dashboard trực quan, tương tác đa chiều cho cấp quản lý ra quyết định.',
    shortDescriptionEn:
      'Transform raw data into interactive executive dashboards for leadership decision making.',
    description:
      'Chuyên sâu về Power Query ETL, Data Model Power Pivot và thiết kế giao diện báo cáo chuyên nghiệp chuẩn quốc tế.',
    level: 'Advanced',
    price: 1500000,
    discountPrice: 890000,
    durationHours: 30,
    durationText: '30h',
    badge: 'BESTSELLER',
    averageRating: 5.0,
    totalStudents: 2200,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'digital-skills',
    title: 'Thiết Kế Slide Thuyết Trình Ấn Tượng Với PowerPoint & Canva Pro',
    titleEn: 'Impressive Presentation Design with PowerPoint & Canva',
    slug: 'thiet-ke-slide-thuyet-trinh-powerpoint-canva',
    shortDescription:
      'Bí quyết bố cục thị giác, phối màu hiện đại và hiệu ứng Morph mượt mà giúp bài thuyết trình cuốn hút từ giây đầu tiên.',
    shortDescriptionEn:
      'Visual layout secrets, modern color schemes and Morph effects for captivating presentations.',
    description:
      'Phương pháp tư duy thiết kế bài thuyết trình kinh doanh, báo cáo dự án và pitch deck gọi vốn triệu đô.',
    level: 'Beginner',
    price: 690000,
    discountPrice: 299000,
    durationHours: 15,
    durationText: '15h',
    badge: 'POPULAR',
    averageRating: 4.85,
    totalStudents: 2890,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'digital-skills',
    title:
      'Quản Lý Công Việc & Xây Dựng Hệ Thống Kiến Thức Cá Nhân Bằng Notion',
    titleEn: 'Personal Knowledge Management & Task System with Notion',
    slug: 'quan-ly-cong-viec-kien-thuc-notion',
    shortDescription:
      'Xây dựng Second Brain, hệ thống quản lý dự án PARA và lịch trình làm việc tối ưu năng suất cá nhân.',
    shortDescriptionEn:
      'Build your Second Brain, PARA framework and personal task operating system in Notion.',
    description:
      'Làm chủ Notion Database, Relations, Rollups và Formula 2.0 để kiến tạo hệ thống làm việc thông minh trọn đời.',
    level: 'Beginner',
    price: 0, // Khóa học miễn phí
    discountPrice: 0,
    durationHours: 12,
    durationText: '12h',
    badge: 'HOT',
    averageRating: 4.95,
    totalStudents: 4200,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'digital-skills',
    title:
      'Tin Học Văn Phòng Cấp Tốc Chuẩn MOS Quốc Tế (Word, Excel, PowerPoint)',
    titleEn: 'Fast-Track International MOS Office Skills',
    slug: 'tin-hoc-van-phong-cap-toc-mos',
    shortDescription:
      'Học nhanh các mẹo phím tắt, chuẩn hóa văn bản hành chính và luyện thi chứng chỉ MOS điểm tuyệt đối.',
    shortDescriptionEn:
      'Fast shortcuts, administrative document standardization and MOS certification prep.',
    description:
      'Chương trình luyện thi toàn diện các module Word, Excel, PowerPoint chuẩn chứng chỉ tin học quốc tế Certiport.',
    level: 'Beginner',
    price: 850000,
    discountPrice: 399000,
    durationHours: 22,
    durationText: '22h',
    badge: 'POPULAR',
    averageRating: 4.8,
    totalStudents: 1950,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'digital-skills',
    title: 'An Toàn Thông Tin & Bảo Mật Dữ Liệu Công Sở Thời Đại Số',
    titleEn: 'Workplace Cybersecurity & Data Protection in the Digital Era',
    slug: 'an-toan-thong-tin-bao-mat-du-lieu-cong-so',
    shortDescription:
      'Nhận diện các hình thức lừa đảo Phishing, mã hóa dữ liệu nhạy cảm và bảo vệ tài khoản doanh nghiệp an toàn.',
    shortDescriptionEn:
      'Detect phishing scams, encrypt sensitive data and safeguard enterprise accounts.',
    description:
      'Cung cấp kiến thức nền tảng về phòng chống tấn công mạng, an ninh mật khẩu, 2FA và bảo mật thiết bị làm việc di động.',
    level: 'Beginner',
    price: 750000,
    discountPrice: 350000,
    durationHours: 10,
    durationText: '10h',
    badge: 'NEW',
    averageRating: 4.75,
    totalStudents: 1100,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'digital-skills',
    title: 'Xử Lý & Số Hóa Dữ Liệu Lớn Cho Bộ Phận Kế Toán - Nhân Sự',
    titleEn: 'Data Processing & Digitization for HR and Accounting',
    slug: 'xu-ly-so-hoa-du-lieu-ke-toan-nhan-su',
    shortDescription:
      'Quy trình đối chiếu dữ liệu bảng lương, lọc trùng, chuẩn hóa hàng vạn bản ghi chính xác 100% trong tích tắc.',
    shortDescriptionEn:
      'Automate payroll reconciliation, de-duplication and records cleaning in seconds.',
    description:
      'Dành riêng cho nhân viên kế toán, C&B và tuyển dụng muốn nâng cấp kỹ năng xử lý dữ liệu phức tạp trên bảng tính.',
    level: 'Intermediate',
    price: 1100000,
    discountPrice: 590000,
    durationHours: 16,
    durationText: '16h',
    badge: 'HOT',
    averageRating: 4.88,
    totalStudents: 1340,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'digital-skills',
    title: 'Tối Ưu Hiệu Suất Cá Nhân Với Công Cụ AI & Tự Động Hóa Zapier',
    titleEn: 'Personal Productivity Boost with AI Tools & Zapier Automation',
    slug: 'toi-uu-hieu-suat-ai-zapier',
    shortDescription:
      'Kết nối tự động giữa Email, Trello, Google Drive và Slack giúp tiết kiệm 15 giờ làm việc mỗi tuần.',
    shortDescriptionEn:
      'Connect Email, Trello, Drive and Slack to save 15+ hours weekly with no-code Zaps.',
    description:
      'Khám phá thế giới No-code Automation với Zapier và Make.com kết hợp mô hình AI để xử lý công việc hoàn toàn tự động.',
    level: 'Intermediate',
    price: 1350000,
    discountPrice: 750000,
    durationHours: 20,
    durationText: '20h',
    badge: 'NEW',
    averageRating: 4.9,
    totalStudents: 1620,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'digital-skills',
    title: 'Kỹ Năng Quản Lý Tài Liệu & Số Hóa Quy Trình Doanh Nghiệp Vừa & Nhỏ',
    titleEn: 'Document Management & Process Digitization for SMEs',
    slug: 'quan-ly-tai-lieu-so-hoa-quy-trinh-sme',
    shortDescription:
      'Thiết lập quy trình lưu trữ đám mây, phân quyền truy cập và ký duyệt điện tử tinh gọn cho đội ngũ.',
    shortDescriptionEn:
      'Set up cloud archiving, permission matrix and paperless e-signing for agile teams.',
    description:
      'Hỗ trợ các nhà quản lý chuyển đổi văn phòng không giấy tờ, nâng cao tính bảo mật và cộng tác nhóm liền mạch.',
    level: 'Intermediate',
    price: 1250000,
    discountPrice: 690000,
    durationHours: 14,
    durationText: '14h',
    badge: '',
    averageRating: 4.78,
    totalStudents: 880,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
  },

  // ==========================================
  // 2. LẬP TRÌNH & PHÁT TRIỂN (development) - 10 KHÓA
  // ==========================================
  {
    categorySlug: 'development',
    title: 'Lập Trình TypeScript & Thiết Kế Kiến Trúc Clean Architecture',
    titleEn: 'TypeScript & Clean Architecture Enterprise Design',
    slug: 'typescript-clean-architecture-enterprise',
    shortDescription:
      'Làm chủ Type System chuyên sâu, Generics, SOLID Principles và xây dựng source code chuẩn quy mô lớn.',
    shortDescriptionEn:
      'Deep-dive into TypeScript type system, Generics, SOLID principles and enterprise architecture.',
    description:
      'Nâng tầm kỹ năng lập trình hướng đối tượng và kiến trúc phân tầng chuyên nghiệp, dễ bảo trì và mở rộng trong các dự án thực tế.',
    level: 'Intermediate',
    price: 1800000,
    discountPrice: 1190000,
    durationHours: 35,
    durationText: '35h',
    badge: 'HOT',
    averageRating: 4.95,
    totalStudents: 2150,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'development',
    title: 'Xây Dựng Fullstack Web App Với NestJS, PostgreSQL & GraphQL',
    titleEn: 'Fullstack Web App with NestJS, PostgreSQL & GraphQL',
    slug: 'fullstack-nestjs-postgresql-graphql',
    shortDescription:
      'Thiết kế hệ thống Backend theo kiến trúc Module, xác thực JWT, TypeORM và tối ưu truy vấn cơ sở dữ liệu.',
    shortDescriptionEn:
      'Build modular Backend with NestJS, JWT Auth, TypeORM and high-performance GraphQL queries.',
    description:
      'Khóa học thực chiến xây dựng ứng dụng thương mại điện tử hoàn chỉnh từ mô hình hóa dữ liệu đến triển khai lên máy chủ đám mây.',
    level: 'Advanced',
    price: 2200000,
    discountPrice: 1490000,
    durationHours: 48,
    durationText: '48h',
    badge: 'BESTSELLER',
    averageRating: 5.0,
    totalStudents: 1780,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'development',
    title: 'Lập Trình Ứng Dụng Di Động Đa Nền Tảng Với Flutter & Riverpod',
    titleEn: 'Cross-Platform Mobile App Development with Flutter & Riverpod',
    slug: 'lap-trinh-di-dong-flutter-riverpod',
    shortDescription:
      'Xây dựng ứng dụng iOS & Android từ một mã nguồn duy nhất với giao diện mượt mà và quản lý trạng thái hiện đại.',
    shortDescriptionEn:
      'Build iOS and Android apps from a single codebase with Flutter and Riverpod state management.',
    description:
      'Thực hành phát triển ứng dụng đặt món ăn thực tế với tích hợp bản đồ Google Maps, thanh toán online và push notifications.',
    level: 'Beginner',
    price: 1600000,
    discountPrice: 990000,
    durationHours: 40,
    durationText: '40h',
    badge: 'HOT',
    averageRating: 4.9,
    totalStudents: 2400,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'development',
    title: 'Lập Trình Python Từ Con Số 0 Đến Tự Động Hóa Hệ Thống Thực Tế',
    titleEn: 'Python from Scratch to Practical Automation',
    slug: 'python-tu-con-so-0-den-tu-dong-hoa',
    shortDescription:
      'Cú pháp dễ hiểu cho người mới bắt đầu, cào dữ liệu web (Web Scraping) và viết bot tự động hóa công việc hàng ngày.',
    shortDescriptionEn:
      'Beginner-friendly Python syntax, Web Scraping with BeautifulSoup and automated desktop scripts.',
    description:
      'Bước khởi đầu vững chắc cho bất kỳ ai muốn bước vào ngành IT, khoa học dữ liệu hay trí tuệ nhân tạo.',
    level: 'Beginner',
    price: 0, // Khóa học miễn phí
    discountPrice: 0,
    durationHours: 25,
    durationText: '25h',
    badge: 'HOT',
    averageRating: 4.92,
    totalStudents: 5600,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'development',
    title: 'Làm Chủ Docker, Kubernetes & CI/CD Pipeline Cho Developers',
    titleEn: 'Docker, Kubernetes & CI/CD Pipeline for Modern Developers',
    slug: 'docker-kubernetes-cicd-pipeline-developers',
    shortDescription:
      'Đóng gói Container, quản lý cụm K8s và tự động hóa quy trình triển khai với GitHub Actions & Docker Hub.',
    shortDescriptionEn:
      'Master containerization, K8s orchestration and automated deployment pipelines with GitHub Actions.',
    description:
      'Kỹ năng DevOps thiết yếu giúp lập trình viên kiểm soát toàn bộ vòng đời sản phẩm từ phát triển cục bộ đến vận hành môi trường Production.',
    level: 'Intermediate',
    price: 1950000,
    discountPrice: 1290000,
    durationHours: 32,
    durationText: '32h',
    badge: 'POPULAR',
    averageRating: 4.88,
    totalStudents: 1650,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'development',
    title:
      'Lập Trình Vi Dịch Vụ (Microservices Architecture) Với Go & RabbitMQ',
    titleEn: 'Microservices Architecture with Go and RabbitMQ',
    slug: 'lap-trinh-microservices-golang-rabbitmq',
    shortDescription:
      'Xây dựng hệ thống phân tán chịu tải cao, giao tiếp hàng đợi thông điệp Message Queue và gRPC hiệu năng tối đa.',
    shortDescriptionEn:
      'High-throughput distributed systems with Go, message broker queues and gRPC communication.',
    description:
      'Thiết kế và triển khai kiến trúc vi dịch vụ thực thụ theo mô hình Event-Driven, giải quyết bài toán đồng bộ dữ liệu phân tán.',
    level: 'Advanced',
    price: 2500000,
    discountPrice: 1690000,
    durationHours: 42,
    durationText: '42h',
    badge: 'NEW',
    averageRating: 4.96,
    totalStudents: 980,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'development',
    title:
      'Lập Trình React Native Thực Chiến: Xây Dựng App E-Commerce Hoàn Chỉnh',
    titleEn: 'React Native in Action: Complete E-Commerce Mobile App',
    slug: 'react-native-thuc-chien-ecommerce-app',
    shortDescription:
      'Tối ưu hiệu năng 60fps, giỏ hàng, thông báo đẩy OneSignal và thanh toán Apple Pay / Google Pay.',
    shortDescriptionEn:
      'Build a production-ready 60fps shopping app with cart, OneSignal push notifications and pay SDKs.',
    description:
      'Hướng dẫn từng bước biến ý tưởng thành ứng dụng di động sẵn sàng phát hành trên App Store và Google Play Store.',
    level: 'Intermediate',
    price: 1750000,
    discountPrice: 1090000,
    durationHours: 36,
    durationText: '36h',
    badge: 'POPULAR',
    averageRating: 4.84,
    totalStudents: 1820,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'development',
    title: 'Tối Ưu Hiệu Năng Web & SEO Technical Cho Frontend Developers',
    titleEn: 'Web Performance Optimization & Technical SEO for Frontend',
    slug: 'toi-uu-hieu-nang-web-seo-technical',
    shortDescription:
      'Đạt điểm Core Web Vitals tuyệt đối, tối ưu hóa kích thước bundle, SSR/SSG caching và kiến trúc SEO bền vững.',
    shortDescriptionEn:
      'Achieve perfect Core Web Vitals, minimize bundle sizes, SSR caching and technical SEO structure.',
    description:
      'Bí kíp giúp website của bạn tải dưới 1 giây, giữ chân người dùng và nâng cao thứ hạng công cụ tìm kiếm vượt bậc.',
    level: 'Advanced',
    price: 1400000,
    discountPrice: 850000,
    durationHours: 20,
    durationText: '20h',
    badge: '',
    averageRating: 4.9,
    totalStudents: 1150,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'development',
    title: 'Lập Trình Backend Hiệu Năng Cao Với C# / .NET 8 Web API',
    titleEn: 'High-Performance Backend with C# and .NET 8 Web API',
    slug: 'lap-trinh-backend-csharp-dotnet-8-web-api',
    shortDescription:
      'Làm quen Entity Framework Core 8, Dependency Injection, Minimal APIs và bảo mật OAuth2 / OpenID Connect.',
    shortDescriptionEn:
      'Master EF Core 8, Dependency Injection, Minimal APIs and enterprise OAuth2 security.',
    description:
      'Trở thành kỹ sư Backend .NET chuyên nghiệp, nắm vững công nghệ được các tập đoàn tài chính và ngân hàng hàng đầu săn đón.',
    level: 'Intermediate',
    price: 1850000,
    discountPrice: 1150000,
    durationHours: 38,
    durationText: '38h',
    badge: 'NEW',
    averageRating: 4.87,
    totalStudents: 1390,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'development',
    title:
      'Nhập Môn Cấu Trúc Dữ Liệu & Giải Thuật: Chinh Phục Phỏng Vấn Big Tech',
    titleEn: 'Data Structures & Algorithms: Cracking Tech Interviews',
    slug: 'cau-truc-du-lieu-giai-thuat-phong-van-big-tech',
    shortDescription:
      'Phân tích độ phức tạp O(n), mảng, cây nhị phân, đồ thị và quy hoạch động qua 150 bài toán LeetCode kinh điển.',
    shortDescriptionEn:
      'Master Big-O, arrays, binary trees, graphs and dynamic programming through 150+ LeetCode problems.',
    description:
      'Chìa khóa vàng giúp bạn vượt qua các vòng phỏng vấn kỹ thuật khắt khe tại các công ty công nghệ hàng đầu thế giới.',
    level: 'Beginner',
    price: 1200000,
    discountPrice: 699000,
    durationHours: 45,
    durationText: '45h',
    badge: 'HOT',
    averageRating: 4.98,
    totalStudents: 3800,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
  },

  // ==========================================
  // 3. THIẾT KẾ & SÁNG TẠO (design) - 10 KHÓA
  // ==========================================
  {
    categorySlug: 'design',
    title:
      'Thiết Kế UI/UX Thực Chiến Với Figma: Từ Wireframe Đến Design System',
    titleEn: 'Hands-on UI/UX Design with Figma: Wireframe to Design System',
    slug: 'thiet-ke-ui-ux-figma-design-system',
    shortDescription:
      'Làm chủ Auto Layout 5.0, Component Variants, Interactive Prototypes và xuất file chuyển giao cho Dev chuẩn xác.',
    shortDescriptionEn:
      'Master Auto Layout 5.0, Component Variants, interactive prototypes and developer handoff.',
    description:
      'Trang bị trọn vẹn bộ công cụ và tư duy thiết kế giao diện ứng dụng di động & website chuẩn chỉ theo chuẩn Design System quốc tế.',
    level: 'Beginner',
    price: 1400000,
    discountPrice: 850000,
    durationHours: 28,
    durationText: '28h',
    badge: 'HOT',
    averageRating: 4.94,
    totalStudents: 3200,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'design',
    title:
      'Nghiên Cứu Trải Nghiệm Người Dùng Chuyên Sâu (UX Research & Usability Testing)',
    titleEn: 'Advanced UX Research & Usability Testing',
    slug: 'nghien-cuu-trai-nghiem-nguoi-dung-ux-research',
    shortDescription:
      'Phương pháp phỏng vấn người dùng, xây dựng User Persona, Journey Map và đánh giá trải nghiệm thực nghiệm.',
    shortDescriptionEn:
      'User interview methodology, Persona building, Journey Mapping and empirical usability testing.',
    description:
      'Thấu hiểu sâu sắc tâm lý học hành vi của khách hàng để tạo ra những sản phẩm số giữ chân người dùng hiệu quả.',
    level: 'Intermediate',
    price: 1650000,
    discountPrice: 990000,
    durationHours: 24,
    durationText: '24h',
    badge: 'NEW',
    averageRating: 4.86,
    totalStudents: 1100,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'design',
    title:
      'Thiết Kế Đồ Họa Thương Hiệu Toàn Diện Với Adobe Illustrator & Photoshop',
    titleEn: 'Brand Identity Graphic Design with Illustrator & Photoshop',
    slug: 'thiet-ke-do-hoa-thuong-hieu-illustrator-photoshop',
    shortDescription:
      'Sáng tạo Logo, Brand Guidelines, Key Visual quảng cáo và ấn phẩm truyền thông mạng xã hội bắt mắt.',
    shortDescriptionEn:
      'Create logos, comprehensive Brand Guidelines, advertising Key Visuals and social assets.',
    description:
      'Khóa học cung cấp tư duy thẩm mỹ và kỹ thuật phần mềm để bạn tự tin làm việc như một Graphic Designer chuyên nghiệp.',
    level: 'Beginner',
    price: 1500000,
    discountPrice: 890000,
    durationHours: 32,
    durationText: '32h',
    badge: 'BESTSELLER',
    averageRating: 4.9,
    totalStudents: 2750,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'design',
    title: 'Dựng Phim & Biên Tập Video Viral TikTok / Reels Với Premiere Pro',
    titleEn: 'Viral Short-Form Video Editing with Premiere Pro',
    slug: 'dung-phim-bien-tap-video-viral-premiere-pro',
    shortDescription:
      'Kỹ thuật giữ chân người xem 3 giây đầu, chèn phụ đề động, hiệu ứng âm thanh Sound FX và nhịp điệu cắt dựng hiện đại.',
    shortDescriptionEn:
      'Master the 3-second hook rule, kinetic subtitles, sound design and pacing for viral videos.',
    description:
      'Biến kỹ năng biên tập video thành nguồn thu nhập hấp dẫn từ việc làm Freelancer hoặc phát triển kênh sáng tạo nội dung cá nhân.',
    level: 'Beginner',
    price: 950000,
    discountPrice: 490000,
    durationHours: 18,
    durationText: '18h',
    badge: 'HOT',
    averageRating: 4.92,
    totalStudents: 3890,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'design',
    title:
      'Kỹ Xảo Đồ Họa Chuyển Động Đỉnh Cao Với After Effects (Motion Graphics)',
    titleEn: 'Motion Graphics Masterclass with Adobe After Effects',
    slug: 'ky-xao-do-hoa-chuyen-dong-after-effects',
    shortDescription:
      'Tạo hoạt hình logo, kinetic typography, hiệu ứng infographic chuyển động và visual effects lôi cuốn.',
    shortDescriptionEn:
      'Animate logos, kinetic typography, dynamic infographic motion and professional visual effects.',
    description:
      'Chinh phục After Effects từ công cụ cơ bản đến các biểu thức (Expressions) phức tạp giúp tăng tốc quá trình làm việc.',
    level: 'Intermediate',
    price: 1750000,
    discountPrice: 1100000,
    durationHours: 30,
    durationText: '30h',
    badge: 'POPULAR',
    averageRating: 4.88,
    totalStudents: 1420,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'design',
    title: 'Làm Chủ Thiết Kế 3D & Dựng Hình Sản Phẩm Cơ Bản Với Blender',
    titleEn: '3D Product Design & Modeling Basics with Blender',
    slug: 'thiet-ke-3d-dung-hinh-san-pham-blender',
    shortDescription:
      'Tự dựng mô hình 3D đồ họa, áp chất liệu (Texturing), bố trí ánh sáng studio và kết xuất ảnh Render chân thực.',
    shortDescriptionEn:
      'Model 3D assets, apply realistic materials and render studio-grade product visuals in Blender.',
    description:
      'Cánh cửa mở ra vũ trụ 3D miễn phí với phần mềm Blender mã nguồn mở được cộng đồng sáng tạo toàn cầu ưa chuộng.',
    level: 'Beginner',
    price: 0, // Khóa học miễn phí
    discountPrice: 0,
    durationHours: 20,
    durationText: '20h',
    badge: 'HOT',
    averageRating: 4.96,
    totalStudents: 2900,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'design',
    title:
      'Thiết Kế Trải Nghiệm Sản Phẩm Số (Product Design & Interaction Design)',
    titleEn: 'Digital Product Design & Interaction Design',
    slug: 'thiet-ke-trai-nghiem-san-pham-so-product-design',
    shortDescription:
      'Kết nối nhu cầu kinh doanh với trải nghiệm người dùng, kiến trúc thông tin và quy trình lặp thử nghiệm sản phẩm.',
    shortDescriptionEn:
      'Bridge business objectives with user needs, information architecture and iterative testing.',
    description:
      'Định hình tư duy thiết kế cho Product Designer, giúp tối ưu hóa chỉ số kích hoạt người dùng và tỷ lệ chuyển đổi.',
    level: 'Advanced',
    price: 2100000,
    discountPrice: 1390000,
    durationHours: 35,
    durationText: '35h',
    badge: 'NEW',
    averageRating: 4.91,
    totalStudents: 850,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'design',
    title: 'Typography & Lý Thuyết Màu Sắc Ứng Dụng Trong Thiết Kế Hiện Đại',
    titleEn: 'Typography & Color Theory Applied in Modern Design',
    slug: 'typography-ly-thuyet-mau-sac-thiet-ke',
    shortDescription:
      'Cách phân cấp thị giác bằng kiểu chữ, tâm lý học màu sắc và công thức phối màu không bao giờ lỗi thời.',
    shortDescriptionEn:
      'Visual hierarchy with typefaces, color psychology and timeless harmony formulas.',
    description:
      'Nền tảng căn bản nhưng quan trọng nhất giúp mọi tác phẩm thiết kế trở nên tinh tế, sang trọng và chuẩn mực.',
    level: 'Beginner',
    price: 650000,
    discountPrice: 280000,
    durationHours: 14,
    durationText: '14h',
    badge: '',
    averageRating: 4.82,
    totalStudents: 1650,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'design',
    title: 'Thiết Kế Bao Bì Sản Phẩm & Ấn Phẩm In Ấn Thương Mại Chuyên Nghiệp',
    titleEn: 'Packaging Design & Commercial Print Production',
    slug: 'thiet-ke-bao-bi-an-pham-in-an-thuong-mai',
    shortDescription:
      'Kỹ thuật xuất file in CMYK chuẩn màu, thiết kế khuôn bế dieline bao bì và chất liệu giấy thương phẩm.',
    shortDescriptionEn:
      'Export CMYK print-ready files, package dielines design and commercial material mastery.',
    description:
      'Tự tin làm việc với các nhà in và nhãn hàng thực tế mà không lo lỗi lệch màu hay sai lệch kích thước thành phẩm.',
    level: 'Intermediate',
    price: 1350000,
    discountPrice: 790000,
    durationHours: 22,
    durationText: '22h',
    badge: 'POPULAR',
    averageRating: 4.85,
    totalStudents: 1200,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'design',
    title:
      'Xây Dựng Portfolio Thiết Kế Thu Hút Nhà Tuyển Dụng & Khách Hàng Quốc Tế',
    titleEn: 'Design Portfolio Building for International Clients & Hiring',
    slug: 'xay-dung-portfolio-thiet-ke-thu-hut',
    shortDescription:
      'Kể câu chuyện Case Study lôi cuốn trên Behance, Dribbble và bí quyết định giá dự án Freelance nghìn đô.',
    shortDescriptionEn:
      'Craft compelling design case studies on Behance, Dribbble and price high-ticket freelance gigs.',
    description:
      'Chiến lược xây dựng thương hiệu cá nhân giúp bạn nổi bật giữa hàng ngàn hồ sơ ứng viên và mở rộng cơ hội việc làm toàn cầu.',
    level: 'Beginner',
    price: 890000,
    discountPrice: 399000,
    durationHours: 12,
    durationText: '12h',
    badge: 'HOT',
    averageRating: 4.95,
    totalStudents: 2100,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
  },

  // ==========================================
  // 4. KINH DOANH & QUẢN TRỊ (business) - 10 KHÓA
  // ==========================================
  {
    categorySlug: 'business',
    title: 'Quản Lý Dự Án Chuyên Nghiệp Chuẩn Agile / Scrum Quốc Tế',
    titleEn: 'Professional Project Management with Agile / Scrum',
    slug: 'quan-ly-du-an-chuyen-nghiep-agile-scrum',
    shortDescription:
      'Thành thạo Sprint Planning, Daily Standup, Retrospective và sử dụng Jira quản lý dự án hiệu quả.',
    shortDescriptionEn:
      'Master Sprint Planning, Retrospectives and Jira workflow management for high-velocity teams.',
    description:
      'Chương trình huấn luyện tư duy linh hoạt giúp đội ngũ thích ứng nhanh, giao hàng đúng tiến độ và tối ưu chi phí dự án.',
    level: 'Beginner',
    price: 1300000,
    discountPrice: 790000,
    durationHours: 24,
    durationText: '24h',
    badge: 'BESTSELLER',
    averageRating: 4.91,
    totalStudents: 3100,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'business',
    title:
      'Chiến Lược Digital Marketing 360 Độ: Tối Ưu Hóa Tỷ Suất ROI Đa Kênh',
    titleEn: '360-Degree Digital Marketing Strategy & Multi-Channel ROI',
    slug: 'chien-luoc-digital-marketing-360-do',
    shortDescription:
      'Lập kế hoạch tiếp thị tích hợp, đo lường phễu chuyển đổi và phân bổ ngân sách thông minh trên mọi nền tảng số.',
    shortDescriptionEn:
      'Integrated digital marketing planning, funnel measurement and smart budget allocation.',
    description:
      'Từ thấu hiểu khách hàng mục tiêu đến triển khai chiến dịch đa kênh bao gồm Search, Social, Email và Affiliate Marketing.',
    level: 'Intermediate',
    price: 1700000,
    discountPrice: 1050000,
    durationHours: 32,
    durationText: '32h',
    badge: 'HOT',
    averageRating: 4.89,
    totalStudents: 2600,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'business',
    title: 'SEO Tổng Lực: Đưa Hàng Loạt Từ Khóa Lên Top 1 Google Bền Vững',
    titleEn: 'Holistic SEO: Sustainable Top 1 Google Keyword Ranking',
    slug: 'seo-tong-luc-top-1-google-ben-vung',
    shortDescription:
      'Nghiên cứu từ khóa Intent, tối ưu Onpage chuẩn SEO, xây dựng Entity và chiến lược Backlink an toàn.',
    shortDescriptionEn:
      'Search intent research, On-page SEO, Entity building and safe high-authority backlink strategy.',
    description:
      'Học cách xây dựng cỗ máy thu hút hàng trăm nghìn lượt truy cập tự nhiên (Organic Traffic) miễn phí cho website mỗi tháng.',
    level: 'Intermediate',
    price: 1450000,
    discountPrice: 850000,
    durationHours: 26,
    durationText: '26h',
    badge: 'POPULAR',
    averageRating: 4.85,
    totalStudents: 1980,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1571786256017-aee7a0c009b6?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'business',
    title:
      'Facebook & TikTok Ads Thực Chiến: Chinh Phục Tỷ Lệ Chuyển Đổi Đột Phá',
    titleEn: 'Facebook & TikTok Ads Mastery for Breakthrough Conversions',
    slug: 'facebook-tiktok-ads-thuc-chien-chuyen-doi',
    shortDescription:
      'Tư duy A/B Testing mẫu quảng cáo, tối ưu Pixel/CAPI và scale ngân sách lớn mà không bị đội chi phí CPA.',
    shortDescriptionEn:
      'A/B testing ad creatives, Pixel/CAPI optimization and scaling budgets with minimal CPA.',
    description:
      'Bí kíp chạy quảng cáo đem về đơn hàng đều đặn, nắm bắt thuật toán phân phối nội dung video ngắn của TikTok.',
    level: 'Intermediate',
    price: 1550000,
    discountPrice: 920000,
    durationHours: 28,
    durationText: '28h',
    badge: 'HOT',
    averageRating: 4.88,
    totalStudents: 3400,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'business',
    title:
      'Kỹ Năng Đàm Phán Thương Lượng & Thuyết Phục Đỉnh Cao Trong Kinh Doanh',
    titleEn: 'High-Stakes Business Negotiation & Persuasion Mastery',
    slug: 'ky-nang-dam-phan-thuyet-phuc-kinh-doanh',
    shortDescription:
      'Chiến thuật BATNA, đọc vị ngôn ngữ cơ thể đối tác và giải pháp đôi bên cùng có lợi (Win-Win) trong hợp đồng lớn.',
    shortDescriptionEn:
      'BATNA tactics, partner body language reading and win-win frameworks for major contracts.',
    description:
      'Nghệ thuật giao tiếp và thuyết phục giúp bạn tự tin trong các cuộc họp thương lượng, chốt hợp đồng và xử lý từ chối.',
    level: 'Beginner',
    price: 990000,
    discountPrice: 450000,
    durationHours: 16,
    durationText: '16h',
    badge: 'POPULAR',
    averageRating: 4.93,
    totalStudents: 2250,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'business',
    title: 'Khởi Nghiệp Tinh Gọn (Lean Startup): Từ Ý Tưởng Đến Sản Phẩm MVP',
    titleEn: 'Lean Startup: From Ideation to Launching Your First MVP',
    slug: 'khoi-nghiep-tinh-gon-y-tuong-mvp',
    shortDescription:
      'Xác thực nhu cầu thị trường, phỏng vấn khách hàng tiềm năng và ra mắt phiên bản đầu tiên với chi phí thấp nhất.',
    shortDescriptionEn:
      'Market validation, prospective customer interviews and launching your lowest-cost MVP.',
    description:
      'Kim chỉ nam cho các nhà sáng lập tương lai muốn khởi nghiệp thông minh, tránh lãng phí thời gian và tiền bạc.',
    level: 'Beginner',
    price: 0, // Khóa học miễn phí
    discountPrice: 0,
    durationHours: 18,
    durationText: '18h',
    badge: 'HOT',
    averageRating: 4.97,
    totalStudents: 4100,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'business',
    title: 'Quản Trị Bán Hàng B2B & Kỹ Năng Chốt Sale Khách Hàng Doanh Nghiệp',
    titleEn: 'B2B Sales Management & Enterprise Account Closing Skills',
    slug: 'quan-tri-ban-hang-b2b-chot-sale-doanh-nghiep',
    shortDescription:
      'Quy trình tiếp cận người ra quyết định, phân tích nỗi đau doanh nghiệp và xây dựng đề xuất giá trị vượt trội.',
    shortDescriptionEn:
      'Enterprise decision-maker outreach, pain point diagnostics and compelling value propositions.',
    description:
      'Trở thành chuyên viên tư vấn giải pháp B2B chuyên nghiệp, tự tin quản lý Pipeline bán hàng giá trị cao.',
    level: 'Intermediate',
    price: 1600000,
    discountPrice: 950000,
    durationHours: 22,
    durationText: '22h',
    badge: '',
    averageRating: 4.84,
    totalStudents: 1350,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'business',
    title: 'Năng Lực Lãnh Đạo & Xây Dựng Văn Hóa Doanh Nghiệp Gắn Kết Cao',
    titleEn: 'Leadership Mastery & High-Engagement Organizational Culture',
    slug: 'nang-luc-lanh-dao-van-hoa-doanh-nghiep',
    shortDescription:
      'Tạo động lực cho nhân viên, quản trị xung đột nội bộ và phát triển thế hệ kế thừa tài năng.',
    shortDescriptionEn:
      'Employee motivation, constructive conflict resolution and building a high-trust leadership bench.',
    description:
      'Dành cho các trưởng nhóm, quản lý cấp trung và CEO muốn xây dựng môi trường làm việc cởi mở, hiệu suất cao.',
    level: 'Advanced',
    price: 1850000,
    discountPrice: 1190000,
    durationHours: 25,
    durationText: '25h',
    badge: 'NEW',
    averageRating: 4.9,
    totalStudents: 950,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'business',
    title: 'Chiến Lược Định Vị Thương Hiệu & Khác Biệt Hóa Sản Phẩm',
    titleEn: 'Brand Positioning Strategy & Product Differentiation',
    slug: 'chien-luoc-dinh-vi-thuong-hieu-khac-biet-hoa',
    shortDescription:
      'Tìm kiếm đại dương xanh (Blue Ocean), thông điệp định vị cốt lõi và kiến tạo lòng trung thành thương hiệu dài lâu.',
    shortDescriptionEn:
      'Blue ocean discovery, core positioning messaging and lasting brand loyalty creation.',
    description:
      'Phương pháp xây dựng thương hiệu có bản sắc độc đáo, thoát khỏi bẫy cạnh tranh về giá trên thị trường khốc liệt.',
    level: 'Intermediate',
    price: 1400000,
    discountPrice: 820000,
    durationHours: 20,
    durationText: '20h',
    badge: '',
    averageRating: 4.86,
    totalStudents: 1580,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'business',
    title: 'Quản Lý Vận Hành & Chuỗi Cung Ứng (Supply Chain) Tinh Gọn',
    titleEn: 'Lean Operations & Supply Chain Management',
    slug: 'quan-ly-van-hanh-chuoi-cung-ung-tinh-gon',
    shortDescription:
      'Tối ưu vòng quay tồn kho, giảm lãng phí quy trình (Kaizen) và kiểm soát chi phí logistics hiệu quả.',
    shortDescriptionEn:
      'Optimize inventory turnover, eliminate waste (Kaizen) and control logistics expenses.',
    description:
      'Nâng cao năng lực quản trị vận hành kho bãi, mua hàng và phân phối sản phẩm theo các tiêu chuẩn vận hành tiên tiến.',
    level: 'Advanced',
    price: 2100000,
    discountPrice: 1350000,
    durationHours: 34,
    durationText: '34h',
    badge: 'POPULAR',
    averageRating: 4.88,
    totalStudents: 1120,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
  },

  // ==========================================
  // 5. TRÍ TUỆ NHÂN TẠO & DỮ LIỆU (ai-data) - 10 KHÓA
  // ==========================================
  {
    categorySlug: 'ai-data',
    title: 'Prompt Engineering Toàn Diện: Làm Chủ ChatGPT, Claude & Midjourney',
    titleEn: 'Prompt Engineering Masterclass: ChatGPT, Claude & Midjourney',
    slug: 'prompt-engineering-toan-dien-chatgpt-claude',
    shortDescription:
      'Kỹ thuật Few-shot, Chain-of-Thought, viết câu lệnh chuẩn cấu trúc để AI giải quyết bài toán phức tạp.',
    shortDescriptionEn:
      'Few-shot prompting, Chain-of-Thought and structured prompt architectures for advanced tasks.',
    description:
      'Biến AI thành trợ lý đắc lực trong nghiên cứu, viết lách, phân tích dữ liệu và tự động hóa công việc kinh doanh.',
    level: 'Beginner',
    price: 890000,
    discountPrice: 399000,
    durationHours: 18,
    durationText: '18h',
    badge: 'HOT',
    averageRating: 4.96,
    totalStudents: 5200,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'ai-data',
    title:
      'Xây Dựng Ứng Dụng AI Agents & RAG Với LangChain, LlamaIndex & Python',
    titleEn: 'Building Autonomous AI Agents & RAG with LangChain & Python',
    slug: 'xay-dung-ai-agents-rag-langchain-llamaindex',
    shortDescription:
      'Kết nối LLM với cơ sở tri thức nội bộ, vector database (Pinecone, Chroma) và công cụ tự động hành động.',
    shortDescriptionEn:
      'Connect LLMs to internal knowledge bases, vector DBs and autonomous tool calling agents.',
    description:
      'Khóa học đỉnh cao dành cho kỹ sư muốn xây dựng Chatbot doanh nghiệp thông minh và trợ lý ảo AI thế hệ mới.',
    level: 'Advanced',
    price: 2400000,
    discountPrice: 1590000,
    durationHours: 40,
    durationText: '40h',
    badge: 'BESTSELLER',
    averageRating: 5.0,
    totalStudents: 1850,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'ai-data',
    title:
      'Machine Learning Thực Chiến Từ A Đến Z Với Scikit-Learn & TensorFlow',
    titleEn:
      'Applied Machine Learning from Scratch with Scikit-Learn & TensorFlow',
    slug: 'machine-learning-thuc-chien-a-z',
    shortDescription:
      'Hồi quy, phân loại, phân cụm dữ liệu, xử lý Feature Engineering và đánh giá độ chính xác mô hình học máy.',
    shortDescriptionEn:
      'Regression, classification, clustering, feature engineering and rigorous model evaluation.',
    description:
      'Nền tảng toán học và lập trình thực tế cho bất kỳ ai muốn bước chân vào ngành trí tuệ nhân tạo và học máy.',
    level: 'Intermediate',
    price: 1950000,
    discountPrice: 1250000,
    durationHours: 42,
    durationText: '42h',
    badge: 'HOT',
    averageRating: 4.91,
    totalStudents: 2300,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'ai-data',
    title: 'Phân Tích Dữ Liệu Kinh Doanh (Business Analytics) Với SQL & Python',
    titleEn: 'Business Analytics with SQL & Python in Practice',
    slug: 'phan-tich-du-lieu-kinh-doanh-sql-python',
    shortDescription:
      'Truy vấn dữ liệu đa bảng, tính toán Retention Rate, Customer Lifetime Value (CLV) và phân tích phễu doanh thu.',
    shortDescriptionEn:
      'Multi-table SQL joins, retention rates, Customer Lifetime Value and revenue funnel analytics.',
    description:
      'Chuyển hóa dữ liệu thô thành thông tin hành động (Actionable Insights) giúp định hướng chiến lược tăng trưởng cho công ty.',
    level: 'Beginner',
    price: 1300000,
    discountPrice: 750000,
    durationHours: 28,
    durationText: '28h',
    badge: 'POPULAR',
    averageRating: 4.88,
    totalStudents: 3100,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'ai-data',
    title: 'Trực Quan Hóa Dữ Liệu & Xây Dựng Business Dashboard Với Power BI',
    titleEn: 'Data Visualization & Interactive Dashboards with Power BI',
    slug: 'truc-quan-hoa-du-lieu-power-bi-dashboard',
    shortDescription:
      'Viết hàm DAX chuyên nghiệp, thiết kế báo cáo tài chính, bán hàng và nhân sự trực quan, bắt mắt.',
    shortDescriptionEn:
      'Write advanced DAX functions, build sales and financial interactive executive reports.',
    description:
      'Làm chủ công cụ phân tích thông minh hàng đầu của Microsoft, mở rộng cơ hội thăng tiến và việc làm Data Analyst.',
    level: 'Beginner',
    price: 1100000,
    discountPrice: 590000,
    durationHours: 24,
    durationText: '24h',
    badge: 'HOT',
    averageRating: 4.93,
    totalStudents: 3700,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'ai-data',
    title:
      'Deep Learning & Thị Giác Máy Tính (Computer Vision) Ứng Dụng Thực Tế',
    titleEn: 'Deep Learning & Computer Vision with PyTorch and OpenCV',
    slug: 'deep-learning-thi-giac-may-tinh-opencv',
    shortDescription:
      'Nhận diện khuôn mặt, phát hiện đối tượng với YOLOv8, phân vùng ảnh và theo dõi chuyển động thời gian thực.',
    shortDescriptionEn:
      'Face recognition, object detection with YOLOv8, image segmentation and real-time tracking.',
    description:
      'Xây dựng các giải pháp giám sát an ninh, xe tự hành và kiểm tra chất lượng sản phẩm bằng công nghệ thị giác máy tính.',
    level: 'Advanced',
    price: 2300000,
    discountPrice: 1550000,
    durationHours: 45,
    durationText: '45h',
    badge: 'NEW',
    averageRating: 4.95,
    totalStudents: 1250,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'ai-data',
    title:
      'Xử Lý Ngôn Ngữ Tự Nhiên & Tinh Chỉnh Mô Hình Ngôn Ngữ Lớn (LLM Fine-Tuning)',
    titleEn: 'NLP & Fine-Tuning Large Language Models (LLMs)',
    slug: 'xu-ly-ngon-ngu-tu-nhien-fine-tuning-llm',
    shortDescription:
      'Kỹ thuật LoRA, QLoRA, huấn luyện mô hình tiếng Việt chuyên ngành trên HuggingFace và triển khai tối ưu bộ nhớ.',
    shortDescriptionEn:
      'LoRA, QLoRA techniques, domain-specific Vietnamese model training on HuggingFace.',
    description:
      'Tự tay tinh chỉnh mô hình LLaMA, Mistral theo dữ liệu chuyên sâu của ngành tài chính, y tế hoặc luật.',
    level: 'Advanced',
    price: 2600000,
    discountPrice: 1790000,
    durationHours: 38,
    durationText: '38h',
    badge: 'NEW',
    averageRating: 4.97,
    totalStudents: 980,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1534972195531-a756b1126f24?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'ai-data',
    title: 'Khoa Học Dữ Liệu (Data Science) Dành Cho Người Bắt Đầu',
    titleEn: 'Data Science for Beginners: Prediction & Trend Analysis',
    slug: 'khoa-hoc-du-lieu-data-science-nguoi-moi',
    shortDescription:
      'Thu thập dữ liệu, làm sạch, phân tích thống kê mô tả và vẽ biểu đồ trực quan khám phá insight sâu sắc.',
    shortDescriptionEn:
      'Data gathering, cleaning, descriptive statistics and exploratory data visualization with Seaborn.',
    description:
      'Chương trình cơ bản trang bị tư duy định lượng và phương pháp luận giải quyết vấn đề bằng số liệu khoa học.',
    level: 'Beginner',
    price: 0, // Khóa học miễn phí
    discountPrice: 0,
    durationHours: 20,
    durationText: '20h',
    badge: 'HOT',
    averageRating: 4.89,
    totalStudents: 4800,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'ai-data',
    title: 'Ứng Dụng Generative AI Tự Động Hóa Quy Trình Doanh Nghiệp',
    titleEn: 'Generative AI for Enterprise Process Automation',
    slug: 'ung-dung-generative-ai-tu-dong-hoa-doanh-nghiep',
    shortDescription:
      'Tích hợp OpenAI API, tự động trích xuất hóa đơn, tóm tắt hợp đồng và cá nhân hóa email tiếp thị quy mô lớn.',
    shortDescriptionEn:
      'Integrate OpenAI APIs, automated invoice parsing, contract summarization and bulk email personalization.',
    description:
      'Giúp doanh nghiệp cắt giảm 50% thời gian xử lý thủ tục giấy tờ bằng các công cụ AI thế hệ mới nhất.',
    level: 'Intermediate',
    price: 1750000,
    discountPrice: 1100000,
    durationHours: 25,
    durationText: '25h',
    badge: 'POPULAR',
    averageRating: 4.9,
    totalStudents: 1650,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'ai-data',
    title:
      'Big Data Analytics: Xử Lý Dữ Liệu Lớn Với Apache Spark & Databricks',
    titleEn: 'Big Data Analytics with Apache Spark and Databricks',
    slug: 'big-data-apache-spark-databricks',
    shortDescription:
      'Kiến trúc Lakehouse, phân tán tính toán RDD/Dataframe, Spark SQL và xử lý luồng dữ liệu thời gian thực (Streaming).',
    shortDescriptionEn:
      'Lakehouse architecture, RDD distributed computing, Spark SQL and real-time streaming data.',
    description:
      'Kỹ năng cấp cao dành cho Data Engineer giải quyết bài toán xử lý Terabyte dữ liệu trong các hệ thống lớn.',
    level: 'Advanced',
    price: 2700000,
    discountPrice: 1850000,
    durationHours: 44,
    durationText: '44h',
    badge: '',
    averageRating: 4.92,
    totalStudents: 780,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80',
  },

  // ==========================================
  // 6. NGOẠI NGỮ & GIAO TIẾP (languages) - 10 KHÓA
  // ==========================================
  {
    categorySlug: 'languages',
    title: 'Tiếng Anh Thương Mại: Soạn Thảo Email, Thuyết Trình & Họp Quốc Tế',
    titleEn: 'Business English: Professional Emails, Meetings & Presentations',
    slug: 'tieng-anh-thuong-mai-email-thuyet-trinh',
    shortDescription:
      'Mẫu câu đàm phán lịch thiệp, cấu trúc email chuẩn Business Etiquette và kỹ năng dẫn dắt cuộc họp tự tin.',
    shortDescriptionEn:
      'Diplomatic negotiation phrases, business email etiquette and confident meeting moderation.',
    description:
      'Xóa bỏ rào cản ngôn ngữ, tự tin làm việc tại các tập đoàn đa quốc gia và làm việc trực tiếp với đối tác nước ngoài.',
    level: 'Intermediate',
    price: 1250000,
    discountPrice: 699000,
    durationHours: 26,
    durationText: '26h',
    badge: 'HOT',
    averageRating: 4.93,
    totalStudents: 3100,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'languages',
    title: 'Luyện Phát Âm Tiếng Anh Chuẩn Bản Xứ Theo Bảng Phiên Âm IPA',
    titleEn: 'Native-Like English Pronunciation with IPA Guide',
    slug: 'luyen-phat-am-tieng-anh-chuan-ipa',
    shortDescription:
      'Khắc phục triệt để lỗi nuốt âm, nối âm tự nhiên, ngữ điệu Intonation chuẩn xác như người bản xứ.',
    shortDescriptionEn:
      'Correct common speech habits, master linking sounds and natural English sentence intonation.',
    description:
      'Khóa học nền tảng giúp bạn tự tin mở miệng nói tiếng Anh mà không còn sợ sai phát âm hay nói bị quê.',
    level: 'Beginner',
    price: 0, // Khóa học miễn phí
    discountPrice: 0,
    durationHours: 15,
    durationText: '15h',
    badge: 'POPULAR',
    averageRating: 4.95,
    totalStudents: 6200,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'languages',
    title: 'Tiếng Trung Sơ Cấp Cho Người Bắt Đầu (HSK 1 - HSK 2 Toàn Diện)',
    titleEn: 'Beginner Chinese: Complete HSK 1 & HSK 2 Preparation',
    slug: 'tieng-trung-so-cap-hsk-1-hsk-2',
    shortDescription:
      'Quy tắc thanh mẫu, vận mẫu, thanh điệu Pinyin chuẩn và 300 từ vựng hội thoại sinh hoạt thiết yếu hàng ngày.',
    shortDescriptionEn:
      'Master Pinyin tones, initials, finals and 300 essential conversation vocabulary words.',
    description:
      'Khóa học thiết kế sinh động, dễ học cho người bắt đầu từ con số 0, chuẩn bị vững chắc cho kỳ thi lấy chứng chỉ HSK.',
    level: 'Beginner',
    price: 1100000,
    discountPrice: 590000,
    durationHours: 30,
    durationText: '30h',
    badge: 'BESTSELLER',
    averageRating: 4.89,
    totalStudents: 3450,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'languages',
    title: 'Tiếng Trung Thương Mại Giao Tiếp & Làm Việc Cùng Nhà Cung Ứng',
    titleEn: 'Business Chinese for Supplier Sourcing & Trade Deals',
    slug: 'tieng-trung-thuong-mai-nha-cung-ung',
    shortDescription:
      'Từ vựng đặt hàng Taobao/1688, đàm phán giá cả, hợp đồng vận chuyển và đối soát thanh toán xuất nhập khẩu.',
    shortDescriptionEn:
      'Sourcing terminology for 1688/Taobao, price negotiation and import-export trade logistics.',
    description:
      'Vũ khí đắc lực cho các chủ shop kinh doanh online, người làm xuất nhập khẩu muốn làm việc trực tiếp với xưởng Trung Quốc.',
    level: 'Intermediate',
    price: 1450000,
    discountPrice: 850000,
    durationHours: 24,
    durationText: '24h',
    badge: 'HOT',
    averageRating: 4.87,
    totalStudents: 1890,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'languages',
    title: 'Tiếng Nhật Cấp Tốc N5 Cho Người Mới: Chữ Cái, Từ Vựng & Hội Thoại',
    titleEn: 'Fast-Track Japanese N5: Hiragana, Katakana & Survival Speaking',
    slug: 'tieng-nhat-cap-toc-n5-cho-nguoi-moi',
    shortDescription:
      'Ghi nhớ bảng chữ Hiragana & Katakana trong 5 ngày, 80 chữ Kanji cơ bản và cấu trúc câu hội thoại thường ngày.',
    shortDescriptionEn:
      'Memorize Hiragana & Katakana in 5 days, 80 basic Kanji and daily conversational phrases.',
    description:
      'Lộ trình tinh gọn dành cho các bạn muốn đi du học, làm việc tại Nhật Bản hoặc đam mê văn hóa Anime / Manga.',
    level: 'Beginner',
    price: 1150000,
    discountPrice: 620000,
    durationHours: 32,
    durationText: '32h',
    badge: 'POPULAR',
    averageRating: 4.91,
    totalStudents: 2780,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'languages',
    title: 'Tiếng Nhật Giao Tiếp Công Sở N3 & Văn Hóa Ứng Xử Doanh Nghiệp Nhật',
    titleEn: 'Japanese N3 Workplace Communication & Business Etiquette',
    slug: 'tieng-nhat-giao-tiep-cong-so-n3',
    shortDescription:
      'Làm chủ kính ngữ Keigo, quy tắc viết báo cáo Hourensou và văn hóa ứng xử chuyên nghiệp trong công ty Nhật.',
    shortDescriptionEn:
      'Master Keigo honorifics, Hourensou reporting rules and Japanese corporate culture.',
    description:
      'Chìa khóa giúp bạn thăng tiến và đạt mức lương cao khi làm việc tại các công ty IT, thương mại Nhật Bản.',
    level: 'Intermediate',
    price: 1650000,
    discountPrice: 990000,
    durationHours: 35,
    durationText: '35h',
    badge: 'NEW',
    averageRating: 4.88,
    totalStudents: 1250,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'languages',
    title: 'Tiếng Hàn Sơ Cấp: Giao Tiếp Thực Tế & Văn Hóa Đời Sống Ứng Dụng',
    titleEn: 'Beginner Korean: Real-Life Conversation & Practical Culture',
    slug: 'tieng-han-so-cap-giao-tiep-thuc-te',
    shortDescription:
      'Học bảng chữ Hangeul nhanh chóng, luyện phản xạ hỏi đường, gọi món, mua sắm và giao tiếp cùng người bản xứ.',
    shortDescriptionEn:
      'Learn Hangeul alphabet swiftly, practice daily talking routines, shopping and travel Korean.',
    description:
      'Khóa học vui nhộn, lồng ghép ngữ cảnh phim truyền hình K-Drama giúp việc tiếp thu tiếng Hàn trở nên tự nhiên, hứng khởi.',
    level: 'Beginner',
    price: 980000,
    discountPrice: 480000,
    durationHours: 20,
    durationText: '20h',
    badge: '',
    averageRating: 4.86,
    totalStudents: 2150,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'languages',
    title: 'Luyện Nghe Nói Tiếng Anh Qua Phim Ảnh & Podcast Đời Thực',
    titleEn: 'Immersive English Listening & Speaking via Movies and Podcasts',
    slug: 'luyen-nghe-noi-tieng-anh-phim-anh-podcast',
    shortDescription:
      'Phương pháp Shadowing bắt chước ngữ điệu, làm quen từ lóng (Slang) và cách người bản xứ nói chuyện đời thường.',
    shortDescriptionEn:
      'Shadowing technique, natural idioms, colloquial slang and real-world conversation comprehension.',
    description:
      'Thoát khỏi lối học ngữ pháp khô khan, đắm mình trong âm điệu tiếng Anh đời thực để phản xạ bật ra tự nhiên.',
    level: 'Beginner',
    price: 790000,
    discountPrice: 350000,
    durationHours: 18,
    durationText: '18h',
    badge: 'HOT',
    averageRating: 4.94,
    totalStudents: 4100,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'languages',
    title:
      'Kỹ Thuật Viết Tiếng Anh Học Thuật & Chinh Phục IELTS Writing Task 1 & 2',
    titleEn: 'Academic English Writing & Mastering IELTS Writing Tasks',
    slug: 'ky-thuat-viet-tieng-anh-hoc-thuat-ielts-writing',
    shortDescription:
      'Phát triển ý mạch lạc (Coherence & Cohesion), vốn từ vựng học thuật C1/C2 và cấu trúc câu ghép nâng band điểm.',
    shortDescriptionEn:
      'Cohesion development, C1/C2 academic vocabulary and complex grammatical structures for high band.',
    description:
      'Chấm chữa chi tiết các dạng bài biểu đồ Task 1 và bài luận nghị luận xã hội Task 2 chuẩn tiêu chí khảo thí Cambridge.',
    level: 'Advanced',
    price: 1800000,
    discountPrice: 1190000,
    durationHours: 36,
    durationText: '36h',
    badge: 'BESTSELLER',
    averageRating: 4.96,
    totalStudents: 1650,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'languages',
    title: 'Đàm Phán & Thuyết Trình Song Ngữ Anh - Việt Dành Cho Nhà Quản Lý',
    titleEn: 'Bilingual English-Vietnamese Negotiation & Executive Speaking',
    slug: 'dam-phan-thuyet-trinh-song-ngu-nha-quan-ly',
    shortDescription:
      'Nâng cao phong thái tự tin khi thuyết trình trước hội đồng quản trị và đối tác chiến lược bằng tiếng Anh chuyên nghiệp.',
    shortDescriptionEn:
      'Executive stage presence, board-level presentation and high-stakes bilingual negotiations.',
    description:
      'Trang bị ngôn từ đẳng cấp giúp lãnh đạo truyền cảm hứng và thiết lập vị thế vững chắc trong các cuộc gặp gỡ cấp cao.',
    level: 'Advanced',
    price: 2200000,
    discountPrice: 1450000,
    durationHours: 24,
    durationText: '24h',
    badge: 'NEW',
    averageRating: 4.92,
    totalStudents: 790,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80',
  },

  // ==========================================
  // 7. TÀI CHÍNH & ĐẦU TƯ (finance) - 10 KHÓA
  // ==========================================
  {
    categorySlug: 'finance',
    title:
      'Phân Tích Kỹ Thuật Chứng Khoán: Đọc Biểu Đồ Nến & Chỉ Báo Xác Suất Cao',
    titleEn: 'Stock Technical Analysis: Candlestick Patterns & Indicators',
    slug: 'phan-tich-ky-thuat-chung-khoan-bieu-do-nen',
    shortDescription:
      'Xác định xu hướng dòng tiền lớn, mô hình nến đảo chiều, RSI, MACD và kỹ thuật đặt Stop-loss kỷ luật.',
    shortDescriptionEn:
      'Identify smart money flows, reversal candle patterns, RSI, MACD and disciplined stop-loss rules.',
    description:
      'Phương pháp giao dịch chứng khoán bài bản giúp bạn tự tin tìm điểm mua tối ưu và quản trị rủi ro trên thị trường.',
    level: 'Intermediate',
    price: 1550000,
    discountPrice: 890000,
    durationHours: 28,
    durationText: '28h',
    badge: 'HOT',
    averageRating: 4.92,
    totalStudents: 2850,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'finance',
    title: 'Đọc Hiểu & Phân Tích Báo Cáo Tài Chính Doanh Nghiệp Toàn Diện',
    titleEn: 'Financial Statement Analysis & Corporate Valuation',
    slug: 'doc-hieu-phan-tich-bao-cao-tai-chinh-doanh-nghiep',
    shortDescription:
      'Phân tích Bảng cân đối kế toán, Báo cáo kết quả kinh doanh, Lưu chuyển tiền tệ và phát hiện rủi ro "xào nấu" sổ sách.',
    shortDescriptionEn:
      'Analyze Balance Sheet, P&L, Cash Flow statements and identify accounting warning signs.',
    description:
      'Trang bị năng lực đọc hiểu sức khỏe tài chính thực sự của doanh nghiệp trước khi quyết định xuống tiền đầu tư.',
    level: 'Beginner',
    price: 1200000,
    discountPrice: 650000,
    durationHours: 22,
    durationText: '22h',
    badge: 'POPULAR',
    averageRating: 4.88,
    totalStudents: 2100,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'finance',
    title: 'Đầu Tư Giá Trị Theo Phương Pháp Warren Buffett & Định Giá Cổ Phiếu',
    titleEn: 'Value Investing the Warren Buffett Way & Stock Valuation',
    slug: 'dau-tu-gia-tri-warren-buffett-dinh-gia-co-phieu',
    shortDescription:
      'Tìm kiếm cổ phiếu có "con hào kinh tế" (Moat), tính toán biên an toàn (Margin of Safety) và định giá DCF.',
    shortDescriptionEn:
      'Find economic moats, calculate Margin of Safety and master discounted cash flow valuation.',
    description:
      'Chiến lược đầu tư bền vững giúp bạn sinh lời kép an nhàn trong dài hạn mà không cần bám bảng điện tử hàng ngày.',
    level: 'Intermediate',
    price: 1750000,
    discountPrice: 1090000,
    durationHours: 30,
    durationText: '30h',
    badge: 'BESTSELLER',
    averageRating: 4.96,
    totalStudents: 1980,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'finance',
    title:
      'Quản Lý Tài Chính Cá Nhân Thông Minh: Lập Ngân Sách & Tích Lũy Bền Vững',
    titleEn:
      'Smart Personal Financial Planning & Sustainable Wealth Accumulation',
    slug: 'quan-ly-tai-chinh-ca-nhan-thong-minh',
    shortDescription:
      'Quy tắc 6 chiếc lọ, quản lý chi tiêu không áp lực, thoát bẫy nợ tín dụng và xây dựng quỹ khẩn cấp an toàn.',
    shortDescriptionEn:
      '6-jar rule, stress-free spending, getting out of credit card debt and building an emergency fund.',
    description:
      'Khóa học thực tế phù hợp cho mọi đối tượng từ sinh viên đến người đi làm muốn làm chủ đồng tiền của chính mình.',
    level: 'Beginner',
    price: 0, // Khóa học miễn phí
    discountPrice: 0,
    durationHours: 15,
    durationText: '15h',
    badge: 'HOT',
    averageRating: 4.95,
    totalStudents: 5400,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'finance',
    title: 'Quản Trị Rủi Ro Danh Mục Đầu Tư & Chiến Lược Phân Bổ Tài Sản',
    titleEn: 'Portfolio Risk Management & Asset Allocation Strategy',
    slug: 'quan-tri-rui-ro-danh-muc-dau-tu',
    shortDescription:
      'Nguyên lý không bỏ trứng vào một giỏ, đo lường hệ số Beta, Sharpe Ratio và tái cân bằng danh mục định kỳ.',
    shortDescriptionEn:
      'Diversification fundamentals, Beta and Sharpe ratio analytics, and scheduled portfolio rebalancing.',
    description:
      'Bảo vệ thành quả đầu tư trước những biến động mạnh mẽ của thị trường tài chính và khủng hoảng kinh tế toàn cầu.',
    level: 'Advanced',
    price: 1900000,
    discountPrice: 1250000,
    durationHours: 26,
    durationText: '26h',
    badge: 'NEW',
    averageRating: 4.89,
    totalStudents: 890,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'finance',
    title: 'Đầu Tư Bất Động Sản Thực Chiến: Pháp Lý, Thẩm Định Giá & Dòng Tiền',
    titleEn: 'Real Estate Investment: Legalities, Valuation & Cash Flow',
    slug: 'dau-tu-bat-dong-san-thuc-chien-phap-ly',
    shortDescription:
      'Kiểm tra quy hoạch, đọc sổ đỏ, công thức tính tỷ suất lợi nhuận cho thuê và chiến lược đòn bẩy tài chính an toàn.',
    shortDescriptionEn:
      'Zoning verification, title deed reading, rental yield metrics and safe financial leverage.',
    description:
      'Trang bị kiến thức pháp lý và kinh nghiệm khảo sát thực tế giúp nhà đầu tư tránh rủi ro mất tiền tỷ vào đất tranh chấp.',
    level: 'Intermediate',
    price: 2200000,
    discountPrice: 1450000,
    durationHours: 32,
    durationText: '32h',
    badge: 'POPULAR',
    averageRating: 4.9,
    totalStudents: 1520,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'finance',
    title: 'Nhập Môn Thị Trường Tiền Tệ, Trái Phiếu & Quỹ Mở Cho Nhà Đầu Tư',
    titleEn: 'Introduction to Money Markets, Bonds & Mutual Funds',
    slug: 'nhap-mon-thi-truong-trai-phieu-quy-mo',
    shortDescription:
      'Lựa chọn chứng chỉ quỹ uy tín, hiểu về lãi suất danh nghĩa, lạm phát và tạo dòng thu nhập thụ động an toàn.',
    shortDescriptionEn:
      'Choose reputable mutual funds, understand bond yields, inflation and earn passive income.',
    description:
      'Kênh tích lũy lý tưởng cho người không có thời gian theo dõi cổ phiếu nhưng vẫn muốn tài sản sinh lời vượt trội gửi tiết kiệm.',
    level: 'Beginner',
    price: 850000,
    discountPrice: 390000,
    durationHours: 16,
    durationText: '16h',
    badge: '',
    averageRating: 4.82,
    totalStudents: 1740,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'finance',
    title:
      'Thuế Thu Nhập Cá Nhân & Tối Ưu Hóa Chi Phí Tài Chính Cho Freelancers',
    titleEn: 'Personal Income Tax & Financial Optimization for Freelancers',
    slug: 'thue-thu-nhap-ca-nhan-toi-uu-freelancer',
    shortDescription:
      'Quyết toán thuế TNCN, đăng ký hộ kinh doanh cá thể, hợp đồng dịch vụ và các khoản giảm trừ gia cảnh hợp pháp.',
    shortDescriptionEn:
      'Personal income tax finalization, sole proprietorship setup and legal deductions for freelancers.',
    description:
      'Giúp các bạn làm việc tự do, chuyên gia công nghệ và người sáng tạo nội dung tuân thủ nghĩa vụ thuế minh bạch, tối ưu chi phí.',
    level: 'Beginner',
    price: 790000,
    discountPrice: 350000,
    durationHours: 14,
    durationText: '14h',
    badge: '',
    averageRating: 4.85,
    totalStudents: 1430,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'finance',
    title: 'Phân Tích Kinh Tế Vĩ Mô & Nhận Diện Chu Kỳ Kinh Tế Ứng Dụng',
    titleEn: 'Macroeconomic Analysis & Economic Cycle Identification',
    slug: 'phan-tich-kinh-te-vi-mo-chu-ky-kinh-te',
    shortDescription:
      'Chính sách tiền tệ Fed & NHNN, chu kỳ lạm phát, tỷ giá hối đoái và tác động trực tiếp đến các lớp tài sản đầu tư.',
    shortDescriptionEn:
      'Central bank policies, inflation cycles, FX rates and market asset allocation dynamics.',
    description:
      'Nâng tầm góc nhìn chiến lược, giúp bạn đón đầu các con sóng thị trường thay vì bị động chịu thiệt hại khi chu kỳ đảo chiều.',
    level: 'Advanced',
    price: 2100000,
    discountPrice: 1390000,
    durationHours: 35,
    durationText: '35h',
    badge: 'NEW',
    averageRating: 4.94,
    totalStudents: 920,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'finance',
    title:
      'Lập Kế Hoạch Tài Chính Hưu Trí An Nhàn & Bảo Vệ Đa Tầng Cho Gia Đình',
    titleEn: 'Retirement Financial Planning & Multi-Layer Family Protection',
    slug: 'lap-ke-hoach-tai-chinh-huu-tri-an-nhan',
    shortDescription:
      'Tính toán quỹ hưu trí mục tiêu, lựa chọn bảo hiểm nhân thọ chuẩn xác và để lại di sản tài chính cho thế hệ sau.',
    shortDescriptionEn:
      'Target retirement fund calculation, optimal life insurance and multi-generational wealth transfer.',
    description:
      'Bảo đảm tương lai độc lập tài chính khi về già, sống thảnh thơi mà không cần phụ thuộc vào con cái hay trợ cấp xã hội.',
    level: 'Intermediate',
    price: 1350000,
    discountPrice: 790000,
    durationHours: 20,
    durationText: '20h',
    badge: 'POPULAR',
    averageRating: 4.87,
    totalStudents: 1280,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=800&auto=format&fit=crop&q=80',
  },

  // ==========================================
  // 8. SỨC KHỎE & ĐỜI SỐNG (health-wellness) - 10 KHÓA
  // ==========================================
  {
    categorySlug: 'health-wellness',
    title:
      'Dinh Dưỡng Toàn Diện: Thiết Kế Thực Đơn Eat Clean & Giảm Mỡ Khoa Học',
    titleEn:
      'Holistic Nutrition: Eat Clean Meal Prep & Science-Backed Fat Loss',
    slug: 'dinh-duong-toan-dien-eat-clean-giam-mo',
    shortDescription:
      'Hiểu về Calo in - Calo out, tỷ lệ Macro đạm/tinh bột/chất béo và cách nấu ăn ngon miệng không tích mỡ thừa.',
    shortDescriptionEn:
      'Caloric balance, Macro distribution and cooking delicious, sustainable fat-loss recipes.',
    description:
      'Chấm dứt các chế độ ăn kiêng cực đoan, xây dựng thói quen ăn uống lành mạnh để duy trì vóc dáng thon gọn suốt đời.',
    level: 'Beginner',
    price: 890000,
    discountPrice: 420000,
    durationHours: 18,
    durationText: '18h',
    badge: 'HOT',
    averageRating: 4.93,
    totalStudents: 3600,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'health-wellness',
    title: 'Yoga Trị Liệu Giảm Đau Cột Sống & Cổ Vai Gáy Cho Người Ngồi Nhiều',
    titleEn: 'Spine & Posture Yoga Therapy for Desk Workers',
    slug: 'yoga-tri-lieu-cot-song-co-vai-gay',
    shortDescription:
      '15 bài tập kéo giãn cơ lưng, mở khớp vai, chỉnh sửa gù lưng và cải thiện tư thế đứng ngồi chuẩn công sở.',
    shortDescriptionEn:
      '15 therapeutic routines for spinal decompression, shoulder release and postural alignment.',
    description:
      'Giải pháp tự nhiên, an toàn giúp xua tan những cơn đau nhức cổ vai gáy dai dẳng do thói quen ngồi máy tính hàng giờ.',
    level: 'Beginner',
    price: 0, // Khóa học miễn phí
    discountPrice: 0,
    durationHours: 14,
    durationText: '14h',
    badge: 'BESTSELLER',
    averageRating: 4.96,
    totalStudents: 5800,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'health-wellness',
    title:
      'Thiền Định & Chánh Niệm (Mindfulness): Giải Tỏa Căng Thẳng & Nâng Cao Tập Trung',
    titleEn: 'Meditation & Mindfulness: Stress Relief & Deep Focus',
    slug: 'thien-dinh-chanh-niem-giai-toa-cang-thang',
    shortDescription:
      'Quan sát hơi thở, giải phóng lo âu, làm dịu tâm trí và đưa não bộ vào trạng thái tĩnh tại sau giờ làm việc bận rộn.',
    shortDescriptionEn:
      'Breath awareness, anxiety reduction, mental calmness and cultivating deep attention spans.',
    description:
      'Học cách làm chủ tâm trí, giảm stress hiệu quả và tìm thấy sự bình an trong từng khoảnh khắc của cuộc sống hiện đại.',
    level: 'Beginner',
    price: 750000,
    discountPrice: 320000,
    durationHours: 12,
    durationText: '12h',
    badge: 'POPULAR',
    averageRating: 4.94,
    totalStudents: 2950,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'health-wellness',
    title:
      'Khoa Học Giấc Ngủ: Tối Ưu Giấc Ngủ Sâu & Phục Hồi Năng Lượng Não Bộ',
    titleEn: 'Sleep Science: Deep Rest & Brain Restoration Strategies',
    slug: 'khoa-hoc-giac-ngu-phuc-hoi-nang-luong',
    shortDescription:
      'Nhịp sinh học Circadian, thiết lập phòng ngủ tối ưu, loại bỏ ánh sáng xanh và bí quyết thức dậy tỉnh táo mỗi sáng.',
    shortDescriptionEn:
      'Circadian rhythms, sleep sanctuary optimization and waking up refreshed without brain fog.',
    description:
      'Giúp bạn thoát khỏi chứng mất ngủ, ngủ nông chập chờn để mỗi ngày thức giấc đều tràn đầy sinh lực và sảng khoái.',
    level: 'Beginner',
    price: 690000,
    discountPrice: 299000,
    durationHours: 10,
    durationText: '10h',
    badge: 'NEW',
    averageRating: 4.88,
    totalStudents: 1450,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1511295742362-92c96b124e52?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'health-wellness',
    title: 'Tập Luyện Kháng Lực Tại Nhà (Home Workout) Không Cần Dụng Cụ',
    titleEn: 'No-Equipment Home Workout & Calisthenics Routine',
    slug: 'tap-luyen-khang-luc-tai-nha-khong-dung-cu',
    shortDescription:
      'Chương trình Calisthenics toàn thân, bài tập đốt mỡ HIIT 20 phút và tăng cường sức bền cơ bắp dẻo dai.',
    shortDescriptionEn:
      'Full-body bodyweight calisthenics, 20-minute fat-burning HIIT and muscle stamina builder.',
    description:
      'Tiết kiệm thời gian đến phòng gym, tự tập luyện khoa học ngay tại phòng khách với hiệu quả không thua kém huấn luyện viên.',
    level: 'Beginner',
    price: 790000,
    discountPrice: 380000,
    durationHours: 16,
    durationText: '16h',
    badge: 'HOT',
    averageRating: 4.9,
    totalStudents: 3100,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'health-wellness',
    title: 'Quản Trị Cảm Xúc & Tâm Lý Học Hành Vi: Xây Dựng Sức Bật Tinh Thần',
    titleEn: 'Emotional Intelligence & Mental Resilience Development',
    slug: 'quan-tri-cam-xuc-suc-bat-tinh-than',
    shortDescription:
      'Nhận diện cảm xúc tiêu cực, kỹ thuật CBT tái định khung suy nghĩ và vượt qua hội chứng kiệt sức (Burnout).',
    shortDescriptionEn:
      'Cognitive behavioral reframing, overcoming professional burnout and building inner strength.',
    description:
      'Tăng cường sức mạnh tinh thần giúp bạn đứng vững trước những biến cố, áp lực công việc và duy trì niềm vui sống.',
    level: 'Intermediate',
    price: 1200000,
    discountPrice: 650000,
    durationHours: 20,
    durationText: '20h',
    badge: 'POPULAR',
    averageRating: 4.92,
    totalStudents: 1850,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'health-wellness',
    title: 'Sơ Cấp Cứu Y Tế Ban Đầu Chuẩn Quốc Tế Cho Gia Đình & Công Sở',
    titleEn: 'First Aid & CPR Certification for Home and Workplace',
    slug: 'so-cap-cuu-y-te-ban-dau-chuan-quoc-te',
    shortDescription:
      'Kỹ thuật hồi sinh tim phổi CPR, xử lý hóc dị vật Heimlich, băng bó vết thương và sơ cứu bỏng, sốc phản vệ.',
    shortDescriptionEn:
      'CPR techniques, Heimlich maneuver, wound dressing and emergency response protocols.',
    description:
      'Kỹ năng sinh tồn vô giá giúp bạn bảo vệ tính mạng của người thân, đồng nghiệp trong những tình huống nguy cấp trước khi y tế đến.',
    level: 'Beginner',
    price: 850000,
    discountPrice: 390000,
    durationHours: 12,
    durationText: '12h',
    badge: 'NEW',
    averageRating: 4.98,
    totalStudents: 1600,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'health-wellness',
    title: 'Thải Độc Cơ Thể & Chế Độ Ăn Phòng Ngừa Bệnh Mãn Tính',
    titleEn: 'Natural Detox & Chronic Disease Prevention Nutrition',
    slug: 'thai-doc-co-the-phong-ngua-benh-man-tinh',
    shortDescription:
      'Cơ chế tự thực (Autophagy), thanh lọc đường ruột, giảm viêm tế bào và phòng ngừa huyết áp, tiểu đường.',
    shortDescriptionEn:
      'Autophagy activation, gut health purification, cellular inflammation reduction and metabolic health.',
    description:
      'Chăm sóc sức khỏe chủ động từ tế bào bằng chế độ dinh dưỡng giàu chất chống oxy hóa tự nhiên từ thực vật.',
    level: 'Intermediate',
    price: 1100000,
    discountPrice: 590000,
    durationHours: 18,
    durationText: '18h',
    badge: '',
    averageRating: 4.87,
    totalStudents: 1250,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'health-wellness',
    title:
      'Pilates Cơ Bản: Tăng Cường Cơ Lõi (Core) & Cải Thiện Vóc Dáng Chuẩn',
    titleEn: 'Pilates Mat Fundamentals: Core Strength & Body Sculpting',
    slug: 'pilates-co-ban-co-loi-voc-dang',
    shortDescription:
      'Kiểm soát nhịp thở, siết chặt cơ bụng dưới, săn chắc đùi thon và tạo đường cong hình thể cân đối.',
    shortDescriptionEn:
      'Controlled breathing, lower abdominal engagement, lean muscle tone and postural grace.',
    description:
      'Bộ môn thể dục được các ngôi sao thế giới ưa chuộng để giữ gìn nét thanh xuân và sự dẻo dai linh hoạt cho cơ thể.',
    level: 'Beginner',
    price: 950000,
    discountPrice: 480000,
    durationHours: 15,
    durationText: '15h',
    badge: 'HOT',
    averageRating: 4.91,
    totalStudents: 2350,
    isForYou: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
  },
  {
    categorySlug: 'health-wellness',
    title: 'Xây Dựng Lối Sống Lành Mạnh (Healthy Lifestyle) Cho Người Bận Rộn',
    titleEn: 'Sustainable Healthy Lifestyle Blueprint for Busy Professionals',
    slug: 'xay-dung-loi-song-lanh-manh-ben-vung',
    shortDescription:
      'Thói quen vi mô (Atomic Habits), quản trị năng lượng sinh học và cân bằng hoàn hảo giữa công việc với sức khỏe.',
    shortDescriptionEn:
      'Micro habits, biological energy management and achieving sustainable work-life wellness.',
    description:
      'Lộ trình đơn giản, dễ thực hiện giúp bạn duy trì phong độ đỉnh cao mà không cần thay đổi 180 độ cuộc sống thường nhật.',
    level: 'Beginner',
    price: 700000,
    discountPrice: 320000,
    durationHours: 10,
    durationText: '10h',
    badge: '',
    averageRating: 4.85,
    totalStudents: 1780,
    isForYou: false,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80',
  },
];

async function runSeed() {
  try {
    console.log('[SeedMoreCourses] Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
    console.log('[SeedMoreCourses] Connected successfully.');

    // 1. Lấy danh sách Categories từ database
    const categories = await Category.find({}).lean();
    console.log(
      `[SeedMoreCourses] Found ${categories.length} categories in database.`,
    );

    const categoryMap: Record<string, mongoose.Types.ObjectId> = {};
    for (const cat of categories) {
      categoryMap[cat.slug] = cat._id as mongoose.Types.ObjectId;
    }

    // 2. Tìm instructor mặc định
    const instructor = await User.findOne({ role: 'INSTRUCTOR' })
      .select('_id fullName email')
      .lean();
    const instructorId = instructor ? instructor._id : null;
    console.log(
      '[SeedMoreCourses] Using instructor:',
      instructor ? `${instructor.fullName} (${instructor._id})` : 'None',
    );

    // 3. Lấy kỹ năng cho từng danh mục
    const skills = await Skill.find({}).lean();
    const catSkillsMap: Record<string, mongoose.Types.ObjectId[]> = {};
    for (const s of skills) {
      if (s.categoryId) {
        const cIdStr = s.categoryId.toString();
        if (!catSkillsMap[cIdStr]) catSkillsMap[cIdStr] = [];
        catSkillsMap[cIdStr].push(s._id as mongoose.Types.ObjectId);
      }
    }

    // 4. Tạo các khóa học
    let createdCount = 0;
    let updatedCount = 0;

    for (const def of NEW_COURSES) {
      const catId = categoryMap[def.categorySlug];
      if (!catId) {
        console.warn(
          `[SeedMoreCourses] Warning: Category slug "${def.categorySlug}" not found in DB!`,
        );
        continue;
      }

      const assignedSkills = catSkillsMap[catId.toString()] || [];
      const skillSlice = assignedSkills.slice(0, 3);

      // Tạo cấu trúc Section và Lectures mẫu hoàn chỉnh
      const sections = [
        {
          title: 'Phần 1: Giới thiệu & Kiến thức nền tảng',
          order: 1,
          lectures: [
            {
              title: `Giới thiệu tổng quan về ${def.title}`,
              type: 'VIDEO' as const,
              contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              fileName: 'intro_lecture.mp4',
              fileSize: 104857600,
              durationMinutes: 15,
              isPreview: true,
              order: 1,
              compressionStatus: 'COMPLETED' as const,
              transcript: `Chào mừng bạn đến với khóa học ${def.title}. Trong phần này chúng ta sẽ cùng nắm bắt các khái niệm cơ bản nhất.`,
              transcriptStatus: 'COMPLETED' as const,
            },
            {
              title: 'Tài liệu hướng dẫn & Giáo trình thực hành',
              type: 'DOCUMENT' as const,
              contentUrl: 'https://purrfect.edu.vn/materials/handbook.pdf',
              fileName: 'giao_trinh_thuc_hanh.pdf',
              fileSize: 5242880,
              durationMinutes: 20,
              isPreview: false,
              order: 2,
              compressionStatus: 'COMPLETED' as const,
            },
            {
              title: 'Bài kiểm tra đánh giá mức độ tiếp thu phần 1',
              type: 'QUIZ' as const,
              durationMinutes: 15,
              isPreview: false,
              order: 3,
              quizData: {
                title: 'Trắc nghiệm củng cố kiến thức phần 1',
                passingScore: 80,
                questions: [
                  {
                    id: 'q1',
                    type: 'MULTIPLE_CHOICE' as const,
                    question: `Mục tiêu quan trọng nhất của khóa học "${def.title}" là gì?`,
                    options: [
                      'Nắm vững lý thuyết và thực hành dự án thực tế',
                      'Chỉ học lý thuyết không cần thực hành',
                      'Đọc tài liệu mà không thực hành bài tập',
                      'Xem video không làm kiểm tra',
                    ],
                    correctAnswer: 0,
                    explanation:
                      'Khóa học chú trọng sự kết hợp nhuần nhuyễn giữa kiến thức lý thuyết vững vàng và ứng dụng thực tiễn.',
                    points: 10,
                  },
                ],
              },
            },
          ],
        },
        {
          title: 'Phần 2: Ứng dụng thực chiến & Tối ưu hóa chuyên sâu',
          order: 2,
          lectures: [
            {
              title: 'Thực hành các kỹ thuật trọng tâm & Case Study thực tế',
              type: 'VIDEO' as const,
              contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              fileName: 'advanced_practice.mp4',
              fileSize: 209715200,
              durationMinutes: 45,
              isPreview: false,
              order: 1,
              compressionStatus: 'COMPLETED' as const,
              transcript: `Bài học này tập trung vào các tình huống thực tế thường gặp và cách xử lý tối ưu.`,
              transcriptStatus: 'COMPLETED' as const,
            },
            {
              title: 'Tổng kết lộ trình & Định hướng phát triển chuyên môn',
              type: 'VIDEO' as const,
              contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              fileName: 'conclusion.mp4',
              fileSize: 157286400,
              durationMinutes: 30,
              isPreview: false,
              order: 2,
              compressionStatus: 'COMPLETED' as const,
            },
          ],
        },
      ];

      const coursePayload = {
        title: def.title,
        titleEn: def.titleEn,
        slug: def.slug,
        shortDescription: def.shortDescription,
        shortDescriptionEn: def.shortDescriptionEn,
        description: def.description,
        descriptionEn: def.shortDescriptionEn,
        thumbnailUrl: def.thumbnailUrl,
        badge: def.badge,
        price: def.price,
        discountPrice:
          def.discountPrice ??
          (def.price > 0 ? Math.round(def.price * 0.65) : 0),
        durationHours: def.durationHours,
        durationText: def.durationText,
        status: 'PUBLISHED' as const,
        averageRating: def.averageRating,
        totalStudents: def.totalStudents,
        isForYou: def.isForYou,
        level: def.level,
        categoryId: catId,
        skillIds: skillSlice,
        instructorId: instructorId,
        sections: sections,
        isDeleted: false,
        publishedAt: new Date(),
      };

      const existing = await Course.findOne({ slug: def.slug });
      if (!existing) {
        await Course.create(coursePayload);
        createdCount++;
        console.log(`  + [CREATED] [${def.categorySlug}] ${def.title}`);
      } else {
        await Course.updateOne({ _id: existing._id }, { $set: coursePayload });
        updatedCount++;
        console.log(`  * [UPDATED] [${def.categorySlug}] ${def.title}`);
      }
    }

    console.log(`\n==========================================`);
    console.log(
      `[SeedMoreCourses] Finished! Created: ${createdCount}, Updated: ${updatedCount}`,
    );

    // Tổng kết số khóa học theo category
    console.log(`\n--- BÁO CÁO SỐ LƯỢNG KHÓA HỌC HIỆN TẠI ---`);
    for (const cat of categories) {
      const count = await Course.countDocuments({
        categoryId: cat._id,
        isDeleted: false,
      });
      console.log(`- ${cat.name} (${cat.slug}): ${count} khóa học`);
    }

    const totalCourses = await Course.countDocuments({ isDeleted: false });
    console.log(`\nTổng số khóa học trong toàn hệ thống: ${totalCourses}`);
    console.log(`==========================================\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[SeedMoreCourses] Error:', err);
    process.exit(1);
  }
}

runSeed();
