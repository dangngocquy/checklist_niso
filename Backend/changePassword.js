const { connectDB } = require('./MongoDB/database');
const bcrypt = require('bcrypt');
const mssql = require('mssql');
const config = require('./sql');
const pool = new mssql.ConnectionPool(config);
const poolConnect = pool.connect();

// Get user information for password change
exports.getchangePassword = async (req, res) => {
    const { keys } = req.params;

    try {
        // Use a single database connection
        const collection = await connectDB('CHECKLIST_DATABASE');
        
        // Only retrieve necessary fields to reduce memory usage
        const admin = await collection.findOne(
            { keys }, 
            { projection: { password: 0 } } // Don't return the password
        );
        
        if (admin) {
            res.json(admin);
        } else {
            res.status(404).json({ message: 'Admin not found' });
        }
    } catch (error) {
        console.error('Error in getchangePassword:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update password
exports.putchangePassword = async (req, res) => {
    const { password, oldPassword } = req.body;
    const { keys } = req.params;
  
    if (!oldPassword || !password) {
      return res.status(400).json({ message: 'Vui lòng cung cấp cả mật khẩu cũ và mới!' });
    }
  
    try {
      const collection = await connectDB('CHECKLIST_DATABASE');
      
      // Lấy toàn bộ thông tin user để đồng bộ với SQL Server
      const admin = await collection.findOne({ keys });
  
      if (!admin) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
      }
  
      // Verify old password
      if (admin.password !== oldPassword) {
        return res.status(400).json({ message: 'Mật khẩu cũ không đúng!' });
      }

      // Update MongoDB
      const updatePromise = collection.updateOne(
        { keys },
        { $set: { password } }
      );
      
      // Add a timeout to the update operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database operation timed out')), 5000);
      });
      
      const result = await Promise.race([updatePromise, timeoutPromise]);

      // Cập nhật SQL Server
      try {
        // Kiểm tra xem user có tồn tại trong SQL không
        const checkQuery = 'SELECT COUNT(*) as count FROM databaseAccount WHERE keys = @keys';
        const checkResult = await executeSQLQuery(checkQuery, { keys });
        const userExists = checkResult.recordset[0].count > 0;

        if (userExists) {
          // Nếu user tồn tại, thực hiện update
          const sqlQuery = 'UPDATE databaseAccount SET password = @password WHERE keys = @keys';
          await executeSQLQuery(sqlQuery, { password, keys });
        } else {
          // Nếu user không tồn tại, thực hiện insert với đầy đủ thông tin
          const sqlQuery = `INSERT INTO databaseAccount (
            keys, username, password, bophan, phanquyen, name, 
            imgAvatar, locker, chinhanh, code_staff, chucvu, date, faceID
          ) VALUES (
            @keys, @username, @password, @bophan, @phanquyen, @name,
            @imgAvatar, @locker, @chinhanh, @code_staff, @chucvu, @date, @faceID
          )`;

          const sqlParams = {
            keys: admin.keys,
            username: admin.username,
            password: password,
            bophan: admin.bophan || '',
            phanquyen: admin.phanquyen ? 1 : 0,
            name: admin.name,
            imgAvatar: admin.imgAvatar || null,
            locker: admin.locker ? 1 : 0,
            chinhanh: admin.chinhanh || '',
            code_staff: admin.code_staff || '',
            chucvu: admin.chucvu || '',
            date: admin.date || new Date().toISOString(),
            faceID: admin.faceID || null
          };

          await executeSQLQuery(sqlQuery, sqlParams);
        }
      } catch (sqlError) {
        console.error('SQL operation error:', sqlError);
        // Tiếp tục xử lý vì đã cập nhật thành công trên MongoDB
      }
  
      if (result.modifiedCount > 0) {
        return res.status(200).json({ message: 'Cập nhật mật khẩu thành công!' });
      } else {
        return res.status(200).json({ message: 'Không có thay đổi' });
      }
    } catch (error) {
      console.error('Error in putchangePassword:', error);
      return res.status(500).json({ message: 'Lỗi server nội bộ: ' + error.message });
    }
};

// Hàm trợ giúp để thực hiện truy vấn SQL
async function executeSQLQuery(query, params) {
  try {
    await poolConnect; // Đảm bảo pool đã kết nối
    const request = pool.request();
    if (params) {
      for (const key in params) {
        request.input(key, params[key]);
      }
    }
    const result = await request.query(query);
    return result;
  } catch (err) {
    console.error("SQL error:", err);
    throw err; // Ném lỗi để xử lý ở nơi gọi
  }
}