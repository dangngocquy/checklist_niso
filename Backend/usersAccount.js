const { connectDB } = require('./MongoDB/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const mssql = require('mssql');
const config = require('./sql');
const pool = new mssql.ConnectionPool(config);
const poolConnect = pool.connect();

let cachedDb = null;
async function getDBConnection() {
  if (!cachedDb) {
    cachedDb = await connectDB('CHECKLIST_DATABASE');
  }
  return cachedDb;
}

const dataCache = new Map();
const TTL = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (page, limit, filters) => `${page}_${limit}_${JSON.stringify(filters)}`;

const setCache = (key, data) => {
  dataCache.set(key, { data, timestamp: Date.now() });
};

const getCache = (key) => {
  const cached = dataCache.get(key);
  if (cached && Date.now() - cached.timestamp < TTL) return cached.data;
  dataCache.delete(key);
  return null;
};

const invalidateCacheForUser = (keys) => {
  for (const key of dataCache.keys()) {
    if (key.includes(keys)) dataCache.delete(key);
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

// 1. Get list of users
exports.getusersAccount = async (req, res) => {
  try {
    const collection = await getDBConnection();
    const { page = 1, limit = 5, name, username, bophan, chinhanh, chucvu, locker, pagination, search, startDate, endDate } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);

    if (isNaN(parsedPage) || parsedPage < 1 || isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({ success: false, message: 'Invalid page or limit value' });
    }

    const filters = { name, username, bophan, chinhanh, chucvu, locker, search, startDate, endDate };
    const cacheKey = getCacheKey(parsedPage, parsedLimit, filters);
    const cachedData = getCache(cacheKey);
    if (cachedData && !pagination) return res.json(cachedData);

    const projection = {
      DataChecklist: 0,
      LoginHistory: 0,
      ...(pagination !== 'false' && { imgBackground: 0 }),
    };

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { bophan: { $regex: search, $options: 'i' } },
        { chinhanh: { $regex: search, $options: 'i' } },
      ];
    }
    Object.entries({ name, username, bophan, chinhanh, chucvu }).forEach(([key, value]) => {
      if (value) query[key] = { $regex: value, $options: 'i' };
    });
    if (locker !== undefined) query.locker = locker === 'true';

    // Thêm điều kiện lọc theo ngày
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        // Lấy ngày bắt đầu và set giờ về 00:00:00
        const startMoment = moment(startDate, 'DD-MM-YYYY HH:mm:ss').startOf('day');
        const startDateStr = startMoment.format('DD-MM-YYYY HH:mm:ss');
        query.date.$gte = startDateStr;
      }
      if (endDate) {
        // Lấy ngày kết thúc và set giờ về 23:59:59
        const endMoment = moment(endDate, 'DD-MM-YYYY HH:mm:ss').endOf('day');
        const endDateStr = endMoment.format('DD-MM-YYYY HH:mm:ss');
        query.date.$lte = endDateStr;
      }
    }

    if (pagination === 'false') {
      const data = await collection
        .find(query, { projection })
        .sort({ date: -1 })
        .limit(1000)
        .toArray();

      // Format dates before sending response
      const formattedData = data.map(item => {
        let formattedDate = null;
        try {
          if (item.date) {
            // Kiểm tra nếu date là string
            if (typeof item.date === 'string') {
              // Thử parse với định dạng DD-MM-YYYY HH:mm:ss
              if (moment(item.date, 'DD-MM-YYYY HH:mm:ss', true).isValid()) {
                formattedDate = item.date;
              } else {
                // Nếu không phải định dạng trên, thử parse với moment
                const parsedDate = moment(item.date);
                if (parsedDate.isValid()) {
                  formattedDate = parsedDate.format('DD-MM-YYYY HH:mm:ss');
                }
              }
            } else if (item.date instanceof Date) {
              // Nếu là Date object
              formattedDate = moment(item.date).format('DD-MM-YYYY HH:mm:ss');
            }
          }
        } catch (error) {
          console.error('Error formatting date:', error);
          formattedDate = null;
        }
        return {
          ...item,
          date: formattedDate
        };
      });

      const response = { 
        success: true, 
        data: formattedData, 
        total: formattedData.length, 
        currentPage: 1, 
        totalPages: 1, 
        hasMore: false, 
        relatedData: {} 
      };
      setCache(cacheKey, response);
      return res.json(response);
    }

    const skip = (parsedPage - 1) * parsedLimit;
    const total = await collection.countDocuments(query);
    
    // Lấy tất cả dữ liệu và sắp xếp trước khi phân trang
    const allData = await collection
      .find(query, { projection })
      .sort({ date: -1 })
      .toArray();

    // Format dates và sắp xếp lại để đảm bảo thứ tự chính xác
    const formattedAllData = allData.map(item => {
      let formattedDate = null;
      try {
        if (item.date) {
          if (typeof item.date === 'string') {
            if (moment(item.date, 'DD-MM-YYYY HH:mm:ss', true).isValid()) {
              formattedDate = item.date;
            } else {
              const parsedDate = moment(item.date);
              if (parsedDate.isValid()) {
                formattedDate = parsedDate.format('DD-MM-YYYY HH:mm:ss');
              }
            }
          } else if (item.date instanceof Date) {
            formattedDate = moment(item.date).format('DD-MM-YYYY HH:mm:ss');
          }
        }
      } catch (error) {
        console.error('Error formatting date:', error);
        formattedDate = null;
      }
      return {
        ...item,
        date: formattedDate
      };
    }).sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return moment(b.date, 'DD-MM-YYYY HH:mm:ss').valueOf() - moment(a.date, 'DD-MM-YYYY HH:mm:ss').valueOf();
    });

    // Phân trang sau khi đã sắp xếp
    const formattedData = formattedAllData.slice(skip, skip + parsedLimit);

    const totalPages = Math.ceil(total / parsedLimit);

    const response = {
      success: true,
      data: formattedData,
      total,
      currentPage: parsedPage,
      totalPages,
      hasMore: parsedPage < totalPages,
      relatedData: {},
    };

    setCache(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// 2. Get user by keys
exports.getusersAccountID = async (req, res) => {
  const { keys } = req.params;
  try {
    const collection = await getDBConnection();
    const result = await collection.findOne(
      { keys },
      { projection: { _id: 0, password: 0, DataChecklist: 0, LoginHistory: 0 } }
    );
    if (result) res.json(result);
    else res.status(404).json({ message: 'Admin not found' });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// 3. Create new user
exports.postusersAccount = async (req, res) => {
  const { keys, name, username, password, bophan, phanquyen, locker, chinhanh, code_staff, chucvu, date, imgAvatar, batchUpload, records } = req.body;
  const collection = await getDBConnection();

  if (batchUpload) {
    if (!Array.isArray(records)) return res.status(400).json({ success: false, message: "Dữ liệu records không hợp lệ" });

    const bulkOpsMongo = [];
    const bulkOpsSQL = [];
    const skippedRecords = [];
    const usernames = records.map(r => r.username);
    const keysList = records.map(r => r.keys);
    const existingUsers = await collection.find({ $or: [{ username: { $in: usernames } }, { keys: { $in: keysList } }] }).toArray();
    const existingUserMap = new Map(existingUsers.map(u => [u.username, true]).concat(existingUsers.map(u => [u.keys, true])));

    for (const newUser of records) {
      if (existingUserMap.has(newUser.username) || existingUserMap.has(newUser.keys)) {
        skippedRecords.push(newUser);
        continue;
      }

      // Format date to ISO string
      let isoDate;
      let formattedDateSQL = null;
      try {
        if (newUser.date) {
          // If date is in DD-MM-YYYY HH:mm:ss format
          if (moment(newUser.date, 'DD-MM-YYYY HH:mm:ss', true).isValid()) {
            isoDate = moment(newUser.date, 'DD-MM-YYYY HH:mm:ss').toISOString();
            formattedDateSQL = newUser.date;
          } else {
            // If date is in another format, try to parse it
            const parsedDate = moment(newUser.date);
            if(parsedDate.isValid()){
              isoDate = parsedDate.toISOString();
              formattedDateSQL = parsedDate.format('DD-MM-YYYY HH:mm:ss');
            } else {
               isoDate = new Date().toISOString();
               formattedDateSQL = moment().format('DD-MM-YYYY HH:mm:ss');
            }
          }
        } else {
           isoDate = new Date().toISOString();
           formattedDateSQL = moment().format('DD-MM-YYYY HH:mm:ss');
        }
      } catch (error) {
        console.error('Error parsing date for batch upload:', error);
        isoDate = new Date().toISOString();
        formattedDateSQL = moment().format('DD-MM-YYYY HH:mm:ss');
      }

      const userKeysGenerated = newUser.keys || uuidv4();

      bulkOpsMongo.push({
        insertOne: {
          document: {
            keys: userKeysGenerated,
            name: newUser.name,
            username: newUser.username,
            password: newUser.password,
            bophan: newUser.bophan || '',
            phanquyen: newUser.phanquyen || false,
            locker: newUser.locker !== undefined ? newUser.locker : false,
            chinhanh: newUser.chinhanh || '',
            code_staff: newUser.code_staff || '',
            chucvu: newUser.chucvu || '',
            date: isoDate,
            imgAvatar: newUser.imgAvatar || null,
            imgBackground: null,
            DataChecklist: [],
            LoginHistory: [],
            faceID: newUser.faceID || null // Add faceID
          }
        }
      });

      // Prepare SQL insert
      bulkOpsSQL.push({
          query: `INSERT INTO databaseAccount (keys, username, password, bophan, phanquyen, name, imgAvatar, locker, chinhanh, code_staff, chucvu, date, faceID)
                  VALUES (@keys, @username, @password, @bophan, @phanquyen, @name, @imgAvatar, @locker, @chinhanh, @code_staff, @chucvu, @date, @faceID)`,
          params: {
              keys: userKeysGenerated,
              username: newUser.username,
              password: newUser.password,
              bophan: newUser.bophan || '',
              phanquyen: newUser.phanquyen || false,
              locker: newUser.locker !== undefined ? (newUser.locker ? 1 : 0) : 0, // Convert boolean to bit (1 or 0)
              name: newUser.name,
              imgAvatar: newUser.imgAvatar || null,
              chinhanh: newUser.chinhanh || '',
              code_staff: newUser.code_staff || '',
              chucvu: newUser.chucvu || '',
              date: formattedDateSQL, // Use formatted string for SQL
              faceID: newUser.faceID || null
          }
      });
    }

    if (bulkOpsMongo.length > 0) await collection.bulkWrite(bulkOpsMongo);

    // Execute SQL bulk inserts
    if (bulkOpsSQL.length > 0) {
        for (const op of bulkOpsSQL) {
            await executeSQLQuery(op.query, op.params);
        }
    }

    const processedRecords = records.filter(r => !skippedRecords.includes(r));

    dataCache.clear();
    return res.json({ success: true, processedRecords, skippedRecords: skippedRecords.length });
  }

  if (!username || !name || !password) return res.status(400).json({ success: false, message: 'Username, name, and password are required' });

  try {
    const userKeysGenerated = keys || uuidv4();
    const existingUser = await collection.findOne({ $or: [{ keys: userKeysGenerated }, { username }] });
    if (existingUser) return res.status(200).json({ success: true, message: 'User already exists', keys: userKeysGenerated });

    // Format date
    let isoDate;
    let formattedDateSQL = null;
    try {
      if (date) {
        // If date is in DD-MM-YYYY HH:mm:ss format
        if (moment(date, 'DD-MM-YYYY HH:mm:ss', true).isValid()) {
          isoDate = moment(date, 'DD-MM-YYYY HH:mm:ss').toISOString();
          formattedDateSQL = date;
        } else {
          // If date is in another format, try to parse it
          const parsedDate = moment(date);
          if(parsedDate.isValid()){
             isoDate = parsedDate.toISOString();
             formattedDateSQL = parsedDate.format('DD-MM-YYYY HH:mm:ss');
          } else {
             isoDate = new Date().toISOString();
             formattedDateSQL = moment().format('DD-MM-YYYY HH:mm:ss');
          }
        }
      } else {
        isoDate = new Date().toISOString();
        formattedDateSQL = moment().format('DD-MM-YYYY HH:mm:ss');
      }
    } catch (error) {
      console.error('Error parsing date for single user:', error);
      isoDate = new Date().toISOString();
      formattedDateSQL = moment().format('DD-MM-YYYY HH:mm:ss');
    }

    const userData = {
      keys: userKeysGenerated,
      name,
      username,
      password,
      bophan: bophan || '',
      phanquyen: phanquyen || false,
      locker: locker !== undefined ? locker : false,
      chinhanh: chinhanh || '',
      code_staff: code_staff || '',
      chucvu: chucvu || '',
      date: isoDate,
      imgAvatar: imgAvatar || null,
      imgBackground: null,
      DataChecklist: [],
      LoginHistory: [],
      faceID: null // Add faceID
    };

    await collection.insertOne(userData);

    // Insert into SQL
    const sqlQuery = `INSERT INTO databaseAccount (keys, username, password, bophan, phanquyen, name, imgAvatar, locker, chinhanh, code_staff, chucvu, date, faceID)
                      VALUES (@keys, @username, @password, @bophan, @phanquyen, @name, @imgAvatar, @locker, @chinhanh, @code_staff, @chucvu, @date, @faceID)`;
    const sqlParams = {
        keys: userKeysGenerated,
        username,
        password,
        bophan: bophan || '',
        phanquyen: phanquyen || false,
        locker: locker !== undefined ? (locker ? 1 : 0) : 0, // Convert boolean to bit (1 or 0)
        name,
        imgAvatar: imgAvatar || null,
        chinhanh: chinhanh || '',
        code_staff: code_staff || '',
        chucvu: chucvu || '',
        date: formattedDateSQL, // Use formatted string for SQL
        faceID: null
    };
    await executeSQLQuery(sqlQuery, sqlParams);

    dataCache.clear();
    res.json({ success: true, keys: userKeysGenerated });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// 4. Update user
exports.putusersAccount = async (req, res) => {
  const { password, username, name, bophan, phanquyen, locker, chinhanh, code_staff, chucvu, imgAvatar, email, phone, emailVerified, phoneVerified, showEmail, showPhone, imgBackground, faceID } = req.body;
  const { keys } = req.params;

  try {
    const collection = await getDBConnection();
    const existingUser = await collection.findOne({ keys });
    if (!existingUser) return res.status(404).json({ success: false, message: 'User not found' });

    const updateFields = Object.fromEntries(
      Object.entries({ password, username, name, bophan, phanquyen, locker, chinhanh, code_staff, chucvu, imgAvatar, email, phone, emailVerified, phoneVerified, showEmail, showPhone, imgBackground, faceID })
        .filter(([_, value]) => value !== undefined)
    );

    const result = await collection.updateOne({ keys }, { $set: updateFields });

    // Update SQL
    if (Object.keys(updateFields).length > 0) {
      try {
        // Kiểm tra xem user có tồn tại trong SQL không
        const checkQuery = 'SELECT COUNT(*) as count FROM databaseAccount WHERE keys = @keys';
        const checkResult = await executeSQLQuery(checkQuery, { keys });
        const userExists = checkResult.recordset[0].count > 0;

        if (userExists) {
          // Nếu user tồn tại, thực hiện update
          let sqlQuery = 'UPDATE databaseAccount SET';
          const sqlParams = { keys };
          const updates = [];

          for (const field in updateFields) {
            let sqlColumnName = field;
            let sqlValue = updateFields[field];

            if (field === 'locker') {
              sqlValue = updateFields[field] ? 1 : 0;
            }
            if (field === 'phanquyen') {
              sqlValue = updateFields[field] ? 1 : 0;
            }
            if (field === 'date') continue;

            updates.push(`${sqlColumnName} = @${sqlColumnName}`);
            sqlParams[sqlColumnName] = sqlValue;
          }

          if (updates.length > 0) {
            sqlQuery += ' ' + updates.join(', ');
            sqlQuery += ' WHERE keys = @keys';
            await executeSQLQuery(sqlQuery, sqlParams);
          }
        } else {
          // Nếu user không tồn tại, thực hiện insert
          const insertFields = Object.keys(updateFields).filter(field => field !== 'date');
          const insertValues = insertFields.map(field => `@${field}`).join(', ');
          const insertColumns = insertFields.join(', ');
          
          const sqlQuery = `INSERT INTO databaseAccount (keys, ${insertColumns}) VALUES (@keys, ${insertValues})`;
          const sqlParams = { keys };
          
          for (const field of insertFields) {
            let value = updateFields[field];
            if (field === 'locker') {
              value = value ? 1 : 0;
            }
            if (field === 'phanquyen') {
              value = value ? 1 : 0;
            }
            sqlParams[field] = value;
          }
          
          await executeSQLQuery(sqlQuery, sqlParams);
        }
      } catch (sqlError) {
        console.error('SQL operation error:', sqlError);
        // Tiếp tục xử lý vì đã cập nhật thành công trên MongoDB
      }
    }

    if (result.modifiedCount === 0 && Object.keys(updateFields).length === 0) return res.status(400).json({ success: false, message: 'No changes applied' });

    invalidateCacheForUser(keys);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// 5. Delete user
exports.deleteusersAccount = async (req, res) => {
  const { keys } = req.params;
  try {
    const checklistCollection = await getDBConnection();
    const detailsCollection = await connectDB('CHECKLIST_DETAILS');

    const user = await checklistCollection.findOne({ keys });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.DataChecklist?.length > 0) {
      const checklistIds = user.DataChecklist.map(doc => doc.id);
      await detailsCollection.deleteMany({ checklistId: { $in: checklistIds } });
    }

    await checklistCollection.deleteOne({ keys });

    // Delete from SQL - Thêm xử lý lỗi
    try {
      const sqlQuery = 'DELETE FROM databaseAccount WHERE keys = @keys';
      await executeSQLQuery(sqlQuery, { keys });
    } catch (sqlError) {
      console.log('SQL delete error (non-critical):', sqlError);
      // Tiếp tục xử lý vì đã xóa thành công trên MongoDB
    }

    invalidateCacheForUser(keys);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// 6. Delete multiple users
exports.deleteMultipleUsers = async (req, res) => {
  const { keysArray } = req.body;
  if (!Array.isArray(keysArray) || keysArray.length === 0) return res.status(400).json({ success: false, message: 'No user keys provided' });

  try {
    const checklistCollection = await getDBConnection();
    const detailsCollection = await connectDB('CHECKLIST_DETAILS');

    const usersToDelete = await checklistCollection.find({ keys: { $in: keysArray } }).toArray();
    if (usersToDelete.length === 0) return res.status(404).json({ success: false, message: 'No users found to delete' });

    const checklistIds = usersToDelete.flatMap(user => user.DataChecklist?.map(doc => doc.id) || []);
    if (checklistIds.length > 0) await detailsCollection.deleteMany({ checklistId: { $in: checklistIds } });

    const result = await checklistCollection.deleteMany({ keys: { $in: keysArray } });

    // Delete from SQL - Thêm xử lý lỗi
    if (result.deletedCount > 0) {
      try {
        const sqlQuery = 'DELETE FROM databaseAccount WHERE keys IN (' + keysArray.map(key => `@key_${key.replace(/[^a-zA-Z0-9]/g, '')}`).join(', ') + ')';
        const sqlParams = {};
        keysArray.forEach(key => { sqlParams[`key_${key.replace(/[^a-zA-Z0-9]/g, '')}`] = key; });
        await executeSQLQuery(sqlQuery, sqlParams);
      } catch (sqlError) {
        console.log('SQL delete error (non-critical):', sqlError);
        // Tiếp tục xử lý vì đã xóa thành công trên MongoDB
      }
    }

    if (result.deletedCount > 0) {
      keysArray.forEach(invalidateCacheForUser);
      res.json({ success: true, deletedCount: result.deletedCount });
    } else {
      res.status(400).json({ success: false, message: 'No users were deleted' });
    }
  } catch (error) {
    console.error('Error deleting multiple users:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Additional functions
exports.putImage = async (req, res) => {
  const { keys } = req.params;
  const { imgAvatar } = req.body;
  if (!imgAvatar) return res.status(400).json({ success: false, message: 'Image URL is required' });

  try {
    const collection = await getDBConnection();
    const result = await collection.updateOne({ keys }, { $set: { imgAvatar } });

    // Update SQL
    const sqlQuery = 'UPDATE databaseAccount SET imgAvatar = @imgAvatar WHERE keys = @keys';
    await executeSQLQuery(sqlQuery, { imgAvatar, keys });

    if (result.modifiedCount === 0) return res.status(404).json({ success: false, message: 'User not found' });

    invalidateCacheForUser(keys);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating image:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

exports.putBackgroundImage = async (req, res) => {
  const { keys } = req.params;
  const { imgBackground } = req.body;
  if (!imgBackground) return res.status(400).json({ success: false, message: 'Background image URL is required' });

  try {
    const collection = await getDBConnection();
    const user = await collection.findOne({ keys });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await collection.updateOne({ keys }, { $set: { imgBackground } });

    // Note: imgBackground is not in the provided SQL schema. Skipping SQL update for this field.

    invalidateCacheForUser(keys);
    res.json({ success: true, message: 'Background image updated successfully' });
  } catch (error) {
    console.error('Error updating background image:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

exports.updateFaceID = async (req, res) => {
  const { faceID } = req.body;
  const { keys } = req.params;
  if (!faceID) return res.status(400).json({ success: false, message: 'Face ID is required' });

  try {
    const collection = await getDBConnection();
    const result = await collection.updateOne({ keys }, { $set: { faceID } });

    // Update SQL
    const sqlQuery = 'UPDATE databaseAccount SET faceID = @faceID WHERE keys = @keys';
    await executeSQLQuery(sqlQuery, { faceID, keys });

    if (result.modifiedCount === 0) return res.status(404).json({ success: false, message: 'User not found' });

    invalidateCacheForUser(keys);
    res.json({ success: true, message: 'Face ID updated successfully' });
  } catch (error) {
    console.error('Error updating Face ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

exports.searchUsers = async (req, res) => {
  const { search, keys, by } = req.query;
  const filters = { search, keys, by };
  const cacheKey = getCacheKey(1, 'all', filters);
  const cachedData = getCache(cacheKey);
  if (cachedData) return res.json(cachedData);

  try {
    const collection = await getDBConnection();
    const projection = { password: 0, DataChecklist: 0, LoginHistory: 0, phanquyen: 0, date: 0 };
    let query = {};

    if (by) {
      const fields = by.split(',').map(field => field.trim());
      if (search) {
        query.$or = fields.map(field => ({
          [field]: { $regex: search, $options: 'i' }
        })).filter(Boolean);
      }
    } else if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { bophan: { $regex: search, $options: 'i' } },
        { chinhanh: { $regex: search, $options: 'i' } },
        { keys: { $regex: search, $options: 'i' } },
        { code_staff: { $regex: search, $options: 'i' } },
      ];
    }

    if (keys && !by) query.keys = { $in: Array.isArray(keys) ? keys : keys.split(',') };

    const data = await collection
      .find(query, { projection })
      .sort({ _id: -1 }) // Sort in descending order by _id
      .limit(1000)
      .toArray();
    const response = { success: true, data };
    setCache(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

exports.getDepartmentRelatedUsers = async (req, res) => {
  try {
    const { chinhanh, bophan, currentUserKeys, page = 1, limit = 6 } = req.query;
    if (!chinhanh && !bophan) return res.status(400).json({ message: 'Department or branch is required' });

    const collection = await getDBConnection();
    const query = {
      keys: { $ne: currentUserKeys },
      $or: [
        { chinhanh: { $regex: decodeURIComponent(chinhanh || ''), $options: 'i' } },
        { bophan: { $regex: decodeURIComponent(bophan || ''), $options: 'i' } }
      ]
    };

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    const total = await collection.countDocuments(query);
    const users = await collection.find(query).sort({ date: -1 }).skip(skip).limit(parsedLimit).toArray();

    const filteredUsers = users.map(user => ({
      name: user.name,
      keys: user.keys,
      imgAvatar: user.imgAvatar,
      chinhanh: user.chinhanh,
      bophan: user.bophan,
      chucvu: user.chucvu,
      date: user.date,
      imgBackground: user.imgBackground
    }));

    res.status(200).json({ users: filteredUsers, total });
  } catch (error) {
    console.error('Error fetching department related users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUserShortcuts = async (req, res) => {
  try {
    const { keys } = req.query;
    if (!keys) return res.status(400).json({ success: false, message: 'User keys are required' });

    const loitatCollection = await connectDB('LOITAT');
    const userShortcutsData = await loitatCollection.find({ userKeys: keys }).toArray();

    let shortcuts = userShortcutsData[0]?.shortcuts || [];
    shortcuts = shortcuts.map(shortcut => ({
      ...shortcut,
      createdAt: shortcut.createdAt || userShortcutsData[0]?.createdAt || new Date().toISOString()
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, shortcuts, userKeys: keys });
  } catch (error) {
    console.error('Error fetching shortcuts:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

exports.saveUserShortcuts = async (req, res) => {
  try {
    const { userKeys, shortcuts } = req.body;
    if (!userKeys || !Array.isArray(shortcuts)) return res.status(400).json({ success: false, message: 'User keys and shortcuts array are required' });

    const requiredFields = ['key', 'iconName', 'text', 'path'];
    const invalidShortcuts = shortcuts.filter(s => !requiredFields.every(field => s[field]));
    if (invalidShortcuts.length > 0) return res.status(400).json({ success: false, message: 'Invalid shortcuts format', invalidShortcuts });

    const checklistCollection = await getDBConnection();
    if (!await checklistCollection.findOne({ keys: userKeys })) return res.status(404).json({ success: false, message: 'User not found' });

    const loitatCollection = await connectDB('LOITAT');
    const existingData = await loitatCollection.findOne({ userKeys });
    const existingTimestamps = new Map((existingData?.shortcuts || []).map(s => [s.key, s.createdAt]));
    const now = new Date().toISOString();

    const shortcutsWithTimestamps = shortcuts.map(shortcut => ({
      ...shortcut,
      createdAt: existingTimestamps.get(shortcut.key) || now
    }));

    const domainFromHeader = req.headers.origin || req.headers.referer || '';
    const currentDomain = domainFromHeader ? new URL(domainFromHeader).host : '';
    const invalidPaths = shortcutsWithTimestamps.filter(s => s.path.startsWith('http') && new URL(s.path).host !== currentDomain);
    if (invalidPaths.length > 0) return res.status(400).json({ success: false, message: 'Invalid shortcut paths', invalidPaths });

    if (existingData) {
      await loitatCollection.updateOne({ userKeys }, { $set: { shortcuts: shortcutsWithTimestamps, updatedAt: new Date() } });
    } else {
      await loitatCollection.insertOne({ userKeys, shortcuts: shortcutsWithTimestamps, createdAt: new Date(), updatedAt: new Date() });
    }

    res.json({ success: true, message: 'Shortcuts saved successfully' });
  } catch (error) {
    console.error('Error saving shortcuts:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};