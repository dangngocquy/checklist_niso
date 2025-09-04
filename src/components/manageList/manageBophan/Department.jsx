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
  Space,
  Alert,
  Tooltip,
  Upload,
  notification,
  Switch,
  Modal,
  Progress,
  Card,
  Empty,
} from "antd";
import { SearchOutlined, UploadOutlined, DownloadOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { debounce } from "lodash";
import * as XLSX from "xlsx";
import axios from "axios";
import useApi from "../../../hook/useApi";
import NotFoundPage from "../../NotFoundPage";

const Department = ({ user, t }) => {
  const [data, setData] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [allData, setAllData] = useState([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const [form] = Form.useForm();
  const {
    fetchDepartments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    deleteMultipleDepartments,
    loading: apiLoading,
    error: apiError,
  } = useApi();

  const fetchChinhanh = useCallback(
    async (page = 1, search = "", size = pageSize) => {
      try {
        const response = await fetchDepartments(search, page, size);
        // Sắp xếp lại ở client dựa trên createdAtFormatted
        const sortedData = (response.items || []).sort((a, b) => {
          return new Date(b.createdAtFormatted) - new Date(a.createdAtFormatted);
        });
        setData(sortedData);
        setAllData((prev) => [...new Set([...prev, ...sortedData])]);
        setTotalItems(response.totalItems || 0);
        setCurrentPage(response.currentPage || page);
      } catch (err) {
        message.error("Không thể tải dữ liệu");
      }
    },
    [fetchDepartments, pageSize]
  );

  useEffect(() => {
    fetchChinhanh(currentPage, searchText, pageSize);
  }, [currentPage, searchText, pageSize, fetchChinhanh]);

  useEffect(() => {
    if (apiError) {
      notification.error({
        message: "Lỗi API",
        description: "Lỗi khi xử lý yêu cầu, Vui lòng thử lại sau.",
        placement: "topRight",
        showProgress: true,
        pauseOnHover: true,
      });
    }
  }, [apiError]);

  const showDrawer = () => {
    form.resetFields();
    setEditingItem(null);
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
  };

  const onFinish = async (values) => {
    const duplicate = data.some(
      (item) =>
        item.bophan.toLowerCase() === values.bophan.toLowerCase() &&
        (!editingItem || item._id !== editingItem._id)
    );

    if (duplicate) {
      message.warning(t("Department.input284"));
      return;
    }

    try {
      if (!user || !user.keys) {
        message.error("Thiếu thông tin user.keys.");
        return;
      }

      let response;
      if (editingItem) {
        response = await updateDepartment(editingItem._id, { ...values, userKeys: user.keys });
        message.success(t("Department.input271"));
        setData((prev) =>
          prev.map((item) =>
            item._id === editingItem._id
              ? { ...item, ...values, createdAt: new Date(), createdAtFormatted: new Date().toLocaleString("vi-VN") }
              : item
          ).sort((a, b) => new Date(b.createdAtFormatted) - new Date(a.createdAtFormatted))
        );
        setAllData((prev) =>
          prev.map((item) =>
            item._id === editingItem._id
              ? { ...item, ...values, createdAt: new Date(), createdAtFormatted: new Date().toLocaleString("vi-VN") }
              : item
          ).sort((a, b) => new Date(b.createdAtFormatted) - new Date(a.createdAtFormatted))
        );
      } else {
        response = await addDepartment({ ...values, userKeys: user.keys });
        message.success(t("Department.input285"));
        const newItem = {
          ...response.item,
          createdAt: new Date(),
          createdAtFormatted: new Date().toLocaleString("vi-VN"),
        };
        setData((prev) => [newItem, ...prev].sort((a, b) => new Date(b.createdAtFormatted) - new Date(a.createdAtFormatted)));
        setAllData((prev) => [newItem, ...prev].sort((a, b) => new Date(b.createdAtFormatted) - new Date(a.createdAtFormatted)));
        setTotalItems((prev) => prev + 1);
      }
      handleDrawerClose();
    } catch (err) {
      message.error("Error Server: " + err.message);
    }
  };

  const handleEdit = (record) => {
    form.setFieldsValue({
      bophan: record.bophan,
      active: record.active !== undefined ? record.active : true,
    });
    setEditingItem(record);
    setDrawerVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      if (!user || !user.keys) {
        message.error("Thiếu thông tin user.keys.");
        return;
      }
      await deleteDepartment(id, user.keys);
      message.success("Xóa thành công.");
      setSelectedRowKeys(selectedRowKeys.filter((key) => key !== id));
      setData((prev) => prev.filter((item) => item._id !== id));
      setAllData((prev) => prev.filter((item) => item._id !== id));
      setTotalItems((prev) => prev - 1);
    } catch (err) {
      message.error("Error Server: " + err.message);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một mục để xóa");
      return;
    }

    try {
      if (!user || !user.keys) {
        message.error("Thiếu thông tin user.keys.");
        return;
      }
      const response = await deleteMultipleDepartments(selectedRowKeys, user.keys);
      const deletedCount = response?.deletedCount || selectedRowKeys.length;
      notification.success({
        message: "Thành công",
        description: `${t("Department.input287")} ${deletedCount} ${t("Department.input288")}`,
        showProgress: true,
        pauseOnHover: true,
      });
      setData((prev) => prev.filter((item) => !selectedRowKeys.includes(item._id)));
      setAllData((prev) => prev.filter((item) => !selectedRowKeys.includes(item._id)));
      setSelectedRowKeys([]);
      const newTotal = totalItems - deletedCount;
      setTotalItems(newTotal);
      const newTotalPages = Math.ceil(newTotal / pageSize);
      const newPage = currentPage > newTotalPages ? Math.max(1, newTotalPages) : currentPage;
      setCurrentPage(newPage);
    } catch (err) {
      message.error("Lỗi máy chủ khi xóa các mục đã chọn: " + err.message);
    }
  };

  const handleSearch = debounce((e) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
  }, 500);

  const handleDownload = () => {
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
      bophan: item.bophan,
      createdAt: item.createdAtFormatted,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Departments");
    XLSX.writeFile(workbook, "Department_List.xlsx");
    message.success("Tải xuống thành công!");
  };

  const handleUpload = async ({ file }) => {
    setUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileData = new Uint8Array(e.target.result);
        const workbook = XLSX.read(fileData, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (!user || !user.keys) {
          message.error("Thiếu thông tin user.keys.");
          setUploading(false);
          return;
        }

        const totalRecords = json.length;
        const departments = json
          .filter((newDept) => newDept.bophan)
          .map((newDept) => ({ bophan: newDept.bophan }));

        // Simulate progress
        const simulateProgress = () => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 90) {
              clearInterval(interval);
              progress = 90;
            }
            setUploadProgress(Math.round(Math.min(progress, 90))); // Làm tròn số
          }, 300);
          return interval;
        };

        const progressInterval = simulateProgress();

        const response = await axios.post(
          "/tablea/upload",
          { departments, userKeys: user.keys },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
            },
          }
        );

        clearInterval(progressInterval);
        setUploadProgress(100);

        const processedRecords = response.data.insertedCount || 0;
        let newDepartments = [];
        if (Array.isArray(response.data.insertedIds)) {
          newDepartments = response.data.insertedIds.map((id, index) => ({
            _id: id,
            bophan: departments[index]?.bophan || "",
            createdAt: new Date(),
            createdAtFormatted: new Date().toLocaleString("vi-VN"),
            active: true,
          }));
        } else {
          newDepartments = departments.slice(0, processedRecords).map((dept, index) => ({
            _id: `${Date.now()}-${index}`,
            bophan: dept.bophan,
            createdAt: new Date(),
            createdAtFormatted: new Date().toLocaleString("vi-VN"),
            active: true,
          }));
        }

        setData((prev) => [...newDepartments, ...prev].sort((a, b) => new Date(b.createdAtFormatted) - new Date(a.createdAtFormatted)));
        setAllData((prev) => [...newDepartments, ...prev].sort((a, b) => new Date(b.createdAtFormatted) - new Date(a.createdAtFormatted)));
        setTotalItems((prev) => prev + processedRecords);

        const skippedRecords = totalRecords - processedRecords;
        if (skippedRecords > 0) {
          message.warning(`Đã bỏ qua ${skippedRecords} bộ phận trùng lặp`);
        }
        if (processedRecords > 0) {
          message.success(`Đã tải lên thành công ${processedRecords} bộ phận mới!`);
        }
      } catch (err) {
        message.error("Lỗi, vui lòng thử lại sau: " + err.message);
      } finally {
        setUploading(false);
        setUploadModalVisible(false);
        setUploadProgress(0);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const columns = [
    {
      title: t("Input.input7"),
      key: "stt",
      render: (text, record, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: t("Header.header3"),
      dataIndex: "bophan",
      key: "bophan",
      sorter: (a, b) => a.bophan.localeCompare(b.bophan),
      render: (code) => code.toUpperCase(),
    },
    {
      title: "Thời gian tạo",
      dataIndex: "createdAtFormatted",
      key: "createdAtFormatted",
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      render: (active) => (
        <Tag color={active ? "green" : "red"}>
          {active ? "Đang hoạt động" : "Ngừng hoạt động"}
        </Tag>
      ),
      sorter: (a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1),
    },
    {
      title: t("Department.input244"),
      key: "actions",
      render: (text, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              shape='circle'
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title={t("Department.input289")}
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button type="default" shape='circle' danger icon={<DeleteOutlined />}>
              </Button>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (user.phanquyen === false) {
    return <NotFoundPage t={t} />;
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => setSelectedRowKeys(newSelectedRowKeys),
    onSelect: (record, selected) => {
      if (selected) {
        setSelectedRowKeys((prev) => [...prev, record._id]);
      } else {
        setSelectedRowKeys((prev) => prev.filter((key) => key !== record._id));
      }
    },
    onSelectAll: (selected, selectedRows, changeRows) => {
      const currentPageKeys = changeRows.map((item) => item._id);
      if (selected) {
        setSelectedRowKeys((prev) => [
          ...prev,
          ...currentPageKeys.filter((key) => !prev.includes(key)),
        ]);
      } else {
        setSelectedRowKeys((prev) =>
          prev.filter((key) => !currentPageKeys.includes(key))
        );
      }
    },
  };

  return (
    <div style={{ padding: 8 }}>
      <title>NISO CHECKLIST | {t("Department.input290")}</title>
      <Card>
        <Table
          rowSelection={rowSelection}
          bordered
          columns={columns}
          dataSource={data}
          rowKey="_id"
          size="middle"
          loading={apiLoading}
          title={() => (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Input
                placeholder={t("ListEdits.input28")}
                onChange={handleSearch}
                prefix={<SearchOutlined />}
                size="middle"
              />
              <Space style={{marginTop: 12, flexWrap: "wrap" }}>
                <Button type="primary" onClick={showDrawer}>
                  {t("ListEdits.input32")}
                </Button>
                <Button
                  icon={<UploadOutlined />}
                  onClick={() => setUploadModalVisible(true)}
                >
                  Import Excel
                </Button>
                <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                  Export Excel
                </Button>
              </Space>
            </div>
          )}
          locale={{
            emptyText: <Empty description="Danh sách trống !" />,
          }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalItems,
            onChange: (page) => {
              setCurrentPage(page);
              fetchChinhanh(page, searchText, pageSize);
            },
            onShowSizeChange: (current, size) => {
              setPageSize(size);
              setCurrentPage(1);
              fetchChinhanh(1, searchText, size);
            },
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50", "100"],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            size: window.innerWidth < 768 ? "small" : "middle"
          }}
          scroll={{ x: true }}
          style={{ width: "100%", whiteSpace: "nowrap" }}
          footer={() => (
            <Popconfirm
              title={t("Notifications.input37")}
              onConfirm={handleDeleteSelected}
              okText="Yes"
              cancelText="No"
            >
              <Button
                danger
                type="primary"
                disabled={selectedRowKeys.length === 0}
              >
                {t("Department.input250")} ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          )}
        />
        <Drawer
          title={editingItem ? "Edit" : "Thêm mới"}
          visible={drawerVisible}
          onClose={handleDrawerClose}
          width={360}
          closeIcon={null}
          extra={
            <Space>
              <Button onClick={handleDrawerClose}>Cancel</Button>
              <Button type="primary" onClick={() => form.submit()}>
                {editingItem ? t("Department.input164") : t("Department.input164")}
              </Button>
            </Space>
          }
        >
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="bophan"
              label={t("Department.input293")}
              rules={[{ required: true, message: t("Department.input294") }]}
            >
              <Input style={{ textTransform: "uppercase" }} />
            </Form.Item>
            <Form.Item
              name="active"
              label="Trạng thái"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch checkedChildren="Đang hoạt động" unCheckedChildren="Ngừng hoạt động" />
            </Form.Item>
          </Form>
        </Drawer>
        <Modal
          title="Tải lên file Excel"
          visible={uploadModalVisible}
          footer={null}
          closable={!uploading}
          maskClosable={!uploading}
          onCancel={() => !uploading && setUploadModalVisible(false)}
        >
          {!uploading ? (
            <Upload.Dragger
              accept=".xlsx, .xls"
              showUploadList={false}
              customRequest={handleUpload}
              disabled={uploading}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">
                Kéo và thả file Excel vào đây hoặc nhấp để chọn file
              </p>
              <p className="ant-upload-hint">Chỉ hỗ trợ định dạng .xlsx và .xls</p>
            </Upload.Dragger>
          ) : (
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
      </Card>
    </div>
  );
};

export default React.memo(Department);