const { connectDB } = require('./MongoDB/database');
const moment = require('moment');

exports.GetQuestionsByChecklistId = async (req, res) => {
    const { checklistId } = req.params;
    try {
        const questionCollection = await connectDB('CHECKLIST_QUESTION');
        const checklistCollection = await connectDB('CHECKLIST_DATABASE');

        // Fetch questions
        const questions = await questionCollection.find({ checklistId }).toArray();

        // Fetch checklist to get rankings
        const checklistDoc = await checklistCollection.findOne(
            { 'DataChecklist.id': checklistId },
            { projection: { 'DataChecklist.$': 1 } }
        );

        if (!checklistDoc || !checklistDoc.DataChecklist.length) {
            return res.status(404).json({ message: 'Checklist không tồn tại hoặc đã bị xóa.' });
        }

        const checklist = checklistDoc.DataChecklist[0];

        res.json({
            questions: questions.map((q) => {
                const questionIndex = q.question.index + 1;
                const questionText = q.question[`Cauhoi${questionIndex}`] || 'Question text missing';

                return {
                    id: q.questionId,
                    content: questionText,
                    options: q.question.options || [],
                    tuychonkhac: q.question.tuychonkhac || false,
                    point: parseFloat(q.question.point) || 0,
                    luachon: {
                        option2: q.question.options?.[1]?.tuychon || q.question.options?.[1]?.tuychonnhieu || null,
                        option3: q.question.options?.[2]?.tuychon || q.question.options?.[2]?.tuychonnhieu || null,
                    },
                };
            }),
            pointConfig: checklist.pointConfig || null,
            pointConfigNangCao: checklist.pointConfigNangCao || [],
            rankings: checklist.rankings || [], // Include rankings in response
            Cauhinhdiem: checklist.Cauhinhdiem || false,
        });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.UpdatePointConfig = async (req, res) => {
    const { checklistId } = req.params;
    let { pointConfig, pointConfigNangCao, rankings, Cauhinhdiem } = req.body;

    if (!checklistId) {
        return res.status(400).json({ message: 'Thiếu ID checklist' });
    }

    try {
        const checklistCollection = await connectDB('CHECKLIST_DATABASE');

        const existingDoc = await checklistCollection.findOne(
            { 'DataChecklist.id': checklistId },
            { projection: { 'DataChecklist.$': 1 } }
        );

        if (!existingDoc || !existingDoc.DataChecklist.length) {
            return res.status(404).json({ message: 'Checklist không tồn tại hoặc đã bị xóa.' });
        }

        // Filter out invalid pointConfig
        if (pointConfig && (!pointConfig.questionId || !pointConfig.answer)) {
            pointConfig = null;
        }

        // Validate pointConfig if it exists
        if (pointConfig) {
            const questionCollection = await connectDB('CHECKLIST_QUESTION');
            const question = await questionCollection.findOne({ questionId: pointConfig.questionId });

            if (!question) {
                pointConfig = null;
                console.warn('Removed pointConfig: Question does not exist');
            } else {
                const validAnswers = question.question.options
                    ?.map((opt) => opt.tuychon || opt.tuychonnhieu)
                    .filter(Boolean);

                if (pointConfig.answer === 'other' || (Array.isArray(pointConfig.answer) && pointConfig.answer.includes('other'))) {
                    if (!question.question.tuychonkhac) {
                        pointConfig = null;
                        console.warn('Removed pointConfig: Question does not support "other" option');
                    }
                } else if (Array.isArray(pointConfig.answer)) {
                    const invalidAnswers = pointConfig.answer.filter((ans) => !validAnswers.includes(ans));
                    if (invalidAnswers.length > 0) {
                        pointConfig = null;
                        console.warn(`Removed pointConfig: Invalid answers: ${invalidAnswers.join(', ')}`);
                    }
                } else if (validAnswers && !validAnswers.includes(pointConfig.answer)) {
                    pointConfig = null;
                    console.warn(`Removed pointConfig: Invalid answer: ${pointConfig.answer}`);
                }
            }
        }

        // Filter out invalid pointConfigNangCao entries
        if (Array.isArray(pointConfigNangCao)) {
            const questionCollection = await connectDB('CHECKLIST_QUESTION');
            pointConfigNangCao = await Promise.all(
                pointConfigNangCao.map(async (config) => {
                    if (!config.questionId || !config.answer) {
                        return null;
                    }

                    const question = await questionCollection.findOne({ questionId: config.questionId });
                    if (!question) {
                        console.warn(`Removed pointConfigNangCao: Question does not exist for config: ${config.questionId}`);
                        return null;
                    }

                    const validAnswers = question.question.options
                        ?.map((opt) => opt.tuychon || opt.tuychonnhieu)
                        .filter(Boolean);

                    if (config.answer === 'other' || (Array.isArray(config.answer) && config.answer.includes('other'))) {
                        if (!question.question.tuychonkhac) {
                            console.warn(`Removed pointConfigNangCao: Question does not support "other" option for config: ${config.questionId}`);
                            return null;
                        }
                    } else if (Array.isArray(config.answer)) {
                        const invalidAnswers = config.answer.filter((ans) => !validAnswers.includes(ans));
                        if (invalidAnswers.length > 0) {
                            console.warn(`Removed pointConfigNangCao: Invalid answers: ${invalidAnswers.join(', ')}`);
                            return null;
                        }
                    } else if (validAnswers && !validAnswers.includes(config.answer)) {
                        console.warn(`Removed pointConfigNangCao: Invalid answer: ${config.answer}`);
                        return null;
                    }

                    return config;
                })
            );
            pointConfigNangCao = pointConfigNangCao.filter((config) => config !== null);
        }

        // Validate rankings
        if (Array.isArray(rankings) && rankings.length > 0) {
            // Check if at least one configuration exists
            if (!pointConfig && (!pointConfigNangCao || pointConfigNangCao.length === 0)) {
                return res.status(400).json({
                    message: 'Không thể thêm hoặc cập nhật xếp loại vì chưa có cấu hình cơ bản hoặc nâng cao.',
                });
            }

            // Validate each ranking
            const validRankings = rankings.filter((ranking) => {
                if (!ranking.name || !ranking.type || ranking.threshold === undefined || ranking.threshold === null) {
                    console.warn(`Removed invalid ranking: Missing name, type, or threshold: ${JSON.stringify(ranking)}`);
                    return false;
                }

                if (!['EARN', 'ARCHIVE'].includes(ranking.type)) {
                    console.warn(`Removed invalid ranking: Invalid type: ${ranking.type}`);
                    return false;
                }

                if (ranking.threshold < 0) {
                    console.warn(`Removed invalid ranking: Threshold must be non-negative: ${ranking.threshold}`);
                    return false;
                }

                if (ranking.type === 'ARCHIVE') {
                    if (ranking.threshold > 100) {
                        console.warn(`Removed invalid ranking: ARCHIVE threshold cannot exceed 100: ${ranking.threshold}`);
                        return false;
                    }
                    const decimalPlaces = (ranking.threshold.toString().split('.')[1] || '').length;
                    if (decimalPlaces > 2) {
                        console.warn(`Removed invalid ranking: ARCHIVE threshold cannot have more than 2 decimal places: ${ranking.threshold}`);
                        return false;
                    }
                }

                return true;
            });

            if (validRankings.length < rankings.length) {
                console.warn(`Filtered out ${rankings.length - validRankings.length} invalid rankings`);
            }

            rankings = validRankings;
        } else {
            rankings = []; // Ensure rankings is an empty array if not provided or invalid
        }

        const updateFields = {
            'DataChecklist.$.updatedAt': moment().format('DD-MM-YYYY HH:mm:ss'),
            'DataChecklist.$.Cauhinhdiem': Cauhinhdiem !== undefined ? Cauhinhdiem : !!(pointConfig || pointConfigNangCao?.length || rankings.length),
            'DataChecklist.$.rankings': rankings, // Update rankings
        };

        if (pointConfig === null) {
            updateFields['DataChecklist.$.pointConfig'] = null;
        } else if (pointConfig) {
            updateFields['DataChecklist.$.pointConfig'] = pointConfig;
        }

        if (Array.isArray(pointConfigNangCao)) {
            updateFields['DataChecklist.$.pointConfigNangCao'] = pointConfigNangCao;
        }

        const result = await checklistCollection.updateOne(
            { 'DataChecklist.id': checklistId },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Checklist không tồn tại hoặc đã bị xóa.' });
        }

        res.status(200).json({
            message: 'Cập nhật cấu hình điểm và xếp loại thành công.',
            modifiedCount: result.modifiedCount,
            pointConfig: updateFields['DataChecklist.$.pointConfig'],
            pointConfigNangCao: updateFields['DataChecklist.$.pointConfigNangCao'],
            rankings: updateFields['DataChecklist.$.rankings'],
            Cauhinhdiem: updateFields['DataChecklist.$.Cauhinhdiem'],
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật cấu hình điểm và xếp loại:', error);
        res.status(500).json({ message: 'Lỗi Server Nội Bộ' });
    }
};