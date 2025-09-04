import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import useApi from "../../../../hook/useApi";
import useSearchDepartment from "../../../../hook/SearchDepartment/useSearchDepartment";
import useSearchShop from "../../../../hook/SearchShop/useSearchShop";
import PropTypes from "prop-types";
import UserInfoCard from "../../../../hook/UserInfoCard";
import * as XLSX from "xlsx";
import {
  Card,
  Skeleton,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  notification,
  message,
  Popconfirm,
  Select,
  Dropdown,
  Menu,
  Empty,
  Avatar,
  Tag,
  Upload,
  Space,
  Spin,
  Checkbox,
  Progress,
  Tooltip,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  PlusCircleOutlined,
  DownloadOutlined,
  CloudSyncOutlined,
  UploadOutlined,
  InfoOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import Avatars from "../../../../config/design/Avatars";
import { useNavigate } from "react-router-dom";

const { Option } = Select;
const { Dragger } = Upload;

const Report = React.memo(({ user, t, hasReportPermission }) => {
  const navigate = useNavigate();
  const {
    fetchReports,
    addReport,
    updateReport,
    deleteReport,
    search,
    deleteMultipleReports,
    searchShop,
  } = useApi();

  const { options: deptOptions, searchDepartments: searchDepartmentsRaw } = useSearchDepartment();
  const { options: shopOptions, loading: shopLoading, searchShops } = useSearchShop(searchShop);

  const [reports, setReports] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [excelModalVisible, setExcelModalVisible] = useState(false);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedShop, setSelectedShop] = useState("");
  const [selectedUserData, setSelectedUserData] = useState([]);
  const [dropdownVisibleMap, setDropdownVisibleMap] = useState({});
  const [linkPreview, setLinkPreview] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedReports, setSelectedReports] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedUserOptions, setSelectedUserOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [isDeptLoading, setIsDeptLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [selectedReportInfo, setSelectedReportInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDataRef = useRef(null);

  const hasEditPermission = hasReportPermission || user.phanquyen === true || (user.phanquyen && ["Admin", "Manager"].includes(user.phanquyen));
  const hasViewPermission = user.phanquyen === true || (user.phanquyen && ["Admin", "Manager", "Viewer"].includes(user.phanquyen));

  const fetchUserData = useCallback(
    async (userKeys) => {
      if (!userKeys || userKeys.length === 0) {
        setSelectedUserOptions([]);
        return;
      }
      try {
        setIsUserLoading(true);
        const response = await search("", {
          keys: userKeys.join(","),
          fields: ['keys', 'name', 'username', 'imgAvatar', 'email', 'chucvu', 'chinhanh', 'bophan', 'locker', 'imgBackground'],
        });
        if (!response || !response.data) {
          throw new Error("No data returned from search");
        }
        const filteredData = (response.data || []).map((user) => ({
          username: user.keys,
          usernamekeys: user.username,
          name: user.name,
          imgAvatar: user.imgAvatar || null,
          email: user.email || null,
          chucvu: user.chucvu || null,
          chinhanh: user.chinhanh || 'N/A',
          bophan: user.bophan || 'N/A',
          locker: user.locker || false,
          imgBackground: user.imgBackground || null,
        }));
        setSelectedUserOptions(filteredData);
      } catch (error) {
        console.error("Error fetching users:", error);
        message.error("Không thể tải dữ liệu người dùng: " + error.message);
        setSelectedUserOptions([]);
      } finally {
        setIsUserLoading(false);
      }
    },
    [search]
  );

  const searchDepartments = useCallback(
    async (value) => {
      if (value && value.trim() !== "") {
        try {
          setIsDeptLoading(true);
          await searchDepartmentsRaw(value);
        } catch (error) {
          console.error("Error searching departments:", error);
        } finally {
          setIsDeptLoading(false);
        }
      }
    },
    [searchDepartmentsRaw]
  );

  const fetchData = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        setLoading(true);
        if (!append) {
          setInitialLoading(true);
        } else {
          setLoadingMore(true);
        }

        const userKeysParam = Array.isArray(selectedUserData) && selectedUserData.length > 0
          ? selectedUserData.join(",")
          : "all";

        const params = hasEditPermission
          ? {
            page: pageNum,
            limit: 12,
            userKeys: userKeysParam,
          }
          : {
            page: pageNum,
            limit: 12,
            currentUser: JSON.stringify({
              keys: user.keys,
              bophan: user.bophan || "",
              chinhanh: user.chinhanh || "",
              phanquyen: user.phanquyen,
            }),
          };

        const reportResponse = await fetchReports(params.page, params.limit, params.userKeys, params.currentUser);

        const newReports = reportResponse.data || [];
        setReports((prev) => (append ? [...prev, ...newReports] : newReports));
        setTotalRecords(reportResponse.pagination.total);
        setHasMore(newReports.length === 12 && pageNum < reportResponse.pagination.totalPages);

        const allUserKeys = newReports
          .filter((report) => Array.isArray(report.userKeys) && report.userKeys.length > 0)
          .flatMap((report) => report.userKeys);
        const uniqueUserKeys = [...new Set(allUserKeys)];
        if (uniqueUserKeys.length > 0) {
          await fetchUserData(uniqueUserKeys);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("Không thể tải báo cáo: " + error.message);
      } finally {
        setInitialLoading(false);
        setLoadingMore(false);
        setLoading(false);
      }
    },
    [fetchReports, selectedUserData, fetchUserData, user, hasEditPermission]
  );

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchDataRef.current(1);
  }, []);

  const handleUserDataChange = useCallback(() => {
    if (hasEditPermission) {
      setPage(1);
      fetchDataRef.current(1);
    }
  }, [hasEditPermission]);

  useEffect(() => {
    handleUserDataChange();
  }, [selectedUserData, handleUserDataChange]);

  const loadMoreData = async () => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchData(nextPage, true);
  };

  const handleAdd = async (values) => {
    if (!hasEditPermission) {
      message.error("Bạn không có quyền thêm báo cáo!");
      return;
    }
    try {
      const existingReport = reports.find(
        (report) => report?.link === values.link || report?.title === values.title
      );
      if (existingReport) {
        message.warning(t("Department.input269"));
        return;
      }
      const response = await addReport(values);
      message.success("Tạo report thành công.");
      setReports((prev) => [response.data, ...prev]);
      setModalVisible(false);
      form.resetFields();
      setLinkPreview("");
      setSelectedUserOptions([]);
      if (values.userKeys && values.userKeys.length > 0) {
        await fetchUserData([...new Set([...selectedUserOptions.map((u) => u.username), ...values.userKeys])]);
      }
    } catch (error) {
      console.error("Error adding report:", error);
    }
  };

  const handleEdit = (report) => {
    if (!hasEditPermission) {
      message.error("Bạn không có quyền chỉnh sửa báo cáo!");
      return;
    }
    setEditingKey(report.keys);
    form.setFieldsValue({
      ...report,
      bo_phan_rp: report.bo_phan_rp,
      shop: report.shop,
      userKeys: report.userKeys,
    });
    setLinkPreview(report.link);
    setModalVisible(true);
    setDropdownVisibleMap((prev) => ({ ...prev, [report.keys]: false }));
    if (report.bo_phan_rp) {
      searchDepartments(report.bo_phan_rp.join(","));
    }
    fetchUserData(report.userKeys);
  };

  const handleUpdate = async (values) => {
    if (!hasEditPermission) {
      message.error("Bạn không có quyền cập nhật báo cáo!");
      return;
    }
    try {
      const existingReport = reports.find(
        (report) =>
          (report.link === values.link || report.title === values.title) && report.keys !== editingKey
      );
      if (existingReport) {
        message.warning(t("Department.input269"));
        return;
      }
      await updateReport(editingKey, values);
      message.success("Đã áp dụng thay đổi.");
      setReports((prev) =>
        prev.map((report) => (report.keys === editingKey ? { ...report, ...values } : report))
      );
      setModalVisible(false);
      setEditingKey(null);
      form.resetFields();
      setLinkPreview("");
      if (values.userKeys && values.userKeys.length > 0) {
        await fetchUserData([...new Set([...selectedUserOptions.map((u) => u.username), ...values.userKeys])]);
      }
    } catch (error) {
      console.error("Error updating report:", error);
    }
  };

  const handleDelete = async (keys) => {
    if (!hasEditPermission) {
      message.error("Bạn không có quyền xóa báo cáo!");
      return;
    }
    await deleteReport(keys);
    message.success("Xóa thành công.");
    setReports((prev) => prev.filter((report) => report.keys !== keys));
    setSelectedReports((prev) => prev.filter((key) => key !== keys));
  };

  const handleDeleteMultiple = async () => {
    if (!hasEditPermission) {
      message.error("Bạn không có quyền xóa hàng loạt báo cáo!");
      return;
    }
    if (selectedReports.length === 0) {
      message.warning("Vui lòng chọn ít nhất một báo cáo để xóa!");
      return;
    }
    await deleteMultipleReports(selectedReports);
    message.success("Đã xóa các mục đã chọn.");
    setReports((prev) => prev.filter((report) => !selectedReports.includes(report.keys)));
    setSelectedReports([]);
    setSelectAll(false);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingKey(null);
    form.resetFields();
    setLinkPreview("");
    setUserOptions([]);
  };

  const handleExcelModalCancel = () => {
    setExcelModalVisible(false);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleSyncModalCancel = () => {
    setSyncModalVisible(false);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleLinkChange = (e) => {
    setLinkPreview(e.target.value);
  };

  const handleUserChange = (value) => {
    setSelectedUserData(Array.isArray(value) ? value : []);
  };

  const handleDeptChange = (value) => {
    setSelectedDepartment(value === undefined ? "" : value);
  };

  const handleShopChange = (value) => {
    setSelectedShop(value === undefined ? "" : value);
  };

  const handleDownload = () => {
    if (!reports.length) {
      message.warning("Không có dữ liệu để tải xuống!");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(reports);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    XLSX.writeFile(workbook, "Report_Data.xlsx");
    message.success("Tải xuống thành công.");
  };

  const handleDataSync = ({ file }) => {
    if (!hasEditPermission) {
      message.error("Bạn không có quyền đồng bộ dữ liệu!");
      return;
    }
    if (!file.name.endsWith(".json")) {
      message.error("Chỉ các tệp JSON (.json) mới được hỗ trợ để đồng bộ hóa dữ liệu!");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setIsUploading(true);
        setUploadProgress(10);
        const jsonData = JSON.parse(e.target.result);
        if (!jsonData.success || !Array.isArray(jsonData.data)) {
          message.error("Định dạng JSON không hợp lệ.");
          return;
        }

        setUploadProgress(30);
        const syncedRecords = [];
        const mismatchedRecords = [];

        const existingReports = await fetchReports(1, 1000);
        const currentReports = existingReports.data || [];

        setUploadProgress(50);
        for (const record of jsonData.data) {
          if (!record.keys || !record.link || !record.bo_phan_rp || !record.title) {
            mismatchedRecords.push({ record, reason: "Thiếu các trường bắt buộc" });
            continue;
          }

          const reportExists = currentReports.some((r) => r.keys === record.keys);
          if (!reportExists) {
            syncedRecords.push({
              keys: record.keys,
              link: record.link,
              bo_phan_rp: record.bo_phan_rp,
              shop: record.shop || [],
              title: record.title,
              userKeys: record.userKeys || [],
            });
          } else {
            mismatchedRecords.push({ record, reason: "Báo cáo đã tồn tại với khóa này" });
          }
        }

        if (syncedRecords.length > 0) {
          setUploadProgress(70);
          await Promise.all(syncedRecords.map((report) => addReport(report)));
          setUploadProgress(90);
          notification.success({
            message: "Thành công",
            description: `Đã đồng bộ thành công ${syncedRecords.length} report.`,
          });
          fetchDataRef.current(1);
        }

        if (mismatchedRecords.length > 0) {
          console.log("Invalid data:", mismatchedRecords);
          message.warning(`${mismatchedRecords.length} hồ sơ không hợp lệ. Vui lòng kiểm tra dữ liệu.`);
        }

        if (syncedRecords.length === 0 && mismatchedRecords.length === 0) {
          message.info("Không có dữ liệu mới để đồng bộ hóa.");
        }
      } catch (error) {
        message.error("Đồng bộ không thành công.");
        console.error(error);
      } finally {
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          setSyncModalVisible(false);
        }, 500);
      }
    };
    reader.readAsText(file);
  };

  const handleExcelUpload = ({ file }) => {
    if (!hasEditPermission) {
      message.error("Bạn không có quyền tải lên Excel!");
      return;
    }
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      message.error("Chỉ các tệp Excel (.xlsx, .xls) mới được hỗ trợ!");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setIsUploading(true);
        setUploadProgress(10);
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        setUploadProgress(30);
        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          message.error("Tệp Excel trống hoặc định dạng không hợp lệ!");
          return;
        }

        const syncedRecords = [];
        const mismatchedRecords = [];

        const existingReports = await fetchReports(1, 1000);
        const currentReports = existingReports.data || [];

        setUploadProgress(50);
        for (const record of jsonData) {
          if (!record.keys || !record.link || !record.bo_phan_rp || !record.title) {
            mismatchedRecords.push({ record, reason: "Thiếu các trường bắt buộc" });
            continue;
          }

          const reportExists = currentReports.some((r) => r.keys === record.keys);
          if (!reportExists) {
            syncedRecords.push({
              keys: record.keys,
              link: record.link,
              bo_phan_rp:
                typeof record.bo_phan_rp === "string" ? record.bo_phan_rp.split(",") : record.bo_phan_rp,
              shop:
                record.shop ? (typeof record.shop === "string" ? record.shop.split(",") : record.shop) : [],
              title: record.title,
              userKeys: record.userKeys
                ? typeof record.userKeys === "string"
                  ? record.userKeys.split(",")
                  : record.userKeys
                : [],
            });
          } else {
            mismatchedRecords.push({ record, reason: "Báo cáo đã tồn tại với khóa này" });
          }
        }

        if (syncedRecords.length > 0) {
          setUploadProgress(70);
          await Promise.all(syncedRecords.map((report) => addReport(report)));
          setUploadProgress(90);
          message.success(`Đã đồng bộ hóa thành công ${syncedRecords.length} báo cáo từ Excel.`);
          fetchDataRef.current(1);
        }

        if (mismatchedRecords.length > 0) {
          console.log("Dữ liệu không hợp lệ:", mismatchedRecords);
          message.warning(`${mismatchedRecords.length} hồ sơ không hợp lệ. Vui lòng kiểm tra dữ liệu.`);
        }

        if (syncedRecords.length === 0 && mismatchedRecords.length === 0) {
          message.info("Không có dữ liệu mới để đồng bộ hóa.");
        }
      } catch (error) {
        message.error("Upload Excel không thành công.");
        console.error(error);
      } finally {
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          setExcelModalVisible(false);
        }, 500);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUserSearch = useCallback(
    async (value) => {
      if (value && value.trim() !== "") {
        try {
          setIsUserLoading(true);
          const response = await search(value, { type: "account" });
          const filteredData = (response.data || []).map((user) => ({
            username: user.keys,
            name: user.name,
            imgAvatar: user.imgAvatar || null,
          }));
          setUserOptions(filteredData);
        } catch (error) {
          console.error("Error searching users:", error);
          setUserOptions([]);
        } finally {
          setIsUserLoading(false);
        }
      } else {
        setUserOptions([]);
      }
    },
    [search]
  );

  const filteredReports = useMemo(() => {
    const validReports = reports.filter((report) => report && typeof report === "object");

    if (user.phanquyen === true) {
      return validReports; // Hiển thị tất cả báo cáo nếu user.phanquyen === true
    }

    if (!hasViewPermission) {
      return validReports.filter((report) => {
        const isAssigned = Array.isArray(report.userKeys) && report.userKeys.includes(user.keys);
        const matchesDepartment = Array.isArray(report.bo_phan_rp) && report.bo_phan_rp.includes(user.bophan);
        const matchesShop = Array.isArray(report.shop) && report.shop.includes(user.chinhanh);
        return isAssigned || matchesDepartment || matchesShop;
      });
    }

    if (!hasEditPermission) {
      return validReports.filter((report) => {
        const isAssigned = Array.isArray(report.userKeys) && report.userKeys.includes(user.keys);
        const matchesDepartment = Array.isArray(report.bo_phan_rp) && report.bo_phan_rp.includes(user.bophan);
        const matchesShop = Array.isArray(report.shop) && report.shop.includes(user.chinhanh);
        return isAssigned || matchesDepartment || matchesShop;
      });
    }

    return validReports.filter((report) => {
      const matchesSearch = report?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const boPhanRp = Array.isArray(report?.bo_phan_rp) ? report.bo_phan_rp : [];
      const shopList = Array.isArray(report?.shop) ? report.shop : [];

      const matchesDepartment =
        !selectedDepartment ||
        boPhanRp.some(
          (dept) => dept && typeof dept === "string" && dept.toLowerCase() === selectedDepartment.toLowerCase()
        );

      const matchesShop =
        !selectedShop ||
        shopList.some(
          (shop) => shop && typeof shop === "string" && shop.toLowerCase() === selectedShop.toLowerCase()
        );

      const matchesUser =
        !selectedUserData.length ||
        (Array.isArray(report?.userKeys) && report.userKeys.some((key) => selectedUserData.includes(key)));

      return matchesSearch && matchesDepartment && matchesShop && matchesUser;
    });
  }, [reports, searchTerm, selectedDepartment, selectedShop, selectedUserData, hasEditPermission, hasViewPermission, user]);

  const showLoadMore = useMemo(() => {
    return hasMore && filteredReports.length >= 12 && reports.length < totalRecords;
  }, [hasMore, filteredReports, reports, totalRecords]);

  const toggleDropdown = (keys) => {
    setDropdownVisibleMap((prev) => ({
      ...prev,
      [keys]: !prev[keys],
    }));
  };

  const menu = (report) => (
    <Menu>
      <Menu.Item key="1" onClick={() => handleEdit(report)} icon={<EditOutlined />}>
        Edit
      </Menu.Item>
      <Menu.Item key="2" danger>
        <Popconfirm
          title={t("Department.input272")}
          onConfirm={() => handleDelete(report.keys)}
          okText="Yes"
          cancelText="No"
        >
          <span>
            <DeleteOutlined /> Delete
          </span>
        </Popconfirm>
      </Menu.Item>
    </Menu>
  );

  const ClickHome = (keys) => {
    navigate(`/auth/docs/views/${keys}`);
  };

  const handleSelectReport = (keys) => {
    setSelectedReports((prev) =>
      prev.includes(keys) ? prev.filter((k) => k !== keys) : [...prev, keys]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedReports([]);
      setSelectAll(false);
    } else {
      const allKeys = filteredReports.map((report) => report.keys);
      setSelectedReports(allKeys);
      setSelectAll(true);
    }
  };

  const handleInfoClick = (e, report) => {
    e.stopPropagation();
    setSelectedReportInfo(report);
    setInfoModalVisible(true);
  };

  const handleInfoModalClose = () => {
    setInfoModalVisible(false);
    setSelectedReportInfo(null);
  };

  const modalStyles = {
    content: {
      borderRadius: '12px',
      padding: '24px',
      backgroundColor: '#f0f2f5',
    },
    header: {
      borderBottom: '1px solid #e8e8e8',
      paddingBottom: '16px',
    }
  };

  const formItemLayout = {
    labelCol: {
      style: {
        fontWeight: 600,
        color: '#333',
        marginBottom: '8px'
      }
    },
    wrapperCol: {
      style: {
        marginBottom: '16px'
      }
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '50px 0', textAlign: 'center' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    );
  }

  return (
    <div className="layout_main_niso">
      <title>NISO CHECKLIST | {t("ListDocs.input9")}</title>
      <Input
        placeholder={t("Department.input273")}
        size="middle"
        style={{ marginBottom: 12 }}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {hasEditPermission && (
        <Space style={{ marginBottom: 12, flexWrap: "wrap", justifyContent: "space-between", width: "100%" }}>
          <Space style={{ flexWrap: "wrap" }}>
            <Button
              onClick={() => setModalVisible(true)}
              type="primary"
              style={{ marginRight: 15 }}
              icon={<PlusCircleOutlined />}
            >
              {t("Department.input274")}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownload}>
              Export Excel
            </Button>
            <Button icon={<UploadOutlined />} onClick={() => setExcelModalVisible(true)}>
              Import Excel
            </Button>
            <Button icon={<CloudSyncOutlined />} onClick={() => setSyncModalVisible(true)} type="primary">
              Data Sync
            </Button>
          </Space>
          <Space style={{ flexWrap: "wrap" }}>
            <Select
              showSearch
              style={{ width: 180, textTransform: "uppercase" }}
              placeholder="Tìm kiếm Khối / Phòng"
              onChange={handleDeptChange}
              value={selectedDepartment || undefined}
              onSearch={(value) => searchDepartments(value)}
              filterOption={false}
              variant='filled'
              allowClear
              loading={isDeptLoading}
              notFoundContent={
                isDeptLoading ? (
                  <Space>
                    <Spin size="small" />
                    <span>Loading...</span>
                  </Space>
                ) : deptOptions.length === 0 ? (
                  "Nhập để tìm kiếm"
                ) : null
              }
            >
              {deptOptions.map((dept) => (
                <Option key={dept} value={dept}>
                  {dept.toUpperCase()}
                </Option>
              ))}
            </Select>
            <Select
              showSearch
              style={{ width: 180, textTransform: "uppercase" }}
              placeholder="Tìm kiếm nhà hàng"
              onChange={handleShopChange}
              value={selectedShop || undefined}
              onSearch={(value) => searchShops(value)}
              filterOption={false}
              allowClear
              variant='filled'
              loading={shopLoading}
              notFoundContent={
                shopLoading ? (
                  <Space>
                    <Spin size="small" />
                    <span>Loading...</span>
                  </Space>
                ) : shopOptions.length === 0 ? (
                  "Nhập để tìm kiếm"
                ) : null
              }
            >
              {shopOptions.map((shop) => (
                <Option key={shop} value={shop}>
                  {shop.toUpperCase()}
                </Option>
              ))}
            </Select>
            <Select
              showSearch
              style={{ width: 220, textTransform: "uppercase" }}
              placeholder="Chọn người dùng"
              value={selectedUserData.length === 0 ? undefined : selectedUserData}
              onChange={handleUserChange}
              onSearch={handleUserSearch}
              filterOption={false}
              allowClear
              variant='filled'
              loading={isUserLoading}
              notFoundContent={
                isUserLoading ? (
                  <Space>
                    <Spin size="small" />
                    <span>Đang tải...</span>
                  </Space>
                ) : userOptions.length === 0 ? (
                  "Nhập để tìm kiếm"
                ) : null
              }
              dropdownStyle={{ zIndex: 1001 }}
            >
              {userOptions.map((user) => {
                const userForCard = {
                  name: user.name || 'Unknown User',
                  username: user.usernamekeys || 'N/A',
                  imgAvatar: user.imgAvatar || null,
                  keys: user.username || 'N/A',
                  email: user.email || null,
                  chucvu: user.chucvu || null,
                  chinhanh: user.chinhanh || 'N/A',
                  bophan: user.bophan || 'N/A',
                  locker: user.locker || false,
                  imgBackground: user.imgBackground || null,
                };

                return (
                  <Option key={user.username} value={user.username}>
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
                          {user.imgAvatar && user.imgAvatar !== "null" ? (
                            <Avatar src={user.imgAvatar} size="small" style={{ marginRight: 8, pointerEvents: 'auto' }} />
                          ) : (
                            <span style={{ marginRight: 8, pointerEvents: 'auto' }}>
                              <Avatars user={{ name: user.name || 'Unknown' }} sizeImg="small" />
                            </span>
                          )}
                        </span>
                      </Tooltip>
                      {user.name}
                    </Space>
                  </Option>
                );
              })}
            </Select>
          </Space>
        </Space>
      )}
      {hasEditPermission && reports.length > 0 && (
        <Space style={{ justifyContent: "space-between", marginBottom: 12, width: "100%" }}>
          <Checkbox checked={selectAll} onChange={handleSelectAll}>
            Chọn tất cả
          </Checkbox>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa các báo cáo đã chọn?"
            onConfirm={handleDeleteMultiple}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger disabled={selectedReports.length === 0}>
              Xóa hàng loạt ({selectedReports.length})
            </Button>
          </Popconfirm>
        </Space>
      )}
      <Row gutter={[16, 16]}>
        {initialLoading ? (
          Array(12)
            .fill()
            .map((_, index) => (
              <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4} key={index}>
                <Card>
                  <Skeleton active />
                </Card>
              </Col>
            ))
        ) : reports.length === 0 ? (
          <Col span={24}>
            <Empty description={t("Department.input277")} />
          </Col>
        ) : filteredReports.length === 0 ? (
          <Col span={24}>
            <Empty description="Không tìm thấy kết quả phù hợp" />
          </Col>
        ) : (
          filteredReports.map((report) => {
            const selectedUsers = Array.isArray(report.userKeys)
              ? selectedUserOptions.filter((user) => report.userKeys.includes(user.username))
              : [];

            return (
              <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4} key={report.keys}>
                <Card
                  cover={<iframe title={`Report: ${report.title}`} src={report.link} className="if-iframe" />}
                  title={
                    hasEditPermission && (
                      <Checkbox
                        checked={selectedReports.includes(report.keys)}
                        onChange={() => handleSelectReport(report.keys)}
                      />
                    )
                  }
                  extra={
                    <Button
                      shape='circle'
                      icon={<InfoOutlined />}
                      size="small"
                      onClick={(e) => handleInfoClick(e, report)}
                    />
                  }
                  hoverable
                  onClick={() => !hasEditPermission && ClickHome(report.keys)}
                  actions={
                    hasEditPermission
                      ? [
                        <Button
                          type="primary"
                          icon={<EyeOutlined />}
                          onClick={() => ClickHome(report.keys)}
                          target="_blank"
                        >
                          View
                        </Button>,
                        <Dropdown
                          overlay={menu(report)}
                          trigger={["click"]}
                          visible={dropdownVisibleMap[report.keys]}
                          onVisibleChange={(visible) => toggleDropdown(report.keys)}
                        >
                          <Button icon={<MoreOutlined />}>{t("Department.input187")}</Button>
                        </Dropdown>,
                      ]
                      : null
                  }
                >
                  <b>{report.title}</b>
                  <div style={{ marginTop: 10, height: 32 }}>
                    {isUserLoading ? (
                      <Spin size="small" />
                    ) : selectedUsers.length > 0 ? (
                      <Avatar.Group
                        maxCount={selectedUsers.length > 1 ? 5 : 0}
                        maxStyle={{ color: "#f56a00", backgroundColor: "#fde3cf" }}
                      >
                        {selectedUsers.map((selectedUser) => {
                          const userForCard = {
                            name: selectedUser.name || 'Unknown User',
                            username: selectedUser.usernamekeys || 'N/A',
                            imgAvatar: selectedUser.imgAvatar || null,
                            keys: selectedUser.username || 'N/A',
                            email: selectedUser.email || null,
                            chucvu: selectedUser.chucvu || null,
                            chinhanh: selectedUser.chinhanh || 'N/A',
                            bophan: selectedUser.bophan || 'N/A',
                            locker: selectedUser.locker || false,
                            imgBackground: selectedUser.imgBackground || null,
                          };

                          return (
                            <Tooltip
                              title={<UserInfoCard user={userForCard} />}
                              placement={window.innerWidth < 768 ? 'top' : 'right'}
                              color="white"
                              overlayStyle={{ maxWidth: 300 }}
                              trigger="hover"
                              mouseEnterDelay={0.1}
                              mouseLeaveDelay={0.2}
                              key={selectedUser.username}
                            >
                              <span className="avatar-container" style={{ display: 'inline-block', cursor: 'pointer' }}>
                                {selectedUser.imgAvatar ? (
                                  <Avatar src={selectedUser.imgAvatar} size="middle" style={{ pointerEvents: 'auto' }} />
                                ) : (
                                  <span style={{ pointerEvents: 'auto' }}>
                                    <Avatars user={{ name: selectedUser.name || 'Unknown' }} sizeImg="middle" />
                                  </span>
                                )}
                              </span>
                            </Tooltip>
                          );
                        })}
                      </Avatar.Group>
                    ) : null}
                  </div>
                </Card>
              </Col>
            );
          })
        )}
      </Row>
      {showLoadMore && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Button onClick={loadMoreData} loading={loadingMore}>
            {loadingMore ? "Đang tải..." : "Tải thêm"}
          </Button>
        </div>
      )}
      <Modal
        title={editingKey ? t("Report.input4") : t("Department.input279")}
        open={modalVisible}
        maskClosable={true}
        onOk={() => {
          form.validateFields().then((values) => {
            editingKey ? handleUpdate(values) : handleAdd(values);
          });
        }}
        onCancel={handleModalCancel}
        bodyStyle={modalStyles.content}
        footer={[
          <Button
            key="back"
            onClick={handleModalCancel}
            style={{ marginRight: 8 }}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={false}
            onClick={() => {
              form.validateFields().then((values) => {
                editingKey ? handleUpdate(values) : handleAdd(values);
              });
            }}
          >
            {editingKey ? 'Cập nhật' : 'Thêm mới'}
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            {...formItemLayout}
            name="title"
            label="Tiêu đề"
            rules={[{
              required: true,
              message: t("Department.input280")
            }]}
          >
            <Input
              placeholder="Nhập tiêu đề"
            />
          </Form.Item>
          <Form.Item
            {...formItemLayout}
            name="userKeys"
            label="Chọn người dùng"
          >
            <Select
              mode="multiple"
              showSearch
              placeholder="Tìm kiếm người dùng"
              onSearch={handleUserSearch}
              onChange={(value) => form.setFieldsValue({ userKeys: value })}
              filterOption={false}
              allowClear
              loading={isUserLoading}
              style={{ width: '100%' }}
              notFoundContent={
                isUserLoading ? (
                  <Space>
                    <Spin
                      indicator={<LoadingOutlined spin />}
                      size="small"
                    />
                    <span>Đang tải...</span>
                  </Space>
                ) : userOptions.length === 0 && !editingKey ? (
                  "Nhập để tìm kiếm người dùng"
                ) : null
              }
              value={form.getFieldValue("userKeys")}
            >
              {(editingKey && selectedUserOptions.length > 0 && userOptions.length === 0
                ? selectedUserOptions
                : userOptions
              ).map((user) => {
                const userForCard = {
                  name: user.name || 'Unknown User',
                  username: user.usernamekeys || 'N/A',
                  imgAvatar: user.imgAvatar || null,
                  keys: user.username || 'N/A',
                  email: user.email || null,
                  chucvu: user.chucvu || null,
                  chinhanh: user.chinhanh || 'N/A',
                  bophan: user.bophan || 'N/A',
                  locker: user.locker || false,
                  imgBackground: user.imgBackground || null,
                };

                return (
                  <Option key={user.username} value={user.username}>
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
                          {user.imgAvatar && user.imgAvatar !== "null" ? (
                            <Avatar
                              src={user.imgAvatar}
                              size="small"
                              style={{
                                marginRight: 8,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                pointerEvents: 'auto',
                              }}
                            />
                          ) : (
                            <span style={{ marginRight: 8, pointerEvents: 'auto' }}>
                              <Avatars
                                user={{ name: user.name || 'Unknown' }}
                                sizeImg="small"
                              />
                            </span>
                          )}
                        </span>
                      </Tooltip>
                      <span style={{ color: '#333' }}>
                        {user.name || user.username}
                      </span>
                    </Space>
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
          <Form.Item
            {...formItemLayout}
            name="bo_phan_rp"
            label='Gán phòng ban'
          >
            <Select
              mode="multiple"
              showSearch
              placeholder="Chọn khối / phòng"
              style={{
                textTransform: "uppercase",
                width: '100%'
              }}
              onSearch={(value) => searchDepartments(value)}
              filterOption={false}
              notFoundContent={
                isDeptLoading ? (
                  <Space>
                    <Spin
                      indicator={<LoadingOutlined spin />}
                      size="small"
                    />
                    <span>Đang tải...</span>
                  </Space>
                ) : null
              }
              tagRender={(props) => (
                <Tag
                  color="cyan"
                  closable={props.closable}
                  bordered={false}
                  onClose={props.onClose}
                  style={{
                    borderRadius: '16px',
                    margin: '2px',
                    padding: '0 8px'
                  }}
                >
                  {props.label}
                </Tag>
              )}
            >
              {deptOptions.map((dept) => (
                <Option key={dept} value={dept}>
                  {dept.toUpperCase()}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            {...formItemLayout}
            name="shop"
            label='Gán nhà hàng'
          >
            <Select
              mode="multiple"
              showSearch
              placeholder="Chọn cửa hàng"
              style={{
                textTransform: "uppercase",
                width: '100%'
              }}
              onSearch={(value) => searchShops(value)}
              filterOption={false}
              notFoundContent={
                shopLoading ? (
                  <Space>
                    <Spin
                      indicator={<LoadingOutlined spin />}
                      size="small"
                    />
                    <span>Đang tải...</span>
                  </Space>
                ) : null
              }
              tagRender={(props) => (
                <Tag
                  color="blue"
                  closable={props.closable}
                  bordered={false}
                  onClose={props.onClose}
                  style={{
                    borderRadius: '16px',
                    margin: '2px',
                    padding: '0 8px'
                  }}
                >
                  {props.label}
                </Tag>
              )}
            >
              {shopOptions.map((shop) => (
                <Option key={shop} value={shop}>
                  {shop.toUpperCase()}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            {...formItemLayout}
            name="link"
            label={t("ListDocs.input22")}
            rules={[{
              required: true,
              message: t("Department.input281")
            }]}
          >
            <Input
              onChange={handleLinkChange}
              placeholder="Nhập đường link"
              style={{
                borderRadius: '6px',
                height: '40px'
              }}
            />
          </Form.Item>
          {linkPreview && (
            <div style={{
              marginTop: 16,
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <iframe
                title={t("Report.input10")}
                src={linkPreview}
                style={{
                  width: '100%',
                  height: '300px',
                  border: '1px solid #e8e8e8'
                }}
              />
            </div>
          )}
        </Form>
      </Modal>
      <Modal
        title="Upload Excel File"
        open={excelModalVisible}
        footer={null}
        onCancel={handleExcelModalCancel}
        maskClosable={true}
      >
        {isUploading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Progress type="circle" percent={uploadProgress} />
            <p style={{ marginTop: 10 }}>Đang tải lên...</p>
          </div>
        ) : (
          <Dragger accept=".xlsx, .xls" showUploadList={false} customRequest={handleExcelUpload}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Click hoặc kéo thả tệp Excel vào đây để tải lên</p>
            <p className="ant-upload-hint">Hỗ trợ định dạng .xlsx và .xls</p>
          </Dragger>
        )}
      </Modal>
      <Modal
        title="Data Sync - Upload JSON File"
        open={syncModalVisible}
        footer={null}
        onCancel={handleSyncModalCancel}
        maskClosable={true}
      >
        {isUploading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Progress type="circle" percent={uploadProgress} />
            <p style={{ marginTop: 10 }}>Đang đồng bộ...</p>
          </div>
        ) : (
          <Dragger accept=".json" showUploadList={false} customRequest={handleDataSync}>
            <p className="ant-upload-drag-icon">
              <CloudSyncOutlined />
            </p>
            <p className="ant-upload-text">Click hoặc kéo thả tệp JSON vào đây để đồng bộ</p>
            <p className="ant-upload-hint">Hỗ trợ định dạng .json</p>
          </Dragger>
        )}
      </Modal>
      <Modal
        title="Thông tin chi tiết"
        open={infoModalVisible}
        onCancel={handleInfoModalClose}
        footer={null}
        width={600}
      >
        {selectedReportInfo && (
          <div>
            <h4 style={{ marginTop: 16, marginBottom: 16 }}>Khối / Phòng:</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Array.isArray(selectedReportInfo.bo_phan_rp) && selectedReportInfo.bo_phan_rp.length > 0 ? (
                selectedReportInfo.bo_phan_rp.map((dept, index) => (
                  <Tag color="blue" key={index} bordered={false}>
                    {dept.toUpperCase()}
                  </Tag>
                ))
              ) : (
                <Tag color="red" bordered={false}>
                  Khối / Phòng trống
                </Tag>
              )}
            </div>
            <h4 style={{ marginTop: 16, marginBottom: 16 }}>Nhà hàng:</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Array.isArray(selectedReportInfo.shop) && selectedReportInfo.shop.length > 0 ? (
                selectedReportInfo.shop.map((shop, index) => (
                  <Tag color="green" key={index}>
                    {shop.toUpperCase()}
                  </Tag>
                ))
              ) : (
                <Tag color="red" bordered={false}>
                  Nhà hàng trống
                </Tag>
              )}
            </div>
            <h4 style={{ marginTop: 16 }}>Người dùng được chỉ định:</h4>
            <div style={{ marginTop: 8 }}>
              {selectedUserOptions.filter((user) => selectedReportInfo.userKeys?.includes(user.username)).length >
                0 ? (
                <Avatar.Group>
                  {selectedUserOptions
                    .filter((user) => selectedReportInfo.userKeys?.includes(user.username))
                    .map((user) => {
                      const userForCard = {
                        name: user.name || 'Unknown User',
                        username: user.usernamekeys || 'N/A',
                        imgAvatar: user.imgAvatar || null,
                        keys: user.username || 'N/A',
                        email: user.email || null,
                        chucvu: user.chucvu || null,
                        chinhanh: user.chinhanh || 'N/A',
                        bophan: user.bophan || 'N/A',
                        locker: user.locker || false,
                        imgBackground: user.imgBackground || null,
                      };

                      return (
                        <Tooltip
                          title={<UserInfoCard user={userForCard} />}
                          placement={window.innerWidth < 768 ? 'top' : 'right'}
                          color="white"
                          overlayStyle={{ maxWidth: 300 }}
                          trigger="hover"
                          mouseEnterDelay={0.1}
                          mouseLeaveDelay={0.2}
                          key={user.username}
                        >
                          <span className="avatar-container" style={{ display: 'inline-block', cursor: 'pointer' }}>
                            {user.imgAvatar ? (
                              <Avatar src={user.imgAvatar} size="middle" style={{ pointerEvents: 'auto' }} />
                            ) : (
                              <span style={{ pointerEvents: 'auto' }}>
                                <Avatars user={{ name: user.name || 'Unknown' }} sizeImg="middle" />
                              </span>
                            )}
                          </span>
                        </Tooltip>
                      );
                    })}
                </Avatar.Group>
              ) : (
                <Tag color="red" bordered={false}>
                  Người dùng trống
                </Tag>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
});

Report.propTypes = {
  user: PropTypes.shape({
    phanquyen: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    bophan: PropTypes.string,
    keys: PropTypes.string,
    chinhanh: PropTypes.string,
  }).isRequired,
  t: PropTypes.func.isRequired,
  hasReportPermission: PropTypes.bool,
};

export default Report;