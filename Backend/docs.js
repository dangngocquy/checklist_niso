const { connectDB } = require('./MongoDB/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const parseAndFormatDate = (dateStr) => {
  if (!dateStr) return moment().format('DD-MM-YYYY HH:mm:ss');
  return moment(dateStr, ['DD-MM-YYYY HH:mm:ss', 'DD/MM/YYYY HH:mm:ss']).isValid()
    ? moment(dateStr, ['DD-MM-YYYY HH:mm:ss', 'DD/MM/YYYY HH:mm:ss']).format('DD-MM-YYYY HH:mm:ss')
    : moment().format('DD-MM-YYYY HH:mm:ss');
};

const parseDate = (dateStr) => {
  if (!dateStr) return new Date(0);
  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('-').map(Number);
  const [hours, minutes, seconds] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];
  return new Date(year, month - 1, day, hours, minutes, seconds);
};

// 1. Thêm checklist mới
exports.PostDocs = async (req, res) => {
  const {
    title, contentTitle, date, questions, cautraloi, everyquyen, background, solanlaplai,
    colorNen, nhap, account, hinhanh, taptin, phongban, khach, demcauhoi, yeucauxuly, threeimg, sqlsend,
    userKeys, dateBookmark, keysJSON, bophanADS, cuahang, usersview, departmentsview, restaurantsview, Dapanview
  } = req.body;

  const formattedDate = parseAndFormatDate(date);
  const checklistId = uuidv4();

  try {
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const questionCollection = await connectDB('CHECKLIST_QUESTION');
    const detailsCollection = await connectDB('CHECKLIST_DETAILS');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');

    const userExists = await checklistCollection.findOne({ keys: userKeys });
    if (!userExists) {
      return res.status(400).json({ message: `User với keys ${userKeys} không tồn tại trong CHECKLIST_DATABASE` });
    }

    const titleExists = userExists.DataChecklist && userExists.DataChecklist.some(doc => doc.title === title);
    if (titleExists) {
      console.warn(`Checklist với title "${title}" đã tồn tại cho user ${userKeys}, bỏ qua`);
      return res.status(409).json({ message: `Checklist với title "${title}" đã tồn tại` });
    }

    const newChecklist = {
      id: checklistId,
      background,
      title,
      contentTitle,
      date: formattedDate,
      everyquyen,
      colorNen,
      nhap,
      demcauhoi,
      solanlaplai,
      threeimg,
      sqlsend,
      yeucauxuly,
      phongban,
      account,
      hinhanh,
      taptin,
      keysJSON,
      khach,
      save: [],
      dateBookmark: dateBookmark ? parseAndFormatDate(dateBookmark) : null,
      TimeSaveNhap: nhap ? moment().format('DD-MM-YYYY HH:mm:ss') : null,
      bophanADS: bophanADS || [],
      cuahang: cuahang || [],
      Dapanview,
      usersview: usersview || [], // Added usersview
      departmentsview: departmentsview || [], // Added departmentsview
      restaurantsview: restaurantsview || [], // Added restaurantsview
      visionCreate: "v1.0.1"
    };

    const checklistQuestions = questions
      .filter(q => q !== '')
      .map((question, index) => ({
        checklistId,
        questionId: uuidv4(),
        question: { ...question, index }
      }));

    const checklistDetails = { checklistId };

    const answerDetails = cautraloi && cautraloi.length > 0
      ? cautraloi.map(response => ({
        checklistId,
        responseId: uuidv4(),
        response: { ...response, submittedAt: moment().format('DD-MM-YYYY HH:mm:ss') }
      }))
      : [];

    const answerQuestions = answerDetails.flatMap(answer => {
      if (answer.response.questions && Array.isArray(answer.response.questions)) {
        return answer.response.questions.map((question, index) => ({
          checklistId,
          responseId: answer.responseId,
          questionId: uuidv4(),
          question: { ...question, index }
        }));
      }
      return [];
    });

    await checklistCollection.updateOne(
      { keys: userKeys },
      { $push: { DataChecklist: newChecklist } },
      { upsert: true }
    );

    if (checklistQuestions.length > 0) {
      await questionCollection.insertMany(checklistQuestions);
    }
    await detailsCollection.insertOne(checklistDetails);

    if (answerDetails.length > 0) {
      const cleanedAnswerDetails = answerDetails.map(({ response, ...rest }) => {
        const { questions, ...responseWithoutQuestions } = response;
        return { ...rest, response: responseWithoutQuestions };
      });
      await answerDetailsCollection.insertMany(cleanedAnswerDetails);
    }

    if (answerQuestions.length > 0) {
      await answerQuestionCollection.insertMany(answerQuestions);
    }

    res.status(200).json({ id: checklistId });
  } catch (error) {
    console.error('Error adding document:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// 2. Kiểm tra tiêu đề tồn tại
exports.CheckTitleExists = async (req, res) => {
  const { title, keysJSON, checklistId } = req.query;
  try {
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const user = await checklistCollection.findOne({ keys: keysJSON });

    if (!user || !user.DataChecklist) {
      return res.status(200).json({ exists: false });
    }

    const titleExists = user.DataChecklist.some(
      (doc) => doc.title.toLowerCase() === title.toLowerCase() && (!checklistId || doc.id !== checklistId)
    );
    res.status(200).json({ exists: titleExists });
  } catch (error) {
    console.error('Error checking title:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 3. Lấy thông tin người dùng theo keys
exports.GetUserByKeys = async (req, res) => {
  const { keys } = req.params;
  try {
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const userDoc = await checklistCollection.findOne({ keys });
    if (userDoc) {
      res.json({
        keys: userDoc.keys || null,
        name: userDoc.name || 'Unknown',
        imgAvatar: userDoc.imgAvatar || null,
        bophan: userDoc.bophan || 'Unknown',
        chinhanh: userDoc.chinhanh || 'Unknown',
        username: userDoc.username || 'N/A',
        imgBackground: userDoc.imgBackground,
        email: userDoc.email || 'N/A',
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error retrieving user:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 4. Lấy checklist khớp điều kiện
exports.GetMatchingChecklists = async (req, res) => {
  const parseDate = (dateString) => {
    if (!dateString) return new Date(0);
    const [day, month, yearAndTime] = dateString.split("-");
    const [year, time] = yearAndTime.split(" ");
    return new Date(`${year}-${month}-${day}T${time}`);
  };

  const { userKeys, bophan, chinhanh, page = 1, limit = 6 } = req.query;

  if (!userKeys) {
    return res.status(400).json({ message: 'Thiếu thông tin userKeys' });
  }

  const parsedPage = parseInt(page) || 1;
  const parsedLimit = parseInt(limit) || 6;
  const skip = (parsedPage - 1) * parsedLimit;

  try {
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const questionCollection = await connectDB('CHECKLIST_QUESTION');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');

    const users = await checklistCollection.find({ "DataChecklist": { $exists: true } }).toArray();

    const matchingChecklists = users.flatMap(userDoc => {
      if (!userDoc.DataChecklist || !Array.isArray(userDoc.DataChecklist)) return [];

      return userDoc.DataChecklist.filter(doc => {
        const everyquyen = doc.everyquyen === true ? "Công khai" :
          doc.everyquyen === false ? "Nội bộ" :
            doc.everyquyen || "Riêng tư";

        if (everyquyen === "Công khai") {
          return true;
        }

        if (everyquyen === "Riêng tư") {
          return doc.keysJSON === userKeys;
        }

        const keysMatch = doc.account && Array.isArray(doc.account) && doc.account.includes(userKeys);
        const bophanMatch = bophan && doc.bophanADS && Array.isArray(doc.bophanADS) && doc.bophanADS.includes(bophan);
        const chinhanhMatch = chinhanh && doc.cuahang && Array.isArray(doc.cuahang) && doc.cuahang.includes(chinhanh);

        return keysMatch || (bophan && bophanMatch) || (chinhanh && chinhanhMatch);
      }).map(async (doc) => {
        const matchedUser = {
          keys: userDoc.keys || null,
          name: userDoc.name || 'Unknown',
          imgAvatar: userDoc.imgAvatar || null,
          bophan: userDoc.bophan || 'Unknown',
          chinhanh: userDoc.chinhanh || 'Unknown',
          username: userDoc.username || "N/A",
          imgBackground: userDoc.imgBackground || null,
          locker: userDoc.locker || false,
          email: userDoc.email || null,
          chucvu: userDoc.chucvu || null,
        };
        const { contentTitle, questions, ...filteredDoc } = doc;
        const questionCount = await questionCollection.countDocuments({ checklistId: doc.id });
        const answerDetailsDocs = await answerDetailsCollection.find({ checklistId: doc.id }).toArray();
        return {
          ...filteredDoc,
          user: matchedUser,
          publicAccess: doc.everyquyen === true ? "Công khai" :
            doc.everyquyen === false ? "Nội bộ" :
              doc.everyquyen || "Riêng tư",
          usersview: doc.usersview || [],
          departmentsview: doc.departmentsview || [],
          restaurantsview: doc.restaurantsview || [],
          questionCount,
          responseCount: answerDetailsDocs.length
        };
      });
    });

    const resolvedChecklists = await Promise.all(matchingChecklists);

    resolvedChecklists.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return dateB - dateA;
    });

    const totalItems = resolvedChecklists.length;
    const paginatedData = resolvedChecklists.slice(skip, skip + parsedLimit);

    res.status(200).json({
      data: paginatedData,
      totalItems: totalItems,
      currentPage: parsedPage,
      totalPages: Math.ceil(totalItems / parsedLimit),
      hasMore: skip + parsedLimit < totalItems
    });
  } catch (error) {
    console.error('Error fetching matching checklists:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 5. Lấy tất cả checklist với phân trang
exports.GetAllChecklistsCustom = async (req, res) => {
  const { page = 1, limit = 6, bophan = '', title = '', userKeys } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const questionCollection = await connectDB('CHECKLIST_QUESTION');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');

    const users = await checklistCollection.find({ "DataChecklist": { $exists: true } }).toArray();

    let allData = users.flatMap(userDoc => {
      if (!userDoc.DataChecklist || !Array.isArray(userDoc.DataChecklist)) return [];

      return userDoc.DataChecklist.filter(doc => !doc.nhap).map(doc => {
        const matchedUser = {
          keys: userDoc.keys || null,
          name: userDoc.name || 'Unknown',
          imgAvatar: userDoc.imgAvatar || null,
          bophan: userDoc.bophan || 'Unknown',
          chinhanh: userDoc.chinhanh || 'Unknown',
          username: userDoc.username || "N/A",
          imgBackground: userDoc.imgBackground || null,
          locker: userDoc.locker || false,
          email: userDoc.email || null,
          chucvu: userDoc.chucvu || null,
        };
        const { contentTitle, questions, ...filteredDoc } = doc;

        if (userKeys && doc.keysJSON !== userKeys) return null;

        return {
          ...filteredDoc,
          user: matchedUser,
          everyquyen: doc.everyquyen === true ? "Công khai" :
            doc.everyquyen === false ? "Nội bộ" :
              doc.everyquyen || "Riêng tư",
          usersview: doc.usersview || [],
          departmentsview: doc.departmentsview || [],
          restaurantsview: doc.restaurantsview || []
        };
      }).filter(doc => doc !== null);
    });

    if (bophan) {
      allData = allData.filter(doc =>
        doc.user.bophan.toLowerCase() === bophan.toLowerCase()
      );
    }

    if (title) {
      allData = allData.filter(doc =>
        doc.title.toLowerCase().includes(title.toLowerCase())
      );
    }

    allData.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return dateB - dateA;
    });

    const totalItems = allData.length;
    const totalPages = Math.ceil(totalItems / parseInt(limit));

    const paginatedData = allData.slice(skip, skip + parseInt(limit));

    const enrichedData = await Promise.all(paginatedData.map(async (doc) => {
      const questionCount = await questionCollection.countDocuments({ checklistId: doc.id });
      const answerDetailsDocs = await answerDetailsCollection.find({ checklistId: doc.id }).toArray();
      return {
        ...doc,
        questionCount,
        responseCount: answerDetailsDocs.length
      };
    }));

    res.json({
      data: enrichedData,
      currentPage: parseInt(page),
      totalPages,
      totalItems,
      hasMore: parseInt(page) < totalPages
    });
  } catch (error) {
    console.error('Error fetching custom checklists:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 6. Lấy tất cả checklist với bộ lọc
exports.GetAllDocs = async (req, res) => {
  const {
    page = 1, limit = 'all', title, creator, bophan, status, chinhanh,
    startDate, endDate, viewType, userKeys
  } = req.query;

  try {
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const questionCollection = await connectDB('CHECKLIST_QUESTION');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');

    const users = await checklistCollection.find({ "DataChecklist": { $exists: true } }).toArray();

    let allData = users.flatMap(async (userDoc) => {
      if (!userDoc.DataChecklist || !Array.isArray(userDoc.DataChecklist)) return [];

      return Promise.all(userDoc.DataChecklist.filter(doc => !doc.nhap).map(async (doc) => {
        const matchedUser = {
          keys: userDoc.keys || null,
          name: userDoc.name,
          imgAvatar: userDoc.imgAvatar || null,
          bophan: userDoc.bophan,
          username: userDoc.username,
          chinhanh: userDoc.chinhanh,
          email: userDoc.email || null,
          chucvu: userDoc.chucvu || null,
        };

        // Truy vấn thông tin người chỉnh sửa (nếu có)
        let editorUser = null;
        if (doc.nguoichinhsua) {
          const editorDoc = await checklistCollection.findOne({ keys: doc.nguoichinhsua });
          if (editorDoc) {
            editorUser = {
              keys: editorDoc.keys || null,
              name: editorDoc.name || 'Unknown',
              imgAvatar: editorDoc.imgAvatar || null,
              bophan: editorDoc.bophan || 'Unknown',
              username: editorDoc.username || 'N/A',
              chinhanh: editorDoc.chinhanh || 'Unknown',
              email: editorDoc.email || null,
              chucvu: editorDoc.chucvu || null,
            };
          }
        }

        if (viewType === 'checklist' && userKeys && doc.keysJSON !== userKeys) return null;

        const { contentTitle, questions, ...filteredDoc } = doc;
        return {
          ...filteredDoc,
          user: matchedUser, // Người tạo
          editor: editorUser, // Người chỉnh sửa
          everyquyen: doc.everyquyen === true ? "Công khai" :
            doc.everyquyen === false ? "Nội bộ" :
              doc.everyquyen || "Riêng tư",
          usersview: doc.usersview || [],
          departmentsview: doc.departmentsview || [],
          restaurantsview: doc.restaurantsview || [],
          pointConfig: doc.pointConfig || [],
          pointConfigNangCao: doc.pointConfigNangCao || []
        };
      })).then(results => results.filter(doc => doc !== null));
    });

    allData = (await Promise.all(allData)).flat();

    let filteredData = allData;
    if (title) filteredData = filteredData.filter(doc => doc.title?.toLowerCase().includes(title.toLowerCase()));
    if (creator) filteredData = filteredData.filter(doc => doc.user?.name?.toLowerCase().includes(creator.toLowerCase()));
    if (bophan) filteredData = filteredData.filter(doc => doc.user?.bophan?.toLowerCase().includes(bophan.toLowerCase()));
    if (status) filteredData = filteredData.filter(doc => (doc.locktitle ? 'Tạm khóa' : 'Đang hoạt động') === status);
    if (chinhanh) filteredData = filteredData.filter(doc => doc.user?.chinhanh?.toLowerCase().includes(chinhanh.toLowerCase()));
    if (startDate && endDate) {
      const start = new Date(startDate.split('-').reverse().join('-'));
      const end = new Date(endDate.split('-').reverse().join('-'));
      filteredData = filteredData.filter(doc => {
        const itemDate = parseDate(doc.date);
        return itemDate >= start && itemDate <= end;
      });
    }

    filteredData.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return dateB - dateA;
    });

    const totalItems = filteredData.length;

    if (limit === 'all' && !req.query.page) {
      const enrichedData = await Promise.all(filteredData.map(async (doc) => {
        const questionCount = await questionCollection.countDocuments({ checklistId: doc.id });
        const answerDetailsDocs = await answerDetailsCollection.find({ checklistId: doc.id }).toArray();
        return {
          ...doc,
          questionCount,
          responseCount: answerDetailsDocs.length
        };
      }));
      return res.json({ data: enrichedData, totalItems });
    }

    const parsedLimit = parseInt(limit) || 6;
    const totalPages = Math.ceil(totalItems / parsedLimit);
    const startIndex = (page - 1) * parsedLimit;
    const paginatedData = filteredData.slice(startIndex, startIndex + parsedLimit);

    const enrichedData = await Promise.all(paginatedData.map(async (doc) => {
      const questionCount = await questionCollection.countDocuments({ checklistId: doc.id });
      const answerDetailsDocs = await answerDetailsCollection.find({ checklistId: doc.id }).toArray();
      return {
        ...doc,
        questionCount,
        responseCount: answerDetailsDocs.length
      };
    }));

    res.json({
      data: enrichedData,
      currentPage: parseInt(page),
      totalPages,
      totalItems,
    });
  } catch (error) {
    console.error('Error reading documents:', error);
    res.status(500).json({ data: [], message: 'Internal Server Error' });
  }
};

// 7. Xóa checklist
exports.DeleteDoc = async (req, res) => {
  const { id } = req.params;
  try {
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const questionCollection = await connectDB('CHECKLIST_QUESTION');
    const detailsCollection = await connectDB('CHECKLIST_DETAILS');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');

    const checklistResult = await checklistCollection.updateMany(
      { "DataChecklist.id": id },
      { $pull: { DataChecklist: { id } } }
    );

    await questionCollection.deleteMany({ checklistId: id });
    await detailsCollection.deleteOne({ checklistId: id });
    await answerDetailsCollection.deleteMany({ checklistId: id });
    await answerQuestionCollection.deleteMany({ checklistId: id });

    res.status(checklistResult.modifiedCount > 0 ? 200 : 404).json({
      message: checklistResult.modifiedCount > 0 ? 'Xóa checklist thành công.' : 'Checklist đã bị xóa hoặc không tồn tại.'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 8. Xóa nhiều checklist
exports.DeleteMultipleDocs = async (req, res) => {
  const { ids } = req.body;
  try {
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const questionCollection = await connectDB('CHECKLIST_QUESTION');
    const detailsCollection = await connectDB('CHECKLIST_DETAILS');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');

    const checklistResult = await checklistCollection.updateMany(
      { "DataChecklist.id": { $in: ids } },
      { $pull: { DataChecklist: { id: { $in: ids } } } }
    );

    await questionCollection.deleteMany({ checklistId: { $in: ids } });
    await detailsCollection.deleteMany({ checklistId: { $in: ids } });
    await answerDetailsCollection.deleteMany({ checklistId: { $in: ids } });
    await answerQuestionCollection.deleteMany({ checklistId: { $in: ids } });

    const deletedCount = ids.length;
    res.status(checklistResult.modifiedCount > 0 ? 200 : 404).json({
      message: checklistResult.modifiedCount > 0
        ? `Xóa thành công ${deletedCount} mục.`
        : 'Checklist đã bị xóa hoặc không tồn tại.',
      deletedCount
    });
  } catch (error) {
    console.error('Error deleting multiple documents:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 9. Cập nhật checklist
exports.UpdateDoc = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!id || !updateData) {
    return res.status(400).json({ message: 'Thiếu ID checklist hoặc dữ liệu cập nhật' });
  }

  try {
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const questionCollection = await connectDB('CHECKLIST_QUESTION');

    const existingDoc = await checklistCollection.findOne(
      { "DataChecklist.id": id },
      { projection: { keys: 1, DataChecklist: { $elemMatch: { id } } } }
    );

    if (!existingDoc || !existingDoc.DataChecklist.length) {
      return res.status(404).json({ message: 'Checklist không tồn tại hoặc đã bị xóa.' });
    }

    const updateFields = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (key !== 'questions' && value !== undefined) {
        updateFields[`DataChecklist.$.${key}`] = value;
      }
    }
    updateFields['DataChecklist.$.updatedAt'] = moment().format('DD-MM-YYYY HH:mm:ss');

    const checklistResult = await checklistCollection.updateOne(
      { 'DataChecklist.id': id },
      { $set: updateFields }
    );

    if (checklistResult.matchedCount === 0) {
      return res.status(404).json({ message: 'Checklist không tồn tại hoặc đã bị xóa.' });
    }

    if (updateData.questions && Array.isArray(updateData.questions)) {

      const existingQuestions = await questionCollection.find({ checklistId: id }).toArray();
      const existingQuestionsMap = new Map(existingQuestions.map((q) => [q.questionId, q]));

      for (const [index, question] of updateData.questions.entries()) {
        const questionId = question.questionId || uuidv4();
        const existingQuestion = existingQuestionsMap.get(questionId) || {};

        const updatedQuestion = {
          checklistId: id,
          questionId,
          question: {
            ...existingQuestion.question,
            ...question,
            index,
            cautraloi: question.cautraloi !== undefined ? question.cautraloi : existingQuestion.question?.cautraloi || null,
            cautraloimoikhac: question.cautraloimoikhac !== undefined ? question.cautraloimoikhac : existingQuestion.question?.cautraloimoikhac || null,
            tuychonkhac: question.tuychonkhac !== undefined ? question.tuychonkhac : existingQuestion.question?.tuychonkhac || false,
            options: question.options?.map((opt, optIndex) => ({
              tuychon: opt.tuychon || existingQuestion.question?.options?.[optIndex]?.tuychon || '',
              tuychonnhieu: opt.tuychonnhieu || existingQuestion.question?.options?.[optIndex]?.tuychonnhieu || '',
              isCorrect: opt.isCorrect ?? existingQuestion.question?.options?.[optIndex]?.isCorrect ?? false,
            })) || existingQuestion.question?.options || [],
          },
        };

        // Chỉ xóa các key undefined, trừ cautraloi, cautraloimoikhac, tuychonkhac
        Object.keys(updatedQuestion.question).forEach((key) => {
          if (updatedQuestion.question[key] === undefined && !['cautraloi', 'cautraloimoikhac', 'tuychonkhac'].includes(key)) {
            delete updatedQuestion.question[key];
          }
        });

        await questionCollection.updateOne(
          { checklistId: id, questionId },
          { $set: updatedQuestion },
          { upsert: true }
        );
      }

      const newQuestionIds = updateData.questions.map((q) => q.questionId).filter((id) => id);
      await questionCollection.deleteMany({
        checklistId: id,
        questionId: { $nin: newQuestionIds },
      });
    }

    res.status(200).json({
      message: 'Cập nhật thành công.',
      modifiedCount: checklistResult.modifiedCount,
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật checklist:', error);
    res.status(500).json({ message: error.message || 'Lỗi Server Nội Bộ' });
  }
};
// 10. Lấy checklist theo ID
exports.GetDocById = async (req, res) => {
  const { id } = req.params;
  try {
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const questionCollection = await connectDB('CHECKLIST_QUESTION');

    const checklistDoc = await checklistCollection.findOne(
      { "DataChecklist.id": id },
      { projection: { DataChecklist: { $elemMatch: { id } } } }
    );

    if (!checklistDoc || !checklistDoc.DataChecklist.length) {
      return res.status(404).json({ message: 'Checklist không tìm thấy' });
    }

    const checklist = checklistDoc.DataChecklist[0];
    const questions = await questionCollection.find({ checklistId: id }).toArray();

    const formattedChecklist = {
      ...checklist,
      everyquyen: checklist.everyquyen === true ? "Công khai" :
        checklist.everyquyen === false ? "Nội bộ" :
          checklist.everyquyen || "Riêng tư",
      usersview: checklist.usersview || [],
      departmentsview: checklist.departmentsview || [],
      restaurantsview: checklist.restaurantsview || [],
      questions: questions.map(q => ({
        ...q.question,
        questionId: q.questionId,
        cautraloi: q.question.cautraloi || null,
        cautraloimoikhac: q.question.cautraloimoikhac || null,
        tuychonkhac: q.question.tuychonkhac || false
      }))
    };

    res.json(formattedChecklist);
  } catch (error) {
    console.error('Lỗi khi lấy checklist:', error);
    res.status(500).json({ message: 'Lỗi Server Nội Bộ' });
  }
};

// 11. Tạo checklist mới
exports.CreateDoc = async (req, res) => {
  const {
    title,
    contentTitle,
    date,
    questions,
    cautraloi,
    everyquyen,
    background,
    colorNen,
    nhap,
    account,
    hinhanh,
    taptin,
    keysJSON,
    phongban,
    userKeys,
    solanlaplai,
    threeimg,
    yeucauxuly,
    sqlsend,
    bophanADS,
    cuahang,
    usersview,
    Dapanview,
    departmentsview,
    restaurantsview,
  } = req.body;

  const formattedDate = parseAndFormatDate(date);
  const checklistId = uuidv4();

  const newDocument = {
    id: checklistId,
    title,
    contentTitle,
    date: formattedDate,
    everyquyen,
    background,
    colorNen,
    nhap,
    phongban,
    account: account || [],
    hinhanh,
    taptin,
    keysJSON,
    solanlaplai,
    threeimg,
    yeucauxuly,
    sqlsend,
    bophanADS: bophanADS || [],
    cuahang: cuahang || [],
    usersview: usersview || [],
    Dapanview,
    departmentsview: departmentsview || [],
    restaurantsview: restaurantsview || [],
    TimeSaveNhap: nhap ? moment().format('DD-MM-YYYY HH:mm:ss') : null,
    visionCreate: "v1.0.1"
  };

  const checklistQuestions = questions
    .filter((q) => q !== '')
    .map((question, index) => ({
      checklistId,
      questionId: uuidv4(),
      question: {
        ...question,
        index,
        options: question.options
          ? question.options.map((opt) => ({
            tuychon: opt.tuychon || '',
            tuychonnhieu: opt.tuychonnhieu || '',
            isCorrect: opt.isCorrect || false,
          }))
          : [],
      },
    }));

  const checklistDetails = { checklistId };

  const answerDetails =
    cautraloi && cautraloi.length > 0
      ? cautraloi.map((response) => ({
        checklistId,
        responseId: uuidv4(),
        response: { ...response, submittedAt: moment().format('DD-MM-YYYY HH:mm:ss') },
      }))
      : [];

  const answerQuestions = answerDetails.flatMap((answer) => {
    if (answer.response.questions && Array.isArray(answer.response.questions)) {
      return answer.response.questions.map((question, index) => ({
        checklistId,
        responseId: answer.responseId,
        questionId: uuidv4(),
        question: { ...question, index },
      }));
    }
    return [];
  });

  try {
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const questionCollection = await connectDB('CHECKLIST_QUESTION');
    const detailsCollection = await connectDB('CHECKLIST_DETAILS');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');

    await checklistCollection.updateOne(
      { keys: userKeys, DataChecklist: null },
      { $set: { DataChecklist: [] } },
      { upsert: true }
    );

    const result = await checklistCollection.updateOne(
      { keys: userKeys },
      { $push: { DataChecklist: newDocument } }
    );

    if (checklistQuestions.length > 0) {
      await questionCollection.insertMany(checklistQuestions);
    }
    await detailsCollection.insertOne(checklistDetails);

    if (answerDetails.length > 0) {
      const cleanedAnswerDetails = answerDetails.map(({ response, ...rest }) => {
        const { questions, ...responseWithoutQuestions } = response;
        return { ...rest, response: responseWithoutQuestions };
      });
      await answerDetailsCollection.insertMany(cleanedAnswerDetails);
    }

    if (answerQuestions.length > 0) {
      await answerQuestionCollection.insertMany(answerQuestions);
    }

    if (result.modifiedCount > 0 || result.upsertedCount > 0) {
      res.status(201).json({ id: newDocument.id });
    } else {
      res.status(500).json({ message: 'Không thể thêm checklist.' });
    }
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 12. Đồng bộ checklist
exports.SyncChecklist = async (req, res) => {
  const checklists = req.body;
  if (!Array.isArray(checklists)) {
    return res.status(400).json({ message: 'Dữ liệu đầu vào phải là mảng' });
  }

  try {
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const questionCollection = await connectDB('CHECKLIST_QUESTION');
    const detailsCollection = await connectDB('CHECKLIST_DETAILS');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');

    let updatedCount = 0;
    const checklistsToInsert = [];
    const questionsToInsert = [];
    const detailsToUpsert = [];
    const answerDetailsToInsert = [];
    const answerQuestionsToInsert = [];

    for (const checklist of checklists) {
      let keysJSON = checklist.keysJSON;
      if (Array.isArray(keysJSON)) {
        keysJSON = keysJSON.length > 0 ? keysJSON[0] : null;
      }

      if (!keysJSON || typeof keysJSON !== 'string') {
        console.warn('Checklist không có keysJSON hợp lệ, bỏ qua:', checklist);
        continue;
      }

      const existingUser = await checklistCollection.findOne({ keys: keysJSON });
      if (!existingUser) {
        console.warn(`Không tìm thấy user với keysJSON: ${keysJSON}, bỏ qua checklist`);
        continue;
      }

      const checklistId = checklist.id || uuidv4();
      const formattedDate = parseAndFormatDate(checklist.date);
      const newChecklist = {
        id: checklistId,
        ...checklist,
        keysJSON,
        date: formattedDate,
        TimeSaveNhap: checklist.nhap ? moment().format('DD-MM-YYYY HH:mm:ss') : null,
      };

      const checklistQuestions = Array.isArray(checklist.questions)
        ? checklist.questions
          .filter((q) => q && typeof q === 'object')
          .map((question, index) => ({
            checklistId,
            questionId: uuidv4(),
            question: {
              ...question,
              index,
              options: question.options
                ? question.options.map((opt) => ({
                  tuychon: opt.tuychon || '',
                  tuychonnhieu: opt.tuychonnhieu || '',
                  isCorrect: opt.isCorrect || false, // Lưu isCorrect vào cơ sở dữ liệu
                }))
                : [],
            },
          }))
        : [];

      const checklistDetails = { checklistId };

      const answerDetails =
        Array.isArray(checklist.DataCautraloi) && checklist.DataCautraloi.length > 0
          ? checklist.DataCautraloi.map((response) => ({
            checklistId,
            responseId: uuidv4(),
            response: {
              ...response,
              submittedAt: response.submittedAt || moment().format('DD-MM-YYYY HH:mm:ss'),
            },
          }))
          : [];

      const answerQuestions = answerDetails.flatMap((answer) => {
        if (answer.response.questions && Array.isArray(answer.response.questions)) {
          return answer.response.questions.map((question, index) => ({
            checklistId,
            responseId: answer.responseId,
            questionId: uuidv4(),
            question: { ...question, index },
          }));
        }
        return [];
      });

      const exists = await checklistCollection.findOne({
        keys: keysJSON,
        'DataChecklist.id': checklistId,
      });

      if (!exists) {
        checklistsToInsert.push({ keys: keysJSON, checklist: newChecklist });
        if (checklistQuestions.length > 0) questionsToInsert.push(...checklistQuestions);
        detailsToUpsert.push(checklistDetails);

        if (answerDetails.length > 0) {
          const cleanedAnswerDetails = answerDetails.map(({ response, ...rest }) => {
            const { questions, ...responseWithoutQuestions } = response;
            return { ...rest, response: responseWithoutQuestions };
          });
          answerDetailsToInsert.push(...cleanedAnswerDetails);
        }

        if (answerQuestions.length > 0) answerQuestionsToInsert.push(...answerQuestions);
        updatedCount++;
      }
    }

    if (checklistsToInsert.length > 0) {
      await Promise.all(
        checklistsToInsert.map(({ keys, checklist }) =>
          checklistCollection.updateOne(
            { keys },
            { $push: { DataChecklist: checklist } },
            { upsert: true }
          )
        )
      );

      if (questionsToInsert.length > 0) {
        await questionCollection.insertMany(questionsToInsert);
      }

      if (detailsToUpsert.length > 0) {
        await Promise.all(
          detailsToUpsert.map((details) =>
            detailsCollection.updateOne(
              { checklistId: details.checklistId },
              { $set: details },
              { upsert: true }
            )
          )
        );
      }

      if (answerDetailsToInsert.length > 0) {
        await answerDetailsCollection.insertMany(answerDetailsToInsert);
      }

      if (answerQuestionsToInsert.length > 0) {
        await answerQuestionCollection.insertMany(answerQuestionsToInsert);
      }
    }

    res.status(200).json({
      message: `Đã đồng bộ thành công ${updatedCount} checklist.`,
      updatedCount,
    });
  } catch (error) {
    console.error('Error syncing checklists:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 13. Lấy checklist của người dùng
exports.GetUserChecklists = async (req, res) => {
  const { userKeys, page = 1, pageSize = 5, title, status, startDate, endDate } = req.query;
  const parsedPage = parseInt(page) || 1;
  const parsedPageSize = parseInt(pageSize) || 5;

  try {
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const questionCollection = await connectDB('CHECKLIST_QUESTION');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');

    const pipeline = [
      { $match: { keys: userKeys } },
      { $unwind: "$DataChecklist" },
      { $match: { "DataChecklist.nhap": { $ne: true } } }
    ];

    if (title) {
      pipeline.push({ $match: { "DataChecklist.title": { $regex: title, $options: "i" } } });
    }

    if (status) {
      const isLocked = status === 'Tạm khóa';
      pipeline.push({ $match: { "DataChecklist.locktitle": isLocked } });
    }

    if (startDate && endDate) {
      const start = new Date(startDate.split('-').reverse().join('-'));
      const end = new Date(endDate.split('-').reverse().join('-'));
      pipeline.push({
        $match: {
          $expr: {
            $and: [
              { $ne: ["$DataChecklist.date", null] },
              { $gte: [{ $toDate: "$DataChecklist.date" }, start] },
              { $lte: [{ $toDate: "$DataChecklist.date" }, end] }
            ]
          }
        }
      });
    }

    pipeline.push({
      $lookup: {
        from: "CHECKLIST_QUESTION",
        localField: "DataChecklist.id",
        foreignField: "checklistId",
        as: "checklistQuestions"
      }
    });

    pipeline.push({
      $lookup: {
        from: "ANSWER_DETAILS",
        localField: "DataChecklist.id",
        foreignField: "checklistId",
        as: "answerDetails"
      }
    });

    pipeline.push({
      $project: {
        _id: 0,
        id: "$DataChecklist.id",
        title: "$DataChecklist.title",
        contentTitle: "$DataChecklist.contentTitle",
        date: "$DataChecklist.date",
        everyquyen: {
          $cond: {
            if: { $eq: ["$DataChecklist.everyquyen", true] },
            then: "Công khai",
            else: {
              $cond: {
                if: { $eq: ["$DataChecklist.everyquyen", false] },
                then: "Nội bộ",
                else: { $ifNull: ["$DataChecklist.everyquyen", "Riêng tư"] }
              }
            }
          }
        },
        background: "$DataChecklist.background",
        colorNen: "$DataChecklist.colorNen",
        nhap: "$DataChecklist.nhap",
        phongban: "$DataChecklist.phongban",
        account: "$DataChecklist.account",
        hinhanh: "$DataChecklist.hinhanh",
        taptin: "$DataChecklist.taptin",
        save: "$DataChecklist.save",
        dateBookmark: "$DataChecklist.dateBookmark",
        TimeSaveNhap: "$DataChecklist.TimeSaveNhap",
        locktitle: "$DataChecklist.locktitle",
        solanlaplai: "$DataChecklist.solanlaplai",
        threeimg: "$DataChecklist.threeimg",
        yeucauxuly: "$DataChecklist.yeucauxuly",
        sqlsend: "$DataChecklist.sqlsend",
        bophanADS: "$DataChecklist.bophanADS",
        cuahang: "$DataChecklist.cuahang",
        usersview: { $ifNull: ["$DataChecklist.usersview", []] },
        Dapanview: "$DataChecklist.Dapanview",
        departmentsview: { $ifNull: ["$DataChecklist.departmentsview", []] },
        restaurantsview: { $ifNull: ["$DataChecklist.restaurantsview", []] },
        responseCount: { $size: { $ifNull: ["$answerDetails", []] } },
        questionCount: { $size: { $ifNull: ["$checklistQuestions", []] } },
        userName: "$name",
        userAvatar: "$imgAvatar",
        userBophan: "$bophan",
        userChinhanh: "$chinhanh"
      }
    });

    pipeline.push({
      $sort: {
        "dateBookmark": -1,
        "TimeSaveNhap": -1,
        "date": -1
      }
    });

    const countPipeline = [...pipeline];
    countPipeline.push({ $count: "totalItems" });
    const countResult = await checklistCollection.aggregate(countPipeline).toArray();
    const totalItems = countResult.length > 0 ? countResult[0].totalItems : 0;

    pipeline.push({ $skip: (parsedPage - 1) * parsedPageSize });
    pipeline.push({ $limit: parsedPageSize });

    const results = await checklistCollection.aggregate(pipeline).toArray();

    res.json({
      data: results,
      totalItems,
      currentPage: parsedPage,
      totalPages: Math.ceil(totalItems / parsedPageSize)
    });
  } catch (error) {
    console.error('Error fetching user checklists:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// 14. Lấy danh sách checklist đã lưu
exports.GetChecklistSave = async (req, res) => {
  const { userKeys, page = 1, title } = req.query;
  const parsedPage = parseInt(page) || 1;
  const pageSize = 6;

  try {
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const questionCollection = await connectDB('CHECKLIST_QUESTION');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');

    const pipeline = [
      { $unwind: "$DataChecklist" },
      { $match: { "DataChecklist.nhap": { $ne: true } } },
      { $match: { "DataChecklist.bookmark": userKeys } },
    ];

    if (title) {
      pipeline.push({ $match: { "DataChecklist.title": { $regex: title, $options: "i" } } });
    }

    pipeline.push({
      $lookup: {
        from: "CHECKLIST_QUESTION",
        localField: "DataChecklist.id",
        foreignField: "checklistId",
        as: "checklistQuestions"
      }
    });

    pipeline.push({
      $lookup: {
        from: "ANSWER_DETAILS",
        localField: "DataChecklist.id",
        foreignField: "checklistId",
        as: "answerDetails"
      }
    });

    pipeline.push({
      $project: {
        _id: 0,
        id: "$DataChecklist.id",
        title: "$DataChecklist.title",
        date: "$DataChecklist.date",
        everyquyen: "$DataChecklist.everyquyen",
        background: "$DataChecklist.background",
        colorNen: "$DataChecklist.colorNen",
        nhap: "$DataChecklist.nhap",
        phongban: "$DataChecklist.phongban",
        account: "$DataChecklist.account",
        hinhanh: "$DataChecklist.hinhanh",
        taptin: "$DataChecklist.taptin",
        bookmark: "$DataChecklist.bookmark",
        dateBookmark: "$DataChecklist.dateBookmark",
        TimeSaveNhap: "$DataChecklist.TimeSaveNhap",
        solanlaplai: "$DataChecklist.solanlaplai",
        threeimg: "$DataChecklist.threeimg",
        locktitle: "$DataChecklist.locktitle",
        yeucauxuly: "$DataChecklist.yeucauxuly",
        responseCount: { $size: { $ifNull: ["$answerDetails", []] } },
        questionCount: { $size: { $ifNull: ["$checklistQuestions", []] } },
        userName: "$name",
        userAvatar: "$imgAvatar",
        userBophan: "$bophan",
        userChinhanh: "$chinhanh",
        username: "$username", // Thêm trường username
        imgBackground: "$imgBackground", // Thêm trường imgBackground
        locker: "$locker", // Thêm trường locker
        email: "$email", // Thêm trường email
        chucvu: "$chucvu", // Thêm trường chucvu
        keys: "$keys" // Thêm trường chucvu
      }
    });

    pipeline.push({
      $sort: {
        "dateBookmark": -1,
        "TimeSaveNhap": -1,
        "date": -1
      }
    });

    const countPipeline = [...pipeline];
    countPipeline.push({ $count: "totalItems" });
    const countResult = await checklistCollection.aggregate(countPipeline).toArray();
    const totalItems = countResult.length > 0 ? countResult[0].totalItems : 0;

    const skip = (parsedPage - 1) * pageSize;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: pageSize });

    const results = await checklistCollection.aggregate(pipeline).toArray();

    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const showLoadMore = parsedPage < totalPages;

    res.json({
      data: results,
      totalItems,
      currentPage: parsedPage,
      totalPages,
      showLoadMore
    });
  } catch (error) {
    console.error('Error fetching saved checklists:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 15. Lấy checklist đã lưu theo userKeys
exports.GetSavedChecklistsByUserKeys = async (req, res) => {
  const { userKeys, page = 1, limit = 8 } = req.query;

  if (!userKeys) {
    return res.status(400).json({ message: 'Thiếu thông tin userKeys' });
  }

  const parsedPage = parseInt(page) || 1;
  const parsedLimit = parseInt(limit) || 8;
  const skip = (parsedPage - 1) * parsedLimit;

  try {
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');

    const pipeline = [
      { $match: { "DataChecklist": { $exists: true } } },
      { $unwind: "$DataChecklist" },
      {
        $match: {
          "DataChecklist.keysJSON": userKeys,
          "DataChecklist.nhap": true
        }
      },
      { $sort: { "DataChecklist.date": -1 } },
      {
        $facet: {
          metadata: [{ $count: "totalItems" }],
          data: [
            { $skip: skip },
            { $limit: parsedLimit },
            {
              $project: {
                id: "$DataChecklist.id",
                title: "$DataChecklist.title",
                contentTitle: "$DataChecklist.contentTitle",
                date: "$DataChecklist.date",
                everyquyen: "$DataChecklist.everyquyen",
                background: "$DataChecklist.background",
                colorNen: "$DataChecklist.colorNen",
                nhap: "$DataChecklist.nhap",
                keys: "$DataChecklist.keys",
                phongban: "$DataChecklist.phongban",
                account: "$DataChecklist.account",
                hinhanh: "$DataChecklist.hinhanh",
                taptin: "$DataChecklist.taptin",
                keysJSON: "$DataChecklist.keysJSON",
                save: "$DataChecklist.save",
                TimeSaveNhap: "$DataChecklist.TimeSaveNhap"
              }
            }
          ]
        }
      }
    ];

    const result = await checklistCollection.aggregate(pipeline).toArray();
    const totalItems = result[0]?.metadata[0]?.totalItems || 0;
    const checklists = result[0]?.data || [];

    return res.status(200).json({
      data: checklists,
      totalItems,
      currentPage: parsedPage,
      totalPages: Math.ceil(totalItems / parsedLimit),
      hasMore: skip + parsedLimit < totalItems
    });
  } catch (error) {
    console.error('Error fetching saved checklists by user keys:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};