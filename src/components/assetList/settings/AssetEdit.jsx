import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Button, Space, InputNumber } from 'antd';
import dayjs from 'dayjs';
import { message } from 'antd';
import axios from 'axios';

const { Option } = Select;

const AssetEdit = ({ visible, onCancel, selectedAsset, fetchAssets, axiosConfig }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (selectedAsset) {
            form.setFieldsValue({
                ...selectedAsset,
                purchaseDate: selectedAsset.purchaseDate ? dayjs(selectedAsset.purchaseDate, 'DD-MM-YYYY') : null,
                serialNumbers: selectedAsset.serialNumbers || [],
                quantity: selectedAsset.quantity,
                price: selectedAsset.price,
            });
        } else {
            form.resetFields();
        }
    }, [selectedAsset, form]);

    const handleSubmit = (values) => {
        const formattedValues = {
            ...values,
            purchaseDate: values.purchaseDate ? values.purchaseDate.format('DD-MM-YYYY') : null,
            serialNumbers: values.serialNumbers || [],
            quantity: values.quantity || 1,
        };

        if (selectedAsset) {
            axios
                .put(`/api/assets/${selectedAsset._id}`, formattedValues, axiosConfig)
                .then(() => {
                    message.success('Tài sản đã được cập nhật thành công!');
                    onCancel();
                    form.resetFields();
                    fetchAssets();
                })
                .catch(error => {
                    message.error(error.response?.data?.message || 'Không thể cập nhật tài sản');
                });
        } else {
            axios
                .post('/api/assets', formattedValues, axiosConfig)
                .then(() => {
                    message.success('Tài sản mới đã được thêm thành công!');
                    onCancel();
                    form.resetFields();
                    fetchAssets();
                })
                .catch(error => {
                    message.error(error.response?.data?.message || 'Không thể thêm tài sản');
                });
        }
    };

    return (
        <Modal
            title={selectedAsset ? 'Chỉnh sửa tài sản' : 'Thêm tài sản mới'}
            open={visible}
            onCancel={onCancel}
            footer={null}
            centered
            width={800}
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    <Form.Item name="assetTag" label="Mã tài sản" rules={[{ required: true, message: 'Vui lòng nhập mã tài sản!' }]} style={{ flex: '1 0 200px' }}>
                        <Input placeholder="Ví dụ: LT-001" />
                    </Form.Item>
                    <Form.Item name="name" label="Tên tài sản" rules={[{ required: true, message: 'Vui lòng nhập tên tài sản!' }]} style={{ flex: '1 0 200px' }}>
                        <Input placeholder="Ví dụ: Dell XPS 13" />
                    </Form.Item>
                    <Form.Item name="category" label="Danh mục" rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]} style={{ flex: '1 0 200px' }}>
                        <Select placeholder="Chọn danh mục">
                            <Option value="Laptop">Laptop</Option>
                            <Option value="Desktop">Desktop</Option>
                            <Option value="Monitor">Màn hình</Option>
                            <Option value="Printer">Máy in</Option>
                            <Option value="Network">Thiết bị mạng</Option>
                            <Option value="Software">Phần mềm</Option>
                            <Option value="Other">Khác</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="location" label="Vị trí" style={{ flex: '1 0 200px' }}>
                        <Input placeholder="Vị trí..." />
                    </Form.Item>
                    <Form.Item name="purchaseDate" label="Ngày mua" style={{ flex: '1 0 200px' }}>
                        <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
                    </Form.Item>
                    <Form.Item
                        name="price"
                        label="Giá mua"
                        style={{ flex: '1 0 200px' }}
                    >
                        <InputNumber
                            placeholder="Ví dụ: 25.000.000"
                            formatter={value => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                            addonAfter="VND"
                            style={{ width: '100%' }}
                            min={0}
                        />
                    </Form.Item>
                    <Form.Item
                        name="quantity"
                        label="Số lượng"
                        rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
                        style={{ flex: '1 0 200px' }}
                    >
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="manufacturer" label="Nhà sản xuất" style={{ flex: '1 0 200px' }}>
                        <Input placeholder="Ví dụ: Dell" />
                    </Form.Item>
                    <Form.Item name="model" label="Model" style={{ flex: '1 0 200px' }}>
                        <Input placeholder="Ví dụ: XPS 13" />
                    </Form.Item>
                    <Form.Item
                        name="serialNumbers"
                        label="Danh sách số serial (tùy chọn)"
                        style={{ flex: '1 0 100%' }}
                    >
                        <Select
                            mode="tags"
                            placeholder="Nhập số serial và nhấn Enter (ví dụ: DELL12345678)"
                            tokenSeparators={[',']}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                    <Form.Item name="notes" label="Ghi chú" style={{ flex: '1 0 100%' }}>
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </div>
                <Form.Item style={{ textAlign: 'right', marginBottom: '0px', marginTop: '12px' }}>
                    <Space>
                        <Button onClick={onCancel}>Hủy</Button>
                        <Button type="primary" htmlType="submit">{selectedAsset ? 'Cập nhật' : 'Thêm mới'}</Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AssetEdit;