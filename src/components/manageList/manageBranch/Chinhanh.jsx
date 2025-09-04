import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Drawer,
  Form,
  Input,
  message,
  Popconfirm,
  Tag,
  notification,
  Alert,
  Card,
  Upload,
  Empty,
  Tooltip,
  Space,
  Modal,
  Progress,
  Switch,
  Select,
  Transfer,
} from "antd";
import {
  SearchOutlined,
  UploadOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import NotFoundPage from "../../NotFoundPage";
import * as XLSX from "xlsx";
import moment from "moment";
import useApi from "../../../hook/useApi";

const { Option } = Select;

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Chinhanh = ({ user, t }) => {
  const [dataCache, setDataCache] = useState({});
  const [fullData, setFullData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [transferDrawerVisible, setTransferDrawerVisible] = useState(false);
  const [transferredBranches, setTransferredBranches] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const debouncedSearchText = useDebounce(searchInput, 500);

  const [form] = Form.useForm();
  const {
    fetchBranches,
    deleteBranch,
    deleteMultipleBranches,
    updateBranch,
    addBranch,
    fetchDepartments,
    transferBranches,
  } = useApi();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchAllDepartments = useCallback(async () => {
    try {
      const response = await fetchDepartments("", 1, 0, false);
      setDepartments(response.items || []);
    } catch (error) {
      message.error("Không thể tải danh sách phòng ban: " + error.message);
    }
  }, [fetchDepartments]);

  const fetchChinhanh = useCallback(
    async (page = 1, pageSize = 5, search = "") => {
      if (!user || !user.keys) {
        console.error("fetchChinhanh aborted - User or user.keys is missing:", user);
        return;
      }
      if (dataCache[`${page}-${pageSize}`] && search === searchText) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetchBranches({ page, limit: pageSize, search });
        const newData = response.data.map((item) => ({
          ...item,
          isActive: item.isActive !== undefined ? item.isActive : true,
          departments: item.departments || [],
          isTransferred: item.isTransferred || false,
        }));

        setDataCache((prev) => ({
          ...prev,
          [`${page}-${pageSize}`]: newData,
        }));
        setTotalItems(response.total || 0);
        setSelectedRowKeys([]);
      } catch (error) {
        message.error("Error Server: " + error.message);
      } finally {
        setLoading(false);
      }
    },
    [fetchBranches, dataCache, searchText, user]
  );

  useEffect(() => {
    setSearchText(debouncedSearchText);
    if (debouncedSearchText !== searchText) {
      setCurrentPage(1);
      setDataCache({});
    }
  }, [debouncedSearchText, searchText]);

  useEffect(() => {
    if (!user || !user.keys) {
      console.error("Component render aborted - User or user.keys is missing:", user);
      return;
    }
    fetchChinhanh(currentPage, pageSize, searchText);
    fetchAllDepartments();
  }, [currentPage, pageSize, searchText, fetchChinhanh, fetchAllDepartments, user]);

  if (user.phanquyen === false) {
    return <NotFoundPage t={t} />;
  }

  const currentData = dataCache[`${currentPage}-${pageSize}`] || [];

  const showDrawer = () => {
    form.resetFields();
    if (!editingItem) {
      form.setFieldsValue({ isActive: true, departments: [] });
    }
    setEditingItem(null);
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setEditingItem(null);
  };

  const onFinish = async (values) => {
    const duplicates = Object.values(dataCache)
      .flat()
      .some(
        (item) =>
          item.restaurant === values.restaurant &&
          (!editingItem || item.id !== editingItem.id)
      );
    if (duplicates) {
      message.warning(t("Department.input295"));
      return;
    }
    const duplicateCode = Object.values(dataCache)
      .flat()
      .some(
        (item) =>
          item.code === values.code &&
          (!editingItem || item.id !== editingItem.id)
      );
    if (duplicateCode) {
      message.warning(t("Department.input296"));
      return;
    }
    try {
      if (editingItem) {
        const response = await updateBranch(editingItem.id, { ...values, userKeys: user.keys });
        message.success(t("Department.input271"));
        setDataCache((prev) => ({
          ...prev,
          [`${currentPage}-${pageSize}`]: prev[`${currentPage}-${pageSize}`].map((item) =>
            item.id === editingItem.id ? response.data : item
          ),
        }));
      } else {
        await addBranch({ ...values, isActive: values.isActive ?? true, userKeys: user.keys });
        message.success(t("Department.input285"));
        setDataCache({});
      }
      fetchChinhanh(currentPage, pageSize, searchText);
      handleDrawerClose();
    } catch (error) {
      message.error("Error server: " + error.message);
    }
  };

  const handleEdit = (record) => {
    form.setFieldsValue({
      ...record,
      departments: record.departments || [],
    });
    setEditingItem(record);
    setDrawerVisible(true);
  };

  const handleDelete = async (id) => {
    if (!id || !user?.keys) {
      message.error("Thiếu thông tin id hoặc userKeys.");
      return;
    }
    try {
      await deleteBranch(id, user.keys);
      message.success("Xóa thành công.");
      setDataCache({});
      setFullData(fullData.filter(item => item.id !== id));
      fetchChinhanh(currentPage, pageSize, searchText);
    } catch (error) {
      message.error(t("Department.errorServer") + ": " + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning(t("Department.noItemsSelected"));
      return;
    }
    if (!user?.keys) {
      message.error("Thiếu thông tin userKeys.");
      return;
    }
    try {
      await deleteMultipleBranches(selectedRowKeys, user.keys);
      message.success("Xóa thành công các mục đã chọn.");
      setSelectedRowKeys([]);
      setDataCache({});
      setFullData(fullData.filter(item => !selectedRowKeys.includes(item.id)));
      fetchChinhanh(currentPage, pageSize, searchText);
    } catch (error) {
      message.error(t("Department.errorServer") + ": " + (error.response?.data?.message || error.message));
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = () => {
    setSearchText(searchInput);
    setCurrentPage(1);
    setDataCache({});
  };

  const handleDownload = async () => {
    try {
      const response = await fetchBranches({ search: "" });
      const allData = response.data;

      if (allData.length === 0) {
        notification.warning({
          message: "Cảnh báo",
          description: "Không có dữ liệu để tải xuống!",
          placement: "topRight",
          showProgress: true,
          pauseOnHover: true,
        });
        return;
      }

      const exportData = allData.map((item) => ({
        Restaurant: item.restaurant,
        Code: item.code,
        "IP WAN": item.ipwan ? item.ipwan : "Trống",
        Address: item.address ? item.address : "Trống",
        Departments: item.departments ? item.departments.join(", ") : "Trống",
        "Trạng thái": item.isActive ? "Đang hoạt động" : "Ngừng hoạt động",
        "Đã chuyển": item.isTransferred ? "Có" : "Không",
        Date: item.date ? item.date.replace(/\//g, '-') : "Không có thời gian",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Branches");
      XLSX.writeFile(workbook, "Branch_List.xlsx");
      message.success("Tải xuống thành công!");
    } catch (error) {
      message.error("Lỗi khi tải xuống: " + error.message);
    }
  };

  const handleUpload = async (file) => {
    setUploading(true);
    setUploadModalVisible(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileData = new Uint8Array(e.target.result);
        const workbook = XLSX.read(fileData, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const totalRecords = json.length;
        const processedRecords = [];
        let progress = 0;

        for (let i = 0; i < totalRecords; i++) {
          const record = json[i];
          const exists = fullData.some(
            (item) =>
              item.restaurant === record.Restaurant ||
              item.code === record.Code
          );
          if (!exists) {
            const departmentsArray = record.Departments ? record.Departments.split(",").map(d => d.trim()) : [];
            const newRecord = {
              restaurant: record.Restaurant,
              code: record.Code,
              ipwan: record["IP WAN"] === "Trống" ? null : record["IP WAN"],
              address: record.Address === "Trống" ? null : record.Address,
              departments: departmentsArray,
              isActive: record["Trạng thái"] === "Ngừng hoạt động" ? false : true,
              userKeys: user.keys,
            };
            processedRecords.push(newRecord);
          }
          progress = Math.round(((i + 1) / totalRecords) * 100);
          setUploadProgress(progress);
        }

        if (processedRecords.length > 0) {
          await addBranch(processedRecords, true);
          const skippedRecords = totalRecords - processedRecords.length;
          if (skippedRecords > 0) {
            message.warning(`Đã bỏ qua ${skippedRecords} bản ghi trùng lặp`);
          }
          setFullData([...fullData, ...processedRecords]);
        } else {
          message.info("Không có chi nhánh nào được nhập do tất cả đều trùng lặp.");
        }

        setDataCache({});
        fetchChinhanh(currentPage, pageSize, searchText);
      } catch (error) {
        message.error("Lỗi khi tải lên: " + error.message);
      } finally {
        setUploading(false);
        setUploadModalVisible(false);
        setUploadProgress(0);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const showTransferDrawer = async () => {
    try {
      const response = await fetchBranches({ search: "", page: 1, limit: 0 });
      const allData = response.data.map(item => ({
        ...item,
        isTransferred: item.isTransferred || false,
        key: item.id,
        title: item.restaurant,
        description: `Code: ${item.code}`,
      }));
      setFullData(allData);
      setTransferredBranches(allData.filter(item => item.isTransferred).map(item => item.id));
      setTransferDrawerVisible(true);
    } catch (error) {
      message.error("Không thể tải dữ liệu chi nhánh: " + error.message);
    }
  };

  const handleTransferChange = (nextTargetKeys) => {
    setTransferredBranches(nextTargetKeys.filter(key => key));
  };

  const handleTransferDrawerClose = async () => {
    setTransferDrawerVisible(false);

    if (!user?.keys) {
      message.error("Không tìm thấy thông tin người dùng!");
      return;
    }

    const originalTransferred = fullData
      .filter(item => item.isTransferred && item.id)
      .map(item => item.id);

    const toTransfer = transferredBranches.filter(id => !originalTransferred.includes(id));
    const toCancelTransfer = originalTransferred.filter(id => !transferredBranches.includes(id));

    if (toTransfer.length === 0 && toCancelTransfer.length === 0) {
      message.info("Không có thay đổi nào để xử lý!");
      return;
    }

    try {
      let transferMessage = "";
      if (toTransfer.length > 0) {
        const transferResponse = await transferBranches(toTransfer, user.keys, { action: "transfer" });
        transferMessage += transferResponse.message || `Đã chuyển ${toTransfer.length} chi nhánh. `;
      }
      if (toCancelTransfer.length > 0) {
        const cancelResponse = await transferBranches(toCancelTransfer, user.keys, { action: "cancelTransfer" });
        transferMessage += cancelResponse.message || `Đã hủy chuyển ${toCancelTransfer.length} chi nhánh.`;
      }

      message.success(transferMessage.trim());
      setDataCache({});
      setFullData(fullData.map(item => ({
        ...item,
        isTransferred: transferredBranches.includes(item.id),
      })));
      fetchChinhanh(currentPage, pageSize, searchText);
    } catch (error) {
      message.error(`Lỗi khi xử lý chi nhánh: ${error.message}`);
    }
  };

  const columns = [
    {
      title: t("Input.input7"),
      dataIndex: "index",
      key: "index",
      render: (text, record, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: t("Department.input297"),
      dataIndex: "restaurant",
      key: "restaurant",
      sorter: (a, b) => a.restaurant.localeCompare(b.restaurant),
    },
    {
      title: t("Department.input298"),
      dataIndex: "code",
      key: "code",
      sorter: (a, b) => a.code.localeCompare(b.code),
      render: (code) => (code ? code.toUpperCase() : "Trống"),
    },
    {
      title: "Địa chỉ nhà hàng",
      dataIndex: "address",
      key: "address",
      render: (address) =>
        address ? (
          <span>{address}</span>
        ) : (
          <Tag color="red" bordered={false}>Trống</Tag>
        ),
    },
    {
      title: "Địa chỉ IP (WAN)",
      dataIndex: "ipwan",
      key: "ipwan",
      render: (ipwan) =>
        ipwan ? (
          <Tag color="blue" bordered={false}>{ipwan.toUpperCase()}</Tag>
        ) : (
          <Tag color="red" bordered={false}>Trống</Tag>
        ),
    },
    {
      title: "Danh sách khối / phòng",
      dataIndex: "departments",
      key: "departments",
      render: (departments) => {
        if (!departments || departments.length === 0) {
          return <Tag color="red" bordered={false}>Trống</Tag>;
        }

        const maxTags = 2;
        const visibleTags = departments.slice(0, maxTags);
        const remainingCount = departments.length - maxTags;

        return (
          <Tooltip
            title={departments.map((dept) => dept.toUpperCase()).join(", ")}
            placement="top"
          >
            <Space size={4} wrap={false}>
              {visibleTags.map((dept) => (
                <Tag key={dept} color="cyan" bordered={false}>
                  {dept.toUpperCase()}
                </Tag>
              ))}
              {remainingCount > 0 && (
                <Tag color="cyan" bordered={false}>+{remainingCount}</Tag>
              )}
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: "Thời gian tạo",
      dataIndex: "date",
      key: "date",
      render: (date) =>
        date && moment(date, "DD/MM/YYYY HH:mm:ss", true).isValid() ? (
          date.replace(/\//g, '-')
        ) : (
          <Tag color="red" bordered={false}>Không có thời gian</Tag>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"} bordered={false}>
          {isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Đã chuyển",
      dataIndex: "isTransferred",
      key: "isTransferred",
      render: (isTransferred) => (
        <Tag color={isTransferred ? "purple" : "default"} bordered={false}>
          {isTransferred ? "Có" : "Không"}
        </Tag>
      ),
    },
    {
      title: t("Department.input244"),
      key: "actions",
      render: (text, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              shape="circle"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title={t("Department.input299")}
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button type="default" danger shape="circle" icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      const validKeys = selectedKeys.filter((key) =>
        currentData.some((item) => item.id === key)
      );
      setSelectedRowKeys(validKeys);
    },
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
    setSelectedRowKeys([]);
    setDataCache({}); // Làm mới cache để lấy dữ liệu mới từ backend
  };

  const validateIP = (_, value) => {
    if (
      !value ||
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
        value
      )
    ) {
      return Promise.resolve();
    }
    return Promise.reject(new Error("Chỉ cho phép nhập địa chỉ IP"));
  };

  return (
    <div className="layout_main_niso">
      <title>NISO CHECKLIST | {t("Department.input300")}</title>
      <Card>
        <Table
          columns={columns}
          dataSource={currentData}
          rowKey="id"
          loading={loading}
          bordered
          size="middle"
          title={() => (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", marginBottom: 12 }}>
                <Input
                  placeholder={t("Department.input301")}
                  onChange={handleSearchInputChange}
                  value={searchInput}
                  prefix={<SearchOutlined />}
                  size="middle"
                  style={{ flex: 1 }}
                  disabled={loading}
                  onPressEnter={handleSearchSubmit}
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearchSubmit}
                  disabled={loading}
                  style={{ marginLeft: 8 }}
                >
                  Tìm kiếm
                </Button>
              </div>
              <Space style={{ flexWrap: "wrap" }}>
                <Button type="primary" onClick={showDrawer} disabled={loading}>
                  {t("Department.input302")}
                </Button>
                <Button
                  type="default"
                  onClick={() => setUploadModalVisible(true)}
                  icon={<UploadOutlined />}
                  disabled={loading}
                >
                  Import Excel
                </Button>
                <Button
                  type="default"
                  onClick={handleDownload}
                  icon={<DownloadOutlined />}
                  disabled={loading}
                >
                  Export Excel
                </Button>
                <Button
                  type="default"
                  onClick={showTransferDrawer}
                  disabled={loading || currentData.length === 0}
                >
                  Di chuyển chi nhánh
                </Button>
              </Space>
            </div>
          )}
          pagination={{
            pageSize: pageSize,
            total: totalItems,
            current: currentPage,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            pageSizeOptions: ["5", "10", "20", "50", "100"],
            showSizeChanger: true,
            onShowSizeChange: (current, size) => setPageSize(size),
            size: window.innerWidth < 768 ? "small" : "middle",
          }}
          scroll={{ x: true }}
          rowSelection={rowSelection}
          style={{ width: "100%", whiteSpace: "nowrap" }}
          onChange={handleTableChange}
          locale={{
            emptyText: <Empty description="Danh sách trống !" />,
          }}
          footer={() => (
            <div>
              <Popconfirm
                title={t("Department.input249")}
                onConfirm={handleDeleteSelected}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="primary"
                  danger
                  disabled={selectedRowKeys.length === 0}
                >
                  {t("Department.input250")} ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            </div>
          )}
        />
        <Drawer
          title={editingItem ? "Edit" : "Thêm mới"}
          visible={drawerVisible}
          onClose={handleDrawerClose}
          closeIcon={null}
          width={windowWidth < 768 ? "90%" : 360}
          extra={
            <Space>
              <Button onClick={handleDrawerClose}>Cancel</Button>
              <Button type="primary" onClick={() => form.submit()}>
                {editingItem ? t("Department.input164") : "Thêm"}
              </Button>
            </Space>
          }
        >
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="restaurant"
              label={t("Department.input305")}
              rules={[{ required: true, message: t("Department.input306") }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="code"
              label={t("Department.input307")}
              rules={[{ required: true, message: t("Department.input308") }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="ipwan" label="Đặt địa chỉ IP (WAN)" rules={[{ validator: validateIP }]}>
              <Input />
            </Form.Item>
            <Form.Item name="address" label="Địa chỉ nhà hàng">
              <Input />
            </Form.Item>
            <Form.Item name="departments" label="Phòng ban">
              <Select
                mode="multiple"
                placeholder="Chọn khối / phòng"
                tagRender={(props) => (
                  <Tag
                    color="cyan"
                    closable={props.closable}
                    bordered={false}
                    onClose={props.onClose}
                    style={{ marginRight: 3 }}
                  >
                    {props.label}
                  </Tag>
                )}
              >
                {departments.map((dept) => (
                  <Option key={dept._id} value={dept.bophan}>
                    {dept.bophan.toUpperCase()}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
              <Switch checkedChildren="Đang hoạt động" unCheckedChildren="Ngừng hoạt động" />
            </Form.Item>
          </Form>
        </Drawer>

        <Modal
          title="Upload Excel File"
          visible={uploadModalVisible}
          footer={null}
          closable={!uploading}
          maskClosable={!uploading}
          onCancel={() => setUploadModalVisible(false)}
        >
          {!uploading && (
            <Upload.Dragger
              accept=".xlsx, .xls"
              customRequest={({ file }) => handleUpload(file)}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">
                Kéo và thả file Excel vào đây hoặc nhấp để chọn file
              </p>
              <p className="ant-upload-hint">Chỉ hỗ trợ định dạng .xlsx và .xls</p>
            </Upload.Dragger>
          )}
          {uploading && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                gap: 15,
              }}
            >
              <p>Đang tải lên và xử lý...</p>
              <Progress type="circle" percent={uploadProgress} />
              <Alert
                message="Vui lòng chờ cho đến khi quá trình tải lên hoàn tất."
                type="warning"
                showIcon
                banner
              />
            </div>
          )}
        </Modal>

        <Drawer
          title="Chuyển chi nhánh"
          visible={transferDrawerVisible}
          onClose={handleTransferDrawerClose}
          width={windowWidth < 768 ? "90%" : 600}
          extra={
            <Space>
              <Button onClick={() => setTransferDrawerVisible(false)}>Hủy</Button>
              <Button
                type="primary"
                onClick={handleTransferDrawerClose}
                disabled={transferredBranches.length === 0 && fullData.every(item => !item.isTransferred)}
              >
                Xác nhận
              </Button>
            </Space>
          }
        >
          <Transfer
            dataSource={fullData}
            targetKeys={transferredBranches}
            onChange={handleTransferChange}
            render={(item) => `${item.title} (${item.description})`}
            showSearch
            listStyle={{
              width: windowWidth < 768 ? "100%" : 250,
              height: 300,
            }}
            style={{
              flexDirection: windowWidth < 768 ? "column" : "row",
              alignItems: "center",
            }}
            titles={[
              `Nguồn (${fullData.filter(item => !transferredBranches.includes(item.id)).length})`,
              `Đã chọn (${transferredBranches.length})`,
            ]}
            pagination={{ pageSize: 5, showSizeChanger: false }}
            locale={{
              itemUnit: "chi nhánh",
              itemsUnit: "chi nhánh",
              searchPlaceholder: "Tìm kiếm chi nhánh",
            }}
          />
          <div style={{ marginTop: 16 }}>
            <Alert
              message="Note: Di chuyển những nhà hàng bạn muốn hiển thị trong danh sách checklist của bạn."
              banner
              style={{ fontSize: windowWidth < 768 ? "12px" : "smaller" }}
            />
          </div>
        </Drawer>
      </Card>
    </div>
  );
};

export default React.memo(Chinhanh);