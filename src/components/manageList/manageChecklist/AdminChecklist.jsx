import React, { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Table, Button, Popconfirm, message, Space, DatePicker, Input, Radio, Select, Drawer, Form, Alert, Tag, Empty, Row, Col, Dropdown, Menu, Switch, notification, Avatar, Tooltip, Upload, Modal, Progress, Spin,
  Card, Tabs,
  Badge, QRCode, Typography
} from "antd";
import UserInfoCard from "../../../hook/UserInfoCard";
import {
  DeleteOutlined, CopyOutlined, UploadOutlined, DownloadOutlined, CloudSyncOutlined, FullscreenOutlined,
  EyeOutlined, ToolFilled, PictureOutlined, ShopOutlined, CheckOutlined, UnlockOutlined, LockOutlined,
  GlobalOutlined, LinkOutlined, SaveOutlined, TeamOutlined, CloseOutlined, StopOutlined, SearchOutlined, ControlOutlined
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import Docs from "../../lamphieu/Docs";
import Edit from "../../Edit/Edit";
import Avatars from "../../../config/design/Avatars";
import useApi from "../../../hook/useApi";
import useSearchDepartment from "../../../hook/SearchDepartment/useSearchDepartment";
import useSearchShop from "../../../hook/SearchShop/useSearchShop";
import ConfigPointsNangCao from "./ConfigPointsNangCao";
import { AlertPoint } from "./AlertPoint";

const { Dragger } = Upload;
const { TabPane } = Tabs;

const AdminChecklist = React.memo(({ user, t }) => {
  const { fetchChecklists, search, deleteChecklist, deleteMultipleChecklists, updateChecklist, searchShop, createChecklist, syncChecklists } = useApi();
  const { loading: departmentLoading, options: departmentOptions, searchDepartments } = useSearchDepartment();
  const { options: chinhanhOptions, loading: chinhanhLoading, searchShops } = useSearchShop(searchShop);
  const { options: chinhanhOptionsDrawer, loading: chinhanhLoadingDrawer, searchShops: searchShopsDrawer } = useSearchShop(searchShop);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [accountSearchLoading, setAccountSearchLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [docDrawerVisible, setDocDrawerVisible] = useState(false);
  const [configPointsNangCaoDrawerVisible, setConfigPointsNangCaoDrawerVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [linkToCopy, setLinkToCopy] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [searchTitle, setSearchTitle] = useState("");
  const [searchCreator, setSearchCreator] = useState("");
  const [searchBophan, setSearchBophan] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [searchChinhanh, setSearchChinhanh] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [form] = Form.useForm();
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [uploadExcelProgress, setUploadExcelProgress] = useState(0);
  const [importExcelModalVisible, setImportExcelModalVisible] = useState(false);
  const [uploadingSync, setUploadingSync] = useState(false);
  const [uploadSyncProgress, setUploadSyncProgress] = useState(0);
  const [importSyncModalVisible, setImportSyncModalVisible] = useState(false);
  const [creatorOptions, setCreatorOptions] = useState([]);
  const [accountOptions, setAccountOptions] = useState([]);
  const [isLaplaiEnabled, setIsLaplaiEnabled] = useState(false);
  const [isPublicOrPrivate, setIsPublicOrPrivate] = useState(false);

  const statusOptions = useMemo(() => ["Tạm khóa", "Đang hoạt động"], []);

  const fetchData = useCallback(async (page = 1, filters = {}, customPageSize = pageSize) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: customPageSize,
        ...(filters.title ? { title: filters.title } : {}),
        ...(filters.creator ? { creator: filters.creator } : {}),
        ...(filters.bophan ? { bophan: filters.bophan } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.chinhanh ? { chinhanh: filters.chinhanh } : {}),
        ...(filters.startDate && filters.endDate
          ? {
            startDate: filters.startDate,
            endDate: filters.endDate,
          }
          : {}),
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
  }, [fetchChecklists, pageSize]);

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
        khach: currentRecord.khach || false,
        yeucauxuly: currentRecord.yeucauxuly || false,
        sqlsend: typeof currentRecord.sqlsend === 'undefined' ? true : currentRecord.sqlsend,
        solanlaplai: currentRecord.solanlaplai || false,
        Dapanview: currentRecord.Dapanview || false,
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

  const handleSearchSelect = useCallback(async (value, type, setOptions) => {
    if (!value || value.trim() === "") {
      setOptions([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    try {
      const response = await search(value);
      const filteredData = (response.data || []).map(user => ({
        keys: user.keys,
        name: user.name,
        username: user.username,
        bophan: user.bophan,
        chinhanh: user.chinhanh,
        chucvu: user.chucvu,
        code_staff: user.code_staff,
        imgAvatar: user.imgAvatar || null
      }));
      setOptions(filteredData);
    } catch (error) {
      console.error(`Error fetching ${type} search results:`, error);
      message.error(`Không thể tìm kiếm ${type}!`);
    } finally {
      setSearchLoading(false);
    }
  }, [search]);

  const handleDepartmentSearch = useCallback(async (value) => {
    try {
      await searchDepartments(value);
    } catch (error) {
      message.error("Không thể tìm kiếm phòng ban!");
    }
  }, [searchDepartments]);

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

  const handleCreatorChange = (value) => {
    setSearchCreator(value || "");
    setCurrentPage(1);
    const filters = {
      title: searchTitle,
      creator: value || "",
      bophan: searchBophan,
      status: searchStatus,
      chinhanh: searchChinhanh,
      startDate: startDate && endDate ? moment(startDate).format("DD-MM-YYYY") : undefined,
      endDate: startDate && endDate ? moment(endDate).format("DD-MM-YYYY") : undefined,
    };
    fetchData(1, filters);
  };

  const handleBophanChange = (value) => {
    setSearchBophan(value || "");
    setCurrentPage(1);
    const filters = {
      title: searchTitle,
      creator: value || "",
      bophan: value || "",
      status: searchStatus,
      chinhanh: searchChinhanh,
      startDate: startDate && endDate ? moment(startDate).format("DD-MM-YYYY") : undefined,
      endDate: startDate && endDate ? moment(endDate).format("DD-MM-YYYY") : undefined,
    };
    fetchData(1, filters);
  };

  const handleStatusChange = (value) => {
    setSearchStatus(value || "");
    setCurrentPage(1);
    const filters = {
      title: searchTitle,
      creator: searchCreator,
      bophan: searchBophan,
      status: value || "",
      chinhanh: searchChinhanh,
      startDate: startDate && endDate ? moment(startDate).format("DD-MM-YYYY") : undefined,
      endDate: startDate && endDate ? moment(endDate).format("DD-MM-YYYY") : undefined,
    };
    fetchData(1, filters);
  };

  const handleChinhanhChange = useCallback((value) => {
    setSearchChinhanh(value || "");
    setCurrentPage(1);
    const filters = {
      title: searchTitle,
      creator: searchCreator,
      bophan: searchBophan,
      status: searchStatus,
      chinhanh: value || "",
      startDate: startDate && endDate ? moment(startDate).format("DD-MM-YYYY") : undefined,
      endDate: startDate && endDate ? moment(endDate).format("DD-MM-YYYY") : undefined,
    };
    fetchData(1, filters);
  }, [fetchData, searchTitle, searchCreator, searchBophan, searchStatus, startDate, endDate]);

  const handleStartDateChange = (date) => {
    const newStartDate = date ? date.startOf("day").toDate() : null;
    setStartDate(newStartDate);
    setCurrentPage(1);
    const filters = {
      title: searchTitle,
      creator: searchCreator,
      bophan: searchBophan,
      status: searchStatus,
      chinhanh: searchChinhanh,
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
      creator: searchCreator,
      bophan: searchBophan,
      status: searchStatus,
      chinhanh: searchChinhanh,
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
      creator: searchCreator,
      bophan: searchBophan,
      status: searchStatus,
      chinhanh: searchChinhanh,
      startDate: startDate && endDate ? moment(startDate).format("DD-MM-YYYY") : undefined,
      endDate: startDate && endDate ? moment(endDate).format("DD-MM-YYYY") : undefined,
    };
    fetchData(1, filters);
  }, [fetchData, searchCreator, searchBophan, searchStatus, searchChinhanh, startDate, endDate]);

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
    window.history.pushState({}, '', `/auth/docs/list/tat-ca-check-list?checklist=${id}`);
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

  const handleSave = useCallback(async (values) => {
    try {
      const updatedValues = {
        ...values,
        everyquyen: values.everyquyen,
        locktitle: values.locktitle,
        solanlaplai: values.solanlaplai,
        dapanview: values.dapanview,
        threeimg: values.threeimg,
        yeucauxuly: values.yeucauxuly,
        sqlsend: values.sqlsend,
        khach: values.khach,
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

  const handleDownload = useCallback(() => {
    if (!data.length) {
      message.warning("Không có dữ liệu để tải xuống!");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Checklists");
    XLSX.writeFile(workbook, "Checklist_Data.xlsx");
    message.success("Tải xuống thành công!");
  }, [data]);

  const handleExcelUpload = useCallback(async ({ file }) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      message.error("Chỉ hỗ trợ các tệp Excel (.xlsx, .xls).");
      return;
    }
    setUploadingExcel(true);
    setUploadExcelProgress(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataExcel = new Uint8Array(e.target.result);
      const workbook = XLSX.read(dataExcel, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      try {
        let uploadedRecords = 0;
        const existingIds = new Set(data.map(item => item.id));
        const processedRecords = [];

        for (const checklist of json) {
          const checklistId = checklist.id || uuidv4();

          if (existingIds.has(checklistId)) {
            console.warn(`Checklist với id "${checklistId}" đã tồn tại, bỏ qua.`);
            continue;
          }

          processedRecords.push({
            ...checklist,
            id: checklistId,
            date: checklist.date || moment().format("DD-MM-YYYY HH:mm:ss"),
          });
          existingIds.add(checklistId);
        }

        if (processedRecords.length === 0) {
          message.warning("Không có checklist nào hợp lệ để tải lên!");
          setUploadingExcel(false);
          setImportExcelModalVisible(false);
          return;
        }
        const totalRecords = processedRecords.length;
        for (let i = 0; i < totalRecords; i++) {
          await createChecklist(processedRecords[i]);
          uploadedRecords += 1;
          const progress = Math.round((uploadedRecords / totalRecords) * 100);
          setUploadExcelProgress(progress);
        }

        message.success(`Tải lên thành công ${uploadedRecords} checklist mới!`);
        fetchData(currentPage);
      } catch (error) {
        console.error("Error uploading Excel:", error);
        message.error("Tải lên thất bại, vui lòng thử lại.");
      } finally {
        setUploadingExcel(false);
        setImportExcelModalVisible(false);
        setUploadExcelProgress(0);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [createChecklist, fetchData, currentPage, data]);

  const handleDataSync = useCallback(async ({ file }) => {
    if (!file.name.endsWith(".json")) {
      message.error("Chỉ hỗ trợ các tệp JSON (.json)");
      return;
    }
    setUploadingSync(true);
    setUploadSyncProgress(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        const checklists = Array.isArray(jsonData.data) ? jsonData.data : (Array.isArray(jsonData) ? jsonData : [jsonData]);
        const existingIds = new Set(data.map(item => item.id));
        const validChecklists = [];

        for (const checklist of checklists) {
          const checklistId = checklist.id || uuidv4();

          if (existingIds.has(checklistId)) {
            console.warn(`Checklist với id "${checklistId}" đã tồn tại, bỏ qua.`);
            continue;
          }

          validChecklists.push({
            ...checklist,
            id: checklistId,
            date: checklist.date || moment().format("DD-MM-YYYY HH:mm:ss"),
          });
          existingIds.add(checklistId);
        }

        if (validChecklists.length === 0) {
          message.warning("Không có checklist nào hợp lệ để đồng bộ!");
          setUploadingSync(false);
          setImportSyncModalVisible(false);
          return;
        }

        setUploadSyncProgress(50);
        await syncChecklists(validChecklists);
        setUploadSyncProgress(100);

        notification.success({
          message: "Thành công",
          description: `Đã đồng bộ thành công ${validChecklists.length} checklist.`,
          showProgress: true,
          pauseOnHover: true,
        });
        fetchData(currentPage);
      } catch (error) {
        console.error("Error syncing data:", error);
        message.error(error.message || "Đồng bộ dữ liệu thất bại, vui lòng thử lại.");
      } finally {
        setUploadingSync(false);
        setImportSyncModalVisible(false);
        setUploadSyncProgress(0);
      }
    };
    reader.readAsText(file);
  }, [syncChecklists, fetchData, currentPage, data]);

  const columns = useMemo(() => [
    { title: t("Input.input7"), key: "stt", render: (_, __, index) => (currentPage - 1) * pageSize + index + 1 },
    {
      title: t("Department.input254"),
      key: "keys",
      render: (_, record) => {
        const matchedUser = record.user;
        if (!matchedUser) return null;

        const userForCard = {
          name: matchedUser.name || 'Unknown User',
          username: matchedUser.username || 'N/A',
          imgAvatar: matchedUser.imgAvatar || null,
          keys: matchedUser.keys || 'N/A',
          email: matchedUser.email || null,
          chucvu: matchedUser.chucvu || null,
          chinhanh: matchedUser.chinhanh || 'N/A',
          bophan: matchedUser.bophan || 'N/A',
          locker: matchedUser.locker || false,
          imgBackground: matchedUser.imgBackground || null,
        };

        return (
          <Tooltip
            title={<UserInfoCard user={userForCard} />}
            placement={window.innerWidth < 768 ? 'top' : 'right'}
            color="white"
            overlayStyle={{ maxWidth: 300 }}
            trigger="hover"
          >
            <span className="avatar-container" style={{ display: 'inline-block', cursor: 'pointer' }}>
              {matchedUser.imgAvatar ? (
                <Avatar
                  src={matchedUser.imgAvatar}
                  size="middle"
                  style={{ pointerEvents: 'auto' }}
                  icon={<Spin size="small" />}
                />
              ) : (
                <span style={{ pointerEvents: 'auto' }}>
                  <Avatars user={{ name: matchedUser.name || 'Unknown' }} sizeImg="middle" />
                </span>
              )}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: t("ListDocs.input38"),
      key: "nguoitaophieu",
      render: (_, record) => {
        const creator = record.user;
        return creator ? (
          <>
            <Tag color="purple" bordered={false}>{creator.name}</Tag>
            {creator.chinhanh === 'Unknown' ? (
              <Tag color="red" bordered={false}>Không nhà hàng</Tag>
            ) : (
              <Tag color="green" style={{ textTransform: "uppercase" }} bordered={false}>{creator.chinhanh}</Tag>
            )}
            <Tag color="blue" style={{ textTransform: "uppercase" }} bordered={false}>{creator.bophan}</Tag>
          </>
        ) : (
          <Tag color="red" bordered={false}>Không nhà hàng</Tag>
        );
      },
    },
    {
      title: t("ListDocs.input39"),
      key: "nguoichinhsua",
      render: (_, record) => {
        const matchedUser = record.editor;
        if (!matchedUser) {
          return <Tag color="red" bordered={false}>{t("ListEdits.input3")}</Tag>;
        }

        const userForCard = {
          name: matchedUser.name || 'Unknown User',
          username: matchedUser.username || 'N/A',
          imgAvatar: matchedUser.imgAvatar || null,
          keys: matchedUser.keys || 'N/A',
          email: matchedUser.email || null,
          chucvu: matchedUser.chucvu || null,
          chinhanh: matchedUser.chinhanh || 'N/A',
          bophan: matchedUser.bophan || 'N/A',
          locker: matchedUser.locker || false,
          imgBackground: matchedUser.imgBackground || null,
        };

        return (
          <Tooltip
            title={<UserInfoCard user={userForCard} />}
            placement={window.innerWidth < 768 ? 'top' : 'right'}
            color="white"
            overlayStyle={{ maxWidth: 300 }}
            trigger="hover"
          >
            <span className="avatar-container" style={{ display: 'inline-block', cursor: 'pointer' }}>
              {matchedUser.imgAvatar ? (
                <Avatar
                  src={matchedUser.imgAvatar}
                  size="middle"
                  style={{ pointerEvents: 'auto' }}
                  icon={<Spin size="small" />}
                />
              ) : (
                <span style={{ pointerEvents: 'auto' }}>
                  <Avatars user={{ name: matchedUser.name || 'Unknown' }} sizeImg="middle" />
                </span>
              )}
              <Tag style={{ marginLeft: 5 }} bordered={false} color='purple'>{matchedUser.name}</Tag>
            </span>
          </Tooltip>
        );
      },
    },
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
      title: 'Cấu hình điểm',
      dataIndex: 'Cauhinhdiem',
      key: 'Cauhinhdiem',
      render: (Cauhinhdiem) => (
        Cauhinhdiem ? (
          <Tag color="green" bordered={false}>Đã cấu hình</Tag>
        ) : (
          <Tag color="red" bordered={false}>Chưa cấu hình</Tag>
        )
      ),
    },
    {
      title: "Quyền truy cập",
      dataIndex: "everyquyen",
      key: "everyquyen",
      render: (everyquyen) => {
        if (everyquyen === 'Công khai' || everyquyen === true) {
          return <Tag color="green" bordered={false}>Công khai</Tag>;
        } else if (everyquyen === 'Nội bộ' || everyquyen === false) {
          return <Tag color="blue" bordered={false}>Nội bộ</Tag>;
        } else if (everyquyen === "Riêng tư") {
          return <Tag color="orange" bordered={false}>Riêng tư</Tag>;
        }
        return <Tag color="red" bordered={false}>Không xác định</Tag>;
      },
    },
    {
      title: t("Department.input244"),
      key: "action",
      render: (_, record) => (
        <Space>
          <Tooltip title="View">
            <Button onClick={() => handleDocDrawerOpen(record.id)} shape='circle' icon={<EyeOutlined />} />
          </Tooltip>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key="3" onClick={() => handleDrawerOpen(record)}>{t("Menu.menu5")}</Menu.Item>
                <Menu.Item key="1" onClick={() => handleEditDrawerOpen(record)}>Edit</Menu.Item>
                <Menu.Item key="4" danger>
                  <Popconfirm title={t("Department.input245")} onConfirm={() => handleDelete(record.id)}>
                    <span><DeleteOutlined /> Delete</span>
                  </Popconfirm>
                </Menu.Item>
              </Menu>
            }
            trigger={["click"]}
          >
            <Tooltip title={t("Department.input187")}>
              <Button icon={<ToolFilled />} shape='circle'></Button>
            </Tooltip>
          </Dropdown>
        </Space>
      ),
    },
  ], [t, currentPage, pageSize, handleDocDrawerOpen, handleDrawerOpen, handleEditDrawerOpen, handleDelete]);

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
      creator: searchCreator,
      bophan: searchBophan,
      status: searchStatus,
      chinhanh: searchChinhanh,
      startDate: startDate && endDate ? moment(startDate).format("DD-MM-YYYY") : undefined,
      endDate: startDate && endDate ? moment(endDate).format("DD-MM-YYYY") : undefined,
    };
    fetchData(1, filters, size);
  }, [fetchData, searchTitle, searchCreator, searchBophan, searchStatus, searchChinhanh, startDate, endDate]);

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
          size='middle'
          title={() =>
            <>
              <div style={{ display: 'flex', gap: 10, flexDirection: window.innerWidth < 768 ? 'column' : 'row', marginBottom: 12 }}>
                <Input
                  placeholder={t("ListDocs.input11")}
                  value={searchTitle}
                  onPressEnter={(e) => handleSearch(e.target.value)}
                  onChange={(e) => {
                    setSearchTitle(e.target.value);
                  }}
                  size='middle'
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
                  style={{ width: '100%' }}
                  placeholder="Người tạo"
                  onChange={handleCreatorChange}
                  onSearch={(value) => handleSearchSelect(value, "creator", setCreatorOptions)}
                  filterOption={false}
                  allowClear
                  disabled={loading}
                  loading={searchLoading}
                  options={creatorOptions.map((creator) => ({
                    label: (
                      <Space>
                        {creator.imgAvatar ? (
                          <Avatar src={creator.imgAvatar} size="small" />
                        ) : (
                          <Avatars user={{ name: creator.name }} sizeImg="small" />
                        )}
                        {creator.name}
                      </Space>
                    ),
                    value: creator.name,
                  }))}
                  notFoundContent={searchLoading ? <Space>
                    <Spin size="small" />
                    <span>Loading...</span>
                  </Space> : null}
                />
                <Select
                  showSearch
                  style={{ width: '100%' }}
                  placeholder="Khối / Phòng"
                  onChange={handleBophanChange}
                  value={searchBophan || undefined}
                  onSearch={handleDepartmentSearch}
                  filterOption={false}
                  allowClear
                  disabled={loading}
                  loading={departmentLoading}
                  defaultActiveFirstOption={false}
                  notFoundContent={departmentLoading ? <Space>
                    <Spin size="small" />
                    <span>Loading...</span>
                  </Space> : null}
                  options={departmentOptions.map((bophan) => ({
                    label: bophan.toUpperCase(),
                    value: bophan
                  }))}
                />
                <Select
                  showSearch
                  style={{ width: '100%' }}
                  placeholder="Nhà hàng"
                  onChange={handleChinhanhChange}
                  value={searchChinhanh || undefined}
                  onSearch={searchShops}
                  filterOption={false}
                  allowClear
                  disabled={loading}
                  loading={chinhanhLoading}
                  defaultActiveFirstOption={false}
                  showArrow={true}
                  notFoundContent={chinhanhLoading ? <Space>
                    <Spin size="small" />
                    <span>Loading...</span>
                  </Space> : null}
                  options={chinhanhOptions.map((chinhanh) => ({
                    label: chinhanh.toUpperCase(),
                    value: chinhanh
                  }))}
                />
                <Select
                  showSearch
                  style={{ width: '100%' }}
                  placeholder="Trạng thái"
                  onChange={handleStatusChange}
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
              </div>
              <Space style={{ justifyContent: 'space-between', width: '100%', flexWrap: 'wrap' }}>
                <Space>
                  <DatePicker
                    placeholder={t("ListDocs.input28")}
                    onChange={handleStartDateChange}
                    format="DD-MM-YYYY"
                    disabled={loading}
                    disabledDate={disabledStartDate}
                  />
                  <DatePicker
                    placeholder={t("ListDocs.input29")}
                    onChange={handleEndDateChange}
                    format="DD-MM-YYYY"
                    disabled={loading}
                    disabledDate={disabledEndDate}
                  />
                </Space>
                <Space style={{ flexWrap: 'wrap' }}>
                  <Button icon={<UploadOutlined />} onClick={() => setImportExcelModalVisible(true)}>Import Excel</Button>
                  <Button icon={<DownloadOutlined />} onClick={handleDownload}>Export Excel</Button>
                  <Button icon={<CloudSyncOutlined />} type="primary" onClick={() => setImportSyncModalVisible(true)}>Data Sync</Button>
                </Space>
              </Space>
            </>}
          dataSource={data}
          rowKey="id"
          loading={loading}
          bordered
          scroll={{ x: true }}
          style={{ width: "100%", whiteSpace: "nowrap" }}
          pagination={{
            current: currentPage,
            total: totalItems,
            pageSize,
            onChange: handlePageChange,
            onShowSizeChange: handlePageSizeChange,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50", "100"],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            size: window.innerWidth < 768 ? "small" : "middle",
          }}
          locale={{ emptyText: <Empty description="Checklist trống !" /> }}
          footer={() => (
            <Popconfirm
              title={t("Department.input249")}
              onConfirm={handleDeleteSelected}
              disabled={!selectedRowKeys.length}
            >
              <Button danger disabled={!selectedRowKeys.length} type="primary">
                {t("Department.input250")} ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          )}
        />
      </Card>
      <Drawer
        title='Cài đặt'
        width="800"
        onClose={handleDrawerClose}
        visible={drawerVisible}
        bodyStyle={{ paddingBottom: 80, backgroundColor: '#f5f7fa' }}
        extra={
          <Button
            loading={loading}
            type="primary"
            onClick={() => form.submit()}
            icon={<SaveOutlined />}
          >
            {t("Department.input253")}
          </Button>
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
                      optionLabelProp="label"
                      notFoundContent={
                        accountSearchLoading ? (
                          <div style={{ textAlign: 'center', padding: '10px' }}>
                            <Spin size="small" />
                          </div>
                        ) : accountOptions.length === 0 ? (
                          <Empty description="Không tìm thấy tài khoản" />
                        ) : null
                      }
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
                        <Tag closable={props.closable} bordered={false} color="blue" onClose={props.onClose} style={{ marginRight: 3 }}>
                          {props.label}
                        </Tag>
                      )}
                    />
                  </Form.Item>
                </Card>

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
                  <Form.Item label="QR Code" >
                    <Space align="center" direction='vertical'>
                      <QRCode
                        value={linkToCopy}
                        size={180}
                        errorLevel="H"
                        iconSize={36}
                        bordered={false}
                      />
                      <Space direction='vertical' align="center">
                        <Typography.Text type="secondary" style={{ fontSize: '13px' }}>
                          Quét mã QR để truy cập
                        </Typography.Text>
                        <Button
                          type="link"
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={() => {
                            const canvas = document.querySelector('canvas');
                            if (canvas) {
                              const url = canvas.toDataURL('image/png');
                              const link = document.createElement('a');
                              link.download = `QR-Checklist-${currentRecord?.title || 'NISO'}.png`;
                              link.href = url;
                              link.click();
                            }
                          }}
                        >
                          Tải xuống
                        </Button>
                      </Space>
                    </Space>
                  </Form.Item>
                </Card>
              </TabPane>
              <TabPane tab="Cài đặt quyền phản hồi" key="2">
                <Card
                  title={<span><TeamOutlined /> Quyền xem phiếu chỉ định</span>}
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
                      optionLabelProp="label"
                      notFoundContent={
                        accountSearchLoading ? (
                          <div style={{ textAlign: 'center', padding: '10px' }}>
                            <Spin size="small" />
                          </div>
                        ) : accountOptions.length === 0 ? (
                          <Empty description="Không tìm thấy tài khoản" />
                        ) : null
                      }
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
                      onClick={() => handleConfigPointsNangCaoDrawerOpen(currentRecord)}
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
            </Tabs>

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
                    name="Dapanview"
                    label="6. Cho phép xem đáp án chính xác"
                    valuePropName="checked"
                    tooltip="Hiển thị đáp án đúng cho người dùng (nếu có)"
                  >
                    <Switch
                      checkedChildren={<CheckOutlined />}
                      unCheckedChildren={<CloseOutlined />}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
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
        bodyStyle={{ padding: 0, paddingTop: 20 }}
        extra={
          <Tooltip title="Chỉnh sửa toàn trang">
            <Button onClick={() => window.open(`/auth/docs/form/edit/${currentRecord?.id}`, "_blank")} icon={<FullscreenOutlined />} />
          </Tooltip>
        }
      >
        {currentRecord && <Edit id={currentRecord.id} user={user} t={t} isInDrawer={true} />}
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
      <Modal
        title="Import Excel"
        open={importExcelModalVisible}
        onCancel={() => setImportExcelModalVisible(false)}
        footer={null}
        closable={!uploadingExcel}
      >
        {uploadingExcel ? (
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
            <Progress type="circle" percent={uploadExcelProgress} />
            <Alert
              message="Vui lòng chờ cho đến khi quá trình tải lên hoàn tất."
              type="warning"
              showIcon
              banner
            />
          </div>
        ) : (
          <Dragger accept=".xlsx, .xls" showUploadList={false} customRequest={handleExcelUpload}>
            <p className="ant-upload-drag-icon"><UploadOutlined /></p>
            <p className="ant-upload-text">Nhấp hoặc kéo thả tệp Excel vào đây để tải lên</p>
            <p className="ant-upload-hint">Chỉ hỗ trợ định dạng .xlsx và .xls</p>
          </Dragger>
        )}
      </Modal>
      <Modal
        title="Data Sync"
        open={importSyncModalVisible}
        onCancel={() => setImportSyncModalVisible(false)}
        footer={null}
        closable={!uploadingSync}
      >
        {uploadingSync ? (
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
            <Progress type="circle" percent={uploadSyncProgress} />
            <Alert
              message="Vui lòng chờ cho đến khi quá trình tải lên hoàn tất."
              type="warning"
              showIcon
              banner
            />
          </div>
        ) : (
          <Dragger accept=".json" showUploadList={false} customRequest={handleDataSync}>
            <p className="ant-upload-drag-icon"><CloudSyncOutlined /></p>
            <p className="ant-upload-text">Nhấp hoặc kéo thả tệp JSON vào đây để đồng bộ</p>
            <p className="ant-upload-hint">Chỉ hỗ trợ định dạng .json</p>
          </Dragger>
        )}
      </Modal>
    </div>
  );
});

AdminChecklist.propTypes = {
  user: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
};

AdminChecklist.defaultProps = {
  user: {},
  t: (key) => key,
};

export default AdminChecklist;