import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import courseRoutes from './routes/courseRoutes';
import categoryRoutes from './routes/categoryRoutes';
import systemConfigRoutes from './routes/systemConfigRoutes';
import bannerRoutes from './routes/bannerRoutes';
import couponRoutes from './routes/couponRoutes';
import aiChatRoutes from './routes/aiChatRoutes';
import { seedDefaultConfigs } from './controllers/systemConfigController';
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/system-configs', systemConfigRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/ai', aiChatRoutes);
app.use('/api/v1/ai', aiChatRoutes);

// Health check
app.get('/api/health', (_req, expressRes) => {
  expressRes.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Learnova/Purrfect Auth API',
  });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Auth routes available at http://localhost:${PORT}/api/auth`);
  console.log(`Category routes available at http://localhost:${PORT}/api/categories`);
  console.log(`System config routes available at http://localhost:${PORT}/api/system-configs`);
  console.log(`Banner routes available at http://localhost:${PORT}/api/banners`);
  console.log(`Coupon routes available at http://localhost:${PORT}/api/coupons`);
  console.log(`AI Chat routes available at http://localhost:${PORT}/api/ai`);
  // Seed default system configs (only sets missing keys)
  seedDefaultConfigs().catch(console.error);
  // Kiểm tra kết nối SMTP ngay khi server khởi động
  verifyMailerConnection();
});
