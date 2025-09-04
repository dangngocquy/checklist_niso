import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Button,
    Space,
    Modal,
    Form,
    Input,
    Select,
    Menu,
    message,
    Dropdown,
    Spin,
    Tooltip
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EllipsisOutlined,
    FileOutlined,
    BarChartOutlined,
    CalendarOutlined,
    TeamOutlined,
    ContainerOutlined,
    FileProtectOutlined,
    ArrowRightOutlined,
    LockOutlined,
    StarOutlined,
    FieldTimeOutlined
} from '@ant-design/icons';
import axios from 'axios';

const styles = {
    cardTitleWithIcon: {
        display: 'flex',
        alignItems: 'center',
        fontWeight: 600,
        gap: 8
    },
    sidebarCard: {
        marginBottom: 16,
        height: '100%'
    },
    quickAccessButton: {
        textAlign: 'left',
        height: 44,
        marginBottom: 4,
        borderRadius: 4,
        transition: 'all 0.3s',
        justifyContent: 'flex-start',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis'
    }
};

const iconMap = {
    'File': <FileOutlined />,
    'BarChart': <BarChartOutlined />,
    'Calendar': <CalendarOutlined />,
    'Team': <TeamOutlined />,
    'Container': <ContainerOutlined />,
    'FileProtect': <FileProtectOutlined />,
    'ArrowRight': <ArrowRightOutlined />,
    'Lock': <LockOutlined />,
    'Star': <StarOutlined />,
    'FieldTime': <FieldTimeOutlined />
};

const getIconNameFromElement = (icon) => {
    return Object.keys(iconMap).find(key =>
        iconMap[key].type.name === icon.type.name
    ) || 'File';
};

const QuickAccessCard = ({ userKeys, navigate }) => {
    const [shortcuts, setShortcuts] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingShortcut, setEditingShortcut] = useState(null);
    const [form] = Form.useForm();
    const [hasShortcuts, setHasShortcuts] = useState(false);
    const [loading, setLoading] = useState(true); // Bắt đầu với loading = true

    const truncateText = (text, maxLength = 30) => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    };

    const fetchShortcuts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/users/shortcuts`, {
                params: { keys: userKeys },
                headers: { 'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}` }
            });
            const userShortcuts = response.data.shortcuts.map(s => ({
                ...s,
                icon: iconMap[s.iconName] || <FileOutlined />
            }));
            setShortcuts(userShortcuts);
            setHasShortcuts(userShortcuts.length > 0);
        } catch (error) {
            console.error('Error fetching shortcuts:', error);
            setShortcuts([]);
            setHasShortcuts(false);
            message.error('Lỗi khi tải danh sách lối tắt');
        } finally {
            setLoading(false);
        }
    }, [userKeys]);

    useEffect(() => {
        fetchShortcuts();
    }, [fetchShortcuts]);

    const saveShortcuts = async (updatedShortcuts) => {
        setLoading(true);
        try {
            const shortcutsToSave = updatedShortcuts.map(s => ({
                key: s.key,
                iconName: getIconNameFromElement(s.icon),
                text: s.text,
                path: s.path
            }));

            const response = await axios.post(`/users/shortcuts/save`, {
                userKeys,
                shortcuts: shortcutsToSave
            }, {
                headers: { Authorization: `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}` }
            });

            if (response.data.success) {
                await fetchShortcuts();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error saving shortcuts:', error);
            message.error('Lỗi khi lưu lối tắt');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const showModal = (shortcut = null) => {
        form.resetFields();
        if (shortcut) {
            setEditingShortcut(shortcut);
            setIsEditMode(true);
            form.setFieldsValue({
                text: shortcut.text,
                path: shortcut.path,
                icon: getIconNameFromElement(shortcut.icon)
            });
        } else {
            setEditingShortcut(null);
            setIsEditMode(false);
        }
        setIsModalVisible(true);
    };

    const handleOk = () => form.submit();

    const onFinish = async (values) => {
        try {
            const isDuplicate = shortcuts.some(s =>
                s.path === values.path &&
                (!editingShortcut || s.key !== editingShortcut.key)
            );
            if (isDuplicate) {
                message.error('Lối tắt với đường dẫn này đã tồn tại');
                return;
            }

            const newShortcut = {
                key: editingShortcut ? editingShortcut.key : `shortcut-${Date.now()}`,
                icon: iconMap[values.icon],
                text: values.text,
                path: values.path
            };

            let updatedShortcuts;
            if (isEditMode && editingShortcut) {
                updatedShortcuts = shortcuts.map(s =>
                    s.key === editingShortcut.key ? newShortcut : s
                );
            } else {
                updatedShortcuts = [...shortcuts, newShortcut];
            }

            const success = await saveShortcuts(updatedShortcuts);
            if (success) {
                message.success(isEditMode ? 'Cập nhật lối tắt thành công!' : 'Thêm lối tắt thành công!');
                setIsModalVisible(false);
                setEditingShortcut(null);
                setIsEditMode(false);
            }
        } catch (error) {
            message.error('Lỗi khi xử lý lối tắt');
        }
    };

    const removeShortcut = async (key) => {
        setLoading(true);
        try {
            const updatedShortcuts = shortcuts.filter(s => s.key !== key);
            const success = await saveShortcuts(updatedShortcuts);
            if (success) {
                message.success('Đã xóa lối tắt thành công!');
                setHasShortcuts(updatedShortcuts.length > 0);
            }
        } catch (error) {
            message.error('Lỗi khi xóa lối tắt');
        } finally {
            setLoading(false);
        }
    };

    const handleShortcutClick = (path) => {
        window.open(path.replace(window.location.origin, ''), '_blank');
    };

    const menu = (shortcut) => (
        <Menu>
            <Menu.Item
                key="edit"
                icon={<EditOutlined />}
                onClick={() => showModal(shortcut)}
            >
                Chỉnh sửa
            </Menu.Item>
            <Menu.Item
                key="delete"
                icon={<DeleteOutlined />}
                danger
                onClick={() => Modal.confirm({
                    title: 'Xác nhận xóa',
                    content: 'Bạn có chắc chắn muốn xóa lối tắt này?',
                    okText: 'Xóa',
                    cancelText: 'Hủy',
                    okButtonProps: { danger: true },
                    onOk: () => removeShortcut(shortcut.key)
                })}
            >
                Xóa
            </Menu.Item>
        </Menu>
    );

    return (
        <Spin spinning={loading} size='small'>
            <Card
                title={
                    <div style={styles.cardTitleWithIcon}>
                        <StarOutlined />
                        <span>Truy Cập Nhanh</span>
                    </div>
                }
                bordered={false}
                style={styles.sidebarCard}
                extra={
                    <Button
                        type="text"
                        icon={<PlusOutlined />}
                        onClick={() => showModal()}
                        size="small"
                        disabled={loading}
                    />
                }
            >
                {!hasShortcuts ? (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => showModal()}
                        block
                        disabled={loading} // Vô hiệu hóa nút khi đang loading
                    >
                        Tạo lối tắt
                    </Button>
                ) : (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        {shortcuts.map((shortcut) => (
                            <div
                                key={shortcut.key}
                                style={{
                                    position: 'relative',
                                    borderRadius: '4px',
                                    transition: 'all 0.3s',
                                }}
                            >
                                <Tooltip title={shortcut.text} placement="top">
                                    <Button
                                        type="text"
                                        icon={shortcut.icon}
                                        block
                                        style={styles.quickAccessButton}
                                        onClick={() => handleShortcutClick(shortcut.path)}
                                        disabled={loading}
                                    >
                                        {truncateText(shortcut.text)}
                                    </Button>
                                </Tooltip>
                                <Dropdown
                                    overlay={menu(shortcut)}
                                    trigger={['click']}
                                    placement="bottomRight"
                                    disabled={loading}
                                >
                                    <Button
                                        type="text"
                                        icon={<EllipsisOutlined />}
                                        size="small"
                                        style={{
                                            position: 'absolute',
                                            right: '5px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                        }}
                                        onClick={e => e.stopPropagation()}
                                    />
                                </Dropdown>
                            </div>
                        ))}
                    </Space>
                )}
            </Card>

            <Modal
                title={isEditMode ? "Chỉnh sửa lối tắt" : "Thêm lối tắt mới"}
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={() => {
                    setIsModalVisible(false);
                    setEditingShortcut(null);
                    setIsEditMode(false);
                }}
                maskClosable={false}
                destroyOnClose={true}
                confirmLoading={loading}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Form.Item
                        name="text"
                        label="Tên lối tắt"
                        rules={[{
                            required: true,
                            message: 'Vui lòng nhập tên lối tắt'
                        }]}
                    >
                        <Input
                            placeholder="Nhập tên lối tắt"
                            maxLength={80}
                            disabled={loading}
                        />
                    </Form.Item>
                    <Form.Item
                        name="path"
                        label="Đường dẫn"
                        rules={[
                            {
                                validator: (_, value) =>
                                    value && value.includes(window.location.origin)
                                        ? Promise.resolve()
                                        : Promise.reject(new Error('Đường dẫn phải chứa địa chỉ trang web hiện tại'))
                            }
                        ]}
                    >
                        <Input
                            placeholder={`Ví dụ: ${window.location.origin}/auth/docs/create`}
                            disabled={loading}
                        />
                    </Form.Item>
                    <Form.Item
                        name="icon"
                        label="Biểu tượng"
                        rules={[{
                            required: true,
                            message: 'Vui lòng chọn biểu tượng'
                        }]}
                    >
                        <Select placeholder="Chọn biểu tượng" disabled={loading}>
                            {Object.entries(iconMap).map(([key, icon]) => (
                                <Select.Option key={key} value={key}>
                                    <Space>{icon} {key}</Space>
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </Spin>
    );
};

export default QuickAccessCard;