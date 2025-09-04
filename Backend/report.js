const { connectDB } = require('./MongoDB/database');
const { v4: uuidv4 } = require('uuid');

// Cached database connection
let reportCollectionCache = null;

// Helper function to get database connection with caching
async function getReportCollection() {
    if (!reportCollectionCache) {
        reportCollectionCache = await connectDB('REPORT');
    }
    return reportCollectionCache;
}

// Normalize array fields for consistent handling
function normalizeToArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

// Create case-insensitive regex
function createCaseInsensitiveRegex(value) {
    if (!value || value.trim() === "") return null;
    return new RegExp(`^${value}$`, 'i');
}

exports.getReport = async (req, res) => {
    try {
        const reportCollection = await getReportCollection();
        const { userKeys, page = 1, limit = 12, currentUser } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        let query = {};

        if (currentUser) {
            const userData = JSON.parse(currentUser);

            // Check if user doesn't have admin rights
            if (!userData.phanquyen || userData.phanquyen === "Xử lý yêu cầu") {
                const conditions = [];

                if (userData.keys) {
                    conditions.push({ userKeys: { $in: [userData.keys] } });
                }
                
                const boPhanRegex = createCaseInsensitiveRegex(userData.bophan);
                if (boPhanRegex) {
                    conditions.push({ bo_phan_rp: { $in: [boPhanRegex] } });
                }
                
                const chiNhanhRegex = createCaseInsensitiveRegex(userData.chinhanh);
                if (chiNhanhRegex) {
                    conditions.push({ shop: { $in: [chiNhanhRegex] } });
                }

                // If no valid conditions, return empty result
                if (conditions.length === 0) {
                    return res.json({
                        success: true,
                        data: [],
                        pagination: {
                            total: 0,
                            page: pageNum,
                            limit: limitNum,
                            totalPages: 0,
                        },
                    });
                }
                
                query = { $or: conditions };
            }
            // If admin, no filtering needed
        } else if (userKeys && userKeys !== 'all') {
            query = {
                userKeys: { $in: normalizeToArray(userKeys) },
            };
        }

        const skip = (pageNum - 1) * limitNum;

        // Use Promise.all for parallel execution
        const [total, reports] = await Promise.all([
            reportCollection.countDocuments(query),
            reportCollection
                .find(query)
                .sort({ createdAt: -1 }) // Sort by creation date, newest first
                .skip(skip)
                .limit(limitNum)
                .toArray()
        ]);

        res.json({
            success: true,
            data: reports,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reports',
        });
    }
};

exports.postReport = async (req, res) => {
    try {
        const { title, bo_phan_rp, link, shop, userKeys } = req.body;

        if (!title || !bo_phan_rp || !link || !userKeys) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const collection = await getReportCollection();
        const newReport = {
            keys: uuidv4(),
            title,
            bo_phan_rp: normalizeToArray(bo_phan_rp),
            shop: normalizeToArray(shop),
            link,
            userKeys: normalizeToArray(userKeys),
            createdAt: new Date()
        };

        const result = await collection.insertOne(newReport);
        res.status(201).json({
            success: true,
            data: { ...newReport, _id: result.insertedId }
        });
    } catch (error) {
        console.error('Error adding report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add report'
        });
    }
};

exports.putReport = async (req, res) => {
    try {
        const { keys } = req.params;
        const { link, bo_phan_rp, shop, title, userKeys } = req.body;

        if (!title || !bo_phan_rp || !link || !userKeys) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const collection = await getReportCollection();
        const updatedReport = {
            link,
            bo_phan_rp: normalizeToArray(bo_phan_rp),
            shop: normalizeToArray(shop),
            title,
            userKeys: normalizeToArray(userKeys),
            updatedAt: new Date()
        };

        const result = await collection.updateOne(
            { keys },
            { $set: updatedReport }
        );

        if (result.modifiedCount === 1) {
            res.json({
                success: true,
                message: 'Report updated successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update report'
        });
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const { keys } = req.params;
        const collection = await getReportCollection();

        const result = await collection.deleteOne({ keys });

        if (result.deletedCount === 1) {
            res.json({
                success: true,
                message: 'Report deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete report'
        });
    }
};

exports.deleteMultipleReports = async (req, res) => {
    try {
        const { keys } = req.body;
        if (!Array.isArray(keys) || keys.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No keys provided for deletion'
            });
        }

        const collection = await getReportCollection();
        const result = await collection.deleteMany({ keys: { $in: keys } });

        if (result.deletedCount > 0) {
            res.json({
                success: true,
                message: `${result.deletedCount} reports deleted successfully`
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'No reports found to delete'
            });
        }
    } catch (error) {
        console.error('Error deleting multiple reports:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete reports'
        });
    }
};

exports.getReportById = async (req, res) => {
    try {
        const { keys } = req.params;
        const collection = await getReportCollection();

        const report = await collection.findOne({ keys });

        if (report) {
            res.json({
                success: true,
                data: report
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
    } catch (error) {
        console.error('Error retrieving report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve report'
        });
    }
};