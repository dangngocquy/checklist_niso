import React, { useState } from 'react';
import { Button, Space, message, Tooltip } from 'antd';
import dayjs from 'dayjs';
import {
    RollbackOutlined,
    DownloadOutlined,
    StarOutlined,
    UserSwitchOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const BoxHeader = ({ data, user, isInDrawer, navigate, t, exportToExcel, handleStatusChange }) => {
    const [loading, setLoading] = useState(false);

    const handleAddShortcut = async () => {
        setLoading(true);
        try {
            // Lấy danh sách lối tắt hiện có
            const currentShortcutsResponse = await axios.get(`/users/shortcuts`, {
                params: { keys: user.keys },
                headers: { 'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}` }
            });

            const currentShortcuts = currentShortcutsResponse.data.shortcuts || [];
            const currentTime = dayjs().format('DD-MM-YYYY HH:mm:ss');

            // Thêm lối tắt mới vào danh sách hiện có
            const newShortcut = {
                key: `shortcut-${Date.now()}`,
                iconName: 'File',
                text: `${data.title} - ${currentTime}`,
                path: `/auth/docs/form/views/${data.responseId}`
            };

            const response = await axios.post(`/users/shortcuts/save`, {
                userKeys: user.keys,
                shortcuts: [...currentShortcuts, newShortcut]
            }, {
                headers: { Authorization: `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}` }
            });

            if (response.data.success) {
                message.success('Thêm vào lối tắt thành công!');
            }
        } catch (error) {
            console.error('Error saving shortcut:', error);
            message.error('Lỗi khi thêm lối tắt');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {data && user && data.quyenxem === true && !user.keys ? null : (
                <div className={!isInDrawer ? "header__extra__niso" : "header__normal"} style={!user ? { top: 0 } : {}}>
                    <div
                        className={!isInDrawer ? "layout_main_niso" : ""}
                        style={{ margin: "0 auto", maxWidth: "800px", paddingBottom: 12, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: !isInDrawer ? "space-between" : "flex-end" }}
                    >
                        {!isInDrawer && (
                            <Button onClick={() => (user ? navigate("/auth/docs/list/view/danh-sach-phan-hoi/phan-hoi-cua-ban") : navigate("/login"))} icon={<RollbackOutlined />} type={user ? "default" : "primary"}>
                                {user ? t("ViewDocs.input5") : "Đăng nhập"}
                            </Button>
                        )}
                        <Space direction="horizontal">
                            <Button icon={<DownloadOutlined />} onClick={exportToExcel} type="primary">
                                Export Excel
                            </Button>
                            {(user?.phanquyen === true || user?.phanquyen === "Xử lý yêu cầu") && data.yeucauxuly === true && (
                                <Button
                                    icon={<UserSwitchOutlined />}
                                    type="default"
                                    onClick={() => handleStatusChange('Assigned')}
                                >
                                    Assign
                                </Button>
                            )}
                            {user && (
                                <Tooltip title="Thêm vào lối tắt" placement="bottom">
                                    <Button
                                        icon={<StarOutlined />}
                                        onClick={handleAddShortcut}
                                        type='dashed'
                                        loading={loading}
                                    />
                                </Tooltip>
                            )}
                        </Space>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BoxHeader;