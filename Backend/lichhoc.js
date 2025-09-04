const { connectDB } = require('./MongoDB/database');
const { ObjectId } = require('mongodb');
const moment = require('moment');

// Cache cho kết nối database
let dbConnection = null;
async function getDBConnection() {
  if (!dbConnection) {
    dbConnection = await connectDB('LICHHOC_DATABASE');
  }
  return dbConnection;
}

// Lấy tất cả lịch học
const getAllLichHoc = async (req, res) => {
  try {
    const collection = await getDBConnection();
    
    const lichHoc = await collection.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'giang_vien_id',
          foreignField: 'keys',
          as: 'giang_vien'
        }
      },
      {
        $unwind: {
          path: '$giang_vien',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          tieu_de: 1,
          mo_ta: 1,
          ngay_hoc: 1,
          gio_bat_dau: 1,
          gio_ket_thuc: 1,
          phong_hoc: 1,
          giang_vien_id: 1,
          giang_vien_name: '$giang_vien.hoten',
          so_luong_toi_da: 1,
          trang_thai: 1,
          ngay_tao: 1,
          ngay_cap_nhat: 1
        }
      },
      {
        $sort: {
          ngay_hoc: -1,
          gio_bat_dau: 1
        }
      }
    ]).toArray();

    res.json(lichHoc);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch học:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách lịch học' });
  }
};

// Thêm lịch học mới
const createLichHoc = async (req, res) => {
  const {
    tieu_de,
    mo_ta,
    ngay_hoc,
    gio_bat_dau,
    gio_ket_thuc,
    phong_hoc,
    giang_vien_id,
    so_luong_toi_da,
    trang_thai = 'active'
  } = req.body;

  try {
    const collection = await getDBConnection();

    const newLichHoc = {
      tieu_de,
      mo_ta,
      ngay_hoc: moment(ngay_hoc).toDate(),
      gio_bat_dau,
      gio_ket_thuc,
      phong_hoc,
      giang_vien_id,
      so_luong_toi_da: parseInt(so_luong_toi_da),
      trang_thai,
      ngay_tao: new Date(),
      ngay_cap_nhat: null
    };

    const result = await collection.insertOne(newLichHoc);
    
    if (!result.acknowledged) {
      throw new Error('Không thể tạo lịch học');
    }

    const createdLichHoc = await collection.findOne({ _id: result.insertedId });
    res.status(201).json(createdLichHoc);
  } catch (error) {
    console.error('Lỗi khi tạo lịch học:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi tạo lịch học' });
  }
};

// Cập nhật lịch học
const updateLichHoc = async (req, res) => {
  const { id } = req.params;
  const {
    tieu_de,
    mo_ta,
    ngay_hoc,
    gio_bat_dau,
    gio_ket_thuc,
    phong_hoc,
    giang_vien_id,
    so_luong_toi_da,
    trang_thai
  } = req.body;

  try {
    const collection = await getDBConnection();

    const updateData = {
      tieu_de,
      mo_ta,
      ngay_hoc: moment(ngay_hoc).toDate(),
      gio_bat_dau,
      gio_ket_thuc,
      phong_hoc,
      giang_vien_id,
      so_luong_toi_da: parseInt(so_luong_toi_da),
      trang_thai,
      ngay_cap_nhat: new Date()
    };

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ message: 'Không tìm thấy lịch học' });
    }

    res.json(result.value);
  } catch (error) {
    console.error('Lỗi khi cập nhật lịch học:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật lịch học' });
  }
};

// Xóa lịch học
const deleteLichHoc = async (req, res) => {
  const { id } = req.params;

  try {
    const collection = await getDBConnection();
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch học' });
    }

    res.json({ message: 'Xóa lịch học thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa lịch học:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa lịch học' });
  }
};

// Lấy chi tiết một lịch học
const getLichHocById = async (req, res) => {
  const { id } = req.params;

  try {
    const collection = await getDBConnection();

    const lichHoc = await collection.aggregate([
      {
        $match: { _id: new ObjectId(id) }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'giang_vien_id',
          foreignField: 'keys',
          as: 'giang_vien'
        }
      },
      {
        $unwind: {
          path: '$giang_vien',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          tieu_de: 1,
          mo_ta: 1,
          ngay_hoc: 1,
          gio_bat_dau: 1,
          gio_ket_thuc: 1,
          phong_hoc: 1,
          giang_vien_id: 1,
          giang_vien_name: '$giang_vien.hoten',
          so_luong_toi_da: 1,
          trang_thai: 1,
          ngay_tao: 1,
          ngay_cap_nhat: 1
        }
      }
    ]).toArray();

    if (!lichHoc[0]) {
      return res.status(404).json({ message: 'Không tìm thấy lịch học' });
    }

    res.json(lichHoc[0]);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết lịch học:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy chi tiết lịch học' });
  }
};

module.exports = {
  getAllLichHoc,
  createLichHoc,
  updateLichHoc,
  deleteLichHoc,
  getLichHocById
}; 