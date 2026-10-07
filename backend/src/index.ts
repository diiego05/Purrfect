import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
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
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (_req, expressRes) => {
  expressRes.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Learnova/Purrfect Auth API',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Auth routes available at http://localhost:${PORT}/api/auth`);
  // Kiểm tra kết nối SMTP ngay khi server khởi động
  verifyMailerConnection();
});
