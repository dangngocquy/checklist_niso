// quiz.js
const { connectDB } = require('./MongoDB/database');
const { v4: uuidv4 } = require('uuid');

let io;

exports.setIo = (socketIo) => {
  io = socketIo;
};

let cachedQuizDb = null;
let cachedQuizBackgroundDb = null;
let cachedQuizQuestionDb = null;

async function getQuizDBConnection() {
  if (!cachedQuizDb) {
    cachedQuizDb = await connectDB('CHECKLIST_QUIZ');
  }
  return cachedQuizDb;
}

async function getQuizBackgroundDBConnection() {
  if (!cachedQuizBackgroundDb) {
    cachedQuizBackgroundDb = await connectDB('CHECKLIST_QUIZ_BACKGROUND');
  }
  return cachedQuizBackgroundDb;
}

async function getQuizQuestionDBConnection() {
  if (!cachedQuizQuestionDb) {
    cachedQuizQuestionDb = await connectDB('CHECKLIST_QUIZ_QUESTION');
  }
  return cachedQuizQuestionDb;
}

exports.createQuizRoom = async (req, res) => {
  const { quizId } = req.body;
  if (!quizId) {
    return res.status(400).json({ success: false, message: 'QuizId là bắt buộc' });
  }
  try {
    const quizCollection = await getQuizDBConnection();
    const quiz = await quizCollection.findOne({ quizId });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy quiz' });
    }
    if (io) {
      io.to(quizId).emit('roomCreated', { quizId, message: 'Phòng đã được tạo' });
    }
    res.json({ success: true, message: 'Tạo phòng thành công' });
  } catch (error) {
    console.error('Lỗi khi tạo phòng:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

exports.saveQuiz = async (req, res) => {
  const { title, questions, isDraft, userKeys, background, description } = req.body;

  if (!title || !questions || !Array.isArray(questions) || !userKeys) {
    return res.status(400).json({ success: false, message: 'Title, questions và userKeys là bắt buộc' });
  }

  try {
    const quizCollection = await getQuizDBConnection();
    const questionCollection = await getQuizQuestionDBConnection();

    const quizId = uuidv4();
    const quizData = {
      quizId,
      title,
      description: description || '',
      userKeys,
      background: background || null,
      isDraft: !!isDraft,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      gamePin: null,
      participants: [],
      status: 'pending', // Initial status
      steps: 0, // Initial steps
    };

    await quizCollection.insertOne(quizData);

    const questionData = questions.map(question => {
      // Thêm answerId cho mỗi đáp án
      const answersWithIds = question.answers ? question.answers.map(answer => ({
        ...answer,
        answerId: uuidv4()
      })) : [];

      return {
        quizId,
        questionId: uuidv4(),
        ...question,
        answers: answersWithIds,
        createdAt: new Date().toISOString(),
      };
    });

    if (questionData.length > 0) {
      await questionCollection.insertMany(questionData);
    }
    if (io) {
      io.emit('quizSaved', { quizId, title, isDraft });
    }
    res.json({ success: true, quizId, message: isDraft ? 'Lưu bản nháp thành công' : 'Lưu quiz thành công' });
  } catch (error) {
    console.error('Lỗi khi lưu quiz:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

exports.getAllQuizzes = async (req, res) => {
  try {
    const quizCollection = await getQuizDBConnection();
    const questionCollection = await getQuizQuestionDBConnection();
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');

    // Lấy tất cả quiz và sắp xếp theo thời gian tạo mới nhất
    const quizzes = await quizCollection.find({})
      .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo mới nhất
      .toArray();

    const quizIds = quizzes.map(quiz => quiz.quizId);
    
    // Lấy tất cả câu hỏi cho các quiz
    const allQuestions = await questionCollection.find({ quizId: { $in: quizIds } })
      .sort({ createdAt: 1 }) // Sắp xếp câu hỏi theo thời gian tạo
      .toArray();

    // Tạo map để lưu trữ câu hỏi theo quizId
    const questionsMap = {};
    allQuestions.forEach(question => {
      if (!questionsMap[question.quizId]) {
        questionsMap[question.quizId] = [];
      }
      questionsMap[question.quizId].push(question);
    });

    // Lấy thông tin người dùng
    const userKeysSet = new Set(quizzes.map(quiz => quiz.userKeys).filter(Boolean));
    const userKeysArray = Array.from(userKeysSet);

    const users = userKeysArray.length > 0 ? await checklistCollection.find({ keys: { $in: userKeysArray } }).toArray() : [];
    const userMap = {};
    users.forEach(user => {
      userMap[user.keys] = {
        keys: user.keys || null,
        name: user.name,
        imgAvatar: user.imgAvatar || null,
        bophan: user.bophan,
        chinhanh: user.chinhanh,
        username: user.username,
        imgBackground: user.imgBackground || null,
        locker: user.locker || false,
        email: user.email || null,
        chucvu: user.chucvu || null,
      };
    });

    // Kết hợp dữ liệu
    const enrichedQuizzes = quizzes.map(quiz => ({
      ...quiz,
      questions: questionsMap[quiz.quizId] || [],
      user: userMap[quiz.userKeys] || {},
      background: quiz.background || null,
      createdAt: quiz.createdAt || new Date().toISOString(),
      updatedAt: quiz.updatedAt || new Date().toISOString()
    }));

    res.json({ success: true, data: enrichedQuizzes });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

exports.getQuizById = async (req, res) => {
  const { quizId } = req.params;

  if (!quizId) {
    return res.status(400).json({ success: false, message: 'QuizId is required' });
  }

  try {
    const quizCollection = await getQuizDBConnection();
    const questionCollection = await getQuizQuestionDBConnection();
    const checklistCollection = await connectDB('CHECKLIST_DATABASE');

    const quiz = await quizCollection.findOne({ quizId });

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const questions = await questionCollection.find({ quizId }).sort({ createdAt: 1 }).toArray();
    const totalQuestions = questions.length;

    let userData = {};
    if (quiz.userKeys) {
      const user = await checklistCollection.findOne({ keys: quiz.userKeys });
      if (user) {
        userData = {
          keys: user.keys || null,
          name: user.name,
          imgAvatar: user.imgAvatar || null,
          bophan: user.bophan,
          chinhanh: user.chinhanh,
          username: user.username,
          imgBackground: user.imgBackground || null,
          locker: user.locker || false,
          email: user.email || null,
          chucvu: user.chucvu || null,
        };
      }
    }


    const enrichedQuiz = {
      ...quiz,
      totalQuestions,
      questions, // Make sure questions are properly ordered if needed by client
      user: userData,
      steps: quiz.steps || 0, // Ensure steps is returned, defaulting to 0
      status: quiz.status || 'pending' // Ensure status is returned
    };

    res.json({ success: true, data: enrichedQuiz });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

exports.updateQuizPin = async (req, res) => {
  const { quizId, gamePin, isLocked, clientId, status, steps, selectedAnswers, maxParticipants, background } = req.body;

  if (!quizId) {
    console.error('Missing quizId in request');
    return res.status(400).json({ success: false, message: 'QuizId là bắt buộc' });
  }

  try {
    const quizCollection = await getQuizDBConnection();
    const questionCollection = await getQuizQuestionDBConnection();
    const quiz = await quizCollection.findOne({ quizId });

    if (!quiz) {
      console.error(`Quiz not found for quizId: ${quizId}`);
      return res.status(404).json({ success: false, message: 'Không tìm thấy quiz' });
    }

    const updateData = {
      updatedAt: new Date().toISOString(),
    };

    if (gamePin !== undefined) {
      updateData.gamePin = gamePin;
      console.log(`Updating gamePin to: ${gamePin}`);
    }

    if (typeof isLocked === 'boolean') {
      updateData.isLocked = isLocked;
      console.log(`Updating isLocked to: ${isLocked}`);
    }

    if (typeof maxParticipants === 'number' && maxParticipants > 0) {
      updateData.maxParticipants = maxParticipants;
      console.log(`Updating maxParticipants to: ${maxParticipants}`);
    }

    if (background !== undefined) {
      updateData.background = background;
      console.log(`Updating background to: ${background}`);
    }

    if (clientId) {
      if (selectedAnswers && selectedAnswers.length > 0) {
        // Cập nhật đáp án cho người chơi
        const participantIndex = quiz.participants.findIndex(p => p.clientId === clientId);
        if (participantIndex !== -1) {
          const questionAnswers = selectedAnswers[0];
          
          if (!questionAnswers || !questionAnswers.questionId) {
            console.error('Invalid selectedAnswers format:', questionAnswers);
            return res.status(400).json({ success: false, message: 'Định dạng đáp án không hợp lệ' });
          }

          const question = await questionCollection.findOne({ 
            quizId: quizId,
            questionId: questionAnswers.questionId 
          });

          if (!question) {
            console.error('Question not found:', questionAnswers.questionId);
            return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
          }

          let isCorrect = false;
          let score = 0;

          if (questionAnswers.answerIds && questionAnswers.answerIds.length > 0) {
            if (question.type === 'multiple-choice') {
              const correctAnswers = question.answers
                .filter(answer => answer.correct)
                .map(answer => answer.answerId);
              
              console.log('=== DEBUG MULTIPLE CHOICE ===');
              console.log('Question:', {
                questionId: question.questionId,
                type: question.type,
                answers: question.answers.map(a => ({
                  answerId: a.answerId,
                  text: a.text,
                  correct: a.correct
                }))
              });
              console.log('Correct answers:', correctAnswers);
              console.log('User selected answers:', questionAnswers.answerIds);
              
              isCorrect = correctAnswers.length === questionAnswers.answerIds.length && 
                         correctAnswers.every(id => questionAnswers.answerIds.includes(id));
              console.log('Is correct (multiple-choice):', isCorrect);
              score = isCorrect ? 100 : 0;
              console.log('Score:', score);
              console.log('=== END DEBUG ===');
            } else if (question.type === 'true-false') {
              const selectedAnswer = question.answers.find(answer => answer.answerId === questionAnswers.answerIds[0]);
              console.log('Selected answer (true-false):', selectedAnswer);
              isCorrect = selectedAnswer?.correct === true;
              console.log('Is correct (true-false):', isCorrect);
              score = isCorrect ? 100 : 0;
            } else if (question.type === 'fill-blank') {
              const userAnswer = question.answers[0]?.text || '';
              const correctAnswer = question.answers[0]?.correctAnswer || '';
              console.log('User answer (fill-blank):', userAnswer);
              console.log('Correct answer (fill-blank):', correctAnswer);
              isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
              console.log('Is correct (fill-blank):', isCorrect);
              score = isCorrect ? 100 : 0;
            }
          } else {
            // Không có đáp án được chọn
            isCorrect = null;
            score = 0;
            console.log('No answers selected, setting isCorrect to null');
          }

          console.log('Final result:', { isCorrect, score });
          console.log('=== END DEBUG ===');

          const existingAnswers = quiz.participants[participantIndex].selectedAnswers || [];
          const answerIndex = existingAnswers.findIndex(a => a.questionId === questionAnswers.questionId);

          if (answerIndex !== -1) {
            const updatedAnswers = [...existingAnswers];
            updatedAnswers[answerIndex] = {
              ...questionAnswers,
              answerIds: questionAnswers.answerIds || [],
              isCorrect,
              score
            };
            updateData[`participants.${participantIndex}.selectedAnswers`] = updatedAnswers;
          } else {
            updateData[`participants.${participantIndex}.selectedAnswers`] = [...existingAnswers, {
              ...questionAnswers,
              answerIds: questionAnswers.answerIds || [],
              isCorrect,
              score
            }];
          }

          if (io) {
            io.to(quizId).emit('answerResult', {
              quizId,
              clientId,
              questionId: questionAnswers.questionId,
              isCorrect,
              score
            });
          }

          console.log(`Updating selectedAnswers for participant ${clientId}:`, questionAnswers);
        }
      } else {
        // Xóa người chơi khỏi phòng
        updateData.participants = (quiz.participants || []).filter(p => p.clientId !== clientId);
        console.log(`Removing participant with clientId: ${clientId}`);
        if (io) {
          io.to(quizId).emit('participantRemoved', { clientId, quizId });
        }
      }
    }

    if (status) {
      updateData.status = status;
      console.log(`Updating status to: ${status}`);
    }

    if (steps !== undefined && typeof steps === 'number' && steps >= 0) {
      const totalQuestions = await questionCollection.countDocuments({ quizId });

      if (steps === 0 || (steps > 0 && steps <= totalQuestions)) {
        updateData.steps = steps;
        console.log(`Updating steps to: ${steps}`);
      } else if (steps > totalQuestions) {
        console.warn(`Invalid steps value: ${steps}, total questions: ${totalQuestions}`);
      }
    }

    const unsetData = {};
    if (steps === undefined) {
      unsetData.steps = "";
      console.log('Removing steps field from quiz document');
    }

    const updateOperation = {};
    if (Object.keys(updateData).length > 0) {
      updateOperation.$set = updateData;
    }
    if (Object.keys(unsetData).length > 0) {
      updateOperation.$unset = unsetData;
    }

    if (Object.keys(updateOperation).length === 0) {
      console.warn('No fields to update or unset for quizId:', quizId);
      return res.status(400).json({ success: false, message: 'Không có trường nào để cập nhật' });
    }

    const result = await quizCollection.updateOne(
      { quizId },
      updateOperation
    );

    if (result.matchedCount === 0) {
      console.error(`No quiz matched for quizId: ${quizId}`);
      return res.status(404).json({ success: false, message: 'Không tìm thấy quiz để cập nhật' });
    }

    const updatedQuiz = await quizCollection.findOne({ quizId });

    if (io) {
      io.to(quizId).emit('roomUpdated', {
        quizId,
        gamePin: updatedQuiz.gamePin,
        isLocked: updatedQuiz.isLocked,
        status: updatedQuiz.status,
        steps: updatedQuiz.steps,
        maxParticipants: updatedQuiz.maxParticipants,
        background: updatedQuiz.background
      });
    }
    res.json({
      success: true,
      message: 'Cập nhật thành công',
      gamePin: updatedQuiz.gamePin,
      isLocked: updatedQuiz.isLocked,
      status: updatedQuiz.status,
      steps: updatedQuiz.steps,
      maxParticipants: updatedQuiz.maxParticipants,
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật quiz PIN:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

exports.deleteQuiz = async (req, res) => {
  const { quizId } = req.params;

  if (!quizId) {
    return res.status(400).json({ success: false, message: 'QuizId là bắt buộc' });
  }

  try {
    const quizCollection = await getQuizDBConnection();
    const questionCollection = await getQuizQuestionDBConnection();

    const result = await quizCollection.deleteOne({ quizId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy quiz để xóa' });
    }

    // Also delete associated questions
    await questionCollection.deleteMany({ quizId });

    if (io) {
      io.emit('quizDeleted', { quizId }); // Notify clients about the deletion
    }

    res.json({ success: true, message: 'Quiz đã được xóa thành công' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

exports.saveQuizBackground = async (req, res) => {
  const { url, name, category } = req.body;

  if (!url || !name || !category) {
    return res.status(400).json({ success: false, message: 'URL, name và category là bắt buộc' });
  }

  try {
    const backgroundCollection = await getQuizBackgroundDBConnection();

    const backgroundData = {
      id: uuidv4(),
      url,
      name,
      category,
      createdAt: new Date().toISOString()
    };

    await backgroundCollection.insertOne(backgroundData);

    res.json({ success: true, data: backgroundData });
  } catch (error) {
    console.error('Error saving background:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

exports.getAllQuizBackgrounds = async (req, res) => {
  try {
    const backgroundCollection = await getQuizBackgroundDBConnection();

    const backgrounds = await backgroundCollection.find({}).toArray();

    res.json({ success: true, data: backgrounds });
  } catch (error) {
    console.error('Error fetching backgrounds:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

exports.getCustomBackgrounds = async (req, res) => {
  try {
    const backgroundCollection = await getQuizBackgroundDBConnection();

    const customBackgrounds = await backgroundCollection.find({ category: 'custom' }).toArray();

    res.json({ success: true, data: customBackgrounds });
  } catch (error) {
    console.error('Error fetching custom backgrounds:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

exports.validatePin = async (req, res) => {
  const { gamePin, participant, clientId } = req.body;

  if (!gamePin && !clientId) {
    return res.status(400).json({ success: false, message: 'Mã PIN hoặc clientId là bắt buộc' });
  }

  try {
    const quizCollection = await getQuizDBConnection();
    let quiz;

    if (clientId) {
      quiz = await quizCollection.findOne({
        'participants.clientId': clientId,
      });

      if (!quiz) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng hoặc phiên trò chơi.' });
      }

      const existingParticipant = quiz.participants.find(p => p.clientId === clientId);

      return res.json({
        success: true,
        quizId: quiz.quizId,
        gamePin: quiz.gamePin,
        isLocked: quiz.isLocked || false,
        participant: existingParticipant,
        status: quiz.status,
        steps: quiz.steps || 0,
        isCountingDown: quiz.status === 'playing' && quiz.steps === 0,
        maxParticipants: quiz.maxParticipants,
      });
    }

    quiz = await quizCollection.findOne({ gamePin });

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Mã PIN không đúng hoặc đã hết hạn.' });
    }

    if (quiz.status === 'playing' && quiz.steps > 0 && participant) {
      return res.status(403).json({ success: false, message: 'Trò chơi đã bắt đầu, không thể tham gia mới.' });
    }

    if (quiz.isLocked && participant) {
      return res.status(403).json({ success: false, message: 'Phòng đã bị khóa.' });
    }

    // Kiểm tra giới hạn người tham gia
    if (participant && quiz.maxParticipants) {
      const currentParticipants = quiz.participants?.length || 0;
      if (currentParticipants >= quiz.maxParticipants) {
        return res.status(403).json({ success: false, message: 'Phòng đã đạt giới hạn số người tham gia.' });
      }
    }

    if (participant) {
      const existingParticipantByName = quiz.participants?.find(p => p.name === participant.name);
      if (existingParticipantByName) {
        // Có thể xử lý logic tái tham gia ở đây nếu cần
      }

      const newParticipantData = {
        ...participant,
        joinedAt: new Date().toISOString(),
        score: participant.score || 0,
      };

      const updateResult = await quizCollection.updateOne(
        { gamePin, quizId: quiz.quizId },
        {
          $push: { participants: newParticipantData },
          $set: { updatedAt: new Date().toISOString() },
        }
      );

      if (!updateResult.modifiedCount) {
        return res.status(500).json({ success: false, message: 'Không thể thêm người tham gia. Vui lòng thử lại.' });
      }
      if (io) {
        io.to(quiz.quizId).emit('participantJoined', {
          quizId: quiz.quizId,
          participant: newParticipantData,
        });
      }
    }

    res.json({
      success: true,
      quizId: quiz.quizId,
      gamePin: quiz.gamePin,
      isLocked: quiz.isLocked || false,
      status: quiz.status,
      steps: quiz.steps || 0,
      isCountingDown: quiz.status === 'playing' && quiz.steps === 0,
      maxParticipants: quiz.maxParticipants,
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra mã PIN:', error);
    res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra. Mã PIN không đúng hoặc đã hết hạn.' });
  }
};