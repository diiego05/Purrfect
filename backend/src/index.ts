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
import paymentRoutes from './routes/paymentRoutes';
import cartRoutes from './routes/cartRoutes';
import wishlistRoutes from './routes/wishlistRoutes';
import userRoutes from './routes/userRoutes';
import playlistRoutes from './routes/playlistRoutes';
import instructorCourseRoutes from './routes/instructorCourseRoutes';
import { seedDefaultConfigs } from './controllers/systemConfigController';
import { seedDefaultUsersIfEmpty } from './controllers/userController';
import { verifyMailerConnection } from './utils/mailer';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middlewares
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  }),
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/system-configs', systemConfigRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/instructor/courses', instructorCourseRoutes);

// Health check
app.get('/api/health', (_req, expressRes) => {
  expressRes.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Learnova/Purrfect Auth API',
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

app.listen(Number(PORT), '0.0.0.0', () => {
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
  // Seed default system configs (only sets missing keys)
  seedDefaultConfigs().catch(console.error);
  // Seed sample users if empty
  seedDefaultUsersIfEmpty().catch(console.error);
  // Kiểm tra kết nối SMTP ngay khi server khởi động
  verifyMailerConnection();
});
