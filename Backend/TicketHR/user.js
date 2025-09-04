const { connectDB } = require('../MongoDB/database');
const moment = require('moment');

async function ensureIndexes() {
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    await answerDetailsCollection.createIndex({ "response.versions": 1 });
    await answerDetailsCollection.createIndex({ "response.submittedAt": 1 });
    await answerDetailsCollection.createIndex({ "response.ngay_phan_hoi": 1 });
    await answerDetailsCollection.createIndex({ "response.keysJSON": 1 });
    await answerDetailsCollection.createIndex({ "response.title": 1 });
    await answerDetailsCollection.createIndex({ "response.chi_nhanh": 1 });
    await answerDetailsCollection.createIndex({ "response.phongban": 1 });
    await answerDetailsCollection.createIndex({ "response.trangthai": 1 });
    await answerDetailsCollection.createIndex({ "response.accounts": 1 });
    await answerDetailsCollection.createIndex({ "response.bophanADS": 1 });
    await answerDetailsCollection.createIndex({ "response.cuahang": 1 });
    await answerDetailsCollection.createIndex({ "response.thoigianxuly": 1 });
    await answerDetailsCollection.createIndex({ "response.watching": 1 });
    await answerDetailsCollection.createIndex({ "response.yeucauxuly": 1 }); // Thêm index cho yeucauxuly
}

ensureIndexes();

exports.GetAllYeuCau = async (req, res) => {
    const {
        page = 1,
        pageSize = 5,
        startDate,
        endDate,
        keysJSON,
        title,
        chiNhanh,
        phongBan,
        userKeys,
        trangthai,
        tab = 'assigned',
        viewStatus,
    } = req.query;

    const parsedPage = parseInt(page) || 1;
    const parsedPageSize = parseInt(pageSize) || 5;

    try {
        const checklistCollection = await connectDB('CHECKLIST_DATABASE');
        const answerDetailsCollection = await connectDB('ANSWER_DETAILS');

        const user = req.query.user ? JSON.parse(req.query.user) : {};

        const baseQuery = {
            "response.versions": "v1.0.1",
            "response.yeucauxuly": true, // Chỉ lấy các yêu cầu có yeucauxuly: true
        };

        if (startDate || endDate) {
            const dateQuery = {};
            if (startDate) dateQuery.$gte = moment(startDate, 'DD-MM-YYYY').startOf('day').toDate();
            if (endDate) dateQuery.$lte = moment(endDate, 'DD-MM-YYYY').endOf('day').toDate();
            baseQuery.$or = [
                { "response.submittedAt": dateQuery },
                { "response.ngay_phan_hoi": dateQuery },
            ];
        }

        if (keysJSON) {
            baseQuery["response.keysJSON"] = { $in: Array.isArray(keysJSON) ? keysJSON : keysJSON.split(',').map(key => key.trim()) };
        }

        if (title) baseQuery["response.title"] = { $regex: title, $options: 'i' };
        if (chiNhanh) baseQuery["response.chi_nhanh"] = { $regex: chiNhanh, $options: 'i' };
        if (phongBan) baseQuery["response.phongban"] = { $regex: phongBan, $options: 'i' };
        if (userKeys && userKeys !== 'all') {
            baseQuery["response.keysJSON"] = { $in: Array.isArray(userKeys) ? userKeys : userKeys.split(',').map(key => key.trim()) };
        }

        if (tab === 'assigned' && trangthai) {
            baseQuery["response.trangthai"] = trangthai;
        }

        if (viewStatus) {
            if (viewStatus === 'unviewed') {
                baseQuery["response.watching"] = { $nin: [user.keys] };
            } else if (viewStatus === 'viewed') {
                baseQuery["response.watching"] = { $in: [user.keys] };
            }
        }

        const tabQueries = {
            assigned: {
                ...baseQuery,
                $or: [
                    { "response.accounts": user.keys },
                    { "response.bophanADS": user.bophan },
                    { "response.cuahang": user.chinhanh },
                ],
            },
            pending: {
                ...baseQuery,
                "response.trangthai": { $in: [null, 'Chờ xử lý'] },
                "response.keysJSON": user.keys,
            },
            overdue: {
                ...baseQuery,
                "response.thoigianxuly": { $lte: moment().toDate() },
                "response.trangthai": { $ne: 'Hoàn tất' },
                "response.keysJSON": user.keys,
            },
            completed: {
                ...baseQuery,
                "response.trangthai": 'Hoàn tất',
                "response.keysJSON": user.keys,
            },
        };

        const counts = {};
        for (const [tabName, query] of Object.entries(tabQueries)) {
            counts[tabName] = await answerDetailsCollection.countDocuments({
                ...query,
                "response.watching": { $nin: [user.keys] },
            });
        }

        const selectedTabQuery = tabQueries[tab] || tabQueries.assigned;
        const total = await answerDetailsCollection.countDocuments(selectedTabQuery);

        const pipeline = [
            { $match: selectedTabQuery },
            {
                $addFields: {
                    convertedNgayPhanHoi: {
                        $cond: {
                            if: { $ne: ["$response.ngay_phan_hoi", null] },
                            then: { $toDate: "$response.ngay_phan_hoi" },
                            else: null,
                        },
                    },
                },
            },
            {
                $sort: {
                    convertedNgayPhanHoi: -1,
                    "response.ngay_phan_hoi": -1,
                },
            },
            { $skip: (parsedPage - 1) * parsedPageSize },
            { $limit: parsedPageSize },
            {
                $project: {
                    response: 1,
                    responseId: 1,
                    keysJSON: "$response.keysJSON",
                    watching: "$response.watching",
                },
            },
        ];

        const answers = await answerDetailsCollection.aggregate(pipeline).toArray();

        const keysToMatch = [...new Set(answers.map(answer => answer.response.keysJSON).filter(Boolean))];

        const checklistsComposer = await checklistCollection
            .find({ keys: { $in: keysToMatch } })
            .toArray();

        const checklistMap = new Map();
        checklistsComposer.forEach(checklist => {
            if (checklist.keys) checklistMap.set(checklist.keys, checklist);
        });

        const allDataCautraloi = answers.map(answer => {
            const { questions, contentTitle, statusHistory, pointConfigNangCao, ConfigPoints, historyCheck, DapAn, rankings, Cauhinhdiem, versions, khach, demcauhoi, solanlaplai, ...responseWithoutQuestionsAndContentTitle } = answer.response;
            const keysJSONFromAnswer = answer.response.keysJSON || "";
            const checklist = checklistMap.get(keysJSONFromAnswer);

            const matchedUserData = {
                name: checklist?.name || answer.response.nguoiphanhoi || "Không xác định",
                imgAvatar: checklist?.imgAvatar || null,
                username: checklist?.username || answer.response.nguoiphanhoi || "Không xác định",
                imgBackground: checklist?.imgBackground || null,
                locker: checklist?.locker ?? false,
                keys: checklist?.keys || keysJSONFromAnswer || "Không xác định",
                email: checklist?.email || "",
                chucvu: checklist?.chucvu || "Chưa cập nhật",
                chinhanh: checklist?.chinhanh || answer.response.chi_nhanh || "Chưa cập nhật",
                bophan: checklist?.bophan || answer.response.phongban || "Chưa cập nhật",
            };

            const result = {
                ...responseWithoutQuestionsAndContentTitle,
                responseId: answer.responseId,
                keysJSON: keysJSONFromAnswer,
                name: matchedUserData.name,
                imgAvatar: matchedUserData.imgAvatar,
                username: matchedUserData.username,
                imgBackground: matchedUserData.imgBackground,
                locker: matchedUserData.locker,
                keys: matchedUserData.keys,
                email: matchedUserData.email,
                chucvu: matchedUserData.chucvu,
                chinhanh: matchedUserData.chinhanh,
                bophan: matchedUserData.bophan,
                watching: answer.watching || [],
            };

            if (userKeys && userKeys !== 'all') {
                delete result.chi_nhanh;
                delete result.nguoiphanhoi;
                delete result.phongban;
            }

            return result;
        });

        res.status(200).json({
            success: true,
            data: allDataCautraloi,
            total,
            page: parsedPage,
            pageSize: parsedPageSize,
            counts,
        });
    } catch (error) {
        console.error(`Error fetching DataCautraloi: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
};