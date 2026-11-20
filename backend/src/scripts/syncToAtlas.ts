import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Script sao chép toàn bộ dữ liệu từ MongoDB Local sang MongoDB Atlas Cloud
 * Cách dùng:
 *   npx ts-node src/scripts/syncToAtlas.ts "mongodb+srv://<user>:<pass>@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority"
 */
async function syncDatabase() {
  let atlasUri = process.argv[2] || process.env.ATLAS_MONGODB_URI;

  // Nếu người dùng đã dán link Atlas vào MONGODB_URI trong .env
  if (!atlasUri && process.env.MONGODB_URI?.startsWith('mongodb+srv://')) {
    atlasUri = process.env.MONGODB_URI;
  }

  if (!atlasUri || !atlasUri.startsWith('mongodb')) {
    console.error('❌ Vui lòng truyền URL MongoDB Atlas!');
    console.log('Ví dụ:');
    console.log(
      '  npm run db:push-atlas "mongodb+srv://username:password@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority"',
    );
    console.log('Hoặc đặt biến ATLAS_MONGODB_URI trong file .env');
    process.exit(1);
  }

  const localUri = 'mongodb://127.0.0.1:27017/';
  const dbName = process.env.MONGODB_DB_NAME || 'purrfect';

  console.log(`📡 Đang kết nối tới MongoDB Local: ${localUri}${dbName}`);
  const localConn = await mongoose
    .createConnection(`${localUri}${dbName}`)
    .asPromise();
  console.log('✅ Đã kết nối Local MongoDB');

  console.log('Đang kết nối tới MongoDB Atlas...');
  const atlasConn = await mongoose
    .createConnection(atlasUri, { dbName })
    .asPromise();
  console.log('Đã kết nối MongoDB Atlas');

  const collections = await localConn.db!.listCollections().toArray();
  console.log(`Tìm thấy ${collections.length} collections cần đồng bộ:`);

  for (const col of collections) {
    const colName = col.name;
    if (colName.startsWith('system.')) continue;

    const docs = await localConn.db!.collection(colName).find({}).toArray();
    console.log(
      `  -> Đang chuyển ${docs.length} bản ghi của collection [${colName}]...`,
    );

    if (docs.length > 0) {
      await atlasConn.db!.collection(colName).deleteMany({});
      await atlasConn.db!.collection(colName).insertMany(docs);
    }
  }

  console.log('\nĐỒNG BỘ THÀNH CÔNG LÊN MONGODB ATLAS!');
  await localConn.close();
  await atlasConn.close();
  process.exit(0);
}

syncDatabase().catch((err) => {
  console.error('Lỗi khi đồng bộ:', err);
  process.exit(1);
});
