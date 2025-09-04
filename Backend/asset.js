const { connectDB } = require('./MongoDB/database');
const { ObjectId } = require('mongodb');
const dayjs = require('dayjs');

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  try {
    return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
  } catch {
    return false;
  }
};


// --- Asset Management ---
async function addAsset(req, res) {
  try {
    const assetsCollection = await connectDB('ASSETS');
    if (!assetsCollection) throw new Error('Database connection failed');
    const serialNumbers = req.body.serialNumbers || [];
    const newAsset = {
      ...req.body,
      serialNumbers: serialNumbers,
      assignedSerialNumbers: [],
      actualQuantity: serialNumbers.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await assetsCollection.insertOne(newAsset);
    res.status(201).json({ message: 'Thêm tài sản thành công', id: result.insertedId });
  } catch (error) {
    console.error('Error in addAsset:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi thêm tài sản', error: error.message });
  }
}

async function updateAsset(req, res) {
  try {
    const assetsCollection = await connectDB('ASSETS');
    if (!assetsCollection) throw new Error('Database connection failed');
    const assetId = req.params.id;

    if (!isValidObjectId(assetId)) {
      return res.status(400).json({ message: 'ID tài sản không hợp lệ' });
    }

    const { assignedTo, serialNumbers, assignedSerialNumbers = [] } = req.body;
    const currentAsset = await assetsCollection.findOne({ _id: new ObjectId(assetId) });
    if (!currentAsset) {
      return res.status(404).json({ message: 'Không tìm thấy tài sản' });
    }

    // Nếu không gửi serialNumbers, giữ nguyên danh sách hiện tại
    const updatedSerialNumbers = serialNumbers || currentAsset.serialNumbers;

    // Kiểm tra xem assignedSerialNumbers có hợp lệ không
    const updatedAssignedSerialNumbers = assignedSerialNumbers.map(sn => ({
      serialNumber: sn.serialNumber,
      assignedTo: sn.assignedTo || assignedTo || currentAsset.assignedTo,
      assignedAt: sn.assignedAt || new Date(),
    }));

    // Đảm bảo mọi serial trong assignedSerialNumbers đều thuộc serialNumbers
    for (const sn of updatedAssignedSerialNumbers) {
      if (!updatedSerialNumbers.includes(sn.serialNumber)) {
        return res.status(400).json({ message: `S/N ${sn.serialNumber} không tồn tại trong tài sản` });
      }
    }

    // Tính toán quantity: số lượng khả dụng = tổng serial - số serial đã cấp
    const updatedQuantity = updatedSerialNumbers.length - updatedAssignedSerialNumbers.length;

    const updatedAsset = {
      ...req.body,
      serialNumbers: updatedSerialNumbers,
      assignedSerialNumbers: updatedAssignedSerialNumbers,
      actualQuantity: updatedSerialNumbers.length,
      quantity: updatedQuantity >= 0 ? updatedQuantity : 0,
      updatedAt: new Date(),
    };

    const result = await assetsCollection.updateOne(
      { _id: new ObjectId(assetId) },
      { $set: updatedAsset }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài sản' });
    }

    res.status(200).json({ message: 'Cập nhật tài sản thành công', data: updatedAsset });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật tài sản', error: error.message });
  }
}

async function getAssets(req, res) {
  try {
    const assetsCollection = await connectDB('ASSETS');
    if (!assetsCollection) throw new Error('Database connection failed');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search;
    const category = req.query.category;
    const status = req.query.status;
    const minQuantity = req.query.minQuantity ? parseInt(req.query.minQuantity) : undefined;
    const maxQuantity = req.query.maxQuantity ? parseInt(req.query.maxQuantity) : undefined;

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { assetTag: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { serialNumbers: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) {
      const categoryArray = Array.isArray(category) ? category : category.split(',');
      query.category = { $in: categoryArray };
    }
    if (status) query.status = status;

    const assets = await assetsCollection
      .find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit === 0 ? undefined : limit)
      .toArray();

    const processedAssets = assets.map(asset => ({
      _id: asset._id,
      assetTag: asset.assetTag,
      name: asset.name,
      category: asset.category,
      location: asset.location,
      status: asset.status,
      assignedTo: asset.assignedTo || '',
      serialNumbers: asset.serialNumbers || [],
      assignedSerialNumbers: asset.assignedSerialNumbers || [],
      actualQuantity: asset.serialNumbers.length,
      quantity: asset.serialNumbers.length - (asset.assignedSerialNumbers?.length || 0),
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
      price: asset.price,
    })).filter(asset => {
      if (minQuantity !== undefined && asset.quantity < minQuantity) return false;
      if (maxQuantity !== undefined && asset.quantity > maxQuantity) return false;
      return true;
    });

    const totalAssets = await assetsCollection.countDocuments(query);

    res.status(200).json({
      data: processedAssets,
      total: totalAssets,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in getAssets:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách tài sản', error: error.message });
  }
}

async function deleteAsset(req, res) {
  try {
    const assetsCollection = await connectDB('ASSETS');
    if (!assetsCollection) throw new Error('Database connection failed');
    const assetId = req.params.id;

    if (!isValidObjectId(assetId)) {
      return res.status(400).json({ message: 'ID tài sản không hợp lệ' });
    }

    const result = await assetsCollection.deleteOne({ _id: new ObjectId(assetId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài sản' });
    }

    res.status(200).json({ message: 'Xóa tài sản thành công' });
  } catch (error) {
    console.error('Error in deleteAsset:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi xóa tài sản', error: error.message });
  }
}

// --- Warranty Tracking ---
async function getWarranties(req, res) {
  try {
    const warrantiesCollection = await connectDB('BAOHANH');
    if (!warrantiesCollection) throw new Error('Database connection failed');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search;

    let query = {};
    if (search) {
      query.$or = [
        { assetTag: { $regex: search, $options: 'i' } },
        { assetName: { $regex: search, $options: 'i' } },
        { warrantyProvider: { $regex: search, $options: 'i' } },
        { warrantyNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const totalWarranties = await warrantiesCollection.countDocuments(query);
    const warranties = await warrantiesCollection
      .find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    res.status(200).json({
      data: warranties,
      total: totalWarranties,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in getWarranties:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách bảo hành', error: error.message });
  }
}

async function addWarranty(req, res) {
  try {
    const warrantiesCollection = await connectDB('BAOHANH');
    if (!warrantiesCollection) throw new Error('Database connection failed');
    const newWarranty = {
      ...req.body,
      claimHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await warrantiesCollection.insertOne(newWarranty);
    res.status(201).json({ message: 'Thêm bảo hành thành công', id: result.insertedId });
  } catch (error) {
    console.error('Error in addWarranty:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi thêm bảo hành', error: error.message });
  }
}

async function updateWarranty(req, res) {
  try {
    const warrantiesCollection = await connectDB('BAOHANH');
    if (!warrantiesCollection) throw new Error('Database connection failed');
    const warrantyId = req.params.id;

    if (!isValidObjectId(warrantyId)) {
      return res.status(400).json({ message: 'ID bảo hành không hợp lệ' });
    }

    const existingWarranty = await warrantiesCollection.findOne({ _id: new ObjectId(warrantyId) });
    if (!existingWarranty) {
      return res.status(404).json({ message: 'Không tìm thấy bảo hành' });
    }

    const { _id, ...updateData } = req.body;

    const updatedWarranty = {
      ...updateData,
      updatedAt: new Date(),
      claimHistory: updateData.claimHistory || existingWarranty.claimHistory,
    };

    const result = await warrantiesCollection.updateOne(
      { _id: new ObjectId(warrantyId) },
      { $set: updatedWarranty }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bảo hành' });
    }

    const updatedDoc = await warrantiesCollection.findOne({ _id: new ObjectId(warrantyId) });
    res.status(200).json({ message: 'Cập nhật bảo hành thành công', data: updatedDoc });
  } catch (error) {
    console.error('Error in updateWarranty:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi cập nhật bảo hành', error: error.message });
  }
}

async function deleteWarranty(req, res) {
  try {
    const warrantiesCollection = await connectDB('BAOHANH');
    if (!warrantiesCollection) throw new Error('Database connection failed');
    const warrantyId = req.params.id;

    if (!isValidObjectId(warrantyId)) {
      return res.status(400).json({ message: 'ID bảo hành không hợp lệ' });
    }

    const result = await warrantiesCollection.deleteOne({ _id: new ObjectId(warrantyId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bảo hành' });
    }
    res.status(200).json({ message: 'Xóa bảo hành thành công' });
  } catch (error) {
    console.error('Error in deleteWarranty:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi xóa bảo hành', error: error.message });
  }
}

// --- Inventory Check Management ---
async function getInventoryChecks(req, res) {
  try {
    const inventoryCollection = await connectDB('KIEMKE');
    if (!inventoryCollection) throw new Error('Database connection failed');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search;

    let query = {};
    if (search) {
      query.$or = [
        { checkId: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { 'checkedBy.name': { $regex: search, $options: 'i' } },
      ];
    }

    const totalChecks = await inventoryCollection.countDocuments(query);
    const checks = await inventoryCollection
      .find(query)
      .sort({ checkDate: -1 }) // Sắp xếp theo checkDate giảm dần
      .skip(skip)
      .limit(limit)
      .toArray();

    res.status(200).json({
      data: checks,
      total: totalChecks,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in getInventoryChecks:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách kiểm kê', error: error.message });
  }
}

async function addInventoryCheck(req, res) {
  try {
    const inventoryCollection = await connectDB('KIEMKE');
    if (!inventoryCollection) throw new Error('Database connection failed');

    const {
      name,
      startDate,
      endDate,
      note,
      category,
      assets,
      totalAssets,
      createdBy,
      checkedAssets,
      missingAssets,
      checkMethod,
    } = req.body;

    if (!['Manual', 'SerialNumber', 'AssetTag'].includes(checkMethod)) {
      return res.status(400).json({ message: 'Hình thức kiểm kê không hợp lệ. Chọn: Manual, SerialNumber, hoặc AssetTag' });
    }

    const newCheck = {
      name,
      startDate,
      endDate,
      note,
      category: Array.isArray(category) ? category : category.split(','),
      assets: assets.map(asset => ({
        assetId: new ObjectId(asset.assetId),
        assetTag: asset.assetTag,
        name: asset.name,
        category: asset.category,
        location: asset.location,
        status: asset.status,
        assignedTo: asset.assignedTo || '',
        serialNumbers: asset.serialNumbers || [],
        actualQuantity: asset.actualQuantity || asset.serialNumbers.length,
        quantity: asset.quantity || (asset.serialNumbers.length - (asset.assignedSerialNumbers?.length || 0)),
        checked: asset.checked || false,
        checkDate: asset.checkDate || null,
        checkStatus: asset.checkStatus || null,
        checkNote: asset.checkNote || '',
        actualLocation: asset.actualLocation || asset.location,
        actualStatus: asset.actualStatus || asset.status,
      })),
      totalAssets: totalAssets || assets.length,
      checkedAssets: checkedAssets || 0,
      missingAssets: missingAssets || 0,
      createdBy,
      checkId: `CHECK-${Date.now()}`,
      status: 'Planned',
      checkMethod,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await inventoryCollection.insertOne(newCheck);
    res.status(201).json({
      message: 'Thêm kiểm kê thành công',
      id: result.insertedId,
      ...newCheck,
    });
  } catch (error) {
    console.error('Error in addInventoryCheck:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi thêm kiểm kê', error: error.message });
  }
}

async function deleteInventoryCheck(req, res) {
  try {
    const inventoryCollection = await connectDB('KIEMKE');
    if (!inventoryCollection) throw new Error('Database connection failed');
    const checkId = req.params.id;

    if (!isValidObjectId(checkId)) {
      return res.status(400).json({ message: 'ID kiểm kê không hợp lệ' });
    }

    const result = await inventoryCollection.deleteOne({ _id: new ObjectId(checkId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy kiểm kê' });
    }

    res.status(200).json({ message: 'Xóa kiểm kê thành công' });
  } catch (error) {
    console.error('Error in deleteInventoryCheck:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi xóa kiểm kê', error: error.message });
  }
}

async function updateInventoryCheckAsset(req, res) {
  try {
    const inventoryCollection = await connectDB('KIEMKE');
    const assetsCollection = await connectDB('ASSETS');
    if (!inventoryCollection || !assetsCollection) throw new Error('Database connection failed');

    const checkId = req.params.checkId;
    const assetId = req.params.assetId;

    if (!isValidObjectId(checkId) || !isValidObjectId(assetId)) {
      return res.status(400).json({ message: 'ID kiểm kê hoặc tài sản không hợp lệ' });
    }

    const { status, note, serialNumber, assetTag } = req.body;

    const check = await inventoryCollection.findOne({ _id: new ObjectId(checkId) });
    if (!check) {
      return res.status(404).json({ message: 'Không tìm thấy kiểm kê' });
    }

    const asset = await assetsCollection.findOne({ _id: new ObjectId(assetId) });
    if (!asset) {
      return res.status(404).json({ message: 'Không tìm thấy tài sản' });
    }

    if (check.checkMethod === 'SerialNumber' && !serialNumber) {
      return res.status(400).json({ message: 'Vui lòng cung cấp Serial Number cho hình thức kiểm kê này!' });
    }
    if (check.checkMethod === 'AssetTag' && !assetTag) {
      return res.status(400).json({ message: 'Vui lòng cung cấp Mã tài sản cho hình thức kiểm kê này!' });
    }

    const updatedAssets = check.assets.map(item => {
      if (item.assetId.toString() === assetId) {
        if (check.checkMethod === 'SerialNumber') {
          const isSerialMatch = serialNumber && item.serialNumbers.includes(serialNumber);
          return {
            ...item,
            checked: true,
            checkDate: new Date(),
            checkStatus: isSerialMatch ? 'Đủ' : 'Không tìm thấy',
            checkNote: isSerialMatch ? note || '' : `SN không khớp: ${serialNumber}`,
            updatedAt: new Date(),
          };
        }
        if (check.checkMethod === 'AssetTag') {
          const isTagMatch = assetTag === item.assetTag;
          return {
            ...item,
            checked: true,
            checkDate: new Date(),
            checkStatus: isTagMatch ? 'Đủ' : 'Không tìm thấy',
            checkNote: isTagMatch ? note || '' : `Mã tài sản không khớp: ${assetTag}`,
            updatedAt: new Date(),
          };
        }
        return {
          ...item,
          status,
          note,
          checked: true,
          checkDate: new Date(),
          checkStatus: status || 'Đủ',
          updatedAt: new Date(),
        };
      }
      return item;
    });

    const result = await inventoryCollection.updateOne(
      { _id: new ObjectId(checkId) },
      { $set: { assets: updatedAssets, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy kiểm kê' });
    }

    res.status(200).json({ message: 'Cập nhật trạng thái tài sản trong kiểm kê thành công' });
  } catch (error) {
    console.error('Error in updateInventoryCheckAsset:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi cập nhật kiểm kê tài sản', error: error.message });
  }
}

async function updateInventoryCheck(req, res) {
  try {
    const inventoryCollection = await connectDB('KIEMKE');
    if (!inventoryCollection) throw new Error('Database connection failed');

    const checkId = req.params.id;

    if (!isValidObjectId(checkId)) {
      return res.status(400).json({ message: 'ID kiểm kê không hợp lệ' });
    }

    const { assets, checkedAssets, missingAssets, status, createdBy } = req.body;

    const check = await inventoryCollection.findOne({ _id: new ObjectId(checkId) });
    if (!check) {
      return res.status(404).json({ message: 'Không tìm thấy kiểm kê' });
    }

    if (status === 'Hoàn thành') {
      const uncheckedAssets = assets.filter(asset => !asset.checked).length;
      if (uncheckedAssets > 0) {
        return res.status(400).json({
          message: `Không thể hoàn thành: Còn ${uncheckedAssets} tài sản chưa được kiểm tra!`,
        });
      }
    }

    const updatedAssets = assets.map(asset => {
      const assetInDb = check.assets.find(a => a.assetId.toString() === (asset.assetId?.toString() || asset.assetId));
      if (!assetInDb) return asset;

      return {
        ...assetInDb,
        ...asset,
        checkedSerialNumbers: asset.checkedSerialNumbers || assetInDb.checkedSerialNumbers || [], // Lưu danh sách SN đã kiểm
        updatedAt: new Date(),
      };
    });

    const updatedFields = {
      ...(assets && { assets: updatedAssets }),
      ...(checkedAssets !== undefined && { checkedAssets }),
      ...(missingAssets !== undefined && { missingAssets }),
      ...(status && { status }),
      ...(createdBy && { createdBy }),
      updatedAt: new Date(),
    };

    const result = await inventoryCollection.updateOne(
      { _id: new ObjectId(checkId) },
      { $set: updatedFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy kiểm kê' });
    }

    res.status(200).json({ message: 'Cập nhật kiểm kê thành công', data: updatedFields });
  } catch (error) {
    console.error('Error in updateInventoryCheck:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi cập nhật kiểm kê', error: error.message });
  }
}
async function getAssetCategories(req, res) {
  try {
    const assetsCollection = await connectDB('ASSETS');
    if (!assetsCollection) throw new Error('Database connection failed');

    const categories = await assetsCollection.distinct('category');
    res.status(200).json({ data: categories });
  } catch (error) {
    console.error('Error in getAssetCategories:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách loại tài sản', error: error.message });
  }
}

// --- Retired Asset Management ---
async function getRetiredAssets(req, res) {
  try {
    const retiredCollection = await connectDB('THONGKETAISAN');
    if (!retiredCollection) throw new Error('Database connection failed');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5; // Default to 5 items per page
    const skip = (page - 1) * limit;
    const search = req.query.search;

    let query = {};
    if (search) {
      query.$or = [
        { assetTag: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } },
      ];
    }

    const totalRetired = await retiredCollection.countDocuments(query);
    const retiredAssets = await retiredCollection
      .find(query)
      .sort({ retiredDate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    res.status(200).json({
      data: retiredAssets,
      total: totalRetired,
      page,
      limit,
      totalPages: Math.ceil(totalRetired / limit),
    });
  } catch (error) {
    console.error('Error in getRetiredAssets:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách tài sản thanh lý', error: error.message });
  }
}
async function deleteRetiredAsset(req, res) {
  try {
    const retiredCollection = await connectDB('THONGKETAISAN');
    if (!retiredCollection) throw new Error('Database connection failed');
    const retiredId = req.params.id;

    if (!isValidObjectId(retiredId)) {
      return res.status(400).json({ message: 'ID tài sản thanh lý không hợp lệ' });
    }

    const result = await retiredCollection.deleteOne({ _id: new ObjectId(retiredId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài sản thanh lý' });
    }

    res.status(200).json({ message: 'Xóa tài sản thanh lý thành công' });
  } catch (error) {
    console.error('Error in deleteRetiredAsset:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi xóa tài sản thanh lý', error: error.message });
  }
}

async function approveRetiredAsset(req, res) {
  try {
    const retiredCollection = await connectDB('THONGKETAISAN');
    const assetsCollection = await connectDB('ASSETS');
    if (!retiredCollection || !assetsCollection) throw new Error('Database connection failed');

    const retiredId = req.params.id;

    if (!ObjectId.isValid(retiredId)) {
      return res.status(400).json({ message: 'ID tài sản thanh lý không hợp lệ' });
    }

    const retiredAsset = await retiredCollection.findOne({ _id: new ObjectId(retiredId) });
    if (!retiredAsset) {
      return res.status(404).json({ message: 'Không tìm thấy tài sản thanh lý' });
    }

    if (retiredAsset.status === 'Đã duyệt') {
      return res.status(400).json({ message: 'Tài sản thanh lý đã được phê duyệt trước đó' });
    }

    const asset = await assetsCollection.findOne({ _id: new ObjectId(retiredAsset.assetId) });
    if (!asset) {
      return res.status(404).json({ message: 'Không tìm thấy tài sản gốc' });
    }

    // Xóa SN đã chọn khỏi serialNumbers
    const updatedSerialNumbers = asset.serialNumbers.filter(sn => sn !== retiredAsset.serialNumber);
    const updatedQuantity = updatedSerialNumbers.length;

    // Cập nhật tài sản trong ASSETS
    await assetsCollection.updateOne(
      { _id: new ObjectId(retiredAsset.assetId) },
      {
        $set: {
          serialNumbers: updatedSerialNumbers,
          actualQuantity: updatedQuantity,
          updatedAt: new Date(),
        },
      }
    );

    // Cập nhật trạng thái thanh lý thành "Đã duyệt"
    const history = retiredAsset.history || [];
    history.push({ action: 'Phê duyệt', by: 'Admin', at: new Date() });

    await retiredCollection.updateOne(
      { _id: new ObjectId(retiredId) },
      {
        $set: {
          status: 'Đã duyệt',
          history,
          updatedAt: new Date(),
        },
      }
    );

    res.status(200).json({ message: 'Phê duyệt tài sản thanh lý thành công' });
  } catch (error) {
    console.error('Error in approveRetiredAsset:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi phê duyệt tài sản thanh lý', error: error.message });
  }
}

async function addRetiredAsset(req, res) {
  try {
    const retiredCollection = await connectDB('THONGKETAISAN');
    const assetsCollection = await connectDB('ASSETS');
    if (!retiredCollection || !assetsCollection) throw new Error('Database connection failed');

    const { assetId, serialNumber, reason, retiredDate, initialValue, currentValue, retirementValue, retirementMethod, status, notes } = req.body;

    if (!ObjectId.isValid(assetId)) {
      return res.status(400).json({ message: 'ID tài sản không hợp lệ' });
    }

    if (!serialNumber) {
      return res.status(400).json({ message: 'Vui lòng cung cấp số Serial Number để thanh lý' });
    }

    const asset = await assetsCollection.findOne({ _id: new ObjectId(assetId) });
    if (!asset) {
      return res.status(404).json({ message: 'Không tìm thấy tài sản' });
    }

    if (!asset.serialNumbers.includes(serialNumber)) {
      return res.status(400).json({ message: `Số Serial Number ${serialNumber} không tồn tại trong tài sản` });
    }

    const retiredAsset = {
      assetId: new ObjectId(assetId),
      assetTag: asset.assetTag,
      name: asset.name,
      category: asset.category,
      serialNumbers: asset.serialNumbers, // Lưu toàn bộ danh sách SN để tham khảo
      serialNumber: serialNumber, // SN cụ thể được chọn để thanh lý
      reason,
      retiredDate: retiredDate || new Date(),
      initialValue,
      currentValue,
      retirementValue,
      retirementMethod,
      status: status || 'Chờ duyệt',
      notes,
      history: [{ action: 'Tạo', by: 'Admin', at: new Date() }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await retiredCollection.insertOne(retiredAsset);
    res.status(201).json({ message: 'Thêm tài sản thanh lý thành công', id: result.insertedId });
  } catch (error) {
    console.error('Error in addRetiredAsset:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi thêm tài sản thanh lý', error: error.message });
  }
}

async function updateRetiredAsset(req, res) {
  try {
    const retiredCollection = await connectDB('THONGKETAISAN');
    if (!retiredCollection) throw new Error('Database connection failed');

    const retiredId = req.params.id;

    if (!ObjectId.isValid(retiredId)) {
      return res.status(400).json({ message: 'ID tài sản thanh lý không hợp lệ' });
    }

    const existingAsset = await retiredCollection.findOne({ _id: new ObjectId(retiredId) });
    if (!existingAsset) {
      return res.status(404).json({ message: 'Không tìm thấy tài sản thanh lý' });
    }

    const { assetId, serialNumber, ...updateData } = req.body;
    const history = existingAsset.history || [];
    if (req.body.status && req.body.status !== existingAsset.status) {
      history.push({ action: req.body.status, by: 'Admin', at: new Date() });
    }

    const updatedRetiredAsset = {
      ...updateData,
      serialNumber: serialNumber || existingAsset.serialNumber, // Giữ SN nếu không thay đổi
      updatedAt: new Date(),
      history,
    };

    const result = await retiredCollection.updateOne(
      { _id: new ObjectId(retiredId) },
      { $set: updatedRetiredAsset }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài sản thanh lý' });
    }

    res.status(200).json({ message: 'Cập nhật tài sản thanh lý thành công' });
  } catch (error) {
    console.error('Error in updateRetiredAsset:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi cập nhật tài sản thanh lý', error: error.message });
  }
}

// --- Report Generation ---
async function generateReport(req, res) {
  try {
    const assetsCollection = await connectDB('ASSETS');
    const retiredCollection = await connectDB('THONGKETAISAN');
    const warrantiesCollection = await connectDB('BAOHANH');

    const { type, startDate, endDate, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);

    const formatDate = (date) => (date ? dayjs(date).format('DD-MM-YYYY') : null);

    let reportData;
    let totalRecords;
    let query = {};

    if (startDate && endDate) {
      const start = dayjs(startDate, 'DD-MM-YYYY').toDate();
      const end = dayjs(endDate, 'DD-MM-YYYY').toDate();
      if (type === 'inventory') {
        query.createdAt = { $gte: start, $lte: end };
      } else if (type === 'warranty') {
        query.startDate = { $gte: start, $lte: end };
      } else if (type === 'retired') {
        query.retiredDate = { $gte: start, $lte: end };
      }
    }

    switch (type) {
      case 'inventory':
        reportData = await assetsCollection.find(query).skip(skip).limit(limitNum).toArray();
        totalRecords = await assetsCollection.countDocuments(query);
        reportData = reportData.map(item => ({
          ...item,
          createdAt: formatDate(item.createdAt),
          updatedAt: formatDate(item.updatedAt),
        }));
        break;
      case 'warranty':
        reportData = await warrantiesCollection.find(query).skip(skip).limit(limitNum).toArray();
        totalRecords = await warrantiesCollection.countDocuments(query);
        reportData = reportData.map(item => ({
          ...item,
          startDate: formatDate(item.startDate),
          endDate: formatDate(item.endDate),
          createdAt: formatDate(item.createdAt),
          updatedAt: formatDate(item.updatedAt),
        }));
        break;
      case 'retired':
        reportData = await retiredCollection.find(query).skip(skip).limit(limitNum).toArray();
        totalRecords = await retiredCollection.countDocuments(query);
        reportData = reportData.map(item => ({
          ...item,
          retiredDate: formatDate(item.retiredDate),
          createdAt: formatDate(item.createdAt),
          updatedAt: formatDate(item.updatedAt),
        }));
        break;
      default:
        return res.status(400).json({ success: false, message: 'Loại báo cáo không hợp lệ' });
    }

    res.status(200).json({
      success: true,
      message: 'Báo cáo đã được tạo thành công',
      data: reportData,
      pagination: {
        totalRecords,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecords / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error('Error in generateReport:', error.message, error.stack);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo báo cáo', error: error.message });
  }
}
// --- Search Assets ---
async function searchAssets(req, res) {
  try {
    const assetsCollection = await connectDB('ASSETS');
    if (!assetsCollection) throw new Error('Database connection failed');

    const search = req.query.search;
    if (!search) {
      return res.status(400).json({ message: 'Vui lòng cung cấp từ khóa tìm kiếm' });
    }

    const query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { assetTag: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { serialNumbers: { $regex: search, $options: 'i' } },
      ],
    };

    const assets = await assetsCollection.find(query).limit(10).toArray();
    res.status(200).json({ data: assets });
  } catch (error) {
    console.error('Error in searchAssets:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi tìm kiếm tài sản', error: error.message });
  }
}

async function getAssetById(req, res) {
  try {
    const assetsCollection = await connectDB('ASSETS');
    if (!assetsCollection) throw new Error('Database connection failed');
    const assetId = req.params.id;

    if (!isValidObjectId(assetId)) {
      return res.status(400).json({ message: 'ID tài sản không hợp lệ' });
    }

    const asset = await assetsCollection.findOne({ _id: new ObjectId(assetId) });
    if (!asset) {
      return res.status(404).json({ message: 'Không tìm thấy tài sản' });
    }

    const processedAsset = {
      ...asset,
      actualQuantity: asset.serialNumbers.length,
      quantity: asset.serialNumbers.length - (asset.assignedSerialNumbers?.length || 0),
    };

    res.status(200).json({ data: processedAsset });
  } catch (error) {
    console.error('Error in getAssetById:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin tài sản', error: error.message });
  }
}

module.exports = {
  getAssets,
  addAsset,
  updateAsset,
  deleteAsset,
  getInventoryChecks,
  addInventoryCheck,
  updateInventoryCheckAsset,
  getWarranties,
  addWarranty,
  deleteInventoryCheck,
  getAssetById,
  updateWarranty,
  deleteWarranty,
  approveRetiredAsset,
  getRetiredAssets,
  addRetiredAsset,
  updateRetiredAsset,
  deleteRetiredAsset,
  generateReport,
  searchAssets,
  updateInventoryCheck,
  getAssetCategories,
};