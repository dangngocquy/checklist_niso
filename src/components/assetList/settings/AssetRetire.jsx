import React from 'react';
import { Modal, Form, Input, Select, DatePicker, Button, Space, InputNumber } from 'antd';

const { Option } = Select;

const AssetRetire = ({ isRetireModalVisible, handleCancel, selectedAsset, retireForm, handleRetireSubmit }) => {
  const hasSerialNumbers = selectedAsset?.serialNumbers?.length > 0;

  return (
    <Modal
      title="Thanh lý tài sản"
      open={isRetireModalVisible}
      onCancel={handleCancel}
      footer={null}
      centered
    >
      <Form form={retireForm} layout="vertical" onFinish={handleRetireSubmit}>
        <Form.Item
          name="quantity"
          label="Số lượng thanh lý"
          rules={[
            { required: true, message: 'Vui lòng nhập số lượng!' },
            { type: 'number', min: 1, message: 'Số lượng phải là số nguyên dương!' },
            {
              validator: (_, value) =>
                value <= selectedAsset?.quantity
                  ? Promise.resolve()
                  : Promise.reject(new Error('Số lượng thanh lý không được vượt quá số lượng khả dụng!')),
            },
          ]}
        >
          <InputNumber min={1} max={selectedAsset?.quantity} style={{ width: '100%' }} />
        </Form.Item>
        {hasSerialNumbers && (
          <Form.Item name="unitId" label="Unit ID (nếu có)">
            <Select
              allowClear
              placeholder="Chọn Unit ID"
              options={selectedAsset?.unitStatus?.map((unit) => ({
                value: unit.unitId,
                label: unit.unitId,
              }))}
            />
          </Form.Item>
        )}
        <Form.Item
          name="reason"
          label="Lý do thanh lý"
          rules={[{ required: true, message: 'Vui lòng nhập lý do thanh lý!' }]}
        >
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="retiredDate" label="Ngày thanh lý">
          <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
        </Form.Item>
        <Form.Item
          name="initialValue"
          label="Giá trị ban đầu"
          rules={[{ type: 'number', min: 0, message: 'Giá trị phải là số không âm!' }]}
        >
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="currentValue"
          label="Giá trị hiện tại"
          rules={[{ type: 'number', min: 0, message: 'Giá trị phải là số không âm!' }]}
        >
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="retirementValue"
          label="Giá trị thanh lý"
          rules={[{ type: 'number', min: 0, message: 'Giá trị phải là số không âm!' }]}
        >
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="retirementMethod"
          label="Phương thức thanh lý"
          rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh lý!' }]}
        >
          <Select placeholder="Chọn phương thức">
            <Option value="Bán">Bán</Option>
            <Option value="Tặng">Tặng</Option>
            <Option value="Hủy">Hủy</Option>
            <Option value="Khác">Khác</Option>
          </Select>
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Gửi yêu cầu
            </Button>
            <Button onClick={handleCancel}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AssetRetire;