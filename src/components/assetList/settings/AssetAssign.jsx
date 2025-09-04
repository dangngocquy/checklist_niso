import React, { useState } from 'react';
import { Modal, Form, Select, Button, Space, Table, InputNumber, Spin, Empty, Badge, Tooltip, Typography, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Text } = Typography;

const AssetAssign = ({
  isAssignModalVisible,
  handleCancel,
  selectedAsset,
  assignForm,
  handleAssignSubmit,
  fetchUsers,
  userOptions,
  userSearchLoading,
  handleUserSelect,
  availableSerialNumbers,
  serialNumberColumns,
}) => {
  const hasSerialNumbers = selectedAsset?.serialNumbers?.length > 0;
  const [selectedSerialNumber, setSelectedSerialNumber] = useState(null);
  const [serialSearchText, setSerialSearchText] = useState('');
  const [filteredSerialNumbers, setFilteredSerialNumbers] = useState([]);

  // Filter serial numbers based on search text
  React.useEffect(() => {
    if (!serialSearchText) {
      setFilteredSerialNumbers(availableSerialNumbers);
    } else {
      const filtered = availableSerialNumbers.filter(item => {
        return typeof item.serialNumber === 'string' && item.serialNumber.toLowerCase().includes(serialSearchText.toLowerCase());
      });
      setFilteredSerialNumbers(filtered);
    }
  }, [serialSearchText, availableSerialNumbers]);

  // Custom radio selection for Table
  const rowSelection = {
    type: 'radio',
    onChange: (selectedRowKeys) => {
      const serialNumber = selectedRowKeys[0];
      setSelectedSerialNumber(serialNumber);
      assignForm.setFieldsValue({ serialNumbers: [serialNumber] });
    },
    selectedRowKeys: selectedSerialNumber ? [selectedSerialNumber] : [],
  };

  // Enhanced columns with status badges
  const enhancedSerialNumberColumns = serialNumberColumns.map(column => {
    if (column.dataIndex === 'status') {
      return {
        ...column,
        render: (status) => {
          let color = 'green';
          let text = 'Khả dụng';

          if (status === 'assigned') {
            color = 'red';
            text = 'Đã cấp phát';
          } else if (status === 'maintenance') {
            color = 'orange';
            text = 'Đang bảo trì';
          }

          return <Badge status={color} text={text} />;
        }
      };
    }
    return column;
  });

  const titleStyle = {
    display: 'flex',
    alignItems: 'center',
  };

  const labelStyle = {
    fontWeight: 500,
  };

  const labelContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    gap: 5
  };

  const tableContainerStyle = {
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    overflow: 'hidden',
  };

  const searchContainerStyle = {
    padding: '12px',
    borderBottom: '1px solid #d9d9d9',
  };

  const formItemStyle = {
    marginTop: '24px',
  };

  const footerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
  };

  return (
    <Modal
      title={
        <div style={titleStyle}>
          <span style={{ fontSize: '16px', fontWeight: 600 }}>Cấp phát tài sản</span>
          {selectedAsset && (
            <Tooltip title="Mã tài sản">
              <Text type="secondary" style={{ marginLeft: '8px' }}>{`(${selectedAsset.assetTag || ''})`}</Text>
            </Tooltip>
          )}
        </div>
      }
      open={isAssignModalVisible}
      onCancel={handleCancel}
      footer={null}
      width={650}
    >
      <Form form={assignForm} layout="vertical" onFinish={handleAssignSubmit} style={{ marginTop: '16px' }}>
        <Form.Item
          name="assignedTo"
          label={<span style={labelStyle}>Người nhận</span>}
          rules={[{ required: true, message: 'Vui lòng chọn người nhận!' }]}
        >
          <Select
            showSearch
            placeholder="Tìm kiếm người dùng"
            filterOption={false}
            onSearch={fetchUsers}
            onSelect={handleUserSelect}
            options={userOptions}
            loading={userSearchLoading}
            notFoundContent={userSearchLoading ? <Spin size="small" /> : null}
            style={{ width: '100%' }}
          />
        </Form.Item>

        {hasSerialNumbers ? (
          <Form.Item
            name="serialNumbers"
            label={
              <div style={labelContainerStyle}>
                <span style={labelStyle}>Số serial khả dụng</span>
                <Badge
                  count={availableSerialNumbers.length}
                  showZero
                  style={{ backgroundColor: availableSerialNumbers.length > 0 ? '#52c41a' : '#d9d9d9' }}
                />
              </div>
            }
            rules={[{ required: true, message: 'Vui lòng chọn một số serial!' }]}
          >
            <div style={tableContainerStyle}>
              <div style={searchContainerStyle}>
                <Input
                  placeholder="Tìm kiếm số serial..."
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                  value={serialSearchText}
                  onChange={e => setSerialSearchText(e.target.value)}
                  allowClear
                  style={{ width: '100%' }}
                />
              </div>
              <Table
                rowSelection={rowSelection}
                columns={enhancedSerialNumberColumns}
                dataSource={filteredSerialNumbers}
                size="small"
                pagination={{
                  pageSize: 5,
                  showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`
                }}
                locale={{
                  emptyText: <Empty
                    description={serialSearchText ? "Không tìm thấy số serial phù hợp" : "Không có số serial khả dụng"}
                  />
                }}
                onRow={(record) => ({
                  onClick: () => {
                    setSelectedSerialNumber(record.key);
                    assignForm.setFieldsValue({ serialNumbers: [record.key] });
                  },
                  style: { cursor: 'pointer' }
                })}
              />
            </div>
          </Form.Item>
        ) : (
          <Form.Item
            name="quantityToAssign"
            label={
              <div style={labelContainerStyle}>
                <span style={labelStyle}>Số lượng cấp phát</span>
                <Badge
                  count={`Còn lại: ${selectedAsset?.quantity || 0}`}
                  style={{ backgroundColor: '#108ee9' }}
                />
              </div>
            }
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng!' },
              { type: 'number', min: 1, message: 'Số lượng phải là số nguyên dương!' },
              {
                validator: (_, value) =>
                  value <= selectedAsset?.quantity
                    ? Promise.resolve()
                    : Promise.reject(new Error('Số lượng cấp phát không được vượt quá số lượng khả dụng!')),
              },
            ]}
          >
            <InputNumber
              min={1}
              max={selectedAsset?.quantity}
              style={{ width: '100%', height: '40px' }}
            />
          </Form.Item>
        )}

        <Form.Item style={formItemStyle}>
          <Space style={footerStyle}>
            <Button onClick={handleCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit">Cấp phát</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AssetAssign;