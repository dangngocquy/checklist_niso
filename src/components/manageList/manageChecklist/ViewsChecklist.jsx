import React, { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Table, Button, Popconfirm, message, Space, Radio, DatePicker, Input, Row, Col, Select, Drawer, Form, Tag, Empty, Dropdown, Menu, Switch, Card, Avatar, Tooltip, Spin, Tabs, Badge
} from "antd";
import UserInfoCard from "../../../hook/UserInfoCard";
import {
  DeleteOutlined, CopyOutlined, FullscreenOutlined,
  EyeOutlined,
  SettingFilled,
  ToolFilled,
  PictureOutlined,
  ShopOutlined,
  CheckOutlined,
  UnlockOutlined,
  LockOutlined,
  GlobalOutlined,
  ControlOutlined,
  LinkOutlined,
  SaveOutlined,
  TeamOutlined,
  CloseOutlined,
  StopOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import moment from "moment";
import Docs from "../../lamphieu/Docs";
import Edit from "../../Edit/Edit";
import Avatars from "../../../config/design/Avatars";
import useApi from "../../../hook/useApi";
import useSearchDepartment from "../../../hook/SearchDepartment/useSearchDepartment";
import useSearchShop from "../../../hook/SearchShop/useSearchShop";
import ConfigPointsNangCao from "./ConfigPointsNangCao";
import { AlertPoint } from "./AlertPoint";

const { TabPane } = Tabs;

const ViewsChecklist = React.memo(({ user, t, hasCreatePermission, dlxlphPermission, hasEditPermission, hasPointPermission }) => {
  const {
    fetchChecklists, deleteChecklist, deleteMultipleChecklists, updateChecklist, searchShop, search
  } = useApi();

  const {
    loading: departmentLoading,
    options: departmentOptions,
    searchDepartments
  } = useSearchDepartment();

  const {
    options: chinhanhOptionsDrawer,
    loading: chinhanhLoadingDrawer,
    searchShops: searchShopsDrawer
  } = useSearchShop(searchShop);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [docDrawerVisible, setDocDrawerVisible] = useState(false);
  const [configPointsNangCaoDrawerVisible, setConfigPointsNangCaoDrawerVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [accountSearchLoading, setAccountSearchLoading] = useState(false);
  const [linkToCopy, setLinkToCopy] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [searchTitle, setSearchTitle] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [accountOptions, setAccountOptions] = useState([]);
  const [isLaplaiEnabled, setIsLaplaiEnabled] = useState(false);
  const [isPublicOrPrivate, setIsPublicOrPrivate] = useState(false);

  const [form] = Form.useForm();

  const statusOptions = useMemo(() => ["Tạm khóa", "Đang hoạt động"], []);

  const fetchData = useCallback(async (page = 1, filters = {}, customPageSize = pageSize) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: customPageSize,
        title: filters.title || undefined,
        status: filters.status || undefined,
        ...(filters.startDate && filters.endDate
          ? {
            startDate: filters.startDate,
            endDate: filters.endDate,
          }
          : {}),
        viewType: 'checklist',
        userKeys: user.keys,
      };
      const response = await fetchChecklists(page, customPageSize, params);
      setData(response.data || []);
      setTotalItems(response.totalItems || response.data.length);
      setCurrentPage(response.currentPage || page);
    } catch (err) {
      console.error("Error fetching data:", err);
      message.error("Không thể tải dữ liệu, vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [fetchChecklists, pageSize, user.keys]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  useEffect(() => {
    if (currentRecord) {
      form.setFieldsValue({
        title: currentRecord.title,
        cuahang: Array.isArray(currentRecord.cuahang) ? currentRecord.cuahang : [],
        bophanADS: Array.isArray(currentRecord.bophanADS) ? currentRecord.bophanADS : [],
        account: Array.isArray(currentRecord.account) ? currentRecord.account : [],
        usersview: Array.isArray(currentRecord.usersview) ? currentRecord.usersview : [],
        departmentsview: Array.isArray(currentRecord.departmentsview) ? currentRecord.departmentsview : [],
        restaurantsview: Array.isArray(currentRecord.restaurantsview) ? currentRecord.restaurantsview : [],
        everyquyen: currentRecord.everyquyen === true ? "Công khai" :
          currentRecord.everyquyen === false ? "Nội bộ" :
            currentRecord.everyquyen || "Riêng tư",
        locktitle: currentRecord.locktitle || false,
        dapanview: currentRecord.dapanview || false,
        khach: currentRecord.khach || false,
        sqlsend: typeof currentRecord.sqlsend === 'undefined' ? true : currentRecord.sqlsend,
        yeucauxuly: currentRecord.yeucauxuly || false,
        solanlaplai: currentRecord.solanlaplai || false,
        threeimg: currentRecord.threeimg || false,
      });
      setLinkToCopy(`${window.location.origin}/auth/docs/form/${currentRecord.id}`);
      setIsPublicOrPrivate(form.getFieldValue("everyquyen") === "Công khai" || form.getFieldValue("everyquyen") === "Riêng tư");
      setIsLaplaiEnabled(currentRecord.solanlaplai || false);

      const keysToFetch = [
        ...(Array.isArray(currentRecord.account) ? currentRecord.account : []),
        ...(Array.isArray(currentRecord.usersview) ? currentRecord.usersview : []),
      ].filter((key, index, self) => key && self.indexOf(key) === index);

      if (keysToFetch.length > 0) {
        const fetchAccountData = async () => {
          setAccountSearchLoading(true);
          try {
            const response = await search("", { keys: keysToFetch.join(',') });
            const filteredData = (response.data || []).map(user => ({
              keys: user.keys,
              name: user.name,
              username: user.username,
              bophan: user.bophan,
              chucvu: user.chucvu,
              chinhanh: user.chinhanh,
              imgAvatar: user.imgAvatar || null
            }));
            setAccountOptions(filteredData);
          } catch (error) {
            console.error("Error fetching account data:", error);
            message.error("Không thể tải dữ liệu tài khoản!");
          } finally {
            setAccountSearchLoading(false);
          }
        };
        fetchAccountData();
      }
    }
  }, [currentRecord, form, search]);

  const handleAccountSearch = useCallback(async (value) => {
    if (!value || value.trim() === "") {
      setAccountOptions([]);
      setAccountSearchLoading(false);
      return;
    }
    setAccountSearchLoading(true);
    try {
      const response = await search(value);
      const filteredData = (response.data || []).map(user => ({
        keys: user.keys,
        name: user.name,
        username: user.username,
        bophan: user.bophan,
        chucvu: user.chucvu,
        chinhanh: user.chinhanh,
        imgAvatar: user.imgAvatar || null
      }));
      setAccountOptions(filteredData);
    } catch (error) {
      console.error("Error fetching account search results:", error);
      message.error("Không thể tìm kiếm tài khoản!");
    } finally {
      setAccountSearchLoading(false);
    }
  }, [search]);

  const handleDepartmentSearch = useCallback(async (value) => {
    try {
      await searchDepartments(value);
    } catch (error) {
      message.error("Không thể tìm kiếm bộ phận!");
    }
  }, [searchDepartments]);

  const handleStatusChange = (value) => {
    setSearchStatus(value || "");
    setCurrentPage(1);
    const filters = {
      title: searchTitle,
      status: value || "",
      startDate: startDate && endDate ? moment(startDate).format("DD-MM-YYYY") : undefined,
      endDate: startDate && endDate ? moment(endDate).format("DD-MM-YYYY") : undefined,
    };
    fetchData(1, filters);
  };

  const handleStartDateChange = (date) => {
    const newStartDate = date ? date.startOf("day").toDate() : null;
    setStartDate(newStartDate);
    setCurrentPage(1);
    const filters = {
      title: searchTitle,
      status: searchStatus,
      startDate: newStartDate && endDate ? moment(newStartDate).format("DD-MM-YYYY") : undefined,
      endDate: startDate && endDate ? moment(endDate).format("DD-MM-YYYY") : undefined,
    };
    fetchData(1, filters);
  };

  const handleEndDateChange = (date) => {
    const newEndDate = date ? date.endOf("day").toDate() : null;
    setEndDate(newEndDate);
    setCurrentPage(1);
    const filters = {
      title: searchTitle,
      status: searchStatus,
      startDate: startDate && newEndDate ? moment(startDate).format("DD-MM-YYYY") : undefined,
      endDate: startDate && newEndDate ? moment(newEndDate).format("DD-MM-YYYY") : undefined,
    };
    fetchData(1, filters);
  };

  const disabledStartDate = (current) => {
    if (!endDate) return false;
    return current && current > moment(endDate).endOf("day");
  };

  const disabledEndDate = (current) => {
    if (!startDate) return false;
    return current && current < moment(startDate).startOf("day");
  };

  const handleSearch = useCallback((value) => {
    setSearchTitle(value || "");
    setCurrentPage(1);
    const filters = {
      title: value || "",
      status: searchStatus,
      startDate: startDate && endDate ? moment(startDate).format("DD-MM-YYYY") : undefined,
      endDate: startDate && endDate ? moment(endDate).format("DD-MM-YYYY") : undefined,
    };
    fetchData(1, filters);
  }, [fetchData, searchStatus, startDate, endDate]);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteChecklist(id);
      message.success("Xóa checklist thành công.");
      fetchData(currentPage);
    } catch (err) {
      message.error("Lỗi khi xóa checklist!");
    }
  }, [deleteChecklist, currentPage, fetchData]);

  const handleDeleteSelected = useCallback(async () => {
    if (!selectedRowKeys.length) {
      message.error("Chưa chọn checklist nào để xóa!");
      return;
    }
    try {
      const response = await deleteMultipleChecklists(selectedRowKeys);
      const deletedCount = response.deletedCount || selectedRowKeys.length;
      setSelectedRowKeys([]);
      await fetchData(currentPage);
      message.success(`Xóa thành công ${deletedCount} mục.`);
    } catch (err) {
      message.error(err.message || "Xóa thất bại, vui lòng thử lại!");
    }
  }, [selectedRowKeys, currentPage, deleteMultipleChecklists, fetchData]);

  const handleDrawerOpen = useCallback((record) => {
    setCurrentRecord(record);
    setDrawerVisible(true);
  }, []);

  const handleEditDrawerOpen = useCallback((record) => {
    setCurrentRecord(record);
    setEditDrawerVisible(true);
    window.history.pushState({}, '', `/auth/docs/list/tat-ca-check-list?edit=${record.id}`);
  }, []);

  const handleDocDrawerOpen = useCallback((id) => {
    setSelectedDocId(id);
    setDocDrawerVisible(true);
    window.history.pushState({}, '', `/auth/docs/list/danh-sach-check-list?checklist=${id}`);
  }, []);

  const handleConfigPointsNangCaoDrawerOpen = useCallback((record) => {
    if (record.solanlaplai !== true) {
      message.warning("Cần bật 'Hiển thị số lần lặp lại' để cấu hình điểm!");
      return;
    }
    setCurrentRecord(record);
    setConfigPointsNangCaoDrawerVisible(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerVisible(false);
    setCurrentRecord(null);
    form.resetFields();
    setIsPublicOrPrivate(false);
  }, [form]);

  const handleEditDrawerClose = useCallback(() => {
    setEditDrawerVisible(false);
    setCurrentRecord(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('edit');
    window.history.pushState({}, '', url);
  }, []);

  const handleDocDrawerClose = useCallback(() => {
    setDocDrawerVisible(false);
    setSelectedDocId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('checklist');
    window.history.pushState({}, '', url);
  }, []);

  const handleConfigPointsNangCaoDrawerClose = useCallback(() => {
    setConfigPointsNangCaoDrawerVisible(false);
  }, []);

  const handleConfigNangCaoSave = useCallback((savedData, closeDrawer = false) => {
    if (currentRecord) {
      setCurrentRecord((prevRecord) => ({
        ...prevRecord,
        pointConfig: savedData.pointConfig || prevRecord.pointConfig,
        pointConfigNangCao: savedData.pointConfigNangCao || prevRecord.pointConfigNangCao,
        Cauhinhdiem: savedData.Cauhinhdiem !== undefined ? savedData.Cauhinhdiem : prevRecord.Cauhinhdiem,
      }));
    }
    if (closeDrawer) {
      setConfigPointsNangCaoDrawerVisible(false);
    }
    fetchData(currentPage);
  }, [currentRecord, fetchData, currentPage]);

  const handleSave = useCallback(async (values) => {
    try {
      const updatedValues = {
        ...values,
        everyquyen: values.everyquyen,
        locktitle: values.locktitle,
        dapanview: values.dapanview,
        khach: values.khach,
        solanlaplai: values.solanlaplai,
        threeimg: values.threeimg,
        yeucauxuly: values.yeucauxuly,
        sqlsend: values.sqlsend,
        phongban: values.bophanADS?.[0] || null,
        usersview: values.usersview,
        departmentsview: values.departmentsview,
        restaurantsview: values.restaurantsview,
      };
      await updateChecklist(currentRecord.id, updatedValues);
      message.success("Đã áp dụng thay đổi.");
      handleDrawerClose();
      fetchData(currentPage);
    } catch (err) {
      message.warning(t("Department.input240"));
    }
  }, [currentRecord?.id, t, updateChecklist, fetchData, currentPage, handleDrawerClose]);

  const columns = useMemo(() => [
    { title: t("Input.input7"), key: "stt", render: (_, __, index) => (currentPage - 1) * pageSize + index + 1 },
    { title: t("ListDocs.input15"), dataIndex: "title", key: "title" },
    { title: t("Department.input241"), dataIndex: "date", key: "date" },
    {
      title: t("Department.input242"),
      key: "ngaychinhsua",
      render: (_, record) => record.ngaychinhsua ? (
        record.ngaychinhsua
      ) : (
        <Tag color="red" bordered={false}>{t("ListEdits.input3")}</Tag>
      ),
    },
    {
      title: "Tổng số câu hỏi",
      dataIndex: "questionCount",
      key: "questionCount",
    },
    {
      title: t("ListEdits.input1"),
      dataIndex: "responseCount",
      key: "responseCount",
      render: (responseCount) => (
        responseCount > 0 ? responseCount : <Tag color="red" bordered={false}>{t("Department.input243")}</Tag>
      ),
    },
    {
      title: t("Report.input29"),
      dataIndex: "locktitle",
      key: "locktitle",
      render: (text) => text ? <Tag color="red" bordered={false}>Tạm khóa</Tag> : <Tag color="green" bordered={false}>{t("Department.input246")}</Tag>,
    },
    {
      title: t("Department.input244"),
      key: "action",
      render: (_, record) => {
        const menuItemsCount = [
          true,
          hasEditPermission,
          dlxlphPermission,
        ].filter(Boolean).length;

        if (menuItemsCount === 1) {
          return (
            <Space>
              <Tooltip title="View">
                <Button onClick={() => handleDocDrawerOpen(record.id)} shape='circle' icon={<EyeOutlined />} />
              </Tooltip>
              <Tooltip title="Cài đặt">
                <Button onClick={() => handleDrawerOpen(record)} shape='circle' icon={<SettingFilled />} />
              </Tooltip>
            </Space>
          );
        }

        return (
          <Space>
            <Tooltip title="View">
              <Button onClick={() => handleDocDrawerOpen(record.id)} shape='circle' icon={<EyeOutlined />} />
            </Tooltip>
            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item key="3" onClick={() => handleDrawerOpen(record)}>
                    {t("Menu.menu5")}
                  </Menu.Item>
                  {hasEditPermission && (
                    <Menu.Item key="1" onClick={() => handleEditDrawerOpen(record)}>
                      Edit
                    </Menu.Item>
                  )}
                  {dlxlphPermission && (
                    <Menu.Item key="4" danger>
                      <Popconfirm
                        title={t("Department.input245")}
                        onConfirm={() => handleDelete(record.id)}
                      >
                        <span>
                          <DeleteOutlined /> Delete
                        </span>
                      </Popconfirm>
                    </Menu.Item>
                  )}
                </Menu>
              }
              trigger={["click"]}
            >
              <Tooltip title={t("Department.input187")}>
                <Button icon={<ToolFilled />} shape='circle'></Button>
              </Tooltip>
            </Dropdown>
          </Space>
        );
      },
    },
  ], [t, currentPage, pageSize, handleDocDrawerOpen, handleDrawerOpen, handleEditDrawerOpen, handleDelete, dlxlphPermission, hasEditPermission]);

  const rowSelection = useMemo(() => ({
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  }), [selectedRowKeys]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(linkToCopy)
      .then(() => message.success(t("ListDocs.input1")))
      .catch(() => message.error(t("ListDocs.input2")));
  }, [linkToCopy, t]);

  const handlePageChange = useCallback((page) => {
    fetchData(page);
  }, [fetchData]);

  const handlePageSizeChange = useCallback((current, size) => {
    setPageSize(size);
    setCurrentPage(1);
    const filters = {
      title: searchTitle,
      status: searchStatus,
      startDate: startDate && endDate ? moment(startDate).format("DD-MM-YYYY") : undefined,
      endDate: startDate && endDate ? moment(endDate).format("DD-MM-YYYY") : undefined,
    };
    fetchData(1, filters, size);
  }, [fetchData, searchTitle, searchStatus, startDate, endDate]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabId = urlParams.get('checklist');
    if (tabId) {
      setSelectedDocId(tabId);
      setDocDrawerVisible(true);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
      const recordToEdit = data.find(item => item.id === editId);
      if (recordToEdit) {
        setCurrentRecord(recordToEdit);
        setEditDrawerVisible(true);
      }
    }
  }, [data]);

  return (
    <div>
      <title>NISO CHECKLIST | Tất cả checklist</title>
      <Card bordered={false}>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          bordered
          size="middle"
          scroll={{ x: true }}
          style={{ width: "100%", whiteSpace: "nowrap" }}
          title={() =>
            <>
              <div style={{ display: 'flex', gap: 10, flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
                <Input
                  placeholder={t("ListDocs.input11")}
                  value={searchTitle}
                  onPressEnter={(e) => handleSearch(e.target.value)}
                  onChange={(e) => {
                    setSearchTitle(e.target.value);
                  }}
                  style={{ width: '100%' }}
                  disabled={loading}
                  suffix={
                    <Button
                      type="text"
                      size="small"
                      onClick={() => handleSearch(searchTitle)}
                      icon={<SearchOutlined />}
                    />
                  }
                />
                <Select
                  showSearch
                  placeholder="Trạng thái"
                  onChange={handleStatusChange}
                  style={{ width: '100%' }}
                  value={searchStatus || undefined}
                  filterOption={false}
                  allowClear
                  disabled={loading}
                  defaultActiveFirstOption={false}
                  showArrow={true}
                  notFoundContent={null}
                  options={statusOptions.map((status) => ({
                    label: status,
                    value: status
                  }))}
                />
                <Space style={{ width: '100%' }}>
                  <DatePicker
                    placeholder={t("ListDocs.input28")}
                    onChange={handleStartDateChange}
                    format="DD-MM-YYYY"
                    disabled={loading}
                    style={{ width: '100%' }}
                    disabledDate={disabledStartDate}
                  />
                  <DatePicker
                    placeholder={t("ListDocs.input29")}
                    onChange={handleEndDateChange}
                    format="DD-MM-YYYY"
                    style={{ width: '100%' }}
                    disabled={loading}
                    disabledDate={disabledEndDate}
                  />
                </Space>
              </div>
            </>
          }
          pagination={{
            current: currentPage,
            total: totalItems,
            pageSize,
            onChange: handlePageChange,
            onShowSizeChange: handlePageSizeChange,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50", "100"],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            size: window.innerWidth < 768 ? "small" : "middle"
          }}
          locale={{ emptyText: <Empty description="Checklist trống !" /> }}
          footer={dlxlphPermission ? () => (
            <Popconfirm
              title={t("Department.input249")}
              onConfirm={handleDeleteSelected}
              disabled={!selectedRowKeys.length}
            >
              <Button danger disabled={!selectedRowKeys.length} type="primary">
                {t("Department.input250")} ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          ) : undefined}
        />
        <Drawer
          title='Cài đặt'
          width={800}
          onClose={handleDrawerClose}
          visible={drawerVisible}
          bodyStyle={{ paddingBottom: 80, backgroundColor: '#f5f7fa' }}
          extra={
            hasCreatePermission ? (
              <Button
                type="primary"
                onClick={() => form.submit()}
                icon={<SaveOutlined />}
              >
                {t("Department.input253")}
              </Button>
            ) : null
          }
        >
          {currentRecord && (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              onValuesChange={(changedValues) => {
                if (changedValues.everyquyen) {
                  setIsPublicOrPrivate(changedValues.everyquyen === "Công khai" || changedValues.everyquyen === "Riêng tư");
                }
              }}
            >
              <Tabs defaultActiveKey="1" type="card" size="small">
                <TabPane tab="Thông tin cơ bản" key="1">
                  {hasCreatePermission && (
                    <Card
                      title={<span><ShopOutlined /> Thông tin cơ bản</span>}
                      style={{ marginBottom: 16 }}
                      bordered={false}
                      className="shadow-sm"
                    >
                      <Form.Item name="everyquyen" label={t("Department.input229")}>
                        <Radio.Group buttonStyle="solid">
                          <Tooltip title="Tất cả mọi người có thể thấy và truy cập vào checklist này">
                            <Radio.Button value="Công khai">
                              <Space><GlobalOutlined /> Công khai</Space>
                            </Radio.Button>
                          </Tooltip>
                          <Tooltip title="Chỉ những người bạn cho phép mới có thể truy cập vào checklist này">
                            <Radio.Button value="Nội bộ">
                              <Space><TeamOutlined /> Nội bộ</Space>
                            </Radio.Button>
                          </Tooltip>
                          <Tooltip title="Chỉ mình bạn mới thấy được checklist này">
                            <Radio.Button value="Riêng tư">
                              <Space><LockOutlined /> Riêng tư</Space>
                            </Radio.Button>
                          </Tooltip>
                        </Radio.Group>
                      </Form.Item>

                      <Form.Item
                        name="account"
                        label={t("Department.input227")}
                        tooltip="Chọn người dùng có quyền truy cập checklist này"
                      >
                        <Select
                          mode="multiple"
                          placeholder={t("Department.input16")}
                          showSearch
                          onSearch={handleAccountSearch}
                          filterOption={false}
                          defaultActiveFirstOption={false}
                          showArrow={true}
                          loading={accountSearchLoading}
                          style={{ width: '100%' }}
                          disabled={isPublicOrPrivate}
                          notFoundContent={
                            accountSearchLoading ? (
                              <div style={{ textAlign: 'center', padding: '10px' }}>
                                <Spin size="small" />
                              </div>
                            ) : accountOptions.length === 0 ? (
                              <Empty description="Không tìm thấy tài khoản" />
                            ) : null
                          }
                          optionLabelProp="label"
                        >
                          {accountOptions.map((account) => (
                            <Select.Option
                              key={account.keys}
                              value={account.keys}
                              label={
                                <Space>
                                  {account.imgAvatar ? (
                                    <Avatar src={account.imgAvatar} size="small" icon={<Spin size="small" />} />
                                  ) : (
                                    <Avatars user={{ name: account.name || account.username }} sizeImg="small" />
                                  )}
                                  <span>{account.name || account.username}</span>
                                </Space>
                              }
                            >
                              <Tooltip
                                title={<UserInfoCard user={account} />}
                                placement={window.innerWidth < 768 ? "top" : "right"}
                                overlayStyle={{ maxWidth: 300 }}
                                color="white"
                              >
                                <Space>
                                  {account.imgAvatar ? (
                                    <Avatar src={account.imgAvatar} size="small" icon={<Spin size="small" />} />
                                  ) : (
                                    <Avatars user={{ name: account.name || account.username }} sizeImg="small" />
                                  )}
                                  <span>{account.name || account.username}</span>
                                  {account.relatedChecklists && account.relatedChecklists.length > 0 && (
                                    <Tooltip
                                      title={
                                        <ul style={{ padding: '0 0 0 16px', margin: 0 }}>
                                          {account.relatedChecklists.map((checklist) => (
                                            <li key={checklist.id}>{checklist.title}</li>
                                          ))}
                                        </ul>
                                      }
                                    >
                                      <Tag color="blue">{account.relatedChecklists.length} checklist</Tag>
                                    </Tooltip>
                                  )}
                                </Space>
                              </Tooltip>
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        name="bophanADS"
                        label={t("Department.input226")}
                        tooltip="Chọn bộ phận quản lý checklist này"
                      >
                        <Select
                          mode="multiple"
                          placeholder='Chọn khối phòng'
                          showSearch
                          onSearch={handleDepartmentSearch}
                          filterOption={false}
                          loading={departmentLoading}
                          defaultActiveFirstOption={false}
                          showArrow={true}
                          style={{ width: '100%' }}
                          disabled={isPublicOrPrivate}
                          notFoundContent={departmentLoading ?
                            <div style={{ textAlign: 'center', padding: '10px' }}>
                              <Space>
                                <Spin size="small" />
                                <span>Loading...</span>
                              </Space>
                            </div> : null
                          }
                          options={departmentOptions.map(bophan => ({
                            label: bophan.toUpperCase(),
                            value: bophan
                          }))}
                          tagRender={(props) => (
                            <Tag color="cyan" bordered={false} closable={props.closable} onClose={props.onClose} style={{ marginRight: 3 }}>
                              {props.label.toUpperCase()}
                            </Tag>
                          )}
                        />
                      </Form.Item>

                      <Form.Item
                        name="cuahang"
                        label="Gán nhà hàng (Assign restaurant)"
                        tooltip="Chọn một hoặc nhiều nhà hàng để gán checklist này"
                      >
                        <Select
                          mode="multiple"
                          placeholder="Chọn nhà hàng..."
                          showSearch
                          onSearch={searchShopsDrawer}
                          filterOption={false}
                          loading={chinhanhLoadingDrawer}
                          defaultActiveFirstOption={false}
                          showArrow={true}
                          style={{ width: '100%' }}
                          disabled={isPublicOrPrivate}
                          notFoundContent={chinhanhLoadingDrawer ?
                            <div style={{ textAlign: 'center', padding: '10px' }}>
                              <Space>
                                <Spin size="small" />
                                <span>Loading...</span>
                              </Space>
                            </div> : null
                          }
                          options={chinhanhOptionsDrawer.map((chinhanh) => ({
                            label: chinhanh.toUpperCase(),
                            value: chinhanh
                          }))}
                          tagRender={(props) => (
                            <Tag closable={props.closable} color="blue" bordered={false} onClose={props.onClose} style={{ marginRight: 3 }}>
                              {props.label}
                            </Tag>
                          )}
                        />
                      </Form.Item>
                    </Card>
                  )}

                  <Card
                    title={<span><LinkOutlined /> Chia sẻ</span>}
                    style={{ marginBottom: 16 }}
                    bordered={false}
                    className="shadow-sm"
                  >
                    <Form.Item label={t("ListDocs.input26")}>
                      <Input.Group compact>
                        <Input
                          style={{ width: "calc(100% - 40px)" }}
                          value={linkToCopy}
                          readOnly
                          prefix={<LinkOutlined style={{ color: '#ae8f3d' }} />}
                        />
                        <Tooltip title="Sao chép liên kết">
                          <Button
                            icon={<CopyOutlined />}
                            onClick={handleCopyLink}
                            type="primary"
                          />
                        </Tooltip>
                      </Input.Group>
                    </Form.Item>
                  </Card>
                </TabPane>

                {hasCreatePermission && (
                  <TabPane tab="Cài đặt quyền phản hồi" key="2">
                    <Card
                      title={<span><TeamOutlined />Quyền xem phiếu chỉ định</span>}
                      style={{ marginBottom: 16 }}
                      bordered={false}
                      className="shadow-sm"
                    >
                      <Form.Item
                        name="usersview"
                        label="Người dùng được xem"
                        tooltip="Chọn người dùng có quyền xem phản hồi của checklist này"
                      >
                        <Select
                          mode="multiple"
                          placeholder="Chọn người dùng..."
                          showSearch
                          onSearch={handleAccountSearch}
                          filterOption={false}
                          defaultActiveFirstOption={false}
                          showArrow={true}
                          loading={accountSearchLoading}
                          style={{ width: '100%' }}
                          notFoundContent={
                            accountSearchLoading ? (
                              <div style={{ textAlign: 'center', padding: '10px' }}>
                                <Spin size="small" />
                              </div>
                            ) : accountOptions.length === 0 ? (
                              <Empty description="Không tìm thấy tài khoản" />
                            ) : null
                          }
                          optionLabelProp="label"
                        >
                          {accountOptions.map((account) => (
                            <Select.Option
                              key={account.keys}
                              value={account.keys}
                              label={
                                <Space>
                                  {account.imgAvatar ? (
                                    <Avatar src={account.imgAvatar} size="small" icon={<Spin size="small" />} />
                                  ) : (
                                    <Avatars user={{ name: account.name || account.username }} sizeImg="small" />
                                  )}
                                  <span>{account.name || account.username}</span>
                                </Space>
                              }
                            >
                              <Tooltip
                                title={<UserInfoCard user={account} />}
                                placement={window.innerWidth < 768 ? "top" : "right"}
                                overlayStyle={{ maxWidth: 300 }}
                                color="white"
                              >
                                <Space>
                                  {account.imgAvatar ? (
                                    <Avatar src={account.imgAvatar} size="small" icon={<Spin size="small" />} />
                                  ) : (
                                    <Avatars user={{ name: account.name || account.username }} sizeImg="small" />
                                  )}
                                  <span>{account.name || account.username}</span>
                                </Space>
                              </Tooltip>
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        name="departmentsview"
                        label="Phòng ban được xem"
                        tooltip="Chọn phòng ban có quyền xem phản hồi của checklist này"
                      >
                        <Select
                          mode="multiple"
                          placeholder="Chọn phòng ban..."
                          showSearch
                          onSearch={handleDepartmentSearch}
                          filterOption={false}
                          loading={departmentLoading}
                          defaultActiveFirstOption={false}
                          showArrow={true}
                          style={{ width: '100%' }}
                          notFoundContent={departmentLoading ?
                            <div style={{ textAlign: 'center', padding: '10px' }}>
                              <Space>
                                <Spin size="small" />
                                <span>Loading...</span>
                              </Space>
                            </div> : null
                          }
                          options={departmentOptions.map(bophan => ({
                            label: bophan.toUpperCase(),
                            value: bophan
                          }))}
                          tagRender={(props) => (
                            <Tag color="cyan" bordered={false} closable={props.closable} onClose={props.onClose} style={{ marginRight: 3 }}>
                              {props.label}
                            </Tag>
                          )}
                        />
                      </Form.Item>

                      <Form.Item
                        name="restaurantsview"
                        label="Nhà hàng được xem"
                        tooltip="Chọn nhà hàng có quyền xem phản hồi của checklist này"
                      >
                        <Select
                          mode="multiple"
                          placeholder="Chọn nhà hàng..."
                          showSearch
                          onSearch={searchShopsDrawer}
                          filterOption={false}
                          loading={chinhanhLoadingDrawer}
                          defaultActiveFirstOption={false}
                          showArrow={true}
                          style={{ width: '100%' }}
                          notFoundContent={chinhanhLoadingDrawer ?
                            <div style={{ textAlign: 'center', padding: '10px' }}>
                              <Space>
                                <Spin size="small" />
                                <span>Loading...</span>
                              </Space>
                            </div> : null
                          }
                          options={chinhanhOptionsDrawer.map((chinhanh) => ({
                            label: chinhanh.toUpperCase(),
                            value: chinhanh
                          }))}
                          tagRender={(props) => (
                            <Tag closable={props.closable} color="blue" bordered={false} onClose={props.onClose} style={{ marginRight: 3 }}>
                              {props.label}
                            </Tag>
                          )}
                        />
                      </Form.Item>
                    </Card>
                  </TabPane>
                )}
                {hasCreatePermission && (
                  <TabPane tab="Cấu hình điểm" key="3">
                    <Card
                      title={<span><ControlOutlined /> Cấu hình điểm nâng cao</span>}
                      style={{ marginBottom: 16 }}
                      bordered={false}
                      className="shadow-sm"
                    >
                      <Space>
                        <Button
                          type='default'
                          onClick={() => hasPointPermission ? handleConfigPointsNangCaoDrawerOpen(currentRecord) : message.warning('Bạn chưa được cấp quyền cấu hình điểm')}
                          icon={<ControlOutlined />}
                        >
                          Cấu hình điểm
                        </Button>
                        {(
                          (currentRecord?.pointConfig && currentRecord.pointConfig.questionId &&
                            (Array.isArray(currentRecord.pointConfig.answer) ? currentRecord.pointConfig.answer.length > 0 : currentRecord.pointConfig.answer)) ||
                          (currentRecord?.pointConfigNangCao && Array.isArray(currentRecord.pointConfigNangCao) &&
                            currentRecord.pointConfigNangCao.some(config => config.questionId &&
                              (Array.isArray(config.answer) ? config.answer.length > 0 : config.answer)))
                        ) ? (
                          <Badge status="success" text="Đã cấu hình" />
                        ) : (
                          <Badge status="error" text="Chưa cấu hình" />
                        )}
                      </Space>
                      <AlertPoint />
                    </Card>
                  </TabPane>
                )}
              </Tabs>

              {hasCreatePermission && (
                <Card
                  title={<span><ControlOutlined /> Cấu hình chung</span>}
                  bordered={false}
                  className="shadow-sm"
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="locktitle"
                        label="1. Khóa checklist"
                        valuePropName="checked"
                        tooltip="Checklist sẽ tạm thời bị khóa"
                      >
                        <Switch checkedChildren={<LockOutlined />} unCheckedChildren={<UnlockOutlined />} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="khach"
                        label="2. Hiển thị danh sách nhà hàng"
                        valuePropName="checked"
                        tooltip="Hiển thị danh sách nhà hàng trong checklist"
                      >
                        <Switch checkedChildren={<CheckOutlined />} unCheckedChildren={<CloseOutlined />} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="yeucauxuly"
                        label="3. Hiển thị nút nhận xử lý"
                        valuePropName="checked"
                        tooltip="Hiển thị nút nhận xử lý cho câu trả lời sai"
                      >
                        <Switch checkedChildren={<CheckOutlined />} unCheckedChildren={<CloseOutlined />} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="solanlaplai"
                        label="4. Hiển thị số lần lặp lại"
                        valuePropName="checked"
                        tooltip="Hiển thị số lần lặp lại cho từng câu hỏi"
                      >
                        <Switch
                          onChange={(checked) => setIsLaplaiEnabled(checked)}
                          checkedChildren={<CheckOutlined />}
                          unCheckedChildren={<CloseOutlined />}
                        />
                      </Form.Item>
                    </Col>
                    {isLaplaiEnabled && (
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="threeimg"
                          label="* Cho phép tải ảnh (tối đa 3 ảnh)"
                          valuePropName="checked"
                          tooltip="Cho phép tải lên tối đa 3 ảnh cho mỗi câu hỏi"
                        >
                          <Switch
                            checkedChildren={<PictureOutlined />}
                            unCheckedChildren={<StopOutlined />}
                          />
                        </Form.Item>
                      </Col>
                    )}
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="sqlsend"
                        label="5. Cho phép gửi dữ liệu lên SQL Server"
                        valuePropName="checked"
                        initialValue={true}
                      >
                        <Switch
                          checkedChildren={<CheckOutlined />}
                          unCheckedChildren={<CloseOutlined />}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="dapanview"
                        label="6. Cho phép xem đáp án chính xác"
                        valuePropName="checked"
                      >
                        <Switch
                          checkedChildren={<CheckOutlined />}
                          unCheckedChildren={<CloseOutlined />}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              )}
            </Form>
          )}
        </Drawer>
        <Drawer
          title={selectedDocId ? (
            <Tooltip title={data.find((record) => record.id === selectedDocId)?.title}>
              <span>
                {data.find((record) => record.id === selectedDocId)?.title.length > (window.innerWidth < 768 ? 18 : 50)
                  ? `${data.find((record) => record.id === selectedDocId)?.title.substring(0, window.innerWidth < 768 ? 18 : 50)}...`
                  : data.find((record) => record.id === selectedDocId)?.title}
              </span>
            </Tooltip>
          ) : "Checklist"}
          extra={
            <Tooltip title="Xem toàn trang">
              <Button onClick={() => window.open(`/auth/docs/form/${selectedDocId}`, "_blank")} icon={<FullscreenOutlined />} />
            </Tooltip>
          }
          width={800}
          onClose={handleDocDrawerClose}
          visible={docDrawerVisible}
        >
          {selectedDocId && <Docs id={selectedDocId} user={user} t={t} isInDrawer={true} />}
        </Drawer>

        <Drawer
          title="Edit Checklist"
          width={800}
          onClose={handleEditDrawerClose}
          visible={editDrawerVisible}
          closeIcon={null}
          bodyStyle={{ padding: 0, paddingTop: 20 }}
          extra={
            <Space style={{ justifyContent: "space-between", width: "100%" }}>
              <Button onClick={handleEditDrawerClose}>Close</Button>
              <Tooltip title="Chỉnh sửa toàn trang">
                <Button onClick={() => window.open(`/auth/docs/form/edit/${currentRecord?.id}`, "_blank")} icon={<FullscreenOutlined />} />
              </Tooltip>
            </Space>
          }
        >
          {currentRecord && <Edit id={currentRecord.id} user={user} t={t} isInDrawer={true} hasEditPermission={hasEditPermission} />}
        </Drawer>
        <Drawer
          title="Cấu hình điểm"
          width={500}
          onClose={handleConfigPointsNangCaoDrawerClose}
          visible={configPointsNangCaoDrawerVisible}
        >
          {currentRecord && (
            <ConfigPointsNangCao
              checklistId={currentRecord.id}
              solanlaplai={currentRecord.solanlaplai}
              pointConfig={currentRecord.pointConfig}
              pointConfigNangCao={currentRecord.pointConfigNangCao}
              onSave={handleConfigNangCaoSave}
            />
          )}
        </Drawer>
      </Card>
    </div>
  );
});

ViewsChecklist.propTypes = {
  user: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
  hasCreatePermission: PropTypes.bool,
  dlxlphPermission: PropTypes.bool,
  hasEditPermission: PropTypes.bool,
};

ViewsChecklist.defaultProps = {
  user: {},
  t: (key) => key,
  hasCreatePermission: false,
  dlxlphPermission: false,
  hasEditPermission: false,
};

export default ViewsChecklist;