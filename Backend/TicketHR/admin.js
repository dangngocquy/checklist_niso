const { connectDB } = require('../MongoDB/database');
const moment = require('moment');

// Hàm đảm bảo tạo các index cho hiệu suất truy vấn
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

// Gọi hàm tạo index khi khởi động
ensureIndexes();

// API lấy tất cả yêu cầu
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

    // Xây dựng truy vấn cơ bản
    const baseQuery = {
      "response.versions": "v1.0.1",
      "response.yeucauxuly": true, // Chỉ lấy các yêu cầu có yeucauxuly: true
    };

    if (startDate || endDate) {
      const dateQuery = {};
      if (startDate) {
        const start = moment(startDate, 'DD-MM-YYYY').startOf('day').toDate();
        dateQuery.$gte = start;
      }
      if (endDate) {
        const end = moment(endDate, 'DD-MM-YYYY').endOf('day').toDate();
        dateQuery.$lte = end;
      }
      baseQuery.$or = [
        { "response.submittedAt": dateQuery },
        { "response.ngay_phan_hoi": dateQuery },
      ];
    }
    if (keysJSON) {
      const keysArray = Array.isArray(keysJSON) ? keysJSON : keysJSON.split(',').map(key => key.trim());
      baseQuery["response.keysJSON"] = { $in: keysArray };
    }
    if (title) baseQuery["response.title"] = { $regex: new RegExp(title, 'i') };
    if (chiNhanh) baseQuery["response.chi_nhanh"] = { $regex: new RegExp(chiNhanh, 'i') };
    if (phongBan) baseQuery["response.phongban"] = { $regex: new RegExp(phongBan, 'i') };
    if (userKeys && userKeys !== 'all') {
      const userKeysArray = Array.isArray(userKeys) ? userKeys : userKeys.split(',').map(key => key.trim());
      baseQuery["response.keysJSON"] = { $in: userKeysArray };
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

    // Xây dựng truy vấn theo tab
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
      },
      overdue: {
        ...baseQuery,
        "response.thoigianxuly": {
          $lte: moment().toDate(),
        },
        "response.trangthai": { $ne: 'Hoàn tất' },
      },
      completed: {
        ...baseQuery,
        "response.trangthai": 'Hoàn tất',
      },
    };

    // Tính số lượng cho các tab (chỉ tính các mục chưa xem)
    const counts = {};
    for (const [tabName, query] of Object.entries(tabQueries)) {
      counts[tabName] = await answerDetailsCollection.countDocuments({
        ...query,
        "response.watching": { $nin: [user.keys] },
      });
    }

    // Tính tổng số bản ghi cho tab được chọn
    const selectedTabQuery = tabQueries[tab] || tabQueries.assigned;
    const total = await answerDetailsCollection.countDocuments(selectedTabQuery);

    // Pipeline tổng hợp dữ liệu chính
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

    // Thực thi pipeline
    const answers = await answerDetailsCollection.aggregate(pipeline).toArray();

    // Lấy danh sách keysJSON duy nhất
    const keysToMatch = [...new Set(answers.map(answer => answer.response.keysJSON).filter(Boolean))];

    // Truy vấn checklist
    const checklistsComposer = await checklistCollection
      .find({ keys: { $in: keysToMatch } })
      .toArray();

    // Tạo map để tra cứu checklist
    const checklistMap = checklistsComposer.reduce((map, checklist) => {
      map[checklist.keys] = checklist;
      return map;
    }, {});

    const allDataCautraloi = answers.map(answer => {
      const { questions, contentTitle, statusHistory, pointConfigNangCao, ConfigPoints, historyCheck, DapAn, rankings, Cauhinhdiem, versions, khach, demcauhoi, solanlaplai, ...responseWithoutQuestionsAndContentTitle } = answer.response;
      const keysJSONFromAnswer = answer.response.keysJSON || "";
      const checklist = checklistMap[keysJSONFromAnswer];

      // Đảm bảo tất cả các trường đều có giá trị hợp lý, ưu tiên username từ checklist
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

      // Loại bỏ các trường không cần thiết nếu userKeys không phải 'all'
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
    console.error(`Error fetching DataCautraloi: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

// API lấy số lượng và dữ liệu phản hồi
exports.GetResponseCountsAndData = async (req, res) => {
  const {
    page = 1,
    pageSize = 6,
    startDate,
    endDate,
    keysJSON,
    title,
    chiNhanh,
    phongBan,
    userKeys,
    trangthai,
  } = req.query;

  const parsedPage = parseInt(page) || 1;
  const parsedPageSize = parseInt(pageSize) || 6;

  try {
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');

    const user = req.query.user ? JSON.parse(req.query.user) : {};

    // Xây dựng truy vấn cơ bản
    const baseQuery = {
      "response.versions": "v1.0.1",
      "response.watching": { $nin: [user.keys] },
      "response.trangthai": { $ne: 'Hoàn tất' },
      "response.yeucauxuly": true, // Chỉ lấy các yêu cầu có yeucauxuly: true
    };

    if (startDate || endDate) {
      const dateQuery = {};
      if (startDate) {
        const start = moment(startDate, 'DD-MM-YYYY').startOf('day').toDate();
        dateQuery.$gte = start;
      }
      if (endDate) {
        const end = moment(endDate, 'DD-MM-YYYY').endOf('day').toDate();
        dateQuery.$lte = end;
      }
      baseQuery.$or = [
        { "response.submittedAt": dateQuery },
        { "response.ngay_phan_hoi": dateQuery },
      ];
    }
    if (keysJSON) {
      const keysArray = Array.isArray(keysJSON) ? keysJSON : keysJSON.split(',').map(key => key.trim());
      baseQuery["response.keysJSON"] = { $in: keysArray };
    }
    if (title) baseQuery["response.title"] = { $regex: new RegExp(title, 'i') };
    if (chiNhanh) baseQuery["response.chi_nhanh"] = { $regex: new RegExp(chiNhanh, 'i') };
    if (phongBan) baseQuery["response.phongban"] = { $regex: new RegExp(phongBan, 'i') };
    if (userKeys && userKeys !== 'all') {
      const keysArray = Array.isArray(userKeys) ? userKeys : userKeys.split(',').map(key => key.trim());
      baseQuery["response.keysJSON"] = { $in: userKeysArray };
    }
    if (trangthai) {
      baseQuery["response.trangthai"] = trangthai;
    }

    // Xây dựng truy vấn theo tab
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
      },
      overdue: {
        ...baseQuery,
        "response.thoigianxuly": {
          $lte: moment().toDate(),
        },
        "response.trangthai": { $ne: 'Hoàn tất' },
      },
    };

    // Tính số lượng cho các tab
    const counts = {};
    for (const [tabName, query] of Object.entries(tabQueries)) {
      counts[tabName] = await answerDetailsCollection.countDocuments(query);
    }

    // Tính tổng số bản ghi
    const total = await answerDetailsCollection.countDocuments(baseQuery);

    // Pipeline tổng hợp dữ liệu chính
    const pipeline = [
      { $match: baseQuery },
      {
        $addFields: {
          statusOrder: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $lte: ["$response.thoigianxuly", moment().toDate()] },
                      { $ne: ["$response.trangthai", 'Hoàn tất'] },
                    ],
                  },
                  then: 1,
                },
                {
                  case: {
                    $or: [
                      { $eq: ["$response.accounts", user.keys] },
                      { $eq: ["$response.bophanADS", user.bophan] },
                      { $eq: ["$response.cuahang", user.chinhanh] },
                    ],
                  },
                  then: 2,
                },
                {
                  case: { $in: ["$response.trangthai", [null, 'Chờ xử lý']] },
                  then: 3,
                },
              ],
              default: 4,
            },
          },
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
          statusOrder: 1,
          convertedNgayPhanHoi: -1,
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
          statusOrder: 1,
        },
      },
    ];

    // Thực thi pipeline
    const answers = await answerDetailsCollection.aggregate(pipeline).toArray();

    // Lấy danh sách keysJSON duy nhất
    const keysToMatch = [...new Set(answers.map(answer => answer.response.keysJSON).filter(Boolean))];

    // Truy vấn checklist
    const checklistsComposer = await checklistCollection
      .find({ keys: { $in: keysToMatch } })
      .toArray();

    // Tạo map để tra cứu checklist
    const checklistMap = checklistsComposer.reduce((map, checklist) => {
      map[checklist.keys] = checklist;
      return map;
    }, {});

    // Xử lý dữ liệu phản hồi
    const allDataCautraloi = answers.map(answer => {
      const { questions, contentTitle, ...responseWithoutQuestionsAndContentTitle } = answer.response;
      const keysJSONFromAnswer = answer.response.keysJSON || "";
      const checklist = checklistMap[keysJSONFromAnswer];

      // Đảm bảo tất cả các trường đều có giá trị hợp lý, ưu tiên username từ checklist
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

      // Xác định trạng thái
      let status;
      if (
        answer.response.thoigianxuly &&
        new Date(answer.response.thoigianxuly) <= moment().toDate() &&
        answer.response.trangthai !== 'Hoàn tất'
      ) {
        status = 'overdue';
      } else if (
        answer.response.accounts === user.keys ||
        answer.response.bophanADS === user.bophan ||
        answer.response.cuahang === user.chinhanh
      ) {
        status = 'assigned';
      } else if (!answer.response.trangthai || answer.response.trangthai === 'Chờ xử lý') {
        status = 'pending';
      } else {
        status = 'unknown';
      }

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
        status,
      };

      // Loại bỏ các trường không cần thiết nếu userKeys không phải 'all'
      if (userKeys && userKeys !== 'all') {
        // Giữ lại username, name, imgAvatar để hiển thị trong UserInfoCard
        delete result.chi_nhanh;
        delete result.nguoiphanhoi;
        delete result.phongban;
      }

      return result;
    });

    res.status(200).json({
      success: true,
      data: allDataCautraloi,
      counts,
      total,
      page: parsedPage,
      pageSize: parsedPageSize,
    });
  } catch (error) {
    console.error(`Error fetching ResponseCountsAndData: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};