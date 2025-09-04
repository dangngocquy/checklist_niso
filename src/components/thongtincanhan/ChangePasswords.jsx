import React, { useState } from 'react';
import { Input, Form, Button, message, Modal } from 'antd';
import useApi from '../../hook/useApi';
import { PiWarningCircleLight } from 'react-icons/pi';

const ChangePassword = React.memo(({ keys, handleLogout, t }) => {
    const { userApi, loading } = useApi();
    const [form] = Form.useForm();
    const [submitLoading, setSubmitLoading] = useState(false);
    const [isPasswordChangeSuccessModalVisible, setIsPasswordChangeSuccessModalVisible] = useState(false);

    const onFinish = async (values) => {
        const { oldPassword, newPassword, confirmPassword } = values;

        // Kiểm tra thủ công
        if (!oldPassword) {
            message.warning('Vui lòng nhập mật khẩu cũ!');
            return;
        }
        if (!newPassword) {
            message.warning('Vui lòng nhập mật khẩu mới!');
            return;
        }
        if (!confirmPassword) {
            message.warning('Vui lòng xác nhận mật khẩu mới!');
            return;
        }
        if (newPassword.length < 8) {
            message.warning('Mật khẩu mới phải dài ít nhất 8 ký tự!');
            return;
        }
        if (oldPassword === newPassword) {
            message.warning('Mật khẩu mới không được trùng với mật khẩu cũ!');
            return;
        }
        if (newPassword !== confirmPassword) {
            message.warning('Xác nhận mật khẩu mới không khớp!');
            return;
        }

        setSubmitLoading(true);
        try {
            const response = await userApi.changePassword(keys, { oldPassword, password: newPassword });

            if (response.message === 'Cập nhật mật khẩu thành công!') {
                message.success('Đổi mật khẩu thành công!');
                form.resetFields();
                setIsPasswordChangeSuccessModalVisible(true);
            } else {
                message.error('Phản hồi từ server không như mong đợi: ' + (response.message || 'Không có thông tin'));
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật mật khẩu!';
            // Hiển thị thông báo nhanh khi mật khẩu cũ không đúng hoặc lỗi khác
            message.error(errorMessage);
        } finally {
            setSubmitLoading(false);
        }
    };

    const closePasswordChangeSuccessModal = () => {
        setIsPasswordChangeSuccessModalVisible(false);
    };

    return (
        <div>
            <Form form={form} layout='vertical' onFinish={onFinish} >
                <Form.Item label="Mật khẩu cũ" name="oldPassword">
                    <Input.Password
                        size="middle"
                        placeholder="Nhập mật khẩu cũ"
                        autoComplete="current-password"
                    />
                </Form.Item>

                <Form.Item label="Mật khẩu mới" name="newPassword">
                    <Input.Password
                        size="middle"
                        placeholder="Nhập mật khẩu mới"
                        autoComplete="new-password"
                    />
                </Form.Item>

                <Form.Item label="Xác nhận mật khẩu mới" name="confirmPassword">
                    <Input.Password
                        size="middle"
                        placeholder="Nhập lại mật khẩu mới"
                        autoComplete="new-password"
                    />
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size='middle'
                        loading={submitLoading || loading}
                        block
                    >
                        Đổi mật khẩu
                    </Button>
                </Form.Item>
            </Form>

            <Modal
                title={<p style={{ textTransform: 'uppercase' }}>{t('Profile.input23')}</p>}
                open={isPasswordChangeSuccessModalVisible}
                closable={false}
                icon={<PiWarningCircleLight />}
                footer={[
                    <Button key="close" onClick={closePasswordChangeSuccessModal}>
                        {t('Profile.input19')}
                    </Button>,
                    <Button key="logout" onClick={handleLogout} type="primary">
                        {t('Header.header10')}
                    </Button>,
                ]}
            >
                {t('Profile.input18')}
            </Modal>
        </div>
    );
});

export default ChangePassword;