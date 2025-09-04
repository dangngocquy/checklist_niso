import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Typography, Space, Button, Skeleton, message, Tooltip, Image, Avatar, Upload, Progress, Radio, Checkbox, Rate, Spin, Modal, Badge, Alert, List, Empty, Tag } from "antd";
import { Comment } from "@ant-design/compatible";
import { RollbackOutlined, CommentOutlined, DeleteOutlined, StarOutlined, HeartOutlined, CheckOutlined, CloseOutlined, SendOutlined, FileImageOutlined, FieldTimeOutlined, FileSyncOutlined, PushpinOutlined, PushpinFilled, LoadingOutlined, EyeOutlined, LinkOutlined } from "@ant-design/icons";
import Container from "../../config/PhieuChecklist/Container";
import TextArea from "antd/es/input/TextArea";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { imageDb } from "../../config";
import { v4 } from "uuid";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import BacktoTop from "../../config/BacktoTop";
import Avatars from "../../config/design/Avatars";
import useRelativeTime from "../../hook/useRelativeTime";
import useApi from "../../hook/useApi";
import NotFoundPage from "../NotFoundPage";
import UserInfoCard from "../../hook/UserInfoCard";
import BoxXuLy from "./Design/BoxXuLy";

const { Title, Text } = Typography;

const NestedReplyItem = ({
    nestedReply,
    replyId,
    pinnedNestedReplies,
    handlePinNestedReply,
    isTaskCompleted,
    renderAvatar,
}) => {
    const nestedRelativeTime = useRelativeTime(nestedReply.date);

    return (
        <List.Item style={{ width: "100%" }}>
            <Comment
                style={{ width: "100%" }}
                author={
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>{nestedReply.name}</span>
                        <Space>
                            <Badge color="rgb(45, 183, 245)" text={nestedReply.bophan.toUpperCase()} className="badge-niso" />
                            <Tooltip arrow title={pinnedNestedReplies[replyId]?.[nestedReply.id] ? "Bỏ ghim" : "Ghim lên đầu trang"}>
                                <Button
                                    icon={pinnedNestedReplies[replyId]?.[nestedReply.id] ? <PushpinFilled /> : <PushpinOutlined />}
                                    onClick={() => handlePinNestedReply(replyId, nestedReply.id)}
                                    className="pin"
                                    size="small"
                                    disabled={isTaskCompleted}
                                />
                            </Tooltip>
                        </Space>
                    </div>
                }
                avatar={renderAvatar(nestedReply.keysJSON)}
                content={
                    <div className="backgroundrep" style={{ width: "100%" }}>
                        {pinnedNestedReplies[replyId]?.[nestedReply.id] ? <Tag color="#87d068" icon={<PushpinFilled />} style={{ marginBottom: 5 }} bordered={false}>Đang ghim</Tag> : null}
                        <TextArea
                            autoSize
                            readOnly
                            value={nestedReply.content}
                            style={{ background: "transparent", boxShadow: "none", border: "none", width: "100%", padding: 0 }}
                        />
                        {nestedReply.url && Array.isArray(nestedReply.url) && nestedReply.url.length > 0 && (
                            <Image.PreviewGroup>
                                {nestedReply.url.map((url, urlIndex) => (
                                    <Image key={urlIndex} src={url} width={50} height={50} style={{ marginRight: 10, marginBottom: 10 }} />
                                ))}
                            </Image.PreviewGroup>
                        )}
                    </div>
                }
                datetime={
                    <Tooltip title={nestedReply.date}>
                        <span>
                            <FieldTimeOutlined style={{ marginRight: 5 }} />
                            {nestedRelativeTime}
                        </span>
                    </Tooltip>
                }
            />
        </List.Item>
    );
};

const ReplyItem = ({
    reply,
    pinnedReplies,
    pinnedNestedReplies,
    handlePinReply,
    handlePinNestedReply,
    handleProcessing,
    processingQuestions,
    isTaskCompleted,
    renderAvatar,
    handleReplyNested,
    replyContentNested,
    handleReplyChangeNested,
    loadingReplyNested,
    visibleNestedReplies,
    handleShowMore,
    loadingMore,
    uploadedFiles,
    handleUpload,
    handleDeleteUpload,
}) => {
    const relativeTime = useRelativeTime(reply.date);

    const UploadedFiles = ({ replyId }) => {
        const filteredFiles = uploadedFiles.filter((file) => file.replyId === replyId);
        if (filteredFiles.length === 0) return null;

        return (
            <div style={{ marginTop: 15, clear: "both" }}>
                {filteredFiles.map((file, fileIndex) => (
                    <div key={fileIndex} style={{ marginBottom: 10 }}>
                        <Space>
                            {file.status === "uploading" ? (
                                <div style={{ width: 50, height: 50, backgroundColor: "#f0f0f0", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                    <Spin size="small" />
                                </div>
                            ) : (
                                <Image src={file.url} width={50} height={50} />
                            )}
                            <Progress percent={Math.round(file.percent || 0)} size="small" style={{ width: 200 }} status={file.status === "error" ? "exception" : undefined} />
                            <Button icon={<DeleteOutlined />} onClick={() => handleDeleteUpload(file.name, replyId)} size="small" />
                        </Space>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <List.Item style={{ width: "100%" }}>
            <Comment
                style={{ width: "100%" }}
                author={
                    <Space direction="horizontal" style={{ justifyContent: "space-between", width: "100%" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span>{reply.name}</span>
                            <Space>
                                <Badge color="rgb(45, 183, 245)" text={reply.bophan.toUpperCase()} className="badge-niso" />
                                <Tooltip arrow title={pinnedReplies[reply.id] ? "Bỏ ghim" : "Ghim lên đầu trang"}>
                                    <Button
                                        icon={pinnedReplies[reply.id] ? <PushpinFilled /> : <PushpinOutlined />}
                                        onClick={() => handlePinReply(reply.id)}
                                        size="small"
                                        className="pin"
                                        disabled={isTaskCompleted}
                                    />
                                </Tooltip>
                            </Space>
                        </div>
                    </Space>
                }
                avatar={renderAvatar(reply.keysJSON)}
                content={
                    <div className="backgroundrep" style={{ width: "100%" }}>
                        {pinnedReplies[reply.id] ? <Tag color="#87d068" icon={<PushpinFilled />} style={{ marginBottom: 5 }} bordered={false}>Đang ghim</Tag> : null}
                        <TextArea
                            autoSize
                            readOnly
                            value={reply.content}
                            style={{ background: "transparent", boxShadow: "none", border: "none", width: "100%", padding: 0 }}
                        />
                        {reply.url && Array.isArray(reply.url) && reply.url.length > 0 && (
                            <Image.PreviewGroup>
                                {reply.url.map((url, urlIndex) => (
                                    <Image key={urlIndex} src={url} width={50} height={50} style={{ marginRight: 10, marginBottom: 10 }} />
                                ))}
                            </Image.PreviewGroup>
                        )}
                    </div>
                }
                datetime={
                    <Tooltip title={reply.date}>
                        <span>
                            <FieldTimeOutlined style={{ marginRight: 5 }} />
                            {relativeTime}
                        </span>
                    </Tooltip>
                }
                actions={[
                    <Button
                        type="link"
                        onClick={(e) => handleProcessing(reply.id, e)}
                        icon={<CommentOutlined />}
                        style={{ padding: 0 }}
                        disabled={isTaskCompleted}
                    >
                        {processingQuestions[reply.id] ? "Hủy trả lời" : "Trả lời"}
                    </Button>,
                ]}
            >
                {processingQuestions[reply.id] && !isTaskCompleted && (
                    <div style={{ width: "100%", alignItems: "flex-end", display: "flex", gap: 15, flexDirection: "column", background: "#f0f0f0", borderRadius: 8, padding: 15, marginBottom: 15 }}>
                        <TextArea
                            value={replyContentNested[reply.id] || ""}
                            onChange={(e) => handleReplyChangeNested(reply.id, e.target.value)}
                            placeholder="Nhập phản hồi..."
                            autoSize
                            style={{ width: "100%", background: "transparent", boxShadow: "none", border: "none", padding: "5px" }}
                        />
                        <Space style={{ float: "right" }}>
                            <Upload
                                multiple
                                fileList={[]}
                                beforeUpload={(file) => {
                                    handleUpload([file], reply.id);
                                    return false;
                                }}
                                accept="image/*"
                            >
                                <Button icon={<FileImageOutlined />}>Chọn ảnh</Button>
                            </Upload>
                            <Button type="primary" onClick={() => handleReplyNested(reply.id)} loading={loadingReplyNested[reply.id]} icon={<SendOutlined />}>
                                Gửi
                            </Button>
                        </Space>
                    </div>
                )}
                <UploadedFiles replyId={reply.id} />
                {reply.traloi && reply.traloi.length > 0 && (
                    <List
                        style={{ width: "100%" }}
                        itemLayout="horizontal"
                        dataSource={reply.traloi
                            .slice()
                            .sort((a, b) => {
                                if (pinnedNestedReplies[reply.id]?.[a.id] && !pinnedNestedReplies[reply.id]?.[b.id]) return -1;
                                if (!pinnedNestedReplies[reply.id]?.[a.id] && pinnedNestedReplies[reply.id]?.[b.id]) return 1;
                                return new Date(b.date.split(" ")[0].split("-").reverse().join("-") + " " + b.date.split(" ")[1]) - new Date(a.date.split(" ")[0].split("-").reverse().join("-") + " " + a.date.split(" ")[1]);
                            })
                            .slice(0, visibleNestedReplies[reply.id] || 3)}
                        renderItem={(nestedReply) => (
                            <NestedReplyItem nestedReply={nestedReply} replyId={reply.id} pinnedNestedReplies={pinnedNestedReplies} handlePinNestedReply={handlePinNestedReply} isTaskCompleted={isTaskCompleted} renderAvatar={renderAvatar} />
                        )}
                    />
                )}
                {reply.traloi && reply.traloi.length > (visibleNestedReplies[reply.id] || 3) && (
                    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                        <Button onClick={() => handleShowMore("nestedReplies", reply.id)} type="link" loading={loadingMore}>
                            {loadingMore ? "Đang tải..." : "Xem thêm trả lời"}
                        </Button>
                    </div>
                )}
            </Comment>
        </List.Item>
    );
};

const ViewXuly = ({ documentId: propDocumentId, questionId: propQuestionId, user, t, isInDrawer = false, hasxemPermission, hasxlphPermission, onUpdate }) => {
    const { documentId: paramDocumentId, questionId: paramQuestionId } = useParams();
    const navigate = useNavigate();

    const finalDocumentId = propDocumentId || paramDocumentId;
    const finalQuestionId = propQuestionId || paramQuestionId;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [replyContent, setReplyContent] = useState("");
    const [loadingReply, setLoadingReply] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [visibleReplies, setVisibleReplies] = useState(3);
    const [loadingMore, setLoadingMore] = useState(false);
    const [replyContentNested, setReplyContentNested] = useState({});
    const [loadingReplyNested, setLoadingReplyNested] = useState({});
    const [visibleNestedReplies, setVisibleNestedReplies] = useState({});
    const [processingQuestions, setProcessingQuestions] = useState({});
    const [isTaskCompleted, setIsTaskCompleted] = useState(false);
    const [reprocessing, setReprocessing] = useState(false);
    const [pinnedReplies, setPinnedReplies] = useState({});
    const [pinnedNestedReplies, setPinnedNestedReplies] = useState({});
    const currentDate = moment().format("DD-MM-YYYY HH:mm:ss");

    const { fetchByCommentId, updateTaskProcessing, addReply, addNestedReply, pinReply, pinNestedReply } = useApi();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [checklistResponse] = await Promise.all([
                fetchByCommentId(finalDocumentId),
            ]);

            const checklistData = checklistResponse.data;
            setData(checklistData);

            const question = checklistData.questions.find((q) => q.id === finalQuestionId);
            if (question) {
                setIsTaskCompleted(question.xulynhiemvu || false);
                const newPinnedReplies = {};
                const newPinnedNestedReplies = {};
                if (question.replies && Array.isArray(question.replies)) {
                    question.replies.forEach((reply) => {
                        newPinnedReplies[reply.id] = reply.isPinned || false;
                        newPinnedNestedReplies[reply.id] = {};
                        if (reply.traloi && Array.isArray(reply.traloi)) {
                            reply.traloi.forEach((nestedReply) => {
                                newPinnedNestedReplies[reply.id][nestedReply.id] = nestedReply.isPinned || false;
                            });
                        }
                    });
                }
                setPinnedReplies(newPinnedReplies);
                setPinnedNestedReplies(newPinnedNestedReplies);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Không tìm thấy checklist.");
        } finally {
            setLoading(false);
        }
    }, [finalDocumentId, finalQuestionId, fetchByCommentId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleReplyChange = (value) => {
        setReplyContent(value);
    };

    const handleReplyChangeNested = (replyId, value) => {
        setReplyContentNested((prev) => ({
            ...prev,
            [replyId]: value,
        }));
    };

    const handleProcessing = (replyIndex, event) => {
        event.preventDefault();
        setProcessingQuestions((prev) => ({
            ...prev,
            [replyIndex]: !prev[replyIndex],
        }));
    };

    const handleUpload = async (files, replyId = null) => {
        const newFiles = files.map((file) => ({
            file,
            url: URL.createObjectURL(file),
            name: file.name,
            status: "uploading",
            percent: 0,
            replyId,
        }));

        setUploadedFiles((prev) => [...prev, ...newFiles]);

        const uploadPromises = newFiles.map(async (fileObj) => {
            const storageRef = ref(imageDb, `CHECKLISTNISO/${v4()}`);
            const uploadTask = uploadBytesResumable(storageRef, fileObj.file);

            return new Promise((resolve, reject) => {
                uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setUploadedFiles((prev) =>
                            prev.map((f) => (f.name === fileObj.name && f.replyId === fileObj.replyId ? { ...f, percent: progress } : f))
                        );
                    },
                    (error) => {
                        console.error("Upload error:", error);
                        setUploadedFiles((prev) => prev.map((f) => (f.name === fileObj.name && f.replyId === fileObj.replyId ? { ...f, status: "error" } : f)));
                        reject(error);
                    },
                    () => {
                        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                            setUploadedFiles((prev) => prev.map((f) => (f.name === fileObj.name && f.replyId === fileObj.replyId ? { ...f, url: downloadURL, status: "done", percent: 100 } : f)));
                            resolve({ url: downloadURL, name: fileObj.name });
                        });
                    }
                );
            });
        });

        try {
            await Promise.all(uploadPromises);
        } catch (error) {
            message.error("Upload failed");
        }
    };

    const handleDeleteUpload = (fileName, replyId) => {
        setUploadedFiles((prev) => prev.filter((file) => !(file.name === fileName && file.replyId === replyId)));
    };

    const handleReply = async () => {
        if (!replyContent || replyContent.trim() === "") {
            message.warning("Câu trả lời không được để trống !");
            return;
        }

        setLoadingReply(true);
        const uploadedUrls = uploadedFiles.filter((file) => file.status === "done" && file.replyId === null).map((file) => file.url);

        try {
            const reply = {
                id: uuidv4(),
                name: user.name,
                content: replyContent,
                date: currentDate,
                url: uploadedUrls,
                bophan: user.bophan || "Khách vãng lai",
                avatars: user.imgAvatar || "",
                keysJSON: user.keys,
                isPinned: false,
            };
            const response = await addReply(finalDocumentId, finalQuestionId, reply);

            setData(response.updatedItem);
            setReplyContent("");
            setUploadedFiles((prev) => prev.filter((file) => file.replyId !== null));
            message.success("Gửi phản hồi thành công !");
        } catch (error) {
            console.error("Error adding reply:", error);
            message.error("Failed to add reply");
        } finally {
            setLoadingReply(false);
        }
    };

    const handleReplyNested = async (replyId) => {
        const content = replyContentNested[replyId] || "";
        if (!content.trim()) {
            message.warning("Câu trả lời không được để trống!");
            return;
        }

        setLoadingReplyNested((prev) => ({ ...prev, [replyId]: true }));

        try {
            const nestedReply = {
                id: uuidv4(),
                name: user.name,
                content: content.trim(),
                date: moment().format("DD-MM-YYYY HH:mm:ss"),
                url: uploadedFiles.filter((file) => file.replyId === replyId && file.status === "done").map((file) => file.url),
                bophan: user.bophan || "Khách vãng lai",
                avatars: user.imgAvatar || "",
                keysJSON: user.keys,
                isPinned: false,
            };
            const response = await addNestedReply(finalDocumentId, finalQuestionId, replyId, nestedReply);

            setData(response.updatedItem);
            setReplyContentNested((prev) => ({ ...prev, [replyId]: "" }));
            setUploadedFiles((prev) => prev.filter((file) => file.replyId !== replyId));
            message.success("Gửi phản hồi thành công!");

            setProcessingQuestions((prev) => ({ ...prev, [replyId]: false }));
        } catch (error) {
            console.error("Error adding nested reply:", error);
            message.error("Failed to add nested reply");
        } finally {
            setLoadingReplyNested((prev) => ({ ...prev, [replyId]: false }));
        }
    };

    const handleShowMore = (type, replyId = null) => {
        setLoadingMore(true);

        setTimeout(() => {
            if (type === "replies") {
                setVisibleReplies((prev) => prev + 3);
            } else if (type === "nestedReplies") {
                setVisibleNestedReplies((prev) => ({
                    ...prev,
                    [replyId]: (prev[replyId] || 3) + 3,
                }));
            }
            setLoadingMore(false);
        }, 500);
    };

    const handlePinReply = async (replyId) => {
        try {
            const question = data.questions.find((q) => q.id === finalQuestionId);
            const updatedReply = question.replies.find((r) => r.id === replyId);
            const newPinnedState = !updatedReply.isPinned;

            const response = await pinReply(finalDocumentId, finalQuestionId, replyId, newPinnedState);

            setData(response.updatedItem);
            setPinnedReplies((prev) => ({
                ...prev,
                [replyId]: newPinnedState,
            }));
            message.success(newPinnedState ? "Đã ghim phản hồi" : "Đã bỏ ghim phản hồi");
        } catch (error) {
            console.error("Error updating pin status:", error);
            message.warning("Vui lòng thao tác chậm lại.");
        }
    };

    const handlePinNestedReply = async (replyId, nestedReplyId) => {
        try {
            const question = data.questions.find((q) => q.id === finalQuestionId);
            const reply = question.replies.find((r) => r.id === replyId);
            const updatedNestedReply = reply.traloi.find((nr) => nr.id === nestedReplyId);
            const newPinnedState = !updatedNestedReply.isPinned;

            const response = await pinNestedReply(finalDocumentId, finalQuestionId, replyId, nestedReplyId, newPinnedState);

            setData(response.updatedItem);
            setPinnedNestedReplies((prev) => ({
                ...prev,
                [replyId]: {
                    ...prev[replyId],
                    [nestedReplyId]: newPinnedState,
                },
            }));
            message.success(newPinnedState ? "Đã ghim trả lời" : "Đã bỏ ghim trả lời");
        } catch (error) {
            console.error("Error updating nested reply pin status:", error);
            message.error("Không thể cập nhật trạng thái ghim trả lời");
        }
    };

    const getAnswerStyle = useCallback((answer, correctAnswer, xulynhiemvu, pointConfigNangCao, questionId, cautraloimoikhac) => {
        if (xulynhiemvu) return "#b0db7d"; // Task completed, return green

        // Define correctAnswers for cautraloi check early
        const correctAnswers = Array.isArray(correctAnswer)
            ? correctAnswer.map((a) => String(a).toLowerCase().trim())
            : String(correctAnswer || '').toLowerCase().split(",").map((a) => a.trim());

        // Check pointConfigNangCao
        if (pointConfigNangCao && questionId) {
            const config = pointConfigNangCao.find((cfg) => cfg.questionId === questionId);
            if (config) {
                const normalizeAnswer = (ans) => String(ans || '').toLowerCase().trim();
                const questionAnswer = Array.isArray(answer)
                    ? answer.map(normalizeAnswer).filter(Boolean)
                    : [normalizeAnswer(answer)].filter(Boolean);
                const configAnswer = Array.isArray(config.answer)
                    ? config.answer.map(normalizeAnswer).filter(Boolean)
                    : [normalizeAnswer(config.answer)].filter(Boolean);

                const isOtherConfigAnswer = configAnswer.includes('other');
                if (isOtherConfigAnswer) {
                    let correctAnswerNormalized = correctAnswer || '';
                    if (Array.isArray(correctAnswer)) {
                        correctAnswerNormalized = correctAnswer.find((item) => !Array.isArray(item)) || '';
                    }
                    const otherAnswer = cautraloimoikhac || '';
                    if (normalizeAnswer(correctAnswerNormalized) === normalizeAnswer(otherAnswer)) {
                        return "#389e0d"; // Correct per pointConfigNangCao "other"
                    }
                } else {
                    const isConfigCorrect =
                        questionAnswer.length === configAnswer.length &&
                        questionAnswer.every((ans) => configAnswer.includes(ans)) &&
                        configAnswer.every((ans) => questionAnswer.includes(ans));
                    if (isConfigCorrect) {
                        return "#389e0d"; // Correct per pointConfigNangCao
                    }
                }
            }
        }

        // Default cautraloi check
        if (!correctAnswer || correctAnswer === "" || (Array.isArray(correctAnswer) && correctAnswer.length === 0)) {
            return "#f39b9d"; // Return red if no correct answer
        }
        if (!answer || (Array.isArray(answer) && answer.length === 0)) {
            return "#f39b9d"; // Return red if no answer
        }

        if (Array.isArray(answer)) {
            const hasCorrect = answer.every((a) => correctAnswers.includes(String(a).toLowerCase()));
            const hasIncorrect = answer.some((a) => !correctAnswers.includes(String(a).toLowerCase()));
            if (hasCorrect && !hasIncorrect) return "#b0db7d";
            return "#f39b9d"; // Return red if any answer is incorrect
        } else {
            const answerLower = String(answer).toLowerCase();
            if (correctAnswers.includes(answerLower)) return "#b0db7d";
            return "#f39b9d"; // Return red if answer is incorrect
        }
    }, []);

    const getAnswerIcon = useCallback((answer, correctAnswer, xulynhiemvu, pointConfigNangCao, questionId, cautraloimoikhac) => {
        if (xulynhiemvu) {
            return <CheckOutlined style={{ color: "#b0db7d" }} />;
        }

        // Define correctAnswers for cautraloi check early
        const correctAnswers = Array.isArray(correctAnswer)
            ? correctAnswer.map((a) => String(a).toLowerCase().trim())
            : String(correctAnswer || '').toLowerCase().split(",").map((a) => a.trim());

        // Check pointConfigNangCao
        if (pointConfigNangCao && questionId) {
            const config = pointConfigNangCao.find((cfg) => cfg.questionId === questionId);
            if (config) {
                const normalizeAnswer = (ans) => String(ans || '').toLowerCase().trim();
                const questionAnswer = Array.isArray(answer)
                    ? answer.map(normalizeAnswer).filter(Boolean)
                    : [normalizeAnswer(answer)].filter(Boolean);
                const configAnswer = Array.isArray(config.answer)
                    ? config.answer.map(normalizeAnswer).filter(Boolean)
                    : [normalizeAnswer(config.answer)].filter(Boolean);

                const isOtherConfigAnswer = configAnswer.includes('other');
                if (isOtherConfigAnswer) {
                    let correctAnswerNormalized = correctAnswer || '';
                    if (Array.isArray(correctAnswer)) {
                        correctAnswerNormalized = correctAnswer.find((item) => !Array.isArray(item)) || '';
                    }
                    const otherAnswer = cautraloimoikhac || '';
                    if (normalizeAnswer(correctAnswerNormalized) === normalizeAnswer(otherAnswer)) {
                        return <CheckOutlined style={{ color: "#90ee90" }} />;
                    }
                } else {
                    const isConfigCorrect =
                        questionAnswer.length === configAnswer.length &&
                        questionAnswer.every((ans) => configAnswer.includes(ans)) &&
                        configAnswer.every((ans) => questionAnswer.includes(ans));
                    if (isConfigCorrect) {
                        return <CheckOutlined style={{ color: "#90ee90" }} />;
                    }
                }
            }
        }

        // Default cautraloi check
        if (!correctAnswer || correctAnswer === "" || (Array.isArray(correctAnswer) && correctAnswer.length === 0)) {
            return <CloseOutlined style={{ color: "#f39b9d" }} />;
        }
        if (!answer || (Array.isArray(answer) && answer.length === 0)) {
            return <CloseOutlined style={{ color: "#f39b9d" }} />;
        }

        if (Array.isArray(answer)) {
            const hasCorrect = answer.every((a) => correctAnswers.includes(String(a).toLowerCase()));
            const hasIncorrect = answer.some((a) => !correctAnswers.includes(String(a).toLowerCase()));
            if (hasCorrect && !hasIncorrect) {
                return <CheckOutlined style={{ color: "#b0db7d" }} />;
            }
            return <CloseOutlined style={{ color: "#f39b9d" }} />;
        } else {
            const answerLower = String(answer).toLowerCase();
            if (correctAnswers.includes(answerLower)) {
                return <CheckOutlined style={{ color: "#b0db7d" }} />;
            }
            return <CloseOutlined style={{ color: "#f39b9d" }} />;
        }
    }, []);

    const renderAvatar = useCallback((keysJSON) => {
        const replyData =
            data?.questions?.flatMap((q) => q.replies || []).find((r) => r.keysJSON === keysJSON) ||
            data?.questions?.flatMap((q) => q.replies?.flatMap((r) => r.traloi || []) || []).find((n) => n.keysJSON === keysJSON);

        const avatarSrc = replyData?.avatars;
        const displayName = replyData?.name || "Unknown User";
        const userForCard = {
            name: replyData?.name || "Unknown User",
            username: replyData?.username || "N/A",
            imgAvatar: replyData?.avatars || null,
            keys: replyData?.keysJSON || "N/A",
            email: null,
            chucvu: null,
            chinhanh: null,
            bophan: replyData?.bophan || null,
            locker: false,
            imgBackground: null,
        };

        return (
            <Tooltip
                title={<UserInfoCard user={userForCard} />}
                placement={window.innerWidth < 768 ? "top" : "right"}
                color="white"
                overlayStyle={{ maxWidth: 300 }}
                trigger="hover"
            >
                <span style={{ display: "inline-block", cursor: "pointer" }}>
                    {avatarSrc ? (
                        <Avatar
                            src={avatarSrc}
                            size="large"
                            style={{ pointerEvents: "auto" }}
                        />
                    ) : (
                        <Avatars user={{ name: displayName }} style={{ pointerEvents: "auto" }} />
                    )}
                </span>
            </Tooltip>
        );
    }, [data?.questions]);

    const renderAnswer = (question) => {
        const { luachon, luachonbieutuong, plusnumber, options, cautraloi, xulynhiemvu, pointConfigNangCao, questionId, cautraloimoikhac } = question;
        const answer = Array.isArray(question.answer) ? question.answer.join(", ") : question.answer;

        const answerStyle = {
            border: `2px solid ${getAnswerStyle(answer, cautraloi, xulynhiemvu, pointConfigNangCao, questionId, cautraloimoikhac)}`
        };

        if (luachon.option0) {
            return <div dangerouslySetInnerHTML={{ __html: question.answer }} />;
        }

        if (luachon.option1 || luachon.option5 || luachon.option6) {
            return (
                <div className="correct bn" style={answerStyle}>
                    <b style={{ textTransform: "uppercase" }}>{t("ViewDocs.input13")}</b>
                    <Text style={{ display: "flex", justifyContent: "space-between" }}>
                        <TextArea
                            autoSize
                            readOnly
                            value={
                                Array.isArray(question.answer)
                                    ? question.answer.length > 0
                                        ? question.answer.join(", ")
                                        : t("Notifications.input18")
                                    : question.answer
                                        ? question.answer
                                        : t("Notifications.input18")
                            }
                            style={{
                                color: Array.isArray(question.answer)
                                    ? question.answer.length > 0
                                        ? null
                                        : "#f39b9d"
                                    : question.answer
                                        ? null
                                        : "#f39b9d",
                                background: "transparent",
                                boxShadow: "none",
                                border: "none",
                            }}
                        />
                        {getAnswerIcon(answer, cautraloi, xulynhiemvu, pointConfigNangCao, questionId, cautraloimoikhac)}
                    </Text>
                </div>
            );
        }

        if (luachon.option2) {
            const defaultValue = options.some((option) => option.tuychon === answer) ? answer : "other";
            return (
                <React.Fragment>
                    <Radio.Group value={defaultValue} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {options.map((option, index) => {
                            const isSelected = option.tuychon === question.answer;
                            return (
                                <Radio key={index} value={option.tuychon}>
                                    {option.tuychon}
                                    {isSelected && (
                                        <span style={{ marginLeft: '8px' }}>{getAnswerIcon(question.answer, cautraloi, xulynhiemvu, pointConfigNangCao, questionId, cautraloimoikhac)}</span>
                                    )}
                                </Radio>
                            );
                        })}
                        {question.tuychonkhac && <Radio value="other">{t("Department.input368")}</Radio>}
                    </Radio.Group>
                    <div className="correct bn" style={answerStyle}>
                        <b style={{ textTransform: "uppercase" }}>{t("ViewDocs.input13")}</b>
                        <Text style={{ display: "flex", justifyContent: "space-between" }}>
                            <TextArea
                                autoSize
                                readOnly
                                value={
                                    Array.isArray(question.answer)
                                        ? question.answer.length > 0
                                            ? question.answer.join(", ")
                                            : t("Notifications.input18")
                                        : question.answer
                                            ? question.answer
                                            : t("Notifications.input18")
                                }
                                style={{
                                    color: Array.isArray(question.answer)
                                        ? question.answer.length > 0
                                            ? null
                                            : "#f39b9d"
                                        : question.answer
                                            ? null
                                            : "#f39b9d",
                                    background: "transparent",
                                    boxShadow: "none",
                                    border: "none",
                                }}
                            />
                            {getAnswerIcon(answer, cautraloi, xulynhiemvu, pointConfigNangCao, questionId, cautraloimoikhac)}
                        </Text>
                    </div>
                </React.Fragment>
            );
        }

        if (luachon.option3) {
            const answers = Array.isArray(question.answer) ? question.answer : [question.answer].filter(Boolean);
            const displayAnswers = answers.every((answer) =>
                options.some((option) => option.tuychonnhieu.toLowerCase() === answer.toLowerCase())
            )
                ? answers
                : [...new Set([...answers, "other"])];
            return (
                <React.Fragment>
                    <Checkbox.Group value={displayAnswers} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {options.map((option, index) => {
                            const isSelected = answers.includes(option.tuychonnhieu);
                            return (
                                <Checkbox key={index} value={option.tuychonnhieu}>
                                    {option.tuychonnhieu}
                                    {isSelected && (
                                        <span style={{ marginLeft: '8px' }}>{getAnswerIcon(question.answer, cautraloi, xulynhiemvu, pointConfigNangCao, questionId, cautraloimoikhac)}</span>
                                    )}
                                </Checkbox>
                            );
                        })}
                        {question.tuychonkhac && <Checkbox value="other">{t("Department.input368")}</Checkbox>}
                    </Checkbox.Group>
                    <div className="correct bn" style={answerStyle}>
                        <b style={{ textTransform: "uppercase" }}>{t("Notifications.input17")}</b>
                        <Text style={{ display: "flex", justifyContent: "space-between" }}>
                            <TextArea
                                autoSize
                                readOnly
                                value={
                                    Array.isArray(question.answer)
                                        ? question.answer.length > 0
                                            ? question.answer.join(", ")
                                            : t("Notifications.input18")
                                        : question.answer
                                            ? question.answer
                                            : t("Notifications.input18")
                                }
                                style={{
                                    color: Array.isArray(question.answer)
                                        ? question.answer.length > 0
                                            ? null
                                            : "#f39b9d"
                                        : question.answer
                                            ? null
                                            : "#f39b9d",
                                    background: "transparent",
                                    boxShadow: "none",
                                    border: "none",
                                }}
                            />
                            {getAnswerIcon(answer, cautraloi, xulynhiemvu, pointConfigNangCao, questionId, cautraloimoikhac)}
                        </Text>
                    </div>
                </React.Fragment>
            );
        }

        if (luachon.option4) {
            const { ngoisao, traitim, daukiem, so } = luachonbieutuong;
            return (
                <React.Fragment>
                    <Rate
                        value={question.answer}
                        count={plusnumber}
                        style={{ lineHeight: 2.5 }}
                        character={({ index }) => {
                            const style = {
                                backgroundColor: index < question.answer ? "#ae8f3d" : "white",
                                color: index < question.answer ? "white" : null,
                            };
                            if (ngoisao) return <Button size="large" icon={<StarOutlined />} style={style} />;
                            if (traitim) return <Button size="large" icon={<HeartOutlined />} style={style} />;
                            if (daukiem) return <Button size="large" icon={<CheckOutlined />} style={style} />;
                            if (so) return <Button size="large" style={style}>{index + 1}</Button>;
                            return <Button size="large" icon={<StarOutlined />} style={style} />;
                        }}
                    />
                    <div className="correct bn" style={answerStyle}>
                        <b style={{ textTransform: "uppercase" }}>{t("Notifications.input17")}</b>
                        <Text style={{ display: "flex", justifyContent: "space-between" }}>
                            Mức: {Array.isArray(question.answer) ? question.answer.join(", ") : question.answer}
                            {getAnswerIcon(answer, cautraloi, xulynhiemvu, pointConfigNangCao, questionId, cautraloimoikhac)}
                        </Text>
                    </div>
                </React.Fragment>
            );
        }

        return null;
    };

    const handleConfirm = () => {
        if (isTaskCompleted) {
            message.warning("Phiếu này đã được xử lý rồi !");
            return;
        }

        Modal.confirm({
            title: "Xác nhận",
            content: "Bạn có chắc chắn muốn hoàn tất phiếu này và đóng phản hồi?",
            okButtonProps: { style: { backgroundColor: '#ae8f3d' } },
            onOk: async () => {
                try {
                    // Create new history item
                    const newHistoryItem = {
                        action: "approve",
                        user: user.keys,
                        timestamp: moment().toISOString(),
                        details: {
                            questionId: finalQuestionId,
                            comment: "Đã phê duyệt nhiệm vụ",
                        },
                    };

                    // Prepare update data
                    const updateData = {
                        xulynhiemvu: true,
                        nguoiduyet: user.name,
                        thoigianpheduyet: moment().format('DD-MM-YYYY HH:mm:ss'),
                        historyCheck: [...(data?.historyCheck || []), newHistoryItem],
                    };

                    // Call API to update
                    const response = await updateTaskProcessing(finalDocumentId, finalQuestionId, updateData);

                    // Update state with response data
                    setData((prevData) => ({
                        ...prevData,
                        questions: prevData.questions.map((q) =>
                            q.id === finalQuestionId
                                ? {
                                    ...q,
                                    xulynhiemvu: true,
                                    nguoiduyet: user.name,
                                    thoigianpheduyet: updateData.thoigianpheduyet,
                                    historyCheck: response.updatedItem?.historyCheck || updateData.historyCheck,
                                }
                                : q
                        ),
                        historyCheck: response.updatedItem?.historyCheck || updateData.historyCheck,
                    }));
                    setIsTaskCompleted(true);

                    // Notify parent component of update
                    if (onUpdate) {
                        onUpdate(response.updatedItem);
                    }

                    message.success("Phê duyệt thành công !");
                } catch (error) {
                    console.error("Error confirming task:", error);
                    message.error("Không thể xác nhận hoàn tất nhiệm vụ");
                }
            },
        });
    };

    const handleReprocess = () => {
        Modal.confirm({
            title: "Xác nhận yêu cầu xử lý lại",
            content: `Yêu cầu '${data.nguoiphanhoi}' xử lý lại nhiệm vụ này?`,
            okButtonProps: { style: { backgroundColor: '#ae8f3d' } },
            onOk: async () => {
                setReprocessing(true);
                try {
                    // Create new history item
                    const newHistoryItem = {
                        action: "reprocess",
                        user: user.keys,
                        timestamp: moment().toISOString(),
                        details: {
                            questionId: finalQuestionId,
                            comment: "Yêu cầu xử lý lại nhiệm vụ",
                            requestedTo: data.nguoiphanhoi,
                        },
                    };

                    // Prepare update data
                    const updateData = {
                        xulynhiemvu: false,
                        historyCheck: [...(data?.historyCheck || []), newHistoryItem],
                    };

                    // Call API to update
                    const response = await updateTaskProcessing(finalDocumentId, finalQuestionId, updateData);

                    // Update state with response data
                    setData((prevData) => ({
                        ...prevData,
                        questions: prevData.questions.map((q) =>
                            q.id === finalQuestionId
                                ? {
                                    ...q,
                                    xulynhiemvu: false,
                                    historyCheck: response.updatedItem?.historyCheck || updateData.historyCheck,
                                }
                                : q
                        ),
                        historyCheck: response.updatedItem?.historyCheck || updateData.historyCheck,
                    }));
                    setIsTaskCompleted(false);

                    // Notify parent component of update
                    if (onUpdate) {
                        onUpdate(response.updatedItem);
                    }

                    message.success("Đã yêu cầu xử lý lại");
                } catch (error) {
                    console.error("Error requesting reprocess:", error);
                    message.error("Không thể yêu cầu xử lý lại");
                } finally {
                    setReprocessing(false);
                }
            },
        });
    };

    const renderQuestion = () => {
        if (!data || !data.questions) {
            return (
                <Container
                    content={<Text>Không có dữ liệu checklist để hiển thị.</Text>}
                />
            );
        }

        const question = data.questions.find((q) => q.id === finalQuestionId);
        if (!question) {
            return (
                <Container
                    content={<Text>Không tìm thấy câu hỏi với ID: {finalQuestionId}.</Text>}
                />
            );
        }

        const UploadedFiles = ({ replyId }) => {
            const filteredFiles = uploadedFiles.filter((file) => file.replyId === replyId);

            if (filteredFiles.length === 0) return null;

            return (
                <div style={{ marginTop: 15, clear: "both" }}>
                    {filteredFiles.map((file, fileIndex) => (
                        <div key={fileIndex} style={{ marginBottom: 10 }}>
                            <Space>
                                {file.status === "uploading" ? (
                                    <div style={{ width: 50, height: 50, backgroundColor: "#f0f0f0", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                        <Spin size="small" />
                                    </div>
                                ) : (
                                    <Image src={file.url} width={50} height={50} />
                                )}
                                <Progress percent={Math.round(file.percent || 0)} size="small" style={{ width: 200 }} status={file.status === "error" ? "exception" : undefined} />
                                <Button icon={<DeleteOutlined />} onClick={() => handleDeleteUpload(file.name, replyId)} size="small" />
                            </Space>
                        </div>
                    ))}
                </div>
            );
        };

        return (
            <Container
                content={
                    <React.Fragment>
                        {data.demcauhoi === true && (
                            <span>
                                {question.cauhoibatbuoc && <span style={{ color: "red" }}> *</span>}Câu hỏi {data.questions.indexOf(question) + 1}.
                            </span>
                        )}
                        <Space direction="horizontal" style={{ justifyContent: "space-between", width: "100%", alignItems: "flex-start" }}>
                            <Space direction="horizontal" style={{ alignItems: "flex-start" }}>
                                {question.cauhoibatbuoc && !data.demcauhoi && <span style={{ color: "red" }}> *</span>}
                                <div>
                                    {Object.keys(question).map((key) => {
                                        if (key.startsWith("Cauhoi")) {
                                            return <div key={key} dangerouslySetInnerHTML={{ __html: question[key].replace(/ /g, " ") }} style={{ marginBottom: 6, lineHeight: 1.6 }} />;
                                        }
                                        return null;
                                    })}
                                    {question.yeu_cau && <div dangerouslySetInnerHTML={{ __html: question.yeu_cau }} style={{ lineHeight: 1.6 }} />}
                                </div>
                            </Space>
                            {Boolean(question.point) && question.point !== "0" && (
                                <Text
                                    style={{
                                        fontSize: 11,
                                        opacity: 0.6,
                                        whiteSpace: "nowrap",
                                        alignItems: "flex-start",
                                        color: getAnswerStyle(question.answer, question.cautraloi, question.xulynhiemvu, data?.pointConfigNangCao, question.questionId, question.cautraloimoikhac),
                                    }}
                                >
                                    {question.point} {t("Input.input9")}
                                </Text>
                            )}
                        </Space>
                        <Space direction="vertical" style={{ width: "100%", marginTop: "10px", gap: 0 }}>
                            {renderAnswer(question)}
                            {question.laplai && Number(question.laplai) > 0 && question.solanlaplai && (
                                <Button type="link" style={{ padding: 0 }}>
                                    Số lần lặp lại: {question.laplai}
                                </Button>
                            )}
                            {question.hinhanh && question.hinhanh.length > 0 && (
                                <>
                                    <Image.PreviewGroup>
                                        {question.hinhanh.map((image) => (
                                            <Image key={image.uid} width={50} height={50} src={image.url} alt={image.name} />
                                        ))}
                                    </Image.PreviewGroup>
                                    <i style={{ fontSize: 11 }}>{t("Department.input375")}</i>
                                </>
                            )}
                            <Title strong level={5} style={{ marginTop: 15 }}>
                                Xử lý & nhận xét {data.title}
                            </Title>
                            {!isTaskCompleted && (
                                <div style={{ alignItems: "flex-start", display: "flex", gap: 15, flexDirection: "column", background: "#f0f0f0", borderRadius: 8, padding: 15 }}>
                                    <TextArea
                                        value={replyContent}
                                        onChange={(e) => handleReplyChange(e.target.value)}
                                        placeholder="Nhập phản hồi..."
                                        style={{
                                            background: "transparent",
                                            boxShadow: "none",
                                            border: "none",
                                            width: "100%",
                                            padding: 0,
                                        }}
                                        autoSize
                                    />
                                    <Space style={{ alignSelf: "flex-end" }}>
                                        <Upload
                                            multiple
                                            fileList={[]}
                                            beforeUpload={(file) => {
                                                handleUpload([file]);
                                                return false;
                                            }}
                                            accept="image/*"
                                        >
                                            <Button icon={<FileImageOutlined />}>Chọn ảnh</Button>
                                        </Upload>
                                        <Button type="primary" onClick={handleReply} loading={loadingReply} icon={<SendOutlined />}>
                                            Gửi phản hồi
                                        </Button>
                                    </Space>
                                </div>
                            )}

                            <UploadedFiles replyId={null} />
                            <List
                                className="comment-list"
                                header={`(${question.replies?.length || 0}) phản hồi`}
                                itemLayout="horizontal"
                                style={{ width: "100%" }}
                                dataSource={(question.replies || [])
                                    .slice()
                                    .sort((a, b) => {
                                        if (pinnedReplies[a.id] && !pinnedReplies[b.id]) return -1;
                                        if (!pinnedReplies[a.id] && pinnedReplies[b.id]) return 1;
                                        return new Date(b.date.split(" ")[0].split("-").reverse().join("-") + " " + b.date.split(" ")[1]) - new Date(a.date.split(" ")[0].split("-").reverse().join("-") + " " + a.date.split(" ")[1]);
                                    })
                                    .slice(0, visibleReplies)}
                                renderItem={(reply) => (
                                    <ReplyItem
                                        reply={reply}
                                        pinnedReplies={pinnedReplies}
                                        pinnedNestedReplies={pinnedNestedReplies}
                                        handlePinReply={handlePinReply}
                                        handlePinNestedReply={handlePinNestedReply}
                                        handleProcessing={handleProcessing}
                                        processingQuestions={processingQuestions}
                                        isTaskCompleted={isTaskCompleted}
                                        renderAvatar={renderAvatar}
                                        handleReplyNested={handleReplyNested}
                                        replyContentNested={replyContentNested}
                                        handleReplyChangeNested={handleReplyChangeNested}
                                        loadingReplyNested={loadingReplyNested}
                                        visibleNestedReplies={visibleNestedReplies}
                                        handleShowMore={handleShowMore}
                                        uploadedFiles={uploadedFiles}
                                        handleUpload={handleUpload}
                                        handleDeleteUpload={handleDeleteUpload}
                                    />
                                )}
                                locale={{ emptyText: <Empty description="Chưa có phản hồi nào !" /> }}
                            />
                            {question.replies && question.replies.length > visibleReplies && (
                                <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                                    <Button onClick={() => handleShowMore("replies")} type="link" loading={loadingMore}>
                                        {loadingMore ? "Đang tải..." : "Xem thêm phản hồi"}
                                    </Button>
                                </div>
                            )}
                        </Space>
                    </React.Fragment>
                }
            />
        );
    };

    const renderThoiGianXuLy = () => {
        const thoigianxuly = data?.thoigianxuly ?? "N/A";

        if (thoigianxuly === "N/A") {
            return <Text style={{ fontSize: window.innerWidth < 768 ? '11px' : '14px' }}>{thoigianxuly}</Text>;
        }

        const deadline = moment(thoigianxuly, "DD-MM-YYYY HH:mm:ss");
        const now = moment();

        if (deadline.isBefore(now)) {
            return (
                <>
                    <Text style={{ fontSize: window.innerWidth < 768 ? '11px' : '14px' }}>{thoigianxuly}</Text>
                    <Alert
                        message="Overdue"
                        type="error"
                        showIcon
                    />
                </>
            );
        }

        return <Text>{thoigianxuly}</Text>;
    };

    const hasPermission = useCallback(() => {
        if (
            (user?.bophan && (data?.departmentsview || []).includes(user.bophan)) ||
            (user?.chinhanh && (data?.restaurantsview || []).includes(user.chinhanh)) ||
            (user?.keys && (data?.usersview || []).includes(user.keys))
        ) {
            return true;
        }

        if (
            hasxemPermission ||
            user?.phanquyen === true ||
            user?.phanquyen === "Xử lý yêu cầu" ||
            hasxlphPermission
        ) {
            return true;
        }

        if (
            !data?.quyenxem || // No quyenxem defined (treat as public)
            data.quyenxem === "Public" || // Public access
            (data.quyenxem === "Internal" && // Internal access
                ((user?.chinhanh && (data?.cuahang || []).includes(user.chinhanh)) ||
                    (user?.bophan && (data?.bophanADS || []).includes(user.bophan)) ||
                    (user?.keys && (data?.accounts || []).includes(user.keys)))) ||
            (data.quyenxem === "Private" && // Private access
                ((user?.keys && data?.keysJSON === user.keys) ||
                    (user?.chinhanh && (data?.cuahang || []).includes(user.chinhanh)) ||
                    (user?.bophan && (data?.bophanADS || []).includes(user.bophan)) ||
                    (user?.keys && (data?.accounts || []).includes(user.keys))))
        ) {
            return true;
        }

        return false;
    }, [user, data, hasxemPermission, hasxlphPermission]);

    if (loading) {
        return (
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '50px 0', textAlign: 'center' }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            </div>
        );
    }

    if (error || !hasPermission()) {
        return <NotFoundPage />;
    }

    return (
        <div style={{ maxWidth: 800, margin: "0 auto" }} className={!isInDrawer ? "layout_main_niso" : ""}>
            <title>NISO CHECKLIST | Chi tiết phiếu không đạt</title>
            {loading ? (
                <Container content={<Skeleton active />} />
            ) : (
                <>
                    {isInDrawer ? (
                        <>
                            {user && (user.phanquyen === true || user.phanquyen === "Xử lý yêu cầu") && (
                                <Button
                                    style={{ width: "100%", marginBottom: 20 }}
                                    icon={isTaskCompleted ? <FileSyncOutlined /> : <CheckOutlined />}
                                    onClick={isTaskCompleted ? handleReprocess : handleConfirm}
                                    loading={isTaskCompleted ? reprocessing : false}
                                    type="primary"
                                >
                                    {isTaskCompleted ? "Yêu cầu xử lý lại" : "Phê duyệt"}
                                </Button>
                            )}
                        </>
                    ) : (
                        <Container
                            content={
                                <Space style={{ justifyContent: "space-between", width: "100%", flexWrap: "wrap" }}>
                                    <Button onClick={() => navigate(-1)} icon={<RollbackOutlined />}>
                                        {t("ViewDocs.input5")}
                                    </Button>
                                    <Space wrap>
                                        <Button onClick={() => navigate(`/auth/docs/form/views/${data.responseId}`)} icon={<EyeOutlined />}>Xem phiếu</Button>
                                        <Button 
                                            icon={<LinkOutlined />}
                                            onClick={() => {
                                                const url = window.location.href;
                                                navigator.clipboard.writeText(url).then(() => {
                                                    message.success('Đã sao chép liên kết!');
                                                }).catch(() => {
                                                    message.error('Không thể sao chép liên kết');
                                                });
                                            }}
                                        >
                                            Sao chép liên kết
                                        </Button>
                                        {(user?.phanquyen === true || user?.phanquyen === "Xử lý yêu cầu") && (
                                            <Button
                                                icon={isTaskCompleted ? <FileSyncOutlined /> : <CheckOutlined />}
                                                onClick={isTaskCompleted ? handleReprocess : handleConfirm}
                                                loading={isTaskCompleted ? reprocessing : false}
                                                type="primary"
                                            >
                                                {isTaskCompleted ? "Yêu cầu xử lý lại" : "Phê duyệt"}
                                            </Button>
                                        )}
                                    </Space>
                                </Space>
                            }
                        />
                    )}

                    <BoxXuLy
                        renderThoiGianXuLy={renderThoiGianXuLy}
                        isTaskCompleted={isTaskCompleted}
                        data={data}
                    />

                    {renderQuestion()}
                    <BacktoTop />
                </>
            )}
        </div>
    );
};

export default React.memo(ViewXuly);