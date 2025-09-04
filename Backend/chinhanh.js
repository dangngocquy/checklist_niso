const { connectDB } = require("./MongoDB/database");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");

async function getValidDepartments(inputDepts = []) {
  try {
    const deptCollection = await connectDB("DEPARTMENTS");
    const validDepartments = await deptCollection.find({ active: true }, { projection: { bophan: 1 } }).toArray();
    const validDeptNames = new Set(validDepartments.map(d => d.bophan));
    
    return inputDepts.filter(dept => validDeptNames.has(dept));
  } catch (error) {
    console.error("Error fetching departments:", error);
    return [];
  }
}

exports.PostrepDocs = async (req, res) => {
  const { restaurant, code, ipwan, address, userKeys, batch = false, batchData = [], departments = [] } = req.body;

  if (!userKeys) {
    return res.status(400).json({ message: "userKeys is required" });
  }
  
  if (!batch && !restaurant) {
    return res.status(400).json({ message: "Restaurant is required for single entry" });
  }

  try {
    const shopCollection = await connectDB("SHOP");
    const formattedDate = moment(new Date()).format("DD/MM/YYYY HH:mm:ss");
    
    if (batch && Array.isArray(batchData) && batchData.length > 0) {
      const BATCH_SIZE = 50;
      const allBranches = [];
      
      for (let i = 0; i < batchData.length; i += BATCH_SIZE) {
        const chunk = batchData.slice(i, i + BATCH_SIZE);
        const validDepts = await getValidDepartments(
          Array.from(new Set(chunk.flatMap(data => data.departments || [])))
        );
        
        const newBranches = await Promise.all(chunk.map(async data => {
          const filteredDepts = (data.departments || []).filter(dept => validDepts.includes(dept));
          return {
            id: uuidv4(),
            restaurant: data.restaurant,
            code: data.code,
            ipwan: data.ipwan || null,
            address: data.address || null,
            departments: filteredDepts,
            isActive: true,
            date: formattedDate,
            isTransferred: false,
          };
        }));
        
        await shopCollection.insertMany(newBranches);
        allBranches.push(...newBranches);
      }
      
      res.status(201).json({ message: `Đã nhập ${allBranches.length} chi nhánh`, data: allBranches });
    } else {
      if (!code) {
        return res.status(400).json({ message: "Code is required for single entry" });
      }
      
      const filteredDepts = await getValidDepartments(departments);
      const newChinhanh = {
        id: uuidv4(),
        restaurant,
        code,
        ipwan: ipwan || null,
        address: address || null,
        departments: filteredDepts,
        isActive: true,
        date: formattedDate,
        isTransferred: false,
      };
      
      await shopCollection.insertOne(newChinhanh);
      res.status(201).json(newChinhanh);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.PutrepDocs = async (req, res) => {
  const { id } = req.params;
  const { restaurant, code, ipwan, address, isActive, departments, userKeys } = req.body;

  if (!id || !userKeys) {
    return res.status(400).json({ message: "ID and userKeys are required" });
  }

  try {
    const shopCollection = await connectDB("SHOP");
    
    const existingDoc = await shopCollection.findOne({
      id: { $ne: id },
      $or: [
        { restaurant: restaurant },
        { code: code }
      ]
    });
    
    if (existingDoc) {
      if (existingDoc.restaurant === restaurant) {
        return res.status(400).json({ message: "Restaurant name already exists" });
      }
      if (existingDoc.code === code) {
        return res.status(400).json({ message: "Code already exists" });
      }
    }
    
    const filteredDepts = await getValidDepartments(departments);
    const formattedDate = moment(new Date()).format("DD/MM/YYYY HH:mm:ss");
    
    const updatedDoc = {
      restaurant,
      code,
      ipwan: ipwan || null,
      address: address || null,
      departments: filteredDepts,
      isActive: isActive !== undefined ? isActive : true,
      date: formattedDate,
    };
    
    const result = await shopCollection.findOneAndUpdate(
      { id },
      { $set: updatedDoc },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({ data: { id, ...updatedDoc } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.DeleterepDocs = async (req, res) => {
  const { id } = req.params;
  const { userKeys } = req.body;

  if (!id || !userKeys) {
    return res.status(400).json({ message: "ID and userKeys are required" });
  }

  try {
    const shopCollection = await connectDB("SHOP");
    
    const result = await shopCollection.findOneAndDelete({ id });
    
    if (!result) {
      return res.status(404).json({ message: "Item not found" });
    }
    
    res.json({ message: "Xóa cửa hàng thành công." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.deleteChinhanhAll = async (req, res) => {
  const ids = req.body.ids || req.query.ids?.split(",");
  const { userKeys } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0 || !userKeys) {
    return res.status(400).json({ message: "IDs and userKeys are required" });
  }

  try {
    const shopCollection = await connectDB("SHOP");
    const deletedDocs = await shopCollection.find(
      { id: { $in: ids } },
      { projection: { id: 1, restaurant: 1 } }
    ).toArray();
    
    if (deletedDocs.length === 0) {
      return res.status(404).json({ message: "No items found to delete" });
    }
    
    const result = await shopCollection.deleteMany({ id: { $in: ids } });
    res.json({ message: `Xóa thành công ${result.deletedCount} cửa hàng` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.transferChinhanh = async (req, res) => {
  const { branchIds, userKeys, action = "transfer" } = req.body;

  if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0 || !userKeys) {
    return res.status(400).json({ message: "branchIds and userKeys are required" });
  }

  try {
    const shopCollection = await connectDB("SHOP");
    
    const existingBranches = await shopCollection.find(
      { id: { $in: branchIds } },
      { projection: { id: 1, restaurant: 1, isTransferred: 1 } }
    ).toArray();
    
    if (existingBranches.length !== branchIds.length) {
      return res.status(404).json({ message: "One or more branch IDs not found" });
    }
    
    const isTransferredValue = action === "transfer";
    const actionText = action === "transfer" ? "chuyển chi nhánh" : "hủy chuyển chi nhánh";
    
    const idsToUpdate = existingBranches
      .filter(branch => (action === "transfer" && branch.isTransferred !== true) || 
                       (action !== "transfer" && branch.isTransferred === true))
      .map(branch => branch.id);
    
    if (idsToUpdate.length === 0) {
      return res.status(400).json({
        message: `Không có chi nhánh nào được ${actionText} (trạng thái đã phù hợp)`
      });
    }
    
    const result = await shopCollection.updateMany(
      { id: { $in: idsToUpdate } },
      {
        $set: {
          isTransferred: isTransferredValue,
          updatedAt: moment(new Date()).format("DD/MM/YYYY HH:mm:ss")
        }
      }
    );
    
    res.json({
      message: `Đã ${actionText} thành công ${result.modifiedCount} chi nhánh`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Fix for the backend date sorting in getrepDocs function
exports.getrepDocs = async (req, res) => {
  const { page = 1, limit = 0, search = "", pagination = "true" } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  try {
    const shopCollection = await connectDB("SHOP");
    const query = search ? { restaurant: { $regex: new RegExp(search, "i") } } : {};
    const totalDocs = await shopCollection.countDocuments(query);
    
    let pipeline = [
      { $match: query },
      {
        $addFields: {
          sortableDate: {
            $dateFromString: {
              dateString: { $ifNull: ["$date", "01/01/1970 00:00:00"] },
              format: "%d/%m/%Y %H:%M:%S"
            }
          }
        }
      },
      {
        $project: {
          restaurant: 1,
          code: 1,
          ipwan: 1,
          address: 1,
          departments: 1,
          isActive: 1,
          isTransferred: { $ifNull: ["$isTransferred", false] },
          id: 1,
          date: 1,
          _id: 0
        }
      },
      { $sort: { sortableDate: -1 } },
      { $project: { sortableDate: 0 } }
    ];
    
    if (pagination === "true" && limitNum > 0) {
      pipeline.push(
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum }
      );
    }
    
    const dataArray = await shopCollection.aggregate(pipeline).toArray();
    
    res.json({
      data: dataArray,
      total: totalDocs,
      currentPage: pageNum,
      totalPages: limitNum > 0 && pagination === "true" ? Math.ceil(totalDocs / limitNum) : 1,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.searchChinhanh = async (req, res) => {
  const { search = "", page = 1, limit = 10, pagination = "true" } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  try {
    const shopCollection = await connectDB("SHOP");
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");
    
    const query = {
      $and: [
        {
          $or: [
            { restaurant: { $regex: searchRegex } },
            { code: { $regex: searchRegex } },
            { address: { $regex: searchRegex } },
          ],
        },
        { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
      ],
    };
    
    const totalDocs = await shopCollection.countDocuments(query);
    
    let pipeline = [
      { $match: query },
      {
        $addFields: {
          sortableDate: {
            $dateFromString: {
              dateString: { $ifNull: ["$date", "01/01/1970 00:00:00"] },
              format: "%d/%m/%Y %H:%M:%S"
            }
          }
        }
      },
      {
        $project: {
          restaurant: 1,
          code: 1,
          ipwan: 1,
          address: 1,
          departments: 1,
          isActive: 1,
          isTransferred: { $ifNull: ["$isTransferred", false] },
          id: 1,
          date: 1,
          _id: 0
        }
      },
      { $sort: { sortableDate: -1 } },
      { $project: { sortableDate: 0 } }
    ];
    
    if (pagination === "true" && limitNum > 0) {
      pipeline.push(
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum }
      );
    }
    
    const dataArray = await shopCollection.aggregate(pipeline).toArray();
    
    res.json({
      data: dataArray,
      total: totalDocs,
      currentPage: pageNum,
      totalPages: limitNum > 0 && pagination === "true" ? Math.ceil(totalDocs / limitNum) : 1,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};