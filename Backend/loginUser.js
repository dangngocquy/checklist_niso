const { connectDB } = require('./MongoDB/database');
const QRCode = require('qrcode');
const crypto = require('crypto');

// Khởi tạo MongoDB client toàn cục
let cachedDb = null;
async function getDBConnection() {
  if (!cachedDb) {
    cachedDb = await connectDB('CHECKLIST_DATABASE');
  }
  return cachedDb;
}

// Quản lý tempToken và login attempts bằng Map với cleanup định kỳ
const tempTokenStore = new Map();
const loginAttemptsStore = new Map();
const TOKEN_TTL = 60 * 1000; // 60 giây
const MAX_LOGIN_ATTEMPTS = 3; // Số lần đăng nhập sai tối đa
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 phút khóa tài khoản

// Hàm dọn dẹp token và login attempts hết hạn
function cleanupStores() {
  const now = Date.now();
  for (const [token, { createdAt }] of tempTokenStore) {
    if (now - createdAt > TOKEN_TTL) {
      tempTokenStore.delete(token);
    }
  }
  for (const [key, { lockoutUntil }] of loginAttemptsStore) {
    if (lockoutUntil && now > lockoutUntil) {
      loginAttemptsStore.delete(key);
    }
  }
}

// Chạy cleanup mỗi 5 phút
setInterval(cleanupStores, 5 * 60 * 1000);

// 1. Đăng nhập người dùng
exports.postLoginUser = async (req, res) => {
  const { username, password, code_staff, isQRLogin } = req.body;

  try {
    // Decode dữ liệu đầu vào an toàn
    const decodeSafe = (data) => {
      try {
        return data ? atob(data) : null;
      } catch (error) {
        throw new Error('Invalid base64 data');
      }
    };

    const decodedUsername = decodeSafe(username);
    const decodedPassword = decodeSafe(password);
    const decodedCodeStaff = decodeSafe(code_staff);

    const collection = await getDBConnection();
    let query;
    let loginKey;

    if (isQRLogin) {
      if (!decodedCodeStaff) return res.status(400).json({ message: 'Code staff is required for QR login' });
      query = { code_staff: Number(decodedCodeStaff) }; // Ép kiểu thành số
      loginKey = decodedCodeStaff;
    } else if (decodedCodeStaff) {
      if (!decodedPassword) return res.status(400).json({ message: 'Password is required with code staff' });
      // Thử tìm kiếm với cả số và chuỗi
      const numericCodeStaff = Number(decodedCodeStaff);
      query = {
        $or: [
          { code_staff: numericCodeStaff, password: decodedPassword },
          { code_staff: decodedCodeStaff, password: decodedPassword }
        ]
      };
      loginKey = decodedCodeStaff;
    } else {
      if (!decodedUsername || !decodedPassword) return res.status(400).json({ message: 'Username and password are required' });
      query = { username: decodedUsername, password: decodedPassword };
      loginKey = decodedUsername;
    }

    // Kiểm tra trạng thái khóa
    const attemptData = loginAttemptsStore.get(loginKey) || { attempts: 0, lockoutUntil: null };
    if (attemptData.lockoutUntil && Date.now() < attemptData.lockoutUntil) {
      const remainingMinutes = Math.ceil((attemptData.lockoutUntil - Date.now()) / 60000);
      return res.status(423).json({
        message: 'Account temporarily locked',
        remainingMinutes
      });
    }

    const user = await collection.findOne(query, {
      projection: { password: 0 } // Loại bỏ password khỏi response
    });

    if (user) {
      // Kiểm tra trạng thái locker
      if (user.locker === true) {
        // Trả về thông tin người dùng với locker = true, không tăng loginCount
        const { keys, name, bophan, phanquyen, imgAvatar, chinhanh, locker, chucvu, date, code_staff, faceID, imgBackground, loginCount } = user;
        return res.json({ keys, name, bophan, phanquyen, chinhanh, imgAvatar, locker, chucvu, date, code_staff, faceID, imgBackground, loginCount });
      }

      // Đặt lại số lần thử nếu đăng nhập thành công
      loginAttemptsStore.delete(loginKey);

      // Tăng loginCount trong cơ sở dữ liệu nếu tài khoản không bị khóa
      await collection.updateOne(
        query,
        { $inc: { loginCount: 1 } }
      );

      // Lấy lại thông tin người dùng sau khi cập nhật
      const updatedUser = await collection.findOne(query, {
        projection: { password: 0 }
      });

      const { keys, name, bophan, phanquyen, imgAvatar, chinhanh, locker, chucvu, date, code_staff, faceID, imgBackground, loginCount } = updatedUser;
      res.json({ keys, name, bophan, phanquyen, chinhanh, imgAvatar, locker, chucvu, date, code_staff, faceID, imgBackground, loginCount });
    } else {
      // Tăng số lần thử đăng nhập thất bại
      attemptData.attempts = (attemptData.attempts || 0) + 1;
      if (attemptData.attempts >= MAX_LOGIN_ATTEMPTS) {
        attemptData.lockoutUntil = Date.now() + LOCKOUT_DURATION;
        attemptData.attempts = 0;
      }
      loginAttemptsStore.set(loginKey, attemptData);

      if (attemptData.lockoutUntil) {
        const remainingMinutes = Math.ceil((attemptData.lockoutUntil - Date.now()) / 60000);
        return res.status(423).json({
          message: 'Account temporarily locked',
          remainingMinutes
        });
      }

      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(error.message === 'Invalid base64 data' ? 400 : 500).json({
      message: error.message === 'Invalid base64 data' ? 'Invalid input data' : 'Internal server error'
    });
  }
};

// 2. Tạo QR code
exports.generateQRCode = async (req, res) => {
  const { temp, keys } = req.body;

  if (!temp && !keys) {
    return res.status(400).json({ message: 'Either temp or keys is required' });
  }

  try {
    if (temp) {
      const tempToken = crypto.randomBytes(16).toString('hex');
      const qrData = JSON.stringify({ tempToken });
      const qrCodeUrl = await QRCode.toDataURL(qrData, { errorCorrectionLevel: 'H' });
      tempTokenStore.set(tempToken, { createdAt: Date.now() });
      res.json({ qrCode: qrCodeUrl, tempToken });
    } else {
      const collection = await getDBConnection();
      const user = await collection.findOne({ keys }, { projection: { code_staff: 1 } });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const qrData = JSON.stringify({ code_staff: user.code_staff });
      const qrCodeUrl = await QRCode.toDataURL(qrData, { errorCorrectionLevel: 'H' });
      res.json({ qrCode: qrCodeUrl });
    }
  } catch (error) {
    console.error('QR generation error:', error.message);
    res.status(500).json({ message: 'Error generating QR code' });
  }
};

// 3. Xác thực QR code
exports.verifyQRCode = async (req, res) => {
  const { qrData, userKeys } = req.body;

  if (!qrData || !userKeys) {
    return res.status(400).json({ message: 'Both qrData and userKeys are required' });
  }

  try {
    const parsedData = JSON.parse(qrData);
    const { tempToken } = parsedData;

    if (!tempToken) {
      return res.status(400).json({ message: 'Invalid QR data: tempToken missing' });
    }

    const tokenData = tempTokenStore.get(tempToken);
    if (!tokenData || Date.now() - tokenData.createdAt > TOKEN_TTL) {
      tempTokenStore.delete(tempToken);
      return res.status(401).json({ message: 'Invalid or expired tempToken' });
    }

    const collection = await getDBConnection();
    const user = await collection.findOne({ keys: userKeys }, {
      projection: { password: 0 }
    });

    if (user) {
      // Kiểm tra trạng thái locker
      if (user.locker === true) {
        // Trả về thông tin người dùng với locker = true, không tăng loginCount
        const { keys, name, bophan, phanquyen, imgAvatar, chinhanh, locker, chucvu, date, code_staff, faceID, imgBackground, loginCount } = user;
        tempTokenStore.delete(tempToken);
        return res.json({ keys, name, bophan, phanquyen, chinhanh, imgAvatar, locker, chucvu, date, code_staff, faceID, imgBackground, loginCount });
      }

      // Tăng loginCount trong cơ sở dữ liệu nếu tài khoản không bị khóa
      await collection.updateOne(
        { keys: userKeys },
        { $inc: { loginCount: 1 } }
      );

      // Lấy lại thông tin người dùng sau khi cập nhật
      const updatedUser = await collection.findOne({ keys: userKeys }, {
        projection: { password: 0 }
      });

      const { keys, name, bophan, phanquyen, imgAvatar, chinhanh, locker, chucvu, date, code_staff, faceID, imgBackground, loginCount } = updatedUser;
      tempTokenStore.delete(tempToken);
      res.json({ keys, name, bophan, phanquyen, chinhanh, imgAvatar, locker, chucvu, date, code_staff, faceID, imgBackground, loginCount });
    } else {
      res.status(404).json({ message: 'User not found with provided userKeys' });
    }
  } catch (error) {
    console.error('QR verification error:', error.message);
    res.status(500).json({ message: 'Error verifying QR code' });
  }
};

async function initializeLoginCount() {
  const collection = await getDBConnection();
  await collection.updateMany(
    { loginCount: { $exists: false } },
    { $set: { loginCount: 0 } }
  );
}