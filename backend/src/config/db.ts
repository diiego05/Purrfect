import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Runtime connection error:', err.message);
    });

    const conn = await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME || 'learnova',
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[MongoDB] Connected successfully: ${conn.connection.host} (DB: ${conn.connection.name})`);
  } catch (error: any) {
    console.error('[MongoDB] Initial connection error:', error?.message || error);
    console.warn('⚠️ LƯU Ý: Nếu gặp lỗi server selection timeout, hãy kiểm tra Network Access trên MongoDB Atlas và thêm IP hiện tại hoặc 0.0.0.0/0');
  }
};

