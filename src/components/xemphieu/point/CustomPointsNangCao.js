export const calculateAdvancedPoints = (questions, pointConfigs, configPoints) => {
  // Kiểm tra đầu vào cơ bản
  if (!questions || !Array.isArray(questions)) {
    return {
      sumPoint: "0/0",
      getPoint: "0%",
      earnPoint: "0",
      hasPoints: false,
      totalIncorrectPoints: 0,
      totalConfigPoints: 0,
    };
  }

  let totalPoints = 0; // Tổng điểm tất cả câu hỏi
  let configPointsTotal = 0; // Tổng điểm từ pointConfigs
  let penaltyPoints = 0; // Tổng điểm sai
  let isConfigPointsValid = true; // Biến kiểm tra câu hỏi điều kiện

  // Tính tổng điểm tất cả câu hỏi
  questions.forEach((question) => {
    const point = parseFloat(question.point) || 0;
    totalPoints += point;
  });

  // Kiểm tra câu hỏi điều kiện nếu configPoints tồn tại
  if (configPoints && configPoints.questionId && configPoints.answer) {
    const configQuestion = questions.find((q) => q.questionId === configPoints.questionId);
    if (!configQuestion) {
      isConfigPointsValid = false;
    } else {
      // Chuẩn hóa câu trả lời của người dùng
      const answerLower = Array.isArray(configQuestion.answer)
        ? configQuestion.answer.map((a) => String(a || "").toLowerCase().trim()).filter(Boolean)
        : [String(configQuestion.answer || "").toLowerCase().trim()].filter(Boolean);

      // Chuẩn hóa đáp án trong configPoints
      const configAnswerLower = Array.isArray(configPoints.answer)
        ? configPoints.answer.map((a) => String(a || "").toLowerCase().trim()).filter(Boolean)
        : [String(configPoints.answer || "").toLowerCase().trim()].filter(Boolean);

      // Kiểm tra xem đáp án trong configPoints có phải là "other" không
      const isOtherAnswer = configAnswerLower.includes("other");
      if (isOtherAnswer) {
        let correctAnswer;
        if (Array.isArray(configQuestion.cautraloi)) {
          correctAnswer = configQuestion.cautraloi.find((item) => !Array.isArray(item)) || "";
        } else {
          correctAnswer = configQuestion.cautraloi || "";
        }
        const otherAnswer = configQuestion.cautraloimoikhac || "";
        isConfigPointsValid =
          String(correctAnswer).toLowerCase().trim() === String(otherAnswer).toLowerCase().trim();
      } else {
        isConfigPointsValid =
          answerLower.length === configAnswerLower.length &&
          answerLower.every((ans) => configAnswerLower.includes(ans)) &&
          configAnswerLower.every((ans) => answerLower.includes(ans));
      }
    }
  } else {
    // Nếu không có configPoints, bỏ qua kiểm tra câu hỏi điều kiện
    isConfigPointsValid = true;
  }

  // Nếu câu hỏi điều kiện không hợp lệ, trả về kết quả mặc định
  if (!isConfigPointsValid) {
    return {
      sumPoint: "0/0",
      getPoint: "0%",
      earnPoint: "0",
      hasPoints: false,
      totalIncorrectPoints: 0,
      totalConfigPoints: 0,
    };
  }

  // Hàm kiểm tra câu trả lời sai
  const isAnswerIncorrect = (question) => {
    const { answer, cautraloi, xulynhiemvu, luachon, options = [] } = question;
    if (xulynhiemvu) return false;
    if (!cautraloi || cautraloi === "") return false;
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return true;

    const normalizeAnswer = (ans) => String(ans).toLowerCase().trim();
    const correctAnswers = Array.isArray(cautraloi)
      ? cautraloi.map(normalizeAnswer)
      : cautraloi.toLowerCase().split(",").map(normalizeAnswer);

    if (luachon?.option2) {
      const answerLower = normalizeAnswer(answer);
      const isValidOption = options.some(
        (option) => normalizeAnswer(option.tuychon) === answerLower
      );
      return !isValidOption || !correctAnswers.includes(answerLower);
    }

    if (luachon?.option3) {
      const answers = Array.isArray(answer)
        ? answer.map(normalizeAnswer)
        : [normalizeAnswer(answer)].filter(Boolean);
      const areValidOptions = answers.every((ans) =>
        options.some((option) => normalizeAnswer(option.tuychonnhieu) === ans)
      );
      const isAllAnswersCorrect =
        answers.length === correctAnswers.length &&
        answers.every((ans) => correctAnswers.includes(ans)) &&
        correctAnswers.every((ans) => answers.includes(ans));
      return !areValidOptions || !isAllAnswersCorrect;
    }

    if (Array.isArray(answer)) {
      const hasCorrect = answer.every((a) => correctAnswers.includes(normalizeAnswer(a)));
      const hasIncorrect = answer.some((a) => !correctAnswers.includes(normalizeAnswer(a)));
      return !hasCorrect || hasIncorrect;
    } else {
      return !correctAnswers.includes(normalizeAnswer(answer));
    }
  };

  // Tính điểm từ pointConfigs (nếu có) và tạo danh sách câu hỏi đúng trong pointConfigNangCao
  const correctConfigQuestions = new Set();
  if (pointConfigs && Array.isArray(pointConfigs) && pointConfigs.length > 0) {
    pointConfigs.forEach((config) => {
      const configQuestion = questions.find((q) => q.questionId === config.questionId);
      if (!configQuestion) return;

      const answerLower = Array.isArray(configQuestion.answer)
        ? configQuestion.answer.map((a) => String(a || "").toLowerCase().trim()).filter(Boolean)
        : [String(configQuestion.answer || "").toLowerCase().trim()].filter(Boolean);
      const configAnswerLower = Array.isArray(config.answer)
        ? config.answer.map((a) => String(a || "").toLowerCase().trim()).filter(Boolean)
        : [String(config.answer || "").toLowerCase().trim()].filter(Boolean);

      const isOtherConfigAnswer = configAnswerLower.includes("other");
      let isConfigMatch = false;

      if (isOtherConfigAnswer) {
        let correctAnswer;
        if (Array.isArray(configQuestion.cautraloi)) {
          correctAnswer = configQuestion.cautraloi.find((item) => !Array.isArray(item)) || "";
        } else {
          correctAnswer = configQuestion.cautraloi || "";
        }
        const otherAnswer = configQuestion.cautraloimoikhac || "";
        isConfigMatch =
          String(correctAnswer).toLowerCase().trim() === String(otherAnswer).toLowerCase().trim();
      } else {
        isConfigMatch =
          answerLower.length === configAnswerLower.length &&
          answerLower.every((ans) => configAnswerLower.includes(ans)) &&
          configAnswerLower.every((ans) => answerLower.includes(ans));
      }

      if (isConfigMatch) {
        const point = parseInt(config.point) || 0;
        configPointsTotal += point;
        correctConfigQuestions.add(config.questionId); // Lưu câu hỏi đúng trong pointConfigNangCao
      }
    });
  }

  // Tính tổng điểm sai, bỏ qua các câu hỏi đúng trong pointConfigNangCao
  questions.forEach((question) => {
    if (isAnswerIncorrect(question) && !correctConfigQuestions.has(question.questionId)) {
      const point = parseFloat(question.point) || 0;
      const laplai = parseInt(question.laplai) || 1;
      penaltyPoints += point * laplai;
    }
  });

  // Tính điểm kiếm được
  const earnPoint = totalPoints - (configPointsTotal + penaltyPoints);
  const sumPoint = `${earnPoint}/${totalPoints}`;
  const getPointValue = totalPoints > configPointsTotal ? earnPoint / (totalPoints - configPointsTotal) : 0;
  const getPoint = `${(getPointValue * 100).toFixed(2)}%`;

  return {
    sumPoint,
    getPoint,
    earnPoint: earnPoint.toString(),
    hasPoints: totalPoints > 0,
    totalIncorrectPoints: penaltyPoints,
    totalConfigPoints: configPointsTotal,
  };
};