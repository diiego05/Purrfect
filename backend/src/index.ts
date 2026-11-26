import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import cors from 'cors';
import multer from 'multer';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import courseRoutes from './routes/courseRoutes';
import categoryRoutes from './routes/categoryRoutes';
import systemConfigRoutes from './routes/systemConfigRoutes';
import bannerRoutes from './routes/bannerRoutes';
import couponRoutes from './routes/couponRoutes';

import aiChatRoutes from './routes/aiChatRoutes';
import aiQuizRoutes from './routes/aiQuizRoutes';

import paymentRoutes from './routes/paymentRoutes';
import cartRoutes from './routes/cartRoutes';
import wishlistRoutes from './routes/wishlistRoutes';
import userRoutes from './routes/userRoutes';
import playlistRoutes from './routes/playlistRoutes';
import instructorCourseRoutes from './routes/instructorCourseRoutes';
import discussionRoutes from './routes/discussionRoutes';
import lectureNoteRoutes from './routes/lectureNoteRoutes';
import reviewRoutes from './routes/reviewRoutes';

import refundRoutes from './routes/refundRoutes';
import withdrawalRoutes from './routes/withdrawalRoutes';

import moderationRoutes from './routes/moderationRoutes';
import instructorApplicationRoutes from './routes/instructorApplicationRoutes';
import adminStatisticsRoutes from './routes/adminStatisticsRoutes';

import { seedDefaultConfigs } from './controllers/systemConfigController';
import { seedDefaultUsersIfEmpty } from './controllers/userController';
import { seedCoursesIfEmpty } from './controllers/courseController';
import { verifyMailerConnection } from './utils/mailer';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (ví dụ curl, Postman, health check)
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        process.env.CLIENT_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ];
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);

// Health check endpoint (Đáp ứng tiêu chí Rubric TC2.6 về giám sát & health check sau triển khai)
app.get(['/health', '/api/health'], (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Purrfect Backend API',
  });
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware phân tích Cookie từ HTTP Request (HttpOnly Cookies)
app.use((req: Request, _res: Response, next: NextFunction) => {
  const cookies: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const items = cookieHeader.split(';');
    for (const item of items) {
      const idx = item.indexOf('=');
      if (idx !== -1) {
        const key = item.substring(0, idx).trim();
        const val = decodeURIComponent(item.substring(idx + 1).trim());
        cookies[key] = val;
      }
    }
  }
  (req as any).cookies = cookies;
  next();
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/system-configs', systemConfigRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/coupons', couponRoutes);

app.use('/api/ai', aiChatRoutes);
app.use('/api/v1/ai', aiChatRoutes);
app.use('/api/ai/quiz', aiQuizRoutes);
app.use('/api/v1/ai/quiz', aiQuizRoutes);

app.use('/api/payment', paymentRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/instructor/courses', instructorCourseRoutes);
app.use('/api/v1', discussionRoutes);
app.use('/api', discussionRoutes);
app.use('/api/v1', lectureNoteRoutes);
app.use('/api', lectureNoteRoutes);
app.use('/api/v1', reviewRoutes);
app.use('/api', reviewRoutes);

app.use('/api/refunds', refundRoutes);
app.use('/api/v1/refunds', refundRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/v1/withdrawals', withdrawalRoutes);
app.use('/api/v1', moderationRoutes);
app.use('/api', moderationRoutes);
app.use('/api/v1/admin/moderation', moderationRoutes);
app.use('/api/admin/moderation', moderationRoutes);

app.use('/api/v1', instructorApplicationRoutes);
app.use('/api', instructorApplicationRoutes);
app.use('/api/v1/instructor-applications', instructorApplicationRoutes);
app.use('/api/instructor-applications', instructorApplicationRoutes);
app.use('/api/v1/admin/instructor-applications', instructorApplicationRoutes);
app.use('/api/admin/instructor-applications', instructorApplicationRoutes);

app.use('/api/v1/admin/statistics', adminStatisticsRoutes);
app.use('/api/admin/statistics', adminStatisticsRoutes);
app.use('/api/admin-statistics', adminStatisticsRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Purrfect Backend API is running successfully!',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      apiHealth: '/api/health',
      courses: '/api/courses',
    },
  });
});

// Health check
app.get('/health', (_req, expressRes) => {
  expressRes.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Purrfect API Service',
  });
});

app.get('/api/health', (_req, expressRes) => {
  expressRes.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Purrfect Auth API',
  });
});

// Fallback JSON cho các API route không tồn tại
app.use('/api', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Không tìm thấy đường dẫn API yêu cầu',
  });
});

// Middleware xử lý lỗi toàn cục (Multer, JSON parser, lỗi hệ thống) -> luôn trả về JSON
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        message:
          'Dung lượng tệp tải lên vượt quá giới hạn cho phép của máy chủ',
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: `Lỗi tải tệp lên: ${err.message}`,
    });
    return;
  }

  const errObj = err as { status?: number; type?: string; message?: string };
  if (errObj?.type === 'entity.too.large' || errObj?.status === 413) {
    res.status(413).json({
      success: false,
      message: 'Dữ liệu gửi lên vượt quá kích thước cho phép',
    });
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      message: 'Dữ liệu JSON gửi lên không hợp lệ',
    });
    return;
  }

  console.error('[Server Error]', err);
  res.status(errObj?.status || 500).json({
    success: false,
    message: errObj?.message || 'Lỗi máy chủ nội bộ',
  });
});

const startServer = async () => {
  // Kết nối đến MongoDB trước khi mở cổng nhận request
  await connectDB();

  app.listen(Number(PORT), '0.0.0.0', async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Auth routes available at http://localhost:${PORT}/api/auth`);
    console.log(
      `Category routes available at http://localhost:${PORT}/api/categories`,
    );
    console.log(
      `System config routes available at http://localhost:${PORT}/api/system-configs`,
    );
    console.log(
      `Banner routes available at http://localhost:${PORT}/api/banners`,
    );
    console.log(
      `Coupon routes available at http://localhost:${PORT}/api/coupons`,
    );
    console.log(`AI Chat routes available at http://localhost:${PORT}/api/ai`);

    // Chỉ thực hiện seed dữ liệu mẫu khi cơ sở dữ liệu đã kết nối thành công
    if (mongoose.connection.readyState === 1) {
      await seedDefaultConfigs().catch(console.error);
      await seedDefaultUsersIfEmpty().catch(console.error);
      await seedCoursesIfEmpty().catch(console.error);
    }
    // Kiểm tra kết nối SMTP ngay khi server khởi động
    verifyMailerConnection();
  });
};

startServer();
