import React from 'react';
import { Modal, Form, Input, Select, DatePicker, Button, Space, InputNumber, Checkbox } from 'antd';
const { Option } = Select;

const AssetAdd = ({ isModalVisible, handleCancel, selectedAsset, form, handleSubmit }) => {
  const [hasSerialNumbers, setHasSerialNumbers] = React.useState(true);

  // Update checkbox state and form values when editing existing asset
  React.useEffect(() => {
    if (selectedAsset) {
      const hasSerials = selectedAsset.serialNumbers?.length > 0;
      setHasSerialNumbers(hasSerials);
      form.setFieldsValue({
        ...selectedAsset,
        hasSerialNumbers: hasSerials,
        serialNumbers: selectedAsset.serialNumbers?.join('\n') || '',
        quantity: selectedAsset.quantity,
      });
    } else {
      setHasSerialNumbers(true);
      form.setFieldsValue({ hasSerialNumbers: true, serialNumbers: '', quantity: 1 });
    }
  }, [selectedAsset, form]);

  const handleCheckboxChange = (e) => {
    setHasSerialNumbers(e.target.checked);
    if (!e.target.checked) {
      form.setFieldsValue({ serialNumbers: '', quantity: 1 });
    } else {
      form.setFieldsValue({ quantity: undefined, serialNumbers: '' });
    }
  };

  const handleSerialNumbersChange = (e) => {
    const value = e.target.value;
    const serials = value
      .split('\n')
      .map((sn) => sn.trim())
      .filter((sn) => sn);
    form.setFieldsValue({
      serialNumbers: value,
      quantity: serials.length || undefined,
    });
  };

  return (
    <Modal
      title={selectedAsset ? 'Chỉnh sửa tài sản' : 'Thêm tài sản mới'}
      open={isModalVisible}
      onCancel={handleCancel}
      footer={null}
      centered
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          // Process serial numbers before submitting
          const serials = values.hasSerialNumbers
            ? values.serialNumbers.split('\n').map((sn) => sn.trim()).filter((sn) => sn)
            : [];
          handleSubmit({
            ...values,
            serialNumbers: serials,
            quantity: values.hasSerialNumbers ? serials.length : values.quantity,
          });
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <Form.Item
            name="assetTag"
            label="Mã tài sản"
            rules={[{ required: true, message: 'Vui lòng nhập mã tài sản!' }]}
            style={{ flex: '1 0 200px' }}
          >
            <Input placeholder="Ví dụ: LT-001" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên tài sản"
            rules={[{ required: true, message: 'Vui lòng nhập tên tài sản!' }]}
            style={{ flex: '1 0 200px' }}
          >
            <Input placeholder="Ví dụ: Dell XPS 13" />
          </Form.Item>
          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
            style={{ flex: '1 0 200px' }}
          >
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
            rules={[{ type: 'number', min: 0, message: 'Giá mua phải là số không âm!' }]}
          >
            <InputNumber
              placeholder="Ví dụ: 25000000"
              style={{ width: '100%' }}
              formatter={(value) => (value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
              parser={(value) => (value ? value.replace(/\$\s?|(,*)/g, '') : '')}
            />
          </Form.Item>
          <Form.Item
            name="hasSerialNumbers"
            valuePropName="checked"
            style={{ flex: '1 0 100%' }}
          >
            <Checkbox onChange={handleCheckboxChange}>Có số serial</Checkbox>
          </Form.Item>
          {hasSerialNumbers ? (
            <Form.Item
              name="serialNumbers"
              label="Danh sách số serial (mỗi dòng một serial)"
              style={{ flex: '1 0 100%' }}
              rules={[{ required: true, message: 'Vui lòng nhập ít nhất một số serial!' }]}
            >
              <Input.TextArea
                placeholder="Ví dụ:\nSN001\nSN002\nSN003"
                rows={4}
                onChange={handleSerialNumbersChange}
                style={{ whiteSpace: 'pre-wrap', resize: 'vertical' }}
                autoSize={{ minRows: 4, maxRows: 8 }}
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="quantity"
              label="Số lượng"
              style={{ flex: '1 0 200px' }}
              rules={[
                { required: true, message: 'Vui lòng nhập số lượng!' },
                { type: 'number', min: 1, message: 'Số lượng phải là số nguyên dương!' },
              ]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          )}
        </div>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
            <Button onClick={handleCancel}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AssetAdd;