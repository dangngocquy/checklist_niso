const { connectDB } = require('./MongoDB/database');
const { ObjectId } = require('mongodb');
const moment = require('moment');
const { v4: uuidv4 } = require("uuid");

let departmentsCollection = null;
let thongbaoCollection = null;
let userCollection = null;

async function getCollections() {
    if (!departmentsCollection) departmentsCollection = await connectDB('DEPARTMENTS');
    if (!thongbaoCollection) thongbaoCollection = await connectDB('THONGBAO');
    if (!userCollection) userCollection = await connectDB('CHECKLIST_DATABASE');
    
    return { departmentsCollection, thongbaoCollection, userCollection };
}

exports.getTableAData = async (req, res) => {
    try {
        const { departmentsCollection } = await getCollections();
        const { page = 1, limit = 5, search = '', pagination } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
        const query = search.trim() 
            ? { bophan: { $regex: new RegExp('^' + search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') } } 
            : {};
            
        if (pagination === 'false') {
            const items = await departmentsCollection
                .find(query)
                .project({ _id: 1, bophan: 1, checklist: 1, active: 1, createdAtFormatted: 1 })
                .sort({ createdAt: -1 })
                .toArray();
                
            return res.json({
                items,
                totalItems: items.length,
                currentPage: 1,
                totalPages: 1
            });
        }

        const skip = (pageNum - 1) * limitNum;
        const [items, totalItems] = await Promise.all([
            departmentsCollection
                .find(query)
                .project({ _id: 1, bophan: 1, checklist: 1, active: 1, createdAtFormatted: 1 })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .toArray(),
            departmentsCollection.countDocuments(query)
        ]);

        res.json({
            items,
            totalItems,
            currentPage: pageNum,
            totalPages: Math.ceil(totalItems / limitNum)
        });
    } catch (error) {
        console.error('GetTableAData error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.addDepartment = async (req, res) => {
    try {
        const { departmentsCollection } = await getCollections();
        const { bophan, userKeys } = req.body;

        if (!bophan || !userKeys) {
            return res.status(400).json({ message: "bophan and userKeys are required" });
        }

        const existing = await departmentsCollection.findOne({
            bophan: { $regex: new RegExp(`^${bophan.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
        });

        if (existing) {
            return res.status(400).json({ message: 'Bộ phận đã tồn tại' });
        }

        const newDepartment = {
            _id: new ObjectId(),
            bophan,
            checklist: false,
            active: true,
            createdAt: new Date(),
            createdAtFormatted: moment().format('DD-MM-YYYY HH:mm:ss')
        };

        const result = await departmentsCollection.insertOne(newDepartment);

        res.json({
            success: true,
            item: { ...newDepartment, _id: result.insertedId }
        });
    } catch (error) {
        console.error('AddDepartment error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.editTableAData = async (req, res) => {
    try {
        const { departmentsCollection } = await getCollections();
        const { keys } = req.params;
        const { bophan, active, userKeys } = req.body;

        if (!bophan || !userKeys) {
            return res.status(400).json({ message: "bophan and userKeys are required" });
        }

        const existing = await departmentsCollection.findOne({
            bophan: { $regex: new RegExp(`^${bophan.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
            _id: { $ne: new ObjectId(keys) }
        });

        if (existing) {
            return res.status(400).json({ message: 'Bộ phận đã tồn tại' });
        }

        const updateData = { 
            bophan,
            updatedAt: new Date(),
            updatedAtFormatted: moment().format('DD-MM-YYYY HH:mm:ss')
        };
        if (typeof active !== 'undefined') updateData.active = active;

        const result = await departmentsCollection.updateOne(
            { _id: new ObjectId(keys) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy bộ phận' });
        }

        const updatedItem = await departmentsCollection.findOne(
            { _id: new ObjectId(keys) },
            { projection: { _id: 1, bophan: 1, active: 1, updatedAtFormatted: 1 } }
        );

        res.json({ success: true, item: updatedItem });
    } catch (error) {
        console.error('EditTableAData error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.deleteTableAData = async (req, res) => {
    try {
        const { departmentsCollection } = await getCollections();
        const { keys } = req.params;
        const { userKeys } = req.body;

        if (!userKeys) {
            return res.status(400).json({ message: "userKeys is required" });
        }

        const deletedDoc = await departmentsCollection.findOne(
            { _id: new ObjectId(keys) },
            { projection: { bophan: 1 } }
        );
        
        if (!deletedDoc) {
            return res.status(404).json({ message: "Không tìm thấy bộ phận" });
        }

        const result = await departmentsCollection.deleteOne({ _id: new ObjectId(keys) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy bộ phận' });
        }

        res.json({ success: true, message: 'Xóa bộ phận thành công' });
    } catch (error) {
        console.error('DeleteTableAData error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.deletePhongbanAll = async (req, res) => {
    try {
        const { departmentsCollection } = await getCollections();
        const { ids, userKeys } = req.body;

        if (!Array.isArray(ids) || ids.length === 0 || !userKeys) {
            return res.status(400).json({ message: 'IDs and userKeys are required' });
        }

        if (ids.length > 100) {
            return res.status(400).json({ message: 'Maximum of 100 departments can be deleted at once' });
        }

        const objectIds = ids.map(id => new ObjectId(id));
        
        const deletedDocs = await departmentsCollection.find(
            { _id: { $in: objectIds } }, 
            { projection: { _id: 1, bophan: 1 } }
        ).toArray();
        
        if (deletedDocs.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy bộ phận nào để xóa' });
        }
        
        const result = await departmentsCollection.deleteMany({ _id: { $in: objectIds } });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy bộ phận nào để xóa' });
        }

        res.json({
            success: true,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('DeletePhongbanAll error:', error.message);
        res.status(500).json({
            message: 'Lỗi server khi xóa các bộ phận',
            error: error.message
        });
    }
};

exports.editphanquyenData = async (req, res) => {
    try {
        const { departmentsCollection } = await getCollections();
        const { keys } = req.params;
        const { checklist, laplai, hinhanh, edit, deletephanhoi, batcuahang, batkiemsoat } = req.body;

        const updateData = {};
        if (typeof checklist !== 'undefined') updateData.checklist = checklist;
        if (typeof laplai !== 'undefined') updateData.laplai = laplai;
        if (typeof hinhanh !== 'undefined') updateData.hinhanh = hinhanh;
        if (typeof edit !== 'undefined') updateData.edit = edit;
        if (typeof deletephanhoi !== 'undefined') updateData.deletephanhoi = deletephanhoi;
        if (typeof batcuahang !== 'undefined') updateData.batcuahang = batcuahang;
        if (typeof batkiemsoat !== 'undefined') updateData.batkiemsoat = batkiemsoat;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No data to update' });
        }

        const result = await departmentsCollection.updateOne(
            { _id: new ObjectId(keys) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy bộ phận' });
        }

        const updatedItem = await departmentsCollection.findOne(
            { _id: new ObjectId(keys) },
            { 
                projection: { 
                    _id: 1, bophan: 1, active: 1, checklist: 1, 
                    laplai: 1, hinhanh: 1, edit: 1, deletephanhoi: 1, 
                    batcuahang: 1, batkiemsoat: 1 
                } 
            }
        );

        res.json({ success: true, item: updatedItem });
    } catch (error) {
        console.error('EditphanquyenData error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.uploadDepartments = async (req, res) => {
    try {
        const { departmentsCollection } = await getCollections();
        const { departments, userKeys } = req.body;

        if (!userKeys) {
            return res.status(400).json({ message: "userKeys is required" });
        }
        if (!Array.isArray(departments) || departments.length === 0) {
            return res.status(400).json({ message: "Departments array is required" });
        }
        
        if (departments.length > 100) {
            return res.status(400).json({ message: 'Maximum of 100 departments can be uploaded at once' });
        }

        const departmentNames = departments.map(d => d.bophan.toLowerCase().trim());
        
        const existingDepartments = await departmentsCollection
            .find({ bophan: { $in: departments.map(d => d.bophan) } })
            .project({ bophan: 1 })
            .toArray();
            
        const existingNames = existingDepartments.map(d => d.bophan.toLowerCase().trim());
        
        const existingSet = new Set(existingNames);
        const newDepartments = departments.filter(
            d => !existingSet.has(d.bophan.toLowerCase().trim())
        );

        if (newDepartments.length === 0) {
            return res.status(400).json({ message: "Tất cả bộ phận đã tồn tại" });
        }

        const now = new Date();
        const formattedTime = moment(now).format('DD-MM-YYYY HH:mm:ss');
        
        const departmentDocs = newDepartments.map(dept => ({
            _id: new ObjectId(),
            bophan: dept.bophan.trim(),
            checklist: false,
            active: true,
            createdAt: now,
            createdAtFormatted: formattedTime,
        }));

        const result = await departmentsCollection.insertMany(departmentDocs);

        res.json({
            success: true,
            insertedCount: result.insertedCount,
            insertedIds: departmentDocs.map(d => d._id),
        });
    } catch (error) {
        console.error("UploadDepartments error:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.searchDepartment = async (req, res) => {
    try {
        const { departmentsCollection } = await getCollections();
        let { search } = req.query;

        let query = { active: true };
        
        if (search && search.trim() !== "") {
            search = search.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            query.bophan = { $regex: new RegExp(search, "i") };
        }

        const projection = {
            _id: 1,
            bophan: 1,
            active: 1
        };

        const departments = await departmentsCollection
            .find(query)
            .project(projection)
            .limit(100)
            .toArray();

        res.json({
            success: true,
            data: departments,
        });
    } catch (error) {
        console.error("SearchDepartment error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};