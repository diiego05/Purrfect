import mongoose from 'mongoose';

let isConnecting = false;
let retryTimer: NodeJS.Timeout | null = null;

export const connectDB = async (): Promise<boolean> => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }
  if (isConnecting) {
    return false;
  }

  isConnecting = true;
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error(
      '❌ [MongoDB] Lỗi: MONGODB_URI chưa được định nghĩa trong file .env',
    );
    isConnecting = false;
    return false;
  }

  try {
    mongoose.connection.removeAllListeners('error');
    mongoose.connection.removeAllListeners('disconnected');
    mongoose.connection.removeAllListeners('connected');

    mongoose.connection.on('connected', () => {
      console.log('✅ [MongoDB] Kết nối cơ sở dữ liệu thành công!');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ [MongoDB] Lỗi kết nối runtime:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(
        '⚠️ [MongoDB] Mất kết nối tới cơ sở dữ liệu. Đang thử kết nối lại...',
      );
      scheduleReconnect();
    });

    const conn = await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME || 'purrfect',
      serverSelectionTimeoutMS: 5000,
    });

    console.log(
      `✅ [MongoDB] Đã kết nối thành công: ${conn.connection.host} (DB: ${conn.connection.name})`,
    );

    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    isConnecting = false;
    return true;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('\n' + '='.repeat(70));
    console.error('❌ [MongoDB] LỖI KHÔNG THỂ KẾT NỐI ĐẾN CƠ SỞ DỮ LIỆU:');
    console.error(`   Chi tiết: ${errorMsg}`);
    console.error(`   URI đang dùng: ${mongoUri}`);
    console.error('\n👉 HƯỚNG DẪN KHẮC PHỤC NHANH:');
    if (mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost')) {
      console.error('   1. Nếu dùng MongoDB Local trên máy tính:');
      console.error('      - Dịch vụ MongoDB trên Windows đang bị DỪNG (TẮT).');
      console.error(
        '      - Mở PowerShell/CMD (Run as Administrator) và chạy: net start MongoDB',
      );
      console.error(
        '      - Hoặc mở Start menu -> gõ "Services" -> tìm "MongoDB Server" -> bấm Start.',
      );
      console.error(
        '      - Hoặc mở ứng dụng "MongoDB Compass" để kích hoạt dịch vụ.',
      );
    } else {
      console.error('   1. Nếu dùng MongoDB Atlas (Cloud):');
      console.error(
        '      - Kiểm tra IP hiện tại đã được thêm vào Network Access trên MongoDB Atlas chưa.',
      );
      console.error(
        '      - Thêm IP: Chọn "Allow Access From Anywhere" (0.0.0.0/0).',
      );
      console.error(
        '      - Kiểm tra kết nối Internet hoặc tài khoản/mật khẩu trong URI.',
      );
    }
    console.error('='.repeat(70) + '\n');

    isConnecting = false;
    scheduleReconnect();
    return false;
  }
};

const scheduleReconnect = () => {
  if (retryTimer) return;
  retryTimer = setTimeout(async () => {
    retryTimer = null;
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 [MongoDB] Đang thử kết nối lại MongoDB...');
      await connectDB();
    }
  }, 5000);
};
