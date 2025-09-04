const { connectDB } = require('./MongoDB/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

exports.PostCautraloi = async (req, res) => {
  const { id, ...responseData } = req.body;

  try {
    if (!responseData.questions || !Array.isArray(responseData.questions)) {
      return res.status(400).json({ message: 'Dữ liệu câu hỏi không hợp lệ.' });
    }

    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');
    const answerCommentsCollection = await connectDB('ANSWER_COMMENTS');

    const checklist = await checklistCollection.findOne({ "DataChecklist.id": id });
    if (!checklist) {
      return res.status(404).json({ message: 'Không tìm thấy checklist.' });
    }

    const responseId = uuidv4();
    const responseEntry = {
      checklistId: id,
      responseId,
      response: {
        ...responseData,
        submittedAt: moment().format('DD-MM-YYYY HH:mm:ss'),
        statusHistory: [], // Khởi tạo statusHistory
      }
    };

    const normalizeString = (str) => {
      if (typeof str !== 'string') return '';
      return str.trim().toLowerCase().replace(/\s+/g, ' ');
    };

    const answerQuestions = responseData.questions.map((question, index) => {
      let updatedQuestion = { ...question, index };

      // Kiểm tra versions === "v1.0.1" và xử lý userSelected, isCorrect
      if (responseData.versions === "v1.0.1" && (question.luachon?.option2 || question.luachon?.option3 || question.luachon?.option1 || question.luachon?.option5 || question.luachon?.option6)) {
        const userAnswer = question.answer;
        const correctAnswer = question.cautraloi; // Đáp án đúng từ checklist
        let isCorrect = question.isCorrect !== undefined ? question.isCorrect : false; // Lấy isCorrect từ frontend, mặc định là false nếu không có

        if (question.luachon.option2) {
          // Radio: chỉ có một đáp án được chọn
          updatedQuestion.options = question.options.map(option => {
            const optionIsCorrect = option.tuychon === userAnswer ? option.tuychon === correctAnswer : false;
            isCorrect = optionIsCorrect; // Cập nhật isCorrect cho câu hỏi
            return {
              ...option,
              userSelected: option.tuychon === userAnswer,
              isCorrect: optionIsCorrect
            };
          });
        } else if (question.luachon.option3) {
          // Checkbox: nhiều đáp án có thể được chọn
          updatedQuestion.options = question.options.map(option => {
            const optionIsCorrect = Array.isArray(userAnswer) && userAnswer.includes(option.tuychonnhieu) ? correctAnswer?.includes(option.tuychonnhieu) : false;
            isCorrect = isCorrect || optionIsCorrect; // Cập nhật isCorrect nếu có ít nhất một lựa chọn đúng
            return {
              ...option,
              userSelected: Array.isArray(userAnswer) && userAnswer.includes(option.tuychonnhieu),
              isCorrect: optionIsCorrect
            };
          });
        } else if (question.luachon.option1 || question.luachon.option5 || question.luachon.option6) {
          // TextArea
          const normalizedAnswer = normalizeString(userAnswer);
          const normalizedCorrectAnswer = normalizeString(correctAnswer);
          isCorrect = typeof correctAnswer === 'string' && correctAnswer !== '' ? normalizedAnswer === normalizedCorrectAnswer : false;

          updatedQuestion.options = question.options || [
            {
              tuychon: userAnswer || '',
              userSelected: !!userAnswer,
              isCorrect: isCorrect
            }
          ];
        }

        // Thêm isCorrect vào object câu hỏi
        updatedQuestion.isCorrect = isCorrect;
      }

      return {
        checklistId: id,
        responseId,
        questionId: uuidv4(),
        question: updatedQuestion
      };
    });

    // Xử lý replies nếu có
    const answerComments = [];
    if (responseData.questions) {
      responseData.questions.forEach((question) => {
        if (question.replies && Array.isArray(question.replies)) {
          question.replies.forEach((reply) => {
            const commentId = uuidv4();
            answerComments.push({
              checklistId: id,
              responseId,
              questionId: question.id || uuidv4(),
              commentId,
              parentCommentId: null,
              content: { ...reply }
            });
            if (reply.traloi && Array.isArray(reply.traloi)) {
              reply.traloi.forEach((nestedReply) => {
                answerComments.push({
                  checklistId: id,
                  responseId,
                  questionId: question.id || uuidv4(),
                  commentId: uuidv4(),
                  parentCommentId: commentId,
                  content: { ...nestedReply }
                });
              });
            }
          });
        }
      });
    }

    const { questions, ...responseWithoutQuestions } = responseEntry.response;
    await answerDetailsCollection.insertOne({
      ...responseEntry,
      response: responseWithoutQuestions
    });

    if (answerQuestions.length > 0) {
      await answerQuestionCollection.insertMany(answerQuestions);
    }

    if (answerComments.length > 0) {
      await answerCommentsCollection.insertMany(answerComments);
    }

    res.status(200).json({
      message: 'Thêm phản hồi thành công',
      responseId
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
// 2. Đồng bộ phản hồi (SyncCautraloi)
exports.SyncCautraloi = async (req, res) => {
  let uploadedData = req.body;
  if (!uploadedData) {
    return res.status(400).json({ message: 'No data provided' });
  }
  if (!Array.isArray(uploadedData)) {
    uploadedData = [uploadedData];
  }

  try {
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');
    const answerCommentsCollection = await connectDB('ANSWER_COMMENTS');

    let successCount = 0;
    let failureCount = 0;
    const failureDetails = [];

    for (const data of uploadedData) {
      if (!data || typeof data !== 'object') {
        failureCount++;
        failureDetails.push({ reason: 'Invalid data entry' });
        continue;
      }
      if (!data.title || typeof data.title !== 'string') {
        failureCount++;
        failureDetails.push({ title: data.title || 'undefined', reason: 'Title is missing or invalid' });
        continue;
      }

      const checklist = await checklistCollection.findOne({
        "DataChecklist.title": { $regex: new RegExp(`^${data.title}$`, 'i') },
      });

      if (!checklist) {
        failureCount++;
        failureDetails.push({ title: data.title, reason: 'Không tìm thấy checklist khớp với title.' });
        continue;
      }

      const checklistItem = checklist.DataChecklist.find(
        (item) => item.title.toLowerCase() === data.title.toLowerCase()
      );
      if (!checklistItem) {
        failureCount++;
        failureDetails.push({ title: data.title, reason: 'Không tìm thấy checklist trong mảng DataChecklist.' });
        continue;
      }

      const responseId = data.id && typeof data.id === 'string' ? data.id : uuidv4();
      const existingResponse = await answerDetailsCollection.findOne({ responseId });

      const responseEntry = {
        checklistId: checklistItem.id,
        responseId,
        response: {
          ...data,
          submittedAt: data.submittedAt || moment().format('DD-MM-YYYY HH:mm:ss'),
          statusHistory: data.statusHistory || [], // Sử dụng nếu có, hoặc khởi tạo
        },
      };

      // ... phần còn lại của code giữ nguyên ...

      const { questions, ...responseWithoutQuestions } = responseEntry.response;

      if (existingResponse) {
        await answerDetailsCollection.updateOne(
          { responseId },
          { $set: { ...responseEntry, response: responseWithoutQuestions } }
        );
        await answerQuestionCollection.deleteMany({ responseId });
        await answerCommentsCollection.deleteMany({ responseId });
      } else {
        await answerDetailsCollection.insertOne({
          ...responseEntry,
          response: responseWithoutQuestions,
        });
      }

      if (answerQuestions.length > 0) {
        await answerQuestionCollection.insertMany(answerQuestions);
      }

      if (answerComments.length > 0) {
        await answerCommentsCollection.insertMany(answerComments);
      }

      successCount++;
    }

    res.status(200).json({
      message: 'Đồng bộ dữ liệu hoàn tất!',
      successCount,
      failureCount,
      failureDetails,
    });
  } catch (error) {
    console.error('Error syncing data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.GetCautraloi = async (req, res) => {
  const { id } = req.params;

  try {
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');
    const answerCommentsCollection = await connectDB('ANSWER_COMMENTS');
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');

    const answer = await answerDetailsCollection.findOne({ responseId: id });
    if (!answer) {
      return res.status(404).json({ message: 'Không tìm thấy phản hồi.' });
    }

    const checklists = await checklistCollection.find().toArray();

    // Xử lý historyCheck để lấy thông tin người dùng
    const historyCheckWithUserData = await Promise.all(
      (Array.isArray(answer.response.historyCheck) ? answer.response.historyCheck : []).map(async (historyItem) => {
        const userKeys = historyItem.user;
        let matchedUserData = { name: 'N/A', imgAvatar: null, bophan: 'N/A', chinhanh: 'N/A' };

        // Tìm kiếm trong CHECKLIST_DATABASE để khớp keys
        const matchedChecklist = checklists.find(checklist => checklist.keys === userKeys);
        if (matchedChecklist) {
          matchedUserData = {
            name: matchedChecklist.name || 'N/A',
            imgAvatar: matchedChecklist.imgAvatar || null,
            username: matchedChecklist.username || 'N/A',
            bophan: matchedChecklist.bophan || 'N/A',
            chinhanh: matchedChecklist.chinhanh || 'N/A',
            email: matchedChecklist.email || null,
            chucvu: matchedChecklist.chucvu || null,
            locker: matchedChecklist.locker || false,
            imgBackground: matchedChecklist.imgBackground || null,
            keys: matchedChecklist.keys || userKeys,
          };
        }

        return {
          ...historyItem,
          user: matchedUserData,
        };
      })
    );

    // Xử lý thông tin người dùng chính (nguoiphanhoi)
    const keysJSONFromAnswer = Array.isArray(answer.response.keysJSON)
      ? answer.response.keysJSON
      : (answer.response.keysJSON ? [answer.response.keysJSON] : []);

    let matchedUserData = {
      name: answer.response.nguoiphanhoi || 'N/A',
      imgAvatar: null,
      bophan: answer.response.phongban || 'N/A',
      chinhanh: answer.response.chi_nhanh || 'N/A',
    };

    if (keysJSONFromAnswer.length > 0) {
      for (const checklist of checklists) {
        if (checklist.keys && keysJSONFromAnswer.includes(checklist.keys)) {
          matchedUserData = {
            name: checklist.name || answer.response.nguoiphanhoi || 'N/A',
            imgAvatar: checklist.imgAvatar || null,
            username: checklist.username || 'N/A',
            bophan: checklist.bophan || answer.response.phongban || 'N/A',
            chinhanh: checklist.chinhanh || answer.response.chi_nhanh || 'N/A',
            email: checklist.email || null,
            chucvu: checklist.chucvu || null,
            locker: checklist.locker || false,
            imgBackground: checklist.imgBackground || null,
            keys: checklist.keys || 'N/A',
          };
          break;
        }
      }
    }

    const answerQuestions = await answerQuestionCollection.find({ responseId: id }).toArray();
    const comments = await answerCommentsCollection.find({ responseId: id }).toArray();

    const questions = answerQuestions
      .sort((a, b) => a.question.index - b.question.index)
      .map(q => {
        const questionComments = comments.filter(c => c.questionId === q.question.id);
        return {
          ...q.question,
          replies: questionComments
            .filter(c => !c.parentCommentId)
            .map(c => ({
              ...c.content,
              id: c.commentId,
              traloi: questionComments
                .filter(nc => nc.parentCommentId === c.commentId)
                .map(nc => ({ ...nc.content, id: nc.commentId })),
            })),
        };
      });

    const dataCautraloi = {
      ...answer.response,
      historyCheck: historyCheckWithUserData,
      questions,
      responseId: answer.responseId,
      user: matchedUserData,
    };

    res.status(200).json({ data: dataCautraloi });
  } catch (error) {
    console.error('Error retrieving DataCautraloi:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
// 4. Lấy tất cả phản hồi với phân trang (Getallcautraloi)
exports.Getallcautraloi = async (req, res) => {
  const { page = 1, pageSize = 5, startDate, endDate, keysJSON, title, chiNhanh, phongBan, pagination, userKeys } = req.query;

  const parsedPage = parseInt(page) || 1;
  const parsedPageSize = parseInt(pageSize) || 5;

  try {
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');

    // Lấy tất cả checklist từ CHECKLIST_DATABASE
    const checklists = await checklistCollection.find({}).toArray();

    // Xây dựng query cơ bản để lấy dữ liệu từ ANSWER_DETAILS
    const query = {};
    if (startDate || endDate) {
      const dateQuery = {};
      if (startDate) {
        const start = moment(startDate, 'DD-MM-YYYY').format('DD-MM-YYYY');
        dateQuery.$regex = new RegExp(`^${start}`);
      }
      if (endDate) {
        const end = moment(endDate, 'DD-MM-YYYY').format('DD-MM-YYYY');
        dateQuery.$lte = `${end} 23:59:59`;
      }
      query.$or = [
        { "response.submittedAt": dateQuery },
        { "response.ngay_phan_hoi": dateQuery },
      ];
    }
    if (keysJSON) {
      const keysArray = Array.isArray(keysJSON) ? keysJSON : keysJSON.split(',').map(key => key.trim());
      query["response.keysJSON"] = { $in: keysArray };
    }
    if (title) query["response.title"] = { $regex: new RegExp(title, 'i') };
    if (chiNhanh) query["response.chi_nhanh"] = { $regex: new RegExp(chiNhanh, 'i') };
    if (phongBan) query["response.phongban"] = { $regex: new RegExp(phongBan, 'i') };

    if (userKeys && userKeys !== 'all') {
      const userKeysArray = Array.isArray(userKeys) ? userKeys : userKeys.split(',').map(key => key.trim());
      query["response.keysJSON"] = { $in: userKeysArray };
    }

    const total = await answerDetailsCollection.countDocuments(query);

    // Xây dựng pipeline cho aggregation
    const pipeline = [
      { $match: query },
      // Chuyển đổi response.ngay_phan_hoi từ chuỗi sang ngày giờ
      {
        $addFields: {
          convertedNgayPhanHoi: {
            $dateFromString: {
              dateString: "$response.ngay_phan_hoi",
              format: "%d-%m-%Y %H:%M:%S" // Định dạng khớp với "13-02-2025 15:37:04"
            }
          }
        }
      },
      // Sắp xếp theo response.ngay_phan_hoi giảm dần (mới nhất lên đầu)
      { $sort: { convertedNgayPhanHoi: -1 } },
      { $skip: (parsedPage - 1) * parsedPageSize },
      { $limit: parsedPageSize },
      // Loại bỏ các trường không mong muốn trong tất cả các trường hợp
      {
        $project: {
          "response.ConfigPoints": 0,
          "response.pointConfigNangCao": 0,
          "response.historyCheck": 0,
          "response.statusHistory": 0,
          "response.watching": 0,
          "response.rankings": 0,
          "response.Cauhinhdiem": 0,
          "response.demcauhoi": 0,
          "response.yeucauxuly": 0,
          "response.versions": 0,
          "response.khack": 0,
          "response.solanlaplai": 0,
        },
      },
    ];

    // Nếu userKeys được truyền vào, loại bỏ thêm các trường khác
    if (userKeys && userKeys !== 'all') {
      pipeline.splice(pipeline.length - 1, 0, {
        $project: {
          "response.imgAvatar": 0,
          "response.chi_nhanh": 0,
          "response.nguoiphanhoi": 0,
          "response.phongban": 0,
          "response.ConfigPoints": 0,
          "response.pointConfigNangCao": 0,
          "response.historyCheck": 0,
          "response.statusHistory": 0,
          "response.watching": 0,
          "response.rankings": 0,
          "response.demcauhoi": 0,
          "response.yeucauxuly": 0,
          "response.versions": 0,
          "response.khack": 0,
          "response.solanlaplai": 0,
          "response.Cauhinhdiem": 0,
        },
      });
    }

    const answers = await answerDetailsCollection.aggregate(pipeline).toArray();

    const allDataCautraloi = answers.map(answer => {
      const { questions, contentTitle, ...responseWithoutQuestionsAndContentTitle } = answer.response;
      let matchedUserData = { name: answer.response.nguoiphanhoi || "N/A", imgAvatar: null };
      const keysJSONFromAnswer = answer.response.keysJSON || "";
    
      if (keysJSONFromAnswer && (!userKeys || userKeys === 'all')) {
        for (const checklist of checklists) {
          const checklistKey = checklist.keys;
          if (checklistKey) {
            const isMatch = Array.isArray(keysJSONFromAnswer)
              ? keysJSONFromAnswer.includes(checklistKey)
              : keysJSONFromAnswer === checklistKey;
            if (isMatch) {
              matchedUserData = {
                name: checklist.name || answer.response.nguoiphanhoi || "N/A",
                imgAvatar: checklist.imgAvatar || null,
                username: checklist.username,
              };
              break;
            }
          }
        }
      }
    
      return {
        ...responseWithoutQuestionsAndContentTitle,
        responseId: answer.responseId,
        keysJSON: answer.response.keysJSON || "",
        name: matchedUserData.name,
        imgAvatar: matchedUserData.imgAvatar,
        username: matchedUserData.username
      };
    });

    res.status(200).json({
      success: true,
      data: allDataCautraloi,
      total,
      page: parsedPage,
      pageSize: parsedPageSize,
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
// 5. Lấy tất cả phản hồi tối ưu (GetallToiUu)
exports.GetallToiUu = async (req, res) => {
  const pageSize = 5;
  const page = parseInt(req.query.page) || 1;

  try {
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');

    const answers = await answerDetailsCollection.find({}).toArray();
    const allData = await Promise.all(answers.map(async (answer) => {
      const answerQuestions = await answerQuestionCollection.find({ responseId: answer.responseId }).toArray();
      const questions = answerQuestions
        .sort((a, b) => a.question.index - b.question.index)
        .map(q => q.question);

      return {
        ...answer.response,
        questions,
        responseId: answer.responseId
      };
    }));

    allData.sort((a, b) => moment(b.submittedAt, 'DD-MM-YYYY HH:mm:ss').toDate() - moment(a.submittedAt, 'DD-MM-YYYY HH:mm:ss').toDate());

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = allData.slice(startIndex, endIndex);

    res.json({
      total: allData.length,
      page: page,
      pageSize: pageSize,
      data: paginatedData,
    });
  } catch (error) {
    console.error(`Error reading documents: ${error}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 6. Xóa phản hồi (DeleteCautraloi)
exports.DeleteCautraloi = async (req, res) => {
  const { id } = req.params;

  try {
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');
    const answerCommentsCollection = await connectDB('ANSWER_COMMENTS');

    const result = await answerDetailsCollection.deleteOne({ responseId: id });
    await answerQuestionCollection.deleteMany({ responseId: id });
    await answerCommentsCollection.deleteMany({ responseId: id });

    if (result.deletedCount > 0) {
      res.status(200).json({ message: 'Xóa phản hồi thành công' });
    } else {
      res.status(404).json({ message: 'Phản hồi đã bị xóa hoặc không tồn tại.' });
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.BatchDeleteCautraloi = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Danh sách ID không hợp lệ hoặc rỗng.' });
  }

  try {
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');
    const answerCommentsCollection = await connectDB('ANSWER_COMMENTS');

    const result = await answerDetailsCollection.deleteMany({ responseId: { $in: ids } });
    await answerQuestionCollection.deleteMany({ responseId: { $in: ids } });
    await answerCommentsCollection.deleteMany({ responseId: { $in: ids } });

    if (result.deletedCount > 0) {
      res.status(200).json({
        message: `Đã xóa thành công ${result.deletedCount} phản hồi`,
        totalDeleted: result.deletedCount,
      });
    } else {
      res.status(404).json({
        message: 'Không tìm thấy phản hồi nào để xóa.',
        totalDeleted: 0,
      });
    }
  } catch (error) {
    console.error(`Error deleting multiple documents: ${error}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 7. Xóa nhiều phản hồi (BatchDeleteCautraloi)
exports.BatchDeleteCautraloi = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Danh sách ID không hợp lệ hoặc rỗng.' });
  }

  try {
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');

    const result = await answerDetailsCollection.deleteMany({ responseId: { $in: ids } });
    await answerQuestionCollection.deleteMany({ responseId: { $in: ids } });

    if (result.deletedCount > 0) {
      res.status(200).json({
        message: `Đã xóa thành công ${result.deletedCount} phản hồi`,
        totalDeleted: result.deletedCount,
      });
    } else {
      res.status(404).json({
        message: 'Không tìm thấy phản hồi nào để xóa.',
        totalDeleted: 0,
      });
    }
  } catch (error) {
    console.error(`Error deleting multiple documents: ${error}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 8. Cập nhật phản hồi (UpdateDoc)
exports.UpdateDoc = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');

    const updateFields = Object.keys(updateData).reduce((acc, key) => {
      if (key !== 'questions') {
        acc[`response.${key}`] = updateData[key];
      }
      return acc;
    }, {});

    const result = await answerDetailsCollection.updateOne(
      { responseId: id },
      { $set: updateFields }
    );

    if (updateData.questions) {
      await answerQuestionCollection.deleteMany({ responseId: id });
      const newQuestions = updateData.questions.map((question, index) => ({
        checklistId: updateData.id,
        responseId: id,
        questionId: uuidv4(),
        question: { ...question, index }
      }));
      if (newQuestions.length > 0) {
        await answerQuestionCollection.insertMany(newQuestions);
      }
    }

    if (result.modifiedCount > 0) {
      const updatedDoc = await answerDetailsCollection.findOne({ responseId: id });
      const answerQuestions = await answerQuestionCollection.find({ responseId: id }).toArray();
      const questions = answerQuestions
        .sort((a, b) => a.question.index - b.question.index)
        .map(q => q.question);

      const updatedItem = {
        ...updatedDoc.response,
        questions,
        responseId: updatedDoc.responseId
      };
      res.json({ message: 'Updated successfully', updatedItem });
    } else {
      res.status(404).json({ message: 'Document not found' });
    }
  } catch (error) {
    console.error(`Error updating document: ${error}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 9. Cập nhật phản hồi cấp 1 (UpdatePhanhoi)
exports.UpdatePhanhoi = async (req, res) => {
  const { id } = req.params; // responseId
  const { reply, questionId } = req.body;

  try {
    const answerCommentsCollection = await connectDB('ANSWER_COMMENTS');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');

    const commentId = uuidv4();
    const newComment = {
      checklistId: id, // Giả sử checklistId có thể lấy từ ANSWER_DETAILS nếu cần
      responseId: id,
      questionId,
      commentId,
      parentCommentId: null,
      content: { ...reply }
    };

    await answerCommentsCollection.insertOne(newComment);

    // Lấy dữ liệu cập nhật để trả về
    const updatedDoc = await answerDetailsCollection.findOne({ responseId: id });
    const answerQuestions = await answerQuestionCollection.find({ responseId: id }).toArray();
    const questions = answerQuestions
      .sort((a, b) => a.question.index - b.question.index)
      .map(q => q.question);

    const comments = await answerCommentsCollection.find({ responseId: id, questionId }).toArray();
    const questionToUpdate = questions.find(q => q.id === questionId);
    if (questionToUpdate) {
      questionToUpdate.replies = comments
        .filter(c => !c.parentCommentId)
        .map(c => ({
          ...c.content,
          id: c.commentId,
          traloi: comments
            .filter(nc => nc.parentCommentId === c.commentId)
            .map(nc => ({ ...nc.content, id: nc.commentId }))
        }));
    }

    const updatedItem = {
      ...updatedDoc.response,
      questions,
      responseId: updatedDoc.responseId
    };

    res.json({ updatedItem });
  } catch (error) {
    console.error(`Error updating document: ${error}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 10. Cập nhật phản hồi lồng nhau (UpdatePhanhoiNested)
exports.UpdatePhanhoiNested = async (req, res) => {
  const { id } = req.params; // responseId
  const { nestedReply, questionId, replyId } = req.body;

  try {
    const answerCommentsCollection = await connectDB('ANSWER_COMMENTS');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');

    const commentId = uuidv4();
    const newNestedComment = {
      checklistId: id,
      responseId: id,
      questionId,
      commentId,
      parentCommentId: replyId,
      content: { ...nestedReply }
    };

    await answerCommentsCollection.insertOne(newNestedComment);

    // Lấy dữ liệu cập nhật để trả về
    const updatedDoc = await answerDetailsCollection.findOne({ responseId: id });
    const answerQuestions = await answerQuestionCollection.find({ responseId: id }).toArray();
    const questions = answerQuestions
      .sort((a, b) => a.question.index - b.question.index)
      .map(q => q.question);

    const comments = await answerCommentsCollection.find({ responseId: id, questionId }).toArray();
    const questionToUpdate = questions.find(q => q.id === questionId);
    if (questionToUpdate) {
      questionToUpdate.replies = comments
        .filter(c => !c.parentCommentId)
        .map(c => ({
          ...c.content,
          id: c.commentId,
          traloi: comments
            .filter(nc => nc.parentCommentId === c.commentId)
            .map(nc => ({ ...nc.content, id: nc.commentId }))
        }));
    }

    const updatedItem = {
      ...updatedDoc.response,
      questions,
      responseId: updatedDoc.responseId
    };

    res.json({ updatedItem });
  } catch (error) {
    console.error(`Error updating document: ${error}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 11. Cập nhật xử lý nhiệm vụ (UpdateXuLyNhiemVu)
exports.UpdateXuLyNhiemVu = async (req, res) => {
  const { documentId, questionId } = req.params;
  const { xulynhiemvu, xacnhancauhoi, nguoiduyet, thoigianpheduyet } = req.body;

  try {
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerCommentsCollection = await connectDB('ANSWER_COMMENTS');
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');

    // Check if the question exists
    const existingQuestion = await answerQuestionCollection.findOne({
      responseId: documentId,
      "question.id": questionId,
    });
    if (!existingQuestion) {
      return res.status(404).json({ message: 'Không tìm thấy câu hỏi để cập nhật.' });
    }

    // Prepare update fields
    const updateFields = {};
    if (xulynhiemvu !== undefined) updateFields["question.xulynhiemvu"] = xulynhiemvu;
    if (xacnhancauhoi !== undefined) updateFields["question.xacnhancauhoi"] = xacnhancauhoi;
    if (nguoiduyet !== undefined) updateFields["question.nguoiduyet"] = nguoiduyet;
    if (thoigianpheduyet !== undefined) {
      updateFields["question.thoigianpheduyet"] = moment(thoigianpheduyet, 'DD-MM-YYYY HH:mm:ss').isValid()
        ? moment(thoigianpheduyet, 'DD-MM-YYYY HH:mm:ss').format('DD-MM-YYYY HH:mm:ss')
        : moment().format('DD-MM-YYYY HH:mm:ss');
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'Không có dữ liệu nào để cập nhật.' });
    }

    // Update the question
    const result = await answerQuestionCollection.updateOne(
      { responseId: documentId, "question.id": questionId },
      { $set: updateFields }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Không có thay đổi nào được thực hiện.' });
    }

    // Fetch updated data to return
    const answer = await answerDetailsCollection.findOne({ responseId: documentId });
    if (!answer) {
      return res.status(404).json({ message: 'Không tìm thấy phản hồi.' });
    }

    const checklists = await checklistCollection.find().toArray();
    const keysJSONFromAnswer = Array.isArray(answer.response.keysJSON)
      ? answer.response.keysJSON
      : (answer.response.keysJSON ? [answer.response.keysJSON] : []);

    let matchedUserData = { name: answer.response.nguoiphanhoi || "N/A", imgAvatar: null };
    if (keysJSONFromAnswer.length > 0) {
      for (const checklist of checklists) {
        const checklistKeys = checklist.keys;
        if (checklistKeys && keysJSONFromAnswer.includes(checklistKeys)) {
          matchedUserData = {
            name: checklist.name || answer.response.nguoiphanhoi || "N/A",
            imgAvatar: checklist.imgAvatar || null,
          };
          break;
        }
      }
    }

    const answerQuestions = await answerQuestionCollection.find({ responseId: documentId }).toArray();
    const comments = await answerCommentsCollection.find({ responseId: documentId }).toArray();

    const questions = answerQuestions
      .sort((a, b) => a.question.index - b.question.index)
      .map(q => {
        const questionComments = comments.filter(c => c.questionId === q.question.id);
        return {
          ...q.question,
          replies: questionComments
            .filter(c => !c.parentCommentId)
            .map(c => ({
              ...c.content,
              id: c.commentId,
              traloi: questionComments
                .filter(nc => nc.parentCommentId === c.commentId)
                .map(nc => ({ ...nc.content, id: nc.commentId })),
            })),
        };
      });

    const dataCautraloi = {
      ...answer.response,
      questions,
      responseId: answer.responseId,
      user: matchedUserData,
    };

    res.status(200).json({
      message: 'Cập nhật xử lý nhiệm vụ thành công',
      data: dataCautraloi,
    });
  } catch (error) {
    console.error(`Lỗi khi cập nhật xử lý nhiệm vụ: ${error}`);
    res.status(500).json({ message: 'Lỗi Server Nội Bộ', error: error.message });
  }
};
// 12. Ghi đè trạng thái pin cho phản hồi (PinReply)
exports.PinReply = async (req, res) => {
  const { documentId, questionId, replyId, isPinned } = req.body;

  try {
    const answerCommentsCollection = await connectDB('ANSWER_COMMENTS');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');

    const result = await answerCommentsCollection.updateOne(
      { responseId: documentId, questionId, commentId: replyId, parentCommentId: null },
      { $set: { "content.isPinned": isPinned } }
    );

    if (result.modifiedCount > 0) {
      const updatedDoc = await answerDetailsCollection.findOne({ responseId: documentId });
      const answerQuestions = await answerQuestionCollection.find({ responseId: documentId }).toArray();
      const questions = answerQuestions
        .sort((a, b) => a.question.index - b.question.index)
        .map(q => q.question);

      const comments = await answerCommentsCollection.find({ responseId: documentId, questionId }).toArray();
      const questionToUpdate = questions.find(q => q.id === questionId);
      if (questionToUpdate) {
        questionToUpdate.replies = comments
          .filter(c => !c.parentCommentId)
          .map(c => ({
            ...c.content,
            id: c.commentId,
            traloi: comments
              .filter(nc => nc.parentCommentId === c.commentId)
              .map(nc => ({ ...nc.content, id: nc.commentId }))
          }));
      }

      const updatedItem = {
        ...updatedDoc.response,
        questions,
        responseId: updatedDoc.responseId
      };
      res.json({ updatedItem });
    } else {
      res.status(404).json({ message: 'Document, question, or reply not found' });
    }
  } catch (error) {
    console.error(`Error updating pin status: ${error}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 13. Ghi đè trạng thái pin cho phản hồi lồng nhau (PinNestedReply)
exports.PinNestedReply = async (req, res) => {
  const { documentId, questionId, replyId, nestedReplyId, isPinned } = req.body;

  try {
    const answerCommentsCollection = await connectDB('ANSWER_COMMENTS');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');

    const result = await answerCommentsCollection.updateOne(
      { responseId: documentId, questionId, commentId: nestedReplyId, parentCommentId: replyId },
      { $set: { "content.isPinned": isPinned } }
    );

    if (result.modifiedCount > 0) {
      const updatedDoc = await answerDetailsCollection.findOne({ responseId: documentId });
      const answerQuestions = await answerQuestionCollection.find({ responseId: documentId }).toArray();
      const questions = answerQuestions
        .sort((a, b) => a.question.index - b.question.index)
        .map(q => q.question);

      const comments = await answerCommentsCollection.find({ responseId: documentId, questionId }).toArray();
      const questionToUpdate = questions.find(q => q.id === questionId);
      if (questionToUpdate) {
        questionToUpdate.replies = comments
          .filter(c => !c.parentCommentId)
          .map(c => ({
            ...c.content,
            id: c.commentId,
            traloi: comments
              .filter(nc => nc.parentCommentId === c.commentId)
              .map(nc => ({ ...nc.content, id: nc.commentId }))
          }));
      }

      const updatedItem = {
        ...updatedDoc.response,
        questions,
        responseId: updatedDoc.responseId
      };
      res.json({ updatedItem });
    } else {
      res.status(404).json({ message: 'Document, question, reply, or nested reply not found' });
    }
  } catch (error) {
    console.error(`Error updating nested reply pin status: ${error}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 15. Lấy danh sách tiêu đề checklist (GetChecklistTitles)
exports.GetChecklistTitles = async (req, res) => {
    try {
        const checklistCollection = await connectDB('CHECKLIST_DATABASE');
        const { search } = req.query;

        // Nếu không có từ khóa tìm kiếm, trả về mảng rỗng
        if (!search || search.trim() === '') {
            return res.json({ success: true, data: [] });
        }

        // Tạo query tìm kiếm với các điều kiện
        const query = {
            "DataChecklist": {
                $elemMatch: {
                    $and: [
                        { nhap: { $ne: true } }, // Loại bỏ các checklist có nhap = true
                        { title: { $exists: true } }, // Đảm bảo title tồn tại
                        {
                            $or: [
                                // Tìm kiếm không phân biệt chữ hoa/thường và dấu
                                { title: { $regex: new RegExp(search.trim(), 'i') } },
                                // Có thể thêm các điều kiện tìm kiếm khác ở đây nếu cần
                            ]
                        }
                    ]
                }
            }
        };

        const projection = {
            "DataChecklist.title": 1,
            _id: 0
        };

        // Thực hiện tìm kiếm với limit để tránh trả về quá nhiều kết quả
        const checklists = await checklistCollection
            .find(query)
            .project(projection)
            .limit(20) // Giới hạn 20 kết quả
            .toArray();

        // Xử lý và lọc kết quả
        const titles = checklists
            .flatMap(item => {
                if (!item.DataChecklist || !Array.isArray(item.DataChecklist)) return [];
                return item.DataChecklist
                    .filter(check => {
                        // Lọc các checklist hợp lệ
                        return check.title && 
                               typeof check.title === 'string' &&
                               check.title.toLowerCase().includes(search.toLowerCase().trim());
                    })
                    .map(check => check.title.trim());
            })
            // Loại bỏ trùng lặp và sắp xếp
            .filter((title, index, self) => title && self.indexOf(title) === index)
            .sort((a, b) => {
                // Ưu tiên các kết quả bắt đầu bằng từ khóa tìm kiếm
                const searchLower = search.toLowerCase().trim();
                const aStartsWith = a.toLowerCase().startsWith(searchLower);
                const bStartsWith = b.toLowerCase().startsWith(searchLower);
                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;
                return a.localeCompare(b);
            });

        res.json({
            success: true,
            data: titles.slice(0, 10) // Chỉ trả về tối đa 10 kết quả
        });

    } catch (error) {
        console.error('Lỗi khi tìm kiếm checklist:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ',
            error: error.message
        });
    }
};

// Fetch responses for a specific checklist ID without pagination
exports.GetResponsesByChecklistId = async (req, res) => {
  const { checklistId } = req.params;

  try {
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');

    const answers = await answerDetailsCollection.find({ checklistId }).toArray();

    const responsesWithQuestions = await Promise.all(answers.map(async (answer) => {
      const answerQuestions = await answerQuestionCollection.find({ responseId: answer.responseId }).toArray();
      const questions = answerQuestions
        .sort((a, b) => a.question.index - b.question.index)
        .map(q => q.question);

      return {
        ...answer.response,
        questions,
        responseId: answer.responseId
      };
    }));

    responsesWithQuestions.sort((a, b) => moment(b.submittedAt, 'DD-MM-YYYY HH:mm:ss').toDate() - moment(a.submittedAt, 'DD-MM-YYYY HH:mm:ss').toDate());

    res.status(200).json({
      success: true,
      data: responsesWithQuestions,
      total: responsesWithQuestions.length,
    });
  } catch (error) {
    console.error(`Error fetching responses for checklist ${checklistId}: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

exports.GetComment = async (req, res) => {
  const { id } = req.params;
  const { userKeys } = req.query;

  try {
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');
    const answerCommentsCollection = await connectDB('ANSWER_COMMENTS');
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');

    const answer = await answerDetailsCollection.findOne({ responseId: id });
    if (!answer) {
      return res.status(404).json({ message: 'Không tìm thấy phản hồi.' });
    }

    const checklists = await checklistCollection.find().toArray();

    // Extract keysJSON from the answer response, ensuring it's an array
    const keysJSONFromAnswer = Array.isArray(answer.response.keysJSON)
      ? answer.response.keysJSON
      : (answer.response.keysJSON ? [answer.response.keysJSON] : []);

    // Default user data if no match is found
    let matchedUserData = {
      name: answer.response.nguoiphanhoi || "N/A",
      imgAvatar: null
    };

    // Match keysJSON with keys in CHECKLIST_DATABASE
    if (keysJSONFromAnswer.length > 0 && (!userKeys || userKeys === 'all')) {
      for (const checklist of checklists) {
        const checklistKeys = checklist.keys; // Assuming 'keys' is a string in CHECKLIST_DATABASE
        if (checklistKeys) {
          const isMatch = keysJSONFromAnswer.includes(checklistKeys);
          if (isMatch) {
            matchedUserData = {
              name: checklist.name || answer.response.nguoiphanhoi || "N/A",
              imgAvatar: checklist.imgAvatar || null,
              username: checklist.username || "N/A",
              imgBackground: checklist.imgBackground || null,
              locker: checklist.locker || false,
              keys: checklist.keys || "N/A",
              email: checklist.email || null,
              chucvu: checklist.chucvu || null,
              chinhanh: checklist.chinhanh || null,
              bophan: checklist.bophan || null,
            };
            break;
          }
        }
      }
    }

    const answerQuestions = await answerQuestionCollection.find({ responseId: id }).toArray();
    const comments = await answerCommentsCollection.find({ responseId: id }).toArray();

    const processedQuestions = answerQuestions
      .sort((a, b) => a.question.index - b.question.index)
      .map(q => {
        const questionComments = comments.filter(c => c.questionId === q.question.id);
        return {
          ...q.question,
          replies: questionComments
            .filter(c => !c.parentCommentId)
            .map(c => ({
              ...c.content,
              id: c.commentId,
              traloi: questionComments
                .filter(nc => nc.parentCommentId === c.commentId)
                .map(nc => ({ ...nc.content, id: nc.commentId }))
            }))
        };
      });

    // Filter out unwanted fields from the response
    const {
      contentTitle,
      ngay_phan_hoi,
      nguoitaophieu,
      phongban,
      demcauhoi,
      solanlaplai,
      yeucauxuly,
      DapAn,
      ...filteredResponse
    } = answer.response;

    const dataCautraloi = {
      ...filteredResponse,
      questions: processedQuestions,
      responseId: answer.responseId,
      user: matchedUserData
    };

    res.status(200).json({ data: dataCautraloi });
  } catch (error) {
    console.error('Error retrieving DataCautraloi:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.UpdateResponse = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');

    // Nếu updateData có mảng watching, loại bỏ các giá trị trùng lặp
    if (updateData.watching) {
      updateData.watching = [...new Set(updateData.watching)];
    }

    // Tạo đối tượng updateFields để cập nhật các trường trong response
    const updateFields = Object.keys(updateData).reduce((acc, key) => {
      if (key !== 'questions' && key !== 'changedBy') {
        acc[`response.${key}`] = updateData[key];
      }
      return acc;
    }, {});

    // Tạo updateOperation với $set ban đầu
    const updateOperation = { $set: updateFields };

    // Nếu có cập nhật trạng thái (trangthai) và changedBy được cung cấp
    if (updateData.trangthai && updateData.changedBy) {
      const user = await checklistCollection.findOne({ keys: updateData.changedBy });
      const userName = user ? user.name : 'Unknown';
      const historyEntry = {
        changedBy: updateData.changedBy,
        changedByName: userName,
        newStatus: updateData.trangthai,
        timestamp: new Date().toISOString(),
      };
      updateOperation.$push = { "response.statusHistory": historyEntry };
    }

    // Thực hiện cập nhật trong answerDetailsCollection
    const result = await answerDetailsCollection.updateOne(
      { responseId: id },
      updateOperation
    );

    // Cập nhật câu hỏi nếu có
    if (updateData.questions) {
      await answerQuestionCollection.deleteMany({ responseId: id });
      const newQuestions = updateData.questions.map((question, index) => ({
        checklistId: updateData.id,
        responseId: id,
        questionId: uuidv4(),
        question: { ...question, index }
      }));
      if (newQuestions.length > 0) {
        await answerQuestionCollection.insertMany(newQuestions);
      }
    }

    // Trả về kết quả
    if (result.modifiedCount > 0) {
      const updatedDoc = await answerDetailsCollection.findOne({ responseId: id });
      const answerQuestions = await answerQuestionCollection.find({ responseId: id }).toArray();
      const questions = answerQuestions
        .sort((a, b) => a.question.index - b.question.index)
        .map(q => q.question);

      const updatedItem = {
        ...updatedDoc.response,
        questions,
        responseId: updatedDoc.responseId
      };
      res.json({ message: 'Updated successfully', updatedItem });
    } else {
      res.status(404).json({ message: 'Document not found' });
    }
  } catch (error) {
    console.error(`Error updating document: ${error}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.GetAssignedResponses = async (req, res) => {
  const { page = 1, pageSize = 5, startDate, endDate, keysJSON, title, chiNhanh, phongBan, userKeys, userBophan, userChinhanh } = req.query;

  const parsedPage = parseInt(page) || 1;
  const parsedPageSize = parseInt(pageSize) || 5;

  try {
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');

    // Lấy tất cả checklist từ CHECKLIST_DATABASE
    const checklists = await checklistCollection.find({}).toArray();

    // Xây dựng query cơ bản để lấy dữ liệu từ ANSWER_DETAILS
    const query = {};

    // Lọc theo ngày
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
      query.$or = [
        {
          "response.submittedAt": {
            $gte: dateQuery.$gte || undefined,
            $lte: dateQuery.$lte || undefined,
          },
        },
        {
          "response.ngay_phan_hoi": {
            $gte: dateQuery.$gte || undefined,
            $lte: dateQuery.$lte || undefined,
          },
        },
      ].filter((q) => Object.keys(q["response.submittedAt"] || q["response.ngay_phan_hoi"]).length > 0);
    }

    // Lọc theo keysJSON
    if (keysJSON) {
      const keysArray = Array.isArray(keysJSON) ? keysJSON : keysJSON.split(',').map(key => key.trim());
      query["response.keysJSON"] = { $in: keysArray };
    }

    // Lọc theo tiêu đề
    if (title) query["response.title"] = { $regex: new RegExp(title, 'i') };

    // Lọc theo chi nhánh
    if (chiNhanh) query["response.chi_nhanh"] = { $regex: new RegExp(chiNhanh, 'i') };

    // Lọc theo phòng ban
    if (phongBan) query["response.phongban"] = { $regex: new RegExp(phongBan, 'i') };

    // Lọc dựa trên userKeys, userBophan, userChinhanh
    const accessQuery = [];

    // Kiểm tra userKeys trong response.usersview
    if (userKeys) {
      accessQuery.push({
        "response.usersview": userKeys,
      });
    }

    // Kiểm tra userBophan trong response.departmentsview
    if (userBophan) {
      accessQuery.push({
        "response.departmentsview": userBophan,
      });
    }

    // Kiểm tra userChinhanh trong response.restaurantsview
    if (userChinhanh) {
      accessQuery.push({
        "response.restaurantsview": userChinhanh,
      });
    }

    // Nếu có ít nhất một điều kiện truy cập, thêm vào query với $or
    if (accessQuery.length > 0) {
      query.$or = accessQuery;
    } else {
      // Nếu không có userKeys, userBophan, userChinhanh, trả về rỗng
      query._id = { $exists: false };
    }

    const total = await answerDetailsCollection.countDocuments(query);

    // Xây dựng pipeline cho aggregation
    const pipeline = [
      {
        $match: query,
      },
      {
        $addFields: {
          convertedNgayPhanHoi: {
            $cond: {
              if: { $eq: ["$response.ngay_phan_hoi", null] },
              then: new Date(),
              else: {
                $dateFromString: {
                  dateString: "$response.ngay_phan_hoi",
                  format: "%d-%m-%Y %H:%M:%S",
                  onError: {
                    $dateFromString: {
                      dateString: "$response.ngay_phan_hoi",
                      format: "%d-%m-%Y",
                      onError: new Date(),
                    },
                  },
                },
              },
            },
          },
        },
      },
      { $sort: { convertedNgayPhanHoi: -1 } },
      { $skip: (parsedPage - 1) * parsedPageSize },
      { $limit: parsedPageSize },
    ];

    const answers = await answerDetailsCollection.aggregate(pipeline).toArray();

    const allDataCautraloi = answers.map((answer) => {
      const { questions, contentTitle, ...responseWithoutQuestionsAndContentTitle } = answer.response;

      // Khởi tạo matchedUserData với các giá trị mặc định
      let matchedUserData = {
        name: answer.response.nguoiphanhoi || "N/A",
        username: "N/A",
        imgAvatar: null,
        keys: answer.response.keysJSON || "N/A",
        email: null,
        chucvu: null,
        chinhanh: answer.response.chi_nhanh || "N/A",
        bophan: answer.response.phongban || "N/A",
        locker: false,
        imgBackground: null,
      };

      // Khớp keysJSON với CHECKLIST_DATABASE
      const keysJSONFromAnswer = Array.isArray(answer.response.keysJSON)
        ? answer.response.keysJSON
        : answer.response.keysJSON
          ? [answer.response.keysJSON]
          : [];

      if (keysJSONFromAnswer.length > 0) {
        for (const checklist of checklists) {
          const checklistKey = checklist.keys;
          if (checklistKey && keysJSONFromAnswer.includes(checklistKey)) {
            matchedUserData = {
              name: checklist.name || answer.response.nguoiphanhoi || "N/A",
              username: checklist.username || "N/A",
              imgAvatar: checklist.imgAvatar || null,
              keys: checklist.keys || answer.response.keysJSON || "N/A",
              email: checklist.email || null,
              chucvu: checklist.chucvu || null,
              chinhanh: checklist.chinhanh || answer.response.chi_nhanh || "N/A",
              bophan: checklist.bophan || answer.response.phongban || "N/A",
              locker: checklist.locker || false,
              imgBackground: checklist.imgBackground || null,
            };
            break;
          }
        }
      }

      return {
        ...responseWithoutQuestionsAndContentTitle,
        responseId: answer.responseId,
        keysJSON: answer.response.keysJSON || "",
        name: matchedUserData.name,
        imgAvatar: matchedUserData.imgAvatar,
        chi_nhanh: answer.response.chi_nhanh || "N/A",
        phongban: matchedUserData.bophan,
        username: matchedUserData.username,
        email: matchedUserData.email,
        chucvu: matchedUserData.chucvu,
        locker: matchedUserData.locker,
        imgBackground: matchedUserData.imgBackground,
      };
    });

    res.status(200).json({
      success: true,
      data: allDataCautraloi,
      total,
      page: parsedPage,
      pageSize: parsedPageSize,
    });
  } catch (error) {
    console.error(`Error fetching assigned responses: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

exports.GetArchiveResponses = async (req, res) => {
  const { startDate, endDate, title, chinhanh } = req.query;

  try {
    const answerDetailsCollection = await connectDB('ANSWER_DETAILS');
    const answerQuestionCollection = await connectDB('ANSWER_QUESTION');

    // Xây dựng query cơ bản
    const query = {
      "response.Cauhinhdiem": true // Chỉ lấy các response có Cauhinhdiem = true
    };

    // Thêm điều kiện lọc theo ngày
    if (startDate || endDate) {
      const dateQuery = {};
      if (startDate) {
        const start = moment(startDate, 'DD-MM-YYYY HH:mm:ss').startOf('day').format('DD-MM-YYYY HH:mm:ss');
        dateQuery.$gte = start;
      }
      if (endDate) {
        const end = moment(endDate, 'DD-MM-YYYY HH:mm:ss').endOf('day').format('DD-MM-YYYY HH:mm:ss');
        dateQuery.$lte = end;
      }
      query.$or = [
        { "response.submittedAt": dateQuery },
        { "response.ngay_phan_hoi": dateQuery }
      ];
    }

    // Thêm điều kiện lọc theo title nếu có
    if (title) {
      query["response.title"] = { $regex: new RegExp(title, 'i') };
    }

    // Thêm điều kiện lọc theo chi nhánh nếu có
    if (chinhanh) {
      query["response.chi_nhanh"] = { $regex: new RegExp(chinhanh, 'i') };
    }

    // Lấy tất cả responses thỏa mãn điều kiện
    const responses = await answerDetailsCollection.find(query).toArray();

    // Lấy questions cho mỗi response
    const responsesWithQuestions = await Promise.all(responses.map(async (response) => {
      const questions = await answerQuestionCollection
        .find({ responseId: response.responseId })
        .toArray();

      return {
        ...response.response,
        questions: questions.map(q => q.question),
        responseId: response.responseId
      };
    }));

    res.status(200).json({
      success: true,
      data: responsesWithQuestions
    });

  } catch (error) {
    console.error('Error fetching archive responses:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};