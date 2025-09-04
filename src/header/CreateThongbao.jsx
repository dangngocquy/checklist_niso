import React, { useState } from "react";
import {
    Form,
    Input,
    Button,
    Select,
    Card,
    Typography,
    Space,
    Divider,
    ConfigProvider,
    DatePicker,
    Radio,
    Upload,
    message,
    Switch,
    Tooltip
} from "antd";
import NotFoundPage from "../components/NotFoundPage";
import {
    NotificationOutlined,
    UserOutlined,
    TeamOutlined,
    UploadOutlined,
    ArrowLeftOutlined,
    QuestionCircleOutlined,
    SendOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CreateThongbao = ({hastCreatenotiPermission, user}) => {
    const [form] = Form.useForm();
    const [notificationType, setNotificationType] = useState("all");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleTypeChange = (e) => {
        setNotificationType(e.target.value);
    };

    const handleSubmit = async (values) => {
        setLoading(true);

        // Simulating API call
        try {
            console.log("Form values:", values);
            // Replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            message.success("Thông báo đã được tạo thành công!");
            form.resetFields();
            // Navigate back to notifications page
            navigate('/auth/docs/notifications');
        } catch (error) {
            message.error("Đã xảy ra lỗi khi tạo thông báo!");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/auth/docs/notifications');
    };

    const normFile = (e) => {
        if (Array.isArray(e)) {
            return e;
        }
        return e?.fileList;
    };

    if (!hastCreatenotiPermission && user.phanquyen !== true) {
        return <NotFoundPage />;
      }

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#ae8f3d',
                    borderRadius: 6,
                },
            }}
        >
            <div style={{ background: "#f0f2f5", minHeight: "100vh" }} className="layout_main_niso">
                <title>NISO CHECKLIST | Tạo thông báo mới</title>

                <Card
                    style={{ marginBottom: 20, borderRadius: 8 }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 15, flexDirection: window.innerWidth < 768 ? 'column-reverse' : 'row' }}>
                        <Space align={window.innerWidth < 768 ? 'left' : 'center'}>
                            <NotificationOutlined style={{ fontSize: 20, color: '#ae8f3d' }} />
                            <Title level={window.innerWidth < 768 ? 5 : 3} style={{ margin: 0 }}>Tạo thông báo mới (Cập nhật sau)</Title>
                        </Space>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={handleCancel}
                            type={window.innerWidth < 768 ? 'link' : 'default'}
                        >
                            Quay lại
                        </Button>
                    </div>
                </Card>

                <Card style={{ borderRadius: 8 }}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        initialValues={{
                            type: "all",
                            priority: "normal",
                            showExpiry: false
                        }}
                    >
                        <Title level={5}>Thông tin cơ bản</Title>
                        <Divider style={{ margin: '12px 0 24px' }} />

                        <Form.Item
                            name="title"
                            label="Tiêu đề thông báo"
                            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề thông báo!' }]}
                        >
                            <Input placeholder="Nhập tiêu đề thông báo" maxLength={100} showCount />
                        </Form.Item>

                        <Form.Item
                            name="content"
                            label="Nội dung thông báo"
                            rules={[{ required: true, message: 'Vui lòng nhập nội dung thông báo!' }]}
                        >
                            <TextArea
                                placeholder="Nhập nội dung chi tiết thông báo"
                                autoSize={{ minRows: 4, maxRows: 10 }}
                                maxLength={500}
                                showCount
                            />
                        </Form.Item>

                        <Form.Item
                            name="type"
                            label="Loại thông báo"
                            rules={[{ required: true }]}
                        >
                            <Radio.Group onChange={handleTypeChange}>
                                <Space direction="vertical">
                                    <Radio value="all">
                                        <Space>
                                            <TeamOutlined />
                                            <Text>Gửi cho tất cả người dùng</Text>
                                        </Space>
                                    </Radio>
                                    <Radio value="specific">
                                        <Space>
                                            <UserOutlined />
                                            <Text>Gửi cho người dùng cụ thể</Text>
                                        </Space>
                                    </Radio>
                                    <Radio value="department">
                                        <Space>
                                            <TeamOutlined />
                                            <Text>Gửi cho khối / phòng</Text>
                                        </Space>
                                    </Radio>
                                    <Radio value="restaurants">
                                        <Space>
                                            <TeamOutlined />
                                            <Text>Gửi cho nhà hàng</Text>
                                        </Space>
                                    </Radio>
                                </Space>
                            </Radio.Group>
                        </Form.Item>

                        {notificationType === "specific" && (
                            <Form.Item
                                name="recipients"
                                label="Người nhận"
                                rules={[{ required: true, message: 'Vui lòng chọn người nhận!' }]}
                            >
                                <Select
                                    mode="multiple"
                                    placeholder="Chọn người nhận"
                                    optionFilterProp="label"
                                    showSearch
                                >
                                    <Option value="dept1" label="Phòng Kỹ thuật">Phòng Kỹ thuật</Option>
                                    <Option value="dept2" label="Phòng Nhân sự">Phòng Nhân sự</Option>
                                    <Option value="dept3" label="Phòng Kinh doanh">Phòng Kinh doanh</Option>
                                    <Option value="dept4" label="Phòng Tài chính">Phòng Tài chính</Option>
                                </Select>
                            </Form.Item>
                        )}

                        {notificationType === "department" && (
                            <Form.Item
                                name="departments"
                                label="Khối / Phòng"
                                rules={[{ required: true, message: 'Vui lòng chọn khối / phòng!' }]}
                            >
                                <Select
                                    mode="multiple"
                                    placeholder="Chọn khối / phòng"
                                    optionFilterProp="label"
                                    showSearch
                                >
                                    <Option value="dept1" label="Phòng Kỹ thuật">Phòng Kỹ thuật</Option>
                                    <Option value="dept2" label="Phòng Nhân sự">Phòng Nhân sự</Option>
                                    <Option value="dept3" label="Phòng Kinh doanh">Phòng Kinh doanh</Option>
                                    <Option value="dept4" label="Phòng Tài chính">Phòng Tài chính</Option>
                                </Select>
                            </Form.Item>
                        )}

                        {notificationType === "restaurants" && (
                            <Form.Item
                                name="restaurants"
                                label="Nhà hàng"
                                rules={[{ required: true, message: 'Vui lòng chọn nhà hàng!' }]}
                            >
                                <Select
                                    mode="multiple"
                                    placeholder="Chọn nhà hàng"
                                    optionFilterProp="label"
                                    showSearch
                                >
                                    <Option value="dept1" label="Phòng Kỹ thuật">Phòng Kỹ thuật</Option>
                                    <Option value="dept2" label="Phòng Nhân sự">Phòng Nhân sự</Option>
                                    <Option value="dept3" label="Phòng Kinh doanh">Phòng Kinh doanh</Option>
                                    <Option value="dept4" label="Phòng Tài chính">Phòng Tài chính</Option>
                                </Select>
                            </Form.Item>
                        )}

                        <Divider style={{ margin: '24px 0' }} />
                        <Title level={5}>Cài đặt nâng cao</Title>
                        <Divider style={{ margin: '12px 0 24px' }} />

                        <Form.Item
                            name="priority"
                            label="Mức độ ưu tiên"
                        >
                            <Select placeholder="Chọn mức độ ưu tiên">
                                <Option value="low">Thấp</Option>
                                <Option value="normal">Bình thường</Option>
                                <Option value="high">Cao</Option>
                                <Option value="urgent">Khẩn cấp</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="showExpiry"
                            label={
                                <Space>
                                    <span>Thời hạn hiển thị</span>
                                    <Tooltip title="Thông báo sẽ tự động ẩn sau thời gian này">
                                        <QuestionCircleOutlined />
                                    </Tooltip>
                                </Space>
                            }
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) => prevValues.showExpiry !== currentValues.showExpiry}
                        >
                            {({ getFieldValue }) =>
                                getFieldValue('showExpiry') ? (
                                    <Form.Item
                                        name="expiryRange"
                                        label="Thời gian hiển thị"
                                        rules={[{ required: true, message: 'Vui lòng chọn thời gian hiển thị!' }]}
                                    >
                                        <RangePicker
                                            showTime
                                            format="DD/MM/YYYY HH:mm"
                                            style={{ width: '100%' }}
                                            placeholder={['Bắt đầu', 'Kết thúc']}
                                        />
                                    </Form.Item>
                                ) : null
                            }
                        </Form.Item>

                        <Form.Item
                            name="attachments"
                            label="Tệp đính kèm"
                            valuePropName="fileList"
                            getValueFromEvent={normFile}
                        >
                            <Upload name="files" action="/upload.do" listType="text">
                                <Button icon={<UploadOutlined />}>Chọn tệp</Button>
                            </Upload>
                        </Form.Item>

                        <Form.Item style={{ marginTop: 36, textAlign: 'right' }}>
                            <Space>
                                <Button onClick={handleCancel}>Hủy</Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    disabled
                                    icon={<SendOutlined />}
                                >
                                    Gửi thông báo
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </ConfigProvider>
    );
};

export default CreateThongbao;