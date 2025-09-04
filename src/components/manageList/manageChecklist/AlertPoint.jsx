import React from "react";
import { Alert, Typography, Space, Divider, Card } from "antd";
import { InfoCircleFilled, SettingOutlined, PlusOutlined, SaveOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export const AlertPoint = () => {
    return (
        <div className="alert-point-card" style={{ marginTop: 18 }}>
            <Alert
                banner
                type="info"
                showIcon
                icon={<InfoCircleFilled style={{ fontSize: "1.25rem", color: "#ae8f3d" }} />}
                message={
                    <Title level={5} style={{ margin: 0, color: "#ae8f3d", fontSize: "1rem" }}>
                        Hướng dẫn sử dụng cấu hình điểm và xếp loại
                    </Title>
                }
                style={{
                    border: "none",
                    background: "#edecdf",
                    borderRadius: "8px 8px 0 0",
                    padding: "12px 16px"
                }}
            />

            <div style={{ padding: "16px 12px" }}>
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    {/* Phần 1: Cấu hình điểm cơ bản */}
                    <div className="guide-section">
                        <Space align="center">
                            <SettingOutlined style={{ fontSize: "1rem", color: "#ae8f3d" }} />
                            <Title level={5} style={{ margin: 0, fontSize: "0.9rem" }}>1. Cấu hình điểm cơ bản</Title>
                        </Space>
                        <div style={{ marginLeft: 20, marginTop: 8 }}>
                            <Space direction="vertical" size="small" style={{ width: "100%" }}>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}>Nhấn nút <Text strong>Cấu hình điểm</Text> để bắt đầu thiết lập.</Text>
                                </Space>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}>Chọn <Text strong>Thêm cấu hình cơ bản</Text> để thêm cấu hình mới.</Text>
                                </Space>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}>Bạn có thể <Text strong type="success">chỉnh sửa</Text> hoặc <Text strong type="danger">xóa</Text> các cấu hình đã tạo.</Text>
                                </Space>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}>Chọn câu hỏi và đáp án để bắt đầu tính điểm khi người dùng phản hồi đúng với thiết lập.</Text>
                                </Space>
                            </Space>
                        </div>
                    </div>

                    <Divider style={{ margin: "4px 0" }} />

                    {/* Phần 2: Cấu hình điểm nâng cao */}
                    <div className="guide-section">
                        <Space align="center">
                            <PlusOutlined style={{ fontSize: "1rem", color: "#ae8f3d" }} />
                            <Title level={5} style={{ margin: 0, fontSize: "0.9rem" }}>2. Cấu hình điểm nâng cao</Title>
                        </Space>
                        <div style={{ marginLeft: 20, marginTop: 8 }}>
                            <Space direction="vertical" size="small" style={{ width: "100%" }}>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}>Nhấn <Text strong>Thêm cấu hình nâng cao</Text> để thêm cấu hình mới.</Text>
                                </Space>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}>Chọn câu hỏi và đáp án. Điểm sẽ tự động lấy từ dữ liệu của câu hỏi (nếu có).</Text>
                                </Space>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}>Dễ dàng <Text strong>xem, chỉnh sửa, xóa</Text> các cấu hình đã thêm qua bảng hiển thị.</Text>
                                </Space>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}>Tổng điểm nâng cao được tính và hiển thị ở cuối bảng.</Text>
                                </Space>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}>Khi người dùng chọn đáp án đã cấu hình, điểm sẽ được tính riêng.</Text>
                                </Space>
                            </Space>

                            <Card
                                size="small"
                                title={<span style={{ fontSize: "0.85rem" }}>Công thức ví dụ</span>}
                                style={{
                                    marginTop: 8,
                                    backgroundColor: "#f9f9f9",
                                    borderColor: "#d9d9d9"
                                }}
                                bodyStyle={{ padding: "8px 12px" }}
                            >
                                <Space direction="vertical" size="small">
                                    <Text style={{ fontSize: "0.8rem" }}>• Tổng điểm sai = Điểm các câu trả lời sai × số lần lặp lại</Text>
                                    <Text style={{ fontSize: "0.8rem" }}>• EARN = Tổng điểm - (Điểm đã cấu hình cho câu hỏi + Tổng điểm sai)</Text>
                                    <Text style={{ fontSize: "0.8rem" }}>• ARCHIVE = EARN / (Tổng điểm - Điểm đã cấu hình cho câu hỏi)</Text>
                                </Space>
                            </Card>
                        </div>
                    </div>

                    <Divider style={{ margin: "4px 0" }} />

                    {/* Phần 3: Cấu hình xếp loại */}
                    <div className="guide-section">
                        <Space align="center">
                            <SettingOutlined style={{ fontSize: "1rem", color: "#ae8f3d" }} />
                            <Title level={5} style={{ margin: 0, fontSize: "0.9rem" }}>3. Cấu hình xếp loại</Title>
                        </Space>
                        <div style={{ marginLeft: 20, marginTop: 8 }}>
                            <Space direction="vertical" size="small" style={{ width: "100%" }}>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}>Nhấn <Text strong>Thêm xếp loại</Text> để thêm một mức xếp loại mới (không bắt buộc).</Text>
                                </Space>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}>Chọn loại điểm (<Text strong>EARN</Text> cho điểm tuyệt đối hoặc <Text strong>ARCHIVE</Text> cho phần trăm) và đặt mức đạt.</Text>
                                </Space>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}>Bạn có thể <Text strong>xem, chỉnh sửa, xóa</Text> các xếp loại đã thêm qua bảng hiển thị.</Text>
                                </Space>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}>Xếp loại giúp phân loại kết quả dựa trên điểm số, nhưng không bắt buộc phải thiết lập.</Text>
                                </Space>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}><Text strong type="warning">Lưu ý:</Text> Cần có ít nhất một cấu hình điểm (cơ bản hoặc nâng cao) trước khi thêm xếp loại.</Text>
                                </Space>
                            </Space>
                        </div>
                    </div>

                    <Divider style={{ margin: "4px 0" }} />

                    {/* Phần 4: Lưu cấu hình */}
                    <div className="guide-section">
                        <Space align="center">
                            <SaveOutlined style={{ fontSize: "1rem", color: "#ae8f3d" }} />
                            <Title level={5} style={{ margin: 0, fontSize: "0.9rem" }}>4. Lưu cấu hình</Title>
                        </Space>
                        <div style={{ marginLeft: 20, marginTop: 8 }}>
                            <Space direction="vertical" size="small" style={{ width: "100%" }}>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}>Sau khi hoàn tất, nhấn <Text strong>Lưu tất cả cấu hình</Text> để lưu thay đổi.</Text>
                                </Space>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}><Text strong type="warning">Lưu ý:</Text> Cần có ít nhất một cấu hình (cơ bản hoặc nâng cao) trước khi lưu.</Text>
                                </Space>
                            </Space>
                        </div>
                    </div>

                    <Divider style={{ margin: "4px 0" }} />

                    {/* Phần 5: Lưu ý khác */}
                    <div className="guide-section">
                        <Space align="center">
                            <InfoCircleFilled style={{ fontSize: "1rem", color: "#faad14" }} />
                            <Title level={5} style={{ margin: 0, fontSize: "0.9rem" }}>5. Một số lưu ý khác</Title>
                        </Space>
                        <div style={{ marginLeft: 20, marginTop: 8 }}>
                            <Space direction="vertical" size="small" style={{ width: "100%" }}>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}>Cần bật 'Hiển thị số lần lặp lại' để cấu hình điểm.</Text>
                                </Space>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}>Ở cấu hình điểm nâng cao khi chọn <Text strong>Khác</Text> point sẽ được tính là 0.</Text>
                                </Space>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}>Nếu không thấy câu hỏi, hãy kiểm tra lại checklist.</Text>
                                </Space>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}>Hãy xem trước câu hỏi để đảm bảo chọn đúng nội dung cần cấu hình.</Text>
                                </Space>
                                <Space align="start" wrap>
                                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "0.8rem" }} />
                                    <Text style={{ fontSize: "0.85rem" }}>Đảm bảo Checklist đã thêm điểm và thiết lập đáp án chính xác.</Text>
                                </Space>
                            </Space>
                        </div>
                    </div>
                </Space>
            </div>
        </div>
    );
};

export default AlertPoint;