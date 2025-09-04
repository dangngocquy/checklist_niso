import React, { useState } from 'react';
import {
  Form,
  Select,
  Switch,
  Avatar,
  Spin,
  Space,
  Row,
  Col,
  Tag,
  Card,
  Typography,
  Radio,
  Tooltip,
  Tabs,
  Divider,
  Badge,
  Button,
  Alert,
  theme
} from 'antd';
import {
  GlobalOutlined,
  TeamOutlined,
  LockOutlined,
  UserOutlined,
  ApartmentOutlined,
  ShopOutlined,
  KeyOutlined,
  EyeOutlined,
  SettingOutlined,
  DatabaseOutlined,
  PictureOutlined,
  NumberOutlined,
  ReloadOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  ToolOutlined
} from '@ant-design/icons';
import Avatars from '../../../config/design/Avatars';
import useApi from '../../../hook/useApi';
import debounce from 'lodash/debounce';
import UserInfoCard from '../../../hook/UserInfoCard';

const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const SettingCreate = ({
  handleSubmit,
  form,
  dataUser = [],
  handleEveryquyenChange,
  bophanData = [],
  t,
  setKhachEnabled,
  setSQLEnabled,
  setDemEnabled,
  setCuahang,
  setXulyEnabled,
  handleUserSearch,
  handleDeptSearch,
  setllEnabled,
  setthreeimg,
  setUsersview,
  setDepartmentsview,
  setRestaurantsview,
  setViewDapanEnabled,
}) => {
  const { token } = theme.useToken();
  const { branchApi } = useApi();

  const [filteredBophanOptions, setFilteredBophanOptions] = useState([]);
  const [filteredUserOptions, setFilteredUserOptions] = useState([]);
  const [filteredBranchOptions, setFilteredBranchOptions] = useState([]);
  const [loadingBophan, setLoadingBophan] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [isLaplaiEnabled, setIsLaplaiEnabled] = useState(false);
  const [everyquyenValue, setEveryquyenValue] = useState('Nội bộ');
  const [activeSettingsTab, setActiveSettingsTab] = useState('access');

  const userOptions = dataUser.map((item) => ({
    value: item.keys || item,
    label: item.name || item.username || item.keys || item || 'Unknown',
    avatar: item.imgAvatar,
    username: item.username,
    name: item.name,
  }));

  const handleSearch = React.useCallback(
    (type) =>
      debounce(async (value) => {
        if (!value || value.trim() === '') {
          if (type === 'bophan') setFilteredBophanOptions([]);
          else if (type === 'user') setFilteredUserOptions([]);
          else if (type === 'branch') setFilteredBranchOptions([]);
          if (type === 'bophan') setLoadingBophan(false);
          else if (type === 'user') setLoadingUsers(false);
          else if (type === 'branch') setLoadingBranches(false);
          return;
        }

        if (type === 'bophan') setLoadingBophan(true);
        else if (type === 'user') setLoadingUsers(true);
        else if (type === 'branch') setLoadingBranches(true);

        try {
          if (type === 'bophan' && handleDeptSearch) {
            const filteredData = await handleDeptSearch(value);
            setFilteredBophanOptions(filteredData);
          } else if (type === 'user' && handleUserSearch) {
            await handleUserSearch(value);
            setFilteredUserOptions(
              userOptions.filter((option) =>
                option.label.toLowerCase().includes(value.toLowerCase())
              )
            );
          } else if (type === 'branch') {
            const response = await branchApi.searchChinhanh(value, 1, 10);
            const options = (response.data || []).map((item) => ({
              value: item.restaurant,
              label: item.restaurant,
            }));
            setFilteredBranchOptions(options);
          }
        } catch (error) {
          console.error(`Error searching ${type}:`, error);
          if (type === 'bophan') setFilteredBophanOptions([]);
          else if (type === 'user') setFilteredUserOptions([]);
          else if (type === 'branch') setFilteredBranchOptions([]);
        } finally {
          if (type === 'bophan') setLoadingBophan(false);
          else if (type === 'user') setLoadingUsers(false);
          else if (type === 'branch') setLoadingBranches(false);
        }
      }, 300),
    [userOptions, handleDeptSearch, handleUserSearch, branchApi]
  );

  const handleCuahangChange = (values) => {
    setCuahang(values);
    form.setFieldsValue({ cuahang: values });
  };

  const handleUsersviewChange = (values) => {
    setUsersview(values);
    form.setFieldsValue({ usersview: values });
  };

  const handleDepartmentsviewChange = (values) => {
    setDepartmentsview(values);
    form.setFieldsValue({ departmentsview: values });
  };

  const handleRestaurantsviewChange = (values) => {
    setRestaurantsview(values);
    form.setFieldsValue({ restaurantsview: values });
  };

  const handleLaplaiChange = (checked) => {
    setIsLaplaiEnabled(checked);
    setllEnabled(checked);
    form.setFieldsValue({ solanlaplai: checked });

    if (!checked) {
      setthreeimg(false);
      form.setFieldsValue({ threeimg: false });
    }
  };

  const handleEveryquyenRadioChange = (e) => {
    const value = e.target.value;
    setEveryquyenValue(value);
    handleEveryquyenChange(value);
    form.setFieldsValue({ everyquyen: value });

    if (value === 'Công khai' || value === 'Riêng tư') {
      form.setFieldsValue({
        bophanADS: [],
        cuahang: [],
        account: [],
        usersview: [],
        departmentsview: [],
        restaurantsview: [],
      });
      setCuahang([]);
      setUsersview([]);
      setDepartmentsview([]);
      setRestaurantsview([]);
    }
  };

  const onFinish = (values) => {
    handleSubmit(values);
  };

  const renderUserOption = (user) => {
    const matchedUser = dataUser.find(
      (item) => item.keys === user.value || item.username === user.username || item.name === user.name
    );

    const userForCard = {
      name: user.name || matchedUser?.name || user.label || 'Unknown User',
      username: user.username || matchedUser?.username || 'N/A',
      imgAvatar: user.avatar || matchedUser?.imgAvatar || null,
      keys: user.value || matchedUser?.keys || 'N/A',
      email: matchedUser?.email || null,
      chucvu: matchedUser?.chucvu || null,
      chinhanh: matchedUser?.chinhanh || 'N/A',
      bophan: matchedUser?.bophan || 'N/A',
      locker: matchedUser?.locker || false,
      imgBackground: matchedUser?.imgBackground || null,
    };

    return (
      <Space>
        <Tooltip
          title={<UserInfoCard user={userForCard} />}
          placement={window.innerWidth < 768 ? 'top' : 'right'}
          color="white"
          overlayStyle={{ maxWidth: 300 }}
          trigger="hover"
          mouseEnterDelay={0.1}
          mouseLeaveDelay={0.2}
        >
          <span className="avatar-container" style={{ display: 'inline-block', cursor: 'pointer' }}>
            {user.avatar && user.avatar !== 'null' ? (
              <Avatar
                src={user.avatar}
                size="small"
                style={{ marginRight: 8, pointerEvents: 'auto' }}
              />
            ) : (
              <span style={{ marginRight: 8, pointerEvents: 'auto' }}>
                <Avatars user={{ name: user.label || 'Unknown' }} sizeImg="small" />
              </span>
            )}
          </span>
        </Tooltip>
        {user.label}
      </Space>
    );
  };

  const renderLoadingOption = () => (
    <Option disabled>
      <Space>
        <Spin size="small" />
        <span>Loading...</span>
      </Space>
    </Option>
  );

  const isDisabled = everyquyenValue === 'Công khai' || everyquyenValue === 'Riêng tư';
  const isViewDisabled = false;

  const permissionOptions = [
    {
      value: 'Công khai',
      icon: <GlobalOutlined />,
      color: '#52c41a',
      title: 'Công khai',
      description: 'Tất cả mọi người có thể thấy và truy cập',
      tag: 'success'
    },
    {
      value: 'Nội bộ',
      icon: <TeamOutlined />,
      color: '#1890ff',
      title: 'Nội bộ',
      description: 'Chỉ người được phân quyền mới truy cập được',
      tag: 'processing'
    },
    {
      value: 'Riêng tư',
      icon: <LockOutlined />,
      color: '#f5222d',
      title: 'Riêng tư',
      description: 'Chỉ mình bạn mới thấy được',
      tag: 'error'
    }
  ];

  const displayOptions = [
    {
      key: 'khach',
      label: 'Hiển thị danh sách nhà hàng',
      description: 'Cho phép hiển thị danh sách các nhà hàng trong checklist',
      icon: <ShopOutlined />,
      color: '#1890ff',
      onChange: (checked) => {
        setKhachEnabled(checked);
        form.setFieldsValue({ khach: checked });
      }
    },
    {
      key: 'demcauhoi',
      label: 'Đếm thứ tự các câu hỏi',
      description: 'Hiển thị số thứ tự cho từng câu hỏi trong checklist',
      icon: <NumberOutlined />,
      color: '#722ed1',
      onChange: (checked) => {
        setDemEnabled(checked);
        form.setFieldsValue({ demcauhoi: checked });
      }
    },
    {
      key: 'yeucauxuly',
      label: 'Hiện nút nhận xử lý cho câu trả lời sai',
      description: 'Cho phép người dùng nhận xử lý khi câu trả lời không đúng',
      icon: <ToolOutlined />,
      color: '#fa8c16',
      onChange: (checked) => {
        setXulyEnabled(checked);
        form.setFieldsValue({ yeucauxuly: checked });
      }
    },
    {
      key: 'solanlaplai',
      label: 'Hiển thị số lần lặp lại cho các câu hỏi',
      description: 'Cho phép theo dõi số lần thực hiện lại câu hỏi',
      icon: <ReloadOutlined />,
      color: '#13c2c2',
      onChange: handleLaplaiChange
    },
    {
      key: 'sqlsend',
      label: 'Cho phép gửi dữ liệu lên SQL Server',
      description: 'Tự động đồng bộ dữ liệu với cơ sở dữ liệu',
      icon: <DatabaseOutlined />,
      color: '#ae8f3d',
      defaultValue: true,
      onChange: (checked) => {
        setSQLEnabled(checked);
        form.setFieldsValue({ sqlsend: checked });
      }
    },
    {
      key: 'DapanView',
      label: 'Cho phép xem đáp án chính xác',
      description: 'Hiển thị đáp án đúng cho người dùng (nếu có)',
      icon: <CheckCircleOutlined />,
      color: '#eb2f96',
      onChange: (checked) => {
        setViewDapanEnabled(checked);
        form.setFieldsValue({ DapanView: checked });
      }
    }
  ];

  return (
    <div>
      <Form form={form} onFinish={onFinish} layout="vertical">
        {/* Header */}
        <Card
          style={{
            marginBottom: 24,
            background: `linear-gradient(135deg, ${token.colorPrimary}15 0%, ${token.colorPrimary}08 100%)`,
            border: `1px solid ${token.colorPrimary}30`
          }}
          bodyStyle={{ padding: '24px 32px' }}
        >
          <Row align="middle" gutter={16}>
            <Col flex={1}>
              <Title level={4} style={{ margin: 0, color: token.colorTextHeading }}>
                Cài đặt Checklist
              </Title>
              <Text type="secondary">
                Thiết lập quyền truy cập và tùy chọn hiển thị cho checklist của bạn
              </Text>
            </Col>
          </Row>
        </Card>

        {/* Main Content */}
        <Card
          bordered={false}
          style={{
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            borderRadius: 12
          }}
        >
          <Tabs
            activeKey={activeSettingsTab}
            onChange={setActiveSettingsTab}
            type="card"
            size='small'
            animated
          >
            {/* Access Settings Tab */}
            <TabPane
              tab={
                <Space size={8}>
                  <KeyOutlined style={{ color: token.colorPrimary }} />
                  <span>Cài đặt quyền truy cập</span>
                  <Badge count={3} size="middle" />
                </Space>
              }
              key="access"
            >
              <div style={{ padding: '0 8px' }}>
                {/* Permission Level */}
                <Card
                  size="small"
                  title={
                    <Space>
                      <SafetyOutlined style={{ color: token.colorPrimary }} />
                      <span>Mức độ quyền truy cập</span>
                    </Space>
                  }
                  style={{ marginBottom: 24 }}
                  headStyle={{ backgroundColor: token.colorFillAlter }}
                >
                  <Form.Item
                    name="everyquyen"
                    label={t('ListDocs.input20')}
                    initialValue="Nội bộ"
                    rules={[{ required: true, message: t('Department.input228') }]}
                  >
                    <Radio.Group
                      onChange={handleEveryquyenRadioChange}
                      buttonStyle="solid"
                      className="w-full"
                    >
                      {permissionOptions.map((option) => (
                        <Tooltip
                          key={option.value}
                          title={option.description}
                        >
                          <Radio.Button value={option.value}>
                            <Space>
                              {option.icon}
                              {option.title}
                            </Space>
                          </Radio.Button>
                        </Tooltip>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                </Card>

                {/* Access Assignment */}
                {!isDisabled && (
                  <Alert
                    message="Lưu ý"
                    description="Vui lòng chọn các đối tượng được phép truy cập vào checklist này"
                    type="info"
                    showIcon
                    banner
                    style={{ marginBottom: 24 }}
                  />
                )}

                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={12}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <ApartmentOutlined style={{ color: '#722ed1' }} />
                          <span>Phòng ban / Khối</span>
                        </Space>
                      }
                      headStyle={{ backgroundColor: token.colorFillAlter }}
                    >
                      <Form.Item name="bophanADS">
                        <Select
                          mode="multiple"
                          notFoundContent={loadingBophan ? <Spin size="small" /> : null}
                          allowClear
                          showSearch
                          placeholder="Chọn khối / phòng ban"
                          style={{ textTransform: 'uppercase', width: '100%' }}
                          onSearch={handleSearch('bophan')}
                          filterOption={false}
                          onDropdownVisibleChange={(open) => {
                            if (open) setFilteredBophanOptions([]);
                            if (!open) setLoadingBophan(false);
                          }}
                          disabled={isDisabled}
                          tagRender={(props) => (
                            <Tag
                              color="purple"
                              closable={props.closable}
                              onClose={props.onClose}
                              style={{
                                marginRight: 4,
                                borderRadius: 6,
                                padding: '2px 8px'
                              }}
                            >
                              {props.label}
                            </Tag>
                          )}
                        >
                          {filteredBophanOptions.map((dept) => (
                            <Option key={dept.value} value={dept.value.toUpperCase()}>
                              <Space>
                                <ApartmentOutlined />
                                {dept.label.toUpperCase()}
                              </Space>
                            </Option>
                          ))}
                          {loadingBophan && renderLoadingOption()}
                        </Select>
                      </Form.Item>
                    </Card>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <UserOutlined style={{ color: '#1890ff' }} />
                          <span>Người dùng cụ thể</span>
                        </Space>
                      }
                      headStyle={{ backgroundColor: token.colorFillAlter }}
                    >
                      <Form.Item name="account">
                        <Select
                          mode="multiple"
                          allowClear
                          notFoundContent={null}
                          showSearch
                          placeholder="Chọn người dùng"
                          style={{ width: '100%' }}
                          onSearch={handleSearch('user')}
                          filterOption={false}
                          onDropdownVisibleChange={(open) => {
                            if (!open) setLoadingUsers(false);
                          }}
                          disabled={isDisabled}
                          tagRender={(props) => (
                            <Tag
                              color="blue"
                              closable={props.closable}
                              onClose={props.onClose}
                              style={{
                                marginRight: 4,
                                borderRadius: 6,
                                padding: '2px 8px'
                              }}
                            >
                              {props.label}
                            </Tag>
                          )}
                        >
                          {filteredUserOptions.map((user) => (
                            <Option key={user.value} value={user.value}>
                              {renderUserOption(user)}
                            </Option>
                          ))}
                          {loadingUsers && renderLoadingOption()}
                        </Select>
                      </Form.Item>
                    </Card>
                  </Col>

                  <Col xs={24}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <ShopOutlined style={{ color: '#13c2c2' }} />
                          <span>Nhà hàng</span>
                        </Space>
                      }
                      headStyle={{ backgroundColor: token.colorFillAlter }}
                    >
                      <Form.Item name="cuahang">
                        <Select
                          mode="multiple"
                          allowClear
                          notFoundContent={null}
                          showSearch
                          placeholder="Chọn nhà hàng"
                          style={{ width: '100%' }}
                          onSearch={handleSearch('branch')}
                          onChange={handleCuahangChange}
                          filterOption={false}
                          onDropdownVisibleChange={(open) => {
                            if (!open) setLoadingBranches(false);
                          }}
                          value={form.getFieldValue('cuahang')}
                          disabled={isDisabled}
                          tagRender={(props) => (
                            <Tag
                              color="cyan"
                              closable={props.closable}
                              onClose={props.onClose}
                              style={{
                                marginRight: 4,
                                borderRadius: 6,
                                padding: '2px 8px'
                              }}
                            >
                              {props.label}
                            </Tag>
                          )}
                        >
                          {filteredBranchOptions.map((restaurant) => (
                            <Option key={restaurant.value} value={restaurant.value}>
                              <Space>
                                <ShopOutlined />
                                {restaurant.label}
                              </Space>
                            </Option>
                          ))}
                          {loadingBranches && renderLoadingOption()}
                        </Select>
                      </Form.Item>
                    </Card>
                  </Col>
                </Row>
              </div>
            </TabPane>

            {/* View Settings Tab */}
            <TabPane
              tab={
                <Space size={8}>
                  <EyeOutlined style={{ color: token.colorPrimary }} />
                  <span>Cài đặt quyền xem</span>
                  <Badge count={3} size="middle" />
                </Space>
              }
              key="view"
            >
              <div style={{ padding: '0 8px' }}>
                <Alert
                  message="Chỉ định người xem phiếu"
                  description="Thiết lập ai có thể xem các phiếu được tạo từ checklist này"
                  type="info"
                  showIcon
                  banner
                  style={{ marginBottom: 24 }}
                />

                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={8}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <UserOutlined style={{ color: '#1890ff' }} />
                          <span>Người xem phiếu</span>
                        </Space>
                      }
                      headStyle={{ backgroundColor: token.colorFillAlter }}
                    >
                      <Form.Item name="usersview">
                        <Select
                          mode="multiple"
                          allowClear
                          notFoundContent={null}
                          showSearch
                          placeholder="Chọn người được xem phiếu"
                          style={{ width: '100%' }}
                          onSearch={handleSearch('user')}
                          onChange={handleUsersviewChange}
                          filterOption={false}
                          onDropdownVisibleChange={(open) => {
                            if (!open) setLoadingUsers(false);
                          }}
                          disabled={isViewDisabled}
                          tagRender={(props) => (
                            <Tag
                              color="blue"
                              closable={props.closable}
                              onClose={props.onClose}
                              style={{
                                marginRight: 4,
                                borderRadius: 6,
                                padding: '2px 8px'
                              }}
                            >
                              {props.label}
                            </Tag>
                          )}
                        >
                          {filteredUserOptions.map((user) => (
                            <Option key={user.value} value={user.value}>
                              {renderUserOption(user)}
                            </Option>
                          ))}
                          {loadingUsers && renderLoadingOption()}
                        </Select>
                      </Form.Item>
                    </Card>
                  </Col>

                  <Col xs={24} lg={8}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <ApartmentOutlined style={{ color: '#722ed1' }} />
                          <span>Phòng ban xem phiếu</span>
                        </Space>
                      }
                      headStyle={{ backgroundColor: token.colorFillAlter }}
                    >
                      <Form.Item name="departmentsview">
                        <Select
                          mode="multiple"
                          notFoundContent={loadingBophan ? <Spin size="small" /> : null}
                          allowClear
                          showSearch
                          placeholder="Chọn phòng ban"
                          style={{ width: '100%', textTransform: 'uppercase' }}
                          onSearch={handleSearch('bophan')}
                          onChange={handleDepartmentsviewChange}
                          filterOption={false}
                          onDropdownVisibleChange={(open) => {
                            if (open) setFilteredBophanOptions([]);
                            if (!open) setLoadingBophan(false);
                          }}
                          disabled={isViewDisabled}
                          tagRender={(props) => (
                            <Tag
                              color="purple"
                              closable={props.closable}
                              onClose={props.onClose}
                              style={{
                                marginRight: 4,
                                borderRadius: 6,
                                padding: '2px 8px'
                              }}
                            >
                              {props.label}
                            </Tag>
                          )}
                        >
                          {filteredBophanOptions.map((dept) => (
                            <Option key={dept.value} value={dept.value.toUpperCase()}>
                              <Space>
                                <ApartmentOutlined />
                                {dept.label.toUpperCase()}
                              </Space>
                            </Option>
                          ))}
                          {loadingBophan && renderLoadingOption()}
                        </Select>
                      </Form.Item>
                    </Card>
                  </Col>

                  <Col xs={24} lg={8}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <ShopOutlined style={{ color: '#13c2c2' }} />
                          <span>Nhà hàng xem phiếu</span>
                        </Space>
                      }
                      headStyle={{ backgroundColor: token.colorFillAlter }}
                    >
                      <Form.Item name="restaurantsview">
                        <Select
                          mode="multiple"
                          allowClear
                          notFoundContent={null}
                          showSearch
                          placeholder="Chọn nhà hàng"
                          style={{ width: '100%' }}
                          onSearch={handleSearch('branch')}
                          onChange={handleRestaurantsviewChange}
                          filterOption={false}
                          onDropdownVisibleChange={(open) => {
                            if (!open) setLoadingBranches(false);
                          }}
                          disabled={isViewDisabled}
                          tagRender={(props) => (
                            <Tag
                              color="cyan"
                              closable={props.closable}
                              onClose={props.onClose}
                              style={{
                                marginRight: 4,
                                borderRadius: 6,
                                padding: '2px 8px'
                              }}
                            >
                              {props.label}
                            </Tag>
                          )}
                        >
                          {filteredBranchOptions.map((restaurant) => (
                            <Option key={restaurant.value} value={restaurant.value}>
                              <Space>
                                <ShopOutlined />
                                {restaurant.label}
                              </Space>
                            </Option>
                          ))}
                          {loadingBranches && renderLoadingOption()}
                        </Select>
                      </Form.Item>
                    </Card>
                  </Col>
                </Row>
              </div>
            </TabPane>
          </Tabs>
        </Card>

        {/* Display Options */}
        <Card
          bordered={false}
          title={
            <Space size={12}>
              <Avatar
                size={32}
                icon={<SettingOutlined />}
                style={{ backgroundColor: token.colorPrimary }}
              />
              <div>
                <Title level={4} style={{ margin: 0 }}>Tùy chọn hiển thị</Title>
                <Text type="secondary">Cấu hình các tính năng hiển thị cho checklist</Text>
              </div>
            </Space>
          }
          style={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            borderRadius: 12
          }}
          headStyle={{
            backgroundColor: token.colorFillAlter,
            borderRadius: '12px 12px 0 0'
          }}
        >
          <Row gutter={[24, 24]}>
            {displayOptions.map((option, index) => (
              <Col xs={24} md={12} lg={8} key={option.key}>
                <Card
                  size="small"
                  hoverable
                  style={{
                    height: '100%',
                    border: `1px solid ${token.colorBorder}`,
                    borderRadius: 8,
                    transition: 'all 0.3s ease'
                  }}
                  bodyStyle={{ padding: '16px' }}
                >
                  <Row align="middle" justify="space-between">
                    <Col flex={1}>
                      <Space direction="vertical" size={4}>
                        <Space>
                          <Avatar
                            size={24}
                            icon={option.icon}
                            style={{
                              backgroundColor: `${option.color}20`,
                              color: option.color,
                              fontSize: 12
                            }}
                          />
                          <Text strong style={{ fontSize: 14 }}>
                            {index + 1}. {option.label}
                          </Text>
                        </Space>
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 12,
                            lineHeight: 1.4,
                            display: 'block'
                          }}
                        >
                          {option.description}
                        </Text>
                      </Space>
                    </Col>
                    <Col>
                      <Form.Item
                        name={option.key}
                        valuePropName="checked"
                        initialValue={option.defaultValue || false}
                        style={{ margin: 0 }}
                      >
                        <Switch
                          onChange={option.onChange}
                          style={{
                            backgroundColor: option.defaultValue ? option.color : undefined
                          }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}

            {/* Conditional Image Upload Option */}
            {isLaplaiEnabled && (
              <Col xs={24} md={12} lg={8}>
                <Card
                  size="small"
                  hoverable
                  style={{
                    height: '100%',
                    border: `2px dashed ${token.colorPrimary}`,
                    borderRadius: 8,
                    backgroundColor: `${token.colorPrimary}08`
                  }}
                  bodyStyle={{ padding: '16px' }}
                >
                  <Row align="middle" justify="space-between">
                    <Col flex={1}>
                      <Space direction="vertical" size={4}>
                        <Space>
                          <Avatar
                            size={24}
                            icon={<PictureOutlined />}
                            style={{
                              backgroundColor: `#fa8c1620`,
                              color: '#fa8c16',
                              fontSize: 12
                            }}
                          />
                          <Text strong style={{ fontSize: 14 }}>
                            <span style={{ color: token.colorPrimary }}>*</span> Cho phép tải ảnh lên
                          </Text>
                        </Space>
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 12,
                            lineHeight: 1.4,
                            display: 'block'
                          }}
                        >
                          Tối đa 3 ảnh cho mỗi câu trả lời (chỉ khi bật lặp lại)
                        </Text>
                      </Space>
                    </Col>
                    <Col>
                      <Form.Item
                        name="threeimg"
                        valuePropName="checked"
                        initialValue={false}
                        style={{ margin: 0 }}
                      >
                        <Switch
                          onChange={(checked) => {
                            setthreeimg(checked);
                            form.setFieldsValue({ threeimg: checked });
                          }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              </Col>
            )}
          </Row>

          <Divider style={{ margin: '24px 0' }} />

          {/* Summary Info */}
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Card
                size="small"
                style={{
                  backgroundColor: token.colorSuccessBg,
                  // border: `1px solid ${token.colorSuccessBorder}`
                }}
              >
                <Space>
                  <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 16 }} />
                  <div>
                    <Text strong style={{ color: token.colorSuccess }}>Trạng thái</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {everyquyenValue === 'Công khai' ? 'Công khai cho tất cả' :
                        everyquyenValue === 'Riêng tư' ? 'Chỉ riêng bạn' : 'Hạn chế truy cập'}
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                size="small"
                style={{
                  backgroundColor: token.colorInfoBg,
                  // border: `1px solid ${token.colorInfoBorder}`
                }}
              >
                <Space>
                  <SettingOutlined style={{ color: token.colorInfo, fontSize: 16 }} />
                  <div>
                    <Text strong style={{ color: token.colorInfo }}>Tùy chọn</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {displayOptions.filter(opt => form.getFieldValue(opt.key)).length} / {displayOptions.length} đã bật
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                size="small"
                style={{
                  backgroundColor: token.colorWarningBg,
                  // border: `1px solid ${token.colorWarningBorder}`
                }}
              >
                <Space>
                  <DatabaseOutlined style={{ color: token.colorWarning, fontSize: 16 }} />
                  <div>
                    <Text strong style={{ color: token.colorWarning }}>Đồng bộ</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {form.getFieldValue('sqlsend') ? 'Tự động lưu' : 'Không lưu DB'}
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* Action Buttons - Hidden form submit */}
        <Form.Item hidden>
          <Button type="primary" htmlType="submit" style={{ display: 'none' }} />
        </Form.Item>
      </Form>
    </div>
  );
};

export default SettingCreate;