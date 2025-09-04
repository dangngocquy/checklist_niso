const { MongoClient } = require("mongodb");

const mongoURI = "mongodb://localhost:27017";
const dbName = "admin";
const options = {
  maxPoolSize: 50,             // Giới hạn số lượng kết nối trong pool
  serverSelectionTimeoutMS: 5000, // Timeout cho việc chọn server
  connectTimeoutMS: 10000         // Timeout cho kết nối
};

// Dùng một client duy nhất, không tạo nhiều instances
const client = new MongoClient(mongoURI, options);
let isConnected = false;
let connectionPromise = null;  // Lưu trữ promise kết nối

// Kết nối đến MongoDB - sử dụng singleton pattern
async function connectDB(collectionName) {
  try {
    if (!isConnected) {
      if (!connectionPromise) {
        // Chỉ tạo promise kết nối một lần
        connectionPromise = client.connect();
      }
      await connectionPromise;
      isConnected = true;
      console.log("✅ Kết nối thành công tới MongoDB!");
    }
    return client.db(dbName).collection(collectionName);
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error);
    isConnected = false;
    connectionPromise = null;  // Reset promise để có thể thử lại
    throw error;
  }
}

// Đóng kết nối MongoDB khi ứng dụng thoát
async function closeConnection() {
  if (isConnected) {
    await client.close();
    isConnected = false;
    connectionPromise = null;
    console.log("❌ Đã ngắt kết nối tới MongoDB!");
  }
}

process.on("SIGINT", async () => {
  await closeConnection();
  process.exit(0);
});

// Thêm xử lý cho các sự kiện khác
process.on("SIGTERM", async () => {
  await closeConnection();
  process.exit(0);
});

process.on("uncaughtException", async (error) => {
  console.error("Uncaught Exception:", error);
  await closeConnection();
  process.exit(1);
});

module.exports = { connectDB, closeConnection };