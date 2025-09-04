// TAOCONG.js (Backend)
const { connectDB } = require('../MongoDB/database');
const { ObjectId } = require('mongodb');
const moment = require('moment');

// Cache để lưu trữ dữ liệu phân trang
let dataCache = {
  pages: {},
  timestamp: null,
  ttl: 5 * 60 * 1000 // 5 phút
};

const getCacheKey = (page, limit) => {
  return `${page}_${limit}`;
};

const isCacheValid = (cacheKey) => {
  return (
    dataCache.pages[cacheKey] &&
    dataCache.timestamp &&
    Date.now() - dataCache.timestamp < dataCache.ttl
  );
};

const setCache = (cacheKey, data) => {
  dataCache.pages[cacheKey] = data;
  dataCache.timestamp = Date.now();
};

const clearCache = () => {
  dataCache = {
    pages: {},
    timestamp: null,
    ttl: 5 * 60 * 1000
  };
};

const postCreateTimekeeping = async (req, res) => {
  try {
    const timekeepingCollection = await connectDB('TIMEKEEPING');
    const data = req.body;
    const currentDate = moment().format('DD-MM-YYYY');

    // Chuẩn bị dữ liệu để kiểm tra và insert
    const ngay = data.ngay || currentDate;
    const gioVao = data.gioVao; // Định dạng HH:mm
    const gioRa = data.gioRa;   // Định dạng HH:mm

    // Chuyển đổi giờ thành phút để so sánh
    const [gioVaoHour, gioVaoMinute] = gioVao.split(':').map(Number);
    const [gioRaHour, gioRaMinute] = gioRa.split(':').map(Number);
    const gioVaoInMinutes = gioVaoHour * 60 + gioVaoMinute;
    const gioRaInMinutes = gioRaHour * 60 + gioRaMinute;

    // Kiểm tra xem có bản ghi nào trùng khoảng thời gian không
    const existingRecords = await timekeepingCollection.find({
      maNhanVien: data.maNhanVien,
      ngay: ngay,
    }).toArray();

    for (const record of existingRecords) {
      const [recordGioVaoHour, recordGioVaoMinute] = record.gioVao.split(':').map(Number);
      const [recordGioRaHour, recordGioRaMinute] = record.gioRa.split(':').map(Number);
      const recordGioVaoInMinutes = recordGioVaoHour * 60 + recordGioVaoMinute;
      const recordGioRaInMinutes = recordGioRaHour * 60 + recordGioRaMinute;

      // Kiểm tra xem khoảng thời gian mới có giao với khoảng thời gian cũ không
      const isOverlapping =
        (gioVaoInMinutes < recordGioRaInMinutes && gioRaInMinutes > recordGioVaoInMinutes);

      if (isOverlapping) {
        return res.status(400).json({
          message: 'Khoảng thời gian chấm công bị trùng với bản ghi hiện có',
          data: record,
        });
      }
    }

    // Chuẩn bị dữ liệu để insert
    const newTimekeeping = {
      maNhanVien: data.maNhanVien,
      phongBan: data.phongBan || '',
      chucVu: data.chucVu || '',
      ngay: ngay,
      gioVao: gioVao,
      gioRa: gioRa,
      tongGio: data.tongGio,
      loaiCong: data.loaiCong,
      ghiChu: data.ghiChu || '',
      ngayTao: data.ngayTao || currentDate,
      createdAt: new Date(),
      trangThai: 'Chờ duyệt',
    };

    // Insert bản ghi mới
    const result = await timekeepingCollection.insertOne(newTimekeeping);

    res.status(201).json({
      message: 'Tạo chấm công mới thành công',
      data: {
        _id: result.insertedId,
        ...newTimekeeping,
      },
    });
  } catch (error) {
    console.error('Error in postCreateTimekeeping:', error);
    res.status(500).json({
      message: 'Lỗi server khi tạo chấm công mới',
      error: error.message,
    });
  }
};

const postTimekeeping = async (req, res) => {
  try {
    const timekeepingCollection = await connectDB('TIMEKEEPING');
    const data = req.body;
    const currentDate = moment().format('DD-MM-YYYY');

    const existingRecord = await timekeepingCollection.findOne({
      maNhanVien: data.maNhanVien,
      ngay: currentDate,
    });

    if (existingRecord) {
      const updateData = {
        ...existingRecord,
        IPNhaHang: data.IPNhaHang || existingRecord.IPNhaHang,
        IPGoc: data.IPGoc || existingRecord.IPGoc,
        location: data.location || existingRecord.location,
        GioCham: data.GioCham || existingRecord.GioCham,
        GioOut: data.GioOut || existingRecord.GioOut,
        CaLamViec: data.CaLamViec || existingRecord.CaLamViec,
        LychoChamCong: data.LychoChamCong || existingRecord.LychoChamCong,
        GhiChu: data.GhiChu || existingRecord.GhiChu,
        Status: data.Status || existingRecord.Status,
        Restaurants: data.Restaurants || existingRecord.Restaurants, // Thêm trường Restaurants
        ChamTre: data.ChamTre || existingRecord.ChamTre,
        updatedAt: new Date(),
      };

      const result = await timekeepingCollection.updateOne(
        { _id: existingRecord._id },
        { $set: updateData }
      );

      if (result.modifiedCount === 0) {
        return res.status(400).json({ message: 'Không có thay đổi nào được thực hiện' });
      }

      res.status(200).json({
        message: 'Cập nhật chấm công thành công',
        data: { _id: existingRecord._id, ...updateData },
      });
    } else {
      const result = await timekeepingCollection.insertOne({
        ...data,
        ngay: currentDate,
        createdAt: new Date(),
        trangThai: data.trangThai || 'Chờ duyệt',
        Restaurants: data.Restaurants, // Thêm trường Restaurants khi tạo mới
        ChamTre: data.ChamTre,
      });

      res.status(201).json({
        message: 'Thêm chấm công thành công',
        data: { _id: result.insertedId, ...data },
      });
    }
  } catch (error) {
    console.error('Error in postTimekeeping:', error);
    res.status(500).json({ message: 'Lỗi server khi thêm/cập nhật chấm công' });
  }
};

const getAllTimekeeping = async (req, res) => {
  try {
    const timekeepingCollection = await connectDB('TIMEKEEPING');
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');

    // Lấy tham số phân trang từ query
    const page = parseInt(req.query.page) || 1; // Trang hiện tại, mặc định là 1
    const limit = parseInt(req.query.limit) || 7; // Số bản ghi mỗi trang, mặc định là 7
    const skip = (page - 1) * limit; // Số bản ghi cần bỏ qua

    // Tổng số bản ghi để tính tổng số trang
    const totalRecords = await timekeepingCollection.countDocuments();

    const timekeepingData = await timekeepingCollection
      .aggregate([
        {
          $lookup: {
            from: 'CHECKLIST_DATABASE',
            localField: 'maNhanVien',
            foreignField: 'keys',
            as: 'userInfo',
          },
        },
        {
          $unwind: {
            path: '$userInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            maNhanVien: 1,
            ngay: 1,
            gioVao: 1,
            gioRa: 1,
            tongGio: 1,
            loaiCong: 1,
            trangThai: 1,
            phongBan: 1,
            ghiChu: 1,
            createdAt: 1,
            updatedAt: 1,
            tenNhanVien: '$userInfo.name',
            code_staff: '$userInfo.code_staff',
            bophan: '$userInfo.bophan',
            imgAvatar: '$userInfo.imgAvatar',
            imgBackground: '$userInfo.imgBackground',
            locker: '$userInfo.locker',
            chucvu: '$userInfo.chucvu',
            email: '$userInfo.email',
            chinhanh: '$userInfo.chinhanh',
            username: '$userInfo.username',
            IPNhaHang: 1,
            IPGoc: 1,
            location: 1,
            GioCham: 1,
            GioOut: 1,
            CaLamViec: 1,
            LychoChamCong: 1,
            GhiChu: 1,
            Status: 1,
            Restaurants: 1,
            ChamTre: 1,
          },
        },
        { $sort: { createdAt: -1 } }, // Sắp xếp theo thời gian tạo, mới nhất lên đầu tiên
        { $skip: skip }, // Bỏ qua các bản ghi trước đó
        { $limit: limit }, // Giới hạn số bản ghi trả về
      ])
      .toArray();

    res.status(200).json({
      data: timekeepingData,
      pagination: {
        current: page,
        pageSize: limit,
        total: totalRecords,
      },
    });
  } catch (error) {
    console.error('Error in getAllTimekeeping:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách chấm công' });
  }
};

const getUserTimekeeping = async (req, res) => {
  try {
    const timekeepingCollection = await connectDB('TIMEKEEPING');
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const currentDate = moment().format('DD-MM-YYYY'); // Ngày hiện tại
    const maNhanVien = req.query.maNhanVien;

    if (!maNhanVien) {
      return res.status(400).json({ message: 'maNhanVien là bắt buộc' });
    }

    const timekeepingData = await timekeepingCollection
      .aggregate([
        {
          $match: {
            maNhanVien: maNhanVien,
            ngay: currentDate, // Chỉ lấy dữ liệu của ngày hôm nay
            Status: { $ne: 'checkout' }, // Loại bỏ các ca đã checkout
          },
        },
        {
          $lookup: {
            from: 'CHECKLIST_DATABASE',
            localField: 'maNhanVien',
            foreignField: 'keys',
            as: 'userInfo',
          },
        },
        {
          $unwind: {
            path: '$userInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            maNhanVien: 1,
            ngay: 1,
            gioVao: 1,
            gioRa: 1,
            loaiCong: 1,
            trangThai: 1,
            phongBan: 1,
            ghiChu: 1,
            createdAt: 1,
            updatedAt: 1,
            tenNhanVien: '$userInfo.name',
            code_staff: '$userInfo.code_staff',
            bophan: '$userInfo.bophan',
            imgAvatar: '$userInfo.imgAvatar',
            Status: 1,
            CaLamViec: 1,
            GioCham: 1,
            GioOut: 1,
            Restaurants: 1,
            ChamTre: 1,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ])
      .toArray();

    if (timekeepingData.length === 0) {
      return res.status(200).json({ message: 'Bạn không có ca làm việc hôm nay', data: [] });
    }

    res.status(200).json(timekeepingData);
  } catch (error) {
    console.error('Error in getUserTimekeeping:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách ca làm việc' });
  }
};

const updateTimekeeping = async (req, res) => {
  try {
    const timekeepingCollection = await connectDB('TIMEKEEPING');
    const { id } = req.params;
    const data = req.body;

    const existingRecord = await timekeepingCollection.findOne({ 
      _id: new ObjectId(id)
    });

    if (!existingRecord) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi chấm công' });
    }

    const duplicateCheck = await timekeepingCollection.findOne({
      maNhanVien: existingRecord.maNhanVien,
      ngay: data.ngay || existingRecord.ngay,
      CaLamViec: data.CaLamViec || existingRecord.CaLamViec,
      _id: { $ne: new ObjectId(id) }
    });

    const updateData = {
      ...existingRecord,
      IPNhaHang: data.IPNhaHang || existingRecord.IPNhaHang,
      IPGoc: data.IPGoc || existingRecord.IPGoc,
      location: data.location || existingRecord.location,
      GioCham: data.GioCham || existingRecord.GioCham,
      GioOut: data.GioOut || existingRecord.GioOut,
      CaLamViec: data.CaLamViec || existingRecord.CaLamViec,
      LychoChamCong: data.LychoChamCong || existingRecord.LychoChamCong,
      GhiChu: data.GhiChu || existingRecord.GhiChu,
      Status: data.Status || existingRecord.Status,
      Restaurants: data.Restaurants || existingRecord.Restaurants, // Thêm trường Restaurants
      updatedAt: new Date(),
      ChamTre: data.ChamTre || existingRecord.ChamTre
    };

    const result = await timekeepingCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: 'Không có thay đổi nào được thực hiện' });
    }

    res.status(200).json({
      message: 'Cập nhật chấm công thành công',
      data: updateData,
      hideShiftSelection: data.Status === 'checkout' || !!duplicateCheck
    });
  } catch (error) {
    console.error('Error in updateTimekeeping:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật chấm công' });
  }
};

const approveTimekeeping = async (req, res) => {
  try {
    const timekeepingCollection = await connectDB('TIMEKEEPING');
    const { id } = req.params;
    const { trangThai, ghiChu } = req.body; // Có thể thêm ghi chú khi phê duyệt

    const existingRecord = await timekeepingCollection.findOne({ 
      _id: new ObjectId(id)
    });

    if (!existingRecord) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi chấm công' });
    }

    const updateData = {
      ...existingRecord,
      trangThai: trangThai || existingRecord.trangThai,
      ghiChu: ghiChu || existingRecord.ghiChu,
      updatedAt: new Date(),
    };

    const result = await timekeepingCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: 'Không có thay đổi nào được thực hiện' });
    }

    res.status(200).json({
      message: 'Phê duyệt chấm công thành công',
      data: updateData,
    });
  } catch (error) {
    console.error('Error in approveTimekeeping:', error);
    res.status(500).json({ message: 'Lỗi server khi phê duyệt chấm công' });
  }
};

const getUserTimekeepingHistory = async (req, res) => {
  try {
    const timekeepingCollection = await connectDB('TIMEKEEPING');
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const { maNhanVien, startDate, endDate, page, pageSize } = req.query;

    if (!maNhanVien) {
      return res.status(400).json({ message: 'maNhanVien là bắt buộc' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate và endDate là bắt buộc' });
    }

    // Pagination parameters
    const currentPage = parseInt(page) || 1;
    const limit = parseInt(pageSize) || 7; // Default to 7 records per load
    const skip = (currentPage - 1) * limit;

    // Total records for pagination
    const totalRecords = await timekeepingCollection.countDocuments({
      maNhanVien: maNhanVien,
      ngay: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    const timekeepingData = await timekeepingCollection
      .aggregate([
        {
          $match: {
            maNhanVien: maNhanVien,
            ngay: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $lookup: {
            from: 'CHECKLIST_DATABASE',
            localField: 'maNhanVien',
            foreignField: 'keys',
            as: 'userInfo',
          },
        },
        {
          $unwind: {
            path: '$userInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            maNhanVien: 1,
            ngay: 1,
            gioVao: 1,
            gioRa: 1,
            tongGio: 1,
            trangThai: 1,
            phongBan: 1,
            ghiChu: 1,
            createdAt: 1,
            Status: 1,
            updatedAt: 1,
            tenNhanVien: '$userInfo.name',
            bophan: '$userInfo.bophan',
            chinhanh: '$userInfo.chinhanh',
            chucvu: '$userInfo.chucvu',
          },
        },
        { $sort: { createdAt: -1 } }, // Sắp xếp theo thời gian tạo, mới nhất lên đầu tiên
        { $skip: skip },
        { $limit: limit },
      ])
      .toArray();

    if (timekeepingData.length === 0) {
      return res.status(200).json({ 
        message: 'Không có dữ liệu chấm công trong khoảng thời gian này', 
        data: [],
        pagination: {
          current: currentPage,
          pageSize: limit,
          total: totalRecords,
          pageSizeOptions: ["5", "10", "20", "50", "100"]
        }
      });
    }

    res.status(200).json({
      message: 'Lấy lịch sử chấm công thành công',
      data: timekeepingData,
      pagination: {
        current: currentPage,
        pageSize: limit,
        total: totalRecords,
        pageSizeOptions: ["5", "10", "20", "50", "100"]
      },
    });
  } catch (error) {
    console.error('Error in getUserTimekeepingHistory:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy lịch sử chấm công', error: error.message });
  }
};

const deleteTimekeeping = async (req, res) => {
  try {
    const timekeepingCollection = await connectDB('TIMEKEEPING');
    const { id } = req.params;

    // Kiểm tra xem bản ghi có tồn tại không
    const existingRecord = await timekeepingCollection.findOne({ 
      _id: new ObjectId(id)
    });

    if (!existingRecord) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi chấm công' });
    }

    // Xóa bản ghi
    const result = await timekeepingCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(400).json({ message: 'Không thể xóa bản ghi chấm công' });
    }

    res.status(200).json({
      message: 'Xóa chấm công thành công',
      data: { _id: id }
    });
  } catch (error) {
    console.error('Error in deleteTimekeeping:', error);
    res.status(500).json({
      message: 'Lỗi server khi xóa chấm công',
      error: error.message
    });
  }
};

module.exports = { 
  postTimekeeping, 
  getAllTimekeeping, 
  updateTimekeeping, 
  getUserTimekeeping, 
  deleteTimekeeping,
  approveTimekeeping,
  postCreateTimekeeping,
  getUserTimekeepingHistory
};